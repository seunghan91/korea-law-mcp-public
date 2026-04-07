/**
 * 전체 법령 일괄 동기화 스크립트
 * DB에 있는 모든 법령을 API에서 다시 가져와서 동기화
 *
 * - 조문가지번호 처리 (347 + 2 = "347의2")
 * - 장/절 제목(전문) 필터링
 * - 항 내용 결합
 */
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const Database = require('better-sqlite3');

const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const REFERER = process.env.KOREA_LAW_REFERER || 'https://ainote.dev';
const DB_PATH = process.env.KOREA_LAW_DB_PATH || './data/korea-law.db';

const db = new Database(DB_PATH);
const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: '__cdata' });

// API 호출 딜레이 (ms) - 서버 부하 방지를 위해 2초로 설정
const API_DELAY = 2000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function syncLaw(lawDbId, lawName, lawMstId) {
  // law_mst_id가 6자리 미만이면 앞에 0 채우기
  const paddedId = String(lawMstId).padStart(6, '0');

  try {
    const url = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=law&type=XML&ID=${paddedId}`;
    const response = await axios.get(url, {
      headers: { Referer: REFERER },
      timeout: 60000
    });
    const data = parser.parse(response.data);

    const law = data?.법령;
    if (!law) {
      return { success: false, reason: '법령 데이터 없음', articles: 0 };
    }

    const 조문들 = law?.조문?.조문단위;
    if (!조문들) {
      return { success: false, reason: '조문 없음', articles: 0 };
    }

    const articles = Array.isArray(조문들) ? 조문들 : [조문들];
    const now = new Date().toISOString();

    // 기존 조문 삭제
    db.prepare('DELETE FROM Articles WHERE law_id = ?').run(lawDbId);

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

    // 법령 업데이트 시간 갱신
    db.prepare('UPDATE Laws SET last_synced_at = ? WHERE id = ?').run(now, lawDbId);

    return { success: true, articles: count };
  } catch (error) {
    return { success: false, reason: error.message, articles: 0 };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📦 전체 법령 일괄 동기화');
  console.log('═══════════════════════════════════════════════════════════════');

  // DB에서 모든 법령 목록 가져오기
  const laws = db.prepare(`
    SELECT id, law_name, law_mst_id
    FROM Laws
    ORDER BY id
  `).all();

  console.log(`   대상: ${laws.length}개 법령\n`);

  let success = 0;
  let fail = 0;
  let totalArticles = 0;
  const failedLaws = [];

  for (let i = 0; i < laws.length; i++) {
    const law = laws[i];
    const progress = `[${String(i + 1).padStart(3, ' ')}/${laws.length}]`;

    process.stdout.write(`${progress} ${law.law_name.substring(0, 30).padEnd(30, ' ')} ... `);

    const result = await syncLaw(law.id, law.law_name, law.law_mst_id);

    if (result.success) {
      console.log(`✅ ${result.articles}개 조문`);
      success++;
      totalArticles += result.articles;
    } else {
      console.log(`❌ ${result.reason}`);
      fail++;
      failedLaws.push({ name: law.law_name, reason: result.reason });
    }

    // API 호출 제한 방지
    if (i < laws.length - 1) {
      await sleep(API_DELAY);
    }
  }

  db.close();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 완료: 성공 ${success}개, 실패 ${fail}개, 총 ${totalArticles}개 조문`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (failedLaws.length > 0) {
    console.log('\n❌ 실패한 법령:');
    failedLaws.forEach(law => console.log(`   - ${law.name}: ${law.reason}`));
  }
}

main().catch(console.error);
