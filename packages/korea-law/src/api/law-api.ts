/**
 * korea-law: 국가법령정보센터 API 연동 모듈
 *
 * 공식 API 문서: https://www.law.go.kr/LSW/openApi.do
 *
 * ⚠️ 중요 - API 인증 요구사항:
 * 1. API 키 필요 (https://open.law.go.kr에서 무료 발급)
 * 2. Referer 헤더 필수! (API 신청 시 등록한 도메인과 일치해야 함)
 * 3. 법령종류 체크 필수! (open.law.go.kr > OPEN API 신청 > 법령종류 선택)
 *
 * 환경변수:
 * - KOREA_LAW_API_KEY: API 키 (이메일 ID)
 * - KOREA_LAW_REFERER: 등록된 도메인 (예: https://ainote.dev)
 *
 * ⚠️ "미신청된 목록/본문에 대한 접근입니다" 에러 발생 시:
 *    → Referer 헤더가 누락되었거나, 등록 도메인과 불일치
 *    → open.law.go.kr에서 법령종류 체크 여부 확인
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { XMLParser } from 'fast-xml-parser';

const BASE_URL = 'http://www.law.go.kr/DRF';

// ⚠️ API 키: 환경변수 설정 필수 (open.law.go.kr에서 발급)
const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';

// ⚠️ Referer 헤더 필수! API 신청 시 등록한 도메인과 반드시 일치해야 함
// 이 헤더가 없거나 불일치하면 "미신청된 목록/본문" 에러 발생
const REFERER = process.env.KOREA_LAW_REFERER || 'https://ainote.dev';

// Retry 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1초
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// XML Parser 설정
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  trimValues: true,
});

// API 클라이언트
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/xml',
    'Referer': REFERER,
  },
});

// ============================================
// Retry 로직 구현
// ============================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      
      // 재시도 가능한 에러인지 확인
      const isRetryable = 
        !status || // 네트워크 에러
        RETRY_CONFIG.retryableStatuses.includes(status) ||
        axiosError.code === 'ECONNRESET' ||
        axiosError.code === 'ETIMEDOUT' ||
        axiosError.code === 'ECONNABORTED';
      
      if (!isRetryable || attempt === RETRY_CONFIG.maxRetries) {
        console.error(`[${context}] 최종 실패 (시도 ${attempt}/${RETRY_CONFIG.maxRetries}):`, 
          axiosError.message || error);
        throw error;
      }
      
      // 지수 백오프
      const delay = RETRY_CONFIG.retryDelay * Math.pow(2, attempt - 1);
      console.warn(`[${context}] 재시도 ${attempt}/${RETRY_CONFIG.maxRetries} (${delay}ms 후)...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// ============================================
// 타입 정의
// ============================================

export interface LawListItem {
  법령일련번호: string;
  현행연혁코드: string;
  법령명한글: string;
  법령명약칭: string;
  법령ID: number;
  공포일자: string;
  공포번호: number;
  제개정구분명: string;
  소관부처명: string;
  법령구분명: string;
  시행일자: string;
  자법타법여부: string;
  법령상세링크: string;
}

export interface LawDetail {
  기본정보: {
    법령ID: number;
    법령명_한글: string;
    법령명_영문?: string;
    법령약칭명?: string;
    공포일자: string;
    공포번호: number;
    시행일자: string;
    소관부처명: string;
    법령구분명: string;
  };
  조문: ArticleInfo[];
}

export interface ArticleInfo {
  조문번호: string;
  조문가지번호?: string;  // 분기조문 (예: 347의2의 "2")
  조문여부: string;
  조문제목?: string;
  조문내용: string;
  항?: ParagraphInfo[];
}

export interface ParagraphInfo {
  항번호: string;
  항내용: string;
  호?: SubItemInfo[];
}

export interface SubItemInfo {
  호번호: string;
  호내용: string;
  목?: MokInfo[];
}

export interface MokInfo {
  목번호: string;
  목내용: string;
}

export interface PrecedentItem {
  판례일련번호: number;
  사건번호: string;
  사건명: string;
  선고일자: string;
  법원명: string;
  사건종류명: string;
  판결유형: string;
  판시사항?: string;
  판결요지?: string;
  참조조문?: string;
  참조판례?: string;
}

export interface PrecedentDetail {
  판례일련번호: number;
  사건번호: string;
  사건명: string;
  선고일자: string;
  법원명: string;
  사건종류명: string;
  판결유형: string;
  판시사항?: string;
  판결요지?: string;
  참조조문?: string;
  참조판례?: string;
  판례내용?: string;  // 전문 (Full Text)
}

export interface PrecedentSearchOptions {
  /** 1=판례명 검색, 2=본문검색 */
  search?: 1 | 2;
  /** 법원종류 (예: 400201=대법원, 400202=하위법원) */
  org?: string;
  /** 법원명 (API에서 nw 파라미터 사용) */
  nw?: string;
  /** 참조법령명 */
  JO?: string;
  /** 사건번호 */
  nb?: string;
  /** 데이터 출처명 */
  datSrcNm?: string;
  /** 정렬 */
  sort?: string;
  /** 사전식 검색 */
  gana?: string;
  /** 선고일자 */
  date?: string;
  /** 선고일자 범위 */
  prncYd?: string;
 }

