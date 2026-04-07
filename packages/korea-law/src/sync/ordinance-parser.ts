/**
 * 자치법규(조례) XML 파서
 *
 * 법제처 Open API의 자치법규 조회 응답(XML) 파싱.
 *   GET https://www.law.go.kr/DRF/lawService.do?OC=<KEY>&target=ordin&MST=<MST>&type=XML
 *
 * 응답 구조:
 *   <LawService>
 *     <자치법규기본정보>
 *       자치법규ID, 자치법규일련번호, 자치법규명, 공포일자, 시행일자,
 *       지자체기관명, 담당부서명, 자치법규종류, 제개정정보 등
 *     </자치법규기본정보>
 *     <조문>
 *       <조 조문번호='000100'>
 *         <조문번호>000100</조문번호>
 *         <조문여부>Y</조문여부>
 *         <조제목>목적</조제목>
 *         <조내용>제1조(목적) 이 조례는 ...</조내용>
 *       </조>
 *       ...
 *     </조문>
 *     <부칙>
 *     <별표>
 *       <별표단위 별표키="...">
 *         <별표번호>0001</별표번호>
 *         <별표가지번호>00</별표가지번호>
 *         <별표구분>서식</별표구분>
 *         <별표제목>[별표 1] 선서문</별표제목>
 *         <별표첨부파일구분>hwpx</별표첨부파일구분>
 *         <별표첨부파일명>http://www.law.go.kr/flDownload.do?...</별표첨부파일명>
 *         <별표내용></별표내용>    <!-- 본문이 비어있음. HWPX 첨부파일 다운로드 필요 -->
 *       </별표단위>
 *     </별표>
 *     <제개정이유>
 *   </LawService>
 *
 * 별표 본문 처리: 본 파서는 별표 메타데이터(제목, 첨부파일 URL, 키)만 추출.
 * HWPX 파일 다운로드 + 파싱은 Phase D sync 모듈에서 별도 worker로 처리.
 *
 * 설계 문서: docs/todo/09-ordinance-elasticsearch-indexing.md §3 (데이터 모델),
 *          §4 (Sync 파이프라인)
 */

import { XMLParser } from 'fast-xml-parser';

/** 조례 기본 정보 (ES 인덱스의 ordinance doc 헤더) */
export interface OrdinanceMeta {
  /** 자치법규일련번호 (ES `ordinance_mst`, 예: "1941163") */
  mst: string;
  /** 자치법규ID (법제처 내부 ID, 참조용) */
  ordinanceId: string;
  /** 자치법규명 (ES `ordinance_title`) */
  title: string;
  /** 지자체기관명 (ES `municipality_name`, 예: "서울특별시 광진구") */
  municipalityName: string;
  /** 담당부서명 (ES `department`) */
  department?: string;
  /** 공포일자 (ISO 형식 YYYY-MM-DD) */
  promulgationDate: string;
  /** 시행일자 (ISO 형식 YYYY-MM-DD) */
  enforcementDate: string;
  /** 공포번호 */
  promulgationNumber?: string;
  /** 자치법규종류 코드 (C0001 등) */
  ordinanceTypeCode?: string;
  /** 제개정 정보 (전부개정/일부개정/제정 등) */
  revisionType?: string;
}

/** 조문 단위 (ES 인덱스의 article doc) */
export interface OrdinanceArticle {
  /** 원본 조문번호 (6자리 패딩, 예: "000100") */
  articleRawNumber: string;
  /** 정규화된 조문 레이블 (예: "제1조", "제15조의2") */
  articleNo: string;
  /** 조제목 (예: "목적", "복무선서") */
  articleTitle: string;
  /** 조내용 본문 (제N조(제목) 포함 전체 텍스트) */
  content: string;
  /** 조문 정렬 순서 (1부터 시작) */
  position: number;
}

/** 별표·서식 단위 (ES 인덱스의 appendix doc) */
export interface OrdinanceAppendix {
  /** 법제처 별표키 (고유 식별자) */
  appendixKey: string;
  /** 별표번호 (예: "0001") */
  appendixNumber: string;
  /** 별표가지번호 (예: "00", 별표 2의2 같은 경우 "01") */
  appendixBranchNumber: string;
  /** 구분 (예: "서식", "별표") */
  appendixType: string;
  /** 별표 제목 (예: "[별표 1] 선서문") */
  title: string;
  /** 첨부파일 포맷 (예: "hwpx", "pdf") */
  attachmentFormat: string;
  /** 첨부파일 다운로드 URL */
  attachmentUrl: string;
  /** 별표 본문 (대부분 빈 문자열 — 실제 내용은 HWPX 첨부파일에 있음) */
  content: string;
}

/** 편장절 헤더 (조문이 아닌 구조 표시: 제1장 총칙, 제2장 근무 등) */
export interface OrdinanceSection {
  /** 원본 조문번호 (대부분 "000000") */
  rawNumber: string;
  /** 편장절 라벨 (예: "제1장 총칙") */
  label: string;
  /** 이 섹션의 position (전체 조 순서 기준) */
  position: number;
}

/** 파싱 결과 전체 */
export interface ParsedOrdinance {
  meta: OrdinanceMeta;
  articles: OrdinanceArticle[];
  appendices: OrdinanceAppendix[];
  /** 편장절 헤더 (제1장/제2장 등, 조문 아님). 검색/필터용으로 보관 */
  sections: OrdinanceSection[];
  /** 부칙 내용 (ES에는 저장하지 않지만 감사용으로 보관) */
  addenda: string;
  /** 제개정 이유 (선택) */
  revisionReason?: string;
}

