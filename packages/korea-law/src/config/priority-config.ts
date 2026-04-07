/**
 * korea-law: Global Priority Configuration
 * 모든 데이터 타입에 대한 우선순위 체계
 *
 * Tier 1 (Priority 10-20): 매일 동기화, 변경 감지
 * Tier 2 (Priority 30-40): 2-3회/주 동기화
 * Tier 3 (Priority 50-70): 월 1회 동기화
 */

export type SyncFrequency = 'DAILY' | 'TWICE_WEEKLY' | 'WEEKLY' | 'TWICE_MONTHLY' | 'MONTHLY';
export type PriorityTier = 'TIER1' | 'TIER2' | 'TIER3';
export type FallbackStrategy = 'skip' | 'defer' | 'partial';

// ============================================
// Priority Scores
// ============================================

export const PRIORITY_SCORES = {
  LAW: 10,
  PRECEDENT: 15,
  ADMIN_RULE: 20,
  LOCAL_ORDINANCE: 30,
  LEGAL_INTERPRETATION: 40,
  CONSTITUTIONAL_DECISION: 50,
  ADMINISTRATIVE_APPEAL: 60,
  TREATY: 70,
} as const;

// ============================================
// TIER 1: Critical (매일 동기화)
// ============================================

export const TIER1_LAWS_CONFIG = {
  priority: PRIORITY_SCORES.LAW,
  syncFrequency: 'DAILY' as SyncFrequency,
  tier: 'TIER1' as PriorityTier,

  // 기본법 (항상 우선)
  constitutional: [
    { keyword: '헌법', priority: 10.0, frequency: 'DAILY' as SyncFrequency },
  ],

  // 핵심 민사/형사법
  corePrivate: [
    { keyword: '민법', priority: 9.5, frequency: 'DAILY' as SyncFrequency },
    { keyword: '상법', priority: 9.5, frequency: 'DAILY' as SyncFrequency },
    { keyword: '민사소송법', priority: 9.4, frequency: 'DAILY' as SyncFrequency },
  ],

  criminalLaw: [
    { keyword: '형법', priority: 9.5, frequency: 'DAILY' as SyncFrequency },
    { keyword: '형사소송법', priority: 9.4, frequency: 'DAILY' as SyncFrequency },
  ],

  // 핵심 행정법
  laborLaw: [
    { keyword: '근로기준법', priority: 9.0, frequency: 'DAILY' as SyncFrequency },
    { keyword: '노동조합 및 노동관계조정법', priority: 8.8, frequency: 'DAILY' as SyncFrequency },
    { keyword: '근로자퇴직급여 보장법', priority: 8.7, frequency: 'DAILY' as SyncFrequency },
    { keyword: '최저임금법', priority: 8.6, frequency: 'DAILY' as SyncFrequency },
    { keyword: '산업안전보건법', priority: 8.6, frequency: 'DAILY' as SyncFrequency },
  ],

  taxLaw: [
    { keyword: '국세기본법', priority: 9.0, frequency: 'DAILY' as SyncFrequency },
    { keyword: '소득세법', priority: 8.9, frequency: 'DAILY' as SyncFrequency },
    { keyword: '법인세법', priority: 8.9, frequency: 'DAILY' as SyncFrequency },
    { keyword: '부가가치세법', priority: 8.8, frequency: 'DAILY' as SyncFrequency },
  ],

  socialInsurance: [
    { keyword: '국민건강보험법', priority: 8.7, frequency: 'DAILY' as SyncFrequency },
    { keyword: '국민연금법', priority: 8.7, frequency: 'DAILY' as SyncFrequency },
    { keyword: '고용보험법', priority: 8.6, frequency: 'DAILY' as SyncFrequency },
    { keyword: '산업재해보상보험법', priority: 8.6, frequency: 'DAILY' as SyncFrequency },
  ],

  intellectualProperty: [
    { keyword: '저작권법', priority: 8.5, frequency: 'DAILY' as SyncFrequency },
    { keyword: '특허법', priority: 8.5, frequency: 'DAILY' as SyncFrequency },
    { keyword: '상표법', priority: 8.4, frequency: 'DAILY' as SyncFrequency },
  ],

  itLaw: [
    { keyword: '개인정보 보호법', priority: 8.6, frequency: 'DAILY' as SyncFrequency },
    { keyword: '정보통신망 이용촉진 및 정보보호 등에 관한 법률', priority: 8.5, frequency: 'DAILY' as SyncFrequency },
  ],

  realEstateConstruction: [
    { keyword: '주택임대차보호법', priority: 8.5, frequency: 'DAILY' as SyncFrequency },
    { keyword: '상가건물 임대차보호법', priority: 8.4, frequency: 'DAILY' as SyncFrequency },
    { keyword: '건축법', priority: 8.4, frequency: 'DAILY' as SyncFrequency },
    { keyword: '국토의 계획 및 이용에 관한 법률', priority: 8.3, frequency: 'DAILY' as SyncFrequency },
  ],

  traffic: [
    { keyword: '도로교통법', priority: 8.3, frequency: 'DAILY' as SyncFrequency },
  ],
};

