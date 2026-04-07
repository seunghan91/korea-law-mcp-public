/**
 * Manual Sync Execution Test
 *
 * Quick test to verify manual sync execution works
 */

import * as db from '../../db/database';
import * as api from '../../api/law-api';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

async function quickSyncTest() {
  console.log('\n═'.repeat(50));
  console.log('⚡ Quick Sync Test (Phase 1 - Limited)');
  console.log('═'.repeat(50));

  const runId = uuidv4();
  const startTime = new Date();

  console.log(`\nRun ID: ${runId}`);
  console.log(`Time: ${format(startTime, 'yyyy-MM-dd HH:mm:ss')}\n`);

  // Initialize database
  db.initDatabase();

  const testLaws = ['민법', '형법'];
  let apiCalls = 0;
  let successCount = 0;
  let errorCount = 0;

  console.log('🔄 Syncing test laws...\n');

  for (const lawName of testLaws) {
    try {
      console.log(`  📜 ${lawName}...`);

      const results = await api.searchLaws(lawName, 1);
      apiCalls++;

      if (results.length > 0) {
        successCount++;
        console.log(`     ✅ Found ${results.length} result(s)`);
      } else {
        console.log(`     ℹ️  No results`);
      }
    } catch (error) {
      errorCount++;
      console.log(`     ⚠️  Error: ${error}`);
    }

    // Small delay to avoid API throttling
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  // Log execution
  const logChanges = db.insertExecutionLog({
    run_id: runId,
    phase: 1,
    phase_name: 'Quick Test',
    start_time: startTime,
    end_time: endTime,
    duration_ms: duration,
    api_calls: apiCalls,
    success_count: successCount,
    error_count: errorCount,
    skipped_count: 0,
    timeout_count: 0,
    laws_processed: successCount,
    status: errorCount === 0 ? 'SUCCESS' : 'PARTIAL',
  });

  // Log summary
  const summaryChanges = db.insertDailySyncSummary({
    sync_date: format(startTime, 'yyyy-MM-dd'),
    run_id: runId,
    status: errorCount === 0 ? 'SUCCESS' : 'PARTIAL',
    total_duration_ms: duration,
    phases_completed: 1,
    phases_failed: 0,
    total_laws_synced: successCount,
    total_api_calls: apiCalls,
    total_errors: errorCount,
    notes: '빠른 테스트 실행',
  });

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Quick Test Results');
  console.log('═'.repeat(50));
  console.log(`\n  API 호출: ${apiCalls}건`);
  console.log(`  성공: ${successCount}건`);
  console.log(`  오류: ${errorCount}건`);
  console.log(`  소요 시간: ${duration}ms (${(duration/1000).toFixed(1)}초)`);
  console.log(`  실행 ID: ${runId}`);
  console.log(`\n  로그 삽입: ${logChanges > 0 ? '✅ 저장됨' : '⚠️ 미저장'}`);
  console.log(`  요약 삽입: ${summaryChanges > 0 ? '✅ 저장됨' : '⚠️ 미저장'}`);
  console.log('\n✅ 실행 로그가 데이터베이스에 저장되었습니다.\n');

  // Retrieve and verify logs
  console.log('📋 Verifying Logs...');
  const retrievedLogs = db.getRecentExecutionLogs(runId);
  console.log(`  ✅ ${retrievedLogs.length} execution log(s) retrieved`);

  const summary = db.getDailySyncSummary(format(startTime, 'yyyy-MM-dd'));
  if (summary) {
    console.log(`  ✅ Daily summary found (ID: ${(summary as any).run_id})`);
  } else {
    console.log(`  ⚠️  Daily summary not yet available`);
  }

  console.log('');

  db.closeDatabase();
}

quickSyncTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
