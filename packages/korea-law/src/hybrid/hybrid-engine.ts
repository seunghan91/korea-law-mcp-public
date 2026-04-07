/**
 * korea-law: 하이브리드 지식 엔진 (RAG + CAG)
 *
 * 핵심 기능:
 * 1. 질문 분류 → CAG/RAG/HYBRID 라우팅
 * 2. CAG: 캐시된 기본 법령 고속 응답
 * 3. RAG: 최신 판례/개정법령 실시간 검색
 * 4. HYBRID: 두 결과 결합
 */

import { cacheManager, type CompiledContext } from './cache-manager';
import {
  temporalRetriever,
  TemporalExtractor,
  type TemporalSearchResult,
  type TemporalQuery,
} from './temporal-retriever';
import {
  getDatabase,
  findLawByName,
  findArticle,
  searchArticlesFTS,
  verifyPrecedentExists,
  getTodayDiffs,
  getFutureChanges,
  type LawRecord,
  type ArticleRecord,
} from '../db/database';

// ============================================
// 타입 정의
// ============================================

export type RouteType = 'CAG' | 'RAG' | 'HYBRID';
export type QueryType =
  | 'SIMPLE_LOOKUP'      // 단순 법령 조회
  | 'DEFINITION_CHECK'   // 용어 정의 확인
  | 'CASE_ANALYSIS'      // 판례 분석
  | 'RECENT_CHANGES'     // 최신 개정
  | 'TEMPORAL_QUERY'     // 시점 기반 질문
  | 'COMPLEX_ANALYSIS'   // 복합 분석
  | 'GENERAL';           // 일반

export interface RoutingDecision {
  route: RouteType;
  queryType: QueryType;
  cagWeight: number;
  ragWeight: number;
  confidence: number;
  reasoning: string;
}

export interface HybridResponse {
  // 메인 응답 컨텍스트
  context: string;

  // 소스 정보
  sources: {
    cag: CompiledContext | null;
    rag: TemporalSearchResult | null;
  };

  // 라우팅 정보
  routing: RoutingDecision;

  // 시간 정보
  temporal: {
    queryDate: string;
    extractedDate: string | null;
    currentLawWarning: string | null;
    upcomingChanges: Array<{
      lawName: string;
      effectiveDate: string;
      summary: string;
    }>;
  };

  // 성능 지표
  performance: {
    totalTimeMs: number;
    cagTimeMs: number | null;
    ragTimeMs: number | null;
    tokenCount: number;
    cacheHit: boolean;
  };

  // 추가 컨텍스트
  supplementary: {
    relatedLaws: string[];
    definitions: Array<{ term: string; definition: string }>;
    warnings: string[];
  };
}

// ============================================
// 쿼리 분류기
// ============================================

export class QueryClassifier {
  private db = getDatabase();

  // 분류 패턴 정의
  private static readonly PATTERNS: Record<QueryType, RegExp[]> = {
    SIMPLE_LOOKUP: [
      /^(.+법)\s*(제?\d+조)/i,
      /(조문|내용|뭐야|알려줘|설명해)/,
      /제\d+조/,
    ],
    DEFINITION_CHECK: [
      /정의|뜻|의미|무슨\s*말/,
      /란\s*무엇|이란|이라\s*함은/,
      /용어/,
    ],
    CASE_ANALYSIS: [
      /판례|판결|대법원|고등법원|지방법원/,
      /선고|사건번호|\d{4}[다나가마바사]/,
      /판시|결정/,
    ],
    RECENT_CHANGES: [
      /개정|변경|신설|삭제|폐지/,
      /최근|최신|새로운/,
      /언제.*바뀌|바뀐.*언제/,
    ],
    TEMPORAL_QUERY: [
      /\d{4}년/,
      /당시|그때|그\s*시점|작년|재작년/,
      /\d+년\s*전|\d+개월\s*전/,
      /사건\s*발생|범행|위반/,
    ],
    COMPLEX_ANALYSIS: [
      /분석|검토|비교|적용|해당/,
      /경우에?는?|상황/,
      /위반인지|해당하는지|적법한지/,
    ],
    GENERAL: [/.*/],
  };

