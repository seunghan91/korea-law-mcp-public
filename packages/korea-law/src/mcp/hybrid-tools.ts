/**
 * korea-law: MCP 하이브리드 엔진 도구
 *
 * RAG + CAG 하이브리드 지식 엔진 MCP 도구 정의
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  hybridEngine,
  queryLaw,
  searchAtTime,
  compareLawAmendment,
  cacheManager,
  cachePipeline,
  temporalRetriever,
  amendmentCompare,
  getEngineStatus,
  type HybridResponse,
  type TemporalSearchResult,
  type AmendmentComparison,
  type PointInTimeLaw,
  type PointInTimeArticle,
  type AmendmentWarning,
  type ArticleChange,
} from '../hybrid';

// ============================================
// 도구 정의
// ============================================

export const HYBRID_TOOLS: Tool[] = [
  {
    name: 'list_pending_changes',
    description: `[예정 변경 조회] 시행예정/폐지예정 법률 목록 조회 - 아직 효력이 발생하지 않은 법률이나 곧 폐지될 법률을 조회합니다.

📌 핵심 기능:
- 시행 예정 법률: 공포되었으나 아직 시행일이 도래하지 않은 법률
- 폐지 예정 법률: 다른 법률에 의해 폐지가 예정된 법률
- 긴급도 표시: 30일 이내 = 긴급, 90일 이내 = 주의

⚠️ 사용 사례:
- 계약서 작성 시 관련 법률의 변경 예정 확인
- AI 규제, 환경 규제 등 신규 법률 시행 대비
- 폐지 예정 법률 기반 계약의 리스크 검토

필터 옵션:
- change_type: EFFECTIVE(시행예정), REPEAL(폐지예정), ALL(전체)
- days_ahead: 향후 N일 이내 변경 예정만 조회
- urgency: 긴급/주의/예정 필터`,
    inputSchema: {
      type: 'object',
      properties: {
        change_type: {
          type: 'string',
          enum: ['EFFECTIVE', 'REPEAL', 'ALL'],
          description: '변경 유형 필터 (기본: ALL)',
        },
        days_ahead: {
          type: 'number',
          description: '(선택) 향후 N일 이내 변경만 조회 (예: 90)',
        },
        urgency: {
          type: 'string',
          enum: ['긴급', '주의', '예정'],
          description: '(선택) 긴급도 필터',
        },
        keyword: {
          type: 'string',
          description: '(선택) 법령명 또는 태그 검색 키워드',
        },
      },
    },
  },
  {
    name: 'hybrid_query',
    description: `[하이브리드 검색] RAG + CAG 결합 법령 검색 - 캐시(CAG)와 실시간 검색(RAG)을 자동으로 조합하여 최적의 응답을 제공합니다.

📌 핵심 기능:
- 질문 유형 자동 분류 (단순 조회/판례 분석/시점 기반 등)
- CAG: 기본 6법 등 빈출 법령 캐시로 고속 응답
- RAG: 최신 판례/개정사항 실시간 검색
- 하이브리드: 기본 법리(�G) + 구체적 사례(RAG) 결합

⚠️ 사용 사례:
- "근로기준법상 해고의 요건은?" → CAG (기본법)
- "최근 부당해고 판례는?" → RAG (최신 판례)
- "작년 5월 기준으로 적법했나요?" → 하이브리드 (시점 인식)

응답 속도:
- CAG 캐시 히트: ~50ms
- RAG 검색: ~200ms
- 하이브리드: ~250ms`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '사용자 질문 (예: "근로기준법상 해고 제한 조항은?")',
        },
        law_name: {
          type: 'string',
          description: '(선택) 특정 법령 지정 (예: 근로기준법)',
        },
        article_no: {
          type: 'string',
          description: '(선택) 특정 조문 지정 (예: 제23조)',
        },
        force_route: {
          type: 'string',
          enum: ['CAG', 'RAG', 'HYBRID'],
          description: '(선택) 강제 라우팅 (기본: 자동 분류)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'temporal_search',
    description: `[시점 인식 검색] 사건 발생일 기준 Point-in-Time 법령 검색 - "당시 법"을 정확히 찾습니다.

📌 핵심 기능:
- 질문에서 시점 자동 추출 ("작년", "2023년 5월", "3년 전" 등)
- 해당 시점에 유효했던 법령만 검색
- 현행법과 비교하여 변경 여부 알림

⚠️ 중요: 법률 상담에서 "질문 시점의 법"이 아니라 "사건 발생 시점의 법"이 적용됩니다.

사용 예시:
- "작년 5월에 음주운전을 했는데 처벌 기준이 어떻게 되나요?"
- "2023년 당시 퇴직금 지급 기준은?"
- "3년 전 계약 위반이었는지 확인해주세요"

결과: 해당 시점 유효 법령 + 현재 법과 비교 + 변경 사항 요약`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '시점이 포함된 질문 (예: "작년 5월에 음주운전...")',
        },
        law_name: {
          type: 'string',
          description: '(선택) 특정 법령으로 제한',
        },
        article_no: {
          type: 'string',
          description: '(선택) 특정 조문으로 제한',
        },
        target_date: {
          type: 'string',
          description: '(선택) 명시적 기준일 (YYYY-MM-DD)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'compare_amendment',
    description: `[개정 비교] 현행법과 시행 예정 개정안 비교 - 변경점을 자동 요약하고 선제적 경고를 제공합니다.

📌 핵심 기능:
- 현행법 vs 시행 예정 개정안 조문별 비교
- 중요 변경 자동 감지 (처벌 강화, 금액 변경, 기한 변경 등)
- D-Day 카운트 및 준비 권고사항 제공

⚠️ 사용 사례:
- "근로기준법이 곧 바뀌나요? 뭐가 달라지나요?"
- 계약서 작성 전 관련 법령 개정 예정 확인
- 컴플라이언스 사전 대비

결과:
- 요약: 신설/수정/삭제 조문 수, 중요 변경 수
- 상세: 조문별 현행 vs 개정안 대조
- 경고: 처벌/금액/기한 관련 중요 변경 알림
- 권고: 대비 조치 제안`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '비교할 법령명 (예: 근로기준법)',
        },
      },
      required: ['law_name'],
    },
  },
  {
    name: 'get_law_timeline',
    description: `[법령 타임라인] 특정 법령/조항의 개정 이력 시각화 - 법의 변천사를 파악합니다.

📌 핵심 기능:
- 제정/공포/시행 이력 조회
- 개정 연혁 및 각 개정의 핵심 변경 요약
- 특정 조항의 변경 추적

⚠️ 사용 사례:
- "근로기준법이 언제 만들어지고 어떻게 바뀌어왔나요?"
- 특정 조항의 변경 이력 확인
- 법령 연구/학술 목적

결과: 시간순 이벤트 목록 (제정/개정/폐지 등)`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '법령명',
        },
        article_no: {
          type: 'string',
          description: '(선택) 특정 조문 지정 시 해당 조문 이력만',
        },
      },
      required: ['law_name'],
    },
  },
  {
    name: 'get_cache_status',
    description: `[캐시 상태] 하이브리드 엔진 캐시 상태 조회 - HOT/WARM 캐시 현황을 확인합니다.

📌 용도:
- 캐시된 법령 목록 및 우선순위 확인
- 캐시 히트율 및 평균 응답 시간 확인
- 캐시 갱신 필요 여부 판단

결과: HOT 캐시 법령 수, WARM 캐시 법령 수, 총 토큰 수, 평균 응답 시간`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ============================================
// 핸들러 함수
// ============================================

export async function handleListPendingChanges(args: {
  change_type?: 'EFFECTIVE' | 'REPEAL' | 'ALL';
  days_ahead?: number;
  urgency?: '긴급' | '주의' | '예정';
  keyword?: string;
}): Promise<string> {
  try {
    const Database = (await import('better-sqlite3')).default;
    const path = await import('path');
    const dbPath = path.join(__dirname, '../../data/korea-law.db');
    const db = new Database(dbPath, { readonly: true });

    let results: any[] = [];

    // 통합 뷰 조회
    let query = `
      SELECT
        change_type,
        mst_id,
        law_name,
        change_date,
        days_until_change,
        change_description,
        tags,
        notes,
        urgency_level
      FROM v_all_pending_changes
      WHERE 1=1
    `;

    const params: any[] = [];

    // 변경 유형 필터
    if (args.change_type && args.change_type !== 'ALL') {
      query += ` AND change_type = ?`;
      params.push(args.change_type);
    }

    // 기간 필터
    if (args.days_ahead) {
      query += ` AND days_until_change <= ?`;
      params.push(args.days_ahead);
    }

    // 긴급도 필터
    if (args.urgency) {
      query += ` AND urgency_level = ?`;
      params.push(args.urgency);
    }

    // 키워드 검색
    if (args.keyword) {
      query += ` AND (law_name LIKE ? OR tags LIKE ?)`;
      params.push(`%${args.keyword}%`, `%${args.keyword}%`);
    }

    query += ` ORDER BY change_date ASC`;

    results = db.prepare(query).all(...params) as any[];
    db.close();

    // 응답 포맷팅
    const formatted = results.map(r => ({
      type: r.change_type === 'EFFECTIVE' ? '시행예정' : '폐지예정',
      law_name: r.law_name,
      mst_id: r.mst_id,
      change_date: r.change_date,
      days_until: Math.round(r.days_until_change),
      description: r.change_description,
      urgency: r.urgency_level,
      tags: r.tags ? JSON.parse(r.tags) : null,
      notes: r.notes,
    }));

    // 요약 통계
    const summary = {
      total: results.length,
      effective_count: results.filter(r => r.change_type === 'EFFECTIVE').length,
      repeal_count: results.filter(r => r.change_type === 'REPEAL').length,
      urgent_count: results.filter(r => r.urgency_level === '긴급').length,
      attention_count: results.filter(r => r.urgency_level === '주의').length,
    };

    return JSON.stringify({
      status: 'SUCCESS',
      summary,
      changes: formatted,
      disclaimer: '⚠️ 시행예정 법률은 입법 과정에서 변경될 수 있습니다. 최종 확인은 국가법령정보센터를 참조하세요.',
    }, null, 2);

  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleHybridQuery(args: {
  query: string;
  law_name?: string;
  article_no?: string;
  force_route?: 'CAG' | 'RAG' | 'HYBRID';
}): Promise<string> {
  try {
    const response = await queryLaw(args.query, {
      lawName: args.law_name,
      articleNo: args.article_no,
      forceRoute: args.force_route,
    });

    return JSON.stringify({
      status: 'SUCCESS',

      // 라우팅 정보
      routing: {
        route: response.routing.route,
        query_type: response.routing.queryType,
        confidence: response.routing.confidence,
        reasoning: response.routing.reasoning,
      },

      // 시간 정보
      temporal: {
        query_date: response.temporal.queryDate,
        extracted_date: response.temporal.extractedDate,
        warning: response.temporal.currentLawWarning,
        upcoming_changes: response.temporal.upcomingChanges,
      },

      // 성능
      performance: {
        total_time_ms: response.performance.totalTimeMs,
        cache_hit: response.performance.cacheHit,
        token_count: response.performance.tokenCount,
        source: response.sources.cag
          ? (response.sources.cag.source || 'CAG')
          : (response.sources.rag ? 'RAG' : 'UNKNOWN'),
      },

      // 컨텍스트
      context: response.context,

      // 보조 정보
      supplementary: response.supplementary,

      // 면책 조항
      disclaimer: '⚠️ 이 데이터는 AI 검증용입니다. 법적 판단의 최종 근거는 국가법령정보센터(law.go.kr)를 참조하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleTemporalSearch(args: {
  query: string;
  law_name?: string;
  article_no?: string;
  target_date?: string;
}): Promise<string> {
  try {
    // 명시적 날짜가 있으면 쿼리에 포함
    let searchQuery = args.query;
    if (args.target_date && !args.query.includes(args.target_date)) {
      searchQuery = `${args.target_date} 기준으로 ${args.query}`;
    }

    const result = await searchAtTime(searchQuery, {
      lawName: args.law_name,
      articleNo: args.article_no,
    });

    return JSON.stringify({
      status: 'SUCCESS',

      // 시점 추출 정보
      temporal_query: {
        original: result.query.originalQuery,
        extracted_date: result.query.extractedDate,
        method: result.query.extractionMethod,
        confidence: result.query.confidence,
        context: result.query.dateContext,
      },

      // 검색 결과
      effective_date: result.metadata.effectiveDate,
      total_results: result.metadata.totalResults,

      // 법령 결과
      laws: result.laws.map((l: PointInTimeLaw) => ({
        name: l.law.law_name,
        was_effective: l.versionInfo.wasEffective,
        effective_from: l.versionInfo.effectiveFrom,
        has_been_amended: l.versionInfo.hasBeenAmended,
        amendment_note: l.versionInfo.amendmentNote,
      })),

      // 조문 결과
      articles: result.articles.map((a: PointInTimeArticle) => ({
        law_name: a.lawName,
        article_no: a.article.article_no,
        title: a.article.article_title,
        content: a.article.content,
        was_effective: a.versionInfo.wasEffective,
        has_changed: a.versionInfo.hasChanged,
        change_summary: a.versionInfo.changeSummary,
        current_content: a.versionInfo.currentContent,
      })),

      // 경고
      warning: result.metadata.warning,

      disclaimer: '⚠️ 과거 시점 법령은 현재와 다를 수 있습니다. 최종 확인은 국가법령정보센터를 참조하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleCompareAmendment(args: {
  law_name: string;
}): Promise<string> {
  try {
    const comparison = await compareLawAmendment(args.law_name);

    if (!comparison) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        message: `"${args.law_name}" 법령을 찾을 수 없거나 개정 예정이 없습니다.`,
      });
    }

    // 읽기 쉬운 형식으로 포맷
    const formatted = amendmentCompare.formatComparison(comparison);

    return JSON.stringify({
      status: 'SUCCESS',

      // 요약
      summary: {
        law_name: comparison.lawName,
        current_enforcement_date: comparison.currentVersion.enforcementDate,
        upcoming_enforcement_date: comparison.upcomingVersion?.enforcementDate,
        days_until_change: comparison.summary.effectiveDateDiff,
        total_articles: comparison.summary.totalArticles,
        added: comparison.summary.addedCount,
        modified: comparison.summary.modifiedCount,
        deleted: comparison.summary.deletedCount,
        critical_changes: comparison.summary.criticalChanges,
      },

      // 주요 변경
      key_changes: comparison.summary.keyChanges,

      // 경고
      warnings: comparison.warnings.map((w: AmendmentWarning) => ({
        severity: w.severity,
        type: w.type,
        article: w.articleNo,
        message: w.message,
        recommendation: w.recommendation,
      })),

      // 포맷된 텍스트
      formatted_report: formatted,

      // 상세 변경 (최초 10개)
      changes_preview: comparison.changes
        .filter((c: ArticleChange) => c.changeType !== 'UNCHANGED')
        .slice(0, 10)
        .map((c: ArticleChange) => ({
          article_no: c.articleNo,
          title: c.articleTitle,
          change_type: c.changeType,
          diff_summary: c.diffSummary,
          is_critical: c.isCritical,
          critical_reason: c.criticalReason,
        })),

      disclaimer: '⚠️ 개정 예정 사항은 입법 과정에서 변경될 수 있습니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleGetLawTimeline(args: {
  law_name: string;
  article_no?: string;
}): Promise<string> {
  try {
    // 법령 ID 조회
    const law = (await import('../db/database')).findLawByName(args.law_name);
    if (!law) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        message: `"${args.law_name}" 법령을 찾을 수 없습니다.`,
      });
    }

    const timeline = await temporalRetriever.getTimeline(law.id!);

    return JSON.stringify({
      status: 'SUCCESS',
      law_name: args.law_name,
      article_filter: args.article_no || 'ALL',

      timeline: timeline.map((event) => ({
        date: event.date,
        type: event.eventType,
        description: event.description,
        article: event.articleNo,
        details: event.details,
      })),

      total_events: timeline.length,
      disclaimer: '⚠️ 연혁 정보는 참고용입니다. 정확한 내용은 국가법령정보센터를 확인하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleGetCacheStatus(): Promise<string> {
  try {
    const status = getEngineStatus();

    return JSON.stringify({
      status: 'SUCCESS',

      engine: {
        initialized: status.initialized,
      },

      cache: {
        hot_laws: status.cacheStats.hotCount,
        warm_laws: status.cacheStats.warmCount,
        total_tokens: status.cacheStats.totalTokens,
        avg_response_time_ms: status.cacheStats.avgResponseTime,
      },

      pipeline: {
        total_configured: status.pipelineStats.total,
        hot: status.pipelineStats.hot,
        warm: status.pipelineStats.warm,
        cold: status.pipelineStats.cold,
        stale: status.pipelineStats.stale,
        avg_refresh_age_hours: status.pipelineStats.avgRefreshAge,
      },

      note: 'HOT 캐시: 기본 6법 (헌법, 민법, 형법, 상법, 민사소송법, 형사소송법), WARM 캐시: 빈출 법령 (근로기준법, 세법 등)',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================
// 도구 핸들러 매핑
// ============================================

export const HYBRID_TOOL_HANDLERS: Record<string, (args: any) => Promise<string>> = {
  list_pending_changes: handleListPendingChanges,
  hybrid_query: handleHybridQuery,
  temporal_search: handleTemporalSearch,
  compare_amendment: handleCompareAmendment,
  get_law_timeline: handleGetLawTimeline,
  get_cache_status: handleGetCacheStatus,
};

// 도구 이름 목록 (switch 문에서 사용)
export const HYBRID_TOOL_NAMES = Object.keys(HYBRID_TOOL_HANDLERS);

// ============================================
// 법령 변경사항 도구 (Web Scraping Data)
// ============================================

export const LAW_CHANGES_TOOLS: Tool[] = [
  {
    name: 'get_law_changes',
    description: `[법령 변경사항 조회] 시행예정/폐지/한시/위헌 법령 목록 조회 - 웹 스크래핑 기반 최신 데이터

📌 카테고리:
- pending: 시행예정법령 (공포되었으나 미시행)
- abolished: 폐지법령
- temporary_law: 한시법령 (일정 기간 후 효력 상실)
- temporary_article: 한시조문 (특정 조문만 한시)
- unconstitutional: 위헌조문 (헌법재판소 결정)

⚠️ 주요 용도:
- 인공지능기본법 등 신규 법률 시행 일정 확인
- 계약서 작성 시 관련 법률 변경 예정 확인
- 한시법령/위헌조문 기반 조항의 유효성 점검

필터 옵션:
- category: 카테고리 선택
- days_limit: N일 이내 시행 예정만
- limit: 결과 수 제한`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['pending', 'abolished', 'temporary_law', 'temporary_article', 'unconstitutional', 'all'],
          description: '조회할 카테고리 (기본: pending)',
        },
        days_limit: {
          type: 'number',
          description: '(선택) N일 이내 시행 예정만 조회 (예: 30, 90)',
        },
        limit: {
          type: 'number',
          description: '(선택) 결과 수 제한 (기본: 50)',
        },
        keyword: {
          type: 'string',
          description: '(선택) 법령명 검색 키워드',
        },
      },
    },
  },
  {
    name: 'get_ai_law_changes',
    description: `[AI/디지털 법령 조회] 인공지능, 디지털, 데이터 관련 법령 변경사항 조회

📌 자동 필터링:
- 법령명에 "인공지능", "AI", "디지털", "데이터" 포함

⚠️ 주요 관심 법령:
- 인공지능 발전과 신뢰 기반 조성 등에 관한 기본법 (2026-01-22 시행)
- 산업 디지털 전환 및 인공지능 활용 촉진법
- 개인정보 보호법 (AI 관련 조항)

용도: AI 서비스 개발 시 규제 변화 사전 대비`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_law_changes_stats',
    description: `[법령 변경 통계] 카테고리별 법령 변경사항 통계 조회

📌 제공 정보:
- 카테고리별 전체 건수
- 30일/7일 이내 시행 예정 건수
- 마지막 스크래핑 시간

용도: 법령 변경 현황 전체 파악`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// 법령 변경사항 핸들러
export async function handleGetLawChanges(args: {
  category?: string;
  days_limit?: number;
  limit?: number;
  keyword?: string;
}): Promise<string> {
  try {
    const Database = (await import('better-sqlite3')).default;
    const path = await import('path');
    const dbPath = path.join(__dirname, '../../data/korea-law.db');
    const db = new Database(dbPath, { readonly: true });

    // LawChanges 테이블 존재 확인
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='LawChanges'
    `).get();

    if (!tableExists) {
      db.close();
      return JSON.stringify({
        status: 'NO_DATA',
        message: '법령 변경사항 데이터가 없습니다. 웹 스크래핑을 먼저 실행하세요.',
        command: 'npx ts-node scripts/scrape-law-changes.ts --category all',
      });
    }

    let query = `SELECT * FROM LawChanges WHERE 1=1`;
    const params: any[] = [];

    // 카테고리 필터
    if (args.category && args.category !== 'all') {
      query += ` AND category = ?`;
      params.push(args.category);
    }

    // 기간 필터 (시행예정만)
    if (args.days_limit !== undefined) {
      query += ` AND days_until_target IS NOT NULL AND days_until_target >= 0 AND days_until_target <= ?`;
      params.push(args.days_limit);
    }

    // 키워드 검색
    if (args.keyword) {
      query += ` AND law_name LIKE ?`;
      params.push(`%${args.keyword}%`);
    }

    query += ` ORDER BY days_until_target ASC NULLS LAST`;

    // 제한
    const limit = args.limit || 50;
    query += ` LIMIT ?`;
    params.push(limit);

    const results = db.prepare(query).all(...params) as any[];
    db.close();

    // 요약 통계
    const summary = {
      total: results.length,
      urgent: results.filter(r => r.days_until_target !== null && r.days_until_target <= 7).length,
      attention: results.filter(r => r.days_until_target !== null && r.days_until_target > 7 && r.days_until_target <= 30).length,
    };

    return JSON.stringify({
      status: 'SUCCESS',
      summary,
      data: results.map(r => ({
        category: r.category,
        law_name: r.law_name,
        article_title: r.article_title || null,
        target_date: r.target_date,
        days_until: r.days_until_target,
        law_type: r.law_type,
        ministry: r.ministry,
        revision_type: r.revision_type,
        urgency: r.days_until_target !== null
          ? (r.days_until_target <= 7 ? '🚨 긴급' : (r.days_until_target <= 30 ? '⚠️ 주의' : 'ℹ️ 예정'))
          : null,
      })),
      disclaimer: '⚠️ 이 데이터는 웹 스크래핑 기반입니다. 최종 확인은 국가법령정보센터를 참조하세요.',
    }, null, 2);

  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleGetAILawChanges(): Promise<string> {
  try {
    const Database = (await import('better-sqlite3')).default;
    const path = await import('path');
    const dbPath = path.join(__dirname, '../../data/korea-law.db');
    const db = new Database(dbPath, { readonly: true });

    // LawChanges 테이블 존재 확인
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='LawChanges'
    `).get();

    if (!tableExists) {
      db.close();
      return JSON.stringify({
        status: 'NO_DATA',
        message: '법령 변경사항 데이터가 없습니다.',
      });
    }

    const results = db.prepare(`
      SELECT * FROM LawChanges
      WHERE law_name LIKE '%인공지능%'
         OR law_name LIKE '%AI%'
         OR law_name LIKE '%디지털%'
         OR law_name LIKE '%데이터%'
      ORDER BY days_until_target ASC NULLS LAST
    `).all() as any[];

    db.close();

    return JSON.stringify({
      status: 'SUCCESS',
      total: results.length,
      data: results.map(r => ({
        category: r.category,
        law_name: r.law_name,
        target_date: r.target_date,
        days_until: r.days_until_target,
        ministry: r.ministry,
        urgency: r.days_until_target !== null
          ? (r.days_until_target <= 30 ? '🚨 주의' : 'ℹ️ 예정')
          : null,
      })),
      highlight: '🤖 AI/디지털 관련 법령은 특히 주의가 필요합니다.',
      disclaimer: '⚠️ 최종 확인은 국가법령정보센터를 참조하세요.',
    }, null, 2);

  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleGetLawChangesStats(): Promise<string> {
  try {
    const Database = (await import('better-sqlite3')).default;
    const path = await import('path');
    const dbPath = path.join(__dirname, '../../data/korea-law.db');
    const db = new Database(dbPath, { readonly: true });

    // LawChanges 테이블 존재 확인
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='LawChanges'
    `).get();

    if (!tableExists) {
      db.close();
      return JSON.stringify({
        status: 'NO_DATA',
        message: '법령 변경사항 데이터가 없습니다.',
      });
    }

    const stats = db.prepare(`
      SELECT
        category,
        COUNT(*) as total_count,
        SUM(CASE WHEN days_until_target BETWEEN 0 AND 30 THEN 1 ELSE 0 END) as within_30_days,
        SUM(CASE WHEN days_until_target BETWEEN 0 AND 7 THEN 1 ELSE 0 END) as within_7_days,
        MAX(scraped_at) as last_scraped
      FROM LawChanges
      GROUP BY category
    `).all() as any[];

    const totalCount = db.prepare(`SELECT COUNT(*) as cnt FROM LawChanges`).get() as { cnt: number };

    db.close();

    const categoryNames: Record<string, string> = {
      '시행예정법령': '시행예정',
      '폐지법령': '폐지',
      '한시법령': '한시법령',
      '한시조문': '한시조문',
      '위헌조문': '위헌',
    };

    return JSON.stringify({
      status: 'SUCCESS',
      total: totalCount.cnt,
      by_category: stats.map(s => ({
        category: s.category,
        display_name: categoryNames[s.category] || s.category,
        total: s.total_count,
        within_7_days: s.within_7_days,
        within_30_days: s.within_30_days,
        last_scraped: s.last_scraped,
      })),
      note: '웹 스크래핑 기반 데이터입니다. 매일 업데이트됩니다.',
    }, null, 2);

  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// 법령 변경사항 핸들러 매핑
export const LAW_CHANGES_HANDLERS: Record<string, (args: any) => Promise<string>> = {
  get_law_changes: handleGetLawChanges,
  get_ai_law_changes: handleGetAILawChanges,
  get_law_changes_stats: handleGetLawChangesStats,
};

// 전체 도구 목록
export const ALL_TOOLS: Tool[] = [...HYBRID_TOOLS, ...LAW_CHANGES_TOOLS];

// 전체 핸들러
export const ALL_HANDLERS: Record<string, (args: any) => Promise<string>> = {
  ...HYBRID_TOOL_HANDLERS,
  ...LAW_CHANGES_HANDLERS,
};
