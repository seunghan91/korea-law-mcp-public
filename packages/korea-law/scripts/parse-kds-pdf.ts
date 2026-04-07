/**
 * KDS/KCS PDF 파싱 스크립트
 * PDF 문서에서 조문 단위로 내용을 추출하여 DB에 저장합니다.
 *
 * 사용법:
 *   npx ts-node scripts/parse-kds-pdf.ts <pdf-path> [--kcsc-cd <code>]
 *
 * 예시:
 *   npx ts-node scripts/parse-kds-pdf.ts ../asset/text/상하수도급수시설설계기준.pdf --kcsc-cd "KDS 57 70 00"
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Database from 'better-sqlite3';

// pdf2json 타입 정의
interface PDFPage {
  Texts: Array<{
    R: Array<{
      T: string;
    }>;
  }>;
}

interface PDFData {
  Pages: PDFPage[];
}

// ============================================
// 환경 설정
// ============================================
const DB_PATH = process.env.KOREA_LAW_DB_PATH || path.join(__dirname, '../data/korea-law.db');

// ============================================
// 타입 정의
// ============================================
interface ParsedArticle {
  chapterNo: string | null;
  sectionNo: string | null;
  articleNo: string;
  title: string;
  content: string;
  contentHash: string;
}

interface ParsedTerm {
  term: string;
  termNormalized: string;
  definition: string;
  articleRef: string | null;
}

interface ParseResult {
  standardCode: string;
  standardName: string;
  articles: ParsedArticle[];
  terms: ParsedTerm[];
  totalPages: number;
  totalChars: number;
}

// ============================================
// PDF 텍스트 추출
// ============================================
async function extractPdfText(pdfPath: string): Promise<{ text: string; pages: number }> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFParser = require('pdf2json');

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData: { parserError: Error }) => {
      reject(errData.parserError);
    });

    pdfParser.on('pdfParser_dataReady', (pdfData: PDFData) => {
      let fullText = '';
      const pages = pdfData.Pages || [];

      for (const page of pages) {
        const texts = page.Texts || [];
        for (const textItem of texts) {
          const runs = textItem.R || [];
          for (const run of runs) {
            const text = decodeURIComponent(run.T || '');
            fullText += text + ' ';
          }
        }
        fullText += '\n\n'; // 페이지 구분
      }

      resolve({
        text: fullText.trim(),
        pages: pages.length,
      });
    });

    pdfParser.loadPDF(pdfPath);
  });
}

// ============================================
// 조문 파싱
// ============================================
function parseArticles(text: string): ParsedArticle[] {
  const articles: ParsedArticle[] = [];

  // 조문 패턴 정의 (KDS/KCS 문서 구조에 맞춤)
  // 1. 장 번호: "1. 총 설", "2. 급수관" 등
  // 1.1 절 번호: "1.1 급수설비의 의의", "2.1 총칙" 등
  // 1.1.1 항 번호: "1.1.1 정의", "2.1.1 일반사항" 등

  // 텍스트를 줄 단위로 분리하고 정규화
  const normalizedText = text
    .replace(/\s+/g, ' ')
    .replace(/(\d+\.)\s+/g, '\n$1 ')
    .replace(/(\d+\.\d+)\s+/g, '\n$1 ')
    .replace(/(\d+\.\d+\.\d+)\s+/g, '\n$1 ');

  // 조문 패턴 매칭
  // 패턴: 숫자.숫자 또는 숫자.숫자.숫자 형태
  const articlePattern = /^(\d+)\.(\d+)(?:\.(\d+))?\s+(.+?)(?=\n\d+\.|\n$|$)/gm;

  let match;
  while ((match = articlePattern.exec(normalizedText)) !== null) {
    const chapterNo = match[1];
    const sectionNo = match[2];
    const subSectionNo = match[3] || null;
    const restContent = match[4].trim();

    // 제목과 내용 분리 (첫 번째 문장을 제목으로)
    const titleMatch = restContent.match(/^([^.。]+[.。]?)/);
    const title = titleMatch ? titleMatch[1].trim() : restContent.substring(0, 50);
    const content = restContent;

    const articleNo = subSectionNo
      ? `${chapterNo}.${sectionNo}.${subSectionNo}`
      : `${chapterNo}.${sectionNo}`;

    articles.push({
      chapterNo,
      sectionNo: subSectionNo ? `${chapterNo}.${sectionNo}` : null,
      articleNo,
      title: title.substring(0, 200), // 제목 최대 200자
      content,
      contentHash: crypto.createHash('md5').update(content).digest('hex'),
    });
  }

  // 장 단위 항목도 추가 (예: "1. 총 설")
  const chapterPattern = /^(\d+)\.\s+([가-힣a-zA-Z\s]+?)(?=\n\d+\.|\n$|$)/gm;
  while ((match = chapterPattern.exec(normalizedText)) !== null) {
    const chapterNo = match[1];
    const title = match[2].trim();

    // 이미 추가된 조문과 중복되지 않도록 확인
    const existingChapter = articles.find(a => a.articleNo === `${chapterNo}`);
    if (!existingChapter && title.length > 1) {
      articles.unshift({
        chapterNo,
        sectionNo: null,
        articleNo: chapterNo,
        title: title.substring(0, 200),
        content: title,
        contentHash: crypto.createHash('md5').update(title).digest('hex'),
      });
    }
  }

  // 조문 번호순 정렬
  articles.sort((a, b) => {
    const aParts = a.articleNo.split('.').map(Number);
    const bParts = b.articleNo.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      if (aVal !== bVal) return aVal - bVal;
    }
    return 0;
  });

  return articles;
}

// ============================================
// 용어 추출
// ============================================
function extractTerms(text: string, articles: ParsedArticle[]): ParsedTerm[] {
  const terms: ParsedTerm[] = [];

  // 용어 정의 패턴 (일반적인 형태)
  // 예: "급수관이란 배수관에서 분기하여..."
  // 예: "「급수설비」라 함은..."
  const termPatterns = [
    /[「"']([가-힣a-zA-Z]+)[」"'][이란|라\s*함은|이라\s*함은|은|는]\s*(.+?)(?=[.。]|$)/g,
    /([가-힣]+)(?:이란|라\s*함은)\s*(.+?)(?=[.。]|$)/g,
  ];

  // 용어 정의 섹션 찾기 (보통 1.1.1 정의 또는 1.2 용어의 정의 등)
  const definitionArticle = articles.find(
    a =>
      a.title.includes('정의') ||
      a.title.includes('용어') ||
      a.articleNo.endsWith('.1') // 첫 번째 항목이 보통 정의
  );

  const searchText = definitionArticle ? definitionArticle.content : text;

  for (const pattern of termPatterns) {
    let match;
    while ((match = pattern.exec(searchText)) !== null) {
      const term = match[1].trim();
      const definition = match[2].trim();

      // 중복 제거
      if (!terms.find(t => t.term === term) && term.length >= 2 && definition.length >= 5) {
        terms.push({
          term,
          termNormalized: term.toLowerCase().replace(/\s+/g, ''),
          definition: definition.substring(0, 500), // 정의 최대 500자
          articleRef: definitionArticle?.articleNo || null,
        });
      }
    }
  }

  return terms;
}

// ============================================
// 건설기준 코드 추출
// ============================================
function extractStandardCode(text: string, filename: string): { code: string; name: string } {
  // KDS/KCS 코드 패턴: "KDS 57 70 00" 또는 "KCS 10 10 05"
  const codePattern = /(KDS|KCS)\s*(\d{2})\s*(\d{2})\s*(\d{2})/i;
  const match = text.match(codePattern);

  if (match) {
    const code = `${match[1].toUpperCase()} ${match[2]} ${match[3]} ${match[4]}`;

    // 기준명 추출 (코드 다음에 오는 텍스트)
    const namePattern = new RegExp(`${code}[:\\s]*:?\\s*\\d*\\s*([가-힣\\s]+)`, 'i');
    const nameMatch = text.match(namePattern);
    const name = nameMatch ? nameMatch[1].trim() : filename.replace('.pdf', '');

    return { code, name };
  }

  // 파일명에서 추출 시도
  const filenameMatch = filename.match(codePattern);
  if (filenameMatch) {
    return {
      code: `${filenameMatch[1].toUpperCase()} ${filenameMatch[2]} ${filenameMatch[3]} ${filenameMatch[4]}`,
      name: filename.replace('.pdf', '').replace(codePattern, '').trim(),
    };
  }

  return {
    code: 'UNKNOWN',
    name: filename.replace('.pdf', ''),
  };
}

// ============================================
// 데이터베이스 저장
// ============================================
function saveToDatabase(result: ParseResult, kcscCd?: string): {
  articlesInserted: number;
  termsInserted: number;
} {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const standardCode = kcscCd || result.standardCode;

  // 기준 ID 조회
  const standardRow = db.prepare(
    'SELECT id FROM ConstructionStandards WHERE kcsc_cd = ?'
  ).get(standardCode) as { id: number } | undefined;

  if (!standardRow) {
    console.error(`❌ 건설기준 코드 '${standardCode}'를 찾을 수 없습니다.`);
    console.log('   힌트: 먼저 sync-kcsc.ts를 실행하여 기준 데이터를 동기화하세요.');
    db.close();
    return { articlesInserted: 0, termsInserted: 0 };
  }

  const standardId = standardRow.id;

  // 최신 개정 ID 조회
  const revisionRow = db.prepare(
    'SELECT id FROM ConstructionStandardRevisions WHERE standard_id = ? AND is_latest = 1'
  ).get(standardId) as { id: number } | undefined;
  const revisionId = revisionRow?.id || null;

  // 기존 조문 삭제 (재파싱 시)
  db.prepare('DELETE FROM ConstructionStandardArticles WHERE standard_id = ?').run(standardId);
  db.prepare('DELETE FROM ConstructionTerms WHERE standard_id = ?').run(standardId);

  // 조문 삽입
  const insertArticle = db.prepare(`
    INSERT INTO ConstructionStandardArticles (
      standard_id, revision_id, chapter_no, section_no, article_no,
      title, content, content_hash
    ) VALUES (
      @standard_id, @revision_id, @chapter_no, @section_no, @article_no,
      @title, @content, @content_hash
    )
  `);

  let articlesInserted = 0;
  db.exec('BEGIN TRANSACTION');
  for (const article of result.articles) {
    try {
      insertArticle.run({
        standard_id: standardId,
        revision_id: revisionId,
        chapter_no: article.chapterNo,
        section_no: article.sectionNo,
        article_no: article.articleNo,
        title: article.title,
        content: article.content,
        content_hash: article.contentHash,
      });
      articlesInserted++;
    } catch (err: any) {
      console.error(`   ⚠️ 조문 ${article.articleNo} 삽입 실패:`, err.message);
    }
  }
  db.exec('COMMIT');

  // 용어 삽입
  const insertTerm = db.prepare(`
    INSERT INTO ConstructionTerms (
      standard_id, term, term_normalized, definition, article_ref
    ) VALUES (
      @standard_id, @term, @term_normalized, @definition, @article_ref
    )
  `);

  let termsInserted = 0;
  db.exec('BEGIN TRANSACTION');
  for (const term of result.terms) {
    try {
      insertTerm.run({
        standard_id: standardId,
        term: term.term,
        term_normalized: term.termNormalized,
        definition: term.definition,
        article_ref: term.articleRef,
      });
      termsInserted++;
    } catch (err: any) {
      console.error(`   ⚠️ 용어 '${term.term}' 삽입 실패:`, err.message);
    }
  }
  db.exec('COMMIT');

  db.close();
  return { articlesInserted, termsInserted };
}

// ============================================
// 메인 함수
// ============================================
async function parsePdf(pdfPath: string, kcscCd?: string): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('📄 KDS/KCS PDF 파싱 시작');
  console.log('═══════════════════════════════════════════');
  console.log(`📁 PDF 경로: ${pdfPath}`);
  console.log(`📁 DB 경로: ${DB_PATH}`);
  if (kcscCd) {
    console.log(`🎯 지정된 기준 코드: ${kcscCd}`);
  }
  console.log('');

  // 파일 존재 확인
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF 파일을 찾을 수 없습니다: ${pdfPath}`);
    process.exit(1);
  }

  const filename = path.basename(pdfPath);

  try {
    // 1. PDF 텍스트 추출
    console.log('📖 [1/4] PDF 텍스트 추출 중...');
    const { text, pages } = await extractPdfText(pdfPath);
    console.log(`   ✅ ${pages}페이지, ${text.length.toLocaleString()}자 추출 완료`);

    // 2. 기준 코드 추출
    console.log('\n🔍 [2/4] 건설기준 코드 추출 중...');
    const { code, name } = extractStandardCode(text, filename);
    console.log(`   ✅ 코드: ${code}`);
    console.log(`   ✅ 기준명: ${name}`);

    // 3. 조문 파싱
    console.log('\n📋 [3/4] 조문 파싱 중...');
    const articles = parseArticles(text);
    console.log(`   ✅ ${articles.length}개 조문 파싱 완료`);

    if (articles.length > 0) {
      console.log('   📊 파싱된 조문 샘플:');
      articles.slice(0, 5).forEach(a => {
        console.log(`      ${a.articleNo}: ${a.title.substring(0, 40)}...`);
      });
      if (articles.length > 5) {
        console.log(`      ... 외 ${articles.length - 5}개`);
      }
    }

    // 4. 용어 추출
    console.log('\n📚 [4/4] 용어 추출 중...');
    const terms = extractTerms(text, articles);
    console.log(`   ✅ ${terms.length}개 용어 추출 완료`);

    if (terms.length > 0) {
      console.log('   📊 추출된 용어 샘플:');
      terms.slice(0, 3).forEach(t => {
        console.log(`      ${t.term}: ${t.definition.substring(0, 30)}...`);
      });
    }

    // 결과 생성
    const result: ParseResult = {
      standardCode: code,
      standardName: name,
      articles,
      terms,
      totalPages: pages,
      totalChars: text.length,
    };

    // DB 저장
    console.log('\n💾 데이터베이스 저장 중...');
    const { articlesInserted, termsInserted } = saveToDatabase(result, kcscCd);

    // 최종 결과
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 파싱 완료 통계');
    console.log('═══════════════════════════════════════════');
    console.log(`   기준 코드: ${kcscCd || code}`);
    console.log(`   기준명: ${name}`);
    console.log(`   PDF 페이지: ${pages}`);
    console.log(`   추출 문자: ${text.length.toLocaleString()}자`);
    console.log(`   파싱 조문: ${articles.length}개`);
    console.log(`   DB 저장 조문: ${articlesInserted}개`);
    console.log(`   추출 용어: ${terms.length}개`);
    console.log(`   DB 저장 용어: ${termsInserted}개`);
    console.log('\n✅ PDF 파싱 완료!');

  } catch (error: any) {
    console.error('\n❌ 파싱 실패:', error.message);
    process.exit(1);
  }
}

// ============================================
// CLI 실행
// ============================================
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('사용법: npx ts-node scripts/parse-kds-pdf.ts <pdf-path> [--kcsc-cd <code>]');
  console.log('');
  console.log('예시:');
  console.log('  npx ts-node scripts/parse-kds-pdf.ts ../asset/text/상하수도급수시설설계기준.pdf');
  console.log('  npx ts-node scripts/parse-kds-pdf.ts ./docs/KDS_57_70_00.pdf --kcsc-cd "KDS 57 70 00"');
  process.exit(0);
}

const pdfPath = args[0];
let kcscCd: string | undefined;

const kcscIdx = args.indexOf('--kcsc-cd');
if (kcscIdx !== -1 && args[kcscIdx + 1]) {
  kcscCd = args[kcscIdx + 1];
}

parsePdf(pdfPath, kcscCd)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
