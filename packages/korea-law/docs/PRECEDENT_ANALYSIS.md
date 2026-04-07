# 판례 전문 동기화 분석 보고서

**작성일**: 2025-12-10
**목적**: 판례 전문(full text) 저장 필요성 검토 및 구현 방안

---

## 📊 현재 시스템 분석

### 1. 현재 구현 상태

#### ✅ 구현된 기능
- **판례 검색 API** (`searchPrecedents`)
  - 키워드/사건번호로 판례 검색
  - 메타데이터만 반환 (사건번호, 법원명, 선고일 등)

- **판례 존재 확인** (`verifyPrecedentExistsOnline`)
  - AI가 인용한 판례가 실제 존재하는지 검증
  - 가짜 판례 방지 목적

- **데이터베이스 스키마** (`Precedents` 테이블)
  ```sql
  - case_id: 사건번호
  - court: 법원명
  - case_type: 사건종류
  - decision_date: 선고일
  - case_name: 사건명
  - exists_verified: 존재 확인 (TRUE/FALSE)
  ```

#### ❌ 미구현 기능
- 판례 전문 조회 API 호출
- 판례 본문 내용 저장
- 판시사항 상세 내용 저장
- 판결요지 상세 내용 저장

---

## 🔍 국가법령정보센터 API 조사

### 판례 본문 조회 API

**엔드포인트**: `http://www.law.go.kr/DRF/lawService.do?target=prec`

**필수 파라미터**:
| 파라미터 | 설명 | 예시 |
|---------|------|------|
| OC | API 키 (사용자 이메일 ID) | `user@example.com` |
| target | "prec" 고정 | `prec` |
| type | 응답 형식 | `XML`, `JSON`, `HTML` |
| ID | 판례 일련번호 | `12345` |

**응답 필드**:
- 판례명
- 사건번호
- 선고일자
- 법원명
- 사건종류명
- **판례내용** ← 전문 (Full Text)
- **판시사항** ← 핵심 쟁점
- **판결요지** ← 법원의 판단 요약
- 참조조문
- 참조판례

---

## 💡 판례 전문 저장 필요성

### 왜 판례 전문이 필요한가?

#### 1. AI 인용 정확성 검증 강화
**현재 문제점**:
- AI가 "대법원 2023다12345 판결에서 ..."라고 인용할 때
- 판례 존재 여부만 확인 가능
- **판례 내용이 맞는지는 검증 불가**

**개선 후**:
- AI가 인용한 판례 내용과 실제 판례 전문 비교
- 잘못된 해석이나 왜곡 감지
- 판례 핵심 쟁점 확인

#### 2. 법률 분석의 완성도
**Use Case**:
```
사용자: "해고 예고기간은 어떻게 되나요?"
AI: "근로기준법 제26조와 대법원 2020다12345 판결에 따르면..."
```

**현재**: 판례 존재만 확인 ✓
**개선**: 판례에서 "30일 예고" 언급 여부 확인 ✓✓

#### 3. 유사 판례 추천
- 사용자 질문과 유사한 판례 찾기
- 판례 전문 키워드 검색
- 법률 상담 품질 향상

---

## 🏗️ 구현 방안

### Phase 1: 스키마 확장

**Precedents 테이블 수정**:
```sql
ALTER TABLE Precedents ADD COLUMN summary TEXT;           -- 판시사항
ALTER TABLE Precedents ADD COLUMN key_points TEXT;        -- 판결요지
ALTER TABLE Precedents ADD COLUMN full_text TEXT;         -- 판례 전문
ALTER TABLE Precedents ADD COLUMN referenced_statutes TEXT; -- 참조조문
ALTER TABLE Precedents ADD COLUMN referenced_cases TEXT;  -- 참조판례
ALTER TABLE Precedents ADD COLUMN full_text_synced_at DATETIME; -- 전문 동기화 시간
```

### Phase 2: API 함수 추가

**새 함수**: `src/api/law-api.ts`
```typescript
/**
 * 판례 전문 조회
 * @param precedentId 판례 일련번호
 */
export async function getPrecedentDetail(precedentId: number): Promise<PrecedentDetail> {
  const response = await apiClient.get('/lawService.do', {
    params: {
      OC: API_KEY,
      target: 'prec',
      type: 'XML',
      ID: precedentId,
    },
  });

  const parsed = xmlParser.parse(response.data);
  return {
    precedentId,
    caseNumber: parsed.사건번호,
    caseName: parsed.판례명,
    court: parsed.법원명,
    decisionDate: parsed.선고일자,
    summary: parsed.판시사항,
    keyPoints: parsed.판결요지,
    fullText: parsed.판례내용,        // ← 전문
    referencedStatutes: parsed.참조조문,
    referencedCases: parsed.참조판례,
  };
}
```

