/**
 * 자치법규 Elasticsearch 동기화 모듈 (production).
 *
 * 기존 ordinance-sync.ts는 SQLite 대상이었고, 여러 기존 컨슈머가
 * 사용 중이므로 그대로 유지. 본 파일은 ES `ordinances_v1` 인덱스에
 * indexing하는 새 경로.
 *
 * 흐름 (지자체 단위):
 *   1. 법제처 lawSearch.do?target=ordin&org=<code> 페이지네이션으로 조례 메타 수집
 *   2. 각 조례별 lawService.do?target=ordin&MST=<mst>&type=XML 본문 fetch
 *   3. raw_html_hash로 변경 감지 → 동일하면 skip
 *   4. 변경 또는 신규면 processOrdinanceXml로 파싱→임베딩→ES bulk index
 *   5. 진행 상황을 SyncState에 기록 (resumable)
 *
 * 설계 문서: docs/todo/09-ordinance-elasticsearch-indexing.md §4, §7 Phase D
 *
 * 의존: Phase C의 processOrdinanceXml + ElasticsearchClient + embedder
 *      Phase B의 ordinance-parser
 *
 * 실행 예시:
 *   set -a; source weknora/.env; set +a
 *   pnpm --filter korea-law exec ts-node src/sync/ordinance-sync-es.ts \
 *     --municipality 3070000 --limit 5
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { ElasticsearchClient, configFromEnv } from '../es/client';
import { processOrdinanceXml, ORDINANCES_INDEX, PipelineContext } from './ordinance-pipeline';
import {
  METROPOLITAN_GOVERNMENTS,
  BASIC_GOVERNMENTS_SAMPLE,
  LocalGovernment,
} from './local-governments';
import { isEmbedderAlive } from '../embedding/ordinance-embedder';

// ============================================
// Types
// ============================================

export interface SyncOptions {
  /** 특정 지자체 코드만 동기화. 미지정 시 전 광역+기초 */
  municipalityCode?: string;
  /** 한 지자체당 최대 처리 건수 (테스트용) */
  limitPerMunicipality?: number;
  /** state 파일 경로 (resume용) */
  stateFile?: string;
  /** ES 인덱스 refresh 모드 */
  refresh?: 'true' | 'false' | 'wait_for';
  /** 강제 재indexing (hash 비교 skip) */
  force?: boolean;
  /** 지자체 간 대기 시간 (ms) */
  delayBetweenMunicipalitiesMs?: number;
  /** 조례 간 대기 시간 (ms, 법제처 API rate limit) */
  delayBetweenOrdinancesMs?: number;
  /** 연결 가능한 ES 클라이언트 (테스트 주입용) */
  esClient?: ElasticsearchClient;
}

export interface MunicipalityResult {
  code: string;
  name: string;
  total: number;
  indexed: number;
  skipped: number;
  errors: number;
  errorMessages: Array<{ mst: string; title: string; error: string }>;
}

export interface SyncResult {
  startedAt: string;
  finishedAt: string;
  elapsedMs: number;
  municipalities: MunicipalityResult[];
  totals: {
    total: number;
    indexed: number;
    skipped: number;
    errors: number;
  };
}

/** resume 상태. 재시작 시 완료한 mst를 skip. */
interface SyncState {
  /** 완료한 (mst, hash) 쌍 — hash가 같으면 skip */
  completed: Record<string, string>;
  /** 마지막으로 처리한 지자체 코드 */
  lastMunicipality?: string;
  /** 마지막 업데이트 시각 */
  updatedAt: string;
}

// ============================================
// Main entry
// ============================================

const DEFAULT_STATE_FILE = path.resolve(process.cwd(), '.sync-state-ordinances.json');
const LAW_API_BASE = 'https://www.law.go.kr';

/**
 * 자치법규 ES 동기화 실행.
 */
