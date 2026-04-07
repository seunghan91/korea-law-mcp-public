// @ts-nocheck
// TODO: Fix type errors to re-enable type checking
/**
 * korea-law: Comprehensive Sync Module
 *
 * 191개 법제처 Open API를 4-Phase 시스템으로 동기화
 *
 * Phase 1 (Critical): 법령 + 판례 기본 (법률, 시행령, 대법원 판례)
 * Phase 2 (Important): 확장 법령 (행정규칙, 자치법규, 헌재결정)
 * Phase 3 (Secondary): 부가 데이터 (부처해석, 위원회결정, 특별심판)
 * Phase 4 (Optional): 참고 자료 (영문법령, 조약, 체계도, 한눈보기)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  initDatabase,
  getDatabase,
  insertExecutionLog,
  insertDailySyncSummary,
} from '../db/database';

// API 모듈 imports
import {
  searchLaws,
  getLawDetail,
  searchPrecedents as searchPrecedentsBasic,
  getPrecedentDetail as getPrecedentDetailBasic,
} from '../api/law-api';

import {
  searchAdminRules,
  getAdminRuleDetail,
  searchLocalLaws,
  searchConstitutionalDecisions as searchConstitutionalDecisionsExt,
  searchLegalInterpretations as searchLegalInterpretationsExt,
  searchAdminAppeals as searchAdminAppealsExt,
  searchCommitteeDecisions,
  searchMinistryInterpretations,
  searchTreaties as searchTreatiesExt,
  searchLegalTerms,
} from '../api/extended-api';

import {
  searchEnglishLaws,
  getEnglishLawDetail,
  searchLawOverview,
  searchLawSystemDiagram,
  searchOldNewComparison,
} from '../api/comprehensive-api';

import {
  searchPrecedents,
  getPrecedentDetail,
  searchConstitutionalDecisions,
  getConstitutionalDecisionDetail,
  searchLegalInterpretations,
  getLegalInterpretationDetail,
  searchAdminAppeals,
  getAdminAppealDetail,
  searchTreaties,
  getTreatyDetail,
} from '../api/precedent-api';

// ============================================
// 타입 정의
// ============================================

interface SyncOptions {
  phases?: number[];           // 실행할 phase 목록 (기본: [1,2,3,4])
  dryRun?: boolean;            // true면 DB 저장 없이 실행
  verbose?: boolean;           // 상세 로그 출력
  maxRetries?: number;         // API 재시도 횟수
  delayBetweenCalls?: number;  // API 호출 간 딜레이 (ms)
  lawTypes?: string[];         // 동기화할 법령 유형
  limit?: number;              // 각 항목 최대 동기화 수
}

interface PhaseResult {
  phase: number;
  phaseName: string;
  status: 'success' | 'partial' | 'failed';
  startTime: Date;
  endTime: Date;
  durationMs: number;
  apiCalls: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  timeoutCount: number;
  errors: string[];
}

interface SyncResult {
  runId: string;
  status: 'success' | 'partial' | 'failed';
  startTime: Date;
  endTime: Date;
  totalDurationMs: number;
  phases: PhaseResult[];
  totalLawsSynced: number;
  totalPrecedentsSynced: number;
  totalAdminRulesSynced: number;
  totalLocalOrdinancesSynced: number;
  totalApiCalls: number;
  totalErrors: number;
}

// ============================================
// Phase 1: Critical - 법령 + 판례 기본
// ============================================

async function syncPhase1(
  runId: string,
  options: SyncOptions
): Promise<PhaseResult> {
  const startTime = new Date();
  const errors: string[] = [];
  let apiCalls = 0;
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let timeoutCount = 0;
  let lawsProcessed = 0;
  let precedentsProcessed = 0;

  const db = getDatabase();
  const delay = options.delayBetweenCalls || 200;
  const limit = options.limit || 100;

  if (options.verbose) {
    console.log('\n📋 Phase 1: Critical - 법령 + 판례 기본 동기화');
  }

  try {
    // 1.1 주요 법령 동기화
    const keywords = ['근로기준', '개인정보', '민법', '형법', '상법'];

    for (const keyword of keywords) {
      try {
        if (options.verbose) {
          console.log(`  📖 ${keyword} 관련 법령 검색 중...`);
        }

        const laws = await searchLaws(keyword, limit);
        apiCalls++;

        for (const law of laws.slice(0, limit / keywords.length)) {
          try {
            await new Promise(resolve => setTimeout(resolve, delay));

            // 법령 상세 조회
            const detail = await getLawDetail(law.법령ID);
            apiCalls++;

            if (detail && !options.dryRun) {
              // DB에 저장 로직
              const stmt = db.prepare(`
                INSERT OR REPLACE INTO Laws (
                  law_mst_id, law_name, promulgation_date, enforcement_date,
                  law_type, ministry, status, source_url, last_synced_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, CURRENT_TIMESTAMP)
              `);

              stmt.run(
                String(law.법령ID),
                detail.기본정보?.법령명_한글 || law.법령명한글,
                detail.기본정보?.공포일자 || law.공포일자,
                detail.기본정보?.시행일자 || law.시행일자,
                detail.기본정보?.법령구분명 || '',
                detail.기본정보?.소관부처명 || '',
                `https://www.law.go.kr/법령/${encodeURIComponent(law.법령명한글)}`
              );

              lawsProcessed++;
              successCount++;
            }
          } catch (e: any) {
            errorCount++;
            if (e.message?.includes('timeout')) {
              timeoutCount++;
            }
            errors.push(`법령 동기화 실패: ${law.법령명한글} - ${e.message}`);
          }
        }
      } catch (e: any) {
        errorCount++;
        errors.push(`${keyword} 검색 실패: ${e.message}`);
      }
    }

    // 1.2 대법원 판례 동기화
    if (options.verbose) {
      console.log('  ⚖️ 대법원 판례 검색 중...');
    }

    try {
      const precedents = await searchPrecedents('', { display: limit });
      apiCalls++;

      for (const prec of precedents.slice(0, limit)) {
        try {
          await new Promise(resolve => setTimeout(resolve, delay));

          const detail = await getPrecedentDetail(prec.판례일련번호);
          apiCalls++;

          if (detail && !options.dryRun) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO Precedents (
                precedent_serial_number, case_id, court, case_type,
                decision_date, case_name, summary, key_points, full_text,
                referenced_statutes, referenced_cases, exists_verified,
                last_verified_at, full_text_synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);

            stmt.run(
              prec.판례일련번호,
              prec.사건번호,
              prec.법원명 || '대법원',
              prec.사건종류명,
              prec.선고일자,
              prec.사건명,
              detail.판시사항,
              detail.판결요지,
              detail.판례내용,
              detail.참조조문,
              detail.참조판례
            );

            precedentsProcessed++;
            successCount++;
          }
        } catch (e: any) {
          errorCount++;
          if (e.message?.includes('timeout')) {
            timeoutCount++;
          }
          errors.push(`판례 동기화 실패: ${prec.사건번호} - ${e.message}`);
        }
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`판례 검색 실패: ${e.message}`);
    }

  } catch (e: any) {
    errorCount++;
    errors.push(`Phase 1 실행 오류: ${e.message}`);
  }

  const endTime = new Date();
  const result: PhaseResult = {
    phase: 1,
    phaseName: 'Critical - 법령 + 판례 기본',
    status: errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
    startTime,
    endTime,
    durationMs: endTime.getTime() - startTime.getTime(),
    apiCalls,
    successCount,
    errorCount,
    skippedCount,
    timeoutCount,
    errors,
  };

  // 실행 로그 저장
  if (!options.dryRun) {
    insertExecutionLog({
      run_id: runId,
      phase: 1,
      phase_name: result.phaseName,
      start_time: startTime,
      end_time: endTime,
      duration_ms: result.durationMs,
      api_calls: apiCalls,
      success_count: successCount,
      error_count: errorCount,
      skipped_count: skippedCount,
      timeout_count: timeoutCount,
      laws_processed: lawsProcessed,
      precedents_processed: precedentsProcessed,
      status: result.status,
      error_message: errors.length > 0 ? errors.join('\n') : undefined,
    });
  }

  return result;
}

// ============================================
// Phase 2: Important - 확장 법령
// ============================================

async function syncPhase2(
  runId: string,
  options: SyncOptions
): Promise<PhaseResult> {
  const startTime = new Date();
  const errors: string[] = [];
  let apiCalls = 0;
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let timeoutCount = 0;
  let adminRulesProcessed = 0;
  let localOrdinancesProcessed = 0;

  const db = getDatabase();
  const delay = options.delayBetweenCalls || 200;
  const limit = options.limit || 50;

  if (options.verbose) {
    console.log('\n📋 Phase 2: Important - 확장 법령 동기화');
  }

  try {
    // 2.1 행정규칙 동기화
    if (options.verbose) {
      console.log('  📜 행정규칙 검색 중...');
    }

    try {
      const adminRules = await searchAdminRules('', limit);
      apiCalls++;

      for (const rule of adminRules.slice(0, limit)) {
        try {
          await new Promise(resolve => setTimeout(resolve, delay));

          const detail = await getAdminRuleDetail(String(rule.행정규칙일련번호));
          apiCalls++;

          if (detail && !options.dryRun) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO Admin_Rules (
                rule_serial_number, rule_name, rule_type,
                ministry, issuance_date, enforcement_date,
                content, last_synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            stmt.run(
              rule.행정규칙일련번호,
              rule.행정규칙명,
              rule.행정규칙종류명,
              rule.소관부처명,
              rule.발령일자,
              rule.시행일자,
              JSON.stringify(detail)
            );

            adminRulesProcessed++;
            successCount++;
          }
        } catch (e: any) {
          errorCount++;
          if (e.message?.includes('timeout')) {
            timeoutCount++;
          }
          errors.push(`행정규칙 동기화 실패: ${rule.행정규칙명} - ${e.message}`);
        }
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`행정규칙 검색 실패: ${e.message}`);
    }

    // 2.2 자치법규 동기화
    if (options.verbose) {
      console.log('  🏛️ 자치법규 검색 중...');
    }

    try {
      const localLaws = await searchLocalLaws('', limit);
      apiCalls++;

      for (const ord of localLaws.slice(0, limit)) {
        try {
          if (!options.dryRun) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO Local_Ordinances (
                ordinance_serial_number, ordinance_name, local_government_name,
                promulgation_date, enforcement_date, content, last_synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            stmt.run(
              ord.자치법규일련번호,
              ord.자치법규명,
              ord.지자체기관명 || ord.자치단체명 || '',
              ord.공포일자,
              ord.시행일자,
              ''
            );

            localOrdinancesProcessed++;
            successCount++;
          }
        } catch (e: any) {
          errorCount++;
          if (e.message?.includes('timeout')) {
            timeoutCount++;
          }
          errors.push(`자치법규 동기화 실패: ${ord.자치법규명} - ${e.message}`);
        }
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`자치법규 검색 실패: ${e.message}`);
    }

    // 2.3 헌재 결정례 동기화
    if (options.verbose) {
      console.log('  🏛️ 헌법재판소 결정례 검색 중...');
    }

    try {
      // searchConstitutionalDecisions(query, display) - extended-api 사용
      const decisions = await searchConstitutionalDecisionsExt('', limit);
      apiCalls++;

      for (const decision of decisions.slice(0, limit)) {
        try {
          await new Promise(resolve => setTimeout(resolve, delay));

          // API 응답 필드명: 헌재결정례일련번호 (not 헌재결정일련번호)
          const serialNum = decision.헌재결정례일련번호 || decision.헌재결정일련번호;
          const detail = await getConstitutionalDecisionDetail(serialNum);
          apiCalls++;

          if (detail && !options.dryRun) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO Constitutional_Decisions (
                decision_serial_number, case_id, case_name, decision_date,
                decision_type, judgment, summary, reason,
                referenced_statutes, last_synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            stmt.run(
              serialNum,
              decision.사건번호,
              decision.사건명,
              decision.종국일자 || decision.선고일자 || '',
              detail.결정유형 || '',
              detail.주문 || '',
              detail.결정요지 || '',
              detail.이유 || '',
              ''
            );

            successCount++;
          }
        } catch (e: any) {
          errorCount++;
          errors.push(`헌재결정 동기화 실패: ${decision.사건번호} - ${e.message}`);
        }
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`헌재결정 검색 실패: ${e.message}`);
    }

  } catch (e: any) {
    errorCount++;
    errors.push(`Phase 2 실행 오류: ${e.message}`);
  }

  const endTime = new Date();
  const result: PhaseResult = {
    phase: 2,
    phaseName: 'Important - 확장 법령',
    status: errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
    startTime,
    endTime,
    durationMs: endTime.getTime() - startTime.getTime(),
    apiCalls,
    successCount,
    errorCount,
    skippedCount,
    timeoutCount,
    errors,
  };

  // 실행 로그 저장
  if (!options.dryRun) {
    insertExecutionLog({
      run_id: runId,
      phase: 2,
      phase_name: result.phaseName,
      start_time: startTime,
      end_time: endTime,
      duration_ms: result.durationMs,
      api_calls: apiCalls,
      success_count: successCount,
      error_count: errorCount,
      skipped_count: skippedCount,
      timeout_count: timeoutCount,
      admin_rules_processed: adminRulesProcessed,
      local_ordinances_processed: localOrdinancesProcessed,
      status: result.status,
      error_message: errors.length > 0 ? errors.join('\n') : undefined,
    });
  }

  return result;
}

// ============================================
// Phase 3: Secondary - 부가 데이터
// ============================================

async function syncPhase3(
  runId: string,
  options: SyncOptions
): Promise<PhaseResult> {
  const startTime = new Date();
  const errors: string[] = [];
  let apiCalls = 0;
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let timeoutCount = 0;

  const db = getDatabase();
  const delay = options.delayBetweenCalls || 300;
  const limit = options.limit || 30;

  if (options.verbose) {
    console.log('\n📋 Phase 3: Secondary - 부가 데이터 동기화');
  }

  try {
    // 3.1 법령해석례 동기화
    if (options.verbose) {
      console.log('  📚 법령해석례 검색 중...');
    }

    try {
      const interpretations = await searchLegalInterpretations('', { display: limit });
      apiCalls++;

      for (const interp of interpretations.slice(0, limit)) {
        try {
          await new Promise(resolve => setTimeout(resolve, delay));

          // API 검색 결과 필드명: 법령해석례일련번호, 안건명
          const serialNum = interp.법령해석례일련번호 || interp.법령해석일련번호;
          const detail = await getLegalInterpretationDetail(serialNum);
          apiCalls++;

          if (detail && !options.dryRun) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO Legal_Interpretations (
                interpretation_serial_number, case_name,
                reply_agency, reply_date,
                question_summary, answer, reason,
                referenced_statutes, last_synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            stmt.run(
              serialNum,
              interp.안건명 || interp.사안명 || '',
              interp.회신기관명 || '',
              interp.회신일자 || '',
              detail.질의요지 || '',
              detail.회답 || '',
              detail.이유 || '',
              ''
            );

            successCount++;
          }
        } catch (e: any) {
          errorCount++;
          errors.push(`법령해석 동기화 실패: ${interp.안건명 || interp.사안명} - ${e.message}`);
        }
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`법령해석 검색 실패: ${e.message}`);
    }

    // 3.2 행정심판례 동기화
    if (options.verbose) {
      console.log('  📋 행정심판례 검색 중...');
    }

    try {
      // API target: decc, 기본 쿼리 '행정심판'
      const appeals = await searchAdminAppeals('행정심판', { display: limit });
      apiCalls++;

      for (const appeal of appeals.slice(0, limit)) {
        try {
          await new Promise(resolve => setTimeout(resolve, delay));

          // API 필드: 행정심판재결례일련번호 (또는 행정심판일련번호 폴백)
          const serialNum = appeal.행정심판재결례일련번호 || appeal.행정심판일련번호;
          if (!serialNum || serialNum === '0') {
            if (options.verbose) {
              console.log(`    ⚠️ 일련번호 없음: ${appeal.사건명}`);
            }
            continue;
          }

          const detail = await getAdminAppealDetail(String(serialNum));
          apiCalls++;

          if (detail && !options.dryRun) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO Admin_Appeals (
                appeal_serial_number, case_id, case_name,
                decision_date, decision_result,
                summary, claim_purpose, reason,
                referenced_statutes, last_synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            stmt.run(
              String(serialNum),
              appeal.사건번호 || '',
              appeal.사건명 || '',
              // API 필드: 의결일자 (재결일자 폴백)
              appeal.의결일자 || appeal.재결일자 || '',
              // API 필드: 재결구분명 (재결결과 폴백)
              appeal.재결구분명 || detail.재결결과 || '',
              detail.재결요지 || '',
              detail.청구취지 || '',
              detail.이유 || '',
              detail.참조조문 || ''  // 주문
            );

            successCount++;
          }
        } catch (e: any) {
          errorCount++;
          errors.push(`행정심판 동기화 실패: ${appeal.사건번호 || appeal.사건명} - ${e.message}`);
        }
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`행정심판 검색 실패: ${e.message}`);
    }

    // 3.3 위원회 결정문 동기화
    // CommitteeType: privacy, monopoly, labor, financial, anticorruption, environment, human_rights, broadcasting, securities, land
    const committeeTypes: Array<'privacy' | 'monopoly' | 'labor' | 'financial' | 'anticorruption' | 'environment' | 'human_rights' | 'broadcasting' | 'securities' | 'land'> = [
      'privacy', 'monopoly', 'labor', 'financial', 'anticorruption',
      'environment', 'human_rights', 'broadcasting', 'securities', 'land'
    ];

    for (const committee of committeeTypes) {
      if (options.verbose) {
        console.log(`  🏛️ ${committee} 위원회 결정문 검색 중...`);
      }

      try {
        const decisions = await searchCommitteeDecisions(committee, '', limit);
        apiCalls++;

        for (const decision of decisions.slice(0, 10)) {
          try {
            if (!options.dryRun) {
              const stmt = db.prepare(`
                INSERT OR REPLACE INTO Committee_Decisions (
                  decision_serial_number, committee_type, committee_name,
                  case_id, case_name, decision_date, decision_type,
                  summary, last_synced_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `);

              stmt.run(
                decision.일련번호 || `${committee}_${Date.now()}`,
                committee,
                decision.위원회명 || committee,
                decision.사건번호 || '',
                decision.사건명 || '',
                decision.결정일자 || '',
                decision.결정유형 || '',
                decision.결정요지 || ''
              );

              successCount++;
            }
          } catch (e: any) {
            errorCount++;
            errors.push(`${committee} 결정 동기화 실패: ${e.message}`);
          }
        }
      } catch (e: any) {
        errorCount++;
        errors.push(`${committee} 검색 실패: ${e.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

  } catch (e: any) {
    errorCount++;
    errors.push(`Phase 3 실행 오류: ${e.message}`);
  }

  const endTime = new Date();
  const result: PhaseResult = {
    phase: 3,
    phaseName: 'Secondary - 부가 데이터',
    status: errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
    startTime,
    endTime,
    durationMs: endTime.getTime() - startTime.getTime(),
    apiCalls,
    successCount,
    errorCount,
    skippedCount,
    timeoutCount,
    errors,
  };

  // 실행 로그 저장
  if (!options.dryRun) {
    insertExecutionLog({
      run_id: runId,
      phase: 3,
      phase_name: result.phaseName,
      start_time: startTime,
      end_time: endTime,
      duration_ms: result.durationMs,
      api_calls: apiCalls,
      success_count: successCount,
      error_count: errorCount,
      skipped_count: skippedCount,
      timeout_count: timeoutCount,
      status: result.status,
      error_message: errors.length > 0 ? errors.join('\n') : undefined,
    });
  }

  return result;
}

// ============================================
// Phase 4: Optional - 참고 자료
// ============================================

async function syncPhase4(
  runId: string,
  options: SyncOptions
): Promise<PhaseResult> {
  const startTime = new Date();
  const errors: string[] = [];
  let apiCalls = 0;
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let timeoutCount = 0;

  const db = getDatabase();
  const delay = options.delayBetweenCalls || 300;
  const limit = options.limit || 20;

  if (options.verbose) {
    console.log('\n📋 Phase 4: Optional - 참고 자료 동기화');
  }

  try {
    // 4.1 영문법령 동기화
    if (options.verbose) {
      console.log('  🌐 영문법령 검색 중...');
    }

    try {
      const englishLaws = await searchEnglishLaws('law', limit);
      apiCalls++;

      for (const law of englishLaws.slice(0, limit)) {
        try {
          await new Promise(resolve => setTimeout(resolve, delay));

          const detail = await getEnglishLawDetail(String(law.법령ID));
          apiCalls++;

          if (detail && !options.dryRun) {
            // law_id가 필요하지만 Laws 테이블 참조 없이 저장
            // law_id는 0으로 설정 (나중에 업데이트 가능)
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO English_Laws (
                law_id, law_mst_id, law_name_korean,
                law_name_english, content_english, last_synced_at
              ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            stmt.run(
              0, // law_id - foreign key, 나중에 매핑 필요
              String(law.법령ID),
              law.법령명한글 || '',
              law.법령명영문 || '',
              JSON.stringify(detail)
            );

            successCount++;
          }
        } catch (e: any) {
          errorCount++;
          errors.push(`영문법령 동기화 실패: ${law.법령명영문} - ${e.message}`);
        }
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`영문법령 검색 실패: ${e.message}`);
    }

    // 4.2 조약 동기화
    if (options.verbose) {
      console.log('  🌍 조약 검색 중...');
    }

    try {
      const treaties = await searchTreaties('', limit); // 두 번째 파라미터는 number
      apiCalls++;

      for (const treaty of treaties.slice(0, limit)) {
        try {
          await new Promise(resolve => setTimeout(resolve, delay));

          const detail = await getTreatyDetail(String(treaty.조약일련번호));
          apiCalls++;

          if (detail && !options.dryRun) {
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO Treaties (
                treaty_serial_number, treaty_name, treaty_type,
                conclusion_date, effective_date, parties,
                content, last_synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            // API 검색 결과 필드 매핑: 조약구분명(type), 서명일자(conclusion)
            stmt.run(
              treaty.조약일련번호,
              treaty.조약명 || '',
              treaty.조약구분명 || treaty.조약종류명 || '',
              treaty.서명일자 || treaty.체결일자 || '',
              treaty.발효일자 || '',
              detail.당사국 || '',  // 당사국은 상세 조회에서 가져옴
              JSON.stringify(detail)
            );

            successCount++;
          }
        } catch (e: any) {
          errorCount++;
          errors.push(`조약 동기화 실패: ${treaty.조약명} - ${e.message}`);
        }
      }
    } catch (e: any) {
      errorCount++;
      errors.push(`조약 검색 실패: ${e.message}`);
    }

    // 4.3 법률용어 동기화
    if (options.verbose) {
      console.log('  📖 법률용어 검색 중...');
    }

    const termCategories = ['법률', '행정', '경제', '사회'];

    for (const category of termCategories) {
      try {
        const terms = await searchLegalTerms(category, limit);
        apiCalls++;

        for (const term of terms.slice(0, 10)) {
          try {
            if (!options.dryRun) {
              const stmt = db.prepare(`
                INSERT OR REPLACE INTO Knowledge_Base_Terms (
                  term_id, term, term_type, definition,
                  source_law, last_synced_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `);

              stmt.run(
                term.법령용어일련번호 || `${category}_${term.용어명}`,
                term.용어명,
                category,
                term.정의 || '',
                term.관련법령 || ''
              );

              successCount++;
            }
          } catch (e: any) {
            errorCount++;
            errors.push(`용어 동기화 실패: ${term.용어명} - ${e.message}`);
          }
        }
      } catch (e: any) {
        errorCount++;
        errors.push(`${category} 용어 검색 실패: ${e.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

  } catch (e: any) {
    errorCount++;
    errors.push(`Phase 4 실행 오류: ${e.message}`);
  }

  const endTime = new Date();
  const result: PhaseResult = {
    phase: 4,
    phaseName: 'Optional - 참고 자료',
    status: errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
    startTime,
    endTime,
    durationMs: endTime.getTime() - startTime.getTime(),
    apiCalls,
    successCount,
    errorCount,
    skippedCount,
    timeoutCount,
    errors,
  };

  // 실행 로그 저장
  if (!options.dryRun) {
    insertExecutionLog({
      run_id: runId,
      phase: 4,
      phase_name: result.phaseName,
      start_time: startTime,
      end_time: endTime,
      duration_ms: result.durationMs,
      api_calls: apiCalls,
      success_count: successCount,
      error_count: errorCount,
      skipped_count: skippedCount,
      timeout_count: timeoutCount,
      status: result.status,
      error_message: errors.length > 0 ? errors.join('\n') : undefined,
    });
  }

  return result;
}

// ============================================
// 메인 동기화 함수
// ============================================

/**
 * 191개 API 종합 동기화 실행
 */
