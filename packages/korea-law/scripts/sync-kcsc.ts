/**
 * KCSC (국가건설기준센터) 동기화 스크립트
 * KDS (설계기준) 및 KCS (표준시방서) 데이터를 동기화합니다.
 *
 * 사용법:
 *   npx ts-node scripts/sync-kcsc.ts
 *   npx ts-node scripts/sync-kcsc.ts --type KDS
 *   npx ts-node scripts/sync-kcsc.ts --type KCS
 *
 * API 문서: /Users/seunghan/law/asset/api_guide/kcsc/api.md
 */

import 'dotenv/config';
import axios from 'axios';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================
// 환경 설정
// ============================================
const KCSC_API_BASE = process.env.KCSC_API_BASE_URL || 'https://kcsc.re.kr/api';
const KCSC_REFERER = process.env.KCSC_REFERER || 'https://kcsc.re.kr/';
const DB_PATH = process.env.KOREA_LAW_DB_PATH || path.join(__dirname, '../data/korea-law.db');

const HEADERS = {
  'Accept': 'application/json',
  'Referer': KCSC_REFERER,
};

// ============================================
// 타입 정의
// ============================================
interface HistoryItem {
  docInfoSeq: number;
  kcscCd: string;
  docNm: string;
  docYr: string;
  estbYmd: string;
  rvsnYmd: string;
  aplcnBgngYmd: string;
  lastYn: string;
  docFileGrpId: string;
  useYn: string;
  docConsider?: string;
  docAdvice?: string;
  docDept?: string;
  docRelation?: string;
  docPublish?: string;
  docBrief?: string;
  docEr?: string;
  docCycle?: number;
  rvsnRemark?: string;
}

interface StandardItem {
  groupSeq: number;
  kcscCd: string;
  groupNm: string;
  mainCategory: string;
  middleCategory: string;
  docFileGrpId: string;
  historyList: HistoryItem[];
  favoriteChk?: boolean;
}

interface APIResponse {
  resultCode: number;
  resultMessage: string;
  result: {
    resultCnt: {
      allCnt: number;
      remarkCnt: number;
    };
    resultList: StandardItem[];
  };
}

// ============================================
// 유틸리티 함수
// ============================================
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function computeChecksum(data: object): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// ============================================
// 데이터베이스 연결
// ============================================
function getDatabase(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

// ============================================
// API 호출 함수
// ============================================
async function fetchStandardList(tab: 10 | 20): Promise<StandardItem[]> {
  const docType = tab === 10 ? 'KDS' : 'KCS';
  console.log(`🔄 ${docType} 목록 조회 중...`);

  try {
    const url = `${KCSC_API_BASE}/standardCode/standard-code-list?tab=${tab}`;
    const response = await axios.get<APIResponse>(url, {
      headers: HEADERS,
      timeout: 60000,
    });

    if (response.data.resultCode !== 200) {
      throw new Error(`API 오류: ${response.data.resultMessage}`);
    }

    const items = response.data.result.resultList;
    console.log(`✅ ${docType} ${items.length}건 조회 완료`);
    return items;
  } catch (error: any) {
    console.error(`❌ ${docType} 조회 실패:`, error.message);
    throw error;
  }
}

async function fetchDocumentGroups(): Promise<any[]> {
  console.log('🔄 문서 그룹 조회 중...');

  try {
    const url = `${KCSC_API_BASE}/api/v1/tn-document-groups?doc_level=1`;
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 30000,
    });

    console.log(`✅ 문서 그룹 ${response.data.result?.length || 0}건 조회 완료`);
    return response.data.result || [];
  } catch (error: any) {
    console.error('❌ 문서 그룹 조회 실패:', error.message);
    return [];
  }
}

// ============================================
// 데이터베이스 동기화 함수
// ============================================
function upsertStandard(db: Database.Database, item: StandardItem, docType: string): number {
  const latestHistory = item.historyList?.find(h => h.lastYn === 'Y') || item.historyList?.[0];

  const stmt = db.prepare(`
    INSERT INTO ConstructionStandards (
      kcsc_cd, group_seq, standard_name, standard_name_eng,
      doc_type, main_category, middle_category,
      establishment_date, revision_date, effective_date,
      dept, consider_org, advice_org, publish_org,
      doc_file_grp_id, is_latest, status, checksum, last_synced_at
    ) VALUES (
      @kcsc_cd, @group_seq, @standard_name, @standard_name_eng,
      @doc_type, @main_category, @middle_category,
      @establishment_date, @revision_date, @effective_date,
      @dept, @consider_org, @advice_org, @publish_org,
      @doc_file_grp_id, @is_latest, @status, @checksum, datetime('now')
    )
    ON CONFLICT(kcsc_cd) DO UPDATE SET
      standard_name = @standard_name,
      main_category = @main_category,
      middle_category = @middle_category,
      revision_date = @revision_date,
      effective_date = @effective_date,
      dept = @dept,
      consider_org = @consider_org,
      advice_org = @advice_org,
      publish_org = @publish_org,
      doc_file_grp_id = @doc_file_grp_id,
      checksum = @checksum,
      last_synced_at = datetime('now'),
      updated_at = datetime('now')
  `);

  const result = stmt.run({
    kcsc_cd: item.kcscCd,
    group_seq: item.groupSeq,
    standard_name: item.groupNm,
    standard_name_eng: null,
    doc_type: docType,
    main_category: item.mainCategory,
    middle_category: item.middleCategory,
    establishment_date: latestHistory ? parseDate(latestHistory.estbYmd) : null,
    revision_date: latestHistory ? parseDate(latestHistory.rvsnYmd) : null,
    effective_date: latestHistory ? parseDate(latestHistory.aplcnBgngYmd) : null,
    dept: latestHistory?.docDept || null,
    consider_org: latestHistory?.docConsider || null,
    advice_org: latestHistory?.docAdvice || null,
    publish_org: latestHistory?.docPublish || null,
    doc_file_grp_id: item.docFileGrpId,
    is_latest: 1,
    status: 'ACTIVE',
    checksum: computeChecksum(item),
  });

  // 기준 ID 조회
  const standardIdStmt = db.prepare('SELECT id FROM ConstructionStandards WHERE kcsc_cd = ?');
  const row = standardIdStmt.get(item.kcscCd) as { id: number } | undefined;
  const standardId = row?.id || 0;

  // 개정 이력 동기화
  if (item.historyList && item.historyList.length > 0) {
    upsertRevisions(db, standardId, item.historyList);
  }

  return result.changes;
}

