/**
 * SQLite → PostgreSQL (Supabase / Render) 동기화 스크립트
 *
 * 사용법:
 *   npx ts-node scripts/sync-sqlite-to-postgres.ts --supabase
 *   npx ts-node scripts/sync-sqlite-to-postgres.ts --render
 *   npx ts-node scripts/sync-sqlite-to-postgres.ts --all
 */

import Database from 'better-sqlite3';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import PQueue from 'p-queue';

// ============================================
// 설정
// ============================================

const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../data/korea-law.db');

// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rmqsukldnmileszpndgh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Render PostgreSQL 설정
const RENDER_PG_HOST = process.env.RENDER_PG_HOST || 'dpg-d5131q5actks73f0aa1g-a.singapore-postgres.render.com';
const RENDER_PG_PORT = process.env.RENDER_PG_PORT || '5432';
const RENDER_PG_DATABASE = process.env.RENDER_PG_DATABASE || 'legal_audit_db';
const RENDER_PG_USER = process.env.RENDER_PG_USER || 'legal_audit_db_user';
const RENDER_PG_PASSWORD = process.env.RENDER_PG_PASSWORD || '';

// ============================================
// 타입 정의
// ============================================

interface Law {
  id: number;
  law_mst_id: string;
  law_name: string;
  law_name_eng?: string;
  promulgation_date?: string;
  enforcement_date?: string;
  law_type?: string;
  ministry?: string;
  status?: string;
  source_url?: string;
  last_synced_at?: string;
  checksum?: string;
  law_name_normalized?: string;
  created_at?: string;
  updated_at?: string;
}

interface Article {
  id: number;
  law_id: number;
  article_no: string;
  article_no_normalized?: string;
  article_title?: string;
  content: string;
  paragraph_count?: number;
  content_hash?: string;
  is_definition?: boolean;
  effective_from?: string;
  effective_until?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminRule {
  id: number;
  rule_serial_number: string;
  rule_name: string;
  rule_type?: string;
  ministry?: string;
  issuance_date?: string;
  enforcement_date?: string;
  content?: string;
  status?: string;
  last_synced_at?: string;
}

interface LocalOrdinance {
  id: number;
  ordinance_serial_number: string;
  ordinance_name: string;
  local_government_code?: string;
  local_government_name?: string;
  promulgation_date?: string;
  enforcement_date?: string;
  content?: string;
  status?: string;
  last_synced_at?: string;
}

// ============================================
// SQLite 데이터 읽기
// ============================================

function readSQLiteData() {
  const db = new Database(SQLITE_DB_PATH);

  console.log('📂 SQLite 데이터 읽기 중...');

  const laws: Law[] = db.prepare('SELECT * FROM Laws').all() as Law[];
  const articles: Article[] = db.prepare('SELECT * FROM Articles').all() as Article[];

  let adminRules: AdminRule[] = [];
  let localOrdinances: LocalOrdinance[] = [];

  try {
    adminRules = db.prepare('SELECT * FROM Admin_Rules').all() as AdminRule[];
  } catch (e) {
    console.log('  ⚠️ Admin_Rules 테이블 없음');
  }

  try {
    localOrdinances = db.prepare('SELECT * FROM Local_Ordinances').all() as LocalOrdinance[];
  } catch (e) {
    console.log('  ⚠️ Local_Ordinances 테이블 없음');
  }

  db.close();

  console.log(`  📊 Laws: ${laws.length}건`);
  console.log(`  📊 Articles: ${articles.length}건`);
  console.log(`  📊 Admin_Rules: ${adminRules.length}건`);
  console.log(`  📊 Local_Ordinances: ${localOrdinances.length}건`);

  return { laws, articles, adminRules, localOrdinances };
}

// ============================================
// Supabase 동기화
// ============================================

async function syncToSupabase(data: ReturnType<typeof readSQLiteData>) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('\n🚀 Supabase 동기화 시작...');

  const queue = new PQueue({ concurrency: 3 });
  const BATCH_SIZE = 100;

  // 1. Laws 동기화
  console.log(`\n📜 Laws 동기화 (${data.laws.length}건)...`);
  let lawsSuccess = 0;
  let lawsError = 0;

