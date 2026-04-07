/**
 * 핵심 3대 서비스 동기화 시스템
 *
 * 법령(Laws), 행정규칙(Admin_Rules), 자치법규(Local_Ordinances)
 *
 * 동기화 전략:
 * 1단계: 목록 수집 (List Collection) - 페이징으로 전체 목록 수집
 * 2단계: 본문 동기화 (Content Sync) - 각 항목의 본문 조회 및 저장
 * 3단계: 증분 동기화 (Incremental) - 변경된 항목만 업데이트
 */

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import Database from 'better-sqlite3';
import path from 'path';
import PQueue from 'p-queue';

// ============================================
// 설정
// ============================================

const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const BASE_URL = 'http://www.law.go.kr/DRF';
const DB_PATH = process.env.KOREA_LAW_DB_PATH || path.join(__dirname, '../../data/korea-law.db');

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  cdataPropName: '__cdata',
  trimValues: true,
});

// API 클라이언트
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/xml',
    'User-Agent': 'Korea-Law-MCP/1.0',
  },
});

// ============================================
// 타입 정의
// ============================================

export interface SyncProgress {
  service: 'law' | 'admrul' | 'ordin';
  phase: 'list' | 'content';
  total: number;
  current: number;
  success: number;
  error: number;
  startTime: Date;
  estimatedRemaining?: number;
}

export interface ListItem {
  id: string;
  name: string;
  type?: string;
  date?: string;
  ministry?: string;
  localGov?: string;
}

export interface SyncResult {
  service: string;
  totalItems: number;
  syncedItems: number;
  errorItems: number;
  duration: number;
  errors: string[];
}

// ============================================
// 1. 법령 동기화
// ============================================

/**
 * 법령 목록 수집 (페이징)
 */
export async function collectLawsList(
  options: { maxPages?: number; maxItems?: number; delay?: number } = {}
): Promise<ListItem[]> {
  const { maxPages = 100, maxItems, delay = 300 } = options;
  const allItems: ListItem[] = [];

  let page = 1;
  let hasMore = true;

  console.log(`📋 법령 목록 수집 시작...${maxItems ? ` (최대 ${maxItems}건)` : ''}`);

  while (hasMore && page <= maxPages) {
    try {
      const response = await apiClient.get('/lawSearch.do', {
        params: {
          OC: API_KEY,
          target: 'law',
          type: 'XML',
          display: 100,
          page: page,
          nw: 1,  // 현행만
        },
      });

      const parsed = xmlParser.parse(response.data);
      const totalCnt = parseInt(parsed?.LawSearch?.totalCnt || '0');
      const items = parsed?.LawSearch?.law;

      if (!items || (Array.isArray(items) && items.length === 0)) {
        hasMore = false;
        continue;
      }

      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray) {
        allItems.push({
          id: String(item.법령일련번호 || item.법령ID || ''),
          name: extractText(item.법령명한글) || extractText(item.법령명) || '',
          type: item.법령구분명 || item.법령종류 || '',
          date: String(item.시행일자 || item.공포일자 || ''),
          ministry: item.소관부처명 || item.소관부처 || '',
        });

        // maxItems 도달 시 조기 종료
        if (maxItems && allItems.length >= maxItems) {
          hasMore = false;
          break;
        }
      }

      console.log(`  페이지 ${page}: ${itemArray.length}건 (누적 ${allItems.length}/${totalCnt}건)`);

      if (allItems.length >= totalCnt || (maxItems && allItems.length >= maxItems)) {
        hasMore = false;
      } else {
        page++;
        await sleep(delay);
      }
    } catch (error: any) {
      console.error(`  페이지 ${page} 오류: ${error.message}`);
      hasMore = false;
    }
  }

  console.log(`✅ 법령 목록 수집 완료: ${allItems.length}건`);
  return allItems;
}

/**
 * 법령 본문 조회
 */