function upsertRevisions(db: Database.Database, standardId: number, historyList: HistoryItem[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ConstructionStandardRevisions (
      standard_id, doc_info_seq, doc_year, doc_cycle, doc_er,
      establishment_date, revision_date, effective_from,
      revision_remark, doc_brief, doc_file_grp_id, is_latest, doc_order
    ) VALUES (
      @standard_id, @doc_info_seq, @doc_year, @doc_cycle, @doc_er,
      @establishment_date, @revision_date, @effective_from,
      @revision_remark, @doc_brief, @doc_file_grp_id, @is_latest, @doc_order
    )
  `);

  historyList.forEach((h, idx) => {
    stmt.run({
      standard_id: standardId,
      doc_info_seq: h.docInfoSeq,
      doc_year: h.docYr,
      doc_cycle: h.docCycle || null,
      doc_er: h.docEr || null,
      establishment_date: parseDate(h.estbYmd),
      revision_date: parseDate(h.rvsnYmd),
      effective_from: parseDate(h.aplcnBgngYmd),
      revision_remark: h.rvsnRemark || null,
      doc_brief: h.docBrief || null,
      doc_file_grp_id: h.docFileGrpId,
      is_latest: h.lastYn === 'Y' ? 1 : 0,
      doc_order: idx + 1,
    });
  });
}

// ============================================
// 메인 동기화 함수
// ============================================
async function syncKCSC(targetType?: 'KDS' | 'KCS' | 'ALL'): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('🏗️  KCSC 국가건설기준 동기화 시작');
  console.log('═══════════════════════════════════════════');
  console.log(`📁 DB 경로: ${DB_PATH}`);
  console.log(`🌐 API URL: ${KCSC_API_BASE}`);
  console.log(`🎯 동기화 대상: ${targetType || 'ALL'}`);
  console.log('');

  const db = getDatabase();
  let totalInserted = 0;
  let totalUpdated = 0;

  try {
    // KDS 동기화
    if (!targetType || targetType === 'ALL' || targetType === 'KDS') {
      console.log('\n📐 [1/2] KDS (설계기준) 동기화');
      console.log('─'.repeat(40));

      const kdsItems = await fetchStandardList(10);

      db.exec('BEGIN TRANSACTION');
      for (const item of kdsItems) {
        const changes = upsertStandard(db, item, 'KDS');
        if (changes > 0) totalInserted++;
      }
      db.exec('COMMIT');

      console.log(`   📊 KDS ${kdsItems.length}건 처리 완료`);
      await sleep(1000);
    }

    // KCS 동기화
    if (!targetType || targetType === 'ALL' || targetType === 'KCS') {
      console.log('\n📋 [2/2] KCS (표준시방서) 동기화');
      console.log('─'.repeat(40));

      const kcsItems = await fetchStandardList(20);

      db.exec('BEGIN TRANSACTION');
      for (const item of kcsItems) {
        const changes = upsertStandard(db, item, 'KCS');
        if (changes > 0) totalInserted++;
      }
      db.exec('COMMIT');

      console.log(`   📊 KCS ${kcsItems.length}건 처리 완료`);
    }

    // 최종 통계
    const stats = db.prepare(`
      SELECT
        doc_type,
        COUNT(*) as count,
        MAX(last_synced_at) as last_sync
      FROM ConstructionStandards
      GROUP BY doc_type
    `).all();

    console.log('\n═══════════════════════════════════════════');
    console.log('📊 동기화 완료 통계');
    console.log('═══════════════════════════════════════════');

    for (const stat of stats as any[]) {
      console.log(`   ${stat.doc_type}: ${stat.count}건 (최종 동기화: ${stat.last_sync})`);
    }

    const totalRevisions = db.prepare('SELECT COUNT(*) as cnt FROM ConstructionStandardRevisions').get() as { cnt: number };
    console.log(`   개정 이력: ${totalRevisions.cnt}건`);

    console.log('\n✅ KCSC 동기화 완료!');

  } catch (error: any) {
    console.error('\n❌ 동기화 실패:', error.message);
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}

// ============================================
// CLI 실행
// ============================================
const args = process.argv.slice(2);
let targetType: 'KDS' | 'KCS' | 'ALL' = 'ALL';

if (args.includes('--type')) {
  const typeIdx = args.indexOf('--type');
  const typeValue = args[typeIdx + 1]?.toUpperCase();
  if (typeValue === 'KDS' || typeValue === 'KCS') {
    targetType = typeValue;
  }
}

if (args.includes('--kds')) {
  targetType = 'KDS';
} else if (args.includes('--kcs')) {
  targetType = 'KCS';
}

syncKCSC(targetType)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