export const TIER1_PRECEDENT_CONFIG = {
  priority: PRIORITY_SCORES.PRECEDENT,
  syncFrequency: 'DAILY' as SyncFrequency,
  tier: 'TIER1' as PriorityTier,
  config: {
    searchDays: 7,           // 최근 7일
    courts: ['SUPREME_COURT'], // 대법원 중심
    limit: 100,
    searchType: 2,           // 본문검색
    keywords: [
      { keyword: '대법원', priority: 15.0 },
      { keyword: '근로', priority: 14.5 },
      { keyword: '행정', priority: 14.5 },
      { keyword: '소비자', priority: 14.0 },
      { keyword: '부동산', priority: 13.9 },
    ],
  },
};

export const TIER1_ADMIN_RULES_CONFIG = {
  priority: PRIORITY_SCORES.ADMIN_RULE,
  syncFrequency: 'DAILY' as SyncFrequency,
  tier: 'TIER1' as PriorityTier,

  // 부령/시행령 (가장 중요)
  decrees: [
    { keyword: '근로기준법시행령', priority: 20.0, frequency: 'DAILY' as SyncFrequency },
    { keyword: '소득세법시행령', priority: 20.0, frequency: 'DAILY' as SyncFrequency },
    { keyword: '법인세법시행령', priority: 19.9, frequency: 'DAILY' as SyncFrequency },
    { keyword: '부가가치세법시행령', priority: 19.9, frequency: 'DAILY' as SyncFrequency },
    { keyword: '국민건강보험법시행령', priority: 19.8, frequency: 'DAILY' as SyncFrequency },
    { keyword: '국민연금법시행령', priority: 19.8, frequency: 'DAILY' as SyncFrequency },
    { keyword: '건축법시행령', priority: 19.7, frequency: 'DAILY' as SyncFrequency },
    { keyword: '도로교통법시행령', priority: 19.7, frequency: 'DAILY' as SyncFrequency },
  ],

  // 부처 훈령 (2회/주)
  ordinances: [
    { keyword: '고용노동부훈령', priority: 15.0, frequency: 'TWICE_WEEKLY' as SyncFrequency },
    { keyword: '국세청훈령', priority: 15.0, frequency: 'TWICE_WEEKLY' as SyncFrequency },
    { keyword: '금융위원회훈령', priority: 14.5, frequency: 'TWICE_WEEKLY' as SyncFrequency },
    { keyword: '법제처훈령', priority: 14.0, frequency: 'TWICE_WEEKLY' as SyncFrequency },
  ],

  // 일반 고시/예규 (1회/주)
  notices: [
    { keyword: '훈령', priority: 10.0, frequency: 'WEEKLY' as SyncFrequency },
    { keyword: '고시', priority: 10.0, frequency: 'WEEKLY' as SyncFrequency },
    { keyword: '예규', priority: 9.5, frequency: 'WEEKLY' as SyncFrequency },
  ],
};

// ============================================
// TIER 2: High Priority (2-3회/주)
// ============================================