export interface OrdinanceListItem {
  자치법규ID: number;
  자치법규명: string;
  공포일자: string;
  공포번호: string;
  지자체기관명: string;
  자치법규종류명: string;
  시행일자: string;
  자치법규상세링크: string;
}

export interface OrdinanceDetail {
  기본정보: {
    자치법규ID: number;
    자치법규명: string;
    공포일자: string;
    공포번호: string;
    지자체기관명: string;
    자치법규종류명: string;
    시행일자: string;
  };
  조문: ArticleInfo[];
}

// ============================================
// 행정규칙 (Admin Rules) & 법령해석 (Interpretations) 타입
// ============================================

export interface AdminRuleListItem {
  행정규칙일련번호: number;
  행정규칙명: string;
  제개정구분명: string;
  발령일자: string;
  발령번호: string;
  담당부서기관명: string; // 소관부처
  행정규칙종류명: string; // 고시, 훈령, 예규 등
  시행일자: string;
  행정규칙상세링크: string;
}

export interface AdminRuleDetail {
  기본정보: {
    행정규칙일련번호: number;
    행정규칙명: string;
    제개정구분명: string;
    발령일자: string;
    발령번호: string;
    담당부서기관명: string;
    시행일자: string;
  };
  조문: ArticleInfo[];
  전문?: string;
}

export interface InterpretationListItem {
  법령해석일련번호: number;
  안건번호: string;
  안건명: string;
  해석일자: string;
  심의기관명: string; // 법제처 등
  법령해석상세링크: string;
}

export interface InterpretationDetail {
  법령해석일련번호: number;
  안건번호: string;
  안건명: string;
  해석일자: string;
  주문?: string;
  이유?: string;
  관계법령?: string;
}

// ============================================
// API 함수들
// ============================================

/**
 * 법령 목록 조회
 * @param query 검색어 (법령명)
 * @param display 결과 개수 (기본 100)
 */
export async function searchLaws(query: string, display: number = 100): Promise<LawListItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'XML',
        query: query,
        display: display,
        sort: 'efcdt', // 시행일자순
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawSearch?.law;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLaws(${query})`);
}

/**
 * 법령 상세 조회 (조문 포함)
 * @param lawId 법령 ID
 */
export async function getLawDetail(lawId: number | string): Promise<LawDetail | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'XML',
        ID: lawId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const law = parsed?.법령;

    if (!law) return null;

    // 기본정보 추출
    const 기본정보 = law.기본정보 || {};
    const 조문목록 = law.조문 || {};

    // 조문 파싱
    const articles: ArticleInfo[] = [];
    const 조문단위 = 조문목록.조문단위;

    if (조문단위) {
      const 조문배열 = Array.isArray(조문단위) ? 조문단위 : [조문단위];
      
      for (const 조문 of 조문배열) {
        articles.push({
          조문번호: 조문.조문번호 || '',
          조문가지번호: 조문.조문가지번호 || undefined,  // 분기조문 (예: 347의2)
          조문여부: 조문.조문여부 || '',
          조문제목: 조문.조문제목,
          조문내용: extractTextContent(조문.조문내용),
          항: parseHangItems(조문.항),
        });
      }
    }

    return {
      기본정보: {
        법령ID: 기본정보.법령ID,
        법령명_한글: 기본정보.법령명_한글,
        법령명_영문: 기본정보.법령명_영문,
        법령약칭명: 기본정보.법령약칭명,
        공포일자: 기본정보.공포일자,
        공포번호: 기본정보.공포번호,
        시행일자: 기본정보.시행일자,
        소관부처명: 기본정보.소관부처명,
        법령구분명: 기본정보.법령구분명,
      },
      조문: articles,
    };
  }, `getLawDetail(${lawId})`);
}

/**
 * 판례 검색
 * @param query 검색어 (사건번호, 키워드 등)
 */
export async function searchPrecedents(
  query: string,
  display: number = 100,
  options: PrecedentSearchOptions = {}
): Promise<PrecedentItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'prec',
        type: 'XML',
        query: query,
        display: display,
        // mcp-kr-legislation과 동일하게 기본은 본문 검색으로 설정(누락 방지)
        search: options.search ?? 2,
        org: options.org,
        nw: options.nw,
        JO: options.JO,
        nb: options.nb,
        datSrcNm: options.datSrcNm,
        sort: options.sort,
        gana: options.gana,
        date: options.date,
        prncYd: options.prncYd,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.PrecSearch?.prec;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchPrecedents(${query})`);
}

