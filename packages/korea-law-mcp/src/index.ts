/**
 * Korea Law MCP Server - HTTP Wrapper
 * 
 * Rails/Flutter 앱에서 HTTP로 접근할 수 있도록 korea-law 패키지를 래핑합니다.
 */

import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

// korea-law 패키지에서 함수와 타입 가져오기
// 참고: korea-law 패키지 설치 후 정상 작동
import {
  initDatabase,
  findLawByName,
  findArticle,
  getTodayDiffs,
  getFutureChanges,
  verifyPrecedentExists,
  verifyPrecedentExistsOnline,
  getDatabase,
  supabase as supabaseDb,
  // 약어 정규화 모듈
  normalizeLawName,
  searchPossibleLawNames,
} from 'korea-law';
import type { LawRecord, ArticleRecord } from 'korea-law';

// 약어 정규화 결과 타입
interface NormalizationResult {
  original: string;
  normalized: string;
  confidence: number;
  source: 'official' | 'conventional' | 'confused' | 'spacing' | 'pattern' | 'fuzzy' | 'passthrough';
  alternatives?: string[];
  isAbbreviation: boolean;
  isTypoCorrection?: boolean;
  didYouMean?: string;
}

// 하이브리드 도구 핸들러 동적 로드
let hybridHandlers: {
  handleHybridQuery: (args: any) => Promise<string>;
  handleTemporalSearch: (args: any) => Promise<string>;
  handleCompareAmendment: (args: any) => Promise<string>;
  handleGetLawTimeline: (args: any) => Promise<string>;
  handleGetCacheStatus: () => Promise<string>;
} | null = null;

// 🆕 @markdown-media/core 네이티브 도구 핸들러 동적 로드
let nativeToolHandlers: Record<string, (args: any) => Promise<string>> | null = null;

async function loadNativeTools() {
  if (!nativeToolHandlers) {
    try {
      const path = require('path');
      const nativePath = path.resolve(__dirname, '../../../korea-law/dist/mcp/native-tools.js');
      delete require.cache[require.resolve(nativePath)];
      const mod = require(nativePath);
      nativeToolHandlers = mod.NATIVE_TOOL_HANDLERS;
      console.log('✅ Native tools loaded successfully');
    } catch (e) {
      console.warn('⚠️ Native tools not available:', (e as Error).message);
      nativeToolHandlers = {};
    }
  }
  return nativeToolHandlers!;
}

let extendedApiModule: any = null;
let precedentSearchModule: any = null;

async function loadPrecedentSearch() {
  if (!precedentSearchModule) {
    try {
      const path = require('path');
      const precedentPath = path.resolve(__dirname, '../../../korea-law/dist/api/precedent-search.js');
      delete require.cache[require.resolve(precedentPath)];
      precedentSearchModule = require(precedentPath);
      console.log('✅ Precedent search module loaded');
    } catch (e) {
      console.warn('⚠️ Precedent search module not available:', (e as Error).message);
      precedentSearchModule = null;
    }
  }
  return precedentSearchModule;
}

async function loadHybridHandlers() {
  if (!hybridHandlers) {
    try {
      const hybridModule = await import('korea-law/dist/mcp/hybrid-tools.js');
      hybridHandlers = {
        handleHybridQuery: hybridModule.handleHybridQuery,
        handleTemporalSearch: hybridModule.handleTemporalSearch,
        handleCompareAmendment: hybridModule.handleCompareAmendment,
        handleGetLawTimeline: hybridModule.handleGetLawTimeline,
        handleGetCacheStatus: hybridModule.handleGetCacheStatus,
      };
      console.log('✅ Hybrid tools loaded successfully');
    } catch (e) {
      console.warn('⚠️ Hybrid tools not available:', (e as Error).message);
      hybridHandlers = null;
    }
  }
  return hybridHandlers;
}

// Extended API 로드 (절대 경로 사용)
async function loadExtendedApi() {
  if (!extendedApiModule) {
    try {
      // 소스 디렉토리의 최신 버전 로드
      const path = require('path');
      // __dirname = /Users/seunghan/law/services/korea-law-mcp/dist
      // 필요한 경로 = /Users/seunghan/law/korea-law/dist/api/extended-api.js
      const extApiPath = path.resolve(__dirname, '../../../korea-law/dist/api/extended-api.js');
      // require 캐시 무효화 (개발 중 최신 코드 반영)
      delete require.cache[require.resolve(extApiPath)];
      extendedApiModule = require(extApiPath);
      console.log(`✅ Extended API module loaded from ${extApiPath}`);
    } catch (e) {
      console.warn('⚠️ Extended API not available:', (e as Error).message);
    }
  }
  return extendedApiModule;
}

const app = express();
const PORT = parseInt(process.env.PORT || process.env.MCP_PORT || '3001', 10);
const HOST = process.env.MCP_HOST || '0.0.0.0';

const DB_MODE = (process.env.KOREA_LAW_DB_MODE || '').toLowerCase();
const USE_SUPABASE = (process.env.USE_SUPABASE || '').toLowerCase() === 'true' || DB_MODE === 'supabase';

app.use(express.json());

// Ensure DB is ready
function initStore(): void {
  if (USE_SUPABASE) {
    // Read-only mode by default
    supabaseDb.initSupabaseClient();
  } else {
    initDatabase();
  }
}

async function findLawByNameStore(lawName: string, targetDate?: string): Promise<LawRecord | null> {
  if (USE_SUPABASE) {
    return supabaseDb.findLawByName(lawName, targetDate);
  }
  return findLawByName(lawName, targetDate);
}

async function findArticleStore(lawId: number, articleNo: string): Promise<ArticleRecord | null> {
  if (USE_SUPABASE) {
    return supabaseDb.findArticle(lawId, articleNo);
  }
  return findArticle(lawId, articleNo);
}

async function getTodayDiffsStore(): Promise<any[]> {
  if (USE_SUPABASE) {
    return supabaseDb.getTodayDiffs();
  }
  return getTodayDiffs();
}

async function getFutureChangesStore(startDate: string, endDate: string): Promise<any[]> {
  if (USE_SUPABASE) {
    return supabaseDb.getFutureChanges(startDate, endDate);
  }
  return getFutureChanges(startDate, endDate);
}

async function verifyPrecedentExistsStore(caseId: string): Promise<boolean> {
  if (USE_SUPABASE) {
    return supabaseDb.verifyPrecedentExists(caseId);
  }
  return verifyPrecedentExists(caseId);
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Debug Config
app.get('/debug/config', (_req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const maskedUrl = supabaseUrl.length > 10 
    ? `${supabaseUrl.substring(0, 15)}...${supabaseUrl.substring(supabaseUrl.length - 5)}` 
    : 'NOT_SET';
  
  res.json({
    db_mode: DB_MODE,
    use_supabase: USE_SUPABASE,
    supabase_url: maskedUrl,
    env_port: process.env.PORT,
    mcp_port: process.env.MCP_PORT,
    node_env: process.env.NODE_ENV
  });
});

// MCP Server Info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'korea-law-mcp',
    version: '1.1.0',
    description: '한국 법률 검증 MCP 서버 (하이브리드 엔진 포함)',
    tools: [
      'audit_statute',
      'search_similar_articles',
      'search_across_laws',
      'search_law_names',
      'check_enforcement_date',
      'verify_case_exists',
      'get_daily_diff',
      'audit_contract_timeline',
      'check_legal_definition',
      'search_construction_standards',
      'get_standard_details',
      // 하이브리드 엔진 도구 (RAG + CAG)
      'hybrid_query',
      'temporal_search',
      'compare_amendment',
      'get_law_timeline',
      'get_cache_status',
      // 🆕 확장 법률 데이터 API
      'search_legal_interpretations',
      'get_legal_interpretation_detail',
      'search_constitutional_decisions',
      'get_constitutional_decision_detail',
      'search_admin_appeals',
      'get_admin_appeal_detail',
      'search_committee_decisions',
      'search_ministry_interpretations',
      'search_tribunal_decisions',
      'search_legal_terms',
      // 🆕 @markdown-media/core 네이티브 도구
      'parse_annex',
      'parse_date',
      'create_chain_plan',
      'aggregate_chain_results',
    ],
    hybrid_engine: hybridHandlers !== null,
  });
});

/**
 * Tool: audit_statute (법령 조문 검증)
 *
 * 약어 정규화 지원:
 * - "공운법" → "공공기관의 운영에 관한 법률"
 * - "근기법" → "근로기준법"
 * - 등 100+ 약어 자동 인식
 */
