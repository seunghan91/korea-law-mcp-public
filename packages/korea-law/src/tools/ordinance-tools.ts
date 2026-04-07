/**
 * 자치법규(조례) MCP 도구 5종.
 *
 * services/korea-law-mcp Express 서버에서 호출되는 핸들러.
 * ES `ordinances_v1` 인덱스에 대한 하이브리드 검색 + 조회 + 비교.
 *
 * 설계 문서: docs/todo/09-ordinance-elasticsearch-indexing.md §5 MCP 도구 인터페이스
 *
 * 도구 목록:
 *   1. searchOrdinances                         — 하이브리드 검색 (BM25 + KNN + RRF)
 *   2. getOrdinanceText                         — MST로 조례 전문
 *   3. getOrdinanceArticle                      — 특정 조문
 *   4. compareOrdinancesAcrossMunicipalities    — 여러 지자체 비교
 *   5. listMunicipalities                       — 지자체 마스터
 */

import { ElasticsearchClient } from '../es/client';
import { embedTexts } from '../embedding/ordinance-embedder';
import { METROPOLITAN_GOVERNMENTS, BASIC_GOVERNMENTS_SAMPLE } from '../sync/local-governments';

export const ORDINANCES_INDEX = 'ordinances_v1';

// ============================================
// 공용 타입
// ============================================

export interface OrdinanceHit {
  mst: string;
  title: string;
  municipality_name: string;
  municipality_code?: string;
  doc_type: 'ordinance' | 'article' | 'appendix';
  article_no?: string;
  article_title?: string;
  appendix_no?: string;
  appendix_title?: string;
  enforcement_date?: string;
  snippet: string;
  score: {
    bm25?: number;
    vector?: number;
    fused: number;
  };
  highlight?: string[];
}

interface EsHit {
  _id: string;
  _score: number;
  _source: any;
  highlight?: Record<string, string[]>;
}

// ============================================
// 1. searchOrdinances — Hybrid (BM25 + KNN + RRF)
// ============================================

export interface SearchOrdinancesParams {
  search_text: string;
  municipality_code?: string;
  municipality_name?: string;
  municipality_level?: 1 | 2;
  enforcement_after?: string; // "2024-01-01"
  doc_type?: 'ordinance' | 'article' | 'appendix' | 'all';
  limit?: number;
}

export interface SearchOrdinancesResult {
  status: 'OK' | 'ERROR';
  results: OrdinanceHit[];
  total: number;
  source: 'elasticsearch';
  strategy: 'hybrid_rrf';
  message?: string;
}

/**
 * 자치법규 하이브리드 검색.
 *
 * 1. 쿼리 임베딩 (BGE-M3)
 * 2. BM25 검색 (korean_ordinance 분석기, nori)
 * 3. KNN 검색 (dense_vector cosine)
 * 4. RRF fusion (rank_constant=60)
 *
 * ES 9.x의 retriever API 대신 클라이언트 측 RRF로 구현 — 버전 호환성 + 디버깅 용이.
 */
export async function searchOrdinances(
  params: SearchOrdinancesParams,
  es: ElasticsearchClient
): Promise<SearchOrdinancesResult> {
  if (!params.search_text || !params.search_text.trim()) {
    return {
      status: 'ERROR',
      results: [],
      total: 0,
      source: 'elasticsearch',
      strategy: 'hybrid_rrf',
      message: 'search_text is required',
    };
  }

  const limit = Math.min(Math.max(params.limit || 10, 1), 50);
  const candidates = limit * 5; // 각 retriever에서 candidates * 5개 수집 → RRF 후 limit
  const filters = buildFilters(params);

  try {
    // 1. 쿼리 임베딩
    const [queryVector] = await embedTexts([params.search_text]);

    // 2. BM25 + KNN 병렬 실행
    const [bm25Response, knnResponse] = await Promise.all([
      es.search<any>(ORDINANCES_INDEX, {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: params.search_text,
                  fields: ['ordinance_title^2', 'article_title^2', 'appendix_title^1.5', 'content'],
                  type: 'best_fields',
                },
              },
            ],
            filter: filters,
          },
        },
        _source: SOURCE_FIELDS,
        highlight: {
          fields: { content: { number_of_fragments: 2, fragment_size: 150 } },
          pre_tags: ['<em>'],
          post_tags: ['</em>'],
        },
        size: candidates,
      }),
      es.search<any>(ORDINANCES_INDEX, {
        knn: {
          field: 'embedding',
          query_vector: queryVector,
          k: candidates,
          num_candidates: Math.max(candidates * 3, 100),
          filter: filters.length > 0 ? { bool: { filter: filters } } : undefined,
        },
        _source: SOURCE_FIELDS,
        size: candidates,
      }),
    ]);

    // 3. RRF fusion
    const fused = rrfFusion(
      bm25Response.hits.hits as EsHit[],
      knnResponse.hits.hits as EsHit[],
      60
    );

    // 4. 결과 포맷팅 + limit
    const top = fused.slice(0, limit).map(toOrdinanceHit);

    return {
      status: 'OK',
      results: top,
      total: fused.length,
      source: 'elasticsearch',
      strategy: 'hybrid_rrf',
    };
  } catch (e: any) {
    return {
      status: 'ERROR',
      results: [],
      total: 0,
      source: 'elasticsearch',
      strategy: 'hybrid_rrf',
      message: e.message || String(e),
    };
  }
}

