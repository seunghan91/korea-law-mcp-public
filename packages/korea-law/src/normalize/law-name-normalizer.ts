/**
 * 법령명 약어 정규화 및 오타 교정 모듈
 *
 * 다층 구조 약어 처리 시스템:
 * - 1층: 공식 약어 사전 (높은 신뢰도, 법제처 인정)
 * - 2층: 관용적 약어 사전 (중간 신뢰도, 실무자 관행)
 * - 3층: 혼동하기 쉬운 법령명 매핑 (오류 교정)
 * - 4층: 띄어쓰기 변형 정규화
 * - 5층: 패턴 기반 추론 (규칙 기반)
 * - 6층: Fuzzy Matching (자모 기반 유사도)
 *
 * @module normalize/law-name-normalizer
 */

export interface NormalizationResult {
  /** 원본 입력 */
  original: string;
  /** 정규화된 법령명 */
  normalized: string;
  /** 신뢰도 (0-1) */
  confidence: number;
  /** 출처 */
  source: 'official' | 'conventional' | 'confused' | 'spacing' | 'pattern' | 'fuzzy' | 'passthrough';
  /** 대안 법령명 (여러 가능성이 있을 때) */
  alternatives?: string[];
  /** 약어 여부 */
  isAbbreviation: boolean;
  /** 오타 교정 여부 */
  isTypoCorrection?: boolean;
  /** "이것을 찾으셨나요?" 제안 */
  didYouMean?: string;
}

/**
 * 1층: 공식 약어 사전
 * 법제처 및 정부 부처에서 공식적으로 사용하는 약어
 * 신뢰도: 0.95
 */
const OFFICIAL_ABBREVIATIONS: Record<string, string> = {
  // 헌법·기본법
  '헌법': '대한민국헌법',

  // 민사 기본법
  '민법': '민법',
  '상법': '상법',
  '민소법': '민사소송법',
  '민집법': '민사집행법',

  // 형사 기본법
  '형법': '형법',
  '형소법': '형사소송법',

  // 행정 기본법
  '행소법': '행정소송법',
  '행심법': '행정심판법',
  '행절법': '행정절차법',

  // 노동법
  '근기법': '근로기준법',
  '근퇴법': '근로자퇴직급여 보장법',
  '노조법': '노동조합 및 노동관계조정법',
  '최저임금법': '최저임금법',
  '산재법': '산업재해보상보험법',
  '고용법': '고용보험법',
  '고평법': '남녀고용평등과 일·가정 양립 지원에 관한 법률',
  '파견법': '파견근로자 보호 등에 관한 법률',
  '직안법': '직업안정법',
  '산안법': '산업안전보건법',

  // 세법
  '국기법': '국세기본법',
  '소득세법': '소득세법',
  '법인세법': '법인세법',
  '부가세법': '부가가치세법',
  '상증세법': '상속세 및 증여세법',
  '종부세법': '종합부동산세법',
  '지방세법': '지방세법',
  '지방세기본법': '지방세기본법',
  '조특법': '조세특례제한법',
  '국조법': '국제조세조정에 관한 법률',

  // 공공기관 관련
  '공운법': '공공기관의 운영에 관한 법률',
  '지방공기업법': '지방공기업법',

  // 정보보호
  '개인정보법': '개인정보 보호법',
  '정보통신망법': '정보통신망 이용촉진 및 정보보호 등에 관한 법률',
  '전자상거래법': '전자상거래 등에서의 소비자보호에 관한 법률',
  '전자서명법': '전자서명법',
  '신용정보법': '신용정보의 이용 및 보호에 관한 법률',

  // 지식재산
  '특허법': '특허법',
  '상표법': '상표법',
  '디자인보호법': '디자인보호법',
  '저작권법': '저작권법',
  '부정경쟁방지법': '부정경쟁방지 및 영업비밀보호에 관한 법률',

  // 금융법
  '자본시장법': '자본시장과 금융투자업에 관한 법률',
  '은행법': '은행법',
  '보험업법': '보험업법',
  '여전법': '여신전문금융업법',
  '대부업법': '대부업 등의 등록 및 금융이용자 보호에 관한 법률',

  // 부동산·건설
  '주택법': '주택법',
  '건축법': '건축법',
  '국토계획법': '국토의 계획 및 이용에 관한 법률',
  '도시개발법': '도시개발법',
  '공익사업법': '공익사업을 위한 토지 등의 취득 및 보상에 관한 법률',
  '주임법': '주택임대차보호법',
  '상임법': '상가건물 임대차보호법',

  // 환경법
  '환경영향평가법': '환경영향평가법',
  '폐기물관리법': '폐기물관리법',
  '수질환경보전법': '물환경보전법',
  '대기환경보전법': '대기환경보전법',

  // 기타 주요법
  '약사법': '약사법',
  '의료법': '의료법',
  '변호사법': '변호사법',
  '공인회계사법': '공인회계사법',
  '공정거래법': '독점규제 및 공정거래에 관한 법률',
  '하도급법': '하도급거래 공정화에 관한 법률',
  '표시광고법': '표시·광고의 공정화에 관한 법률',
  '소비자기본법': '소비자기본법',
  '전기통신사업법': '전기통신사업법',
  '방송법': '방송법',
  '공직선거법': '공직선거법',
  '정당법': '정당법',
  '정치자금법': '정치자금법',
  '국회법': '국회법',
  '지방자치법': '지방자치법',
  '교육기본법': '교육기본법',
  '초중등교육법': '초·중등교육법',
  '고등교육법': '고등교육법',
  '병역법': '병역법',
  '외국환거래법': '외국환거래법',
  '관세법': '관세법',

  // 정보공개/청탁금지
  '정공법': '공공기관의 정보공개에 관한 법률',
  '부청법': '부정청탁 및 금품등 수수의 금지에 관한 법률',
  '이충방지법': '공직자의 이해충돌 방지법',

  // 비정규직
  '기단법': '기간제 및 단시간근로자 보호 등에 관한 법률',
};

