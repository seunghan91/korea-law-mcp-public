#!/usr/bin/env node
/**
 * 판례 검증 기능 간단 테스트 (SQLite 직접 접근)
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = '/Users/seunghan/law/korea-law/data/korea-law.db';

function testPrecedentVerification() {
  console.log('='.repeat(60));
  console.log('판례 검증 기능 테스트');
  console.log('='.repeat(60));

  const db = new Database(DB_PATH, { readonly: true });

  // 테스트 케이스
  const testCases = [
    // 실제 판례 (DB에 존재해야 함)
    { case_id: '2021다225074', expected: true, description: '실제 판례 - 최저임금 소정근로시간' },
    { case_id: '2024도18441', expected: true, description: '실제 판례 - 사기죄 기망행위' },
    { case_id: '2024다293092', expected: true, description: '실제 판례 - 취업규칙 변경' },
    { case_id: '2020다277306', expected: true, description: '실제 판례 - 손해배상 산정' },
    { case_id: '96다56306', expected: true, description: '실제 판례 - 근로조건 변경' },
    { case_id: '2024므13669', expected: true, description: '실제 판례 - 이혼 위자료' },

    // 가상 판례 (DB에 없어야 함)
    { case_id: '2026므607069', expected: false, description: '가상 판례 - 블록체인 계약' },
    { case_id: '2030다999999', expected: false, description: '가상 판례 - 미래 날짜' },
    { case_id: '2027도123456', expected: false, description: '가상 판례 - AI 저작권' },
    { case_id: '2028누987654', expected: false, description: '가상 판례 - 양자컴퓨터' },
  ];

  const checkStmt = db.prepare('SELECT 1 FROM Precedents WHERE case_id = ?');

  let passed = 0;
  let failed = 0;

  console.log('\n📋 판례 존재 여부 테스트\n');

  for (const testCase of testCases) {
    const result = checkStmt.get(testCase.case_id);
    const exists = result !== undefined;

    if (exists === testCase.expected) {
      console.log(`✅ PASS: ${testCase.case_id}`);
      console.log(`   ${testCase.description}`);
      console.log(`   예상: ${testCase.expected ? '존재' : '미존재'}, 결과: ${exists ? '존재' : '미존재'}\n`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${testCase.case_id}`);
      console.log(`   ${testCase.description}`);
      console.log(`   예상: ${testCase.expected ? '존재' : '미존재'}, 결과: ${exists ? '존재' : '미존재'}\n`);
      failed++;
    }
  }

  // 판례 상세 정보 조회 테스트
  console.log('=' .repeat(60));
  console.log('판례 상세 정보 조회 테스트');
  console.log('=' .repeat(60));

  const detailStmt = db.prepare(`
    SELECT case_id, case_name, case_type, court, decision_date, summary
    FROM Precedents
    WHERE case_id = ?
  `);

  const sampleCases = ['2021다225074', '2024도18441', '2024다293092'];

  for (const caseId of sampleCases) {
    const row = detailStmt.get(caseId);

    if (row) {
      console.log(`\n📄 ${row.case_id}`);
      console.log(`   사건명: ${row.case_name}`);
      console.log(`   사건유형: ${row.case_type}`);
      console.log(`   법원: ${row.court}`);
      console.log(`   선고일: ${row.decision_date}`);
      console.log(`   요약: ${row.summary?.substring(0, 80)}...`);
    }
  }

  // DB 통계
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(DISTINCT case_type) as case_types,
      COUNT(DISTINCT court) as courts
    FROM Precedents
  `).get();

  const caseTypeStats = db.prepare(`
    SELECT case_type, COUNT(*) as cnt
    FROM Precedents
    GROUP BY case_type
    ORDER BY cnt DESC
    LIMIT 5
  `).all();

  console.log('\n' + '='.repeat(60));
  console.log('테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`   ✅ 통과: ${passed}건`);
  console.log(`   ❌ 실패: ${failed}건`);
  console.log(`   📊 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  console.log(`\n📊 DB 통계:`);
  console.log(`   총 판례 수: ${stats.total}건`);
  console.log(`   사건 유형 수: ${stats.case_types}개`);
  console.log(`   법원 수: ${stats.courts}개`);

  console.log(`\n📊 사건 유형별 분포 (상위 5개):`);
  for (const row of caseTypeStats) {
    console.log(`   - ${row.case_type}: ${row.cnt}건`);
  }

  db.close();
}

// 실행
testPrecedentVerification();
