/**
 * 국가법령정보 OPEN API 스펙 크롤러
 * 
 * open.law.go.kr에서 모든 API 스펙을 자동으로 수집합니다.
 * 
 * 사용법:
 *   npx ts-node scripts/crawl-api-specs.ts
 * 
 * 결과:
 *   docs/api-specs/*.json 파일 생성
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// 타입 정의
// ============================================

interface RequestParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

interface ResponseField {
  name: string;
  type: string;
  description: string;
}

interface SampleUrl {
  description: string;
  url: string;
}

interface ApiSpec {
  apiId: string;
  name: string;
  category: string;
  subcategory: string;
  type: 'list' | 'detail';
  target: string;
  endpoint: string;
  requestUrl: string;
  requestParams: RequestParam[];
  responseFields: ResponseField[];
  sampleUrls: SampleUrl[];
  crawledAt: string;
}

interface ApiLink {
  name: string;
  category: string;
  subcategory: string;
  type: 'list' | 'detail';
  seq?: string;
}

// ============================================
// 크롤러 클래스
// ============================================

class ApiSpecCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private outputDir: string;
  private delay = 1000; // 페이지 로드 딜레이 (ms)

  constructor() {
    this.outputDir = path.join(__dirname, '../docs/api-specs/crawled');
  }

  async init(): Promise<void> {
    // 출력 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // 브라우저 시작
    this.browser = await chromium.launch({
      headless: true,
    });
    this.page = await this.browser.newPage();
    
    console.log('🚀 크롤러 초기화 완료');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🛑 크롤러 종료');
  }

  /**
   * API 목록 페이지에서 모든 API 링크 수집
   */
  async collectApiLinks(): Promise<ApiLink[]> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('📋 API 목록 수집 중...');
    
    await this.page.goto('https://open.law.go.kr/LSO/openApi/guideList.do', {
      waitUntil: 'networkidle',
    });

    const links = await this.page.evaluate(() => {
      const result: any[] = [];
      const rows = document.querySelectorAll('table tbody tr');
      
      let currentCategory = '';
      let currentSubcategory = '';

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        
        // 카테고리/서브카테고리 업데이트
        cells.forEach((cell, idx) => {
          const text = cell.textContent?.trim().replace(/\s+/g, ' ') || '';
          const rowspan = cell.getAttribute('rowspan');
          
          if (rowspan && idx < 2) {
            if (idx === 0) currentCategory = text;
            if (idx === 1) currentSubcategory = text;
          }
        });

        // 링크 추출
        const links = row.querySelectorAll('a[href="#"]');
        links.forEach(link => {
          const name = link.textContent?.trim().replace(/\s+/g, ' ') || '';
          if (name && name !== '-') {
            const isDetail = name.includes('본문') && !name.includes('목록');
            result.push({
              name,
              category: currentCategory,
              subcategory: currentSubcategory,
              type: isDetail ? 'detail' : 'list',
            });
          }
        });
      });

      return result;
    });

    console.log(`✅ ${links.length}개 API 링크 수집 완료`);
    return links;
  }

  /**
   * 특정 API 링크 클릭 후 스펙 추출
   */
  async extractApiSpec(apiLink: ApiLink): Promise<ApiSpec | null> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // API 목록 페이지로 이동
      await this.page.goto('https://open.law.go.kr/LSO/openApi/guideList.do', {
        waitUntil: 'networkidle',
      });

      // 해당 API 링크 클릭
      const linkText = apiLink.name;
      const linkSelector = `a:has-text("${linkText.substring(0, 20)}")`;
      
      try {
        await this.page.click(linkSelector, { timeout: 5000 });
        await this.page.waitForLoadState('networkidle');
        await this.sleep(this.delay);
      } catch {
        console.warn(`⚠️ 링크 클릭 실패: ${linkText}`);
        return null;
      }

      // 스펙 추출
      const spec = await this.page.evaluate((meta) => {
        const result: any = {
          ...meta,
          requestParams: [],
          responseFields: [],
          sampleUrls: [],
        };

        // API 제목에서 실제 이름 추출
        const h3 = document.querySelector('.content_body h3');
        if (h3) {
          result.name = h3.textContent?.trim().replace(' API', '') || meta.name;
        }

        // 요청 URL 추출
        const dtElements = document.querySelectorAll('dt');
        dtElements.forEach(dt => {
          const text = dt.textContent || '';
          if (text.includes('요청 URL')) {
            const urlMatch = text.match(/http:\/\/[^\s]+/);
            if (urlMatch) {
              result.requestUrl = urlMatch[0];
              
              // target 추출
              const targetMatch = urlMatch[0].match(/target=(\w+)/);
              if (targetMatch) {
                result.target = targetMatch[1];
              }
              
              // endpoint 추출
              if (urlMatch[0].includes('lawSearch.do')) {
                result.endpoint = '/lawSearch.do';
              } else if (urlMatch[0].includes('lawService.do')) {
                result.endpoint = '/lawService.do';
              }
            }
          }
        });

        // 테이블 데이터 추출
        const tables = document.querySelectorAll('table');
        tables.forEach((table) => {
          const summary = table.getAttribute('summary') || '';
          const rows = table.querySelectorAll('tbody tr');

          rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            
            if (cells.length >= 3) {
              const item = {
                name: cells[0]?.textContent?.trim() || '',
                type: cells[1]?.textContent?.trim() || '',
                description: cells[2]?.textContent?.trim().replace(/\s+/g, ' ') || '',
              };

              // 필수 여부 확인
              if (item.type.includes('필수')) {
                (item as any).required = true;
              }

              if (summary.includes('요청변수') && item.name) {
                result.requestParams.push(item);
              } else if (summary.includes('출력') && item.name) {
                result.responseFields.push(item);
              }
            } else if (cells.length === 1) {
              const link = cells[0]?.querySelector('a');
              if (link && link.href.includes('law.go.kr')) {
                result.sampleUrls.push({
                  description: cells[0]?.textContent?.trim() || '',
                  url: link.href,
                });
              }
            }
          });
        });

        return result;
      }, {
        name: apiLink.name,
        category: apiLink.category,
        subcategory: apiLink.subcategory,
        type: apiLink.type,
      });

      if (spec && spec.target) {
        spec.apiId = this.generateApiId(spec);
        spec.crawledAt = new Date().toISOString();
        return spec as ApiSpec;
      }

      return null;
    } catch (error) {
      console.error(`❌ 스펙 추출 실패: ${apiLink.name}`, error);
      return null;
    }
  }

  /**
   * API ID 생성
   */
  private generateApiId(spec: any): string {
    const categoryMap: Record<string, string> = {
      '법령': 'law',
      '행정규칙': 'admrul',
      '자치법규': 'ordin',
      '판례': 'prec',
      '헌재결정례': 'detc',
      '법령해석례': 'expc',
      '행정심판례': 'flgn',
      '조약': 'trty',
      '위원회 결정문': 'committee',
      '별표ㆍ서식': 'attach',
      '학칙ㆍ공단ㆍ공공기관': 'inst',
      '법령용어': 'term',
      '모바일': 'mobile',
      '맞춤형': 'custom',
      '법령정보 지식베이스': 'knowledge',
      '중앙부처 1차 해석': 'ministry',
      '특별행정심판': 'special',
    };

    const cat = categoryMap[spec.category] || spec.category.toLowerCase();
    const type = spec.type;
    const target = spec.target || 'unknown';

    return `${cat}-${target}-${type}`;
  }

  /**
   * 모든 API 스펙 크롤링
   */
  async crawlAll(): Promise<void> {
    await this.init();

    try {
      const apiLinks = await this.collectApiLinks();
      const allSpecs: ApiSpec[] = [];
      const failedLinks: ApiLink[] = [];

      console.log(`\n🔄 ${apiLinks.length}개 API 스펙 크롤링 시작...\n`);

      for (let i = 0; i < apiLinks.length; i++) {
        const link = apiLinks[i];
        console.log(`[${i + 1}/${apiLinks.length}] ${link.name}...`);

        const spec = await this.extractApiSpec(link);
        
        if (spec) {
          allSpecs.push(spec);
          
          // 개별 파일로 저장
          const filename = `${spec.apiId}.json`;
          const filepath = path.join(this.outputDir, filename);
          fs.writeFileSync(filepath, JSON.stringify(spec, null, 2), 'utf-8');
          
          console.log(`  ✅ 저장: ${filename}`);
        } else {
          failedLinks.push(link);
          console.log(`  ⚠️ 실패`);
        }

        // 요청 간격 조절
        await this.sleep(this.delay);
      }

      // 전체 카탈로그 저장
      const catalogPath = path.join(this.outputDir, '_catalog.json');
      fs.writeFileSync(catalogPath, JSON.stringify({
        totalCount: allSpecs.length,
        failedCount: failedLinks.length,
        crawledAt: new Date().toISOString(),
        specs: allSpecs,
        failed: failedLinks,
      }, null, 2), 'utf-8');

      console.log(`\n📊 크롤링 완료!`);
      console.log(`  성공: ${allSpecs.length}개`);
      console.log(`  실패: ${failedLinks.length}개`);
      console.log(`  저장 위치: ${this.outputDir}`);

    } finally {
      await this.close();
    }
  }

  /**
   * 특정 카테고리만 크롤링
   */
  async crawlCategory(category: string): Promise<void> {
    await this.init();

    try {
      const apiLinks = await this.collectApiLinks();
      const filteredLinks = apiLinks.filter(link => link.category === category);

      console.log(`\n🔄 "${category}" 카테고리 ${filteredLinks.length}개 API 크롤링...\n`);

      for (const link of filteredLinks) {
        console.log(`  ${link.name}...`);
        const spec = await this.extractApiSpec(link);
        
        if (spec) {
          const filename = `${spec.apiId}.json`;
          const filepath = path.join(this.outputDir, filename);
          fs.writeFileSync(filepath, JSON.stringify(spec, null, 2), 'utf-8');
          console.log(`    ✅ ${filename}`);
        }

        await this.sleep(this.delay);
      }

    } finally {
      await this.close();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// 실행
// ============================================

async function main() {
  const crawler = new ApiSpecCrawler();
  
  const args = process.argv.slice(2);
  
  if (args[0] === '--category' && args[1]) {
    // 특정 카테고리만 크롤링
    await crawler.crawlCategory(args[1]);
  } else if (args[0] === '--help') {
    console.log(`
국가법령정보 OPEN API 스펙 크롤러

사용법:
  npx ts-node scripts/crawl-api-specs.ts [옵션]

옵션:
  (없음)              모든 API 크롤링
  --category <name>   특정 카테고리만 크롤링
  --help              도움말 표시

예시:
  npx ts-node scripts/crawl-api-specs.ts
  npx ts-node scripts/crawl-api-specs.ts --category "법령"
  npx ts-node scripts/crawl-api-specs.ts --category "판례"
`);
  } else {
    // 전체 크롤링
    await crawler.crawlAll();
  }
}

main().catch(console.error);



