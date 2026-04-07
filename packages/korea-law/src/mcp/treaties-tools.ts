/**
 * korea-law: 조약/자치법규/고용노동부 해석례 MCP 도구
 *
 * - search_treaties / get_treaty_text (API-03)
 * - search_ordinances / get_ordinance_text (API-04)
 * - search_labor_interpretations / get_labor_interpretation_text (API-05)
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { searchTreaties, getTreatyDetail } from '../api/precedent-api';
import { KoreaLawApiClient } from '../generated/client';
import { METROPOLITAN_GOVERNMENTS } from '../sync/local-governments';
import { XMLParser } from 'fast-xml-parser';

// ============================================
// XML 파서 (자치법규/노동부 해석례용)
// ============================================

const xmlParser = new XMLParser({ ignoreAttributes: false });

function getApiClient(): KoreaLawApiClient {
  return new KoreaLawApiClient({
    oc: process.env.LAW_OC || 'test',
  });
}

/**
 * 응답에서 items 배열을 추출하는 유틸리티
 */
function parseItems(data: any, rootKey: string, itemKey: string): any[] {
  const root = data?.[rootKey];
  if (!root) return [];
  const items = root[itemKey];
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

// ============================================
// 도구 정의
// ============================================

const searchTreatiesTool: Tool = {
  name: 'search_treaties',
  description: `[조약 검색] 조약을 키워드로 검색합니다. 조약명, 체결일, 당사국 등이 포함된 목록을 반환합니다.

사용 예시:
- search_treaties({ query: "대한민국 일본" })
- search_treaties({ query: "투자보장", display: 50 })`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '검색 키워드 (예: "투자보장", "범죄인인도")',
      },
      display: {
        type: 'number',
        description: '검색 결과 수 (기본 20, 최대 100)',
      },
    },
    required: ['query'],
  },
};

const getTreatyTextTool: Tool = {
  name: 'get_treaty_text',
  description: `[조약 본문 조회] 조약일련번호로 조약 전문을 조회합니다. 체결일자, 발효일자, 당사국, 조약내용을 반환합니다.

사용 예시:
- get_treaty_text({ treaty_id: "0000001" })`,
  inputSchema: {
    type: 'object',
    properties: {
      treaty_id: {
        type: 'string',
        description: '조약일련번호',
      },
    },
    required: ['treaty_id'],
  },
};

const searchOrdinancesTool: Tool = {
  name: 'search_ordinances',
  description: `[자치법규 검색] 자치법규를 키워드/지역명으로 검색합니다. 자치법규명, 지자체명, 공포일자를 반환합니다.

사용 예시:
- search_ordinances({ query: "주차" })
- search_ordinances({ query: "환경", region: "서울특별시" })`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '검색 키워드 (예: "주차", "환경보전")',
      },
      region: {
        type: 'string',
        description: '지역명 (예: "서울특별시", "경기도"). 생략 시 전국 검색',
      },
      display: {
        type: 'number',
        description: '검색 결과 수 (기본 20)',
      },
    },
    required: ['query'],
  },
};

const getOrdinanceTextTool: Tool = {
  name: 'get_ordinance_text',
  description: `[자치법규 본문 조회] 자치법규일련번호로 조문 내용을 조회합니다.

사용 예시:
- get_ordinance_text({ ordinance_id: "0000001" })`,
  inputSchema: {
    type: 'object',
    properties: {
      ordinance_id: {
        type: 'string',
        description: '자치법규일련번호',
      },
    },
    required: ['ordinance_id'],
  },
};

const searchLaborInterpretationsTool: Tool = {
  name: 'search_labor_interpretations',
  description: `[고용노동부 해석례 검색] 고용노동부 법령해석례를 키워드로 검색합니다. 안건명, 회신일자, 회신기관명을 반환합니다.

사용 예시:
- search_labor_interpretations({ query: "연차휴가" })
- search_labor_interpretations({ query: "퇴직금", display: 50 })`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '검색 키워드 (예: "연차휴가", "퇴직금")',
      },
      display: {
        type: 'number',
        description: '검색 결과 수 (기본 20)',
      },
    },
    required: ['query'],
  },
};

const getLaborInterpretationTextTool: Tool = {
  name: 'get_labor_interpretation_text',
  description: `[고용노동부 해석례 본문 조회] 일련번호로 해석례 전문을 조회합니다. 질의요지, 회답, 이유, 참조조문, 참조판례를 반환합니다.

사용 예시:
- get_labor_interpretation_text({ interpretation_id: "0000001" })`,
  inputSchema: {
    type: 'object',
    properties: {
      interpretation_id: {
        type: 'string',
        description: '일련번호',
      },
    },
    required: ['interpretation_id'],
  },
};

