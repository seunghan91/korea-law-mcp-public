/**
 * 사법정보공유포털 크롤러 (openapi.scourt.go.kr)
 *
 * 대법원 판례 및 사법 정보 수집
 * - 판례 검색 (제목, 본문)
 * - 민사 기본정보
 * - 판결문 상세 조회
 */

import axios from 'axios';
import * as xml2js from 'xml2js';

const BASE_URL = 'https://openapi.scourt.go.kr';

export interface SCourtPrecedent {
  caseNo: string;         // 사건번호
  caseName: string;       // 사건명
  courtName: string;      // 법원명
  caseType: string;       // 사건종류
  judgmentDate: string;   // 선고일자
  judgmentType: string;   // 판결유형
  summary?: string;       // 판시사항/요지
  fullText?: string;      // 판결문 전문
  relatedLaws?: string[]; // 관련 법률
}

export interface SCourtSearchResult {
  totalCount: number;
  page: number;
  pageSize: number;
  precedents: SCourtPrecedent[];
}

export interface SCourtCivilCase {
  caseNo: string;
  courtName: string;
  caseType: string;
  filingDate: string;
  status: string;
  parties?: {
    plaintiff?: string;
    defendant?: string;
  };
}

/**
 * 사법정보공유포털 API 클라이언트
 *
 * 참고: API 사용을 위해서는 openapi.scourt.go.kr에서 API 키 발급 필요
 * 현재는 웹 스크래핑 방식으로 구현
 */
export class SCourtCrawler {
  private apiKey?: string;
  private axiosInstance;
  private requestDelay = 1500; // 1.5초 딜레이

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KoreaLawMCP/1.0; Legal Research Bot)',
        'Accept': 'application/xml,application/json,text/html',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async parseXML(xml: string): Promise<any> {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
    });
    return parser.parseStringPromise(xml);
  }

  /**
   * 판례 검색 (대법원 판례 공개 시스템)
   *
   * 참고: 실제 API 사용 시에는 API 키가 필요합니다.
   * 현재는 law.go.kr의 판례 검색을 대체로 사용합니다.
   */
  async searchPrecedents(
    query: string,
    options: {
      page?: number;
      pageSize?: number;
      courtType?: string;  // 대법원, 고등법원, 지방법원
      caseType?: string;   // 민사, 형사, 행정, 가사
      startDate?: string;  // YYYY-MM-DD
      endDate?: string;    // YYYY-MM-DD
    } = {}
  ): Promise<SCourtSearchResult> {
    const {
      page = 1,
      pageSize = 20,
      courtType,
      caseType,
      startDate,
      endDate,
    } = options;

    try {
      // 법령정보센터의 판례 검색 API 활용
      const lawGoKrUrl = 'https://www.law.go.kr/DRF/lawSearch.do';
      const params: Record<string, string> = {
        OC: 'seunghan', // 공공데이터 포털 계정 ID (실제 사용 시 변경 필요)
        target: 'prec',
        type: 'XML',
        query: query,
        page: String(page),
        display: String(pageSize),
      };

      if (caseType) params.precKind = caseType;
      if (startDate) params.startDt = startDate.replace(/-/g, '');
      if (endDate) params.endDt = endDate.replace(/-/g, '');

      const response = await axios.get(lawGoKrUrl, { params });
      const result = await this.parseXML(response.data);

      const precedents: SCourtPrecedent[] = [];

      if (result?.PrecSearch?.prec) {
        const precList = Array.isArray(result.PrecSearch.prec)
          ? result.PrecSearch.prec
          : [result.PrecSearch.prec];

        for (const prec of precList) {
          precedents.push({
            caseNo: prec.사건번호 || prec.판례일련번호 || '',
            caseName: prec.사건명 || '',
            courtName: prec.법원명 || '',
            caseType: prec.사건종류명 || '',
            judgmentDate: prec.선고일자 || '',
            judgmentType: prec.판결유형 || '',
            summary: prec.판시사항 || prec.판결요지 || '',
          });
        }
      }

      await this.delay(this.requestDelay);

      return {
        totalCount: parseInt(result?.PrecSearch?.totalCnt || '0', 10),
        page,
        pageSize,
        precedents,
      };
    } catch (error) {
      console.error(`판례 검색 실패 (${query}):`, error);
      return {
        totalCount: 0,
        page,
        pageSize,
        precedents: [],
      };
    }
  }

  /**
   * 판례 상세 조회
   */
  async getPrecedentDetail(caseNo: string): Promise<SCourtPrecedent | null> {
    try {
      const lawGoKrUrl = 'https://www.law.go.kr/DRF/lawService.do';
      const params = {
        OC: 'seunghan', // 실제 사용 시 변경 필요
        target: 'prec',
        type: 'XML',
        ID: caseNo,
      };

      const response = await axios.get(lawGoKrUrl, { params });
      const result = await this.parseXML(response.data);

      if (!result?.PrecService) {
        return null;
      }

      const prec = result.PrecService;

      // 관련 법률 추출
      const relatedLaws: string[] = [];
      if (prec.참조조문) {
        const lawMatches = prec.참조조문.match(/[가-힣]+법[가-힣]*/g) || [];
        relatedLaws.push(...lawMatches);
      }

      await this.delay(this.requestDelay);

      return {
        caseNo: prec.사건번호 || caseNo,
        caseName: prec.사건명 || '',
        courtName: prec.법원명 || '',
        caseType: prec.사건종류명 || '',
        judgmentDate: prec.선고일자 || '',
        judgmentType: prec.판결유형 || '',
        summary: prec.판시사항 || '',
        fullText: prec.판결요지 || prec.전문 || '',
        relatedLaws,
      };
    } catch (error) {
      console.error(`판례 상세 조회 실패 (${caseNo}):`, error);
      return null;
    }
  }

  /**
   * 최신 대법원 판례 조회
   */
  async getRecentSupremeCourtPrecedents(limit: number = 20): Promise<SCourtPrecedent[]> {
    return this.searchPrecedents('', {
      pageSize: limit,
      courtType: '대법원',
    }).then(result => result.precedents);
  }

  /**
   * 특정 법률 관련 판례 검색
   */
  async searchByLawName(lawName: string, limit: number = 20): Promise<SCourtPrecedent[]> {
    return this.searchPrecedents(lawName, {
      pageSize: limit,
    }).then(result => result.precedents);
  }

  /**
   * 사건번호로 판례 조회
   */
  async getPrecedentByCaseNo(caseNo: string): Promise<SCourtPrecedent | null> {
    // 사건번호 형식 정규화 (예: 2023다12345)
    const normalizedCaseNo = caseNo.replace(/\s+/g, '');
    return this.getPrecedentDetail(normalizedCaseNo);
  }

  /**
   * 판례 유형별 검색
   */
  async searchByType(
    caseType: '민사' | '형사' | '행정' | '가사' | '특허',
    query: string = '',
    limit: number = 20
  ): Promise<SCourtPrecedent[]> {
    return this.searchPrecedents(query, {
      pageSize: limit,
      caseType,
    }).then(result => result.precedents);
  }

  /**
   * 기간별 판례 검색
   */
  async searchByDateRange(
    startDate: string,
    endDate: string,
    query: string = '',
    limit: number = 20
  ): Promise<SCourtPrecedent[]> {
    return this.searchPrecedents(query, {
      pageSize: limit,
      startDate,
      endDate,
    }).then(result => result.precedents);
  }
}

