/**
 * Hyperbrowser 기반 법률 데이터 크롤러
 *
 * CAPTCHA 우회 및 동적 페이지 처리 지원
 * - 대법원 종합법률정보 (glaw.scourt.go.kr)
 * - 헌법재판소 결정문 (search.ccourt.go.kr)
 * - 국가법령정보센터 (law.go.kr)
 * - 생활법령정보 (easylaw.go.kr)
 */

import { HyperbrowserClient, getHyperbrowserClient, BrowserAgentResult } from './hyperbrowser-client';
import * as fs from 'fs';
import * as path from 'path';

// ==================== 타입 정의 ====================

export interface Precedent {
  caseNumber: string;
  court: string;
  decisionDate: string;
  caseType: string;
  title?: string;
  summary: string;
  keyPoints?: string[];
  relatedLaws?: string[];
  ruling?: string;
  publication?: string;
}

export interface ConstitutionalDecision {
  caseNumber: string;
  decisionDate: string;
  caseType: string;
  result: string;
  title: string;
  summary: string;
  keyPoints?: string[];
  citation?: string;
}

export interface EasyLawArticle {
  title: string;
  category: string;
  url: string;
  summary?: string;
  keyPoints?: string[];
  relatedLaws?: string[];
}

export interface LawInfo {
  name: string;
  lawNumber?: number;
  lastAmendment?: string;
  status?: string;
  keyArticles?: Array<{
    article: string;
    title: string;
    summary: string;
  }>;
}

export interface CrawlResult<T> {
  source: string;
  searchTerm: string;
  crawledAt: string;
  totalResults?: number;
  data: T[];
}

// ==================== 크롤러 클래스 ====================

/**
 * Hyperbrowser 기반 통합 법률 크롤러
 */
export class HyperbrowserLawCrawler {
  private client: HyperbrowserClient;
  private outputDir: string;

  constructor(apiKey?: string, outputDir?: string) {
    this.client = getHyperbrowserClient(apiKey);
    this.outputDir = outputDir || path.join(process.cwd(), 'crawled_data');
  }

  // ==================== 대법원 종합법률정보 ====================

  /**
   * 대법원 종합법률정보에서 판례 검색
   * CAPTCHA 우회 필요
   */
  async searchSupremeCourt(
    searchTerm: string,
    limit: number = 5
  ): Promise<CrawlResult<Precedent>> {
    console.log(`[SupremeCourt] "${searchTerm}" 검색 중...`);

    const task = `
1. Navigate to https://glaw.scourt.go.kr (대법원 종합법률정보)
2. If you see a CAPTCHA, solve it
3. Find the search input for precedents/cases (판례검색)
4. Search for "${searchTerm}"
5. Wait for search results to load
6. Extract the first ${limit} court case results including:
   - Case number (사건번호)
   - Court (법원)
   - Decision date (선고일)
   - Case type (사건유형)
   - Title/summary
7. Return structured JSON data with the following format:
{
  "totalResults": number,
  "precedents": [
    {
      "caseNumber": "string",
      "court": "string",
      "decisionDate": "string",
      "caseType": "string",
      "title": "string",
      "summary": "string"
    }
  ]
}`;

    try {
      const result = await this.client.runClaudeAgent(task, { maxSteps: 35 });
      const parsed = this.parseAgentResult<any>(result);

      // 다양한 응답 형식 처리
      let precedents: Precedent[] = [];
      if (parsed?.precedents && Array.isArray(parsed.precedents)) {
        precedents = parsed.precedents;
      } else if (parsed?.items && Array.isArray(parsed.items)) {
        precedents = parsed.items;
      } else if (Array.isArray(parsed)) {
        precedents = parsed;
      }

      return {
        source: 'glaw.scourt.go.kr',
        searchTerm,
        crawledAt: new Date().toISOString(),
        totalResults: parsed?.totalResults || precedents.length,
        data: precedents,
      };
    } catch (error) {
      console.error(`[SupremeCourt] 크롤링 실패:`, error);
      return {
        source: 'glaw.scourt.go.kr',
        searchTerm,
        crawledAt: new Date().toISOString(),
        data: [],
      };
    }
  }

  // ==================== 헌법재판소 ====================

