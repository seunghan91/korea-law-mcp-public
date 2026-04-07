/**
 * korea-law: Daily Sync & Diff Engine (5-Phase Priority System)
 *
 * 매일 자정(00:00 KST) 실행되어 법령 변경사항을 우선순위별로 추적합니다.
 *
 * ⚠️ 중요: 이 동기화 데이터는 AI 검증용입니다.
 * 법적 효력의 최종 판단은 국가법령정보센터(law.go.kr)를 참조하세요.
 *
 * ============================================
 * 🎯 5-Phase Priority System
 * ============================================
 *
 * Phase 0 (시행예정 법률 발견): 무제한
 *   - efYd/efYdE 파라미터로 6개월 이내 시행 예정 법률 자동 발견
 *   - PendingLawRegistry 등록 및 Laws 테이블 동기화
 *   - 인공지능기본법 등 공포되었으나 미시행 법률 추적
 *
 * Phase 1 (Critical Laws): 60분 제한
 *   - 기본법, 주요 법령 (우선순위 10-20)
 *   - Fallback: skip
 *
 * Phase 2 (Precedent & Admin Rules): 90분 제한
 *   - 판례, 행정규칙 (우선순위 15-20)
 *   - Fallback: partial
 *
 * Phase 3 (Local Ordinance & Interpretation): 90분 제한
 *   - 지방법령, 법령해석 (우선순위 30-40)
 *   - Fallback: defer
 *
 * Phase 4 (Secondary Sources): 60분 제한
 *   - 헌법결정, 행정심판, 조약 (우선순위 50-70)
 *   - Fallback: defer
 *
 * ============================================
 * 📋 동기화 이력 (SYNC HISTORY)
 * ============================================
 *
 * [2025-12-31] Phase 0 추가 - 시행예정 법률 자동 발견
 *   - efYd/efYdE 파라미터 활용 미래 시행일 검색
 *   - PendingLawRegistry 연동
 *   - 인공지능기본법 (2026.01.22 시행) 등 사전 동기화
 *
 * [2025-12-19] 4-Phase Priority System 구현
 *   - 우선순위 기반 단계별 동기화
 *   - 동적 우선순위 계산 엔진
 *   - 실행 로깅 및 성능 추적
 *
 * [2025-12-17] 주요 법률 추가 동기화 완료
 *   - 총 법령: 141개, 총 조항: 9,771개
 *   - 추가된 법률: 헌법, 상법, 특허법, 저작권법, 상표법, 국세기본법
 */

import * as cron from 'node-cron';
import { format, subDays, parseISO } from 'date-fns';
import * as db from '../db/database';
import * as api from '../api/law-api';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// 🆕 하이브리드 엔진 캐시 파이프라인 & 사용 분석
// Dynamic import to avoid module resolution issues on some platforms
let cachePipeline: any = null;
let cacheManager: any = null;
async function loadHybridModule() {
  if (!cachePipeline) {
    try {
      const hybrid = await import('../hybrid');
      cachePipeline = hybrid.cachePipeline;
      cacheManager = hybrid.cacheManager;
    } catch (e) {
      console.warn('⚠️ Hybrid module not available:', (e as Error).message);
    }
  }
  return { cachePipeline, cacheManager };
}

// 🆕 Priority System
import { PRIORITY_SCORES, PHASE_CONFIGS, TIER1_LAWS_CONFIG, TIER1_PRECEDENT_CONFIG, TIER1_ADMIN_RULES_CONFIG } from '../config/priority-config';
import { PriorityCalculator } from './priority-calculator';

// ============================================
// 동기화 설정 (Phase-Based)
// ============================================

interface SyncConfig {
  /** Phase별 설정 */
  phases: typeof PHASE_CONFIGS;
  /** API 호출 간격 (ms) */
  apiDelay: number;
  /** 최근 n일 내 변경 법령 스캔 */
  scanDays: number;
}

const DEFAULT_CONFIG: SyncConfig = {
  phases: PHASE_CONFIGS,
  apiDelay: 500,
  scanDays: 7,
};

// ============================================
// Execution Logging Types
// ============================================

interface ExecutionLogEntry {
  run_id: string;
  phase: number;
  phase_name: string;
  start_time: Date;
  end_time?: Date;
  duration_ms?: number;
  api_calls: number;
  success_count: number;
  error_count: number;
  skipped_count: number;
  timeout_count: number;
  laws_processed: number;
  precedents_processed: number;
  admin_rules_processed: number;
  local_ordinances_processed: number;
  status: 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'TIMEOUT' | 'ERROR' | 'SKIPPED';
  error_message?: string;
  retry_count: number;
}

interface DailySyncSummary {
  sync_date: string;
  run_id: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  total_duration_ms: number;
  phases_completed: number;
  phases_failed: number;
  total_laws_synced: number;
  total_precedents_synced: number;
  total_admin_rules_synced: number;
  total_local_ordinances_synced: number;
  total_api_calls: number;
  total_errors: number;
  notes?: string;
}

// ============================================
// Diff 엔진
// ============================================

interface DiffResult {
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
  previousContent?: string;
  currentContent: string;
  summary: string;
  isCritical: boolean;
}

/**
 * 두 텍스트의 차이를 분석
 */