  // 키워드 기반 가중치
  private static readonly KEYWORD_WEIGHTS: Record<string, { queryType: QueryType; weight: number }> = {
    '헌법': { queryType: 'SIMPLE_LOOKUP', weight: 0.3 },
    '민법': { queryType: 'SIMPLE_LOOKUP', weight: 0.3 },
    '형법': { queryType: 'SIMPLE_LOOKUP', weight: 0.3 },
    '판례': { queryType: 'CASE_ANALYSIS', weight: 0.5 },
    '판결': { queryType: 'CASE_ANALYSIS', weight: 0.4 },
    '개정': { queryType: 'RECENT_CHANGES', weight: 0.4 },
    '작년': { queryType: 'TEMPORAL_QUERY', weight: 0.5 },
    '당시': { queryType: 'TEMPORAL_QUERY', weight: 0.4 },
  };

  /**
   * 쿼리 분류 및 라우팅 결정
   */
  classify(query: string): RoutingDecision {
    const scores: Record<QueryType, number> = {
      SIMPLE_LOOKUP: 0,
      DEFINITION_CHECK: 0,
      CASE_ANALYSIS: 0,
      RECENT_CHANGES: 0,
      TEMPORAL_QUERY: 0,
      COMPLEX_ANALYSIS: 0,
      GENERAL: 0.1,
    };

    // 1. 패턴 매칭 점수
    for (const [type, patterns] of Object.entries(QueryClassifier.PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          scores[type as QueryType] += 0.3;
        }
      }
    }

    // 2. 키워드 가중치
    for (const [keyword, config] of Object.entries(QueryClassifier.KEYWORD_WEIGHTS)) {
      if (query.includes(keyword)) {
        scores[config.queryType] += config.weight;
      }
    }

    // 3. 시점 추출 결과 반영
    const temporal = TemporalExtractor.extract(query);
    if (temporal.extractionMethod !== 'CURRENT' && temporal.extractedDate) {
      scores.TEMPORAL_QUERY += 0.5;
    }

    // 최고 점수 쿼리 유형 결정
    let maxScore = 0;
    let queryType: QueryType = 'GENERAL';
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        queryType = type as QueryType;
      }
    }

    // 라우팅 결정
    return this.determineRoute(queryType, maxScore, query);
  }

  /**
   * 쿼리 유형에 따른 라우팅 결정
   */
  private determineRoute(
    queryType: QueryType,
    confidence: number,
    query: string
  ): RoutingDecision {
    const routeConfigs: Record<QueryType, { route: RouteType; cagWeight: number; ragWeight: number; reasoning: string }> = {
      SIMPLE_LOOKUP: {
        route: 'CAG',
        cagWeight: 1.0,
        ragWeight: 0.0,
        reasoning: '단순 법령 조회는 캐시된 데이터로 고속 응답',
      },
      DEFINITION_CHECK: {
        route: 'CAG',
        cagWeight: 0.9,
        ragWeight: 0.1,
        reasoning: '법률 용어 정의는 기본법에서 확인 (최신 정의 변경 가능성 고려)',
      },
      CASE_ANALYSIS: {
        route: 'RAG',
        cagWeight: 0.2,
        ragWeight: 0.8,
        reasoning: '판례 분석은 실시간 검색 필요 (최신 판례 반영)',
      },
      RECENT_CHANGES: {
        route: 'RAG',
        cagWeight: 0.3,
        ragWeight: 0.7,
        reasoning: '최신 개정사항은 실시간 검색 우선',
      },
      TEMPORAL_QUERY: {
        route: 'HYBRID',
        cagWeight: 0.4,
        ragWeight: 0.6,
        reasoning: '시점 기반 질문은 캐시(기본 원칙) + 검색(해당 시점 법령) 결합',
      },
      COMPLEX_ANALYSIS: {
        route: 'HYBRID',
        cagWeight: 0.5,
        ragWeight: 0.5,
        reasoning: '복합 분석은 기본 법리(캐시) + 구체적 사례(검색) 결합',
      },
      GENERAL: {
        route: 'HYBRID',
        cagWeight: 0.5,
        ragWeight: 0.5,
        reasoning: '일반 질문은 하이브리드 접근',
      },
    };

    const config = routeConfigs[queryType];

    return {
      route: config.route,
      queryType,
      cagWeight: config.cagWeight,
      ragWeight: config.ragWeight,
      confidence: Math.min(confidence, 1),
      reasoning: config.reasoning,
    };
  }
}