  /**
   * 헌법재판소 결정문 검색
   */
  async searchConstitutionalCourt(
    searchTerm: string,
    limit: number = 5
  ): Promise<CrawlResult<ConstitutionalDecision>> {
    console.log(`[ConstitutionalCourt] "${searchTerm}" 검색 중...`);

    const task = `
1. Navigate to https://search.ccourt.go.kr (헌법재판소 결정문 검색)
2. Find the search input field and search for "${searchTerm}"
3. Wait for search results to load
4. Extract the first ${limit} constitutional court decisions with these fields:
   - caseNumber: 사건번호 (e.g., 2020헌바123)
   - decisionDate: 선고일 (e.g., 2020.01.01)
   - caseType: 사건유형 (e.g., 헌법소원, 위헌심판)
   - result: 결과 (e.g., 합헌, 위헌, 기각, 각하)
   - title: 사건명
   - summary: 요약 (brief description)

IMPORTANT: Return ONLY the JSON below, no other text:
{"decisions":[{"caseNumber":"...","decisionDate":"...","caseType":"...","result":"...","title":"...","summary":"..."}]}`;

    try {
      const result = await this.client.runClaudeAgent(task, { maxSteps: 35 });
      const parsed = this.parseAgentResult<any>(result);

      // 다양한 응답 형식 처리
      let decisions: ConstitutionalDecision[] = [];
      if (parsed?.decisions && Array.isArray(parsed.decisions)) {
        decisions = parsed.decisions;
      } else if (parsed?.items && Array.isArray(parsed.items)) {
        decisions = parsed.items;
      } else if (Array.isArray(parsed)) {
        decisions = parsed;
      }

      return {
        source: 'search.ccourt.go.kr',
        searchTerm,
        crawledAt: new Date().toISOString(),
        totalResults: parsed?.totalResults || decisions.length,
        data: decisions,
      };
    } catch (error) {
      console.error(`[ConstitutionalCourt] 크롤링 실패:`, error);
      return {
        source: 'search.ccourt.go.kr',
        searchTerm,
        crawledAt: new Date().toISOString(),
        data: [],
      };
    }
  }

  // ==================== 국가법령정보센터 ====================

  /**
   * 국가법령정보센터에서 판례 검색
   */
  async searchLawGoKrPrecedents(
    searchTerm: string,
    limit: number = 5
  ): Promise<CrawlResult<Precedent>> {
    console.log(`[LawGoKr] "${searchTerm}" 판례 검색 중...`);

    const task = `
1. Navigate to https://www.law.go.kr/판례
2. Find the search input field on the page
3. Enter "${searchTerm}" in the search field and submit
4. Wait for search results to load
5. Extract the first ${limit} court case results with these fields:
   - caseNumber: 사건번호 (e.g., 2020다12345)
   - court: 법원 (e.g., 대법원, 서울고등법원)
   - decisionDate: 선고일 (e.g., 2020.01.01)
   - caseType: 사건유형 (e.g., 민사, 형사)
   - title: 사건명
   - summary: 판시사항 요약

IMPORTANT: Return ONLY the JSON below, no other text:
{"precedents":[{"caseNumber":"...","court":"...","decisionDate":"...","caseType":"...","title":"...","summary":"..."}]}`;

    try {
      const result = await this.client.runClaudeAgent(task, { maxSteps: 35 });
      const parsed = this.parseAgentResult<any>(result);

      // 다양한 응답 형식 처리
      let precedents: Precedent[] = [];
      if (parsed?.precedents && Array.isArray(parsed.precedents)) {
        precedents = parsed.precedents;
      } else if (parsed?.items && Array.isArray(parsed.items)) {
        precedents = parsed.items;
      } else if (Array.isArray(parsed)) {
        precedents = parsed;
      }

      return {
        source: 'law.go.kr',
        searchTerm,
        crawledAt: new Date().toISOString(),
        totalResults: parsed?.totalResults || precedents.length,
        data: precedents,
      };
    } catch (error) {
      console.error(`[LawGoKr] 판례 크롤링 실패:`, error);
      return {
        source: 'law.go.kr',
        searchTerm,
        crawledAt: new Date().toISOString(),
        data: [],
      };
    }
  }

