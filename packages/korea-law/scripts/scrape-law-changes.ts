/**
 * 법령 변경사항 통합 웹 스크래핑
 *
 * 국가법령정보센터에서 다음 카테고리를 스크래핑합니다:
 * - 시행예정법령 (tab3): 공포되었으나 아직 시행되지 않은 법령
 * - 폐지법령 (tab4): 폐지된 법령
 * - 한시법령 (tab5): 유효기간이 정해진 법령
 * - 한시조문 (tab6): 유효기간이 정해진 조문
 * - 위헌조문 (tab7): 위헌 결정된 조문
 *
 * 사용법:
 *   npx ts-node --project scripts/tsconfig.json scripts/scrape-law-changes.ts [--category all|pending|abolished|temporary|unconstitutional]
 *
 * 필요 패키지:
 *   npm install playwright better-sqlite3
 */

import { chromium, Browser, Page } from 'playwright';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../data/korea-law.db');
const BASE_URL = 'https://www.law.go.kr/lsSc.do?menuId=1&subMenuId=23&tabMenuId=121';

// 스크래핑 카테고리 정의
interface CategoryConfig {
  tabId: string;
  name: string;
  tableName: string;
  dateColumn: string;        // 날짜 컬럼명 (시행일자, 폐지일자, 실효일자)
  hasArticleTitle: boolean;  // 조문제목 컬럼 존재 여부
  maxPages: number;          // 최대 페이지 수 (폐지법령은 많으므로 제한)
}

const CATEGORIES: Record<string, CategoryConfig> = {
  pending: {
    tabId: 'tab3',
    name: '시행예정법령',
    tableName: 'LawChangesPending',
    dateColumn: 'effective_date',
    hasArticleTitle: false,
    maxPages: 20
  },
  abolished: {
    tabId: 'tab4',
    name: '폐지법령',
    tableName: 'LawChangesAbolished',
    dateColumn: 'abolition_date',
    hasArticleTitle: false,
    maxPages: 10  // 5,800건이므로 최근 것만
  },
  temporary_law: {
    tabId: 'tab5',
    name: '한시법령',
    tableName: 'LawChangesTemporary',
    dateColumn: 'expiration_date',
    hasArticleTitle: false,
    maxPages: 5
  },
  temporary_article: {
    tabId: 'tab6',
    name: '한시조문',
    tableName: 'LawChangesTemporaryArticle',
    dateColumn: 'expiration_date',
    hasArticleTitle: true,
    maxPages: 10
  },
  unconstitutional: {
    tabId: 'tab7',
    name: '위헌조문',
    tableName: 'LawChangesUnconstitutional',
    dateColumn: 'decision_date',
    hasArticleTitle: true,
    maxPages: 5
  }
};

interface LawRecord {
  law_name: string;
  article_title?: string;     // 조문제목 (한시조문, 위헌조문만)
  target_date: string;        // 시행일자/폐지일자/실효일자
  law_type: string;
  promulgation_no: string;
  promulgation_date: string;
  revision_type?: string;     // 제정·개정구분 (조문 카테고리는 없음)
  ministry: string;
}

