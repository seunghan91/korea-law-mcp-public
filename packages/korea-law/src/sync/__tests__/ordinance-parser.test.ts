/**
 * ordinance-parser 단위 테스트
 *
 * 법제처 API 실제 응답 XML을 픽스처로 저장하고 파서가 구조화된
 * 데이터를 정확히 추출하는지 검증.
 *
 * 실행: pnpm --filter korea-law exec ts-node src/sync/__tests__/ordinance-parser.test.ts
 *
 * 픽스처:
 *   fixtures/ordinance-1941163-gwangjin-bokmu.xml
 *     서울특별시 광진구의회 지방공무원 복무 조례 (mst=1941163, 2024.06.27 시행)
 *     특징: 편장절 없는 단순 구조 (18 articles, 0 sections, 5 appendices)
 *
 *   fixtures/ordinance-2094319-gangnam-bokmu.xml
 *     서울특별시 강남구 지방공무원 복무 조례 (mst=2094319, 2025.12.19 시행)
 *     특징: 편장절 포함 구조 (18 articles, 2 sections, 5 appendices)
 *
 * 기대 결과: 18/18 체크 통과
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseOrdinanceXml, ParsedOrdinance } from '../ordinance-parser';

interface Check {
  name: string;
  pass: boolean;
  detail?: string;
}

function assert(name: string, condition: boolean, detail?: string): Check {
  return { name, pass: condition, detail };
}

function loadFixture(name: string): string {
  const fullPath = path.join(__dirname, 'fixtures', name);
  return fs.readFileSync(fullPath, 'utf-8');
}

function printResults(title: string, parsed: ParsedOrdinance, checks: Check[]): number {
  console.log(`\n=== ${title} ===`);
  console.log(
    `  meta: mst=${parsed.meta.mst} | ${parsed.meta.title} | ${parsed.meta.municipalityName} | ${parsed.meta.enforcementDate}`
  );
  console.log(
    `  counts: articles=${parsed.articles.length}, sections=${parsed.sections.length}, appendices=${parsed.appendices.length}`
  );

  let passed = 0;
  checks.forEach((c) => {
    const mark = c.pass ? '  ✓' : '  ✗';
    const detail = c.detail ? ` (${c.detail})` : '';
    console.log(`${mark} ${c.name}${detail}`);
    if (c.pass) passed++;
  });
  console.log(`  → ${passed}/${checks.length} passed`);
  return passed;
}

// ============================================
// Test 1: 광진구 복무 조례 (단순 구조)
// ============================================
function testGwangjin(): { total: number; passed: number } {
  const xml = loadFixture('ordinance-1941163-gwangjin-bokmu.xml');
  const p = parseOrdinanceXml(xml);

  const checks: Check[] = [
    assert('mst', p.meta.mst === '1941163'),
    assert('title', p.meta.title === '서울특별시 광진구의회 지방공무원 복무 조례'),
    assert('municipality_name', p.meta.municipalityName === '서울특별시 광진구'),
    assert('department', p.meta.department === '의회사무국 의정팀'),
    assert('promulgation_date ISO', p.meta.promulgationDate === '2024-06-27'),
    assert('enforcement_date ISO', p.meta.enforcementDate === '2024-06-27'),
    assert('revision_type', p.meta.revisionType === '전부개정'),
    assert('articles count == 18', p.articles.length === 18, `got ${p.articles.length}`),
    assert('sections count == 0 (편장절 없음)', p.sections.length === 0, `got ${p.sections.length}`),
    assert('appendices count == 5', p.appendices.length === 5),
    assert('제1조 == 목적', p.articles[0]?.articleNo === '제1조' && p.articles[0]?.articleTitle === '목적'),
    assert('제3조 == 책임완수', p.articles.find((a) => a.articleNo === '제3조')?.articleTitle === '책임완수'),
    assert('제18조 (마지막)', p.articles[p.articles.length - 1]?.articleNo === '제18조'),
    assert('별표1 == 선서문', !!p.appendices[0]?.title.match(/선서문/)),
    assert('별표4 == 경조사', !!p.appendices[3]?.title.match(/경조사/)),
    assert('별표 hwpx 포맷', p.appendices.every((a) => a.attachmentFormat === 'hwpx')),
    assert('addenda non-empty', p.addenda.length > 0),
    assert('revisionReason non-empty', (p.revisionReason?.length ?? 0) > 0),
  ];

  const passed = printResults('광진구 (mst=1941163)', p, checks);
  return { total: checks.length, passed };
}

// ============================================
// Test 2: 강남구 복무 조례 (편장절 포함 구조)
// ============================================
function testGangnam(): { total: number; passed: number } {
  const xml = loadFixture('ordinance-2094319-gangnam-bokmu.xml');
  const p = parseOrdinanceXml(xml);

  const checks: Check[] = [
    assert('mst', p.meta.mst === '2094319'),
    assert('title', p.meta.title === '서울특별시 강남구 지방공무원 복무 조례'),
    assert('municipality_name', p.meta.municipalityName === '서울특별시 강남구'),
    assert('enforcement_date ISO', p.meta.enforcementDate === '2025-12-19'),
    assert('articles count == 18', p.articles.length === 18, `got ${p.articles.length}`),
    assert('sections count > 0 (편장절 있음)', p.sections.length > 0, `got ${p.sections.length}`),
    assert('제1장 section 존재', p.sections.some((s) => s.label.includes('총칙')), p.sections.map((s) => s.label).join(' / ')),
    assert('제0조 article 없음 (조문여부=N 필터링)', !p.articles.some((a) => a.articleNo === '제0조')),
    assert('제1조 == 목적', p.articles[0]?.articleNo === '제1조' && p.articles[0]?.articleTitle === '목적'),
    assert('appendices count == 5', p.appendices.length === 5),
    assert('별표1 == 선서문', !!p.appendices[0]?.title.match(/선서문/)),
  ];

  const passed = printResults('강남구 (mst=2094319)', p, checks);
  return { total: checks.length, passed };
}

// ============================================
// Main
// ============================================
async function main() {
  console.log('ordinance-parser 단위 테스트 시작');

  const results = [testGwangjin(), testGangnam()];

  const total = results.reduce((sum, r) => sum + r.total, 0);
  const passed = results.reduce((sum, r) => sum + r.passed, 0);

  console.log(`\n==== 합계: ${passed}/${total} passed ====`);

  if (passed < total) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('테스트 실행 오류:', e);
  process.exit(1);
});