export const TIER2_LOCAL_ORDINANCE_CONFIG = {
  priority: PRIORITY_SCORES.LOCAL_ORDINANCE,
  syncFrequency: 'TWICE_WEEKLY' as SyncFrequency,
  tier: 'TIER2' as PriorityTier,

  // 주요 광역시/도 (모두 동기화)
  priorityRegions: [
    { region: '서울', priority: 30.0 },
    { region: '경기', priority: 29.9 },
    { region: '부산', priority: 29.8 },
    { region: '대구', priority: 29.7 },
    { region: '인천', priority: 29.7 },
    { region: '광주', priority: 29.6 },
    { region: '대전', priority: 29.6 },
    { region: '울산', priority: 29.5 },
  ],

  // 기타 지역 (변경사항만, 월 1회)
  secondaryRegions: [
    'Seoul', 'Gyeonggi', 'Busan', 'Daegu', 'Incheon',
    'Gwangju', 'Daejeon', 'Ulsan', 'Gyeongbuk', 'Gyeongnam',
    'Jeolbuk', 'Jeolnam', 'Jeju', 'Gangwon', 'Sejong',
  ],

  limit: 100,
};

export const TIER2_INTERPRETATION_CONFIG = {
  priority: PRIORITY_SCORES.LEGAL_INTERPRETATION,
  syncFrequency: 'WEEKLY' as SyncFrequency,
  tier: 'TIER2' as PriorityTier,

  daysToSync: 30,  // 최근 1개월

  // 핵심 부처
  priorityAgencies: [
    { agency: '법제처', priority: 40.0 },
    { agency: '국세청', priority: 39.5 },
    { agency: '고용노동부', priority: 39.5 },
    { agency: '금융위원회', priority: 39.0 },
  ],
};

// ============================================
// TIER 3: Secondary Sources (월 1회)
// ============================================

export const TIER3_CONSTITUTIONAL_DECISION_CONFIG = {
  priority: PRIORITY_SCORES.CONSTITUTIONAL_DECISION,
  syncFrequency: 'MONTHLY' as SyncFrequency,
  tier: 'TIER3' as PriorityTier,
  limit: 100,
};

export const TIER3_ADMINISTRATIVE_APPEAL_CONFIG = {
  priority: PRIORITY_SCORES.ADMINISTRATIVE_APPEAL,
  syncFrequency: 'MONTHLY' as SyncFrequency,
  tier: 'TIER3' as PriorityTier,
  daysToSync: 90,  // 최근 3개월
  limit: 100,
};

export const TIER3_TREATY_CONFIG = {
  priority: PRIORITY_SCORES.TREATY,
  syncFrequency: 'MONTHLY' as SyncFrequency,
  tier: 'TIER3' as PriorityTier,
  limit: 100,
  keywords: [
    { keyword: '조약', priority: 70.0 },
    { keyword: '협정', priority: 70.0 },
    { keyword: '의정서', priority: 70.0 },
  ],
};

// ============================================
// Phase Configuration for Daily Sync
// ============================================

export interface PhaseSyncConfig {
  phase: number;
  name: string;
  timeout: number;          // 최대 시간 (ms)
  maxApiCalls: number;      // 최대 API 호출 수
  fallback: FallbackStrategy;
  description: string;
}

export const PHASE_CONFIGS: PhaseSyncConfig[] = [
  {
    phase: 1,
    name: 'Critical Laws',
    timeout: 60 * 60 * 1000,  // 1시간
    maxApiCalls: 50,
    fallback: 'skip',
    description: '주요 법령 (30개) + 최근 변경사항',
  },
  {
    phase: 2,
    name: 'Precedent & Admin Rules (Tier1)',
    timeout: 90 * 60 * 1000,  // 1.5시간
    maxApiCalls: 80,
    fallback: 'partial',
    description: '최근 7일 판례 + 부령/시행령',
  },
  {
    phase: 3,
    name: 'Local Ordinance & Interpretation',
    timeout: 90 * 60 * 1000,  // 1.5시간
    maxApiCalls: 60,
    fallback: 'defer',
    description: '주요 지역 자치법규 + 법령해석',
  },
  {
    phase: 4,
    name: 'Secondary Sources',
    timeout: 60 * 60 * 1000,  // 1시간
    maxApiCalls: 30,
    fallback: 'defer',
    description: '헌재 결정, 행정심판, 조약 (변경사항만)',
  },
];

