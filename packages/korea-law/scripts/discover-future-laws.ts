/**
 * 미래 시행 법률 자동 발견 스크립트 (전체 스캔 방식)
 *
 * 국가법령정보센터 API는 시행일 기준 필터링을 지원하지 않으므로,
 * 전체 법령을 스캔하여 시행일이 미래인 법률을 찾습니다.
 *
 * 핵심 기능:
 * 1. 전체 법령 스캔 (페이지네이션)
 * 2. 클라이언트 사이드 필터링 (시행일 > 오늘)
 * 3. 신규 제정 vs 개정 구분 (제정·개정구분 필드)
 * 4. 부칙에서 폐지 조항 탐지
 *
 * 사용법:
 *   npx ts-node scripts/discover-future-laws.ts
 *   npx ts-node scripts/discover-future-laws.ts --months 6
 *   npx ts-node scripts/discover-future-laws.ts --max-pages 10  # 테스트용: 10페이지만
 */

import Database from 'better-sqlite3';
import { parseStringPromise } from 'xml2js';
import path from 'path';

const DB_PATH = path.join(__dirname, '../data/korea-law.db');
const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const SEARCH_URL = 'http://www.law.go.kr/DRF/lawSearch.do';
const SERVICE_URL = 'http://www.law.go.kr/DRF/lawService.do';
const PAGE_SIZE = 100; // API 최대 페이지 크기

interface DiscoveredLaw {
  mst_id: string;
  law_id: string;
  law_name: string;
  law_type: string;
  ministry: string;
  promulgation_date: string;
  promulgation_no: string;
  enforcement_date: string;
  enactment_type: string; // 제정 or 개정
  days_until_effective: number;
}

interface RepealInfo {
  target_law_name: string;
  repeal_date: string;
  repeal_provision: string;
}

// 날짜 계산 유틸리티
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function parseDateString(dateStr: string): Date {
  if (!dateStr || dateStr.length < 8) return new Date(0);
  const y = parseInt(dateStr.substring(0, 4));
  const m = parseInt(dateStr.substring(4, 6)) - 1;
  const d = parseInt(dateStr.substring(6, 8));
  return new Date(y, m, d);
}

