/**
 * 자치법규 ES indexing 파이프라인.
 *
 * 단일 조례 XML을 받아 다음 단계를 수행:
 *  1. XML 파싱 → ParsedOrdinance (meta + articles + sections + appendices)
 *  2. ES doc 변환 (doc_type=ordinance / article / appendix)
 *  3. 임베딩 생성 (ordinance-embedder, 조문·별표 각각 1벡터)
 *  4. ES bulk indexing (ordinances_v1)
 *
 * Phase D sync 모듈에서 지자체 단위로 이 함수를 반복 호출.
 *
 * 설계 문서: docs/todo/09-ordinance-elasticsearch-indexing.md §3 (데이터 모델), §4 (Sync)
 */

import {
  parseOrdinanceXml,
  ParsedOrdinance,
  OrdinanceArticle,
  OrdinanceAppendix,
} from './ordinance-parser';
import { embedTexts, EmbedderConfig } from '../embedding/ordinance-embedder';
import { ElasticsearchClient, BulkResponse } from '../es/client';

/** ES 인덱스 기본 이름 */
export const ORDINANCES_INDEX = 'ordinances_v1';

/** ES doc 기본 공통 필드 */
interface BaseOrdinanceDoc {
  ordinance_mst: string;
  ordinance_title: string;
  municipality_code?: string;
  municipality_name: string;
  municipality_level?: number;
  parent_municipality_code?: string;
  ordinance_type?: string;
  promulgation_date?: string;
  enforcement_date?: string;
  status: string;
  department?: string;
  source_url?: string;
  raw_html_hash?: string;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

/** doc_type=ordinance (헤더 doc) */
export interface OrdinanceHeaderDoc extends BaseOrdinanceDoc {
  doc_type: 'ordinance';
  content: string;
  content_format: 'plain';
  embedding: number[];
}

/** doc_type=article */
export interface OrdinanceArticleDoc extends BaseOrdinanceDoc {
  doc_type: 'article';
  article_no: string;
  article_title: string;
  position: number;
  content: string;
  content_format: 'plain';
  embedding: number[];
}

/** doc_type=appendix */
export interface OrdinanceAppendixDoc extends BaseOrdinanceDoc {
  doc_type: 'appendix';
  appendix_no: string;
  appendix_title: string;
  position: number;
  content: string;
  content_format: 'plain' | 'markdown_table';
  embedding: number[];
}

export type OrdinanceDoc = OrdinanceHeaderDoc | OrdinanceArticleDoc | OrdinanceAppendixDoc;

export interface PipelineContext {
  /** 지자체 코드 (예: "11215" for 광진구). 제공 시 ES municipality_code 필드에 저장. */
  municipalityCode?: string;
  /** 광역/기초 level (1 or 2). 제공 시 ES에 저장. */
  municipalityLevel?: number;
  /** 상위 지자체 코드 (예: "11000" for 서울특별시) */
  parentMunicipalityCode?: string;
  /** 원본 raw HTML/XML hash (변경 감지용) */
  rawHtmlHash?: string;
  /** 임베딩 설정 오버라이드 */
  embedderConfig?: Partial<EmbedderConfig>;
  /** ES 클라이언트 (제공 안 하면 indexing 생략하고 docs만 반환) */
  esClient?: ElasticsearchClient;
  /** ES 인덱스 이름 (기본 ordinances_v1) */
  indexName?: string;
  /** indexing 후 즉시 refresh 여부 */
  refresh?: 'true' | 'false' | 'wait_for';
}

export interface PipelineResult {
  parsed: ParsedOrdinance;
  docs: OrdinanceDoc[];
  bulkResponse?: BulkResponse;
  counts: {
    articles: number;
    sections: number;
    appendices: number;
    indexed: number;
  };
}

/**
 * XML 문자열 하나를 받아 파싱 → 임베딩 → indexing 전체 흐름 실행.
 */
export async function processOrdinanceXml(
  xml: string,
  ctx: PipelineContext = {}
): Promise<PipelineResult> {
  const parsed = parseOrdinanceXml(xml);
  const docs = await buildOrdinanceDocs(parsed, ctx);

  let bulkResponse: BulkResponse | undefined;
  let indexedCount = 0;
  if (ctx.esClient && docs.length > 0) {
    const indexName = ctx.indexName || ORDINANCES_INDEX;
    const bulkItems = docs.map((doc) => ({ id: buildDocId(doc), doc: doc as unknown as Record<string, unknown> }));
    bulkResponse = await ctx.esClient.bulkIndex(indexName, bulkItems, { refresh: ctx.refresh });

    if (bulkResponse.errors) {
      const failures = bulkResponse.items.filter((item: any) => {
        const op = Object.values(item)[0] as { error?: unknown };
        return op && op.error;
      });
      throw new Error(
        `bulk indexing had ${failures.length} failures: ${JSON.stringify(failures.slice(0, 3))}`
      );
    }
    indexedCount = bulkResponse.items.length;
  }

  return {
    parsed,
    docs,
    bulkResponse,
    counts: {
      articles: parsed.articles.length,
      sections: parsed.sections.length,
      appendices: parsed.appendices.length,
      indexed: indexedCount,
    },
  };
}

/**
 * 파싱된 조례를 임베딩 생성된 ES doc들로 변환.
 *
 * 임베딩 전략:
 *  - 헤더 doc: title + 첫 조문 1~2개 본문을 이어붙여 1벡터
 *  - article doc: 조문별 content 단독 1벡터
 *  - appendix doc: title + (있다면) content 1벡터. 본문이 HWPX로만 있어 빈 경우 title로만 임베딩.
 *
 * 배치 호출: 전체 문서(헤더+N개 article+M개 appendix)의 임베딩 text를
 * 한 번에 embedTexts()로 전달 → BGE-M3가 배치 추론 수행 → 결과를 재분배.
 */
export async function buildOrdinanceDocs(
  parsed: ParsedOrdinance,
  ctx: PipelineContext = {}
): Promise<OrdinanceDoc[]> {
  const now = new Date().toISOString();

  const headerText = buildHeaderEmbeddingText(parsed);
  const articleTexts = parsed.articles.map(buildArticleEmbeddingText);
  const appendixTexts = parsed.appendices.map(buildAppendixEmbeddingText);

  const allTexts = [headerText, ...articleTexts, ...appendixTexts];
  const vectors = await embedTexts(allTexts, ctx.embedderConfig);

  const headerVec = vectors[0];
  const articleVecs = vectors.slice(1, 1 + articleTexts.length);
  const appendixVecs = vectors.slice(1 + articleTexts.length);

  const base: BaseOrdinanceDoc = {
    ordinance_mst: parsed.meta.mst,
    ordinance_title: parsed.meta.title,
    municipality_code: ctx.municipalityCode,
    municipality_name: parsed.meta.municipalityName,
    municipality_level: ctx.municipalityLevel,
    parent_municipality_code: ctx.parentMunicipalityCode,
    ordinance_type: parsed.meta.ordinanceTypeCode,
    promulgation_date: parsed.meta.promulgationDate || undefined,
    enforcement_date: parsed.meta.enforcementDate || undefined,
    status: 'ACTIVE',
    department: parsed.meta.department,
    source_url: `https://www.law.go.kr/DRF/lawService.do?OC=${process.env.LAW_OC || 'theqwe2000'}&target=ordin&MST=${parsed.meta.mst}&type=HTML`,
    raw_html_hash: ctx.rawHtmlHash,
    created_at: now,
    updated_at: now,
    last_synced_at: now,
  };

  const docs: OrdinanceDoc[] = [];

  // 헤더 doc
  docs.push({
    ...base,
    doc_type: 'ordinance',
    content: headerText,
    content_format: 'plain',
    embedding: headerVec,
  });

  // Article docs
  parsed.articles.forEach((article: OrdinanceArticle, idx: number) => {
    docs.push({
      ...base,
      doc_type: 'article',
      article_no: article.articleNo,
      article_title: article.articleTitle,
      position: article.position,
      content: article.content,
      content_format: 'plain',
      embedding: articleVecs[idx],
    });
  });

  // Appendix docs
  parsed.appendices.forEach((appendix: OrdinanceAppendix, idx: number) => {
    const content = appendix.content || appendix.title;
    docs.push({
      ...base,
      doc_type: 'appendix',
      appendix_no: `별표${parseInt(appendix.appendixNumber, 10) || appendix.appendixNumber}`,
      appendix_title: appendix.title,
      position: idx + 1,
      content,
      content_format: 'plain',
      embedding: appendixVecs[idx],
    });
  });

  return docs;
}

// ============================================
// Embedding text builders
// ============================================

function buildHeaderEmbeddingText(parsed: ParsedOrdinance): string {
  const preview = parsed.articles
    .slice(0, 2)
    .map((a) => a.content)
    .join(' ');
  return `${parsed.meta.title} ${parsed.meta.municipalityName} ${preview}`.slice(0, 2000);
}

function buildArticleEmbeddingText(article: OrdinanceArticle): string {
  return `${article.articleNo} ${article.articleTitle} ${article.content}`.slice(0, 2000);
}

function buildAppendixEmbeddingText(appendix: OrdinanceAppendix): string {
  return `${appendix.title} ${appendix.content}`.slice(0, 2000);
}

// ============================================
// Doc ID builder
// ============================================

function buildDocId(doc: OrdinanceDoc): string {
  switch (doc.doc_type) {
    case 'ordinance':
      return `${doc.ordinance_mst}:ord`;
    case 'article':
      return `${doc.ordinance_mst}:a:${doc.article_no}`;
    case 'appendix':
      return `${doc.ordinance_mst}:p:${doc.appendix_no}`;
  }
}