app.post('/tools/audit_statute', async (req: Request, res: Response) => {
  try {
    const { law_name, article_number } = req.body;

    if (!law_name) {
      res.status(400).json({ error: 'law_name is required' });
      return;
    }

    // 🆕 약어 정규화 적용
    const normResult = normalizeLawName(law_name);
    const normalizedLawName = normResult.normalized;

    // 정규화된 법령명으로 검색
    const law: LawRecord | null = await findLawByNameStore(normalizedLawName);

    if (!law) {
      // 정규화 후에도 못 찾은 경우 - 유사 법령 제안
      const suggestions = searchPossibleLawNames(law_name)
        .slice(0, 5)
        .map((s: NormalizationResult) => ({
          abbreviation: s.original,
          full_name: s.normalized,
          confidence: Math.round(s.confidence * 100),
        }));

      res.json({
        status: 'HALLUCINATION',
        message: normResult.isAbbreviation
          ? `약어 '${law_name}'이(가) '${normalizedLawName}'(으)로 해석되었으나 DB에서 찾을 수 없습니다`
          : `법령 '${law_name}'을(를) 찾을 수 없습니다`,
        input_law_name: law_name,
        normalized_law_name: normalizedLawName,
        normalization: {
          source: normResult.source,
          confidence: Math.round(normResult.confidence * 100),
          is_abbreviation: normResult.isAbbreviation,
        },
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        link: `https://www.law.go.kr/법령/${encodeURIComponent(normalizedLawName)}`,
      });
      return;
    }

    // 조문 번호가 있는 경우 조문 검색
    if (article_number && law.id) {
      const article: ArticleRecord | null = await findArticleStore(law.id, article_number);
      if (!article) {
        res.json({
          status: 'AMBIGUOUS',
          message: `${law.law_name} 제${article_number}조를 찾을 수 없습니다`,
          input_law_name: law_name,
          normalized_law_name: law.law_name,
          normalization: normResult.isAbbreviation ? {
            source: normResult.source,
            confidence: Math.round(normResult.confidence * 100),
            is_abbreviation: true,
          } : undefined,
          law_info: law,
          link: `https://www.law.go.kr/법령/${encodeURIComponent(law.law_name)}`,
        });
        return;
      }

      res.json({
        status: 'VALID',
        law_name: law.law_name,
        input_law_name: law_name !== law.law_name ? law_name : undefined,
        article_number: article.article_no,
        content: article.content,
        normalization: normResult.isAbbreviation ? {
          source: normResult.source,
          confidence: Math.round(normResult.confidence * 100),
          is_abbreviation: true,
          original: law_name,
          normalized: law.law_name,
        } : undefined,
        link: `https://www.law.go.kr/법령/${encodeURIComponent(law.law_name)}/제${article_number}조`,
      });
      return;
    }

    // 법령만 검색하는 경우
    res.json({
      status: 'VALID',
      law_name: law.law_name,
      input_law_name: law_name !== law.law_name ? law_name : undefined,
      enforcement_date: law.enforcement_date,
      normalization: normResult.isAbbreviation ? {
        source: normResult.source,
        confidence: Math.round(normResult.confidence * 100),
        is_abbreviation: true,
        original: law_name,
        normalized: law.law_name,
      } : undefined,
      link: `https://www.law.go.kr/법령/${encodeURIComponent(law.law_name)}`,
    });
  } catch (error) {
    console.error('audit_statute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_law_names (법령명 검색)
 * 법령명(메타데이터) 기반으로 Laws 테이블에서 검색합니다.
 */
app.post('/tools/search_law_names', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10, law_type } = req.body;
    const q = String(query || '').trim();
    const l = Math.max(1, Math.min(parseInt(String(limit || 10), 10) || 10, 50));

    if (!q) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    if (USE_SUPABASE) {
      const db = supabaseDb.getSupabase();
      const escaped = q.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const orExpr = `law_name.ilike.%${escaped}%,law_name_normalized.ilike.%${escaped}%`;

      let qb = db
        .from('laws')
        .select('law_mst_id, law_name, law_type, enforcement_date, ministry, status')
        .or(orExpr)
        .limit(l);

      if (law_type) {
        qb = qb.eq('law_type', law_type);
      }

      const { data, error } = await qb;
      if (error) {
        res.json({ status: 'ERROR', message: error.message, laws: [], total: 0, source: 'supabase' });
        return;
      }

      res.json({
        status: 'OK',
        query: q,
        laws: data || [],
        total: (data || []).length,
        source: 'supabase',
      });
      return;
    }

    const db = getDatabase();
    const like = `%${q}%`;
    const exact = q;

    const baseSql = `
      SELECT
        law_mst_id,
        law_name,
        law_type,
        enforcement_date,
        ministry,
        status
      FROM Laws
      WHERE (law_name LIKE ? OR law_name_normalized LIKE ?)
      ${law_type ? 'AND law_type = ?' : ''}
      ORDER BY
        CASE
          WHEN law_name = ? THEN 0
          WHEN law_name LIKE ? THEN 1
          ELSE 2
        END,
        LENGTH(law_name) ASC
      LIMIT ?
    `;

    const stmt = db.prepare(baseSql);
    const params: any[] = [like, like];
    if (law_type) params.push(law_type);
    params.push(exact, like, l);

    const rows = stmt.all(...params) as any[];

    res.json({
      status: 'OK',
      query: q,
      laws: rows,
      total: rows.length,
      source: 'sqlite',
    });
  } catch (error) {
    console.error('search_law_names error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_similar_articles (유사 조문 검색)
 * 동일 법령 내에서 주어진 텍스트와 유사한 내용의 조문을 검색
 *
 * 개선된 로직:
 * 1. 인접 조문(±5) 우선 탐색 - 조문 번호 오류 감지
 * 2. 제목(article_title) 키워드 매칭 - 가중치 부여
 * 3. 복합 스코어링: 제목 매칭 > 인접 조문 > 내용 유사도
 * 4. 🆕 약어 정규화 지원
 */
app.post('/tools/search_similar_articles', (req: Request, res: Response) => {
  try {
    const { law_name, search_text, limit = 5, original_article_number } = req.body;

    if (!law_name || !search_text) {
      res.status(400).json({ error: 'law_name and search_text are required' });
      return;
    }

    (async () => {
      // 🆕 약어 정규화 적용
      const normResult = normalizeLawName(law_name);
      const normalizedLawName = normResult.normalized;

      const law: LawRecord | null = await findLawByNameStore(normalizedLawName);
      if (!law || !law.id) {
        res.json({
          status: 'NOT_FOUND',
          message: `법령 '${law_name}'을(를) 찾을 수 없습니다`,
          suggestions: [],
        });
        return;
      }

      const searchKeywords = extractKeywords(search_text);
      const keywordArr = Array.from(searchKeywords).slice(0, 10); // 키워드 수 증가

      // 원본 조문 번호에서 숫자 추출 (인접 조문 탐색용)
      const originalArticleNum = original_article_number 
        ? parseInt(String(original_article_number).replace(/[^0-9]/g, ''), 10)
        : null;

      let articles: ArticleRecord[] = [];

      if (USE_SUPABASE) {
        // Supabase 모드: 키워드 검색 + 제목 검색 병행
        const db = supabaseDb.getSupabase();
        
        // 1. 키워드가 content 또는 article_title에 포함된 조문 검색
        let orConditions: string[] = [];
        
        if (keywordArr.length > 0) {
          // content에서 키워드 검색
          keywordArr.forEach((k) => {
            orConditions.push(`content.ilike.%${k}%`);
            orConditions.push(`article_title.ilike.%${k}%`);
          });
        }

        let qb = db
          .from('articles')
          .select('article_no, article_title, content')
          .eq('law_id', law.id);

        if (orConditions.length > 0) {
          qb = qb.or(orConditions.join(','));
        }

        const { data, error } = await qb.limit(300);
        if (error) {
          res.json({ status: 'ERROR', message: error.message, suggestions: [] });
          return;
        }
        articles = (data || []) as ArticleRecord[];

        // 2. 인접 조문 추가 검색 (원본 조문 번호 ±5 범위)
        if (originalArticleNum) {
          const adjacentRange = Array.from({ length: 11 }, (_, i) => originalArticleNum - 5 + i)
            .filter(n => n > 0)
            .map(n => String(n));
          
          const { data: adjacentData } = await db
            .from('articles')
            .select('article_no, article_title, content')
            .eq('law_id', law.id)
            .in('article_no', adjacentRange);
          
          if (adjacentData) {
            // 중복 제거하며 병합
            const existingNos = new Set(articles.map(a => a.article_no));
            adjacentData.forEach((adj: any) => {
              if (!existingNos.has(adj.article_no)) {
                articles.push(adj as ArticleRecord);
              }
            });
          }
        }
      } else {
        // SQLite 모드: 해당 법령의 모든 조문 대상으로 스코어링
        const db = getDatabase();
        const articlesStmt = db.prepare(`
          SELECT * FROM Articles 
          WHERE law_id = ? 
          ORDER BY CAST(article_no_normalized AS INTEGER), article_no
        `);
        articles = articlesStmt.all(law.id) as ArticleRecord[];
      }

      // 복합 스코어링 시스템
      const scored = articles.map((article) => {
        const articleNo = parseInt(String(article.article_no).replace(/[^0-9]/g, ''), 10);
        
        // 1. 내용 유사도 (Jaccard)
        const contentKeywords = extractKeywords(article.content);
        const contentSimilarity = calculateJaccardSimilarity(searchKeywords, contentKeywords);
        
        // 2. 제목 유사도 (가중치 2배)
        const titleKeywords = extractKeywords(article.article_title || '');
        const titleSimilarity = calculateJaccardSimilarity(searchKeywords, titleKeywords);
        
        // 3. 인접 조문 보너스 (±5 범위 내)
        let adjacentBonus = 0;
        if (originalArticleNum && articleNo) {
          const distance = Math.abs(articleNo - originalArticleNum);
          if (distance > 0 && distance <= 5) {
            // 거리가 가까울수록 높은 보너스 (1칸: 0.3, 5칸: 0.1)
            adjacentBonus = 0.35 - (distance * 0.05);
          }
        }
        
        // 4. 키워드 완전 매칭 보너스 (모든 검색 키워드가 포함된 경우)
        const allContentText = `${article.article_title || ''} ${article.content}`;
        const matchedKeywords = keywordArr.filter(k => allContentText.includes(k));
        const keywordMatchRatio = keywordArr.length > 0 ? matchedKeywords.length / keywordArr.length : 0;
        const fullMatchBonus = keywordMatchRatio >= 0.8 ? 0.2 : (keywordMatchRatio >= 0.5 ? 0.1 : 0);
        
        // 복합 스코어 계산
        // 제목 매칭(x2) + 내용 유사도 + 인접 보너스 + 키워드 매칭 보너스
        const combinedScore = (titleSimilarity * 2) + contentSimilarity + adjacentBonus + fullMatchBonus;
        
        return { 
          article, 
          similarity: combinedScore,
          breakdown: {
            content: Math.round(contentSimilarity * 100),
            title: Math.round(titleSimilarity * 100),
            adjacent: Math.round(adjacentBonus * 100),
            keywordMatch: Math.round(fullMatchBonus * 100),
          }
        };
      });

      // 원본 조문 번호와 동일한 것은 제외
      const filteredScored = scored.filter((s) => {
        if (!original_article_number) return true;
        return s.article.article_no !== String(original_article_number);
      });

      const suggestions = filteredScored
        .filter((s) => s.similarity > 0.1)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map((s) => ({
          article_number: s.article.article_no,
          article_title: s.article.article_title,
          content: s.article.content,
          similarity: Math.round(Math.min(s.similarity * 50, 100)), // 정규화 (0-100)
          score_breakdown: s.breakdown,
          link: `https://www.law.go.kr/법령/${encodeURIComponent(law_name)}/제${s.article.article_no}조`,
        }));

      res.json({
        status: 'OK',
        law_name: law.law_name,
        total_articles_scanned: articles.length,
        original_article_number: original_article_number || null,
        suggestions,
        source: USE_SUPABASE ? 'supabase_enhanced' : 'sqlite_full_scan',
      });
    })().catch((err) => {
      console.error('search_similar_articles error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  } catch (error) {
    console.error('search_similar_articles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 텍스트에서 핵심 키워드 추출
function extractKeywords(text: string): Set<string> {
  if (!text) return new Set();
  
  // 한글 단어 + 숫자 추출 (2글자 이상)
  const words = text.match(/[가-힣]{2,}|\d+/g) || [];
  
  // 불용어 제거
  const stopwords = new Set([
    '따르면', '의하면', '에서는', '있다', '없다', '한다', '된다', '이다',
    '그러나', '그리고', '또는', '및', '등', '를', '을', '이', '가', '은',
    '는', '의', '에', '로', '으로', '와', '과', '에서', '까지', '부터',
    '처럼', '만큼', '대한', '위한', '통한', '관한', '경우', '때문',
    '이상', '이하', '이내', '초과', '미만', '해당', '하는', '하여',
  ]);
  
  return new Set(words.filter((w) => !stopwords.has(w) && w.length >= 2));
}

// Jaccard 유사도 계산
function calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Tool: search_across_laws (다른 법령에서 유사 내용 검색)
 * 여러 법령에서 주어진 텍스트와 유사한 내용의 조문을 검색
 */
app.post('/tools/search_across_laws', (req: Request, res: Response) => {
  try {
    const { search_text, limit = 5 } = req.body;

    if (!search_text) {
      res.status(400).json({ error: 'search_text is required' });
      return;
    }

    (async () => {
      const searchKeywords = extractKeywords(search_text);
      const keywordArr = Array.from(searchKeywords).slice(0, 5);

      if (keywordArr.length === 0) {
        res.json({
          status: 'OK',
          results: [],
          message: '검색 키워드를 추출할 수 없습니다',
        });
        return;
      }

      interface CrossLawResult {
        law_name: string;
        article_no: string;
        article_title: string;
        content: string;
        similarity: number;
      }

      let results: CrossLawResult[] = [];

      if (USE_SUPABASE) {
        // Supabase 모드: 여러 법령에서 키워드 기반 검색
        const db = supabaseDb.getSupabase();

        // 키워드가 포함된 조문 검색 (content에서)
        const orExpr = keywordArr.map((k) => `content.ilike.%${k}%`).join(',');

        const { data, error } = await db
          .from('articles')
          .select(`
            article_no,
            article_title,
            content,
            laws!inner(law_name)
          `)
          .or(orExpr)
          .limit(100);

        if (error) {
          res.json({ status: 'ERROR', message: error.message, results: [] });
          return;
        }

        if (data) {
          results = data.map((row: any) => {
            const articleKeywords = extractKeywords(row.content);
            const similarity = calculateJaccardSimilarity(searchKeywords, articleKeywords);
            return {
              law_name: row.laws?.law_name || 'Unknown',
              article_no: row.article_no,
              article_title: row.article_title,
              content: row.content,
              similarity: Math.round(similarity * 100),
            };
          });
        }
      } else {
        // SQLite 모드: LIKE 쿼리로 여러 법령 검색
        const db = getDatabase();

        // 키워드 기반 LIKE 쿼리 구성
        const likeConditions = keywordArr.map(() => 'a.content LIKE ?').join(' OR ');
        const likeParams = keywordArr.map((k) => `%${k}%`);

        const stmt = db.prepare(`
          SELECT
            l.law_name,
            a.article_no,
            a.article_title,
            a.content
          FROM Articles a
          JOIN Laws l ON a.law_id = l.id
          WHERE ${likeConditions}
          LIMIT 100
        `);

        const rows = stmt.all(...likeParams) as Array<{
          law_name: string;
          article_no: string;
          article_title: string;
          content: string;
        }>;

        results = rows.map((row) => {
          const articleKeywords = extractKeywords(row.content);
          const similarity = calculateJaccardSimilarity(searchKeywords, articleKeywords);
          return {
            law_name: row.law_name,
            article_no: row.article_no,
            article_title: row.article_title,
            content: row.content,
            similarity: Math.round(similarity * 100),
          };
        });
      }

      // 유사도로 정렬하고 상위 결과 반환
      const topResults = results
        .filter((r) => r.similarity > 10)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map((r) => ({
          law_name: r.law_name,
          article_number: r.article_no,
          article_title: r.article_title,
          content: r.content,
          similarity: r.similarity,
          link: `https://www.law.go.kr/법령/${encodeURIComponent(r.law_name)}/제${r.article_no}조`,
        }));

      res.json({
        status: 'OK',
        results: topResults,
        total_scanned: results.length,
        source: USE_SUPABASE ? 'supabase' : 'sqlite',
      });
    })().catch((err) => {
      console.error('search_across_laws error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  } catch (error) {
    console.error('search_across_laws error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: check_enforcement_date (시행일 확인)
 * 🆕 약어 정규화 지원
 */
app.post('/tools/check_enforcement_date', (req: Request, res: Response) => {
  try {
    const { law_name } = req.body;

    if (!law_name) {
      res.status(400).json({ error: 'law_name is required' });
      return;
    }

    (async () => {
      // 🆕 약어 정규화 적용
      const normResult = normalizeLawName(law_name);
      const normalizedLawName = normResult.normalized;

      const law: LawRecord | null = await findLawByNameStore(normalizedLawName);
      if (!law) {
        res.json({
          law_name,
          normalized_law_name: normalizedLawName,
          status: 'unknown',
          message: normResult.isAbbreviation
            ? `약어 '${law_name}'이(가) '${normalizedLawName}'(으)로 해석되었으나 DB에서 찾을 수 없습니다`
            : '해당 법령을 찾을 수 없습니다',
          normalization: normResult.isAbbreviation ? {
            source: normResult.source,
            confidence: Math.round(normResult.confidence * 100),
          } : undefined,
          source: USE_SUPABASE ? 'supabase' : 'sqlite',
        });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const status = law.enforcement_date <= today ? 'effective' : 'pending';

      res.json({
        law_name: law.law_name,
        input_law_name: law_name !== law.law_name ? law_name : undefined,
        enforcement_date: law.enforcement_date,
        status,
        normalization: normResult.isAbbreviation ? {
          source: normResult.source,
          confidence: Math.round(normResult.confidence * 100),
          original: law_name,
          normalized: law.law_name,
        } : undefined,
        link: `https://www.law.go.kr/법령/${encodeURIComponent(law.law_name)}`,
        source: USE_SUPABASE ? 'supabase' : 'sqlite',
      });
    })().catch((error) => {
      console.error('check_enforcement_date error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  } catch (error) {
    console.error('check_enforcement_date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: verify_case_exists (판례 실존 확인)
 */
app.post('/tools/verify_case_exists', async (req: Request, res: Response) => {
  try {
    const { case_number } = req.body;
    
    if (!case_number) {
      res.status(400).json({ error: 'case_number is required' });
      return;
    }

    const existsLocal: boolean = await verifyPrecedentExistsStore(case_number);

    if (existsLocal) {
      res.json({
        case_number,
        exists: true,
        case_info: { case_number },
        source: 'local_db',
      });
      return;
    }

    verifyPrecedentExistsOnline(case_number)
      .then((existsOnline) => {
        res.json({
          case_number,
          exists: existsOnline,
          case_info: existsOnline ? { case_number } : null,
          source: 'online_fallback',
        });
      })
      .catch((error) => {
        console.error('verify_case_exists online fallback error:', error);
        res.json({
          case_number,
          exists: false,
          case_info: null,
          source: 'online_fallback_error',
        });
      });
  } catch (error) {
    console.error('verify_case_exists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: get_daily_diff (오늘 변경 사항)
 */
app.post('/tools/get_daily_diff', async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Supabase(today_diffs view)는 오늘 기준. SQLite도 오늘 기준.
    const diffs = await getTodayDiffsStore();
    
    res.json({
      date: targetDate,
      changes: diffs,
      count: diffs.length,
      source: USE_SUPABASE ? 'supabase' : 'sqlite',
    });
  } catch (error) {
    console.error('get_daily_diff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: audit_contract_timeline (계약 기간 법령 검증)
 */
app.post('/tools/audit_contract_timeline', (req: Request, res: Response) => {
  try {
    const { start_date, end_date, relevant_statutes } = req.body;
    
    if (!start_date || !end_date) {
      res.status(400).json({ error: 'start_date and end_date are required' });
      return;
    }

    (async () => {
      const futureChanges = await getFutureChangesStore(start_date, end_date);
    
    // Filter by relevant statutes if provided
    let filteredChanges = futureChanges;
    if (relevant_statutes && relevant_statutes.length > 0) {
      filteredChanges = futureChanges.filter((change: any) =>
        relevant_statutes.some((statute: string) => 
          change.law_name?.includes(statute)
        )
      );
    }

      res.json({
        period: { start: start_date, end: end_date },
        upcoming_changes: filteredChanges,
        risk_level: filteredChanges.length > 0 ? 'attention_needed' : 'stable',
        source: USE_SUPABASE ? 'supabase' : 'sqlite',
      });
    })().catch((error) => {
      console.error('audit_contract_timeline error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  } catch (error) {
    console.error('audit_contract_timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: check_legal_definition (법률 용어 정의)
 * 🆕 약어 정규화 지원
 */
app.post('/tools/check_legal_definition', (req: Request, res: Response) => {
  try {
    const { law_name, term } = req.body;

    if (!law_name || !term) {
      res.status(400).json({ error: 'law_name and term are required' });
      return;
    }

    (async () => {
      // 🆕 약어 정규화 적용
      const normResult = normalizeLawName(law_name);
      const normalizedLawName = normResult.normalized;

      const law: LawRecord | null = await findLawByNameStore(normalizedLawName);
      if (!law) {
        res.json({
          term,
          law_name,
          normalized_law_name: normalizedLawName,
          found: false,
          message: normResult.isAbbreviation
            ? `약어 '${law_name}'이(가) '${normalizedLawName}'(으)로 해석되었으나 DB에서 찾을 수 없습니다`
            : '해당 법령을 찾을 수 없습니다',
          normalization: normResult.isAbbreviation ? {
            source: normResult.source,
            confidence: Math.round(normResult.confidence * 100),
          } : undefined,
          source: USE_SUPABASE ? 'supabase' : 'sqlite',
        });
        return;
      }

      // 제2조(정의) 조문에서 용어 검색
      const definitionArticle: ArticleRecord | null = law.id
        ? await findArticleStore(law.id, '2')
        : null;

      if (definitionArticle && definitionArticle.content.includes(term)) {
        res.json({
          term,
          law_name: law.law_name,
          input_law_name: law_name !== law.law_name ? law_name : undefined,
          found: true,
          article: '제2조(정의)',
          content: definitionArticle.content,
          normalization: normResult.isAbbreviation ? {
            source: normResult.source,
            confidence: Math.round(normResult.confidence * 100),
            original: law_name,
            normalized: law.law_name,
          } : undefined,
          link: `https://www.law.go.kr/법령/${encodeURIComponent(law.law_name)}/제2조`,
          source: USE_SUPABASE ? 'supabase' : 'sqlite',
        });
        return;
      }

      res.json({
        term,
        law_name: law.law_name,
        input_law_name: law_name !== law.law_name ? law_name : undefined,
        found: false,
        message: `'${term}' 용어 정의를 해당 법령에서 찾을 수 없습니다`,
        normalization: normResult.isAbbreviation ? {
          source: normResult.source,
          confidence: Math.round(normResult.confidence * 100),
          original: law_name,
          normalized: law.law_name,
        } : undefined,
        source: USE_SUPABASE ? 'supabase' : 'sqlite',
      });
    })().catch((error) => {
      console.error('check_legal_definition error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  } catch (error) {
    console.error('check_legal_definition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🆕 건설기준(KDS/KCS) 검색 엔드포인트
app.post('/tools/search_construction_standards', async (req: Request, res: Response) => {
  try {
    const { query, doc_type = 'ALL', category, limit = 10 } = req.body;

    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const database = getDatabase();
    if (!database) {
      res.json({
        status: 'NOT_FOUND',
        query,
        message: 'Database not available',
        results: []
      });
      return;
    }

    let sql = `
      SELECT kcsc_cd, standard_name, doc_type, main_category, middle_category,
             effective_date, dept, status
      FROM ConstructionStandards
      WHERE (standard_name LIKE ? OR kcsc_cd LIKE ? OR main_category LIKE ? OR middle_category LIKE ?)
    `;
    const searchPattern = `%${query}%`;
    const params: any[] = [searchPattern, searchPattern, searchPattern, searchPattern];

    if (doc_type && doc_type !== 'ALL') {
      sql += ` AND doc_type = ?`;
      params.push(doc_type);
    }

    if (category) {
      sql += ` AND (main_category LIKE ? OR middle_category LIKE ?)`;
      params.push(`%${category}%`, `%${category}%`);
    }

    sql += ` ORDER BY effective_date DESC LIMIT ?`;
    params.push(limit);

    const results = database.prepare(sql).all(...params) as any[];

    if (results.length === 0) {
      res.json({
        status: 'NOT_FOUND',
        query,
        message: `"${query}" 관련 건설기준을 찾을 수 없습니다.`,
        suggestion: 'KDS(설계기준) 또는 KCS(표준시방서) 코드로 검색해 보세요.',
        results: []
      });
      return;
    }

    res.json({
      status: 'OK',
      query,
      doc_type,
      count: results.length,
      results: results.map((r: any) => ({
        kcsc_cd: r.kcsc_cd,
        standard_name: r.standard_name,
        doc_type: r.doc_type,
        category: `${r.main_category || ''} > ${r.middle_category || ''}`,
        effective_date: r.effective_date,
        dept: r.dept,
        status: r.status,
        url: `https://kcsc.re.kr/standardCode/standardCodeView?kcsc_cd=${encodeURIComponent(r.kcsc_cd)}`
      }))
    });
  } catch (error) {
    console.error('search_construction_standards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🆕 건설기준 상세 정보 조회 엔드포인트
app.post('/tools/get_standard_details', async (req: Request, res: Response) => {
  try {
    const { kcsc_cd, include_history = false } = req.body;

    if (!kcsc_cd) {
      res.status(400).json({ error: 'kcsc_cd is required' });
      return;
    }

    const database = getDatabase();
    if (!database) {
      res.json({
        status: 'NOT_FOUND',
        kcsc_cd,
        message: 'Database not available'
      });
      return;
    }

    const standard = database.prepare(`SELECT * FROM ConstructionStandards WHERE kcsc_cd = ?`).get(kcsc_cd) as any;

    if (!standard) {
      res.json({
        status: 'NOT_FOUND',
        kcsc_cd,
        message: `"${kcsc_cd}" 코드의 건설기준을 찾을 수 없습니다.`,
        suggestion: '코드 형식을 확인하세요. (예: KDS 57 70 00, KCS 14 20 10)'
      });
      return;
    }

    // 조항 정보 조회
    const articles = database.prepare(`
      SELECT article_no, title, content
      FROM ConstructionStandardArticles
      WHERE standard_id = ?
      ORDER BY article_no
    `).all(standard.id) as any[];

    // 개정 이력 조회 (선택적)
    let revisions: any[] = [];
    if (include_history) {
      revisions = database.prepare(`
        SELECT doc_year, doc_cycle, doc_er, establishment_date, revision_date,
               effective_from, revision_remark, is_latest
        FROM ConstructionStandardRevisions
        WHERE standard_id = ?
        ORDER BY doc_year DESC, doc_order DESC
      `).all(standard.id) as any[];
    }

    res.json({
      status: 'OK',
      kcsc_cd,
      standard: {
        kcsc_cd: standard.kcsc_cd,
        standard_name: standard.standard_name,
        standard_name_eng: standard.standard_name_eng,
        doc_type: standard.doc_type,
        main_category: standard.main_category,
        middle_category: standard.middle_category,
        establishment_date: standard.establishment_date,
        revision_date: standard.revision_date,
        effective_date: standard.effective_date,
        dept: standard.dept,
        consider_org: standard.consider_org,
        advice_org: standard.advice_org,
        publish_org: standard.publish_org,
        status: standard.status
      },
      articles: articles.map((a: any) => ({
        article_no: a.article_no,
        title: a.title,
        content: a.content
      })),
      revisions: revisions.map((r: any) => ({
        doc_year: r.doc_year,
        doc_cycle: r.doc_cycle,
        effective_from: r.effective_from,
        revision_remark: r.revision_remark,
        is_latest: r.is_latest
      })),
      url: `https://kcsc.re.kr/standardCode/standardCodeView?kcsc_cd=${encodeURIComponent(kcsc_cd)}`
    });
  } catch (error) {
    console.error('get_standard_details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// 🆕 하이브리드 엔진 도구 (RAG + CAG)
// ============================================

/**
 * Tool: hybrid_query (하이브리드 검색)
 * RAG + CAG 결합 법령 검색
 */
app.post('/tools/hybrid_query', async (req: Request, res: Response) => {
  try {
    const handlers = await loadHybridHandlers();
    if (!handlers) {
      res.status(503).json({
        status: 'ERROR',
        error: 'Hybrid engine not available',
        message: '하이브리드 엔진을 사용할 수 없습니다.'
      });
      return;
    }

    const { query, law_name, force_route } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const result = await handlers.handleHybridQuery({
      query,
      law_name,
      force_route,
    });

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('hybrid_query error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

/**
 * Tool: temporal_search (시점 인식 검색)
 * Point-in-Time 법령 검색
 */
app.post('/tools/temporal_search', async (req: Request, res: Response) => {
  try {
    const handlers = await loadHybridHandlers();
    if (!handlers) {
      res.status(503).json({
        status: 'ERROR',
        error: 'Hybrid engine not available',
        message: '하이브리드 엔진을 사용할 수 없습니다.'
      });
      return;
    }

    const { query, law_name, target_date } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const result = await handlers.handleTemporalSearch({
      query,
      law_name,
      target_date,
    });

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('temporal_search error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

/**
 * Tool: compare_amendment (개정 비교)
 * 현행법과 시행 예정 개정안 비교
 */
app.post('/tools/compare_amendment', async (req: Request, res: Response) => {
  try {
    const handlers = await loadHybridHandlers();
    if (!handlers) {
      res.status(503).json({
        status: 'ERROR',
        error: 'Hybrid engine not available',
        message: '하이브리드 엔진을 사용할 수 없습니다.'
      });
      return;
    }

    const { law_name } = req.body;
    if (!law_name) {
      res.status(400).json({ error: 'law_name is required' });
      return;
    }

    const result = await handlers.handleCompareAmendment({ law_name });

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('compare_amendment error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

/**
 * Tool: get_law_timeline (법령 타임라인)
 * 특정 법령/조항의 개정 이력 시각화
 */
app.post('/tools/get_law_timeline', async (req: Request, res: Response) => {
  try {
    const handlers = await loadHybridHandlers();
    if (!handlers) {
      res.status(503).json({
        status: 'ERROR',
        error: 'Hybrid engine not available',
        message: '하이브리드 엔진을 사용할 수 없습니다.'
      });
      return;
    }

    const { law_name, article_no } = req.body;
    if (!law_name) {
      res.status(400).json({ error: 'law_name is required' });
      return;
    }

    const result = await handlers.handleGetLawTimeline({ law_name, article_no });

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('get_law_timeline error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

/**
 * Tool: get_cache_status (캐시 상태)
 * 하이브리드 엔진 캐시 상태 조회
 */
app.post('/tools/get_cache_status', async (req: Request, res: Response) => {
  try {
    const handlers = await loadHybridHandlers();
    if (!handlers) {
      res.status(503).json({
        status: 'ERROR',
        error: 'Hybrid engine not available',
        message: '하이브리드 엔진을 사용할 수 없습니다.'
      });
      return;
    }

    const result = await handlers.handleGetCacheStatus();

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('get_cache_status error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

// ============================================
// 🆕 확장 법률 데이터 API (유권해석, 결정례, 심판례)
// ============================================

/**
 * Tool: search_legal_interpretations (법령해석례 검색)
 * 법제처 법령해석례 검색
 */
app.post('/tools/search_legal_interpretations', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      console.warn('⚠️ Extended API not available');
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { query, limit = 20 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    console.log(`🔍 Searching legal interpretations: query="${query}", limit=${limit}`);
    console.log(`   Function available: ${typeof extApi.searchLegalInterpretations}`);
    const results = await extApi.searchLegalInterpretations(query, limit);
    console.log(`✅ Got ${results.length} results from API`);
    if (!results || !Array.isArray(results)) {
      console.warn(`⚠️ Unexpected result type:`, typeof results, JSON.stringify(results).substring(0, 100));
    }

    res.json({
      status: 'OK',
      query,
      count: results.length,
      results: results.map((item: any) => ({
        id: item.법령해석일련번호,
        title: item.사안명,
        agency: item.회신기관명,
        case_no: item.안건번호,
        reply_date: item.회신일자,
        question_summary: item.질의요지,
        answer_summary: item.회답,
      })),
    });
  } catch (error) {
    console.error('❌ search_legal_interpretations error:', error);
    res.status(500).json({ error: 'Internal server error', details: String(error) });
  }
});

/**
 * Tool: get_legal_interpretation_detail (법령해석례 상세)
 * 법령해석례 본문 조회
 */
app.post('/tools/get_legal_interpretation_detail', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { interpretation_id } = req.body;
    if (!interpretation_id) {
      res.status(400).json({ error: 'interpretation_id is required' });
      return;
    }

    const detail = await extApi.getLegalInterpretationDetail(interpretation_id);
    if (!detail) {
      res.json({ status: 'NOT_FOUND', interpretation_id });
      return;
    }

    res.json({
      status: 'OK',
      interpretation_id,
      detail,
    });
  } catch (error) {
    console.error('get_legal_interpretation_detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_constitutional_decisions (헌재결정례 검색)
 * 헌법재판소 결정례 검색
 */
app.post('/tools/search_constitutional_decisions', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { query, limit = 20 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const results = await extApi.searchConstitutionalDecisions(query, limit);
    res.json({
      status: 'OK',
      query,
      count: results.length,
      results: results.map((item: any) => ({
        id: item.헌재결정일련번호,
        case_no: item.사건번호,
        case_name: item.사건명,
        decision_date: item.선고일자,
        decision_type: item.결정유형,
        holding: item.주문,
        summary: item.결정요지,
      })),
    });
  } catch (error) {
    console.error('search_constitutional_decisions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: get_constitutional_decision_detail (헌재결정례 상세)
 * 헌법재판소 결정례 본문 조회
 */
app.post('/tools/get_constitutional_decision_detail', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { decision_id } = req.body;
    if (!decision_id) {
      res.status(400).json({ error: 'decision_id is required' });
      return;
    }

    const detail = await extApi.getConstitutionalDecisionDetail(decision_id);
    if (!detail) {
      res.json({ status: 'NOT_FOUND', decision_id });
      return;
    }

    res.json({
      status: 'OK',
      decision_id,
      detail,
    });
  } catch (error) {
    console.error('get_constitutional_decision_detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_admin_appeals (행정심판례 검색)
 * 행정심판 재결례 검색
 */
app.post('/tools/search_admin_appeals', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { query, limit = 20 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const results = await extApi.searchAdminAppeals(query, limit);
    res.json({
      status: 'OK',
      query,
      count: results.length,
      results: results.map((item: any) => ({
        id: item.행정심판일련번호 || item.행정심판재결례일련번호,
        case_no: item.사건번호,
        case_name: item.사건명,
        decision_date: item.재결일자 || item.의결일자,
        result: item.재결결과 || item.재결구분명,
        summary: item.재결요지,
      })),
    });
  } catch (error) {
    console.error('search_admin_appeals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: get_admin_appeal_detail (행정심판례 상세)
 * 행정심판 재결례 본문 조회
 */
app.post('/tools/get_admin_appeal_detail', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { appeal_id } = req.body;
    if (!appeal_id) {
      res.status(400).json({ error: 'appeal_id is required' });
      return;
    }

    const detail = await extApi.getAdminAppealDetail(appeal_id);
    if (!detail) {
      res.json({ status: 'NOT_FOUND', appeal_id });
      return;
    }

    res.json({
      status: 'OK',
      appeal_id,
      detail,
    });
  } catch (error) {
    console.error('get_admin_appeal_detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_committee_decisions (위원회 결정문 검색)
 * 공정위, 금융위, 노동위 등 12개 위원회 결정문 검색
 */
app.post('/tools/search_committee_decisions', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { committee, query, limit = 20 } = req.body;
    if (!committee || !query) {
      res.status(400).json({ 
        error: 'committee and query are required',
        available_committees: [
          'privacy (개인정보보호위원회)',
          'monopoly (공정거래위원회)',
          'labor (중앙노동위원회)',
          'financial (금융위원회)',
          'anticorruption (국민권익위원회)',
          'environment (환경분쟁조정위원회)',
          'human_rights (국가인권위원회)',
          'broadcasting (방송통신위원회)',
          'securities (증권선물위원회)',
        ]
      });
      return;
    }

    const results = await extApi.searchCommitteeDecisions(committee, query, limit);
    res.json({
      status: 'OK',
      committee,
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('search_committee_decisions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_ministry_interpretations (부처별 유권해석 검색)
 * 고용노동부, 국세청, 국토부 등 주요 부처 법령해석 검색
 */
app.post('/tools/search_ministry_interpretations', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { ministry, query, limit = 20 } = req.body;
    if (!ministry || !query) {
      res.status(400).json({ 
        error: 'ministry and query are required',
        available_ministries: [
          'moel (고용노동부)',
          'nts (국세청)',
          'molit (국토교통부)',
          'mohw (보건복지부)',
          'mof (해양수산부)',
          'moef (기획재정부)',
          'moe (교육부)',
          'msit (과학기술정보통신부)',
          'me (환경부)',
          'mafra (농림축산식품부)',
        ]
      });
      return;
    }

    const results = await extApi.searchMinistryInterpretations(ministry, query, limit);
    res.json({
      status: 'OK',
      ministry,
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('search_ministry_interpretations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_tribunal_decisions (특별행정심판 검색)
 * 조세심판원, 해양안전심판원, 특허심판원 결정 검색
 */
app.post('/tools/search_tribunal_decisions', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { tribunal, query, limit = 20 } = req.body;
    if (!tribunal || !query) {
      res.status(400).json({ 
        error: 'tribunal and query are required',
        available_tribunals: [
          'tax (조세심판원)',
          'maritime (해양안전심판원)',
          'patent (특허심판원)',
        ]
      });
      return;
    }

    const results = await extApi.searchTribunalDecisions(tribunal, query, limit);
    res.json({
      status: 'OK',
      tribunal,
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('search_tribunal_decisions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_legal_terms (법령용어 검색)
 * 법령용어 사전 검색
 */
app.post('/tools/search_legal_terms', async (req: Request, res: Response) => {
  try {
    const extApi = await loadExtendedApi();
    if (!extApi) {
      res.status(503).json({ error: 'Extended API not available' });
      return;
    }

    const { query, limit = 20 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const results = await extApi.searchLegalTerms(query, limit);
    res.json({
      status: 'OK',
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('search_legal_terms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Phase 2: 판례 (Precedent) Search APIs
// ============================================

// 판례 제목 검색
app.post('/tools/search_precedents_by_title', async (req: Request, res: Response) => {
  try {
    const precedentApi = await loadPrecedentSearch();
    if (!precedentApi) {
      res.status(503).json({ error: 'Precedent search module not available' });
      return;
    }

    const { query, limit = 20, page = 1 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const result = await precedentApi.searchPrecedentsByTitle(query, limit, page);
    res.json({
      status: 'OK',
      ...result,
    });
  } catch (error) {
    console.error('search_precedents_by_title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 판례 본문 검색
app.post('/tools/search_precedents_fulltext', async (req: Request, res: Response) => {
  try {
    const precedentApi = await loadPrecedentSearch();
    if (!precedentApi) {
      res.status(503).json({ error: 'Precedent search module not available' });
      return;
    }

    const { query, limit = 20, page = 1 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const result = await precedentApi.searchPrecedentsByFulltext(query, limit, page);
    res.json({
      status: 'OK',
      ...result,
    });
  } catch (error) {
    console.error('search_precedents_fulltext error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 판례 종합 검색
app.post('/tools/search_precedents', async (req: Request, res: Response) => {
  try {
    const precedentApi = await loadPrecedentSearch();
    if (!precedentApi) {
      res.status(503).json({ error: 'Precedent search module not available' });
      return;
    }

    const { query, limit = 20 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const result = await precedentApi.searchPrecedentsComprehensive(query, limit);
    res.json({
      status: 'OK',
      ...result,
    });
  } catch (error) {
    console.error('search_precedents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 판례 상세 조회
app.post('/tools/get_precedent', async (req: Request, res: Response) => {
  try {
    const precedentApi = await loadPrecedentSearch();
    if (!precedentApi) {
      res.status(503).json({ error: 'Precedent search module not available' });
      return;
    }

    const { caseNumber } = req.body;
    if (!caseNumber) {
      res.status(400).json({ error: 'caseNumber is required' });
      return;
    }

    const result = await precedentApi.getPrecedent(caseNumber);
    if (!result) {
      res.json({ status: 'NOT_FOUND', caseNumber, result: null });
      return;
    }

    res.json({
      status: 'OK',
      caseNumber,
      result,
    });
  } catch (error) {
    console.error('get_precedent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 세금 판례 검색
app.post('/tools/search_tax_precedents', async (req: Request, res: Response) => {
  try {
    const precedentApi = await loadPrecedentSearch();
    if (!precedentApi) {
      res.status(503).json({ error: 'Precedent search module not available' });
      return;
    }

    const { query, limit = 20 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const result = await precedentApi.searchTaxPrecedents(query, limit);
    res.json({
      status: 'OK',
      ...result,
    });
  } catch (error) {
    console.error('search_tax_precedents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 산업재해 판례 검색
app.post('/tools/search_accident_precedents', async (req: Request, res: Response) => {
  try {
    const precedentApi = await loadPrecedentSearch();
    if (!precedentApi) {
      res.status(503).json({ error: 'Precedent search module not available' });
      return;
    }

    const { query, limit = 20 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const result = await precedentApi.searchAccidentPrecedents(query, limit);
    res.json({
      status: 'OK',
      ...result,
    });
  } catch (error) {
    console.error('search_accident_precedents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 통합 판례 검색 (모든 옵션)
app.post('/tools/search_precedents_advanced', async (req: Request, res: Response) => {
  try {
    const precedentApi = await loadPrecedentSearch();
    if (!precedentApi) {
      res.status(503).json({ error: 'Precedent search module not available' });
      return;
    }

    const params = req.body;
    if (!params.query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const result = await precedentApi.searchPrecedentsAdvanced(params);
    res.json({
      status: 'OK',
      ...result,
    });
  } catch (error) {
    console.error('search_precedents_advanced error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// 🆕 @markdown-media/core 네이티브 도구 API
// ============================================

/**
 * Tool: parse_annex (법령 별표/별지 파싱)
 * 텍스트/HWP/HWPX 형식의 법령 별표를 구조화된 데이터로 파싱합니다.
 */
app.post('/tools/parse_annex', async (req: Request, res: Response) => {
  try {
    const handlers = await loadNativeTools();
    if (!handlers['parse_annex']) {
      res.status(503).json({ error: 'parse_annex not available (native module load failed)' });
      return;
    }
    const result = await handlers['parse_annex'](req.body);
    res.json(JSON.parse(result));
  } catch (error) {
    console.error('parse_annex error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: parse_date (한국어 날짜 파싱)
 * 법령 시행일/폐지일 등 한국어 날짜 표현을 YYYYMMDD로 변환합니다.
 */
app.post('/tools/parse_date', async (req: Request, res: Response) => {
  try {
    const handlers = await loadNativeTools();
    if (!handlers['parse_date']) {
      res.status(503).json({ error: 'parse_date not available (native module load failed)' });
      return;
    }
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const result = await handlers['parse_date'](req.body);
    res.json(JSON.parse(result));
  } catch (error) {
    console.error('parse_date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: create_chain_plan (법률 리서치 체인 계획 생성)
 * 질의에 맞는 다단계 MCP 도구 호출 계획을 자동 생성합니다.
 */
app.post('/tools/create_chain_plan', async (req: Request, res: Response) => {
  try {
    const handlers = await loadNativeTools();
    if (!handlers['create_chain_plan']) {
      res.status(503).json({ error: 'create_chain_plan not available (native module load failed)' });
      return;
    }
    const { chain_type, query } = req.body;
    if (!chain_type || !query) {
      res.status(400).json({ error: 'chain_type and query are required' });
      return;
    }
    const result = await handlers['create_chain_plan'](req.body);
    res.json(JSON.parse(result));
  } catch (error) {
    console.error('create_chain_plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: aggregate_chain_results (체인 실행 결과 종합)
 * 여러 도구 호출 결과를 하나의 종합 응답으로 합산합니다.
 */
app.post('/tools/aggregate_chain_results', async (req: Request, res: Response) => {
  try {
    const handlers = await loadNativeTools();
    if (!handlers['aggregate_chain_results']) {
      res.status(503).json({ error: 'aggregate_chain_results not available (native module load failed)' });
      return;
    }
    const { chain_type, results } = req.body;
    if (!chain_type || !results) {
      res.status(400).json({ error: 'chain_type and results are required' });
      return;
    }
    const result = await handlers['aggregate_chain_results'](req.body);
    res.json(JSON.parse(result));
  } catch (error) {
    console.error('aggregate_chain_results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// 🆕 추가 데이터 소스 API (생활법령정보, 판례)
// ============================================

let easylawCrawler: any = null;
let scourtCrawler: any = null;

async function loadCrawlers() {
  try {
    const crawlerModule = await import('./crawlers/index.js');
    easylawCrawler = crawlerModule.getEasyLawCrawler();
    scourtCrawler = crawlerModule.getSCourtCrawler();
    console.log('✅ Crawlers loaded successfully');
  } catch (e) {
    console.warn('⚠️ Crawlers not available:', (e as Error).message);
  }
}

/**
 * Tool: search_easylaw (생활법령정보 검색)
 * 일반인 친화적 법률 해설 검색
 */
app.post('/tools/search_easylaw', async (req: Request, res: Response) => {
  try {
    if (!easylawCrawler) {
      await loadCrawlers();
    }
    if (!easylawCrawler) {
      res.status(503).json({ error: 'EasyLaw crawler not available' });
      return;
    }

    const { query, limit = 20 } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const results = await easylawCrawler.searchEasyLaw(query, limit);
    res.json({
      status: 'OK',
      query,
      count: results.length,
      results: results.map((item: any) => ({
        topicId: item.topicId,
        title: item.title,
        category: item.category,
        url: item.url,
        keywords: item.keywords,
      })),
      source: 'easylaw.go.kr',
    });
  } catch (error) {
    console.error('search_easylaw error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: get_easylaw_topic (생활법령 상세 조회)
 */
app.post('/tools/get_easylaw_topic', async (req: Request, res: Response) => {
  try {
    if (!easylawCrawler) {
      await loadCrawlers();
    }
    if (!easylawCrawler) {
      res.status(503).json({ error: 'EasyLaw crawler not available' });
      return;
    }

    const { topic_id } = req.body;
    if (!topic_id) {
      res.status(400).json({ error: 'topic_id is required' });
      return;
    }

    const content = await easylawCrawler.getTopicContent(topic_id);
    if (!content) {
      res.json({ status: 'NOT_FOUND', topic_id });
      return;
    }

    res.json({
      status: 'OK',
      topic_id,
      content,
      source: 'easylaw.go.kr',
    });
  } catch (error) {
    console.error('get_easylaw_topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: get_easylaw_qna (생활법령 백문백답)
 */
app.post('/tools/get_easylaw_qna', async (req: Request, res: Response) => {
  try {
    if (!easylawCrawler) {
      await loadCrawlers();
    }
    if (!easylawCrawler) {
      res.status(503).json({ error: 'EasyLaw crawler not available' });
      return;
    }

    const { page = 1, limit = 20 } = req.body;

    const qnaList = await easylawCrawler.getQnAList(page, limit);
    res.json({
      status: 'OK',
      page,
      count: qnaList.length,
      results: qnaList,
      source: 'easylaw.go.kr',
    });
  } catch (error) {
    console.error('get_easylaw_qna error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_court_precedents (판례 검색)
 * 대법원 판례 검색
 */
app.post('/tools/search_court_precedents', async (req: Request, res: Response) => {
  try {
    if (!scourtCrawler) {
      await loadCrawlers();
    }
    if (!scourtCrawler) {
      res.status(503).json({ error: 'SCourt crawler not available' });
      return;
    }

    const { query, page = 1, limit = 20, case_type, start_date, end_date } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const results = await scourtCrawler.searchPrecedents(query, {
      page,
      pageSize: limit,
      caseType: case_type,
      startDate: start_date,
      endDate: end_date,
    });

    res.json({
      status: 'OK',
      query,
      total_count: results.totalCount,
      page: results.page,
      count: results.precedents.length,
      results: results.precedents,
      source: 'law.go.kr/prec',
    });
  } catch (error) {
    console.error('search_court_precedents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: get_court_precedent_detail (판례 상세 조회)
 */
app.post('/tools/get_court_precedent_detail', async (req: Request, res: Response) => {
  try {
    if (!scourtCrawler) {
      await loadCrawlers();
    }
    if (!scourtCrawler) {
      res.status(503).json({ error: 'SCourt crawler not available' });
      return;
    }

    const { case_no } = req.body;
    if (!case_no) {
      res.status(400).json({ error: 'case_no is required' });
      return;
    }

    const detail = await scourtCrawler.getPrecedentDetail(case_no);
    if (!detail) {
      res.json({ status: 'NOT_FOUND', case_no });
      return;
    }

    res.json({
      status: 'OK',
      case_no,
      detail,
      source: 'law.go.kr/prec',
    });
  } catch (error) {
    console.error('get_court_precedent_detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Tool: search_precedents_by_law (법률별 판례 검색)
 */
app.post('/tools/search_precedents_by_law', async (req: Request, res: Response) => {
  try {
    if (!scourtCrawler) {
      await loadCrawlers();
    }
    if (!scourtCrawler) {
      res.status(503).json({ error: 'SCourt crawler not available' });
      return;
    }

    const { law_name, limit = 20 } = req.body;
    if (!law_name) {
      res.status(400).json({ error: 'law_name is required' });
      return;
    }

    const results = await scourtCrawler.searchByLawName(law_name, limit);
    res.json({
      status: 'OK',
      law_name,
      count: results.length,
      results,
      source: 'law.go.kr/prec',
    });
  } catch (error) {
    console.error('search_precedents_by_law error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// 🆕 자치법규(조례) ES 검색 도구 (Phase E — 2026-04-07)
// ============================================
//
// docs/todo/09-ordinance-elasticsearch-indexing.md §5 MCP 도구 인터페이스
//
// 5개 도구:
//   POST /tools/search_ordinances
//   POST /tools/get_ordinance_text
//   POST /tools/get_ordinance_article
//   POST /tools/compare_ordinances_across_municipalities
//   POST /tools/list_municipalities
//
// ES `ordinances_v1` 인덱스 사용. BM25 + KNN + RRF 하이브리드 검색.
// 엔드포인트 요구 env: ELASTICSEARCH_ADDR, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD

let ordinanceEs: any = null;
let ordinanceTools: any = null;

async function loadOrdinanceTools() {
  if (ordinanceTools) return ordinanceTools;
  try {
    const mod = await import('korea-law');
    const { ElasticsearchClient, configFromEnv } = mod as any;
    ordinanceEs = new ElasticsearchClient(configFromEnv());
    ordinanceTools = {
      searchOrdinances: (mod as any).searchOrdinances,
      getOrdinanceText: (mod as any).getOrdinanceText,
      getOrdinanceArticle: (mod as any).getOrdinanceArticle,
      compareOrdinancesAcrossMunicipalities: (mod as any).compareOrdinancesAcrossMunicipalities,
      listMunicipalities: (mod as any).listMunicipalities,
    };
    console.log('✅ Ordinance tools loaded (ES ordinances_v1)');
    return ordinanceTools;
  } catch (e) {
    console.warn('⚠️ Ordinance tools unavailable:', (e as Error).message);
    return null;
  }
}

app.post('/tools/search_ordinances', async (req: Request, res: Response) => {
  try {
    const tools = await loadOrdinanceTools();
    if (!tools) {
      res.status(503).json({ status: 'ERROR', message: 'Ordinance tools unavailable (ES config missing?)' });
      return;
    }
    const result = await tools.searchOrdinances(req.body, ordinanceEs);
    res.json(result);
  } catch (e) {
    console.error('search_ordinances error:', e);
    res.status(500).json({ status: 'ERROR', message: (e as Error).message });
  }
});

app.post('/tools/get_ordinance_text', async (req: Request, res: Response) => {
  try {
    const tools = await loadOrdinanceTools();
    if (!tools) {
      res.status(503).json({ status: 'ERROR', message: 'Ordinance tools unavailable' });
      return;
    }
    const result = await tools.getOrdinanceText(req.body, ordinanceEs);
    res.json(result);
  } catch (e) {
    console.error('get_ordinance_text error:', e);
    res.status(500).json({ status: 'ERROR', message: (e as Error).message });
  }
});

app.post('/tools/get_ordinance_article', async (req: Request, res: Response) => {
  try {
    const tools = await loadOrdinanceTools();
    if (!tools) {
      res.status(503).json({ status: 'ERROR', message: 'Ordinance tools unavailable' });
      return;
    }
    const result = await tools.getOrdinanceArticle(req.body, ordinanceEs);
    res.json(result);
  } catch (e) {
    console.error('get_ordinance_article error:', e);
    res.status(500).json({ status: 'ERROR', message: (e as Error).message });
  }
});

app.post('/tools/compare_ordinances_across_municipalities', async (req: Request, res: Response) => {
  try {
    const tools = await loadOrdinanceTools();
    if (!tools) {
      res.status(503).json({ status: 'ERROR', message: 'Ordinance tools unavailable' });
      return;
    }
    const result = await tools.compareOrdinancesAcrossMunicipalities(req.body, ordinanceEs);
    res.json(result);
  } catch (e) {
    console.error('compare_ordinances error:', e);
    res.status(500).json({ status: 'ERROR', message: (e as Error).message });
  }
});

app.post('/tools/list_municipalities', async (req: Request, res: Response) => {
  try {
    const tools = await loadOrdinanceTools();
    if (!tools) {
      res.status(503).json({ status: 'ERROR', message: 'Ordinance tools unavailable' });
      return;
    }
    const result = tools.listMunicipalities(req.body);
    res.json(result);
  } catch (e) {
    console.error('list_municipalities error:', e);
    res.status(500).json({ status: 'ERROR', message: (e as Error).message });
  }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function main() {
  try {
    initStore();
    console.log(`Database initialized (mode=${USE_SUPABASE ? 'supabase' : 'sqlite'})`);

    // 하이브리드 핸들러 로드
    const handlers = await loadHybridHandlers();
    console.log(`Hybrid engine: ${handlers ? '✅ available' : '❌ not available'}`);

    // 네이티브 도구 로드
    const nativeHandlers = await loadNativeTools();
    const nativeCount = Object.keys(nativeHandlers).length;
    console.log(`Native tools: ${nativeCount > 0 ? `✅ ${nativeCount} tools available` : '❌ not available'}`);

    app.listen(PORT, HOST, () => {
      console.log(`Korea Law MCP Server running at http://${HOST}:${PORT}`);
      console.log('Available endpoints:');
      console.log('  GET  /health');
      console.log('  GET  /');
      console.log('  POST /tools/audit_statute');
      console.log('  POST /tools/search_similar_articles');
      console.log('  POST /tools/search_across_laws');
      console.log('  POST /tools/check_enforcement_date');
      console.log('  POST /tools/verify_case_exists');
      console.log('  POST /tools/get_daily_diff');
      console.log('  POST /tools/audit_contract_timeline');
      console.log('  POST /tools/check_legal_definition');
      console.log('  POST /tools/search_construction_standards');
      console.log('  POST /tools/get_standard_details');
      console.log('  🆕 Hybrid Engine Tools:');
      console.log('  POST /tools/hybrid_query');
      console.log('  POST /tools/temporal_search');
      console.log('  POST /tools/compare_amendment');
      console.log('  POST /tools/get_law_timeline');
      console.log('  POST /tools/get_cache_status');
      console.log('  🆕 Extended Legal Data APIs:');
      console.log('  POST /tools/search_legal_interpretations');
      console.log('  POST /tools/get_legal_interpretation_detail');
      console.log('  POST /tools/search_constitutional_decisions');
      console.log('  POST /tools/get_constitutional_decision_detail');
      console.log('  POST /tools/search_admin_appeals');
      console.log('  POST /tools/get_admin_appeal_detail');
      console.log('  POST /tools/search_committee_decisions');
      console.log('  POST /tools/search_ministry_interpretations');
      console.log('  POST /tools/search_tribunal_decisions');
      console.log('  POST /tools/search_legal_terms');
      console.log('  🆕 Phase 2: Precedent Search APIs:');
      console.log('  POST /tools/search_precedents_by_title');
      console.log('  POST /tools/search_precedents_fulltext');
      console.log('  POST /tools/search_precedents');
      console.log('  POST /tools/get_precedent');
      console.log('  POST /tools/search_tax_precedents');
      console.log('  POST /tools/search_accident_precedents');
      console.log('  POST /tools/search_precedents_advanced');
      console.log('  🆕 Additional Data Sources (Crawlers):');
      console.log('  POST /tools/search_easylaw');
      console.log('  POST /tools/get_easylaw_topic');
      console.log('  POST /tools/get_easylaw_qna');
      console.log('  POST /tools/search_court_precedents');
      console.log('  POST /tools/get_court_precedent_detail');
      console.log('  POST /tools/search_precedents_by_law');
      console.log('  🆕 Native Tools (@markdown-media/core):');
      console.log('  POST /tools/parse_annex');
      console.log('  POST /tools/parse_date');
      console.log('  POST /tools/create_chain_plan');
      console.log('  POST /tools/aggregate_chain_results');
    });

    // 크롤러 초기화
    loadCrawlers().catch(console.error);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
