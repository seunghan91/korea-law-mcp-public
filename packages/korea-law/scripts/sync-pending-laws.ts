/**
 * 시행예정 법률 동기화 스크립트
 *
 * PendingLawRegistry에 등록된 법률을 lawService API(MST 파라미터)로 조회하여
 * Laws 테이블에 동기화합니다.
 *
 * 사용법:
 *   npx ts-node scripts/sync-pending-laws.ts [--mst <법령일련번호>]
 *
 * 옵션:
 *   --mst <번호>  특정 MST만 동기화 (지정하지 않으면 모든 PENDING 상태 동기화)
 *   --dry-run     실제 동기화 없이 조회만 수행
 *   --verbose     상세 로그 출력
 */

import Database from 'better-sqlite3';
import { parseStringPromise } from 'xml2js';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(__dirname, '../data/korea-law.db');
const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const BASE_URL = 'http://www.law.go.kr/DRF/lawService.do';

interface PendingLaw {
  id: number;
  mst_id: string;
  law_name: string;
  effective_date: string;
  sync_status: string;
}

interface LawArticle {
  article_no: string;
  article_title: string;
  content: string;
  paragraph_count: number;
}

// 조문번호 정규화 (제23조 → 23, 제23조의2 → 23-2)
function normalizeArticleNo(articleNo: string): string {
  if (!articleNo) return '';
  return articleNo
    .replace(/^제/, '')
    .replace(/조$/, '')
    .replace(/조의/, '-')
    .replace(/의/, '-')
    .trim();
}

// 법령명 정규화 (검색용)
function normalizeLawName(lawName: string): string {
  if (!lawName) return '';
  return lawName
    .replace(/\s+/g, '')
    .replace(/[^\uAC00-\uD7AF\u0020-\u007E]/g, '')
    .toLowerCase();
}

// API에서 법령 상세 조회 (MST 파라미터 사용)
async function fetchLawByMst(mstId: string): Promise<any> {
  const url = `${BASE_URL}?OC=${API_KEY}&target=law&type=XML&MST=${mstId}`;
  console.log(`📡 API 조회: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API 응답 오류: ${response.status}`);
  }

  const xmlText = await response.text();
  const result = await parseStringPromise(xmlText, { explicitArray: false });

  if (!result.법령 && !result.Law) {
    // 에러 응답 확인
    if (result.OpenAPI_ServiceResponse) {
      const errMsg = result.OpenAPI_ServiceResponse.cmmMsgHeader?.errMsg || '알 수 없는 오류';
      throw new Error(`API 오류: ${errMsg}`);
    }
    throw new Error('법령 데이터를 찾을 수 없습니다');
  }

  return result.법령 || result.Law;
}

// 항(paragraph) 개수 파싱
function countParagraphs(article: any): number {
  const paragraphs = article.항 || article.Paragraphs;
  if (!paragraphs) return 1;
  return Array.isArray(paragraphs) ? paragraphs.length : 1;
}

// 조문 전체 내용 조합 (조문내용 + 항 + 호 + 목)
function buildFullContent(article: any): string {
  let content = article.조문내용 || article.ArticleContent || '';

  // 항(paragraph) 처리
  const paragraphs = article.항 || article.Paragraphs;
  if (paragraphs) {
    const paraList = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
    for (const para of paraList) {
      const paraNo = para.항번호 || para.ParagraphNo || '';
      const paraContent = para.항내용 || para.ParagraphContent || '';
      if (paraContent) {
        content += `\n${paraNo ? `${paraNo} ` : ''}${paraContent}`;
      }

      // 호(subparagraph) 처리
      const subparas = para.호 || para.Subparagraphs;
      if (subparas) {
        const subList = Array.isArray(subparas) ? subparas : [subparas];
        for (const sub of subList) {
          const subNo = sub.호번호 || sub.SubparagraphNo || '';
          const subContent = sub.호내용 || sub.SubparagraphContent || '';
          if (subContent) {
            content += `\n  ${subNo ? `${subNo} ` : ''}${subContent}`;
          }
        }
      }
    }
  }

  return content.trim();
}

