/**
 * korea-law: Supabase Client Module
 * 
 * Supabase (PostgreSQL) 연동 모듈
 * SQLite와 동일한 인터페이스를 제공하여 쉽게 전환 가능
 * 
 * ⚠️ 중요: 이 DB는 "검증용(Verification)" 목적입니다.
 * AI가 생성한 법률 인용의 정확성을 검증하기 위한 기준 데이터입니다.
 * 법적 효력의 최종 판단은 국가법령정보센터(law.go.kr)를 참조하세요.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// 환경 변수
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

// ============================================
// 타입 정의
// ============================================

export interface LawRecord {
  id?: number;
  law_mst_id: string;
  law_name: string;
  law_name_eng?: string;
  promulgation_date: string;
  enforcement_date: string;
  law_type?: string;
  ministry?: string;
  status?: string;
  source_url?: string;
  law_name_normalized?: string;
  checksum?: string;
}

export interface ArticleRecord {
  id?: number;
  law_id: number;
  article_no: string;
  article_no_normalized?: string;
  article_title?: string;
  content: string;
  paragraph_count?: number;
  content_hash?: string;
  is_definition?: boolean;
  effective_from?: string;
  effective_until?: string;
}

export interface DiffRecord {
  id?: number;
  law_id: number;
  article_id?: number;
  change_type: 'ADDED' | 'MODIFIED' | 'DELETED';
  previous_content?: string;
  current_content?: string;
  diff_summary?: string;
  detected_at?: string;
  effective_from?: string;
  is_critical?: boolean;
  warning_message?: string;
}

export interface PrecedentRecord {
  id?: number;
  case_id: string;
  case_id_normalized?: string;
  court?: string;
  case_type?: string;
  decision_date?: string;
  case_name?: string;
  exists_verified?: boolean;
}

export interface LegalTermRecord {
  id?: number;
  law_id: number;
  term: string;
  term_normalized?: string;
  definition: string;
  article_ref?: string;
}

export interface LawChangeRecord {
  id?: number;
  category: 'pending' | 'abolished' | 'temporary_law' | 'temporary_article' | 'unconstitutional';
  law_name: string;
  article_title?: string;
  target_date?: string;
  law_type?: string;
  promulgation_no?: string;
  promulgation_date?: string;
  revision_type?: string;
  ministry?: string;
  days_until_target?: number;
  source?: string;
  scraped_at?: string;
}

// ============================================
// Supabase 초기화
// ============================================

/**
 * Supabase 클라이언트 초기화 (Service Role)
 * 데이터 쓰기용 - 동기화 작업에 사용
 */
export function initSupabaseAdmin(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Supabase Admin Client initialized');
  console.log('⚠️  주의: 이 DB는 AI 검증용입니다. 법적 판단의 최종 근거로 사용하지 마세요.');

  return supabase;
}

/**
 * Supabase 클라이언트 초기화 (Anon Key)
 * 읽기 전용 - MCP 서버에서 사용
 */
export function initSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('✅ Supabase Client initialized (read-only)');

  return supabase;
}

/**
 * Supabase 클라이언트 가져오기
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    // 기본적으로 읽기 전용 클라이언트 사용
    if (SUPABASE_SERVICE_KEY) {
      return initSupabaseAdmin();
    }
    return initSupabaseClient();
  }
  return supabase;
}

// ============================================
// 법령 관련 함수
// ============================================

/**
 * 법령 추가/업데이트 (Upsert)
 */
export async function upsertLaw(law: LawRecord): Promise<number> {
  const db = getSupabase();
  const normalized = normalizeLawName(law.law_name);
  const checksum = generateChecksum(JSON.stringify(law));

  const { data, error } = await db
    .from('laws')
    .upsert({
      ...law,
      law_name_normalized: normalized,
      checksum: checksum,
      last_synced_at: new Date().toISOString(),
    }, {
      onConflict: 'law_mst_id',
    })
    .select('id')
    .single();

  if (error) {
    console.error('법령 upsert 실패:', error);
    throw error;
  }

  return data?.id || 0;
}

/**
 * 조문 추가/업데이트
 */
