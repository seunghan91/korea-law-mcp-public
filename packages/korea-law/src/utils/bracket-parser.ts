/**
 * korea-law: Bracket Parser Utility
 *
 * 법조문 괄호 파싱 및 간소화 유틸리티
 * 스퀴즈(Squeeze) 크롬 확장 프로그램에서 영감을 받아 구현
 *
 * ⚠️ 중요: 괄호 안의 내용도 법적 효력이 있습니다.
 * 간소화 버전은 이해 보조용이며, 법률 자문을 대체하지 않습니다.
 *
 * @see https://www.law.go.kr - 국가법령정보센터 (원문 확인)
 */

// ============================================
// Types
// ============================================

/**
 * 괄호 유형
 * @description 법조문에서 사용되는 괄호의 기능적 분류
 */
export type BracketType =
  | 'definition'    // 정의 괄호: 용어 정의 (예: "청원인(법인인 경우에는 대표자)")
  | 'exception'     // 예외 괄호: 예외 상황 명시 (예: "다만, ~인 경우는 제외한다")
  | 'reference'     // 참조 괄호: 다른 조항 인용 (예: "제3조에 따른")
  | 'limit'         // 한정 괄호: 범위 한정 (예: "이 조에서 같다")
  | 'supplement'    // 보충 괄호: 보충 설명 (예: 한자, 영문 병기)
  | 'enumeration'   // 열거 괄호: 항목 열거
  | 'unknown';      // 분류 불가

/**
 * 괄호 정보
 */
export interface BracketInfo {
  /** 괄호 시작 위치 (원본 텍스트 기준) */
  start: number;
  /** 괄호 끝 위치 (원본 텍스트 기준) */
  end: number;
  /** 괄호 유형 */
  type: BracketType;
  /** 괄호 내용 (괄호 기호 제외) */
  content: string;
  /** 괄호 깊이 (0 = 최상위) */
  depth: number;
  /** 중첩된 하위 괄호들 */
  nested: BracketInfo[];
}

/**
 * 간소화 결과
 */
export interface SimplifyResult {
  /** 원본 텍스트 */
  original: string;
  /** 간소화된 텍스트 (괄호 제거) */
  simplified: string;
  /** 하이라이트용 HTML */
  highlighted: string;
  /** 파싱된 괄호 정보 */
  brackets: BracketInfo[];
  /** 제거된 문자 수 */
  removedChars: number;
  /** 압축률 (%) */
  compressionRate: number;
}

/**
 * 간소화 옵션
 */
export interface SimplifyOptions {
  /** 숨길 괄호 유형 (기본: 모든 유형) */
  hideTypes?: BracketType[];
  /** 최대 숨길 깊이 (기본: 무제한) */
  maxHideDepth?: number;
  /** 최소 내용 길이 (이 길이 이하는 유지) */
  minContentLength?: number;
  /** 참조 괄호 유지 여부 (기본: false) */
  keepReferences?: boolean;
  /** 정의 괄호 유지 여부 (기본: false) */
  keepDefinitions?: boolean;
}

// ============================================
// 괄호 유형 분류 패턴
// ============================================