/**
 * 판례 존재 여부 확인 (사건번호로)
 * @param caseNumber 사건번호 (예: 2023다12345)
 */
export async function verifyPrecedentExistsOnline(caseNumber: string): Promise<boolean> {
  try {
    const normalized = caseNumber.replace(/\s+/g, '');

    // 사건번호 전용 파라미터(nb)를 우선 사용 (mcp-kr-legislation과 동일한 방식)
    // 일부 데이터소스는 query 매칭보다 nb 매칭이 더 정확합니다.
    let results = await searchPrecedents(caseNumber, 10, { nb: normalized, search: 1 });

    // 폴백: nb 필터가 적용되지 않는 케이스를 위해 일반 검색도 시도
    if (results.length === 0) {
      results = await searchPrecedents(caseNumber, 10);
    }

    // 정확한 사건번호 매칭 확인
    return results.some(item =>
      item.사건번호.replace(/\s+/g, '') === normalized
    );
  } catch (error) {
    console.error('판례 존재 확인 실패:', error);
    return false;
  }
}

/**
 * 판례 전문 조회 (판례일련번호로)
 * @param precedentId 판례일련번호
 * @returns 판례 상세 정보 (전문 포함)
 */
export async function getPrecedentDetail(precedentId: number): Promise<PrecedentDetail | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'prec',
        type: 'XML',
        ID: precedentId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const prec = parsed?.판례 || parsed?.PrecService;

    if (!prec) return null;

    return {
      판례일련번호: precedentId,
      사건번호: prec.사건번호 || '',
      사건명: prec.판례명 || prec.사건명 || '',
      선고일자: prec.선고일자 || '',
      법원명: prec.법원명 || '',
      사건종류명: prec.사건종류명 || '',
      판결유형: prec.판결유형 || '',
      판시사항: prec.판시사항 || '',
      판결요지: prec.판결요지 || '',
      참조조문: prec.참조조문 || '',
      참조판례: prec.참조판례 || '',
      판례내용: prec.판례내용 || prec.전문 || '',  // 전문
    };
  }, `getPrecedentDetail(${precedentId})`);
}

/**
 * 자치법규 목록 조회
 * @param options 검색 옵션
 */
export async function searchOrdinances(options: {
  query?: string;
  orgCode?: string;  // 지자체 코드
  display?: number;
  page?: number;
}): Promise<OrdinanceListItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'ordin',
        type: 'XML',
        query: options.query || '*',
        org: options.orgCode,
        display: options.display || 100,
        page: options.page || 1,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.OrdinSearch?.ordin;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchOrdinances(${JSON.stringify(options)})`);
}

/**
 * 행정규칙 검색 (훈령/예규/고시)
 * @param query 검색어
 */
export async function searchAdminRules(query: string, display: number = 100): Promise<AdminRuleListItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'admrul', // 행정규칙
        type: 'XML',
        query: query,
        display: display,
        sort: 'date', // 최신순
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.AdmrulSearch?.admrul;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchAdminRules(${query})`);
}

/**
 * 행정규칙 상세 조회
 */
