#!/usr/bin/env node
/**
 * SQLite → PostgreSQL 마이그레이션 스크립트
 * 건설기준 데이터를 Render PostgreSQL로 동기화
 */

const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

const SQLITE_PATH = path.join(__dirname, '../data/korea-law.db');

const PG_CONFIG = {
  host: 'dpg-d5131q5actks73f0aa1g-a.singapore-postgres.render.com',
  port: 5432,
  database: 'legal_audit_db',
  user: 'legal_audit_db_user',
  password: process.env.PG_PASSWORD || 'rLFu09xBnIvGYZI2jUs8Dn7TnIkU8lfw',
  ssl: { rejectUnauthorized: false }
};

async function migrate() {
  console.log('🚀 SQLite → PostgreSQL 마이그레이션 시작\n');

  // SQLite 연결
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  console.log('✅ SQLite 연결:', SQLITE_PATH);

  // PostgreSQL 연결
  const pg = new Client(PG_CONFIG);
  await pg.connect();
  console.log('✅ PostgreSQL 연결:', PG_CONFIG.host);

  try {
    // 1. 건설기준 마이그레이션
    console.log('\n📦 건설기준 마이그레이션...');
    const standards = sqlite.prepare(`
      SELECT * FROM ConstructionStandards
    `).all();
    console.log(`   - 총 ${standards.length}건`);

    let insertedStandards = 0;
    for (const s of standards) {
      try {
        await pg.query(`
          INSERT INTO construction_standards
          (id, group_seq, kcsc_cd, standard_name, doc_type, main_category, middle_category,
           establishment_date, revision_date, effective_date, dept, consider_org, advice_org, status, raw_json)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (kcsc_cd) DO UPDATE SET
            standard_name = EXCLUDED.standard_name,
            doc_type = EXCLUDED.doc_type,
            main_category = EXCLUDED.main_category,
            middle_category = EXCLUDED.middle_category,
            updated_at = CURRENT_TIMESTAMP
        `, [
          s.id, s.group_seq, s.kcsc_cd, s.standard_name, s.doc_type,
          s.main_category, s.middle_category, s.establishment_date,
          s.revision_date, s.effective_date, s.dept, s.consider_org,
          s.advice_org, s.status || 'active', s.raw_json
        ]);
        insertedStandards++;
      } catch (err) {
        console.error(`   ❌ 오류 (${s.kcsc_cd}):`, err.message);
      }
    }
    console.log(`   ✅ ${insertedStandards}건 저장 완료`);

    // ID 시퀀스 재설정
    await pg.query(`SELECT setval('construction_standards_id_seq', (SELECT MAX(id) FROM construction_standards))`);

    // 2. 개정 이력 마이그레이션
    console.log('\n📦 개정 이력 마이그레이션...');
    const revisions = sqlite.prepare(`
      SELECT * FROM ConstructionStandardRevisions
    `).all();
    console.log(`   - 총 ${revisions.length}건`);

    let insertedRevisions = 0;
    for (const r of revisions) {
      try {
        await pg.query(`
          INSERT INTO construction_standard_revisions
          (id, standard_id, doc_year, doc_order, doc_cycle, doc_er,
           establishment_date, revision_date, effective_from, revision_remark,
           doc_brief, doc_file_grp_id, is_latest)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT DO NOTHING
        `, [
          r.id, r.standard_id, r.doc_year, r.doc_order, r.doc_cycle, r.doc_er,
          r.establishment_date, r.revision_date, r.effective_from, r.revision_remark,
          r.doc_brief, r.doc_file_grp_id, r.is_latest === 1
        ]);
        insertedRevisions++;
      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.error(`   ❌ 오류 (rev ${r.id}):`, err.message);
        }
      }
    }
    console.log(`   ✅ ${insertedRevisions}건 저장 완료`);

    // ID 시퀀스 재설정
    await pg.query(`SELECT setval('construction_standard_revisions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM construction_standard_revisions))`);

    // 3. 판례 마이그레이션 (누락된 28건)
    console.log('\n📦 판례 마이그레이션...');
    const precedents = sqlite.prepare(`SELECT * FROM Precedents`).all();
    console.log(`   - 총 ${precedents.length}건`);

    let insertedPrecedents = 0;
    for (const p of precedents) {
      try {
        await pg.query(`
          INSERT INTO precedents
          (id, case_number, case_name, court_name, decision_date, case_type, decision_type, summary, content, law_references)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
        `, [
          p.id, p.case_number, p.case_name, p.court_name, p.decision_date,
          p.case_type, p.decision_type, p.summary, p.content, p.law_references
        ]);
        insertedPrecedents++;
      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.error(`   ❌ 오류:`, err.message);
        }
      }
    }
    console.log(`   ✅ ${insertedPrecedents}건 저장 완료`);

    // 4. 최종 확인
    console.log('\n📊 마이그레이션 결과:');
    const counts = await pg.query(`
      SELECT 'construction_standards' as tbl, COUNT(*) FROM construction_standards
      UNION ALL SELECT 'construction_standard_revisions', COUNT(*) FROM construction_standard_revisions
      UNION ALL SELECT 'precedents', COUNT(*) FROM precedents
    `);
    counts.rows.forEach(r => console.log(`   ${r.tbl}: ${r.count}건`));

    console.log('\n✅ 마이그레이션 완료!');

  } finally {
    sqlite.close();
    await pg.end();
  }
}

migrate().catch(err => {
  console.error('❌ 마이그레이션 실패:', err);
  process.exit(1);
});
