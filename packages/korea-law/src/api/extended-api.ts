/**
 * korea-law: 확장 API 모듈
 * 
 * 국가법령정보센터의 추가 API들을 연동합니다.
 * - 행정규칙
 * - 자치법규
 * - 헌재결정례
 * - 법령해석례
 * - 행정심판례
 * 
 * ⚠️ 주의: 이 데이터는 AI 검증용입니다.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { XMLParser } from 'fast-xml-parser';

const BASE_URL = 'http://www.law.go.kr/DRF';
// API 키: 환경변수 설정 권장, 기본값은 공공데이터포털 샘플키
const API_KEY = process.env.KOREA_LAW_API_KEY || 'sapphire_5';

// Retry 설정
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1초
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  trimValues: true,
});

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Accept': 'application/xml' },
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

export interface AdminRuleItem {
  행정규칙일련번호: string;
  행정규칙명: string;
  행정규칙종류명: string;
  소관부처명: string;
  발령일자: string;
  시행일자: string;
  행정규칙상세링크: string;
}

export interface LocalLawItem {
  자치법규일련번호: string;
  자치법규명: string;
  자치단체코드: string;
  자치단체명: string;
  공포일자: string;
  시행일자: string;
}

export interface ConstitutionalDecisionItem {
  헌재결정일련번호: string;
  사건번호: string;
  사건명: string;
  선고일자: string;
  결정유형: string;
  주문: string;
  결정요지: string;
}

export interface LegalInterpretationItem {
  법령해석일련번호: string;
  사안명: string;
  회신기관명: string;
  안건번호: string;
  회신일자: string;
  질의요지: string;
  회답: string;
}

export interface AdminAppealItem {
  행정심판일련번호: string;
  행정심판재결례일련번호?: string;  // API 응답 필드
  사건번호: string;
  사건명: string;
  재결일자: string;
  의결일자?: string;  // API 응답 필드 (재결일자와 동일)
  재결결과: string;
  재결구분명?: string;  // API 응답 필드 (재결결과와 동일)
  재결요지: string;
  처분청?: string;
  재결청?: string;
}

// ============================================
// 행정규칙 API
// ============================================

/**
 * 행정규칙 검색
 */
export async function searchAdminRules(query: string, display: number = 100): Promise<AdminRuleItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'admrul',  // 행정규칙
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.AdmRulSearch?.admrul;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchAdminRules(${query})`);
}

/**
 * 행정규칙 상세 조회
 */
export async function getAdminRuleDetail(ruleId: string): Promise<any | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'admrul',
        type: 'XML',
        ID: ruleId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.행정규칙 || null;
  }, `getAdminRuleDetail(${ruleId})`);
}

// ============================================
// 자치법규 API
// ============================================

/**
 * 자치법규 검색
 */
export async function searchLocalLaws(query: string = '조례', display: number = 100): Promise<LocalLawItem[]> {
  // API는 빈 쿼리에서 결과를 반환하지 않으므로 기본값 '조례' 사용
  const searchQuery = query || '조례';
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'ordin',  // 자치법규
        type: 'XML',
        query: searchQuery,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 응답 구조: OrdinSearch.law (not ordin)
    const items = parsed?.OrdinSearch?.law;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLocalLaws(${searchQuery})`);
}

// ============================================
// 헌재결정례 API
// ============================================

/**
 * 헌재결정례 검색
 */
export async function searchConstitutionalDecisions(
  query: string = '헌법',
  display: number = 100
): Promise<ConstitutionalDecisionItem[]> {
  // API는 빈 쿼리에서 결과를 반환하지 않으므로 기본값 '헌법' 사용
  const searchQuery = query || '헌법';
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'detc',  // 헌재결정례
        type: 'XML',
        query: searchQuery,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 응답 구조: DetcSearch.Detc (대문자)
    const items = parsed?.DetcSearch?.Detc;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchConstitutionalDecisions(${searchQuery})`);
}

/**
 * 헌재결정례 존재 확인
 */
export async function verifyConstitutionalDecisionExists(caseNumber: string): Promise<boolean> {
  try {
    const results = await searchConstitutionalDecisions(caseNumber, 10);
    const normalized = caseNumber.replace(/\s+/g, '');
    return results.some(item => 
      item.사건번호?.replace(/\s+/g, '') === normalized
    );
  } catch (error) {
    return false;
  }
}

/**
 * 헌재결정례 상세 조회 (본문 포함)
 */
export async function getConstitutionalDecisionDetail(decisionId: string): Promise<any | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'detc',  // 헌재결정례
        type: 'XML',
        ID: decisionId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 응답: 헌재결정례 또는 DetcService
    return parsed?.헌재결정례 || parsed?.DetcService || null;
  }, `getConstitutionalDecisionDetail(${decisionId})`);
}

// ============================================
// 법령해석례 API
// ============================================

/**
 * 법령해석례 검색
 */
export async function searchLegalInterpretations(
  query: string = '법령',
  display: number = 100
): Promise<LegalInterpretationItem[]> {
  // API는 빈 쿼리에서 결과를 반환하지 않으므로 기본값 '법령' 사용
  const searchQuery = query || '법령';
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'expc',  // 법령해석례
        type: 'XML',
        query: searchQuery,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 응답 구조: Expc.expc (ExpcSearch가 아님)
    const items = parsed?.Expc?.expc;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLegalInterpretations(${searchQuery})`);
}

/**
 * 법령해석례 상세 조회 (본문 포함)
 */
export async function getLegalInterpretationDetail(interpId: string): Promise<any | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'expc',  // 법령해석례
        type: 'XML',
        ID: interpId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 응답: 법령해석례 또는 ExpcService
    return parsed?.법령해석례 || parsed?.ExpcService || null;
  }, `getLegalInterpretationDetail(${interpId})`);
}

// ============================================
// 행정심판례 API
// ============================================

/**
 * 행정심판례 검색
 */
export async function searchAdminAppeals(
  query: string = '행정심판',
  display: number = 100
): Promise<AdminAppealItem[]> {
  const searchQuery = query || '행정심판';
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'decc',  // 행정심판례 (올바른 타겟)
        type: 'XML',
        query: searchQuery,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 응답 루트: <Decc><decc>...</decc></Decc>
    const items = parsed?.Decc?.decc;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchAdminAppeals(${searchQuery})`);
}

/**
 * 행정심판례 상세 조회
 */
export async function getAdminAppealDetail(caseId: string): Promise<any | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'decc',  // 행정심판례 (올바른 타겟)
        type: 'XML',
        ID: caseId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 응답 루트: <PrecService>...</PrecService>
    const detail = parsed?.PrecService;

    return detail || null;
  }, `getAdminAppealDetail(${caseId})`);
}

// ============================================
// 조약 API
// ============================================

export interface TreatyItem {
  조약일련번호: string;
  조약명: string;
  조약종류명: string;
  체결일자: string;
  발효일자: string;
  당사국: string;
}

/**
 * 조약 검색
 */
export async function searchTreaties(query: string = '조약', display: number = 100): Promise<TreatyItem[]> {
  // API는 빈 쿼리에서 결과를 반환하지 않으므로 기본값 '조약' 사용
  const searchQuery = query || '조약';
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'trty',  // 조약
        type: 'XML',
        query: searchQuery,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 응답 구조: TrtySearch.Trty (대문자 Trty)
    const items = parsed?.TrtySearch?.Trty;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchTreaties(${searchQuery})`);
}