export async function syncOrdinancesToEs(options: SyncOptions = {}): Promise<SyncResult> {
  const startedAt = new Date();
  const stateFile = options.stateFile || DEFAULT_STATE_FILE;
  const refresh = options.refresh || 'wait_for';
  const delayBetweenMunicipalitiesMs = options.delayBetweenMunicipalitiesMs ?? 1_000;
  const delayBetweenOrdinancesMs = options.delayBetweenOrdinancesMs ?? 300;

  console.log('═'.repeat(60));
  console.log('자치법규 → Elasticsearch 동기화');
  console.log(`  시작: ${startedAt.toISOString()}`);
  if (options.municipalityCode) console.log(`  대상: ${options.municipalityCode}`);
  if (options.limitPerMunicipality) console.log(`  limit/지자체: ${options.limitPerMunicipality}`);
  console.log('═'.repeat(60));

  // 사전 검증
  const embReady = await isEmbedderAlive();
  if (!embReady) {
    throw new Error('embedding-server not reachable (http://localhost:8082)');
  }

  const es = options.esClient || new ElasticsearchClient(configFromEnv());
  const hasIndex = await es.indexExists(ORDINANCES_INDEX);
  if (!hasIndex) {
    throw new Error(`ES index ${ORDINANCES_INDEX} missing. 먼저 매핑 생성 필요.`);
  }

  const state = loadState(stateFile);
  const targets = resolveTargets(options.municipalityCode);
  const results: MunicipalityResult[] = [];

  console.log(`  대상 지자체 ${targets.length}개\n`);

  for (let i = 0; i < targets.length; i++) {
    const gov = targets[i];
    const header = `[${i + 1}/${targets.length}] ${gov.name} (${gov.code})`;
    console.log(`\n${header}`);

    const result = await syncMunicipality({
      gov,
      es,
      state,
      stateFile,
      limit: options.limitPerMunicipality,
      refresh,
      force: options.force || false,
      delayBetweenOrdinancesMs,
    });

    state.lastMunicipality = gov.code;
    saveState(stateFile, state);

    console.log(
      `  → ${gov.name}: total=${result.total}, indexed=${result.indexed}, skipped=${result.skipped}, errors=${result.errors}`
    );

    results.push(result);

    if (i < targets.length - 1) {
      await delay(delayBetweenMunicipalitiesMs);
    }
  }

  const finishedAt = new Date();
  const totals = results.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      indexed: acc.indexed + r.indexed,
      skipped: acc.skipped + r.skipped,
      errors: acc.errors + r.errors,
    }),
    { total: 0, indexed: 0, skipped: 0, errors: 0 }
  );

  console.log('\n' + '═'.repeat(60));
  console.log('동기화 완료');
  console.log(`  총 조례: ${totals.total}`);
  console.log(`  indexed: ${totals.indexed}`);
  console.log(`  skipped (변경 없음): ${totals.skipped}`);
  console.log(`  errors: ${totals.errors}`);
  console.log(`  elapsed: ${((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)}s`);
  console.log('═'.repeat(60));

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    elapsedMs: finishedAt.getTime() - startedAt.getTime(),
    municipalities: results,
    totals,
  };
}

// ============================================
// 지자체 단위 sync
// ============================================

async function syncMunicipality(params: {
  gov: LocalGovernment & { parent?: string };
  es: ElasticsearchClient;
  state: SyncState;
  stateFile: string;
  limit?: number;
  refresh: 'true' | 'false' | 'wait_for';
  force: boolean;
  delayBetweenOrdinancesMs: number;
}): Promise<MunicipalityResult> {
  const { gov, es, state, stateFile, limit, refresh, force, delayBetweenOrdinancesMs } = params;

  const result: MunicipalityResult = {
    code: gov.code,
    name: gov.name,
    total: 0,
    indexed: 0,
    skipped: 0,
    errors: 0,
    errorMessages: [],
  };

  // 조례 메타 목록 수집 (지자체 이름으로 검색 + 결과 필터링)
  const metaList = await collectOrdinanceMetaList(gov.name, limit);
  result.total = metaList.length;
  console.log(`  메타 ${metaList.length}건 수집 (query="${gov.name}" 정확 매칭)`);

  if (metaList.length === 0) return result;

  for (let i = 0; i < metaList.length; i++) {
    const meta = metaList[i];
    const mst = String(meta.자치법규일련번호 || meta.mst || '');
    if (!mst) {
      result.errors++;
      continue;
    }

    try {
      // 본문 XML fetch
      const xml = await fetchOrdinanceXml(mst);
      const hash = sha256(xml);

      // 변경 감지: force가 아니고, 동일 hash이면 skip
      if (!force && state.completed[mst] === hash) {
        result.skipped++;
        process.stdout.write('.');
        continue;
      }

      // 파이프라인 실행
      const ctx: PipelineContext = {
        municipalityCode: gov.code,
        municipalityLevel: (gov as any).parent ? 2 : 1,
        parentMunicipalityCode: (gov as any).parent,
        rawHtmlHash: hash,
        esClient: es,
        refresh,
      };
      const piped = await processOrdinanceXml(xml, ctx);

      state.completed[mst] = hash;
      result.indexed++;
      process.stdout.write('+');

      // 10건마다 state 저장
      if (result.indexed % 10 === 0) saveState(stateFile, state);

      // 10건마다 개행
      if ((result.indexed + result.skipped) % 50 === 0) process.stdout.write('\n  ');
    } catch (e: any) {
      result.errors++;
      result.errorMessages.push({
        mst,
        title: String(meta.자치법규명 || ''),
        error: e.message || String(e),
      });
      process.stdout.write('x');
    }

    if (i < metaList.length - 1) {
      await delay(delayBetweenOrdinancesMs);
    }
  }

  process.stdout.write('\n');
  return result;
}

