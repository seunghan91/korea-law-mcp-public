/**
 * korea-law: Upstage Solar Embedding Module
 *
 * Upstage Solar Embedding API를 사용한 벡터 임베딩 생성
 * - embedding-passage: 문서/조문 임베딩용 (검색 대상)
 * - embedding-query: 검색 쿼리 임베딩용 (검색어)
 *
 * API: https://api.upstage.ai/v1/embeddings
 * 차원: 4096
 */

import OpenAI from 'openai';

// 환경 변수
const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY || '';
const UPSTAGE_BASE_URL = 'https://api.upstage.ai/v1';

// Upstage 클라이언트 (OpenAI SDK 호환)
let client: OpenAI | null = null;

// 모델 타입
export type EmbeddingModel = 'embedding-query' | 'embedding-passage';

// 임베딩 결과 타입
export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokens: number;
}

// 배치 임베딩 결과
export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
  totalTokens: number;
}

/**
 * Upstage 클라이언트 초기화
 */
export function initUpstageClient(apiKey?: string): OpenAI {
  const key = apiKey || UPSTAGE_API_KEY;

  if (!key) {
    throw new Error('UPSTAGE_API_KEY is required. Set it in environment variables or pass as parameter.');
  }

  client = new OpenAI({
    apiKey: key,
    baseURL: UPSTAGE_BASE_URL,
  });

  console.log('✅ Upstage Embedding Client initialized');
  return client;
}

/**
 * 클라이언트 가져오기
 */
function getClient(): OpenAI {
  if (!client) {
    return initUpstageClient();
  }
  return client;
}

/**
 * 단일 텍스트 임베딩 생성
 *
 * @param text - 임베딩할 텍스트
 * @param model - 모델 타입 (query: 검색어, passage: 문서)
 * @returns 4096차원 임베딩 벡터
 *
 * @example
 * // 검색 쿼리 임베딩
 * const queryEmbedding = await createEmbedding("해고 절차", "embedding-query");
 *
 * // 문서 임베딩
 * const docEmbedding = await createEmbedding("제23조 내용...", "embedding-passage");
 */
export async function createEmbedding(
  text: string,
  model: EmbeddingModel = 'embedding-passage'
): Promise<EmbeddingResult> {
  const openai = getClient();

  const response = await openai.embeddings.create({
    input: text,
    model: model,
  });

  return {
    embedding: response.data[0].embedding,
    model: response.model,
    tokens: response.usage?.total_tokens || 0,
  };
}

/**
 * 검색 쿼리 임베딩 생성 (편의 함수)
 */
export async function createQueryEmbedding(query: string): Promise<number[]> {
  const result = await createEmbedding(query, 'embedding-query');
  return result.embedding;
}

/**
 * 문서/조문 임베딩 생성 (편의 함수)
 */
export async function createPassageEmbedding(passage: string): Promise<number[]> {
  const result = await createEmbedding(passage, 'embedding-passage');
  return result.embedding;
}

/**
 * 배치 임베딩 생성
 *
 * @param texts - 임베딩할 텍스트 배열
 * @param model - 모델 타입
 * @param batchSize - 한 번에 처리할 텍스트 수 (기본: 100)
 * @returns 임베딩 벡터 배열
 *
 * @example
 * const articles = ["조문1 내용", "조문2 내용", ...];
 * const embeddings = await createBatchEmbeddings(articles, "embedding-passage");
 */
export async function createBatchEmbeddings(
  texts: string[],
  model: EmbeddingModel = 'embedding-passage',
  batchSize: number = 100
): Promise<BatchEmbeddingResult> {
  const openai = getClient();
  const allEmbeddings: number[][] = [];
  let totalTokens = 0;
  let modelUsed = '';

  // 배치 단위로 처리
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}...`);

    const response = await openai.embeddings.create({
      input: batch,
      model: model,
    });

    // 결과 수집
    for (const item of response.data) {
      allEmbeddings.push(item.embedding);
    }

    totalTokens += response.usage?.total_tokens || 0;
    modelUsed = response.model;

    // Rate limit 방지 (100 RPM)
    if (i + batchSize < texts.length) {
      await sleep(700); // 약 85 RPM
    }
  }

  return {
    embeddings: allEmbeddings,
    model: modelUsed,
    totalTokens,
  };
}

/**
 * 조문 텍스트 전처리
 * 임베딩 품질 향상을 위한 텍스트 정리
 */
export function preprocessArticleText(
  lawName: string,
  articleNo: string,
  articleTitle: string | null,
  content: string
): string {
  const parts: string[] = [];

  // 법령명 + 조문번호
  parts.push(`${lawName} ${articleNo}`);

  // 조문 제목 (있으면)
  if (articleTitle) {
    parts.push(`(${articleTitle})`);
  }

  // 본문 (줄바꿈 정리)
  const cleanContent = content
    .replace(/\n{3,}/g, '\n\n')  // 과도한 줄바꿈 정리
    .replace(/\s{2,}/g, ' ')     // 연속 공백 정리
    .trim();

  parts.push(cleanContent);

  return parts.join(' ');
}

/**
 * 코사인 유사도 계산
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 유틸리티 함수
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 내보내기
export {
  UPSTAGE_API_KEY,
  UPSTAGE_BASE_URL,
};
