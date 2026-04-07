# korea-law-mcp-public

> **한국 법령·판례·자치법규 검색을 위한 MCP 서버 (공개 버전)**
> 법제처 Open API + Elasticsearch 하이브리드 검색 + BGE-M3 임베딩 기반 RAG 도구.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-green.svg)](https://nodejs.org)

## 개요

한국 법률 AI 앱을 만들 때 반복적으로 필요한 검색·조회·검증 로직을 **MCP(Model Context Protocol) 도구**로 감싼 서버입니다.
본 리포는 [seunghan91/law](https://github.com/seunghan91/law) 모노레포에서 공개 가능한 부분만 발췌·sanitize한 공개 버전입니다.

### 지원하는 검색 대상

- **국가법령** — 법률·시행령·시행규칙·부령 (법제처 Open API)
- **자치법규** — 전국 17개 광역 + 243개 기초 지자체의 조례·규칙 (ES `ordinances_v1` 하이브리드 인덱스)
- **판례·결정례·해석례** — 법제처 통합 검색
- **행정규칙** — 훈령·예규·고시
- **헌법재판소 결정** — 위헌/합헌 결정문
- **용어사전** — 법률 전문 용어

### 핵심 차별점

- **Elasticsearch 하이브리드 검색** — BM25 (nori 형태소 분석기 + 법률 동의어 + 사용자 사전 120+) + Dense Vector (1024dim bbq_hnsw) + RRF fusion
- **조문/별표 구조화** — 자치법규 XML을 `article`/`appendix` 단위로 분리 저장 → LLM 컨텍스트 단위 인용 가능
- **쿼리 분류기** — 지자체명/법령명/처분 키워드 자동 감지 → 적절한 tier로 라우팅
- **Resumable sync** — 법제처 API rate limit 대응, SHA-256 해시 기반 변경 감지

---

## 모노레포 구조

```
korea-law-mcp-public/
├── packages/
│   ├── korea-law/              # 핵심 엔진 (검색, ES 클라이언트, 임베딩, 파서, sync)
│   │   ├── src/
│   │   │   ├── api/            # 법제처 Open API 클라이언트
│   │   │   ├── db/             # SQLite + Supabase/Postgres 추상화
│   │   │   ├── es/             # Elasticsearch HTTP 클라이언트 (fetch 기반)
│   │   │   ├── embedding/      # BGE-M3 호출 wrapper
│   │   │   ├── sync/           # 자치법규/법령 sync 파이프라인 (resumable)
│   │   │   │   ├── ordinance-parser.ts      # 법제처 XML → 조문/별표 분리
│   │   │   │   └── ordinance-sync-es.ts     # ES indexer
│   │   │   ├── tools/
│   │   │   │   └── ordinance-tools.ts       # 5개 MCP 도구 (RRF 하이브리드)
│   │   │   └── index.ts        # public API export
│   │   └── package.json
│   │
│   └── korea-law-mcp/          # Express REST 래퍼 (40+ 도구 HTTP 엔드포인트)
│       ├── src/index.ts        # POST /tools/<name> 라우트
│       └── package.json
│
├── package.json                # pnpm workspace root
└── pnpm-workspace.yaml
```

---

## 빠른 시작

### 전제
- Node.js 22+
- pnpm 9+
- 법제처 Open API 인증키 (`LAW_OC`) — [무료 발급](https://open.law.go.kr/LSO/openApi/guideList.do)
- (선택) Elasticsearch 9.x + BGE-M3 임베딩 서버 — 자치법규 하이브리드 검색용

### 설치 + 실행

```bash
git clone https://github.com/seunghan91/korea-law-mcp-public.git
cd korea-law-mcp-public
pnpm install
pnpm build

# 환경변수 설정 (최소)
export KOREA_LAW_API_KEY=your_oc_key_from_law_go_kr

# (선택) ES 하이브리드 검색 활성화
export ELASTICSEARCH_ADDR=https://your-es-cluster:443
export ELASTICSEARCH_USERNAME=elastic
export ELASTICSEARCH_PASSWORD=your_password

# 서버 실행
pnpm dev:mcp
# → http://localhost:3001
```

### 자치법규 ES 인덱스 초기화 (선택)

ES 하이브리드 검색을 쓰려면:
1. `packages/korea-law/src/es/ordinances-mapping.json` 참고하여 `ordinances_v1` 인덱스 생성
2. BGE-M3 임베딩 서버 기동 (별도 — [upskyy/bge-m3-korean](https://huggingface.co/upskyy/bge-m3-korean) 또는 [nlpai-lab/KURE-v1](https://huggingface.co/nlpai-lab/KURE-v1) 권장)
3. `pnpm sync:ordinances --municipality 광진구 --limit 5` 로 작은 샘플부터

---

## 주요 MCP 도구 (요약)

| 도구 | 설명 |
|---|---|
| `search_across_laws` | 국가법령 통합 검색 |
| `get_law_text` | 법령 본문 조회 |
| `search_precedents` | 판례 검색 |
| `verify_case_exists` | 판례 존재 여부 검증 |
| `search_legal_interpretations` | 해석례 검색 |
| `search_constitutional_decisions` | 헌재 결정 검색 |
| **`search_ordinances`** | **자치법규 하이브리드 검색 (BM25+KNN+RRF)** |
| **`get_ordinance_text`** | **자치법규 본문 (조문+별표)** |
| **`get_ordinance_article`** | **특정 조문 조회** |
| **`compare_ordinances_across_municipalities`** | **지자체별 비교** |
| **`list_municipalities`** | **전국 지자체 마스터** |

굵은 표시 = 본 리포의 고유 확장 (Elasticsearch 기반)

---

## 유사 프로젝트 비교

| 프로젝트 | 데이터 소스 | 검색 방식 | 자치법규 | 형태소 분석 | 벡터 검색 |
|---|---|---|---|---|---|
| [chrisryugj/korean-law-mcp](https://github.com/chrisryugj/korean-law-mcp) (류주임) | 법제처 Open API | substring | `chain_ordinance_compare` | ❌ | ❌ |
| **korea-law-mcp-public** (본 리포) | 법제처 + 자체 ES 인덱스 | BM25 + 벡터 + RRF | ES `ordinances_v1` (조문 단위) | nori + 법률 동의어 | BGE-M3 1024dim |

**보완 관계**: 류주임 프로젝트는 법제처 공식 API의 **얇은 래퍼**, 본 리포는 그 위에 **검색 엔진 기반 RAG 인프라**를 추가한 형태. Claude Desktop에 **둘 다 등록**해 병행 사용 권장.

---

## 라이선스

MIT. 자유롭게 포크·수정·배포·상업 사용 가능.

---

## 관련 링크

- [원본 monorepo (private)](https://github.com/seunghan91/law)
- [설계 문서 (자치법규 ES 인덱싱)](https://github.com/seunghan91/law/blob/main/docs/todo/09-ordinance-elasticsearch-indexing.md)
- [법제처 Open API](https://open.law.go.kr)
- [류주임 korean-law-mcp](https://github.com/chrisryugj/korean-law-mcp)
- [BGE-M3 임베딩 모델](https://huggingface.co/BAAI/bge-m3)
- [KURE-v1 (한국어 BGE-M3 파인튜닝)](https://huggingface.co/nlpai-lab/KURE-v1)
