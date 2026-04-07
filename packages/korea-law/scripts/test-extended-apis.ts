#!/usr/bin/env npx ts-node
/**
 * test-extended-apis.ts
 * 
 * 확장 API 테스트 스크립트
 * 모든 새 API 엔드포인트의 작동 여부를 확인합니다.
 * 
 * 사용법:
 *   npx ts-node scripts/test-extended-apis.ts
 */

import 'dotenv/config';
import {
  searchLegalInterpretations,
  getLegalInterpretationDetail,
  searchConstitutionalDecisions,
  getConstitutionalDecisionDetail,
  searchAdminAppeals,
  getAdminAppealDetail,
  searchCommitteeDecisions,
  getCommitteeDecisionDetail,
  searchMinistryInterpretations,
  searchTribunalDecisions,
  searchLegalTerms,
  searchTreaties,
  CommitteeType,
  MinistryType,
  TribunalType,
} from '../src/api/extended-api';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  count?: number;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<any>
): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - start;
    const count = Array.isArray(result) ? result.length : (result ? 1 : 0);
    
    const testResult: TestResult = {
      name,
      status: count > 0 ? 'PASS' : 'SKIP',
      count,
      duration,
    };
    results.push(testResult);
    
    const icon = testResult.status === 'PASS' ? '✅' : '⚠️';
    console.log(`${icon} ${name}: ${count}건 (${duration}ms)`);
    
    return testResult;
  } catch (error) {
    const duration = Date.now() - start;
    const testResult: TestResult = {
      name,
      status: 'FAIL',
      error: (error as Error).message,
      duration,
    };
    results.push(testResult);
    console.log(`❌ ${name}: ${(error as Error).message}`);
    return testResult;
  }
}

async function main() {
  console.log('========================================');
  console.log('🧪 확장 API 테스트');
  console.log('========================================\n');

  // 1. 법령해석례 테스트
  console.log('📚 법령해석례 (expc)');
  console.log('----------------------------------------');
  await runTest('법령해석례 검색', () => 
    searchLegalInterpretations('근로기준법', 5)
  );
  
  const interpResults = await searchLegalInterpretations('법령', 1);
  if (interpResults.length > 0) {
    const item = interpResults[0] as any;
    // API 응답의 실제 필드명 확인
    const id = item.법령해석례일련번호 || item.법령해석일련번호 || item['@_id'];
    console.log(`  (상세 조회 ID: ${id})`);
    if (id) {
      await runTest('법령해석례 상세', () => 
        getLegalInterpretationDetail(String(id))
      );
    }
  }

  // 2. 헌재결정례 테스트
  console.log('\n⚖️ 헌재결정례 (detc)');
  console.log('----------------------------------------');
  await runTest('헌재결정례 검색', () => 
    searchConstitutionalDecisions('위헌', 5)
  );
  
  const constResults = await searchConstitutionalDecisions('헌법', 1);
  if (constResults.length > 0) {
    const item = constResults[0] as any;
    const id = item.헌재결정례일련번호 || item.헌재결정일련번호 || item['@_id'];
    console.log(`  (상세 조회 ID: ${id})`);
    if (id) {
      await runTest('헌재결정례 상세', () => 
        getConstitutionalDecisionDetail(String(id))
      );
    }
  }

  // 3. 행정심판례 테스트
  console.log('\n📋 행정심판례 (decc)');
  console.log('----------------------------------------');
  await runTest('행정심판례 검색', () => 
    searchAdminAppeals('행정심판', 5)
  );
  
  const appealResults = await searchAdminAppeals('허가', 1);
  if (appealResults.length > 0) {
    const item = appealResults[0] as any;
    const id = item.행정심판일련번호 || item.행정심판재결례일련번호;
    await runTest('행정심판례 상세', () => 
      getAdminAppealDetail(String(id))
    );
  }

  // 4. 위원회 결정문 테스트
  console.log('\n🏛️ 위원회 결정문');
  console.log('----------------------------------------');
  
  const committees: { type: CommitteeType; query: string }[] = [
    { type: 'monopoly', query: '담합' },
    { type: 'privacy', query: '개인정보' },
    { type: 'labor', query: '해고' },
    { type: 'financial', query: '금융' },
    { type: 'human_rights', query: '인권' },
  ];

  for (const { type, query } of committees) {
    await runTest(`위원회-${type} 검색`, () => 
      searchCommitteeDecisions(type, query, 3)
    );
  }

  // 5. 부처별 해석 테스트 (API 미응답 예상)
  console.log('\n📂 부처별 해석 (moelInterp 등)');
  console.log('----------------------------------------');
  
  const ministries: { type: MinistryType; query: string }[] = [
    { type: 'moel', query: '퇴직금' },
    { type: 'nts', query: '부가세' },
    { type: 'molit', query: '건축' },
  ];

  for (const { type, query } of ministries) {
    await runTest(`부처-${type} 검색`, () => 
      searchMinistryInterpretations(type, query, 3)
    );
  }

  // 6. 특별행정심판 테스트 (API 미응답 예상)
  console.log('\n⚡ 특별행정심판 (ttAppeal 등)');
  console.log('----------------------------------------');
  
  const tribunals: { type: TribunalType; query: string }[] = [
    { type: 'tax', query: '부가가치세' },
    { type: 'patent', query: '특허' },
  ];

  for (const { type, query } of tribunals) {
    await runTest(`심판원-${type} 검색`, () => 
      searchTribunalDecisions(type, query, 3)
    );
  }

  // 7. 기타 API 테스트
  console.log('\n📖 기타 API');
  console.log('----------------------------------------');
  
  await runTest('법령용어 검색', () => 
    searchLegalTerms('정의', 5)
  );
  
  await runTest('조약 검색', () => 
    searchTreaties('조약', 5)
  );

  // 결과 요약
  console.log('\n========================================');
  console.log('📊 테스트 결과 요약');
  console.log('========================================');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`✅ 성공: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`⚠️ 건너뜀 (0건): ${skipped}개`);
  console.log(`총 테스트: ${results.length}개`);

  if (failed > 0) {
    console.log('\n실패한 테스트:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }

  // 작동하는 API 목록
  console.log('\n========================================');
  console.log('🔧 API 작동 현황');
  console.log('========================================');
  
  const workingApis = results.filter(r => r.status === 'PASS');
  const notWorkingApis = results.filter(r => r.status !== 'PASS');
  
  console.log('\n작동하는 API:');
  workingApis.forEach(r => console.log(`  ✅ ${r.name} (${r.count}건)`));
  
  console.log('\n작동하지 않는 API:');
  notWorkingApis.forEach(r => console.log(`  ❌ ${r.name}`));

  console.log('\n========================================');
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