// ============================================
// 위원회 결정문 API (Committee Decisions)
// ============================================

export type CommitteeType = 
  | 'privacy'      // 개인정보보호위원회
  | 'monopoly'     // 공정거래위원회
  | 'labor'        // 중앙노동위원회
  | 'financial'    // 금융위원회
  | 'anticorruption' // 국민권익위원회
  | 'environment'  // 환경분쟁조정위원회
  | 'human_rights' // 국가인권위원회
  | 'broadcasting' // 방송통신위원회
  | 'securities'   // 증권선물위원회
  | 'land'         // 중앙토지수용위원회
  | 'industrial_accident' // 산업재해보상보험재심사위원회
  | 'employment_insurance'; // 고용보험심사위원회

export interface CommitteeDecisionItem {
  일련번호: string;
  사건번호?: string;
  사건명?: string;
  결정일자?: string;
  결정유형?: string;
  결정요지?: string;
  위원회명: string;
}

// 위원회별 API target 매핑 (API 응답은 대문자 태그 사용: <Ftc>, <Pipc> 등)
const COMMITTEE_TARGET_MAP: Record<CommitteeType, { target: string; searchKey: string; name: string }> = {
  privacy: { target: 'pipc', searchKey: 'Pipc', name: '개인정보보호위원회' },
  monopoly: { target: 'ftc', searchKey: 'Ftc', name: '공정거래위원회' },
  labor: { target: 'nlrc', searchKey: 'Nlrc', name: '중앙노동위원회' },
  financial: { target: 'fsc', searchKey: 'Fsc', name: '금융위원회' },
  anticorruption: { target: 'acrc', searchKey: 'Acrc', name: '국민권익위원회' },
  environment: { target: 'edrc', searchKey: 'Edrc', name: '환경분쟁조정위원회' },
  human_rights: { target: 'nhrck', searchKey: 'Nhrck', name: '국가인권위원회' },
  broadcasting: { target: 'kcc', searchKey: 'Kcc', name: '방송통신위원회' },
  securities: { target: 'sfc', searchKey: 'Sfc', name: '증권선물위원회' },
  land: { target: 'clac', searchKey: 'Clac', name: '중앙토지수용위원회' },
  industrial_accident: { target: 'comwel', searchKey: 'Comwel', name: '산업재해보상보험재심사위원회' },
  employment_insurance: { target: 'eic', searchKey: 'Eic', name: '고용보험심사위원회' },
};

/**
 * 위원회 결정문 통합 검색
 * @param committeeType 위원회 유형
 * @param query 검색어
 * @param display 결과 개수
 */