// ============================================
// 핸들러
// ============================================

async function handleSearchTreaties(args: {
  query: string;
  display?: number;
}): Promise<string> {
  try {
    const display = Math.min(args.display || 20, 100);
    const items = await searchTreaties(args.query, display);

    if (items.length === 0) {
      return JSON.stringify({ message: '검색 결과 없음', total: 0, items: [] });
    }

    return JSON.stringify({
      message: `조약 검색 결과 (${items.length}건)`,
      total: items.length,
      items: items.map((item) => ({
        조약명: item.조약명,
        조약종류명: item.조약종류명,
        체결일자: item.체결일자,
        발효일자: item.발효일자,
        당사국: item.당사국,
        조약일련번호: item.조약일련번호,
      })),
    });
  } catch (e) {
    return JSON.stringify({ error: `조약 검색 실패: ${(e as Error).message}` });
  }
}

async function handleGetTreatyText(args: {
  treaty_id: string;
}): Promise<string> {
  try {
    const detail = await getTreatyDetail(args.treaty_id);

    if (!detail) {
      return JSON.stringify({ error: '조약을 찾을 수 없습니다' });
    }

    const lines = [
      `# ${detail.조약명}`,
      '',
      `**체결일자:** ${detail.체결일자}`,
      `**발효일자:** ${detail.발효일자}`,
      `**당사국:** ${detail.당사국}`,
      `**조약종류:** ${detail.조약종류명}`,
      '',
      '---',
      '',
      detail.조약내용,
    ];

    if (detail.비고) {
      lines.push('', '---', '', `**비고:** ${detail.비고}`);
    }

    return lines.join('\n');
  } catch (e) {
    return JSON.stringify({ error: `조약 조회 실패: ${(e as Error).message}` });
  }
}

async function handleSearchOrdinances(args: {
  query: string;
  region?: string;
  display?: number;
}): Promise<string> {
  try {
    const client = getApiClient();
    const display = args.display || 20;

    const params: Record<string, any> = {
      query: args.query,
      display,
    };

    // 지역 코드 매핑
    if (args.region) {
      const gov = METROPOLITAN_GOVERNMENTS.find(
        (g) => g.name === args.region || g.name.includes(args.region!)
      );
      if (gov) {
        params.org = gov.code;
      }
    }

    const data = await client.searchOrdin(params);

    // KoreaLawApiClient uses xml2js which wraps in objects
    // Response structure: OrdinSearch.Ordin
    const root = data?.OrdinSearch || data;
    let items = root?.Ordin || root?.ordin || [];
    if (!Array.isArray(items)) items = items ? [items] : [];

    if (items.length === 0) {
      return JSON.stringify({ message: '검색 결과 없음', total: 0, items: [] });
    }

    return JSON.stringify({
      message: `자치법규 검색 결과 (${items.length}건)`,
      total: items.length,
      items: items.map((item: any) => ({
        자치법규일련번호: item.자치법규일련번호 || item['자치법규ID'] || '',
        자치법규명: item.자치법규명 || item['자치법규명칭'] || '',
        지자체명: item.자치단체명 || item.지자체명 || '',
        공포일자: item.공포일자 || '',
      })),
    });
  } catch (e) {
    return JSON.stringify({ error: `자치법규 검색 실패: ${(e as Error).message}` });
  }
}

async function handleGetOrdinanceText(args: {
  ordinance_id: string;
}): Promise<string> {
  try {
    const client = getApiClient();
    const data = await client.getOrdinDetail(args.ordinance_id);

    // 응답 구조: OrdinService 또는 자치법규본문
    const root = data?.OrdinService || data?.자치법규본문 || data;
    if (!root) {
      return JSON.stringify({ error: '자치법규를 찾을 수 없습니다' });
    }

    const 기본정보 = root?.기본정보 || root?.자치법규기본정보 || root;
    const 조문목록 = root?.조문 || root?.조문목록 || root?.자치법규조문 || [];

    const name = 기본정보?.자치법규명 || 기본정보?.자치법규명칭 || '';
    const org = 기본정보?.자치단체명 || '';
    const date = 기본정보?.공포일자 || '';

    const lines = [
      `# ${name}`,
      '',
      `**자치단체:** ${org}`,
      `**공포일자:** ${date}`,
      '',
      '---',
      '',
    ];

    // 조문 내용 추출
    const articles = Array.isArray(조문목록) ? 조문목록 : [조문목록];
    for (const article of articles) {
      if (!article) continue;
      const 조문번호 = article.조문번호 || article['조문번호'] || '';
      const 조문제목 = article.조문제목 || article['조문제목'] || '';
      const 조문내용 = article.조문내용 || article['조문내용'] || '';
      if (조문번호 || 조문제목) {
        lines.push(`### 제${조문번호}조 ${조문제목}`.trim());
      }
      if (조문내용) {
        lines.push(조문내용);
      }
      lines.push('');
    }

    return lines.join('\n');
  } catch (e) {
    return JSON.stringify({ error: `자치법규 조회 실패: ${(e as Error).message}` });
  }
}

