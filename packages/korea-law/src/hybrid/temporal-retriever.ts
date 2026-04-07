/**
 * korea-law: 시점 인식형 RAG (Retrieval-Augmented Generation) 검색기
 *
 * 목적: 사건 발생일 기준 Point-in-Time 법령 검색
 *
 * 핵심 기능:
 * - 질문에서 시점 추출 (NLP/패턴 매칭)
 * - 특정 시점에 유효했던 법령만 검색
 * - 시간 메타데이터 필터링
 */

import {
  getDatabase,
  findLawByName,
  findArticle,
  searchArticlesFTS,
  type LawRecord,
  type ArticleRecord,
} from '../db/database';

// ============================================
// 타입 정의
// ============================================

export interface TemporalQuery {
  originalQuery: string;
  extractedDate: string | null;       // YYYY-MM-DD 형식
  extractionMethod: 'EXPLICIT' | 'NLP' | 'INFERRED' | 'CURRENT';
  confidence: number;                  // 0-1
  dateContext: string | null;          // "작년 5월", "2023년" 등 원본 텍스트
}

export interface TemporalSearchResult {
  query: TemporalQuery;
  laws: PointInTimeLaw[];
  articles: PointInTimeArticle[];
  metadata: {
    searchedAt: string;
    effectiveDate: string;
    totalResults: number;
    warning: string | null;
  };
}

export interface PointInTimeLaw {
  law: LawRecord;
  versionInfo: {
    wasEffective: boolean;
    effectiveFrom: string;
    effectiveUntil: string | null;
    isCurrentVersion: boolean;
    hasBeenAmended: boolean;
    amendmentNote: string | null;
  };
}

export interface PointInTimeArticle {
  article: ArticleRecord;
  lawName: string;
  versionInfo: {
    wasEffective: boolean;
    effectiveFrom: string;
    effectiveUntil: string | null;
    currentContent: string | null;    // 현재 버전 내용 (비교용)
    hasChanged: boolean;
    changeSummary: string | null;
  };
}

// ============================================
// 시점 추출기
// ============================================

export class TemporalExtractor {
  // 날짜 패턴들
  private static readonly DATE_PATTERNS = [
    // 명시적 날짜: "2023년 5월 15일"
    {
      pattern: /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g,
      extract: (m: RegExpMatchArray) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`,
      method: 'EXPLICIT' as const,
      confidence: 1.0,
    },
    // 연월: "2023년 5월"
    {
      pattern: /(\d{4})년\s*(\d{1,2})월/g,
      extract: (m: RegExpMatchArray) => `${m[1]}-${m[2].padStart(2, '0')}-01`,
      method: 'EXPLICIT' as const,
      confidence: 0.9,
    },
    // 연도만: "2023년"
    {
      pattern: /(\d{4})년(?!\s*\d)/g,
      extract: (m: RegExpMatchArray) => `${m[1]}-01-01`,
      method: 'EXPLICIT' as const,
      confidence: 0.8,
    },
    // ISO 형식: "2023-05-15"
    {
      pattern: /(\d{4})-(\d{2})-(\d{2})/g,
      extract: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}`,
      method: 'EXPLICIT' as const,
      confidence: 1.0,
    },
  ];

  // 상대적 시점 표현
  private static readonly RELATIVE_PATTERNS = [
    // "작년", "재작년"
    { pattern: /작년/g, offset: -1, unit: 'year', method: 'NLP' as const, confidence: 0.85 },
    { pattern: /재작년/g, offset: -2, unit: 'year', method: 'NLP' as const, confidence: 0.85 },
    // "올해"
    { pattern: /올해/g, offset: 0, unit: 'year', method: 'NLP' as const, confidence: 0.9 },
    // "지난해", "금년"
    { pattern: /지난해/g, offset: -1, unit: 'year', method: 'NLP' as const, confidence: 0.85 },
    { pattern: /금년/g, offset: 0, unit: 'year', method: 'NLP' as const, confidence: 0.9 },
    // "N년 전"
    { pattern: /(\d+)년\s*전/g, offsetCapture: 1, unit: 'year', negative: true, method: 'NLP' as const, confidence: 0.8 },
    // "N개월 전"
    { pattern: /(\d+)(?:개월|달)\s*전/g, offsetCapture: 1, unit: 'month', negative: true, method: 'NLP' as const, confidence: 0.75 },
  ];

  // 특정 시점을 암시하는 키워드
  private static readonly TEMPORAL_KEYWORDS = [
    '당시', '그때', '그 시점', '해당 시점', '사건 발생', '계약 체결',
    '범행', '위반', '발생일', '행위일', '거래일',
  ];

