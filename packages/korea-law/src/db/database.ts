/**
 * korea-law: Database Module
 * 
 * ⚠️ 중요: 이 DB는 "검증용(Verification)" 목적입니다.
 * AI가 생성한 법률 인용의 정확성을 검증하기 위한 기준 데이터입니다.
 * 법적 효력의 최종 판단은 국가법령정보센터(law.go.kr)를 참조하세요.
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const DB_PATH = process.env.KOREA_LAW_DB_PATH || path.join(__dirname, '../../data/korea-law.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SCHEMA_HYBRID_PATH = path.join(__dirname, 'schema-hybrid.sql');
const SCHEMA_EXTENDED_PATH = path.join(__dirname, 'schema-extended.sql');
const SCHEMA_KRX_PATH = path.join(__dirname, 'schema-krx.sql');

let db: Database.Database | null = null;

/**
 * DB 초기화 및 연결
 */
export function initDatabase(): Database.Database {
  if (db) return db;

  // 데이터 디렉토리 생성
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 스키마 적용
  if (fs.existsSync(SCHEMA_PATH)) {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  }

  // 하이브리드 스키마 적용 (존재 시)
  if (fs.existsSync(SCHEMA_HYBRID_PATH)) {
    try {
      const hybridSchema = fs.readFileSync(SCHEMA_HYBRID_PATH, 'utf-8');
      db.exec(hybridSchema);
    } catch (e) {
      console.warn(`⚠️  Failed to apply hybrid schema: ${e}`);
    }
  }

  // 확장 스키마 적용 (191개 API 지원용)
  if (fs.existsSync(SCHEMA_EXTENDED_PATH)) {
    try {
      const extendedSchema = fs.readFileSync(SCHEMA_EXTENDED_PATH, 'utf-8');
      db.exec(extendedSchema);
    } catch (e) {
      console.warn(`⚠️  Failed to apply extended schema: ${e}`);
    }
  }

  // KRX 규정 스키마 적용
  if (fs.existsSync(SCHEMA_KRX_PATH)) {
    try {
      const krxSchema = fs.readFileSync(SCHEMA_KRX_PATH, 'utf-8');
      db.exec(krxSchema);
    } catch (e) {
      console.warn(`⚠️  Failed to apply KRX schema: ${e}`);
    }
  }

  console.log(`✅ Database initialized: ${DB_PATH}`);
  console.log('⚠️  주의: 이 DB는 AI 검증용입니다. 법적 판단의 최종 근거로 사용하지 마세요.');
  
  return db;
}

/**
 * DB 연결 가져오기
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * DB 연결 종료
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================
// 법령 관련 함수
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
}

export interface ArticleRecord {
  id?: number;
  law_id: number;
  article_no: string;
  article_no_normalized?: string;
  article_title?: string;
  content: string;
  paragraph_count?: number;
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

export interface SyncMetadataRecord {
  sync_type: 'FULL' | 'INCREMENTAL' | 'DIFF';
  started_at: string;
  completed_at?: string;
  status?: 'RUNNING' | 'SUCCESS' | 'FAILED';
  laws_added?: number;
  laws_updated?: number;
  articles_added?: number;
  articles_updated?: number;
  diffs_detected?: number;
  error_message?: string;
  source_data_date?: string;
}

/**
 * 법령 추가/업데이트
 */
export function upsertLaw(law: LawRecord): number {
  const db = getDatabase();
  const normalized = normalizeLawName(law.law_name);
  const checksum = generateChecksum(JSON.stringify(law));

  const stmt = db.prepare(`
    INSERT INTO Laws (law_mst_id, law_name, law_name_eng, promulgation_date, enforcement_date, 
                      law_type, ministry, status, source_url, law_name_normalized, checksum, last_synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(law_mst_id) DO UPDATE SET
      law_name = excluded.law_name,
      promulgation_date = excluded.promulgation_date,
      enforcement_date = excluded.enforcement_date,
      law_type = excluded.law_type,
      ministry = excluded.ministry,
      status = excluded.status,
      source_url = excluded.source_url,
      checksum = excluded.checksum,
      last_synced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `);

  const result = stmt.run(
    law.law_mst_id,
    law.law_name,
    law.law_name_eng || null,
    law.promulgation_date,
    law.enforcement_date,
    law.law_type || null,
    law.ministry || null,
    law.status || 'ACTIVE',
    law.source_url || null,
    normalized,
    checksum
  );

  // ON CONFLICT UPDATE시 lastInsertRowid가 0이므로 SELECT로 ID 조회
  if (result.lastInsertRowid === 0 || result.changes === 1) {
    const selectStmt = db.prepare('SELECT id FROM Laws WHERE law_mst_id = ?');
    const row = selectStmt.get(law.law_mst_id) as { id: number } | undefined;
    return row?.id || 0;
  }

  return result.lastInsertRowid as number;
}