export async function getLawContent(lawId: string): Promise<any | null> {
  try {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'XML',
        MST: lawId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 루트: 법령 또는 LawService
    const root = parsed?.법령 || parsed?.LawService;
    if (!root) return null;

    // 기본정보 추출
    const 기본정보 = root?.기본정보 || root;

    // 조문 추출 (조문.조문단위 배열)
    const 조문목록 = root?.조문?.조문단위;
    let articleContents = '';
    const articles: any[] = [];

    if (조문목록) {
      const articleArray = Array.isArray(조문목록) ? 조문목록 : [조문목록];
      for (const a of articleArray) {
        if (a && a.조문내용) {
          const 조문번호 = a.조문번호 || '';
          const 조문제목 = extractText(a.조문제목) || '';
          const 조문내용 = extractText(a.조문내용) || '';

          articles.push({
            article_number: 조문번호,
            article_title: 조문제목,
            article_content: 조문내용,
          });

          articleContents += `제${조문번호}조 ${조문제목}\n${조문내용}\n\n`;
        }
      }
    }

    // 부칙 추출
    const 부칙 = root?.부칙;
    let 부칙내용 = '';
    if (부칙) {
      const 부칙단위 = 부칙?.부칙단위;
      if (부칙단위) {
        const 부칙배열 = Array.isArray(부칙단위) ? 부칙단위 : [부칙단위];
        부칙내용 = 부칙배열
          .map((b: any) => extractText(b.부칙내용) || '')
          .filter(Boolean)
          .join('\n');
      }
    }

    return {
      법령ID: 기본정보.법령ID || lawId,
      법령일련번호: lawId,
      법령명: extractText(기본정보.법령명_한글) || extractText(기본정보.법령명한글) || '',
      법령종류: extractText(기본정보.법종구분) || '',
      공포일자: 기본정보.공포일자 || '',
      시행일자: 기본정보.시행일자 || '',
      소관부처: extractText(기본정보.소관부처) || '',
      조문내용: articleContents,
      조문목록: articles,
      부칙내용: 부칙내용,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 법령 전체 동기화 (병렬 처리)
 */
export async function syncLaws(
  options: {
    limit?: number;
    delay?: number;
    verbose?: boolean;
    contentSync?: boolean;
    concurrency?: number;  // 동시 처리 수
  } = {}
): Promise<SyncResult> {
  const { limit, delay = 100, verbose = false, contentSync = true, concurrency = 5 } = options;
  const startTime = Date.now();
  const errors: string[] = [];

  const db = new Database(DB_PATH);

  // 1. 목록 수집 (limit 있으면 조기 종료)
  const items = await collectLawsList({ delay: 200, maxItems: limit });
  const targetItems = items;

  let successCount = 0;
  let errorCount = 0;
  let processedCount = 0;

  if (contentSync) {
    console.log(`\n📝 법령 본문 동기화 시작 (${targetItems.length}건, 동시 ${concurrency}개)...`);

    // Laws 테이블 - INSERT OR REPLACE
    const stmtLaw = db.prepare(`
      INSERT INTO Laws (
        law_mst_id, law_name, promulgation_date, enforcement_date,
        law_type, ministry, status, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
      ON CONFLICT(law_mst_id) DO UPDATE SET
        law_name = excluded.law_name,
        promulgation_date = excluded.promulgation_date,
        enforcement_date = excluded.enforcement_date,
        law_type = excluded.law_type,
        ministry = excluded.ministry,
        status = 'ACTIVE',
        last_synced_at = CURRENT_TIMESTAMP
    `);

    // 기존 법령 ID 조회
    const stmtGetLawId = db.prepare(`SELECT id FROM Laws WHERE law_mst_id = ?`);

    // Articles 테이블 - INSERT OR REPLACE (law_id는 INTEGER FK)
    const stmtArticle = db.prepare(`
      INSERT INTO Articles (
        law_id, article_no, article_title, content, updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(law_id, article_no) DO UPDATE SET
        article_title = excluded.article_title,
        content = excluded.content,
        updated_at = CURRENT_TIMESTAMP
    `);

    // 병렬 처리 큐 설정 (p-queue)
    const queue = new PQueue({
      concurrency,
      intervalCap: concurrency * 2,  // 초당 최대 요청 수
      interval: 1000,                 // 1초 간격
    });

    // 진행상황 출력 타이머
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processedCount / elapsed;
      const remaining = (targetItems.length - processedCount) / rate;
      console.log(`  ⏳ 진행: ${processedCount}/${targetItems.length} (${(processedCount / targetItems.length * 100).toFixed(1)}%) | 속도: ${rate.toFixed(1)}/s | 남은시간: ${Math.ceil(remaining / 60)}분`);
    }, 10000);  // 10초마다 출력

    // API 호출을 병렬로 수행
    const fetchTasks = targetItems.map((item, index) =>
      queue.add(async () => {
        try {
          const content = await getLawContent(item.id);
          processedCount++;
          return { index, item, content, error: null };
        } catch (error: any) {
          processedCount++;
          return { index, item, content: null, error: error.message };
        }
      })
    );

    // 모든 API 호출 완료 대기
    const results = await Promise.all(fetchTasks);
    clearInterval(progressInterval);

    console.log(`\n  📥 API 호출 완료. DB 저장 중...`);

    // DB 저장은 순차적으로 (SQLite 동시성 제한)
    for (const result of results) {
      if (!result) continue;

      const { item, content, error } = result;

      if (error) {
        errorCount++;
        errors.push(`API 오류: ${item.id} - ${error}`);
        continue;
      }

      if (content) {
        try {
          const lawMstId = content.법령ID || content.법령일련번호;

          // 법령 저장
          stmtLaw.run(
            lawMstId,
            content.법령명,
            formatDate(content.공포일자),
            formatDate(content.시행일자),
            content.법령종류,
            content.소관부처
          );

          // 법령의 INTEGER ID 가져오기
          const lawRow = stmtGetLawId.get(lawMstId) as { id: number } | undefined;
          const lawId = lawRow?.id;

          if (lawId) {
            // 조문 저장
            for (const article of content.조문목록 || []) {
              const articleNo = article.article_number ? `제${article.article_number}조` : '';
              stmtArticle.run(
                lawId,
                articleNo,
                article.article_title,
                article.article_content
              );
            }
          }

          successCount++;
          if (verbose || successCount % 100 === 0) {
            console.log(`  [${successCount}/${targetItems.length}] ✅ ${content.법령명} (조문 ${content.조문목록?.length || 0}개)`);
          }
        } catch (dbError: any) {
          errorCount++;
          errors.push(`DB 오류: ${item.id} - ${dbError.message}`);
        }
      } else {
        errorCount++;
        errors.push(`본문 조회 실패: ${item.id}`);
      }
    }
  } else {
    // 목록만 저장
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO Laws (
        law_mst_id, law_name, law_type, ministry,
        status, last_synced_at
      ) VALUES (?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
    `);

    for (const item of targetItems) {
      try {
        stmt.run(item.id, item.name, item.type, item.ministry);
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`저장 오류: ${item.id} - ${error.message}`);
      }
    }
  }

  db.close();

  const duration = Date.now() - startTime;
  console.log(`\n✅ 법령 동기화 완료: ${successCount}건 성공, ${errorCount}건 실패 (${(duration / 1000).toFixed(1)}초)`);

  return {
    service: 'law',
    totalItems: targetItems.length,
    syncedItems: successCount,
    errorItems: errorCount,
    duration,
    errors,
  };
}

// ============================================
// 2. 행정규칙 동기화
// ============================================

/**
 * 행정규칙 목록 수집 (페이징)
 */
export async function collectAdminRulesList(
  options: { maxPages?: number; delay?: number } = {}
): Promise<ListItem[]> {
  const { maxPages = 1000, delay = 300 } = options;
  const allItems: ListItem[] = [];

  let page = 1;
  let hasMore = true;

  console.log('📋 행정규칙 목록 수집 시작...');

  while (hasMore && page <= maxPages) {
    try {
      const response = await apiClient.get('/lawSearch.do', {
        params: {
          OC: API_KEY,
          target: 'admrul',
          type: 'XML',
          display: 100,
          page: page,
          nw: 1,  // 현행만
        },
      });

      const parsed = xmlParser.parse(response.data);
      // API 루트: AdmRulSearch (R 대문자)
      const totalCnt = parseInt(parsed?.AdmRulSearch?.totalCnt || '0');
      const items = parsed?.AdmRulSearch?.admrul;

      if (!items || (Array.isArray(items) && items.length === 0)) {
        hasMore = false;
        continue;
      }

      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray) {
        allItems.push({
          id: String(item.행정규칙일련번호 || ''),
          name: extractText(item.행정규칙명) || '',
          type: item.행정규칙종류 || '',
          date: String(item.발령일자 || ''),
          ministry: item.소관부처명 || '',
        });
      }

      console.log(`  페이지 ${page}: ${itemArray.length}건 (누적 ${allItems.length}/${totalCnt}건)`);

      if (allItems.length >= totalCnt) {
        hasMore = false;
      } else {
        page++;
        await sleep(delay);
      }
    } catch (error: any) {
      console.error(`  페이지 ${page} 오류: ${error.message}`);
      hasMore = false;
    }
  }

  console.log(`✅ 행정규칙 목록 수집 완료: ${allItems.length}건`);
  return allItems;
}

/**
 * 행정규칙 본문 조회
 */
export async function getAdminRuleContent(ruleId: string): Promise<any | null> {
  try {
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'admrul',
        type: 'XML',
        ID: ruleId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 루트: AdmRulService.행정규칙기본정보
    const root = parsed?.AdmRulService;
    const rule = root?.행정규칙기본정보 || root;

    if (!rule) return null;

    // 조문내용이 여러 개일 수 있음
    const 조문들 = root?.조문내용;
    let 조문내용전체 = '';
    if (조문들) {
      const 조문배열 = Array.isArray(조문들) ? 조문들 : [조문들];
      조문내용전체 = 조문배열.map((조문: any) => extractText(조문)).join('\n\n');
    }

    // 부칙내용 처리
    const 부칙들 = root?.부칙;
    let 부칙내용전체 = '';
    if (부칙들) {
      const 부칙배열 = Array.isArray(부칙들) ? 부칙들 : [부칙들];
      부칙내용전체 = 부칙배열.map((부칙: any) => extractText(부칙.부칙내용 || 부칙)).join('\n\n');
    }

    return {
      일련번호: rule.행정규칙일련번호 || ruleId,
      행정규칙명: extractText(rule.행정규칙명) || '',
      행정규칙종류: rule.행정규칙종류 || '',
      발령일자: rule.발령일자 || '',
      시행일자: rule.시행일자 || '',
      소관부처명: rule.소관부처명 || '',
      조문내용: 조문내용전체,
      부칙내용: 부칙내용전체,
      별표: '',  // 별표는 별도 파싱 필요
      현행여부: rule.현행여부 || 'Y',
    };
  } catch (error) {
    return null;
  }
}

/**
 * 행정규칙 전체 동기화 (병렬 처리)
 */
export async function syncAdminRules(
  options: {
    limit?: number;
    delay?: number;
    verbose?: boolean;
    contentSync?: boolean;
    concurrency?: number;  // 동시 처리 수
  } = {}
): Promise<SyncResult> {
  const { limit, delay = 100, verbose = false, contentSync = true, concurrency = 5 } = options;
  const startTime = Date.now();
  const errors: string[] = [];

  const db = new Database(DB_PATH);

  // 1. 목록 수집 (limit이 있으면 페이지 수 제한)
  const maxPages = limit ? Math.ceil(limit / 100) + 1 : 1000;
  const items = await collectAdminRulesList({ delay: 200, maxPages });
  const targetItems = limit ? items.slice(0, limit) : items;

  let successCount = 0;
  let errorCount = 0;
  let processedCount = 0;

  if (contentSync) {
    console.log(`\n📝 행정규칙 본문 동기화 시작 (${targetItems.length}건, 동시 ${concurrency}개)...`);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO Admin_Rules (
        rule_serial_number, rule_name, rule_type,
        ministry, issuance_date, enforcement_date,
        content, status, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    // 병렬 처리 큐 설정 (p-queue)
    const queue = new PQueue({
      concurrency,
      intervalCap: concurrency * 2,  // 초당 최대 요청 수
      interval: 1000,                 // 1초 간격
    });

    // 진행상황 출력 타이머
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processedCount / elapsed;
      const remaining = (targetItems.length - processedCount) / rate;
      console.log(`  ⏳ 진행: ${processedCount}/${targetItems.length} (${(processedCount / targetItems.length * 100).toFixed(1)}%) | 속도: ${rate.toFixed(1)}/s | 남은시간: ${Math.ceil(remaining / 60)}분`);
    }, 10000);  // 10초마다 출력

    // API 호출을 병렬로 수행
    const fetchTasks = targetItems.map((item, index) =>
      queue.add(async () => {
        try {
          const content = await getAdminRuleContent(item.id);
          processedCount++;
          return { index, item, content, error: null };
        } catch (error: any) {
          processedCount++;
          return { index, item, content: null, error: error.message };
        }
      })
    );

    // 모든 API 호출 완료 대기
    const results = await Promise.all(fetchTasks);
    clearInterval(progressInterval);

    console.log(`\n  📥 API 호출 완료. DB 저장 중...`);

    // DB 저장은 순차적으로 (SQLite 동시성 제한)
    for (const result of results) {
      if (!result) continue;

      const { item, content, error } = result;

      if (error) {
        errorCount++;
        errors.push(`API 오류: ${item.id} - ${error}`);
        continue;
      }

      if (content) {
        try {
          stmt.run(
            content.일련번호,
            content.행정규칙명,
            content.행정규칙종류,
            content.소관부처명,
            formatDate(content.발령일자),
            formatDate(content.시행일자),
            JSON.stringify({
              조문: content.조문내용,
              부칙: content.부칙내용,
              별표: content.별표,
            }),
            content.현행여부 === 'Y' ? 'ACTIVE' : 'INACTIVE'
          );
          successCount++;

          if (verbose || successCount % 500 === 0) {
            console.log(`  [${successCount}/${targetItems.length}] ✅ ${content.행정규칙명}`);
          }
        } catch (dbError: any) {
          errorCount++;
          errors.push(`DB 오류: ${item.id} - ${dbError.message}`);
        }
      } else {
        errorCount++;
        errors.push(`본문 조회 실패: ${item.id} - ${item.name}`);
      }
    }
  } else {
    // 목록만 저장 (본문 없이)
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO Admin_Rules (
        rule_serial_number, rule_name, rule_type,
        ministry, issuance_date, status, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
    `);

    for (const item of targetItems) {
      try {
        stmt.run(item.id, item.name, item.type, item.ministry, formatDate(item.date));
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`저장 오류: ${item.id} - ${error.message}`);
      }
    }
  }

  db.close();

  const duration = Date.now() - startTime;
  console.log(`\n✅ 행정규칙 동기화 완료: ${successCount}건 성공, ${errorCount}건 실패 (${(duration / 1000).toFixed(1)}초)`);

  return {
    service: 'admrul',
    totalItems: targetItems.length,
    syncedItems: successCount,
    errorItems: errorCount,
    duration,
    errors,
  };
}

