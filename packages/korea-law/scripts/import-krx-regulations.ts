/**
 * KRX 규정 데이터 임포트 스크립트
 *
 * krx_listing 프로젝트에서 복사한 JSONL 청크 데이터를
 * korea-law SQLite DB에 임포트합니다.
 *
 * 사용법: npx ts-node scripts/import-krx-regulations.ts
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const DB_PATH = process.env.KOREA_LAW_DB_PATH || path.join(__dirname, '../data/korea-law.db');
const SCHEMA_PATH = path.join(__dirname, '../src/db/schema-krx.sql');
const CHUNKS_DIR = process.env.KRX_CHUNKS_DIR || path.join(__dirname, '../../asset/data/krx_regulations/chunks');

// 시장 유형 분류
function classifyMarket(category: string, name: string): string {
  if (category?.includes('유가증권') || name?.includes('유가증권')) return '유가증권시장';
  if (category?.includes('코스닥') || name?.includes('코스닥')) return '코스닥시장';
  if (category?.includes('코넥스') || name?.includes('코넥스')) return '코넥스시장';
  if (category?.includes('파생') || name?.includes('파생')) return '파생상품시장';
  if (name?.includes('KRX금시장')) return 'KRX금시장';
  if (name?.includes('KRX석유')) return 'KRX석유시장';
  return '공통';
}

// 규정 유형 분류
function classifyRegType(name: string): string {
  if (name?.includes('시행세칙')) return '시행세칙';
  if (name?.includes('운영기준') || name?.includes('운영규정')) return '운영기준';
  if (name?.includes('지침')) return '지침';
  if (name?.includes('요령')) return '요령';
  return '규정';
}

async function importChunks() {
  console.log('🚀 KRX 규정 임포트 시작...');
  console.log(`📁 DB: ${DB_PATH}`);
  console.log(`📁 Chunks: ${CHUNKS_DIR}`);

  // DB 연결 및 스키마 적용
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  if (fs.existsSync(SCHEMA_PATH)) {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    console.log('✅ KRX 스키마 적용 완료');
  } else {
    console.error('❌ 스키마 파일 없음:', SCHEMA_PATH);
    process.exit(1);
  }

  // 기존 데이터 클리어 (재임포트 지원)
  db.exec('DELETE FROM KrxRegulationChunks');
  db.exec('DELETE FROM KrxRegulations');
  console.log('🗑️  기존 KRX 데이터 클리어');

  // JSONL 파일 목록
  const files = fs.readdirSync(CHUNKS_DIR)
    .filter(f => f.endsWith('.jsonl') && !f.startsWith('_'));

  console.log(`📄 ${files.length}개 JSONL 파일 발견`);

  // Prepared statements
  const insertReg = db.prepare(`
    INSERT OR IGNORE INTO KrxRegulations (reg_id, reg_name, reg_type, market, source_url)
    VALUES (?, ?, ?, ?, ?)
  `);

  const getRegId = db.prepare(`
    SELECT id FROM KrxRegulations WHERE reg_id = ?
  `);

  const insertChunk = db.prepare(`
    INSERT INTO KrxRegulationChunks (regulation_id, chunk_id, article_no, title, content, chunk_index, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let totalChunks = 0;
  let totalRegs = 0;

  // 트랜잭션으로 일괄 처리
  const importAll = db.transaction(() => {
    for (const file of files) {
      const filePath = path.join(CHUNKS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.trim());

      let regDbId: number | null = null;
      let chunkIndex = 0;

      for (const line of lines) {
        try {
          const chunk = JSON.parse(line);
          const meta = chunk.metadata || {};

          // 규정 마스터 레코드 (첫 청크에서 생성)
          if (!regDbId && meta.law_id) {
            const regName = meta.law_name || file.replace('.jsonl', '').replace(/^\d+__/, '').replace(/_/g, ' ');
            const regId = meta.law_id;
            const market = classifyMarket(meta.category || '', regName);
            const regType = classifyRegType(regName);

            insertReg.run(
              regId,
              regName,
              regType,
              market,
              `https://law.krx.co.kr/las/lawFullText.do?lawId=${regId}`
            );

            const row = getRegId.get(regId) as { id: number } | undefined;
            if (row) {
              regDbId = row.id;
              totalRegs++;
            }
          }

          if (regDbId) {
            const articleNo = meta.article?.number ? `제${meta.article.number}조` : null;
            const articleTitle = meta.article?.title || null;

            insertChunk.run(
              regDbId,
              chunk.id || null,
              articleNo,
              articleTitle,
              chunk.content || chunk.raw_content || '',
              chunkIndex++,
              JSON.stringify(meta)
            );
            totalChunks++;
          }
        } catch (e) {
          // JSON 파싱 에러 무시 (불완전 라인)
        }
      }
    }
  });

  importAll();

  console.log(`\n✅ 임포트 완료!`);
  console.log(`   📋 규정: ${totalRegs}건`);
  console.log(`   📝 청크: ${totalChunks}건`);

  // 통계 출력
  const stats = db.prepare(`
    SELECT r.market, COUNT(DISTINCT r.id) as reg_count, COUNT(c.id) as chunk_count
    FROM KrxRegulations r
    LEFT JOIN KrxRegulationChunks c ON c.regulation_id = r.id
    GROUP BY r.market
    ORDER BY reg_count DESC
  `).all() as any[];

  console.log('\n📊 시장별 통계:');
  for (const s of stats) {
    console.log(`   ${s.market}: ${s.reg_count}개 규정, ${s.chunk_count}개 조문`);
  }

  db.close();
}

importChunks().catch(console.error);