export async function getAdminRuleDetail(adminRuleId: number): Promise<AdminRuleDetail | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'admrul',
        type: 'XML',
        ID: adminRuleId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const rule = parsed?.행정규칙;

    if (!rule) return null;

    // 조문 파싱 (법령과 유사 구조 가정)
    const articles: ArticleInfo[] = [];
    const 조문목록 = rule.조문 || {};
    const 조문단위 = 조문목록.조문단위;

    if (조문단위) {
      const 조문배열 = Array.isArray(조문단위) ? 조문단위 : [조문단위];
      for (const 조문 of 조문배열) {
        articles.push({
          조문번호: 조문.조문번호 || '',
          조문가지번호: 조문.조문가지번호 || undefined,  // 분기조문 (예: 347의2)
          조문여부: 조문.조문여부 || '',
          조문제목: 조문.조문제목,
          조문내용: extractTextContent(조문.조문내용),
          항: parseHangItems(조문.항),
        });
      }
    }

    return {
      기본정보: {
        행정규칙일련번호: rule.기본정보?.행정규칙일련번호,
        행정규칙명: rule.기본정보?.행정규칙명,
        제개정구분명: rule.기본정보?.제개정구분명,
        발령일자: rule.기본정보?.발령일자,
        발령번호: rule.기본정보?.발령번호,
        담당부서기관명: rule.기본정보?.담당부서기관명,
        시행일자: rule.기본정보?.시행일자,
      },
      조문: articles,
      전문: rule.전문, // 조문 외 통으로 된 내용이 있을 수 있음
    };
  }, `getAdminRuleDetail(${adminRuleId})`);
}

/**
 * 법령해석례 검색
 */