// ============================================
// 2. 자치법규 동기화
// ============================================

/**
 * 자치법규 목록 수집 (페이징)
 */
export async function collectOrdinancesList(
  options: {
    maxPages?: number;
    maxItems?: number;  // 최대 수집 건수 (조기 종료)
    delay?: number;
    org?: string;  // 지자체 코드 (예: 서울시 6110000)
  } = {}
): Promise<ListItem[]> {
  const { maxPages = 2000, maxItems, delay = 300, org } = options;
  const allItems: ListItem[] = [];

  let page = 1;
  let hasMore = true;

  console.log(`📋 자치법규 목록 수집 시작... ${org ? `(지자체: ${org})` : '(전체)'}${maxItems ? ` (최대 ${maxItems}건)` : ''}`);

  while (hasMore && page <= maxPages) {
    try {
      const params: any = {
        OC: API_KEY,
        target: 'ordin',
        type: 'XML',
        display: 100,
        page: page,
        nw: 1,  // 현행만
      };

      if (org) {
        params.org = org;
      }

      const response = await apiClient.get('/lawSearch.do', { params });

      const parsed = xmlParser.parse(response.data);
      // API 루트: OrdinSearch.law
      const totalCnt = parseInt(parsed?.OrdinSearch?.totalCnt || '0');
      const items = parsed?.OrdinSearch?.law;

      if (!items || (Array.isArray(items) && items.length === 0)) {
        hasMore = false;
        continue;
      }

      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray) {
        allItems.push({
          id: String(item.자치법규일련번호 || item.자치법규ID || ''),
          name: extractText(item.자치법규명) || '',
          type: item.자치법규종류 || '',
          date: String(item.공포일자 || ''),
          localGov: item.지자체기관명 || '',
        });

        // maxItems 도달 시 조기 종료
        if (maxItems && allItems.length >= maxItems) {
          hasMore = false;
          break;
        }
      }

      console.log(`  페이지 ${page}: ${itemArray.length}건 (누적 ${allItems.length}/${totalCnt}건)`);

      if (allItems.length >= totalCnt || (maxItems && allItems.length >= maxItems)) {
        hasMore = false;
      } else {
        page++;
        await sleep(delay);
      }
    } catch (error: any) {
      console.error(`  페이지 ${page} 오류: ${error.message}`);
      hasMore = false;
    }
  }

  console.log(`✅ 자치법규 목록 수집 완료: ${allItems.length}건`);
  return allItems;
}