  /**
   * 국가법령정보센터에서 법령 정보 조회
   */
  async getLawInfo(lawName: string): Promise<LawInfo | null> {
    console.log(`[LawGoKr] "${lawName}" 법령 정보 조회 중...`);

    const task = `
1. Navigate to https://www.law.go.kr
2. Search for "${lawName}" in the main search
3. Find the law in the results
4. Extract key information:
   - Law name and number
   - Last amendment date
   - Key chapters/sections
   - Important article numbers and titles
5. Return structured JSON data with the following format:
{
  "name": "string",
  "lawNumber": number,
  "lastAmendment": "string",
  "status": "string",
  "keyArticles": [
    {
      "article": "string",
      "title": "string",
      "summary": "string"
    }
  ]
}`;

    try {
      const result = await this.client.runBrowserAgent(task, { maxSteps: 25 });
      return this.parseAgentResult<LawInfo>(result);
    } catch (error) {
      console.error(`[LawGoKr] 법령 정보 조회 실패:`, error);
      return null;
    }
  }

  // ==================== 생활법령정보 ====================

  /**
   * 생활법령정보 검색
   */
  async searchEasyLaw(
    searchTerm: string,
    limit: number = 5
  ): Promise<CrawlResult<EasyLawArticle>> {
    console.log(`[EasyLaw] "${searchTerm}" 검색 중...`);

    const task = `
1. Navigate to https://easylaw.go.kr
2. Find the search input on the page
3. Enter "${searchTerm}" in the search field
4. Click the search button
5. Wait for search results to load
6. Extract the first ${limit} search results including:
   - Title
   - Category/path
   - Brief description or summary
   - URL link
7. Return structured JSON data with the following format:
{
  "results": [
    {
      "title": "string",
      "category": "string",
      "url": "string",
      "summary": "string"
    }
  ]
}`;

    try {
      const result = await this.client.runBrowserAgent(task, { maxSteps: 30 });
      const parsed = this.parseAgentResult<{
        results: EasyLawArticle[];
      }>(result);

      return {
        source: 'easylaw.go.kr',
        searchTerm,
        crawledAt: new Date().toISOString(),
        data: parsed?.results || [],
      };
    } catch (error) {
      console.error(`[EasyLaw] 크롤링 실패:`, error);
      return {
        source: 'easylaw.go.kr',
        searchTerm,
        crawledAt: new Date().toISOString(),
        data: [],
      };
    }
  }

  // ==================== 통합 검색 ====================

  /**
   * 모든 소스에서 검색 (병렬/순차 선택 가능)
   */
  async searchAll(
    searchTerm: string,
    limit: number = 5,
    options: { sequential?: boolean } = {}
  ): Promise<{
    supremeCourt: CrawlResult<Precedent>;
    constitutionalCourt: CrawlResult<ConstitutionalDecision>;
    lawGoKr: CrawlResult<Precedent>;
    easyLaw: CrawlResult<EasyLawArticle>;
  }> {
    const { sequential = false } = options;

    if (sequential) {
      console.log(`[통합검색] "${searchTerm}" 순차 검색 중...`);

      // 순차 실행 - 각 소스를 하나씩 실행
      console.log('\n[1/4] 대법원 검색...');
      const supremeCourt = await this.searchSupremeCourt(searchTerm, limit);
      await this.delay(1000);

      console.log('[2/4] 헌법재판소 검색...');
      const constitutionalCourt = await this.searchConstitutionalCourt(searchTerm, limit);
      await this.delay(1000);

      console.log('[3/4] 법령정보센터 검색...');
      const lawGoKr = await this.searchLawGoKrPrecedents(searchTerm, limit);
      await this.delay(1000);

      console.log('[4/4] 생활법령정보 검색...');
      const easyLaw = await this.searchEasyLaw(searchTerm, limit);

      return { supremeCourt, constitutionalCourt, lawGoKr, easyLaw };
    }

    // 병렬 실행 (기본값)
    console.log(`[통합검색] "${searchTerm}" 병렬 검색 중...`);

    const [supremeCourt, constitutionalCourt, lawGoKr, easyLaw] = await Promise.allSettled([
      this.searchSupremeCourt(searchTerm, limit),
      this.searchConstitutionalCourt(searchTerm, limit),
      this.searchLawGoKrPrecedents(searchTerm, limit),
      this.searchEasyLaw(searchTerm, limit),
    ]);

    return {
      supremeCourt: supremeCourt.status === 'fulfilled'
        ? supremeCourt.value
        : { source: 'glaw.scourt.go.kr', searchTerm, crawledAt: new Date().toISOString(), data: [] },
      constitutionalCourt: constitutionalCourt.status === 'fulfilled'
        ? constitutionalCourt.value
        : { source: 'search.ccourt.go.kr', searchTerm, crawledAt: new Date().toISOString(), data: [] },
      lawGoKr: lawGoKr.status === 'fulfilled'
        ? lawGoKr.value
        : { source: 'law.go.kr', searchTerm, crawledAt: new Date().toISOString(), data: [] },
      easyLaw: easyLaw.status === 'fulfilled'
        ? easyLaw.value
        : { source: 'easylaw.go.kr', searchTerm, crawledAt: new Date().toISOString(), data: [] },
    };
  }

