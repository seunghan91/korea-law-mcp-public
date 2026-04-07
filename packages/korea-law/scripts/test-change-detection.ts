/**
 * Test script to validate change detection in synchronization
 * 
 * This script:
 * 1. Queries recently amended laws using date-based filtering
 * 2. Runs a test sync for one law
 * 3. Verifies change detection via checksum comparison
 */

import { getRecentlyAmendedLaws, searchLaws, getLawDetail } from '../src/api/law-api';
import * as db from '../src/db/database';
import * as crypto from 'crypto';

const generateChecksum = (data: string): string => {
  return crypto.createHash('md5').update(data).digest('hex');
};

async function testDateBasedFiltering() {
  console.log('\n=== 1. Testing Date-Based API Filtering ===\n');
  
  // Get laws amended in the last 30 days
  const days = 30;
  
  console.log(`Querying laws amended in the last ${days} days`);
  
  try {
    const recentLaws = await getRecentlyAmendedLaws(days);
    console.log(`✅ Found ${recentLaws.length} recently amended laws`);
    
    if (recentLaws.length > 0) {
      console.log('\nSample of recent amendments:');
      recentLaws.slice(0, 5).forEach((law, i) => {
        console.log(`  ${i + 1}. ${law.법령명한글} (시행일: ${law.시행일자})`);
      });
    }
    
    return recentLaws;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return [];
  }
}