export async function searchCommitteeDecisions(
  committeeType: CommitteeType,
  query: string,
  display: number = 50
): Promise<CommitteeDecisionItem[]> {
  const config = COMMITTEE_TARGET_MAP[committeeType];
  if (!config) {
    throw new Error(`Unknown committee type: ${committeeType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // 동적 키로 결과 추출
    const searchResult = parsed?.[config.searchKey];
    const items = searchResult?.[config.target] || searchResult?.item;

    if (!items) return [];
    
    const results = Array.isArray(items) ? items : [items];
    return results.map((item: any) => ({
      ...item,
      위원회명: config.name,
    }));
  }, `searchCommitteeDecisions(${committeeType}, ${query})`);
}

/**
 * 위원회 결정문 상세 조회
 */
export async function getCommitteeDecisionDetail(
  committeeType: CommitteeType,
  decisionId: string
): Promise<any | null> {
  const config = COMMITTEE_TARGET_MAP[committeeType];
  if (!config) {
    throw new Error(`Unknown committee type: ${committeeType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        ID: decisionId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.[config.target] || null;
  }, `getCommitteeDecisionDetail(${committeeType}, ${decisionId})`);
}

/**
 * 여러 위원회에서 동시 검색 (컴플라이언스 검토용)
 */
export async function searchAllCommittees(
  query: string,
  committees?: CommitteeType[],
  display: number = 20
): Promise<{ committee: string; results: CommitteeDecisionItem[] }[]> {
  const targetCommittees = committees || ['privacy', 'monopoly', 'labor'] as CommitteeType[];

  const searches = targetCommittees.map(async (type) => {
    try {
      const results = await searchCommitteeDecisions(type, query, display);
      return {
        committee: COMMITTEE_TARGET_MAP[type].name,
        results,
      };
    } catch (error) {
      return {
        committee: COMMITTEE_TARGET_MAP[type].name,
        results: [],
      };
    }
  });

  return Promise.all(searches);
}

// ============================================
// 중앙부처 법령해석 API (Ministry Interpretations)
// ============================================

export type MinistryType =
  | 'moel'   // 고용노동부
  | 'nts'    // 국세청
  | 'molit'  // 국토교통부
  | 'mohw'   // 보건복지부
  | 'mof'    // 해양수산부
  | 'moef'   // 기획재정부
  | 'moe'    // 교육부
  | 'msit'   // 과학기술정보통신부
  | 'me'     // 환경부
  | 'mafra'  // 농림축산식품부
  | 'kcs'    // 관세청
  | 'nfa'    // 소방청
  | 'sme';   // 중소벤처기업부

export interface MinistryInterpretationItem {
  일련번호: string;
  안건번호?: string;
  제목?: string;
  사안명?: string;
  회신일자?: string;
  질의요지?: string;
  회답?: string;
  부처명: string;
}

// 부처별 API target 매핑 (API는 {부처코드}Interp 형식 사용)
const MINISTRY_TARGET_MAP: Record<MinistryType, { target: string; searchKey: string; name: string }> = {
  moel: { target: 'moelInterp', searchKey: 'MoelInterpSearch', name: '고용노동부' },
  nts: { target: 'ntsInterp', searchKey: 'NtsInterpSearch', name: '국세청' },
  molit: { target: 'molitInterp', searchKey: 'MolitInterpSearch', name: '국토교통부' },
  mohw: { target: 'mohwInterp', searchKey: 'MohwInterpSearch', name: '보건복지부' },
  mof: { target: 'mofInterp', searchKey: 'MofInterpSearch', name: '해양수산부' },
  moef: { target: 'moefInterp', searchKey: 'MoefInterpSearch', name: '기획재정부' },
  moe: { target: 'moeInterp', searchKey: 'MoeInterpSearch', name: '교육부' },
  msit: { target: 'msitInterp', searchKey: 'MsitInterpSearch', name: '과학기술정보통신부' },
  me: { target: 'meInterp', searchKey: 'MeInterpSearch', name: '환경부' },
  mafra: { target: 'mafraInterp', searchKey: 'MafraInterpSearch', name: '농림축산식품부' },
  kcs: { target: 'customsInterp', searchKey: 'CustomsInterpSearch', name: '관세청' },
  nfa: { target: 'nfaInterp', searchKey: 'NfaInterpSearch', name: '소방청' },
  sme: { target: 'mssInterp', searchKey: 'MssInterpSearch', name: '중소벤처기업부' },
};

/**
 * 부처별 법령해석 검색
 * @param ministryType 부처 유형
 * @param query 검색어
 * @param display 결과 개수
 */
export async function searchMinistryInterpretations(
  ministryType: MinistryType,
  query: string,
  display: number = 50
): Promise<MinistryInterpretationItem[]> {
  const config = MINISTRY_TARGET_MAP[ministryType];
  if (!config) {
    throw new Error(`Unknown ministry type: ${ministryType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const searchResult = parsed?.[config.searchKey];
    const items = searchResult?.[config.target] || searchResult?.item;

    if (!items) return [];
    
    const results = Array.isArray(items) ? items : [items];
    return results.map((item: any) => ({
      ...item,
      부처명: config.name,
    }));
  }, `searchMinistryInterpretations(${ministryType}, ${query})`);
}

/**
 * 부처별 법령해석 상세 조회
 */
export async function getMinistryInterpretationDetail(
  ministryType: MinistryType,
  interpId: string
): Promise<any | null> {
  const config = MINISTRY_TARGET_MAP[ministryType];
  if (!config) {
    throw new Error(`Unknown ministry type: ${ministryType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        ID: interpId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.[config.target] || null;
  }, `getMinistryInterpretationDetail(${ministryType}, ${interpId})`);
}

/**
 * 실무 핵심 부처 통합 검색 (노동/세무 이슈용)
 */
export async function searchKeyMinistries(
  query: string,
  ministries?: MinistryType[],
  display: number = 20
): Promise<{ ministry: string; results: MinistryInterpretationItem[] }[]> {
  const targetMinistries = ministries || ['moel', 'nts', 'molit'] as MinistryType[];

  const searches = targetMinistries.map(async (type) => {
    try {
      const results = await searchMinistryInterpretations(type, query, display);
      return {
        ministry: MINISTRY_TARGET_MAP[type].name,
        results,
      };
    } catch (error) {
      return {
        ministry: MINISTRY_TARGET_MAP[type].name,
        results: [],
      };
    }
  });

  return Promise.all(searches);
}

// ============================================
// 특별행정심판 API (Special Administrative Tribunals)
// ============================================

export type TribunalType =
  | 'tax'      // 조세심판원
  | 'maritime' // 해양안전심판원
  | 'patent';  // 특허심판원

export interface TribunalDecisionItem {
  일련번호: string;
  사건번호?: string;
  사건명?: string;
  재결일자?: string;
  재결결과?: string;
  재결요지?: string;
  심판원명: string;
}

const TRIBUNAL_TARGET_MAP: Record<TribunalType, { target: string; searchKey: string; name: string }> = {
  tax: { target: 'ttAppeal', searchKey: 'TtAppealSearch', name: '조세심판원' },
  maritime: { target: 'kmstAppeal', searchKey: 'KmstAppealSearch', name: '해양안전심판원' },
  patent: { target: 'kipoAppeal', searchKey: 'KipoAppealSearch', name: '특허심판원' },
};

/**
 * 특별행정심판 검색
 */
export async function searchTribunalDecisions(
  tribunalType: TribunalType,
  query: string,
  display: number = 50
): Promise<TribunalDecisionItem[]> {
  const config = TRIBUNAL_TARGET_MAP[tribunalType];
  if (!config) {
    throw new Error(`Unknown tribunal type: ${tribunalType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const searchResult = parsed?.[config.searchKey];
    const items = searchResult?.[config.target] || searchResult?.item;

    if (!items) return [];

    const results = Array.isArray(items) ? items : [items];
    return results.map((item: any) => ({
      ...item,
      심판원명: config.name,
    }));
  }, `searchTribunalDecisions(${tribunalType}, ${query})`);
}

/**
 * 특별행정심판 상세 조회
 */
export async function getTribunalDecisionDetail(
  tribunalType: TribunalType,
  decisionId: string
): Promise<any | null> {
  const config = TRIBUNAL_TARGET_MAP[tribunalType];
  if (!config) {
    throw new Error(`Unknown tribunal type: ${tribunalType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        ID: decisionId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.[config.target] || null;
  }, `getTribunalDecisionDetail(${tribunalType}, ${decisionId})`);
}

// ============================================
// 별표·서식 API (Appendix/Forms)
// ============================================

export interface AppendixItem {
  별표서식일련번호: string;
  별표서식명: string;
  법령명?: string;
  행정규칙명?: string;
  자치법규명?: string;
  별표서식종류명: string;
}

/**
 * 법령 별표·서식 검색
 */
export async function searchLawAppendix(query: string, display: number = 50): Promise<AppendixItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lsform', // 법령 별표서식
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LsformSearch?.lsform;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLawAppendix(${query})`);
}

/**
 * 행정규칙 별표·서식 검색
 */
export async function searchAdminRuleAppendix(query: string, display: number = 50): Promise<AppendixItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'admrulform', // 행정규칙 별표서식
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.AdmrulformSearch?.admrulform;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchAdminRuleAppendix(${query})`);
}

/**
 * 자치법규 별표·서식 검색
 */
export async function searchOrdinanceAppendix(query: string, display: number = 50): Promise<AppendixItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'ordinform', // 자치법규 별표서식
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.OrdinformSearch?.ordinform;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchOrdinanceAppendix(${query})`);
}

// ============================================
// 학칙·공단·공공기관 API
// ============================================

export interface InstitutionRegulationItem {
  기관규정일련번호: string;
  기관명: string;
  규정명: string;
  제개정구분명: string;
  시행일자: string;
}

/**
 * 학칙·공단·공공기관 규정 검색
 */
export async function searchInstitutionRegulations(query: string, display: number = 50): Promise<InstitutionRegulationItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'insti', // 학칙·공단·공공기관
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.InstiSearch?.insti;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchInstitutionRegulations(${query})`);
}

/**
 * 학칙·공단·공공기관 규정 상세 조회
 */
export async function getInstitutionRegulationDetail(instiId: string): Promise<any | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'insti',
        type: 'XML',
        ID: instiId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.기관규정 || null;
  }, `getInstitutionRegulationDetail(${instiId})`);
}

// ============================================
// 법령용어 API (Legal Terms)
// ============================================

export interface LegalTermItem {
  법령용어일련번호: string;
  용어명: string;
  정의: string;
  관련법령: string;
}

/**
 * 법령용어 검색
 */
export async function searchLegalTerms(query: string, display: number = 50): Promise<LegalTermItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lawterm', // 법령용어
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawtermSearch?.lawterm;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLegalTerms(${query})`);
}

/**
 * 법령용어 상세 조회
 */
export async function getLegalTermDetail(termId: string): Promise<any | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'lawterm',
        type: 'XML',
        ID: termId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.법령용어 || null;
  }, `getLegalTermDetail(${termId})`);
}

// ============================================
// 법령정보 지식베이스 API (Knowledge Base)
// ============================================

export interface DailyTermItem {
  일상용어일련번호: string;
  일상용어: string;
  설명: string;
}

/**
 * 일상용어 검색
 */
export async function searchDailyTerms(query: string, display: number = 50): Promise<DailyTermItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'dailyterm', // 일상용어
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.DailytermSearch?.dailyterm;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchDailyTerms(${query})`);
}

/**
 * 법령용어-일상용어 연계 조회
 */
