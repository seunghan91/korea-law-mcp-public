/**
 * korea-law: MCP Server
 * 
 * AI Legal Auditor - 한국 법률 검증 MCP 서버
 * 
 * ⚠️ 이 서버는 AI의 법률 인용을 "검증"하기 위한 도구입니다.
 * 법적 판단의 최종 근거로 사용하지 마세요.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
  Prompt,
} from '@modelcontextprotocol/sdk/types.js';

import * as db from '../db/database';
import * as api from '../api/law-api';
import * as extendedApi from '../api/extended-api';
import * as precedentApi from '../api/precedent-api';
import { format, parseISO, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { supabaseDB } from '../db/supabase-client';
import { parseBrackets, simplifyText, getBracketStats, extractReferencedArticles, BRACKET_HIGHLIGHT_CSS } from '../utils/bracket-parser';

// PostgreSQL 모듈 동적 import (플랫폼 호환성)
let pgModule: typeof import('../db/postgres') | null = null;
async function loadPostgresModule() {
  if (!pgModule) {
    try {
      pgModule = await import('../db/postgres');
    } catch (e) {
      console.warn('⚠️ PostgreSQL module not available:', (e as Error).message);
    }
  }
  return pgModule;
}

// Wrapper functions for postgres module
async function isPostgresEnabled(): Promise<boolean> {
  const pg = await loadPostgresModule();
  return pg?.isPostgresEnabled() ?? false;
}

async function pgSearchConstructionStandards(...args: Parameters<typeof import('../db/postgres').searchConstructionStandards>) {
  const pg = await loadPostgresModule();
  if (!pg) return [];
  return pg.searchConstructionStandards(...args);
}

async function pgGetStandardDetails(...args: Parameters<typeof import('../db/postgres').getStandardDetails>) {
  const pg = await loadPostgresModule();
  if (!pg) return null;
  return pg.getStandardDetails(...args);
}

async function pgGetStandardRevisions(...args: Parameters<typeof import('../db/postgres').getStandardRevisions>) {
  const pg = await loadPostgresModule();
  if (!pg) return [];
  return pg.getStandardRevisions(...args);
}

async function pgSearchAllRegulations(...args: Parameters<typeof import('../db/postgres').searchAllRegulations>) {
  const pg = await loadPostgresModule();
  if (!pg) return { laws: [], standards: [] };
  return pg.searchAllRegulations(...args);
}

// 새로운 검증 함수 import
import {
  checkCitation,
  validateLawReferences,
  searchArticlesFTS,
  findRelatedArticles,
  extractReferences,
  getLawById,
  getArticlesByLawId,
  calculateTextSimilarity,
} from '../db/database';

// 🆕 하이브리드 엔진 도구 - 동적 import (플랫폼 호환성)
let hybridToolsModule: {
  HYBRID_TOOLS: any[];
  HYBRID_TOOL_HANDLERS: Record<string, Function>;
  HYBRID_TOOL_NAMES: string[];
} | null = null;

async function loadHybridTools() {
  if (!hybridToolsModule) {
    try {
      hybridToolsModule = await import('./hybrid-tools');
    } catch (e) {
      console.warn('⚠️ Hybrid tools not available:', (e as Error).message);
      hybridToolsModule = {
        HYBRID_TOOLS: [],
        HYBRID_TOOL_HANDLERS: {},
        HYBRID_TOOL_NAMES: [],
      };
    }
  }
  return hybridToolsModule;
}

// Fallback values (will be populated on first load)
let HYBRID_TOOLS: any[] = [];
let HYBRID_TOOL_HANDLERS: Record<string, Function> = {};
let HYBRID_TOOL_NAMES: string[] = [];

// 🆕 @markdown-media/core 네이티브 도구 - 동적 import (플랫폼 호환성)
let nativeToolsModule: {
  NATIVE_TOOLS: any[];
  NATIVE_TOOL_HANDLERS: Record<string, Function>;
  NATIVE_TOOL_NAMES: string[];
} | null = null;

async function loadNativeTools() {
  if (!nativeToolsModule) {
    try {
      nativeToolsModule = await import('./native-tools');
    } catch (e) {
      console.warn('⚠️ Native tools not available:', (e as Error).message);
      nativeToolsModule = {
        NATIVE_TOOLS: [],
        NATIVE_TOOL_HANDLERS: {},
        NATIVE_TOOL_NAMES: [],
      };
    }
  }
  return nativeToolsModule;
}

// Fallback values (will be populated on first load)
let NATIVE_TOOLS: any[] = [];
let NATIVE_TOOL_HANDLERS: Record<string, Function> = {};
let NATIVE_TOOL_NAMES: string[] = [];

// 🆕 별표/서식 도구 - 동적 import (annex-downloader pipeline)
let annexToolsModule: {
  ANNEX_TOOLS: any[];
  ANNEX_TOOL_HANDLERS: Record<string, Function>;
  ANNEX_TOOL_NAMES: string[];
} | null = null;

async function loadAnnexTools() {
  if (!annexToolsModule) {
    try {
      annexToolsModule = await import('./annex-tools');
    } catch (e) {
      console.error('Warning: Annex tools failed to load:', (e as Error).message);
      annexToolsModule = {
        ANNEX_TOOLS: [],
        ANNEX_TOOL_HANDLERS: {},
        ANNEX_TOOL_NAMES: [],
      };
    }
  }
  return annexToolsModule;
}

// Fallback values for annex tools
let ANNEX_TOOLS: any[] = [];
let ANNEX_TOOL_HANDLERS: Record<string, Function> = {};
let ANNEX_TOOL_NAMES: string[] = [];

// 🆕 체인 도구 - 동적 import (chain-executor + chain-tools)
let chainToolsModule: {
  CHAIN_TOOLS: any[];
  CHAIN_TOOL_HANDLERS: Record<string, Function>;
  CHAIN_TOOL_NAMES: string[];
  initChainTools: (dispatch: any) => void;
} | null = null;

async function loadChainTools() {
  if (!chainToolsModule) {
    try {
      chainToolsModule = await import('./chain-tools');
    } catch (e) {
      console.error('Warning: Chain tools failed to load:', (e as Error).message);
      chainToolsModule = {
        CHAIN_TOOLS: [],
        CHAIN_TOOL_HANDLERS: {},
        CHAIN_TOOL_NAMES: [],
        initChainTools: () => {},
      };
    }
  }
  return chainToolsModule;
}

// Fallback values for chain tools
let CHAIN_TOOLS: any[] = [];
let CHAIN_TOOL_HANDLERS: Record<string, Function> = {};
let CHAIN_TOOL_NAMES: string[] = [];

// 🆕 심판/결정 도구 - 동적 import (adjudication-tools)
let adjudicationToolsModule: {
  ADJUDICATION_TOOLS: any[];
  ADJUDICATION_TOOL_HANDLERS: Record<string, Function>;
  ADJUDICATION_TOOL_NAMES: string[];
} | null = null;

async function loadAdjudicationTools() {
  if (!adjudicationToolsModule) {
    try {
      adjudicationToolsModule = await import('./adjudication-tools');
    } catch (e) {
      console.error('Warning: Adjudication tools failed to load:', (e as Error).message);
      adjudicationToolsModule = {
        ADJUDICATION_TOOLS: [],
        ADJUDICATION_TOOL_HANDLERS: {},
        ADJUDICATION_TOOL_NAMES: [],
      };
    }
  }
  return adjudicationToolsModule;
}

// Fallback values for adjudication tools
let ADJUDICATION_TOOLS: any[] = [];
let ADJUDICATION_TOOL_HANDLERS: Record<string, Function> = {};
let ADJUDICATION_TOOL_NAMES: string[] = [];

// 🆕 조약/자치법규/노동부 해석례 도구 - 동적 import
let treatyToolsModule: {
  TREATY_TOOLS: any[];
  TREATY_TOOL_HANDLERS: Record<string, Function>;
  TREATY_TOOL_NAMES: string[];
} | null = null;

async function loadTreatyTools() {
  if (!treatyToolsModule) {
    try {
      treatyToolsModule = await import('./treaties-tools');
    } catch (e) {
      console.error('Warning: Treaty tools failed to load:', (e as Error).message);
      treatyToolsModule = {
        TREATY_TOOLS: [],
        TREATY_TOOL_HANDLERS: {},
        TREATY_TOOL_NAMES: [],
      };
    }
  }
  return treatyToolsModule;
}

let TREATY_TOOLS: any[] = [];
let TREATY_TOOL_HANDLERS: Record<string, Function> = {};
let TREATY_TOOL_NAMES: string[] = [];

// ============================================
// 법령 직접 링크 생성 유틸리티
// ============================================

function getLawGoKrLink(lawName: string, articleNo?: string): string {
  const encodedLawName = encodeURIComponent(lawName);
  if (articleNo) {
    return `https://www.law.go.kr/법령/${encodedLawName}/${articleNo}`;
  }
  return `https://www.law.go.kr/법령/${encodedLawName}`;
}

function getPrecedentLink(caseId: string): string {
  return `https://www.law.go.kr/판례/(${encodeURIComponent(caseId)})`;
}

// ============================================
// MCP Prompts 정의 (rule.md 기반)
// ============================================

const PROMPTS: Prompt[] = [
  {
    name: 'legal-auditor',
    description: `대한민국 법률 규정 감사관(Korea Legal Compliance Auditor) 페르소나 - 
AI가 법적 사고방식(Legal Mind)으로 헌법부터 시작해 법률, 판례 순으로 논리를 전개하도록 합니다.`,
  },
  {
    name: 'legal-reasoning',
    description: `단계별 법적 추론(Chain of Thought) 프롬프트 - 
헌법적 가치 검토 → 법률 검토 → 판례 검토 → 종합 조언 순서로 답변하도록 합니다.`,
  },
];

// System Prompt 전문 (rule.md 기반)
const LEGAL_AUDITOR_PROMPT = `# Role: Korea Legal Compliance Auditor (대한민국 법률 규정 감사관)

## 1. Core Mission
당신은 대한민국 법령 체계에 대한 깊은 이해를 바탕으로, 사용자의 질문이나 AI의 답변이 **'법적 정합성'**을 갖추고 있는지 검증하고 조언하는 최고 권위의 감사관입니다. 단순한 텍스트 매칭이 아니라, 법의 **위계(Hierarchy)**와 **취지(Spirit)**를 고려하여 판단하십시오.

## 2. The Hierarchy of Laws (법령의 위계)
모든 판단은 아래의 우선순위를 엄격히 따릅니다. 상위 단계는 하위 단계를 기속합니다.

1.  **[헌법 (Constitution)]**: 최상위 규범. (인권, 노동3권, 평등권 등 기본권 침해 여부 최우선 검토)
2.  **[법률 (Act)]**: 국회 제정 법률. (권리와 의무의 기본 기준)
3.  **[명령 (Decree)]**: 대통령령(시행령) > 총리령/부령(시행규칙). (구체적 절차와 위임 사항)
4.  **[행정규칙 (Administrative Rules)]**: 훈령, 예규, 고시. (실무적 지침이나, 상위법을 거스를 수 없음)
5.  **[자치법규/판례]**: 조례/규칙 및 대법원 판례(해석 기준).

## 3. Judgment Principles (판단 원칙)
정보가 충돌할 경우 다음 원칙을 적용하여 해결책을 제시하십시오.

* **상위법 우선 (Lex Superior):** 노동부 지침이 근로기준법(법률)보다 근로자에게 불리하거나 법 취지를 왜곡한다면, **법률**을 따르도록 경고하십시오.
* **신법 우선 (Lex Posterior):** \`korea-law\` 도구를 통해 확인된 **가장 최신의 '시행일(Enforcement Date)'** 기준 법령을 정답으로 간주하십시오.
* **특별법 우선 (Lex Specialis):** 일반법(민법)보다 특별법(상법, 근로기준법)을 먼저 적용하십시오.
* **유리한 조건 우선 (노동법 특칙):** 근로계약, 취업규칙, 법령 중 근로자에게 가장 유리한 조건을 우선 적용하십시오.

## 4. Verification Workflow (검증 절차)
사용자의 입력이나 초안을 검토할 때 반드시 다음 단계를 거쳐 생각하십시오(Chain of Thought).

1.  **[Fact Check]**: 인용된 법령(제 몇 조)이 \`audit_statute\` 도구를 통해 확인된 **현행 실제 텍스트**와 일치하는가?
2.  **[Hierarchy Check]**: 해당 조항이 헌법적 가치(예: 직업의 자유, 적법절차)나 상위법에 위배되지 않는가?
3.  **[Status Check]**: 해당 조항이 현재 시행 중인가, 아니면 단순 공포(미시행) 상태인가? (Diff 확인)

## 5. Output Format (답변 양식)
최종 답변은 반드시 아래 구조를 따르십시오.

* **🔍 검토 결과 (Verdict):** [적법 / 위법 / 주의 필요]
* **📜 근거 법령 (Authority):** 검증된 법령명과 조문 (예: 근로기준법 제23조 [현행])
* **⚖️ 법적 조언 (Advisory):**
    * 위계에 따른 해석 (예: "지침은 이렇게 되어 있으나, 상위법인 XX법에 따라...")
    * 실무적 리스크 경고 (예: "판례(2023다XXXX)는 다르게 해석하고 있으므로 주의가 필요합니다.")

## 6. Disclaimer (면책 조항)
모든 답변의 끝에는 반드시 다음 문구를 포함하십시오:
"⚠️ 본 답변은 법률적 참고 자료이며, 변호사의 전문적인 법률 자문을 대체할 수 없습니다. 정확한 법령 원문은 국가법령정보센터(law.go.kr)에서 확인하세요."`;

const LEGAL_REASONING_PROMPT = `# 단계별 법적 추론 (Legal Reasoning Chain of Thought)

당신은 대한민국 법 체계에 정통한 법률 전문가 AI입니다. 사용자의 질문에 대해 헌법적 가치에서 출발하여 구체적인 법률, 시행령, 판례 순으로 논리를 전개하여 답변해야 합니다.

## 단계 1: 헌법적 가치 검토
- 이 사안과 관련된 '대한민국 헌법'의 기본권(예: 행복추구권, 재산권, 신체의 자유 등)이나 헌법 원칙(예: 법치주의, 적법절차의 원칙)은 무엇인가?
- 헌법 재판소의 위헌 결정이나 헌법 해석이 이 사안에 영향을 미치는가?

## 단계 2: 법률(Act) 및 하위 법령 검토
- 헌법적 가치를 구체화한 핵심 '법률'은 무엇인가? (예: 민법, 형법, 근로기준법 등)
- 해당 법률의 구체적인 절차를 규정하는 '시행령' 및 '시행규칙'은 무엇인가?
- *중요*: 적용하려는 법령이 현재 유효한 최신 법령인지 \`check_enforcement_date\` 도구로 확인하십시오.

## 단계 3: 판례 및 해석 (Precedents)
- 대법원 판례나 하급심 판례 중 이 사안과 가장 유사한 사례는 무엇인가?
- 법령의 문언적 의미를 넘어선 사법부의 해석 태도는 어떠한가?
- *중요*: AI가 인용하는 판례가 실제 존재하는지 \`verify_case_exists\` 도구로 검증하십시오.

## 단계 4: 종합 조언 (Conclusion & Advice)
- 위 검토를 종합했을 때, 사용자가 취할 수 있는 가장 적절한 법적 조치는 무엇인가?
- 예상되는 법적 리스크와 현실적인 대응 방안은?
- 필요시 "최선의 시나리오"와 "최악의 시나리오"를 구분하여 제시하십시오.

## Disclaimer
답변의 끝에는 반드시 "본 답변은 법률적 참고 자료이며, 변호사의 전문적인 법률 자문을 대체할 수 없습니다."라는 문구를 포함하세요.`;

// ============================================
// MCP Tools 정의
// ============================================

const TOOLS: Tool[] = [
  {
    name: 'audit_statute',
    description: `[핵심 기능] 법령 조문 검증 - AI가 인용한 법령 조문이 현행법과 일치하는지 검증합니다.

⚠️ 중요: 이 도구는 AI의 법률 인용 정확성을 검증하기 위한 "감사(Audit)" 도구입니다.
- AI가 "근로기준법 제23조"를 인용했다면, 실제 현행 조문과 비교합니다.
- 조문이 삭제/개정되었거나, 내용이 다르면 경고합니다.
- 국가법령정보센터 직접 링크도 함께 제공합니다.

사용 예시: "근로기준법 제23조가 정말 해고 제한에 관한 조항인가요?"`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '법령명 (예: 근로기준법, 민법, 형법)',
        },
        article_number: {
          type: 'string',
          description: '조문 번호 (예: 제23조, 23, 제23조의2)',
        },
        target_date: {
          type: 'string',
          description: '검증 기준일 (YYYY-MM-DD, 기본값: 오늘)',
        },
        expected_content: {
          type: 'string',
          description: '(선택) AI가 인용한 내용 - 실제 조문과 비교',
        },
      },
      required: ['law_name', 'article_number'],
    },
  },
  {
    name: 'check_enforcement_date',
    description: `법령 시행일 확인 - 법령이 현재 유효한지, 언제 개정되었는지 확인합니다.

AI가 오래된 법령을 인용하는 것을 방지합니다.
- 공포일 vs 시행일 구분
- 미래 시행 예정 법령 감지

사용 예시: "근로기준법이 최근에 개정되었나요? 언제부터 시행인가요?"`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '법령명',
        },
      },
      required: ['law_name'],
    },
  },
  {
    name: 'verify_case_exists',
    description: `판례 실존 여부 확인 - AI가 인용한 판례가 실제로 존재하는지 확인합니다.

⚠️ AI는 가짜 판례번호를 만들어내는 경우가 있습니다.
이 도구는 해당 사건번호가 실제 대법원/하급심 DB에 존재하는지 검증합니다.

사용 예시: "대법원 2023다12345 판결이 실제로 있나요?"`,
    inputSchema: {
      type: 'object',
      properties: {
        case_id: {
          type: 'string',
          description: '사건번호 (예: 2023다12345, 2022나98765)',
        },
      },
      required: ['case_id'],
    },
  },
  {
    name: 'get_daily_diff',
    description: `오늘의 법령 변경 사항 - 오늘 시행되거나 개정된 법령을 확인합니다.

"오늘 바뀐 노동법이 있나요?" 같은 질문에 답합니다.
매일 동기화된 Diff 엔진이 변경 사항을 추적합니다.`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: '법령 분야 필터 (노동, 세무, 민사, 형사 등)',
        },
      },
    },
  },
  {
    name: 'audit_contract_timeline',
    description: `[고급 기능] 계약 기간 기준 법령 유효성 검사

계약 기간 동안 법이 바뀌는지 확인합니다.
"지금은 합법이지만, 3개월 뒤 계약 기간 중에는 위법이 됩니다" 같은 경고를 제공합니다.

사용 예시: "2025년 1월~12월 근로계약에 적용될 근로기준법 변경 예정이 있나요?"`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '검토할 법령명',
        },
        contract_start: {
          type: 'string',
          description: '계약 시작일 (YYYY-MM-DD)',
        },
        contract_end: {
          type: 'string',
          description: '계약 종료일 (YYYY-MM-DD)',
        },
      },
      required: ['law_name', 'contract_start', 'contract_end'],
    },
  },
  {
    name: 'check_legal_definition',
    description: `법률 용어 정의 확인 - 특정 법령에서 용어가 어떻게 정의되는지 확인합니다.

법률에서 "근로자", "해고", "임금" 등의 정확한 법적 정의를 조회합니다.
AI가 용어를 잘못 사용하는 것을 방지합니다.`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '법령명',
        },
        term: {
          type: 'string',
          description: '검색할 용어 (예: 근로자, 해고, 임금)',
        },
      },
      required: ['law_name', 'term'],
    },
  },
  {
    name: 'get_related_laws',
    description: `[법령 위계 기능] 상위법/하위법 관련법령 조회 - 법령의 위계 구조를 파악합니다.

법의 위계(헌법 > 법률 > 명령 > 규칙)를 이해하기 위해:
- 시행령/시행규칙 (하위법령)
- 모법/위임근거 (상위법령)  
- 관련 행정규칙, 조례 등

을 조회합니다. "상위법 우선의 원칙"을 적용하기 위한 핵심 도구입니다.

사용 예시: "근로기준법의 시행령과 시행규칙을 알려줘"`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '검색할 법령명 (예: 근로기준법, 민법)',
        },
        relation_type: {
          type: 'string',
          enum: ['all', 'upper', 'lower', 'enforcement'],
          description: '관계 유형: all(전체), upper(상위법), lower(하위법), enforcement(시행령/규칙)',
        },
      },
      required: ['law_name'],
    },
  },
  {
    name: 'check_law_hierarchy',
    description: `[법령 위계 판단] 두 법령 간 위계 관계 확인 - 상위법 우선 원칙 적용을 위한 도구

두 법령이 충돌할 때 어느 법령을 우선 적용해야 하는지 판단합니다.
- 헌법 > 법률 > 대통령령(시행령) > 총리령/부령(시행규칙) > 행정규칙
- 특별법 > 일반법
- 신법 > 구법

사용 예시: "근로기준법과 노동부 지침이 충돌하면 어떤 것이 우선인가요?"`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name_1: {
          type: 'string',
          description: '첫 번째 법령명',
        },
        law_name_2: {
          type: 'string',
          description: '두 번째 법령명',
        },
      },
      required: ['law_name_1', 'law_name_2'],
    },
  },
  {
    name: 'search_admin_rules',
    description: `행정규칙 검색 - 훈령, 예규, 고시 등 행정규칙을 검색합니다.

⚠️ 주의: 행정규칙은 상위법(법률, 시행령)을 거스를 수 없습니다.
법률 vs 행정규칙이 충돌하면 법률이 우선합니다.

노동부 지침, 국세청 예규 등 실무에서 자주 참조되는 행정규칙을 검색합니다.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색어 (예: 해고, 임금, 퇴직금)',
        },
        limit: {
          type: 'number',
          description: '검색 결과 수 (기본값: 20)',
        },
      },
      required: ['query'],
    },
  },
  
  // ============================================
  // 🆕 새로운 검증 도구 (v2)
  // ============================================
  
  {
    name: 'check_legal_citation',
    description: `[팩트체크] 인용문 검증 - 사용자가 인용한 법령 텍스트가 실제 조문과 일치하는지 확인합니다.

📌 핵심 기능:
- 법령명 + 조문번호로 실제 조문 조회
- 인용된 텍스트와 원본 텍스트 비교 (Levenshtein Distance)
- 유사도 점수 및 일치/불일치 판정

⚠️ 사용 사례:
- 계약서에 "근로기준법 제23조에 따라..."라고 인용했을 때 실제 내용 확인
- AI가 생성한 법률 인용이 정확한지 검증
- 오래된 문서의 법률 인용이 현행법과 맞는지 확인

결과: EXACT(95%↑), PARTIAL(70-95%), MISMATCH(<70%), NOT_FOUND`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '법령명 (예: 근로기준법, 민법, 형법)',
        },
        article_no: {
          type: 'string',
          description: '조문번호 (예: 제23조, 23, 제23조의2)',
        },
        quoted_text: {
          type: 'string',
          description: '인용된 텍스트 (검증 대상). 생략 시 원본만 조회',
        },
      },
      required: ['law_name', 'article_no'],
    },
  },
  {
    name: 'validate_references',
    description: `[교차검증] 법령 내 참조 무결성 검사 - 법령 내에서 "제N조"로 참조하는 조항이 실제로 존재하는지 확인합니다.

📌 핵심 기능:
- 특정 법령의 모든 조문에서 "제N조" 패턴 추출
- 내부 참조: 같은 법령 내 조문 존재 여부 확인
- 외부 참조: 다른 법령(「민법」 제750조 등) 참조 추출

⚠️ 사용 사례:
- 법령 개정으로 삭제된 조문을 여전히 참조하는 "끊어진 링크(Broken Link)" 발견
- 법령 전체 품질 검증 리포트 생성
- 관련 법령 연결 관계 파악

결과: 총 참조 수, 유효 참조 수, 끊어진 참조 목록, 외부 참조 목록`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '검증할 법령명 (예: 근로기준법)',
        },
        include_external: {
          type: 'boolean',
          description: '외부 법령 참조도 검증할지 (기본: true)',
        },
      },
      required: ['law_name'],
    },
  },
  {
    name: 'review_compliance',
    description: `[적절성 검토] 시나리오 기반 법령 검토 - 특정 상황/문서가 법적으로 적절한지 관련 법령을 찾아 검토합니다.

📌 핵심 기능:
- 시나리오 텍스트에서 키워드 추출
- Full Text Search로 관련 법령 조문 검색
- 관련도 순으로 상위 N개 조문 제공

⚠️ 사용 사례:
- "직원을 해고하려는데 30일 전 통보가 필요한가요?" → 관련 법령 조회
- 계약서 초안의 법적 적절성 검토
- 특정 비즈니스 행위의 규제 법령 확인

결과: 관련 법령 조문 목록 (AI가 법적 판단에 활용할 수 있는 컨텍스트 제공)

⚠️ 주의: 이 도구는 관련 법령을 찾아줄 뿐, 법적 판단은 AI 또는 전문가가 수행해야 합니다.`,
    inputSchema: {
      type: 'object',
      properties: {
        scenario: {
          type: 'string',
          description: '검토할 상황 설명 또는 문서 내용',
        },
        domain: {
          type: 'string',
          description: '법령 분야 힌트 (예: 노동, 민사, 형사, 세무, 부동산)',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: '추가 검색 키워드 (선택)',
        },
        limit: {
          type: 'number',
          description: '반환할 관련 조문 수 (기본: 10)',
        },
      },
      required: ['scenario'],
    },
  },
  {
    name: 'search_legal_landscape',
    description: `[종합 검색] 법령 통합 검색 - 법률, 행정규칙, 판례, 해석례를 한 번에 검색하여 법적 지형(Landscape)을 파악합니다.

📌 핵심 기능:
- 검색어 하나로 4가지 법적 소스 동시 검색
  1. 법령 (Acts): 국회 제정 법률, 시행령
  2. 행정규칙 (Admin Rules): 훈령, 예규, 고시 (실무 지침)
  3. 판례 (Precedents): 대법원 판례
  4. 법령해석 (Interpretations): 법제처/부처 해석례

⚠️ 사용 사례:
- "개인정보보호법상 CCTV 설치 기준"과 같이 법률과 실무 지침을 모두 봐야 할 때
- 특정 키워드가 포함된 모든 법적 근거를 찾을 때

결과: 소스별 상위 검색 결과 요약`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색어 (예: CCTV, 해고, 퇴직금)',
        },
        limit_per_source: {
          type: 'number',
          description: '소스별 최대 결과 수 (기본: 3)',
        },
      },
      required: ['query'],
    },
  },
  
  // ============================================
  // 🆕 확장 도구 (위원회/부처/영문법령)
  // ============================================
  
  {
    name: 'search_committee_decisions',
    description: `[위원회 결정문] 규제기관 결정문 검색 - 개인정보보호위원회, 공정거래위원회, 노동위원회 등의 결정문을 검색합니다.

📌 핵심 기능:
- 12개 위원회 결정문 통합 검색
- 개인정보, 공정거래, 노동 분쟁 등 실무 컴플라이언스 검토에 필수

⚠️ 지원 위원회:
- privacy: 개인정보보호위원회 (GDPR/개인정보 이슈)
- monopoly: 공정거래위원회 (담합/불공정거래)
- labor: 중앙노동위원회 (부당해고/노동분쟁)
- financial: 금융위원회
- anticorruption: 국민권익위원회
- human_rights: 국가인권위원회
- broadcasting: 방송통신위원회
- environment: 환경분쟁조정위원회
- securities: 증권선물위원회
- land: 중앙토지수용위원회
- industrial_accident: 산업재해보상보험재심사위원회
- employment_insurance: 고용보험심사위원회

사용 예시: "개인정보 유출 관련 개인정보보호위원회 결정은?"`,
    inputSchema: {
      type: 'object',
      properties: {
        committee_type: {
          type: 'string',
          enum: ['privacy', 'monopoly', 'labor', 'financial', 'anticorruption', 'human_rights', 'broadcasting', 'environment', 'securities', 'land', 'industrial_accident', 'employment_insurance'],
          description: '위원회 유형 (privacy: 개인정보보호위, monopoly: 공정위, labor: 노동위 등)',
        },
        query: {
          type: 'string',
          description: '검색어 (예: 개인정보 유출, 부당해고, 담합)',
        },
        limit: {
          type: 'number',
          description: '검색 결과 수 (기본: 20)',
        },
      },
      required: ['committee_type', 'query'],
    },
  },
  {
    name: 'search_ministry_interpretations',
    description: `[부처 해석례] 중앙부처 법령해석 검색 - 고용노동부, 국세청, 국토부 등의 유권해석을 검색합니다.

📌 핵심 기능:
- 법제처 해석 외에 각 부처의 1차 유권해석 검색
- 실무에서 가장 자주 참조되는 행정해석

⚠️ 지원 부처:
- moel: 고용노동부 (인사/노무 필수!)
- nts: 국세청 (세무 필수!)
- molit: 국토교통부 (부동산/건설)
- mohw: 보건복지부
- moef: 기획재정부
- me: 환경부
- mafra: 농림축산식품부
- kcs: 관세청
- sme: 중소벤처기업부

⚠️ 주의: 부처 해석은 상위법(법률)을 거스를 수 없습니다. 법률 vs 부처해석이 충돌하면 법률이 우선합니다.

사용 예시: "연차휴가 관련 고용노동부 해석은?"`,
    inputSchema: {
      type: 'object',
      properties: {
        ministry_type: {
          type: 'string',
          enum: ['moel', 'nts', 'molit', 'mohw', 'moef', 'moe', 'msit', 'me', 'mafra', 'kcs', 'nfa', 'sme'],
          description: '부처 유형 (moel: 고용노동부, nts: 국세청, molit: 국토부 등)',
        },
        query: {
          type: 'string',
          description: '검색어 (예: 연차휴가, 양도소득세, 건축허가)',
        },
        limit: {
          type: 'number',
          description: '검색 결과 수 (기본: 20)',
        },
      },
      required: ['ministry_type', 'query'],
    },
  },
  {
    name: 'search_english_law',
    description: `[영문 법령] 영문 법령 검색 - 한국 법령의 영문 번역본을 검색합니다.

📌 핵심 기능:
- 한글 또는 영문 법령명으로 검색
- 조문별 한글/영문 대조 제공
- 글로벌 비즈니스, 외국인 대상 법률 자문에 활용

⚠️ 사용 사례:
- 해외 지사/파트너에게 한국 법률 설명 시
- 외국인 투자자/근로자 대상 컴플라이언스 안내
- 영문 계약서에서 한국법 조항 인용 시

사용 예시: "Labor Standards Act (근로기준법) 영문본 조회"`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '법령명 (한글 또는 영문, 예: 근로기준법, Labor Standards Act)',
        },
        article_number: {
          type: 'string',
          description: '(선택) 특정 조문 번호 (예: 제23조)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_tribunal_decisions',
    description: `[특별행정심판] 조세심판원, 특허심판원 등의 재결례를 검색합니다.

📌 핵심 기능:
- 조세 분쟁, 특허 분쟁 등 전문 심판원의 결정 검색
- 행정소송 전 단계의 심판 결과 확인

⚠️ 지원 심판원:
- tax: 조세심판원 (세무 분쟁)
- maritime: 해양안전심판원
- patent: 특허심판원 (특허/상표 분쟁)

사용 예시: "부당한 세금 부과에 대한 조세심판원 재결례는?"`,
    inputSchema: {
      type: 'object',
      properties: {
        tribunal_type: {
          type: 'string',
          enum: ['tax', 'maritime', 'patent'],
          description: '심판원 유형 (tax: 조세심판원, patent: 특허심판원 등)',
        },
        query: {
          type: 'string',
          description: '검색어',
        },
        limit: {
          type: 'number',
          description: '검색 결과 수 (기본: 20)',
        },
      },
      required: ['tribunal_type', 'query'],
    },
  },
  {
    name: 'search_compliance_all',
    description: `[컴플라이언스 종합검색] 특정 이슈에 대해 법령, 위원회 결정문, 부처 해석을 동시에 검색합니다.

📌 핵심 기능:
- 하나의 검색어로 법령 + 핵심 위원회(개인정보/공정위/노동위) + 핵심 부처(노동부/국세청) 동시 검색
- 컴플라이언스 리스크 평가 시 전체 법적 지형 파악에 최적

⚠️ 사용 사례:
- "CCTV 설치" 관련 모든 법적 근거 + 개인정보위 결정 + 노동부 해석 한 번에 조회
- 신규 사업 시작 전 규제 환경 전체 스캔

결과: 법령, 위원회 결정, 부처 해석별 검색 결과`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색어 (예: CCTV, 개인정보 수집, 해고)',
        },
        committees: {
          type: 'array',
          items: { type: 'string' },
          description: '검색할 위원회 목록 (기본: privacy, monopoly, labor)',
        },
        ministries: {
          type: 'array',
          items: { type: 'string' },
          description: '검색할 부처 목록 (기본: moel, nts)',
        },
        limit_per_source: {
          type: 'number',
          description: '소스별 최대 결과 수 (기본: 5)',
        },
      },
      required: ['query'],
    },
  },
  
  // ============================================
  // 🆕 Supabase 캐시 기반 도구
  // ============================================
  
  {
    name: 'supabase_search_laws',
    description: `[Supabase 캐시] 법령 빠른 검색 - Supabase에 캐시된 법령 데이터를 빠르게 검색합니다.

📌 핵심 기능:
- 실시간 API보다 10-40배 빠른 응답 속도
- 전문 검색(Full-text search) 지원
- 법령 유형, 소관부처 필터링

⚠️ 장점:
- 네트워크 지연 최소화 (로컬 DB 수준 속도)
- 대량 검색 시 API 호출 제한 회피
- 오프라인 상황에서도 캐시된 데이터 활용 가능

결과: 법령 ID, 법령명, 시행일, 소관부처 목록`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색어 (예: 근로기준법, 개인정보)',
        },
        law_type: {
          type: 'string',
          enum: ['법률', '대통령령', '총리령', '부령'],
          description: '법령 유형 필터',
        },
        ministry: {
          type: 'string',
          description: '소관부처 (예: 고용노동부, 개인정보보호위원회)',
        },
        limit: {
          type: 'number',
          description: '결과 수 제한 (기본: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'supabase_get_article',
    description: `[Supabase 캐시] 조문 상세 조회 - 특정 법령의 조문을 Supabase에서 직접 조회합니다.

📌 핵심 기능:
- 법령 ID로 모든 조문 조회
- 특정 조 번호로 필터링 가능
- 조문 내용 전문 검색

⚠️ 사용 사례:
- audit_statute 전에 빠르게 조문 확인
- 여러 조문을 한 번에 조회할 때

결과: 조문 번호, 제목, 내용`,
    inputSchema: {
      type: 'object',
      properties: {
        law_id: {
          type: 'number',
          description: '법령 ID (supabase_search_laws로 조회)',
        },
        article_no: {
          type: 'string',
          description: '조 번호 (예: 제1조, 제2조의2) - 생략시 전체 조문',
        },
      },
      required: ['law_id'],
    },
  },
  {
    name: 'supabase_verify_citation',
    description: `[Supabase 캐시] 인용 검증 - 법령 인용의 정확성을 캐시에서 빠르게 검증합니다.

📌 핵심 기능:
- 법령명 + 조 번호로 존재 여부 확인
- 선택적 내용 스니펫 매칭
- 배치 검증 지원 (여러 인용 한 번에)

⚠️ 장점:
- API 대비 25배 빠른 검증
- 대량 문서의 법령 인용 검증에 최적

결과: 검증 결과, 매칭된 법령/조문 정보`,
    inputSchema: {
      type: 'object',
      properties: {
        citations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              law_name: { type: 'string', description: '법령명' },
              article_no: { type: 'string', description: '조 번호 (선택)' },
              content_snippet: { type: 'string', description: '내용 일부 (선택)' },
            },
            required: ['law_name'],
          },
          description: '검증할 인용 목록',
        },
        strict_mode: {
          type: 'boolean',
          description: '엄격 모드 - 내용 스니펫까지 검증 (기본: false)',
        },
      },
      required: ['citations'],
    },
  },
  {
    name: 'supabase_get_sync_status',
    description: `[Supabase 캐시] 동기화 상태 조회 - 캐시 데이터의 최신성과 통계를 확인합니다.

📌 핵심 기능:
- 테이블별 데이터 건수 확인
- 마지막 동기화 시간 확인
- 캐시 신뢰도 판단에 활용

⚠️ 사용 사례:
- 캐시 검색 결과의 신뢰도 판단
- 데이터 최신성 확인

결과: 소스별 데이터 건수, 마지막 동기화 시간`,
    inputSchema: {
      type: 'object',
      properties: {
        source_type: {
          type: 'string',
          enum: ['laws', 'precedents', 'admin_rules', 'all'],
          description: '조회할 소스 유형 (기본: all)',
        },
      },
    },
  },
  {
    name: 'supabase_search_all_documents',
    description: `[Supabase 캐시] 통합 문서 검색 - 법령, 판례, 행정규칙 등 모든 법률 문서를 통합 검색합니다.

📌 핵심 기능:
- all_legal_documents 뷰 활용
- 문서 유형별 필터링
- 날짜 범위 검색
- 기관별 필터링

⚠️ 사용 사례:
- 특정 키워드가 포함된 모든 법적 문서 한 번에 검색
- 특정 기간의 법령/판례 조회

결과: 문서 유형, 제목, 날짜, 기관 목록`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색어',
        },
        doc_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['law', 'precedent', 'constitutional_decision', 'legal_interpretation', 'admin_appeal'],
          },
          description: '검색할 문서 유형 (기본: 전체)',
        },
        date_from: {
          type: 'string',
          description: '시작일 (YYYY-MM-DD)',
        },
        date_to: {
          type: 'string',
          description: '종료일 (YYYY-MM-DD)',
        },
        organization: {
          type: 'string',
          description: '기관명 (예: 대법원, 헌법재판소)',
        },
        limit: {
          type: 'number',
          description: '결과 수 제한 (기본: 50)',
        },
      },
      required: ['query'],
    },
  },

  // ============================================
  // 🆕 사업장 규모별 근로기준법 의무사항 도구
  // ============================================
  {
    name: 'query_business_size_requirements',
    description: `사업장 규모별 근로기준법 의무사항 조회 - 사업장 규모(1인, 5인, 10인, 50인 등)에 따라 달라지는 노동법령의 의무사항을 조회합니다.

📌 핵심 기능:
- 사업장 규모별 차등 적용 법령 정보
- 필수 의무사항 체크리스트
- 예외/특례 사항 (건설업, 농림어업 등)
- 최신 개정사항 (2024~2026년)

⚠️ 사용 사례:
- "50인 이상 사업장에서 반드시 지켜야 할 법령이 뭔가요?"
- "10인 미만 사업장에서는 연차휴가를 줄 의무가 없나요?"
- "건설업의 특례 규정은?"
- "2024년부터 바뀐 규정이 있나요?"

결과: 규모별 의무사항, 법령 근거, 체크리스트, 최신 정보 제공`,
    inputSchema: {
      type: 'object',
      properties: {
        business_size: {
          type: 'number',
          description: '사업장 근로자 수 (1, 5, 10, 30, 50, 100, 300 등)',
        },
        category: {
          type: 'string',
          enum: ['all', 'labor_hour', 'safety', 'welfare', 'leave', 'disability', 'verification'],
          description: '조회 카테고리: all(전체), labor_hour(근로시간), safety(안전), welfare(복지), leave(휴가), disability(장애인), verification(검증)',
        },
        industry: {
          type: 'string',
          description: '업종 (선택사항: construction, agriculture, healthcare, logistics 등 - 특례 적용 여부 확인)',
        },
        year: {
          type: 'number',
          description: '조회 기준 연도 (기본값: 현재 연도)',
        },
      },
      required: ['business_size'],
    },
  },

  // ============================================
  // 🆕 국가건설기준 (KDS/KCS) 검색 도구
  // ============================================
  {
    name: 'search_construction_standards',
    description: `[건설기준 검색] 국가건설기준(KDS/KCS)을 검색합니다.

📌 데이터 현황:
- KDS (설계기준): 548건 - 건축, 토목, 도로 등 설계 기준
- KCS (표준시방서): 767건 - 시공 기준 및 품질 요건

⚠️ 검색 예시:
- "상하수도 설계기준" → KDS 57 00 00 계열
- "콘크리트 시방서" → KCS 14 20 00 계열
- "지반 설계" → KDS 11 00 00 계열

참고: 건설기준은 법령이 아닌 기술기준이지만, 건설 관련 법령에서 준용합니다.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색어 (기준명, 코드, 키워드)',
        },
        doc_type: {
          type: 'string',
          enum: ['ALL', 'KDS', 'KCS'],
          description: '문서 유형: ALL(전체), KDS(설계기준), KCS(표준시방서)',
        },
        category: {
          type: 'string',
          description: '분류 필터 (예: 공통, 지반, 콘크리트, 상하수도)',
        },
        limit: {
          type: 'number',
          description: '결과 수 제한 (기본: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_standard_details',
    description: `[건설기준 상세] 특정 건설기준 코드의 상세 정보를 조회합니다.

📌 조회 정보:
- 기준명, 코드, 분류
- 제정일, 개정일, 시행일
- 소관부서, 심의기관
- 개정 이력 (historyList)

사용 예시: "KDS 57 70 00의 상세 정보를 알려줘"`,
    inputSchema: {
      type: 'object',
      properties: {
        kcsc_cd: {
          type: 'string',
          description: '건설기준 코드 (예: KDS 57 70 00, KCS 14 20 10)',
        },
        include_history: {
          type: 'boolean',
          description: '개정 이력 포함 여부 (기본: true)',
        },
      },
      required: ['kcsc_cd'],
    },
  },
  {
    name: 'get_standard_revisions',
    description: `[건설기준 개정 이력] 특정 건설기준의 개정 내역을 조회합니다.

📌 조회 정보:
- 개정 연도별 이력
- 제정일/개정일/시행일
- 개정 사유
- 문서 파일 정보

사용 예시: "KDS 10 00 00 공통설계기준의 개정 이력"`,
    inputSchema: {
      type: 'object',
      properties: {
        kcsc_cd: {
          type: 'string',
          description: '건설기준 코드',
        },
      },
      required: ['kcsc_cd'],
    },
  },
  {
    name: 'search_all_regulations',
    description: `[통합 검색] 법령, 건설기준, KRX 거래소 규정을 함께 검색합니다.

📌 검색 범위:
- 법령 (LAW): 141건 + 11,772 조문
- 건설기준 (STANDARD): 1,315건 (KDS + KCS)
- KRX 규정 (KRX): 79건 거래소 자율규정 (상장/공시/매매)

⚠️ 사용 사례:
- "건축법과 관련 설계기준을 함께 알려줘"
- "상장 관련 법령과 KRX 규정"
- "자본시장법과 거래소 규정"

결과: 법령, 건설기준, KRX 규정을 통합 조회하여 제공`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색어',
        },
        type_filter: {
          type: 'string',
          enum: ['ALL', 'LAW', 'STANDARD', 'KRX'],
          description: '유형 필터: ALL(전체), LAW(법령만), STANDARD(건설기준만), KRX(거래소규정만)',
        },
        limit: {
          type: 'number',
          description: '결과 수 제한 (기본: 20)',
        },
      },
      required: ['query'],
    },
  },

  // ============================================
  // 🆕 KRX 거래소 규정 검색 도구
  // ============================================
  {
    name: 'search_krx_regulations',
    description: `[KRX 규정 검색] 한국거래소(KRX) 규정을 검색합니다.

📌 데이터 현황:
- 유가증권시장 규정: 상장규정, 공시규정, 공정공시 운영기준 등
- 코스닥시장 규정: 상장규정, 공시규정, 상장적격성 실질심사지침 등
- 코넥스시장 규정: 상장규정, 상장심사지침
- 파생상품 규정: 운영규정, 시행세칙
- KRX 금시장/석유시장 규정
- 기타: 분쟁조정, 시장감시, 전문평가 등 79개 규정

⚠️ 검색 예시:
- "유가증권시장 상장규정" → 상장 요건, 관리종목, 상장폐지
- "코스닥 공시" → 코스닥시장 공시규정
- "상장적격성 실질심사" → 실질심사 세부 기준
- "공정공시" → 공정공시 운영기준

참고: KRX 규정은 자본시장법 하위 자율규정으로, 상장/공시/매매 관련 실무 기준입니다.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색어 (규정명, 조문 키워드)',
        },
        market: {
          type: 'string',
          enum: ['ALL', '유가증권시장', '코스닥시장', '코넥스시장', '파생상품시장', '공통'],
          description: '시장 필터 (기본: ALL)',
        },
        limit: {
          type: 'number',
          description: '결과 수 제한 (기본: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_krx_regulation_detail',
    description: `[KRX 규정 상세] 특정 KRX 규정의 조문 내용을 조회합니다.

📌 조회 정보:
- 규정명, 시장 구분, 규정 유형
- 해당 규정의 전체 조문 목록
- 특정 조문 검색 (조문번호 또는 키워드)

사용 예시:
- "유가증권시장 상장규정 제47조" → 관리종목 지정 요건
- "코스닥 상장규정 제38조" → 상장폐지 사유`,
    inputSchema: {
      type: 'object',
      properties: {
        reg_name: {
          type: 'string',
          description: '규정명 (예: 유가증권시장 상장규정)',
        },
        article_no: {
          type: 'string',
          description: '조문번호 (예: 제47조)',
        },
        keyword: {
          type: 'string',
          description: '조문 내용 키워드 검색',
        },
        limit: {
          type: 'number',
          description: '결과 수 제한 (기본: 30)',
        },
      },
      required: ['reg_name'],
    },
  },

  // ============================================
  // 🆕 위원회/부처/심판 상세 조회 도구
  // ============================================

  {
    name: 'get_committee_decision_detail',
    description: `[위원회 결정문 상세] 위원회 결정문 전문 조회 - 개인정보보호위, 공정위, 노동위 등의 상세 결정문을 조회합니다.

📌 핵심 기능:
- 위원회 결정문의 완전한 본문 및 이유 조회
- 판시 사항, 결정 배경, 법적 근거 등 상세 정보

⚠️ 사용 사례:
- "개인정보보호위원회 결정 2024-..의 전문이 필요해요"
- 공정위 결정문을 분석하기 위해 전문 필요
- 노동위 결정문에서 핵심 판시 사항 확인

사용 예시: "위원회 유형과 결정 ID를 입력하면 전문 조회"`,
    inputSchema: {
      type: 'object',
      properties: {
        committee_type: {
          type: 'string',
          enum: ['privacy', 'monopoly', 'labor', 'financial', 'anticorruption', 'human_rights', 'broadcasting', 'environment', 'securities', 'land', 'industrial_accident', 'employment_insurance'],
          description: '위원회 유형',
        },
        decision_id: {
          type: 'string',
          description: '결정문 ID (검색 결과에서 일련번호)',
        },
      },
      required: ['committee_type', 'decision_id'],
    },
  },

  {
    name: 'get_ministry_interpretation_detail',
    description: `[부처 해석 상세] 부처 법령해석 전문 조회 - 고용노동부, 국세청 등의 상세 해석을 조회합니다.

📌 핵심 기능:
- 부처의 법령해석 완전한 본문 조회
- 질의, 회신, 이유 등 전체 해석 내용

⚠️ 사용 사례:
- 고용노동부 유권해석의 전문을 참조해야 할 때
- 국세청 해석에서 구체적인 세목 기준 확인
- 실무에서 부처 해석을 증거로 제시할 때

사용 예시: "부처 유형과 해석 ID를 입력하면 전문 조회"`,
    inputSchema: {
      type: 'object',
      properties: {
        ministry_type: {
          type: 'string',
          enum: ['moel', 'nts', 'molit', 'mohw', 'moef', 'moe', 'msit', 'me', 'mafra', 'kcs', 'nfa', 'sme'],
          description: '부처 유형',
        },
        interpretation_id: {
          type: 'string',
          description: '해석 ID (검색 결과에서 일련번호)',
        },
      },
      required: ['ministry_type', 'interpretation_id'],
    },
  },

  {
    name: 'get_tribunal_decision_detail',
    description: `[심판원 재결 상세] 조세심판원, 특허심판원 등의 상세 재결문을 조회합니다.

📌 핵심 기능:
- 심판원 재결문의 완전한 본문 및 이유 조회
- 분쟁 사항, 판단 근거, 결정 내용 상세 정보

⚠️ 사용 사례:
- 조세심판원 재결의 전문을 분석하려면
- 특허심판원 결정을 이의 신청 근거로 사용
- 행정소송 전 심판 결과 전문 확인

사용 예시: "심판원 유형과 재결 ID를 입력하면 전문 조회"`,
    inputSchema: {
      type: 'object',
      properties: {
        tribunal_type: {
          type: 'string',
          enum: ['tax', 'maritime', 'patent'],
          description: '심판원 유형',
        },
        decision_id: {
          type: 'string',
          description: '재결문 ID (검색 결과에서 일련번호)',
        },
      },
      required: ['tribunal_type', 'decision_id'],
    },
  },

  {
    name: 'get_extended_tribunal_decision_detail',
    description: `[확장 심판 재결 상세] 국민권익위 특별행정심판, 소청심사위원회 등 확장 심판기구의 상세 재결문을 조회합니다.

📌 핵심 기능:
- 국민권익위 특별행정심판 재결 전문
- 소청심사위원회 결정 전문
- 완전한 재결 이유 및 법적 근거

⚠️ 사용 사례:
- 국민권익위 특별행정심판 재결 전문 필요
- 소청심사위원회 결정을 공무원 인사 분쟁에 활용
- 행정소송 전 심판 결과 상세 검토

사용 예시: "확장 심판 유형과 재결 ID를 입력하면 전문 조회"`,
    inputSchema: {
      type: 'object',
      properties: {
        tribunal_type: {
          type: 'string',
          enum: ['tax', 'maritime', 'acrc', 'mpm'],
          description: '확장 심판원 유형 (acrc: 국민권익위 특별행정심판, mpm: 소청심사위)',
        },
        decision_id: {
          type: 'string',
          description: '재결문 ID',
        },
      },
      required: ['tribunal_type', 'decision_id'],
    },
  },

  {
    name: 'get_extended_ministry_interpretation_detail',
    description: `[확장 부처 해석 상세] 39개 전체 부처의 법령해석 전문 조회 - 고용노동부부터 국가데이터처까지.

📌 핵심 기능:
- 전 부처 해석 전문 조회 가능 (기본 13개 + 확장 26개)
- 각 부처의 유권해석 완전한 본문
- 질의배경, 관련법령, 회신 내용 상세

⚠️ 지원 부처:
- 기존 13개: 고용노동부, 국세청, 국토부, 보건복지부, 해양수산부, 기획재정부, 교육부, 과기정통부, 환경부, 농림축산, 관세청, 소방청, 중소벤처
- 추가 26개: 행정안전부, 국가보훈부, 국방부, 문화체육, 법무부, 산업통상, 성평등가족, 외교부, 통일부, 법제처 외 16개

사용 예시: "부처와 해석 ID를 입력하면 전문 조회"`,
    inputSchema: {
      type: 'object',
      properties: {
        ministry_type: {
          type: 'string',
          enum: ['moel', 'nts', 'molit', 'mohw', 'mof', 'moef', 'moe', 'msit', 'me', 'mafra', 'kcs', 'nfa', 'sme', 'moi', 'mpva', 'mnd', 'mcst', 'moj', 'motie', 'mogef', 'mofa', 'unikorea', 'moleg', 'mfds', 'mpm', 'kma', 'cha', 'rda', 'police', 'dapa', 'mma', 'forest', 'oka', 'pps', 'kdca', 'nda', 'kipo', 'kcg', 'naacc'],
          description: '부처 유형 (39개 전체 부처)',
        },
        interpretation_id: {
          type: 'string',
          description: '해석 ID (검색 결과에서 일련번호)',
        },
      },
      required: ['ministry_type', 'interpretation_id'],
    },
  },

  // ============================================
  // 🆕 선택 구현: 판례 통계 & 법령 연계 (Optional Knowledge Base)
  // ============================================
  // YAGNI 원칙: 높은 가치의 2개 기능만 추가 구현
  // - audit_pipeline 신뢰도 향상
  // - 실제 사용 피드백 기반 추가

  {
    name: 'search_precedent_statistics',
    description: `[판례 통계 조회] 특정 주제의 판례 통계를 통해 audit_pipeline 신뢰도 검증

📌 핵심 기능:
- 특정 주제의 판례 건수 조회
- 최근 월/년 판례 수 추이
- 증감 추세 분석

⚠️ 사용 사례:
- "개인정보 침해 판례 몇 건? 증감 추세?" → 최근 5년 추이 및 통계
- "근로기준법 위반 판례 최근 추세?" → 연도별 변화 추이
- audit_pipeline 검증 시: "판례가 정말 많은가?" 신뢰도 검증

예시: "개인정보 침해" 검색 → "총 1,234건 (최근 1년 520건, 12% 증가 추세)"`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색 주제 (예: "개인정보 침해", "근로기준법 위반")',
        },
        year: {
          type: 'number',
          description: '특정 연도 통계 (선택사항)',
        },
      },
      required: ['query'],
    },
  },

  {
    name: 'search_precedent_law_links',
    description: `[판례-법령 연계] 특정 법령을 인용한 판례를 검색하여 법령 유효성 검증

📌 핵심 기능:
- 특정 법령을 인용한 판례 목록 조회
- 판례 인용 횟수 통계
- 해당 법령 인용 판례의 승소율

⚠️ 사용 사례:
- "이 판례가 근로기준법을 인용하는가?" 검증
- "개인정보보호법을 인용한 판례 몇 건?" 통계
- "법령 기반 판례 분석" - 특정 법령이 실제 판례에서 어떻게 적용되는지 확인

예시: "근로기준법" 검색 → "인용 판례 3,456건 (승소율 78%)"`,
    inputSchema: {
      type: 'object',
      properties: {
        law_id: {
          type: 'string',
          description: '법령 ID 또는 법령명 (예: "근로기준법", "001-001")',
        },
        display: {
          type: 'number',
          description: '조회 건수 (기본: 50, 최대: 100)',
        },
        page: {
          type: 'number',
          description: '페이지 (기본: 1)',
        },
      },
      required: ['law_id'],
    },
  },

  {
    name: 'search_statute_law_impact',
    description: `[법령 영향도 분석] 특정 법령 개정이 다른 법령에 미치는 영향을 분석합니다 ⭐ HIGH VALUE

📌 핵심 기능:
- 법령 간 충돌 가능성 분석
- 법령 간 보완 관계 파악
- 중복 규정 여부 검토
- 전체 위험도 평가 (high/medium/low)

⚠️ 사용 사례:
- "근로기준법 제34조 개정이 기간제근로자법과 충돌하나?"
- "개인정보보호법 변경이 신용정보법에 영향?"
- "고용보험법 개정의 파급 효과 분석"
- audit_pipeline: "법령 개정의 전체 영향도를 검증해야 할 때"

예시: "근로기준법" 검색 → "4개 법령 영향, 충돌 가능 2건, 위험도: MEDIUM"`,
    inputSchema: {
      type: 'object',
      properties: {
        source_statute: {
          type: 'string',
          description: '영향을 미치는 법령명 (예: "근로기준법", "개인정보보호법")',
        },
        source_article: {
          type: 'string',
          description: '변경된 조항 (선택사항, 예: "제34조", "제15조")',
        },
        display: {
          type: 'number',
          description: '분석 범위 (기본: 모든 관련 법령)',
        },
      },
      required: ['source_statute'],
    },
  },

  // ============================================
  // 🆕 법조문 가독성 향상 도구 (스퀴즈 기능)
  // ============================================
  {
    name: 'simplify_statute',
    description: `[가독성 향상] 법조문 괄호 간소화 - 복잡한 법조문을 읽기 쉽게 변환합니다.

⚠️ 주의: 괄호 안의 내용도 법적 효력이 있습니다.
간소화된 버전은 이해를 돕기 위한 보조 자료이며, 법률 자문을 대체하지 않습니다.

기능:
- 괄호 제거: 주어(괄호)(괄호의 괄호)서술어 → 주어 서술어
- 괄호 유형 분류: 정의, 예외, 참조, 한정, 보충
- 하이라이트: 괄호 유형별 색상 구분
- 참조 조문 추출: 괄호 내 언급된 다른 조항 목록

사용 예시: "근로기준법 제23조를 읽기 쉽게 보여줘"`,
    inputSchema: {
      type: 'object',
      properties: {
        law_name: {
          type: 'string',
          description: '법령명 (예: 근로기준법, 민법)',
        },
        article_number: {
          type: 'string',
          description: '조문 번호 (예: 제23조, 23, 제23조의2)',
        },
        text: {
          type: 'string',
          description: '(선택) 직접 텍스트 입력 - law_name 대신 사용 가능',
        },
        mode: {
          type: 'string',
          enum: ['original', 'simplified', 'highlighted', 'all'],
          description: '출력 모드 (기본: all)',
        },
        keep_references: {
          type: 'boolean',
          description: '참조 괄호 유지 여부 (기본: false)',
        },
        keep_definitions: {
          type: 'boolean',
          description: '정의 괄호 유지 여부 (기본: false)',
        },
      },
      required: [],
    },
  },

  // ============================================
  // 🆕 하이브리드 엔진 도구 (RAG + CAG) - 동적 로드됨
  // ============================================
  // HYBRID_TOOLS는 startMcpServer()에서 동적으로 추가됩니다
];


// ============================================
// Tool 핸들러
// ============================================

async function handleAuditStatute(args: {
  law_name: string;
  article_number: string;
  target_date?: string;
  expected_content?: string;
}): Promise<string> {
  const { law_name, article_number, target_date, expected_content } = args;
  console.error(`[DEBUG] handleAuditStatute called: law=${law_name}, article=${article_number}, has_content=${!!expected_content}`);
  
  const targetDateStr = target_date || format(new Date(), 'yyyy-MM-dd');

  // 1. 로컬 DB에서 먼저 조회
  let law = db.findLawByName(law_name, targetDateStr);
  
  // 2. DB에 없으면 API로 조회
  if (!law) {
    try {
      const apiResults = await api.searchLaws(law_name, 10);
      if (apiResults.length === 0) {
        return JSON.stringify({
          status: 'NOT_FOUND',
          warning: `⚠️ "${law_name}" 법령을 찾을 수 없습니다.`,
          suggestion: '법령명을 정확히 입력했는지 확인하세요. (예: 근로기준법, 민법)',
        });
      }

      // 가장 최신 시행 법령 선택
      const latestLaw = apiResults[0];
      const lawDetail = await api.getLawDetail(latestLaw.법령ID);

      if (!lawDetail) {
        return JSON.stringify({
          status: 'API_ERROR',
          warning: '법령 상세 정보를 가져올 수 없습니다.',
        });
      }

      // 조문 찾기
      const article = findBestMatchingArticle(lawDetail.조문, article_number);

      if (!article) {
        console.error(`[DEBUG] Article NOT FOUND. Target: ${article_number}, Candidates: ${lawDetail.조문.slice(0, 5).map((a:any) => a.조문번호).join(', ')}...`);
        return JSON.stringify({
          status: 'ARTICLE_NOT_FOUND',
          warning: `⚠️ "${law_name}"에서 ${article_number}를 찾을 수 없습니다.`,
          available_articles: lawDetail.조문.slice(0, 10).map(a => a.조문번호),
          suggestion: '조문 번호를 확인하세요. 해당 조문이 삭제되었을 수 있습니다.',
        });
      }

      // 결과 반환
      const result: any = {
        status: 'FOUND',
        law_name: lawDetail.기본정보.법령명_한글,
        article_number: article.조문번호,
        article_title: article.조문제목 || null,
        content: article.조문내용,
        enforcement_date: lawDetail.기본정보.시행일자,
        promulgation_date: lawDetail.기본정보.공포일자,
        
        // 국가법령정보센터 직접 링크
        source_url: getLawGoKrLink(lawDetail.기본정보.법령명_한글, article.조문번호),
        
        // 검증 메타데이터
        verification_note: '⚠️ 이 데이터는 AI 검증용입니다. 법적 판단의 최종 근거는 국가법령정보센터(law.go.kr)를 참조하세요.',
      };

      // expected_content가 있으면 3단계 검증 수행
      if (expected_content) {
        // [Step 2] 팩트 체크 (수치/핵심어 검증)
        const expectedFacts = extractFacts(expected_content);
        const actualFacts = extractFacts(article.조문내용);
        
        // 기대하는 내용에 있는 팩트 중 실제 조문에 없는 것 찾기
        const missingFacts = [...expectedFacts].filter(f => !actualFacts.has(f));
        const isFactMismatch = missingFacts.length > 0;

        // [Step 3] 정밀 유사도 검증
        const similarity = calculateSimilarity(expected_content, article.조문내용);
        
        let matchStatus = 'MISMATCH';
        let warning = '';
        
        if (isFactMismatch) {
           // 팩트(숫자 등)가 틀리면 유사도가 높아도 MISMATCH 처리
           matchStatus = 'MISMATCH';
           warning = `⚠️ 중요 수치 불일치: [${missingFacts.join(', ')}] 부분이 실제 조문과 다릅니다.`;
        } else if (similarity >= 0.9) {
           matchStatus = 'MATCH';
        } else if (similarity >= 0.6) {
           matchStatus = 'PARTIAL_MATCH';
           warning = `⚠️ 내용이 부분적으로 다릅니다 (유사도: ${(similarity * 100).toFixed(1)}%)`;
        } else {
           matchStatus = 'MISMATCH';
           warning = `⚠️ 내용이 전혀 다릅니다 (유사도: ${(similarity * 100).toFixed(1)}%)`;
        }

        result.comparison = {
          expected: expected_content,
          actual: article.조문내용,
          similarity_score: similarity,
          match_status: matchStatus,
          missing_facts: missingFacts
        };

        if (warning) {
          result.warning = warning;
        }
      }

      return JSON.stringify(result, null, 2);
    } catch (error) {
      return JSON.stringify({
        status: 'ERROR',
        error: String(error),
      });
    }
  }

  // DB에서 찾은 경우
  const article = db.findArticle(law.id!, article_number);
  if (!article) {
    return JSON.stringify({
      status: 'ARTICLE_NOT_FOUND',
      warning: `⚠️ ${article_number}를 찾을 수 없습니다.`,
    });
  }

  const result: any = {
    status: 'FOUND',
    law_name: law.law_name,
    article_number: article.article_no,
    article_title: article.article_title,
    content: article.content,
    enforcement_date: law.enforcement_date,
    verification_note: '⚠️ 이 데이터는 AI 검증용입니다.',
  };

  if (expected_content) {
    // [Step 2] 팩트 체크 (수치/핵심어 검증)
    const expectedFacts = extractFacts(expected_content);
    const actualFacts = extractFacts(article.content);
    
    // 기대하는 내용에 있는 팩트 중 실제 조문에 없는 것 찾기
    const missingFacts = [...expectedFacts].filter(f => !actualFacts.has(f));
    const isFactMismatch = missingFacts.length > 0;

    // [Step 3] 정밀 유사도 검증
    const similarity = calculateSimilarity(expected_content, article.content);
    
    let matchStatus = 'MISMATCH';
    let warning = '';
    
    if (isFactMismatch) {
       matchStatus = 'MISMATCH';
       warning = `⚠️ 중요 수치 불일치: [${missingFacts.join(', ')}] 부분이 실제 조문과 다릅니다.`;
    } else if (similarity >= 0.9) {
       matchStatus = 'MATCH';
    } else if (similarity >= 0.6) {
       matchStatus = 'PARTIAL_MATCH';
       warning = `⚠️ 내용이 부분적으로 다릅니다 (유사도: ${(similarity * 100).toFixed(1)}%)`;
    } else {
       matchStatus = 'MISMATCH';
       warning = `⚠️ 내용이 전혀 다릅니다 (유사도: ${(similarity * 100).toFixed(1)}%)`;
    }

    result.comparison = {
      expected: expected_content,
      actual: article.content,
      similarity_score: similarity,
      match_status: matchStatus,
      missing_facts: missingFacts
    };

    if (warning) {
      result.warning = warning;
    }
  }

  return JSON.stringify(result, null, 2);
}

async function handleCheckEnforcementDate(args: { law_name: string }): Promise<string> {
  const { law_name } = args;

  try {
    const apiResults = await api.searchLaws(law_name, 5);
    
    if (apiResults.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        warning: `"${law_name}" 법령을 찾을 수 없습니다.`,
      });
    }

    const laws = apiResults.map(l => ({
      법령명: l.법령명한글,
      공포일자: l.공포일자,
      시행일자: l.시행일자,
      제개정구분: l.제개정구분명,
      소관부처: l.소관부처명,
      현행여부: isAfter(new Date(), parseISO(formatDate(l.시행일자))) ? '현행' : '미시행',
    }));

    const current = laws.find(l => l.현행여부 === '현행');
    const pending = laws.filter(l => l.현행여부 === '미시행');

    return JSON.stringify({
      status: 'FOUND',
      current_law: current,
      pending_amendments: pending,
      warning: pending.length > 0 
        ? `⚠️ ${pending.length}건의 개정 예정 법령이 있습니다. 계약/문서 작성 시 주의하세요.`
        : null,
      verification_note: '⚠️ 이 데이터는 AI 검증용입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleVerifyCaseExists(args: { case_id: string }): Promise<string> {
  const { case_id } = args;

  // 1. 로컬 DB 먼저 확인
  const existsLocal = db.verifyPrecedentExists(case_id);
  
  if (existsLocal) {
    return JSON.stringify({
      status: 'VERIFIED',
      case_id: case_id,
      exists: true,
      source: 'local_db',
      source_url: getPrecedentLink(case_id),
      verification_note: '⚠️ 판례 존재 여부만 확인됨. 상세 내용은 대법원 판례정보에서 확인하세요.',
    });
  }

  // 2. API로 확인
  try {
    const existsOnline = await api.verifyPrecedentExistsOnline(case_id);
    
    return JSON.stringify({
      status: existsOnline ? 'VERIFIED' : 'NOT_FOUND',
      case_id: case_id,
      exists: existsOnline,
      source: 'api_search',
      source_url: existsOnline ? getPrecedentLink(case_id) : null,
      warning: !existsOnline 
        ? `⚠️ 주의: "${case_id}" 판례를 찾을 수 없습니다. AI가 가짜 판례를 생성했을 수 있습니다!`
        : null,
      verification_note: '⚠️ 판례 존재 여부만 확인됨.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      case_id: case_id,
      error: String(error),
    });
  }
}

async function handleGetDailyDiff(args: { category?: string }): Promise<string> {
  const diffs = db.getTodayDiffs();
  
  if (diffs.length === 0) {
    return JSON.stringify({
      status: 'NO_CHANGES',
      message: '오늘 변경된 법령이 없습니다.',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  }

  // 카테고리 필터링
  let filtered = diffs;
  if (args.category) {
    filtered = diffs.filter(d => 
      d.law_name?.includes(args.category) || 
      d.diff_summary?.includes(args.category)
    );
  }

  return JSON.stringify({
    status: 'FOUND',
    date: format(new Date(), 'yyyy-MM-dd'),
    total_changes: filtered.length,
    changes: filtered.map(d => ({
      law_name: d.law_name,
      article: d.article_no,
      change_type: d.change_type,
      summary: d.diff_summary,
      is_critical: d.is_critical,
      warning: d.warning_message,
    })),
    verification_note: '⚠️ 이 데이터는 AI 검증용입니다.',
  }, null, 2);
}

async function handleAuditContractTimeline(args: {
  law_name: string;
  contract_start: string;
  contract_end: string;
}): Promise<string> {
  const { law_name, contract_start, contract_end } = args;

  const futureChanges = db.getFutureChanges(contract_start, contract_end);
  
  // 해당 법령만 필터
  const relevantChanges = futureChanges.filter(c => 
    c.law_name?.includes(law_name)
  );

  if (relevantChanges.length === 0) {
    return JSON.stringify({
      status: 'NO_CHANGES_IN_PERIOD',
      law_name: law_name,
      period: { start: contract_start, end: contract_end },
      message: `계약 기간(${contract_start} ~ ${contract_end}) 동안 "${law_name}"의 변경 예정 사항이 없습니다.`,
    });
  }

  return JSON.stringify({
    status: 'CHANGES_DETECTED',
    law_name: law_name,
    period: { start: contract_start, end: contract_end },
    warning: `⚠️ 주의: 계약 기간 중 법령 변경이 예정되어 있습니다!`,
    changes: relevantChanges.map(c => ({
      effective_date: c.effective_from,
      article: c.article_no,
      change_type: c.change_type,
      summary: c.diff_summary,
      impact: c.warning_message || '계약서 내용 검토 필요',
    })),
    recommendation: '계약서에 법령 변경 시 조항 수정 조건을 명시하는 것을 권장합니다.',
  }, null, 2);
}

async function handleCheckLegalDefinition(args: {
  law_name: string;
  term: string;
}): Promise<string> {
  const { law_name, term } = args;

  try {
    const apiResults = await api.searchLaws(law_name, 1);
    if (apiResults.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        warning: `"${law_name}" 법령을 찾을 수 없습니다.`,
      });
    }

    const lawDetail = await api.getLawDetail(apiResults[0].법령ID);
    if (!lawDetail) {
      return JSON.stringify({
        status: 'ERROR',
        warning: '법령 상세 정보를 가져올 수 없습니다.',
      });
    }

    // 제2조(정의) 조문 찾기
    const definitionArticle = lawDetail.조문.find(a => 
      a.조문제목?.includes('정의') || 
      a.조문번호.includes('제2조')
    );

    if (!definitionArticle) {
      return JSON.stringify({
        status: 'NO_DEFINITION_ARTICLE',
        message: `"${law_name}"에 정의 조항(제2조)이 없습니다.`,
      });
    }

    // 용어 검색
    const content = definitionArticle.조문내용;
    const termRegex = new RegExp(`["']?${term}["']?[은는이가]?\\s*[:]?\\s*([^.]+)`, 'gi');
    const match = content.match(termRegex);

    return JSON.stringify({
      status: match ? 'FOUND' : 'NOT_IN_DEFINITIONS',
      law_name: lawDetail.기본정보.법령명_한글,
      term: term,
      definition: match ? match[0] : null,
      full_definition_article: {
        article_number: definitionArticle.조문번호,
        title: definitionArticle.조문제목,
        content: definitionArticle.조문내용,
      },
      suggestion: !match 
        ? `"${term}"은 이 법령의 정의 조항에 명시되어 있지 않습니다. 일반적인 법적 해석이 적용될 수 있습니다.`
        : null,
      verification_note: '⚠️ 이 데이터는 AI 검증용입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 새로운 핸들러: 관련법령 조회
// ============================================

async function handleGetRelatedLaws(args: {
  law_name: string;
  relation_type?: 'all' | 'upper' | 'lower' | 'enforcement';
}): Promise<string> {
  const { law_name, relation_type = 'all' } = args;

  try {
    // 먼저 법령 검색
    const apiResults = await api.searchLaws(law_name, 5);
    
    if (apiResults.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        warning: `"${law_name}" 법령을 찾을 수 없습니다.`,
      });
    }

    const mainLaw = apiResults[0];
    const lawType = mainLaw.법령구분명;
    
    // 법령 유형에 따른 위계 정보 생성
    const hierarchyInfo = determineLawHierarchy(lawType);
    
    // 관련 법령 검색 (법령명으로 시행령/시행규칙 검색)
    const relatedResults: any = {
      status: 'FOUND',
      main_law: {
        name: mainLaw.법령명한글,
        type: lawType,
        hierarchy_level: hierarchyInfo.level,
        hierarchy_description: hierarchyInfo.description,
        enforcement_date: mainLaw.시행일자,
        department: mainLaw.소관부처명,
        source_url: getLawGoKrLink(mainLaw.법령명한글),
      },
      related_laws: {
        upper: [] as any[],
        lower: [] as any[],
      },
    };

    // 하위법령 검색 (시행령/시행규칙)
    if (relation_type === 'all' || relation_type === 'lower' || relation_type === 'enforcement') {
      // 시행령 검색
      const enforcementDecree = await api.searchLaws(`${law_name} 시행령`, 5);
      for (const decree of enforcementDecree) {
        if (decree.법령명한글.includes('시행령')) {
          relatedResults.related_laws.lower.push({
            name: decree.법령명한글,
            type: decree.법령구분명,
            relation: '시행령 (하위법령)',
            enforcement_date: decree.시행일자,
            source_url: getLawGoKrLink(decree.법령명한글),
          });
        }
      }

      // 시행규칙 검색
      const enforcementRule = await api.searchLaws(`${law_name} 시행규칙`, 5);
      for (const rule of enforcementRule) {
        if (rule.법령명한글.includes('시행규칙')) {
          relatedResults.related_laws.lower.push({
            name: rule.법령명한글,
            type: rule.법령구분명,
            relation: '시행규칙 (하위법령)',
            enforcement_date: rule.시행일자,
            source_url: getLawGoKrLink(rule.법령명한글),
          });
        }
      }
    }

    // 상위법령 추론 (법령 유형에 따라)
    if (relation_type === 'all' || relation_type === 'upper') {
      if (lawType === '대통령령' || lawType === '시행령') {
        // 모법 추론 (시행령 -> 법률)
        const parentLawName = law_name.replace(/\s*시행령$/, '').replace(/에\s*관한/, '에 관한');
        if (parentLawName !== law_name) {
          const parentLaw = await api.searchLaws(parentLawName, 3);
          if (parentLaw.length > 0 && parentLaw[0].법령구분명 === '법률') {
            relatedResults.related_laws.upper.push({
              name: parentLaw[0].법령명한글,
              type: parentLaw[0].법령구분명,
              relation: '모법 (상위법령)',
              enforcement_date: parentLaw[0].시행일자,
              source_url: getLawGoKrLink(parentLaw[0].법령명한글),
              priority_note: '⚠️ 시행령이 모법(법률)과 충돌하면 법률이 우선합니다.',
            });
          }
        }
      }
      
      // 헌법은 항상 최상위
      if (lawType === '법률') {
        relatedResults.related_laws.upper.push({
          name: '대한민국헌법',
          type: '헌법',
          relation: '최상위 규범',
          source_url: getLawGoKrLink('대한민국헌법'),
          priority_note: '⚠️ 모든 법률은 헌법에 위배될 수 없습니다.',
        });
      }
    }

    relatedResults.hierarchy_principle = `
📚 법령 위계 원칙 (상위법 우선):
1. 헌법 (Constitution) - 최상위
2. 법률 (Act) - 국회 제정
3. 대통령령/시행령 (Presidential Decree)
4. 총리령/부령/시행규칙 (Ministerial Decree)
5. 행정규칙 (훈령, 예규, 고시) - 상위법을 거스를 수 없음

⚠️ 하위법령이 상위법령과 충돌하면 상위법령이 우선 적용됩니다.
`;

    relatedResults.verification_note = '⚠️ 이 데이터는 AI 검증용입니다.';

    return JSON.stringify(relatedResults, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 새로운 핸들러: 법령 위계 비교
// ============================================

async function handleCheckLawHierarchy(args: {
  law_name_1: string;
  law_name_2: string;
}): Promise<string> {
  const { law_name_1, law_name_2 } = args;

  try {
    // 두 법령 검색
    const [law1Results, law2Results] = await Promise.all([
      api.searchLaws(law_name_1, 3),
      api.searchLaws(law_name_2, 3),
    ]);

    if (law1Results.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        warning: `"${law_name_1}" 법령을 찾을 수 없습니다.`,
      });
    }

    if (law2Results.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        warning: `"${law_name_2}" 법령을 찾을 수 없습니다.`,
      });
    }

    const law1 = law1Results[0];
    const law2 = law2Results[0];

    const hierarchy1 = determineLawHierarchy(law1.법령구분명);
    const hierarchy2 = determineLawHierarchy(law2.법령구분명);

    let comparison: string;
    let priority: string;
    let priorityReason: string;

    if (hierarchy1.level < hierarchy2.level) {
      priority = law1.법령명한글;
      priorityReason = '상위법 우선의 원칙 (Lex Superior)';
      comparison = `"${law1.법령명한글}"(${law1.법령구분명})이 "${law2.법령명한글}"(${law2.법령구분명})보다 상위 법령입니다.`;
    } else if (hierarchy1.level > hierarchy2.level) {
      priority = law2.법령명한글;
      priorityReason = '상위법 우선의 원칙 (Lex Superior)';
      comparison = `"${law2.법령명한글}"(${law2.법령구분명})이 "${law1.법령명한글}"(${law1.법령구분명})보다 상위 법령입니다.`;
    } else {
      // 같은 레벨일 경우 신법 우선 원칙 적용
      const date1 = law1.시행일자;
      const date2 = law2.시행일자;
      
      if (date1 > date2) {
        priority = law1.법령명한글;
        priorityReason = '신법 우선의 원칙 (Lex Posterior)';
        comparison = `동일 위계에서 "${law1.법령명한글}"이 더 최신입니다.`;
      } else if (date1 < date2) {
        priority = law2.법령명한글;
        priorityReason = '신법 우선의 원칙 (Lex Posterior)';
        comparison = `동일 위계에서 "${law2.법령명한글}"이 더 최신입니다.`;
      } else {
        priority = '동등';
        priorityReason = '특별법 우선의 원칙 (Lex Specialis) 검토 필요';
        comparison = `두 법령의 위계와 시행일이 동일합니다. 특별법-일반법 관계를 검토하세요.`;
      }
    }

    return JSON.stringify({
      status: 'COMPARED',
      law_1: {
        name: law1.법령명한글,
        type: law1.법령구분명,
        hierarchy_level: hierarchy1.level,
        hierarchy_name: hierarchy1.description,
        enforcement_date: law1.시행일자,
        source_url: getLawGoKrLink(law1.법령명한글),
      },
      law_2: {
        name: law2.법령명한글,
        type: law2.법령구분명,
        hierarchy_level: hierarchy2.level,
        hierarchy_name: hierarchy2.description,
        enforcement_date: law2.시행일자,
        source_url: getLawGoKrLink(law2.법령명한글),
      },
      comparison_result: {
        priority_law: priority,
        reason: priorityReason,
        explanation: comparison,
      },
      legal_principles: {
        lex_superior: '상위법 우선 - 헌법 > 법률 > 시행령 > 시행규칙 > 행정규칙',
        lex_posterior: '신법 우선 - 동일 위계에서 최신 법령 적용',
        lex_specialis: '특별법 우선 - 일반법보다 특별법 적용 (예: 민법 < 상법)',
      },
      verification_note: '⚠️ 이 데이터는 AI 검증용입니다. 복잡한 법률 충돌은 전문가 상담이 필요합니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 새로운 핸들러: 행정규칙 검색
// ============================================

async function handleSearchAdminRules(args: {
  query: string;
  limit?: number;
}): Promise<string> {
  const { query, limit = 20 } = args;

  try {
    const results = await extendedApi.searchAdminRules(query, limit);

    if (results.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        message: `"${query}"와 관련된 행정규칙을 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      total_count: results.length,
      warning: `⚠️ 행정규칙(훈령, 예규, 고시)은 법적 구속력이 제한적입니다.
상위법(법률, 시행령)과 충돌하면 상위법이 우선 적용됩니다.
법원 판결은 행정규칙에 구속되지 않습니다.`,
      results: results.map(r => ({
        name: r.행정규칙명,
        type: r.행정규칙종류명,
        department: r.소관부처명,
        issue_date: r.발령일자,
        enforcement_date: r.시행일자,
        hierarchy_note: '행정규칙 (법령 위계 최하위)',
      })),
      verification_note: '⚠️ 이 데이터는 AI 검증용입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 새로운 핸들러: 인용문 팩트체커
// ============================================

async function handleCheckLegalCitation(args: {
  law_name: string;
  article_no: string;
  quoted_text?: string;
}): Promise<string> {
  const { law_name, article_no, quoted_text } = args;

  try {
    // 1. 로컬 DB에서 검증 시도
    const citationResult = checkCitation(law_name, article_no, quoted_text);

    if (citationResult.found && citationResult.article) {
      const result: any = {
        status: 'VERIFIED',
        law_info: {
          name: citationResult.law!.law_name,
          type: citationResult.law!.law_type,
          enforcement_date: citationResult.law!.enforcement_date,
          ministry: citationResult.law!.ministry,
        },
        article_info: {
          number: citationResult.article.article_no,
          title: citationResult.article.article_title,
          content: citationResult.article.content,
        },
        source_url: getLawGoKrLink(citationResult.law!.law_name, citationResult.article.article_no),
      };

      // 인용문 비교 결과 추가
      if (quoted_text && citationResult.similarity !== undefined) {
        result.citation_check = {
          quoted_text: quoted_text,
          actual_text: citationResult.article.content,
          similarity_score: Math.round(citationResult.similarity * 100) / 100,
          similarity_percent: `${(citationResult.similarity * 100).toFixed(1)}%`,
          match_status: citationResult.matchStatus,
          verdict: getMatchVerdict(citationResult.matchStatus!),
        };

        if (citationResult.matchStatus === 'MISMATCH') {
          result.warning = `⚠️ 인용 불일치 경고!
인용하신 텍스트가 실제 조문과 상당히 다릅니다 (유사도: ${(citationResult.similarity * 100).toFixed(1)}%).
문서 작성 시 원문을 다시 확인해주세요.`;
        } else if (citationResult.matchStatus === 'PARTIAL') {
          result.notice = `📝 부분 일치
인용 텍스트가 원문과 대체로 유사하나 일부 차이가 있습니다.
(유사도: ${(citationResult.similarity * 100).toFixed(1)}%)`;
        }
      }

      result.verification_note = '⚠️ 이 데이터는 AI 검증용입니다. 법적 판단의 최종 근거는 law.go.kr을 참조하세요.';
      return JSON.stringify(result, null, 2);
    }

    // 2. 로컬 DB에 없으면 API로 조회 시도
    const apiResults = await api.searchLaws(law_name, 5);
    if (apiResults.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        warning: `⚠️ "${law_name}" 법령을 찾을 수 없습니다.`,
        suggestion: '법령명을 정확히 입력했는지 확인하세요.',
        tips: [
          '공식 법령명을 사용하세요 (예: "노동법" → "근로기준법")',
          '약칭이 아닌 정식명칭을 사용하세요',
          '띄어쓰기를 확인하세요',
        ],
      });
    }

    // API에서 찾은 경우
    const lawDetail = await api.getLawDetail(apiResults[0].법령ID);
    if (!lawDetail) {
      return JSON.stringify({
        status: 'API_ERROR',
        warning: '법령 상세 정보를 가져올 수 없습니다.',
      });
    }

    // 조문 찾기
    const normalizedArticleNo = article_no.replace(/제|조/g, '').trim();
    const article = lawDetail.조문.find(a =>
      a.조문번호.includes(normalizedArticleNo) ||
      a.조문번호.replace(/제|조/g, '').trim() === normalizedArticleNo
    );

    if (!article) {
      return JSON.stringify({
        status: 'ARTICLE_NOT_FOUND',
        warning: `⚠️ "${law_name}"에서 ${article_no}를 찾을 수 없습니다.`,
        available_articles: lawDetail.조문.slice(0, 15).map(a => ({
          number: a.조문번호,
          title: a.조문제목,
        })),
        suggestion: '조문 번호를 확인하세요. 해당 조문이 삭제되었거나 번호가 변경되었을 수 있습니다.',
      });
    }

    // API 결과로 검증
    const result: any = {
      status: 'VERIFIED_VIA_API',
      law_info: {
        name: lawDetail.기본정보.법령명_한글,
        enforcement_date: lawDetail.기본정보.시행일자,
        promulgation_date: lawDetail.기본정보.공포일자,
      },
      article_info: {
        number: article.조문번호,
        title: article.조문제목,
        content: article.조문내용,
      },
      source_url: getLawGoKrLink(lawDetail.기본정보.법령명_한글, article.조문번호),
    };

    // 인용문 비교
    if (quoted_text) {
      const similarity = calculateTextSimilarity(quoted_text, article.조문내용);
      let matchStatus: 'EXACT' | 'PARTIAL' | 'MISMATCH';
      if (similarity >= 0.95) matchStatus = 'EXACT';
      else if (similarity >= 0.7) matchStatus = 'PARTIAL';
      else matchStatus = 'MISMATCH';

      result.citation_check = {
        quoted_text: quoted_text,
        actual_text: article.조문내용,
        similarity_score: Math.round(similarity * 100) / 100,
        similarity_percent: `${(similarity * 100).toFixed(1)}%`,
        match_status: matchStatus,
        verdict: getMatchVerdict(matchStatus),
      };

      if (matchStatus === 'MISMATCH') {
        result.warning = `⚠️ 인용 불일치! (유사도: ${(similarity * 100).toFixed(1)}%)`;
      }
    }

    result.verification_note = '⚠️ 이 데이터는 AI 검증용입니다.';
    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

function getMatchVerdict(status: 'EXACT' | 'PARTIAL' | 'MISMATCH' | 'NOT_FOUND'): string {
  switch (status) {
    case 'EXACT':
      return '✅ 정확함 - 인용 텍스트가 원문과 일치합니다.';
    case 'PARTIAL':
      return '⚠️ 부분 일치 - 대체로 맞으나 일부 표현 차이가 있습니다.';
    case 'MISMATCH':
      return '❌ 불일치 - 인용 텍스트가 원문과 상당히 다릅니다. 확인 필요!';
    case 'NOT_FOUND':
      return '❓ 조문을 찾을 수 없음 - 해당 조문이 존재하지 않습니다.';
    default:
      return '알 수 없음';
  }
}

// ============================================
// 🆕 새로운 핸들러: 교차 검증 에이전트
// ============================================

async function handleValidateReferences(args: {
  law_name: string;
  include_external?: boolean;
}): Promise<string> {
  const { law_name, include_external = true } = args;

  try {
    // 1. 법령 찾기
    const law = db.findLawByName(law_name);
    
    if (!law) {
      // API로 시도
      const apiResults = await api.searchLaws(law_name, 1);
      if (apiResults.length === 0) {
        return JSON.stringify({
          status: 'NOT_FOUND',
          warning: `"${law_name}" 법령을 찾을 수 없습니다.`,
        });
      }
      
      return JSON.stringify({
        status: 'NOT_IN_LOCAL_DB',
        message: `"${law_name}"이 로컬 DB에 없습니다. 먼저 동기화가 필요합니다.`,
        found_in_api: {
          name: apiResults[0].법령명한글,
          enforcement_date: apiResults[0].시행일자,
        },
        suggestion: '법령 동기화 후 다시 시도하세요.',
      });
    }

    // 2. 교차 참조 검증
    const validation = validateLawReferences(law.id!);

    // 3. 결과 생성
    const result: any = {
      status: 'VALIDATED',
      law_info: {
        id: law.id,
        name: law.law_name,
        type: law.law_type,
        enforcement_date: law.enforcement_date,
        source_url: getLawGoKrLink(law.law_name),
      },
      summary: {
        total_references: validation.totalRefs,
        valid_references: validation.validRefs,
        broken_references: validation.brokenRefs.length,
        external_references: validation.externalRefs.length,
        integrity_score: validation.totalRefs > 0 
          ? `${((validation.validRefs / validation.totalRefs) * 100).toFixed(1)}%`
          : '100%',
      },
    };

    // 끊어진 참조가 있으면 경고
    if (validation.brokenRefs.length > 0) {
      result.warning = `⚠️ ${validation.brokenRefs.length}개의 끊어진 참조(Broken Link)가 발견되었습니다!`;
      result.broken_references = validation.brokenRefs.map(br => ({
        location: br.articleNo,
        reference: br.reference,
        type: br.type === 'internal' ? '내부 참조' : '외부 참조',
        issue: br.type === 'internal' 
          ? '해당 조문이 이 법령 내에 존재하지 않습니다.'
          : '참조된 외부 법령/조문을 찾을 수 없습니다.',
      }));
    }

    // 외부 참조 목록
    if (include_external && validation.externalRefs.length > 0) {
      result.external_references = validation.externalRefs.slice(0, 20).map(er => ({
        from_article: er.articleNo,
        referenced_law: er.lawName,
        referenced_article: er.reference,
        link: getLawGoKrLink(er.lawName, er.reference),
      }));

      if (validation.externalRefs.length > 20) {
        result.external_references_note = `외 ${validation.externalRefs.length - 20}개 더 있음`;
      }
    }

    // 권장 사항
    if (validation.brokenRefs.length > 0) {
      result.recommendations = [
        '끊어진 참조는 법령 개정으로 인해 발생했을 수 있습니다.',
        '해당 조문이 삭제/통합되었는지 확인하세요.',
        '문서 작성 시 최신 법령을 참조하세요.',
      ];
    } else {
      result.recommendations = ['모든 내부 참조가 유효합니다. ✅'];
    }

    result.verification_note = '⚠️ 이 데이터는 AI 검증용입니다.';
    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 새로운 핸들러: 시나리오 기반 적절성 검토
// ============================================

async function handleReviewCompliance(args: {
  scenario: string;
  domain?: string;
  keywords?: string[];
  limit?: number;
}): Promise<string> {
  const { scenario, domain, keywords = [], limit = 10 } = args;

  try {
    // 1. 시나리오에서 키워드 추출
    const extractedKeywords = extractKeywordsFromScenario(scenario, domain);
    const allKeywords = [...new Set([...extractedKeywords, ...keywords])];

    if (allKeywords.length === 0) {
      return JSON.stringify({
        status: 'NO_KEYWORDS',
        warning: '검토할 키워드를 추출할 수 없습니다.',
        suggestion: '더 구체적인 상황 설명을 제공하거나, keywords 파라미터를 사용하세요.',
      });
    }

    // 2. 관련 법령 검색
    const relatedArticles = findRelatedArticles(allKeywords, limit * 2);

    if (relatedArticles.length === 0) {
      // FTS 실패 시 개별 검색 시도
      const fallbackResults: any[] = [];
      for (const keyword of allKeywords.slice(0, 3)) {
        const ftsResults = searchArticlesFTS(keyword, 10);
        fallbackResults.push(...ftsResults);
      }

      if (fallbackResults.length === 0) {
        return JSON.stringify({
          status: 'NO_RESULTS',
          message: '관련 법령을 찾을 수 없습니다.',
          searched_keywords: allKeywords,
          suggestions: [
            '동기화된 법령 범위를 확인하세요.',
            '더 일반적인 키워드를 사용해 보세요.',
            '법률 용어로 변환해 보세요 (예: "짜르다" → "해고")',
          ],
        });
      }
    }

    // 3. 결과 정제 및 구조화
    const topArticles = relatedArticles.slice(0, limit);

    // 법령별 그룹화
    const byLaw: Record<string, any[]> = {};
    for (const article of topArticles) {
      if (!byLaw[article.lawName]) {
        byLaw[article.lawName] = [];
      }
      byLaw[article.lawName].push(article);
    }

    const result: any = {
      status: 'FOUND',
      scenario_summary: scenario.length > 200 ? scenario.substring(0, 200) + '...' : scenario,
      search_info: {
        extracted_keywords: extractedKeywords,
        additional_keywords: keywords,
        domain_hint: domain || '없음',
        total_results: relatedArticles.length,
        showing: topArticles.length,
      },
      related_laws_summary: Object.keys(byLaw).map(lawName => ({
        law_name: lawName,
        article_count: byLaw[lawName].length,
        articles: byLaw[lawName].map(a => a.articleNo).join(', '),
        source_url: getLawGoKrLink(lawName),
      })),
      relevant_articles: topArticles.map((article, idx) => ({
        rank: idx + 1,
        law_name: article.lawName,
        article_no: article.articleNo,
        article_title: article.articleTitle,
        content: article.content.length > 500 
          ? article.content.substring(0, 500) + '...' 
          : article.content,
        relevance_score: `${(article.relevanceScore * 100).toFixed(0)}%`,
        source_url: getLawGoKrLink(article.lawName, article.articleNo),
      })),
    };

    // AI 검토 가이드 추가
    result.ai_review_guide = {
      instruction: `위 법령 조문들을 참고하여 다음 상황을 분석해주세요:

"${scenario.substring(0, 300)}${scenario.length > 300 ? '...' : ''}"

검토 포인트:
1. 위 상황이 관련 법령에 위반되는 요소가 있는가?
2. 법적으로 주의해야 할 사항은 무엇인가?
3. 권장되는 조치나 절차는 무엇인가?`,
      context_provided: `${topArticles.length}개 관련 조문`,
      disclaimer: '⚠️ AI의 법적 판단은 참고용입니다. 중요한 결정은 법률 전문가와 상담하세요.',
    };

    result.verification_note = '⚠️ 이 데이터는 AI 검증용입니다. 법적 판단의 최종 근거는 law.go.kr을 참조하세요.';
    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 새로운 핸들러: 종합 법령 검색 (Landscape)
// ============================================

async function handleSearchLegalLandscape(args: {
  query: string;
  limit_per_source?: number;
}): Promise<string> {
  const { query, limit_per_source = 3 } = args;

  try {
    // 4가지 소스 동시 검색
    const [laws, adminRules, precedents, interpretations] = await Promise.all([
      api.searchLaws(query, limit_per_source),
      extendedApi.searchAdminRules(query, limit_per_source),
      api.searchPrecedents(query, limit_per_source),
      extendedApi.searchLegalInterpretations(query, limit_per_source),
    ]);

    const totalCount = laws.length + adminRules.length + precedents.length + interpretations.length;

    if (totalCount === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        message: `"${query}"에 대한 법적 정보를 찾을 수 없습니다.`,
        suggestion: '검색어를 변경하거나 더 일반적인 키워드를 사용해보세요.',
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      query: query,
      summary: {
        laws: laws.length,
        admin_rules: adminRules.length,
        precedents: precedents.length,
        interpretations: interpretations.length,
      },
      results: {
        laws: laws.map(l => ({
          name: l.법령명한글,
          type: l.법령구분명,
          enforcement_date: l.시행일자,
          link: getLawGoKrLink(l.법령명한글),
        })),
        admin_rules: adminRules.map(r => ({
          name: r.행정규칙명,
          type: r.행정규칙종류명,
          department: r.소관부처명,
          issue_date: r.발령일자,
          link: r.행정규칙상세링크,
        })),
        precedents: precedents.map(p => ({
          case_name: p.사건명,
          case_number: p.사건번호,
          date: p.선고일자,
          type: p.사건종류명,
          summary: p.판결요지 ? (p.판결요지.substring(0, 100) + '...') : '요지 없음',
          link: getPrecedentLink(p.판례일련번호.toString()),
        })),
        interpretations: interpretations.map(i => ({
          title: i.사안명,
          agency: i.회신기관명,
          date: i.회신일자,
          link: `https://www.law.go.kr/DRF/lawService.do?target=expc&ID=${i.법령해석일련번호}`,
        })),
      },
      verification_note: '⚠️ 이 데이터는 AI 검증용입니다. 전체 내용을 보려면 각 링크를 확인하세요.',
    }, null, 2);

  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

/**
 * 시나리오 텍스트에서 법률 관련 키워드 추출
 */
