/**
 * 국가법령정보 OPEN API 타입 정의
 * 자동 생성됨 - 2025-12-10T09:26:08.831Z
 */

// 공통 타입
export type OutputType = 'XML' | 'JSON' | 'HTML';

export interface BaseSearchParams {
  OC: string;       // 사용자 이메일 ID (필수)
  type?: OutputType; // 출력 형태 (기본: XML)
  display?: number;  // 결과 개수 (기본: 20, 최대: 100)
  page?: number;     // 페이지 번호 (기본: 1)
}

export interface BaseSearchResponse<T> {
  target: string;
  totalCnt: number;
  page: number;
  items: T[];
}

// ==================== EFLAW ====================

/** 현행법령(시행일) 목록 조회 API 요청 파라미터 */
export interface EflawSearchParams extends BaseSearchParams {
  target: 'eflaw';
  /** 검색범위 (기본 : 1 법령명) 2 : 본문검색 */
  search?: number;
  /** 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 1: 연혁, 2: 시행예정, 3: 현행 (기본값: 전체) 연혁+예정 : nw=1,2 예정+현행 : nw=2,3 연혁+현행 : nw=1,3 연혁+ */
  nw?: number;
  /** 법령ID (LID=830) */
  LID?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포 */
  sort?: string;
  /** 시행일자 범위 검색(20090101~20090130) */
  efYd?: string;
  /** 공포일자 검색 */
  date?: string;
  /** 공포일자 범위 검색(20090101~20090130) */
  ancYd?: string;
  /** 공포번호 범위 검색(306~400) */
  ancNo?: string;
  /** 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 30020 */
  rrClsCd?: string;
  /** 법령의 공포번호 검색 */
  nb?: number;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 법령종류(코드제공) */
  knd?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 현행법령(시행일) 목록 조회 API 응답 */
export interface EflawListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 현행연혁코드 */
  현행연혁코드?: string;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령약칭명 */
  법령약칭명?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처명 */
  소관부처코드?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 공동부령구분 */
  공동부령구분?: string;
  /** 공포번호(공동부령의 공포번호) */
  공포번호?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 자법타법여부 */
  자법타법여부?: string;
  /** 법령상세링크 */
  법령상세링크?: string;
}

/** 현행법령(시행일) 본문 조회 API 응답 */
export interface EflawDetail {
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 언어종류 */
  언어?: string;
  /** 법종류의 구분 */
  법종구분?: string;
  /** 법종구분코드 */
  법종구분코드?: string;
  /** 한글법령명 */
  법령명_한글?: string;
  /** 법령명_한자 */
  법령명_한자?: string;
  /** 법령명약칭 */
  법령명약칭?: string;
  /** 편장절관 일련번호 */
  편장절관?: number;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처?: string;
  /** 전화번호 */
  전화번호?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 제개정구분 */
  제개정구분?: string;
  /** 조문시행일자문자열 */
  조문시행일자문자열?: string;
  /** 별표시행일자문자열 */
  별표시행일자문자열?: string;
  /** 별표편집여부 */
  별표편집여부?: string;
  /** 공포법령여부 */
  공포법령여부?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 연락부서명 */
  부서명?: string;
  /** 연락부서 전화번호 */
  부서연락처?: string;
  /** 공동부령의 구분 */
  공동부령구분?: string;
  /** 구분코드(공동부령구분 구분코드) */
  구분코드?: string;
  /** 공포번호(공동부령의 공포번호) */
  공포번호?: string;
  /** 조문번호 */
  조문번호?: number;
  /** 조문가지번호 */
  조문가지번호?: number;
  /** 조문여부 */
  조문여부?: string;
  /** 조문제목 */
  조문제목?: string;
  /** 조문시행일자 */
  조문시행일자?: number;
  /** 조문제개정유형 */
  조문제개정유형?: string;
  /** 조문이동이전 */
  조문이동이전?: number;
  /** 조문이동이후 */
  조문이동이후?: number;
  /** 조문변경여부(Y값이 있으면 해당 조문내에 변경 내용 있음 ) */
  조문변경여부?: string;
  /** 조문내용 */
  조문내용?: string;
  /** 항번호 */
  항번호?: number;
  /** 항제개정유형 */
  항제개정유형?: string;
  /** 항제개정일자문자열 */
  항제개정일자문자열?: string;
  /** 항내용 */
  항내용?: string;
  /** 호번호 */
  호번호?: number;
  /** 호내용 */
  호내용?: string;
  /** 조문참고자료 */
  조문참고자료?: string;
  /** 부칙공포일자 */
  부칙공포일자?: number;
  /** 부칙공포번호 */
  부칙공포번호?: number;
  /** 부칙내용 */
  부칙내용?: string;
  /** 별표번호 */
  별표번호?: number;
  /** 별표가지번호 */
  별표가지번호?: number;
  /** 별표구분 */
  별표구분?: string;
  /** 별표제목 */
  별표제목?: string;
  /** 별표제목문자열 */
  별표제목문자열?: string;
  /** 별표시행일자 */
  별표시행일자?: number;
  /** 별표서식파일링크 */
  별표서식파일링크?: string;
  /** 별표 HWP 파일명 */
  별표HWP파일명?: string;
  /** 별표서식PDF파일링크 */
  별표서식PDF파일링크?: string;
  /** 별표 PDF 파일명 */
  별표PDF파일명?: string;
  /** 별표 이미지 파일명 */
  별표이미지파일명?: string;
  /** 별표내용 */
  별표내용?: string;
  /** 개정문내용 */
  개정문내용?: string;
  /** 제개정이유내용 */
  제개정이유내용?: string;
}

// ==================== LAW ====================

/** 현행법령(공포일) 목록 조회 API 요청 파라미터 */
export interface LawSearchParams extends BaseSearchParams {
  target: 'law';
  /** 검색범위 (기본 : 1 법령명) 2 : 본문검색 */
  search?: number;
  /** 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 정렬옵션 (기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공 */
  sort?: string;
  /** 법령의 공포일자 검색 */
  date?: number;
  /** 시행일자 범위 검색(20090101~20090130) */
  efYd?: string;
  /** 공포일자 범위 검색(20090101~20090130) */
  ancYd?: string;
  /** 공포번호 범위 검색(306~400) */
  ancNo?: string;
  /** 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 30020 */
  rrClsCd?: string;
  /** 법령의 공포번호 검색 */
  nb?: number;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 법령종류(코드제공) */
  knd?: string;
  /** 법령분류 (01-제1편 / 02-제2편 / 03-제3편... 44-제44편) */
  lsChapNo?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 현행법령(공포일) 목록 조회 API 응답 */
export interface LawListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 현행연혁코드 */
  현행연혁코드?: string;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령약칭명 */
  법령약칭명?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 법령구분명 */
  법령구분명?: string;
  /** 공동부령구분 */
  공동부령구분?: string;
  /** 공포번호(공동부령의 공포번호) */
  공포번호?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 자법타법여부 */
  자법타법여부?: string;
  /** 법령상세링크 */
  법령상세링크?: string;
}

/** 현행법령(공포일) 본문 조회 API 응답 */
export interface LawDetail {
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 언어종류 */
  언어?: string;
  /** 법종류의 구분 */
  법종구분?: string;
  /** 법종구분코드 */
  법종구분코드?: string;
  /** 한글법령명 */
  법령명_한글?: string;
  /** 법령명_한자 */
  법령명_한자?: string;
  /** 법령명약칭 */
  법령명약칭?: string;
  /** 제명변경여부 */
  제명변경여부?: string;
  /** 한글법령여부 */
  한글법령여부?: string;
  /** 편장절관 일련번호 */
  편장절관?: number;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처?: string;
  /** 전화번호 */
  전화번호?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 제개정구분 */
  제개정구분?: string;
  /** 별표편집여부 */
  별표편집여부?: string;
  /** 공포법령여부 */
  공포법령여부?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 연락부서명 */
  부서명?: string;
  /** 연락부서 전화번호 */
  부서연락처?: string;
  /** 공동부령의 구분 */
  공동부령구분?: string;
  /** 구분코드(공동부령구분 구분코드) */
  구분코드?: string;
  /** 공포번호(공동부령의 공포번호) */
  공포번호?: string;
  /** 조문번호 */
  조문번호?: number;
  /** 조문가지번호 */
  조문가지번호?: number;
  /** 조문여부 */
  조문여부?: string;
  /** 조문제목 */
  조문제목?: string;
  /** 조문시행일자 */
  조문시행일자?: number;
  /** 조문제개정유형 */
  조문제개정유형?: string;
  /** 조문이동이전 */
  조문이동이전?: number;
  /** 조문이동이후 */
  조문이동이후?: number;
  /** 조문변경여부(Y값이 있으면 해당 조문내에 변경 내용 있음 ) */
  조문변경여부?: string;
  /** 조문내용 */
  조문내용?: string;
  /** 항번호 */
  항번호?: number;
  /** 항제개정유형 */
  항제개정유형?: string;
  /** 항제개정일자문자열 */
  항제개정일자문자열?: string;
  /** 항내용 */
  항내용?: string;
  /** 호번호 */
  호번호?: number;
  /** 호내용 */
  호내용?: string;
  /** 조문참고자료 */
  조문참고자료?: string;
  /** 부칙공포일자 */
  부칙공포일자?: number;
  /** 부칙공포번호 */
  부칙공포번호?: number;
  /** 부칙내용 */
  부칙내용?: string;
  /** 별표번호 */
  별표번호?: number;
  /** 별표가지번호 */
  별표가지번호?: number;
  /** 별표구분 */
  별표구분?: string;
  /** 별표제목 */
  별표제목?: string;
  /** 별표서식파일링크 */
  별표서식파일링크?: string;
  /** 별표 HWP 파일명 */
  별표HWP파일명?: string;
  /** 별표서식PDF파일링크 */
  별표서식PDF파일링크?: string;
  /** 별표 PDF 파일명 */
  별표PDF파일명?: string;
  /** 별표 이미지 파일명 */
  별표이미지파일명?: string;
  /** 별표내용 */
  별표내용?: string;
  /** 개정문내용 */
  개정문내용?: string;
  /** 제개정이유내용 */
  제개정이유내용?: string;
}

// ==================== LSHISTORY ====================

/** 법령 연혁 목록 조회 가이드API 요청 파라미터 */
export interface LsHistorySearchParams extends BaseSearchParams {
  target: 'lsHistory';
  /** 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포 */
  sort?: string;
  /** 시행일자 범위 검색(20090101~20090130) */
  efYd?: string;
  /** 공포일자 검색 */
  date?: string;
  /** 공포일자 범위 검색(20090101~20090130) */
  ancYd?: string;
  /** 공포번호 범위 검색(306~400) */
  ancNo?: string;
  /** 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 30020 */
  rrClsCd?: string;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 법령종류(코드제공) */
  knd?: string;
  /** 법령분류 (01-제1편 / 02-제2편 / 03-제3편... 44-제44편) */
  lsChapNo?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 현행법령(시행일) 본문 조항호목 조회 API 응답 */
export interface EflawjosubDetail {
  /** 법령키 */
  법령키?: number;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 언어 */
  언어?: string;
  /** 법종구분 */
  법종구분?: string;
  /** 법종구분 코드 */
  법종구분_코드?: string;
  /** 법령명을 한글로 제공 */
  법령명_한글?: string;
  /** 법령명을 한자로 제공 */
  법령명_한자?: string;
  /** 법령명을 영어로 제공 */
  법령명_영어?: string;
  /** 편장절관 */
  편장절관?: number;
  /** 소관부처 코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처?: string;
  /** 전화번호 */
  전화번호?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 제개정구분명 */
  제개정구분?: string;
  /** 제안구분 */
  제안구분?: string;
  /** 의결구분 */
  의결구분?: string;
  /** 적용시작일자 */
  적용시작일자?: string;
  /** 적용종료일자 */
  적용종료일자?: string;
  /** 이전법령명 */
  이전법령명?: string;
  /** 조문시행일자문자열 */
  조문시행일자문자열?: string;
  /** 별표시행일자문자열 */
  별표시행일자문자열?: string;
  /** 별표편집여부 */
  별표편집여부?: string;
  /** 공포법령여부(Y값이 있으면 해당 법령은 공포법령임) */
  공포법령여부?: string;
  /** 조문번호 */
  조문번호?: number;
  /** 조문여부 */
  조문여부?: string;
  /** 조문제목 */
  조문제목?: string;
  /** 조문시행일자 */
  조문시행일자?: string;
  /** 조문이동이전번호 */
  조문이동이전?: number;
  /** 조문이동이후번호 */
  조문이동이후?: number;
  /** 조문변경여부(Y값이 있으면 해당 조문내에 변경 내용 있음 ) */
  조문변경여부?: string;
  /** 조문내용 */
  조문내용?: string;
  /** 항번호 */
  항번호?: number;
  /** 항내용 */
  항내용?: string;
  /** 호번호 */
  호번호?: number;
  /** 호내용 */
  호내용?: string;
  /** 목번호 */
  목번호?: string;
  /** 목내용 */
  목내용?: string;
}

/** 현행법령(공포일) 본문 조항호목 조회 API 응답 */
export interface LawjosubDetail {
  /** 법령키 */
  법령키?: number;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 언어 구분 */
  언어?: string;
  /** 법령명을 한글로 제공 */
  법령명_한글?: string;
  /** 법령명을 한자로 제공 */
  법령명_한자?: string;
  /** 법종구분코드 */
  법종구분코드?: string;
  /** 법종구분명 */
  법종구분명?: string;
  /** 제명변경여부(Y값이 있으면 해당 법령은 제명 변경임) */
  제명변경여부?: string;
  /** 한글법령여부(Y값이 있으면 해당 법령은 한글법령) */
  한글법령여부?: string;
  /** 편장절관 */
  편장절관?: number;
  /** 소관부처 코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처?: string;
  /** 전화번호 */
  전화번호?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 제개정구분명 */
  제개정구분?: string;
  /** 제안구분 */
  제안구분?: string;
  /** 의결구분 */
  의결구분?: string;
  /** 이전법령명 */
  이전법령명?: string;
  /** 조문별시행일자 */
  조문별시행일자?: string;
  /** 조문시행일자문자열 */
  조문시행일자문자열?: string;
  /** 별표시행일자문자열 */
  별표시행일자문자열?: string;
  /** 별표편집여부 */
  별표편집여부?: string;
  /** 공포법령여부(Y값이 있으면 해당 법령은 공포법령임) */
  공포법령여부?: string;
  /** 시행일기준편집여부(Y값이 있으면 해당 법령은 시행일 기준 편집됨) */
  시행일기준편집여부?: string;
  /** 조문번호 */
  조문번호?: number;
  /** 조문여부 */
  조문여부?: string;
  /** 조문제목 */
  조문제목?: string;
  /** 조문시행일자 */
  조문시행일자?: string;
  /** 조문이동이전번호 */
  조문이동이전?: number;
  /** 조문이동이후번호 */
  조문이동이후?: number;
  /** 조문변경여부(Y값이 있으면 해당 조문내에 변경 내용 있음 ) */
  조문변경여부?: string;
  /** 조문내용 */
  조문내용?: string;
  /** 항번호 */
  항번호?: number;
  /** 항내용 */
  항내용?: string;
  /** 호번호 */
  호번호?: number;
  /** 호내용 */
  호내용?: string;
  /** 목번호 */
  목번호?: string;
  /** 목내용 */
  목내용?: string;
}

// ==================== ELAW ====================

/** 영문법령 목록 조회 API 요청 파라미터 */
export interface ElawSearchParams extends BaseSearchParams {
  target: 'elaw';
  /** 검색범위 (기본 : 1 법령명) 2 : 본문검색 */
  search?: number;
  /** 법령명에서 검색을 원하는 질의(default=*) */
  query?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포 */
  sort?: string;
  /** 법령의 공포일자 검색 */
  date?: number;
  /** 시행일자 범위 검색(20090101~20090130) */
  efYd?: string;
  /** 공포일자 범위 검색(20090101~20090130) */
  ancYd?: string;
  /** 공포번호 범위 검색(306~400) */
  ancNo?: string;
  /** 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 30020 */
  rrClsCd?: string;
  /** 법령의 공포번호 검색 */
  nb?: number;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 법령종류(코드제공) */
  knd?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 영문법령 목록 조회 API 응답 */
export interface ElawListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 현행연혁코드 */
  현행연혁코드?: string;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령명영문 */
  법령명영문?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 자법타법여부 */
  자법타법여부?: string;
  /** 법령상세링크 */
  법령상세링크?: string;
}

// ==================== LSHSTINF ====================

/** 법령 변경이력 목록 조회 API 요청 파라미터 */
export interface LsHstInfSearchParams extends BaseSearchParams {
  target: 'lsHstInf';
  /** 법령 변경일 검색(20150101) */
  regDt: number;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 법령 변경이력 목록 조회 API 응답 */
export interface LsHstInfListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 검색 결과 순번 */
  law_id?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 현행연혁코드 */
  현행연혁코드?: string;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처코드 */
  소관부처코드?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 자법타법여부 */
  자법타법여부?: string;
  /** 법령상세링크 */
  법령상세링크?: string;
}

// ==================== LSJOHSTINF ====================

/** 일자별 조문 개정 이력 목록 조회 API 요청 파라미터 */
export interface LsJoHstInfSearchParams extends BaseSearchParams {
  target: 'lsJoHstInf';
  /** 조문 개정일, 8자리 (20150101) */
  regDt?: number;
  /** 조회기간 시작일, 8자리 (20150101) */
  fromRegDt?: number;
  /** 조회기간 종료일, 8자리 (20150101) */
  toRegDt?: number;
  /** 법령ID */
  ID?: number;
  /** 조문번호 조문번호 4자리 + 조 가지번호 2자리 (000202 : 제2조의2) */
  JO?: number;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
}

/** 일자별 조문 개정 이력 목록 조회 API 응답 */
export interface LsJoHstInfListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색한 기간에 개정 조문이 있는 법령의 건수 */
  totalCnt?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 소관부처코드 */
  소관부처코드?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 조 구분 번호 */
  jo_num?: string;
  /** 조문정보 */
  조문정보?: string;
  /** 조문번호 */
  조문번호?: string;
  /** 변경사유 */
  변경사유?: string;
  /** 조문링크 */
  조문링크?: string;
  /** 조문변경이력상세링크 */
  조문변경이력상세링크?: string;
  /** 조문제개정일 */
  조문개정일?: number;
  /** 조문시행일 */
  조문시행일?: number;
}