/**
 * 2층: 관용적 약어 사전
 * 법조인, 학자, 실무자들이 관습적으로 사용하는 약어
 * 신뢰도: 0.85
 */
const CONVENTIONAL_ABBREVIATIONS: Record<string, string> = {
  // 노동법 관용 약어
  '근로기준': '근로기준법',
  '노동조합법': '노동조합 및 노동관계조정법',
  '고용평등법': '남녀고용평등과 일·가정 양립 지원에 관한 법률',
  '파견근로자법': '파견근로자 보호 등에 관한 법률',
  '산업안전법': '산업안전보건법',
  '산재보험법': '산업재해보상보험법',
  '퇴직급여법': '근로자퇴직급여 보장법',

  // 공공기관 관용 약어
  '공공기관운영법': '공공기관의 운영에 관한 법률',
  '공기업법': '공공기관의 운영에 관한 법률',

  // 정보보호 관용 약어
  '개인정보보호법': '개인정보 보호법',
  '정통망법': '정보통신망 이용촉진 및 정보보호 등에 관한 법률',
  '정보통신법': '정보통신망 이용촉진 및 정보보호 등에 관한 법률',
  '전자상거래소비자보호법': '전자상거래 등에서의 소비자보호에 관한 법률',
  '전상법': '전자상거래 등에서의 소비자보호에 관한 법률',

  // 지식재산 관용 약어
  '부경법': '부정경쟁방지 및 영업비밀보호에 관한 법률',
  '영업비밀보호법': '부정경쟁방지 및 영업비밀보호에 관한 법률',

  // 금융 관용 약어
  '자시법': '자본시장과 금융투자업에 관한 법률',
  '금융투자업법': '자본시장과 금융투자업에 관한 법률',
  '여신금융법': '여신전문금융업법',

  // 부동산 관용 약어
  '국계법': '국토의 계획 및 이용에 관한 법률',
  '토지보상법': '공익사업을 위한 토지 등의 취득 및 보상에 관한 법률',
  '토지수용법': '공익사업을 위한 토지 등의 취득 및 보상에 관한 법률',
  '주택임대차법': '주택임대차보호법',
  '상가임대차법': '상가건물 임대차보호법',

  // 세법 관용 약어
  '부가가치세법': '부가가치세법',
  '상속증여세법': '상속세 및 증여세법',
  '종합부동산세법': '종합부동산세법',
  '조세특례법': '조세특례제한법',
  '국제조세법': '국제조세조정에 관한 법률',

  // 기타 관용 약어
  '독점규제법': '독점규제 및 공정거래에 관한 법률',
  '독금법': '독점규제 및 공정거래에 관한 법률',
  '하도급공정화법': '하도급거래 공정화에 관한 법률',
  '표시광고공정화법': '표시·광고의 공정화에 관한 법률',

  // 소송법 관용 약어
  '민사소송': '민사소송법',
  '형사소송': '형사소송법',
  '행정소송': '행정소송법',
  '행정심판': '행정심판법',
  '행정절차': '행정절차법',

  // 단순 확장형 (법 → 법률)
  '헌법재판소법': '헌법재판소법',
  '국가공무원법': '국가공무원법',
  '지방공무원법': '지방공무원법',
};