const BRACKET_TYPE_PATTERNS: Array<{
  type: BracketType;
  patterns: RegExp[];
}> = [
  {
    type: 'definition',
    patterns: [
      /^이하\s*["']?[가-힣]+["']?(?:이)?라\s*한다/,
      /^이하\s*["']?[가-힣]+["']?(?:이)?라고?\s*한다/,
      /^이하\s*같다/,
      /^이 조에서 같다/,
      /^이 법에서 같다/,
      /^이하\s*["'][가-힣]+["']\s*(?:이)?라/,
      /인\s*경우에는/,
      /을\s*말한다/,
      /를\s*말한다/,
      /을\s*포함한다/,
      /를\s*포함한다/,
    ],
  },
  {
    type: 'exception',
    patterns: [
      /^다만/,
      /^단/,
      /는\s*제외한다/,
      /을\s*제외한다/,
      /를\s*제외한다/,
      /경우에는\s*그러하지\s*아니하다/,
      /예외로\s*한다/,
      /적용하지\s*아니한다/,
    ],
  },
  {
    type: 'reference',
    patterns: [
      /^제\d+조/,
      /^제\d+항/,
      /^별표\s*\d+/,
      /에\s*따른/,
      /에서\s*정하는/,
      /에서\s*정한/,
      /에\s*의한/,
      /법률\s*제\d+호/,
      /대통령령\s*제\d+호/,
    ],
  },
  {
    type: 'limit',
    patterns: [
      /이\s*조에서/,
      /이\s*항에서/,
      /이\s*법에서/,
      /이\s*장에서/,
      /이하에서/,
      /에\s*한정한다/,
      /에\s*한한다/,
      /만\s*적용한다/,
    ],
  },
  {
    type: 'supplement',
    patterns: [
      /^[A-Za-z\s]+$/, // 영문만
      /^[一-龥\s]+$/, // 한자만
      /^[가-힣]+\s*[一-龥]+$/, // 한글+한자
      /^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}/, // 날짜
      /^약칭:/,
    ],
  },
  {
    type: 'enumeration',
    patterns: [
      /^\d+\./,
      /^[가나다라마바사아자차카타파하]\./,
      /^①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩/,
      /및\s*\d+/,
      /부터\s*\d+까지/,
    ],
  },
];

// ============================================
// 괄호 파싱 함수
// ============================================

/**
 * 괄호 유형 판별
 */
function classifyBracketType(content: string): BracketType {
  const trimmedContent = content.trim();

  for (const { type, patterns } of BRACKET_TYPE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(trimmedContent)) {
        return type;
      }
    }
  }

  return 'unknown';
}

/**
 * 괄호 파싱 (중첩 지원)
 * @param text 원본 텍스트
 * @returns 파싱된 괄호 정보 배열
 */
export function parseBrackets(text: string): BracketInfo[] {
  const brackets: BracketInfo[] = [];
  const stack: Array<{ start: number; depth: number }> = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '(' || char === '（') {
      stack.push({ start: i, depth: stack.length });
    } else if ((char === ')' || char === '）') && stack.length > 0) {
      const openBracket = stack.pop()!;
      const content = text.slice(openBracket.start + 1, i);

      const bracketInfo: BracketInfo = {
        start: openBracket.start,
        end: i,
        type: classifyBracketType(content),
        content,
        depth: openBracket.depth,
        nested: [],
      };

      // 중첩 괄호 처리
      if (stack.length > 0) {
        // 상위 괄호가 있으면 nested에 추가
        // 나중에 처리됨
      }

      brackets.push(bracketInfo);
    }
  }

  // 중첩 관계 정리
  return organizeNestedBrackets(brackets);
}

/**
 * 중첩 괄호 관계 정리
 */
function organizeNestedBrackets(brackets: BracketInfo[]): BracketInfo[] {
  // 위치 기준으로 정렬 (시작 위치 오름차순, 같으면 끝 위치 내림차순)
  const sorted = [...brackets].sort((a, b) => {
    if (a.start === b.start) return b.end - a.end;
    return a.start - b.start;
  });

  const result: BracketInfo[] = [];
  const processed = new Set<number>();

  for (const bracket of sorted) {
    if (processed.has(bracket.start)) continue;

    // 이 괄호에 포함된 중첩 괄호 찾기
    const nested: BracketInfo[] = [];
    for (const other of sorted) {
      if (other.start > bracket.start && other.end < bracket.end) {
        nested.push(other);
        processed.add(other.start);
      }
    }

    bracket.nested = organizeNestedBrackets(nested);
    result.push(bracket);
    processed.add(bracket.start);
  }

  return result;
}

// ============================================
// 간소화 함수
// ============================================