// 법령 조문 파싱
function parseArticles(lawData: any): LawArticle[] {
  const articles: LawArticle[] = [];
  const seenArticleNos = new Set<string>();

  // 조문 구조 탐색
  const lawBody = lawData.조문 || lawData.Articles;
  if (!lawBody) return articles;

  const articleList = Array.isArray(lawBody.조문단위)
    ? lawBody.조문단위
    : lawBody.조문단위
      ? [lawBody.조문단위]
      : [];

  for (const article of articleList) {
    // 조문여부가 '조문'인 것만 처리 (전문, 편, 장 등 제외)
    const articleType = article.조문여부 || '';
    if (articleType !== '조문' && articleType !== '') {
      // '전문', '편', '장', '절' 등은 건너뜀
      if (['전문', '편', '장', '절', '관', '부칙'].includes(articleType)) {
        continue;
      }
    }

    const rawArticleNo = article.조문번호 || article.ArticleNo || '';
    const articleTitle = article.조문제목 || article.ArticleTitle || '';
    const content = buildFullContent(article);
    const paragraphCount = countParagraphs(article);

    // 조문번호 포맷팅 (예: 1 → 제1조)
    const articleNo = rawArticleNo ?
      (rawArticleNo.startsWith('제') ? rawArticleNo : `제${rawArticleNo}조`) : '';

    // 중복 방지: 조문키로 고유성 확보
    const articleKey = article.조문키 || articleNo;
    if (articleKey && seenArticleNos.has(articleKey)) {
      continue;
    }

    if (articleNo && content) {
      seenArticleNos.add(articleKey);
      articles.push({
        article_no: articleNo,
        article_title: articleTitle,
        content: content,
        paragraph_count: paragraphCount
      });
    }
  }

  return articles;
}

// 내용 해시 생성
function generateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

