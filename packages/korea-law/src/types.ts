/**
 * korea-law: TypeScript Type Definitions
 */

// ============================================
// Core Law Types
// ============================================

export interface Law {
  law_id: string;
  law_name: string;
  law_name_en?: string;
  law_type: LawType;
  status: LawStatus;
  enforcement_date: string;
  promulgation_date: string;
  department: string;
  content_summary?: string;
  full_text?: string;
  created_at: string;
  updated_at: string;
}

export type LawType = '헌법' | '법률' | '대통령령' | '총리령' | '부령' | '조례' | '규칙';

export type LawStatus = 'active' | 'abolished' | 'pending';

// ============================================
// Law Article Types
// ============================================

export interface LawArticle {
  article_id: string;
  law_id: string;
  article_number: string; // "제1조", "제2조의2"
  article_title?: string; // "(목적)", "(정의)"
  article_content: string;
  parent_article_id?: string; // 조항 계층 구조
  created_at: string;
  updated_at: string;
}

// ============================================
// Law Change Log Types
// ============================================

export interface LawChange {
  law_id: string;
  law_name: string;
  change_type: ChangeType;
  changed_at: string;
  before_value: string | null;
  after_value: string | null;
  description: string;
}

export type ChangeType = 'new' | 'modified' | 'abolished';

// ============================================
// Verification Types
// ============================================

export interface VerificationRequest {
  law_citation: string; // "민법 제1조"
  claimed_content: string; // AI가 주장하는 내용
  context?: string; // 추가 컨텍스트
}

export interface VerificationResult {
  is_valid: boolean;
  confidence: number; // 0.0 ~ 1.0
  verification_type: VerificationType;
  details: VerificationDetails;
}

export type VerificationType =
  | 'exact_match'       // 정확히 일치
  | 'partial_match'     // 부분 일치
  | 'outdated'          // 구법 인용 (개정됨)
  | 'incorrect'         // 틀린 인용
  | 'not_found';        // 법령 존재 안 함

export interface VerificationDetails {
  law_id?: string;
  law_name?: string;
  article_number?: string;
  correct_content?: string;
  diff?: string; // 차이점 설명
  suggestion?: string; // 수정 제안
  source_url?: string; // 국가법령정보센터 링크
}

// ============================================
// API Response Types
// ============================================

export interface LawAPIResponse {
  success: boolean;
  total_count: number;
  page: number;
  page_size: number;
  laws: Law[];
}

export interface LawDetailResponse {
  success: boolean;
  law: Law | null;
  articles: LawArticle[];
}

// ============================================
// Search Types
// ============================================

export interface SearchQuery {
  query: string;
  law_type?: LawType;
  department?: string;
  status?: LawStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  total_count: number;
  laws: Law[];
  suggestions?: string[];
}

// ============================================
// MCP Tool Types
// ============================================

export interface VerifyLawToolArgs {
  law_citation: string;
  claimed_content: string;
  context?: string;
}

export interface SearchLawToolArgs {
  query: string;
  law_type?: LawType;
  limit?: number;
}

export interface GetLawDetailToolArgs {
  law_id: string;
  include_articles?: boolean;
}

export interface GetRecentChangesToolArgs {
  days?: number;
  change_type?: ChangeType;
  limit?: number;
}

// ============================================
// Bracket Parser Types (법조문 괄호 파싱)
// ============================================

/**
 * 괄호 유형
 * @description 법조문에서 사용되는 괄호의 기능적 분류
 */
export type BracketType =
  | 'definition'    // 정의 괄호: 용어 정의
  | 'exception'     // 예외 괄호: 예외 상황 명시
  | 'reference'     // 참조 괄호: 다른 조항 인용
  | 'limit'         // 한정 괄호: 범위 한정
  | 'supplement'    // 보충 괄호: 보충 설명
  | 'enumeration'   // 열거 괄호: 항목 열거
  | 'unknown';      // 분류 불가

/**
 * 괄호 정보
 */
export interface BracketInfo {
  /** 괄호 시작 위치 (원본 텍스트 기준) */
  start: number;
  /** 괄호 끝 위치 (원본 텍스트 기준) */
  end: number;
  /** 괄호 유형 */
  type: BracketType;
  /** 괄호 내용 (괄호 기호 제외) */
  content: string;
  /** 괄호 깊이 (0 = 최상위) */
  depth: number;
  /** 중첩된 하위 괄호들 */
  nested: BracketInfo[];
}

/**
 * 간소화 결과
 */
export interface SimplifyResult {
  /** 원본 텍스트 */
  original: string;
  /** 간소화된 텍스트 (괄호 제거) */
  simplified: string;
  /** 하이라이트용 HTML */
  highlighted: string;
  /** 파싱된 괄호 정보 */
  brackets: BracketInfo[];
  /** 제거된 문자 수 */
  removedChars: number;
  /** 압축률 (%) */
  compressionRate: number;
}

/**
 * 간소화 옵션
 */
export interface SimplifyOptions {
  /** 숨길 괄호 유형 (기본: 모든 유형) */
  hideTypes?: BracketType[];
  /** 최대 숨길 깊이 (기본: 무제한) */
  maxHideDepth?: number;
  /** 최소 내용 길이 (이 길이 이하는 유지) */
  minContentLength?: number;
  /** 참조 괄호 유지 여부 (기본: false) */
  keepReferences?: boolean;
  /** 정의 괄호 유지 여부 (기본: false) */
  keepDefinitions?: boolean;
}

// ============================================
// Simplify Statute Tool Types
// ============================================

export interface SimplifyStatuteToolArgs {
  /** 법령명 */
  law_name: string;
  /** 조문 번호 (예: "제1조", "제2조의2") */
  article_number?: string;
  /** 직접 텍스트 입력 (law_name 대신 사용 가능) */
  text?: string;
  /** 출력 모드 */
  mode?: 'original' | 'simplified' | 'highlighted' | 'all';
  /** 간소화 옵션 */
  options?: SimplifyOptions;
}