/**
 * 법조문 간소화
 * @param text 원본 법조문 텍스트
 * @param options 간소화 옵션
 * @returns 간소화 결과
 */
export function simplifyText(
  text: string,
  options: SimplifyOptions = {}
): SimplifyResult {
  const {
    hideTypes = ['definition', 'exception', 'supplement', 'enumeration', 'limit', 'unknown'],
    maxHideDepth = Infinity,
    minContentLength = 3,
    keepReferences = false,
    keepDefinitions = false,
  } = options;

  const brackets = parseBrackets(text);

  // 숨길 괄호 위치 수집 (역순으로 처리하기 위해)
  const hideRanges: Array<{ start: number; end: number; bracket: BracketInfo }> = [];

  function collectHideRanges(bracketList: BracketInfo[], depth: number = 0) {
    for (const bracket of bracketList) {
      const shouldHide =
        depth <= maxHideDepth &&
        bracket.content.length >= minContentLength &&
        hideTypes.includes(bracket.type) &&
        !(keepReferences && bracket.type === 'reference') &&
        !(keepDefinitions && bracket.type === 'definition');

      if (shouldHide) {
        hideRanges.push({ start: bracket.start, end: bracket.end, bracket });
      }

      // 중첩 괄호도 처리
      if (bracket.nested.length > 0) {
        collectHideRanges(bracket.nested, depth + 1);
      }
    }
  }

  collectHideRanges(brackets);

  // 겹치는 범위 제거 (상위 괄호만 유지)
  const filteredRanges = hideRanges.filter((range, index) => {
    return !hideRanges.some((other, otherIndex) =>
      otherIndex !== index &&
      other.start < range.start &&
      other.end > range.end
    );
  });

  // 역순으로 정렬 (뒤에서부터 제거)
  filteredRanges.sort((a, b) => b.start - a.start);

  // 간소화된 텍스트 생성
  let simplified = text;
  let removedChars = 0;

  for (const range of filteredRanges) {
    const before = simplified.slice(0, range.start);
    const after = simplified.slice(range.end + 1);
    const removed = range.end - range.start + 1;
    simplified = before + after;
    removedChars += removed;
  }

  // 연속된 공백 정리
  simplified = simplified.replace(/\s{2,}/g, ' ').trim();

  // 하이라이트 HTML 생성
  const highlighted = generateHighlightedHtml(text, brackets);

  return {
    original: text,
    simplified,
    highlighted,
    brackets,
    removedChars,
    compressionRate: Math.round((removedChars / text.length) * 100),
  };
}

/**
 * 하이라이트 HTML 생성
 */