// ============================================
// 2. getOrdinanceText — MST로 조례 전문
// ============================================

export interface GetOrdinanceTextParams {
  mst: string;
  include_appendices?: boolean;
}

export interface GetOrdinanceTextResult {
  status: 'OK' | 'ERROR';
  ordinance?: {
    mst: string;
    title: string;
    municipality_name: string;
    municipality_code?: string;
    enforcement_date?: string;
    promulgation_date?: string;
    department?: string;
  };
  articles?: Array<{
    article_no: string;
    article_title: string;
    position: number;
    content: string;
  }>;
  appendices?: Array<{
    appendix_no: string;
    appendix_title: string;
    position: number;
    content: string;
  }>;
  message?: string;
}

export async function getOrdinanceText(
  params: GetOrdinanceTextParams,
  es: ElasticsearchClient
): Promise<GetOrdinanceTextResult> {
  if (!params.mst) {
    return { status: 'ERROR', message: 'mst is required' };
  }

  const includeAppendices = params.include_appendices !== false;
  const docTypes = includeAppendices
    ? ['ordinance', 'article', 'appendix']
    : ['ordinance', 'article'];

  try {
    const response = await es.search<any>(ORDINANCES_INDEX, {
      query: {
        bool: {
          filter: [
            { term: { ordinance_mst: params.mst } },
            { terms: { doc_type: docTypes } },
          ],
        },
      },
      _source: SOURCE_FIELDS,
      size: 500, // 한 조례의 모든 doc
      sort: [{ position: { order: 'asc', missing: '_first' } }],
    });

    const hits = response.hits.hits;
    if (hits.length === 0) {
      return { status: 'ERROR', message: `ordinance not found: mst=${params.mst}` };
    }

    const header = hits.find((h) => h._source.doc_type === 'ordinance');
    const articleHits = hits.filter((h) => h._source.doc_type === 'article');
    const appendixHits = hits.filter((h) => h._source.doc_type === 'appendix');

    const headerSrc = header?._source || hits[0]._source;

    return {
      status: 'OK',
      ordinance: {
        mst: params.mst,
        title: headerSrc.ordinance_title,
        municipality_name: headerSrc.municipality_name,
        municipality_code: headerSrc.municipality_code,
        enforcement_date: headerSrc.enforcement_date,
        promulgation_date: headerSrc.promulgation_date,
        department: headerSrc.department,
      },
      articles: articleHits.map((h) => ({
        article_no: h._source.article_no,
        article_title: h._source.article_title || '',
        position: h._source.position || 0,
        content: h._source.content,
      })),
      appendices: includeAppendices
        ? appendixHits.map((h) => ({
            appendix_no: h._source.appendix_no,
            appendix_title: h._source.appendix_title || '',
            position: h._source.position || 0,
            content: h._source.content,
          }))
        : undefined,
    };
  } catch (e: any) {
    return { status: 'ERROR', message: e.message || String(e) };
  }
}

// ============================================
// 3. getOrdinanceArticle — 특정 조문
// ============================================

