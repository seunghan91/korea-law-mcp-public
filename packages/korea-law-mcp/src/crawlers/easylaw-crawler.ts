/**
 * 생활법령정보 크롤러 (easylaw.go.kr)
 *
 * 일반인 친화적 법률 해설 데이터 수집
 * - 책자형 생활법령
 * - 백문백답
 * - 카드뉴스형 생활법령
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.easylaw.go.kr';

// 카테고리 정의
export const EASYLAW_CATEGORIES = {
  '가정법률': 'LF001',
  '아동·청소년/교육': 'LF002',
  '부동산/임대차': 'LF003',
  '금융/금전': 'LF004',
  '사업': 'LF005',
  '창업': 'LF006',
  '무역/출입국': 'LF007',
  '소비자': 'LF008',
  '문화/여가생활': 'LF009',
  '민형사/소송': 'LF010',
  '교통/운전': 'LF011',
  '근로/노동': 'LF012',
  '복지': 'LF013',
  '국방/보훈': 'LF014',
  '정보통신/기술': 'LF015',
  '환경/에너지': 'LF016',
  '사회안전/범죄': 'LF017',
  '국가및지자체': 'LF018',
} as const;

export interface EasyLawTopic {
  topicId: string;
  title: string;
  category: string;
  categoryCode: string;
  url: string;
  keywords: string[];
  lastUpdated?: string;
}

export interface EasyLawContent {
  topicId: string;
  title: string;
  category: string;
  sections: EasyLawSection[];
  relatedLaws: string[];
  keywords: string[];
  lastUpdated?: string;
}

export interface EasyLawSection {
  sectionId: string;
  title: string;
  content: string;
  legalBasis?: string[];
}

export interface EasyLawQnA {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedLaws: string[];
  keywords: string[];
}

/**
 * 생활법령정보 크롤러 클래스
 */