/**
 * 3층: 혼동하기 쉬운 법령명 매핑
 * 사람들이 자주 착각하거나 잘못 부르는 법령명
 * 신뢰도: 0.80
 */
const CONFUSED_LAW_NAMES: Record<string, { target: string; alternatives?: string[] }> = {
  // 공정거래 관련 혼동
  '독점법': { target: '독점규제 및 공정거래에 관한 법률' },
  '독점금지법': { target: '독점규제 및 공정거래에 관한 법률' },
  '반독점법': { target: '독점규제 및 공정거래에 관한 법률' },
  '경쟁법': { target: '독점규제 및 공정거래에 관한 법률' },

  // 상법/회사법 혼동
  '회사법': { target: '상법', alternatives: ['상법 제3편 회사'] },
  '기업법': { target: '상법' },

  // 노동법 통칭 혼동
  '노동법': { target: '근로기준법', alternatives: ['노동조합 및 노동관계조정법', '산업안전보건법'] },
  '근로법': { target: '근로기준법' },
  '노기법': { target: '근로기준법' },  // 오타

  // 민법/민사법 혼동
  '민사법': { target: '민법', alternatives: ['민사소송법', '민사집행법'] },

  // 형법/형사법 혼동
  '형사법': { target: '형법', alternatives: ['형사소송법'] },

  // 헌법 관련
  '대한민국헌법': { target: '대한민국헌법' },
  '한국헌법': { target: '대한민국헌법' },

  // 세법 혼동
  '세법': { target: '국세기본법', alternatives: ['소득세법', '법인세법', '부가가치세법'] },
  '국세법': { target: '국세기본법' },
  '증여세법': { target: '상속세 및 증여세법' },
  '상속세법': { target: '상속세 및 증여세법' },

  // 개인정보 관련 혼동
  '정보보호법': { target: '개인정보 보호법', alternatives: ['정보통신망 이용촉진 및 정보보호 등에 관한 법률'] },
  '데이터보호법': { target: '개인정보 보호법' },
  '프라이버시법': { target: '개인정보 보호법' },

  // 임대차 혼동
  '임대차보호법': { target: '주택임대차보호법', alternatives: ['상가건물 임대차보호법'] },
  '임대차법': { target: '주택임대차보호법', alternatives: ['상가건물 임대차보호법'] },

  // 소비자 관련
  '소비자보호법': { target: '소비자기본법' },

  // 공무원법 혼동
  '공무원법': { target: '국가공무원법', alternatives: ['지방공무원법'] },

  // 특허/지식재산 혼동
  '지식재산권법': { target: '특허법', alternatives: ['상표법', '저작권법', '디자인보호법'] },
  '지재법': { target: '특허법', alternatives: ['상표법', '저작권법'] },

  // 환경법 통칭
  '환경법': { target: '환경정책기본법', alternatives: ['환경영향평가법', '대기환경보전법'] },

  // 건설/부동산 혼동
  '부동산법': { target: '부동산 거래신고 등에 관한 법률', alternatives: ['공인중개사법'] },
  '건설법': { target: '건설산업기본법', alternatives: ['건축법'] },

  // 금융 혼동
  '금융법': { target: '금융위원회의 설치 등에 관한 법률', alternatives: ['자본시장과 금융투자업에 관한 법률'] },
  '증권법': { target: '자본시장과 금융투자업에 관한 법률' },
  '증권거래법': { target: '자본시장과 금융투자업에 관한 법률' },  // 구법명

  // 통신 관련
  '통신법': { target: '전기통신사업법', alternatives: ['정보통신망 이용촉진 및 정보보호 등에 관한 법률'] },
  '인터넷법': { target: '정보통신망 이용촉진 및 정보보호 등에 관한 법률' },

  // 선거 관련
  '선거법': { target: '공직선거법' },

  // 행정법 통칭
  '행정법': { target: '행정기본법', alternatives: ['행정절차법', '행정소송법', '행정심판법'] },

  // 정보공개 관련
  '정보공개법': { target: '공공기관의 정보공개에 관한 법률' },
  '공개법': { target: '공공기관의 정보공개에 관한 법률' },

  // 비정규직 관련
  '기간제법': { target: '기간제 및 단시간근로자 보호 등에 관한 법률' },
  '단시간법': { target: '기간제 및 단시간근로자 보호 등에 관한 법률' },
  '비정규직법': { target: '기간제 및 단시간근로자 보호 등에 관한 법률', alternatives: ['파견근로자 보호 등에 관한 법률'] },

  // 청탁금지/부정청탁
  '청탁금지법': { target: '부정청탁 및 금품등 수수의 금지에 관한 법률' },
  '김영란법': { target: '부정청탁 및 금품등 수수의 금지에 관한 법률' },

  // 이해충돌
  '이해충돌법': { target: '공직자의 이해충돌 방지법' },
  '이충법': { target: '공직자의 이해충돌 방지법' },

  // 교육 관련
  '교육법': { target: '교육기본법', alternatives: ['초·중등교육법', '고등교육법'] },
  '학교법': { target: '초·중등교육법', alternatives: ['고등교육법'] },
};

