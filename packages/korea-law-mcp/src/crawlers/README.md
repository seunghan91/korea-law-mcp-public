# 법률 데이터 크롤러

Hyperbrowser 기반 법률 데이터 크롤러입니다. CAPTCHA 우회, 동적 페이지 처리를 지원합니다.

## 지원 데이터 소스

| 소스 | URL | 크롤러 | 특징 |
|------|-----|--------|------|
| 대법원 종합법률정보 | glaw.scourt.go.kr | Hyperbrowser | CAPTCHA 우회 필요 |
| 헌법재판소 | search.ccourt.go.kr | Hyperbrowser | 결정문 검색 |
| 국가법령정보센터 | law.go.kr | Hyperbrowser + API | 판례, 법령 |
| 생활법령정보 | easylaw.go.kr | Hyperbrowser + Cheerio | 일반인용 해설 |

## 설치

```bash
cd services/korea-law-mcp
pnpm install
```

## 환경변수 설정

```bash
cp .env.example .env
# .env 파일에 HYPERBROWSER_API_KEY 설정
```

## 사용법

### CLI 실행

```bash
# 모든 소스에서 검색 (기본)
pnpm crawl all 부당해고

# 대법원 판례 검색
pnpm crawl:supreme 부당해고 5

# 헌법재판소 결정 검색
pnpm crawl:constitutional 근로기준법 5

# 생활법령 검색
pnpm crawl:easylaw 해고 5

# 배치 크롤링 (여러 주제)
pnpm crawl:batch
```

### 코드에서 사용

```typescript
import { getHyperbrowserLawCrawler } from './crawlers';

const crawler = getHyperbrowserLawCrawler();

// 대법원 판례 검색
const supremeResult = await crawler.searchSupremeCourt('부당해고', 5);
console.log(supremeResult.data);

// 헌법재판소 결정 검색
const ccResult = await crawler.searchConstitutionalCourt('근로기준법', 5);
console.log(ccResult.data);

// 모든 소스에서 통합 검색
const allResults = await crawler.searchAll('해고', 5);
console.log(allResults);

// 배치 크롤링
await crawler.batchCrawl(
  ['부당해고', '근로계약', '해고'],
  {
    sources: ['supremeCourt', 'constitutionalCourt', 'easyLaw'],
    limit: 5,
    outputDir: './crawled_data'
  }
);
```

## Hyperbrowser 설정

CAPTCHA 우회를 위한 기본 설정:

```typescript
const sessionOptions = {
  solveCaptchas: true,  // CAPTCHA 자동 해결
  useStealth: true,     // 스텔스 모드
  useProxy: true,       // 프록시 사용
  acceptCookies: false,
};
```

## 출력 형식

### 판례 (Precedent)

```typescript
interface Precedent {
  caseNumber: string;    // 사건번호 (예: 2023다12345)
  court: string;         // 법원 (예: 대법원)
  decisionDate: string;  // 선고일 (예: 2023-11-30)
  caseType: string;      // 사건유형 (예: 부당해고구제재심판정취소)
  title?: string;        // 제목
  summary: string;       // 요약
  keyPoints?: string[];  // 핵심 포인트
  relatedLaws?: string[]; // 관련 법률
}
```

### 헌법재판소 결정 (ConstitutionalDecision)

```typescript
interface ConstitutionalDecision {
  caseNumber: string;    // 사건번호 (예: 2020헌바123)
  decisionDate: string;  // 결정일
  caseType: string;      // 사건유형 (헌법소원, 위헌심판 등)
  result: string;        // 결과 (합헌, 위헌, 기각 등)
  title: string;         // 제목
  summary: string;       // 요약
  citation?: string;     // 판례집 인용
}
```

## 주의사항

1. **Rate Limiting**: 각 요청 사이에 2초 딜레이가 적용됩니다
2. **세션 한도**: Hyperbrowser 무료 플랜은 동시 세션 25개 제한
3. **API 키**: Hyperbrowser API 키가 필요합니다 (https://hyperbrowser.ai)
4. **CAPTCHA**: 대법원 사이트는 CAPTCHA가 있어 `solveCaptchas: true` 필수

## 크롤러 종류

### 1. HyperbrowserLawCrawler (신규)
- Hyperbrowser API 기반
- CAPTCHA 우회 지원
- Claude Computer Use 에이전트 사용

### 2. EasyLawCrawler (기존)
- Cheerio 기반 정적 파싱
- 생활법령정보 전용

### 3. SCourtCrawler (기존)
- Axios + XML 파싱
- 법령정보센터 API 사용

## 문제 해결

### CAPTCHA 실패
```
Error: CAPTCHA 우회 실패
```
→ `sessionOptions.solveCaptchas = true` 확인
→ Hyperbrowser 계정에서 CAPTCHA 크레딧 확인

### 세션 한도 초과
```
Error: Maximum number of active sessions (25) reached
```
→ 잠시 대기 후 재시도
→ 또는 유료 플랜 업그레이드

### 타임아웃
```
Error: timeout of 120000ms exceeded
```
→ 네트워크 상태 확인
→ 타임아웃 값 증가