/**
 * 자치법규 본문 조회
 */
export async function getOrdinanceContent(ordinanceId: string): Promise<any | null> {
  try {
    // MST 또는 ID 파라미터 사용
    const response = await apiClient.get('/lawService.do', {
      params: {
        OC: API_KEY,
        target: 'ordin',
        type: 'XML',
        MST: ordinanceId,
      },
    });

    const parsed = xmlParser.parse(response.data);
    // API 루트: LawService.자치법규기본정보
    const root = parsed?.LawService;
    const ordin = root?.자치법규기본정보 || root;

    if (!ordin) return null;

    // 조문 추출 (조문.조 배열)
    const 조문목록 = root?.조문?.조;
    let articleContents = '';
    if (조문목록) {
      const articleArray = Array.isArray(조문목록) ? 조문목록 : [조문목록];
      articleContents = articleArray
        .filter((a: any) => a && a.조내용)
        .map((a: any) => {
          const 제목 = extractText(a.조제목) || '';
          const 내용 = extractText(a.조내용) || '';
          return 제목 ? `${제목}\n${내용}` : 내용;
        })
        .join('\n\n');
    }

    // 부칙 추출
    const 부칙 = root?.부칙;
    let 부칙내용 = '';
    if (부칙) {
      부칙내용 = extractText(부칙.부칙내용) || '';
    }

    return {
      일련번호: ordin.자치법규일련번호 || ordinanceId,
      자치법규ID: ordin.자치법규ID || '',
      자치법규명: extractText(ordin.자치법규명) || '',
      자치법규종류: ordin.자치법규종류 || '',
      공포일자: ordin.공포일자 || '',
      시행일자: ordin.시행일자 || '',
      지자체기관명: ordin.지자체기관명 || '',
      조문내용: articleContents,
      부칙내용: 부칙내용,
    };
  } catch (error) {
    return null;
  }
}