export interface GetOrdinanceArticleParams {
  mst: string;
  article_no: string; // "제3조"
}

export interface GetOrdinanceArticleResult {
  status: 'OK' | 'ERROR';
  article?: {
    mst: string;
    ordinance_title: string;
    municipality_name: string;
    article_no: string;
    article_title: string;
    content: string;
  };
  message?: string;
}

export async function getOrdinanceArticle(
  params: GetOrdinanceArticleParams,
  es: ElasticsearchClient
): Promise<GetOrdinanceArticleResult> {
  if (!params.mst || !params.article_no) {
    return { status: 'ERROR', message: 'mst and article_no are required' };
  }

  try {
    const response = await es.search<any>(ORDINANCES_INDEX, {
      query: {
        bool: {
          filter: [
            { term: { ordinance_mst: params.mst } },
            { term: { doc_type: 'article' } },
            { term: { article_no: params.article_no } },
          ],
        },
      },
      _source: SOURCE_FIELDS,
      size: 1,
    });

    const hit = response.hits.hits[0];
    if (!hit) {
      return {
        status: 'ERROR',
        message: `article not found: mst=${params.mst}, article_no=${params.article_no}`,
      };
    }

    return {
      status: 'OK',
      article: {
        mst: params.mst,
        ordinance_title: hit._source.ordinance_title,
        municipality_name: hit._source.municipality_name,
        article_no: hit._source.article_no,
        article_title: hit._source.article_title || '',
        content: hit._source.content,
      },
    };
  } catch (e: any) {
    return { status: 'ERROR', message: e.message || String(e) };
  }
}

// ============================================
// 4. compareOrdinancesAcrossMunicipalities — 지자체별 비교
// ============================================

export interface CompareOrdinancesParams {
  search_text: string;
  municipality_codes: string[];
  limit_per_municipality?: number;
}

export interface CompareOrdinancesResult {
  status: 'OK' | 'ERROR';
  by_municipality: Array<{
    municipality_code: string;
    municipality_name?: string;
    hits: OrdinanceHit[];
  }>;
  total: number;
  message?: string;
}

/**
 * 여러 지자체에 대해 같은 주제를 검색하여 결과를 지자체별로 그룹화.
 * 예: "공무원 복무"를 서울시, 부산시, 대구시에 대해 각각 검색.
 */
export async function compareOrdinancesAcrossMunicipalities(
  params: CompareOrdinancesParams,
  es: ElasticsearchClient
): Promise<CompareOrdinancesResult> {
  if (!params.search_text || !params.municipality_codes || params.municipality_codes.length === 0) {
    return {
      status: 'ERROR',
      by_municipality: [],
      total: 0,
      message: 'search_text and municipality_codes are required',
    };
  }

  const limitPer = Math.min(Math.max(params.limit_per_municipality || 3, 1), 10);

  try {
    // 지자체별로 병렬 검색
    const results = await Promise.all(
      params.municipality_codes.map(async (code) => {
        const result = await searchOrdinances(
          {
            search_text: params.search_text,
            municipality_code: code,
            doc_type: 'article',
            limit: limitPer,
          },
          es
        );

        return {
          municipality_code: code,
          municipality_name: result.results[0]?.municipality_name,
          hits: result.results,
        };
      })
    );

    const total = results.reduce((sum, r) => sum + r.hits.length, 0);
    return {
      status: 'OK',
      by_municipality: results,
      total,
    };
  } catch (e: any) {
    return { status: 'ERROR', by_municipality: [], total: 0, message: e.message || String(e) };
  }
}

// ============================================
// 5. listMunicipalities — 지자체 마스터
// ============================================

export interface ListMunicipalitiesParams {
  level?: 1 | 2; // 1=광역, 2=기초
  parent_code?: string; // 기초일 때 광역 필터
}

export interface MunicipalityEntry {
  code: string;
  name: string;
  type: string;
  level: 1 | 2;
  parent_code?: string;
}

export interface ListMunicipalitiesResult {
  status: 'OK';
  municipalities: MunicipalityEntry[];
  total: number;
}

