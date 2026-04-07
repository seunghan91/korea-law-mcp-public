/**
 * korea-law: 자치법규(조례) 동기화 모듈
 *
 * 전국 243개 지방자치단체의 조례를 동기화합니다.
 *
 * ⚠️ 중요: 이 데이터는 "검증용(Verification)" 목적입니다.
 * AI가 인용한 조례의 정확성을 검증하기 위한 것입니다.
 */

import * as api from '../api/law-api';
import * as db from '../db/database';
import { format } from 'date-fns';
import { METROPOLITAN_GOVERNMENTS, LocalGovernment } from './local-governments';

// ============================================
// 타입 정의
// ============================================

interface SyncStats {
  total: number;
  added: number;
  updated: number;
  errors: number;
}

// ============================================
// 자치법규 동기화 함수
// ============================================

/**
 * 특정 지자체의 조례 동기화
 */
async function syncOrdinancesByRegion(
  localGov: LocalGovernment,
  stats: SyncStats
): Promise<void> {
  console.log(`\n📍 ${localGov.name} (${localGov.code})`);

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      console.log(`   페이지 ${page} 조회 중...`);

      const ordinances = await api.searchOrdinances({
        orgCode: localGov.code,
        display: 100,
        page: page,
      });

      if (ordinances.length === 0) {
        hasMore = false;
        break;
      }

      for (const ordin of ordinances) {
        try {
          stats.total++;

          // 기존 데이터 확인
          const exists = db.findLawByNameAndType(
            ordin.자치법규명,
            ordin.자치법규종류명
          );

          // DB에 저장
          const lawId = db.insertLaw({
            law_mst_id: String(ordin.자치법규ID),
            law_name: ordin.자치법규명,
            promulgation_date: formatDate(ordin.공포일자),
            enforcement_date: formatDate(ordin.시행일자),
            law_type: mapOrdinanceType(ordin.자치법규종류명),
            ministry: localGov.name,  // 지자체명을 소관부처로 저장
            status: 'ACTIVE',
          });

          if (exists) {
            stats.updated++;
          } else {
            stats.added++;
          }
        } catch (error: any) {
          console.error(`      ❌ ${ordin.자치법규명}: ${error.message}`);
          stats.errors++;
        }
      }

      console.log(`      ✅ ${ordinances.length}건 처리`);

      // 더 많은 결과가 있을 경우 다음 페이지
      if (ordinances.length < 100) {
        hasMore = false;
      } else {
        page++;
        // API 부하 방지
        await delay(500);
      }
    }
  } catch (error: any) {
    console.error(`   ❌ ${localGov.name} 동기화 실패: ${error.message}`);
    stats.errors++;
  }
}

/**
 * 전체 자치법규 동기화 실행
 */
export async function runOrdinanceSync(): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('🏛️  korea-law 자치법규 동기화 시작');
  console.log(`   시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`   대상: 전국 ${METROPOLITAN_GOVERNMENTS.length}개 광역 지자체`);
  console.log('═══════════════════════════════════════════');
  console.log('⚠️ 주의: 이 데이터는 AI 검증용입니다.');
  console.log('   조례 내용의 법적 효력은 각 지자체 법규시스템을 참조하세요.');
  console.log('═══════════════════════════════════════════\n');

  // DB 초기화
  db.initDatabase();

  const totalStats: SyncStats = {
    total: 0,
    added: 0,
    updated: 0,
    errors: 0,
  };

  // 광역 지자체별 동기화
  for (let i = 0; i < METROPOLITAN_GOVERNMENTS.length; i++) {
    const localGov = METROPOLITAN_GOVERNMENTS[i];
    const progress = `[${i + 1}/${METROPOLITAN_GOVERNMENTS.length}]`;

    console.log(`\n${progress} ${localGov.name} 동기화 시작...`);

    const regionStats: SyncStats = {
      total: 0,
      added: 0,
      updated: 0,
      errors: 0,
    };

    await syncOrdinancesByRegion(localGov, regionStats);

    // 통계 합산
    totalStats.total += regionStats.total;
    totalStats.added += regionStats.added;
    totalStats.updated += regionStats.updated;
    totalStats.errors += regionStats.errors;

    console.log(`   ${localGov.name} 완료: 추가 ${regionStats.added}건, 업데이트 ${regionStats.updated}건`);

    // API 부하 방지 (지자체 간 1초 대기)
    if (i < METROPOLITAN_GOVERNMENTS.length - 1) {
      await delay(1000);
    }
  }

  // 결과 출력
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 자치법규 동기화 완료');
  console.log(`   총 처리: ${totalStats.total}건`);
  console.log(`   ✅ 추가: ${totalStats.added}건`);
  console.log(`   🔄 업데이트: ${totalStats.updated}건`);
  console.log(`   ❌ 오류: ${totalStats.errors}건`);
  console.log(`   성공률: ${(((totalStats.added + totalStats.updated) / totalStats.total) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════');

  db.closeDatabase();
}

// ============================================
// 유틸리티 함수
// ============================================

function formatDate(dateStr: string | number | undefined): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

function mapOrdinanceType(type: string): string {
  if (type.includes('조례')) return '조례';
  if (type.includes('규칙')) return '규칙';
  if (type.includes('훈령')) return '훈령';
  return '조례';  // 기본값
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// CLI 실행
// ============================================

if (require.main === module) {
  runOrdinanceSync().catch(console.error);
}
