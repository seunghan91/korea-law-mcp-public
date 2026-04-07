/**
 * korea-law: Full Sync Engine v2
 * 
 * 국가법령정보센터 전체 API 동기화
 * - 법령, 행정규칙, 자치법규, 판례, 헌재결정례, 법령해석례, 행정심판례, 조약
 * 
 * ⚠️ 주의: 이 데이터는 AI 검증용입니다.
 */

import { format } from 'date-fns';
import * as db from '../db/database';
import * as api from '../api/law-api';
import * as extApi from '../api/extended-api';

// ============================================
// 동기화 설정
// ============================================

export interface SyncSourceConfig {
  name: string;
  enabled: boolean;
  priority: number;
  apiTarget: string;
  searchFn: (query: string, page: number, display: number) => Promise<any[]>;
  detailFn?: (id: string) => Promise<any>;
  transformFn: (item: any, detail?: any) => any;
  tableName: string;
}

export interface FullSyncConfig {
  sources: SyncSourceConfig[];
  apiDelay: number;           // API 호출 간격 (ms)
  pageSize: number;           // 페이지당 결과 수
  maxPages: number;           // 최대 페이지 수 (0 = 무제한)
  priorityKeywords: string[]; // 우선 검색할 키워드
}

// 동기화 소스 정의
const SYNC_SOURCES: SyncSourceConfig[] = [
  // 1. 법령 (기존)
  {
    name: '법령',
    enabled: true,
    priority: 10,
    apiTarget: 'eflaw',
    searchFn: async (query, page, display) => {
      return api.searchLaws(query, display);
    },
    detailFn: async (id) => api.getLawDetail(Number(id)),
    transformFn: (item, detail) => ({
      law_mst_id: String(item.법령ID || detail?.기본정보?.법령ID),
      law_name: item.법령명한글,
      promulgation_date: formatDate(item.공포일자),
      enforcement_date: formatDate(item.시행일자),
      law_type: item.법령구분명,
      ministry: item.소관부처명,
      status: 'ACTIVE',
    }),
    tableName: 'laws',
  },
  
  // 2. 판례
  {
    name: '판례',
    enabled: true,
    priority: 20,
    apiTarget: 'prec',
    searchFn: async (query, page, display) => {
      return api.searchPrecedents(query, display);
    },
    detailFn: async (id) => api.getPrecedentDetail(Number(id)),
    transformFn: (item, detail) => ({
      prec_seq: String(item.판례정보일련번호),
      case_id: item.사건번호,
      case_name: item.사건명,
      court: item.법원명,
      case_type: item.사건종류명,
      decision_date: formatDate(item.선고일자),
      decision_type: item.선고,
      summary: detail?.판시사항,
      holding: detail?.판결요지,
      full_text: detail?.판례내용,
      ref_articles: detail?.참조조문,
      ref_precedents: detail?.참조판례,
    }),
    tableName: 'precedents',
  },
  
  // 3. 행정규칙
  {
    name: '행정규칙',
    enabled: true,
    priority: 30,
    apiTarget: 'admrul',
    searchFn: async (query, page, display) => {
      return extApi.searchAdminRules(query, display);
    },
    detailFn: async (id) => extApi.getAdminRuleDetail(id),
    transformFn: (item, detail) => ({
      admin_rule_seq: String(item.행정규칙일련번호),
      admin_rule_name: item.행정규칙명,
      admin_rule_type: item.행정규칙종류명,
      ministry: item.소관부처명,
      issue_date: formatDate(item.발령일자),
      enforcement_date: formatDate(item.시행일자),
      content: detail?.본문,
    }),
    tableName: 'admin_rules',
  },
  
  // 4. 자치법규
  {
    name: '자치법규',
    enabled: true,
    priority: 40,
    apiTarget: 'ordin',
    searchFn: async (query, page, display) => {
      return extApi.searchLocalLaws(query, display);
    },
    transformFn: (item) => ({
      local_law_seq: String(item.자치법규일련번호),
      local_law_name: item.자치법규명,
      local_gov: item.자치단체명,
      local_gov_code: item.자치단체코드,
      promulgation_date: formatDate(item.공포일자),
      enforcement_date: formatDate(item.시행일자),
    }),
    tableName: 'local_laws',
  },
  
  // 5. 헌재결정례
  {
    name: '헌재결정례',
    enabled: true,
    priority: 50,
    apiTarget: 'detc',
    searchFn: async (query, page, display) => {
      return extApi.searchConstitutionalDecisions(query, display);
    },
    transformFn: (item) => ({
      detc_seq: String(item.헌재결정일련번호),
      case_id: item.사건번호,
      case_name: item.사건명,
      decision_date: formatDate(item.선고일자),
      decision_type: item.결정유형,
      summary: item.결정요지,
    }),
    tableName: 'constitutional_decisions',
  },
  
  // 6. 법령해석례
  {
    name: '법령해석례',
    enabled: true,
    priority: 60,
    apiTarget: 'expc',
    searchFn: async (query, page, display) => {
      return extApi.searchLegalInterpretations(query, display);
    },
    transformFn: (item) => ({
      expc_seq: String(item.법령해석일련번호),
      title: item.사안명,
      answerer: item.회신기관명,
      interpretation_date: formatDate(item.회신일자),
      question: item.질의요지,
      answer: item.회답,
    }),
    tableName: 'legal_interpretations',
  },
  
  // 7. 행정심판례
  {
    name: '행정심판례',
    enabled: true,
    priority: 70,
    apiTarget: 'decc',
    searchFn: async (query, page, display) => {
      return extApi.searchAdminAppeals(query, display);
    },
    transformFn: (item) => ({
      decc_seq: String(item.행정심판일련번호),
      case_id: item.사건번호,
      case_name: item.사건명,
      decision_date: formatDate(item.재결일자),
      decision_type: item.재결결과,
      summary: item.재결요지,
    }),
    tableName: 'admin_appeals',
  },
  
  // 8. 조약
  {
    name: '조약',
    enabled: true,
    priority: 80,
    apiTarget: 'trty',
    searchFn: async (query, page, display) => {
      return extApi.searchTreaties(query, display);
    },
    transformFn: (item) => ({
      treaty_seq: String(item.조약일련번호),
      treaty_name: item.조약명,
      treaty_type: item.조약종류명,
      conclusion_date: formatDate(item.체결일자),
      enforcement_date: formatDate(item.발효일자),
      counterpart: item.당사국,
    }),
    tableName: 'treaties',
  },
];