/**
 * 4층: 띄어쓰기 변형 정규화
 * 같은 법령의 다양한 띄어쓰기 형태
 * 신뢰도: 0.95
 */
const SPACING_VARIANTS: Record<string, string> = {
  // 개인정보 관련
  '개인정보보호법': '개인정보 보호법',
  '개인 정보 보호법': '개인정보 보호법',
  '개인 정보보호법': '개인정보 보호법',

  // 공공기관 관련
  '공공기관의운영에관한법률': '공공기관의 운영에 관한 법률',
  '공공기관운영에관한법률': '공공기관의 운영에 관한 법률',

  // 정보통신망법
  '정보통신망이용촉진및정보보호등에관한법률': '정보통신망 이용촉진 및 정보보호 등에 관한 법률',
  '정보통신망이용촉진및정보보호에관한법률': '정보통신망 이용촉진 및 정보보호 등에 관한 법률',

  // 전자상거래법
  '전자상거래등에서의소비자보호에관한법률': '전자상거래 등에서의 소비자보호에 관한 법률',
  '전자상거래소비자보호에관한법률': '전자상거래 등에서의 소비자보호에 관한 법률',

  // 노동관계법
  '노동조합및노동관계조정법': '노동조합 및 노동관계조정법',
  '노동조합및노동관계조정에관한법률': '노동조합 및 노동관계조정법',
  '남녀고용평등과일가정양립지원에관한법률': '남녀고용평등과 일·가정 양립 지원에 관한 법률',
  '남녀고용평등법': '남녀고용평등과 일·가정 양립 지원에 관한 법률',

  // 파견법
  '파견근로자보호등에관한법률': '파견근로자 보호 등에 관한 법률',

  // 공정거래법
  '독점규제및공정거래에관한법률': '독점규제 및 공정거래에 관한 법률',

  // 하도급법
  '하도급거래공정화에관한법률': '하도급거래 공정화에 관한 법률',

  // 표시광고법
  '표시광고의공정화에관한법률': '표시·광고의 공정화에 관한 법률',

  // 자본시장법
  '자본시장과금융투자업에관한법률': '자본시장과 금융투자업에 관한 법률',

  // 대부업법
  '대부업등의등록및금융이용자보호에관한법률': '대부업 등의 등록 및 금융이용자 보호에 관한 법률',

  // 국토계획법
  '국토의계획및이용에관한법률': '국토의 계획 및 이용에 관한 법률',

  // 공익사업법
  '공익사업을위한토지등의취득및보상에관한법률': '공익사업을 위한 토지 등의 취득 및 보상에 관한 법률',

  // 퇴직급여법
  '근로자퇴직급여보장법': '근로자퇴직급여 보장법',

  // 신용정보법
  '신용정보의이용및보호에관한법률': '신용정보의 이용 및 보호에 관한 법률',

  // 부정경쟁방지법
  '부정경쟁방지및영업비밀보호에관한법률': '부정경쟁방지 및 영업비밀보호에 관한 법률',

  // 조세특례제한법
  '조세특례제한에관한법률': '조세특례제한법',

  // 국제조세법
  '국제조세조정에관한법률': '국제조세조정에 관한 법률',

  // 초중등교육법
  '초중등교육법': '초·중등교육법',
  '초ㆍ중등교육법': '초·중등교육법',
};

