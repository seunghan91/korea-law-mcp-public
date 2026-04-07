/**
 * korea-law: 판례 전문 동기화 모듈
 *
 * 이미 색인된 판례의 전문(Full Text)을 동기화합니다.
 *
 * ⚠️ 중요: 이 데이터는 "검증용(Verification)" 목적입니다.
 * AI가 인용한 판례 내용이 정확한지 검증하기 위한 것입니다.
 */

import * as api from '../api/law-api';
import * as db from '../db/database';
import { format } from 'date-fns';

// ============================================
// 타입 정의
// ============================================

interface SyncStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

// ============================================
// 판례 전문 동기화 함수
// ============================================

/**
 * 샘플 판례 100건 전문 동기화 (테스트용)
 */
export async function syncSamplePrecedents(limit: number = 100): Promise<SyncStats> {
  console.log('═══════════════════════════════════════════');
  console.log('📚 korea-law 판례 전문 동기화 (샘플)');
  console.log(`   시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`   대상: ${limit}건`);
  console.log('═══════════════════════════════════════════\n');

  // DB 초기화
  db.initDatabase();

  const stats: SyncStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  };

  // 전문이 없는 판례 조회
  const precedents = db.getPrecedentsWithoutFullText(limit);

  console.log(`📋 전문이 없는 판례: ${precedents.length}건\n`);

  if (precedents.length === 0) {
    console.log('⚠️  동기화할 판례가 없습니다.');
    console.log('   먼저 precedent-sync를 실행하여 판례 목록을 수집하세요.\n');
    return stats;
  }

  stats.total = precedents.length;

  // 전문 동기화
  for (let i = 0; i < precedents.length; i++) {
    const prec = precedents[i];
    const progress = `[${i + 1}/${precedents.length}]`;

    try {
      // 판례일련번호가 없으면 스킵
      if (!prec.precedent_serial_number) {
        console.log(`${progress} ⏭️  ${prec.case_id}: 판례일련번호 없음 (스킵)`);
        stats.skipped++;
        continue;
      }

      console.log(`${progress} 🔍 ${prec.case_id} (${prec.case_name || '제목없음'})`);

      // API로 전문 조회
      const detail = await api.getPrecedentDetail(prec.precedent_serial_number);

      if (!detail) {
        console.log(`     ❌ 전문 조회 실패`);
        stats.failed++;
        continue;
      }

      // DB 업데이트
      db.updatePrecedentFullText(prec.case_id, {
        precedent_serial_number: detail.판례일련번호,
        summary: detail.판시사항,
        key_points: detail.판결요지,
        full_text: detail.판례내용,
        referenced_statutes: detail.참조조문,
        referenced_cases: detail.참조판례,
      });

      const fullTextLength = detail.판례내용?.length || 0;
      console.log(`     ✅ 전문 저장 완료 (${fullTextLength.toLocaleString()} 글자)`);
      stats.success++;

      // API 부하 방지 (1초 대기)
      if (i < precedents.length - 1) {
        await delay(1000);
      }
    } catch (error: any) {
      console.error(`     ❌ 오류: ${error.message}`);
      stats.failed++;
    }
  }

  // 결과 출력
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 판례 전문 동기화 완료');
  console.log(`   총 대상: ${stats.total}건`);
  console.log(`   ✅ 성공: ${stats.success}건`);
  console.log(`   ❌ 실패: ${stats.failed}건`);
  console.log(`   ⏭️  스킵: ${stats.skipped}건`);
  console.log(`   성공률: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════');

  db.closeDatabase();

  return stats;
}

/**
 * 우선순위별 판례 전문 동기화
 */
export async function syncPrecedentsByPriority(
  priority: 'high' | 'medium' | 'low',
  limit: number = 100
): Promise<SyncStats> {
  console.log('═══════════════════════════════════════════');
  console.log(`📚 korea-law 판례 전문 동기화 (${priority})`);
  console.log(`   시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`   대상: ${limit}건`);
  console.log('═══════════════════════════════════════════\n');

  db.initDatabase();

  const stats: SyncStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  };

  // 우선순위별 판례 조회
  const precedents = db.getPrecedentsWithoutFullText(limit, priority);

  console.log(`📋 ${priority} 우선순위 판례: ${precedents.length}건\n`);

  if (precedents.length === 0) {
    console.log('⚠️  동기화할 판례가 없습니다.\n');
    return stats;
  }

  stats.total = precedents.length;

  // 전문 동기화
  for (let i = 0; i < precedents.length; i++) {
    const prec = precedents[i];
    const progress = `[${i + 1}/${precedents.length}]`;

    try {
      if (!prec.precedent_serial_number) {
        console.log(`${progress} ⏭️  ${prec.case_id}: 판례일련번호 없음`);
        stats.skipped++;
        continue;
      }

      console.log(`${progress} 🔍 ${prec.case_id}`);

      const detail = await api.getPrecedentDetail(prec.precedent_serial_number);

      if (!detail) {
        console.log(`     ❌ 전문 조회 실패`);
        stats.failed++;
        continue;
      }

      db.updatePrecedentFullText(prec.case_id, {
        precedent_serial_number: detail.판례일련번호,
        summary: detail.판시사항,
        key_points: detail.판결요지,
        full_text: detail.판례내용,
        referenced_statutes: detail.참조조문,
        referenced_cases: detail.참조판례,
      });

      console.log(`     ✅ 완료`);
      stats.success++;

      // API 부하 방지
      if (i < precedents.length - 1) {
        await delay(1000);
      }
    } catch (error: any) {
      console.error(`     ❌ 오류: ${error.message}`);
      stats.failed++;
    }
  }

  // 결과 출력
  console.log('\n═══════════════════════════════════════════');
  console.log(`📊 ${priority} 우선순위 동기화 완료`);
  console.log(`   성공: ${stats.success}건`);
  console.log(`   실패: ${stats.failed}건`);
  console.log('═══════════════════════════════════════════');

  db.closeDatabase();

  return stats;
}

// ============================================
// 유틸리티 함수
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// CLI 실행
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : 100;

  syncSamplePrecedents(limit).catch(console.error);
}
