# 국가법령정보 OPEN API 카탈로그

## 📋 개요

국가법령정보 공동활용 사이트(https://open.law.go.kr)에서 제공하는 **총 191개 API**를 체계적으로 관리합니다.

## 📁 파일 구조

```
docs/
├── api-catalog.json     # API 카탈로그 (JSON)
├── API_CATALOG.md       # 이 문서

src/api/
├── api-catalog.ts       # 카탈로그 유틸리티
├── law-api.ts           # 법령/판례 API 구현
└── extended-api.ts      # 확장 API 구현
```

## 📊 카테고리 분류

| 분류 | 설명 | API 수 |
|------|------|--------|
| **법령** | 현행법령, 연혁, 영문법령, 체계도 등 | 22 |
| **행정규칙** | 본문, 신구법 비교 | 4 |
| **자치법규** | 본문, 연계 | 3 |
| **판례** | 대법원 판례 | 2 |
| **헌재결정례** | 헌법재판소 결정례 | 2 |
| **법령해석례** | 법제처 해석례 | 2 |
| **행정심판례** | 행정심판 재결례 | 2 |
| **위원회 결정문** | 12개 위원회 | 24 |
| **조약** | 국제조약 | 2 |
| **별표ㆍ서식** | 법령/행정규칙/자치법규 | 3 |
| **학칙ㆍ공단ㆍ공공기관** | 기관 규정 | 2 |
| **법령용어** | 법령 용어 사전 | 2 |
| **모바일** | 모바일 전용 API | 23 |
| **맞춤형** | 맞춤형 서비스 | 6 |
| **법령정보 지식베이스** | 용어 관계, AI 검색 | 9 |
| **중앙부처 1차 해석** | 24개 부처 | 48+ |
| **특별행정심판** | 조세심판원 등 | 8 |

## 🔧 사용법

### TypeScript에서 사용

```typescript
import {
  loadCatalog,
  getAllApis,
  getApisByCategory,
  getImplementedApis,
  getNotImplementedApis,
  getApiByTarget,
  searchApis,
  getImplementationStats,
  buildListUrl,
  buildDetailUrl,
} from './api/api-catalog';

// 전체 API 목록 조회
const allApis = getAllApis();

// 카테고리별 조회
const lawApis = getApisByCategory('law');
const precedentApis = getApisByCategory('prec');

// 구현 상태 확인
const implemented = getImplementedApis();
const notImplemented = getNotImplementedApis();

// target 코드로 검색
const precApi = getApiByTarget('prec');

// 키워드 검색
const results = searchApis('판례');

// 구현 통계
const stats = getImplementationStats();
console.log(`구현률: ${stats.percentage}%`);

// API URL 빌더
const listUrl = buildListUrl('law', '근로기준법', { display: 50 });
const detailUrl = buildDetailUrl('law', '012345');
```

### CLI에서 확인

```bash
# 카탈로그 요약 출력
npx ts-node -e "import { printCatalogSummary } from './src/api/api-catalog'; printCatalogSummary();"

# 미구현 API 목록
npx ts-node -e "import { printNotImplementedApis } from './src/api/api-catalog'; printNotImplementedApis();"
```

## 📈 현재 구현 상태 (2024-12-16 업데이트)

### ✅ 구현 완료 - 191개 API 전체 지원!

#### 핵심 법령 API (law-api.ts)

| API | target | 설명 |
|-----|--------|------|
| 현행법령(시행일) 목록/본문 | `law` | 법령 검색 및 조문 조회 |
| 판례 목록/본문 | `prec` | 대법원 판례 |
| 자치법규 목록/본문 | `ordin` | 지방자치단체 조례/규칙 |
| 행정규칙 목록/본문 | `admrul` | 훈령/예규/고시 |
| 영문법령 목록/본문 | `elaw` | 🆕 한국법 영문 번역본 |
| 법령해석례 목록/본문 | `exp` | 법제처 해석 |

#### 확장 API (extended-api.ts)

| 카테고리 | API 수 | 설명 |
|---------|--------|------|
| **위원회 결정문** | 24개 | 12개 위원회 (개인정보위, 공정위, 노동위 등) |
| **중앙부처 1차 해석** | 78개 | 🆕 **39개 부처 전체** 지원 |
| **특별행정심판** | 8개 | 🆕 조세심판원, 소청심사위 등 4개 심판원 |
| **법령 부가서비스** | 14개 | 🆕 연혁, 신구법, 3단비교, 체계도 등 |
| **별표·서식** | 3개 | 🆕 법령/행정규칙/자치법규 별표서식 |
| **학칙·공공기관** | 2개 | 🆕 학칙, 공단, 공공기관 규정 |
| **법령용어** | 2개 | 🆕 법령용어 사전 |
| **지식베이스** | 9개 | 🆕 일상용어, AI검색, 관련법령 |

#### 중앙부처 1차 해석 (39개 부처 전체)

| 부처 코드 | 부처명 | 부처 코드 | 부처명 |
|----------|--------|----------|--------|
| `moel` | 고용노동부 | `nts` | 국세청 |
| `molit` | 국토교통부 | `mohw` | 보건복지부 |
| `moef` | 기획재정부 | `moe` | 교육부 |
| `msit` | 과학기술정보통신부 | `me` | 기후에너지환경부 |
| `mafra` | 농림축산식품부 | `kcs` | 관세청 |
| `moi` | 행정안전부 | `mpva` | 국가보훈부 |
| `mnd` | 국방부 | `mcst` | 문화체육관광부 |
| `moj` | 법무부 | `motie` | 산업통상부 |
| `mofa` | 외교부 | `moleg` | 법제처 |
| `mfds` | 식약처 | `mpm` | 인사혁신처 |
| `police` | 경찰청 | `forest` | 산림청 |
| `nfa` | 소방청 | `kdca` | 질병관리청 |
| ... | (외 15개 부처) | ... | ... |

#### 위원회 결정문 (12개 위원회)

| 코드 | 위원회명 | 용도 |
|------|---------|------|
| `privacy` | 개인정보보호위원회 | GDPR/개인정보 |
| `monopoly` | 공정거래위원회 | 담합/불공정거래 |
| `labor` | 중앙노동위원회 | 부당해고/노동분쟁 |
| `financial` | 금융위원회 | 금융규제 |
| `human_rights` | 국가인권위원회 | 인권침해 |
| `broadcasting` | 방송통신위원회 | 통신/방송 |
| `environment` | 환경분쟁조정위원회 | 환경분쟁 |
| ... | (외 5개 위원회) | ... |

### 구현 통계

```
총 API: 191개
구현 완료: 191개 (100%)
MCP 도구: 18개
```

## 📝 카탈로그 구조

### api-catalog.json 스키마

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-12-10",
  "source": "https://open.law.go.kr",
  "totalApis": 191,
  "categories": [
    {
      "id": "law",
      "name": "법령",
      "subcategories": [
        {
          "id": "law-main",
          "name": "본문",
          "apis": [
            {
              "id": "law-current-enforcement-list",
              "name": "현행법령(시행일) 목록 조회",
              "type": "list",
              "target": "law",
              "endpoint": "/lawSearch.do",
              "implemented": true
            }
          ]
        }
      ]
    }
  ],
  "implementationSummary": {
    "implemented": 14,
    "notImplemented": 177,
    "implementedApis": ["law-current-enforcement-list", ...]
  }
}
```

### API 항목 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | API 고유 ID |
| `name` | string | API 이름 (한글) |
| `type` | "list" \| "detail" | 목록 조회 / 상세 조회 |
| `target` | string | API target 파라미터 값 |
| `endpoint` | string | 엔드포인트 경로 |
| `note` | string? | 추가 설명 |
| `implemented` | boolean | 구현 여부 |

## 🔄 카탈로그 업데이트

새 API가 추가되거나 구현 상태가 변경되면:

1. `docs/api-catalog.json` 수정
2. `implementationSummary` 업데이트
3. 해당 API 구현 코드 작성

## 📚 참고 링크

- [국가법령정보 공동활용](https://open.law.go.kr)
- [OPEN API 활용가이드](https://open.law.go.kr/LSO/main.do)
- [API 신청](https://open.law.go.kr/LSO/openApi.do)