function getDaysUntil(dateStr: string): number {
  const target = parseDateString(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// 전체 법령 스캔 (페이지네이션)
async function fetchAllLaws(maxPages?: number): Promise<any[]> {
  const allLaws: any[] = [];
  let page = 1;
  let totalCount = 0;
  let hasMore = true;

  console.log(`📡 전체 법령 스캔 시작...`);
  console.log(`   (API는 시행일 필터링을 지원하지 않으므로 전체 스캔 후 클라이언트 필터링)`);

  while (hasMore) {
    const url = `${SEARCH_URL}?OC=${API_KEY}&target=law&type=XML&display=${PAGE_SIZE}&page=${page}`;

    try {
      const response = await fetch(url);
      const xmlText = await response.text();

      // 에러 응답 체크
      if (xmlText.includes('OpenAPI_ServiceResponse')) {
        const result = await parseStringPromise(xmlText, { explicitArray: false });
        const errMsg = result.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg;
        console.error(`   ❌ API 오류: ${errMsg || '알 수 없는 오류'}`);
        break;
      }

      const result = await parseStringPromise(xmlText, { explicitArray: false });

      if (page === 1) {
        totalCount = parseInt(result.LawSearch?.totalCnt || '0');
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        console.log(`   총 ${totalCount}건 (${totalPages} 페이지)`);
      }

      if (!result.LawSearch || !result.LawSearch.law) {
        hasMore = false;
        break;
      }

      const laws = Array.isArray(result.LawSearch.law)
        ? result.LawSearch.law
        : [result.LawSearch.law];

      allLaws.push(...laws);

      // 진행 상황 표시
      if (page % 10 === 0) {
        console.log(`   📊 ${page} 페이지 완료 (${allLaws.length}/${totalCount}건)`);
      }

      // 다음 페이지 확인
      if (allLaws.length >= totalCount) {
        hasMore = false;
      } else if (maxPages && page >= maxPages) {
        console.log(`   ⚠️  최대 페이지 제한 도달 (${maxPages} 페이지)`);
        hasMore = false;
      } else {
        page++;
        // API 호출 간 딜레이 (rate limiting 방지)
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (error) {
      console.error(`   ❌ 페이지 ${page} 조회 실패:`, error);
      break;
    }
  }

  console.log(`   ✅ 총 ${allLaws.length}건 조회 완료`);
  return allLaws;
}

// 시행예정 법률 필터링
function filterPendingLaws(laws: any[], months: number = 6): any[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cutoffDate = new Date(today);
  cutoffDate.setMonth(cutoffDate.getMonth() + months);

  const pending: any[] = [];

  for (const law of laws) {
    const enforcementDate = law.시행일자 || '';
    if (!enforcementDate) continue;

    const effDate = parseDateString(enforcementDate);

    // 오늘보다 미래이고, 지정된 개월 내인 법률만
    if (effDate > today && effDate <= cutoffDate) {
      pending.push(law);
    }
  }

  return pending;
}

// lawService API로 상세 정보 조회
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
    console.error(`   상세 조회 실패 (MST=${mstId}):`, error);
    return null;
  }
}

// 부칙에서 폐지 조항 탐지
function parseRepealProvisions(lawData: any): RepealInfo[] {
  const repeals: RepealInfo[] = [];

  // 부칙 섹션 찾기
  const addenda = lawData.부칙 || lawData.Addenda;
  if (!addenda) return repeals;

  const addendaList = Array.isArray(addenda) ? addenda : [addenda];

  for (const addendum of addendaList) {
    const content = addendum.부칙내용 || addendum.AddendaContent || '';

    // 폐지 키워드 탐지
    const repealKeywords = ['폐지한다', '폐지된다', '폐기한다', '효력을 잃는다', '삭제한다'];

    for (const keyword of repealKeywords) {
      if (content.includes(keyword)) {
        // 폐지 대상 법률명 추출 시도 (간단한 패턴 매칭)
        const lawNameMatch = content.match(/「([^」]+)」/);
        if (lawNameMatch) {
          repeals.push({
            target_law_name: lawNameMatch[1],
            repeal_date: lawData.기본정보?.시행일자 || '',
            repeal_provision: content.substring(0, 200), // 처음 200자만
          });
        }
      }
    }
  }

  return repeals;
}

// 이미 등록된 법률인지 확인
function isAlreadyRegistered(db: Database.Database, mstId: string): boolean {
  const existing = db.prepare(`
    SELECT 1 FROM PendingLawRegistry WHERE mst_id = ?
    UNION
    SELECT 1 FROM Laws WHERE law_mst_id = ?
  `).get(mstId, mstId);

  return !!existing;
}

// 발견된 법률 등록
function registerDiscoveredLaw(db: Database.Database, law: DiscoveredLaw): boolean {
  try {
    const effDateFormatted = `${law.enforcement_date.substring(0, 4)}-${law.enforcement_date.substring(4, 6)}-${law.enforcement_date.substring(6, 8)}`;
    const promDateFormatted = law.promulgation_date ?
      `${law.promulgation_date.substring(0, 4)}-${law.promulgation_date.substring(4, 6)}-${law.promulgation_date.substring(6, 8)}` : null;

    const stmt = db.prepare(`
      INSERT INTO PendingLawRegistry (
        mst_id, law_id, law_name, law_type, ministry,
        promulgation_date, promulgation_no, effective_date,
        registration_source, registration_reason, registered_by,
        tags, source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AUTO_DETECT', ?, 'discover-future-laws', ?, ?)
    `);

    const reason = law.enactment_type === '제정'
      ? `신규 제정 법률 (${law.days_until_effective}일 후 시행)`
      : `개정 법률 (${law.days_until_effective}일 후 시행)`;

    const tags = JSON.stringify([law.enactment_type, law.law_type]);

    stmt.run(
      law.mst_id,
      law.law_id,
      law.law_name,
      law.law_type,
      law.ministry,
      promDateFormatted,
      law.promulgation_no,
      effDateFormatted,
      reason,
      tags,
      `https://www.law.go.kr/lsInfoP.do?lsiSeq=${law.mst_id}`
    );

    return true;
  } catch (error) {
    console.error(`   등록 실패 (${law.law_name}):`, error);
    return false;
  }
}

// 폐지 정보 등록
function registerRepealInfo(db: Database.Database, repeal: RepealInfo, replacingMstId: string): boolean {
  try {
    // 폐지 대상 법률 찾기
    const targetLaw = db.prepare(`
      SELECT id, law_mst_id FROM Laws
      WHERE law_name LIKE ?
      LIMIT 1
    `).get(`%${repeal.target_law_name}%`) as any;

    const stmt = db.prepare(`
      INSERT INTO RepealRegistry (
        target_law_id, target_mst_id, target_law_name,
        replacing_mst_id, repeal_provision, repeal_date,
        repeal_type, registration_source, detection_method, registered_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'SUPERSEDE', 'AUTO_DETECT', 'ADDENDA_PARSING', 'discover-future-laws')
    `);

    const repealDateFormatted = repeal.repeal_date ?
      `${repeal.repeal_date.substring(0, 4)}-${repeal.repeal_date.substring(4, 6)}-${repeal.repeal_date.substring(6, 8)}` : null;

    stmt.run(
      targetLaw?.id || null,
      targetLaw?.law_mst_id || repeal.target_law_name,
      repeal.target_law_name,
      replacingMstId,
      repeal.repeal_provision,
      repealDateFormatted
    );

    return true;
  } catch (error) {
    console.error(`   폐지 정보 등록 실패:`, error);
    return false;
  }
}

// 메인 함수
async function discoverFutureLaws(options: {
  months?: number;
  maxPages?: number;
  skipDetail?: boolean;
}) {
  const db = new Database(DB_PATH);
  const months = options.months || 6; // 기본 6개월

  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setMonth(cutoffDate.getMonth() + months);

  console.log('🔍 미래 시행 법률 자동 발견 (전체 스캔 방식)\n');
  console.log(`📅 검색 범위: 오늘(${formatDate(today)}) ~ ${months}개월 후(${formatDate(cutoffDate)})\n`);

  // 전체 법령 조회
  const allLaws = await fetchAllLaws(options.maxPages);

  // 시행예정 법률 필터링
  console.log('\n🔎 시행예정 법률 필터링 중...');
  const pendingLaws = filterPendingLaws(allLaws, months);
  console.log(`   ✅ ${pendingLaws.length}건 시행예정 법률 발견\n`);

  const discovered: DiscoveredLaw[] = [];
  const repeals: Array<{ repeal: RepealInfo; replacingMstId: string }> = [];
  const seenMsts = new Set<string>();

  for (const result of pendingLaws) {
    const mstId = result.법령일련번호 || '';
    const lawId = result.법령ID || '';

    if (!mstId || seenMsts.has(mstId)) continue;
    seenMsts.add(mstId);

    // 이미 등록된 법률 건너뛰기
    if (isAlreadyRegistered(db, mstId)) {
      continue;
    }

    const lawName = result.법령명한글 || result.법령명 || '';
    const enforcementDate = result.시행일자 || '';
    const daysUntil = getDaysUntil(enforcementDate);

    // 미래 시행만 처리 (이중 확인)
    if (daysUntil <= 0) continue;

    console.log(`   📋 ${lawName}`);
    console.log(`      MST: ${mstId}, 시행일: ${enforcementDate} (${daysUntil}일 후)`);

    const law: DiscoveredLaw = {
      mst_id: mstId,
      law_id: lawId,
      law_name: lawName,
      law_type: result.법령구분명 || result.법령종류 || '',
      ministry: result.소관부처명 || result.소관부처 || '',
      promulgation_date: result.공포일자 || '',
      promulgation_no: result.공포번호 || '',
      enforcement_date: enforcementDate,
      enactment_type: result.제개정구분명 || result['제정·개정구분'] || result.제정개정구분 || '개정',
      days_until_effective: daysUntil,
    };

    discovered.push(law);

    // 상세 정보 조회하여 부칙 파싱 (선택적)
    if (!options.skipDetail) {
      const detail = await getLawDetail(mstId);
      if (detail) {
        const repealInfos = parseRepealProvisions(detail);
        for (const repeal of repealInfos) {
          repeals.push({ repeal, replacingMstId: mstId });
          console.log(`      ⚠️  폐지 탐지: ${repeal.target_law_name}`);
        }
      }

      // API 호출 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 발견 결과 요약\n`);
  console.log(`   - 전체 스캔: ${allLaws.length}건`);
  console.log(`   - 시행예정 필터: ${pendingLaws.length}건`);
  console.log(`   - 신규 발견: ${discovered.length}건`);
  console.log(`   - 폐지예정 탐지: ${repeals.length}건`);

  if (discovered.length === 0 && repeals.length === 0) {
    console.log('\nℹ️  새로운 시행예정/폐지예정 법률이 없습니다.');
    db.close();
    return;
  }

  // 신규 vs 개정 분류
  const newEnactments = discovered.filter(l => l.enactment_type === '제정');
  const amendments = discovered.filter(l => l.enactment_type !== '제정');

  if (newEnactments.length > 0) {
    console.log(`\n📜 신규 제정 법률 (${newEnactments.length}건):`);
    newEnactments.forEach(l => {
      console.log(`   - ${l.law_name} (${l.days_until_effective}일 후)`);
    });
  }

  if (amendments.length > 0) {
    console.log(`\n✏️  개정 법률 (${amendments.length}건):`);
    amendments.slice(0, 20).forEach(l => {
      console.log(`   - ${l.law_name} (${l.days_until_effective}일 후)`);
    });
    if (amendments.length > 20) {
      console.log(`   ... 외 ${amendments.length - 20}건`);
    }
  }

  // 등록
  console.log('\n📝 PendingLawRegistry에 등록 중...');
  let registered = 0;
  for (const law of discovered) {
    if (registerDiscoveredLaw(db, law)) {
      registered++;
    }
  }
  console.log(`   ✅ 시행예정: ${registered}건 등록`);

  // 폐지 정보 등록
  if (repeals.length > 0) {
    console.log('\n📝 RepealRegistry에 등록 중...');
    let repealRegistered = 0;
    for (const { repeal, replacingMstId } of repeals) {
      if (registerRepealInfo(db, repeal, replacingMstId)) {
        repealRegistered++;
      }
    }
    console.log(`   ✅ 폐지예정: ${repealRegistered}건 등록`);
  }

  console.log('\n🎉 완료!\n');
  console.log('다음 단계:');
  console.log('  1. npx ts-node scripts/sync-pending-laws.ts  # 등록된 법률 상세 동기화');
  console.log('  2. list_pending_changes MCP 도구로 확인');

  db.close();
}

// CLI 파싱
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : undefined;
};

const options = {
  months: getArg('months') ? parseInt(getArg('months')!) : undefined,
  maxPages: getArg('max-pages') ? parseInt(getArg('max-pages')!) : undefined,
  skipDetail: args.includes('--skip-detail'),
};

discoverFutureLaws(options).catch(console.error);