// ============================================
// Global Sync Configuration
// ============================================

export interface GlobalSyncConfig {
  apiDelay: number;         // API 호출 간격 (ms)
  retryAttempts: number;    // 재시도 횟수
  maxConcurrentCalls: number; // 동시 호출 수
}

export const GLOBAL_SYNC_CONFIG: GlobalSyncConfig = {
  apiDelay: 500,           // 0.5초
  retryAttempts: 3,        // 최대 3회
  maxConcurrentCalls: 2,   // 최대 2개 동시 호출
};

// ============================================
// Utility Functions
// ============================================

/**
 * Tier별 우선순위 범위 조회
 */
export function getPriorityByTier(tier: PriorityTier): [number, number] {
  switch (tier) {
    case 'TIER1':
      return [10, 20];
    case 'TIER2':
      return [30, 40];
    case 'TIER3':
      return [50, 70];
    default:
      return [0, 100];
  }
}

/**
 * 우선순위 점수로부터 Tier 결정
 */
export function getTierByPriority(priority: number): PriorityTier {
  if (priority >= 10 && priority <= 20) return 'TIER1';
  if (priority >= 30 && priority <= 40) return 'TIER2';
  if (priority >= 50 && priority <= 70) return 'TIER3';
  return 'TIER3';
}

/**
 * 동기화 빈도를 일수로 변환
 */
export function syncFrequencyToDays(frequency: SyncFrequency): number {
  const frequencyMap: Record<SyncFrequency, number> = {
    DAILY: 1,
    TWICE_WEEKLY: 3,      // ~3-4일마다
    WEEKLY: 7,
    TWICE_MONTHLY: 15,
    MONTHLY: 30,
  };
  return frequencyMap[frequency];
}

/**
 * 다음 동기화 일정 계산
 */
export function calculateNextSync(lastSync: Date, frequency: SyncFrequency): Date {
  const days = syncFrequencyToDays(frequency);
  const nextSync = new Date(lastSync);
  nextSync.setDate(nextSync.getDate() + days);
  return nextSync;
}

/**
 * 모든 키워드 통합 조회
 */
export function getAllPriorityKeywords(): Array<{
  keyword: string;
  priority: number;
  type: string;
  frequency: SyncFrequency;
}> {
  const keywords: Array<{
    keyword: string;
    priority: number;
    type: string;
    frequency: SyncFrequency;
  }> = [];

  // Laws
  [
    TIER1_LAWS_CONFIG.constitutional,
    TIER1_LAWS_CONFIG.corePrivate,
    TIER1_LAWS_CONFIG.criminalLaw,
    TIER1_LAWS_CONFIG.laborLaw,
    TIER1_LAWS_CONFIG.taxLaw,
    TIER1_LAWS_CONFIG.socialInsurance,
    TIER1_LAWS_CONFIG.intellectualProperty,
    TIER1_LAWS_CONFIG.itLaw,
    TIER1_LAWS_CONFIG.realEstateConstruction,
    TIER1_LAWS_CONFIG.traffic,
  ].forEach(section => {
    section.forEach(item => {
      keywords.push({
        keyword: item.keyword,
        priority: item.priority,
        type: 'LAW',
        frequency: item.frequency,
      });
    });
  });

  // Precedent
  TIER1_PRECEDENT_CONFIG.config.keywords.forEach(item => {
    keywords.push({
      keyword: item.keyword,
      priority: item.priority,
      type: 'PRECEDENT',
      frequency: 'DAILY',
    });
  });

  // Admin Rules
  [
    TIER1_ADMIN_RULES_CONFIG.decrees,
    TIER1_ADMIN_RULES_CONFIG.ordinances,
    TIER1_ADMIN_RULES_CONFIG.notices,
  ].forEach(section => {
    section.forEach(item => {
      keywords.push({
        keyword: item.keyword,
        priority: item.priority,
        type: 'ADMIN_RULE',
        frequency: item.frequency,
      });
    });
  });

  return keywords.sort((a, b) => b.priority - a.priority);
}
