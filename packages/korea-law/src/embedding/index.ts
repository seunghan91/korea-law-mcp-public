/**
 * korea-law: Embedding Module
 *
 * Upstage Solar Embedding을 사용한 벡터 임베딩 생성 및 검색
 */

export {
  // 클라이언트
  initUpstageClient,

  // 임베딩 생성
  createEmbedding,
  createQueryEmbedding,
  createPassageEmbedding,
  createBatchEmbeddings,

  // 유틸리티
  preprocessArticleText,
  cosineSimilarity,

  // 타입
  type EmbeddingModel,
  type EmbeddingResult,
  type BatchEmbeddingResult,

  // 상수
  UPSTAGE_API_KEY,
  UPSTAGE_BASE_URL,
} from './upstage-embedding';