export async function searchInterpretations(query: string, display: number = 50): Promise<InterpretationListItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'exp', // 법령해석
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.ExpSearch?.exp;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchInterpretations(${query})`);
}

/**
 * 법령해석례 상세 조회
 */
export async function getInterpretationDetail(interpId: number): Promise<InterpretationDetail | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'exp',
        type: 'XML',
        ID: interpId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const data = parsed?.법령해석례;

    if (!data) return null;

    return {
      법령해석일련번호: interpId,
      안건번호: data.안건번호,
      안건명: data.안건명,
      해석일자: data.해석일자,
      주문: extractTextContent(data.주문),
      이유: extractTextContent(data.이유),
      관계법령: extractTextContent(data.관계법령),
    };
  }, `getInterpretationDetail(${interpId})`);
}

/**
 * 자치법규 상세 조회
 * @param ordinanceId 자치법규 ID
 */
export async function getOrdinanceDetail(ordinanceId: number): Promise<OrdinanceDetail | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'ordin',
        type: 'XML',
        ID: ordinanceId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const ordin = parsed?.자치법규;

    if (!ordin) return null;

    // 기본정보 추출
    const 기본정보 = ordin.기본정보 || {};
    const 조문목록 = ordin.조문 || {};

    // 조문 파싱
    const articles: ArticleInfo[] = [];
    const 조문단위 = 조문목록.조문단위;

    if (조문단위) {
      const 조문배열 = Array.isArray(조문단위) ? 조문단위 : [조문단위];

      for (const 조문 of 조문배열) {
        articles.push({
          조문번호: 조문.조문번호 || '',
          조문가지번호: 조문.조문가지번호 || undefined,  // 분기조문 (예: 347의2)
          조문여부: 조문.조문여부 || '',
          조문제목: 조문.조문제목,
          조문내용: extractTextContent(조문.조문내용),
          항: parseHangItems(조문.항),
        });
      }
    }

    return {
      기본정보: {
        자치법규ID: 기본정보.자치법규ID,
        자치법규명: 기본정보.자치법규명,
        공포일자: 기본정보.공포일자,
        공포번호: 기본정보.공포번호,
        지자체기관명: 기본정보.지자체기관명,
        자치법규종류명: 기본정보.자치법규종류명,
        시행일자: 기본정보.시행일자,
      },
      조문: articles,
    };
  }, `getOrdinanceDetail(${ordinanceId})`);
}

/**
 * 최근 개정 법령 목록 조회
 * @param days 최근 n일 이내 (기본 7일)
 */
export async function getRecentlyAmendedLaws(days: number = 7): Promise<LawListItem[]> {
  return requestWithRetry(async () => {
    // 날짜 계산
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDateLocal = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'XML',
        display: 100,
        sort: 'efcdt',
        efYd: formatDateLocal(startDate), // 시행일자 시작
        efYdE: formatDateLocal(endDate),  // 시행일자 끝
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawSearch?.law;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `getRecentlyAmendedLaws(${days}일)`);
}

/**
 * 미래 시행 예정 법률 검색 (efYd/efYdE 파라미터 활용)
 *
 * ⚠️ 주의: efYd/efYdE 파라미터가 API에서 제대로 동작하지 않을 수 있음
 * 대안: discoverPendingLawsByKeywords() 함수 사용 권장
 *
 * @param months 몇 개월 이내 시행 예정 (기본 6개월)
 * @returns 시행 예정 법률 목록
 */
export async function searchFutureLaws(months: number = 6): Promise<LawListItem[]> {
  return requestWithRetry(async () => {
    // 내일부터 n개월 후까지 검색
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // 내일부터 (오늘 시행은 이미 현행)

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const formatDateLocal = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');

    console.log(`🔍 미래 시행 법률 검색: ${formatDateLocal(startDate)} ~ ${formatDateLocal(endDate)}`);

    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'XML',
        display: 100,
        sort: 'date', // 최신 공포순
        efYd: formatDateLocal(startDate),  // 시행일자 시작
        efYdE: formatDateLocal(endDate),   // 시행일자 끝
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawSearch?.law;

    if (!items) {
      console.log('   📭 미래 시행 예정 법률 없음');
      return [];
    }

    const laws = Array.isArray(items) ? items : [items];
    console.log(`   ✅ ${laws.length}건 발견`);
    return laws;
  }, `searchFutureLaws(${months}개월)`);
}

// 시행예정 법률 발견용 기본 키워드 목록
const PENDING_LAW_KEYWORDS = [
  '인공지능', 'AI', '디지털', '플랫폼', '데이터',
  '탄소', '환경', '기후', '에너지',
  '블록체인', '가상자산', '메타버스',
  '자율주행', '드론', '로봇',
  '바이오', '의료기기', '원격의료',
];

/**
 * 시행예정 법률 정보
 */
export interface PendingLawInfo {
  mst_id: string;
  law_id?: number;
  law_name: string;
  promulgation_date?: string;
  enforcement_date: string;
  law_type?: string;
  ministry?: string;
  days_until_effective: number;
}

/**
 * 키워드 기반 시행예정 법률 발견
 *
 * efYd/efYdE 파라미터가 API에서 정상 동작하지 않아 대안으로 구현.
 * 키워드로 검색 후, 각 결과의 상세정보를 조회하여 시행일이 미래인 법률만 반환
 *
 * @param keywords 검색할 키워드 목록 (기본값: PENDING_LAW_KEYWORDS)
 * @param months 몇 개월 이내 시행 예정 (기본 6개월)
 * @param apiDelay API 호출 간 딜레이 (ms)
 * @returns 시행예정 법률 목록
 */
export async function discoverPendingLawsByKeywords(
  keywords: string[] = PENDING_LAW_KEYWORDS,
  months: number = 6,
  apiDelay: number = 300
): Promise<PendingLawInfo[]> {
  const discovered: PendingLawInfo[] = [];
  const seenMsts = new Set<string>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + months);

  console.log(`🔍 키워드 기반 시행예정 법률 발견 (${keywords.length}개 키워드, ${months}개월 이내)`);

  for (const keyword of keywords) {
    try {
      // 1. 키워드로 법률 검색
      const searchResults = await searchLaws(keyword, 50);

      for (const result of searchResults) {
        const mstId = result.법령일련번호 || String(result.법령ID);

        if (!mstId || seenMsts.has(mstId)) continue;
        seenMsts.add(mstId);

        // 2. 상세 정보 조회 (MST 파라미터 사용)
        const detail = await getLawDetailByMst(mstId);
        if (!detail) continue;

        // 3. 시행일 확인
        const enforcementDateStr = detail.기본정보.시행일자;
        if (!enforcementDateStr) continue;

        // YYYYMMDD 형식을 Date로 변환
        const effDateStr = String(enforcementDateStr);
        const year = parseInt(effDateStr.substring(0, 4));
        const month = parseInt(effDateStr.substring(4, 6)) - 1;
        const day = parseInt(effDateStr.substring(6, 8));
        const enforcementDate = new Date(year, month, day);

        // 4. 미래 시행일인지 확인 (오늘 이후 ~ N개월 이내)
        if (enforcementDate > today && enforcementDate <= maxDate) {
          const daysUntil = Math.ceil((enforcementDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          discovered.push({
            mst_id: mstId,
            law_id: detail.기본정보.법령ID,
            law_name: detail.기본정보.법령명_한글,
            promulgation_date: detail.기본정보.공포일자?.toString(),
            enforcement_date: effDateStr,
            law_type: detail.기본정보.법령구분명,
            ministry: detail.기본정보.소관부처명,
            days_until_effective: daysUntil,
          });

          console.log(`   ✨ 발견: ${detail.기본정보.법령명_한글} (${daysUntil}일 후 시행)`);
        }

        // API 호출 간 딜레이
        await sleep(apiDelay);
      }
    } catch (error) {
      console.error(`   ⚠️ "${keyword}" 검색 실패:`, error);
    }
  }

  // 중복 제거 및 시행일순 정렬
  const uniqueLaws = Array.from(
    new Map(discovered.map(law => [law.mst_id, law])).values()
  ).sort((a, b) => a.days_until_effective - b.days_until_effective);

  console.log(`\n📊 총 ${uniqueLaws.length}건의 시행예정 법률 발견`);
  return uniqueLaws;
}

/**
 * 법령 상세 조회 (MST 파라미터 사용 - 시행예정 법률 포함)
 *
 * lawService API에 MST 파라미터를 사용하면 시행예정인 법률도 조회 가능
 * @param mstId 법령일련번호 (MST)
 */
export async function getLawDetailByMst(mstId: string | number): Promise<LawDetail | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'XML',
        MST: mstId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const law = parsed?.법령;

    if (!law) return null;

    // 기본정보 추출
    const 기본정보 = law.기본정보 || {};
    const 조문목록 = law.조문 || {};

    // 조문 파싱 (getLawDetail과 동일한 로직)
    const articles: ArticleInfo[] = [];
    const 조문단위 = 조문목록.조문단위;

    if (조문단위) {
      const items = Array.isArray(조문단위) ? 조문단위 : [조문단위];
      for (const item of items) {
        // 조문여부가 '전문', '편', '장', '절', '관', '부칙'이면 건너뛰기
        const 조문여부 = item.조문여부 || '';
        if (['전문', '편', '장', '절', '관', '부칙'].includes(조문여부)) {
          continue;
        }

        // 조문번호 + 가지번호 조합
        const baseNo = String(item.조문번호 || '');
        const branchNo = item.조문가지번호 ? String(item.조문가지번호) : '';
        const articleNo = branchNo ? `${baseNo}의${branchNo}` : baseNo;

        // 유효한 조문번호인지 확인
        if (!/^\d+/.test(articleNo)) continue;

        articles.push({
          조문번호: articleNo,
          조문제목: item.조문제목 || '',
          조문내용: item.조문내용 || '',
          조문여부: 조문여부,
          조문가지번호: branchNo || undefined,
          항: item.항,
        });
      }
    }

    return {
      기본정보: {
        법령ID: 기본정보.법령ID || 기본정보['법령ID'],
        법령명_한글: 기본정보.법령명_한글 || 기본정보['법령명한글'] || 기본정보.법령명,
        법령명_영문: 기본정보.법령명_영문 || 기본정보['법령명영문'],
        공포일자: 기본정보.공포일자,
        공포번호: 기본정보.공포번호 || 0,
        시행일자: 기본정보.시행일자,
        소관부처명: typeof 기본정보.소관부처 === 'object' ? 기본정보.소관부처['#text'] || '' : 기본정보.소관부처명 || 기본정보.소관부처 || '',
        법령구분명: typeof 기본정보.법종구분 === 'object' ? 기본정보.법종구분['#text'] || '' : 기본정보.법령구분명 || 기본정보.법종구분 || '',
      },
      조문: articles,
    };
  }, `getLawDetailByMst(${mstId})`);
}

// ============================================
// 영문 법령 API (English Laws)
// ============================================

export interface EnglishLawListItem {
  법령ID: number;
  법령명한글: string;
  법령명영문: string;
  공포일자: string;
  시행일자: string;
  소관부처명: string;
  법령구분명: string;
  법령상세링크: string;
}

export interface EnglishLawDetail {
  기본정보: {
    법령ID: number;
    법령명_한글: string;
    법령명_영문: string;
    공포일자: string;
    시행일자: string;
    소관부처명: string;
    법령구분명: string;
  };
  조문: EnglishArticleInfo[];
}

export interface EnglishArticleInfo {
  조문번호: string;
  조문제목_한글?: string;
  조문제목_영문?: string;
  조문내용_한글: string;
  조문내용_영문: string;
}

/**
 * 영문 법령 목록 검색
 * @param query 검색어 (한글 또는 영문 법령명)
 * @param display 결과 개수
 */
export async function searchEnglishLaws(query: string, display: number = 100): Promise<EnglishLawListItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'elaw', // 영문법령
        type: 'XML',
        query: query,
        display: display,
        sort: 'efcdt',
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.ElawSearch?.elaw;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchEnglishLaws(${query})`);
}

