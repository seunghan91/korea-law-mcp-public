#!/usr/bin/env npx ts-node
/**
 * korea-law: Safe Batch Embedding Script
 *
 * Rate Limit을 절대 초과하지 않는 안전한 임베딩 스크립트
 * Upstage Free Tier: 100 RPM → 30 RPM으로 안전하게 설정
 *
 * 사용법:
 *   pnpm embed:safe
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

// 설정 (매우 보수적)
const BATCH_SIZE = 500;           // 한 번에 가져올 개수
const DELAY_MS = 2000;            // 요청 간 간격 (2초 = 30 RPM)
const MAX_RETRIES = 5;            // 재시도 횟수
const INITIAL_BACKOFF_MS = 10000; // 초기 백오프 (10초)

interface ArticleRow {
  id: number;
  article_no: string;
  article_title: string | null;
  content: string;
  laws: { law_name: string } | { law_name: string }[];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processArticleWithRetry(
  article: ArticleRow,
  supabase: any,
  maxRetries: number = MAX_RETRIES
): Promise<{ success: boolean; id: number; retries: number }> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const lawName = Array.isArray(article.laws)
        ? article.laws[0]?.law_name
        : article.laws?.law_name;

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
        console.error(`❌ DB Error Article ${article.id}: ${error.message}`);
        return { success: false, id: article.id, retries: attempt };
      }

      return { success: true, id: article.id, retries: attempt };
    } catch (err: any) {
      lastError = err;

      // Rate Limit 에러면 긴 대기 후 재시도
      if (err.message?.includes('429') || err.status === 429) {
        const waitTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt); // 10s, 20s, 40s, 80s, 160s
        console.log(`⏳ Rate limit hit (article ${article.id}), waiting ${waitTime/1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }

      // 다른 에러는 짧게 재시도
      const waitTime = 2000 * Math.pow(2, attempt);
      console.log(`⚠️ Error on article ${article.id}: ${err.message}, retrying in ${waitTime/1000}s...`);
      await sleep(waitTime);
    }
  }

  console.error(`❌ Failed Article ${article.id} after ${maxRetries} retries: ${lastError?.message}`);
  return { success: false, id: article.id, retries: maxRetries };
}

async function main() {
  console.log('🚀 Safe Embedding Script Started');
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Delay between requests: ${DELAY_MS}ms (${60000/DELAY_MS} RPM)`);
  console.log(`   Max retries: ${MAX_RETRIES}`);
  console.log('================================\n');

  // 클라이언트 초기화
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !UPSTAGE_API_KEY) {
    throw new Error('Missing required environment variables');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  initUpstageClient(UPSTAGE_API_KEY);

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
    .limit(BATCH_SIZE);

  if (error || !articles) {
    console.error('❌ Error fetching articles:', error);
    return;
  }

  if (articles.length === 0) {
    console.log('✅ All articles have embeddings!');
    return;
  }

  console.log(`📝 Processing ${articles.length} articles (${count?.toLocaleString()} total remaining)`);
  console.log(`⏱️  Estimated time: ${Math.ceil(articles.length * DELAY_MS / 60000)} minutes\n`);

  const startTime = Date.now();
  let completed = 0;
  let success = 0;
  let failed = 0;
  let totalRetries = 0;

  // 순차 처리 (한 번에 하나씩)
  for (const article of articles as ArticleRow[]) {
    const result = await processArticleWithRetry(article, supabase);
    completed++;
    totalRetries += result.retries;

    if (result.success) {
      success++;
      process.stdout.write(`\r✅ Progress: ${completed}/${articles.length} | ✅ ${success} ❌ ${failed} | Article: ${article.id}       `);
    } else {
      failed++;
      process.stdout.write(`\r❌ Progress: ${completed}/${articles.length} | ✅ ${success} ❌ ${failed} | Article: ${article.id}       `);
    }

    // 다음 요청 전 대기 (성공한 경우에만)
    if (result.success && completed < articles.length) {
      await sleep(DELAY_MS);
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;

  console.log('\n\n================================');
  console.log('📊 Summary:');
  console.log(`   Total processed: ${completed}`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total retries: ${totalRetries}`);
  console.log(`   Time: ${elapsed.toFixed(1)}s`);
  console.log(`   Speed: ${(success / elapsed * 60).toFixed(1)} articles/min`);

  if (count && count > BATCH_SIZE) {
    console.log(`\n⚠️  ${(count - BATCH_SIZE).toLocaleString()} articles remaining. Run again to continue.`);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
