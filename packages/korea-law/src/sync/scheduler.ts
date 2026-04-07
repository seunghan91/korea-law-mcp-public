/**
 * korea-law: Daily Sync Scheduler
 *
 * 자동화된 일일 동기화 스케줄러
 * 매일 22:00 KST에 자동으로 4-Phase 동기화 실행
 *
 * ============================================
 * 사용 방법
 * ============================================
 *
 * 1. 직접 실행:
 *    npx ts-node src/sync/scheduler.ts
 *
 * 2. 프로덕션 배포:
 *    npm run dev:scheduler
 *
 * 3. Docker:
 *    docker run --env KOREA_LAW_API_KEY=xxx korea-law scheduler
 *
 * ============================================
 * 스케줄 정보
 * ============================================
 *
 * 실행 시간: 매일 22:00 KST (한국 시간)
 * 타임존: Asia/Seoul
 * 동기화 방식: 4-Phase Priority System
 *
 * Phase 1 (60분):  Critical Laws
 * Phase 2 (90분):  Precedent & Admin Rules
 * Phase 3 (90분):  Local Ordinance & Interpretation
 * Phase 4 (60분):  Secondary Sources (deferred)
 *
 * 최대 예상 시간: 약 4시간 (모든 Phase 포함)
 */

import { format } from 'date-fns';
import { scheduleDailySync, runFullSync } from './daily-sync';

// ============================================
// 환경 변수 검증
// ============================================

function validateEnvironment(): boolean {
  const required = ['KOREA_LAW_API_KEY'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('❌ 필수 환경변수 누락:');
    for (const key of missing) {
      console.error(`   - ${key}`);
    }
    console.error('\n설정 방법:');
    console.error('   export KOREA_LAW_API_KEY=your_api_key');
    console.error('   export KOREA_LAW_REFERER=https://your-domain.com');
    return false;
  }

  return true;
}

// ============================================
// 스케줄러 실행
// ============================================

async function startScheduler(): Promise<void> {
  console.log('═'.repeat(50));
  console.log('🚀 korea-law Daily Sync Scheduler 시작');
  console.log('═'.repeat(50));
  console.log(`   시작 시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`   타임존: Asia/Seoul`);
  console.log('═'.repeat(50));

  // 환경변수 검증
  if (!validateEnvironment()) {
    process.exit(1);
  }

  // 스케줄 등록
  scheduleDailySync();

  console.log('\n📅 스케줄된 동기화 정보:');
  console.log('   시간: 매일 22:00 KST');
  console.log('   Phases: 4단계 (Critical Laws → Secondary Sources)');
  console.log('   로깅: 모든 실행 기록 데이터베이스 저장');
  console.log('\n💡 Ctrl+C를 눌러 종료할 수 있습니다.\n');

  // 그레이스풀 셧다운
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  스케줄러 종료 중...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n⏹️  스케줄러 종료 중...');
    process.exit(0);
  });

  // 무한 대기 (스케줄러가 백그라운드에서 실행)
  await new Promise(() => {
    // 절대 해결되지 않는 Promise - 프로세스가 계속 실행됨
  });
}

// ============================================
// 단일 실행 모드
// ============================================

async function runOnce(): Promise<void> {
  console.log('═'.repeat(50));
  console.log('🔄 Daily Sync 단일 실행');
  console.log('═'.repeat(50));
  console.log(`   시작 시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log('═'.repeat(50));

  // 환경변수 검증
  if (!validateEnvironment()) {
    process.exit(1);
  }

  try {
    await runFullSync();
    console.log('\n✅ 동기화 완료');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 동기화 실패:', error);
    process.exit(1);
  }
}

// ============================================
// CLI 진입점
// ============================================

const args = process.argv.slice(2);
const command = args[0] || 'schedule';

if (command === 'once' || command === 'run') {
  // 단일 실행 모드
  runOnce();
} else if (command === 'schedule' || command === 'daemon') {
  // 스케줄러 모드 (백그라운드 실행)
  startScheduler();
} else if (command === 'help') {
  console.log(`
korea-law Daily Sync Scheduler

사용법:
  npx ts-node src/sync/scheduler.ts [command]

명령어:
  schedule   스케줄러 모드 (기본값, 매일 22:00 KST 실행)
  daemon     스케줄러 모드 (schedule과 동일)
  once       단일 실행 (즉시 한 번 실행)
  run        단일 실행 (once와 동일)
  help       이 도움말 표시

환경변수:
  KOREA_LAW_API_KEY    법령정보 Open API 키 (필수)
  KOREA_LAW_REFERER    API 신청 시 등록한 도메인 (권장)
  KOREA_LAW_DB_PATH    데이터베이스 경로 (선택)

예제:
  # 스케줄러 시작 (백그라운드에서 매일 22:00 KST 실행)
  export KOREA_LAW_API_KEY=your_key
  npx ts-node src/sync/scheduler.ts

  # 즉시 동기화 실행
  npx ts-node src/sync/scheduler.ts once

  # Docker에서 실행
  docker run \\
    -e KOREA_LAW_API_KEY=your_key \\
    -v /data:/app/data \\
    korea-law scheduler
  `);
  process.exit(0);
} else {
  console.error(`❌ 알 수 없는 명령어: ${command}`);
  console.error('도움말: npx ts-node src/sync/scheduler.ts help');
  process.exit(1);
}