// ==================== LNKDEP ====================

/** 법령 자치법규 연계 목록 조회 API 요청 파라미터 */
export interface LnkDepSearchParams extends BaseSearchParams {
  target: 'lnkDep';
  /** 법령명에서 검색을 원하는 질의 */
  query?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 법령명에서 검색을 원하는 질의 */
  query?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 자치법규 오름차순 ddes : 자치법규 내림차순 nasc : 자치 */
  sort?: string;
  /** 법령종류(코드제공) */
  knd?: string;
  /** 조번호 생략(기본값) : 모든 조를 표시함 4자리숫자 : 조번호(4자리) (0023 : 23조) */
  JO?: number;
  /** 조가지번호 2자리숫자 : 조가지번호(2자리) (02 : 2) */
  JOBR?: number;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 소관부처별 검색(코드별도제공) */
  org?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 자치법규 오름차순 ddes : 자치법규 내림차순 nasc : 자치 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 법령 자치법규 연계 목록 조회 API 응답 */
export interface LnkDepListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령ID */
  법령ID?: number;
  /** 법령조번호 */
  법령조번호?: string;
  /** 자치법규 일련번호 */
  자치법규일련번호?: number;
  /** 자치법규명 */
  자치법규명?: string;
  /** 자치법규 조번호 */
  자치법규조번호?: string;
  /** 자치법규ID */
  자치법규ID?: number;
  /** 자치법규 공포일자 */
  공포일자?: number;
  /** 자치법규 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 자치법규종류 */
  자치법규종류?: string;
  /** 자치법규 시행일자 */
  시행일자?: number;
  /** 검색서비스 대상 */
  target?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령ID */
  법령ID?: number;
  /** 자치법규 일련번호 */
  자치법규일련번호?: number;
  /** 자치법규명 */
  자치법규명?: string;
  /** 자치법규ID */
  자치법규ID?: number;
  /** 자치법규 공포일자 */
  공포일자?: number;
  /** 자치법규 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 자치법규종류 */
  자치법규종류?: string;
  /** 자치법규 시행일자 */
  시행일자?: number;
}

// ==================== LSSTMD ====================

/** 법령 체계도 목록 조회 가이드API 요청 파라미터 */
export interface LsStmdSearchParams extends BaseSearchParams {
  target: 'lsStmd';
  /** 법령명에서 검색을 원하는 질의 */
  query?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포 */
  sort?: string;
  /** 시행일자 범위 검색(20090101~20090130) */
  efYd?: string;
  /** 공포일자 범위 검색(20090101~20090130) */
  ancYd?: string;
  /** 공포일자 검색 */
  date?: number;
  /** 공포번호 검색 */
  nb?: number;
  /** 공포번호 범위 검색 (10000~20000) */
  ancNo?: string;
  /** 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 30020 */
  rrClsCd?: string;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 법령종류(코드제공) */
  knd?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 법령 체계도 목록 조회 가이드API 응답 */
export interface LsStmdListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 페이지 당 출력 결과 수 */
  numOfRows?: number;
  /** 조회 여부(성공 : 00 / 실패 : 01) */
  resultCode?: number;
  /** 조회 여부(성공 : success / 실패 : fail) */
  resultMsg?: number;
  /** 검색 결과 순번 */
  law_id?: number;
  /** 법령 일련번호 */
  법령_일련번호?: number;
  /** 법령명 */
  법령명?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 본문 상세링크 */
  본문_상세링크?: string;
}

/** 법령 체계도 본문 조회 가이드API 응답 */
export interface LsStmdDetail {
  /** 기본정보 */
  기본정보?: string;
  /** 법령ID */
  법령ID?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 법종구분 */
  법종구분?: string;
  /** 법령 */
  법령명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 제개정구분 */
  제개정구분?: string;
  /** 상하위법 */
  상하위법?: string;
  /** 법률 */
  법률?: string;
  /** 시행령 */
  시행령?: string;
  /** 시행규칙 */
  시행규칙?: string;
  /** 본문 상세링크 */
  본문_상세링크?: string;
}

// ==================== OLDANDNEW ====================

/** 신구법 목록 조회 가이드API 요청 파라미터 */
export interface OldAndNewSearchParams extends BaseSearchParams {
  target: 'oldAndNew';
  /** 법령명에서 검색을 원하는 질의 */
  query?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포 */
  sort?: string;
  /** 시행일자 범위 검색(20090101~20090130) */
  efYd?: string;
  /** 공포일자 범위 검색(20090101~20090130) */
  ancYd?: string;
  /** 공포일자 검색 */
  date?: number;
  /** 공포번호 검색 */
  nb?: number;
  /** 공포번호 범위 검색 (10000~20000) */
  ancNo?: string;
  /** 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 30020 */
  rrClsCd?: string;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 법령종류(코드제공) */
  knd?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 신구법 목록 조회 가이드API 응답 */
export interface OldAndNewListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 페이지 당 출력 결과 수 */
  numOfRows?: number;
  /** 조회 여부(성공 : 00 / 실패 : 01) */
  resultCode?: number;
  /** 조회 여부(성공 : success / 실패 : fail) */
  resultMsg?: number;
  /** 검색 결과 순번 */
  oldAndNew_id?: number;
  /** 신구법 일련번호 */
  신구법일련번호?: number;
  /** 현행연혁코드 */
  현행연혁구분?: string;
  /** 신구법명 */
  신구법명?: string;
  /** 신구법ID */
  신구법ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 신구법 상세링크 */
  신구법상세링크?: string;
}

/** 신구법 본문 조회 가이드API 응답 */
export interface OldAndNewDetail {
  /** 구조문_기본정보 */
  구조문_기본정보?: string;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 법령ID */
  법령ID?: number;
  /** 시행일자 */
  시행일자?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 현행여부 */
  현행여부?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 법령 */
  법령명?: string;
  /** 법종구분 */
  법종구분?: string;
  /** 구조문과 동일한 기본 정보 들어가 있음. */
  신조문_기본정보?: string;
  /** 구조문목록 */
  구조문목록?: string;
  /** 조문 */
  조문?: string;
  /** 신조문목록 */
  신조문목록?: string;
  /** 조문 */
  조문?: string;
  /** 신구법이 존재하지 않을 경우 N이 조회. */
  신구법존재여부?: string;
}

// ==================== THDCMP ====================

/** 3단 비교 목록 조회 가이드API 요청 파라미터 */
export interface ThdCmpSearchParams extends BaseSearchParams {
  target: 'thdCmp';
  /** 법령명에서 검색을 원하는 질의 */
  query?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포 */
  sort?: string;
  /** 시행일자 범위 검색(20090101~20090130) */
  efYd?: string;
  /** 공포일자 범위 검색(20090101~20090130) */
  ancYd?: string;
  /** 공포일자 검색 */
  date?: number;
  /** 공포번호 검색 */
  nb?: number;
  /** 공포번호 범위 검색 (10000~20000) */
  ancNo?: string;
  /** 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 30020 */
  rrClsCd?: string;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 법령종류(코드제공) */
  knd?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 3단 비교 목록 조회 가이드API 응답 */
export interface ThdCmpListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 페이지 당 출력 결과 수 */
  numOfRows?: number;
  /** 조회 여부(성공 : 00 / 실패 : 01) */
  resultCode?: number;
  /** 조회 여부(성공 : success / 실패 : fail) */
  resultMsg?: number;
  /** 검색결과 순번 */
  thdCmp_id?: number;
  /** 삼단비교 일련번호 */
  삼단비교일련번호?: number;
  /** 법령명 한글 */
  법령명_한글?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 인용조문_삼단비교 상세링크 */
  인용조문_삼단비교상세링크?: string;
  /** 위임조문_삼단비교 상세링크 */
  위임조문_삼단비교상세링크?: string;
}

/** 3단비교 본문 조회 가이드API 응답 */
export interface ThdCmpDetail {
  /** 인용 삼단비교 기본정보 */
  기본정보?: string;
  /** 법령 ID */
  법령ID?: number;
  /** 시행령 ID */
  시행령ID?: number;
  /** 시행규칙 ID */
  시행규칙ID?: number;
  /** 법령 명 */
  법령명?: string;
  /** 법령시행령 명 */
  시행령명?: string;
  /** 시행규칙 명 */
  시행규칙명?: string;
  /** 법령 요약정보 */
  법령요약정보?: string;
  /** 시행령 요약정보 */
  시행령요약정보?: string;
  /** 시행규칙 요약정보 */
  시행규칙요약정보?: string;
  /** 삼단비교 기준 */
  삼단비교기준?: string;
  /** 삼단비교 존재하지 않으면 N이 조회. */
  삼단비교존재여부?: number;
  /** 시행일자 */
  시행일자?: number;
  /** 관련 삼단비교 목록 */
  관련삼단비교목록?: string;
  /** 목록명 */
  목록명?: string;
  /** 인용조문 삼단비교 목록 상세링크 */
  삼단비교목록상세링크?: string;
  /** 인용조문 삼단비교 */
  인용조문삼단비교?: string;
  /** 법률조문 */
  법률조문?: string;
  /** 조번호 */
  조번호?: number;
  /** 조가지번호 */
  조가지번호?: number;
  /** 조제목 */
  조제목?: string;
  /** 조내용 */
  조내용?: string;
  /** 시행령조문목록 */
  시행령조문목록?: string;
  /** 하위 시행령조문 */
  시행령조문?: string;
  /** 시행규칙조문목록 */
  시행규칙조문목록?: string;
  /** 하위 시행규칙조문 */
  시행규칙조문?: string;
  /** 위임행정규칙목록 */
  위임행정규칙목록?: string;
  /** 위임행정규칙 */
  위임행정규칙?: string;
  /** 위임행정규칙명 */
  위임행정규칙명?: string;
  /** 위임행정규칙일련번호 */
  위임행정규칙일련번호?: number;
  /** 위임행정규칙조번호 */
  위임행정규칙조번호?: number;
  /** 위임행정규칙조가지번호 */
  위임행정규칙조가지번호?: number;
  /** 위임 삼단비교 기본정보 */
  기본정보?: string;
  /** 법령 ID */
  법령ID?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 법종 구분 */
  법종구분?: string;
  /** 법령 명 */
  법령명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 제개정구분 */
  제개정구분?: string;
  /** 삼단비교 존재하지 않으면 N이 조회. */
  삼단비교존재여부?: number;
  /** 기준법 법령명 */
  기준법법령명?: string;
  /** 기준 법령 목록 */
  기준법령목록?: string;
  /** 기준법 법령명 */
  기준법법령명?: string;
  /** 법종 구분 */
  법종구분?: string;
  /** 공포번호 */
  공포번호?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 제개정구분 */
  제개정구분?: string;
  /** 위임조문 3비교 목록 상세링크 */
  위임3비교상세링크?: string;
  /** 위임조문 삼단비교 */
  위임조문삼단비교?: string;
  /** 법률조문 */
  법률조문?: string;
  /** 조번호 */
  조번호?: number;
  /** 조가지번호 */
  조가지번호?: number;
  /** 조제목 */
  조제목?: string;
  /** 조내용 */
  조내용?: string;
  /** 하위 시행령조문 */
  시행령조문?: string;
  /** 시행규칙조문목록 */
  시행규칙조문목록?: string;
  /** 하위 시행규칙조문 */
  시행규칙조문?: string;
}

// ==================== DELHST ====================

/** 삭제 데이터 목록 조회 API 요청 파라미터 */
export interface DelHstSearchParams extends BaseSearchParams {
  target: 'delHst';
  /** 데이터 종류 법령 : 1 행정규칙 : 2 자치법규 : 3 학칙공단 : 13 */
  knd?: number;
  /** 데이터 삭제 일자 검색 (YYYYMMDD) */
  delDt?: number;
  /** 데이터 삭제 일자 범위 검색 (YYYYMMDD) */
  frmDttoDt?: number;
}

