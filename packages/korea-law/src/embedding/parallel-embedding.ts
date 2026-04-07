#!/usr/bin/env npx ts-node
/**
 * korea-law: Parallel Batch Embedding Script
 *
 * 병렬로 임베딩 생성 (Rate Limit 고려)
 * Upstage: 100 RPM, 300K TPM
 *
 * 사용법:
 *   pnpm embed:parallel
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  initUpstageClient,
  createPassageEmbedding,
  preprocessArticleText,
} from './upstage-embedding';

// 환경변수
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY || '';

// 설정 (Rate Limit: 100 RPM 고려)
const CONCURRENCY = 2;        // 동시 처리 수 (낮춤)
const TOTAL_LIMIT = 3000;     // 한 번에 처리할 총 개수
const RATE_LIMIT_RPM = 50;    // 분당 요청 수 (보수적)

interface ArticleRow {
  id: number;
  article_no: string;
  article_title: string | null;
  content: string;
  laws: { law_name: string } | { law_name: string }[];
}

// 세마포어 구현 (동시성 제어)
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    await new Promise<void>(resolve => this.waiting.push(resolve));
    this.permits--;
  }

  release(): void {
    this.permits++;
    const next = this.waiting.shift();
    if (next) next();
  }
}

// Rate Limiter
class RateLimiter {
  private lastCall = 0;
  private minInterval: number;

  constructor(callsPerMinute: number) {
    this.minInterval = 60000 / callsPerMinute;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minInterval) {
      await sleep(this.minInterval - elapsed);
    }
    this.lastCall = Date.now();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processArticle(
  article: ArticleRow,
  supabase: any,
  rateLimiter: RateLimiter,
  semaphore: Semaphore,
  maxRetries: number = 3
): Promise<{ success: boolean; id: number; tokens?: number }> {
  await semaphore.acquire();

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await rateLimiter.wait();

      const lawName = Array.isArray(article.laws)
        ? article.laws[0]?.law_name
        : article.laws.law_name;

      const text = preprocessArticleText(
        lawName || '',
        article.article_no,
        article.article_title,
        article.content
      );

      const embedding = await createPassageEmbedding(text);

      const { error } = await supabase
        .from('articles')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', article.id);

      if (error) {
        console.error(`❌ Article ${article.id}: ${error.message}`);
        semaphore.release();
        return { success: false, id: article.id };
      }

      semaphore.release();
      return { success: true, id: article.id };
    } catch (err: any) {
      lastError = err;

      // Rate Limit 에러면 대기 후 재시도
      if (err.message?.includes('429') || err.status === 429) {
        const waitTime = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
        await sleep(waitTime);
        continue;
      }

      // 다른 에러는 바로 실패
      break;
    }
  }

  console.error(`❌ Article ${article.id}: ${lastError?.message || 'Unknown error'}`);
  semaphore.release();
  return { success: false, id: article.id };
}

async function main() {
  console.log('🚀 Parallel Embedding Script Started');
  console.log(`   Concurrency: ${CONCURRENCY}`);
  console.log(`   Batch size: ${TOTAL_LIMIT}`);
  console.log('================================\n');

  // 클라이언트 초기화
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !UPSTAGE_API_KEY) {
    throw new Error('Missing required environment variables');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  initUpstageClient(UPSTAGE_API_KEY);

  // Rate Limiter & Semaphore
  const rateLimiter = new RateLimiter(RATE_LIMIT_RPM);
  const semaphore = new Semaphore(CONCURRENCY);

  // 임베딩 없는 조문 조회
  console.log('📊 Fetching articles...');

  const { data: articles, error, count } = await supabase
    .from('articles')
    .select(`
      id,
      article_no,
      article_title,
      content,
      laws!inner(law_name)
    `, { count: 'exact' })
    .is('embedding', null)
    .is('effective_until', null)
    .limit(TOTAL_LIMIT);

  if (error || !articles) {
    console.error('❌ Error fetching articles:', error);
    return;
  }

  if (articles.length === 0) {
    console.log('✅ All articles have embeddings!');
    return;
  }

  console.log(`📝 Processing ${articles.length} articles (${count} total remaining)`);
  console.log('');

  const startTime = Date.now();
  let completed = 0;
  let success = 0;
  let failed = 0;

  // 진행률 표시 인터벌
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = completed / elapsed * 60;
    const eta = ((articles.length - completed) / rate * 60).toFixed(0);
    process.stdout.write(
      `\r⏳ Progress: ${completed}/${articles.length} (${(completed/articles.length*100).toFixed(1)}%) | ` +
      `✅ ${success} ❌ ${failed} | ` +
      `Speed: ${rate.toFixed(1)}/min | ETA: ${eta}s   `
    );
  }, 1000);

  // 병렬 처리
  const promises = articles.map(async (article: ArticleRow) => {
    const result = await processArticle(article, supabase, rateLimiter, semaphore);
    completed++;
    if (result.success) success++;
    else failed++;
    return result;
  });

  await Promise.all(promises);

  clearInterval(progressInterval);

  const elapsed = (Date.now() - startTime) / 1000;

  console.log('\n\n================================');
  console.log('📊 Summary:');
  console.log(`   Total processed: ${completed}`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Time: ${elapsed.toFixed(1)}s`);
  console.log(`   Speed: ${(completed / elapsed * 60).toFixed(1)} articles/min`);

  if (count && count > TOTAL_LIMIT) {
    console.log(`\n⚠️  ${count - TOTAL_LIMIT} articles remaining. Run again to continue.`);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