/**
 * 조문 추가/업데이트
 */
export function upsertArticle(article: ArticleRecord): number {
  const db = getDatabase();
  const normalized = normalizeArticleNo(article.article_no);
  const contentHash = generateChecksum(article.content);

  // 먼저 기존 레코드 확인
  const checkStmt = db.prepare(`
    SELECT id FROM Articles WHERE law_id = ? AND article_no = ?
  `);
  const existing = checkStmt.get(article.law_id, article.article_no) as { id: number } | undefined;

  if (existing) {
    // 업데이트
    const updateStmt = db.prepare(`
      UPDATE Articles SET
        article_no_normalized = ?,
        article_title = ?,
        content = ?,
        paragraph_count = ?,
        is_definition = ?,
        content_hash = ?,
        effective_from = ?,
        effective_until = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(
      normalized,
      article.article_title || null,
      article.content,
      article.paragraph_count || 1,
      article.is_definition ? 1 : 0,
      contentHash,
      article.effective_from || null,
      article.effective_until || null,
      existing.id
    );

    return existing.id;
  } else {
    // 신규 삽입
    const insertStmt = db.prepare(`
      INSERT INTO Articles (law_id, article_no, article_no_normalized, article_title, content,
                            paragraph_count, is_definition, content_hash, effective_from, effective_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      article.law_id,
      article.article_no,
      normalized,
      article.article_title || null,
      article.content,
      article.paragraph_count || 1,
      article.is_definition ? 1 : 0,
      contentHash,
      article.effective_from || null,
      article.effective_until || null
    );

    return result.lastInsertRowid as number;
  }
}

/**
 * 변경 이력 기록
 */
export function insertDiffLog(diff: DiffRecord): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO Diff_Logs (law_id, article_id, change_type, previous_content, current_content,
                           diff_summary, effective_from, is_critical, warning_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    diff.law_id,
    diff.article_id || null,
    diff.change_type,
    diff.previous_content || null,
    diff.current_content || null,
    diff.diff_summary || null,
    diff.effective_from || null,
    diff.is_critical ? 1 : 0,
    diff.warning_message || null
  );

  return result.lastInsertRowid as number;
}

/**
 * 동기화 메타데이터 기록
 */
export function insertSyncMetadata(metadata: SyncMetadataRecord): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO SyncMetadata (sync_type, started_at, completed_at, status, laws_added, laws_updated,
                              articles_added, articles_updated, diffs_detected, error_message, source_data_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    metadata.sync_type,
    metadata.started_at,
    metadata.completed_at || null,
    metadata.status || 'SUCCESS',
    metadata.laws_added || 0,
    metadata.laws_updated || 0,
    metadata.articles_added || 0,
    metadata.articles_updated || 0,
    metadata.diffs_detected || 0,
    metadata.error_message || null,
    metadata.source_data_date || null
  );

  return result.lastInsertRowid as number;
}

/**
 * 동기화 메타데이터 업데이트
 */
