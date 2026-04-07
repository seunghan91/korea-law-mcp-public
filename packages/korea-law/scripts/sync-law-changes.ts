/**
 * 법령 변경사항 통합 동기화 스크립트
 *
 * 국가법령정보센터 lawList API를 활용하여 다음을 주기적으로 동기화:
 * 1. 최신법령 (신규 공포/개정)
 * 2. 시행예정법령 (시행일이 미래인 법령)
 * 3. 폐지법령 (연혁 법령 중 폐지된 것)
 * 4. 한시법령/위헌조문 (별도 마킹 필요)
 *
 * 사용법:
 *   npx ts-node scripts/sync-law-changes.ts [--days 30] [--category all|pending|recent|abolished]
 */

import Database from 'better-sqlite3';
import { parseStringPromise } from 'xml2js';
import path from 'path';

const DB_PATH = path.join(__dirname, '../data/korea-law.db');
const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const LIST_URL = 'http://www.law.go.kr/DRF/lawSearch.do';

interface LawChange {
  law_id: string;
  law_name: string;
  law_type: string;
  ministry: string;
  promulgation_date: string;    // 공포일자
  enforcement_date: string;     // 시행일자
  revision_type: string;        // 제개정구분
  is_current: boolean;          // 현행여부
  change_category: 'NEW' | 'AMENDED' | 'PENDING' | 'ABOLISHED' | 'TEMPORARY';
  days_until_effective?: number;
  registered_at: string;
  modified_at: string;
}

// lawList API 호출 (최신 등록/수정 법령)
async function fetchLawList(display: number = 200): Promise<any[]> {
  const url = `${LIST_URL}?OC=${API_KEY}&target=lawList&type=XML&display=${display}`;

  console.log(`📡 lawList API 호출 (${display}건)...`);

  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });

    if (!result.법령목록 || !result.법령목록.법령) {
      console.log('⚠️ 법령 목록이 비어있습니다.');
      return [];
    }

    const laws = Array.isArray(result.법령목록.법령)
      ? result.법령목록.법령
      : [result.법령목록.법령];

    console.log(`   → ${laws.length}건 조회됨`);
    return laws;
  } catch (error) {
    console.error('❌ API 호출 실패:', error);
    return [];
  }
}

// 날짜 비교 유틸리티
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 8) return null;
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(year, month, day);
}

function getDaysUntil(dateStr: string): number {
  const date = parseDate(dateStr);
  if (!date) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = date.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}

// 법령 변경 카테고리 분류
function categorizeChange(law: any): LawChange['change_category'] {
  const basicInfo = law.기본정보 || law;
  const enforcementDate = basicInfo.시행일자 || '';
  const revisionType = basicInfo.제개정구분 || '';
  const isCurrent = (basicInfo.현행여부 || '') === '현행';

  const daysUntil = getDaysUntil(enforcementDate);

  // 시행예정 (시행일이 미래)
  if (daysUntil > 0) {
    return 'PENDING';
  }

  // 폐지
  if (revisionType.includes('폐지') || !isCurrent) {
    return 'ABOLISHED';
  }

  // 신규 제정
  if (revisionType === '제정') {
    return 'NEW';
  }

  // 개정
  return 'AMENDED';
}

// 법령 정보 파싱
function parseLawInfo(raw: any): LawChange {
  const basicInfo = raw.기본정보 || raw;

  const lawType = basicInfo.법종구분;
  const ministry = basicInfo.소관부처;

  return {
    law_id: basicInfo.법령ID || '',
    law_name: basicInfo.법령명_한글 || basicInfo.법령명한글 || '',
    law_type: typeof lawType === 'object' ? lawType._ || '' : lawType || '',
    ministry: typeof ministry === 'object' ? ministry._ || '' : ministry || '',
    promulgation_date: basicInfo.공포일자 || '',
    enforcement_date: basicInfo.시행일자 || '',
    revision_type: basicInfo.제개정구분 || '',
    is_current: (basicInfo.현행여부 || '') === '현행',
    change_category: categorizeChange(raw),
    days_until_effective: getDaysUntil(basicInfo.시행일자 || ''),
    registered_at: basicInfo.등록일자 || '',
    modified_at: basicInfo.수정일자 || '',
  };
}

// DB에 변경사항 저장
function saveLawChange(db: Database.Database, change: LawChange): boolean {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO LawChanges (
        law_id, law_name, law_type, ministry,
        promulgation_date, enforcement_date, revision_type,
        is_current, change_category, days_until_effective,
        registered_at, modified_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      change.law_id,
      change.law_name,
      change.law_type,
      change.ministry,
      formatDate(change.promulgation_date),
      formatDate(change.enforcement_date),
      change.revision_type,
      change.is_current ? 1 : 0,
      change.change_category,
      change.days_until_effective,
      formatDate(change.registered_at),
      formatDate(change.modified_at)
    );

    return true;
  } catch (error) {
    console.error(`❌ 저장 실패 (${change.law_name}):`, error);
    return false;
  }
}