/**
 * 영문 법령 상세 조회 (조문 포함)
 * @param lawId 법령 ID
 */
export async function getEnglishLawDetail(lawId: number | string): Promise<EnglishLawDetail | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'elaw',
        type: 'XML',
        ID: lawId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const law = parsed?.영문법령 || parsed?.EnglishLaw;

    if (!law) return null;

    const 기본정보 = law.기본정보 || {};
    const 조문목록 = law.조문 || {};

    // 조문 파싱
    const articles: EnglishArticleInfo[] = [];
    const 조문단위 = 조문목록.조문단위;

    if (조문단위) {
      const 조문배열 = Array.isArray(조문단위) ? 조문단위 : [조문단위];
      
      for (const 조문 of 조문배열) {
        articles.push({
          조문번호: 조문.조문번호 || '',
          조문제목_한글: 조문.조문제목,
          조문제목_영문: 조문.조문제목영문 || 조문.조문제목_영문,
          조문내용_한글: extractTextContent(조문.조문내용),
          조문내용_영문: extractTextContent(조문.조문내용영문 || 조문.조문내용_영문),
        });
      }
    }

    return {
      기본정보: {
        법령ID: 기본정보.법령ID,
        법령명_한글: 기본정보.법령명_한글 || 기본정보.법령명한글,
        법령명_영문: 기본정보.법령명_영문 || 기본정보.법령명영문,
        공포일자: 기본정보.공포일자,
        시행일자: 기본정보.시행일자,
        소관부처명: 기본정보.소관부처명,
        법령구분명: 기본정보.법령구분명,
      },
      조문: articles,
    };
  }, `getEnglishLawDetail(${lawId})`);
}

