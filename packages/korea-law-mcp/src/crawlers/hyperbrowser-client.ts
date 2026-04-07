/**
 * Hyperbrowser SDK 클라이언트 래퍼
 *
 * 공식 @hyperbrowser/sdk 사용
 * CAPTCHA 우회, 스텔스 모드, 프록시 지원
 */

import Hyperbrowser from '@hyperbrowser/sdk';

export interface SessionOptions {
  solveCaptchas?: boolean;
  useStealth?: boolean;
  useProxy?: boolean;
  acceptCookies?: boolean;
}

export interface ScrapeResult {
  markdown?: string;
  html?: string;
  links?: string[];
  screenshot?: string;
}

export interface BrowserAgentResult {
  finalResult: string;
  steps?: any[];
}

export interface CrawlResult {
  pages: Array<{
    url: string;
    markdown?: string;
    html?: string;
    links?: string[];
  }>;
}

/**
 * Hyperbrowser SDK 클라이언트 래퍼
 */
export class HyperbrowserClient {
  private client: Hyperbrowser;
  private defaultSessionOptions: SessionOptions;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.HYPERBROWSER_API_KEY || '';

    if (!key) {
      console.warn('[HyperbrowserClient] API 키가 설정되지 않았습니다. HYPERBROWSER_API_KEY 환경변수를 설정하세요.');
    }

    this.client = new Hyperbrowser({ apiKey: key });

    // CAPTCHA 우회를 위한 기본 설정
    this.defaultSessionOptions = {
      solveCaptchas: true,
      useStealth: true,
      useProxy: true,
      acceptCookies: false,
    };
  }

  /**
   * 단일 페이지 스크래핑
   */
  async scrapePage(
    url: string,
    outputFormat: ('markdown' | 'html' | 'links' | 'screenshot')[] = ['markdown'],
    sessionOptions?: SessionOptions
  ): Promise<ScrapeResult> {
    try {
      const result = await this.client.scrape.startAndWait({
        url,
        scrapeOptions: {
          formats: outputFormat,
        },
        sessionOptions: { ...this.defaultSessionOptions, ...sessionOptions },
      });

      return {
        markdown: result.data?.markdown,
        html: result.data?.html,
        links: result.data?.links,
      };
    } catch (error: any) {
      console.error(`[HyperbrowserClient] 스크래핑 실패 (${url}):`, error.message);
      throw error;
    }
  }

  /**
   * 여러 페이지 크롤링
   */
  async crawlPages(
    url: string,
    options: {
      outputFormat?: ('markdown' | 'html' | 'links')[];
      followLinks?: boolean;
      maxPages?: number;
      sessionOptions?: SessionOptions;
    } = {}
  ): Promise<CrawlResult> {
    const {
      outputFormat = ['markdown'],
      followLinks = true,
      maxPages = 10,
      sessionOptions,
    } = options;

    try {
      const result = await this.client.crawl.startAndWait({
        url,
        maxPages,
        scrapeOptions: {
          formats: outputFormat,
        },
        sessionOptions: { ...this.defaultSessionOptions, ...sessionOptions },
      });

      return {
        pages: result.data?.map(page => {
          const pageUrl = page.metadata?.url;
          return {
            url: Array.isArray(pageUrl) ? pageUrl[0] : (pageUrl || url),
            markdown: page.markdown,
            html: page.html,
            links: page.links,
          };
        }) || [],
      };
    } catch (error: any) {
      console.error(`[HyperbrowserClient] 크롤링 실패 (${url}):`, error.message);
      throw error;
    }
  }

  /**
   * 브라우저 에이전트 실행 (Browser Use)
   */
  async runBrowserAgent(
    task: string,
    options: {
      maxSteps?: number;
      sessionOptions?: SessionOptions;
    } = {}
  ): Promise<BrowserAgentResult> {
    const { maxSteps = 25, sessionOptions } = options;

    try {
      const result = await this.client.agents.browserUse.startAndWait({
        task,
        maxSteps,
        sessionOptions: { ...this.defaultSessionOptions, ...sessionOptions },
      });

      return {
        finalResult: result.data?.finalResult || '',
        steps: result.data?.steps || [],
      };
    } catch (error: any) {
      console.error(`[HyperbrowserClient] 브라우저 에이전트 실패:`, error.message);
      throw error;
    }
  }

  /**
   * Claude Computer Use 에이전트 실행 (복잡한 추론 필요시)
   */
  async runClaudeAgent(
    task: string,
    options: {
      maxSteps?: number;
      sessionOptions?: SessionOptions;
    } = {}
  ): Promise<BrowserAgentResult> {
    const { maxSteps = 35, sessionOptions } = options;

    try {
      const result = await this.client.agents.claudeComputerUse.startAndWait({
        task,
        maxSteps,
        sessionOptions: { ...this.defaultSessionOptions, ...sessionOptions },
      });

      return {
        finalResult: result.data?.finalResult || '',
        steps: result.data?.steps || [],
      };
    } catch (error: any) {
      console.error(`[HyperbrowserClient] Claude 에이전트 실패:`, error.message);
      throw error;
    }
  }

  /**
   * 구조화된 데이터 추출
   */
  async extractStructuredData<T>(
    urls: string[],
    prompt: string,
    schema: object,
    sessionOptions?: SessionOptions
  ): Promise<T[]> {
    try {
      const result = await this.client.extract.startAndWait({
        urls,
        prompt,
        schema: schema as any,
        sessionOptions: { ...this.defaultSessionOptions, ...sessionOptions },
      });

      return (result.data as T[]) || [];
    } catch (error: any) {
      console.error(`[HyperbrowserClient] 데이터 추출 실패:`, error.message);
      throw error;
    }
  }

  /**
   * API 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.scrapePage('https://www.google.com', ['markdown']);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 원본 SDK 클라이언트 접근
   */
  getRawClient(): Hyperbrowser {
    return this.client;
  }
}

// 싱글톤 인스턴스
let clientInstance: HyperbrowserClient | null = null;

export function getHyperbrowserClient(apiKey?: string): HyperbrowserClient {
  if (!clientInstance) {
    clientInstance = new HyperbrowserClient(apiKey);
  }
  return clientInstance;
}

export default HyperbrowserClient;