  for (let i = 0; i < data.laws.length; i += BATCH_SIZE) {
    const batch = data.laws.slice(i, i + BATCH_SIZE).map(law => ({
      id: law.id,
      law_mst_id: law.law_mst_id,
      law_name: law.law_name,
      law_name_eng: law.law_name_eng || null,
      law_name_normalized: law.law_name_normalized || law.law_name.replace(/\s+/g, '').toLowerCase(),
      promulgation_date: law.promulgation_date || null,
      enforcement_date: law.enforcement_date || null,
      law_type: law.law_type || null,
      ministry: law.ministry || null,
      status: law.status || 'ACTIVE',
      source_url: law.source_url || null,
      checksum: law.checksum || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    queue.add(async () => {
      const { error } = await supabase
        .from('laws')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ Laws batch ${i}-${i + batch.length} 실패:`, error.message);
        lawsError += batch.length;
      } else {
        lawsSuccess += batch.length;
      }
    });
  }

  await queue.onIdle();
  console.log(`  ✅ Laws: ${lawsSuccess}건 성공, ${lawsError}건 실패`);

  // 2. Articles 동기화
  console.log(`\n📄 Articles 동기화 (${data.articles.length}건)...`);
  let articlesSuccess = 0;
  let articlesError = 0;

  for (let i = 0; i < data.articles.length; i += BATCH_SIZE) {
    const batch = data.articles.slice(i, i + BATCH_SIZE).map(article => ({
      id: article.id,
      law_id: article.law_id,
      article_no: article.article_no,
      article_no_normalized: article.article_no_normalized || null,
      article_title: article.article_title || null,
      content: article.content?.substring(0, 50000) || '', // 50KB 제한
      paragraph_count: article.paragraph_count || 1,
      content_hash: article.content_hash || null,
      is_definition: article.is_definition || false,
      effective_from: article.effective_from || null,
      effective_until: article.effective_until || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    queue.add(async () => {
      const { error } = await supabase
        .from('articles')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ Articles batch ${i}-${i + batch.length} 실패:`, error.message);
        articlesError += batch.length;
      } else {
        articlesSuccess += batch.length;
        if (articlesSuccess % 10000 === 0) {
          console.log(`  ⏳ Articles: ${articlesSuccess}건 완료...`);
        }
      }
    });
  }

  await queue.onIdle();
  console.log(`  ✅ Articles: ${articlesSuccess}건 성공, ${articlesError}건 실패`);

  // 3. Admin_Rules 동기화 (테이블 있는 경우)
  if (data.adminRules.length > 0) {
    console.log(`\n📋 Admin_Rules 동기화 (${data.adminRules.length}건)...`);
    let rulesSuccess = 0;
    let rulesError = 0;

    for (let i = 0; i < data.adminRules.length; i += BATCH_SIZE) {
      const batch = data.adminRules.slice(i, i + BATCH_SIZE).map(rule => ({
        id: rule.id,
        rule_serial_number: rule.rule_serial_number,
        rule_name: rule.rule_name,
        rule_type: rule.rule_type || null,
        ministry: rule.ministry || null,
        issuance_date: rule.issuance_date || null,
        enforcement_date: rule.enforcement_date || null,
        content: rule.content?.substring(0, 100000) || null, // 100KB 제한
        status: rule.status || 'ACTIVE',
        last_synced_at: new Date().toISOString(),
      }));

      queue.add(async () => {
        const { error } = await supabase
          .from('admin_rules')
          .upsert(batch, { onConflict: 'id' });

        if (error) {
          rulesError += batch.length;
        } else {
          rulesSuccess += batch.length;
        }
      });
    }

    await queue.onIdle();
    console.log(`  ✅ Admin_Rules: ${rulesSuccess}건 성공, ${rulesError}건 실패`);
  }

  // 4. Local_Ordinances 동기화 (테이블 있는 경우)
  if (data.localOrdinances.length > 0) {
    console.log(`\n📜 Local_Ordinances 동기화 (${data.localOrdinances.length}건)...`);
    let ordinancesSuccess = 0;
    let ordinancesError = 0;

    for (let i = 0; i < data.localOrdinances.length; i += BATCH_SIZE) {
      const batch = data.localOrdinances.slice(i, i + BATCH_SIZE).map(ord => ({
        id: ord.id,
        ordinance_serial_number: ord.ordinance_serial_number,
        ordinance_name: ord.ordinance_name,
        local_government_code: ord.local_government_code || null,
        local_government_name: ord.local_government_name || null,
        promulgation_date: ord.promulgation_date || null,
        enforcement_date: ord.enforcement_date || null,
        content: ord.content?.substring(0, 100000) || null, // 100KB 제한
        status: ord.status || 'ACTIVE',
        last_synced_at: new Date().toISOString(),
      }));

      queue.add(async () => {
        const { error } = await supabase
          .from('local_ordinances')
          .upsert(batch, { onConflict: 'id' });

        if (error) {
          ordinancesError += batch.length;
        } else {
          ordinancesSuccess += batch.length;
        }
      });
    }

    await queue.onIdle();
    console.log(`  ✅ Local_Ordinances: ${ordinancesSuccess}건 성공, ${ordinancesError}건 실패`);
  }

  console.log('\n✅ Supabase 동기화 완료!');
}

// ============================================
// Render PostgreSQL 동기화
// ============================================

async function syncToRender(data: ReturnType<typeof readSQLiteData>) {
  if (!RENDER_PG_PASSWORD) {
    console.error('❌ RENDER_PG_PASSWORD가 설정되지 않았습니다.');
    return;
  }

  // pg 동적 import (better-sqlite3와 충돌 방지)
  const { Pool } = await import('pg');

  const pool = new Pool({
    host: RENDER_PG_HOST,
    port: parseInt(RENDER_PG_PORT),
    database: RENDER_PG_DATABASE,
    user: RENDER_PG_USER,
    password: RENDER_PG_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  console.log('\n🚀 Render PostgreSQL 동기화 시작...');

  try {
    // 연결 테스트
    const client = await pool.connect();
    console.log('  ✅ Render PostgreSQL 연결 성공');

    const BATCH_SIZE = 100;

    // 1. Laws 동기화
    console.log(`\n📜 Laws 동기화 (${data.laws.length}건)...`);
    let lawsSuccess = 0;

    for (let i = 0; i < data.laws.length; i += BATCH_SIZE) {
      const batch = data.laws.slice(i, i + BATCH_SIZE);

      const values = batch.map((law, idx) => {
        const base = idx * 10;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, NOW())`;
      }).join(', ');

      const params = batch.flatMap(law => [
        law.id,
        law.law_mst_id,
        law.law_name,
        law.law_name_eng || null,
        law.promulgation_date || null,
        law.enforcement_date || null,
        law.law_type || null,
        law.ministry || null,
        law.status || 'ACTIVE',
      ]);

      try {
        await client.query(`
          INSERT INTO laws (id, law_mst_id, law_name, law_name_eng, promulgation_date, enforcement_date, law_type, ministry, status, updated_at)
          VALUES ${values}
          ON CONFLICT (id) DO UPDATE SET
            law_name = EXCLUDED.law_name,
            law_name_eng = EXCLUDED.law_name_eng,
            updated_at = NOW()
        `, params);

        lawsSuccess += batch.length;
      } catch (e: any) {
        console.error(`  ❌ Laws batch ${i}-${i + batch.length} 실패:`, e.message);
      }
    }

    console.log(`  ✅ Laws: ${lawsSuccess}건 완료`);

    // 2. Articles 동기화 (대용량이므로 간소화된 방식)
    console.log(`\n📄 Articles 동기화 (${data.articles.length}건)...`);
    let articlesSuccess = 0;

    for (let i = 0; i < data.articles.length; i += BATCH_SIZE) {
      const batch = data.articles.slice(i, i + BATCH_SIZE);

      for (const article of batch) {
        try {
          await client.query(`
            INSERT INTO articles (id, law_id, article_no, article_title, content, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE SET
              article_title = EXCLUDED.article_title,
              content = EXCLUDED.content,
              updated_at = NOW()
          `, [
            article.id,
            article.law_id,
            article.article_no,
            article.article_title || null,
            article.content?.substring(0, 50000) || '',
          ]);
          articlesSuccess++;
        } catch (e: any) {
          // 개별 오류는 무시
        }
      }

      if (articlesSuccess % 10000 === 0) {
        console.log(`  ⏳ Articles: ${articlesSuccess}건 완료...`);
      }
    }

    console.log(`  ✅ Articles: ${articlesSuccess}건 완료`);

    client.release();

  } catch (e: any) {
    console.error('❌ Render PostgreSQL 연결 실패:', e.message);
  } finally {
    await pool.end();
  }

  console.log('\n✅ Render PostgreSQL 동기화 완료!');
}

// ============================================
// CLI
// ============================================

async function main() {
  const args = process.argv.slice(2);

  const syncSupabase = args.includes('--supabase') || args.includes('--all');
  const syncRender = args.includes('--render') || args.includes('--all');

  if (!syncSupabase && !syncRender) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           SQLite → PostgreSQL 동기화 스크립트                   ║
╚══════════════════════════════════════════════════════════════╝

사용법:
  npx ts-node scripts/sync-sqlite-to-postgres.ts [옵션]

옵션:
  --supabase    Supabase로 동기화
  --render      Render PostgreSQL로 동기화
  --all         모든 대상에 동기화

환경변수:
  SUPABASE_URL                Supabase 프로젝트 URL
  SUPABASE_SERVICE_ROLE_KEY   Supabase 서비스 역할 키
  RENDER_PG_HOST              Render PostgreSQL 호스트
  RENDER_PG_PASSWORD          Render PostgreSQL 비밀번호
`);
    return;
  }

  const data = readSQLiteData();

  if (syncSupabase) {
    await syncToSupabase(data);
  }

  if (syncRender) {
    await syncToRender(data);
  }
}

main().catch(console.error);
