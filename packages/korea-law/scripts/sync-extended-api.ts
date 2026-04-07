/**
 * 확장 API 데이터 동기화 스크립트
 * 
 * 1단계: API에서 데이터 수집 → 로컬 SQLite 저장
 * 2단계: SQLite → Supabase 업로드
 * 
 * 사용법: 
 *   npx ts-node scripts/sync-extended-api.ts --source=cgm_expc --ministry=nts
 *   npx ts-node scripts/sync-extended-api.ts --source=oneview
 *   npx ts-node scripts/sync-extended-api.ts --source=nts_prec
 *   npx ts-node scripts/sync-extended-api.ts --upload  # Supabase 업로드만
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';

// API 모듈 import
import {
  searchCgmExpcInterpretations,
  getCgmExpcInterpretationDetail,
  searchOneView,
  getOneViewDetail,
  searchNtsPrecedents,
  searchComwelPrecedents,
  searchTaxTribunalDecisions,
  CgmExpcMinistryType,
  CgmExpcInterpretationItem,
  OneViewItem,
  NtsPrecedentItem,
  ComwelPrecedentItem,
  TaxTribunalDecisionItem,
} from '../src/api/extended-api';

// ============================================
// 설정
// ============================================

const DB_PATH = process.env.KOREA_LAW_DB_PATH || path.join(__dirname, '../data/korea-law-extended.db');
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const BATCH_SIZE = 100;  // API 호출당 결과 수
const DELAY_MS = 500;    // API 호출 간 딜레이

// ============================================
// 로컬 SQLite DB 초기화
// ============================================

function initLocalDB(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);

  // 중앙부처 1차해석 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS cgm_expc_interpretations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interp_seq TEXT NOT NULL,
      ministry_code TEXT NOT NULL,
      ministry_name TEXT NOT NULL,
      case_no TEXT,
      title TEXT NOT NULL,
      requestor TEXT,
      interpretation_date TEXT,
      receipt_date TEXT,
      reply_status TEXT,
      process_status TEXT,
      background TEXT,
      related_law TEXT,
      question TEXT,
      answer TEXT,
      reasoning TEXT,
      source_url TEXT,
      last_synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      checksum TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(interp_seq, ministry_code)
    );
    CREATE INDEX IF NOT EXISTS idx_cgm_ministry ON cgm_expc_interpretations(ministry_code);
    CREATE INDEX IF NOT EXISTS idx_cgm_date ON cgm_expc_interpretations(interpretation_date);
  `);

  // 한눈보기 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS one_view_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      oneview_seq TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT,
      related_law_name TEXT,
      related_law_id TEXT,
      author_dept TEXT,
      created_date TEXT,
      content TEXT,
      related_article TEXT,
      visual_content_urls TEXT,
      source_url TEXT,
      last_synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_oneview_title ON one_view_contents(title);
  `);

  // 국세법령정보시스템 판례 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS nts_precedents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prec_seq TEXT UNIQUE NOT NULL,
      case_id TEXT,
      case_name TEXT,
      decision_date TEXT,
      court TEXT,
      judgment_type TEXT,
      tax_type TEXT,
      summary TEXT,
      holding TEXT,
      full_text TEXT,
      ref_articles TEXT,
      source_url TEXT,
      last_synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_nts_case ON nts_precedents(case_id);
  `);

  // 근로복지공단 산재 판례 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS comwel_precedents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prec_seq TEXT UNIQUE NOT NULL,
      case_id TEXT,
      case_name TEXT,
      decision_date TEXT,
      injury_type TEXT,
      recognition_status TEXT,
      summary TEXT,
      holding TEXT,
      full_text TEXT,
      ref_articles TEXT,
      source_url TEXT,
      last_synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_comwel_case ON comwel_precedents(case_id);
  `);

  // 조세심판원 재결례 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS tax_tribunal_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      decision_seq TEXT UNIQUE NOT NULL,
      case_id TEXT,
      case_name TEXT,
      decision_date TEXT,
      disposition_type TEXT,
      disposition_amount TEXT,
      disputed_law TEXT,
      decision_result TEXT,
      summary TEXT,
      full_text TEXT,
      source_url TEXT,
      last_synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tax_tribunal_case ON tax_tribunal_decisions(case_id);
  `);

  // 동기화 메타데이터 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL,
      ministry_code TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT DEFAULT 'RUNNING',
      records_fetched INTEGER DEFAULT 0,
      records_inserted INTEGER DEFAULT 0,
      records_updated INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

// ============================================
// 유틸리티 함수
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDate(date: string | undefined): string | null {
  if (!date) return null;
  // YYYYMMDD → YYYY-MM-DD
  if (date.length === 8 && !date.includes('-')) {
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  }
  return date;
}

// ============================================
// 중앙부처 1차해석 동기화
// ============================================

async function syncCgmExpc(
  db: Database.Database,
  ministryCode: CgmExpcMinistryType,
  options: { maxPages?: number; query?: string } = {}
): Promise<{ fetched: number; inserted: number; updated: number }> {
  const maxPages = options.maxPages || 100;
  const query = options.query || '*';
  
  console.log(`\n📥 중앙부처 1차해석 동기화: ${ministryCode}`);
  
  const insertStmt = db.prepare(`
    INSERT INTO cgm_expc_interpretations (
      interp_seq, ministry_code, ministry_name, case_no, title, requestor,
      interpretation_date, receipt_date, reply_status, process_status,
      background, related_law, question, answer, reasoning, source_url, checksum
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(interp_seq, ministry_code) DO UPDATE SET
      title = excluded.title,
      question = excluded.question,
      answer = excluded.answer,
      updated_at = CURRENT_TIMESTAMP
  `);

  let fetched = 0;
  let inserted = 0;
  let updated = 0;

  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`   페이지 ${page}/${maxPages} 처리 중...`);
      
      const items = await searchCgmExpcInterpretations(ministryCode, query, {
        display: BATCH_SIZE,
        page,
      });

      if (items.length === 0) {
        console.log(`   ✓ 페이지 ${page}: 더 이상 데이터 없음`);
        break;
      }

      fetched += items.length;

      for (const item of items) {
        try {
          // 상세 정보 조회 (필요시)
          let detail = null;
          if (item.해석일련번호) {
            try {
              detail = await getCgmExpcInterpretationDetail(ministryCode, item.해석일련번호);
              await sleep(100); // 상세 조회 딜레이
            } catch (e) {
              // 상세 조회 실패해도 목록 데이터로 진행
            }
          }

          const result = insertStmt.run(
            item.해석일련번호,
            ministryCode,
            item.부처명,
            detail?.안건번호 || null,
            item.안건명,
            item.질의기관 || null,
            formatDate(item.해석일자),
            formatDate(item.접수일자),
            item.회신여부 || null,
            item.처리상태 || null,
            detail?.질의배경 || null,
            detail?.관련법령조항 || null,
            detail?.질의요지 || null,
            detail?.회답 || null,
            detail?.이유 || null,
            item.해석상세링크 || null,
            null // checksum
          );

          if (result.changes > 0) {
            inserted++;
          }
        } catch (e) {
          console.error(`   ⚠️ 항목 저장 실패:`, e);
        }
      }

      console.log(`   ✓ 페이지 ${page}: ${items.length}건 처리`);
      await sleep(DELAY_MS);
    } catch (error) {
      console.error(`   ❌ 페이지 ${page} 실패:`, error);
      break;
    }
  }

  console.log(`✅ ${ministryCode} 완료: ${fetched}건 조회, ${inserted}건 저장`);
  return { fetched, inserted, updated };
}

// ============================================
// 한눈보기 동기화
// ============================================

async function syncOneView(
  db: Database.Database,
  options: { maxPages?: number; query?: string } = {}
): Promise<{ fetched: number; inserted: number; updated: number }> {
  const maxPages = options.maxPages || 50;
  const query = options.query || '*';
  
  console.log(`\n📥 한눈보기 동기화`);
  
  const insertStmt = db.prepare(`
    INSERT INTO one_view_contents (
      oneview_seq, title, category, related_law_name, related_law_id,
      author_dept, created_date, content, related_article, visual_content_urls, source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(oneview_seq) DO UPDATE SET
      title = excluded.title,
      content = excluded.content,
      updated_at = CURRENT_TIMESTAMP
  `);

  let fetched = 0;
  let inserted = 0;
  let updated = 0;

  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`   페이지 ${page}/${maxPages} 처리 중...`);
      
      const items = await searchOneView(query, { display: BATCH_SIZE, page });

      if (items.length === 0) {
        console.log(`   ✓ 페이지 ${page}: 더 이상 데이터 없음`);
        break;
      }

      fetched += items.length;

      for (const item of items) {
        try {
          // 상세 조회
          let detail = null;
          if (item.한눈보기일련번호) {
            try {
              detail = await getOneViewDetail(item.한눈보기일련번호);
              await sleep(100);
            } catch (e) {
              // 상세 조회 실패해도 목록 데이터로 진행
            }
          }

          const result = insertStmt.run(
            item.한눈보기일련번호,
            item.제목 || detail?.제목,
            item.주제분류 || detail?.주제분류,
            item.관련법령명 || detail?.관련법령명,
            item.법령ID || detail?.법령ID,
            item.담당부서 || detail?.담당부서,
            formatDate(item.작성일자 || detail?.작성일자),
            detail?.내용 || null,
            detail?.관련조문 || null,
            detail?.시각콘텐츠URL ? JSON.stringify(detail.시각콘텐츠URL) : null,
            item.한눈보기상세링크 || null
          );

          if (result.changes > 0) {
            inserted++;
          }
        } catch (e) {
          console.error(`   ⚠️ 항목 저장 실패:`, e);
        }
      }

      console.log(`   ✓ 페이지 ${page}: ${items.length}건 처리`);
      await sleep(DELAY_MS);
    } catch (error) {
      console.error(`   ❌ 페이지 ${page} 실패:`, error);
      break;
    }
  }

  console.log(`✅ 한눈보기 완료: ${fetched}건 조회, ${inserted}건 저장`);
  return { fetched, inserted, updated };
}

// ============================================
// 국세법령정보시스템 판례 동기화
// ============================================

async function syncNtsPrecedents(
  db: Database.Database,
  options: { maxPages?: number; query?: string; taxType?: string } = {}
): Promise<{ fetched: number; inserted: number; updated: number }> {
  const maxPages = options.maxPages || 100;
  const query = options.query || '*';
  
  console.log(`\n📥 국세법령정보시스템 판례 동기화`);
  
  const insertStmt = db.prepare(`
    INSERT INTO nts_precedents (
      prec_seq, case_id, case_name, decision_date, court, judgment_type,
      tax_type, summary, holding, full_text, ref_articles, source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(prec_seq) DO UPDATE SET
      case_name = excluded.case_name,
      updated_at = CURRENT_TIMESTAMP
  `);

  let fetched = 0;
  let inserted = 0;
  let updated = 0;

  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`   페이지 ${page}/${maxPages} 처리 중...`);
      
      const items = await searchNtsPrecedents(query, {
        display: BATCH_SIZE,
        page,
        taxType: options.taxType,
      });

      if (items.length === 0) {
        console.log(`   ✓ 페이지 ${page}: 더 이상 데이터 없음`);
        break;
      }

      fetched += items.length;

      for (const item of items) {
        try {
          const result = insertStmt.run(
            item.판례일련번호,
            item.사건번호,
            item.사건명 || null,
            formatDate(item.선고일자),
            item.법원명 || null,
            item.판결유형 || null,
            item.세목 || null,
            null, // summary - 상세 조회 필요
            null, // holding
            null, // full_text
            null, // ref_articles
            item.판례상세링크 || null
          );

          if (result.changes > 0) {
            inserted++;
          }
        } catch (e) {
          console.error(`   ⚠️ 항목 저장 실패:`, e);
        }
      }

      console.log(`   ✓ 페이지 ${page}: ${items.length}건 처리`);
      await sleep(DELAY_MS);
    } catch (error) {
      console.error(`   ❌ 페이지 ${page} 실패:`, error);
      break;
    }
  }

  console.log(`✅ 국세판례 완료: ${fetched}건 조회, ${inserted}건 저장`);
  return { fetched, inserted, updated };
}

// ============================================
// 근로복지공단 산재 판례 동기화
// ============================================

async function syncComwelPrecedents(
  db: Database.Database,
  options: { maxPages?: number; query?: string } = {}
): Promise<{ fetched: number; inserted: number; updated: number }> {
  const maxPages = options.maxPages || 100;
  const query = options.query || '*';
  
  console.log(`\n📥 근로복지공단 산재 판례 동기화`);
  
  const insertStmt = db.prepare(`
    INSERT INTO comwel_precedents (
      prec_seq, case_id, case_name, decision_date, injury_type,
      recognition_status, summary, holding, full_text, ref_articles, source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(prec_seq) DO UPDATE SET
      case_name = excluded.case_name,
      updated_at = CURRENT_TIMESTAMP
  `);

  let fetched = 0;
  let inserted = 0;

  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`   페이지 ${page}/${maxPages} 처리 중...`);
      
      const items = await searchComwelPrecedents(query, {
        display: BATCH_SIZE,
        page,
      });

      if (items.length === 0) {
        console.log(`   ✓ 페이지 ${page}: 더 이상 데이터 없음`);
        break;
      }

      fetched += items.length;

      for (const item of items) {
        try {
          const result = insertStmt.run(
            item.판례일련번호,
            item.사건번호,
            item.사건명 || null,
            formatDate(item.선고일자),
            item.재해유형 || null,
            item.인정여부 || null,
            null, null, null, null,
            item.판례상세링크 || null
          );

          if (result.changes > 0) {
            inserted++;
          }
        } catch (e) {
          console.error(`   ⚠️ 항목 저장 실패:`, e);
        }
      }

      console.log(`   ✓ 페이지 ${page}: ${items.length}건 처리`);
      await sleep(DELAY_MS);
    } catch (error) {
      console.error(`   ❌ 페이지 ${page} 실패:`, error);
      break;
    }
  }

  console.log(`✅ 산재판례 완료: ${fetched}건 조회, ${inserted}건 저장`);
  return { fetched, inserted, updated: 0 };
}

// ============================================
// Supabase 업로드
// ============================================

async function uploadToSupabase(db: Database.Database, tableNames?: string[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않음');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const tables = tableNames || [
    'cgm_expc_interpretations',
    'one_view_contents',
    'nts_precedents',
    'comwel_precedents',
    'tax_tribunal_decisions',
  ];

  for (const table of tables) {
    console.log(`\n📤 Supabase 업로드: ${table}`);
    
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      console.log(`   총 ${rows.length}건`);

      // 배치 업로드
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(table)
          .upsert(batch, { onConflict: getConflictColumn(table) });

        if (error) {
          console.error(`   ❌ 배치 ${i / batchSize + 1} 실패:`, error.message);
        } else {
          console.log(`   ✓ 배치 ${i / batchSize + 1}: ${batch.length}건 업로드`);
        }
        
        await sleep(200);
      }
    } catch (error) {
      console.error(`   ❌ ${table} 업로드 실패:`, error);
    }
  }
}

function getConflictColumn(table: string): string {
  switch (table) {
    case 'cgm_expc_interpretations':
      return 'interp_seq,ministry_code';
    case 'one_view_contents':
      return 'oneview_seq';
    case 'nts_precedents':
    case 'comwel_precedents':
      return 'prec_seq';
    case 'tax_tribunal_decisions':
      return 'decision_seq';
    default:
      return 'id';
  }
}

// ============================================
// CLI 메인
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const source = args.find(a => a.startsWith('--source='))?.split('=')[1];
  const ministry = args.find(a => a.startsWith('--ministry='))?.split('=')[1] as CgmExpcMinistryType;
  const maxPages = parseInt(args.find(a => a.startsWith('--pages='))?.split('=')[1] || '10');
  const uploadOnly = args.includes('--upload');
  const query = args.find(a => a.startsWith('--query='))?.split('=')[1] || '*';

  console.log('═══════════════════════════════════════════');
  console.log('  korea-law 확장 API 동기화');
  console.log('═══════════════════════════════════════════');
  console.log(`  DB: ${DB_PATH}`);
  console.log(`  Source: ${source || 'all'}`);
  if (ministry) console.log(`  Ministry: ${ministry}`);
  console.log(`  Max Pages: ${maxPages}`);
  console.log('═══════════════════════════════════════════\n');

  const db = initLocalDB();

  try {
    if (uploadOnly) {
      await uploadToSupabase(db);
    } else if (source === 'cgm_expc' && ministry) {
      await syncCgmExpc(db, ministry, { maxPages, query });
    } else if (source === 'oneview') {
      await syncOneView(db, { maxPages, query });
    } else if (source === 'nts_prec') {
      await syncNtsPrecedents(db, { maxPages, query });
    } else if (source === 'comwel_prec') {
      await syncComwelPrecedents(db, { maxPages, query });
    } else {
      console.log('사용법:');
      console.log('  npx ts-node scripts/sync-extended-api.ts --source=cgm_expc --ministry=nts');
      console.log('  npx ts-node scripts/sync-extended-api.ts --source=oneview');
      console.log('  npx ts-node scripts/sync-extended-api.ts --source=nts_prec');
      console.log('  npx ts-node scripts/sync-extended-api.ts --source=comwel_prec');
      console.log('  npx ts-node scripts/sync-extended-api.ts --upload');
      console.log('\n부처 코드: nts, kcs, moi, moef, moel, mohw, molit, mafra, mof, motie, msit, mcst, moe, moj');
    }
  } finally {
    db.close();
  }

  console.log('\n✅ 완료');
}

main().catch(console.error);