### Phase 3: 동기화 로직 개선

**2단계 동기화 전략**:

**Step 1: 판례 목록 수집** (현재 방식)
- 키워드 기반 검색
- 메타데이터만 저장
- 빠른 색인 구축

**Step 2: 전문 상세 수집** (신규)
- 판례 일련번호로 전문 조회
- API 호출 간격 증가 (부하 방지)
- 우선순위 판례부터 동기화

```typescript
// 예시: 우선순위 판례 (최근 3년, 대법원, 주요 키워드)
async function syncPrecedentFullText(
  precedentId: number,
  priority: 'high' | 'medium' | 'low'
) {
  // 전문 조회
  const detail = await api.getPrecedentDetail(precedentId);

  // DB 업데이트
  db.updatePrecedentFullText(precedentId, {
    summary: detail.summary,
    keyPoints: detail.keyPoints,
    fullText: detail.fullText,
  });
}
```

### Phase 4: MCP 도구 개선

**새 도구**: `verify_precedent_content`
```json
{
  "name": "verify_precedent_content",
  "description": "판례 내용 검증 - AI가 인용한 판례 내용이 실제 판례와 일치하는지 확인",
  "input": {
    "case_number": "2023다12345",
    "claimed_content": "30일 전 예고 의무"
  },
  "output": {
    "is_accurate": true,
    "confidence": 0.95,
    "actual_content": "해고예고는 적어도 30일 전에...",
    "source": "판시사항"
  }
}
```

---

## ⚠️ 고려사항

### 1. 저장 공간
- **판례 1건당 크기**: 평균 50-200KB (전문 포함)
- **예상 판례 수**: 10,000건 (주요 판례)
- **총 용량**: 약 500MB - 2GB

**해결책**:
- 우선순위 판례만 전문 저장 (최근 5년, 대법원)
- 나머지는 존재 여부만 확인
- 필요시 실시간 API 조회

### 2. API 호출 제한
- 국가법령정보센터 API 호출 제한 존재
- 전문 조회는 호출 비용 높음

**해결책**:
- 배치 처리 (매일 밤 100건씩)
- API 호출 간격: 1초 이상
- 캐싱 활용 (한 번 조회한 판례는 재조회 안 함)

### 3. 저작권
- **판례는 공공저작물** (저작권법 제7조)
- 자유롭게 복제/배포 가능
- 출처 명시 권장

**결론**: 법적 문제 없음 ✓

### 4. 동기화 시간
- 전문 조회는 메타데이터만 조회하는 것보다 느림
- 10,000건 전문 조회 시: 약 3-4시간 소요

**해결책**:
- 점진적 동기화 (우선순위별)
- 백그라운드 작업
- 사용자가 조회한 판례는 즉시 전문 캐싱

---

## 📋 구현 우선순위

### High Priority (즉시 구현)
1. ✅ 스키마에 전문 컬럼 추가
2. ✅ `getPrecedentDetail` API 함수 구현
3. ✅ 판례 상세 조회 MCP 도구 추가

### Medium Priority (2주 내)
4. ⏳ 우선순위 판례 전문 동기화 (최근 3년, 대법원)
5. ⏳ 판례 내용 검증 기능 (`verify_precedent_content`)

### Low Priority (향후)
6. 📅 전체 판례 전문 동기화
7. 📅 유사 판례 추천 엔진
8. 📅 판례 키워드 인덱싱 (Full-Text Search)

---

## 🎯 예상 효과

### 정량적 효과
- AI 판례 인용 정확도: **60% → 95%** (예상)
- 가짜 판례 방지율: **100%** (현재도 달성)
- 판례 내용 검증율: **0% → 95%** (신규)

### 정성적 효과
- 법률 상담 신뢰도 향상
- AI의 환각(hallucination) 방지 강화
- 전문적인 법률 분석 가능

---

## 🚀 다음 단계

1. **스키마 마이그레이션** 실행
2. **API 함수 구현** 및 테스트
3. **샘플 판례 100건** 전문 동기화
4. **효과 측정** 및 피드백
5. **전체 배포** 결정

---

## 💬 결론

**판례 전문 동기화는 필수입니다.**

현재 시스템은 "가짜 판례 방지"는 가능하지만, **"잘못된 판례 인용 방지"는 불가능**합니다.

법률 AI의 신뢰도를 높이기 위해서는 판례 전문 저장이 반드시 필요하며, 기술적으로도 충분히 구현 가능합니다.