export async function searchLegalDailyTermLink(legalTerm: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lawdailylink', // 법령용어-일상용어 연계
        type: 'XML',
        query: legalTerm,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawdailylinkSearch?.lawdailylink;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLegalDailyTermLink(${legalTerm})`);
}

/**
 * 일상용어-법령용어 연계 조회
 */
export async function searchDailyLegalTermLink(dailyTerm: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'dailylawlink', // 일상용어-법령용어 연계
        type: 'XML',
        query: dailyTerm,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.DailylawlinkSearch?.dailylawlink;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchDailyLegalTermLink(${dailyTerm})`);
}

/**
 * 법령용어-조문 연계 조회
 */
export async function searchTermArticleLink(term: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'termartlink', // 법령용어-조문 연계
        type: 'XML',
        query: term,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.TermartlinkSearch?.termartlink;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchTermArticleLink(${term})`);
}

/**
 * 관련법령 조회
 */
export async function searchRelatedLaws(lawName: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'rellaw', // 관련법령
        type: 'XML',
        query: lawName,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.RellawSearch?.rellaw;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchRelatedLaws(${lawName})`);
}

/**
 * 지능형 법령검색 시스템 API
 */
export async function searchIntelligentLaw(query: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'ailaw', // 지능형 법령검색
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.AilawSearch?.ailaw;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchIntelligentLaw(${query})`);
}

/**
 * 지능형 법령검색 시스템 연관법령 API
 */
export async function searchIntelligentRelatedLaws(lawId: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'airellaw', // 지능형 연관법령
        type: 'XML',
        ID: lawId,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.AirellawSearch?.airellaw;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchIntelligentRelatedLaws(${lawId})`);
}

// ============================================
// 중앙부처 1차 해석 확장 (39개 전체 부처)
// ============================================

export type ExtendedMinistryType =
  // 기존 13개
  | 'moel'   // 고용노동부
  | 'nts'    // 국세청
  | 'molit'  // 국토교통부
  | 'mohw'   // 보건복지부
  | 'mof'    // 해양수산부
  | 'moef'   // 기획재정부
  | 'moe'    // 교육부
  | 'msit'   // 과학기술정보통신부
  | 'me'     // 환경부 (기후에너지환경부)
  | 'mafra'  // 농림축산식품부
  | 'kcs'    // 관세청
  | 'nfa'    // 소방청
  | 'sme'    // 중소벤처기업부
  // 추가 26개
  | 'moi'    // 행정안전부
  | 'mpva'   // 국가보훈부
  | 'mnd'    // 국방부
  | 'mcst'   // 문화체육관광부
  | 'moj'    // 법무부
  | 'motie'  // 산업통상부
  | 'mogef'  // 성평등가족부
  | 'mofa'   // 외교부
  | 'unikorea' // 통일부
  | 'moleg'  // 법제처
  | 'mfds'   // 식품의약품안전처
  | 'mpm'    // 인사혁신처
  | 'kma'    // 기상청
  | 'cha'    // 국가유산청
  | 'rda'    // 농촌진흥청
  | 'police' // 경찰청
  | 'dapa'   // 방위사업청
  | 'mma'    // 병무청
  | 'forest' // 산림청
  | 'oka'    // 재외동포청
  | 'pps'    // 조달청
  | 'kdca'   // 질병관리청
  | 'nda'    // 국가데이터처
  | 'kipo'   // 지식재산처
  | 'kcg'    // 해양경찰청
  | 'naacc'; // 행정중심복합도시건설청

// 확장된 부처 매핑 (39개 전체)
const EXTENDED_MINISTRY_MAP: Record<ExtendedMinistryType, { target: string; searchKey: string; name: string }> = {
  // 기존
  moel: { target: 'moel', searchKey: 'MoelSearch', name: '고용노동부' },
  nts: { target: 'nts', searchKey: 'NtsSearch', name: '국세청' },
  molit: { target: 'molit', searchKey: 'MolitSearch', name: '국토교통부' },
  mohw: { target: 'mohw', searchKey: 'MohwSearch', name: '보건복지부' },
  mof: { target: 'mof', searchKey: 'MofSearch', name: '해양수산부' },
  moef: { target: 'moef', searchKey: 'MoefSearch', name: '기획재정부' },
  moe: { target: 'moe', searchKey: 'MoeSearch', name: '교육부' },
  msit: { target: 'msit', searchKey: 'MsitSearch', name: '과학기술정보통신부' },
  me: { target: 'me', searchKey: 'MeSearch', name: '기후에너지환경부' },
  mafra: { target: 'mafra', searchKey: 'MafraSearch', name: '농림축산식품부' },
  kcs: { target: 'kcs', searchKey: 'KcsSearch', name: '관세청' },
  nfa: { target: 'nfa', searchKey: 'NfaSearch', name: '소방청' },
  sme: { target: 'sme', searchKey: 'SmeSearch', name: '중소벤처기업부' },
  // 추가 26개
  moi: { target: 'moi', searchKey: 'MoiSearch', name: '행정안전부' },
  mpva: { target: 'mpva', searchKey: 'MpvaSearch', name: '국가보훈부' },
  mnd: { target: 'mnd', searchKey: 'MndSearch', name: '국방부' },
  mcst: { target: 'mcst', searchKey: 'McstSearch', name: '문화체육관광부' },
  moj: { target: 'moj', searchKey: 'MojSearch', name: '법무부' },
  motie: { target: 'motie', searchKey: 'MotieSearch', name: '산업통상부' },
  mogef: { target: 'mogef', searchKey: 'MogefSearch', name: '성평등가족부' },
  mofa: { target: 'mofa', searchKey: 'MofaSearch', name: '외교부' },
  unikorea: { target: 'unikorea', searchKey: 'UnikoreaSearch', name: '통일부' },
  moleg: { target: 'moleg', searchKey: 'MolegSearch', name: '법제처' },
  mfds: { target: 'mfds', searchKey: 'MfdsSearch', name: '식품의약품안전처' },
  mpm: { target: 'mpm', searchKey: 'MpmSearch', name: '인사혁신처' },
  kma: { target: 'kma', searchKey: 'KmaSearch', name: '기상청' },
  cha: { target: 'cha', searchKey: 'ChaSearch', name: '국가유산청' },
  rda: { target: 'rda', searchKey: 'RdaSearch', name: '농촌진흥청' },
  police: { target: 'police', searchKey: 'PoliceSearch', name: '경찰청' },
  dapa: { target: 'dapa', searchKey: 'DapaSearch', name: '방위사업청' },
  mma: { target: 'mma', searchKey: 'MmaSearch', name: '병무청' },
  forest: { target: 'forest', searchKey: 'ForestSearch', name: '산림청' },
  oka: { target: 'oka', searchKey: 'OkaSearch', name: '재외동포청' },
  pps: { target: 'pps', searchKey: 'PpsSearch', name: '조달청' },
  kdca: { target: 'kdca', searchKey: 'KdcaSearch', name: '질병관리청' },
  nda: { target: 'nda', searchKey: 'NdaSearch', name: '국가데이터처' },
  kipo: { target: 'kipo', searchKey: 'KipoSearch', name: '지식재산처' },
  kcg: { target: 'kcg', searchKey: 'KcgSearch', name: '해양경찰청' },
  naacc: { target: 'naacc', searchKey: 'NaaccSearch', name: '행정중심복합도시건설청' },
};

