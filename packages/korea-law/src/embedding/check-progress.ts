#!/usr/bin/env npx ts-node
/**
 * Check embedding progress
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkEmbeddingProgress() {
  // 임베딩 있는 조문 수
  const { count: withEmbedding } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  // 임베딩 없는 조문 수 (현행)
  const { count: withoutEmbedding } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
    .is('effective_until', null);

  // 총 조문 수
  const { count: total } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true });

  const with_emb = withEmbedding || 0;
  const without_emb = withoutEmbedding || 0;
  const total_count = total || 1;

  console.log('📊 Embedding Progress:');
  console.log(`   ✅ With embedding: ${with_emb.toLocaleString()}`);
  console.log(`   ⏳ Without embedding (active): ${without_emb.toLocaleString()}`);
  console.log(`   📦 Total articles: ${total_count.toLocaleString()}`);
  console.log(`   📈 Progress: ${(with_emb / total_count * 100).toFixed(2)}%`);
}

checkEmbeddingProgress();