// DB에 법령 저장
function saveLawToDb(db: Database.Database, lawData: any, mstId: string): number {
  // 기본정보 섹션에서 데이터 추출
  const basicInfo = lawData.기본정보 || lawData;

  const lawName = basicInfo.법령명_한글 || basicInfo.법령명 || lawData.LawNameKorean || '';
  const lawNameEng = basicInfo.법령명_영문 || lawData.LawNameEnglish || '';
  const lawTypeRaw = basicInfo.법종구분 || basicInfo.법령종류 || lawData.LawType || '';
  const lawType = typeof lawTypeRaw === 'object' ? lawTypeRaw._ || lawTypeRaw : lawTypeRaw;
  const ministryRaw = basicInfo.소관부처 || basicInfo.소관부처명 || lawData.Ministry || '';
  const ministry = typeof ministryRaw === 'object' ? ministryRaw._ || ministryRaw : ministryRaw;
  const promulgationDate = basicInfo.공포일자 || lawData.PromulgationDate || '';
  const enforcementDate = basicInfo.시행일자 || lawData.EnforcementDate || '';
  const sourceUrl = `https://www.law.go.kr/lsInfoP.do?lsiSeq=${mstId}`;

  console.log(`\n📋 법령 정보:`);
  console.log(`  - 법령명: ${lawName}`);
  console.log(`  - MST: ${mstId}`);
  console.log(`  - 공포일: ${promulgationDate}`);
  console.log(`  - 시행일: ${enforcementDate}`);

  // 법령 전체 내용 해시 생성
  const articles = parseArticles(lawData);
  const fullContent = articles.map(a => a.content).join('\n');
  const checksum = generateHash(fullContent);

  // Laws 테이블에 저장
  const insertLaw = db.prepare(`
    INSERT INTO Laws (
      law_mst_id, law_name, law_name_eng, law_type, ministry,
      promulgation_date, enforcement_date, status,
      source_url, checksum, law_name_normalized,
      last_synced_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    ON CONFLICT(law_mst_id) DO UPDATE SET
      law_name = excluded.law_name,
      enforcement_date = excluded.enforcement_date,
      status = 'PENDING',
      checksum = excluded.checksum,
      last_synced_at = datetime('now'),
      updated_at = datetime('now')
  `);

  insertLaw.run(
    mstId, lawName, lawNameEng, lawType, ministry,
    promulgationDate, enforcementDate,
    sourceUrl, checksum, normalizeLawName(lawName)
  );

  // 저장된 법령의 ID 조회
  const lawRecord = db.prepare('SELECT id FROM Laws WHERE law_mst_id = ?').get(mstId) as { id: number };
  const savedLawId = lawRecord?.id;

  if (!savedLawId) {
    throw new Error('법령 저장 실패');
  }

  // 조문 저장
  if (articles.length > 0) {
    console.log(`  - 조문 수: ${articles.length}`);

    // 기존 조문 삭제 (FTS 트리거가 자동 처리)
    db.prepare('DELETE FROM Articles WHERE law_id = ?').run(savedLawId);

    const insertArticle = db.prepare(`
      INSERT INTO Articles (
        law_id, article_no, article_no_normalized, article_title, content,
        paragraph_count, content_hash, is_definition,
        effective_from, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    for (const article of articles) {
      const isDefinition = article.article_no.includes('2조') && article.article_title?.includes('정의');

      insertArticle.run(
        savedLawId,
        article.article_no,
        normalizeArticleNo(article.article_no),
        article.article_title,
        article.content,
        article.paragraph_count,
        generateHash(article.content),
        isDefinition ? 1 : 0,
        enforcementDate
      );
    }
  }

  return savedLawId;
}

// PendingLawRegistry 상태 업데이트
function updatePendingStatus(
  db: Database.Database,
  mstId: string,
  status: string,
  syncedLawId: number | null,
  errorMessage?: string
) {
  const stmt = db.prepare(`
    UPDATE PendingLawRegistry
    SET sync_status = ?,
        synced_law_id = ?,
        last_sync_attempt = datetime('now'),
        sync_error_message = ?
    WHERE mst_id = ?
  `);

  stmt.run(status, syncedLawId, errorMessage || null, mstId);
}

// 메인 동기화 함수
async function syncPendingLaws(options: { mst?: string; dryRun?: boolean; verbose?: boolean }) {
  const db = new Database(DB_PATH);

  try {
    console.log('🚀 시행예정 법률 동기화 시작\n');

    // 동기화 대상 조회
    let query = `
      SELECT id, mst_id, law_name, effective_date, sync_status
      FROM PendingLawRegistry
      WHERE sync_status IN ('PENDING', 'FAILED')
    `;

    if (options.mst) {
      query += ` AND mst_id = '${options.mst}'`;
    }

    const pendingLaws = db.prepare(query).all() as PendingLaw[];

    if (pendingLaws.length === 0) {
      console.log('✅ 동기화할 시행예정 법률이 없습니다.');
      return;
    }

    console.log(`📋 동기화 대상: ${pendingLaws.length}건\n`);

    for (const law of pendingLaws) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 동기화 중: ${law.law_name}`);
      console.log(`   MST: ${law.mst_id}, 시행예정일: ${law.effective_date}`);

      if (options.dryRun) {
        console.log('   [DRY-RUN] 실제 동기화 생략');
        continue;
      }

      try {
        // API에서 법령 조회
        const lawData = await fetchLawByMst(law.mst_id);

        // DB에 저장
        const savedLawId = saveLawToDb(db, lawData, law.mst_id);

        // 상태 업데이트
        updatePendingStatus(db, law.mst_id, 'SYNCED', savedLawId);

        console.log(`\n✅ 동기화 완료: ${law.law_name}`);

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`\n❌ 동기화 실패: ${errMsg}`);

        // NOT_FOUND vs FAILED 구분
        const status = errMsg.includes('찾을 수 없') ? 'NOT_FOUND' : 'FAILED';
        updatePendingStatus(db, law.mst_id, status, null, errMsg);
      }

      // API 호출 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 동기화 작업 완료\n');

    // 결과 요약
    const summary = db.prepare(`
      SELECT sync_status, COUNT(*) as count
      FROM PendingLawRegistry
      GROUP BY sync_status
    `).all();

    console.log('📊 동기화 현황:');
    for (const row of summary as any[]) {
      const emoji = row.sync_status === 'SYNCED' ? '✅' :
                    row.sync_status === 'PENDING' ? '⏳' :
                    row.sync_status === 'FAILED' ? '❌' : '🔍';
      console.log(`   ${emoji} ${row.sync_status}: ${row.count}건`);
    }

  } finally {
    db.close();
  }
}

// CLI 실행
const args = process.argv.slice(2);
const options = {
  mst: args.includes('--mst') ? args[args.indexOf('--mst') + 1] : undefined,
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose')
};

syncPendingLaws(options).catch(console.error);