export function updateSyncMetadata(
  syncId: number,
  updates: Partial<Omit<SyncMetadataRecord, 'sync_type' | 'started_at'>>
): void {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE SyncMetadata SET
      completed_at = COALESCE(?, completed_at),
      status = COALESCE(?, status),
      laws_added = COALESCE(?, laws_added),
      laws_updated = COALESCE(?, laws_updated),
      articles_added = COALESCE(?, articles_added),
      articles_updated = COALESCE(?, articles_updated),
      diffs_detected = COALESCE(?, diffs_detected),
      error_message = COALESCE(?, error_message),
      source_data_date = COALESCE(?, source_data_date)
    WHERE id = ?
  `);

  stmt.run(
    updates.completed_at || null,
    updates.status || null,
    updates.laws_added !== undefined ? updates.laws_added : null,
    updates.laws_updated !== undefined ? updates.laws_updated : null,
    updates.articles_added !== undefined ? updates.articles_added : null,
    updates.articles_updated !== undefined ? updates.articles_updated : null,
    updates.diffs_detected !== undefined ? updates.diffs_detected : null,
    updates.error_message || null,
    updates.source_data_date || null,
    syncId
  );
}

// ============================================
// 검색/조회 함수 (MCP Tools에서 사용)
// ============================================

/**
 * 법령명으로 검색 (현행 기준)
 * 정확한 매칭을 우선하고, 없으면 부분 매칭 시도
 */
export function findLawByName(lawName: string, targetDate?: string): LawRecord | null {
  const db = getDatabase();
  const normalized = normalizeLawName(lawName);
  const date = targetDate || new Date().toISOString().split('T')[0];

  // 1. 정확한 매칭 우선 시도
  const exactStmt = db.prepare(`
    SELECT * FROM Laws
    WHERE (law_name = ? OR law_name_normalized = ?)
    AND enforcement_date <= ?
    AND status = 'ACTIVE'
    ORDER BY enforcement_date DESC
    LIMIT 1
  `);

  const exactMatch = exactStmt.get(lawName, normalized, date) as LawRecord | null;
  if (exactMatch) return exactMatch;

  // 2. 부분 매칭 (정확한 매칭이 없을 때만)
  const likeStmt = db.prepare(`
    SELECT * FROM Laws
    WHERE law_name_normalized LIKE ?
    AND enforcement_date <= ?
    AND status = 'ACTIVE'
    ORDER BY LENGTH(law_name) ASC, enforcement_date DESC
    LIMIT 1
  `);

  return likeStmt.get(`%${normalized}%`, date) as LawRecord | null;
}

/**
 * 법령명과 타입으로 검색
 */
export function findLawByNameAndType(lawName: string, lawType: string): LawRecord | null {
  const db = getDatabase();
  const normalized = normalizeLawName(lawName);

  const stmt = db.prepare(`
    SELECT * FROM Laws
    WHERE law_name = ?
    AND law_type = ?
    LIMIT 1
  `);

  return stmt.get(lawName, lawType) as LawRecord | null;
}

/**
 * 법령 추가 (별칭)
 */
export function insertLaw(law: LawRecord): number {
  return upsertLaw(law);
}

/**
 * 특정 조문 조회 (여러 패턴으로 검색)
 * "제750조", "750", "750조" 등 다양한 입력을 처리
 */
export function findArticle(lawId: number, articleNo: string): ArticleRecord | null {
  const db = getDatabase();
  const variants = getArticleNoVariants(articleNo);
  const normalized = normalizeArticleNo(articleNo);

  // 1. 먼저 정확한 매칭 시도 (모든 변형에 대해)
  const exactStmt = db.prepare(`
    SELECT * FROM Articles
    WHERE law_id = ?
    AND article_no = ?
    AND (effective_until IS NULL OR effective_until > DATE('now'))
    ORDER BY effective_from DESC
    LIMIT 1
  `);

  for (const variant of variants) {
    const result = exactStmt.get(lawId, variant) as ArticleRecord | null;
    if (result) {
      return result;
    }
  }

  // 2. article_no_normalized 필드로 검색 (NULL이 아닌 경우)
  const normalizedStmt = db.prepare(`
    SELECT * FROM Articles
    WHERE law_id = ?
    AND article_no_normalized = ?
    AND (effective_until IS NULL OR effective_until > DATE('now'))
    ORDER BY effective_from DESC
    LIMIT 1
  `);

  const normalizedResult = normalizedStmt.get(lawId, normalized) as ArticleRecord | null;
  if (normalizedResult) {
    return normalizedResult;
  }

  // 3. LIKE 검색으로 폴백 (가지조문이 아닌 경우만)
  // "382"를 검색할 때 "382의2"가 매칭되지 않도록 주의
  const numbersOnly = articleNo.replace(/[^0-9]/g, '');
  if (numbersOnly && !articleNo.includes('의')) {
    const likeStmt = db.prepare(`
      SELECT * FROM Articles
      WHERE law_id = ?
      AND article_no = ?
      AND (effective_until IS NULL OR effective_until > DATE('now'))
      ORDER BY effective_from DESC
      LIMIT 1
    `);

    const likeResult = likeStmt.get(lawId, numbersOnly) as ArticleRecord | null;
    if (likeResult) {
      return likeResult;
    }
  }

  return null;
}

/**
 * 오늘의 변경 사항 조회
 */
export function getTodayDiffs(): any[] {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT 
      d.*,
      l.law_name,
      a.article_no,
      a.article_title
    FROM Diff_Logs d
    JOIN Laws l ON d.law_id = l.id
    LEFT JOIN Articles a ON d.article_id = a.id
    WHERE d.detected_at = DATE('now')
    ORDER BY d.is_critical DESC, d.created_at DESC
  `);

  return stmt.all();
}

