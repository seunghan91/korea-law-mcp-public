/**
 * 시행예정법령 웹 스크래핑 동기화
 *
 * 국가법령정보센터 "시행예정법령" 탭에서 전체 목록을 스크래핑합니다.
 * API로는 조회 불가능한 시행예정 법령(인공지능기본법 등)을 포착합니다.
 *
 * 사용법:
 *   npx ts-node scripts/scrape-pending-laws.ts
 *
 * 필요 패키지:
 *   npm install playwright
 */

import { chromium, Browser, Page } from 'playwright';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../data/korea-law.db');
// 최신법령 페이지 (탭 클릭으로 시행예정법령으로 이동)
const BASE_URL = 'https://www.law.go.kr/lsSc.do?menuId=1&subMenuId=23&tabMenuId=121';

interface PendingLaw {
  law_name: string;
  enforcement_date: string;  // YYYY-MM-DD or '미정'
  law_type: string;          // 법률, 대통령령, 부령 등
  promulgation_no: string;   // 공포번호
  promulgation_date: string; // YYYY-MM-DD
  revision_type: string;     // 제정, 일부개정 등
  ministry: string;          // 소관부처
}

// DB 테이블 생성
function ensureTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ScrapedPendingLaws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      law_name TEXT NOT NULL,
      enforcement_date TEXT,
      law_type TEXT,
      promulgation_no TEXT,
      promulgation_date TEXT,
      revision_type TEXT,
      ministry TEXT,
      days_until_effective INTEGER,
      scraped_at TEXT DEFAULT (datetime('now')),
      UNIQUE(law_name, promulgation_no)
    );

    CREATE INDEX IF NOT EXISTS idx_scraped_enforcement ON ScrapedPendingLaws(enforcement_date);
    CREATE INDEX IF NOT EXISTS idx_scraped_ministry ON ScrapedPendingLaws(ministry);
  `);
}

// 시행일까지 남은 일수 계산
function calculateDaysUntil(dateStr: string): number | null {
  if (!dateStr || dateStr === '미정') return null;

  // YYYY. M. D. 또는 YYYY-MM-DD 형식 처리
  const cleaned = dateStr.replace(/\./g, '-').replace(/\s/g, '').replace(/-+/g, '-');
  const parts = cleaned.split('-').filter(p => p);

  if (parts.length !== 3) return null;

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);

  const effectiveDate = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = effectiveDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// 날짜 형식 정규화 (YYYY-MM-DD)
function normalizeDate(dateStr: string): string {
  if (!dateStr || dateStr === '미정') return dateStr;

  const cleaned = dateStr.replace(/\./g, '-').replace(/\s/g, '').replace(/-+/g, '-');
  const parts = cleaned.split('-').filter(p => p);

  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const month = parts[1].padStart(2, '0');
  const day = parts[2].padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// 페이지에서 법령 목록 추출
// 테이블 컬럼 구조:
// [0] 번호, [1] 법령명, [2] 시행일자, [3] 법령종류, [4] 공포번호, [5] 공포일자, [6] 제정·개정구분, [7] 소관부처
async function extractLawsFromPage(page: Page): Promise<PendingLaw[]> {
  // @ts-ignore - page.evaluate runs in browser context
  return await page.evaluate(() => {
    const laws: any[] = [];
    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach((row: any) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 8) {
        // 법령명은 a 태그 안에 있을 수 있음
        const lawNameEl = cells[1]?.querySelector('a') || cells[1];
        const lawName = lawNameEl?.textContent?.trim() || '';

        if (lawName) {
          laws.push({
            law_name: lawName,
            enforcement_date: cells[2]?.textContent?.trim() || '',  // 시행일자 (미정 또는 날짜)
            law_type: cells[3]?.textContent?.trim() || '',          // 법령종류
            promulgation_no: cells[4]?.textContent?.trim() || '',   // 공포번호
            promulgation_date: cells[5]?.textContent?.trim() || '', // 공포일자
            revision_type: cells[6]?.textContent?.trim() || '',     // 제정·개정구분
            ministry: cells[7]?.textContent?.trim() || '',          // 소관부처
          });
        }
      }
    });

    return laws;
  });
}

// DB에 저장
function savePendingLaw(db: Database.Database, law: PendingLaw): boolean {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO ScrapedPendingLaws (
        law_name, enforcement_date, law_type, promulgation_no,
        promulgation_date, revision_type, ministry, days_until_effective, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const normalizedEnfDate = normalizeDate(law.enforcement_date);
    const daysUntil = calculateDaysUntil(law.enforcement_date);

    stmt.run(
      law.law_name,
      normalizedEnfDate,
      law.law_type,
      law.promulgation_no,
      normalizeDate(law.promulgation_date),
      law.revision_type,
      law.ministry,
      daysUntil
    );

    return true;
  } catch (error) {
    console.error(`저장 실패 (${law.law_name}):`, error);
    return false;
  }
}

// 메인 스크래핑 함수
async function scrapePendingLaws() {
  const db = new Database(DB_PATH);
  ensureTable(db);

  console.log('🌐 시행예정법령 웹 스크래핑 시작\n');

  let browser: Browser | null = null;

  try {
    // 브라우저 실행
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    // 법령정보센터 최신법령 페이지 접속
    console.log('📄 법령정보센터 접속 중...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 시행예정법령 탭 클릭 (#tab3)
    console.log('🔘 시행예정법령 탭 클릭...');
    await page.click('#tab3');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 전체 건수 확인 (페이지에서 "총 784건" 형식으로 표시)
    const bodyText = await page.textContent('body') || '';
    const totalMatch = bodyText.match(/총\s*(\d+)건/);
    const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0;
    console.log(`📋 전체 시행예정법령: ${totalCount}건\n`);

    // 표시 건수를 150개로 변경하여 페이지 수 최소화 (#outMaxWide 선택자)
    console.log('📊 표시 건수 150개로 설정...');
    await page.selectOption('#outMaxWide', '150');
    await page.waitForTimeout(500);
    // 선택 버튼 클릭하여 설정 적용
    await page.evaluate(() => {
      const btn = document.querySelector('input[type="button"][value="선택"]') as HTMLInputElement;
      if (btn) btn.click();
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);  // 설정 적용 대기

    const allLaws: PendingLaw[] = [];
    let pageNum = 1;
    let prevCount = 0;

    // 모든 법령을 추출할 때까지 페이지 순회
    while (allLaws.length < totalCount && pageNum <= 20) {
      console.log(`📖 페이지 ${pageNum} 스크래핑 중...`);

      // 현재 페이지 법령 추출
      const laws = await extractLawsFromPage(page);
      console.log(`   → ${laws.length}건 추출 (누적: ${allLaws.length + laws.length}/${totalCount})`);

      if (laws.length === 0) {
        console.log('⚠️ 추출된 법령이 없습니다. 중단.');
        break;
      }

      allLaws.push(...laws);

      // 다음 페이지가 필요한 경우
      if (allLaws.length < totalCount) {
        pageNum++;
        await page.evaluate((nextPage: number) => {
          // movePage는 브라우저 컨텍스트에서 정의된 함수
          const win = window as any;
          if (typeof win.movePage === 'function') {
            win.movePage(nextPage.toString());
          }
        }, pageNum);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      } else {
        break;
      }
    }

    // DB 저장
    console.log(`\n💾 DB 저장 중... (${allLaws.length}건)`);

    // 기존 데이터 삭제 (최신 스크래핑으로 교체)
    db.exec('DELETE FROM ScrapedPendingLaws');

    let saved = 0;
    for (const law of allLaws) {
      if (savePendingLaw(db, law)) {
        saved++;
      }
    }

    // 결과 출력
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 스크래핑 결과\n');
    console.log(`  전체 추출: ${allLaws.length}건`);
    console.log(`  DB 저장: ${saved}건`);

    // 주요 법령 출력
    const importantLaws = db.prepare(`
      SELECT law_name, enforcement_date, days_until_effective, ministry
      FROM ScrapedPendingLaws
      WHERE days_until_effective IS NOT NULL
      ORDER BY days_until_effective ASC
      LIMIT 20
    `).all() as any[];

    if (importantLaws.length > 0) {
      console.log(`\n📋 시행 임박 법령 (상위 20건):`);
      importantLaws.forEach((law, i) => {
        const days = law.days_until_effective;
        const daysText = days > 0 ? `${days}일 후` : (days === 0 ? '오늘' : `${Math.abs(days)}일 전`);
        console.log(`  ${i + 1}. ${law.law_name}`);
        console.log(`     시행일: ${law.enforcement_date} (${daysText}) | ${law.ministry}`);
      });
    }

    // 인공지능 관련 법령 확인
    const aiLaws = db.prepare(`
      SELECT law_name, enforcement_date, days_until_effective
      FROM ScrapedPendingLaws
      WHERE law_name LIKE '%인공지능%'
    `).all() as any[];

    if (aiLaws.length > 0) {
      console.log(`\n🤖 인공지능 관련 시행예정 법령:`);
      aiLaws.forEach(law => {
        console.log(`  - ${law.law_name} (시행: ${law.enforcement_date})`);
      });
    }

  } catch (error) {
    console.error('❌ 스크래핑 실패:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
    db.close();
  }

  console.log('\n✅ 스크래핑 완료');
}

// 실행
scrapePendingLaws().catch(console.error);
