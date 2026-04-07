/**
 * 시행예정 법률 자동 발견 스크립트
 *
 * 국가법령정보센터 API를 통해 공포되었으나 아직 시행되지 않은 법률을 탐지합니다.
 *
 * 발견 방법:
 * 1. efYd 파라미터로 미래 시행일 기준 검색 (한계: API 지원 범위 제한)
 * 2. 최근 공포된 법률 중 시행일이 미래인 것 탐지
 * 3. 관심 키워드 기반 정기 스캔 (AI, 환경, 디지털 등)
 *
 * 사용법:
 *   npx ts-node scripts/discover-pending-laws.ts [--keywords "AI,인공지능,디지털"]
 */

import Database from 'better-sqlite3';
import { parseStringPromise } from 'xml2js';
import path from 'path';

const DB_PATH = path.join(__dirname, '../data/korea-law.db');
const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const SEARCH_URL = 'http://www.law.go.kr/DRF/lawSearch.do';
const SERVICE_URL = 'http://www.law.go.kr/DRF/lawService.do';

// 관심 키워드 목록 (시행예정 탐지용)
const DEFAULT_KEYWORDS = [
  '인공지능', 'AI', '디지털', '플랫폼', '데이터',
  '탄소', '환경', '기후', '에너지',
  '블록체인', '가상자산', '메타버스',
  '자율주행', '드론', '로봇',
  '바이오', '의료기기', '원격의료',
];

interface DiscoveredLaw {
  mst_id: string;
  law_name: string;
  promulgation_date: string;
  enforcement_date: string;
  law_type: string;
  ministry: string;
  is_pending: boolean;
  days_until_effective: number;
}

// lawSearch API로 키워드 검색
async function searchLawsByKeyword(keyword: string): Promise<any[]> {
  const url = `${SEARCH_URL}?OC=${API_KEY}&target=law&type=XML&query=${encodeURIComponent(keyword)}&display=100&sort=date`;

  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });

    if (!result.LawSearch || !result.LawSearch.law) {
      return [];
    }

    const laws = Array.isArray(result.LawSearch.law)
      ? result.LawSearch.law
      : [result.LawSearch.law];

    return laws;
  } catch (error) {
    console.error(`검색 실패 (${keyword}):`, error);
    return [];
  }
}

// 법령 상세 조회 (시행일 확인용)
async function getLawDetail(mstId: string): Promise<any | null> {
  const url = `${SERVICE_URL}?OC=${API_KEY}&target=law&type=XML&MST=${mstId}`;

  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText, { explicitArray: false });

    if (!result.법령) {
      return null;
    }

    return result.법령;
  } catch (error) {
    console.error(`상세 조회 실패 (MST=${mstId}):`, error);
    return null;
  }
}

// 시행예정 여부 판단
function isPendingLaw(enforcementDate: string): { isPending: boolean; daysUntil: number } {
  if (!enforcementDate) {
    return { isPending: false, daysUntil: 0 };
  }

  // YYYYMMDD 형식을 Date로 변환
  const year = parseInt(enforcementDate.substring(0, 4));
  const month = parseInt(enforcementDate.substring(4, 6)) - 1;
  const day = parseInt(enforcementDate.substring(6, 8));
  const effectiveDate = new Date(year, month, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = effectiveDate.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    isPending: daysUntil > 0,
    daysUntil: daysUntil,
  };
}

// 이미 등록된 MST인지 확인
function isAlreadyRegistered(db: Database.Database, mstId: string): boolean {
  const existing = db.prepare(`
    SELECT 1 FROM PendingLawRegistry WHERE mst_id = ?
    UNION
    SELECT 1 FROM Laws WHERE law_mst_id = ?
  `).get(mstId, mstId);

  return !!existing;
}