/**
 * 자치법규 전체 동기화 (배치 처리 + 이어하기 지원)
 */
export async function syncOrdinances(
  options: {
    limit?: number;
    delay?: number;
    verbose?: boolean;
    contentSync?: boolean;
    org?: string;  // 지자체 코드
    concurrency?: number;  // 동시 처리 수
    batchSize?: number;  // 배치 크기
    resume?: boolean;  // 이어하기 모드
  } = {}
): Promise<SyncResult> {
  const {
    limit,
    delay = 100,
    verbose = false,
    contentSync = true,
    org,
    concurrency = 10,
    batchSize = 500,
    resume = true,  // 기본값: 이어하기 활성화
  } = options;
  const startTime = Date.now();
  const errors: string[] = [];

  const db = new Database(DB_PATH);

  // 1. 목록 수집 (limit 있으면 조기 종료)
  const items = await collectOrdinancesList({ delay: 200, org, maxItems: limit });

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  if (contentSync) {
    // 이어하기 모드: 이미 동기화된 항목 확인
    let existingIds = new Set<string>();
    if (resume) {
      const existingRows = db.prepare('SELECT ordinance_serial_number FROM Local_Ordinances').all() as any[];
      existingIds = new Set(existingRows.map(r => String(r.ordinance_serial_number)));
      console.log(`\n📋 기존 동기화 항목: ${existingIds.size}건 (이어하기 모드)`);
    }

    // 동기화 대상 필터링
    const targetItems = items.filter(item => !existingIds.has(String(item.id)));
    skippedCount = items.length - targetItems.length;

    if (targetItems.length === 0) {
      console.log(`\n✅ 모든 항목이 이미 동기화됨 (${items.length}건)`);
      db.close();
      return {
        service: 'ordin',
        totalItems: items.length,
        syncedItems: 0,
        errorItems: 0,
        duration: Date.now() - startTime,
        errors: [],
      };
    }

    console.log(`\n📝 자치법규 본문 동기화 시작`);
    console.log(`   전체: ${items.length}건 | 건너뜀: ${skippedCount}건 | 대상: ${targetItems.length}건`);
    console.log(`   배치: ${batchSize}건씩 | 동시: ${concurrency}개`);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO Local_Ordinances (
        ordinance_serial_number, ordinance_name,
        local_government_code, local_government_name,
        promulgation_date, enforcement_date,
        content, status, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
    `);

    // 배치 처리
    const totalBatches = Math.ceil(targetItems.length / batchSize);

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const batchStart = batchIdx * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, targetItems.length);
      const batchItems = targetItems.slice(batchStart, batchEnd);

      const batchStartTime = Date.now();
      console.log(`\n━━━ 배치 ${batchIdx + 1}/${totalBatches} (${batchStart + 1}~${batchEnd}/${targetItems.length}) ━━━`);

      // 병렬 처리 큐 설정
      const queue = new PQueue({
        concurrency,
        intervalCap: concurrency * 3,  // 초당 최대 요청 수
        interval: 1000,
      });

      let batchProcessed = 0;
      let batchSuccess = 0;
      let batchError = 0;

      // 배치 내 API 호출 병렬 수행
      const fetchTasks = batchItems.map((item) =>
        queue.add(async () => {
          try {
            const content = await getOrdinanceContent(item.id);
            batchProcessed++;

            // 진행률 출력 (100건마다)
            if (batchProcessed % 100 === 0) {
              const elapsed = (Date.now() - batchStartTime) / 1000;
              const rate = batchProcessed / elapsed;
              console.log(`  ⏳ ${batchProcessed}/${batchItems.length} (${rate.toFixed(1)}/s)`);
            }

            return { item, content, error: null };
          } catch (error: any) {
            batchProcessed++;
            return { item, content: null, error: error.message };
          }
        })
      );

      // 배치 API 호출 완료 대기
      const results = await Promise.all(fetchTasks);

      // 배치 DB 저장 (즉시)
      for (const result of results) {
        if (!result) continue;

        const { item, content, error } = result;

        if (error) {
          batchError++;
          errorCount++;
          errors.push(`API 오류: ${item.id} - ${error}`);
          continue;
        }

        if (content) {
          try {
            stmt.run(
              content.일련번호,
              content.자치법규명,
              '',
              content.지자체기관명,
              formatDate(content.공포일자),
              formatDate(content.시행일자),
              JSON.stringify({
                조문: content.조문내용,
                부칙: content.부칙내용,
              })
            );
            batchSuccess++;
            successCount++;
          } catch (dbError: any) {
            batchError++;
            errorCount++;
            errors.push(`DB 오류: ${item.id} - ${dbError.message}`);
          }
        } else {
          batchError++;
          errorCount++;
          errors.push(`본문 조회 실패: ${item.id} - ${item.name}`);
        }
      }

      const batchDuration = (Date.now() - batchStartTime) / 1000;
      const overallProgress = ((batchEnd + skippedCount) / items.length * 100).toFixed(1);
      const overallElapsed = (Date.now() - startTime) / 1000;
      const overallRate = (successCount + skippedCount) / overallElapsed;
      const remaining = (items.length - batchEnd - skippedCount) / overallRate;

      console.log(`  ✅ 배치 완료: ${batchSuccess}건 성공, ${batchError}건 실패 (${batchDuration.toFixed(1)}초)`);
      console.log(`  📊 전체: ${overallProgress}% | DB: ${successCount + skippedCount}건 | 남은시간: ${Math.ceil(remaining / 60)}분`);
    }
  } else {
    // 목록만 저장
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO Local_Ordinances (
        ordinance_serial_number, ordinance_name,
        local_government_name, promulgation_date,
        status, last_synced_at
      ) VALUES (?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
    `);

    for (const item of items) {
      try {
        stmt.run(item.id, item.name, item.localGov, formatDate(item.date));
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`저장 오류: ${item.id} - ${error.message}`);
      }
    }
  }

  db.close();

  const duration = Date.now() - startTime;
  console.log(`\n✅ 자치법규 동기화 완료: ${successCount}건 성공, ${errorCount}건 실패 (${(duration / 1000).toFixed(1)}초)`);

  return {
    service: 'ordin',
    totalItems: items.length,
    syncedItems: successCount,
    errorItems: errorCount,
    duration,
    errors,
  };
}