export class EasyLawCrawler {
  private axiosInstance;
  private requestDelay = 1000; // 1초 딜레이 (서버 부하 방지)

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KoreaLawMCP/1.0; Legal Research Bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 카테고리별 생활법령 목록 조회
   */
  async getTopicsByCategory(categoryCode: string, page: number = 1): Promise<EasyLawTopic[]> {
    try {
      const url = `/CSP/CsmSortRetrieveLst.laf?sortType=cate&csmSeq=${categoryCode}&page=${page}`;
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);

      const topics: EasyLawTopic[] = [];

      // 생활법령 목록 파싱
      $('.lawBookList li, .conList li, .list_box li').each((_, element) => {
        const $el = $(element);
        const $link = $el.find('a').first();
        const href = $link.attr('href') || '';
        const title = $link.text().trim();

        if (title && href) {
          // URL에서 topicId 추출
          const topicIdMatch = href.match(/csmSeq=(\d+)/);
          const topicId = topicIdMatch ? topicIdMatch[1] : '';

          // 키워드 추출
          const keywordsText = $el.find('.keywords, .tag').text();
          const keywords = keywordsText
            .split(/[,、，]/)
            .map(k => k.trim())
            .filter(k => k.length > 0);

          topics.push({
            topicId,
            title,
            category: this.getCategoryNameByCode(categoryCode),
            categoryCode,
            url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
            keywords,
          });
        }
      });

      await this.delay(this.requestDelay);
      return topics;
    } catch (error) {
      console.error(`카테고리 ${categoryCode} 크롤링 실패:`, error);
      return [];
    }
  }

  /**
   * 생활법령 상세 내용 조회
   */
  async getTopicContent(topicId: string): Promise<EasyLawContent | null> {
    try {
      const url = `/CSP/CnpClsMain.laf?csmSeq=${topicId}`;
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);

      const title = $('h2.title, .conTitle, .lawTitle').first().text().trim();
      const category = $('.breadcrumb li, .location li').eq(1).text().trim();

      // 섹션별 내용 파싱
      const sections: EasyLawSection[] = [];
      $('.section, .conBox, .lawCon').each((idx, element) => {
        const $section = $(element);
        const sectionTitle = $section.find('h3, h4, .secTitle').first().text().trim();
        const sectionContent = $section.find('.content, .conTxt, p').text().trim();

        // 법적 근거 추출
        const legalBasis: string[] = [];
        $section.find('a[href*="law.go.kr"], .lawLink').each((_, lawEl) => {
          const lawText = $(lawEl).text().trim();
          if (lawText) legalBasis.push(lawText);
        });

        if (sectionTitle || sectionContent) {
          sections.push({
            sectionId: `${topicId}_${idx}`,
            title: sectionTitle,
            content: sectionContent,
            legalBasis,
          });
        }
      });

      // 관련 법령 추출
      const relatedLaws: string[] = [];
      $('a[href*="law.go.kr"], .relLaw a').each((_, element) => {
        const lawName = $(element).text().trim();
        if (lawName && !relatedLaws.includes(lawName)) {
          relatedLaws.push(lawName);
        }
      });

      // 키워드 추출
      const keywords: string[] = [];
      $('.keywords span, .tag, meta[name="keywords"]').each((_, element) => {
        const keyword = $(element).attr('content') || $(element).text();
        if (keyword) {
          keyword.split(/[,、，]/).forEach(k => {
            const trimmed = k.trim();
            if (trimmed && !keywords.includes(trimmed)) {
              keywords.push(trimmed);
            }
          });
        }
      });

      await this.delay(this.requestDelay);

      return {
        topicId,
        title,
        category,
        sections,
        relatedLaws,
        keywords,
      };
    } catch (error) {
      console.error(`토픽 ${topicId} 상세 크롤링 실패:`, error);
      return null;
    }
  }

  /**
   * 백문백답 목록 조회
   */
  async getQnAList(page: number = 1, limit: number = 20): Promise<EasyLawQnA[]> {
    try {
      const url = `/CSP/OnhunqueansLstRetrieve.laf?page=${page}&pageUnit=${limit}`;
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);

      const qnaList: EasyLawQnA[] = [];

      $('.qnaList li, .faqList li, .qaBox').each((idx, element) => {
        const $el = $(element);
        const question = $el.find('.question, .q, dt').text().trim();
        const answer = $el.find('.answer, .a, dd').text().trim();
        const category = $el.find('.category, .cate').text().trim();

        // 관련 법령 추출
        const relatedLaws: string[] = [];
        $el.find('a[href*="law.go.kr"]').each((_, lawEl) => {
          const lawName = $(lawEl).text().trim();
          if (lawName) relatedLaws.push(lawName);
        });

        if (question) {
          qnaList.push({
            id: `qna_${page}_${idx}`,
            question,
            answer,
            category,
            relatedLaws,
            keywords: [],
          });
        }
      });

      await this.delay(this.requestDelay);
      return qnaList;
    } catch (error) {
      console.error(`백문백답 페이지 ${page} 크롤링 실패:`, error);
      return [];
    }
  }

  /**
   * 생활법령 검색
   */
  async searchEasyLaw(query: string, limit: number = 20): Promise<EasyLawTopic[]> {
    try {
      const url = `/CSP/UnitySearch.laf?query=${encodeURIComponent(query)}&pageUnit=${limit}`;
      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);

      const results: EasyLawTopic[] = [];

      $('.searchResult li, .resultList li, .srchList li').each((_, element) => {
        const $el = $(element);
        const $link = $el.find('a').first();
        const href = $link.attr('href') || '';
        const title = $link.text().trim();
        const category = $el.find('.category, .cate').text().trim();

        if (title && href) {
          const topicIdMatch = href.match(/csmSeq=(\d+)/);
          const topicId = topicIdMatch ? topicIdMatch[1] : '';

          results.push({
            topicId,
            title,
            category,
            categoryCode: '',
            url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
            keywords: [],
          });
        }
      });

      await this.delay(this.requestDelay);
      return results;
    } catch (error) {
      console.error(`검색 "${query}" 실패:`, error);
      return [];
    }
  }

  /**
   * 전체 카테고리 크롤링 (배치 작업용)
   */
  async crawlAllCategories(maxPagesPerCategory: number = 5): Promise<Map<string, EasyLawTopic[]>> {
    const allTopics = new Map<string, EasyLawTopic[]>();

    for (const [categoryName, categoryCode] of Object.entries(EASYLAW_CATEGORIES)) {
      console.log(`크롤링 중: ${categoryName} (${categoryCode})`);
      const categoryTopics: EasyLawTopic[] = [];

      for (let page = 1; page <= maxPagesPerCategory; page++) {
        const topics = await this.getTopicsByCategory(categoryCode, page);
        if (topics.length === 0) break;
        categoryTopics.push(...topics);
        console.log(`  - 페이지 ${page}: ${topics.length}건`);
      }

      allTopics.set(categoryName, categoryTopics);
      console.log(`  총 ${categoryTopics.length}건 수집 완료`);
    }

    return allTopics;
  }

  private getCategoryNameByCode(code: string): string {
    for (const [name, c] of Object.entries(EASYLAW_CATEGORIES)) {
      if (c === code) return name;
    }
    return '기타';
  }
}

// 싱글톤 인스턴스
let crawlerInstance: EasyLawCrawler | null = null;

export function getEasyLawCrawler(): EasyLawCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new EasyLawCrawler();
  }
  return crawlerInstance;
}

// CLI 테스트용
if (require.main === module) {
  const crawler = getEasyLawCrawler();

  async function test() {
    console.log('=== 생활법령정보 크롤러 테스트 ===\n');

    // 검색 테스트
    console.log('1. 검색 테스트 (근로계약)');
    const searchResults = await crawler.searchEasyLaw('근로계약', 5);
    console.log(`검색 결과: ${searchResults.length}건`);
    searchResults.forEach(r => console.log(`  - ${r.title}`));

    // 카테고리 테스트
    console.log('\n2. 카테고리 테스트 (근로/노동)');
    const categoryTopics = await crawler.getTopicsByCategory(EASYLAW_CATEGORIES['근로/노동'], 1);
    console.log(`카테고리 결과: ${categoryTopics.length}건`);
    categoryTopics.slice(0, 3).forEach(t => console.log(`  - ${t.title}`));

    // 백문백답 테스트
    console.log('\n3. 백문백답 테스트');
    const qnaList = await crawler.getQnAList(1, 5);
    console.log(`백문백답 결과: ${qnaList.length}건`);
    qnaList.slice(0, 2).forEach(q => {
      console.log(`  Q: ${q.question.substring(0, 50)}...`);
      console.log(`  A: ${q.answer.substring(0, 50)}...`);
    });
  }

  test().catch(console.error);
}