  /**
   * 쿼리에서 시점 추출
   */
  static extract(query: string): TemporalQuery {
    const today = new Date();

    // 1. 명시적 날짜 패턴 검색
    for (const { pattern, extract, method, confidence } of this.DATE_PATTERNS) {
      const matches = [...query.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        const extractedDate = extract(match);

        // 미래 날짜 검증
        if (new Date(extractedDate) > today) {
          continue; // 미래 날짜는 건너뜀
        }

        return {
          originalQuery: query,
          extractedDate,
          extractionMethod: method,
          confidence,
          dateContext: match[0],
        };
      }
    }

    // 2. 상대적 시점 표현 검색
    for (const rel of this.RELATIVE_PATTERNS) {
      const matches = [...query.matchAll(rel.pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        let offset = 'offset' in rel ? rel.offset : 0;

        // 동적 오프셋 (예: "3년 전")
        if ('offsetCapture' in rel && rel.offsetCapture) {
          offset = parseInt(match[rel.offsetCapture], 10);
          if ('negative' in rel && rel.negative) offset = -offset;
        }

        const targetDate = new Date(today);
        const offsetValue = offset ?? 0;
        if (rel.unit === 'year') {
          targetDate.setFullYear(targetDate.getFullYear() + offsetValue);
        } else if (rel.unit === 'month') {
          targetDate.setMonth(targetDate.getMonth() + offsetValue);
        }

        return {
          originalQuery: query,
          extractedDate: targetDate.toISOString().split('T')[0],
          extractionMethod: rel.method,
          confidence: rel.confidence,
          dateContext: match[0],
        };
      }
    }

    // 3. 시점 암시 키워드 검색 (날짜 없이 과거 시점을 암시하는 경우)
    const hasTemporalKeyword = this.TEMPORAL_KEYWORDS.some((kw) =>
      query.includes(kw)
    );

    if (hasTemporalKeyword) {
      return {
        originalQuery: query,
        extractedDate: null,
        extractionMethod: 'INFERRED',
        confidence: 0.5,
        dateContext: this.TEMPORAL_KEYWORDS.find((kw) => query.includes(kw)) || null,
      };
    }

    // 4. 기본값: 현재 시점
    return {
      originalQuery: query,
      extractedDate: today.toISOString().split('T')[0],
      extractionMethod: 'CURRENT',
      confidence: 1.0,
      dateContext: null,
    };
  }
}

// ============================================
// 시점 인식형 검색기
// ============================================

export class TemporalRetriever {
  private db = getDatabase();

  /**
   * 시점 기반 법령 검색
   */
  async search(
    query: string,
    options: {
      lawName?: string;
      articleNo?: string;
      limit?: number;
      includeCurrentComparison?: boolean;
    } = {}
  ): Promise<TemporalSearchResult> {
    const { lawName, articleNo, limit = 10, includeCurrentComparison = true } = options;

    // 시점 추출
    const temporalQuery = TemporalExtractor.extract(query);
    const effectiveDate = temporalQuery.extractedDate || new Date().toISOString().split('T')[0];

    const result: TemporalSearchResult = {
      query: temporalQuery,
      laws: [],
      articles: [],
      metadata: {
        searchedAt: new Date().toISOString(),
        effectiveDate,
        totalResults: 0,
        warning: null,
      },
    };

    // 특정 법령 검색
    if (lawName) {
      const law = await this.findLawAtTime(lawName, effectiveDate);
      if (law) {
        result.laws.push(law);

        if (articleNo) {
          const article = await this.findArticleAtTime(
            law.law.id!,
            articleNo,
            effectiveDate,
            includeCurrentComparison
          );
          if (article) {
            result.articles.push({ ...article, lawName: law.law.law_name });
          }
        }
      }
    } else {
      // 키워드 기반 검색 (FTS)
      const ftsResults = await this.searchAtTime(query, effectiveDate, limit);
      result.articles = ftsResults;
    }

    // 경고 메시지 생성
    if (temporalQuery.extractionMethod === 'INFERRED') {
      result.metadata.warning =
        '질문에서 구체적인 날짜를 추출하지 못했습니다. 정확한 검색을 위해 "YYYY년 MM월" 형식으로 시점을 명시해 주세요.';
    }

    result.metadata.totalResults = result.laws.length + result.articles.length;

    // 쿼리 로그 저장
    this.logQuery(temporalQuery, result);

    return result;
  }