/**
 * 확장된 부처별 법령해석 검색 (39개 부처 전체)
 */
export async function searchExtendedMinistryInterpretations(
  ministryType: ExtendedMinistryType,
  query: string,
  display: number = 50
): Promise<MinistryInterpretationItem[]> {
  const config = EXTENDED_MINISTRY_MAP[ministryType];
  if (!config) {
    throw new Error(`Unknown ministry type: ${ministryType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const searchResult = parsed?.[config.searchKey];
    const items = searchResult?.[config.target] || searchResult?.item;

    if (!items) return [];

    const results = Array.isArray(items) ? items : [items];
    return results.map((item: any) => ({
      ...item,
      부처명: config.name,
    }));
  }, `searchExtendedMinistryInterpretations(${ministryType}, ${query})`);
}

/**
 * 확장된 부처별 법령해석 상세 조회
 */
export async function getExtendedMinistryInterpretationDetail(
  ministryType: ExtendedMinistryType,
  interpId: string
): Promise<any | null> {
  const config = EXTENDED_MINISTRY_MAP[ministryType];
  if (!config) {
    throw new Error(`Unknown ministry type: ${ministryType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        ID: interpId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.[config.target] || null;
  }, `getExtendedMinistryInterpretationDetail(${ministryType}, ${interpId})`);
}

/**
 * 모든 부처 목록 반환
 */
export function getAllMinistries(): { code: ExtendedMinistryType; name: string }[] {
  return Object.entries(EXTENDED_MINISTRY_MAP).map(([code, config]) => ({
    code: code as ExtendedMinistryType,
    name: config.name,
  }));
}

// ============================================
// 특별행정심판 확장 (4개 전체)
// ============================================

export type ExtendedTribunalType =
  | 'tax'      // 조세심판원
  | 'maritime' // 해양안전심판원
  | 'acrc'     // 국민권익위원회 특별행정심판
  | 'mpm';     // 인사혁신처 소청심사위원회

const EXTENDED_TRIBUNAL_MAP: Record<ExtendedTribunalType, { target: string; searchKey: string; name: string }> = {
  tax: { target: 'taxtr', searchKey: 'TaxtrSearch', name: '조세심판원' },
  maritime: { target: 'kmst', searchKey: 'KmstSearch', name: '해양안전심판원' },
  acrc: { target: 'acrctr', searchKey: 'AcrctrSearch', name: '국민권익위원회 특별행정심판' },
  mpm: { target: 'mpmtr', searchKey: 'MpmtrSearch', name: '인사혁신처 소청심사위원회' },
};

/**
 * 확장된 특별행정심판 검색 (4개 전체)
 */
export async function searchExtendedTribunalDecisions(
  tribunalType: ExtendedTribunalType,
  query: string,
  display: number = 50
): Promise<TribunalDecisionItem[]> {
  const config = EXTENDED_TRIBUNAL_MAP[tribunalType];
  if (!config) {
    throw new Error(`Unknown tribunal type: ${tribunalType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const searchResult = parsed?.[config.searchKey];
    const items = searchResult?.[config.target] || searchResult?.item;

    if (!items) return [];

    const results = Array.isArray(items) ? items : [items];
    return results.map((item: any) => ({
      ...item,
      심판원명: config.name,
    }));
  }, `searchExtendedTribunalDecisions(${tribunalType}, ${query})`);
}

/**
 * 확장된 특별행정심판 상세 조회
 */
export async function getExtendedTribunalDecisionDetail(
  tribunalType: ExtendedTribunalType,
  decisionId: string
): Promise<any | null> {
  const config = EXTENDED_TRIBUNAL_MAP[tribunalType];
  if (!config) {
    throw new Error(`Unknown tribunal type: ${tribunalType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: config.target,
        type: 'XML',
        ID: decisionId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.[config.target] || null;
  }, `getExtendedTribunalDecisionDetail(${tribunalType}, ${decisionId})`);
}

// ============================================
// 법령 부가서비스 API
// ============================================

/**
 * 법령 체계도 검색
 */
export async function searchLawSystemDiagram(query: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lawsystem', // 법령 체계도
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawsystemSearch?.lawsystem;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLawSystemDiagram(${query})`);
}

/**
 * 신구법 비교 검색
 */
export async function searchOldNewLawComparison(lawName: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'oldnew', // 신구법 비교
        type: 'XML',
        query: lawName,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.OldnewSearch?.oldnew;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchOldNewLawComparison(${lawName})`);
}

/**
 * 3단 비교 검색
 */
export async function searchThreeWayComparison(lawName: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'threeway', // 3단 비교
        type: 'XML',
        query: lawName,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.ThreewaySearch?.threeway;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchThreeWayComparison(${lawName})`);
}

/**
 * 법률명 약칭 조회
 */
export async function searchLawNickname(query: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lawnick', // 법률명 약칭
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawnickSearch?.lawnick;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLawNickname(${query})`);
}

/**
 * 삭제 데이터 목록 조회
 */
export async function searchDeletedLawData(query: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'dellaw', // 삭제 데이터
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.DellawSearch?.dellaw;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchDeletedLawData(${query})`);
}

/**
 * 한눈보기 검색
 */
export async function searchLawOverview(query: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lawover', // 한눈보기
        type: 'XML',
        query: query,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawoverSearch?.lawover;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLawOverview(${query})`);
}

/**
 * 법령 연혁 검색
 */
export async function searchLawHistory(lawName: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lawhis', // 법령 연혁
        type: 'XML',
        query: lawName,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawhisSearch?.lawhis;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLawHistory(${lawName})`);
}

/**
 * 법령 변경이력 검색
 */
export async function searchLawChangeHistory(lawName: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lawchange', // 법령 변경이력
        type: 'XML',
        query: lawName,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawchangeSearch?.lawchange;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLawChangeHistory(${lawName})`);
}

/**
 * 위임법령 조회
 */
export async function searchDelegatedLaw(lawId: string): Promise<any | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'delglaw', // 위임법령
        type: 'XML',
        ID: lawId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.위임법령 || null;
  }, `searchDelegatedLaw(${lawId})`);
}

/**
 * 법령-자치법규 연계현황 조회
 */
