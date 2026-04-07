/**
 * Elasticsearch HTTP 클라이언트 (얇은 wrapper).
 *
 * @elastic/elasticsearch 공식 클라이언트 대신 Node 18+ 내장 fetch 사용.
 * 이유:
 *  - 의존성 최소화
 *  - 공식 클라이언트는 ES 버전과 클라이언트 버전을 매칭해야 해서 업그레이드 부담
 *  - 자치법규 용도로는 basic CRUD + bulk + search + analyze 정도만 필요
 *
 * 추후 판례/해석례 등 인덱스 추가 시 공식 클라이언트로 마이그레이션 검토.
 *
 * 설계 문서: docs/todo/09-ordinance-elasticsearch-indexing.md §2
 */

export interface ElasticsearchConfig {
  /** 엔드포인트 (예: https://df153d...asia-southeast1.gcp.elastic-cloud.com:443) */
  url: string;
  /** Basic auth username */
  username: string;
  /** Basic auth password */
  password: string;
  /** 요청 타임아웃 (ms) */
  timeoutMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SaaS 프록시 모드 — Law Check MCP 호스팅 서비스를 통해 자치법규 도구를 호출.
//
// 사용자는 ELASTICSEARCH_* 자격증명 없이 LAW_CHECK_API_KEY 하나만 설정하면
// https://www.law-check.com/api/mcp (JSON-RPC 2.0) 를 경유하여 우리가 운영 중인
// weknora_legal_v2 / ordinances_v1 ES 클러스터에 질의할 수 있다.
//
// 이 모드는 korea-law npm 패키지 OSS 사용자가 자체 ES 클러스터를 구성하지 않고도
// 자치법규 하이브리드 검색을 바로 쓸 수 있게 하는 것이 목적이다. 본인 ES 클러스터를
// 운영해서 별도 인덱스 / 스키마 변형을 하려는 power user 는 여전히 ELASTICSEARCH_*
// 직접 경로를 사용할 수 있다.
//
// 배경 / 설계 결정: Law Check MCP v2.0 (apps/legal_audit_web/docs/MCP_SERVER_REDESIGN.md)
// ─────────────────────────────────────────────────────────────────────────────

export interface SaasConfig {
  /** Law Check MCP JSON-RPC 엔드포인트 */
  endpoint: string;
  /** UserMcpKey 64-hex Bearer */
  apiKey: string;
  /** 요청 타임아웃 (ms) */
  timeoutMs: number;
}

export type RuntimeConfig =
  | { mode: 'direct'; es: ElasticsearchConfig }
  | { mode: 'saas'; saas: SaasConfig };

/**
 * 환경변수에서 런타임 설정을 로드한다.
 *
 * 우선순위:
 *   1. LAW_CHECK_API_KEY 있음 → saas 모드 (권장, 설정 최소화)
 *   2. ELASTICSEARCH_ADDR + USERNAME + PASSWORD 있음 → direct 모드 (OSS 셀프호스트)
 *   3. 둘 다 없음 → 에러
 *
 * 하위호환: 기존 configFromEnv() 호출부는 direct 모드 ES 설정만 반환받도록 오버로드.
 */
export function configFromEnv(): ElasticsearchConfig {
  const runtime = runtimeConfigFromEnv();
  if (runtime.mode === 'saas') {
    throw new Error(
      'configFromEnv() called but LAW_CHECK_API_KEY is set (saas mode). ' +
      'Use runtimeConfigFromEnv() instead, or unset LAW_CHECK_API_KEY to force direct ES mode.'
    );
  }
  return runtime.es;
}

export function runtimeConfigFromEnv(): RuntimeConfig {
  // 1) SaaS 모드 (권장) — Law Check MCP 경유
  const apiKey = process.env.LAW_CHECK_API_KEY;
  if (apiKey) {
    if (!/^[a-f0-9]{64}$/i.test(apiKey.trim())) {
      throw new Error(
        'LAW_CHECK_API_KEY must be a 64-char hex string. ' +
        'Get one at https://www.law-check.com/settings/mcp-keys'
      );
    }
    return {
      mode: 'saas',
      saas: {
        endpoint: process.env.LAW_CHECK_MCP_URL || 'https://www.law-check.com/api/mcp',
        apiKey: apiKey.trim(),
        timeoutMs: Number(process.env.LAW_CHECK_TIMEOUT_MS || 60_000),
      },
    };
  }

  // 2) Direct ES 모드 — 셀프호스트 ES 클러스터
  const url = process.env.ELASTICSEARCH_ADDR || process.env.ELASTICSEARCH_URL;
  const username = process.env.ELASTICSEARCH_USERNAME;
  const password = process.env.ELASTICSEARCH_PASSWORD;

  if (!url || !username || !password) {
    throw new Error(
      'korea-law ordinance tools need either:\n' +
      '  (recommended) LAW_CHECK_API_KEY=<64-hex>            # saas mode — use Law Check hosted service\n' +
      '  (self-host)    ELASTICSEARCH_ADDR + ELASTICSEARCH_USERNAME + ELASTICSEARCH_PASSWORD\n\n' +
      'Get a hosted API key at https://www.law-check.com/settings/mcp-keys'
    );
  }

  return {
    mode: 'direct',
    es: {
      url: url.replace(/\/+$/, ''),
      username,
      password,
      timeoutMs: 60_000,
    },
  };
}

export class ElasticsearchError extends Error {
  constructor(message: string, public readonly statusCode?: number, public readonly responseBody?: string) {
    super(message);
    this.name = 'ElasticsearchError';
  }
}

export class ElasticsearchClient {
  constructor(private readonly config: ElasticsearchConfig) {}

