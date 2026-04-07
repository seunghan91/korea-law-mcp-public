# 국가법령정보 Open API 설정 가이드

## 📌 현재 상태 요약

| 기능 | API | 상태 |
|------|-----|------|
| 법령 검색 | `target=law` | ✅ 정상 (API 키 필요) |
| 판례 검색 | `target=prec` | ❌ **권한 없음** |
| 판례 본문 | `target=prec` + ID | ❌ **권한 없음** |

---

## ⚠️ 중요: open.law.go.kr 서비스 중단 (2025년)

> 국가정보자원관리원 전산시설 화재로 현재 서비스가 중단 중입니다.
> 복구 시까지 대체 사이트 이용 필요

### 대체 사이트
- **판례 열람**: portal.scourt.go.kr (사법정보공개포털)
- **법령 열람**: likms.assembly.go.kr/law (국회법률정보시스템)

---

## 🔑 판례 API 권한 신청 방법

### 방법 1: 국가법령정보센터 직접 신청 (권장)

1. **https://www.law.go.kr/DRF/login.do** 접속
2. 회원가입 진행
3. 로그인 후 **[OPEN API]** → **[OPEN API 신청]** 클릭
4. 신청서 작성:
   - ✅ **판례 검색** (`target=prec`) 선택
   - ✅ **판례 본문** 선택
   - 활용 목적: AI 법률 검증 시스템
5. 승인 대기 (1-3일 소요)
6. 승인 후 발급받은 **사용자ID(OC)** 를 환경변수에 설정

```bash
export KOREA_LAW_API_KEY="your_approved_id"
```

### 방법 2: 공공데이터포털 (data.go.kr)

법제처_판례 API 목록:
- **판례 목록 조회**: https://www.data.go.kr/data/15057122/openapi.do
- **판례 본문 조회**: https://www.data.go.kr/data/15057123/openapi.do

1. https://www.data.go.kr 접속 및 로그인
2. 위 API 검색 후 **활용신청**
3. 승인 후 발급받은 인증키 사용

---

## 🧪 API 테스트

### 법령 검색 (현재 동작)
```bash
curl "http://www.law.go.kr/DRF/lawSearch.do?OC=sapphire_5&target=law&type=XML&query=근로기준법"
```

### 판례 검색 (권한 필요)
```bash
# 권한이 없으면 빈 결과 또는 오류 반환
curl "http://www.law.go.kr/DRF/lawSearch.do?OC=YOUR_API_KEY&target=prec&type=XML&query=해고"
```

### 판례 상세 조회 (권한 필요)
```bash
curl "http://www.law.go.kr/DRF/lawService.do?OC=YOUR_API_KEY&target=prec&type=XML&ID=판례일련번호"
```

---

## 📋 API 사용법 참고

### 판례 검색 URL 형식
```
http://www.law.go.kr/DRF/lawSearch.do
  ?OC={API_KEY}           # 사용자 ID
  &target=prec            # 판례 검색
  &type=XML               # 응답 형식
  &query={keyword}        # 검색어
  &display=100            # 결과 개수 (최대 100)
  &page=1                 # 페이지 번호
  &search=2               # 검색 범위 (2=판시요지+판시내용)
```

### 응답 필드
| 필드명 | 설명 |
|--------|------|
| 판례일련번호 | 고유 ID (상세 조회시 사용) |
| 사건번호 | 예: 2023다12345 |
| 사건명 | 판례 제목 |
| 선고일자 | YYYYMMDD 형식 |
| 법원명 | 대법원, 서울고등법원 등 |
| 사건종류명 | 민사, 형사, 행정 등 |

---

## 🛠 임시 해결책 (API 승인 대기 중)

### 테스트 데이터 사용
```bash
cd /Users/seunghan/law/korea-law
sqlite3 data/korea-law.db < scripts/insert-test-precedents.sql
```

### 사법정보공개포털에서 수동 수집
- https://portal.scourt.go.kr 에서 판례 검색
- 필요한 판례 정보를 DB에 수동 입력

---

## 📞 문의처

- **법제처 공동활용 유지보수팀**: 02-2109-6446
- **이메일**: open@moleg.go.kr
- **안내**: 1551-3060

---

## 🔗 관련 링크

| 사이트 | URL | 설명 |
|--------|-----|------|
| 국가법령정보센터 | www.law.go.kr | 법령/판례 검색 |
| 공공데이터포털 | www.data.go.kr | API 신청 |
| 사법정보공개포털 | portal.scourt.go.kr | 법원 판례 열람 |
| 국회법률정보 | likms.assembly.go.kr/law | 법률 정보 |
