# 확장 API 사용 가이드

## 📋 개요

korea-law 패키지는 국가법령정보센터의 확장 API를 지원합니다.
기본 법령/판례 외에 유권해석, 헌재결정, 위원회 결정문 등을 검색할 수 있습니다.

---

## 🚀 빠른 시작

```typescript
import { extendedApi } from 'korea-law';

// 법령해석례 검색
const interpretations = await extendedApi.searchLegalInterpretations('근로기준법', 10);

// 헌재결정례 검색
const decisions = await extendedApi.searchConstitutionalDecisions('위헌', 10);

// 공정위 결정문 검색
const ftcDecisions = await extendedApi.searchCommitteeDecisions('monopoly', '담합', 10);
```

---

## 📚 API 목록

### 1. 법령해석례 (법제처)

법제처에서 발행한 공식 법령해석을 검색합니다.

```typescript
// 검색
const results = await extendedApi.searchLegalInterpretations('퇴직금', 20);

// 상세 조회
const detail = await extendedApi.getLegalInterpretationDetail('333393');

// 응답 예시
{
  법령해석일련번호: 333393,
  안건명: "근로기준법 제74조 관련",
  안건번호: "22-0186",
  회신기관명: "법제처",
  회신일자: "2022.04.26",
  질의요지: "...",
  회답: "..."
}
```

### 2. 헌재결정례

헌법재판소의 결정례를 검색합니다.

```typescript
// 검색
const results = await extendedApi.searchConstitutionalDecisions('위헌', 20);

// 상세 조회
const detail = await extendedApi.getConstitutionalDecisionDetail('177507');

// 응답 예시
{
  헌재결정일련번호: 177507,
  사건번호: "2022헌마1312",
  사건명: "112신고 결과 메세지 미전송 위헌확인",
  종국일자: "2022.09.20",
  결정유형: "각하"
}
```

### 3. 행정심판례

행정심판 재결례를 검색합니다.

```typescript
// 검색
const results = await extendedApi.searchAdminAppeals('허가취소', 20);

// 상세 조회
const detail = await extendedApi.getAdminAppealDetail('12345');
```

### 4. 위원회 결정문 (12개 위원회)

공정위, 금융위 등 12개 위원회의 결정문을 검색합니다.

```typescript
// 지원 위원회 목록
type CommitteeType = 
  | 'privacy'      // 개인정보보호위원회
  | 'monopoly'     // 공정거래위원회
  | 'labor'        // 중앙노동위원회
  | 'financial'    // 금융위원회
  | 'anticorruption' // 국민권익위원회
  | 'environment'  // 환경분쟁조정위원회
  | 'human_rights' // 국가인권위원회
  | 'broadcasting' // 방송통신위원회
  | 'securities'   // 증권선물위원회
  | 'land'         // 중앙토지수용위원회
  | 'industrial_accident' // 산업재해보상보험재심사위원회
  | 'employment_insurance'; // 고용보험심사위원회

// 공정위 결정문 검색
const ftcResults = await extendedApi.searchCommitteeDecisions(
  'monopoly', 
  '담합', 
  20
);

// 상세 조회
const detail = await extendedApi.getCommitteeDecisionDetail('monopoly', '9721');

// 응답 예시
{
  결정문일련번호: 9721,
  사건명: "군납유류 입찰담합 관련...",
  사건번호: "2009협심0509",
  결정일자: "2009.4.15.",
  문서유형: "의결서",
  위원회명: "공정거래위원회"
}
```

### 5. 부처별 유권해석

각 중앙부처의 법령해석을 검색합니다.

> ⚠️ **참고**: 일부 부처 API는 응답이 없을 수 있습니다.

```typescript
// 지원 부처 목록
type MinistryType =
  | 'moel'   // 고용노동부
  | 'nts'    // 국세청
  | 'molit'  // 국토교통부
  | 'mohw'   // 보건복지부
  | 'moef'   // 기획재정부
  | 'moe'    // 교육부
  | 'me'     // 환경부
  | 'mafra'  // 농림축산식품부
  | 'kcs'    // 관세청
  // ... 등

// 고용노동부 해석 검색
const moelResults = await extendedApi.searchMinistryInterpretations(
  'moel', 
  '퇴직금', 
  20
);
```

### 6. 특별행정심판

조세심판원, 특허심판원 등의 결정을 검색합니다.

> ⚠️ **참고**: 일부 심판원 API는 응답이 없을 수 있습니다.