// ============================================
// 3. 전체 핵심 서비스 동기화
// ============================================

export interface CoreSyncOptions {
  services?: ('law' | 'admrul' | 'ordin')[];
  limit?: number;
  delay?: number;
  verbose?: boolean;
  contentSync?: boolean;
  org?: string;  // 자치법규 지자체 코드
  concurrency?: number;  // 동시 처리 수 (기본값: 10)
  batchSize?: number;  // 배치 크기 (기본값: 500)
  resume?: boolean;  // 이어하기 모드 (기본값: true)
}

/**
 * 핵심 3대 서비스 전체 동기화
 */
export async function syncCoreServices(options: CoreSyncOptions = {}): Promise<{
  results: SyncResult[];
  totalDuration: number;
}> {
  const {
    services = ['law', 'admrul', 'ordin'],
    limit,
    delay = 300,
    verbose = true,
    contentSync = true,
    org,
    concurrency,
    batchSize,
    resume,
  } = options;

  const startTime = Date.now();
  const results: SyncResult[] = [];

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     🏛️ 핵심 3대 서비스 동기화 시작              ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`대상: ${services.join(', ')}`);
  console.log(`본문 동기화: ${contentSync ? '✅' : '❌ (목록만)'}`);
  if (limit) console.log(`제한: ${limit}건`);
  console.log('');

  // 1. 법령 동기화
  if (services.includes('law')) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 1. 법령 동기화');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const result = await syncLaws({ limit, delay, verbose, contentSync });
    results.push(result);
  }

  // 2. 행정규칙 동기화
  if (services.includes('admrul')) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 2. 행정규칙 동기화');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const result = await syncAdminRules({ limit, delay, verbose, contentSync });
    results.push(result);
  }

  // 3. 자치법규 동기화
  if (services.includes('ordin')) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📜 3. 자치법규 동기화');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const result = await syncOrdinances({ limit, delay, verbose, contentSync, org, concurrency, batchSize, resume });
    results.push(result);
  }

  const totalDuration = Date.now() - startTime;

  // 결과 요약
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║     📊 동기화 완료 요약                         ║');
  console.log('╚══════════════════════════════════════════════╝');

  for (const result of results) {
    const status = result.errorItems === 0 ? '✅' : '⚠️';
    console.log(`${status} ${result.service}: ${result.syncedItems}/${result.totalItems}건 (${(result.duration / 1000).toFixed(1)}초)`);
  }

  console.log(`\n총 소요시간: ${(totalDuration / 1000 / 60).toFixed(1)}분`);

  return { results, totalDuration };
}