export async function searchLawOrdinanceLink(lawName: string, display: number = 50): Promise<any[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'lawordinlink', // 법령-자치법규 연계
        type: 'XML',
        query: lawName,
        display: display,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.LawordinlinkSearch?.lawordinlink;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchLawOrdinanceLink(${lawName})`);
}

// ============================================
// 통합 검증 함수
// ============================================

export type SourceType = 'prec' | 'detc' | 'expc' | 'flgn' | 'admrul' | 'committee' | 'ministry' | 'tribunal';

/**
 * 여러 소스에서 사건/결정 존재 확인
 * AI가 인용한 판례/결정례/해석례의 진위 검증용
 */
export async function verifyLegalSourceExists(
  identifier: string, 
  sourceType: SourceType
): Promise<{ exists: boolean; source: string; details?: any }> {
  try {
    let results: any[] = [];
    let sourceName = '';

    switch (sourceType) {
      case 'prec':
        sourceName = '대법원 판례';
        // 기존 api.searchPrecedents 사용
        break;
      case 'detc':
        sourceName = '헌재결정례';
        results = await searchConstitutionalDecisions(identifier, 10);
        break;
      case 'expc':
        sourceName = '법령해석례';
        results = await searchLegalInterpretations(identifier, 10);
        break;
      case 'flgn':
        sourceName = '행정심판례';
        results = await searchAdminAppeals(identifier, 10);
        break;
      case 'admrul':
        sourceName = '행정규칙';
        results = await searchAdminRules(identifier, 10);
        break;
    }

    const exists = results.length > 0;

    return {
      exists,
      source: sourceName,
      details: exists ? results[0] : undefined,
    };
  } catch (error) {
    return {
      exists: false,
      source: '검색 실패',
    };
  }
}

// ============================================
// 2024.12 신규 개방 API - 중앙부처 1차해석 (cgmExpc)
// ============================================

/**
 * 중앙부처 1차해석 부처 유형 (2024.12 신규)
 * - 기존 법제처 해석례(expc)와 별개로 각 부처에서 직접 회신한 1차 해석
 * - 총 15만여 건 (2024.12 기준)
 */
export type CgmExpcMinistryType =
  | 'nts'     // 국세청 (소득세, 부가세, 상속세, 법인세 등)
  | 'kcs'     // 관세청 (수출입, 통관, 품목분류)
  | 'me'      // 환경부
  | 'moi'     // 행정안전부 (지방자치, 주민등록, 재난안전)
  | 'moef'    // 기획재정부 (재정, 세제, 예산, 금융)
  | 'moel'    // 고용노동부
  | 'mohw'    // 보건복지부
  | 'molit'   // 국토교통부
  | 'mafra'   // 농림축산식품부
  | 'mof'     // 해양수산부
  | 'motie'   // 산업통상자원부
  | 'msit'    // 과학기술정보통신부
  | 'mcst'    // 문화체육관광부
  | 'moe'     // 교육부
  | 'moj';    // 법무부

export interface CgmExpcInterpretationItem {
  해석일련번호: string;
  안건명: string;
  질의기관?: string;
  해석일자: string;
  접수일자?: string;
  회신여부?: string;
  처리상태?: string;
  부처명: string;
  해석상세링크?: string;
}

export interface CgmExpcInterpretationDetail {
  해석일련번호: string;
  안건번호?: string;
  안건명: string;
  질의배경?: string;
  관련법령조항?: string;
  질의요지?: string;
  회답?: string;
  이유?: string;
  해석일자: string;
  부처명: string;
}

// 중앙부처 1차해석 API target 매핑 (2024.12 신규)
const CGM_EXPC_MINISTRY_MAP: Record<CgmExpcMinistryType, { 
  listTarget: string; 
  detailTarget: string;
  searchKey: string; 
  name: string;
  description: string;
}> = {
  nts: { 
    listTarget: 'cgmExpcNts', 
    detailTarget: 'cgmExpcNtsInfo',
    searchKey: 'CgmExpcNtsSearch', 
    name: '국세청',
    description: '소득세, 부가가치세, 상속세, 법인세 등 국세 관련 법령해석'
  },
  kcs: { 
    listTarget: 'cgmExpcKcs', 
    detailTarget: 'cgmExpcKcsInfo',
    searchKey: 'CgmExpcKcsSearch', 
    name: '관세청',
    description: '수출입, 통관, 품목분류, 관세율 적용 등'
  },
  me: { 
    listTarget: 'cgmExpcMe', 
    detailTarget: 'cgmExpcMeInfo',
    searchKey: 'CgmExpcMeSearch', 
    name: '환경부',
    description: '환경법령 해석'
  },
  moi: { 
    listTarget: 'cgmExpcMoi', 
    detailTarget: 'cgmExpcMoiInfo',
    searchKey: 'CgmExpcMoiSearch', 
    name: '행정안전부',
    description: '지방자치, 주민등록, 재난안전, 공무원 인사 및 조직 운영'
  },
  moef: { 
    listTarget: 'cgmExpcMoef', 
    detailTarget: 'cgmExpcMoefInfo',
    searchKey: 'CgmExpcMoefSearch', 
    name: '기획재정부',
    description: '국가 재정, 세제, 예산, 금융 등'
  },
  moel: { 
    listTarget: 'cgmExpcMoel', 
    detailTarget: 'cgmExpcMoelInfo',
    searchKey: 'CgmExpcMoelSearch', 
    name: '고용노동부',
    description: '노동법, 고용보험, 근로기준 등'
  },
  mohw: { 
    listTarget: 'cgmExpcMohw', 
    detailTarget: 'cgmExpcMohwInfo',
    searchKey: 'CgmExpcMohwSearch', 
    name: '보건복지부',
    description: '보건의료, 사회복지 관련 법령해석'
  },
  molit: { 
    listTarget: 'cgmExpcMolit', 
    detailTarget: 'cgmExpcMolitInfo',
    searchKey: 'CgmExpcMolitSearch', 
    name: '국토교통부',
    description: '건설, 부동산, 교통 관련 법령해석'
  },
  mafra: { 
    listTarget: 'cgmExpcMafra', 
    detailTarget: 'cgmExpcMafraInfo',
    searchKey: 'CgmExpcMafraSearch', 
    name: '농림축산식품부',
    description: '농업, 축산, 식품 관련 법령해석'
  },
  mof: { 
    listTarget: 'cgmExpcMof', 
    detailTarget: 'cgmExpcMofInfo',
    searchKey: 'CgmExpcMofSearch', 
    name: '해양수산부',
    description: '해양, 수산 관련 법령해석'
  },
  motie: { 
    listTarget: 'cgmExpcMotie', 
    detailTarget: 'cgmExpcMotieInfo',
    searchKey: 'CgmExpcMotieSearch', 
    name: '산업통상자원부',
    description: '산업, 통상, 에너지 관련 법령해석'
  },
  msit: { 
    listTarget: 'cgmExpcMsit', 
    detailTarget: 'cgmExpcMsitInfo',
    searchKey: 'CgmExpcMsitSearch', 
    name: '과학기술정보통신부',
    description: '과학기술, 정보통신 관련 법령해석'
  },
  mcst: { 
    listTarget: 'cgmExpcMcst', 
    detailTarget: 'cgmExpcMcstInfo',
    searchKey: 'CgmExpcMcstSearch', 
    name: '문화체육관광부',
    description: '문화, 체육, 관광 관련 법령해석'
  },
  moe: { 
    listTarget: 'cgmExpcMoe', 
    detailTarget: 'cgmExpcMoeInfo',
    searchKey: 'CgmExpcMoeSearch', 
    name: '교육부',
    description: '교육 관련 법령해석'
  },
  moj: { 
    listTarget: 'cgmExpcMoj', 
    detailTarget: 'cgmExpcMojInfo',
    searchKey: 'CgmExpcMojSearch', 
    name: '법무부',
    description: '법무 관련 법령해석'
  },
};

/**
 * 중앙부처 1차해석 목록 검색 (2024.12 신규 API)
 * @param ministryType 부처 유형
 * @param query 검색어
 * @param options 추가 옵션 (날짜 범위 등)
 */
export async function searchCgmExpcInterpretations(
  ministryType: CgmExpcMinistryType,
  query: string,
  options: {
    display?: number;
    page?: number;
    startDate?: string; // YYYYMMDD
    endDate?: string;   // YYYYMMDD
  } = {}
): Promise<CgmExpcInterpretationItem[]> {
  const config = CGM_EXPC_MINISTRY_MAP[ministryType];
  if (!config) {
    throw new Error(`Unknown cgmExpc ministry type: ${ministryType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: config.listTarget,
        type: 'XML',
        query: query,
        display: options.display || 100,
        page: options.page || 1,
        ...(options.startDate && { stDate: options.startDate }),
        ...(options.endDate && { edDate: options.endDate }),
      },
    });

    const parsed = xmlParser.parse(response.data);
    const searchResult = parsed?.[config.searchKey];
    const items = searchResult?.[config.listTarget] || searchResult?.item;

    if (!items) return [];
    
    const results = Array.isArray(items) ? items : [items];
    return results.map((item: any) => ({
      ...item,
      부처명: config.name,
    }));
  }, `searchCgmExpcInterpretations(${ministryType}, ${query})`);
}