/**
 * 5층: 패턴 기반 추론 규칙
 */
const PATTERN_RULES: Array<{
  pattern: RegExp;
  replacement: (match: string, ...groups: string[]) => string;
  confidence: number;
}> = [
  // "~에관한법률" → "~에 관한 법률" (띄어쓰기 정규화)
  {
    pattern: /^(.+)에관한법률$/,
    replacement: (_, prefix) => `${prefix}에 관한 법률`,
    confidence: 0.90,
  },
  // "~의운영에관한법률" → "~의 운영에 관한 법률"
  {
    pattern: /^(.+)의운영에관한법률$/,
    replacement: (_, prefix) => `${prefix}의 운영에 관한 법률`,
    confidence: 0.90,
  },
  // "~및~" → "~ 및 ~" 띄어쓰기
  {
    pattern: /^(.+)및(.+)$/,
    replacement: (_, a, b) => `${a} 및 ${b}`,
    confidence: 0.85,
  },
];

// ============================================
// 자모 분해 유틸리티 (Fuzzy Matching용)
// ============================================

const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNGSUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONGSUNG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const HANGUL_BASE = 0xAC00; // '가'
const HANGUL_END = 0xD7A3;  // '힣'

/**
 * 한글 음절을 자모로 분해
 */
function decomposeHangul(char: string): string {
  const code = char.charCodeAt(0);

  // 한글 음절 범위 확인
  if (code < HANGUL_BASE || code > HANGUL_END) {
    return char; // 한글 음절이 아니면 그대로 반환
  }

  const offset = code - HANGUL_BASE;
  const cho = Math.floor(offset / (21 * 28));
  const jung = Math.floor((offset % (21 * 28)) / 28);
  const jong = offset % 28;

  return CHOSUNG[cho] + JUNGSUNG[jung] + JONGSUNG[jong];
}

/**
 * 문자열을 자모로 분해
 */
function decomposeString(str: string): string {
  return str.split('').map(decomposeHangul).join('');
}

/**
 * Levenshtein 거리 계산 (자모 분해 후)
 */
function levenshteinDistance(a: string, b: string): number {
  const aDecomposed = decomposeString(a);
  const bDecomposed = decomposeString(b);

  const m = aDecomposed.length;
  const n = bDecomposed.length;

  // 빈 문자열 처리
  if (m === 0) return n;
  if (n === 0) return m;

  // DP 테이블
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = aDecomposed[i - 1] === bDecomposed[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // 삭제
        dp[i][j - 1] + 1,      // 삽입
        dp[i - 1][j - 1] + cost // 대체
      );
    }
  }

  return dp[m][n];
}

/**
 * 자모 기반 유사도 계산 (0-1, 1이 완전 일치)
 */
function jamoSimilarity(a: string, b: string): number {
  const aDecomposed = decomposeString(a);
  const bDecomposed = decomposeString(b);
  const maxLen = Math.max(aDecomposed.length, bDecomposed.length);

  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(a, b);
  return 1 - (distance / maxLen);
}

