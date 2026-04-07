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

export function configFromEnv(): ElasticsearchConfig {
  const url = process.env.ELASTICSEARCH_ADDR || process.env.ELASTICSEARCH_URL;
  const username = process.env.ELASTICSEARCH_USERNAME;
  const password = process.env.ELASTICSEARCH_PASSWORD;

  if (!url || !username || !password) {
    throw new Error(
      'Elasticsearch config missing. Set ELASTICSEARCH_ADDR/URL, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD.'
    );
  }

  return {
    url: url.replace(/\/+$/, ''),
    username,
    password,
    timeoutMs: 60_000,
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
