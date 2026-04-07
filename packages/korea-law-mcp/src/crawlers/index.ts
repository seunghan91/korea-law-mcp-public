/**
 * 법률 데이터 크롤러 통합 모듈
 *
 * 데이터 소스:
 * - 생활법령정보 (easylaw.go.kr)
 * - 사법정보공유포털 (openapi.scourt.go.kr)
 * - 대법원 종합법률정보 (glaw.scourt.go.kr) - Hyperbrowser
 * - 헌법재판소 (search.ccourt.go.kr) - Hyperbrowser
 * - 국가법령정보센터 (law.go.kr) - Hyperbrowser
 */

export * from './easylaw-crawler';
export * from './scourt-crawler';

// Hyperbrowser 모듈 - CrawlResult 충돌 방지를 위해 명시적으로 export
export { HyperbrowserClient, type SessionOptions } from './hyperbrowser-client';
export type { CrawlResult as HyperbrowserRawCrawlResult } from './hyperbrowser-client';

export * from './hyperbrowser-crawler';

import { getEasyLawCrawler, EasyLawCrawler } from './easylaw-crawler';
import { getSCourtCrawler, SCourtCrawler } from './scourt-crawler';
import { getHyperbrowserLawCrawler, HyperbrowserLawCrawler } from './hyperbrowser-crawler';

/**
 * 모든 크롤러 인스턴스 가져오기
 */
export function getAllCrawlers(): {
  easylaw: EasyLawCrawler;
  scourt: SCourtCrawler;
  hyperbrowser: HyperbrowserLawCrawler;
} {
  return {
    easylaw: getEasyLawCrawler(),
    scourt: getSCourtCrawler(),
    hyperbrowser: getHyperbrowserLawCrawler(),
  };
}

/**
 * 병렬 검색 (모든 소스에서 동시 검색)
 */
export async function searchAllSources(query: string, limit: number = 10) {
  const crawlers = getAllCrawlers();

  const [easylawResults, scourtResults, hyperbrowserResults] = await Promise.allSettled([
    crawlers.easylaw.searchEasyLaw(query, limit),
    crawlers.scourt.searchPrecedents(query, { pageSize: limit }),
    crawlers.hyperbrowser.searchAll(query, limit),
  ]);

  return {
    easylaw: easylawResults.status === 'fulfilled' ? easylawResults.value : [],
    scourt: scourtResults.status === 'fulfilled' ? scourtResults.value.precedents : [],
    hyperbrowser: hyperbrowserResults.status === 'fulfilled' ? hyperbrowserResults.value : null,
  };
}

/**
 * 배치 크롤링 작업 (전체 데이터 수집)
 */
export async function runBatchCrawl(options: {
  easylaw?: boolean;
  scourt?: boolean;
  maxPages?: number;
} = {}) {
  const {
    easylaw = true,
    scourt = false, // 판례는 API 제한이 있으므로 기본 비활성화
    maxPages = 5,
  } = options;

  const results: Record<string, any> = {};

  if (easylaw) {
    console.log('=== 생활법령정보 크롤링 시작 ===');
    const crawler = getEasyLawCrawler();
    results.easylaw = await crawler.crawlAllCategories(maxPages);
    console.log('=== 생활법령정보 크롤링 완료 ===\n');
  }

  if (scourt) {
    console.log('=== 사법정보 크롤링 시작 ===');
    const crawler = getSCourtCrawler();
    results.scourt = await crawler.getRecentSupremeCourtPrecedents(100);
    console.log('=== 사법정보 크롤링 완료 ===\n');
  }

  return results;
}