// ============================================
// 메인 정규화 함수
// ============================================

/**
 * 모든 법령명 목록 (Fuzzy Matching용)
 */
function getAllLawNames(): string[] {
  const names = new Set<string>();

  // 공식 약어의 값들
  Object.values(OFFICIAL_ABBREVIATIONS).forEach(name => names.add(name));

  // 관용적 약어의 값들
  Object.values(CONVENTIONAL_ABBREVIATIONS).forEach(name => names.add(name));

  // 혼동 법령의 타겟들
  Object.values(CONFUSED_LAW_NAMES).forEach(({ target, alternatives }) => {
    names.add(target);
    alternatives?.forEach(alt => names.add(alt));
  });

  // 띄어쓰기 변형의 값들
  Object.values(SPACING_VARIANTS).forEach(name => names.add(name));

  return Array.from(names);
}

/**
 * Fuzzy Matching으로 유사 법령명 찾기
 */
function findSimilarLawNames(input: string, threshold: number = 0.6, limit: number = 5): Array<{ name: string; similarity: number }> {
  const allNames = getAllLawNames();
  const results: Array<{ name: string; similarity: number }> = [];

  for (const name of allNames) {
    const similarity = jamoSimilarity(input, name);
    if (similarity >= threshold) {
      results.push({ name, similarity });
    }
  }

  // 유사도 높은 순 정렬
  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, limit);
}

/**
 * 법령명 약어를 정식명칭으로 정규화 (확장판)
 */
export function normalizeLawName(input: string): NormalizationResult {
  const trimmed = input.trim();

  // 0층: 띄어쓰기 제거한 버전도 검색
  const noSpaces = trimmed.replace(/\s+/g, '');

  // 1층: 공식 약어 사전 검색
  if (OFFICIAL_ABBREVIATIONS[trimmed]) {
    return {
      original: trimmed,
      normalized: OFFICIAL_ABBREVIATIONS[trimmed],
      confidence: 0.95,
      source: 'official',
      isAbbreviation: trimmed !== OFFICIAL_ABBREVIATIONS[trimmed],
    };
  }

  // 띄어쓰기 제거 버전으로도 검색
  if (OFFICIAL_ABBREVIATIONS[noSpaces]) {
    return {
      original: trimmed,
      normalized: OFFICIAL_ABBREVIATIONS[noSpaces],
      confidence: 0.95,
      source: 'official',
      isAbbreviation: true,
    };
  }

  // 2층: 관용적 약어 사전 검색
  if (CONVENTIONAL_ABBREVIATIONS[trimmed]) {
    return {
      original: trimmed,
      normalized: CONVENTIONAL_ABBREVIATIONS[trimmed],
      confidence: 0.85,
      source: 'conventional',
      isAbbreviation: trimmed !== CONVENTIONAL_ABBREVIATIONS[trimmed],
    };
  }

  if (CONVENTIONAL_ABBREVIATIONS[noSpaces]) {
    return {
      original: trimmed,
      normalized: CONVENTIONAL_ABBREVIATIONS[noSpaces],
      confidence: 0.85,
      source: 'conventional',
      isAbbreviation: true,
    };
  }

  // 3층: 혼동하기 쉬운 법령명 검색
  if (CONFUSED_LAW_NAMES[trimmed]) {
    const confused = CONFUSED_LAW_NAMES[trimmed];
    return {
      original: trimmed,
      normalized: confused.target,
      confidence: 0.80,
      source: 'confused',
      isAbbreviation: true,
      isTypoCorrection: true,
      alternatives: confused.alternatives,
      didYouMean: confused.target,
    };
  }

  if (CONFUSED_LAW_NAMES[noSpaces]) {
    const confused = CONFUSED_LAW_NAMES[noSpaces];
    return {
      original: trimmed,
      normalized: confused.target,
      confidence: 0.80,
      source: 'confused',
      isAbbreviation: true,
      isTypoCorrection: true,
      alternatives: confused.alternatives,
      didYouMean: confused.target,
    };
  }

  // 4층: 띄어쓰기 변형 정규화
  if (SPACING_VARIANTS[trimmed]) {
    return {
      original: trimmed,
      normalized: SPACING_VARIANTS[trimmed],
      confidence: 0.95,
      source: 'spacing',
      isAbbreviation: false,
    };
  }

  if (SPACING_VARIANTS[noSpaces]) {
    return {
      original: trimmed,
      normalized: SPACING_VARIANTS[noSpaces],
      confidence: 0.95,
      source: 'spacing',
      isAbbreviation: false,
    };
  }

  // 5층: 패턴 기반 추론
  for (const rule of PATTERN_RULES) {
    const match = noSpaces.match(rule.pattern);
    if (match) {
      const normalized = rule.replacement(match[0], ...match.slice(1));
      return {
        original: trimmed,
        normalized,
        confidence: rule.confidence,
        source: 'pattern',
        isAbbreviation: trimmed !== normalized,
      };
    }
  }

  // 6층: Fuzzy Matching (입력이 3글자 이상일 때만)
  if (trimmed.length >= 3) {
    const similar = findSimilarLawNames(trimmed, 0.65, 3);
    if (similar.length > 0 && similar[0].similarity >= 0.7) {
      return {
        original: trimmed,
        normalized: similar[0].name,
        confidence: similar[0].similarity * 0.9, // 약간 낮춤
        source: 'fuzzy',
        isAbbreviation: true,
        isTypoCorrection: true,
        didYouMean: similar[0].name,
        alternatives: similar.slice(1).map(s => s.name),
      };
    } else if (similar.length > 0) {
      // 유사도가 낮지만 제안은 가능
      return {
        original: trimmed,
        normalized: trimmed, // 그대로 두되
        confidence: 0.5,
        source: 'passthrough',
        isAbbreviation: false,
        didYouMean: similar[0].name,
        alternatives: similar.map(s => s.name),
      };
    }
  }

  // Passthrough: 그대로 반환
  return {
    original: trimmed,
    normalized: trimmed,
    confidence: 1.0,
    source: 'passthrough',
    isAbbreviation: false,
  };
}

