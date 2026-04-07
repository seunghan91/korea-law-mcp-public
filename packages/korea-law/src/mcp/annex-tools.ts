/**
 * korea-law: get_annexes MCP 도구
 *
 * 법령 별표/서식을 법령명으로 검색하고 HWPX/HWP 파일을
 * 자동 다운로드하여 Markdown 테이블로 변환하는 end-to-end 파이프라인
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  downloadAndParseAnnex,
  searchAnnexes,
  findAnnexByNumber,
} from '../utils/annex-downloader';

// ============================================
// 도구 정의
// ============================================

const getAnnexesTool: Tool = {
  name: 'get_annexes',
  description: `[별표/서식 조회+변환] 법령의 별표·서식을 검색하고 HWPX/HWP 파일을 Markdown으로 변환합니다.

📌 핵심 기능:
- 법령명으로 별표/서식 목록 조회
- 특정 별표 선택 시 파일 자동 다운로드 + Markdown 테이블 변환
- 별표(knd=1), 서식(knd=2), 전체(knd=5) 필터링

사용 예시:
- 목록 조회: get_annexes({ law_name: "소득세법" })
- 특정 별표: get_annexes({ law_name: "소득세법", annex_no: "1" })
- 서식 조회: get_annexes({ law_name: "소득세법", knd: "2" })`,
  inputSchema: {
    type: 'object',
    properties: {
      law_name: {
        type: 'string',
        description: '법령명 (예: "소득세법", "관세법 시행규칙")',
      },
      annex_no: {
        type: 'string',
        description: '별표 번호 (예: "1", "4"). 지정 시 해당 별표 다운로드+파싱',
      },
      knd: {
        type: 'string',
        enum: ['1', '2', '3', '4', '5'],
        description: '1=별표, 2=서식, 3=부칙별표, 4=부칙서식, 5=전체',
      },
    },
    required: ['law_name'],
  },
};

// ============================================
// 핸들러
// ============================================

async function handleGetAnnexes(args: {
  law_name: string;
  annex_no?: string;
  knd?: string;
}): Promise<string> {
  try {
    // Step 1: Search for annexes by law name
    const items = await searchAnnexes(args.law_name, args.knd);

    // No annex_no: return list of annexes
    if (!args.annex_no) {
      if (items.length === 0) {
        return JSON.stringify({
          message: `"${args.law_name}"에 대한 별표/서식을 찾을 수 없습니다.`,
          total: 0,
          items: [],
        });
      }

      const summary = items.map((item) => ({
        별표명: item['별표명'] || '',
        별표종류: item['별표종류'] || '',
        별표번호: item['별표번호'] || '',
        소관부처: item['소관부처'] || '',
      }));

      return JSON.stringify({
        message: `"${args.law_name}" 별표/서식 목록 (${items.length}건)`,
        total: items.length,
        items: summary,
      });
    }

    // Step 2: Find specific annex by number
    const found = findAnnexByNumber(items, args.annex_no);

    if (!found) {
      return JSON.stringify({
        error: `별표 ${args.annex_no}을(를) 찾을 수 없습니다. 전체 목록을 확인하세요.`,
        total: items.length,
        available: items.map((i) => i['별표명']).filter(Boolean),
      });
    }

    // Step 3: Get file link
    const fileLink = found['별표서식파일링크'] || found['별표파일링크'];

    if (!fileLink) {
      // Fallback: check PDF link
      const pdfLink = found['별표서식PDF파일링크'];
      if (pdfLink) {
        const pdfUrl = pdfLink.startsWith('http') ? pdfLink : `https://www.law.go.kr${pdfLink}`;
        return JSON.stringify({
          message: `별표 ${args.annex_no}은(는) PDF 형식만 제공됩니다.`,
          title: found['별표명'],
          pdf_url: pdfUrl,
        });
      }

      return JSON.stringify({
        error: `별표 ${args.annex_no}의 파일 링크를 찾을 수 없습니다.`,
        title: found['별표명'],
      });
    }

    // Step 4: Download and parse
    const parsed = await downloadAndParseAnnex(fileLink);

    if (parsed.length === 0) {
      return JSON.stringify({
        message: `별표 ${args.annex_no} 파일을 다운로드했으나 파싱 결과가 없습니다.`,
        title: found['별표명'],
      });
    }

    // Step 5: Format response with annexType differentiation (ANNEX-02)
    const sections = parsed.map((item) => {
      const typeLabel = item.annexType === 'form' ? '서식 (Form)' : '별표 (Table)';
      const heading = item.number > 0
        ? `## [${item.annexType === 'form' ? '서식' : '별표'} ${item.number}] ${item.title}`
        : `## ${item.title}`;

      return `${heading}\n**유형:** ${typeLabel}\n\n${item.markdown}`;
    });

    return sections.join('\n\n---\n\n');
  } catch (e) {
    return JSON.stringify({
      error: `별표/서식 조회 실패: ${(e as Error).message}`,
    });
  }
}

// ============================================
// 내보내기
// ============================================

export const ANNEX_TOOLS: Tool[] = [getAnnexesTool];

export const ANNEX_TOOL_HANDLERS: Record<string, (args: any) => Promise<string>> = {
  get_annexes: handleGetAnnexes,
};

export const ANNEX_TOOL_NAMES = Object.keys(ANNEX_TOOL_HANDLERS);
