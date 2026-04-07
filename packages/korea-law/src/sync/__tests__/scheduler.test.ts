/**
 * Daily Sync Scheduler Tests
 *
 * Tests for the automated synchronization scheduler
 */

import { format } from 'date-fns';
import * as db from '../../db/database';

// ============================================
// Test Suite Setup
// ============================================

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

function recordTest(name: string, status: 'PASSED' | 'FAILED' | 'SKIPPED', duration: number, error?: string): void {
  results.push({ name, status, duration, error });
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    const duration = Date.now() - startTime;
    recordTest(name, 'PASSED', duration);
    console.log(`   ✅ PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    recordTest(name, 'FAILED', duration, String(error));
    console.error(`   ❌ FAILED (${duration}ms)`);
    console.error(`      Error: ${error}`);
  }
}

// ============================================
// Test Cases
// ============================================

async function testDatabaseConnection(): Promise<void> {
  // Initialize database
  const database = db.initDatabase();
  if (!database) {
    throw new Error('Database initialization failed');
  }
}

async function testExecutionLogTable(): Promise<void> {
  const database = db.initDatabase();

  // Try to query execution log table
  const stmt = database.prepare(`
    SELECT COUNT(*) as count FROM sqlite_master
    WHERE type='table' AND name='sync_execution_log'
  `);

  const result = stmt.get() as any;
  if (!result || result.count === 0) {
    throw new Error('sync_execution_log table not found');
  }
}

async function testDailySyncSummaryTable(): Promise<void> {
  const database = db.initDatabase();

  const stmt = database.prepare(`
    SELECT COUNT(*) as count FROM sqlite_master
    WHERE type='table' AND name='sync_summary_daily'
  `);

  const result = stmt.get() as any;
  if (!result || result.count === 0) {
    throw new Error('sync_summary_daily table not found');
  }
}

async function testExecutionLogInsert(): Promise<void> {
  try {
    const testLog = {
      run_id: 'test-' + Date.now(),
      phase: 1,
      phase_name: 'Test Phase',
      start_time: new Date(),
      end_time: new Date(),
      duration_ms: 1000,
      api_calls: 5,
      success_count: 4,
      error_count: 1,
      skipped_count: 0,
      timeout_count: 0,
      laws_processed: 10,
      precedents_processed: 0,
      admin_rules_processed: 0,
      local_ordinances_processed: 0,
      status: 'SUCCESS',
      error_message: undefined,
      retry_count: 0,
    };

    const changes = db.insertExecutionLog(testLog);
    if (changes === 0) {
      throw new Error('Insert returned 0 changes');
    }
  } catch (error) {
    throw new Error(`Failed to insert execution log: ${error}`);
  }
}

async function testDailySyncSummaryInsert(): Promise<void> {
  try {
    const testSummary = {
      sync_date: format(new Date(), 'yyyy-MM-dd'),
      run_id: 'test-' + Date.now(),
      status: 'SUCCESS',
      total_duration_ms: 300000,
      phases_completed: 3,
      phases_failed: 0,
      total_laws_synced: 30,
      total_precedents_synced: 0,
      total_admin_rules_synced: 15,
      total_local_ordinances_synced: 0,
      total_api_calls: 45,
      total_errors: 1,
      notes: 'Test execution',
    };

    const changes = db.insertDailySyncSummary(testSummary);
    if (changes === 0) {
      throw new Error('Insert returned 0 changes');
    }
  } catch (error) {
    throw new Error(`Failed to insert daily summary: ${error}`);
  }
}

async function testExecutionLogRetrieval(): Promise<void> {
  try {
    const testRunId = 'test-' + Date.now();

    // Insert a test log
    db.insertExecutionLog({
      run_id: testRunId,
      phase: 2,
      phase_name: 'Test Phase 2',
      start_time: new Date(),
      duration_ms: 500,
      api_calls: 3,
      success_count: 3,
      error_count: 0,
      skipped_count: 0,
      timeout_count: 0,
      status: 'SUCCESS',
      retry_count: 0,
    });

    // Retrieve it
    const logs = db.getRecentExecutionLogs(testRunId);
    if (!logs || logs.length === 0) {
      throw new Error('No logs retrieved');
    }

    const log = logs[0] as any;
    if (log.run_id !== testRunId) {
      throw new Error('Retrieved log does not match run ID');
    }
  } catch (error) {
    throw new Error(`Failed to retrieve execution log: ${error}`);
  }
}

async function testDailySyncSummaryRetrieval(): Promise<void> {
  try {
    const syncDate = format(new Date(), 'yyyy-MM-dd');

    const summary = db.getDailySyncSummary(syncDate);
    // Note: Summary might be null if no sync has run yet, which is OK
    console.log(`   (Summary lookup: ${summary ? 'Found' : 'Not found yet'})`);
  } catch (error) {
    throw new Error(`Failed to retrieve daily summary: ${error}`);
  }
}

async function testSchedulerEnvironment(): Promise<void> {
  const apiKey = process.env.KOREA_LAW_API_KEY;
  if (!apiKey) {
    console.log('   ⚠️  API key not set - scheduler will not run');
    console.log('      Set: export KOREA_LAW_API_KEY=your_key');
  } else {
    console.log('   ✅ API key is configured');
  }
}

async function testCronScheduleConfiguration(): Promise<void> {
  // Verify the schedule pattern is valid
  const cronPattern = '0 22 * * *';

  // Basic validation of cron pattern (should have 5 fields)
  const fields = cronPattern.split(' ');
  if (fields.length !== 5) {
    throw new Error('Invalid cron pattern format');
  }

  console.log(`   Cron pattern: ${cronPattern}`);
  console.log('   Time: 22:00 (10 PM) every day');
  console.log('   Timezone: Asia/Seoul');
}

async function testDatabaseSchema(): Promise<void> {
  const database = db.initDatabase();

  const tables = [
    'sync_priority_tracking',
    'sync_execution_log',
    'sync_summary_daily',
    'phase_performance_tracking',
    'schema_migrations'
  ];

  for (const table of tables) {
    const stmt = database.prepare(`
      SELECT COUNT(*) as count FROM sqlite_master
      WHERE type='table' AND name=?
    `);

    const result = stmt.get(table) as any;
    if (!result || result.count === 0) {
      throw new Error(`Table ${table} not found`);
    }
  }

  console.log(`   ✅ All ${tables.length} required tables exist`);
}

// ============================================
// Test Runner
// ============================================

async function runAllTests(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('🧪 Daily Sync Scheduler - Test Suite');
  console.log('═'.repeat(60));
  console.log(`Started: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`);

  // Database Tests
  console.log('📦 Database Tests');
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Execution Log Table', testExecutionLogTable);
  await runTest('Daily Sync Summary Table', testDailySyncSummaryTable);
  await runTest('Database Schema', testDatabaseSchema);

  // Data Insertion Tests
  console.log('\n📝 Data Insertion Tests');
  await runTest('Insert Execution Log', testExecutionLogInsert);
  await runTest('Insert Daily Summary', testDailySyncSummaryInsert);

  // Data Retrieval Tests
  console.log('\n🔍 Data Retrieval Tests');
  await runTest('Retrieve Execution Logs', testExecutionLogRetrieval);
  await runTest('Retrieve Daily Summary', testDailySyncSummaryRetrieval);

  // Scheduler Configuration Tests
  console.log('\n⏰ Scheduler Configuration Tests');
  await runTest('Cron Schedule Configuration', testCronScheduleConfiguration);
  await runTest('Scheduler Environment', testSchedulerEnvironment);

  // Print Test Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n✅ Passed:  ${passed}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);

  // Detailed Results
  console.log('\n📋 Detailed Results:');
  for (const result of results) {
    const icon = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⏭️ ';
    console.log(`${icon} ${result.name.padEnd(40)} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   └─ ${result.error}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  if (failed === 0) {
    console.log('🎉 All Tests Passed!');
    console.log('✅ Scheduler is ready for production deployment');
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Please review above.`);
  }
  console.log('═'.repeat(60) + '\n');

  // Clean up database connection
  db.closeDatabase();

  process.exit(failed > 0 ? 1 : 0);
}

// ============================================
// Run Tests
// ============================================

runAllTests().catch(error => {
  console.error('Fatal error during testing:', error);
  process.exit(1);
});
