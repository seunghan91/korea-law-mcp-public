# Korea Law MCP Server

대한민국 법률 검증 MCP(Model Context Protocol) 서버 - HTTP 래퍼

> ⚠️ **중요**: 이 서비스는 AI 법률 검증 보조 도구입니다. 법적 판단의 최종 근거로 사용하지 마세요.

## 개요

이 서버는 `korea-law` NPM 패키지를 HTTP API로 래핑하여 Rails/Flutter 앱에서 접근할 수 있도록 합니다.

## 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Rails API     │────▶│  korea-law-mcp  │────▶│   korea-law     │
│   Flutter App   │     │  (HTTP Wrapper) │     │   (NPM Package) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              ▼                        ▼
                        Port 3001               SQLite DB
```

## 기능 (MCP Tools)

| Tool | 설명 |
|------|------|
| `audit_statute` | 법령 조문 검증 |
| `check_enforcement_date` | 시행일 확인 |
| `verify_case_exists` | 판례 실존 확인 |
| `get_daily_diff` | 일일 변경 사항 조회 |
| `audit_contract_timeline` | 계약 기간 법령 검증 |
| `check_legal_definition` | 법률 용어 정의 조회 |

## 설치

```bash
cd services/korea-law-mcp
pnpm install
```

## 개발 모드 실행

```bash
pnpm run dev
```

서버가 `http://localhost:3001`에서 시작됩니다.

## 빌드 및 실행

```bash
pnpm run build
pnpm run start
```

## Docker 실행

```bash
# 빌드
docker build -t korea-law-mcp .

# 실행
docker run -p 3001:3001 -v $(pwd)/data:/app/data korea-law-mcp

# 또는 docker-compose 사용
docker-compose up -d
```

## 데이터 동기화

```bash
# 기본 법령 동기화
pnpm run sync

# 전체 동기화 (법령 + 판례 + 용어)
pnpm run sync:all
```

## API 엔드포인트

### Health Check
```
GET /health
Response: { "status": "ok", "version": "1.0.0" }
```

### 1. 법령 검증
```bash
POST /tools/audit_statute
Content-Type: application/json

{
  "law_name": "근로기준법",
  "article_number": "23"
}
```

### 2. 시행일 확인
```bash
POST /tools/check_enforcement_date
Content-Type: application/json

{
  "law_name": "개인정보보호법"
}
```

### 3. 판례 실존 확인
```bash
POST /tools/verify_case_exists
Content-Type: application/json

{
  "case_number": "2023다12345"
}
```

### 4. 일일 변경 사항
```bash
POST /tools/get_daily_diff
Content-Type: application/json

{
  "date": "2024-12-16"
}
```

### 5. 계약 기간 분석
```bash
POST /tools/audit_contract_timeline
Content-Type: application/json

{
  "start_date": "2024-01-01",
  "end_date": "2025-12-31",
  "relevant_statutes": ["민법", "상법"]
}
```

### 6. 법률 용어 정의
```bash
POST /tools/check_legal_definition
Content-Type: application/json

{
  "law_name": "민법",
  "term": "계약"
}
```

## 환경 설정

`.env.example`을 `.env`로 복사하고 설정하세요:

```bash
cp .env.example .env
```

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `MCP_PORT` | 서버 포트 | 3001 |
| `MCP_HOST` | 서버 호스트 | 0.0.0.0 |
| `DATABASE_PATH` | SQLite DB 경로 | ./data/korea-law.db |
| `KOREA_LAW_API_KEY` | 국가법령정보센터 API 키 | - |

## 의존성

- **korea-law**: MCP 핵심 기능 (NPM 패키지)
- **express**: HTTP 서버
- **dotenv**: 환경변수 관리

## 관련 문서

- [OpenAPI Spec](../../shared/api-contracts/openapi.yaml)
- [korea-law 패키지](../../law_kr/README.md)
- [MCP 통합 가이드](../../docs/todo/03-mcp-integration.md)

## 데이터 소스

- **주요 출처**: 국가법령정보센터 (https://law.go.kr)
- **업데이트 주기**: 매일 자정 (GitHub Actions)
- **데이터 범위**: 대한민국 현행 법령

## 라이선스

MIT
# PostgreSQL support added - Fri Dec 19 11:23:33 KST 2025
# PostgreSQL support added - Fri Dec 19 11:28:15 KST 2025
# Hybrid module fix - Fri Dec 19 11:33:47 KST 2025
# Version bump v1.1.2 - Fri Dec 19 13:43:52 KST 2025
# Dynamic import fix - Fri Dec 19 13:47:50 KST 2025
# Removed sync exports - Fri Dec 19 13:53:05 KST 2025
# Dynamic imports fix - Fri Dec 19 14:00:19 KST 2025
# Dynamic postgres import - Fri Dec 19 14:15:35 KST 2025