export async function runComprehensiveSync(options: SyncOptions = {}): Promise<SyncResult> {
  const runId = uuidv4();
  const startTime = new Date();
  const phases: PhaseResult[] = [];

  // 기본 옵션 설정
  const opts: SyncOptions = {
    phases: options.phases || [1, 2, 3, 4],
    dryRun: options.dryRun || false,
    verbose: options.verbose || false,
    maxRetries: options.maxRetries || 3,
    delayBetweenCalls: options.delayBetweenCalls || 200,
    limit: options.limit || 100,
  };

  // DB 초기화
  initDatabase();

  console.log('🚀 korea-law: Comprehensive Sync 시작');
  console.log(`   Run ID: ${runId}`);
  console.log(`   Phases: ${opts.phases?.join(', ')}`);
  console.log(`   Dry Run: ${opts.dryRun}`);
  console.log(`   Limit per item: ${opts.limit}`);

  let totalLawsSynced = 0;
  let totalPrecedentsSynced = 0;
  let totalAdminRulesSynced = 0;
  let totalLocalOrdinancesSynced = 0;
  let totalApiCalls = 0;
  let totalErrors = 0;

  // Phase 실행
  if (opts.phases?.includes(1)) {
    const phase1Result = await syncPhase1(runId, opts);
    phases.push(phase1Result);
    totalApiCalls += phase1Result.apiCalls;
    totalErrors += phase1Result.errorCount;
    if (opts.verbose) {
      console.log(`\n✅ Phase 1 완료: ${phase1Result.status}`);
    }
  }

  if (opts.phases?.includes(2)) {
    const phase2Result = await syncPhase2(runId, opts);
    phases.push(phase2Result);
    totalApiCalls += phase2Result.apiCalls;
    totalErrors += phase2Result.errorCount;
    if (opts.verbose) {
      console.log(`\n✅ Phase 2 완료: ${phase2Result.status}`);
    }
  }

  if (opts.phases?.includes(3)) {
    const phase3Result = await syncPhase3(runId, opts);
    phases.push(phase3Result);
    totalApiCalls += phase3Result.apiCalls;
    totalErrors += phase3Result.errorCount;
    if (opts.verbose) {
      console.log(`\n✅ Phase 3 완료: ${phase3Result.status}`);
    }
  }

  if (opts.phases?.includes(4)) {
    const phase4Result = await syncPhase4(runId, opts);
    phases.push(phase4Result);
    totalApiCalls += phase4Result.apiCalls;
    totalErrors += phase4Result.errorCount;
    if (opts.verbose) {
      console.log(`\n✅ Phase 4 완료: ${phase4Result.status}`);
    }
  }

  const endTime = new Date();
  const totalDurationMs = endTime.getTime() - startTime.getTime();

  // 전체 결과 집계
  const phasesCompleted = phases.filter(p => p.status === 'success').length;
  const phasesFailed = phases.filter(p => p.status === 'failed').length;
  const overallStatus: 'success' | 'partial' | 'failed' =
    phasesFailed === phases.length ? 'failed' :
    phasesCompleted === phases.length ? 'success' : 'partial';

  // 일일 요약 저장
  if (!opts.dryRun) {
    const syncDate = startTime.toISOString().split('T')[0];
    insertDailySyncSummary({
      sync_date: syncDate,
      run_id: runId,
      status: overallStatus,
      total_duration_ms: totalDurationMs,
      phases_completed: phasesCompleted,
      phases_failed: phasesFailed,
      total_laws_synced: totalLawsSynced,
      total_precedents_synced: totalPrecedentsSynced,
      total_admin_rules_synced: totalAdminRulesSynced,
      total_local_ordinances_synced: totalLocalOrdinancesSynced,
      total_api_calls: totalApiCalls,
      total_errors: totalErrors,
      notes: `Phases executed: ${opts.phases?.join(', ')}`,
    });
  }

  console.log('\n🏁 Comprehensive Sync 완료');
  console.log(`   전체 상태: ${overallStatus}`);
  console.log(`   총 API 호출: ${totalApiCalls}`);
  console.log(`   총 오류: ${totalErrors}`);
  console.log(`   총 소요 시간: ${(totalDurationMs / 1000).toFixed(1)}초`);

  return {
    runId,
    status: overallStatus,
    startTime,
    endTime,
    totalDurationMs,
    phases,
    totalLawsSynced,
    totalPrecedentsSynced,
    totalAdminRulesSynced,
    totalLocalOrdinancesSynced,
    totalApiCalls,
    totalErrors,
  };
}

