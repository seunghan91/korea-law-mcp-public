/**
 * Supabase 동기화 스크립트
 * CSV 데이터를 Supabase에 배치로 업로드
 * 
 * 사용법: npx ts-node scripts/sync-to-supabase.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface Law {
  id: number;
  law_mst_id: string;
  law_name: string;
  law_name_eng?: string;
  law_name_normalized: string;
  promulgation_date?: string;
  enforcement_date?: string;
  source_url?: string;
  checksum?: string;
}

interface Article {
  id: number;
  law_id: number;
  article_no: string;
  article_title: string;
  content: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function escapeSQL(val: string | null | undefined): string {
  if (val === null || val === undefined || val === '') return 'NULL';
  return "'" + val.replace(/'/g, "''") + "'";
}

function parseLawsCSV(filePath: string): Law[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const laws: Law[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= 12) {
      laws.push({
        id: parseInt(cols[0]),
        law_mst_id: cols[1],
        law_name: cols[2],
        law_name_eng: cols[3] || undefined,
        promulgation_date: cols[4] || undefined,
        enforcement_date: cols[5] || undefined,
        source_url: cols[9] || undefined,
        checksum: cols[10] || undefined,
        law_name_normalized: cols[11]
      });
    }
  }
  return laws;
}

function parseArticlesCSV(filePath: string): Article[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const articles: Article[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= 5) {
      articles.push({
        id: parseInt(cols[0]),
        law_id: parseInt(cols[1]),
        article_no: cols[2],
        article_title: cols[3],
        content: cols[4]
      });
    }
  }
  return articles;
}

function generateLawsSQL(laws: Law[], batchSize: number = 20): string[] {
  const batches: string[] = [];
  
  for (let i = 0; i < laws.length; i += batchSize) {
    const batch = laws.slice(i, i + batchSize);
    const values = batch.map(law => 
      `(${law.id}, ${escapeSQL(law.law_mst_id)}, ${escapeSQL(law.law_name)}, ${escapeSQL(law.law_name_eng || null)}, ${escapeSQL(law.law_name_normalized)}, ${law.promulgation_date ? escapeSQL(law.promulgation_date) : 'NULL'}, ${law.enforcement_date ? escapeSQL(law.enforcement_date) : 'NULL'}, ${escapeSQL(law.source_url || null)}, ${escapeSQL(law.checksum || null)}, NOW(), NOW())`
    ).join(',\n');
    
    const sql = `INSERT INTO laws (id, law_mst_id, law_name, law_name_eng, law_name_normalized, promulgation_date, enforcement_date, source_url, checksum, created_at, updated_at) VALUES\n${values}\nON CONFLICT (id) DO UPDATE SET\n  law_name = EXCLUDED.law_name,\n  law_name_normalized = EXCLUDED.law_name_normalized,\n  updated_at = NOW();`;
    
    batches.push(sql);
  }
  
  return batches;
}

function generateArticlesSQL(articles: Article[], batchSize: number = 20): string[] {
  const batches: string[] = [];
  
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const values = batch.map(article => {
      // content를 10000자로 제한
      const content = article.content?.substring(0, 10000) || '';
      return `(${article.id}, ${article.law_id}, ${escapeSQL(article.article_no)}, ${escapeSQL(article.article_title)}, ${escapeSQL(content)}, NOW(), NOW())`;
    }).join(',\n');
    
    const sql = `INSERT INTO articles (id, law_id, article_no, article_title, content, created_at, updated_at) VALUES\n${values}\nON CONFLICT (id) DO UPDATE SET\n  article_title = EXCLUDED.article_title,\n  content = EXCLUDED.content,\n  updated_at = NOW();`;
    
    batches.push(sql);
  }
  
  return batches;
}

async function main() {
  const lawsPath = '/tmp/laws.csv';
  const articlesPath = '/tmp/articles.csv';
  
  console.log('📂 CSV 파일 읽기...');
  
  if (!fs.existsSync(lawsPath)) {
    console.error(`❌ Laws CSV 파일이 없습니다: ${lawsPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(articlesPath)) {
    console.error(`❌ Articles CSV 파일이 없습니다: ${articlesPath}`);
    process.exit(1);
  }
  
  const laws = parseLawsCSV(lawsPath);
  const articles = parseArticlesCSV(articlesPath);
  
  console.log(`✅ Laws: ${laws.length}개`);
  console.log(`✅ Articles: ${articles.length}개`);
  
  console.log('\n📝 SQL 배치 생성...');
  
  const lawsBatches = generateLawsSQL(laws, 20);
  const articlesBatches = generateArticlesSQL(articles, 20);
  
  console.log(`✅ Laws 배치: ${lawsBatches.length}개`);
  console.log(`✅ Articles 배치: ${articlesBatches.length}개`);
  
  // SQL 파일로 저장
  const outputDir = '/tmp/supabase-sync';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Laws SQL 저장
  lawsBatches.forEach((sql, idx) => {
    fs.writeFileSync(path.join(outputDir, `laws_batch_${idx.toString().padStart(3, '0')}.sql`), sql);
  });
  
  // Articles SQL 저장
  articlesBatches.forEach((sql, idx) => {
    fs.writeFileSync(path.join(outputDir, `articles_batch_${idx.toString().padStart(3, '0')}.sql`), sql);
  });
  
  // 전체 통합 SQL 파일 생성
  const allSQL = [
    '-- Supabase 동기화 SQL',
    '-- 생성일: ' + new Date().toISOString(),
    '',
    '-- Laws 데이터',
    ...lawsBatches,
    '',
    '-- Articles 데이터', 
    ...articlesBatches,
    '',
    "-- 시퀀스 업데이트",
    "SELECT setval('laws_id_seq', (SELECT MAX(id) FROM laws));",
    "SELECT setval('articles_id_seq', (SELECT MAX(id) FROM articles));"
  ].join('\n\n');
  
  fs.writeFileSync(path.join(outputDir, 'full_sync.sql'), allSQL);
  
  console.log(`\n📁 SQL 파일 저장 완료: ${outputDir}`);
  console.log(`   - laws_batch_*.sql (${lawsBatches.length}개)`);
  console.log(`   - articles_batch_*.sql (${articlesBatches.length}개)`);
  console.log(`   - full_sync.sql (전체 통합)`);
  
  console.log('\n🎯 다음 단계:');
  console.log('   MCP를 통해 각 배치 SQL을 순차적으로 실행하거나,');
  console.log('   Supabase SQL Editor에서 full_sync.sql을 실행하세요.');
}

main().catch(console.error);