/**
 * 기간 내 변경 예정 법령 조회
 */
export function getFutureChanges(startDate: string, endDate: string): any[] {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT 
      d.*,
      l.law_name,
      a.article_no,
      a.article_title
    FROM Diff_Logs d
    JOIN Laws l ON d.law_id = l.id
    LEFT JOIN Articles a ON d.article_id = a.id
    WHERE d.effective_from BETWEEN ? AND ?
    ORDER BY d.effective_from ASC
  `);

  return stmt.all(startDate, endDate);
}

/**
 * 판례 존재 여부 확인
 */
export function verifyPrecedentExists(caseId: string): boolean {
  const db = getDatabase();
  const normalized = normalizeCaseId(caseId);

  const stmt = db.prepare(`
    SELECT 1 FROM Precedents
    WHERE case_id = ? OR case_id_normalized = ?
    LIMIT 1
  `);

  const result = stmt.get(caseId, normalized);
  return !!result;
}

/**
 * 판례 전문 업데이트
 */
export function updatePrecedentFullText(
  caseId: string,
  data: {
    precedent_serial_number?: number;
    summary?: string;
    key_points?: string;
    full_text?: string;
    referenced_statutes?: string;
    referenced_cases?: string;
  }
): void {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE Precedents
    SET
      precedent_serial_number = COALESCE(?, precedent_serial_number),
      summary = COALESCE(?, summary),
      key_points = COALESCE(?, key_points),
      full_text = COALESCE(?, full_text),
      referenced_statutes = COALESCE(?, referenced_statutes),
      referenced_cases = COALESCE(?, referenced_cases),
      full_text_synced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE case_id = ?
  `);

  stmt.run(
    data.precedent_serial_number || null,
    data.summary || null,
    data.key_points || null,
    data.full_text || null,
    data.referenced_statutes || null,
    data.referenced_cases || null,
    caseId
  );
}

/**
 * 전문이 없는 판례 목록 조회 (동기화 대상)
 */
