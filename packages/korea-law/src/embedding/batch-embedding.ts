#!/usr/bin/env npx ts-node
/**
 * korea-law: Batch Embedding Script
 *
 * 기존 조문 데이터에 임베딩을 생성하여 Supabase에 저장
 *
 * 사용법:
 *   npx ts-node src/embedding/batch-embedding.ts
 *   npm run embed:batch
 *
 * 환경변수:
 *   UPSTAGE_API_KEY - Upstage API 키
 *   SUPABASE_URL - Supabase URL
 *   SUPABASE_SERVICE_KEY - Supabase Service Role Key
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  initUpstageClient,
  createBatchEmbeddings,
  preprocessArticleText,
  EmbeddingModel,
} from './upstage-embedding';

// 환경변수
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY || '';

// 설정
const BATCH_SIZE = 50;  // Upstage API 배치 크기
const DB_BATCH_SIZE = 100;  // DB 업데이트 배치 크기

interface ArticleRow {
  id: number;
  law_id: number;
  article_no: string;
  article_title: string | null;
  content: string;
  law_name: string;
}

async function main() {
  console.log('🚀 Batch Embedding Script Started');
  console.log('================================\n');

  // 1. 클라이언트 초기화
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  }

  if (!UPSTAGE_API_KEY) {
    throw new Error('UPSTAGE_API_KEY is required');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  initUpstageClient(UPSTAGE_API_KEY);

  console.log('✅ Clients initialized\n');

  // 2. 임베딩이 없는 조문 조회
  console.log('📊 Fetching articles without embeddings...');

  const { data: articles, error, count } = await supabase
    .from('articles')
    .select(`
      id,
      law_id,
      article_no,
      article_title,
      content,
      laws!inner(law_name)
    `, { count: 'exact' })
    .is('embedding', null)
    .is('effective_until', null)
    .limit(1000);  // 한 번에 최대 1000개

  if (error) {
    console.error('❌ Error fetching articles:', error);
    throw error;
  }

  if (!articles || articles.length === 0) {
    console.log('✅ No articles need embedding. All done!');
    return;
  }

  console.log(`📝 Found ${articles.length} articles without embeddings`);
  if (count && count > 1000) {
    console.log(`   (Total ${count} remaining, processing first 1000)`);
  }
  console.log('');

  // 3. 텍스트 전처리
  console.log('🔄 Preprocessing texts...');

  const processedArticles: { id: number; text: string }[] = articles.map((article: any) => ({
    id: article.id,
    text: preprocessArticleText(
      article.laws.law_name,
      article.article_no,
      article.article_title,
      article.content
    ),
  }));

  const texts = processedArticles.map(a => a.text);

  // 4. 임베딩 생성
  console.log(`\n🧠 Generating embeddings for ${texts.length} articles...`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Estimated batches: ${Math.ceil(texts.length / BATCH_SIZE)}`);
  console.log('');

  const startTime = Date.now();

  const result = await createBatchEmbeddings(texts, 'embedding-passage', BATCH_SIZE);

  const elapsedTime = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Embeddings generated in ${elapsedTime.toFixed(1)}s`);
  console.log(`   Total tokens: ${result.totalTokens.toLocaleString()}`);
  console.log(`   Model: ${result.model}`);

  // 5. Supabase에 저장
  console.log(`\n💾 Saving embeddings to Supabase...`);

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < processedArticles.length; i += DB_BATCH_SIZE) {
    const batch = processedArticles.slice(i, i + DB_BATCH_SIZE);

    for (let j = 0; j < batch.length; j++) {
      const article = batch[j];
      const embedding = result.embeddings[i + j];

      const { error: updateError } = await supabase
        .from('articles')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', article.id);

      if (updateError) {
        console.error(`❌ Error updating article ${article.id}:`, updateError.message);
        errors++;
      } else {
        updated++;
      }
    }

    // 진행률 표시
    const progress = Math.min(100, Math.round(((i + batch.length) / processedArticles.length) * 100));
    process.stdout.write(`\r   Progress: ${progress}% (${updated} updated, ${errors} errors)`);
  }

  console.log('\n');

  // 6. 결과 요약
  console.log('================================');
  console.log('📊 Summary:');
  console.log(`   Articles processed: ${processedArticles.length}`);
  console.log(`   Successfully updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total tokens used: ${result.totalTokens.toLocaleString()}`);
  console.log(`   Time elapsed: ${elapsedTime.toFixed(1)}s`);

  if (count && count > 1000) {
    console.log(`\n⚠️  ${count - 1000} articles remaining. Run script again to continue.`);
  }

  console.log('\n✅ Batch embedding completed!');
}

// 실행
main().catch(console.error);