function calculateDiff(previous: string | null, current: string): DiffResult {
  if (!previous) {
    return {
      changeType: 'ADDED',
      currentContent: current,
      summary: '신설됨',
      isCritical: true,
    };
  }

  if (!current || current.trim() === '') {
    return {
      changeType: 'DELETED',
      previousContent: previous,
      currentContent: '',
      summary: '삭제됨',
      isCritical: true,
    };
  }

  // 내용 비교
  const prevNormalized = previous.replace(/\s+/g, '');
  const currNormalized = current.replace(/\s+/g, '');

  if (prevNormalized === currNormalized) {
    return {
      changeType: 'MODIFIED',
      previousContent: previous,
      currentContent: current,
      summary: '형식 변경 (내용 동일)',
      isCritical: false,
    };
  }

  // 중요 변경 감지 (금액, 기간, 처벌 등)
  const criticalPatterns = [
    /\d+만원/g,    // 금액
    /\d+원/g,
    /\d+일/g,      // 기간
    /\d+개월/g,
    /\d+년/g,
    /징역/g,       // 처벌
    /벌금/g,
    /과태료/g,
    /해고/g,       // 중요 키워드
    /해지/g,
  ];

  const isCritical = criticalPatterns.some(pattern => {
    const prevMatches = previous.match(pattern) || [];
    const currMatches = current.match(pattern) || [];
    return JSON.stringify(prevMatches) !== JSON.stringify(currMatches);
  });

  // 변경 요약 생성
  const summary = generateDiffSummary(previous, current);

  return {
    changeType: 'MODIFIED',
    previousContent: previous,
    currentContent: current,
    summary: summary,
    isCritical: isCritical,
  };
}

/**
 * 변경 요약 생성
 */
function generateDiffSummary(previous: string, current: string): string {
  const summaries: string[] = [];

  // 금액 변경 감지
  const prevAmounts = previous.match(/\d+(?:만)?원/g) || [];
  const currAmounts = current.match(/\d+(?:만)?원/g) || [];
  if (JSON.stringify(prevAmounts) !== JSON.stringify(currAmounts)) {
    summaries.push(`금액 변경: ${prevAmounts.join(', ')} → ${currAmounts.join(', ')}`);
  }

  // 기간 변경 감지
  const prevPeriods = previous.match(/\d+(?:일|개월|년)/g) || [];
  const currPeriods = current.match(/\d+(?:일|개월|년)/g) || [];
  if (JSON.stringify(prevPeriods) !== JSON.stringify(currPeriods)) {
    summaries.push(`기간 변경: ${prevPeriods.join(', ')} → ${currPeriods.join(', ')}`);
  }

  if (summaries.length === 0) {
    summaries.push('내용 일부 변경');
  }

  return summaries.join('; ');
}

// ============================================
// 동기화 함수
// ============================================

/**
 * 단일 법령 동기화
 */
async function syncLaw(lawName: string): Promise<{
  lawsAdded: number;
  lawsUpdated: number;
  articlesAdded: number;
  articlesUpdated: number;
  diffsDetected: number;
}> {
  const stats = {
    lawsAdded: 0,
    lawsUpdated: 0,
    articlesAdded: 0,
    articlesUpdated: 0,
    diffsDetected: 0,
  };

  try {
    console.log(`📜 동기화 중: ${lawName}`);

    // 1. API에서 법령 검색
    const searchResults = await api.searchLaws(lawName, 5);
    if (searchResults.length === 0) {
      console.log(`  ⚠️ "${lawName}" 검색 결과 없음`);
      return stats;
    }

    // 2. 가장 최신 법령 선택
    const latestLaw = searchResults[0];
    const lawDetail = await api.getLawDetail(latestLaw.법령ID);

    if (!lawDetail) {
      console.log(`  ⚠️ 상세 정보 조회 실패`);
      return stats;
    }

    // 3. 기존 DB 데이터 조회
    const existingLaw = db.findLawByName(lawName);

    // 4. 법령 마스터 저장/업데이트
    const lawRecord: db.LawRecord = {
      law_mst_id: String(lawDetail.기본정보.법령ID),
      law_name: lawDetail.기본정보.법령명_한글,
      law_name_eng: lawDetail.기본정보.법령명_영문,
      promulgation_date: formatApiDate(lawDetail.기본정보.공포일자),
      enforcement_date: formatApiDate(lawDetail.기본정보.시행일자),
      law_type: lawDetail.기본정보.법령구분명,
      ministry: lawDetail.기본정보.소관부처명,
      status: 'ACTIVE',
      source_url: `https://www.law.go.kr/법령/${encodeURIComponent(lawDetail.기본정보.법령명_한글)}`,
    };

    const lawId = db.upsertLaw(lawRecord);
    
    if (existingLaw) {
      stats.lawsUpdated++;
    } else {
      stats.lawsAdded++;
    }

    // 5. 조문 동기화 및 Diff 감지
    for (const article of lawDetail.조문) {
      // 조문여부가 '전문'이면 장/절 제목이므로 건너뛰기
      if (article.조문여부 === '전문') continue;

      // 조문번호 + 가지번호 조합: 347 + 2 = "347의2"
      const baseNo = String(article.조문번호 || '');
      const branchNo = article.조문가지번호 ? String(article.조문가지번호) : '';
      const articleNo = branchNo ? `${baseNo}의${branchNo}` : baseNo;

      // 장/절/관 제목 필터링 (조문이 아닌 것 제외)
      const rawContent = article.조문내용 || '';
      if (isChapterTitle(rawContent) || !isValidArticleNo(articleNo)) {
        continue;
      }
      
      // 조문 내용 구성 (항/호 포함)
      const content = buildFullArticleContent(article);

      // 기존 조문 조회
      const existingArticle = existingLaw 
        ? db.findArticle(existingLaw.id!, articleNo)
        : null;

      // 조문 저장
      const articleRecord: db.ArticleRecord = {
        law_id: lawId,
        article_no: articleNo,
        article_title: article.조문제목,
        content: content,
        paragraph_count: countParagraphs(article),
        is_definition: (article.조문제목 || '').includes('정의') || articleNo.includes('2'),
        effective_from: formatApiDate(lawDetail.기본정보.시행일자),
      };

      const articleId = db.upsertArticle(articleRecord);

      if (existingArticle) {
        stats.articlesUpdated++;

        // Diff 감지
        if (existingArticle.content !== content) {
          const diff = calculateDiff(existingArticle.content, content);
          
          db.insertDiffLog({
            law_id: lawId,
            article_id: articleId,
            change_type: diff.changeType,
            previous_content: diff.previousContent,
            current_content: diff.currentContent,
            diff_summary: diff.summary,
            effective_from: formatApiDate(lawDetail.기본정보.시행일자),
            is_critical: diff.isCritical,
            warning_message: diff.isCritical
              ? `⚠️ 중요 변경: ${lawDetail.기본정보.법령명_한글} ${articleNo} - ${diff.summary}`
              : undefined,
          });

          stats.diffsDetected++;
          console.log(`  📝 변경 감지: ${articleNo} - ${diff.summary}`);
        }
      } else {
        stats.articlesAdded++;
      }
    }

    console.log(`  ✅ 완료: 조문 ${stats.articlesAdded + stats.articlesUpdated}개 처리, Diff ${stats.diffsDetected}개`);

  } catch (error) {
    console.error(`  ❌ 오류: ${error}`);
  }

  return stats;
}

