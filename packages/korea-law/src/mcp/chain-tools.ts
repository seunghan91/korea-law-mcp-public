/**
 * korea-law: 8개 체인 MCP 도구
 *
 * 다단계 법률 리서치 워크플로우를 제공하는 체인 도구.
 * createChainPlan(Rust) → executeChainPlan(Node.js) → aggregateChainResults(Rust) 파이프라인.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createChainPlan, aggregateChainResults } from '@markdown-media/core';
import { executeChainPlan, ToolDispatchFn } from './chain-executor';

// ============================================
// Dispatch function (set by server.ts at init)
// ============================================

let toolDispatch: ToolDispatchFn | null = null;

export function initChainTools(dispatch: ToolDispatchFn): void {
  toolDispatch = dispatch;
}

// ============================================
// Chain type mapping
// ============================================

const CHAIN_TYPE_MAP: Record<string, string> = {
  chain_full_research: 'FullResearch',
  chain_action_basis: 'ActionBasis',
  chain_compare_old_new: 'CompareOldNew',
  chain_search_with_interpretation: 'SearchWithInterpretation',
  chain_extract_annexes: 'ExtractAnnexes',
  chain_compare_delegation: 'CompareDelegation',
  chain_find_similar_precedents: 'FindSimilarPrecedents',
  chain_research_specialized: 'ResearchSpecialized',
};

// ============================================
// Handler factory
// ============================================

function createChainHandler(chainType: string) {
  return async (args: { query: string }): Promise<string> => {
    if (!toolDispatch) {
      return JSON.stringify({ error: 'Chain tools not initialized. Call initChainTools first.' });
    }
    try {
      const plan = createChainPlan(chainType, args.query);
      const execution = await executeChainPlan(plan, toolDispatch);

      // Build results array for aggregation (use error placeholder for failed steps)
      const resultsForAggregation = execution.steps.map((s) =>
        s.success ? s.result : `[Error in ${s.toolName}: ${s.error}]`,
      );

      const aggregated = aggregateChainResults(chainType, resultsForAggregation);

      // Append execution metadata
      const metadata = `\n\n---\n**Chain Execution:** ${execution.successCount}/${execution.totalSteps} steps succeeded (${execution.failureCount} failed)`;

      return aggregated + metadata;
    } catch (e) {
      return JSON.stringify({ error: `체인 실행 실패: ${(e as Error).message}` });
    }
  };
}

// ============================================
// 도구 정의 (8개)
// ============================================

export const CHAIN_TOOLS: Tool[] = [
  {
    name: 'chain_full_research',
    description: `[체인: 종합 리서치] 법령+판례+해석례를 조합한 종합 법률 리서치를 자동 실행합니다.

📌 핵심 기능:
- 법령 검색 → 판례 검색 → 해석례 조회를 자동 연결
- 각 단계 결과를 종합하여 마크다운 리포트 생성
- 개별 단계 실패 시 부분 결과 반환

사용 예시: chain_full_research({ query: "개인정보보호법 위반 과태료 기준" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '법률 질의 (예: "개인정보보호법 위반 과태료 기준")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'chain_action_basis',
    description: `[체인: 행정처분 근거] 행정처분의 법적 근거를 분석합니다.

📌 핵심 기능:
- 행정처분 관련 법령 조항 검색
- 처분 기준표 (별표) 연결
- 관련 판례/해석례 종합

사용 예시: chain_action_basis({ query: "음식점 영업정지 처분 근거" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '행정처분 질의 (예: "음식점 영업정지 처분 근거")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'chain_compare_old_new',
    description: `[체인: 신구대비] 법령의 개정 전후 내용을 비교 분석합니다.

📌 핵심 기능:
- 현행 법령과 개정 이력 조회
- 변경된 조항 비교
- 개정 영향 분석

사용 예시: chain_compare_old_new({ query: "근로기준법 2024년 개정사항" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '법령 비교 질의 (예: "근로기준법 2024년 개정사항")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'chain_search_with_interpretation',
    description: `[체인: 법령+해석] 법령 검색과 유권해석을 통합 제공합니다.

📌 핵심 기능:
- 법령 조문 검색
- 관련 행정해석례, 법제처 해석 조회
- 법령과 해석을 통합한 실무 가이드

사용 예시: chain_search_with_interpretation({ query: "개인정보 제3자 제공 동의 기준" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '법령+해석 질의 (예: "개인정보 제3자 제공 동의 기준")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'chain_extract_annexes',
    description: `[체인: 별표 일괄추출] 법령의 별표/서식을 일괄 검색하고 추출합니다.

📌 핵심 기능:
- 법령명으로 모든 별표/서식 조회
- HWPX/HWP 파일 자동 다운로드 및 파싱
- 마크다운 테이블로 변환

사용 예시: chain_extract_annexes({ query: "소득세법 별표 전체" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '별표 추출 질의 (예: "소득세법 별표 전체")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'chain_compare_delegation',
    description: `[체인: 위임규정 비교] 법률-시행령-시행규칙 간 위임/위탁 규정을 비교 분석합니다.

📌 핵심 기능:
- 법률 위임 조항 검색
- 시행령/시행규칙 수임 조항 매칭
- 위임 범위 초과 여부 분석

사용 예시: chain_compare_delegation({ query: "개인정보보호법 시행령 위임 규정" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '위임규정 질의 (예: "개인정보보호법 시행령 위임 규정")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'chain_find_similar_precedents',
    description: `[체인: 유사판례] 특정 사안과 유사한 판례를 검색합니다.

📌 핵심 기능:
- 사안 분석 및 키워드 추출
- 유사 판례 검색 (대법원, 하급심)
- 판례 간 비교 분석

사용 예시: chain_find_similar_precedents({ query: "아파트 하자보수 손해배상 판례" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '유사판례 질의 (예: "아파트 하자보수 손해배상 판례")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'chain_research_specialized',
    description: `[체인: 특화 리서치] 특정 법률 분야에 특화된 종합 리서치를 수행합니다.

📌 핵심 기능:
- 분야별 전문 법령/판례/해석 검색
- 관련 행정규칙, 고시, 지침 포함
- 분야 맞춤 분석 리포트

사용 예시: chain_research_specialized({ query: "건설업 하도급 관련 법률 전체 조사" })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '특화 리서치 질의 (예: "건설업 하도급 관련 법률 전체 조사")' },
      },
      required: ['query'],
    },
  },
];

// ============================================
// 핸들러 레지스트리
// ============================================

export const CHAIN_TOOL_HANDLERS: Record<string, (args: any) => Promise<string>> = {
  chain_full_research: createChainHandler('FullResearch'),
  chain_action_basis: createChainHandler('ActionBasis'),
  chain_compare_old_new: createChainHandler('CompareOldNew'),
  chain_search_with_interpretation: createChainHandler('SearchWithInterpretation'),
  chain_extract_annexes: createChainHandler('ExtractAnnexes'),
  chain_compare_delegation: createChainHandler('CompareDelegation'),
  chain_find_similar_precedents: createChainHandler('FindSimilarPrecedents'),
  chain_research_specialized: createChainHandler('ResearchSpecialized'),
};

export const CHAIN_TOOL_NAMES = Object.keys(CHAIN_TOOL_HANDLERS);