async function testChangeDetection(lawName: string = '근로기준법') {
  console.log('\n=== 2. Testing Change Detection Logic ===\n');
  console.log(`Testing with: ${lawName}`);
  
  try {
    // Search for the law
    const searchResult = await searchLaws(lawName);
    if (!searchResult || searchResult.length === 0) {
      console.log('❌ Law not found in API');
      return;
    }
    
    const lawInfo = searchResult[0];
    console.log(`Found: ${lawInfo.법령명한글} (ID: ${lawInfo.법령ID})`);
    
    // Get law detail
    const detail = await getLawDetail(lawInfo.법령ID);
    if (!detail) {
      console.log('❌ Could not fetch law detail');
      return;
    }
    
    // Generate checksum for the law content (use any to handle type variations)
    const basicInfo = (detail as any).기본정보 || {};
    const lawRecord = {
      law_mst_id: String(basicInfo.법령ID || lawInfo.법령ID),
      law_name: basicInfo.법령명한글 || basicInfo.법령명_한글 || lawName,
      law_name_chinese: basicInfo.법령명한자 || basicInfo.법령명_한자 || '',
      promulgation_date: basicInfo.공포일자 || '',
      promulgation_number: basicInfo.공포번호 || 0,
      enforcement_date: basicInfo.시행일자 || '',
      ministry: basicInfo.소관부처명 || '',
      law_type: basicInfo.법령구분명 || '',
      law_status: '',
      full_text: JSON.stringify(detail),
    };
    
    const newChecksum = generateChecksum(JSON.stringify(lawRecord));
    console.log(`\nNew content checksum: ${newChecksum}`);
    
    // Check existing record in database
    const database = db.getDatabase();
    const existingLaw = database.prepare(
      'SELECT id, checksum, last_synced_at, updated_at FROM Laws WHERE law_mst_id = ?'
    ).get(lawRecord.law_mst_id) as any;
    
    if (existingLaw) {
      console.log(`\nExisting record found (DB ID: ${existingLaw.id})`);
      console.log(`  Old checksum: ${existingLaw.checksum || 'NULL'}`);
      console.log(`  Last synced: ${existingLaw.last_synced_at}`);
      console.log(`  Last updated: ${existingLaw.updated_at}`);
      
      if (existingLaw.checksum === newChecksum) {
        console.log('\n✅ CHANGE DETECTION: No changes detected (checksums match)');
        console.log('   → Scheduling would skip this law');
      } else {
        console.log('\n⚠️  CHANGE DETECTION: Changes detected (checksums differ)');
        console.log('   → Scheduling would trigger update');
      }
    } else {
      console.log('\n📝 No existing record - this would be a new insert');
    }
    
    return { lawRecord, newChecksum, existingLaw };
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testUpsertBehavior(lawName: string = '근로기준법') {
  console.log('\n=== 3. Testing Upsert Behavior ===\n');
  
  try {
    const searchResult = await searchLaws(lawName);
    if (!searchResult || searchResult.length === 0) {
      console.log('❌ Law not found');
      return;
    }
    
    const lawInfo = searchResult[0];
    const detail = await getLawDetail(lawInfo.법령ID);
    if (!detail) return;
    
    const database = db.getDatabase();
    
    // Get counts before
    const beforeCounts = {
      laws: (database.prepare('SELECT COUNT(*) as cnt FROM Laws').get() as any).cnt,
      articles: (database.prepare('SELECT COUNT(*) as cnt FROM Articles').get() as any).cnt,
    };
    console.log(`Before: ${beforeCounts.laws} laws, ${beforeCounts.articles} articles`);
    
    // Perform upsert (use any to handle type variations)
    const basicInfo = (detail as any).기본정보 || {};
    const lawRecord = {
      law_mst_id: String(basicInfo.법령ID || lawInfo.법령ID),
      law_name: basicInfo.법령명한글 || basicInfo.법령명_한글 || lawName,
      law_name_chinese: basicInfo.법령명한자 || basicInfo.법령명_한자 || '',
      promulgation_date: basicInfo.공포일자 || '',
      promulgation_number: basicInfo.공포번호 || 0,
      enforcement_date: basicInfo.시행일자 || '',
      ministry: basicInfo.소관부처명 || '',
      law_type: basicInfo.법령구분명 || '',
      law_status: '',
      full_text: JSON.stringify(detail),
    };
    
    const dbLawId = db.upsertLaw(lawRecord);
    console.log(`Upserted law with DB ID: ${dbLawId}`);
    
    // Get counts after
    const afterCounts = {
      laws: (database.prepare('SELECT COUNT(*) as cnt FROM Laws').get() as any).cnt,
      articles: (database.prepare('SELECT COUNT(*) as cnt FROM Articles').get() as any).cnt,
    };
    console.log(`After: ${afterCounts.laws} laws, ${afterCounts.articles} articles`);
    
    // Check if it was insert or update
    if (afterCounts.laws > beforeCounts.laws) {
      console.log('\n📝 Result: NEW law inserted');
    } else {
      console.log('\n🔄 Result: Existing law updated (upsert)');
    }
    
    // Verify the record
    const verifyRecord = database.prepare(
      'SELECT law_mst_id, law_name, checksum, last_synced_at, updated_at FROM Laws WHERE id = ?'
    ).get(dbLawId) as any;
    
    console.log('\nVerified record:');
    console.log(`  law_mst_id: ${verifyRecord.law_mst_id}`);
    console.log(`  law_name: ${verifyRecord.law_name}`);
    console.log(`  checksum: ${verifyRecord.checksum}`);
    console.log(`  last_synced_at: ${verifyRecord.last_synced_at}`);
    console.log(`  updated_at: ${verifyRecord.updated_at}`);
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function checkSyncMetadata() {
  console.log('\n=== 4. Checking Sync Metadata Table ===\n');
  
  try {
    const database = db.getDatabase();
    
    // Check if SyncMetadata table exists
    const tableExists = database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='SyncMetadata'"
    ).get();
    
    if (!tableExists) {
      console.log('⚠️  SyncMetadata table does not exist');
      console.log('   → Need to create table for tracking sync jobs');
      return;
    }
    
    const recentSyncs = database.prepare(
      'SELECT * FROM SyncMetadata ORDER BY started_at DESC LIMIT 5'
    ).all() as any[];
    
    console.log(`Found ${recentSyncs.length} recent sync records:`);
    recentSyncs.forEach((sync, i) => {
      console.log(`\n  ${i + 1}. Sync ID: ${sync.id}`);
      console.log(`     Type: ${sync.sync_type}`);
      console.log(`     Started: ${sync.started_at}`);
      console.log(`     Completed: ${sync.completed_at || 'In Progress'}`);
      console.log(`     Status: ${sync.status}`);
      console.log(`     Laws Added/Updated: ${sync.laws_added || 0}/${sync.laws_updated || 0}`);
    });
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function summarizeChangeDetectionCapabilities() {
  console.log('\n=== 5. Change Detection Capabilities Summary ===\n');
  
  console.log('✅ API Date-Based Filtering:');
  console.log('   - efYd/efYdE: Filter by enforcement date range');
  console.log('   - ancYd: Filter by promulgation date range');
  console.log('   - prncYd: Filter by ruling date (precedents)');
  console.log('   → Enables efficient incremental sync\n');
  
  console.log('✅ Database Change Detection:');
  console.log('   - Checksums: MD5 hash of law content');
  console.log('   - ON CONFLICT DO UPDATE: Atomic upsert operations');
  console.log('   - last_synced_at: Track when each record was synced');
  console.log('   - updated_at: Track when content actually changed');
  console.log('   → Can detect and record content changes\n');
  
  console.log('✅ Scheduling Recommendations:');
  console.log('   1. Use date-based API filtering for incremental sync');
  console.log('   2. Compare checksums to detect actual content changes');
  console.log('   3. Update only changed records (upsert logic)');
  console.log('   4. Log changes to Diff_Logs for audit trail');
  console.log('   5. Track sync metadata for monitoring\n');
}

async function main() {
  console.log('========================================');
  console.log('  Change Detection Validation Test');
  console.log('========================================');
  
  // Test 1: Date-based API filtering
  await testDateBasedFiltering();
  
  // Test 2: Change detection logic
  await testChangeDetection('근로기준법');
  
  // Test 3: Upsert behavior
  await testUpsertBehavior('근로기준법');
  
  // Test 4: Sync metadata
  await checkSyncMetadata();
  
  // Test 5: Summary
  await summarizeChangeDetectionCapabilities();
  
  console.log('========================================');
  console.log('  Test Complete');
  console.log('========================================\n');
}

main().catch(console.error);