// ============================================
// Phase-Based Sync Executors
// ============================================

/**
 * Extract law keywords from config object
 */
function extractLawKeywords(config: typeof TIER1_LAWS_CONFIG): string[] {
  const keywords: string[] = [];
  Object.values(config).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item.keyword) {
          keywords.push(item.keyword);
        }
      });
    }
  });
  return keywords;
}

/**
 * Extract admin rule keywords from config object
 */
function extractAdminRuleKeywords(config: typeof TIER1_ADMIN_RULES_CONFIG): string[] {
  const keywords: string[] = [];
  Object.values(config).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item.keyword) {
          keywords.push(item.keyword);
        }
      });
    }
  });
  return keywords;
}

/**
 * Phase 0: 시행예정 법률 발견 및 동기화
 *
 * efYd/efYdE 파라미터를 사용하여 6개월 이내 시행 예정 법률을 발견하고
 * PendingLawRegistry에 등록 후 Laws 테이블에 동기화합니다.
 */
async function executePhase0(
  runId: string,
  config: SyncConfig,
  startTime: Date
): Promise<ExecutionLogEntry> {
  const phaseStartTime = new Date();

  const log: ExecutionLogEntry = {
    run_id: runId,
    phase: 0,
    phase_name: '시행예정 법률 발견',
    start_time: phaseStartTime,
    api_calls: 0,
    success_count: 0,
    error_count: 0,
    skipped_count: 0,
    timeout_count: 0,
    laws_processed: 0,
    precedents_processed: 0,
    admin_rules_processed: 0,
    local_ordinances_processed: 0,
    status: 'RUNNING',
    retry_count: 0,
  };

  console.log(`\n📌 Phase 0: 시행예정 법률 발견 (6개월 이내)`);

  try {
    // 1. 미래 시행 법률 검색
    const futureLaws = await api.searchFutureLaws(6);
    log.api_calls++;

    if (futureLaws.length === 0) {
      console.log('   ℹ️  새로운 시행예정 법률 없음');
      log.status = 'SUCCESS';
      log.end_time = new Date();
      log.duration_ms = log.end_time.getTime() - phaseStartTime.getTime();
      return log;
    }

    console.log(`   📋 ${futureLaws.length}건 발견, 등록 및 동기화 시작...`);

    // 2. 각 법률 처리
    for (const law of futureLaws) {
      const mstId = law.법령일련번호 || String(law.법령ID);
      const lawName = law.법령명한글;
      const enforcementDate = String(law.시행일자 || '');

      if (!mstId) {
        log.skipped_count++;
        continue;
      }

      // 이미 등록된 법률인지 확인 (Laws 테이블 or PendingLawRegistry)
      const existingInLaws = db.findLawByMstId(mstId.toString());
      const existingInPending = db.findPendingLawByMstId(mstId.toString());

      if (existingInLaws || existingInPending) {
        log.skipped_count++;
        continue;
      }

      try {
        console.log(`   🔄 ${lawName} (MST: ${mstId}, 시행일: ${enforcementDate})`);

        // 3. PendingLawRegistry에 등록
        const effDateFormatted = enforcementDate ?
          `${enforcementDate.substring(0, 4)}-${enforcementDate.substring(4, 6)}-${enforcementDate.substring(6, 8)}` :
          null;

        db.insertPendingLaw({
          mst_id: mstId.toString(),
          law_id: law.법령ID?.toString() || null,
          law_name: lawName,
          law_type: law.법령구분명 || '',
          ministry: law.소관부처명 || '',
          promulgation_date: law.공포일자 || null,
          promulgation_no: law.공포번호?.toString() || null,
          effective_date: effDateFormatted,
          registration_source: 'AUTO_DETECT',
          registration_reason: `자동 발견 (daily-sync Phase 0)`,
          registered_by: 'daily-sync',
          source_url: `https://www.law.go.kr/lsInfoP.do?lsiSeq=${mstId}`,
        });

        // 4. 상세 조회 및 Laws 테이블 동기화
        const lawDetail = await api.getLawDetailByMst(mstId);
        log.api_calls++;

        if (lawDetail) {
          // Laws 테이블에 저장
          const lawRecord: db.LawRecord = {
            law_mst_id: mstId.toString(),
            law_name: lawDetail.기본정보.법령명_한글 || lawName,
            law_name_eng: lawDetail.기본정보.법령명_영문 || '',
            promulgation_date: formatApiDate(lawDetail.기본정보.공포일자),
            enforcement_date: formatApiDate(lawDetail.기본정보.시행일자),
            law_type: lawDetail.기본정보.법령구분명,
            ministry: lawDetail.기본정보.소관부처명,
            status: 'PENDING', // 시행예정
            source_url: `https://www.law.go.kr/lsInfoP.do?lsiSeq=${mstId}`,
          };

          const lawId = db.upsertLaw(lawRecord);

          // 조문 저장
          for (const article of lawDetail.조문) {
            const articleNo = article.조문번호;
            const content = buildFullArticleContent(article);

            const articleRecord: db.ArticleRecord = {
              law_id: lawId,
              article_no: articleNo,
              article_title: article.조문제목 || '',
              content: content,
              paragraph_count: countParagraphs(article),
              is_definition: (article.조문제목 || '').includes('정의') || articleNo.includes('2'),
              effective_from: formatApiDate(lawDetail.기본정보.시행일자),
            };

            db.upsertArticle(articleRecord);
          }

          // PendingLawRegistry 상태 업데이트
          db.updatePendingLawStatus(mstId.toString(), 'SYNCED', lawId);

          log.laws_processed++;
          log.success_count++;
          console.log(`      ✅ 동기화 완료 (조문 ${lawDetail.조문.length}개)`);
        } else {
          db.updatePendingLawStatus(mstId.toString(), 'NOT_FOUND', null);
          log.error_count++;
          console.log(`      ⚠️ 상세 조회 실패`);
        }

      } catch (error) {
        log.error_count++;
        console.error(`      ❌ 오류: ${error}`);
      }

      await delay(config.apiDelay);
    }

    log.status = log.error_count === 0 ? 'SUCCESS' : 'PARTIAL';
  } catch (error) {
    log.status = 'ERROR';
    log.error_message = String(error);
    console.error(`Phase 0 오류: ${error}`);
  }

  log.end_time = new Date();
  log.duration_ms = log.end_time.getTime() - phaseStartTime.getTime();

  return log;
}