function extractKeywordsFromScenario(scenario: string, domain?: string): string[] {
  const keywords: string[] = [];

  // 도메인별 핵심 키워드
  const domainKeywords: Record<string, string[]> = {
    '노동': ['근로자', '해고', '임금', '퇴직금', '휴가', '근로계약', '사용자', '고용'],
    '민사': ['계약', '손해배상', '채무', '채권', '소유권', '임대차', '매매'],
    '형사': ['처벌', '벌금', '징역', '고소', '고발', '범죄', '피해자'],
    '세무': ['세금', '소득세', '법인세', '부가가치세', '신고', '납부'],
    '부동산': ['등기', '임대', '임차', '매매', '건축', '토지', '주택'],
  };

  // 도메인 힌트가 있으면 해당 키워드 추가
  if (domain && domainKeywords[domain]) {
    // 시나리오에 포함된 도메인 키워드만 추가
    for (const kw of domainKeywords[domain]) {
      if (scenario.includes(kw)) {
        keywords.push(kw);
      }
    }
  }

  // 일반 법률 용어 패턴 추출
  const legalTermPatterns = [
    // 노동법 관련
    /해고|근로자|사용자|임금|퇴직금|휴가|연차|야근|초과근무|최저임금|근로계약/g,
    // 계약 관련
    /계약|위약|손해배상|이행|해제|해지|무효|취소/g,
    // 절차 관련
    /통보|신고|신청|허가|승인|기한|기간/g,
    // 주체 관련
    /사업주|노동자|피해자|가해자|채권자|채무자/g,
    // 금전 관련
    /과태료|벌금|배상|보상|급여|수당/g,
  ];

  for (const pattern of legalTermPatterns) {
    const matches = scenario.match(pattern);
    if (matches) {
      keywords.push(...matches);
    }
  }

  // 중복 제거 및 반환
  return [...new Set(keywords)];
}

