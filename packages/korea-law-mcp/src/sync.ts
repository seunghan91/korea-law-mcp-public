/**
 * Korea Law MCP - Data Sync Script
 *
 * 법령 데이터 동기화 스크립트
 *
 * ⚠️ Note: Sync functions use dynamic imports to avoid module resolution issues
 * on platforms where node-cron or playwright are not available.
 */

import 'dotenv/config';
import { initDatabase } from 'korea-law';

// Dynamic imports for sync modules (avoid module resolution issues)
async function loadSyncModules() {
  try {
    const dailySync = await import('korea-law/dist/sync/daily-sync');
    const precedentSync = await import('korea-law/dist/sync/precedent-sync');
    const termExtractor = await import('korea-law/dist/sync/term-extractor');

    return {
      runFullSync: dailySync.runFullSync,
      runPrecedentSync: precedentSync.runPrecedentSync,
      runTermExtraction: termExtractor.runTermExtraction,
    };
  } catch (error) {
    console.error('Failed to load sync modules:', error);
    console.error('');
    console.error('This script requires the korea-law package to be built first.');
    console.error('Run: cd korea-law && pnpm build');
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const runAll = args.includes('--all');
  const runPrecedent = args.includes('--precedent');
  const runTerms = args.includes('--terms');

  console.log('=== Korea Law Data Sync ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // Load sync modules dynamically
    const { runFullSync, runPrecedentSync, runTermExtraction } = await loadSyncModules();

    // Initialize database
    await initDatabase();
    console.log('Database initialized');

    // Run sync based on arguments
    if (runAll || (!runPrecedent && !runTerms)) {
      console.log('\n[1/3] Running law sync...');
      await runFullSync();
      console.log('Law sync completed');
    }

    if (runAll || runPrecedent) {
      console.log('\n[2/3] Running precedent sync...');
      await runPrecedentSync();
      console.log('Precedent sync completed');
    }

    if (runAll || runTerms) {
      console.log('\n[3/3] Running term extraction...');
      await runTermExtraction();
      console.log('Term extraction completed');
    }

    console.log('\n=== Sync completed successfully ===');
    console.log(`Finished at: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