// LawChanges 테이블 생성
function ensureTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS LawChanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      law_id TEXT NOT NULL,
      law_name TEXT NOT NULL,
      law_type TEXT,
      ministry TEXT,
      promulgation_date TEXT,
      enforcement_date TEXT,
      revision_type TEXT,
      is_current INTEGER DEFAULT 1,
      change_category TEXT CHECK(change_category IN ('NEW', 'AMENDED', 'PENDING', 'ABOLISHED', 'TEMPORARY')),
      days_until_effective INTEGER,
      registered_at TEXT,
      modified_at TEXT,
      synced_at TEXT DEFAULT (datetime('now')),
      UNIQUE(law_id, enforcement_date)
    );

    CREATE INDEX IF NOT EXISTS idx_law_changes_category ON LawChanges(change_category);
    CREATE INDEX IF NOT EXISTS idx_law_changes_enforcement ON LawChanges(enforcement_date);
  `);
}

// 메인 동기화 함수
async function syncLawChanges(options: { days?: number; category?: string }) {
  const db = new Database(DB_PATH);
  ensureTable(db);

  console.log('🔄 법령 변경사항 동기화 시작\n');
  console.log(`📅 기준일: ${new Date().toISOString().split('T')[0]}`);

  // lawList API로 최신 법령 조회
  const rawLaws = await fetchLawList(500);

  if (rawLaws.length === 0) {
    console.log('⚠️ 조회된 법령이 없습니다.');
    db.close();
    return;
  }

  // 분류별 집계
  const stats = {
    NEW: 0,
    AMENDED: 0,
    PENDING: 0,
    ABOLISHED: 0,
    TEMPORARY: 0,
    total: 0,
  };

  const pendingLaws: LawChange[] = [];

  for (const raw of rawLaws) {
    const change = parseLawInfo(raw);

    // 카테고리 필터링
    if (options.category && options.category !== 'all' &&
        change.change_category.toLowerCase() !== options.category.toLowerCase()) {
      continue;
    }

    // 날짜 필터링 (최근 N일 내 등록/수정)
    if (options.days) {
      const modDaysAgo = getDaysUntil(change.modified_at);
      if (Math.abs(modDaysAgo) > options.days) continue;
    }

    if (saveLawChange(db, change)) {
      stats[change.change_category]++;
      stats.total++;

      if (change.change_category === 'PENDING') {
        pendingLaws.push(change);
      }
    }
  }

  // 결과 출력
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 동기화 결과\n');
  console.log(`  총 처리: ${stats.total}건`);
  console.log(`  ├─ 신규 제정: ${stats.NEW}건`);
  console.log(`  ├─ 개정: ${stats.AMENDED}건`);
  console.log(`  ├─ 시행예정: ${stats.PENDING}건`);
  console.log(`  ├─ 폐지: ${stats.ABOLISHED}건`);
  console.log(`  └─ 한시: ${stats.TEMPORARY}건`);

  // 시행예정 법령 상세 출력
  if (pendingLaws.length > 0) {
    console.log(`\n📋 시행예정 법령 (${pendingLaws.length}건):`);
    pendingLaws
      .sort((a, b) => (a.days_until_effective || 0) - (b.days_until_effective || 0))
      .slice(0, 20)
      .forEach((law, i) => {
        console.log(`  ${i + 1}. ${law.law_name}`);
        console.log(`     시행일: ${formatDate(law.enforcement_date)} (${law.days_until_effective}일 후)`);
      });

    if (pendingLaws.length > 20) {
      console.log(`  ... 외 ${pendingLaws.length - 20}건`);
    }
  }

  // DB 통계
  const dbStats = db.prepare(`
    SELECT
      change_category,
      COUNT(*) as count
    FROM LawChanges
    GROUP BY change_category
  `).all() as { change_category: string; count: number }[];

  console.log(`\n📦 DB 현황:`);
  dbStats.forEach(row => {
    console.log(`  ${row.change_category}: ${row.count}건`);
  });

  db.close();
  console.log('\n✅ 동기화 완료');
}

// CLI 실행
const args = process.argv.slice(2);
const daysIndex = args.indexOf('--days');
const categoryIndex = args.indexOf('--category');

const options = {
  days: daysIndex >= 0 ? parseInt(args[daysIndex + 1]) : undefined,
  category: categoryIndex >= 0 ? args[categoryIndex + 1] : 'all',
};

syncLawChanges(options).catch(console.error);