// ============================================
// 유틸리티 함수
// ============================================

function extractText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value.__cdata) return value.__cdata;
  if (value['#text']) return value['#text'];
  return String(value);
}

function formatDate(dateStr: string | number | undefined): string | null {
  if (!dateStr) return null;
  const str = String(dateStr).replace(/\D/g, '');
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// CLI 실행
// ============================================

async function main() {
  const args = process.argv.slice(2);

  const options: CoreSyncOptions = {
    services: [],
    verbose: true,
    contentSync: !args.includes('--list-only'),
  };

  // 서비스 선택
  if (args.includes('--admrul')) options.services!.push('admrul');
  if (args.includes('--ordin')) options.services!.push('ordin');
  if (args.includes('--law')) options.services!.push('law');
  if (args.includes('--all') || options.services!.length === 0) {
    options.services = ['law', 'admrul', 'ordin'];  // 핵심 3대 서비스 전체
  }

  // 제한
  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    options.limit = parseInt(args[limitIdx + 1]);
  }

  // 지자체 코드
  const orgIdx = args.indexOf('--org');
  if (orgIdx !== -1 && args[orgIdx + 1]) {
    options.org = args[orgIdx + 1];
  }

  // 동시 처리 수
  const concurrencyIdx = args.indexOf('--concurrency');
  if (concurrencyIdx !== -1 && args[concurrencyIdx + 1]) {
    options.concurrency = parseInt(args[concurrencyIdx + 1]);
  }

  // 배치 크기
  const batchIdx = args.indexOf('--batch-size');
  if (batchIdx !== -1 && args[batchIdx + 1]) {
    options.batchSize = parseInt(args[batchIdx + 1]);
  }

  // 이어하기 비활성화
  if (args.includes('--no-resume')) {
    options.resume = false;
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 🏛️ Korea Law Core Sync                        ║
║           핵심 3대 서비스 동기화 시스템                          ║
╚══════════════════════════════════════════════════════════════╝

사용법:
  npx ts-node core-sync.ts [옵션]

옵션:
  --law          법령 동기화
  --admrul       행정규칙 동기화
  --ordin        자치법규 동기화
  --all          전체 동기화 (기본값: 법령+행정규칙+자치법규)
  --limit N      최대 N건 동기화
  --list-only    목록만 수집 (본문 제외)
  --org CODE     자치법규 지자체 코드 (예: 6110000 = 서울시)
  --concurrency N   동시 처리 수 (기본값: 10)
  --batch-size N    배치 크기 (기본값: 500)
  --no-resume       이어하기 비활성화 (처음부터 다시)

예시:
  npx ts-node core-sync.ts --ordin                   # 자치법규 (이어하기)
  npx ts-node core-sync.ts --ordin --concurrency 15  # 고속 동기화
  npx ts-node core-sync.ts --ordin --no-resume       # 처음부터 다시
  npx ts-node core-sync.ts --law --limit 100
  npx ts-node core-sync.ts --admrul --limit 100
  npx ts-node core-sync.ts --all --list-only
`);

  await syncCoreServices(options);
}

// 직접 실행시
if (require.main === module) {
  main().catch(console.error);
}
