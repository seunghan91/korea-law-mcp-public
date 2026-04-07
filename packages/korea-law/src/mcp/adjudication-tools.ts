/**
 * korea-law: 심판/결정 도구 (adjudication-tools)
 *
 * 조세심판원 특별행정심판재결례와 공정거래위원회 결정문을
 * 검색/조회하는 4개 MCP 도구를 제공합니다.
 *
 * ⚠️ 주의: 이 데이터는 AI 검증용입니다. 법적 판단의 최종 근거로 사용하지 마세요.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  searchExtendedTribunalDecisions,
  getExtendedTribunalDecisionDetail,
  searchCommitteeDecisions,
  getCommitteeDecisionDetail,
} from '../api/extended-api';

// ============================================
// 도구 정의
// ============================================

const searchTaxTribunalTool: Tool = {
  name: 'search_tax_tribunal',
  description: `[조세심판원 재결례 검색] 조세심판원의 특별행정심판 재결례를 키워드로 검색합니다. 세금 관련 분쟁, 조세 불복, 국세/지방세 심판 결정을 조회합니다.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '검색 키워드 (예: "양도소득세", "부가가치세 매입세액")',
      },
      display: {
        type: 'number',
        description: '검색 결과 수 (기본값: 20)',
      },
    },
    required: ['query'],
  },
};

const getTaxTribunalTextTool: Tool = {
  name: 'get_tax_tribunal_text',
  description: `[조세심판원 재결례 본문] 조세심판원 재결례의 전문(사건번호, 주문, 이유, 결정내용)을 조회합니다. search_tax_tribunal에서 얻은 일련번호(serial_number)를 사용합니다.`,
  inputSchema: {
    type: 'object',
    properties: {
      decision_id: {
        type: 'string',
        description: '재결례 일련번호 (search_tax_tribunal 결과의 serial_number)',
      },
    },
    required: ['decision_id'],
  },
};

const searchFtcDecisionsTool: Tool = {
  name: 'search_ftc_decisions',
  description: `[공정거래위원회 결정문 검색] 공정거래위원회의 결정문을 키워드로 검색합니다. 독점규제, 불공정거래, 기업결합, 카르텔 관련 결정을 조회합니다.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '검색 키워드 (예: "시장지배적지위", "기업결합", "카르텔")',
      },
      display: {
        type: 'number',
        description: '검색 결과 수 (기본값: 20)',
      },
    },
    required: ['query'],
  },
};

const getFtcDecisionTextTool: Tool = {
  name: 'get_ftc_decision_text',
  description: `[공정거래위원회 결정문 본문] 공정거래위원회 결정문의 전문(사건번호, 주문, 이유, 시정명령 내용)을 조회합니다. search_ftc_decisions에서 얻은 일련번호(serial_number)를 사용합니다.`,
  inputSchema: {
    type: 'object',
    properties: {
      decision_id: {
        type: 'string',
        description: '결정문 일련번호 (search_ftc_decisions 결과의 serial_number)',
      },
    },
    required: ['decision_id'],
  },
};

// ============================================
// 핸들러
// ============================================

async function handleSearchTaxTribunal(args: {
  query: string;
  display?: number;
}): Promise<string> {
  try {
    const { query, display = 20 } = args;
    const results = await searchExtendedTribunalDecisions('tax', query, display);

    if (!results || results.length === 0) {
      return JSON.stringify({
        status: 'NO_RESULTS',
        query,
        total_count: 0,
        decisions: [],
        verification_note: '조세심판원 재결례 검색 결과가 없습니다. 다른 키워드로 검색해 보세요.',
      });
    }

    const decisions = results.map((d: any) => ({
      serial_number: d.일련번호,
      case_number: d.사건번호,
      case_name: d.사건명,
      decision_date: d.재결일자,
      result: d.재결결과,
      summary: d.재결요지?.substring(0, 200),
    }));

    return JSON.stringify({
      status: 'SUCCESS',
      query,
      total_count: decisions.length,
      decisions,
      verification_note: '⚠️ AI 검증용 데이터입니다. 법적 판단의 최종 근거로 사용하지 마세요.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleGetTaxTribunalText(args: {
  decision_id: string;
}): Promise<string> {
  try {
    const { decision_id } = args;
    const detail = await getExtendedTribunalDecisionDetail('tax', decision_id);

    if (!detail) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        error: `재결례 일련번호 "${decision_id}"에 해당하는 본문을 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'SUCCESS',
      decision_id,
      detail,
      verification_note: '⚠️ AI 검증용 데이터입니다. 법적 판단의 최종 근거로 사용하지 마세요.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleSearchFtcDecisions(args: {
  query: string;
  display?: number;
}): Promise<string> {
  try {
    const { query, display = 20 } = args;
    const results = await searchCommitteeDecisions('monopoly', query, display);

    if (!results || results.length === 0) {
      return JSON.stringify({
        status: 'NO_RESULTS',
        query,
        total_count: 0,
        decisions: [],
        verification_note: '공정거래위원회 결정문 검색 결과가 없습니다. 다른 키워드로 검색해 보세요.',
      });
    }

    const decisions = results.map((d: any) => ({
      serial_number: d.일련번호,
      case_number: d.사건번호,
      case_name: d.사건명,
      decision_date: d.결정일자,
      result: d.결정유형,
      summary: d.결정요지?.substring(0, 200),
    }));

    return JSON.stringify({
      status: 'SUCCESS',
      query,
      total_count: decisions.length,
      decisions,
      verification_note: '⚠️ AI 검증용 데이터입니다. 법적 판단의 최종 근거로 사용하지 마세요.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleGetFtcDecisionText(args: {
  decision_id: string;
}): Promise<string> {
  try {
    const { decision_id } = args;
    const detail = await getCommitteeDecisionDetail('monopoly', decision_id);

    if (!detail) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        error: `결정문 일련번호 "${decision_id}"에 해당하는 본문을 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'SUCCESS',
      decision_id,
      detail,
      verification_note: '⚠️ AI 검증용 데이터입니다. 법적 판단의 최종 근거로 사용하지 마세요.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 내보내기
// ============================================

export const ADJUDICATION_TOOLS: Tool[] = [
  searchTaxTribunalTool,
  getTaxTribunalTextTool,
  searchFtcDecisionsTool,
  getFtcDecisionTextTool,
];

export const ADJUDICATION_TOOL_HANDLERS: Record<string, (args: any) => Promise<string>> = {
  search_tax_tribunal: handleSearchTaxTribunal,
  get_tax_tribunal_text: handleGetTaxTribunalText,
  search_ftc_decisions: handleSearchFtcDecisions,
  get_ftc_decision_text: handleGetFtcDecisionText,
};

export const ADJUDICATION_TOOL_NAMES = Object.keys(ADJUDICATION_TOOL_HANDLERS);