/**
 * Phase 1: Critical Laws (우선순위 10-20)
 */
async function executePhase1(
  runId: string,
  config: SyncConfig,
  startTime: Date
): Promise<ExecutionLogEntry> {
  const phaseConfig = PHASE_CONFIGS[0];
  const phaseStartTime = new Date();

  const log: ExecutionLogEntry = {
    run_id: runId,
    phase: 1,
    phase_name: phaseConfig.name,
    start_time: phaseStartTime,
    api_calls: 0,
    success_count: 0,
    error_count: 0,
    skipped_count: 0,
    timeout_count: 0,
    laws_processed: 0,
    precedents_processed: 0,
    admin_rules_processed: 0,
    local_ordinances_processed: 0,
    status: 'RUNNING',
    retry_count: 0,
  };

  console.log(`\n📌 Phase 1: ${phaseConfig.name} (제한 시간: ${phaseConfig.timeout / 60 / 1000}분)`);

  try {
    // Phase 1: Tier 1 Laws
    const laws = extractLawKeywords(TIER1_LAWS_CONFIG);
    for (const law of laws) {
      // 타임아웃 체크
      if (new Date().getTime() - phaseStartTime.getTime() > phaseConfig.timeout) {
        log.status = 'TIMEOUT';
        log.timeout_count++;
        console.log(`⏱️  Phase 1 시간 초과 (${phaseConfig.timeout / 60 / 1000}분)`);
        break;
      }

      try {
        const stats = await syncLaw(law);
        log.laws_processed += stats.lawsAdded + stats.lawsUpdated;
        log.api_calls += 1;
        if (stats.lawsAdded > 0 || stats.lawsUpdated > 0) {
          log.success_count++;
        }
      } catch (error) {
        log.error_count++;
        console.error(`❌ ${law}: ${error}`);
      }

      await delay(config.apiDelay);
    }

    if (log.status === 'RUNNING') {
      log.status = log.error_count === 0 ? 'SUCCESS' : 'PARTIAL';
    }
  } catch (error) {
    log.status = 'ERROR';
    log.error_message = String(error);
    console.error(`Phase 1 오류: ${error}`);
  }

  log.end_time = new Date();
  log.duration_ms = log.end_time.getTime() - phaseStartTime.getTime();

  return log;
}

/**
 * Phase 2: Precedent & Admin Rules (우선순위 15-20)
 */
async function executePhase2(
  runId: string,
  config: SyncConfig,
  startTime: Date
): Promise<ExecutionLogEntry> {
  const phaseConfig = PHASE_CONFIGS[1];
  const phaseStartTime = new Date();

  const log: ExecutionLogEntry = {
    run_id: runId,
    phase: 2,
    phase_name: phaseConfig.name,
    start_time: phaseStartTime,
    api_calls: 0,
    success_count: 0,
    error_count: 0,
    skipped_count: 0,
    timeout_count: 0,
    laws_processed: 0,
    precedents_processed: 0,
    admin_rules_processed: 0,
    local_ordinances_processed: 0,
    status: 'RUNNING',
    retry_count: 0,
  };

  console.log(`\n📌 Phase 2: ${phaseConfig.name} (제한 시간: ${phaseConfig.timeout / 60 / 1000}분)`);

  try {
    // Phase 2: Admin Rules
    const adminRules = extractAdminRuleKeywords(TIER1_ADMIN_RULES_CONFIG);
    for (const rule of adminRules) {
      if (new Date().getTime() - phaseStartTime.getTime() > phaseConfig.timeout) {
        log.status = 'TIMEOUT';
        log.timeout_count++;
        console.log(`⏱️  Phase 2 시간 초과`);
        break;
      }

      try {
        const results = await api.searchAdminRules(rule, 5);
        log.api_calls++;
        log.admin_rules_processed += results.length;
        if (results.length > 0) {
          log.success_count++;
        }
      } catch (error) {
        log.error_count++;
        console.error(`❌ ${rule}: ${error}`);
      }

      await delay(config.apiDelay);
    }

    if (log.status === 'RUNNING') {
      log.status = log.error_count === 0 ? 'SUCCESS' : 'PARTIAL';
    }
  } catch (error) {
    log.status = 'ERROR';
    log.error_message = String(error);
    console.error(`Phase 2 오류: ${error}`);
  }

  log.end_time = new Date();
  log.duration_ms = log.end_time.getTime() - phaseStartTime.getTime();

  return log;
}

