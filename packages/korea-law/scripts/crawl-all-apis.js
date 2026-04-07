/**
 * 국가법령정보 OPEN API 스펙 크롤러
 * Playwright를 사용하여 모든 API 스펙을 자동으로 수집
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../docs/api-specs/crawled');

async function extractApiSpec(page, index) {
  return await page.evaluate((idx) => {
    const h3s = document.querySelectorAll('h3');
    let apiName = '';
    h3s.forEach((h3) => {
      const text = h3.textContent || '';
      if (text.includes('API') || text.includes('가이드') || text.includes('조회')) {
        apiName = text.trim();
      }
    });

    const dts = document.querySelectorAll('dt');
    let requestUrl = '';
    dts.forEach((dt) => {
      if (dt.textContent && dt.textContent.includes('요청 URL')) {
        requestUrl = dt.textContent.replace('- 요청 URL :', '').trim();
      }
    });

    const tables = document.querySelectorAll('table');
    const requestParams = [];
    const responseFields = [];
    const sampleUrls = [];

    tables.forEach((table) => {
      const headers = Array.from(table.querySelectorAll('th')).map((th) =>
        (th.textContent || '').trim()
      );
      const rows = table.querySelectorAll('tbody tr');

      if (headers.includes('요청변수')) {
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            requestParams.push({
              name: (cells[0].textContent || '').trim(),
              type: (cells[1].textContent || '').trim(),
              description: (cells[2].textContent || '').trim().replace(/\s+/g, ' '),
            });
          }
        });
      } else if (headers.includes('필드')) {
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            responseFields.push({
              name: (cells[0].textContent || '').trim(),
              type: (cells[1].textContent || '').trim(),
              description: (cells[2].textContent || '').trim(),
            });
          }
        });
      } else {
        rows.forEach((row) => {
          const link = row.querySelector('a');
          if (link && link.href && link.href.includes('law.go.kr')) {
            const prevRow = row.previousElementSibling;
            const desc = prevRow ? (prevRow.textContent || '').trim() : '';
            sampleUrls.push({ description: desc, url: link.href });
          }
        });
      }
    });

    let target = '';
    const targetMatch = requestUrl.match(/target=(\w+)/);
    if (targetMatch) target = targetMatch[1];

    return {
      index: idx,
      name: apiName,
      target: target,
      requestUrl: requestUrl,
      requestParams: requestParams,
      responseFields: responseFields,
      sampleUrls: sampleUrls,
      crawledAt: new Date().toISOString(),
    };
  }, index);
}

async function crawlAllApis() {
  console.log('🚀 API 크롤링 시작...\n');

  // 출력 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const allSpecs = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    // 목록 페이지로 이동
    console.log('📄 목록 페이지 로딩...');
    await page.goto('https://open.law.go.kr/LSO/openApi/guideList.do', {
      waitUntil: 'domcontentloaded',
    });

    // 모든 API 링크 수집
    const apiLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('table tbody a');
      return Array.from(links).map((link) => ({
        text: (link.textContent || '').trim().replace(/\s+/g, ' '),
      }));
    });

    console.log(`✅ 총 ${apiLinks.length}개 API 발견\n`);

    // 각 API 크롤링
    for (let i = 0; i < apiLinks.length; i++) {
      const linkInfo = apiLinks[i];

      try {
        // 목록 페이지 확인 및 이동
        if (!page.url().includes('guideList.do')) {
          await page.goto('https://open.law.go.kr/LSO/openApi/guideList.do', {
            waitUntil: 'domcontentloaded',
          });
        }

        // i번째 링크 클릭
        const links = await page.locator('table tbody a').all();
        await links[i].click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(300);

        // 스펙 추출
        const spec = await extractApiSpec(page, i);
        allSpecs.push(spec);
        successCount++;

        // 진행상황 출력
        const progress = (((i + 1) / apiLinks.length) * 100).toFixed(1);
        console.log(
          `[${progress}%] ${i + 1}/${apiLinks.length}: ${spec.name || linkInfo.text} (${spec.target})`
        );

        // 개별 파일로도 저장
        const filename = `${String(i).padStart(3, '0')}-${spec.target || 'unknown'}.json`;
        fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(spec, null, 2), 'utf-8');
      } catch (err) {
        errorCount++;
        console.error(`❌ [${i}] ${linkInfo.text} 크롤링 실패:`, err.message);
        allSpecs.push({
          index: i,
          name: linkInfo.text,
          target: '',
          requestUrl: '',
          requestParams: [],
          responseFields: [],
          sampleUrls: [],
          crawledAt: new Date().toISOString(),
        });
      }

      // 중간 저장 (10개마다)
      if ((i + 1) % 10 === 0) {
        fs.writeFileSync(
          path.join(OUTPUT_DIR, '_all-specs.json'),
          JSON.stringify(allSpecs, null, 2),
          'utf-8'
        );
      }
    }

    // 최종 저장
    fs.writeFileSync(
      path.join(OUTPUT_DIR, '_all-specs.json'),
      JSON.stringify(allSpecs, null, 2),
      'utf-8'
    );

    console.log(`\n✅ 크롤링 완료!`);
    console.log(`   - 성공: ${successCount}개`);
    console.log(`   - 실패: ${errorCount}개`);
    console.log(`   - 저장 위치: ${OUTPUT_DIR}`);
  } catch (err) {
    console.error('크롤링 중 오류 발생:', err);
  } finally {
    await browser.close();
  }
}

// 실행
crawlAllApis().catch(console.error);