/**
 * 중앙부처 1차해석 상세 조회 (2024.12 신규 API)
 * @param ministryType 부처 유형
 * @param interpId 해석 일련번호
 */
export async function getCgmExpcInterpretationDetail(
  ministryType: CgmExpcMinistryType,
  interpId: string
): Promise<CgmExpcInterpretationDetail | null> {
  const config = CGM_EXPC_MINISTRY_MAP[ministryType];
  if (!config) {
    throw new Error(`Unknown cgmExpc ministry type: ${ministryType}`);
  }

  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: config.detailTarget,
        type: 'XML',
        ID: interpId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const data = parsed?.중앙부처해석례 || parsed?.[config.detailTarget];

    if (!data) return null;

    return {
      해석일련번호: interpId,
      안건번호: data.안건번호,
      안건명: data.안건명,
      질의배경: data.질의배경,
      관련법령조항: data.관련법령조항 || data.관계법령,
      질의요지: data.질의요지,
      회답: data.회답 || data.회신내용,
      이유: data.이유,
      해석일자: data.해석일자,
      부처명: config.name,
    };
  }, `getCgmExpcInterpretationDetail(${ministryType}, ${interpId})`);
}

/**
 * 여러 부처 1차해석 통합 검색 (실무 활용용)
 * @param query 검색어
 * @param ministries 검색할 부처 목록 (미지정시 주요 부처)
 */
export async function searchAllCgmExpcInterpretations(
  query: string,
  ministries?: CgmExpcMinistryType[],
  display: number = 20
): Promise<{ ministry: string; ministryCode: CgmExpcMinistryType; results: CgmExpcInterpretationItem[] }[]> {
  // 기본: 실무에서 자주 사용하는 주요 부처
  const targetMinistries = ministries || ['nts', 'kcs', 'moi', 'moef', 'moel', 'mohw', 'molit'] as CgmExpcMinistryType[];
  
  const searches = targetMinistries.map(async (type) => {
    try {
      const results = await searchCgmExpcInterpretations(type, query, { display });
      return {
        ministry: CGM_EXPC_MINISTRY_MAP[type].name,
        ministryCode: type,
        results,
      };
    } catch (error) {
      return {
        ministry: CGM_EXPC_MINISTRY_MAP[type].name,
        ministryCode: type,
        results: [],
      };
    }
  });

  return Promise.all(searches);
}

/**
 * 중앙부처 1차해석 부처 목록 반환
 */
export function getCgmExpcMinistryList(): { code: CgmExpcMinistryType; name: string; description: string }[] {
  return Object.entries(CGM_EXPC_MINISTRY_MAP).map(([code, config]) => ({
    code: code as CgmExpcMinistryType,
    name: config.name,
    description: config.description,
  }));
}

// ============================================
// 한눈보기 API (OneView) - 2024.10 신규
// ============================================

/**
 * 한눈보기 항목 - 법령 시각화 콘텐츠
 * 어려운 법령을 그림/사진/표 등으로 쉽게 이해할 수 있도록 제공
 */
export interface OneViewItem {
  한눈보기일련번호: string;
  제목: string;
  주제분류?: string;
  관련법령명?: string;
  법령ID?: string;
  작성일자?: string;
  담당부서?: string;
  한눈보기상세링크?: string;
}

export interface OneViewDetail {
  한눈보기일련번호: string;
  제목: string;
  주제분류?: string;
  관련법령명?: string;
  법령ID?: string;
  작성일자?: string;
  담당부서?: string;
  내용?: string;
  시각콘텐츠URL?: string[];
  관련조문?: string;
}

/**
 * 한눈보기 목록 검색
 * @param query 검색어 (법령명, 키워드 등)
 * @param display 결과 개수 (기본 50)
 */
export async function searchOneView(
  query: string,
  options: {
    display?: number;
    page?: number;
  } = {}
): Promise<OneViewItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'oneview',
        type: 'XML',
        query: query,
        display: options.display || 50,
        page: options.page || 1,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.OneviewSearch?.oneview || parsed?.OneViewSearch?.oneView;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchOneView(${query})`);
}

/**
 * 한눈보기 상세 조회
 * @param oneViewId 한눈보기 일련번호
 */
export async function getOneViewDetail(oneViewId: string): Promise<OneViewDetail | null> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'oneview',
        type: 'XML',
        ID: oneViewId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const data = parsed?.한눈보기 || parsed?.OneView;

    if (!data) return null;

    // 시각콘텐츠 URL 배열 추출
    let 시각콘텐츠URL: string[] = [];
    if (data.시각콘텐츠) {
      const contents = Array.isArray(data.시각콘텐츠) ? data.시각콘텐츠 : [data.시각콘텐츠];
      시각콘텐츠URL = contents.map((c: any) => c.URL || c.url || c).filter(Boolean);
    }

    return {
      한눈보기일련번호: oneViewId,
      제목: data.제목,
      주제분류: data.주제분류,
      관련법령명: data.관련법령명 || data.법령명,
      법령ID: data.법령ID,
      작성일자: data.작성일자,
      담당부서: data.담당부서,
      내용: data.내용 || data.본문,
      시각콘텐츠URL,
      관련조문: data.관련조문,
    };
  }, `getOneViewDetail(${oneViewId})`);
}

/**
 * 법령명으로 관련 한눈보기 찾기
 * @param lawName 법령명
 */
export async function findOneViewByLawName(lawName: string): Promise<OneViewItem[]> {
  return searchOneView(lawName, { display: 20 });
}

// ============================================
// 2024.12 신규 - 국세법령정보시스템 판례 API
// ============================================

export interface NtsPrecedentItem {
  판례일련번호: string;
  사건번호: string;
  사건명?: string;
  선고일자: string;
  법원명?: string;
  판결유형?: string;
  세목?: string;
  판례상세링크?: string;
}

/**
 * 국세법령정보시스템 판례 검색 (2024.12 신규)
 * 국세청에서 공개하는 세법 관련 판례 4만 5천여 건
 */
export async function searchNtsPrecedents(
  query: string,
  options: {
    display?: number;
    page?: number;
    taxType?: string; // 세목 (소득세, 법인세, 부가가치세 등)
  } = {}
): Promise<NtsPrecedentItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'ntsPrec', // 국세법령정보시스템 판례
        type: 'XML',
        query: query,
        display: options.display || 100,
        page: options.page || 1,
        ...(options.taxType && { taxType: options.taxType }),
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.NtsPrecSearch?.ntsPrec;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchNtsPrecedents(${query})`);
}