export function getPrecedentsWithoutFullText(
  limit: number = 100,
  priority?: 'high' | 'medium' | 'low'
): any[] {
  const db = getDatabase();

  let query = `
    SELECT * FROM Precedents
    WHERE full_text IS NULL
      AND precedent_serial_number IS NOT NULL
  `;

  if (priority) {
    query += ` AND sync_priority = ?`;
  }

  query += ` ORDER BY decision_date DESC LIMIT ?`;

  const stmt = db.prepare(query);

  if (priority) {
    return stmt.all(priority, limit);
  } else {
    return stmt.all(limit);
  }
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
function normalizeArticleNo(articleNo: string | number): string {
  const str = String(articleNo || '');
  return str
    .replace(/제/g, '')
    .replace(/조의/g, '의')   // "조의" → "의" (DB 형식과 일치, "-" 아님!)
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

  // 역방향: "25" → "제25조" (숫자만 있는 경우)
  if (/^\d+$/.test(str)) {
    variants.push(`제${str}조`);
  }
  // 역방향: "25의2" → "제25조의2"
  if (/^\d+의\d+$/.test(str)) {
    const [main, sub] = str.split('의');
    variants.push(`제${main}조의${sub}`);
  }

  // 중복 제거
  return [...new Set(variants.filter(v => v.length > 0))];
}

function normalizeCaseId(caseId: string): string {
  // "2023다12345" → "2023다12345" (공백/특수문자 제거)
  return caseId.replace(/\s+/g, '').replace(/[^\w가-힣]/g, '');
}

function generateChecksum(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

// ============================================
// 새로운 검증 기능 함수 (MCP Tools v2)
// ============================================

/**
 * Levenshtein Distance 계산 (편집 거리)
 * 두 문자열이 얼마나 다른지 측정
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 삭제
          dp[i][j - 1] + 1,     // 삽입
          dp[i - 1][j - 1] + 1  // 대체
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * 텍스트 유사도 계산 (0~1, 1이 완전 일치)
 */
export function calculateTextSimilarity(str1: string, str2: string): number {
  // 공백/특수문자 정규화
  const s1 = str1.replace(/\s+/g, ' ').trim();
  const s2 = str2.replace(/\s+/g, ' ').trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLen);
}

/**
 * 인용문 팩트체크 - DB에서 조문 조회 후 비교
 */
export function checkCitation(
  lawName: string, 
  articleNo: string, 
  quotedText?: string
): {
  found: boolean;
  law?: LawRecord;
  article?: ArticleRecord;
  similarity?: number;
  matchStatus?: 'EXACT' | 'PARTIAL' | 'MISMATCH' | 'NOT_FOUND';
} {
  const db = getDatabase();
  
  // 1. 법령 찾기
  const law = findLawByName(lawName);
  if (!law) {
    return { found: false, matchStatus: 'NOT_FOUND' };
  }
  
  // 2. 조문 찾기
  const article = findArticle(law.id!, articleNo);
  if (!article) {
    return { found: false, law, matchStatus: 'NOT_FOUND' };
  }
  
  // 3. 인용문 비교 (quotedText가 있는 경우)
  if (quotedText) {
    const similarity = calculateTextSimilarity(quotedText, article.content);
    let matchStatus: 'EXACT' | 'PARTIAL' | 'MISMATCH';
    
    if (similarity >= 0.95) {
      matchStatus = 'EXACT';
    } else if (similarity >= 0.7) {
      matchStatus = 'PARTIAL';
    } else {
      matchStatus = 'MISMATCH';
    }
    
    // 검증 로그 저장
    logCitation(lawName, articleNo, quotedText, article.content, similarity, matchStatus, law.id!, article.id!);
    
    return { found: true, law, article, similarity, matchStatus };
  }
  
  return { found: true, law, article };
}

/**
 * 인용 검증 로그 저장
 */
function logCitation(
  lawName: string,
  articleNo: string,
  quotedText: string,
  actualText: string,
  similarity: number,
  matchStatus: string,
  lawId: number,
  articleId: number
): void {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO Citation_Logs (law_name, article_no, quoted_text, actual_text, 
                                  similarity_score, match_status, law_id, article_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(lawName, articleNo, quotedText, actualText, similarity, matchStatus, lawId, articleId);
  } catch (e) {
    // 테이블이 없을 수 있으므로 무시
  }
}

/**
 * 조문 내 교차 참조 추출 (정규식)
 * "제5조", "같은 법 제10조", "민법 제750조" 등 패턴 추출
 */
export function extractReferences(content: string): {
  internalRefs: string[];  // 같은 법 내 참조 (제N조)
  externalRefs: { lawName: string; articleNo: string }[];  // 다른 법령 참조
} {
  const internalRefs: string[] = [];
  const externalRefs: { lawName: string; articleNo: string }[] = [];
  
  // 패턴 1: 단순 조문 참조 (제N조, 제N조의N, 제N조제N항)
  const internalPattern = /제(\d+)조(의\d+)?(?:제\d+항)?(?:제\d+호)?/g;
  let match;
  while ((match = internalPattern.exec(content)) !== null) {
    internalRefs.push(match[0]);
  }
  
  // 패턴 2: 외부 법령 참조 (「법령명」 제N조, 법령명 제N조)
  const externalPattern = /(?:「([^」]+)」|([가-힣]+(?:법|령|규칙)))\s*제(\d+)(조(?:의\d+)?)/g;
  while ((match = externalPattern.exec(content)) !== null) {
    const lawName = match[1] || match[2];
    const articleNo = `제${match[3]}${match[4]}`;
    if (lawName) {
      externalRefs.push({ lawName, articleNo });
    }
  }
  
  // 중복 제거
  return {
    internalRefs: [...new Set(internalRefs)],
    externalRefs: externalRefs.filter((v, i, a) => 
      a.findIndex(t => t.lawName === v.lawName && t.articleNo === v.articleNo) === i
    ),
  };
}

/**
 * 법령 내 모든 교차 참조 검증
 */
export function validateLawReferences(lawId: number): {
  totalRefs: number;
  validRefs: number;
  brokenRefs: { articleNo: string; reference: string; type: 'internal' | 'external' }[];
  externalRefs: { articleNo: string; lawName: string; reference: string }[];
} {
  const db = getDatabase();
  
  // 해당 법령의 모든 조문 가져오기
  const articlesStmt = db.prepare('SELECT * FROM Articles WHERE law_id = ?');
  const articles = articlesStmt.all(lawId) as ArticleRecord[];
  
  const brokenRefs: { articleNo: string; reference: string; type: 'internal' | 'external' }[] = [];
  const externalRefs: { articleNo: string; lawName: string; reference: string }[] = [];
  let totalRefs = 0;
  let validRefs = 0;
  
  // 현재 법령의 모든 조문번호 세트
  const existingArticles = new Set(
    articles.map(a => normalizeArticleNo(a.article_no))
  );
  
  for (const article of articles) {
    const refs = extractReferences(article.content);
    
    // 내부 참조 검증
    for (const ref of refs.internalRefs) {
      totalRefs++;
      const normalizedRef = normalizeArticleNo(ref);
      
      if (existingArticles.has(normalizedRef)) {
        validRefs++;
      } else {
        brokenRefs.push({
          articleNo: article.article_no,
          reference: ref,
          type: 'internal',
        });
      }
    }
    
    // 외부 참조 기록 (검증은 별도)
    for (const extRef of refs.externalRefs) {
      totalRefs++;
      externalRefs.push({
        articleNo: article.article_no,
        lawName: extRef.lawName,
        reference: extRef.articleNo,
      });
      
      // 외부 법령 존재 여부 확인
      const extLaw = findLawByName(extRef.lawName);
      if (extLaw) {
        const extArticle = findArticle(extLaw.id!, extRef.articleNo);
        if (extArticle) {
          validRefs++;
        } else {
          brokenRefs.push({
            articleNo: article.article_no,
            reference: `${extRef.lawName} ${extRef.articleNo}`,
            type: 'external',
          });
        }
      } else {
        // 외부 법령이 DB에 없으면 일단 valid로 처리 (검증 불가)
        validRefs++;
      }
    }
  }
  
  return { totalRefs, validRefs, brokenRefs, externalRefs };
}

/**
 * FTS 기반 관련 조문 검색
 */
export function searchArticlesFTS(
  query: string, 
  limit: number = 20
): {
  lawId: number;
  lawName: string;
  articleNo: string;
  articleTitle: string | null;
  content: string;
  snippet: string;
  rank: number;
}[] {
  const db = getDatabase();
  
  try {
    // FTS5 검색 쿼리
    const stmt = db.prepare(`
      SELECT 
        a.law_id,
        l.law_name,
        a.article_no,
        a.article_title,
        a.content,
        snippet(Articles_FTS, 2, '<mark>', '</mark>', '...', 64) as snippet,
        rank
      FROM Articles_FTS
      JOIN Articles a ON Articles_FTS.rowid = a.id
      JOIN Laws l ON a.law_id = l.id
      WHERE Articles_FTS MATCH ?
      ORDER BY rank
      LIMIT ?
    `);
    
    return stmt.all(query, limit) as any[];
  } catch (e) {
    // FTS 테이블이 없거나 빈 경우 LIKE 검색으로 폴백
    const stmt = db.prepare(`
      SELECT 
        a.law_id,
        l.law_name,
        a.article_no,
        a.article_title,
        a.content,
        a.content as snippet,
        0 as rank
      FROM Articles a
      JOIN Laws l ON a.law_id = l.id
      WHERE a.content LIKE ? OR a.article_title LIKE ?
      LIMIT ?
    `);
    
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm, limit) as any[];
  }
}

