/**
 * korea-law: @markdown-media/core 네이티브 도구
 *
 * napi-rs 기반 Rust 네이티브 바이너리를 직접 호출하여
 * 별표 파싱, 날짜 파싱, 체인 계획 생성 MCP 도구를 제공합니다.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  parseAnnexText,
  parseAnnexHwp,
  parseAnnexHwpx,
  parseDate,
  parseDateWithReference,
  createChainPlan,
  aggregateChainResults,
} from '@markdown-media/core';

// ============================================
// 도구 정의
// ============================================

export const NATIVE_TOOLS: Tool[] = [
  {
    name: 'parse_annex',
    description: `[별표/별지 파싱] 법령 별표(별지) 텍스트를 구조화된 AnnexInfo 배열로 파싱합니다.

📌 핵심 기능:
- 텍스트, HWP, HWPX 형식 입력 지원
- 별표 유형, 번호, 제목, 원문, 마크다운 변환 결과 제공
- 법령 별표의 표 구조를 마크다운 테이블로 변환

⚠️ 사용 사례:
- 법령 별표 내용 추출 및 구조화
- HWP/HWPX 법령 문서에서 별표 자동 파싱
- AI 검증을 위한 별표 데이터 정규화

사용 예시:
- 텍스트: parse_annex({ text: "[별표 1] 과태료 부과기준...", format: "text" })
- HWP: parse_annex({ file_path: "/path/to/annex.hwp", format: "hwp" })
- HWPX: parse_annex({ file_path: "/path/to/annex.hwpx", format: "hwpx" })`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '별표 텍스트 (텍스트 직접 입력 시 사용)',
        },
        file_path: {
          type: 'string',
          description: 'HWP/HWPX 파일 경로 (파일 입력 시 사용)',
        },
        format: {
          type: 'string',
          enum: ['text', 'hwp', 'hwpx'],
          description: '입력 형식 (기본: text)',
        },
      },
    },
  },
  {
    name: 'parse_date',
    description: `[날짜 파싱] 한국어 날짜 표현을 YYYYMMDD 형식으로 파싱합니다.

📌 핵심 기능:
- 한국어 날짜 표현 인식 (예: "2024년 3월 1일", "시행일부터 6개월")
- 기간 표현 파싱 (시작일~종료일)
- 기준일 기반 상대 날짜 해석 ("작년", "지난달", "3개월 후")
- 파싱 신뢰도(confidence) 점수 제공

⚠️ 사용 사례:
- 법령 시행일/폐지일 추출
- 경과 조치 기간 계산
- 부칙 날짜 표현 파싱

사용 예시:
- 기본: parse_date({ text: "2024년 3월 1일부터 시행" })
- 기준일: parse_date({ text: "공포 후 6개월이 경과한 날", reference_date: "2024-01-15" })`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '날짜를 포함한 텍스트 (예: "2024년 3월 1일부터 시행")',
        },
        reference_date: {
          type: 'string',
          description: '(선택) 기준일 (YYYY-MM-DD 형식, 상대 날짜 해석용)',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'create_chain_plan',
    description: `[체인 계획 생성] 법률 리서치 체인 실행 계획을 생성합니다.

📌 핵심 기능:
- 질의에 맞는 다단계 MCP 도구 호출 계획 자동 생성
- 도구 간 의존관계 분석 및 병렬 실행 그룹 최적화
- 체인 유형별 최적 실행 전략 제공

⚠️ 지원 체인 유형:
- full_research: 종합 법률 리서치 (법령 + 판례 + 해석례)
- statute_verify: 법령 인용 검증 (조문 존재 여부 + 최신성)
- precedent_search: 판례 검색 및 분석

사용 예시:
- create_chain_plan({ chain_type: "full_research", query: "개인정보보호법 위반 과태료 기준" })
- create_chain_plan({ chain_type: "statute_verify", query: "민법 제750조" })`,
    inputSchema: {
      type: 'object',
      properties: {
        chain_type: {
          type: 'string',
          description: '체인 유형 (예: "full_research", "statute_verify", "precedent_search")',
        },
        query: {
          type: 'string',
          description: '사용자 질의',
        },
      },
      required: ['chain_type', 'query'],
    },
  },
  {
    name: 'aggregate_chain_results',
    description: `[체인 결과 합산] 체인 실행 결과를 하나의 종합 응답으로 합산합니다.

📌 핵심 기능:
- 여러 도구 호출 결과를 체인 유형에 맞게 통합
- 중복 제거 및 관련성 순서 정렬
- 종합 분석 요약 생성

⚠️ 사용 사례:
- create_chain_plan으로 생성한 계획의 실행 결과 취합
- 다중 법령/판례 검색 결과 종합

사용 예시:
- aggregate_chain_results({ chain_type: "full_research", results: ["법령검색결과...", "판례검색결과...", "해석례결과..."] })`,
    inputSchema: {
      type: 'object',
      properties: {
        chain_type: {
          type: 'string',
          description: '체인 유형',
        },
        results: {
          type: 'array',
          items: { type: 'string' },
          description: '각 체인 단계의 실행 결과 배열',
        },
      },
      required: ['chain_type', 'results'],
    },
  },
];

// ============================================
// 핸들러 함수
// ============================================

async function handleParseAnnex(args: any): Promise<string> {
  try {
    const format = args.format || 'text';

    if (format === 'hwp') {
      if (!args.file_path) {
        return JSON.stringify({ error: 'file_path는 HWP 형식에서 필수입니다.' });
      }
      const result = parseAnnexHwp(args.file_path);
      return JSON.stringify(result);
    }

    if (format === 'hwpx') {
      if (!args.file_path) {
        return JSON.stringify({ error: 'file_path는 HWPX 형식에서 필수입니다.' });
      }
      const result = parseAnnexHwpx(args.file_path);
      return JSON.stringify(result);
    }

    // Default: text
    if (!args.text) {
      return JSON.stringify({ error: 'text는 텍스트 형식에서 필수입니다.' });
    }
    const result = parseAnnexText(args.text);
    return JSON.stringify(result);
  } catch (e) {
    return JSON.stringify({ error: `별표 파싱 실패: ${(e as Error).message}` });
  }
}

async function handleParseDate(args: any): Promise<string> {
  try {
    if (args.reference_date) {
      const result = parseDateWithReference(args.text, args.reference_date);
      return JSON.stringify(result);
    }
    const result = parseDate(args.text);
    return JSON.stringify(result);
  } catch (e) {
    return JSON.stringify({ error: `날짜 파싱 실패: ${(e as Error).message}` });
  }
}

async function handleCreateChainPlan(args: any): Promise<string> {
  try {
    const result = createChainPlan(args.chain_type, args.query);
    return JSON.stringify(result);
  } catch (e) {
    return JSON.stringify({ error: `체인 계획 생성 실패: ${(e as Error).message}` });
  }
}

async function handleAggregateChainResults(args: any): Promise<string> {
  try {
    const result = aggregateChainResults(args.chain_type, args.results);
    return JSON.stringify({ result });
  } catch (e) {
    return JSON.stringify({ error: `체인 결과 합산 실패: ${(e as Error).message}` });
  }
}

// ============================================
// 내보내기
// ============================================

export const NATIVE_TOOL_HANDLERS: Record<string, (args: any) => Promise<string>> = {
  parse_annex: handleParseAnnex,
  parse_date: handleParseDate,
  create_chain_plan: handleCreateChainPlan,
  aggregate_chain_results: handleAggregateChainResults,
};

export const NATIVE_TOOL_NAMES = Object.keys(NATIVE_TOOL_HANDLERS);