/**
 * 한글 법령명으로 영문 법령 찾기
 * @param koreanLawName 한글 법령명
 */
export async function findEnglishLawByKoreanName(koreanLawName: string): Promise<EnglishLawDetail | null> {
  const results = await searchEnglishLaws(koreanLawName, 5);
  
  if (results.length === 0) return null;
  
  // 가장 일치하는 결과의 상세 조회
  const bestMatch = results[0];
  return getEnglishLawDetail(bestMatch.법령ID);
}

// ============================================
// 유틸리티 함수
// ============================================

function extractTextContent(content: any): string {
  if (typeof content === 'string') return content;
  if (content?.['#text']) return content['#text'];
  if (Array.isArray(content)) {
    return content.map(extractTextContent).join(' ');
  }
  return String(content || '');
}

function parseHangItems(항: any): ParagraphInfo[] | undefined {
  if (!항) return undefined;
  
  const 항배열 = Array.isArray(항) ? 항 : [항];
  
  return 항배열.map((h: any) => ({
    항번호: h.항번호 || '',
    항내용: extractTextContent(h.항내용),
    호: parseHoItems(h.호),
  }));
}

function parseHoItems(호: any): SubItemInfo[] | undefined {
  if (!호) return undefined;
  
  const 호배열 = Array.isArray(호) ? 호 : [호];
  
  return 호배열.map((h: any) => ({
    호번호: h.호번호 || '',
    호내용: extractTextContent(h.호내용),
    목: parseMokItems(h.목),
  }));
}

function parseMokItems(목: any): MokInfo[] | undefined {
  if (!목) return undefined;

  const 목배열 = Array.isArray(목) ? 목 : [목];

  return 목배열.map((m: any) => ({
    목번호: m.목번호 || '',
    목내용: extractTextContent(m.목내용),
  }));
}

export {
  apiClient,
  xmlParser,
};