  // ==================== 배치 크롤링 ====================

  /**
   * 주제별 배치 크롤링 및 파일 저장
   */
  async batchCrawl(
    topics: string[],
    options: {
      sources?: ('supremeCourt' | 'constitutionalCourt' | 'lawGoKr' | 'easyLaw')[];
      limit?: number;
      outputDir?: string;
    } = {}
  ): Promise<void> {
    const {
      sources = ['supremeCourt', 'constitutionalCourt', 'lawGoKr', 'easyLaw'],
      limit = 5,
      outputDir = this.outputDir,
    } = options;

    // 출력 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const topic of topics) {
      console.log(`\n=== "${topic}" 크롤링 시작 ===`);

      for (const source of sources) {
        let result: any;

        switch (source) {
          case 'supremeCourt':
            result = await this.searchSupremeCourt(topic, limit);
            break;
          case 'constitutionalCourt':
            result = await this.searchConstitutionalCourt(topic, limit);
            break;
          case 'lawGoKr':
            result = await this.searchLawGoKrPrecedents(topic, limit);
            break;
          case 'easyLaw':
            result = await this.searchEasyLaw(topic, limit);
            break;
        }

        if (result && result.data.length > 0) {
          const filename = `${source}_${topic.replace(/\s+/g, '_')}_${Date.now()}.json`;
          const filepath = path.join(outputDir, filename);
          fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
          console.log(`  ✅ ${source}: ${result.data.length}건 저장 -> ${filename}`);
        } else {
          console.log(`  ❌ ${source}: 결과 없음`);
        }

        // Rate limiting
        await this.delay(2000);
      }
    }

    console.log('\n=== 배치 크롤링 완료 ===');
  }

  // ==================== 유틸리티 ====================

  private parseAgentResult<T>(result: BrowserAgentResult): T | null {
    try {
      const text = result.finalResult;

      // 1. JSON 코드 블록 추출 시도 (```json ... ```)
      const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        try {
          return JSON.parse(jsonBlockMatch[1].trim());
        } catch (e) {
          // 블록 내 JSON이 유효하지 않으면 계속 진행
        }
      }

      // 2. 일반 코드 블록 내 JSON 시도 (``` ... ```)
      const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        const content = codeBlockMatch[1].trim();
        if (content.startsWith('{') || content.startsWith('[')) {
          try {
            return JSON.parse(content);
          } catch (e) {
            // 계속 진행
          }
        }
      }

      // 3. 텍스트 내 JSON 객체 찾기 (가장 바깥쪽 { } 쌍)
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonCandidate = text.substring(jsonStart, jsonEnd + 1);
        try {
          return JSON.parse(jsonCandidate);
        } catch (e) {
          // 계속 진행
        }
      }

      // 4. 배열 형태의 JSON 찾기
      const arrayStart = text.indexOf('[');
      const arrayEnd = text.lastIndexOf(']');
      if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        const arrayCandidate = text.substring(arrayStart, arrayEnd + 1);
        try {
          const arr = JSON.parse(arrayCandidate);
          return { items: arr } as any;
        } catch (e) {
          // 계속 진행
        }
      }

      // 5. 텍스트에서 구조화된 데이터 추출 시도 (판례 패턴)
      const precedentPattern = /사건번호[:\s]*([^\n,]+)|Case\s*(?:Number|No)[:\s]*([^\n,]+)/gi;
      const matches = [...text.matchAll(precedentPattern)];
      if (matches.length > 0) {
        const extractedItems = matches.map(m => ({
          caseNumber: (m[1] || m[2] || '').trim(),
          rawMatch: m[0]
        }));
        return { extractedFromText: extractedItems, rawText: text } as any;
      }

      // 6. 파싱 불가 시 원본 텍스트 반환
      console.warn('[parseAgentResult] JSON 파싱 불가, 원본 텍스트 반환');
      return { rawText: text } as any;
    } catch (error) {
      console.error('[parseAgentResult] 파싱 실패:', error);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 결과를 파일로 저장
   */
  saveToFile<T>(result: CrawlResult<T>, filename: string): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`결과 저장: ${filepath}`);
  }
}