  /**
   * 임의 ES HTTP 요청.
   */
  async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
    path: string,
    options: { body?: unknown; contentType?: string } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      const headers: Record<string, string> = {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      };

      let body: string | undefined;
      if (options.body !== undefined) {
        headers['Content-Type'] = options.contentType || 'application/json';
        body = options.contentType === 'application/x-ndjson' && typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body);
      }

      const fullUrl = `${this.config.url}${path.startsWith('/') ? path : '/' + path}`;
      const response = await fetch(fullUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      if (!response.ok) {
        throw new ElasticsearchError(
          `${method} ${path} failed: HTTP ${response.status}`,
          response.status,
          text.slice(0, 500)
        );
      }

      if (method === 'HEAD' || !text) {
        return undefined as T;
      }
      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 인덱스 존재 여부 확인.
   */
  async indexExists(indexName: string): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      const response = await fetch(`${this.config.url}/${indexName}`, {
        method: 'HEAD',
        headers: { Authorization: `Basic ${auth}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 단일 문서 indexing (upsert).
   */
  async index(
    indexName: string,
    id: string,
    document: Record<string, unknown>,
    opts: { refresh?: 'true' | 'false' | 'wait_for' } = {}
  ): Promise<{ result: string; _id: string }> {
    const query = opts.refresh ? `?refresh=${opts.refresh}` : '';
    return this.request('PUT', `/${indexName}/_doc/${encodeURIComponent(id)}${query}`, { body: document });
  }

  /**
   * 벌크 indexing. docs 배열을 _bulk API로 전송.
   * @param indexName 대상 인덱스
   * @param docs id + document 쌍
   * @param opts.refresh indexing 후 즉시 refresh 여부
   */
  async bulkIndex(
    indexName: string,
    docs: Array<{ id: string; doc: Record<string, unknown> }>,
    opts: { refresh?: 'true' | 'false' | 'wait_for' } = {}
  ): Promise<BulkResponse> {
    if (docs.length === 0) {
      return { took: 0, errors: false, items: [] };
    }

    // NDJSON 포맷: 각 doc당 2 lines (action + source)
    const lines: string[] = [];
    docs.forEach(({ id, doc }) => {
      lines.push(JSON.stringify({ index: { _index: indexName, _id: id } }));
      lines.push(JSON.stringify(doc));
    });
    const body = lines.join('\n') + '\n';

    const query = opts.refresh ? `?refresh=${opts.refresh}` : '';
    return this.request<BulkResponse>('POST', `/_bulk${query}`, {
      body,
      contentType: 'application/x-ndjson',
    });
  }

  /**
   * 검색.
   */
  async search<T = unknown>(indexName: string, query: Record<string, unknown>): Promise<SearchResponse<T>> {
    return this.request<SearchResponse<T>>('POST', `/${indexName}/_search`, { body: query });
  }

  /**
   * 형태소 분석 테스트 (디버깅용).
   */
  async analyze(
    indexName: string,
    params: { analyzer?: string; text: string }
  ): Promise<{ tokens: Array<{ token: string; position: number; type: string }> }> {
    return this.request('POST', `/${indexName}/_analyze`, { body: params });
  }

  /**
   * 인덱스 삭제.
   */
  async deleteIndex(indexName: string): Promise<void> {
    try {
      await this.request('DELETE', `/${indexName}`);
    } catch (e) {
      if (e instanceof ElasticsearchError && e.statusCode === 404) return;
      throw e;
    }
  }
}

// ============================================
// Response types
// ============================================

export interface BulkResponse {
  took: number;
  errors: boolean;
  items: Array<Record<string, unknown>>;
}

export interface SearchResponse<T = unknown> {
  took: number;
  timed_out: boolean;
  hits: {
    total: { value: number; relation: 'eq' | 'gte' };
    max_score: number | null;
    hits: Array<{
      _index: string;
      _id: string;
      _score: number;
      _source: T;
      highlight?: Record<string, string[]>;
    }>;
  };
}