/**
 * 키워드 기반 관련 법령 검색 (시나리오 검토용)
 */
export function findRelatedArticles(
  keywords: string[], 
  limit: number = 30
): {
  lawName: string;
  articleNo: string;
  articleTitle: string | null;
  content: string;
  relevanceScore: number;
}[] {
  const db = getDatabase();
  const results: Map<number, { 
    lawName: string; 
    articleNo: string; 
    articleTitle: string | null; 
    content: string; 
    score: number 
  }> = new Map();
  
  // 각 키워드로 검색하여 점수 누적
  for (const keyword of keywords) {
    try {
      const ftsResults = searchArticlesFTS(keyword, 50);
      for (const r of ftsResults) {
        const key = `${r.lawId}-${r.articleNo}`;
        const existing = results.get(r.lawId);
        if (existing) {
          existing.score += 1;
        } else {
          results.set(r.lawId, {
            lawName: r.lawName,
            articleNo: r.articleNo,
            articleTitle: r.articleTitle,
            content: r.content,
            score: 1,
          });
        }
      }
    } catch (e) {
      // 검색 실패 시 무시
    }
  }
  
  // 점수 순 정렬
  const sorted = Array.from(results.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => ({
      lawName: r.lawName,
      articleNo: r.articleNo,
      articleTitle: r.articleTitle,
      content: r.content,
      relevanceScore: r.score / keywords.length,
    }));
  
  return sorted;
}