  /**
   * 특정 시점에 유효했던 법령 조회
   */
  private async findLawAtTime(
    lawName: string,
    targetDate: string
  ): Promise<PointInTimeLaw | null> {
    // 현재 버전 법령 조회
    const currentLaw = findLawByName(lawName);
    if (!currentLaw) return null;

    // 시점 기준 유효성 확인
    const wasEffective =
      currentLaw.enforcement_date <= targetDate &&
      currentLaw.status === 'ACTIVE';

    // 개정 여부 확인
    const amendments = this.db.prepare(`
      SELECT COUNT(*) as count FROM Diff_Logs
      WHERE law_id = ?
      AND detected_at > ?
    `).get(currentLaw.id!, targetDate) as { count: number };

    const hasBeenAmended = amendments.count > 0;

    // 개정 내역 요약
    let amendmentNote: string | null = null;
    if (hasBeenAmended) {
      const recentAmendment = this.db.prepare(`
        SELECT diff_summary FROM Diff_Logs
        WHERE law_id = ?
        AND detected_at > ?
        ORDER BY detected_at DESC
        LIMIT 1
      `).get(currentLaw.id!, targetDate) as { diff_summary: string } | undefined;

      amendmentNote = recentAmendment?.diff_summary ||
        `${targetDate} 이후 ${amendments.count}건의 개정이 있었습니다.`;
    }

    return {
      law: currentLaw,
      versionInfo: {
        wasEffective,
        effectiveFrom: currentLaw.enforcement_date,
        effectiveUntil: null,
        isCurrentVersion: true,
        hasBeenAmended,
        amendmentNote,
      },
    };
  }

  /**
   * 특정 시점에 유효했던 조문 조회
   */
  private async findArticleAtTime(
    lawId: number,
    articleNo: string,
    targetDate: string,
    includeCurrentComparison: boolean
  ): Promise<Omit<PointInTimeArticle, 'lawName'> | null> {
    // 현재 버전 조문 조회
    const currentArticle = findArticle(lawId, articleNo);
    if (!currentArticle) return null;

    // 시점 기준 유효성 확인
    const effectiveFrom = currentArticle.effective_from || '1900-01-01';
    const effectiveUntil = currentArticle.effective_until || null;

    const wasEffective =
      effectiveFrom <= targetDate &&
      (!effectiveUntil || effectiveUntil > targetDate);

    // 변경 여부 확인
    const changes = this.db.prepare(`
      SELECT * FROM Diff_Logs
      WHERE article_id = ?
      AND detected_at > ?
      ORDER BY detected_at DESC
      LIMIT 1
    `).get(currentArticle.id!, targetDate) as {
      change_type: string;
      previous_content: string;
      diff_summary: string;
    } | undefined;

    const hasChanged = !!changes;
    const changeSummary = changes?.diff_summary || null;

    // 과거 내용 (있는 경우)
    const historicContent = changes?.previous_content || null;

    return {
      article: historicContent
        ? { ...currentArticle, content: historicContent }
        : currentArticle,
      versionInfo: {
        wasEffective,
        effectiveFrom,
        effectiveUntil,
        currentContent: includeCurrentComparison && hasChanged
          ? currentArticle.content
          : null,
        hasChanged,
        changeSummary,
      },
    };
  }

