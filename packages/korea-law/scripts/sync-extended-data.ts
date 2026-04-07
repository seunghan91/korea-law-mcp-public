#!/usr/bin/env npx ts-node
/**
 * sync-extended-data.ts
 * 
 * 확장 API 데이터 동기화 스크립트
 * - 법령해석례 (expc)
 * - 헌재결정례 (detc)
 * - 행정심판례 (decc)
 * - 위원회 결정문 (ftc, pipc, nlrc, ...)
 * 
 * 사용법:
 *   npx ts-node scripts/sync-extended-data.ts --type=interpretations
 *   npx ts-node scripts/sync-extended-data.ts --type=constitutional
 *   npx ts-node scripts/sync-extended-data.ts --type=appeals
 *   npx ts-node scripts/sync-extended-data.ts --type=committees
 *   npx ts-node scripts/sync-extended-data.ts --type=all
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import {
  searchLegalInterpretations,
  getLegalInterpretationDetail,
  searchConstitutionalDecisions,
  getConstitutionalDecisionDetail,
  searchAdminAppeals,
  getAdminAppealDetail,
  searchCommitteeDecisions,
  getCommitteeDecisionDetail,
  CommitteeType,
} from '../src/api/extended-api';

// CLI 인자 파싱
const args = process.argv.slice(2);
const typeArg = args.find(a => a.startsWith('--type='));
const syncType = typeArg?.split('=')[1] || 'all';
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = parseInt(limitArg?.split('=')[1] || '100', 10);

// 데이터베이스 초기화
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/korea-law.db');
const db = new Database(DB_PATH);

// 스키마 초기화
function initExtendedSchema() {
  const schemaPath = path.join(__dirname, '../src/db/schema-extended.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('✅ Extended schema initialized');
  }
}

// 진행률 표시
function progress(current: number, total: number, label: string) {
  const pct = Math.round((current / total) * 100);
  process.stdout.write(`\r[${pct}%] ${label}: ${current}/${total}`);
}

// ============================================
// 법령해석례 동기화
// ============================================
async function syncLegalInterpretations(searchLimit: number = 100) {
  console.log('\n📚 법령해석례 동기화 시작...');
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO Legal_Interpretations (
      interpretation_serial_number, case_number, case_name,
      reply_agency, reply_agency_code, reply_date,
      question_summary, answer, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  // 다양한 키워드로 검색하여 더 많은 데이터 확보
  const keywords = ['법령', '해석', '행정', '노동', '건축', '세금'];
  let totalSynced = 0;

  for (const keyword of keywords) {
    try {
      const results = await searchLegalInterpretations(keyword, searchLimit);
      console.log(`\n  "${keyword}" 검색: ${results.length}건`);

      for (let i = 0; i < results.length; i++) {
        const item = results[i] as any; // API 응답 필드가 인터페이스보다 많음
        progress(i + 1, results.length, `${keyword} 처리 중`);

        try {
          // 상세 조회 (본문 포함)
          const detail = await getLegalInterpretationDetail(
            String(item.법령해석일련번호)
          );

          insertStmt.run(
            String(item.법령해석일련번호),
            item.안건번호 || null,
            item.안건명 || item.사안명 || null,
            item.회신기관명 || null,
            item.회신기관코드 || null,
            item.회신일자 || null,
            detail?.질의요지 || item.질의요지 || null,
            detail?.회답 || item.회답 || null
          );
          totalSynced++;

          // API 부하 방지
          await new Promise(r => setTimeout(r, 100));
        } catch (err) {
          console.error(`\n  ⚠️ ${item.법령해석일련번호} 처리 실패:`, (err as Error).message);
        }
      }
    } catch (err) {
      console.error(`\n  ⚠️ "${keyword}" 검색 실패:`, (err as Error).message);
    }
  }

  console.log(`\n✅ 법령해석례 동기화 완료: ${totalSynced}건`);
  return totalSynced;
}

// ============================================
// 헌재결정례 동기화
// ============================================
async function syncConstitutionalDecisions(searchLimit: number = 100) {
  console.log('\n⚖️ 헌재결정례 동기화 시작...');
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO Constitutional_Decisions (
      decision_serial_number, case_id, case_name,
      decision_date, decision_type, judgment, summary,
      last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const keywords = ['헌법', '위헌', '합헌', '헌법불합치', '각하'];
  let totalSynced = 0;

  for (const keyword of keywords) {
    try {
      const results = await searchConstitutionalDecisions(keyword, searchLimit);
      console.log(`\n  "${keyword}" 검색: ${results.length}건`);

      for (let i = 0; i < results.length; i++) {
        const item = results[i] as any; // API 응답 필드가 인터페이스보다 많음
        progress(i + 1, results.length, `${keyword} 처리 중`);

        try {
          const detail = await getConstitutionalDecisionDetail(
            String(item.헌재결정일련번호)
          );

          insertStmt.run(
            String(item.헌재결정일련번호),
            item.사건번호 || null,
            item.사건명 || null,
            item.종국일자 || item.선고일자 || null,
            item.결정유형 || detail?.결정유형 || null,
            detail?.주문 || null,
            detail?.결정요지 || item.결정요지 || null
          );
          totalSynced++;

          await new Promise(r => setTimeout(r, 100));
        } catch (err) {
          console.error(`\n  ⚠️ ${item.헌재결정일련번호} 처리 실패:`, (err as Error).message);
        }
      }
    } catch (err) {
      console.error(`\n  ⚠️ "${keyword}" 검색 실패:`, (err as Error).message);
    }
  }

  console.log(`\n✅ 헌재결정례 동기화 완료: ${totalSynced}건`);
  return totalSynced;
}

// ============================================
// 행정심판례 동기화
// ============================================
async function syncAdminAppeals(searchLimit: number = 100) {
  console.log('\n📋 행정심판례 동기화 시작...');
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO Admin_Appeals (
      appeal_serial_number, case_id, case_name,
      decision_date, decision_result, summary,
      last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const keywords = ['행정심판', '인용', '기각', '취소', '허가'];
  let totalSynced = 0;

  for (const keyword of keywords) {
    try {
      const results = await searchAdminAppeals(keyword, searchLimit);
      console.log(`\n  "${keyword}" 검색: ${results.length}건`);

      for (let i = 0; i < results.length; i++) {
        const item = results[i] as any; // API 응답 필드가 인터페이스보다 많음
        const serialNum = item.행정심판일련번호 || item.행정심판재결례일련번호;
        progress(i + 1, results.length, `${keyword} 처리 중`);

        try {
          const detail = await getAdminAppealDetail(String(serialNum));

          insertStmt.run(
            String(serialNum),
            item.사건번호 || null,
            item.사건명 || null,
            item.재결일자 || item.의결일자 || null,
            item.재결결과 || item.재결구분명 || null,
            detail?.재결요지 || item.재결요지 || null
          );
          totalSynced++;

          await new Promise(r => setTimeout(r, 100));
        } catch (err) {
          console.error(`\n  ⚠️ ${serialNum} 처리 실패:`, (err as Error).message);
        }
      }
    } catch (err) {
      console.error(`\n  ⚠️ "${keyword}" 검색 실패:`, (err as Error).message);
    }
  }

  console.log(`\n✅ 행정심판례 동기화 완료: ${totalSynced}건`);
  return totalSynced;
}

// ============================================
// 위원회 결정문 동기화
// ============================================
async function syncCommitteeDecisions(searchLimit: number = 50) {
  console.log('\n🏛️ 위원회 결정문 동기화 시작...');
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO Committee_Decisions (
      decision_serial_number, committee_type, committee_name,
      case_id, case_name, decision_date, decision_type,
      summary, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const committees: { type: CommitteeType; keywords: string[] }[] = [
    { type: 'monopoly', keywords: ['담합', '공정거래', '독점'] },
    { type: 'privacy', keywords: ['개인정보', '정보보호'] },
    { type: 'labor', keywords: ['부당해고', '노동', '임금'] },
    { type: 'financial', keywords: ['금융', '증권'] },
    { type: 'human_rights', keywords: ['인권', '차별'] },
  ];

  let totalSynced = 0;

  for (const { type, keywords } of committees) {
    console.log(`\n  📌 ${type} 위원회 처리 중...`);
    
    for (const keyword of keywords) {
      try {
        const results = await searchCommitteeDecisions(type, keyword, searchLimit);
        console.log(`    "${keyword}" 검색: ${results.length}건`);

        for (const result of results) {
          const item = result as any; // API 응답 필드가 인터페이스보다 많음
          try {
            const serialNum = item.결정문일련번호 || item.일련번호;
            
            insertStmt.run(
              String(serialNum),
              type,
              item.위원회명 || '',
              item.사건번호 || null,
              item.사건명 || null,
              item.결정일자 || null,
              item.문서유형 || item.결정유형 || null,
              item.결정요지 || null
            );
            totalSynced++;

            await new Promise(r => setTimeout(r, 100));
          } catch (err) {
            console.error(`    ⚠️ 처리 실패:`, (err as Error).message);
          }
        }
      } catch (err) {
        console.error(`    ⚠️ "${keyword}" 검색 실패:`, (err as Error).message);
      }
    }
  }

  console.log(`\n✅ 위원회 결정문 동기화 완료: ${totalSynced}건`);
  return totalSynced;
}

// ============================================
// 메인 실행
// ============================================
async function main() {
  console.log('========================================');
  console.log('📦 확장 API 데이터 동기화');
  console.log(`   유형: ${syncType}`);
  console.log(`   제한: ${limit}건/키워드`);
  console.log('========================================');

  const startTime = Date.now();

  try {
    // 스키마 초기화
    initExtendedSchema();

    const results: Record<string, number> = {};

    // 동기화 유형에 따라 실행
    if (syncType === 'all' || syncType === 'interpretations') {
      results.interpretations = await syncLegalInterpretations(limit);
    }

    if (syncType === 'all' || syncType === 'constitutional') {
      results.constitutional = await syncConstitutionalDecisions(limit);
    }

    if (syncType === 'all' || syncType === 'appeals') {
      results.appeals = await syncAdminAppeals(limit);
    }

    if (syncType === 'all' || syncType === 'committees') {
      results.committees = await syncCommitteeDecisions(limit);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n========================================');
    console.log('📊 동기화 결과 요약');
    console.log('========================================');
    
    for (const [key, count] of Object.entries(results)) {
      console.log(`  ${key}: ${count}건`);
    }
    
    const total = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`----------------------------------------`);
    console.log(`  총계: ${total}건`);
    console.log(`  소요 시간: ${duration}초`);
    console.log('========================================');

  } catch (error) {
    console.error('❌ 동기화 실패:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main().catch(console.error);