// 발견된 시행예정 법률 등록
function registerDiscoveredLaw(db: Database.Database, law: DiscoveredLaw): boolean {
  try {
    const stmt = db.prepare(`
      INSERT INTO PendingLawRegistry (
        mst_id, law_name, law_type, ministry,
        promulgation_date, effective_date,
        registration_source, registration_reason, registered_by,
        tags, source_url
      ) VALUES (?, ?, ?, ?, ?, ?, 'AUTO_DETECT', ?, 'discover-script', ?, ?)
    `);

    stmt.run(
      law.mst_id,
      law.law_name,
      law.law_type,
      law.ministry,
      law.promulgation_date,
      // 날짜 형식 변환: YYYYMMDD → YYYY-MM-DD
      `${law.enforcement_date.substring(0, 4)}-${law.enforcement_date.substring(4, 6)}-${law.enforcement_date.substring(6, 8)}`,
      `자동 발견 (${law.days_until_effective}일 후 시행)`,
      '[]', // tags는 나중에 수동으로 추가
      `https://www.law.go.kr/lsInfoP.do?lsiSeq=${law.mst_id}`
    );

    return true;
  } catch (error) {
    console.error(`등록 실패 (${law.law_name}):`, error);
    return false;
  }
}

// 메인 발견 함수
async function discoverPendingLaws(options: { keywords?: string[] }) {
  const db = new Database(DB_PATH);
  const keywords = options.keywords || DEFAULT_KEYWORDS;

  console.log('🔍 시행예정 법률 자동 발견 시작\n');
  console.log(`📋 검색 키워드: ${keywords.join(', ')}\n`);

  const discovered: DiscoveredLaw[] = [];
  const seenMsts = new Set<string>();

  for (const keyword of keywords) {
    console.log(`\n🔎 "${keyword}" 검색 중...`);

    const searchResults = await searchLawsByKeyword(keyword);
    console.log(`   → ${searchResults.length}건 발견`);

    for (const result of searchResults) {
      const mstId = result.법령일련번호 || result.MST || '';

      if (!mstId || seenMsts.has(mstId)) continue;
      seenMsts.add(mstId);

      // 이미 등록된 법률 건너뛰기
      if (isAlreadyRegistered(db, mstId)) continue;

      // 상세 정보 조회
      const detail = await getLawDetail(mstId);
      if (!detail) continue;

      const basicInfo = detail.기본정보 || {};
      const enforcementDate = basicInfo.시행일자 || '';
      const promulgationDate = basicInfo.공포일자 || '';

      const { isPending, daysUntil } = isPendingLaw(enforcementDate);

      if (isPending && daysUntil > 0) {
        const lawName = basicInfo.법령명_한글 || result.법령명한글 || '';
        const lawTypeRaw = basicInfo.법종구분 || '';
        const lawType = typeof lawTypeRaw === 'object' ? lawTypeRaw._ || '' : lawTypeRaw;
        const ministryRaw = basicInfo.소관부처 || '';
        const ministry = typeof ministryRaw === 'object' ? ministryRaw._ || '' : ministryRaw;

        discovered.push({
          mst_id: mstId,
          law_name: lawName,
          promulgation_date: promulgationDate,
          enforcement_date: enforcementDate,
          law_type: lawType,
          ministry: ministry,
          is_pending: true,
          days_until_effective: daysUntil,
        });

        console.log(`   ✨ 시행예정 발견: ${lawName} (${daysUntil}일 후)`);
      }

      // API 호출 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 발견 결과: ${discovered.length}건의 시행예정 법률\n`);

  if (discovered.length === 0) {
    console.log('ℹ️  새로운 시행예정 법률이 없습니다.');
    db.close();
    return;
  }

  // 등록 여부 확인
  console.log('발견된 시행예정 법률:');
  discovered.forEach((law, i) => {
    console.log(`  ${i + 1}. ${law.law_name}`);
    console.log(`     MST: ${law.mst_id}, 시행일: ${law.enforcement_date} (${law.days_until_effective}일 후)`);
  });

  // 자동 등록
  console.log('\n📝 PendingLawRegistry에 등록 중...');
  let registered = 0;
  for (const law of discovered) {
    if (registerDiscoveredLaw(db, law)) {
      registered++;
      console.log(`   ✅ ${law.law_name}`);
    }
  }

  console.log(`\n🎉 ${registered}건 등록 완료`);
  console.log('\n다음 단계:');
  console.log('  1. npx ts-node scripts/sync-pending-laws.ts  # 등록된 법률 동기화');
  console.log('  2. list_pending_changes MCP 도구로 확인');

  db.close();
}

// CLI 실행
const args = process.argv.slice(2);
const keywordsIndex = args.indexOf('--keywords');
const keywords = keywordsIndex >= 0 && args[keywordsIndex + 1]
  ? args[keywordsIndex + 1].split(',').map(k => k.trim())
  : undefined;

discoverPendingLaws({ keywords }).catch(console.error);
