/**
 * SQLite → Supabase 동기화 스크립트 (병렬 처리)
 *
 * 사용법: npx ts-node scripts/sync-sqlite-to-supabase.ts
 *
 * 환경변수:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import PQueue from 'p-queue';
import path from 'path';

// 설정
const SQLITE_DB = process.env.SQLITE_DB || path.join(__dirname, '../data/korea-law.db');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 환경변수 검증
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ 필수 환경변수가 설정되지 않았습니다:');
  if (!SUPABASE_URL) console.error('   - SUPABASE_URL');
  if (!SUPABASE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n설정 방법:');
  console.error('   export SUPABASE_URL=https://your-project.supabase.co');
  console.error('   export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const BATCH_SIZE = 100;
const CONCURRENCY = 3;

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           SQLite → Supabase 동기화                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // SQLite 연결
  const db = new Database(SQLITE_DB);
  console.log(`📂 SQLite: ${SQLITE_DB}`);

  // Supabase 연결 (환경변수 검증은 위에서 완료)
  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
  console.log(`🌐 Supabase: ${SUPABASE_URL}`);

  // 데이터 현황
  const laws = db.prepare('SELECT * FROM Laws').all() as any[];
  const articles = db.prepare('SELECT * FROM Articles').all() as any[];

  let adminRules: any[] = [];
  let localOrdinances: any[] = [];

  try {
    adminRules = db.prepare('SELECT * FROM Admin_Rules').all() as any[];
  } catch (e) {
    console.log('  ⚠️ Admin_Rules 테이블 없음');
  }

  try {
    localOrdinances = db.prepare('SELECT * FROM Local_Ordinances').all() as any[];
  } catch (e) {
    console.log('  ⚠️ Local_Ordinances 테이블 없음');
  }

  console.log(`\n📊 데이터 현황:`);
  console.log(`  Laws: ${laws.length}건`);
  console.log(`  Articles: ${articles.length}건`);
  console.log(`  Admin_Rules: ${adminRules.length}건`);
  console.log(`  Local_Ordinances: ${localOrdinances.length}건`);

  const queue = new PQueue({ concurrency: CONCURRENCY });
  const startTime = Date.now();

  // 1. Laws 동기화
  console.log(`\n📜 Laws 동기화 중...`);
  let lawsSuccess = 0;
  let lawsError = 0;

  for (let i = 0; i < laws.length; i += BATCH_SIZE) {
    const batch = laws.slice(i, i + BATCH_SIZE).map(law => ({
      id: law.id,
      law_mst_id: law.law_mst_id,
      law_name: law.law_name,
      law_name_eng: law.law_name_eng || null,
      law_name_normalized: law.law_name_normalized || law.law_name?.replace(/\s+/g, '').toLowerCase(),
      promulgation_date: law.promulgation_date || null,
      enforcement_date: law.enforcement_date || null,
      law_type: law.law_type || null,
      ministry: law.ministry || null,
      status: law.status || 'ACTIVE',
      source_url: law.source_url || null,
      checksum: law.checksum || null,
    }));

    queue.add(async () => {
      const { error } = await supabase.from('laws').upsert(batch, { onConflict: 'id' });
      if (error) {
        lawsError += batch.length;
      } else {
        lawsSuccess += batch.length;
      }
    });
  }

  await queue.onIdle();
  console.log(`  ✅ Laws: ${lawsSuccess}건 성공, ${lawsError}건 실패`);

  // 2. Articles 동기화
  console.log(`\n📄 Articles 동기화 중... (대용량, 시간 소요)`);
  let articlesSuccess = 0;
  let articlesError = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE).map(article => ({
      id: article.id,
      law_id: article.law_id,
      article_no: article.article_no,
      article_no_normalized: article.article_no_normalized || null,
      article_title: article.article_title || null,
      content: article.content?.substring(0, 50000) || '',
      paragraph_count: article.paragraph_count || 1,
      content_hash: article.content_hash || null,
      is_definition: article.is_definition || false,
    }));

    queue.add(async () => {
      const { error } = await supabase.from('articles').upsert(batch, { onConflict: 'id' });
      if (error) {
        articlesError += batch.length;
      } else {
        articlesSuccess += batch.length;
        if (articlesSuccess % 10000 === 0) {
          console.log(`  ⏳ Articles: ${articlesSuccess}/${articles.length} 완료...`);
        }
      }
    });
  }

  await queue.onIdle();
  console.log(`  ✅ Articles: ${articlesSuccess}건 성공, ${articlesError}건 실패`);

  // 3. Admin_Rules 동기화 (테이블 있는 경우)
  if (adminRules.length > 0) {
    console.log(`\n📋 Admin_Rules 동기화 중...`);
    let rulesSuccess = 0;
    let rulesError = 0;

    for (let i = 0; i < adminRules.length; i += BATCH_SIZE) {
      const batch = adminRules.slice(i, i + BATCH_SIZE).map(rule => ({
        id: rule.id,
        rule_serial_number: rule.rule_serial_number,
        rule_name: rule.rule_name,
        rule_type: rule.rule_type || null,
        ministry: rule.ministry || null,
        issuance_date: rule.issuance_date || null,
        enforcement_date: rule.enforcement_date || null,
        content: rule.content?.substring(0, 100000) || null,
        status: rule.status || 'ACTIVE',
      }));

      queue.add(async () => {
        const { error } = await supabase.from('admin_rules').upsert(batch, { onConflict: 'id' });
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
  if (localOrdinances.length > 0) {
    console.log(`\n📜 Local_Ordinances 동기화 중...`);
    let ordinancesSuccess = 0;
    let ordinancesError = 0;

    for (let i = 0; i < localOrdinances.length; i += BATCH_SIZE) {
      const batch = localOrdinances.slice(i, i + BATCH_SIZE).map(ord => ({
        id: ord.id,
        ordinance_serial_number: ord.ordinance_serial_number,
        ordinance_name: ord.ordinance_name,
        local_government_code: ord.local_government_code || null,
        local_government_name: ord.local_government_name || null,
        promulgation_date: ord.promulgation_date || null,
        enforcement_date: ord.enforcement_date || null,
        content: ord.content?.substring(0, 100000) || null,
        status: ord.status || 'ACTIVE',
      }));

      queue.add(async () => {
        const { error } = await supabase.from('local_ordinances').upsert(batch, { onConflict: 'id' });
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

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║     ✅ Supabase 동기화 완료 (${duration.toFixed(1)}초)                     `);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);

  db.close();
}

main().catch(console.error);