// ============================================
// 🆕 확장 핸들러: 위원회 결정문
// ============================================

async function handleSearchCommitteeDecisions(args: {
  committee_type: string;
  query: string;
  limit?: number;
}): Promise<string> {
  const { committee_type, query, limit = 20 } = args;

  try {
    const results = await extendedApi.searchCommitteeDecisions(
      committee_type as extendedApi.CommitteeType,
      query,
      limit
    );

    if (results.length === 0) {
      return JSON.stringify({
        status: 'NO_RESULTS',
        committee_type,
        query,
        message: `"${query}" 관련 ${results[0]?.위원회명 || committee_type} 결정문을 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      committee: results[0]?.위원회명,
      query,
      total_count: results.length,
      decisions: results.slice(0, limit).map((d: any) => ({
        serial_number: d.일련번호,
        case_number: d.사건번호,
        case_name: d.사건명,
        decision_date: d.결정일자,
        decision_type: d.결정유형,
        summary: d.결정요지 ? (d.결정요지.substring(0, 200) + '...') : null,
      })),
      verification_note: '⚠️ 이 데이터는 AI 검증용입니다. 전체 결정문은 해당 위원회 사이트에서 확인하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 확장 핸들러: 부처 해석례
// ============================================

async function handleSearchMinistryInterpretations(args: {
  ministry_type: string;
  query: string;
  limit?: number;
}): Promise<string> {
  const { ministry_type, query, limit = 20 } = args;

  try {
    const results = await extendedApi.searchMinistryInterpretations(
      ministry_type as extendedApi.MinistryType,
      query,
      limit
    );

    if (results.length === 0) {
      return JSON.stringify({
        status: 'NO_RESULTS',
        ministry_type,
        query,
        message: `"${query}" 관련 ${ministry_type} 해석례를 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      ministry: results[0]?.부처명,
      query,
      total_count: results.length,
      interpretations: results.slice(0, limit).map((i: any) => ({
        serial_number: i.일련번호,
        case_number: i.안건번호,
        title: i.제목 || i.사안명,
        response_date: i.회신일자,
        question_summary: i.질의요지 ? (i.질의요지.substring(0, 150) + '...') : null,
        answer_summary: i.회답 ? (i.회답.substring(0, 150) + '...') : null,
      })),
      hierarchy_warning: '⚠️ 부처 해석은 상위법(법률)을 거스를 수 없습니다. 법률과 충돌 시 법률이 우선합니다.',
      verification_note: '⚠️ 이 데이터는 AI 검증용입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 확장 핸들러: 영문 법령
// ============================================

async function handleSearchEnglishLaw(args: {
  query: string;
  article_number?: string;
}): Promise<string> {
  const { query, article_number } = args;

  try {
    // 먼저 목록 검색
    const searchResults = await api.searchEnglishLaws(query, 10);

    if (searchResults.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        query,
        message: `"${query}" 영문 법령을 찾을 수 없습니다.`,
        suggestion: '한글 또는 영문 법령명으로 다시 검색해보세요.',
      });
    }

    // 첫 번째 결과의 상세 조회
    const lawDetail = await api.getEnglishLawDetail(searchResults[0].법령ID);

    if (!lawDetail) {
      return JSON.stringify({
        status: 'DETAIL_ERROR',
        message: '영문 법령 상세 정보를 가져올 수 없습니다.',
        search_results: searchResults.slice(0, 5).map(r => ({
          korean_name: r.법령명한글,
          english_name: r.법령명영문,
          enforcement_date: r.시행일자,
        })),
      });
    }

    // 특정 조문 필터링
    let articles = lawDetail.조문;
    if (article_number) {
      const normalizedNo = article_number.replace(/제|조|Article/gi, '').trim();
      articles = articles.filter(a => 
        a.조문번호.includes(normalizedNo)
      );
    }

    return JSON.stringify({
      status: 'FOUND',
      law_info: {
        korean_name: lawDetail.기본정보.법령명_한글,
        english_name: lawDetail.기본정보.법령명_영문,
        enforcement_date: lawDetail.기본정보.시행일자,
        department: lawDetail.기본정보.소관부처명,
        law_type: lawDetail.기본정보.법령구분명,
      },
      articles: articles.slice(0, 20).map(a => ({
        article_number: a.조문번호,
        title_korean: a.조문제목_한글,
        title_english: a.조문제목_영문,
        content_korean: a.조문내용_한글,
        content_english: a.조문내용_영문,
      })),
      source_url: getLawGoKrLink(lawDetail.기본정보.법령명_한글),
      verification_note: '⚠️ 영문 번역은 참고용입니다. 법적 효력은 한글 원문에 있습니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 확장 핸들러: 특별행정심판
// ============================================

async function handleSearchTribunalDecisions(args: {
  tribunal_type: string;
  query: string;
  limit?: number;
}): Promise<string> {
  const { tribunal_type, query, limit = 20 } = args;

  try {
    const results = await extendedApi.searchTribunalDecisions(
      tribunal_type as extendedApi.TribunalType,
      query,
      limit
    );

    if (results.length === 0) {
      return JSON.stringify({
        status: 'NO_RESULTS',
        tribunal_type,
        query,
        message: `"${query}" 관련 ${tribunal_type} 재결례를 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      tribunal: results[0]?.심판원명,
      query,
      total_count: results.length,
      decisions: results.slice(0, limit).map((d: any) => ({
        serial_number: d.일련번호,
        case_number: d.사건번호,
        case_name: d.사건명,
        decision_date: d.재결일자,
        result: d.재결결과,
        summary: d.재결요지 ? (d.재결요지.substring(0, 200) + '...') : null,
      })),
      verification_note: '⚠️ 이 데이터는 AI 검증용입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 확장 핸들러: 컴플라이언스 종합검색
// ============================================

async function handleSearchComplianceAll(args: {
  query: string;
  committees?: string[];
  ministries?: string[];
  limit_per_source?: number;
}): Promise<string> {
  const { 
    query, 
    committees = ['privacy', 'monopoly', 'labor'],
    ministries = ['moel', 'nts'],
    limit_per_source = 5 
  } = args;

  try {
    // 1. 법령 검색
    const lawsPromise = api.searchLaws(query, limit_per_source);
    
    // 2. 위원회 결정문 검색
    const committeePromise = extendedApi.searchAllCommittees(
      query, 
      committees as extendedApi.CommitteeType[], 
      limit_per_source
    );
    
    // 3. 부처 해석례 검색
    const ministryPromise = extendedApi.searchKeyMinistries(
      query, 
      ministries as extendedApi.MinistryType[], 
      limit_per_source
    );

    // 병렬 실행
    const [laws, committeeResults, ministryResults] = await Promise.all([
      lawsPromise,
      committeePromise,
      ministryPromise,
    ]);

    return JSON.stringify({
      status: 'FOUND',
      query,
      summary: {
        laws_found: laws.length,
        committee_sources: committeeResults.filter(c => c.results.length > 0).length,
        ministry_sources: ministryResults.filter(m => m.results.length > 0).length,
      },
      results: {
        laws: laws.slice(0, limit_per_source).map(l => ({
          name: l.법령명한글,
          type: l.법령구분명,
          enforcement_date: l.시행일자,
          department: l.소관부처명,
          link: getLawGoKrLink(l.법령명한글),
        })),
        committee_decisions: committeeResults.map(c => ({
          committee: c.committee,
          count: c.results.length,
          top_results: c.results.slice(0, 3).map((r: any) => ({
            case_number: r.사건번호,
            case_name: r.사건명,
            date: r.결정일자,
          })),
        })),
        ministry_interpretations: ministryResults.map(m => ({
          ministry: m.ministry,
          count: m.results.length,
          top_results: m.results.slice(0, 3).map((r: any) => ({
            title: r.제목 || r.사안명,
            date: r.회신일자,
          })),
        })),
      },
      hierarchy_note: '⚠️ 법적 효력 순서: 법령 > 위원회 결정 > 부처 해석. 충돌 시 상위법 우선!',
      verification_note: '⚠️ 이 데이터는 컴플라이언스 검토용 참고 자료입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 상세 조회 핸들러
// ============================================

async function handleGetCommitteeDecisionDetail(args: {
  committee_type: string;
  decision_id: string;
}): Promise<string> {
  const { committee_type, decision_id } = args;

  try {
    const detail = await extendedApi.getCommitteeDecisionDetail(
      committee_type as extendedApi.CommitteeType,
      decision_id
    );

    if (!detail) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        committee_type,
        decision_id,
        message: `${committee_type} 위원회의 결정 ID ${decision_id}를 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      committee_type,
      decision_id,
      detail,
      note: '⚠️ 이 데이터는 AI 검증용입니다. 법적 판단은 원본 문서를 참고하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleGetMinistryInterpretationDetail(args: {
  ministry_type: string;
  interpretation_id: string;
}): Promise<string> {
  const { ministry_type, interpretation_id } = args;

  try {
    const detail = await extendedApi.getMinistryInterpretationDetail(
      ministry_type as extendedApi.MinistryType,
      interpretation_id
    );

    if (!detail) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        ministry_type,
        interpretation_id,
        message: `${ministry_type} 부처의 해석 ID ${interpretation_id}를 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      ministry_type,
      interpretation_id,
      detail,
      hierarchy_warning: '⚠️ 부처 해석은 상위법(법률)을 거스를 수 없습니다.',
      note: '⚠️ 이 데이터는 AI 검증용입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleGetTribunalDecisionDetail(args: {
  tribunal_type: string;
  decision_id: string;
}): Promise<string> {
  const { tribunal_type, decision_id } = args;

  try {
    const detail = await extendedApi.getTribunalDecisionDetail(
      tribunal_type as extendedApi.TribunalType,
      decision_id
    );

    if (!detail) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        tribunal_type,
        decision_id,
        message: `${tribunal_type} 심판원의 재결 ID ${decision_id}를 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      tribunal_type,
      decision_id,
      detail,
      note: '⚠️ 이 데이터는 AI 검증용입니다. 행정소송은 원본 문서를 기반으로 진행하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleGetExtendedTribunalDecisionDetail(args: {
  tribunal_type: string;
  decision_id: string;
}): Promise<string> {
  const { tribunal_type, decision_id } = args;

  try {
    const detail = await extendedApi.getExtendedTribunalDecisionDetail(
      tribunal_type as extendedApi.ExtendedTribunalType,
      decision_id
    );

    if (!detail) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        tribunal_type,
        decision_id,
        message: `${tribunal_type} 확장 심판기구의 재결 ID ${decision_id}를 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      tribunal_type,
      decision_id,
      detail,
      note: '⚠️ 이 데이터는 AI 검증용입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleGetExtendedMinistryInterpretationDetail(args: {
  ministry_type: string;
  interpretation_id: string;
}): Promise<string> {
  const { ministry_type, interpretation_id } = args;

  try {
    const detail = await extendedApi.getExtendedMinistryInterpretationDetail(
      ministry_type as extendedApi.ExtendedMinistryType,
      interpretation_id
    );

    if (!detail) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        ministry_type,
        interpretation_id,
        message: `${ministry_type} 부처의 해석 ID ${interpretation_id}를 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      ministry_type,
      interpretation_id,
      detail,
      hierarchy_warning: '⚠️ 부처 해석은 상위법(법률)을 거스를 수 없습니다.',
      note: '⚠️ 이 데이터는 AI 검증용입니다.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

// ============================================
// 🆕 선택 구현: 판례 통계 & 법령 영향도 핸들러
// ============================================

async function handleSearchPrecedentStatistics(args: {
  query: string;
  year?: number;
}): Promise<string> {
  const { query, year } = args;

  try {
    const stats = await precedentApi.searchPrecedentStatistics(query, { year });

    return JSON.stringify({
      status: 'SUCCESS',
      data: stats,
      interpretation: `"${query}" 관련 판례는 총 ${stats.totalCount}건입니다. 최근 1년간 ${stats.recentYearCount}건의 판례가 있으며, ${stats.trendPercentage}% ${stats.trend === 'up' ? '증가' : '안정'} 추세입니다.`,
      useCase: 'audit_pipeline 신뢰도 검증: AI가 인용한 주제의 판례가 실제로 많은지 확인',
      note: '⚠️ 이 통계는 API 데이터 기반 추정입니다. 정확한 통계는 대법원 판례 검색 시스템을 참고하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      query,
      error: String(error),
      message: '판례 통계를 조회할 수 없습니다.',
    });
  }
}

async function handleSearchPrecedentLawLinks(args: {
  law_id: string;
  display?: number;
  page?: number;
}): Promise<string> {
  const { law_id, display = 50, page = 1 } = args;

  try {
    const links = await precedentApi.searchPrecedentLawLinks(law_id, { display, page });

    return JSON.stringify({
      status: 'SUCCESS',
      data: links,
      summary: `"${links.lawId}"을(를) 인용한 판례는 총 ${links.citationCount}건이며, 승소율은 ${links.supportRate}%입니다.`,
      topPrecedents: links.relatedPrecedents.slice(0, 5).map(p => ({
        caseNumber: p.caseNumber,
        title: p.title,
        court: p.court,
        date: p.date,
      })),
      useCase: 'audit_pipeline 검증: AI가 인용한 법령이 실제 판례에서 승소했는지 확인',
      note: '⚠️ 이 데이터는 API 기반 추정입니다. 정확한 법령 연계 판례는 대법원 전자공시 시스템을 참고하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      law_id,
      error: String(error),
      message: '판례-법령 연계를 조회할 수 없습니다.',
    });
  }
}

async function handleSearchStatuteLawImpact(args: {
  source_statute: string;
  source_article?: string;
  display?: number;
}): Promise<string> {
  const { source_statute, source_article, display } = args;

  try {
    const impact = await precedentApi.searchStatuteLawImpact(source_statute, source_article, { display });

    return JSON.stringify({
      status: 'SUCCESS',
      data: {
        sourceStatute: impact.sourceStatute,
        sourceArticle: impact.sourceArticle,
        affectedCount: impact.totalAffected,
        conflictCount: impact.conflictCount,
        overallRisk: impact.overallRisk,
        affectedStatutes: impact.affectedStatutes.map(s => ({
          name: s.name,
          impactLevel: s.impactLevel,
          riskType: s.riskType,
          description: s.description,
        })),
      },
      summary: impact.message,
      riskAnalysis: {
        high: impact.affectedStatutes.filter(s => s.impactLevel === 'high').map(s => s.name),
        medium: impact.affectedStatutes.filter(s => s.impactLevel === 'medium').map(s => s.name),
        low: impact.affectedStatutes.filter(s => s.impactLevel === 'low').map(s => s.name),
      },
      useCase: 'audit_pipeline 검증: 법령 개정이 다른 법령과 충돌하는지 확인',
      recommendation: impact.overallRisk === 'high' ?
        '⚠️ 높은 위험도: 전문 법률가 상담 권고' :
        '✓ 관련 법령과의 충돌 위험이 낮습니다.',
      note: '⚠️ 이 분석은 API 데이터 기반 추정입니다. 정확한 법령 영향도 분석은 법제처 입법예보를 참고하세요.',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      source_statute,
      error: String(error),
      message: '법령 영향도를 분석할 수 없습니다.',
    });
  }
}

// ============================================
// 유틸리티: 법령 위계 판단
// ============================================

function determineLawHierarchy(lawType: string): { level: number; description: string } {
  const hierarchyMap: Record<string, { level: number; description: string }> = {
    '헌법': { level: 1, description: '최상위 규범 (Constitutional Law)' },
    '법률': { level: 2, description: '국회 제정 법률 (Act)' },
    '대통령령': { level: 3, description: '대통령령/시행령 (Presidential Decree)' },
    '시행령': { level: 3, description: '대통령령/시행령 (Presidential Decree)' },
    '총리령': { level: 4, description: '총리령 (Prime Ministerial Decree)' },
    '부령': { level: 4, description: '부령/시행규칙 (Ministerial Decree)' },
    '시행규칙': { level: 4, description: '부령/시행규칙 (Ministerial Decree)' },
    '조례': { level: 5, description: '자치법규 (Local Ordinance)' },
    '규칙': { level: 5, description: '자치규칙 (Local Rule)' },
  };

  return hierarchyMap[lawType] || { level: 6, description: '행정규칙/기타 (Administrative Rule)' };
}

// ============================================
// 유틸리티
// ============================================

function extractFacts(text: string): Set<string> {
  // 숫자, 금액, 날짜 등 핵심 팩트 추출 정규식
  // 예: 2천만원, 3년, 10%, 30일, 제1항, 2025.1.1
  const regex = /[0-9,.]+(?:\s*(?:억원|천만원|백만원|십만원|만원|천원|원|%|년|개월|월|일|시|분|초|세|명|개|회|조|항|호))?/g;
  const matches = text.match(regex);
  if (!matches) return new Set();
  
  // 공백 제거 및 정규화 후 Set 반환
  return new Set(matches.map(m => m.replace(/\s+/g, '').replace(/,/g, '').trim()));
}

function normalizeArticleNumber(no: string): string {
  // "제347조" -> "347"
  // "제347조의2" -> "347의2"
  // "조의" → "의"로 변환 (DB 형식과 일치)
  return no
    .replace(/\s+/g, '')
    .replace(/^제/, '')
    .replace(/조의/g, '의')
    .replace(/조$/, '');
}

// 조문번호에서 숫자 부분만 추출 (가지번호 제외)
function extractBaseArticleNumber(no: string): string {
  const normalized = normalizeArticleNumber(no);
  // "382의4" → "382", "382" → "382"
  const match = normalized.match(/^(\d+)/);
  return match ? match[1] : normalized;
}

// 가지조문 여부 확인
function hasSubArticleNumber(no: string): boolean {
  const normalized = normalizeArticleNumber(no);
  return normalized.includes('의');
}

function findBestMatchingArticle(articles: any[], targetNo: string): any {
  const normalizedTarget = normalizeArticleNumber(targetNo);
  const targetBase = extractBaseArticleNumber(targetNo);
  const targetHasSub = hasSubArticleNumber(targetNo);

  console.error(`[DEBUG] findBestMatchingArticle: targetNo="${targetNo}", normalized="${normalizedTarget}", base="${targetBase}", hasSub=${targetHasSub}`);

  // 1. 조문번호 완전 일치 (가장 우선)
  const exactMatch = articles.find(a => {
    const infoNo = normalizeArticleNumber(a.조문번호);
    return infoNo === normalizedTarget;
  });
  if (exactMatch) {
    console.error(`[DEBUG] Exact match found: ${exactMatch.조문번호}`);
    return exactMatch;
  }

  // 2. 가지조문이 아닌 경우에만, 베이스 번호로 검색
  // "제382조"를 검색할 때 "382의2", "382의3" 등이 매칭되지 않도록 함
  if (!targetHasSub) {
    const baseMatch = articles.find(a => {
      const infoBase = extractBaseArticleNumber(a.조문번호);
      const infoHasSub = hasSubArticleNumber(a.조문번호);

      // 베이스 번호가 같고, 가지조문이 아닌 경우만 매칭
      return infoBase === targetBase && !infoHasSub;
    });
    if (baseMatch) {
      console.error(`[DEBUG] Base match found: ${baseMatch.조문번호}`);
      return baseMatch;
    }
  }

  // 3. 숫자만으로 매칭 시도 (마지막 폴백)
  const numbersOnlyTarget = targetNo.replace(/[^0-9]/g, '');
  if (numbersOnlyTarget && !targetHasSub) {
    const numberMatch = articles.find(a => {
      const infoNo = normalizeArticleNumber(a.조문번호);
      return infoNo === numbersOnlyTarget;
    });
    if (numberMatch) {
      console.error(`[DEBUG] Number match found: ${numberMatch.조문번호}`);
      return numberMatch;
    }
  }

  console.error(`[DEBUG] No match found for: ${targetNo}`);
  return null;
}

function calculateSimilarity(str1: string, str2: string): number {
  // 전처리: 공백 제거 및 소문자 변환
  const s1 = str1.replace(/\s+/g, '').toLowerCase();
  const s2 = str2.replace(/\s+/g, '').toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // 2-gram (Bi-gram) 생성 함수
  const getNGrams = (text: string, n: number) => {
    const grams = new Set<string>();
    for (let i = 0; i <= text.length - n; i++) {
      grams.add(text.substring(i, i + n));
    }
    return grams;
  };

  // N-gram 기반 Jaccard 유사도 계산
  const n = 2; // 한국어는 2-gram이 효과적
  const set1 = getNGrams(s1, n);
  const set2 = getNGrams(s2, n);

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function formatDate(dateStr: string): string {
  // "20231209" -> "2023-12-09"
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

// ============================================
// 🆕 Supabase 캐시 기반 핸들러
// ============================================

async function handleSupabaseSearchLaws(args: {
  query: string;
  law_type?: string;
  ministry?: string;
  limit?: number;
}): Promise<string> {
  const { query, law_type, ministry, limit = 20 } = args;

  if (!supabaseDB.isAvailable()) {
    return JSON.stringify({
      status: 'UNAVAILABLE',
      error: 'Supabase 연결이 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_SERVICE_KEY 환경변수를 확인하세요.',
      fallback: 'audit_statute 또는 search_legal_landscape 도구를 사용하세요.',
    });
  }

  try {
    const results = await supabaseDB.searchLaws(query, { law_type, ministry, limit });

    if (results.length === 0) {
      return JSON.stringify({
        status: 'NO_RESULTS',
        query,
        filters: { law_type, ministry },
        message: `"${query}" 검색 결과가 없습니다.`,
        suggestion: '검색어를 변경하거나 필터를 제거해보세요.',
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      source: 'supabase_cache',
      query,
      filters: { law_type, ministry },
      total_count: results.length,
      laws: results.map(law => ({
        id: law.id,
        law_mst_id: law.law_mst_id,
        name: law.law_name,
        name_eng: law.law_name_eng,
        type: law.law_type,
        ministry: law.ministry,
        enforcement_date: law.enforcement_date,
        is_current: law.is_current,
        link: getLawGoKrLink(law.law_name),
      })),
      cache_note: '⚡ Supabase 캐시에서 조회됨 (빠른 응답)',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      fallback: 'API 기반 도구(audit_statute)를 사용하세요.',
    });
  }
}

async function handleSupabaseGetArticle(args: {
  law_id: number;
  article_no?: string;
}): Promise<string> {
  const { law_id, article_no } = args;

  if (!supabaseDB.isAvailable()) {
    return JSON.stringify({
      status: 'UNAVAILABLE',
      error: 'Supabase 연결이 설정되지 않았습니다.',
    });
  }

  try {
    // 먼저 법령 정보 조회
    const law = await supabaseDB.getLawById(law_id);
    if (!law) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        law_id,
        message: `법령 ID ${law_id}를 찾을 수 없습니다.`,
      });
    }

    // 조문 조회
    const articles = await supabaseDB.getArticlesByLawId(law_id, article_no);

    if (articles.length === 0) {
      return JSON.stringify({
        status: 'NO_ARTICLES',
        law: {
          id: law.id,
          name: law.law_name,
        },
        article_no,
        message: article_no 
          ? `"${article_no}" 조문을 찾을 수 없습니다.`
          : '이 법령의 조문 데이터가 캐시에 없습니다.',
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      source: 'supabase_cache',
      law: {
        id: law.id,
        name: law.law_name,
        enforcement_date: law.enforcement_date,
        link: getLawGoKrLink(law.law_name),
      },
      total_articles: articles.length,
      articles: articles.map(art => ({
        article_no: art.article_no,
        title: art.article_title,
        content: art.content,
        is_definition: art.is_definition,
      })),
      cache_note: '⚡ Supabase 캐시에서 조회됨',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleSupabaseVerifyCitation(args: {
  citations: Array<{
    law_name: string;
    article_no?: string;
    content_snippet?: string;
  }>;
  strict_mode?: boolean;
}): Promise<string> {
  const { citations, strict_mode = false } = args;

  if (!supabaseDB.isAvailable()) {
    return JSON.stringify({
      status: 'UNAVAILABLE',
      error: 'Supabase 연결이 설정되지 않았습니다.',
      fallback: 'check_legal_citation 도구를 사용하세요.',
    });
  }

  try {
    const results = [];
    let verifiedCount = 0;

    for (const citation of citations) {
      const result = await supabaseDB.verifyCitation(
        citation.law_name,
        citation.article_no,
        strict_mode ? citation.content_snippet : undefined
      );

      if (result.verified) {
        verifiedCount++;
      }

      results.push({
        citation,
        verified: result.verified,
        law: result.law ? {
          id: result.law.id,
          name: result.law.law_name,
          enforcement_date: result.law.enforcement_date,
          link: getLawGoKrLink(result.law.law_name, citation.article_no),
        } : null,
        article: result.article ? {
          article_no: result.article.article_no,
          title: result.article.article_title,
          content_preview: result.article.content?.substring(0, 200) + '...',
        } : null,
        content_match: result.contentMatch,
      });
    }

    return JSON.stringify({
      status: 'VERIFIED',
      source: 'supabase_cache',
      summary: {
        total: citations.length,
        verified: verifiedCount,
        failed: citations.length - verifiedCount,
        accuracy: Math.round((verifiedCount / citations.length) * 100) + '%',
      },
      strict_mode,
      results,
      cache_note: '⚡ Supabase 캐시에서 검증됨 (빠른 응답)',
      warning: verifiedCount < citations.length 
        ? '⚠️ 일부 인용이 검증되지 않았습니다. 법령명/조문 번호를 확인하세요.'
        : null,
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleSupabaseGetSyncStatus(args: {
  source_type?: string;
}): Promise<string> {
  const { source_type = 'all' } = args;

  if (!supabaseDB.isAvailable()) {
    return JSON.stringify({
      status: 'UNAVAILABLE',
      error: 'Supabase 연결이 설정되지 않았습니다.',
    });
  }

  try {
    const counts = await supabaseDB.getDataCounts();

    return JSON.stringify({
      status: 'OK',
      source: 'supabase',
      data_counts: counts,
      sync_info: {
        laws: {
          count: counts.laws || 0,
          description: '캐시된 법령 수',
        },
        articles: {
          count: counts.articles || 0,
          description: '캐시된 조문 수',
        },
        precedents: {
          count: counts.precedents || 0,
          description: '캐시된 판례 수',
        },
      },
      reliability_note: counts.laws > 0 
        ? '✅ 캐시 데이터 사용 가능'
        : '⚠️ 캐시 데이터가 비어있습니다. 동기화가 필요합니다.',
      recommendation: counts.laws === 0 
        ? 'sync-to-supabase.ts 스크립트를 실행하여 데이터를 동기화하세요.'
        : null,
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
    });
  }
}

async function handleSupabaseSearchAllDocuments(args: {
  query: string;
  doc_types?: string[];
  date_from?: string;
  date_to?: string;
  organization?: string;
  limit?: number;
}): Promise<string> {
  const { query, doc_types, date_from, date_to, organization, limit = 50 } = args;

  if (!supabaseDB.isAvailable()) {
    return JSON.stringify({
      status: 'UNAVAILABLE',
      error: 'Supabase 연결이 설정되지 않았습니다.',
      fallback: 'search_legal_landscape 도구를 사용하세요.',
    });
  }

  try {
    const results = await supabaseDB.searchAllDocuments(query, {
      doc_types,
      date_from,
      date_to,
      organization,
      limit,
    });

    if (results.length === 0) {
      return JSON.stringify({
        status: 'NO_RESULTS',
        query,
        filters: { doc_types, date_from, date_to, organization },
        message: `"${query}" 검색 결과가 없습니다.`,
      });
    }

    // 문서 유형별 그룹화
    const grouped: Record<string, typeof results> = {};
    for (const doc of results) {
      const type = doc.doc_type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(doc);
    }

    return JSON.stringify({
      status: 'FOUND',
      source: 'supabase_cache',
      query,
      filters: { doc_types, date_from, date_to, organization },
      total_count: results.length,
      by_type: Object.entries(grouped).map(([type, docs]) => ({
        doc_type: type,
        count: docs.length,
        documents: docs.slice(0, 10).map(d => ({
          id: d.id,
          title: d.title,
          case_id: d.case_id,
          effective_date: d.effective_date,
          organization: d.organization,
          source_url: d.source_url,
        })),
      })),
      cache_note: '⚡ Supabase 통합 뷰에서 조회됨',
    }, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      note: 'all_legal_documents 뷰가 존재하지 않을 수 있습니다. supabase-schema-v2.sql을 실행하세요.',
    });
  }
}

// ============================================
// 🆕 사업장 규모별 근로기준법 의무사항 핸들러
// ============================================

async function handleQueryBusinessSizeRequirements(args: {
  business_size: number;
  category?: string;
  industry?: string;
  year?: number;
}): Promise<string> {
  const { business_size, category = 'all', industry, year = new Date().getFullYear() } = args;

  try {
    // JSON 파일 로드
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const dataPath = path.join(process.cwd(), 'data', 'abstract_business_size_requirements.json');

    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const abstractData = JSON.parse(fileContent);

    // 사업장 규모에 맞는 데이터 필터링
    const filteredData = abstractData.data.filter((item: any) => {
      // 카테고리 필터
      if (category !== 'all' && !item.category.includes(category)) {
        return false;
      }

      // 규모에 맞는 항목 선택
      if (business_size < 5 && item.category.includes('5인이상')) return false;
      if (business_size < 10 && item.category.includes('10인이상')) return false;
      if (business_size < 50 && item.category.includes('50인이상')) return false;
      if (business_size < 100 && item.category.includes('100인이상')) return false;
      if (business_size < 300 && item.category.includes('300인이상')) return false;

      // 업종 특례 필터
      if (industry && item.category.includes('업종별특례')) {
        // 업종이 명시된 경우만 특례 항목 포함
        return true;
      }

      return true;
    });

    if (filteredData.length === 0) {
      return JSON.stringify({
        status: 'NO_RESULTS',
        business_size,
        category,
        industry,
        year,
        message: `사업장 규모 ${business_size}인 기준, 해당하는 의무사항이 없습니다.`,
      });
    }

    // 결과 구성
    const result = {
      status: 'FOUND',
      source: 'abstract_business_size_requirements.json',
      business_size,
      category,
      industry: industry || '지정없음',
      year,
      requirements: filteredData.map((item: any) => ({
        id: item.id,
        category: item.category,
        question: item.question,
        answer: item.answer,
        legal_references: item.legal_references,
        keywords: item.keywords,
      })),
      total_count: filteredData.length,
      checklist_applicable: business_size >= 5,
      disclaimer: '⚠️ 본 정보는 법률적 참고 자료이며, 변호사의 전문적인 법률 자문을 대체할 수 없습니다.',
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      message: '사업장 규모별 의무사항 조회 중 오류가 발생했습니다.',
      note: 'data/abstract_business_size_requirements.json 파일이 존재하는지 확인하세요.',
    });
  }
}

// ============================================
// 🆕 국가건설기준 (KDS/KCS) 핸들러
// ============================================

async function handleSearchConstructionStandards(args: {
  query: string;
  doc_type?: 'ALL' | 'KDS' | 'KCS';
  category?: string;
  limit?: number;
}): Promise<string> {
  const { query, doc_type = 'ALL', category, limit = 20 } = args;

  try {
    let results: any[];

    // PostgreSQL 사용 여부 확인
    if (await isPostgresEnabled()) {
      results = await pgSearchConstructionStandards(query, doc_type, category, limit);
    } else {
      // SQLite 사용
      const database = db.getDatabase();
      let sql = `
        SELECT kcsc_cd, standard_name, doc_type, main_category, middle_category,
               effective_date, dept, status
        FROM ConstructionStandards
        WHERE (standard_name LIKE ? OR kcsc_cd LIKE ? OR main_category LIKE ? OR middle_category LIKE ?)
      `;
      const searchPattern = `%${query}%`;
      const params: any[] = [searchPattern, searchPattern, searchPattern, searchPattern];

      if (doc_type !== 'ALL') {
        sql += ` AND doc_type = ?`;
        params.push(doc_type);
      }
      if (category) {
        sql += ` AND (main_category LIKE ? OR middle_category LIKE ?)`;
        params.push(`%${category}%`, `%${category}%`);
      }
      sql += ` ORDER BY doc_type, kcsc_cd LIMIT ?`;
      params.push(limit);

      results = database.prepare(sql).all(...params) as any[];
    }

    if (results.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        query,
        message: `"${query}" 관련 건설기준을 찾을 수 없습니다.`,
        suggestion: 'KDS(설계기준) 또는 KCS(표준시방서) 코드로 검색해 보세요.',
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      query,
      doc_type_filter: doc_type,
      total_results: results.length,
      results: results.map(r => ({
        code: r.kcsc_cd,
        name: r.standard_name,
        type: r.doc_type,
        category: `${r.main_category} > ${r.middle_category}`,
        effective_date: r.effective_date,
        dept: r.dept,
      })),
      note: '📌 건설기준은 법령이 아닌 기술기준이지만, 건축법/건설기술진흥법 등에서 준용합니다.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      message: '건설기준 검색 중 오류가 발생했습니다.',
    });
  }
}

async function handleGetStandardDetails(args: {
  kcsc_cd: string;
  include_history?: boolean;
}): Promise<string> {
  const { kcsc_cd, include_history = true } = args;

  try {
    let standard: any;
    let revisions: any[] = [];

    if (await isPostgresEnabled()) {
      const result = await pgGetStandardDetails(kcsc_cd, include_history);
      standard = result?.standard;
      revisions = result?.revisions ?? [];
    } else {
      const database = db.getDatabase();
      standard = database.prepare(`SELECT * FROM ConstructionStandards WHERE kcsc_cd = ?`).get(kcsc_cd) as any;
      if (standard && include_history) {
        revisions = database.prepare(`
          SELECT doc_year, doc_cycle, doc_er, establishment_date, revision_date,
                 effective_from, revision_remark, is_latest
          FROM ConstructionStandardRevisions WHERE standard_id = ?
          ORDER BY doc_year DESC, doc_order DESC
        `).all(standard.id) as any[];
      }
    }

    if (!standard) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        kcsc_cd,
        message: `"${kcsc_cd}" 코드의 건설기준을 찾을 수 없습니다.`,
        suggestion: '코드 형식을 확인하세요. (예: KDS 57 70 00, KCS 14 20 10)',
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      standard: {
        code: standard.kcsc_cd,
        name: standard.standard_name,
        type: standard.doc_type,
        main_category: standard.main_category,
        middle_category: standard.middle_category,
        establishment_date: standard.establishment_date,
        revision_date: standard.revision_date,
        effective_date: standard.effective_date,
        dept: standard.dept,
        consider_org: standard.consider_org,
        advice_org: standard.advice_org,
        status: standard.status,
      },
      revision_count: revisions.length,
      revisions: revisions.map(r => ({
        year: r.doc_year,
        cycle: r.doc_cycle,
        type: r.doc_er === 'R' ? '개정' : '제정',
        revision_date: r.revision_date,
        effective_from: r.effective_from,
        remark: r.revision_remark,
        is_latest: r.is_latest === 1 || r.is_latest === true,
      })),
      kcsc_link: `https://kcsc.re.kr/standardCode/view?kcscCd=${encodeURIComponent(kcsc_cd)}`,
      note: '📌 PDF 원문은 KCSC 사이트에서 다운로드 가능합니다.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      message: '건설기준 상세 조회 중 오류가 발생했습니다.',
    });
  }
}

async function handleGetStandardRevisions(args: {
  kcsc_cd: string;
}): Promise<string> {
  const { kcsc_cd } = args;

  try {
    let standard: any;
    let revisions: any[] = [];

    if (await isPostgresEnabled()) {
      const result = await pgGetStandardRevisions(kcsc_cd);
      standard = (result as any)?.standard;
      revisions = (result as any[]) || [];
    } else {
      const database = db.getDatabase();
      standard = database.prepare(`SELECT id, standard_name, doc_type FROM ConstructionStandards WHERE kcsc_cd = ?`).get(kcsc_cd) as any;
      if (standard) {
        revisions = database.prepare(`
          SELECT doc_year, doc_cycle, doc_er, establishment_date, revision_date,
                 effective_from, revision_remark, doc_brief, is_latest, doc_file_grp_id
          FROM ConstructionStandardRevisions WHERE standard_id = ?
          ORDER BY doc_year DESC, doc_order DESC
        `).all(standard.id) as any[];
      }
    }

    if (!standard) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        kcsc_cd,
        message: `"${kcsc_cd}" 코드의 건설기준을 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      kcsc_cd,
      standard_name: standard.standard_name,
      doc_type: standard.doc_type,
      total_revisions: revisions.length,
      revisions: revisions.map(r => ({
        year: r.doc_year,
        cycle: r.doc_cycle,
        type: r.doc_er === 'R' ? '개정' : '제정',
        establishment_date: r.establishment_date,
        revision_date: r.revision_date,
        effective_from: r.effective_from,
        remark: r.revision_remark,
        brief: r.doc_brief,
        is_current: r.is_latest === 1 || r.is_latest === true,
        has_file: !!r.doc_file_grp_id,
      })),
      note: '개정 이력은 KCSC에서 제공한 데이터를 기반으로 합니다.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      message: '건설기준 개정 이력 조회 중 오류가 발생했습니다.',
    });
  }
}

// ============================================
// KRX 규정 핸들러
// ============================================

async function handleSearchKrxRegulations(args: {
  query: string;
  market?: string;
  limit?: number;
}): Promise<string> {
  const { query, market = 'ALL', limit = 20 } = args;

  try {
    const database = db.getDatabase();
    const searchPattern = `%${query}%`;

    // 1. 규정명으로 검색
    let regResults: any[];
    if (market === 'ALL') {
      regResults = database.prepare(`
        SELECT r.id, r.reg_id, r.reg_name, r.reg_type, r.market, r.source_url,
               COUNT(c.id) as chunk_count
        FROM KrxRegulations r
        LEFT JOIN KrxRegulationChunks c ON c.regulation_id = r.id
        WHERE r.reg_name LIKE ?
        GROUP BY r.id
        ORDER BY r.reg_name
        LIMIT ?
      `).all(searchPattern, limit) as any[];
    } else {
      regResults = database.prepare(`
        SELECT r.id, r.reg_id, r.reg_name, r.reg_type, r.market, r.source_url,
               COUNT(c.id) as chunk_count
        FROM KrxRegulations r
        LEFT JOIN KrxRegulationChunks c ON c.regulation_id = r.id
        WHERE r.reg_name LIKE ? AND r.market = ?
        GROUP BY r.id
        ORDER BY r.reg_name
        LIMIT ?
      `).all(searchPattern, market, limit) as any[];
    }

    // 2. 조문 FTS 검색 (규정명 매칭이 부족할 때)
    let ftsResults: any[] = [];
    if (regResults.length < 3) {
      try {
        ftsResults = database.prepare(`
          SELECT c.id, c.article_no, c.title, c.content,
                 r.reg_name, r.market, r.reg_id
          FROM KrxRegulationChunks_fts fts
          JOIN KrxRegulationChunks c ON c.id = fts.rowid
          JOIN KrxRegulations r ON r.id = c.regulation_id
          WHERE KrxRegulationChunks_fts MATCH ?
          ${market !== 'ALL' ? 'AND r.market = ?' : ''}
          LIMIT ?
        `).all(...(market !== 'ALL' ? [query, market, limit] : [query, limit])) as any[];
      } catch {
        // FTS 검색 실패 시 LIKE 폴백
        ftsResults = database.prepare(`
          SELECT c.id, c.article_no, c.title, c.content,
                 r.reg_name, r.market, r.reg_id
          FROM KrxRegulationChunks c
          JOIN KrxRegulations r ON r.id = c.regulation_id
          WHERE c.content LIKE ?
          ${market !== 'ALL' ? 'AND r.market = ?' : ''}
          LIMIT ?
        `).all(...(market !== 'ALL' ? [searchPattern, market, limit] : [searchPattern, limit])) as any[];
      }
    }

    if (regResults.length === 0 && ftsResults.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        query,
        message: `"${query}" 관련 KRX 규정을 찾을 수 없습니다.`,
        suggestion: '상장규정, 공시규정, 상장적격성 등 키워드로 검색해보세요.',
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      query,
      market_filter: market,
      regulations: regResults.map(r => ({
        reg_id: r.reg_id,
        name: r.reg_name,
        type: r.reg_type,
        market: r.market,
        articles: r.chunk_count,
        url: r.source_url,
      })),
      matching_articles: ftsResults.slice(0, 10).map(a => ({
        reg_name: a.reg_name,
        article_no: a.article_no,
        title: a.title,
        content_preview: (a.content || '').substring(0, 200),
        market: a.market,
      })),
      note: '📌 KRX 규정 원문은 law.krx.co.kr에서 확인 가능합니다.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      message: 'KRX 규정 검색 중 오류가 발생했습니다.',
    });
  }
}

async function handleGetKrxRegulationDetail(args: {
  reg_name: string;
  article_no?: string;
  keyword?: string;
  limit?: number;
}): Promise<string> {
  const { reg_name, article_no, keyword, limit = 30 } = args;

  try {
    const database = db.getDatabase();

    // 규정 찾기
    const reg = database.prepare(`
      SELECT * FROM KrxRegulations WHERE reg_name LIKE ?
    `).get(`%${reg_name}%`) as any;

    if (!reg) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        reg_name,
        message: `"${reg_name}" 규정을 찾을 수 없습니다.`,
      });
    }

    // 조문 조회
    let articles: any[];
    if (article_no) {
      // 특정 조문번호
      const normalizedNo = article_no.replace(/[^0-9]/g, '');
      articles = database.prepare(`
        SELECT * FROM KrxRegulationChunks
        WHERE regulation_id = ? AND (article_no LIKE ? OR article_no LIKE ?)
        ORDER BY chunk_index
        LIMIT ?
      `).all(reg.id, `%${article_no}%`, `%제${normalizedNo}조%`, limit) as any[];
    } else if (keyword) {
      // 키워드 검색
      articles = database.prepare(`
        SELECT * FROM KrxRegulationChunks
        WHERE regulation_id = ? AND content LIKE ?
        ORDER BY chunk_index
        LIMIT ?
      `).all(reg.id, `%${keyword}%`, limit) as any[];
    } else {
      // 전체 조문 목록
      articles = database.prepare(`
        SELECT * FROM KrxRegulationChunks
        WHERE regulation_id = ?
        ORDER BY chunk_index
        LIMIT ?
      `).all(reg.id, limit) as any[];
    }

    return JSON.stringify({
      status: 'FOUND',
      regulation: {
        reg_id: reg.reg_id,
        name: reg.reg_name,
        type: reg.reg_type,
        market: reg.market,
        url: reg.source_url,
      },
      articles: articles.map(a => ({
        article_no: a.article_no,
        title: a.title,
        content: a.content,
      })),
      total_articles: articles.length,
      note: article_no
        ? `📌 "${reg.reg_name}" ${article_no} 관련 조문입니다.`
        : keyword
        ? `📌 "${reg.reg_name}"에서 "${keyword}" 검색 결과입니다.`
        : `📌 "${reg.reg_name}" 조문 목록입니다.`,
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      message: 'KRX 규정 상세 조회 중 오류가 발생했습니다.',
    });
  }
}

async function handleSearchAllRegulations(args: {
  query: string;
  type_filter?: 'ALL' | 'LAW' | 'STANDARD' | 'KRX';
  limit?: number;
}): Promise<string> {
  const { query, type_filter = 'ALL', limit = 20 } = args;

  try {
    let laws: any[] = [];
    let standards: any[] = [];
    let krxRegs: any[] = [];

    if (await isPostgresEnabled()) {
      const result = await pgSearchAllRegulations(query, type_filter as any, limit);
      laws = result.laws;
      standards = result.standards;
    } else {
      const database = db.getDatabase();
      const searchPattern = `%${query}%`;

      if (type_filter === 'ALL' || type_filter === 'LAW') {
        laws = database.prepare(`
          SELECT 'LAW' as type, law_mst_id as code, law_name as name,
                 law_type as category, enforcement_date as effective_date, ministry as org
          FROM Laws WHERE law_name LIKE ? LIMIT ?
        `).all(searchPattern, Math.floor(limit / 3)) as any[];
      }

      if (type_filter === 'ALL' || type_filter === 'STANDARD') {
        standards = database.prepare(`
          SELECT 'STANDARD' as type, kcsc_cd as code, standard_name as name,
                 doc_type || ' - ' || COALESCE(main_category, '') as category,
                 effective_date, dept as org
          FROM ConstructionStandards
          WHERE standard_name LIKE ? OR kcsc_cd LIKE ? OR main_category LIKE ? LIMIT ?
        `).all(searchPattern, searchPattern, searchPattern, Math.floor(limit / 3)) as any[];
      }

      // KRX 규정 검색 추가
      if (type_filter === 'ALL' || type_filter === 'KRX') {
        try {
          krxRegs = database.prepare(`
            SELECT 'KRX' as type, reg_id as code, reg_name as name,
                   reg_type || ' - ' || market as category,
                   NULL as effective_date, 'KRX 한국거래소' as org
            FROM KrxRegulations
            WHERE reg_name LIKE ? LIMIT ?
          `).all(searchPattern, Math.floor(limit / 3)) as any[];
        } catch {
          // KRX 테이블 없으면 무시
        }
      }
    }

    if (laws.length === 0 && standards.length === 0 && krxRegs.length === 0) {
      return JSON.stringify({
        status: 'NOT_FOUND',
        query,
        message: `"${query}" 관련 법령, 건설기준, 또는 거래소 규정을 찾을 수 없습니다.`,
      });
    }

    return JSON.stringify({
      status: 'FOUND',
      query,
      type_filter,
      summary: {
        total: laws.length + standards.length + krxRegs.length,
        laws: laws.length,
        standards: standards.length,
        krx_regulations: krxRegs.length,
      },
      laws: laws.map(l => ({
        code: l.code,
        name: l.name,
        category: l.category,
        effective_date: l.effective_date,
        link: getLawGoKrLink(l.name),
      })),
      standards: standards.map(s => ({
        code: s.code,
        name: s.name,
        category: s.category,
        effective_date: s.effective_date,
        link: `https://kcsc.re.kr/standardCode/view?kcscCd=${encodeURIComponent(s.code)}`,
      })),
      krx_regulations: krxRegs.map(k => ({
        code: k.code,
        name: k.name,
        category: k.category,
        link: `https://law.krx.co.kr/las/lawFullText.do?lawId=${k.code}`,
      })),
      note: '📌 법령은 law.go.kr, 건설기준은 kcsc.re.kr, KRX 규정은 law.krx.co.kr에서 원문 확인 가능합니다.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      message: '통합 검색 중 오류가 발생했습니다.',
    });
  }
}

// ============================================
// 🆕 법조문 가독성 향상 핸들러 (스퀴즈 기능)
// ============================================

async function handleSimplifyStatute(args: {
  law_name?: string;
  article_number?: string;
  text?: string;
  mode?: 'original' | 'simplified' | 'highlighted' | 'all';
  keep_references?: boolean;
  keep_definitions?: boolean;
}): Promise<string> {
  const {
    law_name,
    article_number,
    text,
    mode = 'all',
    keep_references = false,
    keep_definitions = false
  } = args;

  try {
    let articleContent: string;
    let lawInfo: { law_name: string; article_number?: string; source: string } | null = null;

    // 텍스트 직접 입력인 경우
    if (text) {
      articleContent = text;
      lawInfo = { law_name: '직접 입력', source: 'user_input' };
    } else if (law_name) {
      // 법령에서 조문 조회
      const database = db.getDatabase();

      // 법령 찾기
      const law = database.prepare(`
        SELECT law_mst_id, law_name FROM Laws
        WHERE law_name LIKE ? LIMIT 1
      `).get(`%${law_name}%`) as { law_mst_id: string; law_name: string } | undefined;

      if (!law) {
        return JSON.stringify({
          status: 'NOT_FOUND',
          message: `"${law_name}" 법령을 찾을 수 없습니다.`,
          suggestion: '법령명을 정확히 입력하거나, text 파라미터로 직접 텍스트를 입력해주세요.',
        });
      }

      lawInfo = { law_name: law.law_name, source: 'database' };

      if (article_number) {
        // 조문 번호 정규화
        const normalizedArticleNo = article_number.replace(/^제/, '').replace(/조.*$/, '');

        // 조문 찾기
        const article = database.prepare(`
          SELECT article_no, article_title, article_content FROM Articles
          WHERE law_mst_id = ? AND (
            article_no = ? OR article_no = ? OR article_no LIKE ?
          ) LIMIT 1
        `).get(law.law_mst_id, article_number, `제${normalizedArticleNo}조`, `%${normalizedArticleNo}%`) as {
          article_no: string;
          article_title: string;
          article_content: string;
        } | undefined;

        if (!article) {
          return JSON.stringify({
            status: 'NOT_FOUND',
            law_name: law.law_name,
            message: `"${article_number}" 조문을 찾을 수 없습니다.`,
          });
        }

        articleContent = article.article_content;
        lawInfo.article_number = article.article_no;
      } else {
        // 조문 번호 없이 제1조(목적) 또는 제2조(정의) 조회
        const article = database.prepare(`
          SELECT article_no, article_title, article_content FROM Articles
          WHERE law_mst_id = ? AND (article_no LIKE '%제1조%' OR article_no LIKE '%제2조%')
          ORDER BY article_no LIMIT 1
        `).get(law.law_mst_id) as {
          article_no: string;
          article_title: string;
          article_content: string;
        } | undefined;

        if (!article) {
          return JSON.stringify({
            status: 'NOT_FOUND',
            law_name: law.law_name,
            message: '조문을 찾을 수 없습니다. article_number 파라미터를 지정해주세요.',
          });
        }

        articleContent = article.article_content;
        lawInfo.article_number = article.article_no;
      }
    } else {
      return JSON.stringify({
        status: 'ERROR',
        message: 'law_name 또는 text 파라미터가 필요합니다.',
        usage: {
          option1: '{ "law_name": "근로기준법", "article_number": "제23조" }',
          option2: '{ "text": "괄호가 포함된 법조문 텍스트" }',
        },
      });
    }

    // 괄호 파싱 및 간소화
    const simplifyResult = simplifyText(articleContent, {
      keepReferences: keep_references,
      keepDefinitions: keep_definitions,
    });

    // 괄호 통계
    const stats = getBracketStats(simplifyResult.brackets);

    // 참조 조문 추출
    const referencedArticles = extractReferencedArticles(simplifyResult.brackets);

    // 결과 구성
    const result: any = {
      status: 'SUCCESS',
      law_info: lawInfo,
      disclaimer: '⚠️ 괄호 안의 내용도 법적 효력이 있습니다. 간소화된 버전은 이해를 돕기 위한 보조 자료이며, 법률 자문을 대체하지 않습니다.',
    };

    // 모드에 따른 출력
    if (mode === 'all' || mode === 'original') {
      result.original = simplifyResult.original;
    }
    if (mode === 'all' || mode === 'simplified') {
      result.simplified = simplifyResult.simplified;
    }
    if (mode === 'all' || mode === 'highlighted') {
      result.highlighted = simplifyResult.highlighted;
    }

    // 통계 정보
    result.analysis = {
      compression_rate: `${simplifyResult.compressionRate}%`,
      removed_chars: simplifyResult.removedChars,
      bracket_count: simplifyResult.brackets.length,
      bracket_types: stats,
      referenced_articles: referencedArticles,
    };

    // 링크
    if (lawInfo?.law_name && lawInfo.law_name !== '직접 입력') {
      result.source_link = getLawGoKrLink(lawInfo.law_name, lawInfo.article_number);
    }

    // CSS (프론트엔드용)
    if (mode === 'highlighted' || mode === 'all') {
      result.css = BRACKET_HIGHLIGHT_CSS;
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify({
      status: 'ERROR',
      error: String(error),
      message: '법조문 간소화 중 오류가 발생했습니다.',
    });
  }
}

// ============================================
// MCP Server 초기화
// ============================================

export async function startMcpServer(): Promise<void> {
  // 🆕 하이브리드 도구 동적 로드
  const hybridModule = await loadHybridTools();
  HYBRID_TOOLS = hybridModule.HYBRID_TOOLS;
  HYBRID_TOOL_HANDLERS = hybridModule.HYBRID_TOOL_HANDLERS;
  HYBRID_TOOL_NAMES = hybridModule.HYBRID_TOOL_NAMES;

  console.error(`📦 Hybrid tools loaded: ${HYBRID_TOOL_NAMES.length} tools`);

  // 🆕 @markdown-media/core 네이티브 도구 동적 로드
  const nativeModule = await loadNativeTools();
  NATIVE_TOOLS = nativeModule.NATIVE_TOOLS;
  NATIVE_TOOL_HANDLERS = nativeModule.NATIVE_TOOL_HANDLERS;
  NATIVE_TOOL_NAMES = nativeModule.NATIVE_TOOL_NAMES;
  console.error(`📦 Native tools loaded: ${NATIVE_TOOL_NAMES.length} tools`);

  // 🆕 별표/서식 도구 동적 로드
  const annexModule = await loadAnnexTools();
  ANNEX_TOOLS = annexModule.ANNEX_TOOLS;
  ANNEX_TOOL_HANDLERS = annexModule.ANNEX_TOOL_HANDLERS;
  ANNEX_TOOL_NAMES = annexModule.ANNEX_TOOL_NAMES;
  console.error(`📦 Annex tools loaded: ${ANNEX_TOOL_NAMES.length} tools`);

  // 🆕 체인 도구 동적 로드
  const chainModule = await loadChainTools();
  CHAIN_TOOLS = chainModule.CHAIN_TOOLS;
  CHAIN_TOOL_HANDLERS = chainModule.CHAIN_TOOL_HANDLERS;
  CHAIN_TOOL_NAMES = chainModule.CHAIN_TOOL_NAMES;
  console.error(`📦 Chain tools loaded: ${CHAIN_TOOL_NAMES.length} tools`);

  // 🆕 심판/결정 도구 동적 로드
  const adjudicationModule = await loadAdjudicationTools();
  ADJUDICATION_TOOLS = adjudicationModule.ADJUDICATION_TOOLS;
  ADJUDICATION_TOOL_HANDLERS = adjudicationModule.ADJUDICATION_TOOL_HANDLERS;
  ADJUDICATION_TOOL_NAMES = adjudicationModule.ADJUDICATION_TOOL_NAMES;
  console.error(`📦 Adjudication tools loaded: ${ADJUDICATION_TOOL_NAMES.length} tools`);

  // 🆕 조약/자치법규/노동부 해석례 도구 동적 로드
  const treatyModule = await loadTreatyTools();
  TREATY_TOOLS = treatyModule.TREATY_TOOLS;
  TREATY_TOOL_HANDLERS = treatyModule.TREATY_TOOL_HANDLERS;
  TREATY_TOOL_NAMES = treatyModule.TREATY_TOOL_NAMES;
  console.error(`📦 Treaty tools loaded: ${TREATY_TOOL_NAMES.length} tools`);

  // Build unified dispatch function covering ALL tool handlers
  const builtinHandlers: Record<string, (args: any) => Promise<string>> = {
    audit_statute: handleAuditStatute,
    check_enforcement_date: handleCheckEnforcementDate,
    verify_case_exists: handleVerifyCaseExists,
    get_daily_diff: handleGetDailyDiff,
    audit_contract_timeline: handleAuditContractTimeline,
    check_legal_definition: handleCheckLegalDefinition,
    get_related_laws: handleGetRelatedLaws,
    check_law_hierarchy: handleCheckLawHierarchy,
    search_admin_rules: handleSearchAdminRules,
    query_business_size_requirements: handleQueryBusinessSizeRequirements,
    check_legal_citation: handleCheckLegalCitation,
    validate_references: handleValidateReferences,
    review_compliance: handleReviewCompliance,
    search_legal_landscape: handleSearchLegalLandscape,
    search_committee_decisions: handleSearchCommitteeDecisions,
    search_ministry_interpretations: handleSearchMinistryInterpretations,
    search_english_law: handleSearchEnglishLaw,
    search_tribunal_decisions: handleSearchTribunalDecisions,
    search_compliance_all: handleSearchComplianceAll,
    get_committee_decision_detail: handleGetCommitteeDecisionDetail,
    get_ministry_interpretation_detail: handleGetMinistryInterpretationDetail,
    get_tribunal_decision_detail: handleGetTribunalDecisionDetail,
    get_extended_tribunal_decision_detail: handleGetExtendedTribunalDecisionDetail,
    get_extended_ministry_interpretation_detail: handleGetExtendedMinistryInterpretationDetail,
    search_precedent_statistics: handleSearchPrecedentStatistics,
    search_precedent_law_links: handleSearchPrecedentLawLinks,
    search_statute_law_impact: handleSearchStatuteLawImpact,
    search_construction_standards: handleSearchConstructionStandards,
    get_standard_details: handleGetStandardDetails,
    get_standard_revisions: handleGetStandardRevisions,
    search_all_regulations: handleSearchAllRegulations,
    search_krx_regulations: handleSearchKrxRegulations,
    get_krx_regulation_detail: handleGetKrxRegulationDetail,
    simplify_statute: handleSimplifyStatute,
  };

  // Initialize chain tools with unified dispatch function
  chainModule.initChainTools(async (toolName: string, args: Record<string, any>) => {
    if (builtinHandlers[toolName]) {
      return await builtinHandlers[toolName](args);
    }
    if (ANNEX_TOOL_NAMES.includes(toolName)) {
      return await (ANNEX_TOOL_HANDLERS[toolName] as (args: any) => Promise<string>)(args);
    }
    if (NATIVE_TOOL_NAMES.includes(toolName)) {
      return await (NATIVE_TOOL_HANDLERS[toolName] as (args: any) => Promise<string>)(args);
    }
    if (HYBRID_TOOL_NAMES.includes(toolName)) {
      return await (HYBRID_TOOL_HANDLERS[toolName] as (args: any) => Promise<string>)(args);
    }
    if (TREATY_TOOL_NAMES.includes(toolName)) {
      return await (TREATY_TOOL_HANDLERS[toolName] as (args: any) => Promise<string>)(args);
    }
    throw new Error(`Chain executor: unknown tool "${toolName}"`);
  });

  const server = new Server(
    {
      name: 'korea-law',
      version: '1.1.0',
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
      },
    }
  );

  // Tools 목록 제공 (기본 도구 + 하이브리드 도구)
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...TOOLS, ...HYBRID_TOOLS, ...NATIVE_TOOLS, ...ANNEX_TOOLS, ...CHAIN_TOOLS, ...ADJUDICATION_TOOLS, ...TREATY_TOOLS],
  }));

  // Prompts 목록 제공
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS,
  }));

  // Prompt 상세 내용 제공
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;

    switch (name) {
      case 'legal-auditor':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: LEGAL_AUDITOR_PROMPT,
              },
            },
          ],
        };
      case 'legal-reasoning':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: LEGAL_REASONING_PROMPT,
              },
            },
          ],
        };
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });

  // Tool 실행
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case 'audit_statute':
          result = await handleAuditStatute(args as any);
          break;
        case 'check_enforcement_date':
          result = await handleCheckEnforcementDate(args as any);
          break;
        case 'verify_case_exists':
          result = await handleVerifyCaseExists(args as any);
          break;
        case 'get_daily_diff':
          result = await handleGetDailyDiff(args as any);
          break;
        case 'audit_contract_timeline':
          result = await handleAuditContractTimeline(args as any);
          break;
        case 'check_legal_definition':
          result = await handleCheckLegalDefinition(args as any);
          break;
        case 'get_related_laws':
          result = await handleGetRelatedLaws(args as any);
          break;
        case 'check_law_hierarchy':
          result = await handleCheckLawHierarchy(args as any);
          break;
        case 'search_admin_rules':
          result = await handleSearchAdminRules(args as any);
          break;

        // 🆕 사업장 규모별 의무사항
        case 'query_business_size_requirements':
          result = await handleQueryBusinessSizeRequirements(args as any);
          break;

        // 🆕 새로운 검증 도구 (v2)
        case 'check_legal_citation':
          result = await handleCheckLegalCitation(args as any);
          break;
        case 'validate_references':
          result = await handleValidateReferences(args as any);
          break;
        case 'review_compliance':
          result = await handleReviewCompliance(args as any);
          break;
        case 'search_legal_landscape':
          result = await handleSearchLegalLandscape(args as any);
          break;
        
        // 🆕 확장 도구 (위원회/부처/영문법령)
        case 'search_committee_decisions':
          result = await handleSearchCommitteeDecisions(args as any);
          break;
        case 'search_ministry_interpretations':
          result = await handleSearchMinistryInterpretations(args as any);
          break;
        case 'search_english_law':
          result = await handleSearchEnglishLaw(args as any);
          break;
        case 'search_tribunal_decisions':
          result = await handleSearchTribunalDecisions(args as any);
          break;
        case 'search_compliance_all':
          result = await handleSearchComplianceAll(args as any);
          break;

        // 🆕 위원회/부처/심판 상세 조회
        case 'get_committee_decision_detail':
          result = await handleGetCommitteeDecisionDetail(args as any);
          break;
        case 'get_ministry_interpretation_detail':
          result = await handleGetMinistryInterpretationDetail(args as any);
          break;
        case 'get_tribunal_decision_detail':
          result = await handleGetTribunalDecisionDetail(args as any);
          break;
        case 'get_extended_tribunal_decision_detail':
          result = await handleGetExtendedTribunalDecisionDetail(args as any);
          break;
        case 'get_extended_ministry_interpretation_detail':
          result = await handleGetExtendedMinistryInterpretationDetail(args as any);
          break;

        // 🆕 선택 구현: 판례 통계 & 법령 영향도 (Optional Knowledge Base)
        case 'search_precedent_statistics':
          result = await handleSearchPrecedentStatistics(args as any);
          break;
        case 'search_precedent_law_links':
          result = await handleSearchPrecedentLawLinks(args as any);
          break;
        case 'search_statute_law_impact':
          result = await handleSearchStatuteLawImpact(args as any);
          break;

        // 🆕 국가건설기준 (KDS/KCS) 검색 도구
        case 'search_construction_standards':
          result = await handleSearchConstructionStandards(args as any);
          break;
        case 'get_standard_details':
          result = await handleGetStandardDetails(args as any);
          break;
        case 'get_standard_revisions':
          result = await handleGetStandardRevisions(args as any);
          break;
        case 'search_all_regulations':
          result = await handleSearchAllRegulations(args as any);
          break;

        // 🆕 법조문 가독성 향상 도구 (스퀴즈 기능)
        case 'simplify_statute':
          result = await handleSimplifyStatute(args as any);
          break;

        // 🆕 네이티브 도구 + 하이브리드 엔진 도구 (RAG + CAG)
        default:
          // 조약/자치법규/노동부 해석례 도구 핸들러 확인
          if (TREATY_TOOL_NAMES.includes(name)) {
            result = await TREATY_TOOL_HANDLERS[name](args as any);
            break;
          }
          // 심판/결정 도구 핸들러 확인 (adjudication-tools)
          if (ADJUDICATION_TOOL_NAMES.includes(name)) {
            result = await ADJUDICATION_TOOL_HANDLERS[name](args as any);
            break;
          }
          // 체인 도구 핸들러 확인 (chain-tools)
          if (CHAIN_TOOL_NAMES.includes(name)) {
            result = await CHAIN_TOOL_HANDLERS[name](args as any);
            break;
          }
          // 별표/서식 도구 핸들러 확인 (annex-tools)
          if (ANNEX_TOOL_NAMES.includes(name)) {
            result = await ANNEX_TOOL_HANDLERS[name](args as any);
            break;
          }
          // 네이티브 도구 핸들러 확인 (@markdown-media/core)
          if (NATIVE_TOOL_NAMES.includes(name)) {
            result = await NATIVE_TOOL_HANDLERS[name](args as any);
            break;
          }
          // 하이브리드 도구 핸들러 확인
          if (HYBRID_TOOL_NAMES.includes(name)) {
            result = await HYBRID_TOOL_HANDLERS[name](args as any);
            break;
          }
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [{ type: 'text', text: result }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error}` }],
        isError: true,
      };
    }
  });

  // 서버 시작
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('🏛️ korea-law MCP Server started');
  console.error('⚠️  주의: 이 서버는 AI 검증용입니다. 법적 판단의 최종 근거로 사용하지 마세요.');

  // MCP 서버는 indefinitely 실행되어야 함 - signal handler 등록
  process.on('SIGINT', () => {
    console.error('🛑 SIGINT received, gracefully shutting down...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error('🛑 SIGTERM received, gracefully shutting down...');
    process.exit(0);
  });

  // 에러 핸들링
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
  });

  // 프로세스를 계속 유지하기 위해 setInterval 사용 (이벤트 루프 활성화)
  setInterval(() => {
    // This interval keeps the event loop alive indefinitely
  }, 30000);
}

