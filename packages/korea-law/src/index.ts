/**
 * korea-law: Main Entry Point
 *
 * AI Legal Auditor - 한국 법률 검증 MCP 서버
 *
 * ⚠️ 중요: 이 패키지는 AI의 법률 인용을 "검증"하기 위한 도구입니다.
 * - DB에 저장된 데이터는 AI 검증용 기준값입니다.
 * - 법적 효력의 최종 판단은 국가법령정보센터(law.go.kr)를 참조하세요.
 *
 * @packageDocumentation
 */

// 환경 변수 로드
import 'dotenv/config';

// DB 모듈 (SQLite) - 기본 DB
import * as sqlite from './db/database';
export { sqlite };
export {
  initDatabase,
  getDatabase,
  closeDatabase,
  upsertLaw,
  upsertArticle,
  insertDiffLog,
  findLawByName,
  findArticle,
  getTodayDiffs,
  getFutureChanges,
  verifyPrecedentExists,
} from './db/database';

// DB 모듈 (Supabase) - 클라우드 DB
import * as supabase from './db/supabase';
export { supabase };

// === API 모듈 (네임스페이스 방식) ===
// 각 모듈에서 중복되는 export가 있어 네임스페이스로 분리

// 기본 법령 API (law-api)
import * as lawApi from './api/law-api';
export { lawApi };
// 주요 함수만 명시적 export
export {
  searchLaws,
  getLawDetail,
  searchPrecedents as searchPrecedentsBasic,
  getPrecedentDetail as getPrecedentDetailBasic,
  verifyPrecedentExistsOnline,
  apiClient,
  xmlParser,
} from './api/law-api';

// 확장 API (행정규칙, 자치법규, 헌재결정, 법령해석, 행정심판)
import * as extendedApi from './api/extended-api';
export { extendedApi };

// 종합 API (191개 API 전체 지원)
import * as comprehensiveApi from './api/comprehensive-api';
export { comprehensiveApi };

// 판례/해석례 전문 API
import * as precedentApi from './api/precedent-api';
export { precedentApi };
// 주요 함수 명시적 export (다른 모듈과 충돌 방지를 위해 별칭 사용)
export {
  searchPrecedents,
  getPrecedentDetail,
  verifyPrecedentExists as verifyPrecedentExistsApi,
} from './api/precedent-api';

// Sync 모듈 - Dynamic import to avoid module resolution issues
// Use: const { runDailySync } = await import('korea-law/sync/daily-sync');
// export { runFullSync as runDailySync, scheduleDailySync } from './sync/daily-sync';
// export { runPrecedentSync } from './sync/precedent-sync';
// export { runTermExtraction } from './sync/term-extractor';

// Full Sync v2 - Dynamic import to avoid module resolution issues
// Use: const sync = await import('korea-law/sync/full-sync');
// export { runFullSync, syncLaws, syncPrecedents, ... } from './sync/full-sync';

// Comprehensive Sync (191개 API 4-Phase 동기화)
// Use: const { runComprehensiveSync } = await import('korea-law/sync/comprehensive-sync');
export { runComprehensiveSync, syncSpecificLaw, syncSpecificPrecedent } from './sync/comprehensive-sync';

// MCP 서버
export { startMcpServer } from './mcp/server';

// Hybrid 엔진 - Dynamic import to avoid module resolution issues
// Use: const hybrid = await import('korea-law/hybrid');
// export * from './hybrid';

// 법령명 정규화 모듈 (약어 처리)
import * as lawNameNormalizer from './normalize/law-name-normalizer';
export { lawNameNormalizer };
export {
  normalizeLawName,
  normalize as normalizeLawNameSimple,
  searchPossibleLawNames,
  findAbbreviations,
  getAbbreviationStats,
} from './normalize/law-name-normalizer';

// 괄호 파싱 모듈 (법조문 가독성 향상)
import * as bracketParser from './utils/bracket-parser';
export { bracketParser };
export {
  parseBrackets,
  simplifyText,
  getBracketStats,
  filterBracketsByType,
  extractReferencedArticles,
  BRACKET_HIGHLIGHT_CSS,
} from './utils/bracket-parser';

// 자치법규(조례) ES 검색 도구 (Phase E — 2026-04-07)
export {
  searchOrdinances,
  getOrdinanceText,
  getOrdinanceArticle,
  compareOrdinancesAcrossMunicipalities,
  listMunicipalities,
  ORDINANCES_INDEX,
} from './tools/ordinance-tools';
export type {
  SearchOrdinancesParams,
  SearchOrdinancesResult,
  GetOrdinanceTextParams,
  GetOrdinanceTextResult,
  GetOrdinanceArticleParams,
  GetOrdinanceArticleResult,
  CompareOrdinancesParams,
  CompareOrdinancesResult,
  ListMunicipalitiesParams,
  ListMunicipalitiesResult,
  MunicipalityEntry,
  OrdinanceHit,
} from './tools/ordinance-tools';
export { ElasticsearchClient, configFromEnv } from './es/client';
export type { ElasticsearchConfig } from './es/client';
export { isEmbedderAlive } from './embedding/ordinance-embedder';

// 버전 정보
export const VERSION = '1.2.0';
export const PACKAGE_NAME = 'korea-law';

// 타입 export
export type { LawRecord, ArticleRecord, DiffRecord } from './db/database';

// 기본 실행 (MCP 서버)
import { startMcpServer } from './mcp/server';

if (require.main === module) {
  startMcpServer().catch(console.error);
}