/** 삭제 데이터 목록 조회 API 응답 */
export interface DelHstListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 데이터 일련번호 */
  일련번호?: number;
  /** 데이터 구분명 (법령 / 행정규칙 / 자치법규 등) */
  구분명?: string;
  /** 데이터 삭제일자 */
  삭제일자?: string;
}

// ==================== ONEVIEW ====================

/** 한눈보기 목록 조회 API 요청 파라미터 */
export interface OneviewSearchParams extends BaseSearchParams {
  target: 'oneview';
  /** 법령명에서 검색을 원하는 질의 */
  query?: string;
}

/** 한눈보기 목록 조회 API 응답 */
export interface OneviewListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  법령_id?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 법령명 */
  법령명?: string;
  /** 공포일자 */
  공포일자?: string;
  /** 공포번호 */
  공포번호?: number;
  /** 시행일자 */
  시행일자?: string;
  /** 제공건수 */
  제공건수?: number;
  /** 제공일자 */
  제공일자?: string;
}

/** 한눈보기 본문 조회 API 응답 */
export interface OneviewDetail {
  /** 패턴일련번호 */
  패턴일련번호?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 법령명 */
  법령명?: string;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 조문시행일자 */
  조문시행일자?: number;
  /** 최초제공일자 */
  최초제공일자?: number;
  /** 조번호 */
  조번호?: number;
  /** 조제목 */
  조제목?: string;
  /** 콘텐츠제목 */
  콘텐츠제목?: string;
  /** 링크텍스트 */
  링크텍스트?: string;
  /** 링크URL */
  링크URL?: string;
}

// ==================== ADMRUL ====================

/** 행정규칙 목록 조회 API 요청 파라미터 */
export interface AdmrulSearchParams extends BaseSearchParams {
  target: 'admrul';
  /** (1: 현행, 2: 연혁, 기본값: 현행) */
  nw?: number;
  /** 검색범위 (기본 : 1 행정규칙명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 소관부처별 검색(코드별도제공) */
  org?: string;
  /** 행정규칙 종류별 검색 (1=훈령/2=예규/3=고시 /4=공고/5=지침/6=기타) */
  knd?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 (기본 : lasc 행정규칙명 오른차순) ldes 행정규칙명 내림차순 dasc : 발령일자 오름차순 ddes : 발령일자 내림차순 na */
  sort?: string;
  /** 행정규칙 발령일자 */
  date?: number;
  /** 발령일자 기간검색(20090101~20090130) */
  prmlYd?: string;
  /** 수정일자 기간검색(20090101~20090130) */
  modYd?: string;
  /** 행정규칙 발령번호ex)제2023-8호 검색을 원할시 nb=20238 */
  nb?: number;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 행정규칙 목록 조회 API 응답 */
export interface AdmrulListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  admrul_id?: number;
  /** 행정규칙일련번호 */
  행정규칙일련번호?: number;
  /** 행정규칙명 */
  행정규칙명?: string;
  /** 행정규칙종류 */
  행정규칙종류?: string;
  /** 발령일자 */
  발령일자?: number;
  /** 발령번호 */
  발령번호?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 현행연혁구분 */
  현행연혁구분?: string;
  /** 제개정구분코드 */
  제개정구분코드?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 행정규칙 */
  행정규칙ID?: number;
  /** 행정규칙상세링크 */
  행정규칙상세링크?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 생성일자 */
  생성일자?: number;
}

/** 행정규칙 본문 조회 API 응답 */
export interface AdmrulDetail {
  /** 행정규칙일련번호 */
  행정규칙일련번호?: number;
  /** 행정규칙명 */
  행정규칙명?: string;
  /** 행정규칙종류 */
  행정규칙종류?: string;
  /** 행정규칙종류코드 */
  행정규칙종류코드?: string;
  /** 발령일자 */
  발령일자?: number;
  /** 발령번호 */
  발령번호?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 제개정구분코드 */
  제개정구분코드?: string;
  /** 조문형식여부 */
  조문형식여부?: string;
  /** 행정규칙 */
  행정규칙ID?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 소관부처코드 */
  소관부처코드?: string;
  /** 상위부처명 */
  상위부처명?: string;
  /** 담당부서기관코드 */
  담당부서기관코드?: string;
  /** 담당부서기관명 */
  담당부서기관명?: string;
  /** 담당자명 */
  담당자명?: string;
  /** 전화번호 */
  전화번호?: string;
  /** 현행여부 */
  현행여부?: string;
  /** 시행일자 */
  시행일자?: string;
  /** 생성일자 */
  생성일자?: string;
  /** 조문내용 */
  조문내용?: string;
  /** 부칙 */
  부칙?: string;
  /** 부칙공포일자 */
  부칙공포일자?: number;
  /** 부칙공포번호 */
  부칙공포번호?: number;
  /** 부칙내용 */
  부칙내용?: string;
  /** 별표 */
  별표?: string;
  /** 별표번호 */
  별표번호?: number;
  /** 별표가지번호 */
  별표가지번호?: number;
  /** 별표구분 */
  별표구분?: string;
  /** 별표제목 */
  별표제목?: string;
  /** 별표서식파일링크 */
  별표서식파일링크?: string;
  /** 별표서식PDF파일링크 */
  별표서식PDF파일링크?: string;
  /** 별표내용 */
  별표내용?: string;
}

// ==================== ADMRULOLDANDNEW ====================

/** 행정규칙 신구법비교 목록 조회 가이드API 요청 파라미터 */
export interface AdmrulOldAndNewSearchParams extends BaseSearchParams {
  target: 'admrulOldAndNew';
  /** 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 행정규칙 종류별 검색 (1=훈령/2=예규/3=고시 /4=공고/5=지침/6=기타) */
  knd?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션(기본 : lasc 법령오름차순) ldes : 법령내림차순 dasc : 발령일자 오름차순 ddes : 발령일자 내림차순 nasc : 발령 */
  sort?: string;
  /** 행정규칙 발령일자 */
  date?: string;
  /** 발령일자 기간검색(20090101~20090130) */
  prmlYd?: string;
  /** 행정규칙 발령번호 ex)제2023-8호 검색을 원할시 nb=20238 */
  nb?: number;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 행정규칙 신구법비교 목록 조회 가이드API 응답 */
export interface AdmrulOldAndNewListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 페이지 당 출력 결과 수 */
  numOfRows?: number;
  /** 조회 여부(성공 : 00 / 실패 : 01) */
  resultCode?: number;
  /** 조회 여부(성공 : success / 실패 : fail) */
  resultMsg?: number;
  /** 검색 결과 순번 */
  oldAndNew_id?: number;
  /** 신구법 일련번호 */
  신구법일련번호?: number;
  /** 현행연혁코드 */
  현행연혁구분?: string;
  /** 신구법명 */
  신구법명?: string;
  /** 신구법ID */
  신구법ID?: number;
  /** 발령일자 */
  발령일자?: number;
  /** 발령번호 */
  발령번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 신구법 상세링크 */
  신구법상세링크?: string;
}

/** 행정규칙 신구법 본문 조회 가이드API 응답 */
export interface AdmrulOldAndNewDetail {
  /** 구조문_기본정보 */
  구조문_기본정보?: string;
  /** 행정규칙일련번호 */
  행정규칙일련번호?: number;
  /** 행정규칙ID */
  행정규칙ID?: number;
  /** 시행일자 */
  시행일자?: number;
  /** 발령일자 */
  발령일자?: number;
  /** 발령번호 */
  발령번호?: number;
  /** 현행여부 */
  현행여부?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 행정규칙명 */
  행정규칙명?: string;
  /** 행정규칙종류 */
  행정규칙종류?: string;
  /** 구조문과 동일한 기본 정보 들어가 있음. */
  신조문_기본정보?: string;
  /** 구조문목록 */
  구조문목록?: string;
  /** 조문 */
  조문?: string;
  /** 신조문목록 */
  신조문목록?: string;
  /** 조문 */
  조문?: string;
  /** 신구법이 존재하지 않을 경우 N이 조회. */
  신구법존재여부?: string;
}

// ==================== ORDIN ====================

/** 자치법규 목록 조회 API 요청 파라미터 */
export interface OrdinSearchParams extends BaseSearchParams {
  target: 'ordin';
  /** (1: 현행, 2: 연혁, 기본값: 현행) */
  nw?: number;
  /** 검색범위 (기본 : 1 자치법규명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의(defalut=*) (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 정렬옵션 (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc  */
  sort?: string;
  /** 자치법규 공포일자 검색 */
  date?: number;
  /** 시행일자 범위 검색(20090101~20090130) */
  efYd?: string;
  /** 공포일자 범위 검색(20090101~20090130) */
  ancYd?: string;
  /** 공포번호 범위 검색(306~400) */
  ancNo?: string;
  /** 법령의 공포번호 검색 */
  nb?: number;
  /** 지자체별 도·특별시·광역시 검색(지자체코드 제공) (ex. 서울특별시에 대한 검색-> org=6110000) */
  org?: string;
  /** 지자체별 시·군·구 검색(지자체코드 제공) (필수값 : org, ex.서울특별시 구로구에 대한 검색-> org=6110000&sborg=3160 */
  sborg?: string;
  /** 법령종류 (30001-조례 /30002-규칙 /30003-훈령 /30004-예규/30006-기타/30010-고시 /30011-의회규칙) */
  knd?: string;
  /** 법령 제개정 종류 (300201-제정 / 300202-일부개정 / 300203-전부개정 300204-폐지 / 300205-폐지제정 / 30020 */
  rrClsCd?: string;
  /** 분류코드별 검색. 분류코드는 지자체 분야코드 openAPI 참조 */
  ordinFd?: number;
  /** 법령분야별 검색(법령분야코드제공) (ex. 제1편 검색 lsChapNo=01000000 / 제1편2장,제1편2장1절 lsChapNo=010200 */
  lsChapNo?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 기관코드값(예:서울시-6110000) */
  org: string;
}

/** 자치법규 목록 조회 API 응답 */
export interface OrdinListItem {
  /** 자치법규일련번호 */
  자치법규일련번호?: number;
  /** 자치법규명 */
  자치법규명?: string;
  /** 자치법규ID */
  자치법규ID?: number;
  /** 공포일자 */
  공포일자?: string;
  /** 공포번호 */
  공포번호?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 지자체기관명 */
  지자체기관명?: string;
  /** 자치법규종류 */
  자치법규종류?: string;
  /** 시행일자 */
  시행일자?: string;
  /** 자치법규상세링크 */
  자치법규상세링크?: string;
  /** 자치법규분야명 */
  자치법규분야명?: string;
  /** 참조데이터구분 */
  참조데이터구분?: string;
  /** 기관코드 */
  기관코드?: string;
  /** 기관별 분류유형 갯수 */
  기관별분류유형CNT?: string;
  /** 분류일련번호 */
  분류seq?: number;
  /** 분류명 */
  분류명?: string;
  /** 해당자치법규갯수 */
  해당자치법규갯수?: number;
}

/** 자치법규 본문 조회 API 응답 */
export interface OrdinDetail {
  /** 자치법규ID */
  자치법규ID?: number;
  /** 자치법규일련번호 */
  자치법규일련번호?: string;
  /** 공포일자 */
  공포일자?: string;
  /** 공포번호 */
  공포번호?: string;
  /** 자치법규명 */
  자치법규명?: string;
  /** 시행일자 */
  시행일자?: string;
  /** 자치법규종류 (C0001-조례 /C0002-규칙 /C0003-훈령  /C0004-예규/C0006-기타/C0010-고시 /C0011-의회규칙) */
  자치법규종류?: string;
  /** 지자체기관명 */
  지자체기관명?: string;
  /** 자치법규발의종류 */
  자치법규발의종류?: string;
  /** 담당부서명 */
  담당부서명?: string;
  /** 전화번호 */
  전화번호?: string;
  /** 제개정정보 */
  제개정정보?: string;
  /** 조문번호 */
  조문번호?: string;
  /** 해당 조문이 조일때 Y,그 외 편,장,절,관 일때는 N */
  조문여부?: string;
  /** 조제목 */
  조제목?: string;
  /** 조내용 */
  조내용?: string;
  /** 부칙공포일자 */
  부칙공포일자?: number;
  /** 부칙공포번호 */
  부칙공포번호?: number;
  /** 부칙내용 */
  부칙내용?: string;
  /** 부칙내용 */
  부칙내용?: string;
  /** 별표 (자치법규 별표는 서울시교육청과 본청만 제공합니다.) */
  별표?: string;
  /** 별표번호 */
  별표번호?: number;
  /** 별표가지번호 */
  별표가지번호?: number;
  /** 별표구분 */
  별표구분?: string;
  /** 별표제목 */
  별표제목?: string;
  /** 별표첨부파일명 */
  별표첨부파일명?: string;
  /** 별표내용 */
  별표내용?: string;
  /** 개정문내용 */
  개정문내용?: string;
  /** 제개정이유내용 */
  제개정이유내용?: string;
}

// ==================== LNKORG ====================

/** 자치법규 법령 연계 목록 조회 API 요청 파라미터 */
export interface LnkOrgSearchParams extends BaseSearchParams {
  target: 'lnkOrg';
  /** 법규명에서 검색을 원하는 질의 */
  query?: string;
  /** 정렬옵션 (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc  */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번 */
  sort?: string;
  /** 법령종류(코드제공)법령ID 사용함 */
  knd?: string;
  /** 지자체 기관코드 (지자체코드 제공) */
  org?: string;
  /** (기본 : lasc 자치법규오름차순) ldes 자치법규 내림차순 dasc : 공포일자 오름차순 ddes : 공포일자 내림차순 nasc : 공포번 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 자치법규 법령 연계 목록 조회 API 응답 */
export interface LnkOrgListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 자치법규 일련번호 */
  자치법규일련번호?: number;
  /** 자치법규명 */
  자치법규명?: string;
  /** 자치법규ID */
  자치법규ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 자치법규종류 */
  자치법규종류?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 검색서비스 대상 */
  target?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 자치법규 일련번호 */
  자치법규일련번호?: number;
  /** 자치법규명 */
  자치법규명?: string;
  /** 자치법규ID */
  자치법규ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 자치법규종류 */
  자치법규종류?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 검색서비스 대상 */
  target?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 자치법규 일련번호 */
  자치법규일련번호?: number;
  /** 자치법규명 */
  자치법규명?: string;
  /** 자치법규ID */
  자치법규ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 자치법규종류 */
  자치법규종류?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령ID */
  법령ID?: number;
}

// ==================== PREC ====================

