/**
 * Phase 2: 판례 검색 API
 *
 * 대법원 API를 기반으로 한 판례 검색 기능을 제공합니다
 * - 키워드 검색 (판례명, 본문)
 * - 법원별 필터링
 * - 날짜 범위 검색
 * - 사건종류별 검색
 */

import {
  searchPrecedents,
  getPrecedentDetail,
  searchAllPrecedentTypes,
  searchNTSPrecedents,
  searchIndustrialAccidentPrecedents,
  PrecedentListItem,
  PrecedentDetail,
  PrecedentSearchOptions
} from './precedent-api';

/**
 * 판례 검색 옵션
 */
export interface PrecedentSearchParams {
  query: string;
  caseType?: string; // 민사, 형사, 행정 등
  court?: string;    // 법원명
  startDate?: string; // YYYYMMDD 형식
  endDate?: string;   // YYYYMMDD 형식
  searchType?: 'title' | 'fulltext'; // 제목검색 또는 본문검색
  limit?: number;
  page?: number;
}

/**
 * 판례 검색 결과
 */
export interface PrecedentSearchResult {
  total: number;
  results: PrecedentListItem[];
  executionTime?: number;
}

/**
 * 판례 상세 정보
 */
export interface PrecedentDetailResult {
  id: number;
  caseNumber: string;
  caseName: string;
  decisionDate: string;
  courtName: string;
  caseType: string;
  judgmentType?: string;
  fullText?: string;
  summary?: string;
  relatedLaws?: string[];
}

/**
 * 판례명으로 검색 (제목검색)
 */
export async function searchPrecedentsByTitle(
  query: string,
  limit: number = 20,
  page: number = 1
): Promise<PrecedentSearchResult> {
  try {
    const startTime = Date.now();

    const results = await searchPrecedents(query, {
      display: limit,
      page,
      search: 1 // 판례명 검색
    });

    const executionTime = Date.now() - startTime;

    return {
      total: results.length,
      results,
      executionTime
    };
  } catch (error) {
    console.error('판례 제목 검색 오류:', error);
    throw error;
  }
}

/**
 * 본문으로 검색 (전문검색)
 */
export async function searchPrecedentsByFulltext(
  query: string,
  limit: number = 20,
  page: number = 1
): Promise<PrecedentSearchResult> {
  try {
    const startTime = Date.now();

    const results = await searchPrecedents(query, {
      display: limit,
      page,
      search: 2 // 본문 검색
    });

    const executionTime = Date.now() - startTime;

    return {
      total: results.length,
      results,
      executionTime
    };
  } catch (error) {
    console.error('판례 본문 검색 오류:', error);
    throw error;
  }
}

/**
 * 종합 판례 검색 (여러 법원 통합)
 */
export async function searchPrecedentsComprehensive(
  query: string,
  limit: number = 20
): Promise<PrecedentSearchResult> {
  try {
    const startTime = Date.now();

    const results = await searchAllPrecedentTypes(query, undefined, limit);

    const executionTime = Date.now() - startTime;

    return {
      total: results.length,
      results: results as any,
      executionTime
    };
  } catch (error) {
    console.error('종합 판례 검색 오류:', error);
    throw error;
  }
}

/**
 * 특정 판례 상세 정보 조회
 */
export async function getPrecedent(
  caseNumber: string
): Promise<PrecedentDetailResult | null> {
  try {
    // 우선 간단한 검색으로 기본 정보 조회
    const results = await searchPrecedents(caseNumber, {
      search: 1,
      display: 5
    });

    if (results.length === 0) {
      return null;
    }

    const precedent = results[0];

    return {
      id: precedent.판례일련번호,
      caseNumber: precedent.사건번호,
      caseName: precedent.사건명,
      decisionDate: precedent.선고일자,
      courtName: precedent.법원명,
      caseType: precedent.사건종류명,
      judgmentType: precedent.판결유형,
      summary: precedent.판시사항
    };
  } catch (error) {
    console.error('판례 상세 조회 오류:', error);
    throw error;
  }
}

/**
 * 세금 판례 검색 (국세청)
 */
export async function searchTaxPrecedents(
  query: string,
  limit: number = 20
): Promise<PrecedentSearchResult> {
  try {
    const startTime = Date.now();

    const results = await searchNTSPrecedents(query, limit);

    const executionTime = Date.now() - startTime;

    return {
      total: results.length,
      results: results as any,
      executionTime
    };
  } catch (error) {
    console.error('세금 판례 검색 오류:', error);
    throw error;
  }
}

/**
 * 산업재해 판례 검색
 */
export async function searchAccidentPrecedents(
  query: string,
  limit: number = 20
): Promise<PrecedentSearchResult> {
  try {
    const startTime = Date.now();

    const results = await searchIndustrialAccidentPrecedents(query, limit);

    const executionTime = Date.now() - startTime;

    return {
      total: results.length,
      results: results as any,
      executionTime
    };
  } catch (error) {
    console.error('산업재해 판례 검색 오류:', error);
    throw error;
  }
}

/**
 * 통합 판례 검색 (모든 옵션 지원)
 */
export async function searchPrecedentsAdvanced(
  params: PrecedentSearchParams
): Promise<PrecedentSearchResult> {
  try {
    const startTime = Date.now();

    const options: PrecedentSearchOptions = {
      display: params.limit || 20,
      page: params.page || 1,
      search: params.searchType === 'title' ? 1 : 2,
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate })
    };

    const results = await searchPrecedents(params.query, options);

    // 결과 필터링
    let filtered = results;

    if (params.caseType) {
      filtered = filtered.filter(p => p.사건종류명?.includes(params.caseType!));
    }

    if (params.court) {
      filtered = filtered.filter(p => p.법원명?.includes(params.court!));
    }

    const executionTime = Date.now() - startTime;

    return {
      total: filtered.length,
      results: filtered,
      executionTime
    };
  } catch (error) {
    console.error('통합 판례 검색 오류:', error);
    throw error;
  }
}

/**
 * 주요 판례 키워드 (미리 정의된 검색어)
 */
export const COMMON_PRECEDENT_KEYWORDS = [
  '계약',
  '손해배상',
  '소유권',
  '채무',
  '채권',
  '상속',
  '혼인',
  '이혼',
  '형사',
  '사기',
  '절도',
  '강도',
  '폭행',
  '명예훼손',
  '저작권',
  '특허',
  '상표',
  '노동',
  '근로',
  '해고',
  '임금',
  '세금',
  '부가가치세',
  '소득세',
  '행정소송',
  '취소소송',
  '처분소송'
];

/**
 * 주요 법원 목록
 */
export const MAJOR_COURTS = [
  '대법원',
  '서울고등법원',
  '서울중앙지방법원',
  '서울동부지방법원',
  '서울서부지방법원',
  '서울남부지방법원',
  '인천지방법원',
  '수원지방법원',
  '의정부지방법원',
  '대전지방법원',
  '대구지방법원',
  '부산지방법원',
  '광주지방법원',
  '전주지방법원',
  '울산지방법원',
  '춘천지방법원'
];
