/**
 * 주요 법률 추가 동기화 스크립트
 *
 * ⚠️ API 호출 시 Referer 헤더 필수!
 * 환경변수: KOREA_LAW_REFERER (기본값: https://ainote.dev)
 */

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import Database from 'better-sqlite3';
import path from 'path';

const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const REFERER = process.env.KOREA_LAW_REFERER || 'https://ainote.dev';
const DB_PATH = process.env.KOREA_LAW_DB_PATH || '/Users/seunghan/law/korea-law/data/korea-law.db';

// 추가 동기화할 주요 법률 목록
const PRIORITY_LAWS = [
  '헌법',
  '상법',
  '국세기본법',
  '저작권법',
  '특허법',
  '상표법',
  '독점규제 및 공정거래에 관한 법률',
  '정보통신망 이용촉진 및 정보보호 등에 관한 법률',
  '주택임대차보호법',
  '상가건물 임대차보호법',
  '건축법',
  '국토의 계획 및 이용에 관한 법률',
  '여신전문금융업법',
  '금융실명거래 및 비밀보장에 관한 법률',
  '전자금융거래법',
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '__cdata',
});

async function searchLaw(query: string): Promise<any> {
  const url = `http://www.law.go.kr/DRF/lawSearch.do`;
  const params = {
    OC: API_KEY,
    target: 'law',
    type: 'XML',
    query: query,
    display: 20,
  };

  try {
    const response = await axios.get(url, {
      params,
      headers: { Referer: REFERER },
      timeout: 30000,
    });
    return parser.parse(response.data);
  } catch (error) {
    console.error(`검색 실패: ${query}`, error);
    return null;
  }
}

async function getLawDetail(lawId: string): Promise<any> {
  const url = `http://www.law.go.kr/DRF/lawService.do`;
  const params = {
    OC: API_KEY,
    target: 'law',
    type: 'XML',
    ID: lawId,
  };

  try {
    const response = await axios.get(url, {
      params,
      headers: { Referer: REFERER },
      timeout: 60000,
    });
    return parser.parse(response.data);
  } catch (error) {
    console.error(`상세 조회 실패: ${lawId}`, error);
    return null;
  }
}

function extractArticles(lawData: any): any[] {
  const articles: any[] = [];

  try {
    const law = lawData?.법령;
    if (!law) return articles;

    const 조문 = law?.조문?.조문단위;
    if (!조문) return articles;

    const items = Array.isArray(조문) ? 조문 : [조문];

    for (const item of items) {
      const articleNum = item?.조문번호 || '';
      const articleTitle = item?.조문제목?.__cdata || item?.조문제목 || '';
      const articleContent = item?.조문내용?.__cdata || item?.조문내용 || '';

      if (articleNum || articleContent) {
        articles.push({
          article_number: String(articleNum).replace(/[^0-9]/g, ''),
          article_title: articleTitle,
          content: articleContent,
        });
      }
    }
  } catch (e) {
    console.error('조문 추출 오류:', e);
  }

  return articles;
}

async function syncLaw(db: Database.Database, lawName: string): Promise<boolean> {
  console.log(`\n📜 동기화 시작: ${lawName}`);

  // 1. 법령 검색
  const searchResult = await searchLaw(lawName);
  if (!searchResult) {
    console.log(`  ❌ 검색 실패`);
    return false;
  }

  // 2. 정확한 법령 찾기
  const laws = searchResult?.LawSearch?.law;
  if (!laws) {
    console.log(`  ❌ 검색 결과 없음`);
    return false;
  }

  const lawList = Array.isArray(laws) ? laws : [laws];
  const exactMatch = lawList.find((l: any) => {
    const name = l?.법령명한글?.__cdata || l?.법령명한글 || '';
    return name === lawName;
  });

  if (!exactMatch) {
    console.log(`  ⚠️ 정확한 매칭 없음, 첫 번째 결과 사용`);
  }

  const targetLaw = exactMatch || lawList[0];
  const lawId = targetLaw?.법령ID;
  const actualName = targetLaw?.법령명한글?.__cdata || targetLaw?.법령명한글 || lawName;

  if (!lawId) {
    console.log(`  ❌ 법령ID 없음`);
    return false;
  }

  console.log(`  법령ID: ${lawId}, 실제명: ${actualName}`);

  // 3. 법령 상세 조회
  const lawDetail = await getLawDetail(lawId);
  if (!lawDetail) {
    console.log(`  ❌ 상세 조회 실패`);
    return false;
  }

  // 4. 조문 추출
  const articles = extractArticles(lawDetail);
  console.log(`  조문 수: ${articles.length}개`);

  if (articles.length === 0) {
    console.log(`  ⚠️ 조문 없음`);
    return false;
  }

  // 5. DB 저장
  const now = new Date().toISOString();

  // 기존 법령 확인
  const existingLaw = db.prepare('SELECT id FROM Laws WHERE law_name = ?').get(actualName) as any;

  let lawDbId: number;
  if (existingLaw) {
    lawDbId = existingLaw.id;
    db.prepare('UPDATE Laws SET last_synced_at = ? WHERE id = ?').run(now, lawDbId);
    console.log(`  기존 법령 업데이트 (ID: ${lawDbId})`);
  } else {
    const result = db.prepare(`
      INSERT INTO Laws (law_id, law_name, effective_date, status, created_at, last_synced_at)
      VALUES (?, ?, ?, 'ACTIVE', ?, ?)
    `).run(lawId, actualName, now.split('T')[0], now, now);
    lawDbId = result.lastInsertRowid as number;
    console.log(`  새 법령 추가 (ID: ${lawDbId})`);
  }

  // 조문 저장
  const insertArticle = db.prepare(`
    INSERT OR REPLACE INTO Articles (law_id, article_number, article_title, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let insertedCount = 0;
  for (const article of articles) {
    try {
      insertArticle.run(
        lawDbId,
        article.article_number,
        article.article_title,
        article.content,
        now,
        now
      );
      insertedCount++;
    } catch (e) {
      // 중복 등 무시
    }
  }

  console.log(`  ✅ 완료: ${insertedCount}개 조문 저장`);
  return true;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('📦 주요 법률 추가 동기화');
  console.log(`   시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`   대상: ${PRIORITY_LAWS.length}개 법률`);
  console.log('═══════════════════════════════════════════');

  const db = new Database(DB_PATH);

  let successCount = 0;
  let failCount = 0;

  for (const lawName of PRIORITY_LAWS) {
    try {
      const success = await syncLaw(db, lawName);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      // API 부하 방지
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ 오류: ${lawName}`, error);
      failCount++;
    }
  }

  db.close();

  console.log('\n═══════════════════════════════════════════');
  console.log(`📊 동기화 완료`);
  console.log(`   성공: ${successCount}개`);
  console.log(`   실패: ${failCount}개`);
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
