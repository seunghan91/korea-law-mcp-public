/**
 * 법령 변경사항 SQLite → Supabase 동기화
 *
 * SQLite의 LawChanges 테이블 데이터를 Supabase로 동기화합니다.
 * 웹 스크래핑 후 실행하거나, 독립적으로 실행할 수 있습니다.
 *
 * 사용법:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx npx ts-node scripts/sync-law-changes-to-supabase.ts
 *
 * 환경 변수:
 *   - SUPABASE_URL: Supabase 프로젝트 URL
 *   - SUPABASE_SERVICE_KEY: Supabase Service Role Key
 */

import Database from 'better-sqlite3';
import path from 'path';
import {
  initSupabaseAdmin,
  upsertLawChangesBatch,
  LawChangeRecord,
  recordSyncMetadata,
} from '../src/db/supabase';

const DB_PATH = path.join(__dirname, '../data/korea-law.db');

interface SQLiteLawChange {
  id: number;
  category: string;
  law_name: string;
  article_title: string;
  target_date: string | null;
  law_type: string | null;
  promulgation_no: string | null;
  promulgation_date: string | null;
  revision_type: string | null;
  ministry: string | null;
  days_until_target: number | null;
  scraped_at: string;
}

// 카테고리 매핑 (SQLite 한글 → Supabase 영문)
const CATEGORY_MAP: Record<string, LawChangeRecord['category']> = {
  '시행예정법령': 'pending',
  '폐지법령': 'abolished',
  '한시법령': 'temporary_law',
  '한시조문': 'temporary_article',
  '위헌조문': 'unconstitutional',
  // 영문 카테고리 그대로 사용하는 경우
  'pending': 'pending',
  'abolished': 'abolished',
  'temporary_law': 'temporary_law',
  'temporary_article': 'temporary_article',
  'unconstitutional': 'unconstitutional',
};

async function syncLawChangesToSupabase() {
  console.log('🔄 법령 변경사항 Supabase 동기화 시작\n');

  // Supabase 초기화
  try {
    initSupabaseAdmin();
  } catch (error) {
    console.error('❌ Supabase 초기화 실패:', error);
    console.log('\n환경 변수를 확인하세요:');
    console.log('  - SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  // SQLite 연결
  const db = new Database(DB_PATH, { readonly: true });

  // 동기화 메타데이터 기록 시작
  const startedAt = new Date().toISOString();

  try {
    // LawChanges 테이블 존재 확인
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='LawChanges'
    `).get();

    if (!tableExists) {
      console.log('⚠️ LawChanges 테이블이 없습니다. 먼저 웹 스크래핑을 실행하세요.');
      console.log('   npx ts-node scripts/scrape-law-changes.ts --category all');
      db.close();
      return;
    }

    // SQLite에서 데이터 조회
    const rows = db.prepare(`
      SELECT * FROM LawChanges ORDER BY category, days_until_target ASC
    `).all() as SQLiteLawChange[];

    console.log(`📊 SQLite에서 ${rows.length}건 조회됨\n`);

    if (rows.length === 0) {
      console.log('⚠️ 동기화할 데이터가 없습니다.');
      db.close();
      return;
    }

    // Supabase 형식으로 변환
    const changes: LawChangeRecord[] = rows.map(row => {
      const category = CATEGORY_MAP[row.category];
      if (!category) {
        console.warn(`⚠️ 알 수 없는 카테고리: ${row.category}`);
      }

      return {
        category: category || 'pending',
        law_name: row.law_name,
        article_title: row.article_title || '',
        target_date: row.target_date || undefined,
        law_type: row.law_type || undefined,
        promulgation_no: row.promulgation_no || undefined,
        promulgation_date: row.promulgation_date || undefined,
        revision_type: row.revision_type || undefined,
        ministry: row.ministry || undefined,
        days_until_target: row.days_until_target ?? undefined,
        source: 'web_scraping',
        scraped_at: row.scraped_at,
      };
    });

    // 카테고리별 통계
    const stats: Record<string, number> = {};
    for (const change of changes) {
      stats[change.category] = (stats[change.category] || 0) + 1;
    }

    console.log('📋 카테고리별 현황:');
    for (const [category, count] of Object.entries(stats)) {
      console.log(`   ${category}: ${count}건`);
    }
    console.log('');

    // Supabase로 동기화
    console.log('⬆️ Supabase 업로드 중...');
    const result = await upsertLawChangesBatch(changes);

    console.log(`\n✅ 동기화 완료`);
    console.log(`   성공: ${result.inserted}건`);
    console.log(`   실패: ${result.errors}건`);

    // 동기화 메타데이터 기록
    await recordSyncMetadata({
      sync_type: 'LAW_CHANGES_SCRAPE',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      status: result.errors === 0 ? 'SUCCESS' : 'PARTIAL',
      laws_added: result.inserted,
      laws_updated: 0,
      articles_added: 0,
      articles_updated: 0,
      diffs_detected: 0,
      source_data_date: new Date().toISOString().split('T')[0],
      error_message: result.errors > 0 ? `${result.errors} records failed` : undefined,
    });

    // 주요 법령 출력
    const aiLaws = changes.filter(c =>
      c.law_name.includes('인공지능') ||
      c.law_name.includes('디지털') ||
      c.law_name.includes('데이터')
    );

    if (aiLaws.length > 0) {
      console.log(`\n🤖 AI/디지털 관련 법령 (${aiLaws.length}건):`);
      aiLaws.slice(0, 10).forEach(law => {
        const daysText = law.days_until_target !== undefined
          ? (law.days_until_target > 0 ? `${law.days_until_target}일 후` : '시행 중')
          : '';
        console.log(`   - ${law.law_name} [${law.category}] ${daysText}`);
      });
    }

    // 시행 임박 법령
    const urgentLaws = changes.filter(c =>
      c.category === 'pending' &&
      c.days_until_target !== undefined &&
      c.days_until_target >= 0 &&
      c.days_until_target <= 30
    );

    if (urgentLaws.length > 0) {
      console.log(`\n🚨 30일 이내 시행 예정 (${urgentLaws.length}건):`);
      urgentLaws.slice(0, 10).forEach(law => {
        console.log(`   - D-${law.days_until_target}: ${law.law_name}`);
      });
    }

  } catch (error) {
    console.error('❌ 동기화 실패:', error);

    // 실패 메타데이터 기록
    try {
      await recordSyncMetadata({
        sync_type: 'LAW_CHANGES_SCRAPE',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        status: 'FAILED',
        error_message: String(error),
        source_data_date: new Date().toISOString().split('T')[0],
      });
    } catch {}

    throw error;
  } finally {
    db.close();
  }

  console.log('\n✅ Supabase 동기화 완료');
}

// 실행
syncLawChangesToSupabase().catch(console.error);