export async function upsertArticle(article: ArticleRecord): Promise<number> {
  const db = getSupabase();
  const normalized = normalizeArticleNo(article.article_no);
  const contentHash = generateChecksum(article.content);

  const { data, error } = await db
    .from('articles')
    .upsert({
      ...article,
      article_no_normalized: normalized,
      content_hash: contentHash,
    }, {
      onConflict: 'law_id,article_no',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('조문 upsert 실패:', error);
    throw error;
  }

  return data?.id || 0;
}

/**
 * 변경 이력 기록
 */
export async function insertDiffLog(diff: DiffRecord): Promise<number> {
  const db = getSupabase();

  const { data, error } = await db
    .from('diff_logs')
    .insert(diff)
    .select('id')
    .single();

  if (error) {
    console.error('Diff 기록 실패:', error);
    throw error;
  }

  return data?.id || 0;
}

/**
 * 판례 추가
 */
export async function upsertPrecedent(precedent: PrecedentRecord): Promise<number> {
  const db = getSupabase();
  const normalized = normalizeCaseId(precedent.case_id);

  const { data, error } = await db
    .from('precedents')
    .upsert({
      ...precedent,
      case_id_normalized: normalized,
      last_verified_at: new Date().toISOString(),
    }, {
      onConflict: 'case_id',
    })
    .select('id')
    .single();

  if (error) {
    console.error('판례 upsert 실패:', error);
    throw error;
  }

  return data?.id || 0;
}

/**
 * 법률 용어 추가
 */
export async function upsertLegalTerm(term: LegalTermRecord): Promise<number> {
  const db = getSupabase();
  const normalized = term.term.replace(/\s+/g, '').toLowerCase();

  const { data, error } = await db
    .from('legal_terms')
    .upsert({
      ...term,
      term_normalized: normalized,
    }, {
      onConflict: 'law_id,term',
      ignoreDuplicates: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('용어 upsert 실패:', error);
    throw error;
  }

  return data?.id || 0;
}

// ============================================
// 검색/조회 함수 (MCP Tools에서 사용)
// ============================================

/**
 * 법령명으로 검색 (현행 기준)
 * 1. 정확한 law_name 매칭 우선
 * 2. law_name_normalized 부분 매칭 시도
 */
export async function findLawByName(lawName: string, targetDate?: string): Promise<LawRecord | null> {
  const db = getSupabase();
  const normalized = normalizeLawName(lawName);
  const date = targetDate || new Date().toISOString().split('T')[0];

  // 1. 정확한 law_name 매칭 우선 시도
  const { data: exactData, error: exactError } = await db
    .from('laws')
    .select('*')
    .eq('law_name', lawName)
    .lte('enforcement_date', date)
    .eq('status', 'ACTIVE')
    .order('enforcement_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exactData) {
    return exactData;
  }

  if (exactError && exactError.code !== 'PGRST116') {
    console.error('법령 정확 검색 실패:', exactError);
  }

  // 2. law_name_normalized 부분 매칭 시도
  const { data, error } = await db
    .from('laws')
    .select('*')
    .or(`law_name_normalized.ilike.%${normalized}%,law_name.ilike.%${lawName}%`)
    .lte('enforcement_date', date)
    .eq('status', 'ACTIVE')
    .order('enforcement_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('법령 검색 실패:', error);
  }

  return data;
}

/**
 * 특정 조문 조회 (여러 패턴으로 검색)
 *
 * 목적: "제750조", "750", "750조" 등 다양한 입력을 처리
 *
 * 검색 전략:
 * 1. 입력값의 모든 변형에 대해 정확한 매칭 시도
 * 2. article_no_normalized 필드로 검색
 * 3. 가지조문이 아닌 경우 숫자만으로 폴백 검색
 *
 * ⚠️ 가지조문 구분: "382"를 검색할 때 "382의2"가 매칭되지 않도록 함
 */
export async function findArticle(lawId: number, articleNo: string): Promise<ArticleRecord | null> {
  const db = getSupabase();
  const variants = getArticleNoVariants(articleNo);
  const normalized = normalizeArticleNo(articleNo);

  // 1. 각 변형에 대해 정확한 매칭 시도
  for (const variant of variants) {
    const { data, error } = await db
      .from('articles')
      .select('*')
      .eq('law_id', lawId)
      .eq('article_no', variant)
      .is('effective_until', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return data;
    }

    if (error && error.code !== 'PGRST116') {
      console.error('조문 검색 실패 (variant):', error);
    }
  }

  // 2. article_no_normalized 필드로 검색
  const { data: normalizedData, error: normalizedError } = await db
    .from('articles')
    .select('*')
    .eq('law_id', lawId)
    .eq('article_no_normalized', normalized)
    .is('effective_until', null)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (normalizedData) {
    return normalizedData;
  }

  if (normalizedError && normalizedError.code !== 'PGRST116') {
    console.error('조문 검색 실패 (normalized):', normalizedError);
  }

  // 3. 가지조문이 아닌 경우에만 숫자로 폴백 검색
  // "382"를 검색할 때 "382의2"가 매칭되지 않도록 주의
  const numbersOnly = articleNo.replace(/[^0-9]/g, '');
  const hasSubArticle = articleNo.includes('의');

  if (numbersOnly && !hasSubArticle) {
    const { data: fallbackData, error: fallbackError } = await db
      .from('articles')
      .select('*')
      .eq('law_id', lawId)
      .eq('article_no', numbersOnly)
      .is('effective_until', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackData) {
      return fallbackData;
    }

    if (fallbackError && fallbackError.code !== 'PGRST116') {
      console.error('조문 검색 실패 (fallback):', fallbackError);
    }
  }

  return null;
}

/**
 * 오늘의 변경 사항 조회
 */
export async function getTodayDiffs(): Promise<any[]> {
  const db = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await db
    .from('today_diffs')
    .select('*')
    .eq('detected_at', today)
    .order('is_critical', { ascending: false });

  if (error) {
    console.error('오늘 Diff 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * 기간 내 변경 예정 법령 조회
 */
export async function getFutureChanges(startDate: string, endDate: string): Promise<any[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from('diff_logs')
    .select(`
      *,
      laws(law_name),
      articles(article_no, article_title)
    `)
    .gte('effective_from', startDate)
    .lte('effective_from', endDate)
    .order('effective_from', { ascending: true });

  if (error) {
    console.error('미래 변경 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * 판례 존재 여부 확인
 */
export async function verifyPrecedentExists(caseId: string): Promise<boolean> {
  const db = getSupabase();
  const normalized = normalizeCaseId(caseId);

  const { data, error } = await db
    .from('precedents')
    .select('id')
    .or(`case_id.eq.${caseId},case_id_normalized.eq.${normalized}`)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('판례 확인 실패:', error);
  }

  return !!data;
}

/**
 * 법률 용어 검색
 */
export async function findLegalTerm(lawId: number, term: string): Promise<LegalTermRecord | null> {
  const db = getSupabase();
  const normalized = term.replace(/\s+/g, '').toLowerCase();

  const { data, error } = await db
    .from('legal_terms')
    .select('*')
    .eq('law_id', lawId)
    .or(`term.ilike.%${term}%,term_normalized.eq.${normalized}`)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('용어 검색 실패:', error);
  }

  return data;
}

// ============================================
// 법령 변경사항 관련 함수 (Web Scraping Data)
// ============================================

/**
 * 법령 변경사항 추가/업데이트 (Upsert)
 */
export async function upsertLawChange(change: LawChangeRecord): Promise<number> {
  const db = getSupabase();

  const { data, error } = await db
    .from('law_changes')
    .upsert({
      ...change,
      scraped_at: change.scraped_at || new Date().toISOString(),
    }, {
      onConflict: 'category,law_name,promulgation_no,article_title',
    })
    .select('id')
    .single();

  if (error) {
    console.error('법령 변경사항 upsert 실패:', error);
    throw error;
  }

  return data?.id || 0;
}

/**
 * 법령 변경사항 배치 업서트 (대량 데이터용)
 */
export async function upsertLawChangesBatch(changes: LawChangeRecord[]): Promise<{ inserted: number; errors: number }> {
  const db = getSupabase();
  let inserted = 0;
  let errors = 0;

  // 100개씩 배치 처리
  for (let i = 0; i < changes.length; i += 100) {
    const batch = changes.slice(i, i + 100).map(change => ({
      ...change,
      article_title: change.article_title || '',
      scraped_at: change.scraped_at || new Date().toISOString(),
    }));

    const { error } = await db
      .from('law_changes')
      .upsert(batch, {
        onConflict: 'category,law_name,promulgation_no,article_title',
      });

    if (error) {
      console.error('배치 upsert 실패:', error);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

/**
 * 특정 카테고리의 법령 변경사항 조회
 */
export async function getLawChangesByCategory(
  category: LawChangeRecord['category'],
  options?: { limit?: number; daysUntil?: number }
): Promise<LawChangeRecord[]> {
  const db = getSupabase();

  let query = db
    .from('law_changes')
    .select('*')
    .eq('category', category)
    .order('days_until_target', { ascending: true, nullsFirst: false });

  if (options?.daysUntil !== undefined) {
    query = query.gte('days_until_target', 0).lte('days_until_target', options.daysUntil);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('법령 변경사항 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * 시행 임박 법령 조회 (30일 이내)
 */
export async function getUpcomingLaws(daysLimit: number = 30): Promise<LawChangeRecord[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from('law_changes')
    .select('*')
    .eq('category', 'pending')
    .gte('days_until_target', 0)
    .lte('days_until_target', daysLimit)
    .order('days_until_target', { ascending: true });

  if (error) {
    console.error('시행 임박 법령 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * AI 관련 법령 변경사항 조회
 */
export async function getAIRelatedLawChanges(): Promise<LawChangeRecord[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from('law_changes')
    .select('*')
    .or('law_name.ilike.%인공지능%,law_name.ilike.%AI%,law_name.ilike.%디지털%,law_name.ilike.%데이터%')
    .order('days_until_target', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('AI 관련 법령 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * 법령 변경사항 통계 조회
 */
export async function getLawChangesStats(): Promise<{
  category: string;
  total_count: number;
  within_30_days: number;
  within_7_days: number;
  last_scraped: string;
}[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from('law_changes_stats')
    .select('*');

  if (error) {
    console.error('법령 변경사항 통계 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * 카테고리별 법령 변경사항 전체 삭제 (스크래핑 갱신용)
 */
export async function clearLawChangesByCategory(category: LawChangeRecord['category']): Promise<void> {
  const db = getSupabase();

  const { error } = await db
    .from('law_changes')
    .delete()
    .eq('category', category);

  if (error) {
    console.error('법령 변경사항 삭제 실패:', error);
    throw error;
  }
}

/**
 * 동기화 메타데이터 기록
 */
export async function recordSyncMetadata(metadata: {
  sync_type: string;
  started_at: string;
  completed_at?: string;
  status: string;
  laws_added?: number;
  laws_updated?: number;
  articles_added?: number;
  articles_updated?: number;
  diffs_detected?: number;
  error_message?: string;
  source_data_date?: string;
}): Promise<number> {
  const db = getSupabase();

  const { data, error } = await db
    .from('sync_metadata')
    .insert(metadata)
    .select('id')
    .single();

  if (error) {
    console.error('동기화 메타데이터 기록 실패:', error);
    throw error;
  }

  return data?.id || 0;
}

// ============================================
// 유틸리티 함수
// ============================================

function normalizeLawName(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/[^\w가-힣]/g, '')
    .toLowerCase();
}

/**
 * 조문번호 정규화 함수
 *
 * 목적: 다양한 형식의 조문번호 입력을 DB 저장 형식과 일치시킴
 *
 * 변환 예시:
 * - "제750조" → "750"
 * - "제382조의4" → "382의4"  (중요: "의"를 유지, "-"로 바꾸지 않음)
 * - "382조" → "382"
 *
 * DB 저장 형식: "750", "382", "382의4" (숫자 또는 숫자의숫자)
 *
 * ⚠️ 주의: "조의" → "의"로 변환 (하이픈 아님)
 * 이전 버그: "조의" → "-"로 변환하여 "382-4"가 되어 DB의 "382의4"와 불일치
 */
function normalizeArticleNo(articleNo: string): string {
  return articleNo
    .replace(/제/g, '')
    .replace(/조의/g, '의')  // "조의" → "의" (DB 형식과 일치, "-" 아님!)
    .replace(/조/g, '')
    .replace(/항/g, '.')
    .replace(/호/g, '-')
    .trim();
}

/**
 * 조문번호 검색을 위한 변형 생성
 *
 * 목적: 사용자가 입력할 수 있는 다양한 형식을 모두 검색
 *
 * 예시: "제750조" 입력 시 ["제750조", "750", "750"] 생성
 * 예시: "제382조의4" 입력 시 ["제382조의4", "382의4", "3824", "382의4"] 생성
 *
 * 이를 통해 DB에 어떤 형식으로 저장되어 있든 매칭 가능
 */
function getArticleNoVariants(articleNo: string): string[] {
  const str = String(articleNo || '').trim();
  const variants: string[] = [];

  // 원본 추가
  variants.push(str);

  // "제X조" → "X" 변환
  const withoutPrefix = str.replace(/^제/, '').replace(/조$/, '').replace(/조의/, '의');
  variants.push(withoutPrefix);

  // "제382조" → "382" (숫자만)
  const numbersOnly = str.replace(/[^0-9]/g, '');
  if (numbersOnly) {
    variants.push(numbersOnly);
  }

  // "제382조의4" → "382의4"
  const withSuffix = str.replace(/^제/, '').replace(/조의/, '의').replace(/조$/, '');
  if (withSuffix !== withoutPrefix) {
    variants.push(withSuffix);
  }

  // 중복 제거
  return [...new Set(variants.filter(v => v.length > 0))];
}

function normalizeCaseId(caseId: string): string {
  return caseId.replace(/\s+/g, '').replace(/[^\w가-힣]/g, '');
}

function generateChecksum(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

// ============================================
// Hybrid Search 함수 (pgvector + Full Text Search)
// ============================================

export interface HybridSearchResult {
  id: number;
  law_id: number;
  article_no: string;
  article_title: string | null;
  content: string;
  law_name: string;
  effective_from: string | null;
  fts_rank: number;
  semantic_rank: number;
  combined_score: number;
}

// Upstage Solar Embedding 차원 (4096)
export const EMBEDDING_DIMENSION = 4096;

export interface SearchOptions {
  fullTextWeight?: number;
  semanticWeight?: number;
  matchCount?: number;
  rrfK?: number;
}

/**
 * Hybrid Search: Full Text Search + Semantic Search (RRF 결합)
 *
 * @param queryText - 검색 쿼리 텍스트
 * @param queryEmbedding - 쿼리의 임베딩 벡터 (1536 dims)
 * @param options - 검색 옵션
 * @returns 결합된 검색 결과
 *
 * @example
 * const embedding = await getEmbedding("해고 절차");
 * const results = await hybridSearchArticles("해고 절차", embedding, {
 *   fullTextWeight: 1.0,
 *   semanticWeight: 0.5,
 *   matchCount: 10
 * });
 */
export async function hybridSearchArticles(
  queryText: string,
  queryEmbedding: number[],
  options: SearchOptions = {}
): Promise<HybridSearchResult[]> {
  const db = getSupabase();

  const {
    fullTextWeight = 1.0,
    semanticWeight = 1.0,
    matchCount = 10,
    rrfK = 60
  } = options;

  const { data, error } = await db.rpc('hybrid_search_articles', {
    query_text: queryText,
    query_embedding: JSON.stringify(queryEmbedding),
    full_text_weight: fullTextWeight,
    semantic_weight: semanticWeight,
    match_count: matchCount,
    rrf_k: rrfK
  });

  if (error) {
    console.error('Hybrid Search 실패:', error);
    throw error;
  }

  return data || [];
}

/**
 * Full Text Search Only (키워드 기반)
 * Embedding 없이 키워드 매칭만 수행
 *
 * @param queryText - 검색 쿼리 텍스트
 * @param matchCount - 반환할 결과 수
 */
export async function searchArticlesFTS(
  queryText: string,
  matchCount: number = 10
): Promise<Omit<HybridSearchResult, 'fts_rank' | 'semantic_rank' | 'combined_score'> & { rank: number }[]> {
  const db = getSupabase();

  const { data, error } = await db.rpc('search_articles_fts', {
    query_text: queryText,
    match_count: matchCount
  });

  if (error) {
    console.error('FTS 검색 실패:', error);
    throw error;
  }

  return data || [];
}

/**
 * Semantic Search Only (의미 기반)
 * Embedding 벡터 유사도만으로 검색
 *
 * @param queryEmbedding - 쿼리의 임베딩 벡터
 * @param matchCount - 반환할 결과 수
 * @param similarityThreshold - 최소 유사도 임계값 (0-1)
 */
export async function searchArticlesSemantic(
  queryEmbedding: number[],
  matchCount: number = 10,
  similarityThreshold: number = 0.5
): Promise<Omit<HybridSearchResult, 'fts_rank' | 'semantic_rank' | 'combined_score'> & { similarity: number }[]> {
  const db = getSupabase();

  const { data, error } = await db.rpc('search_articles_semantic', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: matchCount,
    similarity_threshold: similarityThreshold
  });

  if (error) {
    console.error('Semantic 검색 실패:', error);
    throw error;
  }

  return data || [];
}

/**
 * 조문에 임베딩 업데이트
 * 동기화 시 임베딩 생성 후 호출
 */
export async function updateArticleEmbedding(
  articleId: number,
  embedding: number[]
): Promise<void> {
  const db = getSupabase();

  const { error } = await db
    .from('articles')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', articleId);

  if (error) {
    console.error('임베딩 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 배치로 여러 조문에 임베딩 업데이트
 */
export async function updateArticleEmbeddingsBatch(
  updates: { id: number; embedding: number[] }[]
): Promise<{ updated: number; errors: number }> {
  const db = getSupabase();
  let updated = 0;
  let errors = 0;

  // 100개씩 배치 처리
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100);

    for (const { id, embedding } of batch) {
      const { error } = await db
        .from('articles')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', id);

      if (error) {
        console.error(`임베딩 업데이트 실패 (id: ${id}):`, error);
        errors++;
      } else {
        updated++;
      }
    }
  }

  return { updated, errors };
}

// ============================================
// 동기화 메타데이터 조회 (Catch-up Sync용)
// ============================================

export interface SyncMetadataRecord {
  id: number;
  sync_type: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  laws_added: number;
  laws_updated: number;
  articles_added: number;
  articles_updated: number;
  diffs_detected: number;
  error_message: string | null;
  source_data_date: string | null;
}

/**
 * 마지막 성공한 동기화 메타데이터 조회
 * catch-up sync의 시작점을 결정하는 데 사용
 */
export async function getLastSuccessfulSync(): Promise<SyncMetadataRecord | null> {
  const db = getSupabase();

  const { data, error } = await db
    .from('sync_metadata')
    .select('*')
    .eq('status', 'SUCCESS')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('마지막 동기화 조회 실패:', error);
    return null;
  }

  return data as SyncMetadataRecord | null;
}

/**
 * 특정 날짜 이후 동기화 이력 조회
 */
export async function getSyncHistorySince(sinceDate: string): Promise<SyncMetadataRecord[]> {
  const db = getSupabase();

  const { data, error } = await db
    .from('sync_metadata')
    .select('*')
    .gte('started_at', sinceDate)
    .order('started_at', { ascending: true });

  if (error) {
    console.error('동기화 이력 조회 실패:', error);
    return [];
  }

  return (data || []) as SyncMetadataRecord[];
}

/**
 * 실제 데이터의 마지막 갱신 시점 조회
 * sync_metadata가 비어있을 때 fallback으로 사용
 */
export async function getLastDataUpdateDate(): Promise<string | null> {
  const db = getSupabase();

  // laws의 마지막 created_at
  const { data: lastLaw } = await db
    .from('laws')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // articles의 마지막 created_at
  const { data: lastArticle } = await db
    .from('articles')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const dates = [lastLaw?.created_at, lastArticle?.created_at].filter(Boolean) as string[];

  if (dates.length === 0) return null;

  // 가장 최신 날짜 반환
  dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return dates[0];
}

/**
 * 동기화 gap 계산 (마지막 성공 ~ 현재)
 *
 * 우선순위:
 * 1. sync_metadata의 마지막 성공 기록
 * 2. fallback: 실제 데이터(laws/articles)의 마지막 created_at
 *
 * @returns gap 일수와 마지막 성공 시점, 또는 데이터가 전혀 없으면 null
 */
export async function calculateSyncGap(): Promise<{
  lastSuccessDate: string;
  gapDays: number;
  missedSyncs: number;
  source: 'sync_metadata' | 'data_timestamp';
} | null> {
  // 1차: sync_metadata에서 마지막 성공 기록 확인
  const lastSync = await getLastSuccessfulSync();

  if (lastSync?.completed_at) {
    const lastDate = new Date(lastSync.completed_at);
    const now = new Date();
    const gapDays = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    const failedSyncs = await getSyncHistorySince(lastSync.completed_at);
    const missedSyncs = failedSyncs.filter(s => s.status === 'FAILED').length;

    return { lastSuccessDate: lastSync.completed_at, gapDays, missedSyncs, source: 'sync_metadata' };
  }

  // 2차 fallback: 실제 데이터의 마지막 갱신일
  console.log('ℹ️  sync_metadata 이력 없음 — 실제 데이터 갱신일로 판단합니다.');
  const lastDataDate = await getLastDataUpdateDate();

  if (!lastDataDate) {
    console.log('ℹ️  데이터가 전혀 없습니다. 전체 동기화가 필요합니다.');
    return null;
  }

  const lastDate = new Date(lastDataDate);
  const now = new Date();
  const gapDays = Math.ceil((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`ℹ️  마지막 데이터 갱신: ${lastDataDate} (${gapDays}일 전)`);

  return { lastSuccessDate: lastDataDate, gapDays, missedSyncs: 0, source: 'data_timestamp' };
}

export {
  normalizeLawName,
  normalizeArticleNo,
  normalizeCaseId,
  generateChecksum,
};