```typescript
// 지원 심판원 목록
type TribunalType =
  | 'tax'      // 조세심판원
  | 'maritime' // 해양안전심판원
  | 'patent';  // 특허심판원

// 조세심판원 검색
const taxResults = await extendedApi.searchTribunalDecisions(
  'tax', 
  '부가가치세', 
  20
);
```

### 7. 법령용어 검색

법령용어 사전을 검색합니다.

```typescript
const terms = await extendedApi.searchLegalTerms('정의', 20);
```

### 8. 조약 검색

국제조약을 검색합니다.

```typescript
const treaties = await extendedApi.searchTreaties('무역', 20);
```

---

## 🌐 MCP 서버 엔드포인트

korea-law-mcp 서버를 통해 HTTP API로도 사용할 수 있습니다.

| 엔드포인트 | 설명 | 파라미터 |
|-----------|------|---------|
| `POST /tools/search_legal_interpretations` | 법령해석례 검색 | `query`, `limit` |
| `POST /tools/get_legal_interpretation_detail` | 법령해석례 상세 | `interpretation_id` |
| `POST /tools/search_constitutional_decisions` | 헌재결정례 검색 | `query`, `limit` |
| `POST /tools/get_constitutional_decision_detail` | 헌재결정례 상세 | `decision_id` |
| `POST /tools/search_admin_appeals` | 행정심판례 검색 | `query`, `limit` |
| `POST /tools/get_admin_appeal_detail` | 행정심판례 상세 | `appeal_id` |
| `POST /tools/search_committee_decisions` | 위원회 결정문 검색 | `committee`, `query`, `limit` |
| `POST /tools/search_ministry_interpretations` | 부처별 해석 검색 | `ministry`, `query`, `limit` |
| `POST /tools/search_tribunal_decisions` | 특별행정심판 검색 | `tribunal`, `query`, `limit` |
| `POST /tools/search_legal_terms` | 법령용어 검색 | `query`, `limit` |

### 사용 예시

```bash
# 법령해석례 검색
curl -X POST http://localhost:3001/tools/search_legal_interpretations \
  -H "Content-Type: application/json" \
  -d '{"query": "근로기준법", "limit": 10}'

# 공정위 결정문 검색
curl -X POST http://localhost:3001/tools/search_committee_decisions \
  -H "Content-Type: application/json" \
  -d '{"committee": "monopoly", "query": "담합", "limit": 10}'
```

---

## 💾 데이터 동기화

로컬 SQLite DB에 데이터를 동기화할 수 있습니다.

```bash
# 전체 동기화
npx ts-node scripts/sync-extended-data.ts --type=all

# 개별 동기화
npx ts-node scripts/sync-extended-data.ts --type=interpretations
npx ts-node scripts/sync-extended-data.ts --type=constitutional
npx ts-node scripts/sync-extended-data.ts --type=appeals
npx ts-node scripts/sync-extended-data.ts --type=committees

# 제한 설정
npx ts-node scripts/sync-extended-data.ts --type=all --limit=50
```

---

## 🔍 API 테스트

```bash
# 전체 API 테스트
npx ts-node scripts/test-extended-apis.ts
```

---

## ⚠️ 제한사항

1. **API 응답 지연**: 일부 API는 응답이 느릴 수 있습니다 (최대 30초)
2. **검색 제한**: 한 번에 최대 100건까지 조회 가능
3. **일부 API 미작동**: 부처별 해석(`moelInterp` 등), 특별행정심판(`ttAppeal` 등)은 MOLEG에서 공개하지 않는 것으로 보입니다
4. **Rate Limiting**: 과도한 요청 시 API가 차단될 수 있습니다

---

## 📊 작동 확인된 API

| API | 상태 | 비고 |
|-----|------|------|
| 법령해석례 (expc) | ✅ 작동 | 검색 + 상세 |
| 헌재결정례 (detc) | ✅ 작동 | 검색 + 상세 |
| 행정심판례 (decc) | ✅ 작동 | 검색 + 상세 |
| 공정위 (ftc) | ✅ 작동 | 검색 + 상세 |
| 법령용어 | ✅ 작동 | 검색 |
| 조약 | ✅ 작동 | 검색 |
| 부처별 해석 | ❌ API 미응답 | MOLEG 미제공 추정 |
| 특별행정심판 | ❌ API 미응답 | MOLEG 미제공 추정 |

---

## 📚 참고

- [국가법령정보센터 Open API](https://open.law.go.kr)
- [API 카탈로그](./api-catalog.json)
- [데이터 수집 전략](../docs/DATA_ACQUISITION_STRATEGY.md)