/** 판례 목록 조회 API 요청 파라미터 */
export interface PrecSearchParams extends BaseSearchParams {
  target: 'prec';
  /** 검색범위 (기본 : 1 판례명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의(검색 결과 리스트) (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 법원종류 (대법원:400201, 하위법원:400202) */
  org?: string;
  /** 법원명 (대법원, 서울고등법원, 광주지법, 인천지방법원) */
  curt?: string;
  /** 참조법령명(형법, 민법 등) */
  JO?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 사건명 오름차순 ldes : 사건명 내림차순 dasc : 선고일자 오름차순 ddes : 선고일자 내림차순(생략시 기본) n */
  sort?: string;
  /** 판례 선고일자 */
  date?: number;
  /** 선고일자 검색(20090101~20090130) */
  prncYd?: string;
  /** 판례 사건번호 */
  nb?: string;
  /** 데이터출처명(국세법령정보시스템, 근로복지공단산재판례, 대법원) */
  datSrcNm?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 판례 목록 조회 API 응답 */
export interface PrecListItem {
  /** 검색 대상 */
  target?: string;
  /** 공포번호 */
  공포번호?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위(EvtNm:판례명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  prec_id?: number;
  /** 판례일련번호 */
  판례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 선고일자 */
  선고일자?: string;
  /** 법원명 */
  법원명?: string;
  /** 법원종류코드(대법원:400201, 하위법원:400202) */
  법원종류코드?: number;
  /** 사건종류명 */
  사건종류명?: string;
  /** 사건종류코드 */
  사건종류코드?: number;
  /** 판결유형 */
  판결유형?: string;
  /** 선고 */
  선고?: string;
  /** 데이터출처명 */
  데이터출처명?: string;
  /** 판례상세링크 */
  판례상세링크?: string;
}

/** 판례 본문 조회 API 응답 */
export interface PrecDetail {
  /** 판례정보일련번호 */
  판례정보일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 선고일자 */
  선고일자?: number;
  /** 선고 */
  선고?: string;
  /** 법원명 */
  법원명?: string;
  /** 법원종류코드(대법원:400201, 하위법원:400202) */
  법원종류코드?: number;
  /** 사건종류명 */
  사건종류명?: string;
  /** 사건종류코드 */
  사건종류코드?: number;
  /** 판결유형 */
  판결유형?: string;
  /** 판시사항 */
  판시사항?: string;
  /** 판결요지 */
  판결요지?: string;
  /** 참조조문 */
  참조조문?: string;
  /** 참조판례 */
  참조판례?: string;
  /** 판례내용 */
  판례내용?: string;
}

// ==================== DETC ====================

/** 헌재결정례 목록 조회 API 요청 파라미터 */
export interface DetcSearchParams extends BaseSearchParams {
  target: 'detc';
  /** 검색범위 (기본 : 1 헌재결정례명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 (기본 : lasc 사건명 오름차순) ldes 사건명 내림차순 dasc : 선고일자 오름차순 ddes : 선고일자 내림차순 nasc : */
  sort?: string;
  /** 종국일자 */
  date?: number;
  /** 종국일자 기간 검색 */
  edYd?: string;
  /** 사건번호 */
  nb?: number;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 헌재결정례 목록 조회 API 응답 */
export interface DetcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(EvtNm:헌재결정례명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  detc_id?: number;
  /** 헌재결정례일련번호 */
  헌재결정례일련번호?: number;
  /** 종국일자 */
  종국일자?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 사건명 */
  사건명?: string;
  /** 헌재결정례상세링크 */
  헌재결정례상세링크?: string;
}

/** 헌재결정례 본문 조회 API 응답 */
export interface DetcDetail {
  /** 헌재결정례일련번호 */
  헌재결정례일련번호?: number;
  /** 종국일자 */
  종국일자?: number;
  /** 사건번호 */
  사건번호?: string;
  /** 사건명 */
  사건명?: string;
  /** 사건종류명 */
  사건종류명?: string;
  /** 사건종류코드 */
  사건종류코드?: number;
  /** 재판부구분코드(전원재판부:430201, 지정재판부:430202) */
  재판부구분코드?: number;
  /** 판시사항 */
  판시사항?: string;
  /** 결정요지 */
  결정요지?: string;
  /** 전문 */
  전문?: string;
  /** 참조조문 */
  참조조문?: string;
  /** 참조판례 */
  참조판례?: string;
  /** 심판대상조문 */
  심판대상조문?: string;
}

// ==================== EXPC ====================

/** 법령해석례 목록 조회 API 요청 파라미터 */
export interface ExpcSearchParams extends BaseSearchParams {
  target: 'expc';
  /** 검색범위 (기본 : 1 법령해석례명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 질의기관 */
  inq?: string;
  /** 회신기관 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호13-0217 검색을 원할시 itmno=130217 */
  itmno?: number;
  /** 등록일자 검색(20090101~20090130) */
  regYd?: string;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석례명 오름차순) ldes 법령해석례명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순  */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 법령해석례 목록 조회 API 응답 */
export interface ExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석례명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  expc_id?: number;
  /** 법령해석례일련번호 */
  법령해석례일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 회신기관코드 */
  회신기관코드?: string;
  /** 회신기관명 */
  회신기관명?: string;
  /** 회신일자 */
  회신일자?: string;
  /** 법령해석례상세링크 */
  법령해석례상세링크?: string;
}

/** 법령해석례 본문 조회 API 응답 */
export interface ExpcDetail {
  /** 법령해석례일련번호 */
  법령해석례일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
}

// ==================== DECC ====================

/** 행정심판례 목록 조회 API 요청 파라미터 */
export interface DeccSearchParams extends BaseSearchParams {
  target: 'decc';
  /** 검색범위 (기본 : 1 행정심판례명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 재결례유형(출력 결과 필드에 있는 재결구분코드) */
  cls?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 의결일자 */
  date?: number;
  /** 처분일자 검색(20090101~20090130) */
  dpaYd?: string;
  /** 의결일자 검색(20090101~20090130) */
  rslYd?: string;
  /** 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 행정심판례 목록 조회 API 응답 */
export interface DeccListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(EvtNm:재결례명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  decc_id?: number;
  /** 행정심판재결례일련번호 */
  행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 처분일자 */
  처분일자?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: number;
  /** 재결구분명 */
  재결구분명?: string;
  /** 재결구분코드 */
  재결구분코드?: string;
  /** 행정심판례상세링크 */
  행정심판례상세링크?: string;
}

/** 행정심판례 본문 조회 API 응답 */
export interface DeccDetail {
  /** 행정심판례일련번호 */
  행정심판례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 처분일자 */
  처분일자?: number;
  /** 의결일자 */
  의결일자?: number;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: string;
  /** 재결례유형명 */
  재결례유형명?: string;
  /** 재결례유형코드 */
  재결례유형코드?: number;
  /** 주문 */
  주문?: string;
  /** 청구취지 */
  청구취지?: string;
  /** 이유 */
  이유?: string;
  /** 재결요지 */
  재결요지?: string;
}

// ==================== PPC ====================

/** 개인정보보호위원회 결정문 목록 조회 API 요청 파라미터 */
export interface PpcSearchParams extends BaseSearchParams {
  target: 'ppc';
  /** 검색범위 1 : 안건명 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 안건명 오름차순 (default) ldes : 안건명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 개인정보보호위원회 결정문 목록 조회 API 응답 */
export interface PpcListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  ppc_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 의안번호 */
  의안번호?: string;
  /** 회의종류 */
  회의종류?: string;
  /** 결정구분 */
  결정구분?: string;
  /** 의결일 */
  의결일?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 개인정보보호위원회 위원회 결정문 본문 조회 API 응답 */
export interface PpcDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 기관명 */
  기관명?: string;
  /** 결정 */
  결정?: string;
  /** 회의종류 */
  회의종류?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 안건명 */
  안건명?: string;
  /** 신청인 */
  신청인?: string;
  /** 의결연월일 */
  의결연월일?: string;
  /** 주문 */
  주문?: string;
  /** 이유 */
  이유?: string;
  /** 배경 */
  배경?: string;
  /** 이의제기방법및기간 */
  이의제기방법및기간?: string;
  /** 주요내용 */
  주요내용?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 위원서명 */
  위원서명?: string;
  /** 별지 */
  별지?: string;
  /** 결정요지 */
  결정요지?: string;
}

// ==================== EIAC ====================

/** 고용보험심사위원회 결정문 목록 조회 API 요청 파라미터 */
export interface EiacSearchParams extends BaseSearchParams {
  target: 'eiac';
  /** 검색범위 1 : 사건명 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 사건명 오름차순 (default) ldes : 사건명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 고용보험심사위원회 결정문 목록 조회 API 응답 */
export interface EiacListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  eiac_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 고용보험심사위원회 결정문 본문 조회 API 응답 */
export interface EiacDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 사건의 분류 */
  사건의분류?: string;
  /** 의결서 종류 */
  의결서종류?: string;
  /** 개요 */
  개요?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 사건명 */
  사건명?: string;
  /** 청구인 */
  청구인?: string;
  /** 대리인 */
  대리인?: string;
  /** 피청구인 */
  피청구인?: string;
  /** 이해관계인 */
  이해관계인?: string;
  /** 심사결정심사관 */
  심사결정심사관?: string;
  /** 주문 */
  주문?: string;
  /** 청구취지 */
  청구취지?: string;
  /** 이유 */
  이유?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 기관명 */
  기관명?: string;
  /** 별지 */
  별지?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
}

// ==================== FTC ====================

/** 공정거래위원회 결정문 목록 조회 API 요청 파라미터 */
export interface FtcSearchParams extends BaseSearchParams {
  target: 'ftc';
  /** 검색범위 1 : 사건명 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 사건명 오름차순 (default) ldes : 사건명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 공정거래위원회 결정문 목록 조회 API 응답 */
export interface FtcListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  ftc_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 문서유형 */
  문서유형?: string;
  /** 회의종류 */
  회의종류?: string;
  /** 결정번호 */
  결정번호?: string;
  /** 결정일자 */
  결정일자?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 공정거래위원회 결정문 본문 조회 API 응답 */
export interface FtcDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 출력 형태 : 의결서 / 시정권고서 */
  문서유형?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 사건명 */
  사건명?: string;
  /** 피심정보명 */
  피심정보명?: string;
  /** 피심정보내용 */
  피심정보내용?: string;
  /** 회의종류 */
  회의종류?: string;
  /** 결정번호 */
  결정번호?: string;
  /** 결정일자 */
  결정일자?: string;
  /** 원심결 */
  원심결?: string;
  /** 재산정심결 */
  재산정심결?: string;
  /** 후속심결 */
  후속심결?: string;
  /** 심의정보명 */
  심의정보명?: string;
  /** 심의정보내용 */
  심의정보내용?: string;
  /** 의결문 */
  의결문?: string;
  /** 주문 */
  주문?: string;
  /** 신청취지 */
  신청취지?: string;
  /** 이유 */
  이유?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 위원정보 */
  위원정보?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
  /** 별지 */
  별지?: string;
  /** 결정요지 */
  결정요지?: string;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 출력 형태 : 의결서 / 시정권고서 */
  문서유형?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 사건명 */
  사건명?: string;
  /** 피심정보명 */
  피심정보명?: string;
  /** 피심정보내용 */
  피심정보내용?: string;
  /** 의결서종류 */
  의결서종류?: string;
  /** 시정권고참조법률 */
  시정권고참조법률?: string;
  /** 시정권고사항 */
  시정권고사항?: string;
  /** 시정권고이유 */
  시정권고이유?: string;
  /** 법위반내용 */
  법위반내용?: string;
  /** 적용법조 */
  적용법조?: string;
  /** 법령의적용 */
  법령의적용?: string;
  /** 시정기한 */
  시정기한?: string;
  /** 수락여부통지기간 */
  수락여부통지기간?: string;
  /** 수락여부통지기한 */
  수락여부통지기한?: string;
  /** 수락거부시의조치 */
  수락거부시의조치?: string;
  /** 수락거부시조치방침 */
  수락거부시조치방침?: string;
  /** 별지 */
  별지?: string;
  /** 결정요지 */
  결정요지?: string;
}

// ==================== ACR ====================

/** 국민권익위원회 결정문 목록 조회 API 요청 파라미터 */
export interface AcrSearchParams extends BaseSearchParams {
  target: 'acr';
  /** 검색범위 1 : 민원표시 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 민원표시 오름차순 (default) ldes : 민원표시 내림차순 dasc : 의결일 오름차순 ddes : 의결일 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 국민권익위원회 결정문 목록 조회 API 응답 */
export interface AcrListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 기관명 */
  기관명?: string;
  /** 검색 결과 순번 */
  acr_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 제목 */
  제목?: string;
  /** 민원표시명 */
  민원표시명?: string;
  /** 의안번호 */
  의안번호?: string;
  /** 회의종류 */
  회의종류?: string;
  /** 결정구분 */
  결정구분?: string;
  /** 의결일 */
  의결일?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 국민권익위원회 결정문 본문 조회 API 응답 */
export interface AcrDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 기관명 */
  기관명?: string;
  /** 회의종류 */
  회의종류?: string;
  /** 결정구분 */
  결정구분?: string;
  /** 의안번호 */
  의안번호?: string;
  /** 민원표시 */
  민원표시?: string;
  /** 제목 */
  제목?: string;
  /** 신청인 */
  신청인?: string;
  /** 대리인 */
  대리인?: string;
  /** 피신청인 */
  피신청인?: string;
  /** 관계기관 */
  관계기관?: string;
  /** 의결일 */
  의결일?: string;
  /** 주문 */
  주문?: string;
  /** 이유 */
  이유?: string;
  /** 별지 */
  별지?: string;
  /** 의결문 */
  의결문?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 위원정보 */
  위원정보?: string;
  /** 결정요지 */
  결정요지?: string;
}

// ==================== FSC ====================

/** 금융위원회 결정문 목록 조회 API 요청 파라미터 */
export interface FscSearchParams extends BaseSearchParams {
  target: 'fsc';
  /** 검색범위 1 : 안건명 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 안건명 오름차순 (default) ldes : 안건명 내림차순 nasc : 의결번호 오름차순 ndes : 의결번호 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 금융위원회 결정문 목록 조회 API 응답 */
export interface FscListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  fsc_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 의결번호 */
  의결번호?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 금융위원회 결정문 본문 조회 API 응답 */
export interface FscDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 기관명 */
  기관명?: string;
  /** 의결번호 */
  의결번호?: string;
  /** 안건명 */
  안건명?: string;
  /** 조치대상자의 인적사항 */
  조치대상자의인적사항?: string;
  /** 조치대상 */
  조치대상?: string;
  /** 조치내용 */
  조치내용?: string;
  /** 조치이유 */
  조치이유?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
}

// ==================== NLRC ====================

/** 노동위원회 결정문 목록 조회 API 요청 파라미터 */
export interface NlrcSearchParams extends BaseSearchParams {
  target: 'nlrc';
  /** 검색범위 1 : 제목 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 제목 오름차순 (default) ldes : 제목 내림차순 dasc : 등록일 오름차순 ddes : 등록일 내림차순 nas */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 노동위원회 결정문 목록 조회 API 응답 */
export interface NlrcListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  nlrc_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 제목 */
  제목?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 등록일 */
  등록일?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 노동위원회 결정문 본문 조회 API 응답 */
export interface NlrcDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 기관명 */
  기관명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 자료구분 */
  자료구분?: string;
  /** 담당부서 */
  담당부서?: string;
  /** 등록일 */
  등록일?: string;
  /** 제목 */
  제목?: string;
  /** 내용 */
  내용?: string;
  /** 판정사항 */
  판정사항?: string;
  /** 판정요지 */
  판정요지?: string;
  /** 판정결과 */
  판정결과?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
}

// ==================== KCC ====================

/** 방송미디어통신위원회 결정문 목록 조회 API 요청 파라미터 */
export interface KccSearchParams extends BaseSearchParams {
  target: 'kcc';
  /** 검색범위 1 : 안건명 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 안건명 오름차순 (default) ldes : 안건명 내림차순 dasc : 의결연월일 오름차순 ddes : 의결연월일 내림 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 방송미디어통신위원회 결정문 목록 조회 API 응답 */
export interface KccListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  kcc_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 방송미디어통신위원회 결정문 본문 조회 API 응답 */
export interface KccDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 기관명 */
  기관명?: string;
  /** 의결서 유형 */
  의결서유형?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 안건명 */
  안건명?: string;
  /** 사건명 */
  사건명?: string;
  /** 피심인 */
  피심인?: string;
  /** 피심의인 */
  피심의인?: string;
  /** 청구인 */
  청구인?: string;
  /** 참고인 */
  참고인?: string;
  /** 원심결정 */
  원심결정?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 주문 */
  주문?: string;
  /** 이유 */
  이유?: string;
  /** 별지 */
  별지?: string;
  /** 문서제공구분(데이터 개방|이유하단 이미지개방) */
  문서제공구분?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
}

// ==================== IACIAC ====================

/** 산업재해보상보험재심사위원회 결정문 목록 조회 API 요청 파라미터 */
export interface IaciacSearchParams extends BaseSearchParams {
  target: 'iaciac';
  /** 검색범위 1 : 사건 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 사건 오름차순 (default) ldes : 사건 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 n */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 산업재해보상보험재심사위원회 결정문 목록 조회 API 응답 */
export interface IaciacListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  iaciac_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 시건 */
  사건?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 산업재해보상보험재심사위원회 결정문 본문 조회 API 응답 */
export interface IaciacDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 사건 대분류 */
  사건대분류?: string;
  /** 사건 중분류 */
  사건중분류?: string;
  /** 사건 소분류 */
  사건소분류?: string;
  /** 쟁점 */
  쟁점?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 사건 */
  사건?: string;
  /** 청구인 */
  청구인?: string;
  /** 재해근로자 */
  재해근로자?: string;
  /** 재해자 */
  재해자?: string;
  /** 피재근로자/피재자성명/피재자/피재자(망인) */
  피재근로자?: string;
  /** 진폐근로자 */
  진폐근로자?: string;
  /** 수진자 */
  수진자?: string;
  /** 원처분기관 */
  원처분기관?: string;
  /** 주문 */
  주문?: string;
  /** 청구취지 */
  청구취지?: string;
  /** 이유 */
  이유?: string;
  /** 별지 */
  별지?: string;
  /** 문서제공구분(데이터 개방|이유하단 이미지개방) */
  문서제공구분?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
}

// ==================== OCLT ====================

/** 중앙토지수용위원회 결정문 목록 조회 API 요청 파라미터 */
export interface OcltSearchParams extends BaseSearchParams {
  target: 'oclt';
  /** 검색범위 1 : 제목 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 제목 오름차순 (default) ldes : 제목 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 중앙토지수용위원회 결정문 목록 조회 API 응답 */
export interface OcltListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  oclt_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 제목 */
  제목?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 중앙토지수용위원회 결정문 본문 조회 API 응답 */
export interface OcltDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 제목 */
  제목?: string;
  /** 관련 법리 */
  관련법리?: string;
  /** 관련 규정 */
  관련규정?: string;
  /** 판단 */
  판단?: string;
  /** 근거 */
  근거?: string;
  /** 주해 */
  주해?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
}

// ==================== ECC ====================

/** 중앙환경분쟁조정위원회 결정문 목록 조회 API 요청 파라미터 */
export interface EccSearchParams extends BaseSearchParams {
  target: 'ecc';
  /** 검색범위 1 : 사건명 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 사건명 오름차순 (default) ldes : 사건명 내림차순 nasc : 의결번호 오름차순 ndes : 의결번호 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 중앙환경분쟁조정위원회 결정문 목록 조회 API 응답 */
export interface EccListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  ecc_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 의결번호 */
  의결번호?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 중앙환경분쟁조정위원회 결정문 본문 조회 API 응답 */
export interface EccDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 의결번호 */
  의결번호?: string;
  /** 사건명 */
  사건명?: string;
  /** 사건의 개요 */
  사건의개요?: string;
  /** 신청인 */
  신청인?: string;
  /** 피신청인 */
  피신청인?: string;
  /** 분쟁의 경과 */
  분쟁의경과?: string;
  /** 당사자 주장 */
  당사자주장?: string;
  /** 사실조사 결과 */
  사실조사결과?: string;
  /** 평가의견 */
  평가의견?: string;
  /** 주문 */
  주문?: string;
  /** 이유 */
  이유?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
}

// ==================== SFC ====================

/** 증권선물위원회 결정문 목록 조회 API 요청 파라미터 */
export interface SfcSearchParams extends BaseSearchParams {
  target: 'sfc';
  /** 검색범위 1 : 안건명 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 안건명 오름차순 (default) ldes : 안건명 내림차순 nasc : 의결번호 오름차순 ndes : 의결번호 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 증권선물위원회 결정문 목록 조회 API 응답 */
export interface SfcListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  sfc_id?: number;
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 의결번호 */
  의결번호?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 증권선물위원회 결정문 본문 조회 API 응답 */
export interface SfcDetail {
  /** 결정문 일련번호 */
  결정문일련번호?: number;
  /** 기관명 */
  기관명?: string;
  /** 의결번호 */
  의결번호?: string;
  /** 안건명 */
  안건명?: string;
  /** 조치대상자의 인적사항 */
  조치대상자의인적사항?: string;
  /** 조치대상 */
  조치대상?: string;
  /** 조치내용 */
  조치내용?: string;
  /** 조치이유 */
  조치이유?: string;
  /** 각주번호 */
  각주번호?: number;
  /** 각주내용 */
  각주내용?: string;
}

// ==================== NHRCK ====================

/** 국가인권위원회 결정문 목록 조회 API 요청 파라미터 */
export interface NhrckSearchParams extends BaseSearchParams {
  target: 'nhrck';
  /** 검색범위 1 : 사건명 (default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (IE 조회시 UTF-8 인코딩 필수) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 사건명 오름차순 (default) ldes : 사건명 내림차순 nasc : 의결번호 오름차순 ndes : 의결번호 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 국가인권위원회 결정문 목록 조회 API 응답 */
export interface NhrckListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 위원회명 */
  기관명?: string;
  /** 검색 결과 순번 */
  nhrck_id?: number;
  /** 결정문일련번호 */
  결정문일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 결정문 상세링크 */
  결정문상세링크?: string;
}

/** 국가인권위원회 결정문 본문 조회 API 응답 */
export interface NhrckDetail {
  /** 결정문일련번호 */
  결정문일련번호?: number;
  /** 기관명 */
  기관명?: string;
  /** 위원회명 */
  위원회명?: string;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 주문 */
  주문?: string;
  /** 이유 */
  이유?: string;
  /** 위원정보 */
  위원정보?: string;
  /** 별지 */
  별지?: string;
  /** 결정요지 */
  결정요지?: string;
  /** 판단요지 */
  판단요지?: string;
  /** 주문요지 */
  주문요지?: string;
  /** 분류명 */
  분류명?: string;
  /** 결정유형 */
  결정유형?: string;
  /** 신청인 */
  신청인?: string;
  /** 피신청인 */
  피신청인?: string;
  /** 피해자 */
  피해자?: string;
  /** 피조사자 */
  피조사자?: string;
  /** 원본다운로드URL */
  원본다운로드URL?: string;
  /** 바로보기URL */
  바로보기URL?: string;
  /** 결정례전문 */
  결정례전문?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== TRTY ====================

/** 조약 목록 조회 API 요청 파라미터 */
export interface TrtySearchParams extends BaseSearchParams {
  target: 'trty';
  /** 검색범위 (기본 : 1 조약명) 2 : 조약본문 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (검색 결과 리스트) */
  query?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 발효일자 검색(20090101~20090130) */
  eftYd?: string;
  /** 체결일자 검색(20090101~20090130) */
  concYd?: string;
  /** 1 : 양자조약 2 : 다자조약 */
  cls?: number;
  /** 국가코드 */
  natCd?: number;
  /** 정렬옵션 (기본 : lasc 조약명오름차순) ldes 조약명내림차순 dasc : 발효일자 오름차순 ddes : 발효일자 내림차순 nasc : 조 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 조약 목록 조회 API 응답 */
export interface TrtyListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(TrtyNm:조약명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  trty_id?: number;
  /** 조약일련번호 */
  조약일련번호?: number;
  /** 조약명 */
  조약명?: string;
  /** 조약구분코드 */
  조약구분코드?: string;
  /** 조약구분명 */
  조약구분명?: string;
  /** 발효일자 */
  발효일자?: string;
  /** 서명일자 */
  서명일자?: string;
  /** 관보게제일자 */
  관보게제일자?: string;
  /** 조약번호 */
  조약번호?: number;
  /** 국가번호 */
  국가번호?: number;
  /** 조약상세링크 */
  조약상세링크?: string;
}

/** 조약 본문 조회 API 응답 */
export interface TrtyDetail {
  /** 조약일련번호 */
  조약일련번호?: number;
  /** 조약명한글 */
  조약명_한글?: string;
  /** 조약명영문 */
  조약명_영문?: string;
  /** 조약구분코드(양자조약:440101, 다자조약:440102) */
  조약구분코드?: number;
  /** 대통령재가일자 */
  대통령재가일자?: number;
  /** 발효일자 */
  발효일자?: number;
  /** 조약번호 */
  조약번호?: number;
  /** 관보게재일자 */
  관보게재일자?: number;
  /** 국무회의심의일자 */
  국무회의심의일자?: number;
  /** 국무회의심의회차 */
  국무회의심의회차?: number;
  /** 국회비준동의여부 */
  국회비준동의여부?: string;
  /** 국회비준동의일자 */
  국회비준동의일자?: string;
  /** 서명일자 */
  서명일자?: number;
  /** 서명장소 */
  서명장소?: string;
  /** 비고 */
  비고?: string;
  /** 추가정보 */
  추가정보?: string;
  /** 체결대상국가 */
  체결대상국가?: string;
  /** 체결대상국가한글 */
  체결대상국가한글?: string;
  /** 우리측국내절차완료통보일 */
  우리측국내절차완료통보?: number;
  /** 상대국측국내절차완료통보일 */
  상대국측국내절차완료통보?: number;
  /** 양자조약분야코드 */
  양자조약분야코드?: number;
  /** 양자조약분야명 */
  양자조약분야명?: string;
  /** 제2외국어종류 */
  제2외국어종류?: string;
  /** 국가코드 */
  국가코드?: string;
  /** 조약내용 */
  조약내용?: string;
  /** 체결일자 */
  체결일자?: string;
  /** 체결장소 */
  체결장소?: string;
  /** 기탁처 */
  기탁처?: string;
  /** 다자조약분야코드 */
  다자조약분야코드?: string;
  /** 다자조약분야명 */
  다자조약분야명?: string;
  /** 수락서기탁일자 */
  수락서기탁일자?: string;
  /** 국내발효일자 */
  국내발효일자?: string;
}

// ==================== LICBYL ====================

/** 별표서식 목록 조회 API 요청 파라미터 */
export interface LicbylSearchParams extends BaseSearchParams {
  target: 'licbyl';
  /** 검색범위 (기본 : 1 별표서식명) 2 : 해당법령검색 3 : 별표본문검색 */
  search?: number;
  /** 검색을 원하는 질의(default=*) (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 정렬옵션 (기본 : lasc 별표서식명 오름차순), ldes(별표서식명 내림차순) */
  sort?: string;
  /** 소관부처별 검색(소관부처코드 제공) 소관부처 2개이상 검색 가능(","로 구분) */
  org?: string;
  /** 소관부처 2개이상 검색 조건 OR : OR검색 (default) AND : AND검색 */
  mulOrg?: string;
  /** 별표종류 1 : 별표 2 : 서식 3 : 별지 4 : 별도 5 : 부록 */
  knd?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 별표서식 목록 조회 API 응답 */
export interface LicbylListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과번호 */
  licbyl_id?: number;
  /** 별표일련번호 */
  별표일련번호?: number;
  /** 관련법령일련번호 */
  관련법령일련번호?: number;
  /** 관련법령ID */
  관련법령ID?: number;
  /** 별표명ID */
  별표명?: string;
  /** 관련법령명 */
  관련법령명?: string;
  /** 별표번호 */
  별표번호?: number;
  /** 별표종류 */
  별표종류?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 법령종류 */
  법령종류?: string;
  /** 별표서식파일링크 */
  별표서식파일링크?: string;
  /** 별표서식PDF파일링크 */
  별표서식PDF파일링크?: string;
  /** 별표법령상세링크 */
  별표법령상세링크?: string;
}

// ==================== ADMBYL ====================

/** 별표서식 목록 조회 API 요청 파라미터 */
export interface AdmbylSearchParams extends BaseSearchParams {
  target: 'admbyl';
  /** 검색범위 (기본 : 1 별표서식명) 2 : 해당법령검색 3 : 별표본문검색 */
  search?: number;
  /** 법령명에서 검색을 원하는 질의(default=*) (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 정렬옵션 (기본 : lasc 별표서식명 오름차순) ldes 별표서식명 내림차순 */
  sort?: string;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 별표종류 1 : 별표 2 : 서식 3 : 별지 */
  knd?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 별표서식 목록 조회 API 응답 */
export interface AdmbylListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과번호 */
  admrulbyl_id?: number;
  /** 별표일련번호 */
  별표일련번호?: number;
  /** 관련행정규칙일련번호 */
  관련행정규칙일련번호?: number;
  /** 별표명ID */
  별표명?: string;
  /** 관련행정규칙명 */
  관련행정규칙명?: string;
  /** 별표번호 */
  별표번호?: number;
  /** 별표종류 */
  별표종류?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 발령일자 */
  발령일자?: number;
  /** 발령번호 */
  발령번호?: number;
  /** 관련법령ID */
  관련법령ID?: number;
  /** 행정규칙종류 */
  행정규칙종류?: string;
  /** 별표서식파일링크 */
  별표서식파일링크?: string;
  /** 별표행정규칙상세링크 */
  별표행정규칙상세링크?: string;
}

// ==================== ORDINBYL ====================

/** 별표서식 목록 조회 API 요청 파라미터 */
export interface OrdinbylSearchParams extends BaseSearchParams {
  target: 'ordinbyl';
  /** 검색범위(기본 : 1 별표서식명) 2 : 해당자치법규명검색 3 : 별표본문검색 */
  search?: number;
  /** 법령명에서 검색을 원하는 질의(default=*) (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 정렬옵션 (기본 : lasc 별표서식명 오름차순) ldes 별표서식명 내림차순 */
  sort?: string;
  /** 소관부처별 검색(소관부처코드 제공) */
  org?: string;
  /** 지자체별 시·군·구 검색(지자체코드 제공) (필수값 : org, ex.서울특별시 구로구에 대한 검색-> org=6110000&sborg=3160 */
  sborg?: string;
  /** 별표종류 1 : 별표 2 : 서식 3 : 별도 4 : 별지 */
  knd?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 별표서식 목록 조회 API 응답 */
export interface OrdinbylListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 검색 결과 순번 */
  ordinbyl_id?: number;
  /** 별표일련번호 */
  별표일련번호?: string;
  /** 관련자치법규일련번호 */
  관련자치법규일련번호?: string;
  /** 별표명 */
  별표명?: string;
  /** 관련자치법규명 */
  관련자치법규명?: string;
  /** 별표번호 */
  별표번호?: string;
  /** 별표종류 */
  별표종류?: string;
  /** 지자체기관명 */
  지자체기관명?: string;
  /** 전체기관명 */
  전체기관명?: string;
  /** 자치법규시행일자 */
  자치법규시행일자?: string;
  /** 공포일자 */
  공포일자?: string;
  /** 공포번호 */
  공포번호?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 별표서식파일링크 */
  별표서식파일링크?: string;
  /** 별표자치법규상세링크 */
  별표자치법규상세링크?: string;
}

// ==================== SCHOOL ====================

/** 학칙공단공공기관 목록 조회 API 요청 파라미터 */
export interface SchoolSearchParams extends BaseSearchParams {
  target: 'school';
  /** (1: 현행, 2: 연혁, 기본값: 현행) */
  nw?: number;
  /** 검색범위 1 : 규정명(default) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 학칙공단 종류별 검색 1 : 학칙 / 2 : 학교규정 / 3 : 학교지침 / 4 : 학교시행세칙 / 5 : 공단규정, 공공기관규정 */
  knd?: string;
  /** 제정·개정 구분 200401 : 제정 / 200402 : 전부개정 / 200403 : 일부개정 / 200404 : 폐지 200405 : 일괄개정 */
  rrClsCd?: string;
  /** 발령일자 검색 */
  date?: number;
  /** 발령일자 범위 검색 */
  prmlYd?: string;
  /** 발령번호 검색 */
  nb?: number;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 정렬옵션 lasc : 학칙공단명 오름차순(default) ldes : 학칙공단명 내림차순 dasc : 발령일자 오름차순 ddes : 발령일자 내 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 학칙공단공공기관 목록 조회 API 응답 */
export interface SchoolListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색 건수 */
  totalCnt?: number;
  /** 현재 페이지번호 */
  page?: number;
  /** 페이지 당 출력 결과 수 */
  numOfRows?: number;
  /** 조회 여부(성공 : 00 / 실패 : 01) */
  resultCode?: number;
  /** 조회 여부(성공 : success / 실패 : fail) */
  resultMsg?: number;
  /** 검색 결과 순번 */
  admrul_id?: number;
  /** 학칙공단 일련번호 */
  행정규칙일련번호?: number;
  /** 학칙공단명 */
  행정규칙명?: string;
  /** 학칙공단 종류 */
  행정규칙종류?: string;
  /** 발령일자 */
  발령일자?: number;
  /** 발령번호 */
  발령번호?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 현행연혁구분 */
  현행연혁구분?: string;
  /** 제개정구분코드 */
  제개정구분코드?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 법령분류코드 */
  법령분류코드?: string;
  /** 법령분류명 */
  법령분류명?: string;
  /** 학칙공단ID */
  행정규칙ID?: number;
  /** 학칙공단 상세링크 */
  행정규칙상세링크?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 생성일자 */
  생성일자?: number;
}

/** 학칙공단공공기관 본문 조회 API 응답 */
export interface SchoolDetail {
  /** 학칙공단 일련번호 */
  행정규칙일련번호?: number;
  /** 학칙공단명 */
  행정규칙명?: string;
  /** 학칙공단 종류 */
  행정규칙종류?: string;
  /** 학칙공단 종류코드 */
  행정규칙종류코드?: string;
  /** 발령일자 */
  발령일자?: number;
  /** 발령번호 */
  발령번호?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 제개정구분코드 */
  제개정구분코드?: string;
  /** 조문형식여부 */
  조문형식여부?: string;
  /** 학칙공단ID */
  행정규칙ID?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 소관부처코드 */
  소관부처코드?: string;
  /** 담당부서기관코드 */
  담당부서기관코드?: string;
  /** 담당부서기관명 */
  담당부서기관명?: string;
  /** 담당자명 */
  담당자명?: string;
  /** 전화번호 */
  전화번호?: string;
  /** 현행여부 */
  현행여부?: string;
  /** 생성일자 */
  생성일자?: string;
  /** 조문내용 */
  조문내용?: string;
  /** 부칙 공포일자 */
  부칙공포일자?: string;
  /** 부칙 공포번호 */
  부칙공포번호?: string;
  /** 부칙내용 */
  부칙내용?: string;
  /** 별표단위 별표키 */
  별표단위_별표키?: string;
  /** 별표번호 */
  별표번호?: string;
  /** 별표가지번호 */
  별표가지번호?: string;
  /** 별표구분 */
  별표구분?: string;
  /** 별표제목 */
  별표제목?: string;
  /** 별표서식 파일링크 */
  별표서식파일링크?: string;
  /** 개정문내용 */
  개정문내용?: string;
  /** 제개정이유내용 */
  제개정이유내용?: string;
}

// ==================== LSTRM ====================

/** 법령용어 목록 조회 가이드API 요청 파라미터 */
export interface LstrmSearchParams extends BaseSearchParams {
  target: 'lstrm';
  /** 법령용어명에서 검색을 원하는 질의 */
  query?: string;
  /** 정렬옵션(기본 : lasc 법령용어명 오름차순) ldes : 법령용어명 내림차순 rasc : 등록일자 오름차순 rdes : 등록일자 내림차순 */
  sort?: string;
  /** 등록일자 범위 검색(20090101~20090130) */
  regDt?: string;
  /** 사전식 검색 (ga,na,da…,etc) */
  gana?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 법령 종류 코드 (법령 : 010101, 행정규칙 : 010102) */
  dicKndCd?: number;
}

/** 법령용어 목록 조회 가이드API 응답 */
export interface LstrmListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색어 */
  키워드?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  lstrm_id?: number;
  /** 법령용어ID */
  법령용어ID?: string;
  /** 법령용어명 */
  법령용어명?: string;
  /** 법령용어상세검색 */
  법령용어상세검색?: string;
  /** 사전구분코드 (법령용어사전 : 011401, 법령정의사전 : 011402, 법령한영사전 : 011403) */
  사전구분코드?: string;
  /** 법령용어상세링크 */
  법령용어상세링크?: string;
  /** 법령 종류 코드(법령 : 010101, 행정규칙 : 010102) */
  법령종류코드?: number;
}

/** 법령용어 본문 조회 가이드API 응답 */
export interface LstrmDetail {
  /** 법령용어 일련번호 */
  법령용어_일련번호?: number;
  /** 법령용어명 한글 */
  법령용어명_한글?: string;
  /** 법령용어명한자 */
  법령용어명_한자?: string;
  /** 법령용어코드 */
  법령용어코드?: number;
  /** 법령용어코드명 */
  법령용어코드명?: string;
  /** 출처 */
  출처?: string;
  /** 법령용어정의 */
  법령용어정의?: string;
}

// ==================== COUSELS ====================

/** 맞춤형 법령 목록 조회 API 요청 파라미터 */
export interface CouseLsSearchParams extends BaseSearchParams {
  target: 'couseLs';
  /** 분류코드 법령은 L로 시작하는 14자리 코드(L0000000000001) */
  vcode: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 맞춤형 법령 목록 조회 API 응답 */
export interface CouseLsListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 분류코드 */
  vcode?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  law_id?: number;
  /** 법령일련번호 */
  법령일련번호?: number;
  /** 법령명한글 */
  법령명한글?: string;
  /** 법령ID */
  법령ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 소관부처코드 */
  소관부처코드?: string;
  /** 법령구분명 */
  법령구분명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 법령상세링크 */
  법령상세링크?: string;
}

// ==================== COUSEADMRUL ====================

/** 맞춤형 행정규칙 목록 조회 API 요청 파라미터 */
export interface CouseAdmrulSearchParams extends BaseSearchParams {
  target: 'couseAdmrul';
  /** 분류코드 행정규칙은 A로 시작하는 14자리 코드(A0000000000001) */
  vcode: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 맞춤형 행정규칙 목록 조회 API 응답 */
export interface CouseAdmrulListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 분류코드 */
  vcode?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 검색 결과 순번 */
  admrul_id?: number;
  /** 행정규칙일련번호 */
  행정규칙일련번호?: number;
  /** 행정규칙명 */
  행정규칙명?: string;
  /** 행정규칙ID */
  행정규칙ID?: number;
  /** 발령일자 */
  발령일자?: number;
  /** 발령번호 */
  발령번호?: number;
  /** 행정규칙구분명 */
  행정규칙구분명?: string;
  /** 소관부처코드 */
  소관부처코드?: number;
  /** 소관부처명 */
  소관부처명?: string;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 행정규칙상세링크 */
  행정규칙상세링크?: string;
}

// ==================== COUSEORDIN ====================

/** 맞춤형 자치법규 목록 조회 API 요청 파라미터 */
export interface CouseOrdinSearchParams extends BaseSearchParams {
  target: 'couseOrdin';
  /** 분류코드 자치법규는 O로 시작하는 14자리 코드(O0000000000001) */
  vcode: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
}

/** 맞춤형 자치법규 목록 조회 API 응답 */
export interface CouseOrdinListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 분류코드 */
  vcode?: string;
  /** 검색범위 */
  section?: string;
  /** 검색건수 */
  totalCnt?: number;
  /** 결과페이지번호 */
  page?: number;
  /** 결과 번호 */
  ordin_id?: number;
  /** 자치법규일련번호 */
  자치법규일련번호?: number;
  /** 자치법규명 */
  자치법규명?: string;
  /** 자치법규ID */
  자치법규ID?: number;
  /** 공포일자 */
  공포일자?: number;
  /** 공포번호 */
  공포번호?: number;
  /** 제개정구분명 */
  제개정구분명?: string;
  /** 자치법규종류 */
  자치법규종류?: string;
  /** 지자체기관명 */
  지자체기관명?: string;
  /** 시행일자 */
  시행일자?: number;
  /** 자치법규분야명 */
  자치법규분야명?: string;
  /** 자치법규상세링크 */
  자치법규상세링크?: string;
}

// ==================== AISEARCH ====================

/** 법령정보지식베이스 지능형 법령검색 시스템 검색 API 요청 파라미터 */
export interface AiSearchSearchParams extends BaseSearchParams {
  target: 'aiSearch';
  /** 검색범위 법령분류 (0:법령조문, 1:법령 별표·서식, 2:행정규칙 조문, 3:행정규칙 별표·서식) */
  search?: number;
  /** 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="뺑소니") */
  query?: string;
}

/** 법령정보지식베이스 지능형 법령검색 시스템 검색 API 응답 */
export interface AiSearchListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색 건수 */
  검색결과개수?: number;
  /** 법령조문 ID */
  법령조문ID?: number;
  /** 법령ID */
  법령ID?: string;
  /** 법령일련번호 */
  법령일련번호?: string;
  /** 법령명 */
  법령명?: string;
  /** 법령 시행일자 */
  시행일자?: string;
  /** 법령 공포일자 */
  공포일자?: string;
  /** 법령 공포번호 */
  공포번호?: string;
  /** 소관부처코드 */
  소관부처코드?: string;
  /** 소관부처명 */
  소관부처명?: string;
  /** 법령종류명 */
  법령종류명?: string;
  /** 법령 제개정구분명 */
  제개정구분명?: string;
  /** 법령편장절관코드 */
  법령편장절관코드?: string;
  /** 법령 조문일련번호 */
  조문일련번호?: string;
  /** 법령 조문번호 */
  조문번호?: string;
  /** 법령 조문가지번호 */
  조문가지번호?: string;
  /** 법령 조문제목 */
  조문제목?: string;
  /** 법령 조문내용 */
  조문내용?: string;
  /** 법령별표서식 ID */
  법령별표서식ID?: number;
  /** 법령 별표서식일련번호 */
  별표서식일련번호?: string;
  /** 법령 별표서식번호 */
  별표서식번호?: string;
  /** 법령 별표서식가지번호 */
  별표서식가지번호?: string;
  /** 법령 별표서식제목 */
  별표서식제목?: string;
  /** 법령 별표서식구분코드 */
  별표서식구분코드?: string;
  /** 법령 별표서식구분명 */
  별표서식구분명?: string;
  /** 행정규칙조문 ID */
  행정규칙조문ID?: number;
  /** 행정규칙일련번호 */
  행정규칙일련번호?: string;
  /** 행정규칙ID */
  행정규칙ID?: string;
  /** 행정규칙명 */
  행정규칙명?: string;
  /** 발령일자 */
  발령일자?: string;
  /** 발령번호 */
  발령번호?: string;
  /** 시행일자 */
  시행일자?: string;
  /** 발령기관명 */
  발령기관명?: string;
  /** 행정규칙종류명 */
  행정규칙종류명?: string;
  /** 행정규칙 제개정구분명 */
  제개정구분명?: string;
  /** 행정규칙 조문일련번호 */
  조문일련번호?: string;
  /** 행정규칙 조문번호 */
  조문번호?: string;
  /** 행정규칙 조문가지번호 */
  조문가지번호?: string;
  /** 행정규칙 조문제목 */
  조문제목?: string;
  /** 행정규칙 조문내용 */
  조문내용?: string;
  /** 행정규칙별표서식 ID */
  행정규칙별표서식ID?: number;
  /** 행정규칙 별표서식일련번호 */
  별표서식일련번호?: string;
  /** 행정규칙 별표서식번호 */
  별표서식번호?: string;
  /** 행정규칙 별표서식가지번호 */
  별표서식가지번호?: string;
  /** 행정규칙 별표서식제목 */
  별표서식제목?: string;
  /** 행정규칙 별표서식구분코드 */
  별표서식구분코드?: string;
  /** 행정규칙 별표서식구분명 */
  별표서식구분명?: string;
}

// ==================== AIRLTLS ====================

/** 법령정보지식베이스 지능형 법령검색 시스템 연관법령 API 요청 파라미터 */
export interface AiRltLsSearchParams extends BaseSearchParams {
  target: 'aiRltLs';
  /** 검색범위 법령분류(0:법령조문, 1:행정규칙조문) */
  search?: number;
  /** 법령명에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="뺑소니") */
  query?: string;
}

/** 법령정보지식베이스 지능형 법령검색 시스템 연관법령 API 응답 */
export interface AiRltLsListItem {
  /** 검색서비스 대상 */
  target?: string;
  /** 검색 단어 */
  키워드?: string;
  /** 검색 건수 */
  검색결과개수?: number;
  /** 법령조문 ID */
  법령조문ID?: number;
  /** 법령ID */
  법령ID?: string;
  /** 법령명 */
  법령명?: string;
  /** 법령 시행일자 */
  시행일자?: string;
  /** 법령 공포일자 */
  공포일자?: string;
  /** 법령 공포번호 */
  공포번호?: string;
  /** 법령 조문번호 */
  조문번호?: string;
  /** 법령 조문가지번호 */
  조문가지번호?: string;
  /** 법령 조문제목 */
  조문제목?: string;
  /** 행정규칙조문 ID */
  행정규칙조문ID?: number;
  /** 행정규칙ID */
  행정규칙ID?: string;
  /** 행정규칙명 */
  행정규칙명?: string;
  /** 발령일자 */
  발령일자?: string;
  /** 발령번호 */
  발령번호?: string;
  /** 행정규칙 조문번호 */
  조문번호?: string;
  /** 행정규칙 조문가지번호 */
  조문가지번호?: string;
  /** 행정규칙 조문제목 */
  조문제목?: string;
}

// ==================== MOELCGMEXPC ====================

/** 고용노동부 법령해석 목록 조회 API 요청 파라미터 */
export interface MoelCgmExpcSearchParams extends BaseSearchParams {
  target: 'moelCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="퇴직") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 고용노동부 법령해석 본문 조회 API 응답 */
export interface MoelCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOLITCGMEXPC ====================

/** 국토교통부 법령해석 목록 조회 API 요청 파라미터 */
export interface MolitCgmExpcSearchParams extends BaseSearchParams {
  target: 'molitCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="도로") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 국토교통부 법령해석 본문 조회 API 응답 */
export interface MolitCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 대분류 */
  대분류?: string;
  /** 중분류 */
  중분류?: string;
  /** 소분류 */
  소분류?: string;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOEFCGMEXPC ====================

/** 기획재정부 법령해석 목록 조회 API 요청 파라미터 */
export interface MoefCgmExpcSearchParams extends BaseSearchParams {
  target: 'moefCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="조합") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

// ==================== MOFCGMEXPC ====================

/** 해양수산부 법령해석 목록 조회 API 요청 파라미터 */
export interface MofCgmExpcSearchParams extends BaseSearchParams {
  target: 'mofCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 해양수산부 법령해석 목록 조회 API 응답 */
export interface MofCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 해양수산부 법령해석 본문 조회 API 응답 */
export interface MofCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOISCGMEXPC ====================

/** 행정안전부 법령해석 목록 조회 API 요청 파라미터 */
export interface MoisCgmExpcSearchParams extends BaseSearchParams {
  target: 'moisCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="재해") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 행정안전부 법령해석 본문 조회 API 응답 */
export interface MoisCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MECGMEXPC ====================

/** 기후에너지환경부 법령해석 목록 조회 API 요청 파라미터 */
export interface MeCgmExpcSearchParams extends BaseSearchParams {
  target: 'meCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 기후에너지환경부 법령해석 목록 조회 API 응답 */
export interface MeCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 기후에너지환경부 법령해석 본문 조회 API 응답 */
export interface MeCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KCSCGMEXPC ====================

/** 관세청 법령해석 목록 조회 API 요청 파라미터 */
export interface KcsCgmExpcSearchParams extends BaseSearchParams {
  target: 'kcsCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="거래명세서") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 관세청 법령해석 본문 조회 API 응답 */
export interface KcsCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 업무분야 */
  업무분야?: string;
  /** 안건명 */
  안건명?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 관세법령정보포털원문링크 */
  관세법령정보포털원문링크?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== NTSCGMEXPC ====================

/** 국세청 법령해석 목록 조회 API 요청 파라미터 */
export interface NtsCgmExpcSearchParams extends BaseSearchParams {
  target: 'ntsCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="세금") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

// ==================== MOECGMEXPC ====================

/** 교육부 법령해석 목록 조회 API 요청 파라미터 */
export interface MoeCgmExpcSearchParams extends BaseSearchParams {
  target: 'moeCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="수능") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 교육부 법령해석 목록 조회 API 응답 */
export interface MoeCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 교육부 법령해석 본문 조회 API 응답 */
export interface MoeCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MSITCGMEXPC ====================

/** 과학기술정보통신부 법령해석 목록 조회 API 요청 파라미터 */
export interface MsitCgmExpcSearchParams extends BaseSearchParams {
  target: 'msitCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="연구실") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 과학기술정보통신부 법령해석 목록 조회 API 응답 */
export interface MsitCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 과학기술정보통신부 법령해석 본문 조회 API 응답 */
export interface MsitCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MPVACGMEXPC ====================

/** 국가보훈부 법령해석 목록 조회 API 요청 파라미터 */
export interface MpvaCgmExpcSearchParams extends BaseSearchParams {
  target: 'mpvaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="독립유공자") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 국가보훈부 법령해석 목록 조회 API 응답 */
export interface MpvaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 국가보훈부 법령해석 본문 조회 API 응답 */
export interface MpvaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MNDCGMEXPC ====================

/** 국방부 법령해석 목록 조회 API 요청 파라미터 */
export interface MndCgmExpcSearchParams extends BaseSearchParams {
  target: 'mndCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="군종") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 국방부 법령해석 목록 조회 API 응답 */
export interface MndCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 국방부 법령해석 본문 조회 API 응답 */
export interface MndCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MAFRACGMEXPC ====================

/** 농림축산식품부 법령해석 목록 조회 API 요청 파라미터 */
export interface MafraCgmExpcSearchParams extends BaseSearchParams {
  target: 'mafraCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="농지법") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 농림축산식품부 법령해석 목록 조회 API 응답 */
export interface MafraCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 농림축산식품부 법령해석 본문 조회 API 응답 */
export interface MafraCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MCSTCGMEXPC ====================

/** 문화체육관광부 법령해석 목록 조회 API 요청 파라미터 */
export interface McstCgmExpcSearchParams extends BaseSearchParams {
  target: 'mcstCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="체육") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 문화체육관광부 법령해석 목록 조회 API 응답 */
export interface McstCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 문화체육관광부 법령해석 본문 조회 API 응답 */
export interface McstCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOJCGMEXPC ====================

/** 법무부 법령해석 목록 조회 API 요청 파라미터 */
export interface MojCgmExpcSearchParams extends BaseSearchParams {
  target: 'mojCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="과태료") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 법무부 법령해석 목록 조회 API 응답 */
export interface MojCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 법무부 법령해석 본문 조회 API 응답 */
export interface MojCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOHWCGMEXPC ====================

/** 보건복지부 법령해석 목록 조회 API 요청 파라미터 */
export interface MohwCgmExpcSearchParams extends BaseSearchParams {
  target: 'mohwCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="일반음식점") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 보건복지부 법령해석 목록 조회 API 응답 */
export interface MohwCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 보건복지부 법령해석 본문 조회 API 응답 */
export interface MohwCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOTIECGMEXPC ====================

/** 산업통상부 법령해석 목록 조회 API 요청 파라미터 */
export interface MotieCgmExpcSearchParams extends BaseSearchParams {
  target: 'motieCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="공장") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 산업통상부 법령해석 목록 조회 API 응답 */
export interface MotieCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 산업통상부 법령해석 본문 조회 API 응답 */
export interface MotieCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOGEFCGMEXPC ====================

/** 성평등가족부 법령해석 목록 조회 API 요청 파라미터 */
export interface MogefCgmExpcSearchParams extends BaseSearchParams {
  target: 'mogefCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="청소년") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 성평등가족부 법령해석 목록 조회 API 응답 */
export interface MogefCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 성평등가족부 법령해석 본문 조회 API 응답 */
export interface MogefCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOFACGMEXPC ====================

/** 외교부 법령해석 목록 조회 API 요청 파라미터 */
export interface MofaCgmExpcSearchParams extends BaseSearchParams {
  target: 'mofaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 외교부 법령해석 목록 조회 API 응답 */
export interface MofaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 외교부 법령해석 본문 조회 API 응답 */
export interface MofaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MSSCGMEXPC ====================

/** 중소벤처기업부 법령해석 목록 조회 API 요청 파라미터 */
export interface MssCgmExpcSearchParams extends BaseSearchParams {
  target: 'mssCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="학원") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 중소벤처기업부 법령해석 목록 조회 API 응답 */
export interface MssCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 중소벤처기업부 법령해석 본문 조회 API 응답 */
export interface MssCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOUCGMEXPC ====================

/** 통일부 법령해석 목록 조회 API 요청 파라미터 */
export interface MouCgmExpcSearchParams extends BaseSearchParams {
  target: 'mouCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="북한") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 통일부 법령해석 목록 조회 API 응답 */
export interface MouCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 통일부 법령해석 본문 조회 API 응답 */
export interface MouCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MOLEGCGMEXPC ====================

/** 법제처 법령해석 목록 조회 API 요청 파라미터 */
export interface MolegCgmExpcSearchParams extends BaseSearchParams {
  target: 'molegCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="법령") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 법제처 법령해석 목록 조회 API 응답 */
export interface MolegCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 법제처 법령해석 본문 조회 API 응답 */
export interface MolegCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MFDSCGMEXPC ====================

/** 식품의약품안전처 법령해석 목록 조회 API 요청 파라미터 */
export interface MfdsCgmExpcSearchParams extends BaseSearchParams {
  target: 'mfdsCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="위해") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 식품의약품안전처 법령해석 목록 조회 API 응답 */
export interface MfdsCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 식품의약품안전처 법령해석 본문 조회 API 응답 */
export interface MfdsCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MPMCGMEXPC ====================

/** 인사혁신처 법령해석 목록 조회 API 요청 파라미터 */
export interface MpmCgmExpcSearchParams extends BaseSearchParams {
  target: 'mpmCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="징계위원회") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 인사혁신처 법령해석 목록 조회 API 응답 */
export interface MpmCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 인사혁신처 법령해석 본문 조회 API 응답 */
export interface MpmCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KMACGMEXPC ====================

/** 기상청 법령해석 목록 조회 API 요청 파라미터 */
export interface KmaCgmExpcSearchParams extends BaseSearchParams {
  target: 'kmaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="태풍") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 기상청 법령해석 목록 조회 API 응답 */
export interface KmaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 기상청 법령해석 본문 조회 API 응답 */
export interface KmaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KHSCGMEXPC ====================

/** 국가유산청 법령해석 목록 조회 API 요청 파라미터 */
export interface KhsCgmExpcSearchParams extends BaseSearchParams {
  target: 'khsCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="연말") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 국가유산청 법령해석 목록 조회 API 응답 */
export interface KhsCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 국가유산청 법령해석 본문 조회 API 응답 */
export interface KhsCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== RDACGMEXPC ====================

/** 농촌진흥청 법령해석 목록 조회 API 요청 파라미터 */
export interface RdaCgmExpcSearchParams extends BaseSearchParams {
  target: 'rdaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 농촌진흥청 법령해석 목록 조회 API 응답 */
export interface RdaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 농촌진흥청 법령해석 본문 조회 API 응답 */
export interface RdaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== NPACGMEXPC ====================

/** 경찰청 법령해석 목록 조회 API 요청 파라미터 */
export interface NpaCgmExpcSearchParams extends BaseSearchParams {
  target: 'npaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="폐기물") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 경찰청 법령해석 목록 조회 API 응답 */
export interface NpaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 경찰청 법령해석 본문 조회 API 응답 */
export interface NpaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== DAPACGMEXPC ====================

/** 방위사업청 법령해석 목록 조회 API 요청 파라미터 */
export interface DapaCgmExpcSearchParams extends BaseSearchParams {
  target: 'dapaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="제조") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 방위사업청 법령해석 목록 조회 API 응답 */
export interface DapaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 방위사업청 법령해석 본문 조회 API 응답 */
export interface DapaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== MMACGMEXPC ====================

/** 병무청 법령해석 목록 조회 API 요청 파라미터 */
export interface MmaCgmExpcSearchParams extends BaseSearchParams {
  target: 'mmaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="학력") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 병무청 법령해석 목록 조회 API 응답 */
export interface MmaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 병무청 법령해석 본문 조회 API 응답 */
export interface MmaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KFSCGMEXPC ====================

/** 산림청 법령해석 목록 조회 API 요청 파라미터 */
export interface KfsCgmExpcSearchParams extends BaseSearchParams {
  target: 'kfsCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="벌채") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 산림청 법령해석 목록 조회 API 응답 */
export interface KfsCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 산림청 법령해석 본문 조회 API 응답 */
export interface KfsCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== NFACGMEXPC ====================

/** 소방청 법령해석 목록 조회 API 요청 파라미터 */
export interface NfaCgmExpcSearchParams extends BaseSearchParams {
  target: 'nfaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="공공기관") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 소방청 법령해석 목록 조회 API 응답 */
export interface NfaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 소방청 법령해석 본문 조회 API 응답 */
export interface NfaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== OKACGMEXPC ====================

/** 재외동포청 법령해석 목록 조회 API 요청 파라미터 */
export interface OkaCgmExpcSearchParams extends BaseSearchParams {
  target: 'okaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="귀환") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 재외동포청 법령해석 목록 조회 API 응답 */
export interface OkaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 재외동포청 법령해석 본문 조회 API 응답 */
export interface OkaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== PPSCGMEXPC ====================

/** 조달청 법령해석 목록 조회 API 요청 파라미터 */
export interface PpsCgmExpcSearchParams extends BaseSearchParams {
  target: 'ppsCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="상금") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 조달청 법령해석 목록 조회 API 응답 */
export interface PpsCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 조달청 법령해석 본문 조회 API 응답 */
export interface PpsCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KDCACGMEXPC ====================

/** 질병관리청 법령해석 목록 조회 API 요청 파라미터 */
export interface KdcaCgmExpcSearchParams extends BaseSearchParams {
  target: 'kdcaCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="임상시험") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 질병관리청 법령해석 목록 조회 API 응답 */
export interface KdcaCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 질병관리청 법령해석 본문 조회 API 응답 */
export interface KdcaCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KOSTATCGMEXPC ====================

/** 국가데이터처 법령해석 목록 조회 API 요청 파라미터 */
export interface KostatCgmExpcSearchParams extends BaseSearchParams {
  target: 'kostatCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="산업집적법") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 국가데이터처 법령해석 목록 조회 API 응답 */
export interface KostatCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 국가데이터처 법령해석 본문 조회 API 응답 */
export interface KostatCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KIPOCGMEXPC ====================

/** 지식재산처 법령해석 목록 조회 API 요청 파라미터 */
export interface KipoCgmExpcSearchParams extends BaseSearchParams {
  target: 'kipoCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="상표") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 지식재산처 법령해석 목록 조회 API 응답 */
export interface KipoCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 지식재산처 법령해석 본문 조회 API 응답 */
export interface KipoCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KCGCGMEXPC ====================

/** 해양경찰청 법령해석 목록 조회 API 요청 파라미터 */
export interface KcgCgmExpcSearchParams extends BaseSearchParams {
  target: 'kcgCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="유조선") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 해양경찰청 법령해석 목록 조회 API 응답 */
export interface KcgCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 해양경찰청 법령해석 본문 조회 API 응답 */
export interface KcgCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== NAACCCGMEXPC ====================

/** 행정중심복합도시건설청 법령해석 목록 조회 API 요청 파라미터 */
export interface NaaccCgmExpcSearchParams extends BaseSearchParams {
  target: 'naaccCgmExpc';
  /** 검색범위 (기본 : 1 법령해석명, 2: 본문검색) */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="행복") */
  query?: string;
  /** 질의기관코드 */
  inq?: number;
  /** 해석기관코드 */
  rpl?: number;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 안건번호 * 안건번호 변수 적용 시 query 요청변수는 무시됩니다. */
  itmno?: number;
  /** 해석일자 검색(20090101~20090130) */
  explYd?: string;
  /** 정렬옵션 (기본 : lasc 법령해석명 오름차순) ldes 법령해석명 내림차순 dasc : 해석일자 오름차순 ddes : 해석일자 내림차순 na */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(안건명, 안건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 행정중심복합도시건설청 법령해석 목록 조회 API 응답 */
export interface NaaccCgmExpcListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(lawNm:법령해석명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  id?: number;
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 해석기관코드 */
  해석기관코드?: string;
  /** 해석기관명 */
  해석기관명?: string;
  /** 해석일자 */
  해석일자?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 법령해석상세링크 */
  법령해석상세링크?: string;
}

/** 행정중심복합도시건설청 법령해석 본문 조회 API 응답 */
export interface NaaccCgmExpcDetail {
  /** 법령해석일련번호 */
  법령해석일련번호?: number;
  /** 안건명 */
  안건명?: string;
  /** 안건번호 */
  안건번호?: string;
  /** 해석일자 */
  해석일자?: number;
  /** 해석기관코드 */
  해석기관코드?: number;
  /** 해석기관명 */
  해석기관명?: string;
  /** 질의기관코드 */
  질의기관코드?: number;
  /** 질의기관명 */
  질의기관명?: string;
  /** 관리기관코드 */
  관리기관코드?: number;
  /** 등록일시 */
  등록일시?: number;
  /** 질의요지 */
  질의요지?: string;
  /** 회답 */
  회답?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== TTSPECIALDECC ====================

/** 조세심판원 특별행정심판재결례 목록 조회 API 요청 파라미터 */
export interface TtSpecialDeccSearchParams extends BaseSearchParams {
  target: 'ttSpecialDecc';
  /** 검색범위 (기본 : 1 특별행정심판재결례명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 재결례유형(출력 결과 필드에 있는 재결구분코드) */
  cls?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 의결일자 */
  date?: number;
  /** 처분일자 검색(20090101~20090130) */
  dpaYd?: string;
  /** 의결일자 검색(20090101~20090130) */
  rslYd?: string;
  /** 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(사건명, 청구번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 조세심판원 특별행정심판재결례 목록 조회 API 응답 */
export interface TtSpecialDeccListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(EvtNm:재결례명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  decc_id?: number;
  /** 특별행정심판재결례일련번호 */
  특별행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 청구번호 */
  청구번호?: string;
  /** 처분일자 */
  처분일자?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: number;
  /** 재결구분명 */
  재결구분명?: string;
  /** 재결구분코드 */
  재결구분코드?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 행정심판재결례상세링크 */
  행정심판재결례상세링크?: string;
}

/** 조세심판원 특별행정심판재결례 본문 조회 API 응답 */
export interface TtSpecialDeccDetail {
  /** 특별행정심판재결례일련번호 */
  특별행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 청구번호 */
  청구번호?: string;
  /** 처분일자 */
  처분일자?: number;
  /** 의결일자 */
  의결일자?: number;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: string;
  /** 재결례유형명 */
  재결례유형명?: string;
  /** 재결례유형코드 */
  재결례유형코드?: number;
  /** 세목 */
  세목?: string;
  /** 재결요지 */
  재결요지?: string;
  /** 따른결정 */
  따른결정?: string;
  /** 참조결정 */
  참조결정?: string;
  /** 주문 */
  주문?: string;
  /** 청구취지 */
  청구취지?: string;
  /** 이유 */
  이유?: string;
  /** 관련법령 */
  관련법령?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== KMSTSPECIALDECC ====================

/** 해양안전심판원 특별행정심판재결례 목록 조회 API 요청 파라미터 */
export interface KmstSpecialDeccSearchParams extends BaseSearchParams {
  target: 'kmstSpecialDecc';
  /** 검색범위 (기본 : 1 특별행정심판재결례명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 재결례유형(출력 결과 필드에 있는 재결구분코드) */
  cls?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 의결일자 */
  date?: number;
  /** 처분일자 검색(20090101~20090130) */
  dpaYd?: string;
  /** 의결일자 검색(20090101~20090130) */
  rslYd?: string;
  /** 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(사건명, 재결번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 해양안전심판원 특별행정심판재결례 목록 조회 API 응답 */
export interface KmstSpecialDeccListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(EvtNm:재결례명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  decc_id?: number;
  /** 특별행정심판재결례일련번호 */
  특별행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 재결번호 */
  재결번호?: string;
  /** 처분일자 */
  처분일자?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: number;
  /** 재결구분명 */
  재결구분명?: string;
  /** 재결구분코드 */
  재결구분코드?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 행정심판재결례상세링크 */
  행정심판재결례상세링크?: string;
}

/** 해양안전심판원 특별행정심판재결례 본문 조회 API 응답 */
export interface KmstSpecialDeccDetail {
  /** 특별행정심판재결례일련번호 */
  특별행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 처분일자 */
  처분일자?: number;
  /** 의결일자 */
  의결일자?: number;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: string;
  /** 재결례유형명 */
  재결례유형명?: string;
  /** 재결례유형코드 */
  재결례유형코드?: number;
  /** 재결번호 */
  재결번호?: number;
  /** 주문 */
  주문?: string;
  /** 청구취지 */
  청구취지?: string;
  /** 이유 */
  이유?: string;
  /** 해양사고관련자 */
  해양사고관련자?: string;
  /** 심판관 */
  심판관?: string;
  /** 사고유형 */
  사고유형?: string;
  /** 선박유형 */
  선박유형?: string;
  /** 해심위치 */
  해심위치?: string;
  /** 재심청구안내 */
  재심청구안내?: string;
  /** 별지 */
  별지?: string;
  /** 의결종류 */
  의결종류?: string;
  /** 재결위원회 */
  재결위원회?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== ACRSPECIALDECC ====================

/** 국민권익위원회 특별행정심판재결례 목록 조회 API 요청 파라미터 */
export interface AcrSpecialDeccSearchParams extends BaseSearchParams {
  target: 'acrSpecialDecc';
  /** 검색범위 (기본 : 1 특별행정심판재결례명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 재결례유형(출력 결과 필드에 있는 재결구분코드) */
  cls?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 의결일자 */
  date?: number;
  /** 처분일자 검색(20090101~20090130) */
  dpaYd?: string;
  /** 의결일자 검색(20090101~20090130) */
  rslYd?: string;
  /** 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 국민권익위원회 특별행정심판재결례 목록 조회 API 응답 */
export interface AcrSpecialDeccListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(EvtNm:재결례명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  decc_id?: number;
  /** 특별행정심판재결례일련번호 */
  특별행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 처분일자 */
  처분일자?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: number;
  /** 재결구분명 */
  재결구분명?: string;
  /** 재결구분코드 */
  재결구분코드?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 행정심판재결례상세링크 */
  행정심판재결례상세링크?: string;
}

/** 국민권익위원회 특별행정심판재결례 본문 조회 API 응답 */
export interface AcrSpecialDeccDetail {
  /** 특별행정심판재결례일련번호 */
  특별행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 처분일자 */
  처분일자?: number;
  /** 의결일자 */
  의결일자?: number;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: string;
  /** 재결례유형명 */
  재결례유형명?: string;
  /** 재결례유형코드 */
  재결례유형코드?: number;
  /** 주문 */
  주문?: string;
  /** 청구취지 */
  청구취지?: string;
  /** 이유 */
  이유?: string;
  /** 재결요지 */
  재결요지?: string;
  /** 상위처분청코드 */
  상위처분청코드?: string;
  /** 상위처분청 */
  상위처분청?: string;
  /** 관계법령 */
  관계법령?: string;
  /** 원본다운로드URL */
  원본다운로드URL?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
}

// ==================== ADAPSPECIALDECC ====================

/** 인사혁신처 소청심사위원회 특별행정심판재결례 목록 조회 API 요청 파라미터 */
export interface AdapSpecialDeccSearchParams extends BaseSearchParams {
  target: 'adapSpecialDecc';
  /** 검색범위 (기본 : 1 특별행정심판재결례명) 2 : 본문검색 */
  search?: number;
  /** 검색범위에서 검색을 원하는 질의 (정확한 검색을 위한 문자열 검색 query="자동차") */
  query?: string;
  /** 재결례유형(출력 결과 필드에 있는 재결구분코드) */
  cls?: string;
  /** 사전식 검색(ga,na,da…,etc) */
  gana?: string;
  /** 의결일자 */
  date?: number;
  /** 처분일자 검색(20090101~20090130) */
  dpaYd?: string;
  /** 의결일자 검색(20090101~20090130) */
  rslYd?: string;
  /** 정렬옵션 (기본 : lasc 재결례명 오름차순) ldes 재결례명 내림차순 dasc : 의결일자 오름차순 ddes : 의결일자 내림차순 nasc */
  sort?: string;
  /** 상세화면 팝업창 여부(팝업창으로 띄우고 싶을 때만 'popYn=Y') */
  popYn?: string;
  /** 응답항목 옵션(사건명, 사건번호, ...) * 빈 값일 경우 전체 항목 표출 * 출력 형태 HTML일 경우 적용 불가능 */
  fields?: string;
}

/** 인사혁신처 소청심사위원회 특별행정심판재결례 목록 조회 API 응답 */
export interface AdapSpecialDeccListItem {
  /** 검색 대상 */
  target?: string;
  /** 키워드 */
  키워드?: string;
  /** 검색범위(EvtNm:재결례명/bdyText:본문) */
  section?: string;
  /** 검색결과갯수 */
  totalCnt?: number;
  /** 출력페이지 */
  page?: number;
  /** 검색결과번호 */
  decc_id?: number;
  /** 특별행정심판재결례일련번호 */
  특별행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 처분일자 */
  처분일자?: string;
  /** 의결일자 */
  의결일자?: string;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: number;
  /** 재결구분명 */
  재결구분명?: string;
  /** 재결구분코드 */
  재결구분코드?: string;
  /** 데이터기준일시 */
  데이터기준일시?: string;
  /** 행정심판재결례상세링크 */
  행정심판재결례상세링크?: string;
}

/** 인사혁신처 소청심사위원회 특별행정심판재결례 본문 조회 API 응답 */
export interface AdapSpecialDeccDetail {
  /** 특별행정심판재결례일련번호 */
  특별행정심판재결례일련번호?: number;
  /** 사건명 */
  사건명?: string;
  /** 사건번호 */
  사건번호?: string;
  /** 처분일자 */
  처분일자?: number;
  /** 의결일자 */
  의결일자?: number;
  /** 처분청 */
  처분청?: string;
  /** 재결청 */
  재결청?: string;
  /** 재결례유형명 */
  재결례유형명?: string;
  /** 재결례유형코드 */
  재결례유형코드?: number;
  /** 주문 */
  주문?: string;
  /** 청구취지 */
  청구취지?: string;
  /** 이유 */
  이유?: string;
  /** 재결요지 */
  재결요지?: string;
  /** 소청사례명 */
  소청사례명?: string;
  /** 처분요지 */
  처분요지?: string;
  /** 소청이유 */
  소청이유?: string;
  /** 소청인 */
  소청인?: string;
  /** 피소청인 */
  피소청인?: string;
  /** 주문 */
  주문?: string;
  /** 이유 */
  이유?: string;
  /** 원처분 */
  원처분?: string;
  /** 결정유형 */
  결정유형?: string;
  /** 대분류 */
  대분류?: string;
  /** 중분류 */
  중분류?: string;
  /** 소분류 */
  소분류?: string;
  /** 데이터기준일자 */
  데이터기준일자?: string;
}


// API 대상 타입
export type ApiTarget = 
  | 'eflaw'
  | 'law'
  | 'lsHistory'
  | 'eflawjosub'
  | 'lawjosub'
  | 'elaw'
  | 'lsHstInf'
  | 'lsJoHstInf'
  | 'lnkDep'
  | 'drlaw'
  | 'lsDelegated'
  | 'lsStmd'
  | 'oldAndNew'
  | 'thdCmp'
  | 'lsAbrv'
  | 'delHst'
  | 'oneview'
  | 'admrul'
  | 'admrulOldAndNew'
  | 'ordin'
  | 'lnkOrg'
  | 'prec'
  | 'detc'
  | 'expc'
  | 'decc'
  | 'ppc'
  | 'eiac'
  | 'ftc'
  | 'acr'
  | 'fsc'
  | 'nlrc'
  | 'kcc'
  | 'iaciac'
  | 'oclt'
  | 'ecc'
  | 'sfc'
  | 'nhrck'
  | 'trty'
  | 'licbyl'
  | 'admbyl'
  | 'ordinbyl'
  | 'school'
  | 'lstrm'
  | 'couseLs'
  | 'couseAdmrul'
  | 'couseOrdin'
  | 'lstrmAI'
  | 'dlytrm'
  | 'lstrmRlt'
  | 'dlytrmRlt'
  | 'lstrmRltJo'
  | 'joRltLstrm'
  | 'lsRlt'
  | 'aiSearch'
  | 'aiRltLs'
  | 'moelCgmExpc'
  | 'molitCgmExpc'
  | 'moefCgmExpc'
  | 'mofCgmExpc'
  | 'moisCgmExpc'
  | 'meCgmExpc'
  | 'kcsCgmExpc'
  | 'ntsCgmExpc'
  | 'moeCgmExpc'
  | 'msitCgmExpc'
  | 'mpvaCgmExpc'
  | 'mndCgmExpc'
  | 'mafraCgmExpc'
  | 'mcstCgmExpc'
  | 'mojCgmExpc'
  | 'mohwCgmExpc'
  | 'motieCgmExpc'
  | 'mogefCgmExpc'
  | 'mofaCgmExpc'
  | 'mssCgmExpc'
  | 'mouCgmExpc'
  | 'molegCgmExpc'
  | 'mfdsCgmExpc'
  | 'mpmCgmExpc'
  | 'kmaCgmExpc'
  | 'khsCgmExpc'
  | 'rdaCgmExpc'
  | 'npaCgmExpc'
  | 'dapaCgmExpc'
  | 'mmaCgmExpc'
  | 'kfsCgmExpc'
  | 'nfaCgmExpc'
  | 'okaCgmExpc'
  | 'ppsCgmExpc'
  | 'kdcaCgmExpc'
  | 'kostatCgmExpc'
  | 'kipoCgmExpc'
  | 'kcgCgmExpc'
  | 'naaccCgmExpc'
  | 'ttSpecialDecc'
  | 'kmstSpecialDecc'
  | 'acrSpecialDecc'
  | 'adapSpecialDecc';
