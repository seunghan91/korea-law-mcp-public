/**
 * 판례 데이터 수동 업로드
 *
 * precedents-backup.json에서 데이터를 읽어서 직접 Supabase에 업로드합니다
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface PrecedentRecord {
  id: number;
  case_number: string;
  case_name: string;
  decision_date: string;
  case_type?: string;
  case_type_code?: number;
  court_name?: string;
  data_source?: string;
  detail_link?: string;
}

async function main() {
  console.log('📤 판례 데이터 수동 업로드 시작\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase 환경변수 없음');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. 백업 파일 읽기
  const backupPath = path.join(__dirname, '../data/precedents-backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('❌ 백업 파일이 없습니다:', backupPath);
    process.exit(1);
  }

  const precedentRecords: PrecedentRecord[] = JSON.parse(
    fs.readFileSync(backupPath, 'utf-8')
  );

  console.log(`📊 백업 파일에서 ${precedentRecords.length}건 로드\n`);

  // 2. 테이블 확인
  console.log('🔍 Supabase 테이블 확인 중...');
  const { error: tableCheckError } = await supabase
    .from('precedents')
    .select('*', { count: 'exact', head: true })
    .limit(0);

  if (tableCheckError && tableCheckError.message.includes('relation')) {
    console.log('⚠️ precedents 테이블이 없습니다');
    console.log('💡 Supabase 웹콘솔에서 다음 SQL을 실행하세요:\n');

    console.log(`CREATE TABLE precedents (
  id BIGINT PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  case_name TEXT NOT NULL,
  decision_date TEXT,
  case_type TEXT,
  case_type_code INTEGER,
  court_name TEXT,
  data_source TEXT,
  detail_link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_precedents_case_number ON precedents(case_number);
ALTER TABLE precedents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON precedents FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON precedents FOR INSERT WITH CHECK (true);`);

    process.exit(1);
  }
  console.log('✅ 테이블 확인 완료');

  // 3. 데이터 업로드 (배치)
  console.log('\n📤 Supabase에 업로드 중...');
  const BATCH_SIZE = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < precedentRecords.length; i += BATCH_SIZE) {
    const batch = precedentRecords.slice(i, i + BATCH_SIZE);

    try {
      const { data, error, status } = await supabase
        .from('precedents')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`❌ 배치 ${Math.floor(i / BATCH_SIZE) + 1} 에러:`, error.message);
        console.error('상태:', status);

        // 개별 업로드 시도
        console.log('  🔄 개별 업로드 시도 중...');
        for (const record of batch) {
          const { error: indError } = await supabase
            .from('precedents')
            .upsert([record], { onConflict: 'id' });

          if (indError) {
            errorCount++;
            console.log(`    ❌ ${record.case_number}: ${indError.message}`);
          } else {
            successCount++;
          }
        }
      } else {
        successCount += batch.length;
        const percent = Math.round(((i + batch.length) / precedentRecords.length) * 100);
        console.log(`✅ 진행: ${Math.min(i + batch.length, precedentRecords.length)}/${precedentRecords.length} (${percent}%)`);
      }
    } catch (e) {
      console.error('❌ 배치 업로드 실패:', (e as Error).message);
      errorCount += batch.length;
    }

    // 레이트 리미팅
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 4. 최종 통계
  console.log('\n📊 업로드 완료');
  console.log(`  ✅ 성공: ${successCount}건`);
  console.log(`  ❌ 실패: ${errorCount}건`);

  // 5. 최종 확인
  const { count } = await supabase
    .from('precedents')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✨ Supabase 판례 데이터: ${count}건`);
}

main().catch(error => {
  console.error('❌ 에러:', error);
  process.exit(1);
});