/**
 * 약어 사전에서 가능한 모든 법령명 검색 (부분 일치 + Fuzzy)
 */
export function searchPossibleLawNames(query: string): NormalizationResult[] {
  const results: NormalizationResult[] = [];
  const trimmed = query.trim().toLowerCase();
  const noSpaces = trimmed.replace(/\s+/g, '');

  // 공식 약어 사전 검색
  for (const [abbr, fullName] of Object.entries(OFFICIAL_ABBREVIATIONS)) {
    if (abbr.toLowerCase().includes(trimmed) ||
        fullName.toLowerCase().includes(trimmed) ||
        abbr.replace(/\s+/g, '').includes(noSpaces) ||
        fullName.replace(/\s+/g, '').includes(noSpaces)) {
      results.push({
        original: abbr,
        normalized: fullName,
        confidence: 0.95,
        source: 'official',
        isAbbreviation: abbr !== fullName,
      });
    }
  }

  // 관용적 약어 사전 검색
  for (const [abbr, fullName] of Object.entries(CONVENTIONAL_ABBREVIATIONS)) {
    if (results.some(r => r.normalized === fullName)) continue;

    if (abbr.toLowerCase().includes(trimmed) ||
        fullName.toLowerCase().includes(trimmed) ||
        abbr.replace(/\s+/g, '').includes(noSpaces) ||
        fullName.replace(/\s+/g, '').includes(noSpaces)) {
      results.push({
        original: abbr,
        normalized: fullName,
        confidence: 0.85,
        source: 'conventional',
        isAbbreviation: abbr !== fullName,
      });
    }
  }

  // 혼동 법령 검색
  for (const [confusedName, { target, alternatives }] of Object.entries(CONFUSED_LAW_NAMES)) {
    if (results.some(r => r.normalized === target)) continue;

    if (confusedName.toLowerCase().includes(trimmed) ||
        target.toLowerCase().includes(trimmed)) {
      results.push({
        original: confusedName,
        normalized: target,
        confidence: 0.80,
        source: 'confused',
        isAbbreviation: true,
        alternatives,
      });
    }
  }

  // Fuzzy 매칭 추가 (결과가 부족할 경우)
  if (results.length < 5 && query.length >= 2) {
    const fuzzyResults = findSimilarLawNames(query, 0.5, 5);
    for (const { name, similarity } of fuzzyResults) {
      if (!results.some(r => r.normalized === name)) {
        results.push({
          original: query,
          normalized: name,
          confidence: similarity * 0.8,
          source: 'fuzzy',
          isAbbreviation: true,
          isTypoCorrection: true,
        });
      }
    }
  }

  // 신뢰도 순 정렬
  results.sort((a, b) => b.confidence - a.confidence);

  return results;
}