  /**
   * 시점 기반 FTS 검색
   */
  private async searchAtTime(
    query: string,
    targetDate: string,
    limit: number
  ): Promise<PointInTimeArticle[]> {
    // 키워드 추출 (날짜 관련 표현 제외)
    const cleanQuery = query
      .replace(/\d{4}년?\s*\d{0,2}월?\s*\d{0,2}일?/g, '')
      .replace(/작년|재작년|올해|지난해|금년|\d+년\s*전|\d+(?:개월|달)\s*전/g, '')
      .trim();

    if (!cleanQuery) {
      return [];
    }

    // FTS 검색
    const ftsResults = searchArticlesFTS(cleanQuery, limit * 2);

    const results: PointInTimeArticle[] = [];

    for (const r of ftsResults) {
      // 각 결과에 대해 시점 유효성 확인
      const article = this.db.prepare(`
        SELECT * FROM Articles WHERE law_id = ? AND article_no = ?
      `).get(r.lawId, r.articleNo) as ArticleRecord | undefined;

      if (!article) continue;

      const effectiveFrom = article.effective_from || '1900-01-01';
      const effectiveUntil = article.effective_until || null;

      const wasEffective =
        effectiveFrom <= targetDate &&
        (!effectiveUntil || effectiveUntil > targetDate);

      // 유효했던 조문만 포함
      if (wasEffective) {
        // 변경 여부 확인
        const changes = this.db.prepare(`
          SELECT * FROM Diff_Logs
          WHERE article_id = ?
          AND detected_at > ?
          ORDER BY detected_at DESC
          LIMIT 1
        `).get(article.id!, targetDate) as {
          change_type: string;
          previous_content: string;
          diff_summary: string;
        } | undefined;

        results.push({
          article: changes?.previous_content
            ? { ...article, content: changes.previous_content }
            : article,
          lawName: r.lawName,
          versionInfo: {
            wasEffective: true,
            effectiveFrom,
            effectiveUntil,
            currentContent: changes?.previous_content ? article.content : null,
            hasChanged: !!changes,
            changeSummary: changes?.diff_summary || null,
          },
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * 법령 타임라인 조회
   */
  async getTimeline(lawId: number): Promise<Array<{
    date: string;
    eventType: string;
    description: string;
    articleNo: string | null;
    details: string | null;
  }>> {
    const timeline: Array<{
      date: string;
      eventType: string;
      description: string;
      articleNo: string | null;
      details: string | null;
    }> = [];

    // 법령 정보
    const law = this.db.prepare('SELECT * FROM Laws WHERE id = ?')
      .get(lawId) as LawRecord;

    if (!law) return timeline;

    // 제정/시행 이벤트
    timeline.push({
      date: law.promulgation_date,
      eventType: 'PROMULGATED',
      description: `${law.law_name} 공포`,
      articleNo: null,
      details: null,
    });

    if (law.enforcement_date !== law.promulgation_date) {
      timeline.push({
        date: law.enforcement_date,
        eventType: 'ENFORCED',
        description: `${law.law_name} 시행`,
        articleNo: null,
        details: null,
      });
    }

    // 변경 이력
    const diffs = this.db.prepare(`
      SELECT
        d.*,
        a.article_no
      FROM Diff_Logs d
      LEFT JOIN Articles a ON d.article_id = a.id
      WHERE d.law_id = ?
      ORDER BY d.detected_at DESC
    `).all(lawId) as Array<{
      detected_at: string;
      change_type: string;
      diff_summary: string;
      article_no: string | null;
      effective_from: string | null;
    }>;

    for (const diff of diffs) {
      timeline.push({
        date: diff.effective_from || diff.detected_at,
        eventType: diff.change_type,
        description: diff.diff_summary || `${diff.change_type} 변경`,
        articleNo: diff.article_no,
        details: null,
      });
    }

    // 날짜순 정렬
    timeline.sort((a, b) => b.date.localeCompare(a.date));

    return timeline;
  }

  /**
   * 현행법과 과거 버전 비교
   */
  async compareVersions(
    lawName: string,
    articleNo: string,
    pastDate: string
  ): Promise<{
    pastVersion: string | null;
    currentVersion: string;
    changes: Array<{
      date: string;
      type: string;
      summary: string;
    }>;
    hasSignificantChange: boolean;
  } | null> {
    const law = findLawByName(lawName);
    if (!law) return null;

    const currentArticle = findArticle(law.id!, articleNo);
    if (!currentArticle) return null;

    // 과거 버전 조회 (Diff_Logs에서)
    const pastDiff = this.db.prepare(`
      SELECT previous_content FROM Diff_Logs
      WHERE article_id = ?
      AND detected_at > ?
      ORDER BY detected_at ASC
      LIMIT 1
    `).get(currentArticle.id!, pastDate) as { previous_content: string } | undefined;

    // 변경 이력
    const changes = this.db.prepare(`
      SELECT detected_at as date, change_type as type, diff_summary as summary
      FROM Diff_Logs
      WHERE article_id = ?
      AND detected_at > ?
      ORDER BY detected_at ASC
    `).all(currentArticle.id!, pastDate) as Array<{
      date: string;
      type: string;
      summary: string;
    }>;

    // 중요 변경 여부 (처벌, 금액, 기간 관련)
    const hasSignificantChange = this.db.prepare(`
      SELECT 1 FROM Diff_Logs
      WHERE article_id = ?
      AND detected_at > ?
      AND is_critical = TRUE
      LIMIT 1
    `).get(currentArticle.id!, pastDate) !== undefined;

    return {
      pastVersion: pastDiff?.previous_content || null,
      currentVersion: currentArticle.content,
      changes,
      hasSignificantChange,
    };
  }

  /**
   * 쿼리 로그 저장
   */
  private logQuery(query: TemporalQuery, result: TemporalSearchResult): void {
    try {
      // 테이블 존재 확인
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='Temporal_Query_Log'
      `).get();

      if (!tableExists) {
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS Temporal_Query_Log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query_text TEXT NOT NULL,
            extracted_date DATE,
            extraction_method TEXT,
            laws_searched INTEGER DEFAULT 0,
            articles_returned INTEGER DEFAULT 0,
            source TEXT,
            response_time_ms INTEGER,
            cache_hit BOOLEAN DEFAULT FALSE,
            was_helpful BOOLEAN,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }

      this.db.prepare(`
        INSERT INTO Temporal_Query_Log
        (query_text, extracted_date, extraction_method, laws_searched, articles_returned, source)
        VALUES (?, ?, ?, ?, ?, 'RAG')
      `).run(
        query.originalQuery,
        query.extractedDate,
        query.extractionMethod,
        result.laws.length,
        result.articles.length
      );
    } catch (e) {
      // 로그 저장 실패 시 무시
    }
  }
}

// 싱글톤 인스턴스
export const temporalRetriever = new TemporalRetriever();