/**
 * 법령 ID로 법령 조회
 */
export function getLawById(lawId: number): LawRecord | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Laws WHERE id = ?');
  return stmt.get(lawId) as LawRecord | null;
}

/**
 * 법령의 모든 조문 조회
 */
export function getArticlesByLawId(lawId: number): ArticleRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM Articles 
    WHERE law_id = ? 
    ORDER BY CAST(article_no_normalized AS INTEGER), article_no
  `);
  return stmt.all(lawId) as ArticleRecord[];
}

/**
 * FTS 인덱스 재구축 (기존 데이터 동기화)
 */
export function rebuildFTSIndex(): void {
  const db = getDatabase();
  
  try {
    // 기존 FTS 데이터 삭제
    db.exec("DELETE FROM Articles_FTS");
    
    // 모든 Articles 데이터 FTS에 삽입
    db.exec(`
      INSERT INTO Articles_FTS(rowid, article_no, article_title, content)
      SELECT id, article_no, article_title, content FROM Articles
    `);
    
    console.log('✅ FTS index rebuilt successfully');
  } catch (e) {
    console.error('FTS index rebuild failed:', e);
  }
}

// ============================================
// Execution Logging (4-Phase Sync)
// ============================================

/**
 * Insert phase execution log
 */
export function insertExecutionLog(log: {
  run_id: string;
  phase: number;
  phase_name: string;
  start_time: Date;
  end_time?: Date;
  duration_ms?: number;
  api_calls: number;
  success_count: number;
  error_count: number;
  skipped_count: number;
  timeout_count: number;
  laws_processed?: number;
  precedents_processed?: number;
  admin_rules_processed?: number;
  local_ordinances_processed?: number;
  status: string;
  error_message?: string;
  retry_count?: number;
}): number {
  if (!db) throw new Error('Database not initialized');

  try {
    const stmt = db.prepare(`
      INSERT INTO sync_execution_log (
        run_id, phase, phase_name,
        start_time, end_time, duration_ms,
        api_calls, success_count, error_count, skipped_count, timeout_count,
        laws_processed, precedents_processed, admin_rules_processed, local_ordinances_processed,
        status, error_message, retry_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      log.run_id,
      log.phase,
      log.phase_name,
      log.start_time.toISOString(),
      log.end_time?.toISOString(),
      log.duration_ms,
      log.api_calls,
      log.success_count,
      log.error_count,
      log.skipped_count,
      log.timeout_count,
      log.laws_processed || 0,
      log.precedents_processed || 0,
      log.admin_rules_processed || 0,
      log.local_ordinances_processed || 0,
      log.status,
      log.error_message,
      log.retry_count || 0
    );

    return result.changes || 0;
  } catch (error) {
    console.error(`Failed to insert execution log: ${error}`);
    throw error;
  }
}

/**
 * Insert daily sync summary
 */
export function insertDailySyncSummary(summary: {
  sync_date: string;
  run_id: string;
  status: string;
  total_duration_ms: number;
  phases_completed: number;
  phases_failed: number;
  total_laws_synced?: number;
  total_precedents_synced?: number;
  total_admin_rules_synced?: number;
  total_local_ordinances_synced?: number;
  total_api_calls?: number;
  total_errors?: number;
  notes?: string;
}): number {
  if (!db) throw new Error('Database not initialized');

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sync_summary_daily (
        sync_date, run_id, status, total_duration_ms,
        phases_completed, phases_failed,
        total_laws_synced, total_precedents_synced,
        total_admin_rules_synced, total_local_ordinances_synced,
        total_api_calls, total_errors, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      summary.sync_date,
      summary.run_id,
      summary.status,
      summary.total_duration_ms,
      summary.phases_completed,
      summary.phases_failed,
      summary.total_laws_synced || 0,
      summary.total_precedents_synced || 0,
      summary.total_admin_rules_synced || 0,
      summary.total_local_ordinances_synced || 0,
      summary.total_api_calls || 0,
      summary.total_errors || 0,
      summary.notes
    );

    return result.changes || 0;
  } catch (error) {
    console.error(`Failed to insert daily sync summary: ${error}`);
    throw error;
  }
}