// ============================================
// 하이브리드 엔진
// ============================================

export class HybridEngine {
  private db = getDatabase();
  private classifier = new QueryClassifier();
  private initialized = false;

  /**
   * 엔진 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔄 하이브리드 지식 엔진 초기화 중...');

    // 캐시 매니저 초기화
    await cacheManager.initialize();

    this.initialized = true;
    console.log('✅ 하이브리드 지식 엔진 준비 완료');
  }

  /**
   * 메인 쿼리 처리
   */
  async query(
    userQuery: string,
    options: {
      lawName?: string;
      articleNo?: string;
      forceRoute?: RouteType;
      includeSupplementary?: boolean;
    } = {}
  ): Promise<HybridResponse> {
    const startTime = Date.now();
    const { lawName, articleNo, forceRoute, includeSupplementary = true } = options;

    // 초기화 확인
    if (!this.initialized) {
      await this.initialize();
    }

    // 1. 쿼리 분류 및 라우팅 결정
    const routing = forceRoute
      ? this.createForcedRouting(forceRoute)
      : this.classifier.classify(userQuery);

    // 2. 시점 추출
    const temporalQuery = TemporalExtractor.extract(userQuery);
    const effectiveDate = temporalQuery.extractedDate || new Date().toISOString().split('T')[0];

    // 3. 라우트별 처리
    let cagResult: CompiledContext | null = null;
    let ragResult: TemporalSearchResult | null = null;
    let cagTimeMs: number | null = null;
    let ragTimeMs: number | null = null;
    let cacheHit = false;

    // CAG 처리
    if (routing.route === 'CAG' || routing.route === 'HYBRID') {
      const cagStart = Date.now();
      cagResult = await this.processCAG(userQuery, lawName, articleNo);
      cagTimeMs = Date.now() - cagStart;
      cacheHit = cagResult?.source === 'HOT_CACHE' || cagResult?.source === 'WARM_CACHE';
    }

    // RAG 처리
    if (routing.route === 'RAG' || routing.route === 'HYBRID') {
      const ragStart = Date.now();
      ragResult = await this.processRAG(userQuery, {
        lawName,
        articleNo,
        targetDate: effectiveDate,
      });
      ragTimeMs = Date.now() - ragStart;
    }

    // 4. 결과 병합
    const context = this.mergeResults(cagResult, ragResult, routing);

    // 5. 시행 예정 변경사항 조회
    const upcomingChanges = await this.getUpcomingChanges(lawName);

    // 6. 보조 정보 수집
    const supplementary = includeSupplementary
      ? await this.collectSupplementary(userQuery, cagResult, ragResult)
      : { relatedLaws: [], definitions: [], warnings: [] };

    // 7. 현행법 경고 생성
    const currentLawWarning = this.generateCurrentLawWarning(
      temporalQuery,
      ragResult,
      upcomingChanges
    );

    // 8. 토큰 수 계산
    const tokenCount = this.estimateTokens(context);

    return {
      context,
      sources: {
        cag: cagResult,
        rag: ragResult,
      },
      routing,
      temporal: {
        queryDate: new Date().toISOString().split('T')[0],
        extractedDate: temporalQuery.extractedDate,
        currentLawWarning,
        upcomingChanges,
      },
      performance: {
        totalTimeMs: Date.now() - startTime,
        cagTimeMs,
        ragTimeMs,
        tokenCount,
        cacheHit,
      },
      supplementary,
    };
  }

