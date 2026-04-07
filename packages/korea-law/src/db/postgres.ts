/**
 * PostgreSQL Database Adapter for Render Deployment
 *
 * Render에서 PostgreSQL 사용 시 이 모듈 활성화
 * 환경변수: DATABASE_URL 또는 PG_HOST
 */

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

const PG_CONFIG = {
  host: process.env.PG_HOST || 'dpg-d5131q5actks73f0aa1g-a.singapore-postgres.render.com',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'legal_audit_db',
  user: process.env.PG_USER || 'legal_audit_db_user',
  password: process.env.PG_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
};

/**
 * PostgreSQL 사용 여부 확인
 */
export function isPostgresEnabled(): boolean {
  return !!(process.env.DATABASE_URL || process.env.PG_HOST || process.env.PG_PASSWORD);
}

/**
 * PostgreSQL Pool 초기화
 */
export function initPostgres(): Pool {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    pool = new Pool(PG_CONFIG);
  }

  console.log('✅ PostgreSQL 연결 초기화');
  return pool;
}

/**
 * PostgreSQL Pool 가져오기
 */
export function getPool(): Pool {
  if (!pool) {
    return initPostgres();
  }
  return pool;
}

/**
 * PostgreSQL 연결 종료
 */
export async function closePostgres(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ============================================
// 건설기준 검색 함수 (PostgreSQL)
// ============================================

export interface ConstructionStandard {
  id: number;
  kcsc_cd: string;
  standard_name: string;
  doc_type: string;
  main_category: string;
  middle_category: string;
  effective_date: string;
  dept: string;
  status: string;
}

export interface ConstructionRevision {
  id: number;
  standard_id: number;
  doc_year: number;
  doc_cycle: string;
  doc_er: string;
  establishment_date: string;
  revision_date: string;
  effective_from: string;
  revision_remark: string;
  doc_brief: string;
  is_latest: boolean;
}

/**
 * 건설기준 검색 (PostgreSQL)
 */
export async function searchConstructionStandards(
  query: string,
  docType: 'ALL' | 'KDS' | 'KCS' = 'ALL',
  category?: string,
  limit: number = 20
): Promise<ConstructionStandard[]> {
  const pool = getPool();
  const searchPattern = `%${query}%`;

  let sql = `
    SELECT id, kcsc_cd, standard_name, doc_type, main_category, middle_category,
           effective_date, dept, status
    FROM construction_standards
    WHERE (standard_name ILIKE $1 OR kcsc_cd ILIKE $1 OR main_category ILIKE $1 OR middle_category ILIKE $1)
  `;
  const params: any[] = [searchPattern];
  let paramIndex = 2;

  if (docType !== 'ALL') {
    sql += ` AND doc_type = $${paramIndex}`;
    params.push(docType);
    paramIndex++;
  }

  if (category) {
    sql += ` AND (main_category ILIKE $${paramIndex} OR middle_category ILIKE $${paramIndex})`;
    params.push(`%${category}%`);
    paramIndex++;
  }

  sql += ` ORDER BY doc_type, kcsc_cd LIMIT $${paramIndex}`;
  params.push(limit);

  const result = await pool.query(sql, params);
  return result.rows;
}

/**
 * 건설기준 상세 조회 (PostgreSQL)
 */
export async function getStandardDetails(
  kcscCd: string,
  includeHistory: boolean = true
): Promise<{ standard: ConstructionStandard | null; revisions: ConstructionRevision[] }> {
  const pool = getPool();

  // 기준 조회
  const standardResult = await pool.query(
    `SELECT * FROM construction_standards WHERE kcsc_cd = $1`,
    [kcscCd]
  );

  if (standardResult.rows.length === 0) {
    return { standard: null, revisions: [] };
  }

  const standard = standardResult.rows[0];
  let revisions: ConstructionRevision[] = [];

  if (includeHistory) {
    const revResult = await pool.query(
      `SELECT * FROM construction_standard_revisions
       WHERE standard_id = $1
       ORDER BY doc_year DESC, doc_order DESC`,
      [standard.id]
    );
    revisions = revResult.rows;
  }

  return { standard, revisions };
}

/**
 * 건설기준 개정 이력 조회 (PostgreSQL)
 */
export async function getStandardRevisions(kcscCd: string): Promise<{
  standard: { id: number; standard_name: string; doc_type: string } | null;
  revisions: ConstructionRevision[];
}> {
  const pool = getPool();

  const standardResult = await pool.query(
    `SELECT id, standard_name, doc_type FROM construction_standards WHERE kcsc_cd = $1`,
    [kcscCd]
  );

  if (standardResult.rows.length === 0) {
    return { standard: null, revisions: [] };
  }

  const standard = standardResult.rows[0];
  const revResult = await pool.query(
    `SELECT * FROM construction_standard_revisions
     WHERE standard_id = $1
     ORDER BY doc_year DESC, doc_order DESC`,
    [standard.id]
  );

  return { standard, revisions: revResult.rows };
}

/**
 * 통합 검색 (법령 + 건설기준) - PostgreSQL
 */
export async function searchAllRegulations(
  query: string,
  typeFilter: 'ALL' | 'LAW' | 'STANDARD' = 'ALL',
  limit: number = 20
): Promise<{ laws: any[]; standards: ConstructionStandard[] }> {
  const pool = getPool();
  const searchPattern = `%${query}%`;
  const halfLimit = Math.floor(limit / 2);

  let laws: any[] = [];
  let standards: ConstructionStandard[] = [];

  if (typeFilter === 'ALL' || typeFilter === 'LAW') {
    const lawResult = await pool.query(
      `SELECT 'LAW' as type, law_mst_id as code, law_name as name,
              law_type as category, enforcement_date as effective_date, ministry as org
       FROM laws WHERE law_name ILIKE $1 LIMIT $2`,
      [searchPattern, halfLimit]
    );
    laws = lawResult.rows;
  }

  if (typeFilter === 'ALL' || typeFilter === 'STANDARD') {
    const stdResult = await pool.query(
      `SELECT 'STANDARD' as type, kcsc_cd as code, standard_name as name,
              doc_type || ' - ' || COALESCE(main_category, '') as category,
              effective_date, dept as org
       FROM construction_standards
       WHERE standard_name ILIKE $1 OR kcsc_cd ILIKE $1 OR main_category ILIKE $1
       LIMIT $2`,
      [searchPattern, halfLimit]
    );
    standards = stdResult.rows;
  }

  return { laws, standards };
}

/**
 * 법령 조문 검색 (PostgreSQL)
 */
export async function searchArticles(
  lawName: string,
  articleNo?: string
): Promise<any[]> {
  const pool = getPool();

  let sql = `
    SELECT a.*, l.law_name, l.law_type, l.enforcement_date
    FROM articles a
    JOIN laws l ON a.law_id = l.id
    WHERE l.law_name ILIKE $1
  `;
  const params: any[] = [`%${lawName}%`];

  if (articleNo) {
    sql += ` AND a.article_no = $2`;
    params.push(articleNo);
  }

  sql += ` ORDER BY a.article_no LIMIT 100`;

  const result = await pool.query(sql, params);
  return result.rows;
}

/**
 * 법령 검색 (PostgreSQL)
 */
export async function searchLaws(query: string, limit: number = 20): Promise<any[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM laws WHERE law_name ILIKE $1 ORDER BY law_name LIMIT $2`,
    [`%${query}%`, limit]
  );
  return result.rows;
}
