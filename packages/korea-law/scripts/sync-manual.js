/**
 * 수동 법령 동기화 스크립트
 * 검색으로 정확히 매칭되지 않는 법령을 법령ID로 직접 동기화
 *
 * ============================================
 * 📋 사용 목적
 * ============================================
 *
 * 국가법령정보센터 API는 법령명 검색 시 부분 매칭을 사용하므로,
 * "헌법"으로 검색하면 "헌법재판소법" 등이 먼저 나올 수 있습니다.
 * 이런 경우 법령ID를 직접 지정하여 동기화합니다.
 *
 * ============================================
 * 🔧 실행 방법
 * ============================================
 *
 *   node scripts/sync-manual.js
 *
 * ============================================
 * 📋 동기화 이력
 * ============================================
 *
 * [2025-12-17] 초기 생성
 *   - 대한민국헌법 (001444): 148조
 *   - 상법 (001702): 935조
 *   - 특허법 (001455): 232조
 *
 * ============================================
 * 🔍 법령ID 찾는 방법
 * ============================================
 *
 * 1. 국가법령정보센터(law.go.kr)에서 법령 검색
 * 2. URL에서 법령ID 확인: law.go.kr/법령/민법 → ID=001706
 * 3. 또는 API 검색 후 결과에서 확인:
 *    curl -H "Referer: https://ainote.dev" \
 *      "http://www.law.go.kr/DRF/lawSearch.do?OC=theqwe2000&target=law&type=XML&query=민법"
 *
 * ============================================
 * ⚠️ 주의사항
 * ============================================
 *
 * - 환경변수 필수: KOREA_LAW_API_KEY, KOREA_LAW_REFERER
 * - Referer 헤더 없으면 "미신청된 목록/본문" 에러 발생
 */
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const Database = require('better-sqlite3');

const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const REFERER = process.env.KOREA_LAW_REFERER || 'https://ainote.dev';
const DB_PATH = process.env.KOREA_LAW_DB_PATH || './data/korea-law.db';

const db = new Database(DB_PATH);
const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: '__cdata' });

/**
 * XML 텍스트 콘텐츠 추출 (CDATA 등 처리)
 */
function extractTextContent(content) {
  if (typeof content === 'string') return content.trim();
  if (content?.__cdata) return String(content.__cdata).trim();
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
function buildFullArticleContent(article) {
  const parts = [];

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

// 직접 동기화할 법령 목록 (검색 매칭이 어려운 법령들)
const LAWS_TO_SYNC = [
  { name: '대한민국헌법', id: '001444' },
  { name: '민법', id: '001706' },
  { name: '형법', id: '001692' },
  { name: '상법', id: '001702' },
  { name: '민사소송법', id: '001700' },
  { name: '형사소송법', id: '001671' },
  { name: '근로기준법', id: '001872' },
  { name: '특허법', id: '001455' },
  { name: '가상자산 이용자 보호 등에 관한 법률', id: '014474' },
];

async function syncLaw(lawName, lawId) {
  console.log(`\n📜 동기화: ${lawName} (ID: ${lawId})`);

  try {
    const url = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=law&type=XML&ID=${lawId}`;
    const response = await axios.get(url, {
      headers: { Referer: REFERER },
      timeout: 60000
    });
    const data = parser.parse(response.data);

    const law = data?.법령;
    if (!law) {
      console.log('  ❌ 법령 데이터 없음');
      return false;
    }

    const 조문들 = law?.조문?.조문단위;
    if (!조문들) {
      console.log('  ❌ 조문 없음');
      return false;
    }

    const articles = Array.isArray(조문들) ? 조문들 : [조문들];
    console.log(`  조문 수: ${articles.length}개`);

    // DB에 법령 저장
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM Laws WHERE law_name = ?').get(lawName);

    let lawDbId;
    if (existing) {
      lawDbId = existing.id;
      db.prepare('UPDATE Laws SET last_synced_at = ? WHERE id = ?').run(now, lawDbId);
      console.log(`  기존 법령 업데이트 (ID: ${lawDbId})`);
    } else {
      const result = db.prepare(`
        INSERT INTO Laws (law_mst_id, law_name, promulgation_date, enforcement_date, status, last_synced_at, created_at)
        VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)
      `).run(lawId, lawName, now.split('T')[0], now.split('T')[0], now, now);
      lawDbId = result.lastInsertRowid;
      console.log(`  새 법령 추가 (ID: ${lawDbId})`);
    }

    // 조문 저장
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO Articles (law_id, article_no, article_title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const art of articles) {
      // 조문여부가 '전문'이면 장/절 제목이므로 건너뛰기
      const 조문여부 = art?.조문여부 || '';
      if (조문여부 === '전문') continue;

      const baseNo = art?.조문번호 || '';
      const branchNo = art?.조문가지번호 || '';
      // 조문번호 + 가지번호 조합: 347 + 2 = "347의2"
      const articleNo = branchNo ? `${baseNo}의${branchNo}` : String(baseNo);

      const articleTitle = art?.조문제목?.__cdata || art?.조문제목 || '';

      // 조문내용 + 항/호/목 전체 내용 결합
      const content = buildFullArticleContent(art);

      if (articleNo && content) {
        try {
          insertStmt.run(lawDbId, articleNo, articleTitle, content.trim(), now, now);
          count++;
        } catch (e) {
          // 중복 무시
        }
      }
    }

    console.log(`  ✅ 완료: ${count}개 조문 저장`);
    return true;
  } catch (error) {
    console.log(`  ❌ 오류: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('📦 수동 법령 동기화');
  console.log(`   대상: ${LAWS_TO_SYNC.length}개 법령`);
  console.log('═══════════════════════════════════════════');

  let success = 0;
  let fail = 0;

  for (const law of LAWS_TO_SYNC) {
    const result = await syncLaw(law.name, law.id);
    if (result) success++;
    else fail++;
    await new Promise(r => setTimeout(r, 1000));
  }

  db.close();

  console.log('\n═══════════════════════════════════════════');
  console.log(`📊 완료: 성공 ${success}개, 실패 ${fail}개`);
  console.log('═══════════════════════════════════════════');
}

main();
