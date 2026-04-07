/**
 * 주요 법령 동기화 스크립트
 * 민법, 형법, 상법 등 핵심 법령과 조문을 동기화합니다.
 */

import 'dotenv/config';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import * as db from '../src/db/database';

const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const REFERER = process.env.KOREA_LAW_REFERER || 'https://ainote.dev';
const BASE_URL = 'http://www.law.go.kr/DRF';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

// 주요 법령 목록
const MAJOR_LAWS = [
  '민법',
  '형법',
  '상법',
  '헌법',
  '민사소송법',
  '형사소송법',
  '행정소송법',
  '근로기준법',
  '소득세법',
  '법인세법',
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchLaw(query: string): Promise<any[]> {
  try {
    const url = `${BASE_URL}/lawSearch.do?OC=${API_KEY}&target=law&type=XML&query=${encodeURIComponent(query)}&display=10`;
    console.log(`🔍 검색 중: ${query}`);
    
    const response = await axios.get(url, {
      headers: { 'Referer': REFERER },
      timeout: 30000,
    });

    const parsed = xmlParser.parse(response.data);
    const laws = parsed?.LawSearch?.law;
    
    if (!laws) return [];
    return Array.isArray(laws) ? laws : [laws];
  } catch (error: any) {
    console.error(`❌ 검색 실패 (${query}):`, error.message);
    return [];
  }
}

async function getLawDetail(lawId: string): Promise<any> {
  try {
    const url = `${BASE_URL}/lawService.do?OC=${API_KEY}&target=law&type=XML&ID=${lawId}`;
    console.log(`📄 상세 조회: 법령ID ${lawId}`);
    
    const response = await axios.get(url, {
      headers: { 'Referer': REFERER },
      timeout: 60000,
    });

    const parsed = xmlParser.parse(response.data);
    return parsed?.법령 || null;
  } catch (error: any) {
    console.error(`❌ 상세 조회 실패 (${lawId}):`, error.message);
    return null;
  }
}

function formatDate(dateStr: string | number | undefined): string {
  if (!dateStr) return '1900-01-01';
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

/**
 * XML 텍스트 콘텐츠 추출 (CDATA 등 처리)
 */
function extractTextContent(content: any): string {
  if (typeof content === 'string') return content.trim();
  if (content?.['#text']) return String(content['#text']).trim();
  if (Array.isArray(content)) {
    return content.map(extractTextContent).join(' ');
  }
  return String(content || '').trim();
}

/**
 * 조문 전체 내용 구성 (항/호/목 모두 포함)
 *
 * API XML 구조:
 * - 일반 조문: <항><항번호>①</항번호><항내용>...</항내용></항>
 * - 정의 조문: <항><호><호번호>1.</호번호><호내용>...</호내용><목>...</목></호></항>
 *   (항번호/항내용 없이 바로 호가 올 수 있음)
 */
function buildFullArticleContent(article: any): string {
  const parts: string[] = [];

  // 1. 조문 본문 (조문내용)
  const mainContent = extractTextContent(article.조문내용);
  if (mainContent) {
    parts.push(mainContent);
  }

  // 2. 항(paragraph) 처리
  if (article.항) {
    const 항배열 = Array.isArray(article.항) ? article.항 : [article.항];

    for (const 항 of 항배열) {
      const 항번호 = extractTextContent(항.항번호);
      const 항내용 = extractTextContent(항.항내용);

      // 항내용이 있으면 추가
      if (항내용) {
        parts.push(`${항번호} ${항내용}`.trim());
      }

      // 3. 호(subitem) 처리 - 항내용 유무와 관계없이 처리
      if (항.호) {
        const 호배열 = Array.isArray(항.호) ? 항.호 : [항.호];

        for (const 호 of 호배열) {
          const 호번호 = extractTextContent(호.호번호);
          const 호내용 = extractTextContent(호.호내용);

          if (호내용) {
            parts.push(`  ${호번호} ${호내용}`.trim());
          }

          // 4. 목(sub-subitem) 처리
          if (호.목) {
            const 목배열 = Array.isArray(호.목) ? 호.목 : [호.목];

            for (const 목 of 목배열) {
              const 목번호 = extractTextContent(목.목번호);
              const 목내용 = extractTextContent(목.목내용);

              if (목내용) {
                parts.push(`    ${목번호} ${목내용}`.trim());
              }
            }
          }
        }
      }
    }
  }

  return parts.join('\n');
}

async function syncLaw(lawName: string) {
  // 1. 법령 검색
  const searchResults = await searchLaw(lawName);
  
  // 정확히 일치하는 법령 찾기
  const exactMatch = searchResults.find(r => r.법령명한글 === lawName);
  if (!exactMatch) {
    console.log(`⚠️ ${lawName} 검색 결과 없음`);
    return;
  }

  const lawId = exactMatch.법령ID;
  console.log(`✅ ${lawName} 발견 (ID: ${lawId})`);

  // 2. 법령 상세 조회 (조문 포함)
  await sleep(500); // API rate limit
  const detail = await getLawDetail(lawId);
  
  if (!detail) {
    console.log(`⚠️ ${lawName} 상세 정보 조회 실패`);
    return;
  }

  // 3. DB에 법령 저장
  const lawRecord = {
    law_mst_id: String(detail.기본정보?.법령ID || lawId),
    law_name: lawName,
    promulgation_date: formatDate(detail.기본정보?.공포일자),
    enforcement_date: formatDate(detail.기본정보?.시행일자),
    law_type: detail.기본정보?.법령구분 || '법률',
    ministry: detail.기본정보?.소관부처명,
    status: 'ACTIVE',
  };

  const dbLawId = db.upsertLaw(lawRecord);
  console.log(`💾 ${lawName} 저장됨 (DB ID: ${dbLawId})`);

  // 4. 조문 저장
  const articles = detail.조문?.조문단위;
  if (!articles) {
    console.log(`⚠️ ${lawName} 조문 없음`);
    return;
  }

  const articleList = Array.isArray(articles) ? articles : [articles];
  let savedCount = 0;

  for (const article of articleList) {
    // 조문만 처리 (전문, 편, 장 제외)
    if (article.조문여부 !== '조문') continue;
    
    const articleNo = article.조문번호 || article.조문번호정보?.조문번호;
    if (!articleNo) continue;

    // 조문 내용 조합: 조문내용 + 항/호/목 전체 포함
    const fullContent = buildFullArticleContent(article);

    if (!fullContent || fullContent.length < 5) continue;

    try {
      db.upsertArticle({
        law_id: dbLawId,
        article_no: String(articleNo),
        article_title: article.조문제목 || null,
        content: fullContent,
      });
      savedCount++;
    } catch (e: any) {
      // FTS 관련 에러 무시
      if (!e.message?.includes('FTS')) {
        console.error(`  조문 저장 실패 (제${articleNo}조):`, e.message);
      }
    }
  }

  console.log(`📝 ${lawName}: ${savedCount}개 조문 저장됨`);
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('📚 주요 법령 동기화 시작');
  console.log(`   API Key: ${API_KEY}`);
  console.log(`   Referer: ${REFERER}`);
  console.log('═══════════════════════════════════════════\n');

  // DB 초기화
  db.initDatabase();

  for (const lawName of MAJOR_LAWS) {
    await syncLaw(lawName);
    await sleep(1000); // API rate limit
    console.log('');
  }

  console.log('═══════════════════════════════════════════');
  console.log('✅ 동기화 완료');
  
  // 결과 확인
  const lawCount = db.getDatabase().prepare('SELECT COUNT(*) as cnt FROM Laws').get() as any;
  const articleCount = db.getDatabase().prepare('SELECT COUNT(*) as cnt FROM Articles').get() as any;
  console.log(`   법령: ${lawCount.cnt}개`);
  console.log(`   조문: ${articleCount.cnt}개`);
  console.log('═══════════════════════════════════════════');

  db.closeDatabase();
}

main().catch(console.error);