// 싱글톤 인스턴스
let crawlerInstance: SCourtCrawler | null = null;

export function getSCourtCrawler(apiKey?: string): SCourtCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new SCourtCrawler(apiKey);
  }
  return crawlerInstance;
}

// CLI 테스트용
if (require.main === module) {
  const crawler = getSCourtCrawler();

  async function test() {
    console.log('=== 사법정보공유포털 크롤러 테스트 ===\n');

    // 판례 검색 테스트
    console.log('1. 판례 검색 테스트 (해고)');
    const searchResults = await crawler.searchPrecedents('해고', { pageSize: 5 });
    console.log(`검색 결과: ${searchResults.totalCount}건 중 ${searchResults.precedents.length}건`);
    searchResults.precedents.forEach(p => {
      console.log(`  - ${p.caseNo}: ${p.caseName}`);
      console.log(`    법원: ${p.courtName}, 선고일: ${p.judgmentDate}`);
    });

    // 특정 법률 관련 판례 테스트
    console.log('\n2. 법률 관련 판례 테스트 (근로기준법)');
    const lawResults = await crawler.searchByLawName('근로기준법', 3);
    console.log(`관련 판례: ${lawResults.length}건`);
    lawResults.forEach(p => console.log(`  - ${p.caseNo}: ${p.caseName}`));

    // 사건유형별 검색 테스트
    console.log('\n3. 사건유형별 검색 (민사)');
    const civilResults = await crawler.searchByType('민사', '', 3);
    console.log(`민사 판례: ${civilResults.length}건`);
    civilResults.forEach(p => console.log(`  - ${p.caseNo}: ${p.caseName}`));
  }

  test().catch(console.error);
}