/** 법제처 XML을 파싱하여 구조화된 조례 데이터 반환 */
export function parseOrdinanceXml(xml: string): ParsedOrdinance {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false, // 숫자가 선행 0을 잃지 않도록 문자열 유지
    trimValues: true,
    cdataPropName: false as unknown as string, // CDATA를 inline 값으로 처리
  });

  const parsed = parser.parse(xml);
  const svc = parsed?.LawService;
  if (!svc) {
    throw new Error('Invalid XML: LawService root element not found');
  }

  const { articles, sections } = extractArticlesAndSections(svc['조문']);

  return {
    meta: extractMeta(svc['자치법규기본정보']),
    articles,
    sections,
    appendices: extractAppendices(svc['별표']),
    addenda: String(svc['부칙']?.['부칙내용'] || '').trim(),
    revisionReason: extractRevisionReason(svc['제개정이유']),
  };
}

function extractMeta(basic: any): OrdinanceMeta {
  if (!basic) {
    throw new Error('Invalid XML: 자치법규기본정보 missing');
  }

  return {
    mst: asString(basic['자치법규일련번호']),
    ordinanceId: asString(basic['자치법규ID']),
    title: asString(basic['자치법규명']),
    municipalityName: asString(basic['지자체기관명']),
    department: optionalString(basic['담당부서명']),
    promulgationDate: formatDate(asString(basic['공포일자'])),
    enforcementDate: formatDate(asString(basic['시행일자'])),
    promulgationNumber: optionalString(basic['공포번호']),
    ordinanceTypeCode: optionalString(basic['자치법규종류']),
    revisionType: optionalString(basic['제개정정보']),
  };
}

/**
 * 조문과 편장절 헤더 분리.
 *
 * 법제처 XML은 편장절(제1장 총칙 등)도 `<조>` 태그로 표현하고,
 * `<조문여부>` 필드로 구분한다:
 *   - `Y`: 실제 조문 (제N조)
 *   - `N`: 편장절 헤더 (제1장 총칙, 제2장 근무 등)
 */
function extractArticlesAndSections(조문: any): {
  articles: OrdinanceArticle[];
  sections: OrdinanceSection[];
} {
  if (!조문 || !조문['조']) return { articles: [], sections: [] };

  const items = Array.isArray(조문['조']) ? 조문['조'] : [조문['조']];
  const articles: OrdinanceArticle[] = [];
  const sections: OrdinanceSection[] = [];

  items.forEach((item: any, idx: number) => {
    const raw = asString(item['조문번호']).padStart(6, '0');
    const isArticle = asString(item['조문여부']).toUpperCase() !== 'N';
    const content = asString(item['조내용']).trim();
    const title = asString(item['조제목']).trim();

    if (!isArticle) {
      // 편장절 헤더. 내용이 "제1장 총칙" 같은 라벨.
      sections.push({
        rawNumber: raw,
        label: content || title,
        position: idx + 1,
      });
      return;
    }

    // "제N조" 또는 "제N조의M" 추출. 본문이 "제1조(목적) 이 조례는 ..."로 시작.
    const labelMatch = content.match(/^제(\d+)조(?:의(\d+))?/);
    const articleNo = labelMatch
      ? labelMatch[2]
        ? `제${labelMatch[1]}조의${labelMatch[2]}`
        : `제${labelMatch[1]}조`
      : normalizeRawNumber(raw);

    articles.push({
      articleRawNumber: raw,
      articleNo,
      articleTitle: title,
      content,
      position: idx + 1,
    });
  });

  return { articles, sections };
}

/** 원본 조문번호 6자리를 제N조 레이블로 변환 (본문에서 추출 실패했을 때 fallback).
 *  "000100" → "제1조", "001502" → "제15조의2" */
function normalizeRawNumber(raw: string): string {
  if (!/^\d{6}$/.test(raw)) return `#${raw}`;
  const main = parseInt(raw.slice(0, 4), 10);
  const branch = parseInt(raw.slice(4, 6), 10);
  return branch > 0 ? `제${main}조의${branch}` : `제${main}조`;
}

function extractAppendices(별표: any): OrdinanceAppendix[] {
  if (!별표 || !별표['별표단위']) return [];

  const items = Array.isArray(별표['별표단위']) ? 별표['별표단위'] : [별표['별표단위']];
  return items.map((item: any) => ({
    appendixKey: asString(item['@_별표키']),
    appendixNumber: asString(item['별표번호']),
    appendixBranchNumber: asString(item['별표가지번호'] ?? '00'),
    appendixType: asString(item['별표구분']),
    title: asString(item['별표제목']).trim(),
    attachmentFormat: asString(item['별표첨부파일구분']),
    attachmentUrl: asString(item['별표첨부파일명']),
    content: asString(item['별표내용']).trim(),
  }));
}

function extractRevisionReason(이유: any): string | undefined {
  if (!이유) return undefined;
  const raw = asString(이유['제개정이유내용']).trim();
  return raw.length > 0 ? raw : undefined;
}

function asString(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

function optionalString(v: unknown): string | undefined {
  const s = asString(v).trim();
  return s.length > 0 ? s : undefined;
}

/** YYYYMMDD → YYYY-MM-DD */
function formatDate(yyyymmdd: string): string {
  const s = yyyymmdd.trim();
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return s;
}