/**
 * 역방향 검색: 정식명칭에서 약어 찾기
 */
export function findAbbreviations(fullName: string): string[] {
  const trimmed = fullName.trim();
  const abbreviations: string[] = [];

  for (const [abbr, name] of Object.entries(OFFICIAL_ABBREVIATIONS)) {
    if (name === trimmed && abbr !== name) {
      abbreviations.push(abbr);
    }
  }

  for (const [abbr, name] of Object.entries(CONVENTIONAL_ABBREVIATIONS)) {
    if (name === trimmed && abbr !== name && !abbreviations.includes(abbr)) {
      abbreviations.push(abbr);
    }
  }

  return abbreviations;
}

/**
 * 약어 사전 통계 조회
 */
export function getAbbreviationStats(): {
  officialCount: number;
  conventionalCount: number;
  confusedCount: number;
  spacingCount: number;
  totalCount: number;
} {
  return {
    officialCount: Object.keys(OFFICIAL_ABBREVIATIONS).length,
    conventionalCount: Object.keys(CONVENTIONAL_ABBREVIATIONS).length,
    confusedCount: Object.keys(CONFUSED_LAW_NAMES).length,
    spacingCount: Object.keys(SPACING_VARIANTS).length,
    totalCount: Object.keys(OFFICIAL_ABBREVIATIONS).length +
                Object.keys(CONVENTIONAL_ABBREVIATIONS).length +
                Object.keys(CONFUSED_LAW_NAMES).length +
                Object.keys(SPACING_VARIANTS).length,
  };
}

/**
 * 법령명 정규화 (간단 버전)
 */
export function normalize(input: string): string {
  return normalizeLawName(input).normalized;
}

/**
 * "이것을 찾으셨나요?" 제안 생성
 */
export function getSuggestions(input: string, limit: number = 5): Array<{
  suggestion: string;
  confidence: number;
  reason: string;
}> {
  const result = normalizeLawName(input);
  const suggestions: Array<{ suggestion: string; confidence: number; reason: string }> = [];

  // 정규화 결과가 원본과 다르면 첫 번째 제안
  if (result.normalized !== input) {
    let reason = '공식 약어';
    if (result.source === 'conventional') reason = '관용적 표현';
    if (result.source === 'confused') reason = '혼동하기 쉬운 표현';
    if (result.source === 'spacing') reason = '띄어쓰기 교정';
    if (result.source === 'fuzzy') reason = '유사 법령명';

    suggestions.push({
      suggestion: result.normalized,
      confidence: result.confidence,
      reason,
    });
  }

  // 대안이 있으면 추가
  if (result.alternatives) {
    result.alternatives.slice(0, limit - suggestions.length).forEach(alt => {
      suggestions.push({
        suggestion: alt,
        confidence: result.confidence * 0.8,
        reason: '관련 법령',
      });
    });
  }

  // 추가 유사 법령 검색
  if (suggestions.length < limit && input.length >= 2) {
    const similar = findSimilarLawNames(input, 0.4, limit);
    for (const { name, similarity } of similar) {
      if (suggestions.length >= limit) break;
      if (!suggestions.some(s => s.suggestion === name)) {
        suggestions.push({
          suggestion: name,
          confidence: similarity,
          reason: '유사 법령명',
        });
      }
    }
  }

  return suggestions.slice(0, limit);
}

export default {
  normalizeLawName,
  normalize,
  searchPossibleLawNames,
  findAbbreviations,
  getAbbreviationStats,
  getSuggestions,
  findSimilarLawNames,
  jamoSimilarity,
};