/**
 * Phase 3: Local Ordinance & Interpretation (우선순위 30-40)
 */
async function executePhase3(
  runId: string,
  config: SyncConfig,
  startTime: Date
): Promise<ExecutionLogEntry> {
  const phaseConfig = PHASE_CONFIGS[2];
  const phaseStartTime = new Date();

  const log: ExecutionLogEntry = {
    run_id: runId,
    phase: 3,
    phase_name: phaseConfig.name,
    start_time: phaseStartTime,
    api_calls: 0,
    success_count: 0,
    error_count: 0,
    skipped_count: 0,
    timeout_count: 0,
    laws_processed: 0,
    precedents_processed: 0,
    admin_rules_processed: 0,
    local_ordinances_processed: 0,
    status: 'RUNNING',
    retry_count: 0,
  };

  console.log(`\n📌 Phase 3: ${phaseConfig.name} (제한 시간: ${phaseConfig.timeout / 60 / 1000}분)`);

  try {
    // Phase 3: Recent amendments scan
    const recentLaws = await api.getRecentlyAmendedLaws(config.scanDays);
    console.log(`   📅 최근 개정 법령 ${recentLaws.length}건 발견`);

    for (const law of recentLaws.slice(0, 10)) {
      if (new Date().getTime() - phaseStartTime.getTime() > phaseConfig.timeout) {
        log.status = 'TIMEOUT';
        log.timeout_count++;
        console.log(`⏱️  Phase 3 시간 초과`);
        break;
      }

      try {
        const stats = await syncLaw(law.법령명한글);
        log.laws_processed += stats.lawsAdded + stats.lawsUpdated;
        log.api_calls++;
        if (stats.lawsAdded > 0 || stats.lawsUpdated > 0) {
          log.success_count++;
        }
      } catch (error) {
        log.error_count++;
      }

      await delay(config.apiDelay);
    }

    if (log.status === 'RUNNING') {
      log.status = log.error_count === 0 ? 'SUCCESS' : 'PARTIAL';
    }
  } catch (error) {
    log.status = 'ERROR';
    log.error_message = String(error);
    console.error(`Phase 3 오류: ${error}`);
  }

  log.end_time = new Date();
  log.duration_ms = log.end_time.getTime() - phaseStartTime.getTime();

  return log;
}

/**
 * Phase 4: Secondary Sources (우선순위 50-70)
 */
async function executePhase4(
  runId: string,
  config: SyncConfig,
  startTime: Date
): Promise<ExecutionLogEntry> {
  const phaseConfig = PHASE_CONFIGS[3];
  const phaseStartTime = new Date();

  const log: ExecutionLogEntry = {
    run_id: runId,
    phase: 4,
    phase_name: phaseConfig.name,
    start_time: phaseStartTime,
    api_calls: 0,
    success_count: 0,
    error_count: 0,
    skipped_count: 0,
    timeout_count: 0,
    laws_processed: 0,
    precedents_processed: 0,
    admin_rules_processed: 0,
    local_ordinances_processed: 0,
    status: 'RUNNING',
    retry_count: 0,
  };

  console.log(`\n📌 Phase 4: ${phaseConfig.name} (제한 시간: ${phaseConfig.timeout / 60 / 1000}분)`);

  try {
    // Phase 4: Deferred/Optional processing
    console.log(`   💾 Phase 4는 다음 스케줄에 처리됩니다.`);
    log.status = 'SKIPPED';
    log.skipped_count = 1;
  } catch (error) {
    log.status = 'ERROR';
    log.error_message = String(error);
  }

  log.end_time = new Date();
  log.duration_ms = log.end_time.getTime() - phaseStartTime.getTime();

  return log;
}

/**
 * Insert execution log to database
 */
function insertExecutionLog(log: ExecutionLogEntry): void {
  try {
    db.insertExecutionLog({
      run_id: log.run_id,
      phase: log.phase,
      phase_name: log.phase_name,
      start_time: log.start_time,
      end_time: log.end_time,
      duration_ms: log.duration_ms,
      api_calls: log.api_calls,
      success_count: log.success_count,
      error_count: log.error_count,
      skipped_count: log.skipped_count,
      timeout_count: log.timeout_count,
      laws_processed: log.laws_processed,
      precedents_processed: log.precedents_processed,
      admin_rules_processed: log.admin_rules_processed,
      local_ordinances_processed: log.local_ordinances_processed,
      status: log.status,
      error_message: log.error_message,
      retry_count: log.retry_count,
    });
  } catch (error) {
    console.error(`⚠️  Execution log insert 실패: ${error}`);
  }
}

/**
 * 전체 동기화 실행 (4-Phase)
 */
