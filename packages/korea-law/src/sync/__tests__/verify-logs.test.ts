/**
 * Verify Execution Logs Test
 *
 * Verify that execution logs are properly stored and can be retrieved
 */

import * as db from '../../db/database';
import { format } from 'date-fns';

async function verifyLogs() {
  console.log('\n═'.repeat(60));
  console.log('📋 Execution Log Verification');
  console.log('═'.repeat(60));

  // Initialize database
  db.initDatabase();

  const today = format(new Date(), 'yyyy-MM-dd');

  console.log(`\n📅 Checking logs for: ${today}\n`);

  // Try to get today's summary
  const summary = db.getDailySyncSummary(today) as any;

  if (summary) {
    console.log('✅ Daily Summary Found:');
    console.log(`   Date: ${summary.sync_date}`);
    console.log(`   Run ID: ${summary.run_id}`);
    console.log(`   Status: ${summary.status}`);
    console.log(`   Duration: ${summary.total_duration_ms}ms`);
    console.log(`   Phases Completed: ${summary.phases_completed}`);
    console.log(`   Laws Synced: ${summary.total_laws_synced}`);
    console.log(`   Admin Rules: ${summary.total_admin_rules_synced}`);
    console.log(`   API Calls: ${summary.total_api_calls}`);
    console.log(`   Errors: ${summary.total_errors}`);
    console.log(`   Notes: ${summary.notes}`);

    // Get execution logs for this run
    console.log(`\n🔍 Execution Logs for Run: ${summary.run_id}`);
    const logs = db.getRecentExecutionLogs(summary.run_id) as any[];

    if (logs.length > 0) {
      console.log(`   Found ${logs.length} execution log(s):\n`);

      for (const log of logs) {
        console.log(`   Phase ${log.phase}: ${log.phase_name}`);
        console.log(`     Status: ${log.status}`);
        console.log(`     API Calls: ${log.api_calls}`);
        console.log(`     Success: ${log.success_count}`);
        console.log(`     Errors: ${log.error_count}`);
        console.log(`     Duration: ${log.duration_ms}ms`);
        console.log(`     Started: ${log.start_time}`);
        console.log('');
      }
    } else {
      console.log('   No execution logs found for this run');
    }
  } else {
    console.log('⚠️  No daily summary found for today');
    console.log('   (This is expected if no sync has run yet)\n');
  }

  // Show database statistics
  console.log('\n📊 Database Statistics:');

  try {
    const database = db.getDatabase();

    // Count execution logs
    const execLogsStmt = database.prepare(
      'SELECT COUNT(*) as count FROM sync_execution_log'
    );
    const execLogsResult = execLogsStmt.get() as any;
    console.log(`   Total Execution Logs: ${execLogsResult.count}`);

    // Count daily summaries
    const summaryStmt = database.prepare(
      'SELECT COUNT(*) as count FROM sync_summary_daily'
    );
    const summaryResult = summaryStmt.get() as any;
    console.log(`   Total Daily Summaries: ${summaryResult.count}`);

    // Get recent logs (last 5)
    const recentStmt = database.prepare(`
      SELECT run_id, phase_name, status, created_at
      FROM sync_execution_log
      ORDER BY created_at DESC
      LIMIT 5
    `);
    const recentLogs = recentStmt.all() as any[];

    if (recentLogs.length > 0) {
      console.log(`\n   Recent Execution Logs (Last 5):`);
      for (const log of recentLogs) {
        console.log(`   - ${log.phase_name} (${log.status})`);
        console.log(`     Run: ${log.run_id.substring(0, 8)}...`);
        console.log(`     Time: ${log.created_at}`);
      }
    }
  } catch (error) {
    console.error('   Error reading database:', error);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Log Verification Complete');
  console.log('═'.repeat(60) + '\n');

  db.closeDatabase();
}

verifyLogs().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