  /**
   * CAG 처리 (캐시 기반)
   */
  private async processCAG(
    query: string,
    lawName?: string,
    articleNo?: string
  ): Promise<CompiledContext | null> {
    // 특정 법령 지정된 경우
    if (lawName) {
      const cached = await cacheManager.getByName(lawName);
      if (cached) {
        // 특정 조문만 필요한 경우 필터링
        if (articleNo) {
          const filteredContent = this.filterArticle(cached.content, articleNo);
          return { ...cached, content: filteredContent };
        }
        return cached;
      }
    }

    // 쿼리에서 법령명 추출 시도
    const extractedLawName = this.extractLawName(query);
    if (extractedLawName) {
      const cached = await cacheManager.getByName(extractedLawName);
      if (cached) return cached;
    }

    return null;
  }

  /**
   * RAG 처리 (실시간 검색)
   */
  private async processRAG(
    query: string,
    options: {
      lawName?: string;
      articleNo?: string;
      targetDate?: string;
    }
  ): Promise<TemporalSearchResult> {
    return temporalRetriever.search(query, {
      lawName: options.lawName,
      articleNo: options.articleNo,
      includeCurrentComparison: true,
    });
  }

  /**
   * CAG + RAG 결과 병합
   */
  private mergeResults(
    cag: CompiledContext | null,
    rag: TemporalSearchResult | null,
    routing: RoutingDecision
  ): string {
    const parts: string[] = [];

    // CAG 결과
    if (cag && routing.cagWeight > 0) {
      parts.push('=== 기본 법령 정보 (캐시) ===');
      parts.push(cag.content);
      if (cag.temporal?.daysUntilChange !== null && cag.temporal.daysUntilChange <= 30) {
        parts.push(`\n⚠️ 주의: ${cag.temporal.daysUntilChange}일 후 개정 시행 예정`);
      }
    }

    // RAG 결과
    if (rag && routing.ragWeight > 0 && rag.metadata.totalResults > 0) {
      parts.push('\n=== 검색 결과 (실시간) ===');

      // 시점 정보
      if (rag.query.extractedDate && rag.query.extractionMethod !== 'CURRENT') {
        parts.push(`📅 기준 시점: ${rag.query.extractedDate} (${rag.query.dateContext || '추출됨'})`);
      }

      // 법령 결과
      for (const law of rag.laws) {
        parts.push(`\n📜 ${law.law.law_name}`);
        if (law.versionInfo.hasBeenAmended) {
          parts.push(`   ⚠️ ${law.versionInfo.amendmentNote}`);
        }
      }

      // 조문 결과
      for (const article of rag.articles) {
        parts.push(`\n📌 ${article.lawName} ${article.article.article_no}`);
        parts.push(article.article.content);

        if (article.versionInfo.hasChanged && article.versionInfo.currentContent) {
          parts.push('\n--- 현재 버전과 비교 ---');
          parts.push(`[변경] ${article.versionInfo.changeSummary || '내용 변경됨'}`);
        }
      }

      // 경고
      if (rag.metadata.warning) {
        parts.push(`\n⚠️ ${rag.metadata.warning}`);
      }
    }

    // 결과 없음
    if (parts.length === 0) {
      parts.push('검색 결과가 없습니다. 다른 키워드로 검색해 보세요.');
    }

    return parts.join('\n');
  }

  /**
   * 시행 예정 변경사항 조회
   */
  private async getUpcomingChanges(
    lawName?: string
  ): Promise<Array<{ lawName: string; effectiveDate: string; summary: string }>> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const sixMonthsLater = futureDate.toISOString().split('T')[0];

