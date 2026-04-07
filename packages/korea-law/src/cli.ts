#!/usr/bin/env node
/**
 * korea-law: CLI
 * 
 * 사용법:
 *   korea-law                    # MCP 서버 시작
 *   korea-law sync               # 수동 동기화 실행
 *   korea-law audit <법령> <조문>  # 조문 검증
 *   korea-law verify <사건번호>   # 판례 확인
 */

import { startMcpServer } from './mcp/server';
import { runFullSync } from './sync/daily-sync';
import { initDatabase, findLawByName, findArticle, verifyPrecedentExists } from './db/database';
import { searchLaws, getLawDetail, verifyPrecedentExistsOnline } from './api/law-api';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('⚖️  korea-law - AI Legal Auditor');
  console.log('═══════════════════════════════════════════');
  console.log('⚠️  주의: 이 도구는 AI 검증용입니다.');
  console.log('   법적 판단의 최종 근거로 사용하지 마세요.');
  console.log('═══════════════════════════════════════════\n');

  switch (command) {
    case 'sync':
      console.log('🔄 동기화 시작...\n');
      await runFullSync();
      break;

    case 'audit':
      const lawName = args[1];
      const articleNo = args[2];
      
      if (!lawName || !articleNo) {
        console.log('사용법: korea-law audit <법령명> <조문번호>');
        console.log('예시: korea-law audit 근로기준법 제23조');
        process.exit(1);
      }

      console.log(`🔍 조문 검증: ${lawName} ${articleNo}\n`);
      
      // DB 먼저 확인
      initDatabase();
      const law = findLawByName(lawName);
      
      if (law) {
        const article = findArticle(law.id!, articleNo);
        if (article) {
          console.log('📖 [로컬 DB 결과]');
          console.log(`   법령: ${law.law_name}`);
          console.log(`   조문: ${article.article_no}`);
          console.log(`   제목: ${article.article_title || '(없음)'}`);
          console.log(`   시행일: ${law.enforcement_date}`);
          console.log('\n   내용:');
          console.log(`   ${article.content.slice(0, 500)}...`);
        } else {
          console.log('   ⚠️ 해당 조문을 DB에서 찾을 수 없습니다.');
        }
      } else {
        // API로 조회
        console.log('📡 API 조회 중...');
        const results = await searchLaws(lawName, 1);
        if (results.length > 0) {
          const detail = await getLawDetail(results[0].법령ID);
          if (detail) {
            const normalizedNo = articleNo.replace(/제|조/g, '').trim();
            const article = detail.조문.find(a =>
              String(a.조문번호).includes(normalizedNo)
            );
            
            if (article) {
              console.log(`📖 [API 결과]`);
              console.log(`   법령: ${detail.기본정보.법령명_한글}`);
              console.log(`   조문: ${article.조문번호}`);
              console.log(`   제목: ${article.조문제목 || '(없음)'}`);
              console.log(`   시행일: ${detail.기본정보.시행일자}`);
              console.log('\n   내용:');
              console.log(`   ${article.조문내용.slice(0, 500)}...`);
            }
          }
        } else {
          console.log('   ❌ 법령을 찾을 수 없습니다.');
        }
      }
      break;

    case 'verify':
      const caseId = args[1];
      
      if (!caseId) {
        console.log('사용법: korea-law verify <사건번호>');
        console.log('예시: korea-law verify 2023다12345');
        process.exit(1);
      }

      console.log(`🔍 판례 확인: ${caseId}\n`);
      
      // DB 먼저 확인
      initDatabase();
      const existsLocal = verifyPrecedentExists(caseId);
      
      if (existsLocal) {
        console.log('✅ [로컬 DB] 판례 존재 확인됨');
      } else {
        console.log('📡 API 확인 중...');
        const existsOnline = await verifyPrecedentExistsOnline(caseId);
        
        if (existsOnline) {
          console.log('✅ [API] 판례 존재 확인됨');
        } else {
          console.log('❌ 판례를 찾을 수 없습니다.');
          console.log('   ⚠️ AI가 가짜 판례를 생성했을 수 있습니다!');
        }
      }
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log('사용법:');
      console.log('  korea-law                     MCP 서버 시작');
      console.log('  korea-law sync                수동 동기화 실행');
      console.log('  korea-law audit <법령> <조문>  조문 검증');
      console.log('  korea-law verify <사건번호>   판례 확인');
      console.log('  korea-law help                도움말 표시');
      break;

    default:
      // 기본: MCP 서버 시작
      await startMcpServer();
      break;
  }
}

main().catch(console.error);