/**
 * Get recent execution logs
 */
export function getRecentExecutionLogs(runId: string): any[] {
  if (!db) throw new Error('Database not initialized');

  try {
    const stmt = db.prepare(`
      SELECT * FROM sync_execution_log
      WHERE run_id = ?
      ORDER BY phase ASC
    `);

    return stmt.all(runId) as any[];
  } catch (error) {
    console.error(`Failed to get execution logs: ${error}`);
    return [];
  }
}

/**
 * Get daily sync summary
 */
export function getDailySyncSummary(syncDate: string): any | null {
  if (!db) throw new Error('Database not initialized');

  try {
    const stmt = db.prepare(`
      SELECT * FROM sync_summary_daily
      WHERE sync_date = ?
    `);

    return stmt.get(syncDate) as any | null;
  } catch (error) {
    console.error(`Failed to get daily sync summary: ${error}`);
    return null;
  }
}

// ============================================
// PendingLawRegistry 관련 함수
// ============================================

/**
 * MST ID로 법령 조회
 */
export function findLawByMstId(mstId: string): LawRecord | null {
  if (!db) throw new Error('Database not initialized');

  try {
    const stmt = db.prepare(`
      SELECT * FROM Laws WHERE law_mst_id = ?
    `);

    return stmt.get(mstId) as LawRecord | null;
  } catch (error) {
    console.error(`Failed to find law by MST ID: ${error}`);
    return null;
  }
}

/**
 * PendingLawRegistry에서 MST ID로 조회
 */
export function findPendingLawByMstId(mstId: string): any | null {
  if (!db) throw new Error('Database not initialized');

  try {
    const stmt = db.prepare(`
      SELECT * FROM PendingLawRegistry WHERE mst_id = ?
    `);

    return stmt.get(mstId);
  } catch (error) {
    console.error(`Failed to find pending law by MST ID: ${error}`);
    return null;
  }
}

/**
 * PendingLawRegistry에 법률 등록
 */
export function insertPendingLaw(law: {
  mst_id: string;
  law_id?: string | null;
  law_name: string;
  law_type?: string;
  ministry?: string;
  promulgation_date?: string | null;
  promulgation_no?: string | null;
  effective_date: string | null;
  registration_source: string;
  registration_reason: string;
  registered_by: string;
  source_url?: string;
}): number {
  if (!db) throw new Error('Database not initialized');

  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO PendingLawRegistry (
        mst_id, law_id, law_name, law_type, ministry,
        promulgation_date, promulgation_no, effective_date,
        registration_source, registration_reason, registered_by,
        source_url, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `);

    const result = stmt.run(
      law.mst_id,
      law.law_id || null,
      law.law_name,
      law.law_type || '',
      law.ministry || '',
      law.promulgation_date || null,
      law.promulgation_no || null,
      law.effective_date,
      law.registration_source,
      law.registration_reason,
      law.registered_by,
      law.source_url || null
    );

    return result.lastInsertRowid as number;
  } catch (error) {
    console.error(`Failed to insert pending law: ${error}`);
    return -1;
  }
}

/**
 * PendingLawRegistry 상태 업데이트
 */
export function updatePendingLawStatus(
  mstId: string,
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'NOT_FOUND',
  syncedLawId: number | null,
  errorMessage?: string
): boolean {
  if (!db) throw new Error('Database not initialized');

  try {
    const stmt = db.prepare(`
      UPDATE PendingLawRegistry
      SET sync_status = ?,
          synced_law_id = ?,
          last_sync_attempt = datetime('now'),
          sync_error_message = ?
      WHERE mst_id = ?
    `);

    stmt.run(status, syncedLawId, errorMessage || null, mstId);
    return true;
  } catch (error) {
    console.error(`Failed to update pending law status: ${error}`);
    return false;
  }
}

export {
  normalizeLawName,
  normalizeArticleNo,
  normalizeCaseId,
  generateChecksum
};