/**
 * 특정 법령만 동기화
 */
export async function syncSpecificLaw(lawId: string, options: SyncOptions = {}): Promise<void> {
  initDatabase();
  const db = getDatabase();

  console.log(`📖 법령 동기화: ${lawId}`);

  try {
    const detail = await getLawDetail(lawId);

    if (detail && !options.dryRun) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO Laws (
          law_mst_id, law_name, promulgation_date, enforcement_date,
          law_type, ministry, status, source_url, last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        lawId,
        detail.기본정보?.법령명_한글 || '',
        detail.기본정보?.공포일자 || '',
        detail.기본정보?.시행일자 || '',
        detail.기본정보?.법령구분명 || '',
        detail.기본정보?.소관부처명 || '',
        `https://www.law.go.kr/법령/${encodeURIComponent(detail.기본정보?.법령명_한글 || '')}`
      );

      console.log(`✅ 법령 동기화 완료: ${detail.기본정보?.법령명_한글}`);
    }
  } catch (e: any) {
    console.error(`❌ 법령 동기화 실패: ${e.message}`);
    throw e;
  }
}

/**
 * 특정 판례만 동기화
 */
export async function syncSpecificPrecedent(caseNumber: string, options: SyncOptions = {}): Promise<void> {
  initDatabase();
  const db = getDatabase();

  console.log(`⚖️ 판례 동기화: ${caseNumber}`);

  try {
    // 판례 검색으로 serial number 찾기
    const searchResults = await searchPrecedents(caseNumber, { display: 5 });
    const found = searchResults.find(p => p.사건번호 === caseNumber);

    if (!found) {
      throw new Error(`판례를 찾을 수 없습니다: ${caseNumber}`);
    }

    const detail = await getPrecedentDetail(found.판례일련번호);

    if (detail && !options.dryRun) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO Precedents (
          precedent_serial_number, case_id, court, case_type,
          decision_date, case_name, summary, key_points, full_text,
          referenced_statutes, referenced_cases, exists_verified,
          last_verified_at, full_text_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        found.판례일련번호,
        found.사건번호,
        found.법원명 || '대법원',
        found.사건종류명,
        found.선고일자,
        found.사건명,
        detail.판시사항,
        detail.판결요지,
        detail.판례내용,
        detail.참조조문,
        detail.참조판례
      );

      console.log(`✅ 판례 동기화 완료: ${caseNumber}`);
    }
  } catch (e: any) {
    console.error(`❌ 판례 동기화 실패: ${e.message}`);
    throw e;
  }
}

// CLI 실행 지원
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    verbose: true,
    limit: 10,
  };

  if (args.includes('--dry-run')) {
    options.dryRun = true;
  }

  const phaseArg = args.find(a => a.startsWith('--phase='));
  if (phaseArg) {
    const phaseNum = parseInt(phaseArg.split('=')[1]);
    if (phaseNum >= 1 && phaseNum <= 4) {
      options.phases = [phaseNum];
    }
  }

  const limitArg = args.find(a => a.startsWith('--limit='));
  if (limitArg) {
    options.limit = parseInt(limitArg.split('=')[1]);
  }

  runComprehensiveSync(options)
    .then(result => {
      console.log('\n📊 최종 결과:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.status === 'failed' ? 1 : 0);
    })
    .catch(err => {
      console.error('동기화 실패:', err);
      process.exit(1);
    });
}