// DB 테이블 생성
function ensureTables(db: Database.Database): void {
  // 기존 테이블이 있으면 삭제 후 재생성 (스키마 변경 대응)
  db.exec(`DROP TABLE IF EXISTS LawChanges`);

  // 통합 법령 변경 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS LawChanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      law_name TEXT NOT NULL,
      article_title TEXT DEFAULT '',
      target_date TEXT,
      law_type TEXT,
      promulgation_no TEXT,
      promulgation_date TEXT,
      revision_type TEXT,
      ministry TEXT,
      days_until_target INTEGER,
      scraped_at TEXT DEFAULT (datetime('now')),
      UNIQUE(category, law_name, promulgation_no, article_title)
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_law_changes_category ON LawChanges(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_law_changes_target_date ON LawChanges(target_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_law_changes_days ON LawChanges(days_until_target)`);
}

// 날짜 형식 정규화
function normalizeDate(dateStr: string): string {
  if (!dateStr || dateStr === '미정' || dateStr === '미정.') return '미정';

  const cleaned = dateStr.replace(/\./g, '-').replace(/\s/g, '').replace(/-+/g, '-').replace(/-$/, '');
  const parts = cleaned.split('-').filter(p => p);

  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const month = parts[1].padStart(2, '0');
  const day = parts[2].padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// 목표일까지 남은 일수 계산
function calculateDaysUntil(dateStr: string): number | null {
  if (!dateStr || dateStr === '미정') return null;

  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);

  const targetDate = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// 페이지에서 법령 목록 추출
async function extractLawsFromPage(page: Page, hasArticleTitle: boolean): Promise<LawRecord[]> {
  return await page.evaluate((hasArticle: boolean) => {
    const laws: any[] = [];
    const rows = document.querySelectorAll('table tbody tr');

    rows.forEach((row: any) => {
      const cells = row.querySelectorAll('td');
      const minCells = hasArticle ? 8 : 8;

      if (cells.length >= minCells) {
        const lawNameEl = cells[1]?.querySelector('a') || cells[1];
        const lawName = lawNameEl?.textContent?.trim() || '';

        if (lawName) {
          if (hasArticle) {
            // 조문 카테고리: 번호, 법령명, 조문제목, 날짜, 법령종류, 공포번호, 공포일자, 소관부처
            laws.push({
              law_name: lawName,
              article_title: cells[2]?.textContent?.trim() || '',
              target_date: cells[3]?.textContent?.trim() || '',
              law_type: cells[4]?.textContent?.trim() || '',
              promulgation_no: cells[5]?.textContent?.trim() || '',
              promulgation_date: cells[6]?.textContent?.trim() || '',
              ministry: cells[7]?.textContent?.trim() || '',
            });
          } else {
            // 법령 카테고리: 번호, 법령명, 날짜, 법령종류, 공포번호, 공포일자, 제정·개정구분, 소관부처
            laws.push({
              law_name: lawName,
              target_date: cells[2]?.textContent?.trim() || '',
              law_type: cells[3]?.textContent?.trim() || '',
              promulgation_no: cells[4]?.textContent?.trim() || '',
              promulgation_date: cells[5]?.textContent?.trim() || '',
              revision_type: cells[6]?.textContent?.trim() || '',
              ministry: cells[7]?.textContent?.trim() || '',
            });
          }
        }
      }
    });

    return laws;
  }, hasArticleTitle);
}

// DB에 저장
function saveLawRecord(db: Database.Database, category: string, law: LawRecord): boolean {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO LawChanges (
        category, law_name, article_title, target_date, law_type,
        promulgation_no, promulgation_date, revision_type, ministry,
        days_until_target, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const normalizedDate = normalizeDate(law.target_date);
    const daysUntil = calculateDaysUntil(normalizedDate);

    stmt.run(
      category,
      law.law_name,
      law.article_title || '',
      normalizedDate,
      law.law_type,
      law.promulgation_no,
      normalizeDate(law.promulgation_date),
      law.revision_type || '',
      law.ministry,
      daysUntil
    );

    return true;
  } catch (error) {
    console.error(`  저장 실패 (${law.law_name}):`, error);
    return false;
  }
}

// 단일 카테고리 스크래핑
async function scrapeCategory(
  page: Page,
  db: Database.Database,
  config: CategoryConfig
): Promise<{ total: number; saved: number }> {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📂 ${config.name} 스크래핑 시작`);

  // 탭 클릭 및 로딩 대기
  await page.click(`#${config.tabId}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);  // 탭 전환 후 충분히 대기

  // 전체 건수 확인 (탭 제목 근처에서 확인)
  let totalCount = 0;
  try {
    // 활성 탭 영역에서 총 건수 추출
    const totalElement = await page.$('.tab_cont_wrap .result, .list_top');
    if (totalElement) {
      const totalText = await totalElement.textContent() || '';
      const match = totalText.match(/총\s*[\d,]+건/);
      if (match) {
        totalCount = parseInt(match[0].replace(/[^\d]/g, ''));
      }
    }

    // 못 찾으면 body에서 찾기
    if (totalCount === 0) {
      const bodyText = await page.textContent('body') || '';
      // 첫 번째 "총 N건" 패턴 찾기
      const matches = bodyText.match(/총\s*([\d,]+)건/g);
      if (matches && matches.length > 0) {
        // 여러 개 있으면 테이블 근처 것 사용
        const numMatch = matches[0].match(/[\d,]+/);
        if (numMatch) {
          totalCount = parseInt(numMatch[0].replace(/,/g, ''));
        }
      }
    }
  } catch (e) {
    console.log('   (총 건수 확인 실패)');
  }

  console.log(`   총 ${totalCount.toLocaleString()}건`);

  // 표시 건수 150개로 설정
  try {
    await page.selectOption('#outMaxWide', '150');
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const btn = document.querySelector('input[type="button"][value="선택"]') as HTMLInputElement;
      if (btn) btn.click();
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('   (표시 건수 변경 생략)');
  }

  const allLaws: LawRecord[] = [];
  let pageNum = 1;

  // 모든 페이지 순회
  while (allLaws.length < totalCount && pageNum <= config.maxPages) {
    console.log(`   페이지 ${pageNum} 스크래핑...`);

    const laws = await extractLawsFromPage(page, config.hasArticleTitle);

    if (laws.length === 0) {
      console.log('   → 추출된 항목 없음, 중단');
      break;
    }

    console.log(`   → ${laws.length}건 추출 (누적: ${allLaws.length + laws.length})`);
    allLaws.push(...laws);

    // 다음 페이지로 이동
    if (allLaws.length < totalCount && pageNum < config.maxPages) {
      pageNum++;
      await page.evaluate((nextPage: number) => {
        const win = window as any;
        if (typeof win.movePage === 'function') {
          win.movePage(nextPage.toString());
        }
      }, pageNum);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    } else {
      break;
    }
  }

  // DB 저장
  console.log(`   💾 DB 저장 중...`);

  // 해당 카테고리 기존 데이터 삭제
  db.exec(`DELETE FROM LawChanges WHERE category = '${config.name}'`);

  let saved = 0;
  for (const law of allLaws) {
    if (saveLawRecord(db, config.name, law)) {
      saved++;
    }
  }

  console.log(`   ✅ ${saved}건 저장 완료`);

  return { total: allLaws.length, saved };
}

// 메인 스크래핑 함수
async function scrapeLawChanges(targetCategories: string[]) {
  const db = new Database(DB_PATH);
  ensureTables(db);

  console.log('🌐 법령 변경사항 통합 스크래핑 시작');
  console.log(`📅 기준일: ${new Date().toISOString().split('T')[0]}`);
  console.log(`📋 대상 카테고리: ${targetCategories.join(', ')}`);

  let browser: Browser | null = null;
  const results: Record<string, { total: number; saved: number }> = {};

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    // 법령정보센터 접속
    console.log('\n📄 법령정보센터 접속 중...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 각 카테고리 스크래핑
    for (const catKey of targetCategories) {
      const config = CATEGORIES[catKey];
      if (config) {
        results[config.name] = await scrapeCategory(page, db, config);
      }
    }

  } catch (error) {
    console.error('❌ 스크래핑 실패:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 결과 요약
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 스크래핑 결과 요약\n');

  let grandTotal = 0;
  for (const [name, result] of Object.entries(results)) {
    console.log(`  ${name}: ${result.saved}건 저장`);
    grandTotal += result.saved;
  }
  console.log(`\n  총계: ${grandTotal}건`);

  // 주요 통계 출력
  console.log(`\n📋 주요 법령 현황:`);

  // 시행 임박 법령 (30일 이내)
  const urgentLaws = db.prepare(`
    SELECT law_name, target_date, days_until_target, category
    FROM LawChanges
    WHERE category = '시행예정법령'
      AND days_until_target IS NOT NULL
      AND days_until_target BETWEEN 0 AND 30
    ORDER BY days_until_target ASC
    LIMIT 10
  `).all() as any[];

  if (urgentLaws.length > 0) {
    console.log(`\n  🚨 30일 이내 시행 예정 (상위 10건):`);
    urgentLaws.forEach((law, i) => {
      const days = law.days_until_target;
      const daysText = days === 0 ? '오늘' : `${days}일 후`;
      console.log(`     ${i + 1}. ${law.law_name} (${daysText})`);
    });
  }

  // 인공지능 관련 법령
  const aiLaws = db.prepare(`
    SELECT law_name, target_date, category
    FROM LawChanges
    WHERE law_name LIKE '%인공지능%' OR law_name LIKE '%AI%'
  `).all() as any[];

  if (aiLaws.length > 0) {
    console.log(`\n  🤖 인공지능 관련 법령:`);
    aiLaws.forEach(law => {
      console.log(`     - ${law.law_name} [${law.category}] (${law.target_date})`);
    });
  }

  db.close();
  console.log('\n✅ 스크래핑 완료');
}

// CLI 실행
const args = process.argv.slice(2);
const categoryIndex = args.indexOf('--category');
const categoryArg = categoryIndex >= 0 ? args[categoryIndex + 1] : 'all';

let targetCategories: string[];

if (categoryArg === 'all') {
  targetCategories = Object.keys(CATEGORIES);
} else {
  const catMap: Record<string, string> = {
    pending: 'pending',
    abolished: 'abolished',
    temporary: 'temporary_law',
    'temporary-law': 'temporary_law',
    'temporary-article': 'temporary_article',
    unconstitutional: 'unconstitutional'
  };

  targetCategories = categoryArg.split(',').map(c => catMap[c.trim()] || c.trim()).filter(c => CATEGORIES[c]);
}

if (targetCategories.length === 0) {
  console.error('유효한 카테고리가 없습니다.');
  console.log('사용 가능한 카테고리: pending, abolished, temporary, temporary-article, unconstitutional, all');
  process.exit(1);
}

scrapeLawChanges(targetCategories).catch(console.error);
