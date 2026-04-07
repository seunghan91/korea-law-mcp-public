const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/korea-law.db');
const db = new Database(dbPath);

// normalizeArticleNo 함수 (수정된 버전)
function normalizeArticleNo(articleNo) {
  const str = String(articleNo || '');
  return str
    .replace(/제/g, '')
    .replace(/조의/g, '의')
    .replace(/조/g, '')
    .replace(/항/g, '.')
    .replace(/호/g, '-')
    .trim();
}

// getArticleNoVariants 함수
function getArticleNoVariants(articleNo) {
  const str = String(articleNo || '').trim();
  const variants = [];

  variants.push(str);
  const withoutPrefix = str.replace(/^제/, '').replace(/조$/, '').replace(/조의/, '의');
  variants.push(withoutPrefix);

  const numbersOnly = str.replace(/[^0-9]/g, '');
  if (numbersOnly) {
    variants.push(numbersOnly);
  }

  return [...new Set(variants.filter(v => v.length > 0))];
}

// 테스트
console.log('=== 법령 검증 수정 테스트 ===\n');

const testCases = [
  { lawId: 153, lawName: '민법', articleNo: '제750조', expected: '불법행위' },
  { lawId: 153, lawName: '민법', articleNo: '750', expected: '불법행위' },
  { lawId: 426, lawName: '상법', articleNo: '제382조', expected: '이사의 선임' },
  { lawId: 426, lawName: '상법', articleNo: '382', expected: '이사의 선임' },
  { lawId: 426, lawName: '상법', articleNo: '제383조', expected: '임기' },
  { lawId: 426, lawName: '상법', articleNo: '383', expected: '임기' },
  { lawId: 426, lawName: '상법', articleNo: '제382조의4', expected: '비밀유지' },
  { lawId: 426, lawName: '상법', articleNo: '382의4', expected: '비밀유지' },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const variants = getArticleNoVariants(tc.articleNo);
  const normalized = normalizeArticleNo(tc.articleNo);

  let found = false;
  let result = null;

  // 정확한 매칭
  for (const variant of variants) {
    const stmt = db.prepare('SELECT * FROM Articles WHERE law_id = ? AND article_no = ? LIMIT 1');
    result = stmt.get(tc.lawId, variant);
    if (result) {
      found = true;
      break;
    }
  }

  if (!found) {
    // normalized 검색
    const stmt = db.prepare('SELECT * FROM Articles WHERE law_id = ? AND article_no_normalized = ? LIMIT 1');
    result = stmt.get(tc.lawId, normalized);
    if (result) found = true;
  }

  if (found && result) {
    const titleMatch = result.article_title && result.article_title.includes(tc.expected);
    const contentMatch = result.content && result.content.includes(tc.expected);
    if (titleMatch || contentMatch) {
      console.log('✅ PASS:', tc.lawName, tc.articleNo, '->', result.article_title);
      passed++;
    } else {
      console.log('❌ FAIL:', tc.lawName, tc.articleNo, '-> 내용 불일치:', result.article_title);
      failed++;
    }
  } else {
    console.log('❌ FAIL:', tc.lawName, tc.articleNo, '-> 찾을 수 없음');
    failed++;
  }
}

console.log(`\n=== 결과: ${passed} 성공, ${failed} 실패 ===`);

db.close();
