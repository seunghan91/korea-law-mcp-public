/**
 * korea-law: Discover Sync
 *
 * 법제처 API에서 전체 법령 목록(리스트)을 가져와 DB와 비교하고,
 * 누락된 법령만 상세 동기화합니다.
 *
 * 사용법:
 *   pnpm sync:discover              # 누락 법령 발견 & 동기화
 *   pnpm sync:discover -- --dry-run # 누락 목록만 출력 (동기화 안 함)
 *   pnpm sync:discover -- --query "인공지능"  # 특정 키워드만 검색
 *
 * full-sync와 달리 기존 법령은 건드리지 않고 누락분만 처리합니다.
 */

import * as api from '../api/law-api';
import * as db from '../db/database';

const DB_PATH = process.env.KOREA_LAW_DB_PATH || './data/korea-law.db';

interface DiscoverOptions {
  dryRun: boolean;
  query?: string;
  maxPages: number;
  pageSize: number;
  apiDelay: number;
}

function parseArgs(): DiscoverOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    query: args.find((_, i, arr) => arr[i - 1] === '--query') || undefined,
    maxPages: 100,
    pageSize: 100,
    apiDelay: 300,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 법제처 API에서 법령 목록을 페이지네이션으로 전체 가져오기
 */
async function fetchAllLawList(options: DiscoverOptions): Promise<api.LawListItem[]> {
  const allLaws: api.LawListItem[] = [];

  if (options.query) {
    // 특정 키워드 검색
    console.log(`🔍 키워드 검색: "${options.query}"`);
    const results = await api.searchLaws(options.query, options.pageSize);
    allLaws.push(...results);
    console.log(`   ${results.length}건 발견`);
  } else {
    // 전체 목록: 가나다 순으로 페이지네이션
    // 법제처 API는 한번에 최대 100건, page 파라미터로 페이징
    console.log(`📋 전체 법령 목록 조회 중...`);

    // 한글 초성별로 검색 (가~하) — API가 빈 query를 허용하지 않을 수 있으므로
    const categories = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];

    for (const prefix of categories) {
      try {
        const results = await api.searchLaws(prefix, options.pageSize);
        if (results.length > 0) {
          allLaws.push(...results);
          console.log(`   ${prefix}: ${results.length}건`);
        }
        await delay(options.apiDelay);
      } catch (error) {
        console.error(`   ${prefix}: 오류 - ${error}`);
      }
    }
  }

  // 중복 제거 (MST ID 기준)
  const unique = new Map<string, api.LawListItem>();
  for (const law of allLaws) {
    const mstId = String(law.법령일련번호 || law.법령ID || '');
    if (mstId && !unique.has(mstId)) {
      unique.set(mstId, law);
    }
  }

  console.log(`\n📊 총 ${unique.size}건 (중복 제거 후)\n`);
  return Array.from(unique.values());
}

/**
 * DB에 없는 법령 식별
 */
function findMissingLaws(apiLaws: api.LawListItem[]): api.LawListItem[] {
  const missing: api.LawListItem[] = [];

  for (const law of apiLaws) {
    const mstId = String(law.법령일련번호 || law.법령ID || '');
    if (!mstId) continue;

    const existing = db.findLawByMstId(mstId);
    if (!existing) {
      missing.push(law);
    }
  }

  return missing;
}

/**
 * 누락 법령 상세 동기화
 */
async function syncMissingLaws(
  missingLaws: api.LawListItem[],
  options: DiscoverOptions
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const law of missingLaws) {
    const mstId = String(law.법령일련번호 || law.법령ID || '');
    const lawName = law.법령명한글 || '';

    try {
      console.log(`   🔄 ${lawName} (MST: ${mstId})`);

      // 상세 조회: MST + efYd 파라미터 사용 (법제처 API 요구사항)
      const enfDate = String(law.시행일자 || '');
      const detail = await fetchLawDetailByMst(mstId, enfDate);

      if (!detail) {
        console.log(`      ⚠️ 상세 조회 실패 — 스킵`);
        failed++;
        continue;
      }

      {
        const 기본 = detail.기본정보 || {} as any;

        // Laws 테이블 저장
        const lawRecord: db.LawRecord = {
          law_mst_id: mstId,
          law_name: 기본.법령명_한글 || lawName,
          law_name_eng: 기본.법령명_영문 || '',
          promulgation_date: formatDate(기본.공포일자),
          enforcement_date: formatDate(기본.시행일자),
          law_type: 기본.법령구분명 || String(law.법령구분명 || ''),
          ministry: 기본.소관부처명 || String(law.소관부처명 || ''),
          status: 'ACTIVE',
          source_url: `https://www.law.go.kr/lsInfoP.do?lsiSeq=${mstId}`,
        };

        const lawId = db.upsertLaw(lawRecord);

        // 조문 저장
        let articleCount = 0;
        if (detail.조문 && Array.isArray(detail.조문)) {
          for (const article of detail.조문) {
            const content = buildArticleContent(article);
            const articleRecord: db.ArticleRecord = {
              law_id: lawId,
              article_no: article.조문번호 || '',
              article_title: article.조문제목 || '',
              content: content,
              paragraph_count: countParagraphs(article),
              is_definition: (article.조문제목 || '').includes('정의'),
              effective_from: formatDate(기본.시행일자),
            };
            db.upsertArticle(articleRecord);
            articleCount++;
          }
        }

        console.log(`      ✅ 완료 (조문 ${articleCount}개)`);
        success++;
      }
    } catch (error) {
      console.error(`      ❌ 오류: ${error}`);
      failed++;
    }

    await delay(options.apiDelay);
  }

  return { success, failed };
}