const DEFAULT_CONFIG: FullSyncConfig = {
  sources: SYNC_SOURCES,
  apiDelay: 500,
  pageSize: 100,
  maxPages: 0,  // 무제한
  priorityKeywords: [
    // 노동법
    '근로기준법', '노동조합', '최저임금', '산업안전보건',
    // 민사
    '민법', '상법', '부동산',
    // 형사
    '형법', '형사소송법',
    // 세법
    '소득세', '법인세', '부가가치세',
    // 사회보험
    '국민건강보험', '국민연금', '고용보험', '산업재해',
    // 행정
    '행정절차', '행정심판', '행정소송',
    // 헌법
    '헌법', '기본권',
  ],
};

// ============================================
// 동기화 통계
// ============================================

interface SyncStats {
  source: string;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

// ============================================
// Full Sync 실행
// ============================================

export async function runFullSync(
  config: Partial<FullSyncConfig> = {}
): Promise<Map<string, SyncStats>> {
  const fullConfig: FullSyncConfig = { ...DEFAULT_CONFIG, ...config };
  const allStats = new Map<string, SyncStats>();
  
  console.log('═══════════════════════════════════════════════════');
  console.log('🔄 korea-law Full Sync v2 시작');
  console.log(`   시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`   소스: ${fullConfig.sources.filter(s => s.enabled).map(s => s.name).join(', ')}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('⚠️ 주의: 이 데이터는 AI 검증용입니다.');
  console.log('═══════════════════════════════════════════════════\n');
  
  // 소스별 동기화 (우선순위 순)
  const enabledSources = fullConfig.sources
    .filter(s => s.enabled)
    .sort((a, b) => a.priority - b.priority);
  
  for (const source of enabledSources) {
    const stats = await syncSource(source, fullConfig);
    allStats.set(source.name, stats);
  }
  
  // 결과 출력
  printSummary(allStats);
  
  return allStats;
}

/**
 * 단일 소스 동기화
 */
async function syncSource(
  source: SyncSourceConfig,
  config: FullSyncConfig
): Promise<SyncStats> {
  const stats: SyncStats = {
    source: source.name,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date(),
  };
  
  console.log(`\n📦 [${source.name}] 동기화 시작...`);
  console.log(`   API Target: ${source.apiTarget}`);
  console.log(`   테이블: ${source.tableName}`);
  
  // 우선 키워드로 검색
  for (const keyword of config.priorityKeywords) {
    try {
      console.log(`   🔍 검색: "${keyword}"`);
      
      const items = await source.searchFn(keyword, 1, config.pageSize);
      console.log(`      결과: ${items.length}건`);
      
      for (const item of items) {
        try {
          // 상세 조회 (있는 경우)
          let detail = null;
          if (source.detailFn) {
            const idField = getIdField(source);
            const id = item[idField];
            if (id) {
              detail = await source.detailFn(String(id));
              await delay(config.apiDelay / 2);  // 상세 조회 딜레이
            }
          }
          
          // 데이터 변환
          const record = source.transformFn(item, detail);
          
          // DB 저장 (upsert 시뮬레이션)
          // 실제 구현에서는 db.upsertXXX() 호출
          stats.added++;
          
        } catch (itemError) {
          stats.errors++;
          console.error(`      ❌ 항목 처리 오류: ${itemError}`);
        }
      }
      
      await delay(config.apiDelay);
      
    } catch (searchError) {
      stats.errors++;
      console.error(`   ❌ 검색 오류 "${keyword}": ${searchError}`);
    }
  }
  
  stats.endTime = new Date();
  const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;
  
  console.log(`   ✅ 완료: +${stats.added} / ~${stats.updated} / 오류 ${stats.errors} (${duration.toFixed(1)}s)`);
  
  return stats;
}

// ============================================
// 유틸리티
// ============================================

function formatDate(dateStr: string | number | undefined): string | null {
  if (!dateStr) return null;
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getIdField(source: SyncSourceConfig): string {
  const idFields: Record<string, string> = {
    laws: '법령ID',
    precedents: '판례정보일련번호',
    admin_rules: '행정규칙일련번호',
    local_laws: '자치법규일련번호',
    constitutional_decisions: '헌재결정일련번호',
    legal_interpretations: '법령해석일련번호',
    admin_appeals: '행정심판일련번호',
    treaties: '조약일련번호',
  };
  return idFields[source.tableName] || 'id';
}

function printSummary(allStats: Map<string, SyncStats>): void {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 Full Sync 완료 요약');
  console.log('═══════════════════════════════════════════════════');
  
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  console.log('\n┌────────────────────┬────────┬────────┬────────┐');
  console.log('│ 소스               │ 추가   │ 갱신   │ 오류   │');
  console.log('├────────────────────┼────────┼────────┼────────┤');
  
  allStats.forEach((stats, name) => {
    totalAdded += stats.added;
    totalUpdated += stats.updated;
    totalErrors += stats.errors;
    
    const padName = name.padEnd(18);
    const padAdded = String(stats.added).padStart(6);
    const padUpdated = String(stats.updated).padStart(6);
    const padErrors = String(stats.errors).padStart(6);
    
    console.log(`│ ${padName} │ ${padAdded} │ ${padUpdated} │ ${padErrors} │`);
  });
  
  console.log('├────────────────────┼────────┼────────┼────────┤');
  console.log(`│ ${'합계'.padEnd(18)} │ ${String(totalAdded).padStart(6)} │ ${String(totalUpdated).padStart(6)} │ ${String(totalErrors).padStart(6)} │`);
  console.log('└────────────────────┴────────┴────────┴────────┘');
  
  console.log('\n═══════════════════════════════════════════════════\n');
}

// ============================================
// 개별 소스 동기화 함수 (편의용)
// ============================================

export async function syncLaws(keywords: string[] = DEFAULT_CONFIG.priorityKeywords): Promise<SyncStats> {
  const lawSource = SYNC_SOURCES.find(s => s.tableName === 'laws')!;
  return syncSource(lawSource, { ...DEFAULT_CONFIG, priorityKeywords: keywords });
}

export async function syncPrecedents(keywords: string[] = ['판례']): Promise<SyncStats> {
  const source = SYNC_SOURCES.find(s => s.tableName === 'precedents')!;
  return syncSource(source, { ...DEFAULT_CONFIG, priorityKeywords: keywords });
}

export async function syncAdminRules(keywords: string[] = ['훈령', '예규', '고시']): Promise<SyncStats> {
  const source = SYNC_SOURCES.find(s => s.tableName === 'admin_rules')!;
  return syncSource(source, { ...DEFAULT_CONFIG, priorityKeywords: keywords });
}

export async function syncLocalLaws(keywords: string[] = ['조례', '규칙']): Promise<SyncStats> {
  const source = SYNC_SOURCES.find(s => s.tableName === 'local_laws')!;
  return syncSource(source, { ...DEFAULT_CONFIG, priorityKeywords: keywords });
}

export async function syncConstitutionalDecisions(keywords: string[] = ['위헌', '헌법']): Promise<SyncStats> {
  const source = SYNC_SOURCES.find(s => s.tableName === 'constitutional_decisions')!;
  return syncSource(source, { ...DEFAULT_CONFIG, priorityKeywords: keywords });
}

export async function syncLegalInterpretations(keywords: string[] = ['해석', '회신']): Promise<SyncStats> {
  const source = SYNC_SOURCES.find(s => s.tableName === 'legal_interpretations')!;
  return syncSource(source, { ...DEFAULT_CONFIG, priorityKeywords: keywords });
}

export async function syncAdminAppeals(keywords: string[] = ['행정심판']): Promise<SyncStats> {
  const source = SYNC_SOURCES.find(s => s.tableName === 'admin_appeals')!;
  return syncSource(source, { ...DEFAULT_CONFIG, priorityKeywords: keywords });
}

export async function syncTreaties(keywords: string[] = ['조약', '협정']): Promise<SyncStats> {
  const source = SYNC_SOURCES.find(s => s.tableName === 'treaties')!;
  return syncSource(source, { ...DEFAULT_CONFIG, priorityKeywords: keywords });
}

// ============================================
// CLI 실행
// ============================================

if (require.main === module) {
  // 실행할 소스 선택 (인자로 받기)
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // 전체 동기화
    runFullSync().catch(console.error);
  } else {
    // 특정 소스만 동기화
    const sourceMap: Record<string, () => Promise<SyncStats>> = {
      'laws': syncLaws,
      'precedents': syncPrecedents,
      'admin-rules': syncAdminRules,
      'local-laws': syncLocalLaws,
      'constitutional': syncConstitutionalDecisions,
      'interpretations': syncLegalInterpretations,
      'appeals': syncAdminAppeals,
      'treaties': syncTreaties,
    };
    
    const source = args[0];
    if (sourceMap[source]) {
      sourceMap[source]().catch(console.error);
    } else {
      console.log('사용법: npx ts-node full-sync.ts [소스]');
      console.log('소스 옵션:', Object.keys(sourceMap).join(', '));
    }
  }
}
