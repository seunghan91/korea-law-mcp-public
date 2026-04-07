/**
 * 추가 법령 동기화 스크립트
 *
 * 테스트 데이터셋에 필요하지만 미동기화된 법령들을 동기화합니다.
 * - 상법 (재동기화)
 * - 도로교통법
 * - 개인정보보호법
 * - 전자상거래 등에서의 소비자보호에 관한 법률
 *
 * ⚠️ API 호출 시 Referer 헤더 필수!
 */

import 'dotenv/config';
import * as db from '../src/db/database';
import * as api from '../src/api/law-api';
import { format } from 'date-fns';

const ADDITIONAL_LAWS = [
  '상법',
  '도로교통법',
  '개인정보 보호법',  // 띄어쓰기 주의
  '전자상거래 등에서의 소비자보호에 관한 법률',
];

const API_DELAY = 1000; // 1초

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatApiDate(dateStr: string | number): string {
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

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

async function syncLaw(lawName: string): Promise<{
  articlesAdded: number;
  success: boolean;
}> {
  const stats = { articlesAdded: 0, success: false };

  try {
    console.log(`\n📜 동기화 중: ${lawName}`);

    // 1. API에서 법령 검색
    const searchResults = await api.searchLaws(lawName, 10);
    if (searchResults.length === 0) {
      console.log(`  ⚠️ "${lawName}" 검색 결과 없음`);
      return stats;
    }

    // 정확한 법령명 매칭
    const exactMatch = searchResults.find(r =>
      r.법령명한글 === lawName ||
      r.법령명한글.replace(/\s/g, '') === lawName.replace(/\s/g, '')
    );

    const targetLaw = exactMatch || searchResults[0];
    console.log(`  → 대상: ${targetLaw.법령명한글} (ID: ${targetLaw.법령ID})`);

    // 2. 법령 상세 정보 가져오기
    const lawDetail = await api.getLawDetail(targetLaw.법령ID);
    if (!lawDetail) {
      console.log(`  ⚠️ 상세 정보 조회 실패`);
      return stats;
    }

    // 3. 기존 데이터 삭제 (재동기화)
    const existingLaw = db.findLawByName(lawName);
    if (existingLaw && existingLaw.id) {
      const dbConn = db.getDatabase();
      dbConn.prepare('DELETE FROM Articles WHERE law_id = ?').run(existingLaw.id);
      dbConn.prepare('DELETE FROM Laws WHERE id = ?').run(existingLaw.id);
      console.log(`  🧹 기존 데이터 삭제됨`);
    }

    // 4. 법령 마스터 저장
    const lawRecord: db.LawRecord = {
      law_mst_id: String(lawDetail.기본정보.법령ID),
      law_name: lawDetail.기본정보.법령명_한글,
      law_name_eng: lawDetail.기본정보.법령명_영문,
      promulgation_date: formatApiDate(lawDetail.기본정보.공포일자),
      enforcement_date: formatApiDate(lawDetail.기본정보.시행일자),
      law_type: lawDetail.기본정보.법령구분명,
      ministry: lawDetail.기본정보.소관부처명,
      status: 'ACTIVE',
      source_url: `https://www.law.go.kr/법령/${encodeURIComponent(lawDetail.기본정보.법령명_한글)}`,
    };

    const lawId = db.upsertLaw(lawRecord);
    console.log(`  ✓ 법령 저장됨 (ID: ${lawId})`);

    // 5. 조문 저장
    for (const article of lawDetail.조문) {
      const articleNo = String(article.조문번호 || '');
      if (!articleNo || !/^\d/.test(articleNo)) continue;

      // 조문 내용 구성 (항/호/목 전체 포함)
      const content = buildFullArticleContent(article);

      const articleRecord: db.ArticleRecord = {
        law_id: lawId,
        article_no: articleNo,
        article_title: article.조문제목,
        content: content.trim(),
        paragraph_count: article.항 ? (Array.isArray(article.항) ? article.항.length : 1) : 1,
        is_definition: (article.조문제목 || '').includes('정의'),
        effective_from: formatApiDate(lawDetail.기본정보.시행일자),
      };

      db.upsertArticle(articleRecord);
      stats.articlesAdded++;
    }

    console.log(`  ✅ 완료: ${stats.articlesAdded}개 조항 저장됨`);
    stats.success = true;

  } catch (error) {
    console.error(`  ❌ 오류: ${error}`);
  }

  return stats;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('📦 추가 법령 동기화');
  console.log(`   시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log('═══════════════════════════════════════════');

  // DB 초기화
  db.initDatabase();

  const results: { law: string; articles: number; success: boolean }[] = [];

  for (const lawName of ADDITIONAL_LAWS) {
    const stats = await syncLaw(lawName);
    results.push({
      law: lawName,
      articles: stats.articlesAdded,
      success: stats.success,
    });
    await sleep(API_DELAY);
  }

  // 결과 출력
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 동기화 결과');
  console.log('═══════════════════════════════════════════');

  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.law}: ${r.articles}개 조항`);
  }

  const totalArticles = results.reduce((sum, r) => sum + r.articles, 0);
  const successCount = results.filter(r => r.success).length;

  console.log('───────────────────────────────────────────');
  console.log(`  총 ${successCount}/${results.length}개 법령, ${totalArticles}개 조항 동기화됨`);
  console.log('═══════════════════════════════════════════');

  db.closeDatabase();
}

main().catch(console.error);