// ============================================
// 법제처 API 직접 호출 (MST + efYd)
// ============================================

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  trimValues: true,
});

const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';

async function fetchLawDetailByMst(mstId: string, efYd: string): Promise<any | null> {
  try {
    const url = `http://www.law.go.kr/DRF/lawService.do`;
    const resp = await axios.get(url, {
      params: { OC: API_KEY, target: 'law', type: 'XML', MST: mstId, efYd: efYd },
      timeout: 30000,
    });

    const parsed = xmlParser.parse(resp.data);
    const law = parsed?.법령;
    if (!law || !law.기본정보) return null;

    // 조문 파싱
    const 조문목록 = law.조문 || {};
    const 조문단위 = 조문목록.조문단위;
    const articles: any[] = [];

    if (조문단위) {
      const arr = Array.isArray(조문단위) ? 조문단위 : [조문단위];
      for (const 조문 of arr) {
        articles.push({
          조문번호: String(조문.조문번호 || ''),
          조문제목: extractText(조문.조문제목),
          조문내용: extractText(조문.조문내용),
          항: 조문.항,
        });
      }
    }

    return { 기본정보: law.기본정보, 조문: articles };
  } catch (error) {
    return null;
  }
}

function extractText(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val['#text']) return String(val['#text']);
  return String(val);
}

// ============================================
// 헬퍼 함수
// ============================================

function formatDate(raw: any): string {
  if (!raw) return '';
  const s = String(raw);
  if (s.length === 8) {
    return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`;
  }
  return s;
}

function buildArticleContent(article: any): string {
  const parts: string[] = [];

  if (article.조문제목) {
    parts.push(`제${article.조문번호}조(${article.조문제목})`);
  }
  if (article.조문내용) {
    parts.push(typeof article.조문내용 === 'string' ? article.조문내용 : String(article.조문내용));
  }

  // 항 처리
  const 항 = article.항;
  if (항) {
    const 항배열 = Array.isArray(항) ? 항 : [항];
    for (const h of 항배열) {
      const 항내용 = h.항내용 || h.내용;
      if (항내용) {
        const text = typeof 항내용 === 'string' ? 항내용 : String(항내용);
        parts.push(text);
      }

      // 호 처리
      const 호 = h.호;
      if (호) {
        const 호배열 = Array.isArray(호) ? 호 : [호];
        for (const ho of 호배열) {
          const 호내용 = ho.호내용 || ho.내용;
          if (호내용) {
            parts.push(`  ${typeof 호내용 === 'string' ? 호내용 : String(호내용)}`);
          }
        }
      }
    }
  }

  return parts.join('\n');
}

function countParagraphs(article: any): number {
  const 항 = article.항;
  if (!항) return 0;
  return Array.isArray(항) ? 항.length : 1;
}

// ============================================
// 메인
// ============================================

async function main() {
  const options = parseArgs();
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════');
  console.log('🔍 korea-law Discover Sync');
  console.log(`   시간: ${new Date().toISOString()}`);
  console.log(`   모드: ${options.dryRun ? 'DRY RUN (목록만 출력)' : 'SYNC (누락분 동기화)'}`);
  if (options.query) console.log(`   키워드: "${options.query}"`);
  console.log('═══════════════════════════════════════════\n');

  // DB 초기화
  db.initDatabase();
  const currentCount = db.getDatabase().prepare('SELECT COUNT(*) as cnt FROM Laws').get() as any;
  console.log(`📦 현재 DB: ${currentCount.cnt}건\n`);

  // 1. 법제처에서 목록 가져오기
  const apiLaws = await fetchAllLawList(options);

  if (apiLaws.length === 0) {
    console.log('❌ 법령 목록을 가져오지 못했습니다.');
    process.exit(1);
  }

  // 2. DB와 비교 — 누락분 식별
  console.log('🔎 DB 비교 중...');
  const missing = findMissingLaws(apiLaws);
  console.log(`\n📋 누락 법령: ${missing.length}건 / 전체 ${apiLaws.length}건\n`);

  if (missing.length === 0) {
    console.log('✅ 모든 법령이 이미 동기화되어 있습니다.');
    process.exit(0);
  }

  // 누락 목록 출력
  console.log('── 누락 법령 목록 ──');
  for (const law of missing.slice(0, 50)) {
    const mstId = String(law.법령일련번호 || law.법령ID || '');
    const name = law.법령명한글 || '';
    const date = String(law.시행일자 || '');
    console.log(`  ${mstId.padEnd(8)} ${name.padEnd(40)} 시행: ${date}`);
  }
  if (missing.length > 50) {
    console.log(`  ... 외 ${missing.length - 50}건`);
  }
  console.log('');

  // 3. Dry run이면 여기서 종료
  if (options.dryRun) {
    console.log('🏁 Dry run 완료. --dry-run 제거하면 동기화를 실행합니다.');
    process.exit(0);
  }

  // 4. 누락분 동기화
  console.log('📥 누락 법령 동기화 시작...\n');
  const result = await syncMissingLaws(missing, options);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const afterCount = db.getDatabase().prepare('SELECT COUNT(*) as cnt FROM Laws').get() as any;

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 Discover Sync 완료');
  console.log(`   소요 시간: ${elapsed}초`);
  console.log(`   누락 발견: ${missing.length}건`);
  console.log(`   동기화 성공: ${result.success}건`);
  console.log(`   동기화 실패: ${result.failed}건`);
  console.log(`   DB 법령 수: ${currentCount.cnt} → ${afterCount.cnt}`);
  console.log('═══════════════════════════════════════════');
}

main().catch(error => {
  console.error('❌ Discover Sync 실패:', error);
  process.exit(1);
});
