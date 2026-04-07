/**
 * 자치법규 임베딩 생성 래퍼.
 *
 * weknora/embedding-server의 OpenAI 호환 API를 호출.
 *
 *   POST /v1/embeddings
 *   { "input": ["text1", "text2", ...] }
 *
 *   → { "data": [{ "embedding": [...1024], "index": 0 }, ...] }
 *
 * 모델: upskyy/bge-m3-korean (SentenceTransformer, 1024dim, normalize=true)
 *   - 이미 단위 벡터로 정규화되어 ES cosine similarity에 그대로 사용 가능
 *
 * 설계 문서: docs/todo/09-ordinance-elasticsearch-indexing.md §4 (Sync 파이프라인)
 */

/** 임베딩 서버 설정 */
export interface EmbedderConfig {
  /** 엔드포인트 base URL (예: http://localhost:8082, http://embedding-server:8082) */
  baseUrl: string;
  /** 임베딩 차원 (BGE-M3 = 1024) */
  dimension: number;
  /** 배치 크기 (한 번의 API 호출로 처리할 텍스트 수) */
  batchSize: number;
  /** API 호출 타임아웃 (ms) */
  timeoutMs: number;
  /** 실패 시 재시도 횟수 */
  maxRetries: number;
  /** 재시도 간 백오프 (ms) */
  retryBackoffMs: number;
}

export const DEFAULT_EMBEDDER_CONFIG: EmbedderConfig = {
  baseUrl: process.env.ORDINANCE_EMBEDDING_BASE_URL || 'http://localhost:8082',
  dimension: 1024,
  batchSize: 32,
  timeoutMs: 60_000,
  maxRetries: 3,
  retryBackoffMs: 2_000,
};

export class OrdinanceEmbedderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'OrdinanceEmbedderError';
  }
}

/**
 * 주어진 텍스트 배열에 대해 임베딩 벡터 배열을 생성.
 * 배치 처리 + 재시도 로직 내장.
 *
 * @param texts 임베딩할 텍스트 배열
 * @param config 선택적 설정 오버라이드
 * @returns texts와 동일한 순서의 1024차원 벡터 배열
 */
export async function embedTexts(
  texts: string[],
  config: Partial<EmbedderConfig> = {}
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const cfg: EmbedderConfig = { ...DEFAULT_EMBEDDER_CONFIG, ...config };
  const results: number[][] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += cfg.batchSize) {
    const batch = texts.slice(i, i + cfg.batchSize);
    const vectors = await embedBatch(batch, cfg);
    vectors.forEach((v, j) => {
      results[i + j] = v;
    });
  }

  return results;
}

/**
 * 단일 텍스트에 대한 임베딩 생성 (편의용).
 */
export async function embedOne(text: string, config: Partial<EmbedderConfig> = {}): Promise<number[]> {
  const results = await embedTexts([text], config);
  return results[0];
}

/**
 * 임베딩 서버 health check.
 * @returns true if reachable
 */
export async function isEmbedderAlive(config: Partial<EmbedderConfig> = {}): Promise<boolean> {
  const cfg: EmbedderConfig = { ...DEFAULT_EMBEDDER_CONFIG, ...config };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const response = await fetch(`${cfg.baseUrl}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// Internal helpers
// ============================================

async function embedBatch(batch: string[], cfg: EmbedderConfig): Promise<number[][]> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < cfg.maxRetries; attempt++) {
    try {
      return await callEmbeddingApi(batch, cfg);
    } catch (e) {
      lastError = e;
      if (attempt < cfg.maxRetries - 1) {
        await delay(cfg.retryBackoffMs * (attempt + 1));
      }
    }
  }

  throw new OrdinanceEmbedderError(
    `embedding failed after ${cfg.maxRetries} attempts: ${String(lastError)}`,
    lastError
  );
}

async function callEmbeddingApi(batch: string[], cfg: EmbedderConfig): Promise<number[][]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const response = await fetch(`${cfg.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: batch }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new OrdinanceEmbedderError(`embedding API HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ embedding: number[]; index: number }>;
    };

    if (!data.data || !Array.isArray(data.data)) {
      throw new OrdinanceEmbedderError('invalid embedding API response (no data array)');
    }

    // index로 정렬하여 원본 순서 보장
    const sorted = [...data.data].sort((a, b) => a.index - b.index);
    const vectors = sorted.map((item) => item.embedding);

    // 차원 검증
    vectors.forEach((vec, i) => {
      if (!Array.isArray(vec) || vec.length !== cfg.dimension) {
        throw new OrdinanceEmbedderError(
          `embedding dimension mismatch at index ${i}: expected ${cfg.dimension}, got ${vec?.length}`
        );
      }
    });

    return vectors;
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
