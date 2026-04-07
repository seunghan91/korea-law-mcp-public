/**
 * 국가법령정보 OPEN API 클라이언트
 * 자동 생성됨 - 2025-12-10T09:26:08.836Z
 */

import axios, { AxiosInstance } from 'axios';
import { parseStringPromise } from 'xml2js';

const BASE_URL = 'http://www.law.go.kr/DRF';

export interface ApiClientConfig {
  oc: string;           // 사용자 이메일 ID
  timeout?: number;     // 타임아웃 (ms)
  retries?: number;     // 재시도 횟수
}

export class KoreaLawApiClient {
  private client: AxiosInstance;
  private oc: string;
  private retries: number;

  constructor(config: ApiClientConfig) {
    this.oc = config.oc;
    this.retries = config.retries || 3;
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: config.timeout || 30000,
    });
  }

  private async request<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    const fullParams = { OC: this.oc, type: 'XML', ...params };
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await this.client.get(endpoint, { params: fullParams });
        const data = await parseStringPromise(response.data, { explicitArray: false });
        return data as T;
      } catch (error) {
        if (attempt === this.retries) throw error;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * 현행법령(시행일) 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=eflaw
   */
  async searchEflaw(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'eflaw', ...params });
  }

  /**
   * 현행법령(시행일) 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=eflaw
   */
  async getEflawDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'eflaw', ID: id, ...params });
  }

  /**
   * 현행법령(공포일) 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=law
   */
  async searchLaw(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'law', ...params });
  }

  /**
   * 현행법령(공포일) 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=law
   */
  async getLawDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'law', ID: id, ...params });
  }

  /**
   * 법령 연혁 목록 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=lsHistory
   */
  async searchLsHistory(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'lsHistory', ...params });
  }

  /**
   * 법령 연혁 본문 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawService.do?target=lsHistory
   */
  async getLsHistoryDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'lsHistory', ID: id, ...params });
  }

  /**
   * 현행법령(시행일) 본문 조항호목 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=eflawjosub
   */
  async getEflawjosubDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'eflawjosub', ID: id, ...params });
  }

  /**
   * 현행법령(공포일) 본문 조항호목 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=lawjosub
   */
  async getLawjosubDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'lawjosub', ID: id, ...params });
  }

  /**
   * 영문법령 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=elaw
   */
  async searchElaw(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'elaw', ...params });
  }

  /**
   * 영문법령 본문 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawService.do?target=elaw
   */
  async getElawDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'elaw', ID: id, ...params });
  }

  /**
   * 법령 변경이력 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=lsHstInf
   */
  async searchLsHstInf(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'lsHstInf', ...params });
  }

  /**
   * 일자별 조문 개정 이력 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=lsJoHstInf
   */
  async searchLsJoHstInf(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'lsJoHstInf', ...params });
  }

  /**
   * 법령 자치법규 연계 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=lnkDep
   */
  async searchLnkDep(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'lnkDep', ...params });
  }

  /**
   * 법령 체계도 목록 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=lsStmd
   */
  async searchLsStmd(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'lsStmd', ...params });
  }

  /**
   * 법령 체계도 본문 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawService.do?target=lsStmd
   */
  async getLsStmdDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'lsStmd', ID: id, ...params });
  }

  /**
   * 신구법 목록 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=oldAndNew
   */
  async searchOldAndNew(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'oldAndNew', ...params });
  }

  /**
   * 신구법 본문 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawService.do?target=oldAndNew
   */
  async getOldAndNewDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'oldAndNew', ID: id, ...params });
  }

  /**
   * 3단 비교 목록 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=thdCmp
   */
  async searchThdCmp(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'thdCmp', ...params });
  }

  /**
   * 3단비교 본문 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawService.do?target=thdCmp
   */
  async getThdCmpDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'thdCmp', ID: id, ...params });
  }

  /**
   * 삭제 데이터 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=delHst
   */
  async searchDelHst(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'delHst', ...params });
  }

  /**
   * 한눈보기 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=oneview
   */
  async searchOneview(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'oneview', ...params });
  }

  /**
   * 한눈보기 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=oneview
   */
  async getOneviewDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'oneview', ID: id, ...params });
  }

  /**
   * 행정규칙 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=admrul
   */
  async searchAdmrul(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'admrul', ...params });
  }

  /**
   * 행정규칙 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=admrul
   */
  async getAdmrulDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'admrul', ID: id, ...params });
  }

  /**
   * 행정규칙 신구법비교 목록 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=admrulOldAndNew
   */
  async searchAdmrulOldAndNew(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'admrulOldAndNew', ...params });
  }

  /**
   * 행정규칙 신구법 본문 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawService.do?target=admrulOldAndNew
   */
  async getAdmrulOldAndNewDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'admrulOldAndNew', ID: id, ...params });
  }

  /**
   * 자치법규 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=ordin
   */
  async searchOrdin(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'ordin', ...params });
  }

  /**
   * 자치법규 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=ordin
   */
  async getOrdinDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'ordin', ID: id, ...params });
  }

  /**
   * 자치법규 법령 연계 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=lnkOrg
   */
  async searchLnkOrg(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'lnkOrg', ...params });
  }

  /**
   * 판례 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=prec
   */
  async searchPrec(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'prec', ...params });
  }

  /**
   * 판례 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=prec
   */
  async getPrecDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'prec', ID: id, ...params });
  }

  /**
   * 헌재결정례 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=detc
   */
  async searchDetc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'detc', ...params });
  }

  /**
   * 헌재결정례 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=detc
   */
  async getDetcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'detc', ID: id, ...params });
  }

  /**
   * 법령해석례 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=expc
   */
  async searchExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'expc', ...params });
  }

  /**
   * 법령해석례 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=expc
   */
  async getExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'expc', ID: id, ...params });
  }

  /**
   * 행정심판례 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=decc
   */
  async searchDecc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'decc', ...params });
  }

  /**
   * 행정심판례 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=decc
   */
  async getDeccDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'decc', ID: id, ...params });
  }

  /**
   * 개인정보보호위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=ppc
   */
  async searchPpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'ppc', ...params });
  }

  /**
   * 개인정보보호위원회 위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=ppc
   */
  async getPpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'ppc', ID: id, ...params });
  }

  /**
   * 고용보험심사위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=eiac
   */
  async searchEiac(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'eiac', ...params });
  }

  /**
   * 고용보험심사위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=eiac
   */
  async getEiacDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'eiac', ID: id, ...params });
  }

  /**
   * 공정거래위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=ftc
   */
  async searchFtc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'ftc', ...params });
  }

  /**
   * 공정거래위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=ftc
   */
  async getFtcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'ftc', ID: id, ...params });
  }

  /**
   * 국민권익위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=acr
   */
  async searchAcr(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'acr', ...params });
  }

  /**
   * 국민권익위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=acr
   */
  async getAcrDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'acr', ID: id, ...params });
  }

  /**
   * 금융위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=fsc
   */
  async searchFsc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'fsc', ...params });
  }

  /**
   * 금융위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=fsc
   */
  async getFscDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'fsc', ID: id, ...params });
  }

  /**
   * 노동위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=nlrc
   */
  async searchNlrc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'nlrc', ...params });
  }

  /**
   * 노동위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=nlrc
   */
  async getNlrcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'nlrc', ID: id, ...params });
  }

  /**
   * 방송미디어통신위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=kcc
   */
  async searchKcc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kcc', ...params });
  }

  /**
   * 방송미디어통신위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=kcc
   */
  async getKccDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kcc', ID: id, ...params });
  }

  /**
   * 산업재해보상보험재심사위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=iaciac
   */
  async searchIaciac(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'iaciac', ...params });
  }

  /**
   * 산업재해보상보험재심사위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=iaciac
   */
  async getIaciacDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'iaciac', ID: id, ...params });
  }

  /**
   * 중앙토지수용위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=oclt
   */
  async searchOclt(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'oclt', ...params });
  }

  /**
   * 중앙토지수용위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=oclt
   */
  async getOcltDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'oclt', ID: id, ...params });
  }

  /**
   * 중앙환경분쟁조정위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=ecc
   */
  async searchEcc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'ecc', ...params });
  }

  /**
   * 중앙환경분쟁조정위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=ecc
   */
  async getEccDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'ecc', ID: id, ...params });
  }

  /**
   * 증권선물위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=sfc
   */
  async searchSfc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'sfc', ...params });
  }

  /**
   * 증권선물위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=sfc
   */
  async getSfcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'sfc', ID: id, ...params });
  }

  /**
   * 국가인권위원회 결정문 목록 조회 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=nhrck
   */
  async searchNhrck(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'nhrck', ...params });
  }

  /**
   * 국가인권위원회 결정문 본문 조회 API
   * @see https://www.law.go.kr/DRF/lawService.do?target=nhrck
   */
  async getNhrckDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'nhrck', ID: id, ...params });
  }

  /**
   * 조약 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=trty
   */
  async searchTrty(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'trty', ...params });
  }

  /**
   * 조약 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=trty
   */
  async getTrtyDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'trty', ID: id, ...params });
  }

  /**
   * 별표서식 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=licbyl
   */
  async searchLicbyl(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'licbyl', ...params });
  }

  /**
   * 별표서식 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=admbyl
   */
  async searchAdmbyl(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'admbyl', ...params });
  }

  /**
   * 별표서식 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=ordinbyl
   */
  async searchOrdinbyl(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'ordinbyl', ...params });
  }

  /**
   * 학칙공단공공기관 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=school(or public or pi)
   */
  async searchSchool(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'school', ...params });
  }

  /**
   * 학칙공단공공기관 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=school(or public or pi)
   */
  async getSchoolDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'school', ID: id, ...params });
  }

  /**
   * 법령용어 목록 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=lstrm
   */
  async searchLstrm(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'lstrm', ...params });
  }

  /**
   * 법령용어 본문 조회 가이드API
   * @see http://www.law.go.kr/DRF/lawService.do?target=lstrm
   */
  async getLstrmDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'lstrm', ID: id, ...params });
  }

  /**
   * 맞춤형 법령 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=couseLs
   */
  async searchCouseLs(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'couseLs', ...params });
  }

  /**
   * 맞춤형 행정규칙 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=couseAdmrul
   */
  async searchCouseAdmrul(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'couseAdmrul', ...params });
  }

  /**
   * 맞춤형 자치법규 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=couseOrdin
   */
  async searchCouseOrdin(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'couseOrdin', ...params });
  }

  /**
   * 법령정보지식베이스 지능형 법령검색 시스템 검색 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=aiSearch
   */
  async searchAiSearch(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'aiSearch', ...params });
  }

  /**
   * 법령정보지식베이스 지능형 법령검색 시스템 연관법령 API
   * @see https://www.law.go.kr/DRF/lawSearch.do?target=aiRltLs
   */
  async searchAiRltLs(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'aiRltLs', ...params });
  }

  /**
   * 고용노동부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=moelCgmExpc
   */
  async searchMoelCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'moelCgmExpc', ...params });
  }

  /**
   * 고용노동부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=moelCgmExpc
   */
  async getMoelCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'moelCgmExpc', ID: id, ...params });
  }

  /**
   * 국토교통부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=molitCgmExpc
   */
  async searchMolitCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'molitCgmExpc', ...params });
  }

  /**
   * 국토교통부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=molitCgmExpc
   */
  async getMolitCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'molitCgmExpc', ID: id, ...params });
  }

  /**
   * 기획재정부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=moefCgmExpc
   */
  async searchMoefCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'moefCgmExpc', ...params });
  }

  /**
   * 해양수산부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mofCgmExpc
   */
  async searchMofCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mofCgmExpc', ...params });
  }

  /**
   * 해양수산부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mofCgmExpc
   */
  async getMofCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mofCgmExpc', ID: id, ...params });
  }

  /**
   * 행정안전부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=moisCgmExpc
   */
  async searchMoisCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'moisCgmExpc', ...params });
  }

  /**
   * 행정안전부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=moisCgmExpc
   */
  async getMoisCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'moisCgmExpc', ID: id, ...params });
  }

  /**
   * 기후에너지환경부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=meCgmExpc
   */
  async searchMeCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'meCgmExpc', ...params });
  }

  /**
   * 기후에너지환경부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=meCgmExpc
   */
  async getMeCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'meCgmExpc', ID: id, ...params });
  }

  /**
   * 관세청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=kcsCgmExpc
   */
  async searchKcsCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kcsCgmExpc', ...params });
  }

  /**
   * 관세청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=kcsCgmExpc
   */
  async getKcsCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kcsCgmExpc', ID: id, ...params });
  }

  /**
   * 국세청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=ntsCgmExpc
   */
  async searchNtsCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'ntsCgmExpc', ...params });
  }

  /**
   * 교육부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=moeCgmExpc
   */
  async searchMoeCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'moeCgmExpc', ...params });
  }

  /**
   * 교육부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=moeCgmExpc
   */
  async getMoeCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'moeCgmExpc', ID: id, ...params });
  }

  /**
   * 과학기술정보통신부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=msitCgmExpc
   */
  async searchMsitCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'msitCgmExpc', ...params });
  }

  /**
   * 과학기술정보통신부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=msitCgmExpc
   */
  async getMsitCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'msitCgmExpc', ID: id, ...params });
  }

  /**
   * 국가보훈부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mpvaCgmExpc
   */
  async searchMpvaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mpvaCgmExpc', ...params });
  }

  /**
   * 국가보훈부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mpvaCgmExpc
   */
  async getMpvaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mpvaCgmExpc', ID: id, ...params });
  }

  /**
   * 국방부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mndCgmExpc
   */
  async searchMndCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mndCgmExpc', ...params });
  }

  /**
   * 국방부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mndCgmExpc
   */
  async getMndCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mndCgmExpc', ID: id, ...params });
  }

  /**
   * 농림축산식품부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mafraCgmExpc
   */
  async searchMafraCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mafraCgmExpc', ...params });
  }

  /**
   * 농림축산식품부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mafraCgmExpc
   */
  async getMafraCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mafraCgmExpc', ID: id, ...params });
  }

  /**
   * 문화체육관광부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mcstCgmExpc
   */
  async searchMcstCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mcstCgmExpc', ...params });
  }

  /**
   * 문화체육관광부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mcstCgmExpc
   */
  async getMcstCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mcstCgmExpc', ID: id, ...params });
  }

  /**
   * 법무부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mojCgmExpc
   */
  async searchMojCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mojCgmExpc', ...params });
  }

  /**
   * 법무부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mojCgmExpc
   */
  async getMojCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mojCgmExpc', ID: id, ...params });
  }

  /**
   * 보건복지부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mohwCgmExpc
   */
  async searchMohwCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mohwCgmExpc', ...params });
  }

  /**
   * 보건복지부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mohwCgmExpc
   */
  async getMohwCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mohwCgmExpc', ID: id, ...params });
  }

  /**
   * 산업통상부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=motieCgmExpc
   */
  async searchMotieCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'motieCgmExpc', ...params });
  }

  /**
   * 산업통상부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=motieCgmExpc
   */
  async getMotieCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'motieCgmExpc', ID: id, ...params });
  }

  /**
   * 성평등가족부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mogefCgmExpc
   */
  async searchMogefCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mogefCgmExpc', ...params });
  }

  /**
   * 성평등가족부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mogefCgmExpc
   */
  async getMogefCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mogefCgmExpc', ID: id, ...params });
  }

  /**
   * 외교부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mofaCgmExpc
   */
  async searchMofaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mofaCgmExpc', ...params });
  }

  /**
   * 외교부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mofaCgmExpc
   */
  async getMofaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mofaCgmExpc', ID: id, ...params });
  }

  /**
   * 중소벤처기업부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mssCgmExpc
   */
  async searchMssCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mssCgmExpc', ...params });
  }

  /**
   * 중소벤처기업부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mssCgmExpc
   */
  async getMssCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mssCgmExpc', ID: id, ...params });
  }

  /**
   * 통일부 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mouCgmExpc
   */
  async searchMouCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mouCgmExpc', ...params });
  }

  /**
   * 통일부 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mouCgmExpc
   */
  async getMouCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mouCgmExpc', ID: id, ...params });
  }

  /**
   * 법제처 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=molegCgmExpc
   */
  async searchMolegCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'molegCgmExpc', ...params });
  }

  /**
   * 법제처 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=molegCgmExpc
   */
  async getMolegCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'molegCgmExpc', ID: id, ...params });
  }

  /**
   * 식품의약품안전처 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mfdsCgmExpc
   */
  async searchMfdsCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mfdsCgmExpc', ...params });
  }

  /**
   * 식품의약품안전처 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mfdsCgmExpc
   */
  async getMfdsCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mfdsCgmExpc', ID: id, ...params });
  }

  /**
   * 인사혁신처 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mpmCgmExpc
   */
  async searchMpmCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mpmCgmExpc', ...params });
  }

  /**
   * 인사혁신처 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mpmCgmExpc
   */
  async getMpmCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mpmCgmExpc', ID: id, ...params });
  }

  /**
   * 기상청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=kmaCgmExpc
   */
  async searchKmaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kmaCgmExpc', ...params });
  }

  /**
   * 기상청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=kmaCgmExpc
   */
  async getKmaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kmaCgmExpc', ID: id, ...params });
  }

  /**
   * 국가유산청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=khsCgmExpc
   */
  async searchKhsCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'khsCgmExpc', ...params });
  }

  /**
   * 국가유산청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=khsCgmExpc
   */
  async getKhsCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'khsCgmExpc', ID: id, ...params });
  }

  /**
   * 농촌진흥청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=rdaCgmExpc
   */
  async searchRdaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'rdaCgmExpc', ...params });
  }

  /**
   * 농촌진흥청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=rdaCgmExpc
   */
  async getRdaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'rdaCgmExpc', ID: id, ...params });
  }

  /**
   * 경찰청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=npaCgmExpc
   */
  async searchNpaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'npaCgmExpc', ...params });
  }

  /**
   * 경찰청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=npaCgmExpc
   */
  async getNpaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'npaCgmExpc', ID: id, ...params });
  }

  /**
   * 방위사업청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=dapaCgmExpc
   */
  async searchDapaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'dapaCgmExpc', ...params });
  }

  /**
   * 방위사업청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=dapaCgmExpc
   */
  async getDapaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'dapaCgmExpc', ID: id, ...params });
  }

  /**
   * 병무청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=mmaCgmExpc
   */
  async searchMmaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'mmaCgmExpc', ...params });
  }

  /**
   * 병무청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=mmaCgmExpc
   */
  async getMmaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'mmaCgmExpc', ID: id, ...params });
  }

  /**
   * 산림청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=kfsCgmExpc
   */
  async searchKfsCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kfsCgmExpc', ...params });
  }

  /**
   * 산림청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=kfsCgmExpc
   */
  async getKfsCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kfsCgmExpc', ID: id, ...params });
  }

  /**
   * 소방청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=nfaCgmExpc
   */
  async searchNfaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'nfaCgmExpc', ...params });
  }

  /**
   * 소방청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=nfaCgmExpc
   */
  async getNfaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'nfaCgmExpc', ID: id, ...params });
  }

  /**
   * 재외동포청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=okaCgmExpc
   */
  async searchOkaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'okaCgmExpc', ...params });
  }

  /**
   * 재외동포청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=okaCgmExpc
   */
  async getOkaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'okaCgmExpc', ID: id, ...params });
  }

  /**
   * 조달청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=ppsCgmExpc
   */
  async searchPpsCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'ppsCgmExpc', ...params });
  }

  /**
   * 조달청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=ppsCgmExpc
   */
  async getPpsCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'ppsCgmExpc', ID: id, ...params });
  }

  /**
   * 질병관리청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=kdcaCgmExpc
   */
  async searchKdcaCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kdcaCgmExpc', ...params });
  }

  /**
   * 질병관리청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=kdcaCgmExpc
   */
  async getKdcaCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kdcaCgmExpc', ID: id, ...params });
  }

  /**
   * 국가데이터처 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=kostatCgmExpc
   */
  async searchKostatCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kostatCgmExpc', ...params });
  }

  /**
   * 국가데이터처 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=kostatCgmExpc
   */
  async getKostatCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kostatCgmExpc', ID: id, ...params });
  }

  /**
   * 지식재산처 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=kipoCgmExpc
   */
  async searchKipoCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kipoCgmExpc', ...params });
  }

  /**
   * 지식재산처 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=kipoCgmExpc
   */
  async getKipoCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kipoCgmExpc', ID: id, ...params });
  }

  /**
   * 해양경찰청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=kcgCgmExpc
   */
  async searchKcgCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kcgCgmExpc', ...params });
  }

  /**
   * 해양경찰청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=kcgCgmExpc
   */
  async getKcgCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kcgCgmExpc', ID: id, ...params });
  }

  /**
   * 행정중심복합도시건설청 법령해석 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=naaccCgmExpc
   */
  async searchNaaccCgmExpc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'naaccCgmExpc', ...params });
  }

  /**
   * 행정중심복합도시건설청 법령해석 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=naaccCgmExpc
   */
  async getNaaccCgmExpcDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'naaccCgmExpc', ID: id, ...params });
  }

  /**
   * 조세심판원 특별행정심판재결례 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=ttSpecialDecc
   */
  async searchTtSpecialDecc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'ttSpecialDecc', ...params });
  }

  /**
   * 조세심판원 특별행정심판재결례 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=ttSpecialDecc
   */
  async getTtSpecialDeccDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'ttSpecialDecc', ID: id, ...params });
  }

  /**
   * 해양안전심판원 특별행정심판재결례 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=kmstSpecialDecc
   */
  async searchKmstSpecialDecc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'kmstSpecialDecc', ...params });
  }

  /**
   * 해양안전심판원 특별행정심판재결례 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=kmstSpecialDecc
   */
  async getKmstSpecialDeccDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'kmstSpecialDecc', ID: id, ...params });
  }

  /**
   * 국민권익위원회 특별행정심판재결례 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=acrSpecialDecc
   */
  async searchAcrSpecialDecc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'acrSpecialDecc', ...params });
  }

  /**
   * 국민권익위원회 특별행정심판재결례 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=acrSpecialDecc
   */
  async getAcrSpecialDeccDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'acrSpecialDecc', ID: id, ...params });
  }

  /**
   * 인사혁신처 소청심사위원회 특별행정심판재결례 목록 조회 API
   * @see http://www.law.go.kr/DRF/lawSearch.do?target=adapSpecialDecc
   */
  async searchAdapSpecialDecc(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawSearch.do', { target: 'adapSpecialDecc', ...params });
  }

  /**
   * 인사혁신처 소청심사위원회 특별행정심판재결례 본문 조회 API
   * @see http://www.law.go.kr/DRF/lawService.do?target=adapSpecialDecc
   */
  async getAdapSpecialDeccDetail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/lawService.do', { target: 'adapSpecialDecc', ID: id, ...params });
  }

}

// 싱글톤 인스턴스 생성 헬퍼
let defaultClient: KoreaLawApiClient | null = null;

export function initClient(config: ApiClientConfig): KoreaLawApiClient {
  defaultClient = new KoreaLawApiClient(config);
  return defaultClient;
}

export function getClient(): KoreaLawApiClient {
  if (!defaultClient) {
    throw new Error('Client not initialized. Call initClient() first.');
  }
  return defaultClient;
}

export default KoreaLawApiClient;