function generateHighlightedHtml(text: string, brackets: BracketInfo[]): string {
  // 괄호 위치를 평탄화
  const positions: Array<{
    pos: number;
    type: 'open' | 'close';
    bracketType: BracketType;
    depth: number;
  }> = [];

  function collectPositions(bracketList: BracketInfo[]) {
    for (const bracket of bracketList) {
      positions.push({
        pos: bracket.start,
        type: 'open',
        bracketType: bracket.type,
        depth: bracket.depth,
      });
      positions.push({
        pos: bracket.end,
        type: 'close',
        bracketType: bracket.type,
        depth: bracket.depth,
      });
      collectPositions(bracket.nested);
    }
  }

  collectPositions(brackets);
  positions.sort((a, b) => b.pos - a.pos);

  let result = text;

  for (const pos of positions) {
    if (pos.type === 'close') {
      result = result.slice(0, pos.pos + 1) + '</span>' + result.slice(pos.pos + 1);
    } else {
      const className = `bracket bracket-${pos.bracketType} bracket-depth-${pos.depth}`;
      result = result.slice(0, pos.pos) + `<span class="${className}" data-type="${pos.bracketType}">` + result.slice(pos.pos);
    }
  }

  return result;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 괄호 통계 생성
 */
export function getBracketStats(brackets: BracketInfo[]): Record<BracketType, number> {
  const stats: Record<BracketType, number> = {
    definition: 0,
    exception: 0,
    reference: 0,
    limit: 0,
    supplement: 0,
    enumeration: 0,
    unknown: 0,
  };

  function countBrackets(bracketList: BracketInfo[]) {
    for (const bracket of bracketList) {
      stats[bracket.type]++;
      countBrackets(bracket.nested);
    }
  }

  countBrackets(brackets);
  return stats;
}

/**
 * 특정 유형의 괄호만 추출
 */
export function filterBracketsByType(
  brackets: BracketInfo[],
  types: BracketType[]
): BracketInfo[] {
  const result: BracketInfo[] = [];

  function filter(bracketList: BracketInfo[]) {
    for (const bracket of bracketList) {
      if (types.includes(bracket.type)) {
        result.push(bracket);
      }
      filter(bracket.nested);
    }
  }

  filter(brackets);
  return result;
}

/**
 * 괄호 내용에서 참조 조문 추출
 */
export function extractReferencedArticles(brackets: BracketInfo[]): string[] {
  const references: Set<string> = new Set();
  const refPattern = /제(\d+)조(?:의(\d+))?(?:\s*제(\d+)항)?/g;

  function extract(bracketList: BracketInfo[]) {
    for (const bracket of bracketList) {
      if (bracket.type === 'reference') {
        let match;
        while ((match = refPattern.exec(bracket.content)) !== null) {
          let ref = `제${match[1]}조`;
          if (match[2]) ref += `의${match[2]}`;
          if (match[3]) ref += ` 제${match[3]}항`;
          references.add(ref);
        }
      }
      extract(bracket.nested);
    }
  }

  extract(brackets);
  return Array.from(references);
}

// ============================================
// CSS 스타일 (프론트엔드용)
// ============================================

export const BRACKET_HIGHLIGHT_CSS = `
/* 괄호 하이라이트 스타일 */
.bracket {
  border-radius: 3px;
  padding: 1px 2px;
  transition: opacity 0.2s ease, background-color 0.2s ease;
}

.bracket-definition {
  background-color: rgba(59, 130, 246, 0.15); /* blue */
  border-bottom: 1px dashed #3b82f6;
}

.bracket-exception {
  background-color: rgba(239, 68, 68, 0.15); /* red */
  border-bottom: 1px dashed #ef4444;
}

.bracket-reference {
  background-color: rgba(34, 197, 94, 0.15); /* green */
  border-bottom: 1px dashed #22c55e;
}

.bracket-limit {
  background-color: rgba(168, 85, 247, 0.15); /* purple */
  border-bottom: 1px dashed #a855f7;
}

.bracket-supplement {
  background-color: rgba(107, 114, 128, 0.15); /* gray */
  border-bottom: 1px dashed #6b7280;
}

.bracket-enumeration {
  background-color: rgba(245, 158, 11, 0.15); /* amber */
  border-bottom: 1px dashed #f59e0b;
}

.bracket-unknown {
  background-color: rgba(156, 163, 175, 0.1); /* light gray */
}

/* 숨김 모드 */
.bracket-hidden .bracket {
  opacity: 0;
  font-size: 0;
  padding: 0;
  margin: 0;
}

/* 깊이별 스타일 */
.bracket-depth-0 { font-weight: normal; }
.bracket-depth-1 { font-size: 0.95em; }
.bracket-depth-2 { font-size: 0.9em; }
.bracket-depth-3 { font-size: 0.85em; }

/* 호버 효과 */
.bracket:hover {
  filter: brightness(0.95);
  cursor: help;
}

/* 툴팁 */
.bracket[data-type]::after {
  content: attr(data-type);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.bracket:hover[data-type]::after {
  opacity: 1;
}
`;

// ============================================
// Export
// ============================================

export default {
  parseBrackets,
  simplifyText,
  getBracketStats,
  filterBracketsByType,
  extractReferencedArticles,
  BRACKET_HIGHLIGHT_CSS,
};
