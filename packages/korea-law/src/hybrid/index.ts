/**
 * korea-law: 하이브리드 지식 엔진 (RAG + CAG)
 *
 * 통합 인덱스 모듈
 *
 * 아키텍처:
 * ┌──────────────────────────────────────────────────────────┐
 * │                    Hybrid Engine                         │
 * │  ┌─────────────────┐       ┌─────────────────┐         │
 * │  │   CAG (Cache)   │       │   RAG (Search)  │         │
 * │  │                 │       │                 │         │
 * │  │  ┌───────────┐  │       │  ┌───────────┐  │         │
 * │  │  │ HOT Cache │  │       │  │ Temporal  │  │         │
 * │  │  │ (기본6법) │  │       │  │ Retriever │  │         │
 * │  │  └───────────┘  │       │  └───────────┘  │         │
 * │  │                 │       │                 │         │
 * │  │  ┌───────────┐  │       │  ┌───────────┐  │         │
 * │  │  │WARM Cache │  │       │  │   FTS5    │  │         │
 * │  │  │ (빈출법령)│  │       │  │  Search   │  │         │
 * │  │  └───────────┘  │       │  └───────────┘  │         │
 * │  └─────────────────┘       └─────────────────┘         │
 * │              │                    │                     │
 * │              └─────────┬──────────┘                     │
 * │                        ▼                                │
 * │              ┌─────────────────┐                        │
 * │              │  Query Router   │                        │
 * │              │ (분류 & 라우팅) │                        │
 * │              └─────────────────┘                        │
 * │                        │                                │
 * │              ┌─────────────────┐                        │
 * │              │ Cache Pipeline  │                        │
 * │              │ (자동 갱신)     │                        │
 * │              └─────────────────┘                        │
 * └──────────────────────────────────────────────────────────┘
 */

// CAG 캐시 매니저
import {
  CacheManager,
  cacheManager,
  type CacheConfig,
  type CacheContent,
  type TemporalMetadata,
  type CompiledContext,
} from './cache-manager';

// 시점 인식형 RAG 검색기
import {
  TemporalExtractor,
  TemporalRetriever,
  temporalRetriever,
  type TemporalQuery,
  type TemporalSearchResult,
  type PointInTimeLaw,
  type PointInTimeArticle,
} from './temporal-retriever';

// 하이브리드 엔진
import {
  HybridEngine,
  hybridEngine,
  QueryClassifier,
  query,
  type RouteType,
  type QueryType,
  type RoutingDecision,
  type HybridResponse,
} from './hybrid-engine';

// 캐시 파이프라인
import {
  CachePipeline,
  cachePipeline,
  type PipelineConfig,
  type PipelineResult,
  type PipelineAlert,
} from './cache-pipeline';

// 개정 비교 서비스
import {
  AmendmentCompareService,
  amendmentCompare,
  type AmendmentComparison,
  type LawVersionInfo,
  type ArticleChange,
  type ComparisonSummary,
  type AmendmentWarning,
} from './amendment-compare';

// 사용 분석 및 보고서
// Re-export all
export {
  // Cache Manager
  CacheManager,
  cacheManager,
  type CacheConfig,
  type CacheContent,
  type TemporalMetadata,
  type CompiledContext,
  // Temporal Retriever
  TemporalExtractor,
  TemporalRetriever,
  temporalRetriever,
  type TemporalQuery,
  type TemporalSearchResult,
  type PointInTimeLaw,
  type PointInTimeArticle,
  // Hybrid Engine
  HybridEngine,
  hybridEngine,
  QueryClassifier,
  query,
  type RouteType,
  type QueryType,
  type RoutingDecision,
  type HybridResponse,
  // Cache Pipeline
  CachePipeline,
  cachePipeline,
  type PipelineConfig,
  type PipelineResult,
  type PipelineAlert,
  // Amendment Compare
  AmendmentCompareService,
  amendmentCompare,
  type AmendmentComparison,
  type LawVersionInfo,
  type ArticleChange,
  type ComparisonSummary,
  type AmendmentWarning,
};

// ============================================
// 편의 함수
// ============================================

/**
 * 하이브리드 엔진 초기화
 * 서버 시작 시 호출
 */
export async function initializeHybridEngine(): Promise<void> {
  await hybridEngine.initialize();
}

/**
 * 일일 캐시 파이프라인 실행
 * GitHub Actions / Cron에서 호출
 */
export async function runDailyCachePipeline(): Promise<PipelineResult> {
  return cachePipeline.runDailyPipeline();
}

/**
 * 법령 조회 (하이브리드)
 */
export async function queryLaw(
  userQuery: string,
  options?: {
    lawName?: string;
    articleNo?: string;
    forceRoute?: RouteType;
  }
): Promise<HybridResponse> {
  return hybridEngine.query(userQuery, options);
}

/**
 * 시점 기반 법령 검색
 */
export async function searchAtTime(
  queryStr: string,
  options?: {
    lawName?: string;
    articleNo?: string;
    limit?: number;
  }
): Promise<TemporalSearchResult> {
  return temporalRetriever.search(queryStr, options);
}

/**
 * 개정 비교
 */
export async function compareLawAmendment(
  lawName: string
): Promise<AmendmentComparison | null> {
  return amendmentCompare.compare(lawName);
}

/**
 * 엔진 상태 조회
 */
export function getEngineStatus(): {
  initialized: boolean;
  cacheStats: {
    hotCount: number;
    warmCount: number;
    totalTokens: number;
    avgResponseTime: number;
  };
  pipelineStats: {
    total: number;
    hot: number;
    warm: number;
    cold: number;
    stale: number;
    avgRefreshAge: number;
  };
} {
  return {
    ...hybridEngine.getStatus(),
    pipelineStats: cachePipeline.getCacheStats(),
  };
}