// ============================================
// 2024.12 신규 - 근로복지공단 산재 판례 API
// ============================================

export interface ComwelPrecedentItem {
  판례일련번호: string;
  사건번호: string;
  사건명?: string;
  선고일자: string;
  재해유형?: string;
  인정여부?: string;
  판례상세링크?: string;
}

/**
 * 근로복지공단 산재 판례 검색 (2024.12 신규)
 * 근로복지공단에서 공개하는 산재 관련 판례 2만 7천여 건
 */
export async function searchComwelPrecedents(
  query: string,
  options: {
    display?: number;
    page?: number;
  } = {}
): Promise<ComwelPrecedentItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'comwelPrec', // 근로복지공단 산재 판례
        type: 'XML',
        query: query,
        display: options.display || 100,
        page: options.page || 1,
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.ComwelPrecSearch?.comwelPrec;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchComwelPrecedents(${query})`);
}

// ============================================
// 2024.12 신규 - 조세심판원 행정심판 재결례 API
// ============================================

export interface TaxTribunalDecisionItem {
  재결일련번호: string;
  사건번호: string;
  사건명?: string;
  재결일자: string;
  처분유형?: string;
  처분금액?: string;
  쟁점법령?: string;
  재결결과: string;
  재결요지?: string;
}

/**
 * 조세심판원 행정심판 재결례 검색 (확장)
 * 과세처분 유형, 결정일, 처분금액, 쟁점 법령 등으로 검색
 */
export async function searchTaxTribunalDecisions(
  query: string,
  options: {
    display?: number;
    page?: number;
    dispositionType?: string; // 처분유형
    startDate?: string;       // YYYYMMDD
    endDate?: string;         // YYYYMMDD
  } = {}
): Promise<TaxTribunalDecisionItem[]> {
  return requestWithRetry(async () => {
    const response = await apiClient.get('/lawSearch.do', {
      params: {
        OC: API_KEY,
        target: 'taxtrExt', // 조세심판원 확장
        type: 'XML',
        query: query,
        display: options.display || 100,
        page: options.page || 1,
        ...(options.dispositionType && { dispType: options.dispositionType }),
        ...(options.startDate && { stDate: options.startDate }),
        ...(options.endDate && { edDate: options.endDate }),
      },
    });

    const parsed = xmlParser.parse(response.data);
    const items = parsed?.TaxtrExtSearch?.taxtrExt || parsed?.TaxtrSearch?.taxtr;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }, `searchTaxTribunalDecisions(${query})`);
}

// ============================================
// 법령해석 통합 검색 (모든 소스)
// ============================================

export type InterpretationSourceType = 
  | 'expc'      // 법제처 법령해석례 (8,300건)
  | 'cgmExpc'   // 중앙부처 1차해석 (15만건)
  | 'ministry'; // 기존 부처별 해석

/**
 * 법령해석 통합 검색 결과
 */
export interface UnifiedInterpretationResult {
  source: string;
  sourceType: InterpretationSourceType;
  totalCount: number;
  items: (CgmExpcInterpretationItem | LegalInterpretationItem | MinistryInterpretationItem)[];
}

/**
 * 법령해석 통합 검색
 * 법제처 해석례 + 중앙부처 1차해석을 한번에 검색
 */
export async function searchUnifiedInterpretations(
  query: string,
  options: {
    includeLegalInterp?: boolean;  // 법제처 해석례 포함 (기본 true)
    includeCgmExpc?: boolean;      // 중앙부처 1차해석 포함 (기본 true)
    cgmExpcMinistries?: CgmExpcMinistryType[]; // 검색할 부처
    display?: number;
  } = {}
): Promise<UnifiedInterpretationResult[]> {
  const results: UnifiedInterpretationResult[] = [];
  const display = options.display || 20;

  // 1. 법제처 법령해석례
  if (options.includeLegalInterp !== false) {
    try {
      const legalInterp = await searchLegalInterpretations(query, display);
      results.push({
        source: '법제처 법령해석례',
        sourceType: 'expc',
        totalCount: legalInterp.length,
        items: legalInterp,
      });
    } catch (error) {
      console.error('법제처 해석례 검색 실패:', error);
    }
  }

  // 2. 중앙부처 1차해석
  if (options.includeCgmExpc !== false) {
    const ministries = options.cgmExpcMinistries || ['nts', 'kcs', 'moi', 'moef', 'moel'] as CgmExpcMinistryType[];
    const cgmResults = await searchAllCgmExpcInterpretations(query, ministries, display);
    
    for (const r of cgmResults) {
      if (r.results.length > 0) {
        results.push({
          source: `${r.ministry} 1차해석`,
          sourceType: 'cgmExpc',
          totalCount: r.results.length,
          items: r.results,
        });
      }
    }
  }

  return results;
}

// ============================================
// 통합 검증 함수 확장
// ============================================

export type ExtendedSourceType = SourceType | 'cgmExpc' | 'ntsPrec' | 'comwelPrec' | 'taxtr' | 'oneview';

/**
 * 확장된 법률 소스 검증 (2024.12 신규 API 포함)
 */
export async function verifyExtendedLegalSource(
  identifier: string,
  sourceType: ExtendedSourceType,
  options?: { ministryType?: CgmExpcMinistryType }
): Promise<{ exists: boolean; source: string; details?: any }> {
  try {
    let results: any[] = [];
    let sourceName = '';

    switch (sourceType) {
      case 'cgmExpc':
        sourceName = '중앙부처 1차해석';
        if (options?.ministryType) {
          results = await searchCgmExpcInterpretations(options.ministryType, identifier, { display: 10 });
          sourceName = `${CGM_EXPC_MINISTRY_MAP[options.ministryType].name} 1차해석`;
        }
        break;
      case 'ntsPrec':
        sourceName = '국세법령정보시스템 판례';
        results = await searchNtsPrecedents(identifier, { display: 10 });
        break;
      case 'comwelPrec':
        sourceName = '근로복지공단 산재 판례';
        results = await searchComwelPrecedents(identifier, { display: 10 });
        break;
      case 'taxtr':
        sourceName = '조세심판원 재결례';
        results = await searchTaxTribunalDecisions(identifier, { display: 10 });
        break;
      case 'oneview':
        sourceName = '한눈보기';
        results = await searchOneView(identifier, { display: 10 });
        break;
      default:
        // 기존 verifyLegalSourceExists 호출
        return verifyLegalSourceExists(identifier, sourceType as SourceType);
    }

    const exists = results.length > 0;
    return {
      exists,
      source: sourceName,
      details: exists ? results[0] : undefined,
    };
  } catch (error) {
    return {
      exists: false,
      source: '검색 실패',
    };
  }
}

export {
  apiClient,
  xmlParser,
};