export async function runFullSync(config: SyncConfig = DEFAULT_CONFIG): Promise<void> {
  const syncStartTime = new Date().toISOString();
  const runId = uuidv4();

  console.log('═══════════════════════════════════════════');
  console.log('🔄 korea-law Daily Sync 시작 (5-Phase)');
  console.log(`   시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`   Run ID: ${runId}`);
  console.log('═══════════════════════════════════════════');
  console.log('⚠️ 주의: 이 데이터는 AI 검증용입니다.');
  console.log('   법적 판단의 최종 근거로 사용하지 마세요.');
  console.log('═══════════════════════════════════════════');

  // DB 초기화
  db.initDatabase();

  const overallStartTime = new Date();
  const phaseLogs: ExecutionLogEntry[] = [];
  let overallStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';

  try {
    // ============================================
    // Phase 0: 시행예정 법률 발견 및 동기화
    // ============================================
    const phase0Log = await executePhase0(runId, config, overallStartTime);
    phaseLogs.push(phase0Log);
    if (phase0Log.status === 'ERROR') {
      console.log('   ⚠️ Phase 0 오류 발생, 계속 진행...');
    }

    // ============================================
    // Phase 1: Critical Laws
    // ============================================
    const phase1Log = await executePhase1(runId, config, overallStartTime);
    phaseLogs.push(phase1Log);
    if (phase1Log.status === 'ERROR' || phase1Log.status === 'TIMEOUT') {
      overallStatus = 'PARTIAL';
    }

    // ============================================
    // Phase 2: Precedent & Admin Rules
    // ============================================
    const phase2Log = await executePhase2(runId, config, overallStartTime);
    phaseLogs.push(phase2Log);
    if (phase2Log.status === 'ERROR' || phase2Log.status === 'TIMEOUT') {
      overallStatus = 'PARTIAL';
    }

    // ============================================
    // Phase 3: Local Ordinance & Interpretation
    // ============================================
    const phase3Log = await executePhase3(runId, config, overallStartTime);
    phaseLogs.push(phase3Log);
    if (phase3Log.status === 'ERROR' || phase3Log.status === 'TIMEOUT') {
      overallStatus = 'PARTIAL';
    }

    // ============================================
    // Phase 4: Secondary Sources
    // ============================================
    const phase4Log = await executePhase4(runId, config, overallStartTime);
    phaseLogs.push(phase4Log);

    // 로그 기록
    for (const log of phaseLogs) {
      insertExecutionLog(log);
    }

  } catch (error) {
    console.error(`❌ 동기화 중 오류: ${error}`);
    overallStatus = 'FAILED';
  }

  // 결과 출력 및 통계 집계
  const overallEndTime = new Date();
  const totalDurationMs = overallEndTime.getTime() - overallStartTime.getTime();

  // 통계 집계
  const totalStats = {
    lawsProcessed: 0,
    adminRulesProcessed: 0,
    totalApiCalls: 0,
    totalErrors: 0,
    phasesCompleted: 0,
    phasesFailed: 0,
  };

  for (const log of phaseLogs) {
    totalStats.lawsProcessed += log.laws_processed;
    totalStats.adminRulesProcessed += log.admin_rules_processed;
    totalStats.totalApiCalls += log.api_calls;
    totalStats.totalErrors += log.error_count;
    if (log.status === 'SUCCESS' || log.status === 'PARTIAL') {
      totalStats.phasesCompleted++;
    } else if (log.status === 'ERROR' || log.status === 'TIMEOUT') {
      totalStats.phasesFailed++;
    }
  }

  // 일일 동기화 요약 저장
  try {
    const syncDate = format(overallStartTime, 'yyyy-MM-dd');
    db.insertDailySyncSummary({
      sync_date: syncDate,
      run_id: runId,
      status: overallStatus,
      total_duration_ms: totalDurationMs,
      phases_completed: totalStats.phasesCompleted,
      phases_failed: totalStats.phasesFailed,
      total_laws_synced: totalStats.lawsProcessed,
      total_admin_rules_synced: totalStats.adminRulesProcessed,
      total_api_calls: totalStats.totalApiCalls,
      total_errors: totalStats.totalErrors,
      notes: `자동 동기화 완료 (Run ID: ${runId})`,
    });
    console.log('✅ 일일 동기화 요약 저장 완료\n');
  } catch (error) {
    console.error(`⚠️  동기화 요약 저장 실패: ${error}`);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 4-Phase 동기화 완료');
  console.log(`   총 소요 시간: ${(totalDurationMs / 1000 / 60).toFixed(2)}분`);
  console.log(`   상태: ${overallStatus}`);
  console.log(`   Run ID: ${runId}`);
  console.log('═══════════════════════════════════════════\n');

  // Phase별 결과
  console.log('📈 Phase별 결과:');
  for (const log of phaseLogs) {
    console.log(`Phase ${log.phase}: ${log.phase_name}`);
    console.log(`  상태: ${log.status}`);
    console.log(`  API 호출: ${log.api_calls}건`);
    console.log(`  성공: ${log.success_count}건`);
    console.log(`  오류: ${log.error_count}건`);
    if (log.error_message) {
      console.log(`  오류 메시지: ${log.error_message}`);
    }
    console.log(`  소요 시간: ${log.duration_ms}ms\n`);
  }

  // 종합 통계
  console.log('📊 종합 통계:');
  console.log(`  총 법령 처리: ${totalStats.lawsProcessed}건`);
  console.log(`  총 행정규칙 처리: ${totalStats.adminRulesProcessed}건`);
  console.log(`  총 API 호출: ${totalStats.totalApiCalls}건`);
  console.log(`  총 오류: ${totalStats.totalErrors}건`);
  console.log('═══════════════════════════════════════════\n');

  // ============================================
  // 🆕 하이브리드 엔진 캐시 파이프라인 실행
  // ============================================
  console.log('\n═══════════════════════════════════════════');
  console.log('🔥 하이브리드 캐시 파이프라인 실행');
  console.log('═══════════════════════════════════════════');

  try {
    // 캐시 파이프라인 실행 (시행일 도래 법령 승격, 변경 법령 캐시 갱신)
    const { cachePipeline: pipeline } = await loadHybridModule();
    if (!pipeline) {
      console.log('⚠️ 하이브리드 모듈 로드 실패 - 캐시 파이프라인 건너뜀');
    } else {
    const pipelineResult = await pipeline.runDailyPipeline();

    console.log(`   ✅ 캐시 갱신: HOT ${pipelineResult.refreshed.hot}, WARM ${pipelineResult.refreshed.warm}`);
    console.log(`   📌 시행일 도래 승격: ${pipelineResult.promoted}건`);
    console.log(`   🗑️  변경 법령 무효화: ${pipelineResult.invalidated}건`);

    if (pipelineResult.alerts.length > 0) {
      console.log(`\n   ⚠️  알림 ${pipelineResult.alerts.length}건:`);
      for (const alert of pipelineResult.alerts.slice(0, 5)) {
        console.log(`      [${alert.severity}] ${alert.lawName}: ${alert.message}`);
      }
    }

    if (pipelineResult.errors.length > 0) {
      console.log(`\n   ❌ 오류 ${pipelineResult.errors.length}건:`);
      for (const err of pipelineResult.errors) {
        console.log(`      ${err}`);
      }
    }

    console.log(`   ⏱️  파이프라인 소요 시간: ${pipelineResult.duration_ms}ms`);
    }
  } catch (error) {
    console.error(`   ❌ 캐시 파이프라인 실패: ${error}`);
  }

  console.log('═══════════════════════════════════════════\n');

  db.closeDatabase();
}

/**
 * Cron Job 스케줄링 (매일 오후 10시)
 */
export function scheduleDailySync(): void {
  // 매일 22:00 KST 실행
  cron.schedule('0 22 * * *', async () => {
    console.log('\n⏰ 스케줄된 Daily Sync 시작...\n');
    await runFullSync();
  }, {
    timezone: 'Asia/Seoul',
  });

  console.log('📆 Daily Sync 스케줄 등록됨 (매일 22:00 KST)');
}

// ============================================
// 유틸리티
// ============================================

function formatApiDate(dateStr: string | number): string {
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 장/절/관 제목인지 확인
 */
function isChapterTitle(content: string): boolean {
  const trimmed = content.trim();
  // 장/절/관/편 제목 패턴
  return /^\s*제\d+[장절관편]\s/.test(trimmed) || 
         /^\s*제\d+[장절관편]$/.test(trimmed) ||
         trimmed.length < 10 && /^제\d+[장절관편]/.test(trimmed);
}

/**
 * 유효한 조문번호인지 확인
 */
function isValidArticleNo(articleNo: string): boolean {
  // 숫자로 시작하는 조문번호만 유효
  return /^\d+/.test(articleNo);
}

/**
 * 조문 전체 내용 구성 (항/호 포함)
 */
function buildFullArticleContent(article: api.ArticleInfo): string {
  const parts: string[] = [];
  
  // 조문 본문
  const mainContent = article.조문내용 || '';
  if (mainContent.trim()) {
    parts.push(mainContent.trim());
  }
  
  // 항(paragraph) 내용 추가
  if (article.항 && Array.isArray(article.항)) {
    for (const paragraph of article.항) {
      const paragraphNo = paragraph.항번호 || '';
      const paragraphContent = paragraph.항내용 || '';
      
      if (paragraphContent.trim()) {
        parts.push(`${paragraphNo} ${paragraphContent.trim()}`);
      }
      
      // 호(subitem) 내용 추가
      if (paragraph.호 && Array.isArray(paragraph.호)) {
        for (const subitem of paragraph.호) {
          const subitemNo = subitem.호번호 || '';
          const subitemContent = subitem.호내용 || '';
          
          if (subitemContent.trim()) {
            parts.push(`  ${subitemNo} ${subitemContent.trim()}`);
          }

          // 목(sub-subitem) 내용 추가
          if (subitem.목 && Array.isArray(subitem.목)) {
            for (const mok of subitem.목) {
              const mokNo = mok.목번호 || '';
              const mokContent = mok.목내용 || '';
              if (mokContent.trim()) {
                parts.push(`    ${mokNo} ${mokContent.trim()}`);
              }
            }
          }
        }
      }
    }
  }
  
  return parts.join('\n');
}

/**
 * 항 개수 계산
 */
function countParagraphs(article: api.ArticleInfo): number {
  if (!article.항) return 1;
  return Array.isArray(article.항) ? article.항.length : 1;
}

// ============================================
// Catch-up Sync (서버 재시작 시 누락분 동기화)
// ============================================

import {
  getLastSuccessfulSync,
  calculateSyncGap,
  recordSyncMetadata,
  initSupabaseAdmin,
} from '../db/supabase';

/**
 * 서버 재시작 시 마지막 성공 동기화 이후 누락분을 보충하는 catch-up sync.
 *
 * 동작 방식:
 * 1. sync_metadata에서 마지막 성공 시점 조회
 * 2. gap 일수 계산
 * 3. gap이 1일 이하면 스킵 (정상 운영)
 * 4. gap이 2일 이상이면 해당 기간의 법령 변경사항을 날짜별로 동기화
 * 5. gap이 30일 초과면 전체 동기화(runFullSync) 권장
 *
 * @param options.dryRun true이면 실제 동기화 없이 gap만 리포트
 * @param options.forceFullAfterDays 이 일수 초과 시 전체 동기화로 전환 (기본 30)
 */
export async function catchUpSync(options: {
  dryRun?: boolean;
  forceFullAfterDays?: number;
} = {}): Promise<{
  status: 'SKIPPED' | 'CAUGHT_UP' | 'FULL_SYNC_NEEDED' | 'FULL_SYNC_RAN' | 'ERROR';
  gapDays: number;
  lastSuccessDate: string | null;
  daysSynced: number;
  lawsProcessed: number;
  errors: number;
}> {
  const { dryRun = false, forceFullAfterDays = 30 } = options;
  const result = {
    status: 'SKIPPED' as 'SKIPPED' | 'CAUGHT_UP' | 'FULL_SYNC_NEEDED' | 'FULL_SYNC_RAN' | 'ERROR',
    gapDays: 0,
    lastSuccessDate: null as string | null,
    daysSynced: 0,
    lawsProcessed: 0,
    errors: 0,
  };

  console.log('═══════════════════════════════════════════');
  console.log('🔄 Catch-up Sync 시작');
  console.log(`   시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log('═══════════════════════════════════════════');

  try {
    // Supabase 초기화
    initSupabaseAdmin();

    // 1. Gap 계산
    const gap = await calculateSyncGap();

    if (!gap) {
      console.log('⚠️  동기화 이력 없음 — 전체 동기화가 필요합니다.');
      result.status = 'FULL_SYNC_NEEDED';

      if (!dryRun) {
        console.log('🔄 전체 동기화 실행...');
        await runFullSync();
        result.status = 'FULL_SYNC_RAN';
      }
      return result;
    }

    result.gapDays = gap.gapDays;
    result.lastSuccessDate = gap.lastSuccessDate;

    console.log(`📊 동기화 Gap 분석:`);
    console.log(`   판단 기준: ${gap.source === 'sync_metadata' ? 'sync_metadata 테이블' : '실제 데이터 갱신일 (fallback)'}`);
    console.log(`   마지막 성공: ${gap.lastSuccessDate}`);
    console.log(`   Gap: ${gap.gapDays}일`);
    console.log(`   실패한 동기화: ${gap.missedSyncs}건`);

    // 2. Gap이 1일 이하면 스킵
    if (gap.gapDays <= 1) {
      console.log('✅ 동기화 최신 상태 — catch-up 불필요');
      result.status = 'SKIPPED';
      return result;
    }

    // 3. Gap이 forceFullAfterDays 초과면 전체 동기화 권장
    if (gap.gapDays > forceFullAfterDays) {
      console.log(`⚠️  ${gap.gapDays}일 gap — 전체 동기화가 필요합니다 (${forceFullAfterDays}일 초과).`);
      result.status = 'FULL_SYNC_NEEDED';

      if (!dryRun) {
        console.log('🔄 전체 동기화 실행...');
        await runFullSync();
        result.status = 'FULL_SYNC_RAN';
      }
      return result;
    }

    if (dryRun) {
      console.log(`🔍 [DRY RUN] ${gap.gapDays}일치 동기화가 필요합니다. 실행하지 않습니다.`);
      result.status = 'CAUGHT_UP';
      return result;
    }

    // 4. 날짜별 점진적 동기화
    console.log(`\n🔄 ${gap.gapDays}일치 점진적 동기화 시작...`);

    const syncStartTime = new Date().toISOString();
    const startDate = new Date(gap.lastSuccessDate);
    const today = new Date();
    let totalLaws = 0;
    let totalErrors = 0;

    // DB 초기화 (SQLite)
    db.initDatabase();

    // gap 기간 전체를 한 번에 검색 (getRecentlyAmendedLaws 활용)
    console.log(`\n📅 ${format(startDate, 'yyyy-MM-dd')} ~ ${format(today, 'yyyy-MM-dd')} 변경 법령 검색 중...`);

    try {
      const changedLaws = await api.getRecentlyAmendedLaws(gap.gapDays + 1);

      if (changedLaws.length === 0) {
        console.log('   변경사항 없음');
      } else {
        console.log(`   ${changedLaws.length}건 발견 — 순차 동기화 시작`);

        for (const law of changedLaws) {
          const lawName = law.법령명한글 || '';
          if (!lawName) continue;

          try {
            const stats = await syncLaw(lawName);
            totalLaws += stats.lawsAdded + stats.lawsUpdated;
            await delay(500); // API rate limit
          } catch (err) {
            console.error(`   ❌ ${lawName}: ${err}`);
            totalErrors++;
          }
        }

        result.daysSynced = gap.gapDays;
      }
    } catch (err) {
      console.error(`   ❌ 변경 법령 검색 실패: ${err}`);
      totalErrors++;
    }

    db.closeDatabase();

    result.lawsProcessed = totalLaws;
    result.errors = totalErrors;
    result.status = 'CAUGHT_UP';

    // 5. 동기화 메타데이터 기록
    await recordSyncMetadata({
      sync_type: 'CATCH_UP',
      started_at: syncStartTime,
      completed_at: new Date().toISOString(),
      status: totalErrors > 0 ? 'PARTIAL' : 'SUCCESS',
      laws_added: totalLaws,
      laws_updated: 0,
      articles_added: 0,
      articles_updated: 0,
      diffs_detected: 0,
      error_message: totalErrors > 0 ? `${totalErrors}건 오류 발생` : undefined,
      source_data_date: format(today, 'yyyy-MM-dd'),
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('📊 Catch-up Sync 완료');
    console.log(`   Gap: ${gap.gapDays}일 → 동기화 완료: ${result.daysSynced}일`);
    console.log(`   법령 처리: ${totalLaws}건`);
    console.log(`   오류: ${totalErrors}건`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error(`❌ Catch-up Sync 실패: ${error}`);
    result.status = 'ERROR';
    result.errors++;
  }

  return result;
}

// ============================================
// CLI 실행
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--catch-up')) {
    const dryRun = args.includes('--dry-run');
    catchUpSync({ dryRun }).then(result => {
      console.log('\n결과:', JSON.stringify(result, null, 2));
    }).catch(console.error);
  } else {
    runFullSync().catch(console.error);
  }
}