    try {
      let query = `
        SELECT DISTINCT
          l.law_name as lawName,
          d.effective_from as effectiveDate,
          d.diff_summary as summary
        FROM Diff_Logs d
        JOIN Laws l ON d.law_id = l.id
        WHERE d.effective_from > ?
        AND d.effective_from <= ?
      `;
      const params: string[] = [today, sixMonthsLater];

      if (lawName) {
        query += ' AND l.law_name = ?';
        params.push(lawName);
      }

      query += ' ORDER BY d.effective_from ASC LIMIT 10';

      return this.db.prepare(query).all(...params) as Array<{
        lawName: string;
        effectiveDate: string;
        summary: string;
      }>;
    } catch (e) {
      return [];
    }
  }

  /**
   * 보조 정보 수집
   */
  private async collectSupplementary(
    query: string,
    cag: CompiledContext | null,
    rag: TemporalSearchResult | null
  ): Promise<{
    relatedLaws: string[];
    definitions: Array<{ term: string; definition: string }>;
    warnings: string[];
  }> {
    const relatedLaws: string[] = [];
    const definitions: Array<{ term: string; definition: string }> = [];
    const warnings: string[] = [];

    // 관련 법령 추출
    if (cag?.temporal?.lawName) {
      // 상위/하위 법령 관계 조회
      const law = findLawByName(cag.temporal.lawName);
      if (law) {
        const related = this.db.prepare(`
          SELECT DISTINCT l.law_name
          FROM Laws l
          WHERE l.ministry = (SELECT ministry FROM Laws WHERE id = ?)
          AND l.id != ?
          AND l.status = 'ACTIVE'
          LIMIT 5
        `).all(law.id!, law.id!) as Array<{ law_name: string }>;

        relatedLaws.push(...related.map((r) => r.law_name));
      }
    }

    // 법률 용어 정의 추출
    const legalTerms = this.extractLegalTerms(query);
    for (const term of legalTerms) {
      const definition = this.findTermDefinition(term);
      if (definition) {
        definitions.push({ term, definition });
      }
    }

    // 경고 메시지 수집
    const todayDiffs = getTodayDiffs();
    if (todayDiffs.length > 0) {
      warnings.push(`⚠️ 오늘 ${todayDiffs.length}건의 법령 변경이 감지되었습니다.`);
    }

    return { relatedLaws, definitions, warnings };
  }

  /**
   * 현행법 경고 생성
   */
  private generateCurrentLawWarning(
    temporal: TemporalQuery,
    rag: TemporalSearchResult | null,
    upcomingChanges: Array<{ lawName: string; effectiveDate: string; summary: string }>
  ): string | null {
    const warnings: string[] = [];

    // 과거 시점 질문인 경우
    if (temporal.extractedDate && temporal.extractionMethod !== 'CURRENT') {
      const today = new Date().toISOString().split('T')[0];
      if (temporal.extractedDate < today) {
        warnings.push(
          `주의: ${temporal.extractedDate} 기준으로 검색되었습니다. ` +
          `현재(${today}) 법령과 다를 수 있습니다.`
        );
      }
    }

    // 변경된 조문이 있는 경우
    if (rag?.articles.some((a) => a.versionInfo.hasChanged)) {
      warnings.push('일부 조문이 현재와 다릅니다. 현행법 확인을 권장합니다.');
    }

    // 시행 예정 변경이 있는 경우
    if (upcomingChanges.length > 0) {
      const nextChange = upcomingChanges[0];
      const daysUntil = Math.ceil(
        (new Date(nextChange.effectiveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 30) {
        warnings.push(
          `${nextChange.lawName}: ${daysUntil}일 후(${nextChange.effectiveDate}) 개정 시행 예정 - ${nextChange.summary || '변경 예정'}`
        );
      }
    }

    return warnings.length > 0 ? warnings.join('\n') : null;
  }

  /**
   * 조문 필터링
   */
  private filterArticle(content: string, articleNo: string): string {
    const normalizedNo = articleNo.replace(/제|조/g, '');
    const pattern = new RegExp(
      `(제?${normalizedNo}조[의\\d]*)\\s*\\([^)]+\\)?[\\s\\S]*?(?=제\\d+조|$)`,
      'g'
    );

    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      return matches.join('\n\n');
    }

    return content;
  }

  /**
   * 쿼리에서 법령명 추출
   */
  private extractLawName(query: string): string | null {
    // "~법" 패턴
    const lawPattern = /([가-힣]+(?:기본)?법)/g;
    const matches = [...query.matchAll(lawPattern)];

    if (matches.length > 0) {
      // 가장 긴 매칭 반환 (예: "근로기준법" > "기준법")
      return matches.reduce((longest, current) =>
        current[1].length > longest[1].length ? current : longest
      )[1];
    }

    return null;
  }

  /**
   * 법률 용어 추출
   */
  private extractLegalTerms(query: string): string[] {
    const terms: string[] = [];

    // 따옴표로 감싸진 용어
    const quotedPattern = /['"「]([^'"」]+)['"」]/g;
    let match;
    while ((match = quotedPattern.exec(query)) !== null) {
      terms.push(match[1]);
    }

    // 알려진 법률 용어 (확장 가능)
    const knownTerms = [
      '해고', '근로자', '사용자', '임금', '퇴직금',
      '선의', '악의', '고의', '과실', '손해배상',
      '불법행위', '채무불이행', '하자담보', '연대책임',
    ];

    for (const term of knownTerms) {
      if (query.includes(term)) {
        terms.push(term);
      }
    }

    return [...new Set(terms)];
  }

  /**
   * 용어 정의 조회
   */
  private findTermDefinition(term: string): string | null {
    try {
      const result = this.db.prepare(`
        SELECT lt.definition, l.law_name
        FROM LegalTerms lt
        JOIN Laws l ON lt.law_id = l.id
        WHERE lt.term = ? OR lt.term_normalized = ?
        LIMIT 1
      `).get(term, term.replace(/\s+/g, '')) as {
        definition: string;
        law_name: string;
      } | undefined;

      if (result) {
        return `${result.definition} (${result.law_name})`;
      }
    } catch (e) {
      // 테이블 없음 등
    }

    return null;
  }

  /**
   * 토큰 수 추정
   */
  private estimateTokens(text: string): number {
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const otherChars = text.length - koreanChars;
    return Math.ceil(koreanChars / 1.5 + otherChars / 4);
  }

  /**
   * 강제 라우팅 생성
   */
  private createForcedRouting(route: RouteType): RoutingDecision {
    const configs: Record<RouteType, Partial<RoutingDecision>> = {
      CAG: { cagWeight: 1.0, ragWeight: 0.0 },
      RAG: { cagWeight: 0.0, ragWeight: 1.0 },
      HYBRID: { cagWeight: 0.5, ragWeight: 0.5 },
    };

    return {
      route,
      queryType: 'GENERAL',
      ...configs[route],
      confidence: 1.0,
      reasoning: '사용자 지정 라우팅',
    } as RoutingDecision;
  }

  /**
   * 엔진 상태 조회
   */
  getStatus(): {
    initialized: boolean;
    cacheStats: ReturnType<typeof cacheManager.getStats>;
  } {
    return {
      initialized: this.initialized,
      cacheStats: cacheManager.getStats(),
    };
  }
}

// 싱글톤 인스턴스
export const hybridEngine = new HybridEngine();

// 편의 함수
export async function query(
  userQuery: string,
  options?: Parameters<HybridEngine['query']>[1]
): Promise<HybridResponse> {
  return hybridEngine.query(userQuery, options);
}