// ============================================
// 법제처 API 호출
// ============================================

/**
 * 지자체 이름으로 모든 조례 메타 페이지네이션 수집.
 *
 * 법제처 `org` 파라미터 코드 체계가 우리 BASIC_GOVERNMENTS_SAMPLE과 호환되지
 * 않아 (예: 3070000 → 0건), query 파라미터로 지자체명을 검색하고 응답의
 * `지자체기관명` 필드로 정확 필터링하는 방식을 사용한다.
 *
 * NOTE: 기존 api.searchOrdinances는 `<OrdinSearch>.ordin` 경로를 찾는데
 * 실제 API 응답은 `<law>` 태그라 빈 결과를 반환하는 버그가 있다. 다른 컨슈머
 * 영향 범위가 넓어 기존 함수를 수정하지 않고 본 파일에서 직접 fetch + 파싱.
 */
async function collectOrdinanceMetaList(govName: string, limit?: number): Promise<any[]> {
  const filtered: any[] = [];
  let page = 1;
  const pageSize = 100;
  const oc = process.env.KOREA_LAW_API_KEY || process.env.LAW_OC || 'theqwe2000';

  while (true) {
    const url =
      `${LAW_API_BASE}/DRF/lawSearch.do?OC=${oc}&target=ordin&type=XML` +
      `&query=${encodeURIComponent(govName)}&display=${pageSize}&page=${page}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let xmlText: string;
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`lawSearch HTTP ${response.status}`);
      }
      xmlText = await response.text();
    } finally {
      clearTimeout(timer);
    }

    const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });
    const parsed = parser.parse(xmlText);
    const raw = parsed?.OrdinSearch?.law;
    if (!raw) break;

    const items = Array.isArray(raw) ? raw : [raw];
    let matchedOnPage = 0;

    for (const item of items) {
      const org = String(item['지자체기관명'] || '').trim();
      // "서울특별시 광진구" 응답에서 "광진구" query와 정확 매칭.
      // endsWith(' ' + govName)으로 상위 지자체명 뒤에 오는 케이스 처리,
      // === govName으로 광역(서울특별시 등) 자체 케이스도 처리.
      if (org === govName || org.endsWith(' ' + govName)) {
        filtered.push(item);
        matchedOnPage++;
        if (limit && filtered.length >= limit) return filtered;
      }
    }

    if (items.length < pageSize) break;
    page++;
    await delay(200);
  }

  return filtered;
}

/**
 * MST로 조례 본문 XML 직접 fetch (기존 law-api에 없는 경로).
 */
export async function fetchOrdinanceXml(mst: string): Promise<string> {
  const oc = process.env.KOREA_LAW_API_KEY || process.env.LAW_OC || 'theqwe2000';
  const url = `${LAW_API_BASE}/DRF/lawService.do?OC=${oc}&target=ordin&MST=${mst}&type=XML`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`fetchOrdinanceXml(${mst}) HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

// ============================================
// State management
// ============================================

function loadState(stateFile: string): SyncState {
  if (!fs.existsSync(stateFile)) {
    return { completed: {}, updatedAt: new Date().toISOString() };
  }
  try {
    const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    return {
      completed: data.completed || {},
      lastMunicipality: data.lastMunicipality,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { completed: {}, updatedAt: new Date().toISOString() };
  }
}

function saveState(stateFile: string, state: SyncState): void {
  state.updatedAt = new Date().toISOString();
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    console.warn(`  ⚠️  state 저장 실패: ${(e as Error).message}`);
  }
}

// ============================================
// Helpers
// ============================================

function resolveTargets(municipalityCode?: string): Array<LocalGovernment & { parent?: string }> {
  const allBasic = BASIC_GOVERNMENTS_SAMPLE as Array<LocalGovernment & { parent?: string }>;
  const pool = [...METROPOLITAN_GOVERNMENTS, ...allBasic];

  if (municipalityCode) {
    const found = pool.find((g) => g.code === municipalityCode);
    if (!found) {
      throw new Error(`Unknown municipality code: ${municipalityCode}`);
    }
    return [found];
  }

  return pool;
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf-8').digest('hex').slice(0, 16);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// CLI
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const opts: SyncOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--municipality' || arg === '-m') {
      opts.municipalityCode = args[++i];
    } else if (arg === '--limit' || arg === '-l') {
      opts.limitPerMunicipality = parseInt(args[++i], 10);
    } else if (arg === '--force') {
      opts.force = true;
    } else if (arg === '--state') {
      opts.stateFile = args[++i];
    }
  }

  syncOrdinancesToEs(opts)
    .then((result) => {
      if (result.totals.errors > 0) process.exit(1);
    })
    .catch((e) => {
      console.error('\nFATAL:', e);
      process.exit(1);
    });
}