export function listMunicipalities(params: ListMunicipalitiesParams = {}): ListMunicipalitiesResult {
  const metros: MunicipalityEntry[] = METROPOLITAN_GOVERNMENTS.map((g) => ({
    code: g.code,
    name: g.name,
    type: g.type,
    level: 1,
  }));

  const basics: MunicipalityEntry[] = (BASIC_GOVERNMENTS_SAMPLE as any[]).map((g) => ({
    code: g.code,
    name: g.name,
    type: '기초',
    level: 2,
    parent_code: g.parent,
  }));

  let all = [...metros, ...basics];

  if (params.level !== undefined) {
    all = all.filter((m) => m.level === params.level);
  }
  if (params.parent_code) {
    all = all.filter((m) => m.parent_code === params.parent_code);
  }

  return { status: 'OK', municipalities: all, total: all.length };
}

// ============================================
// 내부 헬퍼
// ============================================

const SOURCE_FIELDS = [
  'ordinance_mst',
  'ordinance_title',
  'municipality_name',
  'municipality_code',
  'doc_type',
  'article_no',
  'article_title',
  'appendix_no',
  'appendix_title',
  'content',
  'position',
  'enforcement_date',
  'promulgation_date',
  'department',
];

function buildFilters(params: SearchOrdinancesParams): any[] {
  const filters: any[] = [];

  if (params.municipality_code) {
    filters.push({ term: { municipality_code: params.municipality_code } });
  }
  if (params.municipality_name) {
    // 정확 매칭 (municipality_name.keyword)
    filters.push({ term: { 'municipality_name.keyword': params.municipality_name } });
  }
  if (params.municipality_level !== undefined) {
    filters.push({ term: { municipality_level: params.municipality_level } });
  }
  if (params.enforcement_after) {
    filters.push({ range: { enforcement_date: { gte: params.enforcement_after } } });
  }
  if (params.doc_type && params.doc_type !== 'all') {
    filters.push({ term: { doc_type: params.doc_type } });
  }

  return filters;
}

/**
 * Reciprocal Rank Fusion.
 *
 * score(doc) = Σ 1 / (k + rank_i(doc))  for each retriever i
 *
 * @param bm25Hits ES BM25 검색 결과
 * @param knnHits ES KNN 검색 결과
 * @param rankConstant RRF k 상수 (기본 60, Cormack et al. 2009)
 */
function rrfFusion(bm25Hits: EsHit[], knnHits: EsHit[], rankConstant: number): FusedHit[] {
  const scores = new Map<
    string,
    { doc: EsHit; bm25Score?: number; vectorScore?: number; fused: number }
  >();

  bm25Hits.forEach((hit, idx) => {
    const rank = idx + 1;
    const rrf = 1 / (rankConstant + rank);
    scores.set(hit._id, {
      doc: hit,
      bm25Score: hit._score,
      fused: rrf,
    });
  });

  knnHits.forEach((hit, idx) => {
    const rank = idx + 1;
    const rrf = 1 / (rankConstant + rank);
    const existing = scores.get(hit._id);
    if (existing) {
      existing.vectorScore = hit._score;
      existing.fused += rrf;
      // bm25 highlight가 있을 수 있으니 기존 doc 유지
    } else {
      scores.set(hit._id, {
        doc: hit,
        vectorScore: hit._score,
        fused: rrf,
      });
    }
  });

  return Array.from(scores.values()).sort((a, b) => b.fused - a.fused);
}

interface FusedHit {
  doc: EsHit;
  bm25Score?: number;
  vectorScore?: number;
  fused: number;
}

function toOrdinanceHit(fused: FusedHit): OrdinanceHit {
  const src = fused.doc._source;
  const snippet =
    fused.doc.highlight?.content?.[0] ||
    (src.content ? String(src.content).slice(0, 160) : '');

  return {
    mst: String(src.ordinance_mst || ''),
    title: String(src.ordinance_title || ''),
    municipality_name: String(src.municipality_name || ''),
    municipality_code: src.municipality_code,
    doc_type: src.doc_type,
    article_no: src.article_no,
    article_title: src.article_title,
    appendix_no: src.appendix_no,
    appendix_title: src.appendix_title,
    enforcement_date: src.enforcement_date,
    snippet,
    score: {
      bm25: fused.bm25Score,
      vector: fused.vectorScore,
      fused: fused.fused,
    },
    highlight: fused.doc.highlight?.content,
  };
}