// ==================== 싱글톤 ====================

let crawlerInstance: HyperbrowserLawCrawler | null = null;

export function getHyperbrowserLawCrawler(apiKey?: string): HyperbrowserLawCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new HyperbrowserLawCrawler(apiKey);
  }
  return crawlerInstance;
}

// ==================== CLI ====================

if (require.main === module) {
  const crawler = getHyperbrowserLawCrawler();

  function parseArgs(args: string[]) {
    const flags = {
      sequential: false,
      help: false,
    };
    const positional: string[] = [];

    for (const arg of args) {
      if (arg === '--seq' || arg === '--sequential') {
        flags.sequential = true;
      } else if (arg === '--help' || arg === '-h') {
        flags.help = true;
      } else if (!arg.startsWith('-')) {
        positional.push(arg);
      }
    }

    return { flags, positional };
  }

  function showHelp() {
    console.log(`
=== Hyperbrowser 법률 크롤러 ===

사용법:
  pnpm crawl [command] [searchTerm] [limit] [options]

명령어:
  all             모든 소스 통합 검색 (기본값)
  supreme         대법원 판례 검색
  constitutional  헌법재판소 결정문 검색
  lawgokr         국가법령정보센터 판례 검색
  easylaw         생활법령정보 검색
  batch           배치 크롤링 (여러 주제)

옵션:
  --seq, --sequential  순차 실행 (병렬 실행 시 불안정할 때 사용)
  --help, -h           도움말 표시

예시:
  pnpm crawl all 부당해고 5           # 병렬로 모든 소스 검색
  pnpm crawl all 부당해고 5 --seq     # 순차로 모든 소스 검색
  pnpm crawl supreme 해고 3           # 대법원에서 3건 검색
  pnpm crawl constitutional 근로계약  # 헌법재판소 검색
`);
  }

  async function main() {
    const { flags, positional } = parseArgs(process.argv.slice(2));

    if (flags.help) {
      showHelp();
      return;
    }

    const command = positional[0] || 'all';
    const searchTerm = positional[1] || '부당해고';
    const limit = parseInt(positional[2] || '5', 10);

    console.log('=== Hyperbrowser 법률 크롤러 ===\n');
    console.log(`명령어: ${command}`);
    console.log(`검색어: ${searchTerm}`);
    console.log(`결과 수: ${limit}`);
    if (flags.sequential) {
      console.log(`모드: 순차 실행`);
    }
    console.log();

    switch (command) {
      case 'supreme':
        const supremeResult = await crawler.searchSupremeCourt(searchTerm, limit);
        console.log('\n결과:', JSON.stringify(supremeResult, null, 2));
        break;

      case 'constitutional':
        const ccResult = await crawler.searchConstitutionalCourt(searchTerm, limit);
        console.log('\n결과:', JSON.stringify(ccResult, null, 2));
        break;

      case 'lawgokr':
        const lawResult = await crawler.searchLawGoKrPrecedents(searchTerm, limit);
        console.log('\n결과:', JSON.stringify(lawResult, null, 2));
        break;

      case 'easylaw':
        const easyResult = await crawler.searchEasyLaw(searchTerm, limit);
        console.log('\n결과:', JSON.stringify(easyResult, null, 2));
        break;

      case 'batch':
        await crawler.batchCrawl(
          ['부당해고', '근로계약', '해고'],
          { limit }
        );
        break;

      case 'all':
      default:
        const allResults = await crawler.searchAll(searchTerm, limit, { sequential: flags.sequential });
        console.log('\n=== 통합 검색 결과 ===');
        console.log('\n[대법원]', allResults.supremeCourt.data.length, '건');
        console.log('[헌법재판소]', allResults.constitutionalCourt.data.length, '건');
        console.log('[법령정보센터]', allResults.lawGoKr.data.length, '건');
        console.log('[생활법령]', allResults.easyLaw.data.length, '건');
        break;
    }
  }

  main().catch(console.error);
}

export default HyperbrowserLawCrawler;