async function handleSearchLaborInterpretations(args: {
  query: string;
  display?: number;
}): Promise<string> {
  try {
    const client = getApiClient();
    const display = args.display || 20;

    const data = await client.searchMoelCgmExpc({
      query: args.query,
      display,
    });

    // Response structure: MoelCgmExpcSearch.MoelCgmExpc
    const root = data?.MoelCgmExpcSearch || data;
    let items = root?.MoelCgmExpc || root?.moelCgmExpc || [];
    if (!Array.isArray(items)) items = items ? [items] : [];

    if (items.length === 0) {
      return JSON.stringify({ message: '검색 결과 없음', total: 0, items: [] });
    }

    return JSON.stringify({
      message: `고용노동부 해석례 검색 결과 (${items.length}건)`,
      total: items.length,
      items: items.map((item: any) => ({
        일련번호: item.일련번호 || item['해석례일련번호'] || '',
        안건명: item.안건명 || item['제목'] || '',
        회신일자: item.회신일자 || item['회답일자'] || '',
        회신기관명: item.회신기관명 || item['회신기관'] || '',
      })),
    });
  } catch (e) {
    return JSON.stringify({ error: `고용노동부 해석례 검색 실패: ${(e as Error).message}` });
  }
}

async function handleGetLaborInterpretationText(args: {
  interpretation_id: string;
}): Promise<string> {
  try {
    const client = getApiClient();
    const data = await client.getMoelCgmExpcDetail(args.interpretation_id);

    // 응답 구조: MoelCgmExpcService 또는 유사 루트
    const root = data?.MoelCgmExpcService || data?.고용노동부해석례 || data;
    if (!root) {
      return JSON.stringify({ error: '해석례를 찾을 수 없습니다' });
    }

    const 기본정보 = root?.기본정보 || root;
    const 안건명 = 기본정보?.안건명 || 기본정보?.제목 || '';
    const 질의요지 = root?.질의요지 || 기본정보?.질의요지 || '';
    const 회답 = root?.회답 || 기본정보?.회답 || '';
    const 이유 = root?.이유 || 기본정보?.이유 || '';
    const 참조조문 = root?.참조조문 || 기본정보?.참조조문 || '';
    const 참조판례 = root?.참조판례 || 기본정보?.참조판례 || '';
    const 회신일자 = 기본정보?.회신일자 || 기본정보?.회답일자 || '';
    const 회신기관명 = 기본정보?.회신기관명 || 기본정보?.회신기관 || '';

    const lines = [
      `# ${안건명}`,
      '',
      `**회신일자:** ${회신일자}`,
      `**회신기관:** ${회신기관명}`,
      '',
      '---',
      '',
    ];

    if (질의요지) {
      lines.push('## 질의요지', '', 질의요지, '');
    }
    if (회답) {
      lines.push('## 회답', '', 회답, '');
    }
    if (이유) {
      lines.push('## 이유', '', 이유, '');
    }
    if (참조조문) {
      lines.push('## 참조조문', '', 참조조문, '');
    }
    if (참조판례) {
      lines.push('## 참조판례', '', 참조판례, '');
    }

    return lines.join('\n');
  } catch (e) {
    return JSON.stringify({ error: `해석례 조회 실패: ${(e as Error).message}` });
  }
}

// ============================================
// 내보내기
// ============================================

export const TREATY_TOOLS: Tool[] = [
  searchTreatiesTool,
  getTreatyTextTool,
  searchOrdinancesTool,
  getOrdinanceTextTool,
  searchLaborInterpretationsTool,
  getLaborInterpretationTextTool,
];

export const TREATY_TOOL_HANDLERS: Record<string, (args: any) => Promise<string>> = {
  search_treaties: handleSearchTreaties,
  get_treaty_text: handleGetTreatyText,
  search_ordinances: handleSearchOrdinances,
  get_ordinance_text: handleGetOrdinanceText,
  search_labor_interpretations: handleSearchLaborInterpretations,
  get_labor_interpretation_text: handleGetLaborInterpretationText,
};

export const TREATY_TOOL_NAMES = Object.keys(TREATY_TOOL_HANDLERS);
