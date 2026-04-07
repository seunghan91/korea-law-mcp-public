# 국가법령정보 OPEN API 문서

> 자동 생성됨: 2025-12-10T09:26:08.836Z

## 목차

- [법령](#법령)
- [행정규칙](#행정규칙)
- [자치법규](#자치법규)
- [판례/결정례](#판례/결정례)
- [조약](#조약)
- [부가서비스](#부가서비스)
- [모바일](#모바일)
- [법령정보 지식베이스](#법령정보-지식베이스)
- [중앙부처 법령해석](#중앙부처-법령해석)
- [위원회 결정문](#위원회-결정문)
- [특별행정심판](#특별행정심판)
- [기타](#기타)

---

## 법령

### 현행법령(시행일) 목록 조회 API

- **Target**: `eflaw`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=eflaw`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : eflaw(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON 생략시 기본값: XML |
| `search` | int | 검색범위 (기본 : 1 법령명) 2 : 본문검색 |
| `query` | string | 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `nw` | int | 1: 연혁, 2: 시행예정, 3: 현행 (기본값: 전체) 연혁+예정 : nw=1,2 예정+현행 : nw=2,3 연혁+현행 : nw=1,3 연혁+예정+현행 : nw=1,2,3 |
| `LID` | string | 법령ID (LID=830) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호  |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `date` | string | 공포일자 검색 |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `ancNo` | string | 공포번호 범위 검색(306~400) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `nb` | int | 법령의 공포번호 검색 |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 법령종류(코드제공) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `법령일련번호` | int | 법령일련번호 |
| `현행연혁코드` | string | 현행연혁코드 |
| `법령명한글` | string | 법령명한글 |
| `법령약칭명` | string | 법령약칭명 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처코드` | string | 소관부처명 |
| `소관부처명` | string | 소관부처명 |
| `법령구분명` | string | 법령구분명 |
| `공동부령구분` | string | 공동부령구분 |
| `공포번호` | string | 공포번호(공동부령의 공포번호) |
| `시행일자` | int | 시행일자 |
| `자법타법여부` | string | 자법타법여부 |
| `법령상세링크` | string | 법령상세링크 |

#### 샘플 URL

- 1. 시행일 법령 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&type=XML`
- 2. 시행일 법령 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&type=HTML`
- 3. 시행일 법령 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&type=JSON`
- 4. 법령 검색 : 자동차관리법
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&query=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95`
- 5. 법령 공포일자 내림차순 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&type=XML&sort=ddes`
- 6. 소관부처가 국토교통부인 법령 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&type=XML&org=1613000`
- 7. '도서관법'을 법령 ID(830)로 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eflaw&type=XML&LID=830`

---

### 현행법령(시행일) 본문 조회 API

- **Target**: `eflaw`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=eflaw`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : eflaw(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON 생략시 기본값 : XML |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력,ID로 검색하면 그 법령의 현행 법령 본문 조회) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `efYd` | int(필수) | 법령의 시행일자 (ID 입력시에는 무시하는 값으로 입력하지 않음) |
| `JO` | int | 조번호 생략(기본값) : 모든 조를 표시함 6자리숫자 : 조번호(4자리)+조가지번호(2자리) (000200 : 2조, 001002 : 10조의 2) |
| `chrClsCd` | char | 원문/한글 여부 생략(기본값) : 한글 (010202 : 한글, 010201 : 원문) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `언어` | string | 언어종류 |
| `법종구분` | string | 법종류의 구분 |
| `법종구분코드` | string | 법종구분코드 |
| `법령명_한글` | string | 한글법령명 |
| `법령명_한자` | string | 법령명_한자 |
| `법령명약칭` | string | 법령명약칭 |
| `편장절관` | int | 편장절관 일련번호 |
| `소관부처코드` | int | 소관부처코드 |
| `소관부처` | string | 소관부처명 |
| `전화번호` | string | 전화번호 |
| `시행일자` | int | 시행일자 |
| `제개정구분` | string | 제개정구분 |
| `조문시행일자문자열` | string | 조문시행일자문자열 |
| `별표시행일자문자열` | string | 별표시행일자문자열 |
| `별표편집여부` | string | 별표편집여부 |
| `공포법령여부` | string | 공포법령여부 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | int | 소관부처코드 |
| `부서명` | string | 연락부서명 |
| `부서연락처` | string | 연락부서 전화번호 |
| `공동부령구분` | string | 공동부령의 구분 |
| `구분코드` | string | 구분코드(공동부령구분 구분코드) |
| `공포번호` | string | 공포번호(공동부령의 공포번호) |
| `조문번호` | int | 조문번호 |
| `조문가지번호` | int | 조문가지번호 |
| `조문여부` | string | 조문여부 |
| `조문제목` | string | 조문제목 |
| `조문시행일자` | int | 조문시행일자 |
| `조문제개정유형` | string | 조문제개정유형 |
| `조문이동이전` | int | 조문이동이전 |
| `조문이동이후` | int | 조문이동이후 |
| `조문변경여부` | string | 조문변경여부(Y값이 있으면 해당 조문내에 변경 내용 있음 ) |
| `조문내용` | string | 조문내용 |
| `항번호` | int | 항번호 |
| `항제개정유형` | string | 항제개정유형 |
| `항제개정일자문자열` | string | 항제개정일자문자열 |
| `항내용` | string | 항내용 |
| `호번호` | int | 호번호 |
| `호내용` | string | 호내용 |
| `조문참고자료` | string | 조문참고자료 |
| `부칙공포일자` | int | 부칙공포일자 |
| `부칙공포번호` | int | 부칙공포번호 |
| `부칙내용` | string | 부칙내용 |
| `별표번호` | int | 별표번호 |
| `별표가지번호` | int | 별표가지번호 |
| `별표구분` | string | 별표구분 |
| `별표제목` | string | 별표제목 |
| `별표제목문자열` | string | 별표제목문자열 |
| `별표시행일자` | int | 별표시행일자 |
| `별표서식파일링크` | string | 별표서식파일링크 |
| `별표HWP파일명` | string | 별표 HWP 파일명 |
| `별표서식PDF파일링크` | string | 별표서식PDF파일링크 |
| `별표PDF파일명` | string | 별표 PDF 파일명 |
| `별표이미지파일명` | string | 별표 이미지 파일명 |
| `별표내용` | string | 별표내용 |
| `개정문내용` | string | 개정문내용 |
| `제개정이유내용` | string | 제개정이유내용 |

#### 샘플 URL

- 1. 자동차관리법 ID HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw&ID=1747&type=HTML`
- 2. 자동차관리법 법령 Seq XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw&MST=166520&efYd=20151007&type=XML`
- 3. 자동차관리법 3조 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw&MST=166520&efYd=20151007&JO=000300&type=XML`
- 4. 자동차관리법 ID JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflaw&ID=1747&type=JSON`

---

### 현행법령(공포일) 목록 조회 API

- **Target**: `law`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=law`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : law(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령명) 2 : 본문검색 |
| `query` | string | 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호 |
| `date` | int | 법령의 공포일자 검색 |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `ancNo` | string | 공포번호 범위 검색(306~400) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `nb` | int | 법령의 공포번호 검색 |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 법령종류(코드제공) |
| `lsChapNo` | string | 법령분류 (01-제1편 / 02-제2편 / 03-제3편... 44-제44편) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `법령일련번호` | int | 법령일련번호 |
| `현행연혁코드` | string | 현행연혁코드 |
| `법령명한글` | string | 법령명한글 |
| `법령약칭명` | string | 법령약칭명 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | int | 소관부처코드 |
| `법령구분명` | string | 법령구분명 |
| `공동부령구분` | string | 공동부령구분 |
| `공포번호` | string | 공포번호(공동부령의 공포번호) |
| `시행일자` | int | 시행일자 |
| `자법타법여부` | string | 자법타법여부 |
| `법령상세링크` | string | 법령상세링크 |

#### 샘플 URL

- 1. 현행법령 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=XML`
- 2. 현행법령 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=HTML`
- 3. 현행법령 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=JSON`
- 4. 법령 검색 : 자동차관리법
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=XML&query=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95`

---

### 현행법령(공포일) 본문 조회 API

- **Target**: `law`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=law`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : law(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `LM` | string | 법령의 법령명(법령명 입력시 해당 법령 링크) |
| `LD` | int | 법령의 공포일자 |
| `LN` | int | 법령의 공포번호 |
| `JO` | int | 조번호 생략(기본값) : 모든 조를 표시함 6자리숫자 : 조번호(4자리)+조가지번호(2자리) (000200 : 2조, 001002 : 10조의 2) |
| `LANG` | char | 원문/한글 여부 생략(기본값) : 한글 (KO : 한글, ORI : 원문) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `언어` | string | 언어종류 |
| `법종구분` | string | 법종류의 구분 |
| `법종구분코드` | string | 법종구분코드 |
| `법령명_한글` | string | 한글법령명 |
| `법령명_한자` | string | 법령명_한자 |
| `법령명약칭` | string | 법령명약칭 |
| `제명변경여부` | string | 제명변경여부 |
| `한글법령여부` | string | 한글법령여부 |
| `편장절관` | int | 편장절관 일련번호 |
| `소관부처코드` | int | 소관부처코드 |
| `소관부처` | string | 소관부처명 |
| `전화번호` | string | 전화번호 |
| `시행일자` | int | 시행일자 |
| `제개정구분` | string | 제개정구분 |
| `별표편집여부` | string | 별표편집여부 |
| `공포법령여부` | string | 공포법령여부 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | int | 소관부처코드 |
| `부서명` | string | 연락부서명 |
| `부서연락처` | string | 연락부서 전화번호 |
| `공동부령구분` | string | 공동부령의 구분 |
| `구분코드` | string | 구분코드(공동부령구분 구분코드) |
| `공포번호` | string | 공포번호(공동부령의 공포번호) |
| `조문번호` | int | 조문번호 |
| `조문가지번호` | int | 조문가지번호 |
| `조문여부` | string | 조문여부 |
| `조문제목` | string | 조문제목 |
| `조문시행일자` | int | 조문시행일자 |
| `조문제개정유형` | string | 조문제개정유형 |
| `조문이동이전` | int | 조문이동이전 |
| `조문이동이후` | int | 조문이동이후 |
| `조문변경여부` | string | 조문변경여부(Y값이 있으면 해당 조문내에 변경 내용 있음 ) |
| `조문내용` | string | 조문내용 |
| `항번호` | int | 항번호 |
| `항제개정유형` | string | 항제개정유형 |
| `항제개정일자문자열` | string | 항제개정일자문자열 |
| `항내용` | string | 항내용 |
| `호번호` | int | 호번호 |
| `호내용` | string | 호내용 |
| `조문참고자료` | string | 조문참고자료 |
| `부칙공포일자` | int | 부칙공포일자 |
| `부칙공포번호` | int | 부칙공포번호 |
| `부칙내용` | string | 부칙내용 |
| `별표번호` | int | 별표번호 |
| `별표가지번호` | int | 별표가지번호 |
| `별표구분` | string | 별표구분 |
| `별표제목` | string | 별표제목 |
| `별표서식파일링크` | string | 별표서식파일링크 |
| `별표HWP파일명` | string | 별표 HWP 파일명 |
| `별표서식PDF파일링크` | string | 별표서식PDF파일링크 |
| `별표PDF파일명` | string | 별표 PDF 파일명 |
| `별표이미지파일명` | string | 별표 이미지 파일명 |
| `별표내용` | string | 별표내용 |
| `개정문내용` | string | 개정문내용 |
| `제개정이유내용` | string | 제개정이유내용 |

#### 샘플 URL

- 1. 법령 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&ID=009682&type=HTML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=law&ID=009682&type=HTML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&MST=261457&type=HTML`
- 2. 법령 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&ID=009682&type=XML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=law&ID=009682&type=XML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&MST=261457&type=XML`
- 3. 법령 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&ID=009682&type=JSON`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=law&ID=009682&type=JSON
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&MST=261457&type=JSON`

---

### 법령 연혁 목록 조회 가이드API

- **Target**: `lsHistory`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lsHistory`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsHistory(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML |
| `query` | string | 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호  |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `date` | string | 공포일자 검색 |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `ancNo` | string | 공포번호 범위 검색(306~400) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 법령종류(코드제공) |
| `lsChapNo` | string | 법령분류 (01-제1편 / 02-제2편 / 03-제3편... 44-제44편) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 샘플 URL

- 1. 자동차관리법 법령연혁 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsHistory&type=HTML&query=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95`
- 2. 소관부처별(행정안전부 : 1741000) 법령연혁 HTML조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsHistory&type=HTML&org=1741000`

---

### 법령 연혁 본문 조회 가이드API

- **Target**: `lsHistory`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=lsHistory`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsHistory(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `LM` | string | 법령의 법령명(법령명 입력시 해당 법령 링크) |
| `LD` | int | 법령의 공포일자 |
| `LN` | int | 법령의 공포번호 |
| `chrClsCd` | char | 원문/한글 여부 생략(기본값) : 한글 (010202 : 한글, 010201 : 원문) |

#### 샘플 URL

- 1. 법령연혁 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsHistory&MST=9094&type=HTML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=lsHistory&MST=9094&type=HTML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsHistory&MST=166500&type=HTML`

---

### 현행법령(시행일) 본문 조항호목 조회 API

- **Target**: `eflawjosub`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=eflawjosub`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : eflawjosub(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `efYd` | int(필수) | 법령의 시행일자 (ID 입력시에는 무시하는 값으로 입력하지 않음) |
| `JO` | char(필수) | 조 번호 6자리숫자 예) 제2조 : 000200, 제10조의2 : 001002 |
| `HANG` | char | 항 번호 6자리숫자 예) 제2항 : 000200 |
| `HO` | char | 호 번호 6자리숫자 예) 제2호 : 000200, 제10호의2 : 001002 |
| `MOK` | char | 목 한자리 문자 예) 가,나,다,라, … 카,타,파,하 한글은 인코딩 하여 사용하여야 정상적으로 사용이가능 URLDecoder.decode("다", "UTF-8") |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령키` | int | 법령키 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `언어` | string | 언어 |
| `법종구분` | string | 법종구분 |
| `법종구분 코드` | string | 법종구분 코드 |
| `법령명_한글` | string | 법령명을 한글로 제공 |
| `법령명_한자` | string | 법령명을 한자로 제공 |
| `법령명_영어` | string | 법령명을 영어로 제공 |
| `편장절관` | int | 편장절관 |
| `소관부처코드` | int | 소관부처 코드 |
| `소관부처` | string | 소관부처명 |
| `전화번호` | string | 전화번호 |
| `시행일자` | int | 시행일자 |
| `제개정구분` | string | 제개정구분명 |
| `제안구분` | string | 제안구분 |
| `의결구분` | string | 의결구분 |
| `적용시작일자` | string | 적용시작일자 |
| `적용종료일자` | string | 적용종료일자 |
| `이전법령명` | string | 이전법령명 |
| `조문시행일자문자열` | string | 조문시행일자문자열 |
| `별표시행일자문자열` | string | 별표시행일자문자열 |
| `별표편집여부` | string | 별표편집여부 |
| `공포법령여부` | string | 공포법령여부(Y값이 있으면 해당 법령은 공포법령임) |
| `조문번호` | int | 조문번호 |
| `조문여부` | string | 조문여부 |
| `조문제목` | string | 조문제목 |
| `조문시행일자` | string | 조문시행일자 |
| `조문이동이전` | int | 조문이동이전번호 |
| `조문이동이후` | int | 조문이동이후번호 |
| `조문변경여부` | string | 조문변경여부(Y값이 있으면 해당 조문내에 변경 내용 있음 ) |
| `조문내용` | string | 조문내용 |
| `항번호` | int | 항번호 |
| `항내용` | string | 항내용 |
| `호번호` | int | 호번호 |
| `호내용` | string | 호내용 |
| `목번호` | string | 목번호 |
| `목내용` | string | 목내용 |

#### 샘플 URL

- 1. 건축법 제3조제1항제2호다목 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflawjosub&type=XML&MST=193412&efYd=20171019&JO=000300&HANG=000100&HO=000200&MOK=%EB%8B%A4`
- 2. 건축법 제3조제1항제2호다목 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflawjosub&type=HTML&MST=193412&efYd=20171019&JO=000300&HANG=000100&HO=000200&MOK=%EB%8B%A4`
- 3. 건축법 제3조제1항제2호다목 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eflawjosub&type=JSON&MST=193412&efYd=20171019&JO=000300&HANG=000100&HO=000200&MOK=%EB%8B%A4`

---

### 현행법령(공포일) 본문 조항호목 조회 API

- **Target**: `lawjosub`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=lawjosub`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lawjosub(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) (ID로 검색하면 그 법령의 현행 법령 본문 조회) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `JO` | char(필수) | 조 번호 6자리숫자 예) 제2조 : 000200, 제10조의2 : 001002 |
| `HANG` | char | 항 번호 6자리숫자 예) 제2항 : 000200 |
| `HO` | char | 호 번호 6자리숫자 예) 제2호 : 000200, 제10호의2 : 001002 |
| `MOK` | char | 목 한자리 문자 예) 가,나,다,라, … 카,타,파,하 한글은 인코딩 하여 사용하여야 정상적으로 사용이가능 URLDecoder.decode("다", "UTF-8") |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령키` | int | 법령키 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `언어` | string | 언어 구분 |
| `법령명_한글` | string | 법령명을 한글로 제공 |
| `법령명_한자` | string | 법령명을 한자로 제공 |
| `법종구분코드` | string | 법종구분코드 |
| `법종구분명` | string | 법종구분명 |
| `제명변경여부` | string | 제명변경여부(Y값이 있으면 해당 법령은 제명 변경임) |
| `한글법령여부` | string | 한글법령여부(Y값이 있으면 해당 법령은 한글법령) |
| `편장절관` | int | 편장절관 |
| `소관부처코드` | int | 소관부처 코드 |
| `소관부처` | string | 소관부처명 |
| `전화번호` | string | 전화번호 |
| `시행일자` | int | 시행일자 |
| `제개정구분` | string | 제개정구분명 |
| `제안구분` | string | 제안구분 |
| `의결구분` | string | 의결구분 |
| `이전법령명` | string | 이전법령명 |
| `조문별시행일자` | string | 조문별시행일자 |
| `조문시행일자문자열` | string | 조문시행일자문자열 |
| `별표시행일자문자열` | string | 별표시행일자문자열 |
| `별표편집여부` | string | 별표편집여부 |
| `공포법령여부` | string | 공포법령여부(Y값이 있으면 해당 법령은 공포법령임) |
| `시행일기준편집여부` | string | 시행일기준편집여부(Y값이 있으면 해당 법령은 시행일 기준 편집됨) |
| `조문번호` | int | 조문번호 |
| `조문여부` | string | 조문여부 |
| `조문제목` | string | 조문제목 |
| `조문시행일자` | string | 조문시행일자 |
| `조문이동이전` | int | 조문이동이전번호 |
| `조문이동이후` | int | 조문이동이후번호 |
| `조문변경여부` | string | 조문변경여부(Y값이 있으면 해당 조문내에 변경 내용 있음 ) |
| `조문내용` | string | 조문내용 |
| `항번호` | int | 항번호 |
| `항내용` | string | 항내용 |
| `호번호` | int | 호번호 |
| `호내용` | string | 호내용 |
| `목번호` | string | 목번호 |
| `목내용` | string | 목내용 |

#### 샘플 URL

- 1. 건축법 제3조제1항제2호다목 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lawjosub&type=XML&ID=001823&JO=000300&HANG=000100&HO=000200&MOK=%EB%8B%A4`
- 2. 건축법 제3조제1항제2호다목 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lawjosub&type=HTML&ID=001823&JO=000300&HANG=000100&HO=000200&MOK=%EB%8B%A4`
- 3. 건축법 제3조제1항제2호다목 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lawjosub&type=JSON&ID=001823&JO=000300&HANG=000100&HO=000200&MOK=%EB%8B%A4`

---

### 영문법령 목록 조회 API

- **Target**: `elaw`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=elaw`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : elaw(필수) | 서비스 대상 |
| `search` | int | 검색범위 (기본 : 1 법령명) 2 : 본문검색 |
| `query` | string | 법령명에서 검색을 원하는 질의(default=*) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호  |
| `date` | int | 법령의 공포일자 검색 |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `ancNo` | string | 공포번호 범위 검색(306~400) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `nb` | int | 법령의 공포번호 검색 |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 법령종류(코드제공) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `type` | char | 출력 형태 HTML/XML/JSON |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `법령일련번호` | int | 법령일련번호 |
| `현행연혁코드` | string | 현행연혁코드 |
| `법령명한글` | string | 법령명한글 |
| `법령명영문` | string | 법령명영문 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처명` | string | 소관부처명 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `자법타법여부` | string | 자법타법여부 |
| `법령상세링크` | string | 법령상세링크 |

#### 샘플 URL

- 1. 영문법령 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=elaw&type=XML`
- 2. 영문법령 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=elaw&type=HTML`
- 3. 영문법령 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=elaw&type=JSON`
- 4. 영문법령 검색 : 가정폭력방지, insurance
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=elaw&type=XML&query=%EA%B0%80%EC%A0%95%ED%8F%AD%EB%A0%A5%EB%B0%A9%EC%A7%80`
- http://www.law.go.kr/DRF/lawSearch.do?OC=test&target=elaw&type=XML&query=가정폭력방지
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=elaw&type=XML&query=insurance`

---

### 영문법령 본문 조회 가이드API

- **Target**: `elaw`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=elaw`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : elaw(필수) | 서비스 대상 |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령 마스터 번호 법령테이블의 lsi_seq 값을 의미함 |
| `LM` | string | 법령의 법령명(법령명 입력시 해당 법령 링크) |
| `LD` | int | 법령의 공포일자 |
| `LN` | int | 법령의 공포번호 |
| `type` | char | 출력 형태 : HTML/XML/JSON |

#### 샘플 URL

- 1. 표준시에 관한 법률 ID HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=elaw&ID=000744&type=HTML`
- 2. 상호저축은행법 시행령 seq XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=elaw&MST=127280&type=XML`
- 3. 상호저축은행법 시행령 seq JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=elaw&MST=127280&type=JSON`

---

### 법령-자치법규 연계현황 조회 API

- **Target**: `drlaw`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=drlaw`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : drlaw(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML |

#### 샘플 URL

- 1. 법령-자치법규 연계현황 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=drlaw&type=HTML`

---

## 행정규칙

### 행정규칙 목록 조회 API

- **Target**: `admrul`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=admrul`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : admrul(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `nw` | int | (1: 현행, 2: 연혁, 기본값: 현행) |
| `search` | int | 검색범위 (기본 : 1 행정규칙명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `org` | string | 소관부처별 검색(코드별도제공) |
| `knd` | string | 행정규칙 종류별 검색 (1=훈령/2=예규/3=고시 /4=공고/5=지침/6=기타) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 (기본 : lasc 행정규칙명 오른차순) ldes 행정규칙명 내림차순 dasc : 발령일자 오름차순 ddes : 발령일자 내림차순 nasc : 발령번호 오름차순 ndes  |
| `date` | int | 행정규칙 발령일자 |
| `prmlYd` | string | 발령일자 기간검색(20090101~20090130) |
| `modYd` | string | 수정일자 기간검색(20090101~20090130) |
| `nb` | int | 행정규칙 발령번호ex)제2023-8호 검색을 원할시 nb=20238 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `admrul id` | int | 결과 번호 |
| `행정규칙일련번호` | int | 행정규칙일련번호 |
| `행정규칙명` | string | 행정규칙명 |
| `행정규칙종류` | string | 행정규칙종류 |
| `발령일자` | int | 발령일자 |
| `발령번호` | int | 발령번호 |
| `소관부처명` | string | 소관부처명 |
| `현행연혁구분` | string | 현행연혁구분 |
| `제개정구분코드` | string | 제개정구분코드 |
| `제개정구분명` | string | 제개정구분명 |
| `행정규칙ID` | int | 행정규칙 |
| `행정규칙상세링크` | string | 행정규칙상세링크 |
| `시행일자` | int | 시행일자 |
| `생성일자` | int | 생성일자 |

#### 샘플 URL

- 1. 행정규칙 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&type=HTML&query=%ED%95%99%EA%B5%90`
- 2. 행정규칙 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&date=20250501&type=XML`
- 3. 행정규칙 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&date=20250501&type=JSON`

---

### 행정규칙 본문 조회 API

- **Target**: `admrul`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=admrul`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : admrul(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 행정규칙 일련번호 |
| `LID` | char | 행정규칙 ID |
| `LM` | string | 행정규칙명 조회하고자 하는 정확한 행정규칙명을 입력 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `행정규칙일련번호` | int | 행정규칙일련번호 |
| `행정규칙명` | string | 행정규칙명 |
| `행정규칙종류` | string | 행정규칙종류 |
| `행정규칙종류코드` | string | 행정규칙종류코드 |
| `발령일자` | int | 발령일자 |
| `발령번호` | string | 발령번호 |
| `제개정구분명` | string | 제개정구분명 |
| `제개정구분코드` | string | 제개정구분코드 |
| `조문형식여부` | string | 조문형식여부 |
| `행정규칙ID` | int | 행정규칙 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | string | 소관부처코드 |
| `상위부처명` | string | 상위부처명 |
| `담당부서기관코드` | string | 담당부서기관코드 |
| `담당부서기관명` | string | 담당부서기관명 |
| `담당자명` | string | 담당자명 |
| `전화번호` | string | 전화번호 |
| `현행여부` | string | 현행여부 |
| `시행일자` | string | 시행일자 |
| `생성일자` | string | 생성일자 |
| `조문내용` | string | 조문내용 |
| `부칙` | string | 부칙 |
| `부칙공포일자` | int | 부칙공포일자 |
| `부칙공포번호` | int | 부칙공포번호 |
| `부칙내용` | string | 부칙내용 |
| `별표` | string | 별표 |
| `별표번호` | int | 별표번호 |
| `별표가지번호` | int | 별표가지번호 |
| `별표구분` | string | 별표구분 |
| `별표제목` | string | 별표제목 |
| `별표서식파일링크` | string | 별표서식파일링크 |
| `별표서식PDF파일링크` | string | 별표서식PDF파일링크 |
| `별표내용` | string | 별표내용 |

#### 샘플 URL

- 1. 행정규칙 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=admrul&ID=62505&type=HTML`
- 2. 행정규칙 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=admrul&ID=10000005747&type=XML`
- 3. 행정규칙 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=admrul&ID=2000000091702&type=JSON`

---

## 자치법규

### 자치법규 목록 조회 API

- **Target**: `ordin`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=ordin`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ordin(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `nw` | int | (1: 현행, 2: 연혁, 기본값: 현행) |
| `search` | int | 검색범위 (기본 : 1 자치법규명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의(defalut=*) (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공 |
| `date` | int | 자치법규 공포일자 검색 |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `ancNo` | string | 공포번호 범위 검색(306~400) |
| `nb` | int | 법령의 공포번호 검색 |
| `org` | string | 지자체별 도·특별시·광역시 검색(지자체코드 제공) (ex. 서울특별시에 대한 검색-> org=6110000) |
| `sborg` | string | 지자체별 시·군·구 검색(지자체코드 제공) (필수값 : org, ex.서울특별시 구로구에 대한 검색-> org=6110000&sborg=3160000) |
| `knd` | string | 법령종류 (30001-조례 /30002-규칙 /30003-훈령 /30004-예규/30006-기타/30010-고시 /30011-의회규칙) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `ordinFd` | int | 분류코드별 검색. 분류코드는 지자체 분야코드 openAPI 참조 |
| `lsChapNo` | string | 법령분야별 검색(법령분야코드제공) (ex. 제1편 검색 lsChapNo=01000000 / 제1편2장,제1편2장1절 lsChapNo=01020000,01020100) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ordinfd(필수) | 서비스 대상 |
| `org` | stinrg(필수) | 기관코드값(예:서울시-6110000) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `자치법규일련번호` | int | 자치법규일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | string | 공포일자 |
| `공포번호` | string | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `지자체기관명` | string | 지자체기관명 |
| `자치법규종류` | string | 자치법규종류 |
| `시행일자` | string | 시행일자 |
| `자치법규상세링크` | string | 자치법규상세링크 |
| `자치법규분야명` | string | 자치법규분야명 |
| `참조데이터구분` | string | 참조데이터구분 |
| `기관코드` | string | 기관코드 |
| `기관별분류유형CNT` | string | 기관별 분류유형 갯수 |
| `분류seq` | int | 분류일련번호 |
| `분류명` | string | 분류명 |
| `해당자치법규갯수` | int | 해당자치법규갯수 |

#### 샘플 URL

- 1. 자치법규 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordin&type=XML`
- 2. 자치법규 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordin&type=HTML`
- 3. 자치법규명에 '청소년'이 포함된 자치법규 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordin&query=%EC%B2%AD%EC%86%8C%EB%85%84&type=JSON`
- 1. 자치법규 분야 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordinfd&org=6110000&type=XML`
- 2. 자치법규 분야 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordinfd&org=6110000&type=JSON`

---

### 자치법규 본문 조회 API

- **Target**: `ordin`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=ordin`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `target` | string : ordin(필수) | 서비스 대상 |
| `ID` | char | 자치법규ID |
| `MST` | string | 자치법규 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `자치법규ID` | int | 자치법규ID |
| `자치법규일련번호` | string | 자치법규일련번호 |
| `공포일자` | string | 공포일자 |
| `공포번호` | string | 공포번호 |
| `자치법규명` | string | 자치법규명 |
| `시행일자` | string | 시행일자 |
| `자치법규종류` | string | 자치법규종류 (C0001-조례 /C0002-규칙 /C0003-훈령  /C0004-예규/C0006-기타/C0010-고시 /C0011-의회규칙) |
| `지자체기관명` | string | 지자체기관명 |
| `자치법규발의종류` | string | 자치법규발의종류 |
| `담당부서명` | string | 담당부서명 |
| `전화번호` | string | 전화번호 |
| `제개정정보` | string | 제개정정보 |
| `조문번호` | string | 조문번호 |
| `조문여부` | string | 해당 조문이 조일때 Y,그 외 편,장,절,관 일때는 N |
| `조제목` | string | 조제목 |
| `조내용` | string | 조내용 |
| `부칙공포일자` | int | 부칙공포일자 |
| `부칙공포번호` | int | 부칙공포번호 |
| `부칙내용` | string | 부칙내용 |
| `부칙내용` | string | 부칙내용 |
| `별표` | string | 별표 (자치법규 별표는 서울시교육청과 본청만 제공합니다.) |
| `별표번호` | int | 별표번호 |
| `별표가지번호` | int | 별표가지번호 |
| `별표구분` | string | 별표구분 |
| `별표제목` | string | 별표제목 |
| `별표첨부파일명` | string | 별표첨부파일명 |
| `별표내용` | string | 별표내용 |
| `개정문내용` | string | 개정문내용 |
| `제개정이유내용` | string | 제개정이유내용 |

#### 샘플 URL

- 1. 자치법규 MST HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ordin&MST=1316146&type=HTML`
- 2. 자치법규 ID XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ordin&type=XML&ID=2026666`
- 3. 자치법규 ID JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ordin&type=JSON&ID=2251458`

---

## 판례/결정례

### 판례 목록 조회 API

- **Target**: `prec`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=prec`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : prec(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 판례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의(검색 결과 리스트) (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `org` | string | 법원종류 (대법원:400201, 하위법원:400202) |
| `curt` | string | 법원명 (대법원, 서울고등법원, 광주지법, 인천지방법원) |
| `JO` | string | 참조법령명(형법, 민법 등) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 사건명 오름차순 ldes : 사건명 내림차순 dasc : 선고일자 오름차순 ddes : 선고일자 내림차순(생략시 기본) nasc : 법원명 오름차순 ndes  |
| `date` | int | 판례 선고일자 |
| `prncYd` | string | 선고일자 검색(20090101~20090130) |
| `nb` | string | 판례 사건번호 |
| `datSrcNm` | string | 데이터출처명(국세법령정보시스템, 근로복지공단산재판례, 대법원) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `공포번호` | string | 공포번호 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위(EvtNm:판례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `prec id` | int | 검색결과번호 |
| `판례일련번호` | int | 판례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `선고일자` | string | 선고일자 |
| `법원명` | string | 법원명 |
| `법원종류코드` | int | 법원종류코드(대법원:400201, 하위법원:400202) |
| `사건종류명` | string | 사건종류명 |
| `사건종류코드` | int | 사건종류코드 |
| `판결유형` | string | 판결유형 |
| `선고` | string | 선고 |
| `데이터출처명` | string | 데이터출처명 |
| `판례상세링크` | string | 판례상세링크 |

#### 샘플 URL

- 1. 사건명에 '담보권'이 들어가는 판례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=XML&query=%EB%8B%B4%EB%B3%B4%EA%B6%8C`
- 2. 사건명에 '담보권'이 들어가고 법원이 '대법원'인 판례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=HTML&query=%EB%8B%B4%EB%B3%B4%EA%B6%8C&curt=%EB%8C%80%EB%B2%95%EC%9B%90`
- 3. 사건번호가 '2009느합133,2010느합21' 인 판례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=HTML&nb=2009%EB%8A%90%ED%95%A9133,2010%EB%8A%90%ED%95%A921`
- 4. 데이터출처가 근로복지공단산재판례인 판례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=JSON&datSrcNm=%EA%B7%BC%EB%A1%9C%EB%B3%B5%EC%A7%80%EA%B3%B5%EB%8B%A8%EC%82%B0%EC%9E%AC%ED%8C%90%EB%A1%80`

---

### 판례 본문 조회 API

- **Target**: `prec`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=prec`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : prec(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON *국세청 판례 본문 조회는 HTML만 가능합니다 |
| `ID` | char(필수) | 판례 일련번호 |
| `LM` | string | 판례명 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `판례정보일련번호` | int | 판례정보일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `선고일자` | int | 선고일자 |
| `선고` | string | 선고 |
| `법원명` | string | 법원명 |
| `법원종류코드` | int | 법원종류코드(대법원:400201, 하위법원:400202) |
| `사건종류명` | string | 사건종류명 |
| `사건종류코드` | int | 사건종류코드 |
| `판결유형` | string | 판결유형 |
| `판시사항` | string | 판시사항 |
| `판결요지` | string | 판결요지 |
| `참조조문` | string | 참조조문 |
| `참조판례` | string | 참조판례 |
| `판례내용` | string | 판례내용 |

#### 샘플 URL

- 1. 판례일련번호가 228541인 판례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=prec&ID=228541&type=HTML`
- 2. 판례일련번호가 228541인 판례 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=prec&ID=228541&type=XML`
- 3. 판례일련번호가 228541인 판례 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=prec&ID=228541&type=JSON`

---

### 헌재결정례 목록 조회 API

- **Target**: `detc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=detc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : detc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 헌재결정례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `sort` | string | 정렬옵션 (기본 : lasc 사건명 오름차순) ldes 사건명 내림차순 dasc : 선고일자 오름차순 ddes : 선고일자 내림차순 nasc : 사건번호 오름차순 ndes : 사건 |
| `date` | int | 종국일자 |
| `edYd` | string | 종국일자 기간 검색 |
| `nb` | int | 사건번호 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(EvtNm:헌재결정례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `detc id` | int | 검색결과번호 |
| `헌재결정례일련번호` | int | 헌재결정례일련번호 |
| `종국일자` | string | 종국일자 |
| `사건번호` | string | 사건번호 |
| `사건명` | string | 사건명 |
| `헌재결정례상세링크` | string | 헌재결정례상세링크 |

#### 샘플 URL

- 1. 사건명에 '벌금'이 들어가는 헌재결정례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=XML&query=%EB%B2%8C%EA%B8%88`
- 2. 종국일자가 '2015년 2월 10일'인 헌재결정례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=HTML&date=20150210`
- 3. 사건명에 '자동차'가 포함된 헌재결정례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=XML&query=%EC%9E%90%EB%8F%99%EC%B0%A8`
- 4. 사건명에 '자동차'가 포함된 헌재결정례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=JSON&query=%EC%9E%90%EB%8F%99%EC%B0%A8`

---

### 헌재결정례 본문 조회 API

- **Target**: `detc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=detc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : detc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 헌재결정례 일련번호 |
| `LM` | string | 헌재결정례명 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `헌재결정례일련번호` | int | 헌재결정례일련번호 |
| `종국일자` | int | 종국일자 |
| `사건번호` | string | 사건번호 |
| `사건명` | string | 사건명 |
| `사건종류명` | string | 사건종류명 |
| `사건종류코드` | int | 사건종류코드 |
| `재판부구분코드` | int | 재판부구분코드(전원재판부:430201, 지정재판부:430202) |
| `판시사항` | string | 판시사항 |
| `결정요지` | string | 결정요지 |
| `전문` | string | 전문 |
| `참조조문` | string | 참조조문 |
| `참조판례` | string | 참조판례 |
| `심판대상조문` | string | 심판대상조문 |

#### 샘플 URL

- 1. 헌재결정례 일련번호가 58386인 헌재결정례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=detc&ID=58386&type=HTML`
- 2. 자동차관리법제26조등위헌확인등 헌재결정례 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=detc&ID=127830&LM=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%EC%A0%9C26%EC%A1%B0%EB%93%B1%EC%9C%84%ED%97%8C%ED%99%95%EC%9D%B8%EB%93%B1&type=XML`
- 3. 헌재결정례 일련번호가 58400인 헌재결정례 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=detc&ID=58400&type=JSON`

---

### 법령해석례 목록 조회 API

- **Target**: `expc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=expc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : expc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | inq | 질의기관 |
| `rpl` | int | 회신기관 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호13-0217 검색을 원할시 itmno=130217 |
| `regYd` | string | 등록일자 검색(20090101~20090130) |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석례명 오름차순) ldes 법령해석례명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 nde |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `expc id` | int | 검색결과번호 |
| `법령해석례일련번호` | int | 법령해석례일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `회신기관코드` | string | 회신기관코드 |
| `회신기관명` | string | 회신기관명 |
| `회신일자` | string | 회신일자 |
| `법령해석례상세링크` | string | 법령해석례상세링크 |

#### 샘플 URL

- 1. 안건명에 '임차'가 들어가는 법령해석례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=expc&type=XML&query=%EC%9E%84%EC%B0%A8`
- 2. 안건명에 '주차'가 들어가는 법령해석례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=expc&type=HTML&query=%EC%A3%BC%EC%B0%A8`
- 3. 안건명에 '자동차'가 들어가는 법령해석례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=expc&type=JSON&query=%EC%9E%90%EB%8F%99%EC%B0%A8`

---

### 법령해석례 본문 조회 API

- **Target**: `expc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=expc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : expc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석례 일련번호 |
| `LM` | string | 법령해석례명 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석례일련번호` | int | 법령해석례일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |

#### 샘플 URL

- 1. 법령해석례일련번호가 333827인 해석례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=expc&ID=334617&type=HTML`
- 2. 여성가족부 - 건강가정기본법 제35조 제2항 관련 법령해석례 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=expc&ID=315191&LM=%EC%97%AC%EC%84%B1%EA%B0%80%EC%A1%B1%EB%B6%80%20-%20%EA%B1%B4%EA%B0%95%EA%B0%80%EC%A0%95%EA%B8%B0%EB%B3%B8%EB%B2%95%20%EC%A0%9C35%EC%A1%B0%20%EC%A0%9C2%ED%95%AD%20%EA%B4%80%EB%A0%A8&type=XML`
- 3. 법령해석례일련번호가 330471 해석례 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=expc&ID=330471&type=JSON`

---

### 행정심판례 목록 조회 API

- **Target**: `decc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=decc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : decc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 행정심판례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `cls` | string | 재결례유형(출력 결과 필드에 있는 재결구분코드) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `date` | int | 의결일자 |
| `dpaYd` | string | 처분일자 검색(20090101~20090130) |
| `rslYd` | string | 의결일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 사건번호 오름차순 ndes :  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(EvtNm:재결례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `decc id` | int | 검색결과번호 |
| `행정심판재결례일련번호` | int | 행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `처분일자` | string | 처분일자 |
| `의결일자` | string | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | int | 재결청 |
| `재결구분명` | string | 재결구분명 |
| `재결구분코드` | string | 재결구분코드 |
| `행정심판례상세링크` | string | 행정심판례상세링크 |

#### 샘플 URL

- 1. 행정심판재결례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=XML`
- 2. 행정심판재결례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=HTML`
- 3. 행정심판재결례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=JSON`
- 4. 행정심판재결례 목록 중 ‘ㄱ’으로 시작하는 재결례 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=XML&gana=ga`

---

### 행정심판례 본문 조회 API

- **Target**: `decc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=decc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : decc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 행정심판례 일련번호 |
| `LM` | string | 행정심판례명 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `행정심판례일련번호` | int | 행정심판례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `처분일자` | int | 처분일자 |
| `의결일자` | int | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | string | 재결청 |
| `재결례유형명` | string | 재결례유형명 |
| `재결례유형코드` | int | 재결례유형코드 |
| `주문` | string | 주문 |
| `청구취지` | string | 청구취지 |
| `이유` | string | 이유 |
| `재결요지` | string | 재결요지 |

#### 샘플 URL

- 1. 행정심판례 일련번호가 243263인 행정심판례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=decc&ID=243263&type=HTML`
- 2. 감리업무정지처분취소청구 행정심판례 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=decc&ID=245011&LM=%EA%B3%BC%EC%A7%95%EA%B8%88%20%EB%B6%80%EA%B3%BC%EC%B2%98%EB%B6%84%20%EC%B7%A8%EC%86%8C%EC%B2%AD%EA%B5%AC&type=XML`
- 3. 행정심판례 일련번호가 223311인 행정심판례 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=decc&ID=223311&type=JSON`

---

## 조약

### 조약 목록 조회 API

- **Target**: `trty`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=trty`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : trty(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 조약명) 2 : 조약본문 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (검색 결과 리스트) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `eftYd` | string | 발효일자 검색(20090101~20090130) |
| `concYd` | string | 체결일자 검색(20090101~20090130) |
| `cls` | int | 1 : 양자조약 2 : 다자조약 |
| `natCd` | int | 국가코드 |
| `sort` | string | 정렬옵션 (기본 : lasc 조약명오름차순) ldes 조약명내림차순 dasc : 발효일자 오름차순 ddes : 발효일자 내림차순 nasc : 조약번호 오름차순 ndes : 조약번호 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(TrtyNm:조약명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `trty id` | int | 검색결과번호 |
| `조약일련번호` | int | 조약일련번호 |
| `조약명` | string | 조약명 |
| `조약구분코드` | string | 조약구분코드 |
| `조약구분명` | string | 조약구분명 |
| `발효일자` | string | 발효일자 |
| `서명일자` | string | 서명일자 |
| `관보게제일자` | string | 관보게제일자 |
| `조약번호` | int | 조약번호 |
| `국가번호` | int | 국가번호 |
| `조약상세링크` | string | 조약상세링크 |

#### 샘플 URL

- 1. 조약 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=trty&type=XML`
- 2. 조약 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=trty&ID=284&type=HTML`
- 3. 조약 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=trty&ID=284&type=JSON`
- 4. 다자조약 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=trty&type=XML&cls=2`

---

### 조약 본문 조회 API

- **Target**: `trty`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=trty`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : trty(필수) | 서비스 대상 |
| `type` | char | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 조약 ID |
| `chrClsCd` | char | 한글/영문 : 010202(한글)/ 010203(영문) (default = 010202) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `조약일련번호` | int | 조약일련번호 |
| `조약명_한글` | string | 조약명한글 |
| `조약명_영문` | string | 조약명영문 |
| `조약구분코드` | int | 조약구분코드(양자조약:440101, 다자조약:440102) |
| `대통령재가일자` | int | 대통령재가일자 |
| `발효일자` | int | 발효일자 |
| `조약번호` | int | 조약번호 |
| `관보게재일자` | int | 관보게재일자 |
| `국무회의심의일자` | int | 국무회의심의일자 |
| `국무회의심의회차` | int | 국무회의심의회차 |
| `국회비준동의여부` | string | 국회비준동의여부 |
| `국회비준동의일자` | string | 국회비준동의일자 |
| `서명일자` | int | 서명일자 |
| `서명장소` | string | 서명장소 |
| `비고` | string | 비고 |
| `추가정보` | string | 추가정보 |
| `체결대상국가` | string | 체결대상국가 |
| `체결대상국가한글` | string | 체결대상국가한글 |
| `우리측국내절차완료통보` | int | 우리측국내절차완료통보일 |
| `상대국측국내절차완료통보` | int | 상대국측국내절차완료통보일 |
| `양자조약분야코드` | int | 양자조약분야코드 |
| `양자조약분야명` | string | 양자조약분야명 |
| `제2외국어종류` | string | 제2외국어종류 |
| `국가코드` | string | 국가코드 |
| `조약내용` | string | 조약내용 |
| `체결일자` | string | 체결일자 |
| `체결장소` | string | 체결장소 |
| `기탁처` | string | 기탁처 |
| `다자조약분야코드` | string | 다자조약분야코드 |
| `다자조약분야명` | string | 다자조약분야명 |
| `수락서기탁일자` | string | 수락서기탁일자 |
| `국내발효일자` | string | 국내발효일자 |

#### 샘플 URL

- 1. 조약 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=983&type=HTML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=983&type=HTML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=2120&type=HTML`
- 2. 조약 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=983&type=XML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=983&type=XML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=2120&type=XML`
- 3. 조약 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=983&type=JSON`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=983&type=JSON
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=2120&type=JSON`

---

## 부가서비스

### 법령 체계도 목록 조회 가이드API

- **Target**: `lsStmd`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lsStmd`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsStmd(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `query` | string | 법령명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호  |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `date` | int | 공포일자 검색 |
| `nb` | int | 공포번호 검색 |
| `ancNo` | string | 공포번호 범위 검색 (10000~20000) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 법령종류(코드제공) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `numOfRows` | int | 페이지 당 출력 결과 수 |
| `resultCode` | int | 조회 여부(성공 : 00 / 실패 : 01) |
| `resultMsg` | int | 조회 여부(성공 : success / 실패 : fail) |
| `law id` | int | 검색 결과 순번 |
| `법령 일련번호` | int | 법령 일련번호 |
| `법령명` | string | 법령명 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처코드` | int | 소관부처코드 |
| `소관부처명` | string | 소관부처명 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `본문 상세링크` | string | 본문 상세링크 |

#### 샘플 URL

- 1. 자동차관리법 법령체계도 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsStmd&type=HTML&query=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95`
- 2. 'ㄱ'으로 시작하는 법령체계도 HTML조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsStmd&type=HTML&gana=ga`
- 3. 법령체계도 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsStmd&type=XML`
- 4. 법령체계도 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsStmd&type=JSON`

---

### 법령 체계도 본문 조회 가이드API

- **Target**: `lsStmd`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=lsStmd`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsStmd(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `LM` | string | 법령의 법령명(법령명 입력시 해당 법령 링크) |
| `LD` | int | 법령의 공포일자 |
| `LN` | int | 법령의 공포번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `기본정보` | string | 기본정보 |
| `법령ID` | int | 법령ID |
| `법령일련번호` | int | 법령일련번호 |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `법종구분` | string | 법종구분 |
| `법령명` | string | 법령 |
| `시행일자` | int | 시행일자 |
| `제개정구분` | string | 제개정구분 |
| `상하위법` | string | 상하위법 |
| `법률` | string | 법률 |
| `시행령` | string | 시행령 |
| `시행규칙` | string | 시행규칙 |
| `본문 상세링크` | string | 본문 상세링크 |

#### 샘플 URL

- 1. 법령체계도 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsStmd&MST=142362&type=HTML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=lsStmd&MST=142362&type=HTML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsStmd&MST=166519&type=HTML`
- 2. 법령체계도 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsStmd&MST=142362&type=XML`
- 3. 법령체계도 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsStmd&MST=142362&type=JSON`

---

### 신구법 목록 조회 가이드API

- **Target**: `oldAndNew`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=oldAndNew`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : oldAndNew(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `query` | string | 법령명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호  |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `date` | int | 공포일자 검색 |
| `nb` | int | 공포번호 검색 |
| `ancNo` | string | 공포번호 범위 검색 (10000~20000) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 법령종류(코드제공) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `numOfRows` | int | 페이지 당 출력 결과 수 |
| `resultCode` | int | 조회 여부(성공 : 00 / 실패 : 01) |
| `resultMsg` | int | 조회 여부(성공 : success / 실패 : fail) |
| `oldAndNew id` | int | 검색 결과 순번 |
| `신구법일련번호` | int | 신구법 일련번호 |
| `현행연혁구분` | string | 현행연혁코드 |
| `신구법명` | string | 신구법명 |
| `신구법ID` | int | 신구법ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처코드` | int | 소관부처코드 |
| `소관부처명` | string | 소관부처명 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `신구법상세링크` | string | 신구법 상세링크 |

#### 샘플 URL

- 1. 자동차관리법 신구법 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oldAndNew&type=HTML&query=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95`
- 2. 시행일자 범위 신구법 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oldAndNew&type=HTML&efYd=20150101~20150131`
- 3. 신구법 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oldAndNew&type=XML`
- 4. 신구법 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oldAndNew&type=JSON`

---

### 신구법 본문 조회 가이드API

- **Target**: `oldAndNew`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=oldAndNew`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : oldAndNew(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `LM` | string | 법령의 법령명(법령명 입력시 해당 법령 링크) |
| `LD` | int | 법령의 공포일자 |
| `LN` | int | 법령의 공포번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `구조문_기본정보` | string | 구조문_기본정보 |
| `법령일련번호` | int | 법령일련번호 |
| `법령ID` | int | 법령ID |
| `시행일자` | int | 시행일자 |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `현행여부` | string | 현행여부 |
| `제개정구분명` | string | 제개정구분명 |
| `법령명` | string | 법령 |
| `법종구분` | string | 법종구분 |
| `신조문_기본정보` | string | 구조문과 동일한 기본 정보 들어가 있음. |
| `구조문목록` | string | 구조문목록 |
| `조문` | string | 조문 |
| `신조문목록` | string | 신조문목록 |
| `조문` | string | 조문 |
| `신구법존재여부` | string | 신구법이 존재하지 않을 경우 N이 조회. |

#### 샘플 URL

- 1. 신구법 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oldAndNew&ID=000170&MST=122682&type=HTML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=oldAndNew&ID=000170&MST=122682&type=HTML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oldAndNew&MST=136931&type=HTML`
- 2. 신구법 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oldAndNew&MST=122682&type=XML`
- 3. 신구법 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oldAndNew&MST=122682&type=JSON`

---

### 3단 비교 목록 조회 가이드API

- **Target**: `thdCmp`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=thdCmp`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : thdCmp(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `query` | string | 법령명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호  |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `date` | int | 공포일자 검색 |
| `nb` | int | 공포번호 검색 |
| `ancNo` | string | 공포번호 범위 검색 (10000~20000) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 법령종류(코드제공) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `numOfRows` | int | 페이지 당 출력 결과 수 |
| `resultCode` | int | 조회 여부(성공 : 00 / 실패 : 01) |
| `resultMsg` | int | 조회 여부(성공 : success / 실패 : fail) |
| `thdCmp id` | int | 검색결과 순번 |
| `삼단비교일련번호` | int | 삼단비교 일련번호 |
| `법령명 한글` | string | 법령명 한글 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처코드` | int | 소관부처코드 |
| `소관부처명` | string | 소관부처명 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `인용조문_삼단비교상세링크` | string | 인용조문_삼단비교 상세링크 |
| `위임조문_삼단비교상세링크` | string | 위임조문_삼단비교 상세링크 |

#### 샘플 URL

- 1. 자동차관리법 3단비교 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=thdCmp&type=HTML&query=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95`
- 2. 법령 제개정 종류(제정) 3단비교 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=thdCmp&type=HTML&rrClsCd=300201`
- 3. 3단비교 목록 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=thdCmp&type=XML`
- 4. 3단비교 목록 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=thdCmp&type=JSON`

---

### 3단비교 본문 조회 가이드API

- **Target**: `thdCmp`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=thdCmp`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : thdCmp(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `knd` | int(필수) | 3단비교 종류별 검색 인용조문 : 1 / 위임조문 : 2 |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `LM` | string | 법령의 법령명(법령명 입력시 해당 법령 링크) |
| `LD` | int | 법령의 공포일자 |
| `LN` | int | 법령의 공포번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `기본정보` | string | 인용 삼단비교 기본정보 |
| `법령ID` | int | 법령 ID |
| `시행령ID` | int | 시행령 ID |
| `시행규칙ID` | int | 시행규칙 ID |
| `법령명` | string | 법령 명 |
| `시행령명` | string | 법령시행령 명 |
| `시행규칙명` | string | 시행규칙 명 |
| `법령요약정보` | string | 법령 요약정보 |
| `시행령요약정보` | string | 시행령 요약정보 |
| `시행규칙요약정보` | string | 시행규칙 요약정보 |
| `삼단비교기준` | string | 삼단비교 기준 |
| `삼단비교존재여부` | int | 삼단비교 존재하지 않으면 N이 조회. |
| `시행일자` | int | 시행일자 |
| `관련삼단비교목록` | string | 관련 삼단비교 목록 |
| `목록명` | string | 목록명 |
| `삼단비교목록상세링크` | string | 인용조문 삼단비교 목록 상세링크 |
| `인용조문삼단비교` | string | 인용조문 삼단비교 |
| `법률조문` | string | 법률조문 |
| `조번호` | int | 조번호 |
| `조가지번호` | int | 조가지번호 |
| `조제목` | string | 조제목 |
| `조내용` | string | 조내용 |
| `시행령조문목록` | string | 시행령조문목록 |
| `시행령조문` | string | 하위 시행령조문 |
| `시행규칙조문목록` | string | 시행규칙조문목록 |
| `시행규칙조문` | string | 하위 시행규칙조문 |
| `위임행정규칙목록` | string | 위임행정규칙목록 |
| `위임행정규칙` | string | 위임행정규칙 |
| `위임행정규칙명` | string | 위임행정규칙명 |
| `위임행정규칙일련번호` | int | 위임행정규칙일련번호 |
| `위임행정규칙조번호` | int | 위임행정규칙조번호 |
| `위임행정규칙조가지번호` | int | 위임행정규칙조가지번호 |
| `기본정보` | string | 위임 삼단비교 기본정보 |
| `법령ID` | int | 법령 ID |
| `법령일련번호` | int | 법령일련번호 |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `법종구분` | string | 법종 구분 |
| `법령명` | string | 법령 명 |
| `시행일자` | int | 시행일자 |
| `제개정구분` | string | 제개정구분 |
| `삼단비교존재여부` | int | 삼단비교 존재하지 않으면 N이 조회. |
| `기준법법령명` | string | 기준법 법령명 |
| `기준법령목록` | string | 기준 법령 목록 |
| `기준법법령명` | string | 기준법 법령명 |
| `법종구분` | string | 법종 구분 |
| `공포번호` | int | 공포번호 |
| `공포일자` | int | 공포일자 |
| `제개정구분` | string | 제개정구분 |
| `위임3비교상세링크` | string | 위임조문 3비교 목록 상세링크 |
| `위임조문삼단비교` | string | 위임조문 삼단비교 |
| `법률조문` | string | 법률조문 |
| `조번호` | int | 조번호 |
| `조가지번호` | int | 조가지번호 |
| `조제목` | string | 조제목 |
| `조내용` | string | 조내용 |
| `시행령조문` | string | 하위 시행령조문 |
| `시행규칙조문목록` | string | 시행규칙조문목록 |
| `시행규칙조문` | string | 하위 시행규칙조문 |

#### 샘플 URL

- 1. 3단비교 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=thdCmp&ID=001372&MST=162662&type=HTML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=thdCmp&ID=001372&MST=162662&type=HTML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=thdCmp&ID=001570&type=HTML`
- 2. 인용조문 3단비교 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=thdCmp&MST=236231&knd=1&type=XML`
- 3. 위임조문 3단비교 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=thdCmp&MST=222549&knd=2&type=XML`
- 4. 위임조문 3단비교 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=thdCmp&MST=222549&knd=2&type=JSON`

---

### 행정규칙 신구법비교 목록 조회 가이드API

- **Target**: `admrulOldAndNew`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=admrulOldAndNew`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : admrulOldAndNew(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `query` | string | 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 행정규칙 종류별 검색 (1=훈령/2=예규/3=고시 /4=공고/5=지침/6=기타) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 발령일자 오름차순 ddes : 발령일자 내림차순 nasc : 발령번호 오름차순 ndes : 발령번호  |
| `date` | string | 행정규칙 발령일자 |
| `prmlYd` | string | 발령일자 기간검색(20090101~20090130) |
| `nb` | int | 행정규칙 발령번호 ex)제2023-8호 검색을 원할시 nb=20238 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `numOfRows` | int | 페이지 당 출력 결과 수 |
| `resultCode` | int | 조회 여부(성공 : 00 / 실패 : 01) |
| `resultMsg` | int | 조회 여부(성공 : success / 실패 : fail) |
| `oldAndNew id` | int | 검색 결과 순번 |
| `신구법일련번호` | int | 신구법 일련번호 |
| `현행연혁구분` | string | 현행연혁코드 |
| `신구법명` | string | 신구법명 |
| `신구법ID` | int | 신구법ID |
| `발령일자` | int | 발령일자 |
| `발령번호` | int | 발령번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처코드` | int | 소관부처코드 |
| `소관부처명` | string | 소관부처명 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `신구법상세링크` | string | 신구법 상세링크 |

#### 샘플 URL

- 1. 행정규칙 신구법비교 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrulOldAndNew&type=HTML`
- 2. 119항공대 운영 규정 신구법비교 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrulOldAndNew&type=XML&query=119%ED%95%AD%EA%B3%B5%EB%8C%80%20%EC%9A%B4%EC%98%81%20%EA%B7%9C%EC%A0%95`
- 3. 119항공대 운영 규정 신구법비교 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrulOldAndNew&type=JSON&query=119%ED%95%AD%EA%B3%B5%EB%8C%80%20%EC%9A%B4%EC%98%81%20%EA%B7%9C%EC%A0%95`

---

### 행정규칙 신구법 본문 조회 가이드API

- **Target**: `admrulOldAndNew`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=admrulOldAndNew`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : admrulOldAndNew(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 행정규칙 일련번호 (ID 또는 LID 중 하나는 반드시 입력) |
| `LID` | char | 행정규칙 ID (ID 또는 LID 중 하나는 반드시 입력) |
| `LM` | string | 행정규칙명 조회하고자 하는 정확한 행정규칙명을 입력 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `구조문_기본정보` | string | 구조문_기본정보 |
| `행정규칙일련번호` | int | 행정규칙일련번호 |
| `행정규칙ID` | int | 행정규칙ID |
| `시행일자` | int | 시행일자 |
| `발령일자` | int | 발령일자 |
| `발령번호` | int | 발령번호 |
| `현행여부` | string | 현행여부 |
| `제개정구분명` | string | 제개정구분명 |
| `행정규칙명` | string | 행정규칙명 |
| `행정규칙종류` | string | 행정규칙종류 |
| `신조문_기본정보` | string | 구조문과 동일한 기본 정보 들어가 있음. |
| `구조문목록` | string | 구조문목록 |
| `조문` | string | 조문 |
| `신조문목록` | string | 신조문목록 |
| `조문` | string | 조문 |
| `신구법존재여부` | string | 신구법이 존재하지 않을 경우 N이 조회. |

#### 샘플 URL

- 1. 119항공대 운영 규정 신구법비교 HTML 조회
  `http://law.go.kr/DRF/lawService.do?OC=test&target=admrulOldAndNew&ID=2100000248758&type=HTML`
- 2. 119항공대 운영 규정 신구법비교 XML 조회
  `http://law.go.kr/DRF/lawService.do?OC=test&target=admrulOldAndNew&ID=2100000248758&type=XML`
- 3. 119항공대 운영 규정 신구법비교 JSON 조회
  `http://law.go.kr/DRF/lawService.do?OC=test&target=admrulOldAndNew&ID=2100000248758&type=JSON`

---

## 모바일

### 모바일 법령 목록 조회 가이드API

- **Target**: `law`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=law&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : law(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령명) 2 : 본문검색 |
| `query` | string | 법령명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호 |
| `date` | int | 법령의 공포일자 검색 |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `ancNo` | string | 공포번호 범위 검색(306~400) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `nb` | int | 법령의 공포번호 검색 |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 법령종류(코드제공) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `법령일련번호` | int | 법령일련번호 |
| `현행연혁코드` | string | 현행연혁코드 |
| `법령명한글` | string | 법령명한글 |
| `법령약칭명` | string | 법령약칭명 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | string | 소관부처코드 |
| `법령구분명` | string | 법령구분명 |
| `공동부령구분` | string | 공동부령구분 |
| `공포번호` | string | 공포번호(공동부령의 공포번호) |
| `시행일자` | int | 시행일자 |
| `자법타법여부` | string | 자법타법여부 |
| `법령상세링크` | string | 법령상세링크 |

#### 샘플 URL

- 1. 현행법령 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=XML&mobileYn=Y`
- 2. 현행법령 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=HTML&mobileYn=Y`
- 3. 현행법령 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=JSON&mobileYn=Y`
- 4. 법령 검색 : 자동차관리법
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=XML&mobileYn=Y&query=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95`
- 5. 법령 공포일자 내림차순 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=XML&sort=ddes&mobileYn=Y`
- 6. 소관부처가 경찰청인 법령 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=law&type=XML&org=1320000&mobileYn=Y`

---

### 모바일 법령 본문 조회 가이드API

- **Target**: `law`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=law&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : law(필수) | 서비스 대상 |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령 마스터 번호 법령테이블의 lsi_seq 값을 의미함 |
| `LM` | string | 법령의 법령명(법령명 입력시 해당 법령 링크) |
| `LD` | int | 법령의 공포일자 |
| `LN` | int | 법령의 공포번호 |
| `JO` | int:6 | 조번호 생략(기본값) : 모든 조를 표시함 6자리숫자 : 조번호(4자리)+조가지번호(2자리) (000200 : 2조, 001002 : 10조의 2) |
| `PD` | char | 부칙표시 ON일 경우 부칙 목록만 출력 생략할 경우 법령 + 부칙 표시 |
| `PN` | int | 부칙번호 해당 부칙번호에 해당하는 부칙 보기 |
| `BD` | char | 별표표시 생략(기본값) : 법령+별표 ON : 모든 별표 표시 |
| `BT` | int | 별표구분 별표표시가 on일 경우 값을 읽어들임 (별표=1/서식=2/별지=3/별도=4/부록=5) |
| `BN` | int | 별표번호 별표표시가 on일 경우 값을 읽어들임 |
| `BG` | int | 별표가지번호 별표표시가 on일 경우 값을 읽어들임 |
| `type` | char | 출력 형태 : HTML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 자동차관리법 ID HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&ID=1747&type=HTML&mobileYn=Y`
- 2. 자동차관리법 법령 seq HTML조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=law&MST=91689&type=HTML&mobileYn=Y`

---

### 모바일 행정규칙 목록 조회 가이드API

- **Target**: `admrul`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=admrul&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : admrul(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `nw` | int | (1: 현행, 2: 연혁, 기본값: 현행) |
| `search` | int | 검색범위 (기본 : 1 행정규칙명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의(검색 결과 리스트) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `org` | string | 소관부처별 검색 (코드 별도 제공) |
| `knd` | string | 행정규칙 종류별 검색 (1=훈령/2=예규/3=고시/4=공고/5=지침/6=기타) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `sort` | string | 정렬옵션 (기본 : lasc 행정규칙명 오른차순) ldes 행정규칙명 내림차순 dasc : 발령일자 오름차순 ddes : 발령일자 내림차순 nasc : 발령번호 오름차순 ndes  |
| `date` | int | 행정규칙 발령일자 |
| `prmlYd` | string | 발령일자 기간검색(20090101~20090130) |
| `nb` | int | 행정규칙 발령번호 |
| `mobileYn` | char:Y(필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 검색키워드 |
| `section` | string | 검색범위(AdmRulNm:행정규칙명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `admrul id` | int | 검색결과번호 |
| `행정규칙일련번호` | int | 행정규칙일련번호 |
| `행정규칙명` | string | 행정규칙명 |
| `행정규칙종류` | string | 행정규칙종류 |
| `발령일자` | string | 발령일자 |
| `발령번호` | string | 발령번호 |
| `소관부처명` | string | 소관부처명 |
| `현행연혁구분` | string | 현행연혁구분 |
| `제개정구분코드` | string | 제개정구분코드 |
| `제개정구분명` | string | 제개정구분명 |
| `행정규칙ID` | string | 행정규칙ID |
| `행정규칙상세링크` | string | 행정규칙상세링크 |
| `시행일자` | string | 시행일자 |
| `생성일자` | string | 생성일자 |

#### 샘플 URL

- 1. 행정규칙 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&type=XML&mobileYn=Y`
- 2. 행정규칙 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&type=HTML&mobileYn=Y`
- 3. 행정규칙 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&type=JSON&mobileYn=Y`
- 4. 행정규칙명에 '소방'이 포함된 행정규칙 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&type=XML&mobileYn=Y&query=%EC%86%8C%EB%B0%A9`
- 5. 발령일자가 2015년 3월 1일인 행정규칙 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&type=XML&date=20150301&mobileYn=Y`
- 6. 발령번호가 331인 행정규칙 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admrul&type=XML&nb=331&mobileYn=Y`

---

### 모바일 행정규칙 본문 조회 가이드API

- **Target**: `admrul`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=admrul&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : admrul(필수) | 서비스 대상 |
| `ID` | char | 행정규칙 일련번호 |
| `LM` | Char | 행정규칙명 조회하고자 하는 정확한 행정규칙명을 입력 |
| `type` | Char | 출력 형태 : HTML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 행정규칙 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=admrul&ID=62505&type=HTML&mobileYn=Y`

---

### 모바일 자치법규 목록 조회 가이드API

- **Target**: `ordin`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=ordin&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ordin(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `nw` | int | (1: 현행, 2: 연혁, 기본값: 현행) |
| `search` | int | 검색범위 (기본 : 1 자치법규명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의(default=*) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공 |
| `date` | int | 자치법규 공포일자 검색 |
| `efYd` | string | 시행일자 범위 검색(20090101~20090130) |
| `ancYd` | string | 공포일자 범위 검색(20090101~20090130) |
| `ancNo` | string | 공포번호 범위 검색(306~400) |
| `nb` | int | 법령의 공포번호 검색 |
| `org` | string | 지자체별 도·특별시·광역시 검색(지자체코드 제공) (ex. 서울특별시에 대한 검색-> org=6110000) |
| `sborg` | string | 지자체별 시·군·구 검색(지자체코드 제공) (필수값 : org, ex.서울특별시 구로구에 대한 검색-> org=6110000&sborg=3160000) |
| `knd` | string | 법령종류 (30001-조례 /30002-규칙 /30003-훈령 /30004-예규/30006-기타/30010-고시 /30011-의회규칙) |
| `rrClsCd` | string | 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 300206-일괄개정 300207-일괄폐지 / |
| `ordinFd` | int | 분류코드별 검색. 분류코드는 지자체 분야코드 openAPI 참조 |
| `lsChapNo` | string | 법령분야별 검색(법령분야코드제공) (ex. 제1편 검색 lsChapNo=01000000 / 제1편2장,제1편2장1절 lsChapNo=01020000,01020100) |
| `gana` | string(org 값 필수) | 사전식 검색 (ga,na,da…,etc) |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(ordinNm:자치법규명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `law id` | int | 검색결과번호 |
| `자치법규일련번호` | int | 자치법규일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | string | 공포일자 |
| `공포번호` | string | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `지자체기관명` | string | 지자체기관명 |
| `자치법규종류` | string | 자치법규종류 |
| `시행일자` | string | 시행일자 |
| `자치법규상세링크` | string | 자치법규상세링크 |
| `자치법규분야명` | string | 자치법규분야명 |
| `참조데이터구분` | string | 참조데이터구분 |

#### 샘플 URL

- 1. 자치법규 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordin&type=XML&mobileYn=Y`
- 2. 자치법규 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordin&type=HTML&mobileYn=Y`
- 3. 자치법규 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordin&type=JSON&mobileYn=Y`
- 4. 자치법규명에 서울이 포함된 자치법규 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordin&query=%EC%84%9C%EC%9A%B8&type=HTML&mobileYn=Y`

---

### 모바일 자치법규 본문 조회 가이드API

- **Target**: `ordin`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=ordin`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ordin(필수) | 서비스 대상 |
| `ID` | char | 자치법규 ID |
| `MST` | string | 자치법규 마스터 번호 |
| `type` | char | 출력 형태 : HTML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 자치법규 ID HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ordin&ID=2047729&type=HTML&mobileYn=Y`
- 2. 자치법규 MST HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ordin&type=HTML&mobileYn=Y&MST=1062134`

---

### 모바일 판례 목록 조회 가이드API

- **Target**: `prec`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=prec&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : prec(필수) | 서비스 대상 |
| `type` | char | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 판례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의(검색 결과 리스트) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `org` | string | 법원종류 (대법원:400201, 하위법원:400202) |
| `curt` | string | 법원명 (대법원, 서울고등법원, 광주지법, 인천지방법원) |
| `JO` | string | 참조법령명(형법, 민법 등) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 사건명 오름차순 ldes : 사건명 내림차순 dasc : 선고일자 오름차순 ddes : 선고일자 내림차순(생략시 기본) nasc : 법원명 오름차순 ndes  |
| `date` | int | 판례 선고일자 |
| `prncYd` | string | 선고일자 검색(20090101~20090130) |
| `nb` | int | 판례 사건번호 |
| `datSrcNm` | string | 데이터출처명(국세법령정보시스템, 근로복지공단산재판례, 대법원) |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위(EvtNm:판례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `prec id` | int | 검색결과번호 |
| `판례일련번호` | int | 판례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `선고일자` | string | 선고일자 |
| `법원명` | string | 법원명 |
| `법원종류코드` | int | 법원종류코드(대법원:400201, 하위법원:400202) |
| `사건종류명` | string | 사건종류명 |
| `사건종류코드` | int | 사건종류코드 |
| `판결유형` | string | 판결유형 |
| `선고` | string | 선고 |
| `데이터출처명` | string | 데이터출처명 |
| `판례상세링크` | string | 판례상세링크 |

#### 샘플 URL

- 1. 판례 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=XML&mobileYn=Y`
- 2. 판례 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=HTML&mobileYn=Y`
- 3. 판례 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=JSON&mobileYn=Y`
- 4. 자동차가 포함된 판례 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=XML&mobileYn=Y&query=%EC%9E%90%EB%8F%99%EC%B0%A8`
- 5. 자동차가 포함된 판례 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&query=%EC%9E%90%EB%8F%99%EC%B0%A8&type=HTML&mobileYn=Y`
- 6. 선고일자가 2015년 1월 29일인 판례검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=prec&type=XML&date=20150129&mobileYn=Y`

---

### 모바일 판례 본문 조회 가이드API

- **Target**: `prec`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=prec&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : prec(필수) | 서비스 대상 |
| `ID` | char(필수) | 판례 일련번호 |
| `LM` | string | 판례명 |
| `type` | string | 출력 형태 : HTML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 판례일련번호가 96538인 판례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=prec&ID=228547&type=HTML&mobileYn=Y`

---

### 모바일 헌재결정례 목록 조회 가이드API

- **Target**: `detc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=detc&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : detc(필수) | 서비스 대상 |
| `type` | char | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 헌재결정례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의(검색 결과 리스트) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `sort` | string | 정렬옵션 (기본 : lasc 사건명 오름차순) ldes 사건명 내림차순 dasc : 선고일자 오름차순 ddes : 선고일자 내림차순 nasc : 사건번호 오름차순 ndes : 사건 |
| `date` | int | 종국일자 |
| `nb` | int | 사건번호 |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(EvtNm:헌재결정례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `detc id` | int | 검색결과번호 |
| `헌재결정례일련번호` | int | 헌재결정례일련번호 |
| `종국일자` | string | 종국일자 |
| `사건번호` | string | 사건번호 |
| `사건명` | string | 사건명 |
| `헌재결정례상세링크` | string | 헌재결정례상세링크 |

#### 샘플 URL

- 1. 헌재결정례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=XML&mobileYn=Y`
- 2. 헌재결정례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=HTML&mobileYn=Y`
- 3. 헌재결정례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=JSON&mobileYn=Y`
- 4. 자동차가 포함된 헌재결정례 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=XML&mobileYn=Y&query=%EC%9E%90%EB%8F%99%EC%B0%A8`
- 5. 선고일자가 2015년 2월 10일인 헌재결정례검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=detc&type=XML&date=20150210&mobileYn=Y`

---

### 모바일 헌재결정례 본문 조회 가이드API

- **Target**: `detc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=detc&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : detc(필수) | 서비스 대상 |
| `ID` | char(필수) | 헌재결정례 일련번호 |
| `LM` | string | 헌재결정례명 |
| `type` | string | 출력 형태 : HTML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 헌재결정례 일련번호가 58386인 헌재결정례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=detc&ID=58386&type=HTML&mobileYn=Y`
- 2. 산림기술자 자격취소처분 취소청구 등 헌재결정례 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=detc&ID=127830&LM=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95%EC%A0%9C26%EC%A1%B0%EB%93%B1%EC%9C%84%ED%97%8C%ED%99%95%EC%9D%B8%EB%93%B1&type=HTML&mobileYn=Y`

---

### 모바일 법령해석례 목록 조회 가이드API

- **Target**: `expc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=expc&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : expc(필수) | 서비스 대상 |
| `type` | char | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의(검색 결과 리스트) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | inq | 질의기관 |
| `rpl` | int | 회신기관 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 |
| `regYd` | string | 등록일자 검색(20090101~20090130) |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석례명 오름차순) ldes 법령해석례명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 nde |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `expc id` | int | 검색결과번호 |
| `법령해석례일련번호` | int | 법령해석례일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `회신기관코드` | string | 회신기관코드 |
| `회신기관명` | string | 회신기관명 |
| `회신일자` | string | 회신일자 |
| `법령해석례상세링크` | string | 법령해석례상세링크 |

#### 샘플 URL

- 1. 법령해석례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=expc&type=XML&mobileYn=Y`
- 2. 법령해석례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=expc&type=HTML&mobileYn=Y`
- 3. 법령해석례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=expc&type=JSON&mobileYn=Y`
- 4. 법령해석례명에 '허가'가 포함된 법령해석례 찾기
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=expc&type=xml&mobileYn=Y&query=%ED%97%88%EA%B0%80`

---

### 모바일 법령해석례 본문 조회 가이드API

- **Target**: `expc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=expc&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : expc(필수) | 서비스 대상 |
| `ID` | int | 법령해석례 일련번호 |
| `LM` | string | 법령해석례명 |
| `type` | string | 출력 형태 : HTML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 법령해석례일련번호가 281909인 해석례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=expc&ID=334617&type=HTML&mobileYn=Y`
- 2. 여성가족부 - 건강가정기본법 제35조 제2항 관련 법령해석례 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=expc&ID=315191&LM=%EC%97%AC%EC%84%B1%EA%B0%80%EC%A1%B1%EB%B6%80%20-%20%EA%B1%B4%EA%B0%95%EA%B0%80%EC%A0%95%EA%B8%B0%EB%B3%B8%EB%B2%95%20%EC%A0%9C35%EC%A1%B0%20%EC%A0%9C2%ED%95%AD%20%EA%B4%80%EB%A0%A8&type=HTML&mobileYn=Y`

---

### 모바일 행정심판례 목록 조회 가이드API

- **Target**: `decc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=decc&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : decc(필수) | 서비스 대상 |
| `type` | char | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 행정심판례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의(검색 결과 리스트) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `cls` | string | 재결례유형(출력 결과 필드에 있는 재결구분코드) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `date` | int | 의결일자 |
| `dpaYd` | string | 처분일자 검색(20090101~20090130) |
| `rslYd` | string | 의결일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 사건번호 오름차순 ndes :  |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(EvtNm:재결례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `decc id` | int | 검색결과번호 |
| `행정심판재결례일련번호` | int | 행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `처분일자` | string | 처분일자 |
| `처분청` | string | 처분청 |
| `재결청` | string | 재결청 |
| `재결구분명` | string | 재결구분명 |
| `재결구분코드` | string | 재결구분코드 |
| `행정심판례상세링크` | string | 행정심판례상세링크 |

#### 샘플 URL

- 1. 행정심판재결례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=XML&mobileYn=Y`
- 2. 행정심판재결례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=HTML&mobileYn=Y`
- 3. 행정심판재결례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=JSON&mobileYn=Y`
- 4. 행정심판재결례명에 '정보공개'가 포함된 재결례 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=XML&mobileYn=Y&query=%EC%A0%95%EB%B3%B4%EA%B3%B5%EA%B0%9C`
- 5. 행정심판재결례 목록 중 ‘ㄱ’으로 시작하는 재결례 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=decc&type=XML&gana=ga&mobileYn=Y`

---

### 모바일 행정심판례 본문 조회 가이드API

- **Target**: `decc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=decc&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : decc(필수) | 서비스 대상 |
| `ID` | char | 행정심판례 일련번호 |
| `LM` | char | 행정심판례명 |
| `type` | char | 출력 형태 : HTML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 행정심판례 일련번호가 2782인 행정심판례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=decc&ID=2782&type=HTML&mobileYn=Y`
- 2. 산림기술자 자격취소처분 취소청구 등 행정심판례 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=decc&ID=222883&LM=%EC%82%B0%EB%A6%BC%EA%B8%B0%EC%88%A0%EC%9E%90%20%EC%9E%90%EA%B2%A9%EC%B7%A8%EC%86%8C%EC%B2%98%EB%B6%84%20%EC%B7%A8%EC%86%8C%EC%B2%AD%EA%B5%AC%20%EB%93%B1&type=HTML&mobileYn=Y`

---

### 모바일 조약 목록 조회 가이드API

- **Target**: `trty`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=trty&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : trty(필수) | 서비스 대상 |
| `type` | char | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 조약명 ) 2 : 조약본문 |
| `query` | string | 검색범위에서 검색을 원하는 질의(검색 결과 리스트) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `eftYd` | string | 발효일자 검색(20090101~20090130) |
| `concYd` | string | 체결일자 검색(20090101~20090130) |
| `cls` | int | 1 : 양자조약 2 : 다자조약 |
| `sort` | string | 정렬옵션 (기본 : lasc 조약명오름차순) ldes 조약명내림차순 dasc : 발효일자 오름차순 ddes : 발효일자 내림차순 nasc : 조약번호 오름차순 ndes : 조약번호 |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(TrtyNm:조약명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `trty id` | int | 검색결과번호 |
| `조약일련번호` | int | 조약일련번호 |
| `조약명` | string | 조약명 |
| `조약구분코드` | string | 조약구분코드 |
| `조약구분명` | string | 조약구분명 |
| `발효일자` | string | 발효일자 |
| `서명일자` | string | 서명일자 |
| `관보게재일자` | string | 관보게재일자 |
| `조약번호` | int | 조약번호 |
| `조약상세링크` | string | 조약상세링크 |

#### 샘플 URL

- 1. 조약 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=trty&type=XML&mobileYn=Y`
- 2. 조약 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=trty&ID=284&type=HTML&mobileYn=Y`
- 3. 조약 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=trty&ID=284&type=JSON&mobileYn=Y`
- 4. 다자조약 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=trty&type=XML&cls=2&mobileYn=Y`

---

### 모바일 조약 본문 조회 가이드API

- **Target**: `trty`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=trty&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : trty(필수) | 서비스 대상 |
| `ID` | char | 조약 ID |
| `type` | char | 출력 형태 : HTML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 조약 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=trty&ID=983&type=HTML&mobileYn=Y`

---

### 모바일 법령별표 목록 조회 가이드API

- **Target**: `licbyl`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=licbyl&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : licbyl(필수) | 서비스 대상 |
| `type` | char | 출력 형태 HTML/XML/JSON |
| `search` | int | "검색범위 (기본 : 1 별표서식명) 2 : 해당법령검색 3 : 별표본문검색" |
| `query` | string | 법령명에서 검색을 원하는 질의(default=*) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | "정렬옵션 (기본 : lasc 별표서식명 오름차순) ldes 별표서식명 내림차순" |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 별표종류 1 : 별표 2 : 서식 3 : 별지 4 : 별도 5 : 부록 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 법령 별표서식 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=XML&mobileYn=Y`
- 2. 법령 별표서식 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=HTML&mobileYn=Y`
- 3. 법령 별표서식 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=JSON&mobileYn=Y`
- 4. 경찰청 법령 별표서식 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=XML&org=1320000&mobileYn=Y`

---

### 모바일 행정규칙 별표 목록 조회 가이드API

- **Target**: `admbyl`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=admbyl&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : admbyl(필수) | 서비스 대상 |
| `search` | int | 검색범위 (기본 : 1 별표서식명) 2 : 해당법령검색 3 : 별표본문검색 |
| `query` | string | 법령명에서 검색을 원하는 질의(default=*) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 별표서식명 오름차순) ldes 별표서식명 내림차순 |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 별표종류 1 : 별표 2 : 서식 3 : 별지 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `type` | char | 출력 형태 HTML/XML/JSON 생략시 기본값 : XML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 행정규칙 별표서식 목록 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admbyl&type=XML&mobileYn=Y`
- 2. 행정규칙 별표서식 목록 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admbyl&type=HTML&mobileYn=Y`
- 3. 행정규칙 별표서식 목록 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admbyl&type=JSON&mobileYn=Y`
- 4. 농림축산식품부 행정규칙 별표서식 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admbyl&type=XML&org=1543000&mobileYn=Y`

---

### 모바일 자치법규 별표 목록 조회 가이드API

- **Target**: `ordinbyl`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=ordinbyl&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ordinbyl(필수) | 서비스 대상 |
| `search` | int | 검색범위 (기본 : 1 별표서식명) 2 : 해당자치법규명검색 3 : 별표본문검색 |
| `query` | string | 법령명에서 검색을 원하는 질의(default=*) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 별표서식명 오름차순) ldes 별표서식명 내림차순 |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 별표종류 1 : 별표 2 : 서식 3 : 별도 4 : 별지 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `type` | char | 출력 형태 HTML/XML/JSON 생략시 기본값 : XML |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 샘플 URL

- 1. 자치법규 별표서식 목록 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordinbyl&mobileYn=Y&type=XML`
- 2. 자치법규 별표서식 목록 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordinbyl&type=HTML&mobileYn=Y`
- 3. 자치법규 별표서식 목록 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordinbyl&type=JSON&mobileYn=Y`

---

### 모바일 법령용어 목록 조회 가이드API

- **Target**: `lstrm`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lstrm&mobileYn=Y`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lstrm(필수) | 서비스 대상 |
| `query` | string | 법령용어명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령용어명 오름차순) ldes : 법령용어명 내림차순 |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `type` | char | 출력 형태 : HTML/XML/JSON생략시 기본값 : XML |
| `dicKndCd` | int | 법령 종류 코드 (법령 : 010101, 행정규칙 : 010102) |
| `mobileYn` | char : Y (필수) | 모바일여부 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `lstrm id` | int | 결과 번호 |
| `법령용어ID` | string | 법령용어ID |
| `법령용어명` | string | 법령용어명 |
| `법령용어상세검색` | string | 법령용어상세검색 |
| `사전구분코드` | string | 사전구분코드(법령용어사전 : 011401, 법령정의사전 : 011402, 법령한영사전 : 011403) |
| `법령용어상세링크` | string | 법령용어상세링크 |
| `법령종류코드` | int | 법령 종류 코드(법령 : 010101, 행정규칙 : 010102) |

#### 샘플 URL

- 1. 법령용어 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&type=XML&mobileYn=Y`
- 2. 'ㄱ'로 시작하는 법령용어 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&gana=ga&type=XML&mobileYn=Y`
- 3. 법령용어 검색 : 자동차
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&query=%EC%9E%90%EB%8F%99%EC%B0%A8&type=HTML&mobileYn=Y`
- 4. 법령용어 검색 : 자동차 XML
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&query=%EC%9E%90%EB%8F%99%EC%B0%A8&type=XML&mobileYn=Y`
- 5. 법령용어 검색 : 자동차 JSON
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&query=%EC%9E%90%EB%8F%99%EC%B0%A8&type=JSON&mobileYn=Y`

---

### 맞춤형 법령 목록 조회 API

- **Target**: `couseLs`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=couseLs`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : couseLs(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `vcode` | string(필수) | 분류코드 법령은 L로 시작하는 14자리 코드(L0000000000001) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `vcode` | string | 분류코드 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `법령일련번호` | int | 법령일련번호 |
| `법령명한글` | string | 법령명한글 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | string | 소관부처코드 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `법령상세링크` | string | 법령상세링크 |

#### 샘플 URL

- 1. 분류코드가 L0000000003384인 맞춤형 분류 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseLs&type=XML&vcode=L0000000003384`
- 2. 분류코드가 L0000000003384인 맞춤형 분류 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseLs&type=HTML&vcode=L0000000003384`
- 3. 분류코드가 L0000000003384인 맞춤형 분류 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseLs&type=JSON&vcode=L0000000003384`

---

### 맞춤형 법령 조문 목록 조회 API

- **Target**: `couseLs`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=couseLs`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : couseLs(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `vcode` | string | 분류코드(필수) 법령은 L로 시작하는 14자리 코드(L0000000000001) |
| `lj=jo` | string(필수) | 조문여부 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `vcode` | string | 분류코드 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 페이지당 결과 수 |
| `page` | int | 페이지당 결과 수 |
| `법령 법령키` | int | 법령 법령키 |
| `법령ID` | int | 법령ID |
| `법령명한글` | string | 법령명한글 |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `조문번호` | int | 조문번호 |
| `조문가지번호` | int | 조문가지번호 |
| `조문제목` | string | 조문제목 |
| `조문시행일자` | int | 조문시행일자 |
| `조문제개정유형` | string | 조문제개정유형 |
| `조문제개정일자문자열` | string | 조문제개정일자문자열 |
| `조문상세링크` | string | 조문상세링크 |

#### 샘플 URL

- 1. 분류코드가 L0000000003384인 맞춤형 법령 분류 조문 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseLs&type=XML&lj=jo&vcode=L0000000003384`
- 2. 분류코드가 L0000000003384인 맞춤형 법령 분류 조문 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseLs&type=HTML&lj=jo&vcode=L0000000003384`
- 3. 분류코드가 L0000000003384인 맞춤형 법령 분류 조문 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseLs&type=JSON&lj=jo&vcode=L0000000003384`

---

### 맞춤형 행정규칙 목록 조회 API

- **Target**: `couseAdmrul`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=couseAdmrul`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : couseAdmrul(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `vcode` | string(필수) | 분류코드 행정규칙은 A로 시작하는 14자리 코드(A0000000000001) |
| `display` | int | 검색된 결과 개 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `vcode` | string | 분류코드 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `admrul id` | int | 검색 결과 순번 |
| `행정규칙일련번호` | int | 행정규칙일련번호 |
| `행정규칙명` | string | 행정규칙명 |
| `행정규칙ID` | int | 행정규칙ID |
| `발령일자` | int | 발령일자 |
| `발령번호` | int | 발령번호 |
| `행정규칙구분명` | string | 행정규칙구분명 |
| `소관부처코드` | int | 소관부처코드 |
| `소관부처명` | string | 소관부처명 |
| `제개정구분명` | string | 제개정구분명 |
| `행정규칙상세링크` | string | 행정규칙상세링크 |

#### 샘플 URL

- 1. 분류코드가 A0000000000601인 행정규칙 맞춤형 분류 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseAdmrul&type=XML&vcode=A0000000000601`
- 2. 분류코드가 A0000000000601인 행정규칙 맞춤형 분류 HTML 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseAdmrul&type=HTML&vcode=A0000000000601`
- 3. 분류코드가 A0000000000601인 행정규칙 맞춤형 분류 JSON 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseAdmrul&type=JSON&vcode=A0000000000601`

---

### 맞춤형 행정규칙 조문 목록 조회 API

- **Target**: `couseAdmrul`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=couseAdmrul`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : couseAdmrul(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `vcode` | string(필수) | 분류코드 행정규칙은 A로 시작하는 14자리 코드(A0000000000001) |
| `lj=jo` | string(필수) | 조문여부 |
| `display` | int | 검색된 결과 개 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `vcode` | string | 분류코드 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `행정규칙일련번호` | int | 행정규칙일련번호 |
| `행정규칙명` | string | 행정규칙명 |
| `행정규칙ID` | int | 행정규칙ID |
| `발령일자` | int | 발령일자 |
| `발령번호` | int | 발령번호 |
| `행정규칙구분명` | string | 행정규칙구분명 |
| `소관부처명` | string | 소관부처명 |
| `제개정구분명` | string | 제개정구분명 |
| `담당부서기관코드` | string | 담당부서기관코드 |
| `담당부서기관명` | string | 담당부서기관명 |
| `담당자명` | string | 담당자명 |
| `전화번호` | string | 전화번호 |
| `조문단위 조문키` | string | 조문단위 조문키 |
| `조문번호` | string | 조문번호 |
| `조문가지번호` | string | 조문가지번호 |
| `조문상세링크` | string | 조문상세링크 |

#### 샘플 URL

- 1. 분류코드가 A0000000000601인 행정규칙 조문 맞춤형 분류 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseAdmrul&type=XML&lj=jo&vcode=A0000000000601`
- 2. 분류코드가 A0000000000601인 행정규칙 조문 맞춤형 분류 HTML 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseAdmrul&type=HTML&lj=jo&vcode=A0000000000601`
- 3. 분류코드가 A0000000000601인 행정규칙 조문 맞춤형 분류 JSON 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseAdmrul&type=JSON&lj=jo&vcode=A0000000000601`

---

### 맞춤형 자치법규 목록 조회 API

- **Target**: `couseOrdin`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=couseOrdin`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : couseOrdin(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `vcode` | string(필수) | 분류코드 자치법규는 O로 시작하는 14자리 코드(O0000000000001) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `vcode` | string | 분류코드 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `ordin id` | int | 결과 번호 |
| `자치법규일련번호` | int | 자치법규일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `자치법규종류` | string | 자치법규종류 |
| `지자체기관명` | string | 지자체기관명 |
| `시행일자` | int | 시행일자 |
| `자치법규분야명` | string | 자치법규분야명 |
| `자치법규상세링크` | string | 자치법규상세링크 |

#### 샘플 URL

- 1. 분류코드가 O0000000000602인 자치법규 맞춤형 분류 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseOrdin&type=XML&vcode=O0000000000602`
- 2. 분류코드가 O0000000000602인 자치법규 맞춤형 분류 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseOrdin&type=HTML&vcode=O0000000000602`
- 3. 분류코드가 O0000000000602인 자치법규 맞춤형 분류 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseOrdin&type=JSON&vcode=O0000000000602`

---

### 맞춤형 자치법규 조문 목록 조회 API

- **Target**: `couseOrdin`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=couseOrdin`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : couseOrdin(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `vcode` | string | 분류코드(필수) 자치법규는 O로 시작하는 14자리 코드(O0000000000001) |
| `lj=jo` | string(필수) | 조문여부 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `vcode` | string | 분류코드 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `자치법규일련번호` | int | 자치법규일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `자치법규종류` | string | 자치법규종류 |
| `지자체기관명` | string | 지자체기관명 |
| `시행일자` | int | 시행일자 |
| `자치법규분야명` | string | 자치법규분야명 |
| `조문단위 조문키` | int | 조문단위 조문키 |
| `조문번호` | string | 조문번호 |
| `조문가지번호` | string | 조문가지번호 |
| `조문제목` | string | 조문제목 |
| `조문내용` | string | 조문내용 |

#### 샘플 URL

- 1. 분류코드가 O0000000000602인 맞춤형 법령 분류 조문 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseOrdin&type=XML&lj=jo&vcode=O0000000000602`
- 2. 분류코드가 O0000000000602인 맞춤형 법령 분류 조문 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseOrdin&type=HTML&lj=jo&vcode=O0000000000602`
- 2. 분류코드가 O0000000000602인 맞춤형 법령 분류 조문 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=couseOrdin&type=JSON&lj=jo&vcode=O0000000000602`

---

### 법령정보지식베이스 법령용어 조회 API

- **Target**: `lstrmAI`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=lstrmAI`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (법령용어 : lstrmAI) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `query` | string | 법령용어명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `homonymYn` | char | 동음이의어 존재여부 (Y/N) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `section` | string | 검색범위 |
| `page` | int | 현재 페이지번호 |
| `numOfRows` | int | 페이지 당 출력 결과 수 |
| `법령용어 id` | string | 법령용어 순번 |
| `법령용어명` | string | 법령용어명 |
| `동음이의어존재여부` | string | 동음이의어 존재여부 |
| `비고` | string | 동음이의어 내용 |
| `용어간관계링크` | string | 법령용어-일상용어 연계 정보 상세링크 |
| `조문간관계링크` | string | 법령용어-조문 연계 정보 상세링크 |

#### 샘플 URL

- 1. 법령정보지식베이스 법령용어 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrmAI&type=XML`
- 2. 법령정보지식베이스 법령용어 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrmAI&type=JSON`

---

### 법령정보지식베이스 일상용어 조회 API

- **Target**: `dlytrm`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=dlytrm`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (일상용어 : dlytrm) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `query` | string | 일상용어명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `section` | string | 검색범위 |
| `page` | int | 현재 페이지번호 |
| `numOfRows` | int | 페이지 당 출력 결과 수 |
| `일상용어 id` | string | 일상용어 순번 |
| `일상용어명` | string | 일상용어명 |
| `출처` | string | 일상용어 출처 |
| `용어간관계링크` | string | 일상용어-법령용어 연계 정보 상세링크 |

#### 샘플 URL

- 1. 법령정보지식베이스 일상용어 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=dlytrm&type=XML`
- 2. 법령정보지식베이스 일상용어 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=dlytrm&type=JSON`

---

### 법령정보지식베이스 법령용어-일상용어 연계 API

- **Target**: `lstrmRlt`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=lstrmRlt`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (법령용어-일상용어 연계 : lstrmRlt) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `query` | string | 법령용어명에서 검색을 원하는 질의 (query 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 법령용어명 일련번호 |
| `trmRltCd` | int | 용어관계 동의어 : 140301 반의어 : 140302 상위어 : 140303 하위어 : 140304 연관어 : 140305 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `법령용어 id` | string | 법령용어 순번 |
| `법령용어명` | string | 법령용어명 |
| `비고` | string | 동음이의어 내용 |
| `연계용어 id` | string | 연계용어 순번 |
| `일상용어명` | string | 일상용어명 |
| `용어관계코드` | string | 용어관계코드 |
| `용어관계` | string | 용어관계명 |
| `일상용어조회링크` | string | 일상용어 정보 조회 링크 |
| `용어간관계링크` | string | 일상용어-법령용어 연계 정보 상세링크 |

#### 샘플 URL

- 1. 법령용어 청원 연계 일상용어 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lstrmRlt&type=XML&query=%EC%B2%AD%EC%9B%90`
- 2. 법령용어 청원 연계 일상용어 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lstrmRlt&type=JSON&query=%EC%B2%AD%EC%9B%90`

---

## 법령정보 지식베이스

### 법령용어 목록 조회 가이드API

- **Target**: `lstrm`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lstrm`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lstrm(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `query` | string | 법령용어명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령용어명 오름차순) ldes : 법령용어명 내림차순 rasc : 등록일자 오름차순 rdes : 등록일자 내림차순 |
| `regDt` | string | 등록일자 범위 검색(20090101~20090130) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `dicKndCd` | int | 법령 종류 코드 (법령 : 010101, 행정규칙 : 010102) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `lstrm id` | int | 결과 번호 |
| `법령용어ID` | string | 법령용어ID |
| `법령용어명` | string | 법령용어명 |
| `법령용어상세검색` | string | 법령용어상세검색 |
| `사전구분코드` | string | 사전구분코드 (법령용어사전 : 011401, 법령정의사전 : 011402, 법령한영사전 : 011403) |
| `법령용어상세링크` | string | 법령용어상세링크 |
| `법령종류코드` | int | 법령 종류 코드(법령 : 010101, 행정규칙 : 010102) |

#### 샘플 URL

- 1. 법령용어 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&type=XML`
- 2. 법령용어 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&type=JSON`
- 3. 'ㄹ'로 시작하는 법령용어 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&gana=ra&type=XML`
- 4. 법령용어 검색 : 자동차
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lstrm&query=%EC%9E%90%EB%8F%99%EC%B0%A8&type=HTML`

---

### 법령용어 본문 조회 가이드API

- **Target**: `lstrm`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=lstrm`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lstrm(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `query` | string | 상세조회하고자 하는 법령용어 명 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령용어 일련번호` | int | 법령용어 일련번호 |
| `법령용어명_한글` | string | 법령용어명 한글 |
| `법령용어명_한자` | string | 법령용어명한자 |
| `법령용어코드` | int | 법령용어코드 |
| `법령용어코드명` | string | 법령용어코드명 |
| `출처` | string | 출처 |
| `법령용어정의` | string | 법령용어정의 |

#### 샘플 URL

- 1. 법령용어 선박 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lstrm&query=%EC%84%A0%EB%B0%95&type=HTML`
- 2. 법령용어 선박 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lstrm&query=%EC%84%A0%EB%B0%95&type=XML`
- 3. 법령용어 선박 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lstrm&query=%EC%84%A0%EB%B0%95&type=JSON`

---

### 법령정보지식베이스 법령용어-조문 연계 API

- **Target**: `lstrmRltJo`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=lstrmRltJo`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (법령용어-조문 연계 : lstrmRltJo) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `query` | string(필수) | 법령용어명에서 검색을 원하는 질의 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `법령용어 id` | string | 법령용어 순번 |
| `법령용어명` | string | 법령용어명 |
| `비고` | string | 동음이의어 내용 |
| `용어간관계링크` | string | 법령용어-일상용어 연계 정보 상세링크 |
| `연계법령 id` | string | 연계법령 순번 |
| `법령명` | string | 법령명 |
| `조번호` | int | 조번호 |
| `조가지번호` | int | 조가지번호 |
| `조문내용` | string | 조문내용 |
| `용어구분코드` | string | 용어구분코드 |
| `용어구분` | string | 용어구분명 |
| `조문연계용어링크` | string | 조문-법령용어 연계 정보 상세링크 |

#### 샘플 URL

- 1. 법령용어 민원 연계 조문 정보 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lstrmRltJo&type=XML&query=%EB%AF%BC%EC%9B%90`
- 2. 법령용어 민원 연계 조문 정보 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lstrmRltJo&type=JSON&query=%EB%AF%BC%EC%9B%90`

---

## 중앙부처 법령해석

### 고용노동부 법령해석 목록 조회 API

- **Target**: `moelCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=moelCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : moelCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="퇴직") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '퇴직'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moelCgmExpc&type=XML&query=%ED%87%B4%EC%A7%81`
- 2. 안건명에 '월급'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moelCgmExpc&type=HTML&query=%EC%9B%94%EA%B8%89`
- 3. 안건명에 '연차'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moelCgmExpc&type=JSON&query=%EC%97%B0%EC%B0%A8`

---

### 고용노동부 법령해석 본문 조회 API

- **Target**: `moelCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=moelCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : moelCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 21822인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moelCgmExpc&ID=21822&type=XML`
- 2. 법령해석일련번호가 21822인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moelCgmExpc&ID=21822&type=HTML`
- 3. 법령해석일련번호가 21822인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moelCgmExpc&ID=21822&type=JSON`

---

### 국토교통부 법령해석 목록 조회 API

- **Target**: `molitCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=molitCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : molitCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="도로") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '도로'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=molitCgmExpc&type=XML&query=%EB%8F%84%EB%A1%9C`
- 2. 안건명에 '아파트'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=molitCgmExpc&type=HTML&query=%EC%95%84%ED%8C%8C%ED%8A%B8`
- 3. 안건명에 '상업'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=molitCgmExpc&type=JSON&query=%EC%83%81%EC%97%85`

---

### 국토교통부 법령해석 본문 조회 API

- **Target**: `molitCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=molitCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : molitCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `대분류` | string | 대분류 |
| `중분류` | string | 중분류 |
| `소분류` | string | 소분류 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 315912인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=molitCgmExpc&ID=315912&type=XML`
- 2. 법령해석일련번호가 315912인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=molitCgmExpc&ID=315912&type=HTML`
- 3. 법령해석일련번호가 315912인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=molitCgmExpc&ID=315912&type=JSON`

---

### 기획재정부 법령해석 목록 조회 API

- **Target**: `moefCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=moefCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : moefCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="조합") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '조합'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moefCgmExpc&type=XML&query=%EC%A1%B0%ED%95%A9`
- 2. 안건명에 '승계'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moefCgmExpc&type=HTML&query=%EC%8A%B9%EA%B3%84`
- 3. 안건명에 '지분'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moefCgmExpc&type=JSON&query=%EC%A7%80%EB%B6%84`

---

### 해양수산부 법령해석 목록 조회 API

- **Target**: `mofCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mofCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mofCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '항만'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mofCgmExpc&type=XML&query=%ED%95%AD%EB%A7%8C`
- 2. 안건명에 '비관리청'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mofCgmExpc&type=HTML&query=%EB%B9%84%EA%B4%80%EB%A6%AC%EC%B2%AD`
- 3. 안건명에 '시설'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mofCgmExpc&type=JSON&query=%EC%8B%9C%EC%84%A4`

---

### 해양수산부 법령해석 본문 조회 API

- **Target**: `mofCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mofCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mofCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 319468인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mofCgmExpc&ID=319468&type=XML`
- 2. 법령해석일련번호가 319468인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mofCgmExpc&ID=319468&type=HTML`
- 3. 법령해석일련번호가 319468인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mofCgmExpc&ID=319468&type=JSON`

---

### 행정안전부 법령해석 목록 조회 API

- **Target**: `moisCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=moisCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : moisCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="재해") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '재해'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moisCgmExpc&type=XML&query=%EC%9E%AC%ED%95%B4`
- 2. 안건명에 '임대'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moisCgmExpc&type=HTML&query=%EC%9E%84%EB%8C%80`
- 3. 안건명에 '행정'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moisCgmExpc&type=JSON&query=%ED%96%89%EC%A0%95`

---

### 행정안전부 법령해석 본문 조회 API

- **Target**: `moisCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=moisCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : moisCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 279110인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moisCgmExpc&ID=279110&type=XML`
- 2. 법령해석일련번호가 279110인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moisCgmExpc&ID=279110&type=HTML`
- 3. 법령해석일련번호가 279110인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moisCgmExpc&ID=279110&type=JSON`

---

### 기후에너지환경부 법령해석 목록 조회 API

- **Target**: `meCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=meCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : meCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '폐기물'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=meCgmExpc&type=XML&query=%ED%8F%90%EA%B8%B0%EB%AC%BC`
- 2. 안건명에 '오염'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=meCgmExpc&type=HTML&query=%EC%98%A4%EC%97%BC`
- 3. 안건명에 '대기'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=meCgmExpc&type=JSON&query=%EB%8C%80%EA%B8%B0`

---

### 기후에너지환경부 법령해석 본문 조회 API

- **Target**: `meCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=meCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : meCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 9636인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=meCgmExpc&ID=9636&type=XML`
- 2. 법령해석일련번호가 9636인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=meCgmExpc&ID=9636&type=HTML`
- 3. 법령해석일련번호가 9636인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=meCgmExpc&ID=9636&type=JSON`

---

### 관세청 법령해석 목록 조회 API

- **Target**: `kcsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=kcsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kcsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="거래명세서") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '거래명세서'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcsCgmExpc&type=XML&query=%EA%B1%B0%EB%9E%98%EB%AA%85%EC%84%B8%EC%84%9C`
- 2. 안건명에 '세금'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcsCgmExpc&type=HTML&query=%EC%84%B8%EA%B8%88`
- 3. 안건명에 '생산'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcsCgmExpc&type=JSON&query=%EC%83%9D%EC%82%B0`

---

### 관세청 법령해석 본문 조회 API

- **Target**: `kcsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=kcsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kcsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 해석일자, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `업무분야` | string | 업무분야 |
| `안건명` | string | 안건명 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `관세법령정보포털원문링크` | string | 관세법령정보포털원문링크 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 31584인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcsCgmExpc&ID=31584&type=HTML`
- 2. 법령해석일련번호가 31584인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcsCgmExpc&ID=31584&type=XML`
- 3. 법령해석일련번호가 31584인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcsCgmExpc&ID=31584&type=JSON`

---

### 국세청 법령해석 목록 조회 API

- **Target**: `ntsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=ntsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ntsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="세금") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '세금'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ntsCgmExpc&type=XML&query=%EC%84%B8%EA%B8%88`
- 2. 안건명에 '증여'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ntsCgmExpc&type=HTML&query=%EC%A6%9D%EC%97%AC`
- 3. 안건명에 '재산'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ntsCgmExpc&type=JSON&query=%EC%9E%AC%EC%82%B0`

---

### 교육부 법령해석 목록 조회 API

- **Target**: `moeCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=moeCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : moeCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="수능") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '수능'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moeCgmExpc&type=XML&query=%EC%88%98%EB%8A%A5`
- 2. 안건명에 '국가장학금'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moeCgmExpc&type=HTML&query=%EA%B5%AD%EA%B0%80%EC%9E%A5%ED%95%99%EA%B8%88`
- 3. 안건명에 '대학'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=moeCgmExpc&type=JSON&query=%EB%8C%80%ED%95%99`

---

### 교육부 법령해석 본문 조회 API

- **Target**: `moeCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=moeCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : moeCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 411648인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moeCgmExpc&ID=411648&type=XML`
- 2. 법령해석일련번호가 411648인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moeCgmExpc&ID=411648&type=HTML`
- 3. 법령해석일련번호가 411648인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=moeCgmExpc&ID=411648&type=JSON`

---

### 과학기술정보통신부 법령해석 목록 조회 API

- **Target**: `msitCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=msitCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : msitCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="연구실") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '연구실'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=msitCgmExpc&type=XML&query=%EC%97%B0%EA%B5%AC%EC%8B%A4`
- 2. 안건명에 '경마사고'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=msitCgmExpc&type=HTML&query=%EA%B2%BD%EB%A7%88%EC%82%AC%EA%B3%A0`
- 3. 안건명에 '보험가입'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=msitCgmExpc&type=JSON&query=%EB%B3%B4%ED%97%98%EA%B0%80%EC%9E%85`

---

### 과학기술정보통신부 법령해석 본문 조회 API

- **Target**: `msitCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=msitCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : msitCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 398214인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=msitCgmExpc&ID=398214&type=XML`
- 2. 법령해석일련번호가 398214인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=msitCgmExpc&ID=398214&type=HTML`
- 3. 법령해석일련번호가 398214인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=msitCgmExpc&ID=398214&type=JSON`

---

### 국가보훈부 법령해석 목록 조회 API

- **Target**: `mpvaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mpvaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mpvaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="독립유공자") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '독립유공자'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mpvaCgmExpc&type=XML&query=%EB%8F%85%EB%A6%BD%EC%9C%A0%EA%B3%B5%EC%9E%90`
- 2. 안건명에 '대학'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mpvaCgmExpc&type=HTML&query=%EB%8C%80%ED%95%99`
- 3. 안건명에 '참전'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mpvaCgmExpc&type=JSON&query=%EC%B0%B8%EC%A0%84`

---

### 국가보훈부 법령해석 본문 조회 API

- **Target**: `mpvaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mpvaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mpvaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 405900인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mpvaCgmExpc&ID=405900&type=XML`
- 2. 법령해석일련번호가 405900인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mpvaCgmExpc&ID=405900&type=HTML`
- 3. 법령해석일련번호가 405900인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mpvaCgmExpc&ID=405900&type=JSON`

---

### 국방부 법령해석 목록 조회 API

- **Target**: `mndCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mndCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mndCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="군종") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '군종'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mndCgmExpc&type=XML&query=%EA%B5%B0%EC%A2%85`
- 2. 안건명에 '장교'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mndCgmExpc&type=HTML&query=%EC%9E%A5%EA%B5%90`
- 3. 안건명에 '무기'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mndCgmExpc&type=JSON&query=%EB%AC%B4%EA%B8%B0`

---

### 국방부 법령해석 본문 조회 API

- **Target**: `mndCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mndCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mndCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 394566인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mndCgmExpc&ID=394566&type=XML`
- 2. 법령해석일련번호가 394566인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mndCgmExpc&ID=394566&type=HTML`
- 3. 법령해석일련번호가 394566인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mndCgmExpc&ID=394566&type=JSON`

---

### 농림축산식품부 법령해석 목록 조회 API

- **Target**: `mafraCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mafraCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mafraCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="농지법") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '농지법'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mafraCgmExpc&type=XML&query=%EB%86%8D%EC%A7%80%EB%B2%95`
- 2. 안건명에 '농업'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mafraCgmExpc&type=HTML&query=%EB%86%8D%EC%97%85`
- 3. 안건명에 '축산'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mafraCgmExpc&type=JSON&query=%EC%B6%95%EC%82%B0`

---

### 농림축산식품부 법령해석 본문 조회 API

- **Target**: `mafraCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mafraCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mafraCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 377274인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mafraCgmExpc&ID=377274&type=XML`
- 2. 법령해석일련번호가 377274인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mafraCgmExpc&ID=377274&type=HTML`
- 3. 법령해석일련번호가 377274인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mafraCgmExpc&ID=377274&type=JSON`

---

### 문화체육관광부 법령해석 목록 조회 API

- **Target**: `mcstCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mcstCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mcstCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="체육") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '체육'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mcstCgmExpc&type=XML&query=%EC%B2%B4%EC%9C%A1`
- 2. 안건명에 '부상'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mcstCgmExpc&type=HTML&query=%EB%B6%80%EC%83%81`
- 3. 안건명에 '관광'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mcstCgmExpc&type=JSON&query=%EA%B4%80%EA%B4%91`

---

### 문화체육관광부 법령해석 본문 조회 API

- **Target**: `mcstCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mcstCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mcstCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 447624인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mcstCgmExpc&ID=447624&type=XML`
- 2. 법령해석일련번호가 447624인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mcstCgmExpc&ID=447624&type=HTML`
- 3. 법령해석일련번호가 447624인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mcstCgmExpc&ID=447624&type=JSON`

---

### 법무부 법령해석 목록 조회 API

- **Target**: `mojCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mojCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mojCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="과태료") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '과태료'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mojCgmExpc&type=XML&query=%EA%B3%BC%ED%83%9C%EB%A3%8C`
- 2. 안건명에 '납부'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mojCgmExpc&type=HTML&query=%EB%82%A9%EB%B6%80`
- 3. 안건명에 '합병'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mojCgmExpc&type=JSON&query=%ED%95%A9%EB%B3%91`

---

### 법무부 법령해석 본문 조회 API

- **Target**: `mojCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mojCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mojCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 480208인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mojCgmExpc&ID=480208&type=XML`
- 2. 법령해석일련번호가 480208인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mojCgmExpc&ID=480208&type=HTML`
- 3. 법령해석일련번호가 480208인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mojCgmExpc&ID=480208&type=JSON`

---

### 보건복지부 법령해석 목록 조회 API

- **Target**: `mohwCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mohwCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mohwCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="일반음식점") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '일반음식점'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mohwCgmExpc&type=XML&query=%EC%9D%BC%EB%B0%98%EC%9D%8C%EC%8B%9D%EC%A0%90`
- 2. 안건명에 '화장실'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mohwCgmExpc&type=HTML&query=%ED%99%94%EC%9E%A5%EC%8B%A4`
- 3. 안건명에 '영업장'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mohwCgmExpc&type=JSON&query=%EC%98%81%EC%97%85%EC%9E%A5`

---

### 보건복지부 법령해석 본문 조회 API

- **Target**: `mohwCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mohwCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mohwCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 458114인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mohwCgmExpc&ID=458114&type=XML`
- 2. 법령해석일련번호가 458114인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mohwCgmExpc&ID=458114&type=HTML`
- 3. 법령해석일련번호가 458114인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mohwCgmExpc&ID=458114&type=JSON`

---

### 산업통상부 법령해석 목록 조회 API

- **Target**: `motieCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=motieCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : motieCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="공장") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '공장'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=motieCgmExpc&type=XML&query=%EA%B3%B5%EC%9E%A5`
- 2. 안건명에 '업종'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=motieCgmExpc&type=HTML&query=%EC%97%85%EC%A2%85`
- 3. 안건명에 '면적'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=motieCgmExpc&type=JSON&query=%EB%A9%B4%EC%A0%81`

---

### 산업통상부 법령해석 본문 조회 API

- **Target**: `motieCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=motieCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : motieCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 375510인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=motieCgmExpc&ID=375510&type=XML`
- 2. 법령해석일련번호가 375510인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=motieCgmExpc&ID=375510&type=HTML`
- 3. 법령해석일련번호가 375510인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=motieCgmExpc&ID=375510&type=JSON`

---

### 성평등가족부 법령해석 목록 조회 API

- **Target**: `mogefCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mogefCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mogefCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="청소년") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '청소년'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mogefCgmExpc&type=XML&query=%EC%B2%AD%EC%86%8C%EB%85%84`
- 2. 안건명에 '여성'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mogefCgmExpc&type=HTML&query=%EC%97%AC%EC%84%B1`
- 3. 안건명에 '일자리'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mogefCgmExpc&type=JSON&query=%EC%9D%BC%EC%9E%90%EB%A6%AC`

---

### 성평등가족부 법령해석 본문 조회 API

- **Target**: `mogefCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mogefCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mogefCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 385784인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mogefCgmExpc&ID=385784&type=XML`
- 2. 법령해석일련번호가 385784인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mogefCgmExpc&ID=385784&type=HTML`
- 3. 법령해석일련번호가 385784인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mogefCgmExpc&ID=385784&type=JSON`

---

### 외교부 법령해석 목록 조회 API

- **Target**: `mofaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mofaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mofaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '사업자'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mofaCgmExpc&type=XML&query=%EC%82%AC%EC%97%85%EC%9E%90`
- 2. 안건명에 '안전사고'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mofaCgmExpc&type=HTML&query=%EC%95%88%EC%A0%84%EC%82%AC%EA%B3%A0`
- 3. 안건명에 '비자'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mofaCgmExpc&type=JSON&query=%EB%B9%84%EC%9E%90`

---

### 외교부 법령해석 본문 조회 API

- **Target**: `mofaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mofaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mofaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 383372인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mofaCgmExpc&ID=383372&type=XML`
- 2. 법령해석일련번호가 383372인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mofaCgmExpc&ID=383372&type=HTML`
- 3. 법령해석일련번호가 383372인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mofaCgmExpc&ID=383372&type=JSON`

---

### 중소벤처기업부 법령해석 목록 조회 API

- **Target**: `mssCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mssCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mssCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="학원") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '학원'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mssCgmExpc&type=XML&query=%ED%95%99%EC%9B%90`
- 2. 안건명에 '수도권'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mssCgmExpc&type=HTML&query=%EC%88%98%EB%8F%84%EA%B6%8C`
- 3. 안건명에 '대표'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mssCgmExpc&type=JSON&query=%EB%8C%80%ED%91%9C`

---

### 중소벤처기업부 법령해석 본문 조회 API

- **Target**: `mssCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mssCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mssCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 454676인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mssCgmExpc&ID=454676&type=XML`
- 2. 법령해석일련번호가 454676인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mssCgmExpc&ID=454676&type=HTML`
- 3. 법령해석일련번호가 454676인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mssCgmExpc&ID=454676&type=JSON`

---

### 통일부 법령해석 목록 조회 API

- **Target**: `mouCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mouCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mouCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="북한") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '북한'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mouCgmExpc&type=XML&query=%EB%B6%81%ED%95%9C`
- 2. 안건명에 '인권'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mouCgmExpc&type=HTML&query=%EC%9D%B8%EA%B6%8C`
- 3. 안건명에 '전쟁'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mouCgmExpc&type=JSON&query=%EC%A0%84%EC%9F%81`

---

### 통일부 법령해석 본문 조회 API

- **Target**: `mouCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mouCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mouCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 385032인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mouCgmExpc&ID=385032&type=XML`
- 2. 법령해석일련번호가 385032인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mouCgmExpc&ID=385032&type=HTML`
- 3. 법령해석일련번호가 385032인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mouCgmExpc&ID=385032&type=JSON`

---

### 법제처 법령해석 목록 조회 API

- **Target**: `molegCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=molegCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : molegCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="법령") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '법령'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=molegCgmExpc&type=XML&query=%EB%B2%95%EB%A0%B9`
- 2. 안건명에 '행정'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=molegCgmExpc&type=HTML&query=%ED%96%89%EC%A0%95`
- 3. 안건명에 '결과'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=molegCgmExpc&type=JSON&query=%EA%B2%B0%EA%B3%BC`

---

### 법제처 법령해석 본문 조회 API

- **Target**: `molegCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=molegCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : molegCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 427778인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=molegCgmExpc&ID=427778&type=XML`
- 2. 법령해석일련번호가 427778인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=molegCgmExpc&ID=427778&type=HTML`
- 3. 법령해석일련번호가 427778인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=molegCgmExpc&ID=427778&type=JSON`

---

### 식품의약품안전처 법령해석 목록 조회 API

- **Target**: `mfdsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mfdsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mfdsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="위해") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '위해'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mfdsCgmExpc&type=XML&query=%EC%9C%84%ED%95%B4`
- 2. 안건명에 '식품'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mfdsCgmExpc&type=HTML&query=%EC%8B%9D%ED%92%88`
- 3. 안건명에 '업소'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mfdsCgmExpc&type=JSON&query=%EC%97%85%EC%86%8C`

---

### 식품의약품안전처 법령해석 본문 조회 API

- **Target**: `mfdsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mfdsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mfdsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 447362인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mfdsCgmExpc&ID=447362&type=XML`
- 2. 법령해석일련번호가 447362인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mfdsCgmExpc&ID=447362&type=HTML`
- 3. 법령해석일련번호가 447362인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mfdsCgmExpc&ID=447362&type=JSON`

---

### 인사혁신처 법령해석 목록 조회 API

- **Target**: `mpmCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mpmCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mpmCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="징계위원회") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '징계위원회'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mpmCgmExpc&type=XML&query=%EC%A7%95%EA%B3%84%EC%9C%84%EC%9B%90%ED%9A%8C`
- 2. 안건명에 '공무원'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mpmCgmExpc&type=HTML&query=%EA%B3%B5%EB%AC%B4%EC%9B%90`
- 3. 안건명에 '의결'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mpmCgmExpc&type=JSON&query=%EC%9D%98%EA%B2%B0`

---

### 인사혁신처 법령해석 본문 조회 API

- **Target**: `mpmCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mpmCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mpmCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 403188인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mpmCgmExpc&ID=403188&type=XML`
- 2. 법령해석일련번호가 403188인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mpmCgmExpc&ID=403188&type=HTML`
- 3. 법령해석일련번호가 403188인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mpmCgmExpc&ID=403188&type=JSON`

---

### 기상청 법령해석 목록 조회 API

- **Target**: `kmaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=kmaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kmaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="태풍") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '태풍'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kmaCgmExpc&type=XML&query=%ED%83%9C%ED%92%8D`
- 2. 안건명에 '가뭄'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kmaCgmExpc&type=HTML&query=%EA%B0%80%EB%AD%84`
- 3. 안건명에 '날씨'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kmaCgmExpc&type=JSON&query=%EB%82%A0%EC%94%A8`

---

### 기상청 법령해석 본문 조회 API

- **Target**: `kmaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=kmaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kmaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 381874인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kmaCgmExpc&ID=381874&type=XML`
- 2. 법령해석일련번호가 381874인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kmaCgmExpc&ID=381874&type=HTML`
- 3. 법령해석일련번호가 381874인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kmaCgmExpc&ID=381874&type=JSON`

---

### 국가유산청 법령해석 목록 조회 API

- **Target**: `khsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=khsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : khsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="연말") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '연말'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=khsCgmExpc&type=XML&query=%EC%97%B0%EB%A7%90`
- 2. 안건명에 '유산'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=khsCgmExpc&type=HTML&query=%EC%9C%A0%EC%82%B0`
- 3. 안건명에 '문화재'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=khsCgmExpc&type=JSON&query=%EB%AC%B8%ED%99%94%EC%9E%AC`

---

### 국가유산청 법령해석 본문 조회 API

- **Target**: `khsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=khsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : khsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 420966인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=khsCgmExpc&ID=420966&type=XML`
- 2. 법령해석일련번호가 420966인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=khsCgmExpc&ID=420966&type=HTML`
- 3. 법령해석일련번호가 420966인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=khsCgmExpc&ID=420966&type=JSON`

---

### 농촌진흥청 법령해석 목록 조회 API

- **Target**: `rdaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=rdaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : rdaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '농촌'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=rdaCgmExpc&type=XML&query=%EB%86%8D%EC%B4%8C`
- 2. 안건명에 '한우'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=rdaCgmExpc&type=HTML&query=%ED%95%9C%EC%9A%B0`
- 3. 안건명에 '비료'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=rdaCgmExpc&type=JSON&query=%EB%B9%84%EB%A3%8C`

---

### 농촌진흥청 법령해석 본문 조회 API

- **Target**: `rdaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=rdaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : rdaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 385230인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=rdaCgmExpc&ID=385230&type=XML`
- 2. 법령해석일련번호가 385230인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=rdaCgmExpc&ID=385230&type=HTML`
- 3. 법령해석일련번호가 385230인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=rdaCgmExpc&ID=385230&type=JSON`

---

### 경찰청 법령해석 목록 조회 API

- **Target**: `npaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=npaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : npaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '경비지도사'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=npaCgmExpc&type=XML&query=%EA%B2%BD%EB%B9%84%EC%A7%80%EB%8F%84%EC%82%AC`
- 2. 안건명에 '중고상품'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=npaCgmExpc&type=HTML&query=%EC%A4%91%EA%B3%A0%EC%83%81%ED%92%88`
- 3. 안건명에 '교통사고'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=npaCgmExpc&type=JSON&query=%EA%B5%90%ED%86%B5%EC%82%AC%EA%B3%A0`

---

### 경찰청 법령해석 본문 조회 API

- **Target**: `npaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=npaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : npaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 381844인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=npaCgmExpc&ID=381844&type=XML`
- 2. 법령해석일련번호가 381844인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=npaCgmExpc&ID=381844&type=HTML`
- 3. 법령해석일련번호가 381844인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=npaCgmExpc&ID=381844&type=JSON`

---

### 방위사업청 법령해석 목록 조회 API

- **Target**: `dapaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=dapaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : dapaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="제조") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '제조'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=dapaCgmExpc&type=XML&query=%EC%A0%9C%EC%A1%B0`
- 2. 안건명에 '제조'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=dapaCgmExpc&type=HTML&query=%EC%A0%9C%EC%A1%B0`
- 3. 안건명에 '기술'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=dapaCgmExpc&type=JSON&query=%EA%B8%B0%EC%88%A0`

---

### 방위사업청 법령해석 본문 조회 API

- **Target**: `dapaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=dapaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : dapaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 395332인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=dapaCgmExpc&ID=395332&type=XML`
- 2. 법령해석일련번호가 395332인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=dapaCgmExpc&ID=395332&type=HTML`
- 3. 법령해석일련번호가 395332인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=dapaCgmExpc&ID=395332&type=JSON`

---

### 병무청 법령해석 목록 조회 API

- **Target**: `mmaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=mmaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mmaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="학력") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '학력'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mmaCgmExpc&type=XML&query=%ED%95%99%EB%A0%A5`
- 2. 안건명에 '공익'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mmaCgmExpc&type=HTML&query=%EA%B3%B5%EC%9D%B5`
- 3. 안건명에 '현역'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=mmaCgmExpc&type=JSON&query=%ED%98%84%EC%97%AD`

---

### 병무청 법령해석 본문 조회 API

- **Target**: `mmaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=mmaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : mmaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 378434인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mmaCgmExpc&ID=378434&type=XML`
- 2. 법령해석일련번호가 378434인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mmaCgmExpc&ID=378434&type=HTML`
- 3. 법령해석일련번호가 378434인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=mmaCgmExpc&ID=378434&type=JSON`

---

### 산림청 법령해석 목록 조회 API

- **Target**: `kfsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=kfsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kfsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="벌채") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '벌채'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kfsCgmExpc&type=XML&query=%EB%B2%8C%EC%B1%84`
- 2. 안건명에 '산지관리법'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kfsCgmExpc&type=HTML&query=%EC%82%B0%EC%A7%80%EA%B4%80%EB%A6%AC%EB%B2%95`
- 3. 안건명에 '숲'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kfsCgmExpc&type=JSON&query=%EC%88%B2`

---

### 산림청 법령해석 본문 조회 API

- **Target**: `kfsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=kfsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kfsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 376032인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kfsCgmExpc&ID=376032&type=XML`
- 2. 법령해석일련번호가 376032인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kfsCgmExpc&ID=376032&type=HTML`
- 3. 법령해석일련번호가 376032인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kfsCgmExpc&ID=376032&type=JSON`

---

### 소방청 법령해석 목록 조회 API

- **Target**: `nfaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=nfaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : nfaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="공공기관") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '공공기관'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nfaCgmExpc&type=XML&query=%EA%B3%B5%EA%B3%B5%EA%B8%B0%EA%B4%80`
- 2. 안건명에 '소방안전'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nfaCgmExpc&type=HTML&query=%EC%86%8C%EB%B0%A9%EC%95%88%EC%A0%84`
- 3. 안건명에 '조치명령'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nfaCgmExpc&type=JSON&query=%EC%A1%B0%EC%B9%98%EB%AA%85%EB%A0%B9`

---

### 소방청 법령해석 본문 조회 API

- **Target**: `nfaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=nfaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : nfaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 372876인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nfaCgmExpc&ID=372876&type=XML`
- 2. 법령해석일련번호가 372876인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nfaCgmExpc&ID=372876&type=HTML`
- 3. 법령해석일련번호가 372876인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nfaCgmExpc&ID=372876&type=JSON`

---

### 재외동포청 법령해석 목록 조회 API

- **Target**: `okaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=okaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : okaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="귀환") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '귀환'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=okaCgmExpc&type=XML&query=%EA%B7%80%ED%99%98`
- 2. 안건명에 '중국'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=okaCgmExpc&type=HTML&query=%EC%A4%91%EA%B5%AD`
- 3. 안건명에 '외교'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=okaCgmExpc&type=JSON&query=%EC%99%B8%EA%B5%90`

---

### 재외동포청 법령해석 본문 조회 API

- **Target**: `okaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=okaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : okaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 455518인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=okaCgmExpc&ID=455518&type=XML`
- 2. 법령해석일련번호가 455518인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=okaCgmExpc&ID=455518&type=HTML`
- 3. 법령해석일련번호가 455518인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=okaCgmExpc&ID=455518&type=JSON`

---

### 조달청 법령해석 목록 조회 API

- **Target**: `ppsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=ppsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ppsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="상금") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '상금'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ppsCgmExpc&type=XML&query=%EC%83%81%EA%B8%88`
- 2. 안건명에 '급식'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ppsCgmExpc&type=HTML&query=%EA%B8%89%EC%8B%9D`
- 3. 안건명에 '면제'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ppsCgmExpc&type=JSON&query=%EB%A9%B4%EC%A0%9C`

---

### 조달청 법령해석 본문 조회 API

- **Target**: `ppsCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=ppsCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ppsCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 431416인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ppsCgmExpc&ID=431416&type=XML`
- 2. 법령해석일련번호가 431416인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ppsCgmExpc&ID=431416&type=HTML`
- 3. 법령해석일련번호가 431416인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ppsCgmExpc&ID=431416&type=JSON`

---

### 질병관리청 법령해석 목록 조회 API

- **Target**: `kdcaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=kdcaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kdcaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="임상시험") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '임상시험'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kdcaCgmExpc&type=XML&query=%EC%9E%84%EC%83%81%EC%8B%9C%ED%97%98`
- 2. 안건명에 '백신'이 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kdcaCgmExpc&type=HTML&query=%EB%B0%B1%EC%8B%A0`
- 3. 안건명에 '설계'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kdcaCgmExpc&type=JSON&query=%EC%84%A4%EA%B3%84`

---

### 질병관리청 법령해석 본문 조회 API

- **Target**: `kdcaCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=kdcaCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kdcaCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 373448인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kdcaCgmExpc&ID=373448&type=XML`
- 2. 법령해석일련번호가 373448인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kdcaCgmExpc&ID=373448&type=HTML`
- 3. 법령해석일련번호가 373448인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kdcaCgmExpc&ID=373448&type=JSON`

---

### 국가데이터처 법령해석 목록 조회 API

- **Target**: `kostatCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=kostatCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kostatCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="산업집적법") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '산업집적법'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kostatCgmExpc&type=XML&query=%EC%82%B0%EC%97%85%EC%A7%91%EC%A0%81%EB%B2%95`
- 2. 안건명에 '코드'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kostatCgmExpc&type=HTML&query=%EC%BD%94%EB%93%9C`
- 3. 안건명에 '제조업'이 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kostatCgmExpc&type=JSON&query=%EC%A0%9C%EC%A1%B0%EC%97%85`

---

### 국가데이터처 법령해석 본문 조회 API

- **Target**: `kostatCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=kostatCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kostatCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 377798인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kostatCgmExpc&ID=377798&type=XML`
- 2. 법령해석일련번호가 377798인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kostatCgmExpc&ID=377798&type=HTML`
- 3. 법령해석일련번호가 377798인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kostatCgmExpc&ID=377798&type=JSON`

---

### 지식재산처 법령해석 목록 조회 API

- **Target**: `kipoCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=kipoCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kipoCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="상표") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '상표'가 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kipoCgmExpc&type=XML&query=%EC%83%81%ED%91%9C`
- 2. 안건명에 '용도'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kipoCgmExpc&type=HTML&query=%EC%9A%A9%EB%8F%84`
- 3. 안건명에 '특허'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kipoCgmExpc&type=JSON&query=%ED%8A%B9%ED%97%88`

---

### 지식재산처 법령해석 본문 조회 API

- **Target**: `kipoCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=kipoCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kipoCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 378580인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kipoCgmExpc&ID=378580&type=XML`
- 2. 법령해석일련번호가 378580인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kipoCgmExpc&ID=378580&type=HTML`
- 3. 법령해석일련번호가 378580인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kipoCgmExpc&ID=378580&type=JSON`

---

### 해양경찰청 법령해석 목록 조회 API

- **Target**: `kcgCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=kcgCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kcgCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="유조선") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '유조선'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcgCgmExpc&type=XML&query=%EC%9C%A0%EC%A1%B0%EC%84%A0`
- 2. 안건명에 '면허'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcgCgmExpc&type=HTML&query=%EB%A9%B4%ED%97%88`
- 3. 안건명에 '레저'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcgCgmExpc&type=JSON&query=%EB%A0%88%EC%A0%80`

---

### 해양경찰청 법령해석 본문 조회 API

- **Target**: `kcgCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=kcgCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kcgCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 417984인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcgCgmExpc&ID=417984&type=XML`
- 2. 법령해석일련번호가 417984인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcgCgmExpc&ID=417984&type=HTML`
- 3. 법령해석일련번호가 417984인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcgCgmExpc&ID=417984&type=JSON`

---

### 행정중심복합도시건설청 법령해석 목록 조회 API

- **Target**: `naaccCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=naaccCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : naaccCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 법령해석명, 2: 본문검색) |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="행복") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `inq` | int | 질의기관코드 |
| `rpl` | int | 해석기관코드 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `itmno` | int | 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. |
| `explYd` | string | 해석일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 nasc : 안건번호 오름차순 ndes  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(lawNm:법령해석명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `id` | int | 검색결과번호 |
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `해석기관코드` | string | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `해석일자` | string | 해석일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `법령해석상세링크` | string | 법령해석상세링크 |

#### 샘플 URL

- 1. 안건명에 '행복'이 들어가는 법령해석 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=naaccCgmExpc&type=XML&query=%ED%96%89%EB%B3%B5`
- 2. 안건명에 '도시'가 들어가는 법령해석 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=naaccCgmExpc&type=HTML&query=%EB%8F%84%EC%8B%9C`
- 3. 안건명에 '주차'가 들어가는 법령해석 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=naaccCgmExpc&type=JSON&query=%EC%A3%BC%EC%B0%A8`

---

### 행정중심복합도시건설청 법령해석 본문 조회 API

- **Target**: `naaccCgmExpc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=naaccCgmExpc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : naaccCgmExpc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | int(필수) | 법령해석일련번호 |
| `LM` | string | 법령해석명 |
| `fields` | string | 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령해석일련번호` | int | 법령해석일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `해석일자` | int | 해석일자 |
| `해석기관코드` | int | 해석기관코드 |
| `해석기관명` | string | 해석기관명 |
| `질의기관코드` | int | 질의기관코드 |
| `질의기관명` | string | 질의기관명 |
| `관리기관코드` | int | 관리기관코드 |
| `등록일시` | int | 등록일시 |
| `질의요지` | string | 질의요지 |
| `회답` | string | 회답 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 법령해석일련번호가 384690인 해석 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=naaccCgmExpc&ID=384690&type=XML`
- 2. 법령해석일련번호가 384690인 해석 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=naaccCgmExpc&ID=384690&type=HTML`
- 3. 법령해석일련번호가 384690인 해석 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=naaccCgmExpc&ID=384690&type=JSON`

---

## 위원회 결정문

### 개인정보보호위원회 결정문 목록 조회 API

- **Target**: `ppc`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=ppc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (개인정보보호위원회 : ppc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 안건명 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 안건명 오름차순 (default) ldes : 안건명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 의안번호 오름차순 nd |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `ppc id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `안건명` | string | 안건명 |
| `의안번호` | string | 의안번호 |
| `회의종류` | string | 회의종류 |
| `결정구분` | string | 결정구분 |
| `의결일` | string | 의결일 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 개인정보보호위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ppc&type=HTML`
- 2. 개인정보보호위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ppc&type=XML`
- 3. 개인정보보호위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ppc&type=JSON`

---

### 개인정보보호위원회 위원회 결정문 본문 조회 API

- **Target**: `ppc`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=ppc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (개인정보보호위원회 : ppc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `기관명` | string | 기관명 |
| `결정` | string | 결정 |
| `회의종류` | string | 회의종류 |
| `안건번호` | string | 안건번호 |
| `안건명` | string | 안건명 |
| `신청인` | string | 신청인 |
| `의결연월일` | string | 의결연월일 |
| `주문` | string | 주문 |
| `이유` | string | 이유 |
| `배경` | string | 배경 |
| `이의제기방법및기간` | string | 이의제기방법및기간 |
| `주요내용` | string | 주요내용 |
| `의결일자` | string | 의결일자 |
| `위원서명` | string | 위원서명 |
| `별지` | string | 별지 |
| `결정요지` | string | 결정요지 |

#### 샘플 URL

- 1. 개인정보보호위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ppc&ID=5&type=HTML`
- 2. 개인정보보호위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ppc&ID=3&type=XML`
- 3. 개인정보보호위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ppc&ID=9907&type=JSON`

---

### 고용보험심사위원회 결정문 목록 조회 API

- **Target**: `eiac`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=eiac`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (고용보험심사위원회 : eiac) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 사건명 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 사건명 오름차순 (default) ldes : 사건명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 사건번호 오름차순 nd |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `eiac id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `의결일자` | string | 의결일자 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 고용보험심사위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eiac&type=HTML`
- 2. 고용보험심사위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eiac&type=XML`
- 3. 고용보험심사위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=eiac&type=JSON`

---

### 고용보험심사위원회 결정문 본문 조회 API

- **Target**: `eiac`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=eiac`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (고용보험심사위원회 : eiac) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `사건의분류` | string | 사건의 분류 |
| `의결서종류` | string | 의결서 종류 |
| `개요` | string | 개요 |
| `사건번호` | string | 사건번호 |
| `사건명` | string | 사건명 |
| `청구인` | string | 청구인 |
| `대리인` | string | 대리인 |
| `피청구인` | string | 피청구인 |
| `이해관계인` | string | 이해관계인 |
| `심사결정심사관` | string | 심사결정심사관 |
| `주문` | string | 주문 |
| `청구취지` | string | 청구취지 |
| `이유` | string | 이유 |
| `의결일자` | string | 의결일자 |
| `기관명` | string | 기관명 |
| `별지` | string | 별지 |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |

#### 샘플 URL

- 1. 고용보험심사위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eiac&ID=11347&type=HTML`
- 2. 고용보험심사위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eiac&ID=11327&type=XML`
- 3. 고용보험심사위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=eiac&ID=11165&type=JSON`

---

### 공정거래위원회 결정문 목록 조회 API

- **Target**: `ftc`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=ftc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (공정거래위원회 : ftc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 사건명 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 사건명 오름차순 (default) ldes : 사건명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 사건번호 오름차순 nd |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `ftc id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `문서유형` | string | 문서유형 |
| `회의종류` | string | 회의종류 |
| `결정번호` | string | 결정번호 |
| `결정일자` | string | 결정일자 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 공정거래위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ftc&type=HTML`
- 2. 공정거래위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ftc&type=XML`
- 3. 공정거래위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ftc&type=JSON`

---

### 공정거래위원회 결정문 본문 조회 API

- **Target**: `ftc`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=ftc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (공정거래위원회 : ftc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `문서유형` | string | 출력 형태 : 의결서 / 시정권고서 |
| `사건번호` | string | 사건번호 |
| `사건명` | string | 사건명 |
| `피심정보명` | string | 피심정보명 |
| `피심정보내용` | string | 피심정보내용 |
| `회의종류` | string | 회의종류 |
| `결정번호` | string | 결정번호 |
| `결정일자` | string | 결정일자 |
| `원심결` | string | 원심결 |
| `재산정심결` | string | 재산정심결 |
| `후속심결` | string | 후속심결 |
| `심의정보명` | string | 심의정보명 |
| `심의정보내용` | string | 심의정보내용 |
| `의결문` | string | 의결문 |
| `주문` | string | 주문 |
| `신청취지` | string | 신청취지 |
| `이유` | string | 이유 |
| `의결일자` | string | 의결일자 |
| `위원정보` | string | 위원정보 |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |
| `별지` | string | 별지 |
| `결정요지` | string | 결정요지 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `문서유형` | string | 출력 형태 : 의결서 / 시정권고서 |
| `사건번호` | string | 사건번호 |
| `사건명` | string | 사건명 |
| `피심정보명` | string | 피심정보명 |
| `피심정보내용` | string | 피심정보내용 |
| `의결서종류` | string | 의결서종류 |
| `시정권고참조법률` | string | 시정권고참조법률 |
| `시정권고사항` | string | 시정권고사항 |
| `시정권고이유` | string | 시정권고이유 |
| `법위반내용` | string | 법위반내용 |
| `적용법조` | string | 적용법조 |
| `법령의적용` | string | 법령의적용 |
| `시정기한` | string | 시정기한 |
| `수락여부통지기간` | string | 수락여부통지기간 |
| `수락여부통지기한` | string | 수락여부통지기한 |
| `수락거부시의조치` | string | 수락거부시의조치 |
| `수락거부시조치방침` | string | 수락거부시조치방침 |
| `별지` | string | 별지 |
| `결정요지` | string | 결정요지 |

#### 샘플 URL

- 1. 공정거래위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ftc&ID=331&type=HTML`
- 2. 공정거래위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ftc&ID=335&type=XML`
- 3. 공정거래위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ftc&ID=8111&type=JSON`

---

### 국민권익위원회 결정문 목록 조회 API

- **Target**: `acr`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=acr`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (국민권익위원회 : acr) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 민원표시 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 민원표시 오름차순 (default) ldes : 민원표시 내림차순 dasc : 의결일 오름차순 ddes : 의결일 내림차순 nasc : 의안번호 오름차순 nd |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 기관명 |
| `acr id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `제목` | string | 제목 |
| `민원표시명` | string | 민원표시명 |
| `의안번호` | string | 의안번호 |
| `회의종류` | string | 회의종류 |
| `결정구분` | string | 결정구분 |
| `의결일` | string | 의결일 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 국민권익위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=acr&type=HTML`
- 2. 국민권익위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=acr&type=XML`
- 3. 국민권익위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=acr&type=JSON`

---

### 국민권익위원회 결정문 본문 조회 API

- **Target**: `acr`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=acr`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (국민권익위원회 : acr) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `기관명` | string | 기관명 |
| `회의종류` | string | 회의종류 |
| `결정구분` | string | 결정구분 |
| `의안번호` | string | 의안번호 |
| `민원표시` | string | 민원표시 |
| `제목` | string | 제목 |
| `신청인` | string | 신청인 |
| `대리인` | string | 대리인 |
| `피신청인` | string | 피신청인 |
| `관계기관` | string | 관계기관 |
| `의결일` | string | 의결일 |
| `주문` | string | 주문 |
| `이유` | string | 이유 |
| `별지` | string | 별지 |
| `의결문` | string | 의결문 |
| `의결일자` | string | 의결일자 |
| `위원정보` | string | 위원정보 |
| `결정요지` | string | 결정요지 |

#### 샘플 URL

- 1. 국민권익위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=acr&ID=53&type=HTML`
- 2. 국민권익위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=acr&ID=89&type=XML`
- 2. 국민권익위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=acr&ID=1281&type=JSON`

---

### 금융위원회 결정문 목록 조회 API

- **Target**: `fsc`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=fsc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (금융위원회 : fsc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 안건명 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 안건명 오름차순 (default) ldes : 안건명 내림차순 nasc : 의결번호 오름차순 ndes : 의결번호 내림차순 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `fsc id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `안건명` | string | 안건명 |
| `의결번호` | string | 의결번호 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 금융위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=fsc&type=HTML`
- 2. 금융위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=fsc&type=XML`
- 3. 금융위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=fsc&type=JSON`

---

### 금융위원회 결정문 본문 조회 API

- **Target**: `fsc`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=fsc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (금융위원회 : fsc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `기관명` | string | 기관명 |
| `의결번호` | string | 의결번호 |
| `안건명` | string | 안건명 |
| `조치대상자의인적사항` | string | 조치대상자의 인적사항 |
| `조치대상` | string | 조치대상 |
| `조치내용` | string | 조치내용 |
| `조치이유` | string | 조치이유 |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |

#### 샘플 URL

- 1. 금융위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=fsc&ID=9211&type=HTML`
- 2. 금융위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=fsc&ID=9169&type=XML`
- 3. 금융위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=fsc&ID=13097&type=JSON`

---

### 노동위원회 결정문 목록 조회 API

- **Target**: `nlrc`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=nlrc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (노동위원회 : nlrc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 제목 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 제목 오름차순 (default) ldes : 제목 내림차순 dasc : 등록일 오름차순 ddes : 등록일 내림차순 nasc : 사건번호 오름차순 ndes : |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `nlrc id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `제목` | string | 제목 |
| `사건번호` | string | 사건번호 |
| `등록일` | string | 등록일 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 노동위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nlrc&type=HTML`
- 2. 노동위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nlrc&type=XML`
- 3. 노동위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nlrc&type=JSON`

---

### 노동위원회 결정문 본문 조회 API

- **Target**: `nlrc`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=nlrc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (노동위원회 : nlrc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `기관명` | string | 기관명 |
| `사건번호` | string | 사건번호 |
| `자료구분` | string | 자료구분 |
| `담당부서` | string | 담당부서 |
| `등록일` | string | 등록일 |
| `제목` | string | 제목 |
| `내용` | string | 내용 |
| `판정사항` | string | 판정사항 |
| `판정요지` | string | 판정요지 |
| `판정결과` | string | 판정결과 |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |

#### 샘플 URL

- 1. 노동위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nlrc&ID=55&type=HTML`
- 2. 노동위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nlrc&ID=71&type=XML`
- 3. 노동위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nlrc&ID=129&type=JSON`

---

### 방송미디어통신위원회 결정문 목록 조회 API

- **Target**: `kcc`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=kcc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (방송미디어통신위원회 : kcc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 안건명 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 안건명 오름차순 (default) ldes : 안건명 내림차순 dasc : 의결연월일 오름차순 ddes : 의결연월일 내림차순 nasc : 안건번호 오름차순  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `kcc id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `안건명` | string | 안건명 |
| `안건번호` | string | 안건번호 |
| `의결일자` | string | 의결일자 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 방송미디어통신위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcc&type=HTML`
- 2. 방송미디어통신위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcc&type=XML`
- 3. 방송미디어통신위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kcc&type=JSON`

---

### 방송미디어통신위원회 결정문 본문 조회 API

- **Target**: `kcc`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=kcc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (방송미디어통신위원회 : kcc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `기관명` | string | 기관명 |
| `의결서유형` | string | 의결서 유형 |
| `안건번호` | string | 안건번호 |
| `사건번호` | string | 사건번호 |
| `안건명` | string | 안건명 |
| `사건명` | string | 사건명 |
| `피심인` | string | 피심인 |
| `피심의인` | string | 피심의인 |
| `청구인` | string | 청구인 |
| `참고인` | string | 참고인 |
| `원심결정` | string | 원심결정 |
| `의결일자` | string | 의결일자 |
| `주문` | string | 주문 |
| `이유` | string | 이유 |
| `별지` | string | 별지 |
| `문서제공구분` | string | 문서제공구분(데이터 개방\|이유하단 이미지개방) |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |

#### 샘플 URL

- 1. 방송미디어통신위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcc&ID=12549&type=HTML`
- 2. 방송미디어통신위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcc&ID=12547&type=XML`
- 3. 방송미디어통신위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kcc&ID=11737&type=JSON`

---

### 산업재해보상보험재심사위원회 결정문 목록 조회 API

- **Target**: `iaciac`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=iaciac`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (산업재해보상보험재심사위원회 : iaciac) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 사건 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 사건 오름차순 (default) ldes : 사건 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 사건번호 오름차순 ndes |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `iaciac id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `사건` | string | 시건 |
| `사건번호` | string | 사건번호 |
| `의결일자` | string | 의결일자 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 산업재해보상보험재심사위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=iaciac&type=HTML`
- 2. 산업재해보상보험재심사위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=iaciac&type=XML`
- 3. 산업재해보상보험재심사위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=iaciac&type=JSON`

---

### 산업재해보상보험재심사위원회 결정문 본문 조회 API

- **Target**: `iaciac`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=iaciac`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (산업재해보상보험재심사위원회 : iaciac) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `사건대분류` | string | 사건 대분류 |
| `사건중분류` | string | 사건 중분류 |
| `사건소분류` | string | 사건 소분류 |
| `쟁점` | string | 쟁점 |
| `사건번호` | string | 사건번호 |
| `의결일자` | string | 의결일자 |
| `사건` | string | 사건 |
| `청구인` | string | 청구인 |
| `재해근로자` | string | 재해근로자 |
| `재해자` | string | 재해자 |
| `피재근로자` | string | 피재근로자/피재자성명/피재자/피재자(망인) |
| `진폐근로자` | string | 진폐근로자 |
| `수진자` | string | 수진자 |
| `원처분기관` | string | 원처분기관 |
| `주문` | string | 주문 |
| `청구취지` | string | 청구취지 |
| `이유` | string | 이유 |
| `별지` | string | 별지 |
| `문서제공구분` | string | 문서제공구분(데이터 개방\|이유하단 이미지개방) |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |

#### 샘플 URL

- 1. 산업재해보상보험재심사위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=iaciac&ID=7515&type=HTML`
- 2. 산업재해보상보험재심사위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=iaciac&ID=7513&type=XML`
- 2. 산업재해보상보험재심사위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=iaciac&ID=12713&type=JSON`

---

### 중앙토지수용위원회 결정문 목록 조회 API

- **Target**: `oclt`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=oclt`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (중앙토지수용위원회 : oclt) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 제목 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 제목 오름차순 (default) ldes : 제목 내림차순 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `oclt id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `제목` | string | 제목 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 중앙토지수용위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oclt&type=HTML`
- 2. 중앙토지수용위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oclt&type=XML`
- 3. 중앙토지수용위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oclt&type=JSON`

---

### 중앙토지수용위원회 결정문 본문 조회 API

- **Target**: `oclt`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=oclt`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (중앙토지수용위원회 : oclt) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `제목` | string | 제목 |
| `관련법리` | string | 관련 법리 |
| `관련규정` | string | 관련 규정 |
| `판단` | string | 판단 |
| `근거` | string | 근거 |
| `주해` | string | 주해 |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |

#### 샘플 URL

- 1. 중앙토지수용위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oclt&ID=4973&type=HTML`
- 2. 중앙토지수용위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oclt&ID=4965&type=XML`
- 3. 중앙토지수용위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oclt&ID=4971&type=JSON`

---

### 중앙환경분쟁조정위원회 결정문 목록 조회 API

- **Target**: `ecc`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=ecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (중앙환경분쟁조정위원회 : ecc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 사건명 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 사건명 오름차순 (default) ldes : 사건명 내림차순 nasc : 의결번호 오름차순 ndes : 의결번호 내림차순 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `ecc id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `사건명` | string | 사건명 |
| `의결번호` | string | 의결번호 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 중앙환경분쟁조정위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ecc&type=HTML`
- 2. 중앙환경분쟁조정위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ecc&type=XML`
- 3. 중앙환경분쟁조정위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ecc&type=JSON`

---

### 중앙환경분쟁조정위원회 결정문 본문 조회 API

- **Target**: `ecc`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=ecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (중앙환경분쟁조정위원회 : ecc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `의결번호` | string | 의결번호 |
| `사건명` | string | 사건명 |
| `사건의개요` | string | 사건의 개요 |
| `신청인` | string | 신청인 |
| `피신청인` | string | 피신청인 |
| `분쟁의경과` | string | 분쟁의 경과 |
| `당사자주장` | string | 당사자 주장 |
| `사실조사결과` | string | 사실조사 결과 |
| `평가의견` | string | 평가의견 |
| `주문` | string | 주문 |
| `이유` | string | 이유 |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |

#### 샘플 URL

- 1. 중앙환경분쟁조정위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ecc&ID=5883&type=HTML`
- 2. 중앙환경분쟁조정위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ecc&ID=5877&type=XML`
- 3. 중앙환경분쟁조정위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ecc&ID=5729&type=JSON`

---

### 증권선물위원회 결정문 목록 조회 API

- **Target**: `sfc`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=sfc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (증권선물위원회 : sfc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 안건명 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 안건명 오름차순 (default) ldes : 안건명 내림차순 nasc : 의결번호 오름차순 ndes : 의결번호 내림차순 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `sfc id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문 일련번호 |
| `안건명` | string | 안건명 |
| `의결번호` | string | 의결번호 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 증권선물위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=sfc&type=HTML`
- 2. 증권선물위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=sfc&type=XML`
- 3. 증권선물위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=sfc&type=JSON`

---

### 증권선물위원회 결정문 본문 조회 API

- **Target**: `sfc`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=sfc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (증권선물위원회 : sfc) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문 일련번호 |
| `기관명` | string | 기관명 |
| `의결번호` | string | 의결번호 |
| `안건명` | string | 안건명 |
| `조치대상자의인적사항` | string | 조치대상자의 인적사항 |
| `조치대상` | string | 조치대상 |
| `조치내용` | string | 조치내용 |
| `조치이유` | string | 조치이유 |
| `각주번호` | int | 각주번호 |
| `각주내용` | string | 각주내용 |

#### 샘플 URL

- 1. 증권선물위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=sfc&ID=7919&type=HTML`
- 2. 증권선물위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=sfc&ID=7929&type=XML`
- 3. 증권선물위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=sfc&ID=8511&type=JSON`

---

### 국가인권위원회 결정문 목록 조회 API

- **Target**: `nhrck`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=nhrck`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (국가인권위원회 : nhrck) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 1 : 사건명 (default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 사건명 오름차순 (default) ldes : 사건명 내림차순 nasc : 의결번호 오름차순 ndes : 의결번호 내림차순 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 현재 페이지번호 |
| `기관명` | string | 위원회명 |
| `nhrck id` | int | 검색 결과 순번 |
| `결정문일련번호` | int | 결정문일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `의결일자` | string | 의결일자 |
| `데이터기준일시` | string | 데이터기준일시 |
| `결정문상세링크` | string | 결정문 상세링크 |

#### 샘플 URL

- 1. 국가인권위원회 결정문 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nhrck&type=HTML`
- 2. 국가인권위원회 결정문 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nhrck&type=XML`
- 3. 국가인권위원회 결정문 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=nhrck&type=JSON`

---

### 국가인권위원회 결정문 본문 조회 API

- **Target**: `nhrck`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=nhrck`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (국가인권위원회 : nhrck) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 결정문 일련번호 |
| `LM` | char | 결정문명 |
| `fields` | string | 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `결정문일련번호` | int | 결정문일련번호 |
| `기관명` | string | 기관명 |
| `위원회명` | string | 위원회명 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `의결일자` | string | 의결일자 |
| `주문` | string | 주문 |
| `이유` | string | 이유 |
| `위원정보` | string | 위원정보 |
| `별지` | string | 별지 |
| `결정요지` | string | 결정요지 |
| `판단요지` | string | 판단요지 |
| `주문요지` | string | 주문요지 |
| `분류명` | string | 분류명 |
| `결정유형` | string | 결정유형 |
| `신청인` | string | 신청인 |
| `피신청인` | string | 피신청인 |
| `피해자` | string | 피해자 |
| `피조사자` | string | 피조사자 |
| `원본다운로드URL` | string | 원본다운로드URL |
| `바로보기URL` | string | 바로보기URL |
| `결정례전문` | string | 결정례전문 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 국가인권위원회 결정문 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nhrck&ID=331&type=HTML`
- 2. 국가인권위원회 결정문 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nhrck&ID=335&type=XML`
- 3. 국가인권위원회 결정문 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=nhrck&ID=3157&type=JSON`

---

## 특별행정심판

### 조세심판원 특별행정심판재결례 목록 조회 API

- **Target**: `ttSpecialDecc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=ttSpecialDecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ttSpecialDecc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 특별행정심판재결례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `cls` | string | 재결례유형(출력 결과 필드에 있는 재결구분코드) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `date` | int | 의결일자 |
| `dpaYd` | string | 처분일자 검색(20090101~20090130) |
| `rslYd` | string | 의결일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 청구번호 오름차순 ndes :  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(사건명, 청구번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(EvtNm:재결례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `decc id` | int | 검색결과번호 |
| `특별행정심판재결례일련번호` | int | 특별행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `청구번호` | string | 청구번호 |
| `처분일자` | string | 처분일자 |
| `의결일자` | string | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | int | 재결청 |
| `재결구분명` | string | 재결구분명 |
| `재결구분코드` | string | 재결구분코드 |
| `데이터기준일시` | string | 데이터기준일시 |
| `행정심판재결례상세링크` | string | 행정심판재결례상세링크 |

#### 샘플 URL

- 1. 특별행정심판재결례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ttSpecialDecc&type=XML`
- 2. 특별행정심판재결례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ttSpecialDecc&type=HTML`
- 3. 특별행정심판재결례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ttSpecialDecc&type=JSON`
- 4. 특별행정심판재결례 목록 중 ‘ㄱ’으로 시작하는 재결례 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ttSpecialDecc&type=XML&gana=ga`

---

### 조세심판원 특별행정심판재결례 본문 조회 API

- **Target**: `ttSpecialDecc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=ttSpecialDecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ttSpecialDecc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 특별행정심판재결례일련번호 |
| `LM` | string | 특별행정심판재결례명 |
| `fields` | string | 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `특별행정심판재결례일련번호` | int | 특별행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `청구번호` | string | 청구번호 |
| `처분일자` | int | 처분일자 |
| `의결일자` | int | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | string | 재결청 |
| `재결례유형명` | string | 재결례유형명 |
| `재결례유형코드` | int | 재결례유형코드 |
| `세목` | string | 세목 |
| `재결요지` | string | 재결요지 |
| `따른결정` | string | 따른결정 |
| `참조결정` | string | 참조결정 |
| `주문` | string | 주문 |
| `청구취지` | string | 청구취지 |
| `이유` | string | 이유 |
| `관련법령` | string | 관련법령 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 특별행정심판재결례일련번호가 1018160인 특별행정심판재결례 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ttSpecialDecc&ID=1018160&type=XML`
- 2. 특별행정심판재결례일련번호가 1018160인 특별행정심판재결례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ttSpecialDecc&ID=1018160&type=HTML`
- 3. 특별행정심판재결례일련번호가 1018160인 특별행정심판재결례 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=ttSpecialDecc&ID=1018160&type=JSON`

---

### 해양안전심판원 특별행정심판재결례 목록 조회 API

- **Target**: `kmstSpecialDecc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=kmstSpecialDecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kmstSpecialDecc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 특별행정심판재결례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `cls` | string | 재결례유형(출력 결과 필드에 있는 재결구분코드) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `date` | int | 의결일자 |
| `dpaYd` | string | 처분일자 검색(20090101~20090130) |
| `rslYd` | string | 의결일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 재결번호 오름차순 ndes :  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(사건명, 재결번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(EvtNm:재결례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `decc id` | int | 검색결과번호 |
| `특별행정심판재결례일련번호` | int | 특별행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `재결번호` | string | 재결번호 |
| `처분일자` | string | 처분일자 |
| `의결일자` | string | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | int | 재결청 |
| `재결구분명` | string | 재결구분명 |
| `재결구분코드` | string | 재결구분코드 |
| `데이터기준일시` | string | 데이터기준일시 |
| `행정심판재결례상세링크` | string | 행정심판재결례상세링크 |

#### 샘플 URL

- 1. 특별행정심판재결례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kmstSpecialDecc&type=XML`
- 2. 특별행정심판재결례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kmstSpecialDecc&type=HTML`
- 3. 특별행정심판재결례 목록 중 ‘ㄱ’으로 시작하는 재결례 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kmstSpecialDecc&type=XML&gana=ga`
- 4. 특별행정심판재결례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=kmstSpecialDecc&type=JSON`

---

### 해양안전심판원 특별행정심판재결례 본문 조회 API

- **Target**: `kmstSpecialDecc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=kmstSpecialDecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : kmstSpecialDecc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 특별행정심판재결례일련번호 |
| `LM` | string | 특별행정심판재결례명 |
| `fields` | string | 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `특별행정심판재결례일련번호` | int | 특별행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `처분일자` | int | 처분일자 |
| `의결일자` | int | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | string | 재결청 |
| `재결례유형명` | string | 재결례유형명 |
| `재결례유형코드` | int | 재결례유형코드 |
| `재결번호` | int | 재결번호 |
| `주문` | string | 주문 |
| `청구취지` | string | 청구취지 |
| `이유` | string | 이유 |
| `해양사고관련자` | string | 해양사고관련자 |
| `심판관` | string | 심판관 |
| `사고유형` | string | 사고유형 |
| `선박유형` | string | 선박유형 |
| `해심위치` | string | 해심위치 |
| `재심청구안내` | string | 재심청구안내 |
| `별지` | string | 별지 |
| `의결종류` | string | 의결종류 |
| `재결위원회` | string | 재결위원회 |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 특별행정심판재결례일련번호가 2인 특별행정심판재결례 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kmstSpecialDecc&ID=2&type=XML`
- 2. '기선 제12금영호 침몰사건' 특별행정심판재결례 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kmstSpecialDecc&ID=2&LM=%EA%B8%B0%EC%84%A0%20%EC%A0%9C12%EA%B8%88%EC%98%81%ED%98%B8%20%EC%B9%A8%EB%AA%B0%EC%82%AC%EA%B1%B4&type=HTML`
- 3. 특별행정심판재결례일련번호가 2인 특별행정심판재결례 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=kmstSpecialDecc&ID=2&type=JSON`

---

### 국민권익위원회 특별행정심판재결례 목록 조회 API

- **Target**: `acrSpecialDecc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=acrSpecialDecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : acrSpecialDecc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 특별행정심판재결례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `cls` | string | 재결례유형(출력 결과 필드에 있는 재결구분코드) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `date` | int | 의결일자 |
| `dpaYd` | string | 처분일자 검색(20090101~20090130) |
| `rslYd` | string | 의결일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 사건번호 오름차순 ndes :  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(EvtNm:재결례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `decc id` | int | 검색결과번호 |
| `특별행정심판재결례일련번호` | int | 특별행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `처분일자` | string | 처분일자 |
| `의결일자` | string | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | int | 재결청 |
| `재결구분명` | string | 재결구분명 |
| `재결구분코드` | string | 재결구분코드 |
| `데이터기준일시` | string | 데이터기준일시 |
| `행정심판재결례상세링크` | string | 행정심판재결례상세링크 |

#### 샘플 URL

- 1. 특별행정심판재결례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=acrSpecialDecc&type=XML`
- 2. 특별행정심판재결례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=acrSpecialDecc&type=HTML`
- 3. 특별행정심판재결례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=acrSpecialDecc&type=JSON`
- 4. 특별행정심판재결례 목록 중 ‘ㄱ’으로 시작하는 재결례 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=acrSpecialDecc&type=XML&gana=ga`

---

### 국민권익위원회 특별행정심판재결례 본문 조회 API

- **Target**: `acrSpecialDecc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=acrSpecialDecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : acrSpecialDecc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 특별행정심판재결례일련번호 |
| `LM` | string | 특별행정심판재결례명 |
| `fields` | string | 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `특별행정심판재결례일련번호` | int | 특별행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `처분일자` | int | 처분일자 |
| `의결일자` | int | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | string | 재결청 |
| `재결례유형명` | string | 재결례유형명 |
| `재결례유형코드` | int | 재결례유형코드 |
| `주문` | string | 주문 |
| `청구취지` | string | 청구취지 |
| `이유` | string | 이유 |
| `재결요지` | string | 재결요지 |
| `상위처분청코드` | string | 상위처분청코드 |
| `상위처분청` | string | 상위처분청 |
| `관계법령` | string | 관계법령 |
| `원본다운로드URL` | string | 원본다운로드URL |
| `데이터기준일시` | string | 데이터기준일시 |

#### 샘플 URL

- 1. 특별행정심판재결례일련번호가 2071461인 특별행정심판재결례 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=acrSpecialDecc&ID=2071461&type=XML`
- 2. 특별행정심판재결례일련번호가 2071461인 특별행정심판재결례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=acrSpecialDecc&ID=2071461&type=HTML`
- 3. 특별행정심판재결례일련번호가 2071461인 특별행정심판재결례 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=acrSpecialDecc&ID=2071461&type=JSON`

---

### 인사혁신처 소청심사위원회 특별행정심판재결례 목록 조회 API

- **Target**: `adapSpecialDecc`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=adapSpecialDecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : adapSpecialDecc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 특별행정심판재결례명) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `cls` | string | 재결례유형(출력 결과 필드에 있는 재결구분코드) |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `date` | int | 의결일자 |
| `dpaYd` | string | 처분일자 검색(20090101~20090130) |
| `rslYd` | string | 의결일자 검색(20090101~20090130) |
| `sort` | string | 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc : 사건번호 오름차순 ndes :  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `fields` | string | 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위(EvtNm:재결례명/bdyText:본문) |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `decc id` | int | 검색결과번호 |
| `특별행정심판재결례일련번호` | int | 특별행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `처분일자` | string | 처분일자 |
| `의결일자` | string | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | int | 재결청 |
| `재결구분명` | string | 재결구분명 |
| `재결구분코드` | string | 재결구분코드 |
| `데이터기준일시` | string | 데이터기준일시 |
| `행정심판재결례상세링크` | string | 행정심판재결례상세링크 |

#### 샘플 URL

- 1. 특별행정심판재결례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=adapSpecialDecc&type=XML`
- 2. 특별행정심판재결례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=adapSpecialDecc&type=HTML`
- 3. 특별행정심판재결례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=adapSpecialDecc&type=JSON`
- 4. 특별행정심판재결례 목록 중 ‘ㄱ’으로 시작하는 재결례 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=adapSpecialDecc&type=XML&gana=ga`

---

### 인사혁신처 소청심사위원회 특별행정심판재결례 본문 조회 API

- **Target**: `adapSpecialDecc`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=adapSpecialDecc`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : adapSpecialDecc(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char(필수) | 특별행정심판재결례일련번호 |
| `LM` | string | 특별행정심판재결례명 |
| `fields` | string | 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `특별행정심판재결례일련번호` | int | 특별행정심판재결례일련번호 |
| `사건명` | string | 사건명 |
| `사건번호` | string | 사건번호 |
| `처분일자` | int | 처분일자 |
| `의결일자` | int | 의결일자 |
| `처분청` | string | 처분청 |
| `재결청` | string | 재결청 |
| `재결례유형명` | string | 재결례유형명 |
| `재결례유형코드` | int | 재결례유형코드 |
| `주문` | string | 주문 |
| `청구취지` | string | 청구취지 |
| `이유` | string | 이유 |
| `재결요지` | string | 재결요지 |
| `소청사례명` | string | 소청사례명 |
| `처분요지` | string | 처분요지 |
| `소청이유` | string | 소청이유 |
| `소청인` | string | 소청인 |
| `피소청인` | string | 피소청인 |
| `주문` | string | 주문 |
| `이유` | string | 이유 |
| `원처분` | string | 원처분 |
| `결정유형` | string | 결정유형 |
| `대분류` | string | 대분류 |
| `중분류` | string | 중분류 |
| `소분류` | string | 소분류 |
| `데이터기준일자` | string | 데이터기준일자 |

#### 샘플 URL

- 1. 특별행정심판재결례일련번호가 2071571인 특별행정심판재결례 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=adapSpecialDecc&ID=2071571&type=XML`
- 2. 특별행정심판재결례일련번호가 2071571인 특별행정심판재결례 HTML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=adapSpecialDecc&ID=2071571&type=HTML`
- 3. 특별행정심판재결례일련번호가 2071571인 특별행정심판재결례 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=adapSpecialDecc&ID=2071571&type=JSON`

---

## 기타

### 법령 변경이력 목록 조회 API

- **Target**: `lsHstInf`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lsHstInf`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsHstInf(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `regDt` | int(필수) | 법령 변경일 검색(20150101) |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 현재 페이지번호 |
| `law id` | int | 검색 결과 순번 |
| `법령일련번호` | int | 법령일련번호 |
| `현행연혁코드` | string | 현행연혁코드 |
| `법령명한글` | string | 법령명한글 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처코드` | string | 소관부처코드 |
| `소관부처명` | string | 소관부처명 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `자법타법여부` | string | 자법타법여부 |
| `법령상세링크` | string | 법령상세링크 |

#### 샘플 URL

- 1. 법령 변경일이 20170726인 법령 HTML 목록
  `https://www.law.go.kr/DRF/lawSearch.do?target=lsHstInf&OC=test&regDt=20170726&type=HTML`
- 2. 법령 변경일이 20170726인 법령 XML 목록
  `https://www.law.go.kr/DRF/lawSearch.do?target=lsHstInf&OC=test&regDt=20170726&type=XML`
- 2. 법령 변경일이 20170726인 법령 JSON 목록
  `https://www.law.go.kr/DRF/lawSearch.do?target=lsHstInf&OC=test&regDt=20170726&type=JSON`

---

### 일자별 조문 개정 이력 목록 조회 API

- **Target**: `lsJoHstInf`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lsJoHstInf`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsJoHstInf(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 XML/JSON |
| `regDt` | int | 조문 개정일, 8자리 (20150101) |
| `fromRegDt` | int | 조회기간 시작일, 8자리 (20150101) |
| `toRegDt` | int | 조회기간 종료일, 8자리 (20150101) |
| `ID` | int | 법령ID |
| `JO` | int | 조문번호 조문번호 4자리 + 조 가지번호 2자리 (000202 : 제2조의2) |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `page` | int | 검색 결과 페이지 (default=1) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `totalCnt` | int | 검색한 기간에 개정 조문이 있는 법령의 건수 |
| `law id` | int | 결과 번호 |
| `법령일련번호` | int | 법령일련번호 |
| `법령명한글` | string | 법령명한글 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | string | 소관부처코드 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `jo num` | string | 조 구분 번호 |
| `조문정보` | string | 조문정보 |
| `조문번호` | string | 조문번호 |
| `변경사유` | string | 변경사유 |
| `조문링크` | string | 조문링크 |
| `조문변경이력상세링크` | string | 조문변경이력상세링크 |
| `조문개정일` | int | 조문제개정일 |
| `조문시행일` | int | 조문시행일 |

#### 샘플 URL

- 1. 조문 개정 일자가 20250401인 조문 XML 검색
  `https://law.go.kr/DRF/lawSearch.do?target=lsJoHstInf&OC=test&regDt=20250401&type=XML`
- 2. 조문 개정 일자 기간 검색 중 검색 기간 시작일이 20250101인 조문 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?target=lsJoHstInf&OC=test&fromRegDt=20250101&type=XML`
- 3. 조문 개정 일자가 20250401이면서 기관이 보건복지부인 조문 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?target=lsJoHstInf&OC=test&regDt=20250401&org=1352000&type=JSON`

---

### 조문별 변경 이력 목록 조회 API

- **Target**: `lsJoHstInf`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=lsJoHstInf`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsJoHstInf(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `ID` | char(필수) | 법령 ID |
| `JO` | int(필수) | 조번호 6자리숫자 : 조번호(4자리)+조가지번호(2자리) (000200 : 2조, 001002 : 10조의 2) |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령ID` | int | 법령ID |
| `법령명한글` | int | 법령명(한글) |
| `법령일련번호` | int | 법령일련번호 |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | string | 소관부처코드 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `조문번호` | int | 조문번호 |
| `변경사유` | int | 변경사유 |
| `조문링크` | int | 변경사유 |
| `조문변경일` | int | 조문변경일 |

#### 샘플 URL

- 1. 법령 ID가 001971 이면서 5조인 법령의 변경이력 목록 XML 검색
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsJoHstInf&ID=001971&JO=000500&type=XML`
- 2. 법령 ID가 001971 이면서 5조인 법령의 변경이력 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsJoHstInf&ID=001971&JO=000500&type=JSON`

---

### 법령 자치법규 연계 목록 조회 API

- **Target**: `lnkDep`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lnkDep`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lnkLs(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `query` | string | 법령명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lnkLsOrdJo(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `query` | string | 법령명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 자치법규 오름차순 ddes : 자치법규 내림차순 nasc : 자치법규 공포일자 오름차순 ndes :  |
| `knd` | string | 법령종류(코드제공) |
| `JO` | int | 조번호 생략(기본값) : 모든 조를 표시함 4자리숫자 : 조번호(4자리) (0023 : 23조) |
| `JOBR` | int | 조가지번호 2자리숫자 : 조가지번호(2자리) (02 : 2) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lnkDep(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `org` | string | 소관부처별 검색(코드별도제공) |
| `sort` | string | 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 자치법규 오름차순 ddes : 자치법규 내림차순 nasc : 자치법규 공포일자 오름차순 ndes :  |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `법령일련번호` | int | 법령일련번호 |
| `법령명한글` | string | 법령명한글 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `법령명한글` | string | 법령명한글 |
| `법령ID` | int | 법령ID |
| `법령조번호` | string | 법령조번호 |
| `자치법규일련번호` | int | 자치법규 일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규조번호` | string | 자치법규 조번호 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | int | 자치법규 공포일자 |
| `공포번호` | int | 자치법규 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `자치법규종류` | string | 자치법규종류 |
| `시행일자` | int | 자치법규 시행일자 |
| `target` | string | 검색서비스 대상 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `법령명한글` | string | 법령명한글 |
| `법령ID` | int | 법령ID |
| `자치법규일련번호` | int | 자치법규 일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | int | 자치법규 공포일자 |
| `공포번호` | int | 자치법규 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `자치법규종류` | string | 자치법규종류 |
| `시행일자` | int | 자치법규 시행일자 |

#### 샘플 URL

- 1. 연계 법령 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLs&type=XML`
- 2. 연계 법령 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLs&type=HTML`
- 3. 연계 법령 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLs&type=JSON`
- 4. 연계 법령 검색 : 자동차관리법 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLs&type=XML&query=%EC%9E%90%EB%8F%99%EC%B0%A8%EA%B4%80%EB%A6%AC%EB%B2%95`
- 1. 연계 법령별 조례 조문 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLsOrdJo&type=XML`
- 2. 연계 법령별 조례 조문 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLsOrdJo&type=HTML`
- 3. 연계 법령별 조례 조문 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLsOrdJo&type=JSON`
- 4. 법령별 조례 조문 검색 : 건축법 시행령 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLsOrdJo&type=XML&knd=002118`
- 5. 법령 조문별 조례 조문 검색 : 건축법 시행령 제20조 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLsOrdJo&type=XML&knd=002118&JO=0020`
- 1. 소관부처가 '산림청'인 연계 법령 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkDep&org=1400000&type=XML`
- 2. 소관부처가 '산림청'인 연계 법령 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkDep&org=1400000&type=HTML`
- 3. 소관부처가 '산림청'인 연계 법령 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkDep&org=1400000&type=JSON`

---

### 위임 법령 조회 API

- **Target**: `lsDelegated`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=lsDelegated`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsDelegated (필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 XML/JSON |
| `ID` | char | 법령 ID (ID 또는 MST 중 하나는 반드시 입력,ID로 검색하면 그 법령의 현행 법령 본문 조회) |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `법령일련번호` | int | 법령일련번호 |
| `법령명` | string | 법령명 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `소관부처코드` | int | 소관부처코드 |
| `전화번호` | string | 전화번호 |
| `시행일자` | int | 시행일자 |
| `조문번호` | string | 조문번호 |
| `조문제목` | string | 조문제목 |
| `위임구분` | string | 위임된 법령의 종류 |
| `위임법령일련번호` | string | 위임된 법령의 일련번호 |
| `위임법령제목` | string | 위임된 법령의 제목 |
| `위임법령조문번호` | string | 위임된 법령의 조문번호 |
| `위임법령조문가지번호` | string | 위임된 법령의 조문 가지번호 |
| `위임법령조문제목` | string | 위임된 법령의 조문 제목 |
| `링크텍스트` | string | 위임된 법령에 대한 링크를 걸어줘야 하는 텍스트 |
| `라인텍스트` | string | 링크텍스트가 포함된 텍스트(조문내용) |
| `조항호목` | string | 링크텍스트와 라인텍스트가 포함된 조항호목 |
| `위임행정규칙일련번호` | string | 위임된 행정규칙의 일련번호 |
| `위임행정규칙제목` | string | 위임된 행정규칙의 제목 |
| `링크텍스트` | string | 위임된 행정규칙에 대한 링크를 걸어줘야 하는 텍스트 |
| `라인텍스트` | string | 링크텍스트가 포함된 텍스트(조문내용) |
| `조항호목` | string | 링크텍스트와 라인텍스트가 포함된 조항호목 |
| `위임자치법규일련번호` | string | 위임된 자치법규의 일련번호 |
| `위임자치법규제목` | string | 위임된 자치법규의 제목 |
| `링크텍스트` | string | 위임된 자치법규에 대한 링크를 걸어줘야 하는 텍스트 |
| `라인텍스트` | string | 링크텍스트가 포함된 텍스트(조문내용) |
| `조항호목` | string | 링크텍스트와 라인텍스트가 포함된 조항호목 |

#### 샘플 URL

- 1. 초·중등교육법의 위임 법령 조회 XML 검색
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsDelegated&type=XML&ID=000900`
- 1. 초·중등교육법의 위임 법령 JSON 검색
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=lsDelegated&type=JSON&ID=000900`

---

### 법령명 약칭 조회 API

- **Target**: `lsAbrv`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lsAbrv`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lsAbrv(필수) | 서비스 대상 |
| `type` | char | 출력 형태 : XML/JSON |
| `stdDt` | int | 등록일(검색시작날짜) |
| `endDt` | int | 등록일(검색종료날짜) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `totalCnt` | int | 검색건수 |
| `law id` | int | 결과 번호 |
| `법령일련번호` | int | 법령일련번호 |
| `현행연혁코드` | string | 현행연혁코드 |
| `법령명한글` | string | 법령명한글 |
| `법령약칭명` | string | 법령약칭명 |
| `법령ID` | int | 법령ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | string | 소관부처코드 |
| `법령구분명` | string | 법령구분명 |
| `시행일자` | int | 시행일자 |
| `등록일` | int | 등록일 |
| `자법타법여부` | string | 자법타법여부 |
| `법령상세링크` | string | 법령상세링크 |

#### 샘플 URL

- 1. 법령명 약칭 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsAbrv&type=XML`
- 2. 법령명 약칭 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsAbrv&type=JSON`

---

### 삭제 데이터 목록 조회 API

- **Target**: `delHst`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=delHst`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 : datDel |
| `type` | string | 출력 형태 XML/JSON |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `knd` | int | 데이터 종류 법령 : 1 행정규칙 : 2 자치법규 : 3 학칙공단 : 13 |
| `delDt` | int | 데이터 삭제 일자 검색 (YYYYMMDD) |
| `frmDttoDt` | int | 데이터 삭제 일자 범위 검색 (YYYYMMDD) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `일련번호` | int | 데이터 일련번호 |
| `구분명` | string | 데이터 구분명 (법령 / 행정규칙 / 자치법규 등) |
| `삭제일자` | string | 데이터 삭제일자 |

#### 샘플 URL

- 1. 삭제데이터 전체 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=delHst&type=XML`
- 2. 삭제 대학/공공기관규정 날짜 단위(20231013) XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=delHst&knd=13&delDt=20231013&type=XML`
- 3. 삭제 자치법규 날짜 범위(20231013~20231016) JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=delHst&knd=3&frmDt=20231013&toDt=20231016&type=JSON`

---

### 한눈보기 목록 조회 API

- **Target**: `oneview`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=oneview`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : oneview(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `query` | string | 법령명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색 대상 |
| `키워드` | string | 키워드 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색결과갯수 |
| `page` | int | 출력페이지 |
| `법령 id` | int | 검색결과번호 |
| `법령일련번호` | int | 법령일련번호 |
| `법령명` | string | 법령명 |
| `공포일자` | string | 공포일자 |
| `공포번호` | int | 공포번호 |
| `시행일자` | string | 시행일자 |
| `제공건수` | int | 제공건수 |
| `제공일자` | string | 제공일자 |

#### 샘플 URL

- 1. 한눈보기 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oneview&type=XML`
- 2. 한눈보기 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oneview&type=HTML`
- 3. 한눈보기 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=oneview&type=JSON`

---

### 한눈보기 본문 조회 API

- **Target**: `oneview`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=oneview`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : oneview(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `MST` | char | 법령 마스터 번호 - 법령테이블의 lsi_seq 값을 의미함 |
| `LM` | string | 법령의 법령명 |
| `LD` | int | 법령의 공포일자 |
| `LN` | int | 법령의 공포번호 |
| `JO` | int | 조번호 생략(기본값) : 모든 조를 표시함 6자리숫자 : 조번호(4자리)+조가지번호(2자리) (000200 : 2조, 001002 : 10조의 2) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `패턴일련번호` | int | 패턴일련번호 |
| `법령일련번호` | int | 법령일련번호 |
| `법령명` | string | 법령명 |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `조문시행일자` | int | 조문시행일자 |
| `최초제공일자` | int | 최초제공일자 |
| `조번호` | int | 조번호 |
| `조제목` | string | 조제목 |
| `콘텐츠제목` | string | 콘텐츠제목 |
| `링크텍스트` | string | 링크텍스트 |
| `링크URL` | string | 링크URL |

#### 샘플 URL

- 1. 한눈보기 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oneview&type=HTML`
- 2. 한눈보기 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oneview&type=XML`
- 3. 한눈보기 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=oneview&type=JSON`

---

### 자치법규 법령 연계 목록 조회 API

- **Target**: `lnkOrg`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=lnkOrg`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lnkOrd(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `query` | string | 법규명에서 검색을 원하는 질의 |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lnkLsOrd(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호 내 |
| `knd` | string | 법령종류(코드제공)법령ID 사용함 |
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : lnkOrg(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `org` | string | 지자체 기관코드 (지자체코드 제공) |
| `sort` | string | (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번호 오름차순 ndes : 공포번호 내 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `자치법규일련번호` | int | 자치법규 일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `자치법규종류` | string | 자치법규종류 |
| `시행일자` | int | 시행일자 |
| `target` | string | 검색서비스 대상 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `자치법규일련번호` | int | 자치법규 일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `자치법규종류` | string | 자치법규종류 |
| `시행일자` | int | 시행일자 |
| `target` | string | 검색서비스 대상 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `law id` | int | 결과 번호 |
| `자치법규일련번호` | int | 자치법규 일련번호 |
| `자치법규명` | string | 자치법규명 |
| `자치법규ID` | int | 자치법규ID |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `자치법규종류` | string | 자치법규종류 |
| `시행일자` | int | 시행일자 |
| `법령명한글` | string | 법령명한글 |
| `법령ID` | int | 법령ID |

#### 샘플 URL

- 1. 연계 조례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkOrd&type=XML`
- 2. 연계 조례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkOrd&type=HTML`
- 3. 연계 조례 검색 : 청소년 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkOrd&type=JSON&query=%EC%B2%AD%EC%86%8C%EB%85%84`
- 1. 법령이 '건축법 시행령'인 연계 조례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLsOrd&knd=002118&type=XML`
- 2. 법령이 '건축법 시행령'인 연계 조례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLsOrd&knd=002118&type=HTML`
- 3. 법령이 '건축법 시행령'인 연계 조례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkLsOrd&knd=002118&type=JSON`
- 1. 지자체가 '부산광역시 동구'인 연계 조례 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkOrg&org=3270000&type=XML`
- 2. 지자체가 '부산광역시 동구'인 연계 조례 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkOrg&org=3270000&type=HTML`
- 3. 지자체가 '부산광역시 동구'인 연계 조례 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lnkOrg&org=3270000&type=JSON`

---

### 별표서식 목록 조회 API

- **Target**: `licbyl`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=licbyl`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : licbyl(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 별표서식명) 2 : 해당법령검색 3 : 별표본문검색 |
| `query` | string | 검색을 원하는 질의(default=*) (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 별표서식명 오름차순), ldes(별표서식명 내림차순) |
| `org` | string | 소관부처별 검색(소관부처코드 제공) 소관부처 2개이상 검색 가능(","로 구분) |
| `mulOrg` | string | 소관부처 2개이상 검색 조건 OR : OR검색 (default) AND : AND검색 |
| `knd` | string | 별표종류 1 : 별표 2 : 서식 3 : 별지 4 : 별도 5 : 부록 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `licbyl id` | int | 결과번호 |
| `별표일련번호` | int | 별표일련번호 |
| `관련법령일련번호` | int | 관련법령일련번호 |
| `관련법령ID` | int | 관련법령ID |
| `별표명` | string | 별표명ID |
| `관련법령명` | string | 관련법령명 |
| `별표번호` | int | 별표번호 |
| `별표종류` | string | 별표종류 |
| `소관부처명` | string | 소관부처명 |
| `공포일자` | int | 공포일자 |
| `공포번호` | int | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `법령종류` | string | 법령종류 |
| `별표서식파일링크` | string | 별표서식파일링크 |
| `별표서식PDF파일링크` | string | 별표서식PDF파일링크 |
| `별표법령상세링크` | string | 별표법령상세링크 |

#### 샘플 URL

- 1. 법령 별표서식 목록 XML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=XML`
- 2. 법령 별표서식 목록 HTML 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=HTML`
- 3. 법령 별표서식 목록 JSON 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=JSON`
- 4. 경찰청 법령 별표서식 목록 검색
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=XML&org=1320000`
- 5. 소관부처 2개이상(경찰청, 행정안전부) 입력한 별표서식 목록 HTML 검색(OR검색)
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=HTML&org=1320000,1741000`
- 6. 소관부처 2개이상(경찰청, 행정안전부) 입력한 별표서식 목록 HTML 검색(AND검색)
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=licbyl&type=HTML&org=1320000,1741000&mulOrg=AND`

---

### 별표서식 목록 조회 API

- **Target**: `admbyl`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=admbyl`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : admbyl(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `search` | int | 검색범위 (기본 : 1 별표서식명) 2 : 해당법령검색 3 : 별표본문검색 |
| `query` | string | 법령명에서 검색을 원하는 질의(default=*) (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 별표서식명 오름차순) ldes 별표서식명 내림차순 |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `knd` | string | 별표종류 1 : 별표 2 : 서식 3 : 별지 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 결과페이지번호 |
| `admrulbyl id` | int | 결과번호 |
| `별표일련번호` | int | 별표일련번호 |
| `관련행정규칙일련번호` | int | 관련행정규칙일련번호 |
| `별표명` | string | 별표명ID |
| `관련행정규칙명` | string | 관련행정규칙명 |
| `별표번호` | int | 별표번호 |
| `별표종류` | string | 별표종류 |
| `소관부처명` | string | 소관부처명 |
| `발령일자` | int | 발령일자 |
| `발령번호` | int | 발령번호 |
| `관련법령ID` | int | 관련법령ID |
| `행정규칙종류` | string | 행정규칙종류 |
| `별표서식파일링크` | string | 별표서식파일링크 |
| `별표행정규칙상세링크` | string | 별표행정규칙상세링크 |

#### 샘플 URL

- 1. 행정규칙 별표서식 목록 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admbyl&type=XML`
- 2. 행정규칙 별표서식 목록 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admbyl&type=HTML`
- 3. 행정규칙 별표서식 목록 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admbyl&type=JSON`
- 4. 농림축산식품부 행정규칙 별표서식 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=admbyl&type=XML&org=1543000`

---

### 별표서식 목록 조회 API

- **Target**: `ordinbyl`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=ordinbyl`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string : ordinbyl(필수) | 서비스 대상 |
| `type` | char(필수) | 출력 형태 HTML/XML/JSON |
| `search` | int | 검색범위(기본 : 1 별표서식명) 2 : 해당자치법규명검색 3 : 별표본문검색 |
| `query` | string | 법령명에서 검색을 원하는 질의(default=*) (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `sort` | string | 정렬옵션 (기본 : lasc 별표서식명 오름차순) ldes 별표서식명 내림차순 |
| `org` | string | 소관부처별 검색(소관부처코드 제공) |
| `sborg` | string | 지자체별 시·군·구 검색(지자체코드 제공) (필수값 : org, ex.서울특별시 구로구에 대한 검색-> org=6110000&sborg=3160000) |
| `knd` | string | 별표종류 1 : 별표 2 : 서식 3 : 별도 4 : 별지 |
| `gana` | string | 사전식 검색(ga,na,da…,etc) |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색건수 |
| `page` | int | 현재 페이지번호 |
| `ordinbyl id` | int | 검색 결과 순번 |
| `별표일련번호` | string | 별표일련번호 |
| `관련자치법규일련번호` | string | 관련자치법규일련번호 |
| `별표명` | string | 별표명 |
| `관련자치법규명` | string | 관련자치법규명 |
| `별표번호` | string | 별표번호 |
| `별표종류` | string | 별표종류 |
| `지자체기관명` | string | 지자체기관명 |
| `전체기관명` | string | 전체기관명 |
| `자치법규시행일자` | string | 자치법규시행일자 |
| `공포일자` | string | 공포일자 |
| `공포번호` | string | 공포번호 |
| `제개정구분명` | string | 제개정구분명 |
| `별표서식파일링크` | string | 별표서식파일링크 |
| `별표자치법규상세링크` | string | 별표자치법규상세링크 |

#### 샘플 URL

- 1. 자치법규 별표서식 목록 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordinbyl&type=XML`
- 2. 자치법규 별표서식 목록 HTML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordinbyl&type=HTML`
- 3. 자치법규 별표서식 목록 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordinbyl&type=JSON`

---

### 학칙공단공공기관 목록 조회 API

- **Target**: `school`
- **URL**: `http://www.law.go.kr/DRF/lawSearch.do?target=school(or public or pi)`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (대학 : school / 지방공사공단 : public / 공공기관 : pi) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `nw` | int | (1: 현행, 2: 연혁, 기본값: 현행) |
| `search` | int | 검색범위 1 : 규정명(default) 2 : 본문검색 |
| `query` | string | 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") |
| `display` | int | 검색된 결과 개수 (default=20 max=100) |
| `page` | int | 검색 결과 페이지 (default=1) |
| `knd` | string | 학칙공단 종류별 검색 1 : 학칙 / 2 : 학교규정 / 3 : 학교지침 / 4 : 학교시행세칙 / 5 : 공단규정, 공공기관규정 |
| `rrClsCd` | string | 제정·개정 구분 200401 : 제정 / 200402 : 전부개정 / 200403 : 일부개정 / 200404 : 폐지 200405 : 일괄개정 / 200406 : 일괄폐지 / 2 |
| `date` | int | 발령일자 검색 |
| `prmlYd` | string | 발령일자 범위 검색 |
| `nb` | int | 발령번호 검색 |
| `gana` | string | 사전식 검색 (ga,na,da…,etc) |
| `sort` | string | 정렬옵션 lasc : 학칙공단명 오름차순(default) ldes : 학칙공단명 내림차순 dasc : 발령일자 오름차순 ddes : 발령일자 내림차순 nasc : 발령번호 오름차순 |
| `popYn` | string | 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `section` | string | 검색범위 |
| `totalCnt` | int | 검색 건수 |
| `page` | int | 현재 페이지번호 |
| `numOfRows` | int | 페이지 당 출력 결과 수 |
| `resultCode` | int | 조회 여부(성공 : 00 / 실패 : 01) |
| `resultMsg` | int | 조회 여부(성공 : success / 실패 : fail) |
| `admrul id` | int | 검색 결과 순번 |
| `행정규칙일련번호` | int | 학칙공단 일련번호 |
| `행정규칙명` | string | 학칙공단명 |
| `행정규칙종류` | string | 학칙공단 종류 |
| `발령일자` | int | 발령일자 |
| `발령번호` | int | 발령번호 |
| `소관부처명` | string | 소관부처명 |
| `현행연혁구분` | string | 현행연혁구분 |
| `제개정구분코드` | string | 제개정구분코드 |
| `제개정구분명` | string | 제개정구분명 |
| `법령분류코드` | string | 법령분류코드 |
| `법령분류명` | string | 법령분류명 |
| `행정규칙ID` | int | 학칙공단ID |
| `행정규칙상세링크` | string | 학칙공단 상세링크 |
| `시행일자` | int | 시행일자 |
| `생성일자` | int | 생성일자 |

#### 샘플 URL

- 1. 학칙공단 HTML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=school&type=HTML&query=%ED%95%99%EA%B5%90`
- 2. 학칙공단 XML 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=school&type=XML&query=%ED%95%99%EA%B5%90`
- 3. 학칙공단 JSON 목록 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=school&type=JSON&query=%ED%95%99%EA%B5%90`
- http://www.law.go.kr/DRF/lawSearch.do?OC=test&target=school&query=학교&type=JSON
  `https://open.law.go.kr/LSO/openApi/guideResult.do`

---

### 학칙공단공공기관 본문 조회 API

- **Target**: `school`
- **URL**: `http://www.law.go.kr/DRF/lawService.do?target=school(or public or pi)`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID(g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (대학 : school / 지방공사공단 : public / 공공기관 : pi) |
| `type` | char(필수) | 출력 형태 : HTML/XML/JSON |
| `ID` | char | 학칙공단 일련번호 |
| `LID` | char | 학칙공단 ID |
| `LM` | string | 학칙공단명조회하고자 하는 정확한 학칙공단명을 입력 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `행정규칙일련번호` | int | 학칙공단 일련번호 |
| `행정규칙명` | string | 학칙공단명 |
| `행정규칙종류` | string | 학칙공단 종류 |
| `행정규칙종류코드` | string | 학칙공단 종류코드 |
| `발령일자` | int | 발령일자 |
| `발령번호` | string | 발령번호 |
| `제개정구분명` | string | 제개정구분명 |
| `제개정구분코드` | string | 제개정구분코드 |
| `조문형식여부` | string | 조문형식여부 |
| `행정규칙ID` | int | 학칙공단ID |
| `소관부처명` | string | 소관부처명 |
| `소관부처코드` | string | 소관부처코드 |
| `담당부서기관코드` | string | 담당부서기관코드 |
| `담당부서기관명` | string | 담당부서기관명 |
| `담당자명` | string | 담당자명 |
| `전화번호` | string | 전화번호 |
| `현행여부` | string | 현행여부 |
| `생성일자` | string | 생성일자 |
| `조문내용` | string | 조문내용 |
| `부칙공포일자` | string | 부칙 공포일자 |
| `부칙공포번호` | string | 부칙 공포번호 |
| `부칙내용` | string | 부칙내용 |
| `별표단위 별표키` | string | 별표단위 별표키 |
| `별표번호` | string | 별표번호 |
| `별표가지번호` | string | 별표가지번호 |
| `별표구분` | string | 별표구분 |
| `별표제목` | string | 별표제목 |
| `별표서식파일링크` | string | 별표서식 파일링크 |
| `개정문내용` | string | 개정문내용 |
| `제개정이유내용` | string | 제개정이유내용 |

#### 샘플 URL

- 1. 학칙공단 HTML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=school&LID=2055825&type=HTML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=school&LID=2055825&type=HTML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=school&ID=2200000075994&type=HTML`
- 2. 학칙공단 XML 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=school&LID=2055825&type=XML`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=school&LID=2055825&type=XML
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=school&ID=2200000075994&type=XML`
- 3. 학칙공단 JSON 상세조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=school&LID=2055825&type=JSON`
- http://www.law.go.kr/DRF/lawService.do?OC=test&target=school&LID=2055825&type=JSON
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=school&ID=2200000075994&type=JSON`

---

### 법령정보지식베이스 일상용어-법령용어 연계 API

- **Target**: `dlytrmRlt`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=dlytrmRlt`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (일상용어-법령용어 연계 : dlytrmRlt) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `query` | string | 일상용어명에서 검색을 원하는 질의 (query 또는 MST 중 하나는 반드시 입력) |
| `MST` | char | 일상용어명 일련번호 |
| `trmRltCd` | int | 용어관계 동의어 : 140301 반의어 : 140302 상위어 : 140303 하위어 : 140304 연관어 : 140305 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `일상용어명` | string | 일상용어명 |
| `출처` | string | 일상용어 출처 |
| `연계용어 id` | string | 연계용어 순번 |
| `법령용어명` | string | 법령용어명 |
| `비고` | string | 동음이의어 내용 |
| `용어관계코드` | string | 용어관계코드 |
| `용어관계` | string | 용어관계명 |
| `용어간관계링크` | string | 법령용어-일상용어 연계 정보 상세링크 |
| `조문간관계링크` | string | 법령용어-조문 연계 정보 상세링크 |

#### 샘플 URL

- 1. 일상용어 민원 연계 법령용어 정보 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=dlytrmRlt&type=XML&query=%EB%AF%BC%EC%9B%90`
- 2. 일상용어 민원 연계 법령용어 정보 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=dlytrmRlt&type=JSON&query=%EB%AF%BC%EC%9B%90`

---

### 법령정보지식베이스 조문-법령용어 연계 API

- **Target**: `joRltLstrm`
- **URL**: `https://www.law.go.kr/DRF/lawService.do?target=joRltLstrm`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (조문-법령용어 연계 : joRltLstrm) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `query` | string | 법령명에서 검색을 원하는 질의 (query 또는 ID 중 하나는 반드시 입력) |
| `ID` | int | 법령 ID |
| `JO` | int(필수) | 조번호 조번호 4자리 + 조가지번호 2자리 (000200 : 2조, 000202 : 제2조의2) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `법령조문 id` | string | 법령조문 순번 |
| `법령명` | string | 법령명 |
| `조번호` | int | 조번호 |
| `조가지번호` | int | 조가지번호 |
| `조문내용` | string | 조문내용 |
| `연계용어 id` | string | 연계용어 순번 |
| `법령용어명` | string | 법령용어명 |
| `비고` | string | 동음이의어 내용 |
| `용어구분코드` | string | 용어구분코드 |
| `용어구분` | string | 용어구분명 |
| `용어간관계링크` | string | 법령용어-일상용어 연계 정보 상세링크 |
| `용어연계조문링크` | string | 법령용어-조문 연계 정보 상세링크 |

#### 샘플 URL

- 1. 상법시행법 제4조 연계 법령용어 정보 XML 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=joRltLstrm&type=XML&query=%EC%83%81%EB%B2%95%EC%8B%9C%ED%96%89%EB%B2%95&JO=000400`
- 2. 상법시행법 제4조 연계 법령용어 정보 JSON 조회
  `https://www.law.go.kr/DRF/lawService.do?OC=test&target=joRltLstrm&type=JSON&query=%EC%83%81%EB%B2%95%EC%8B%9C%ED%96%89%EB%B2%95&JO=000400`

---

### 법령정보지식베이스 관련법령 API

- **Target**: `lsRlt`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=lsRlt`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (관련법령 : lsRlt) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `query` | string | 기준법령명에서 검색을 원하는 질의 |
| `ID` | int | 법령 ID |
| `lsRltCd` | int | 법령 간 관계 코드 |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `기준법령ID` | int | 기준법령 ID |
| `기준법령명` | string | 기준법령명 |
| `기준법령상세링크` | string | 기준법령 본문 조회링크 |
| `관련법령 id` | string | 관련법령 순번 |
| `관련법령ID` | int | 관련법령 ID |
| `관련법령명` | string | 관련법령명 |
| `법령간관계코드` | string | 법령간관계코드 |
| `법령간관계` | string | 법령간관계 |
| `관련법령상세링크` | string | 관련법령 본문 조회링크 |
| `관련법령조회링크` | string | 해당 관련법령을 기준법령으로 한 관련법령 정보 조회링크 |

#### 샘플 URL

- 1. 법령정보지식베이스 관련법령 XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsRlt&type=XML`
- 2. 법령정보지식베이스 관련법령 JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=lsRlt&type=JSON`

---

### 법령정보지식베이스 지능형 법령검색 시스템 검색 API

- **Target**: `aiSearch`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=aiSearch`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (지능형 법령검색 시스템 검색 API : aiSearch) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `search` | int | 검색범위 법령분류 (0:법령조문, 1:법령 별표·서식, 2:행정규칙 조문, 3:행정규칙 별표·서식) |
| `query` | string | 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="뺑소니") |
| `display` | int | 검색된 결과 개수 (default=20) |
| `page` | int | 검색 결과 페이지 (default=1) |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `법령조문ID` | int | 법령조문 ID |
| `법령ID` | string | 법령ID |
| `법령일련번호` | string | 법령일련번호 |
| `법령명` | string | 법령명 |
| `시행일자` | string | 법령 시행일자 |
| `공포일자` | string | 법령 공포일자 |
| `공포번호` | string | 법령 공포번호 |
| `소관부처코드` | string | 소관부처코드 |
| `소관부처명` | string | 소관부처명 |
| `법령종류명` | string | 법령종류명 |
| `제개정구분명` | string | 법령 제개정구분명 |
| `법령편장절관코드` | string | 법령편장절관코드 |
| `조문일련번호` | string | 법령 조문일련번호 |
| `조문번호` | string | 법령 조문번호 |
| `조문가지번호` | string | 법령 조문가지번호 |
| `조문제목` | string | 법령 조문제목 |
| `조문내용` | string | 법령 조문내용 |
| `법령별표서식ID` | int | 법령별표서식 ID |
| `별표서식일련번호` | string | 법령 별표서식일련번호 |
| `별표서식번호` | string | 법령 별표서식번호 |
| `별표서식가지번호` | string | 법령 별표서식가지번호 |
| `별표서식제목` | string | 법령 별표서식제목 |
| `별표서식구분코드` | string | 법령 별표서식구분코드 |
| `별표서식구분명` | string | 법령 별표서식구분명 |
| `행정규칙조문ID` | int | 행정규칙조문 ID |
| `행정규칙일련번호` | string | 행정규칙일련번호 |
| `행정규칙ID` | string | 행정규칙ID |
| `행정규칙명` | string | 행정규칙명 |
| `발령일자` | string | 발령일자 |
| `발령번호` | string | 발령번호 |
| `시행일자` | string | 시행일자 |
| `발령기관명` | string | 발령기관명 |
| `행정규칙종류명` | string | 행정규칙종류명 |
| `제개정구분명` | string | 행정규칙 제개정구분명 |
| `조문일련번호` | string | 행정규칙 조문일련번호 |
| `조문번호` | string | 행정규칙 조문번호 |
| `조문가지번호` | string | 행정규칙 조문가지번호 |
| `조문제목` | string | 행정규칙 조문제목 |
| `조문내용` | string | 행정규칙 조문내용 |
| `행정규칙별표서식ID` | int | 행정규칙별표서식 ID |
| `별표서식일련번호` | string | 행정규칙 별표서식일련번호 |
| `별표서식번호` | string | 행정규칙 별표서식번호 |
| `별표서식가지번호` | string | 행정규칙 별표서식가지번호 |
| `별표서식제목` | string | 행정규칙 별표서식제목 |
| `별표서식구분코드` | string | 행정규칙 별표서식구분코드 |
| `별표서식구분명` | string | 행정규칙 별표서식구분명 |

#### 샘플 URL

- 1. 법령정보지식베이스 지능형 법령검색 시스템 검색 API XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=aiSearch&type=XML&search=0&query=%EB%BA%91%EC%86%8C%EB%8B%88`
- 2. 법령정보지식베이스 지능형 법령검색 시스템 검색 API JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=aiSearch&type=JSON&search=0&query=%EB%BA%91%EC%86%8C%EB%8B%88`

---

### 법령정보지식베이스 지능형 법령검색 시스템 연관법령 API

- **Target**: `aiRltLs`
- **URL**: `https://www.law.go.kr/DRF/lawSearch.do?target=aiRltLs`

#### 요청 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `OC` | string(필수) | 사용자 이메일의 ID (g4c@korea.kr일경우 OC값=g4c) |
| `target` | string(필수) | 서비스 대상 (지능형 법령검색 시스템 연관법령 API : aiRltLs) |
| `type` | char(필수) | 출력 형태 : XML/JSON |
| `search` | int | 검색범위 법령분류(0:법령조문, 1:행정규칙조문) |
| `query` | string | 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="뺑소니") |

#### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `target` | string | 검색서비스 대상 |
| `키워드` | string | 검색 단어 |
| `검색결과개수` | int | 검색 건수 |
| `법령조문ID` | int | 법령조문 ID |
| `법령ID` | string | 법령ID |
| `법령명` | string | 법령명 |
| `시행일자` | string | 법령 시행일자 |
| `공포일자` | string | 법령 공포일자 |
| `공포번호` | string | 법령 공포번호 |
| `조문번호` | string | 법령 조문번호 |
| `조문가지번호` | string | 법령 조문가지번호 |
| `조문제목` | string | 법령 조문제목 |
| `행정규칙조문ID` | int | 행정규칙조문 ID |
| `행정규칙ID` | string | 행정규칙ID |
| `행정규칙명` | string | 행정규칙명 |
| `발령일자` | string | 발령일자 |
| `발령번호` | string | 발령번호 |
| `조문번호` | string | 행정규칙 조문번호 |
| `조문가지번호` | string | 행정규칙 조문가지번호 |
| `조문제목` | string | 행정규칙 조문제목 |

#### 샘플 URL

- 1. 법령정보지식베이스 지능형 법령검색 시스템 연관법령 API XML 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=aiRltLs&type=XML&search=0&query=%EB%BA%91%EC%86%8C%EB%8B%88`
- 2. 법령정보지식베이스 지능형 법령검색 시스템 연관법령 API JSON 조회
  `https://www.law.go.kr/DRF/lawSearch.do?OC=test&target=aiRltLs&type=JSON&search=0&query=%EB%BA%91%EC%86%8C%EB%8B%88`

---

