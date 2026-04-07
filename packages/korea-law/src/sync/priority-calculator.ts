/**
 * korea-law: Priority Calculator Module
 *
 * 각 데이터 항목의 우선순위를 계산하고 동기화 일정을 결정합니다.
 * - 기본 우선순위 (고정)
 * - 동적 우선순위 (참조도, 변경빈도, 응답시간 기반)
 * - 다음 동기화 일정 자동 계산
 */

import * as db from '../db/database';
import {
  PRIORITY_SCORES,
  SyncFrequency,
  PriorityTier,
  getTierByPriority,
  syncFrequencyToDays,
  calculateNextSync,
  TIER1_LAWS_CONFIG,
  TIER1_PRECEDENT_CONFIG,
  TIER1_ADMIN_RULES_CONFIG,
  TIER2_LOCAL_ORDINANCE_CONFIG,
  TIER2_INTERPRETATION_CONFIG,
} from '../config/priority-config';

// ============================================
// Priority Calculation Interface
// ============================================

export interface PriorityItem {
  id: string;
  dataType: string;
  entityId: string;
  entityName: string;
  basePriority: number;
  tier: PriorityTier;
  syncFrequency: SyncFrequency;
  lastSync?: Date;
  nextSync?: Date;
}

export interface DynamicPriorityFactors {
  referenceCount: number;      // 참조 횟수 (0-100점)
  changeFrequency: number;     // 변경 빈도 (0-50점)
  responseTime: number;        // API 응답시간 (0-25점)
  overdueDays: number;         // 지연된 날수 (0-50점)
}

export interface CalculatedPriority {
  basePriority: number;
  dynamicMultiplier: number;
  finalPriority: number;
  factors: DynamicPriorityFactors;
  recommendation: string;
}

// ============================================
// Priority Calculator Class
// ============================================

export class PriorityCalculator {
  /**
   * 기본 우선순위 점수로부터 Priority Item 생성
   */
  static createPriorityItem(
    dataType: string,
    entityId: string,
    entityName: string,
    basePriority: number,
    frequency: SyncFrequency,
    lastSync?: Date
  ): PriorityItem {
    const tier = getTierByPriority(basePriority);
    const nextSync = lastSync
      ? calculateNextSync(lastSync, frequency)
      : new Date();

    return {
      id: `${dataType}-${entityId}`,
      dataType,
      entityId,
      entityName,
      basePriority,
      tier,
      syncFrequency: frequency,
      lastSync,
      nextSync,
    };
  }

  /**
   * 동적 우선순위 계산 (참조도, 변경빈도, 응답시간 기반)
   */
  static calculateDynamicMultiplier(factors: DynamicPriorityFactors): number {
    // 최대 100점으로 정규화된 점수들을 0.5 ~ 2.0 배수로 변환
    const maxPoints = 100 + 50 + 25 + 50; // 225점 총합

    // 가중치 적용
    const weightedScore =
      factors.referenceCount * 0.4 +  // 40%: 참조 횟수 (중요)
      factors.changeFrequency * 0.3 + // 30%: 변경 빈도
      factors.responseTime * 0.15 +   // 15%: 응답시간 (역 가중치, 빠를수록 좋음)
      factors.overdueDays * 0.15;     // 15%: 지연 (지연될수록 우선순위 높음)

    // 0.5 ~ 2.0 범위의 배수로 변환
    const multiplier = 0.5 + (weightedScore / maxPoints) * 1.5;
    return Math.min(2.0, Math.max(0.5, multiplier)); // Clamp 0.5 ~ 2.0
  }

  /**
   * 전체 우선순위 계산
   */
  static calculatePriority(
    item: PriorityItem,
    factors: DynamicPriorityFactors
  ): CalculatedPriority {
    const dynamicMultiplier = this.calculateDynamicMultiplier(factors);
    const finalPriority = item.basePriority * dynamicMultiplier;

    // 추천사항 생성
    const recommendation = this.generateRecommendation(
      item,
      finalPriority,
      factors
    );

    return {
      basePriority: item.basePriority,
      dynamicMultiplier,
      finalPriority,
      factors,
      recommendation,
    };
  }

  /**
   * 우선순위 기반 추천사항 생성
   */
  private static generateRecommendation(
    item: PriorityItem,
    finalPriority: number,
    factors: DynamicPriorityFactors
  ): string {
    const recommendations: string[] = [];

    // 참조도 높음
    if (factors.referenceCount > 70) {
      recommendations.push(`높은 참조도(${factors.referenceCount}점): 다른 항목에서 자주 참조됨`);
    }

    // 변경 빈도 높음
    if (factors.changeFrequency > 50) {
      recommendations.push(`높은 변경빈도(${factors.changeFrequency}점): 자주 업데이트됨`);
    }

    // API 응답시간 느림
    if (factors.responseTime < 10) {
      recommendations.push(`느린 응답시간(${Math.round(factors.responseTime)}점): API 최적화 필요`);
    }

    // 지연됨
    if (factors.overdueDays > 7) {
      recommendations.push(`${factors.overdueDays}일 지연: 긴급 동기화 필요`);
    }

    // 높은 우선순위
    if (finalPriority >= 25) {
      recommendations.push(`높은 우선순위(${finalPriority.toFixed(1)}점): 우선 처리 권장`);
    }

    // 낮은 우선순위
    if (finalPriority <= 5) {
      recommendations.push(`낮은 우선순위(${finalPriority.toFixed(1)}점): 필요시 처리`);
    }

    return recommendations.join(' | ') || '정상 상태';
  }

  /**
   * 다음 동기화 일정 계산
   */
  static calculateNextSyncDate(
    lastSync: Date | null,
    frequency: SyncFrequency,
    isOverdue: boolean
  ): Date {
    if (!lastSync) {
      return new Date(); // 즉시
    }

    const nextScheduled = calculateNextSync(lastSync, frequency);
    const now = new Date();

    // 지연된 항목은 즉시 처리
    if (isOverdue && nextScheduled < now) {
      return new Date();
    }

    return nextScheduled;
  }

  /**
   * 지연 여부 판정 (overdueDays 계산)
   */
  static calculateOverdueDays(lastSync: Date | null, frequency: SyncFrequency): number {
    if (!lastSync) {
      return 999; // 한 번도 동기화되지 않음 = 매우 지연
    }

    const now = new Date();
    const expectedInterval = syncFrequencyToDays(frequency);
    const daysSinceLastSync = Math.floor(
      (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24)
    );

    const overdueDays = Math.max(0, daysSinceLastSync - expectedInterval);
    return overdueDays;
  }

  /**
   * API 응답시간 점수 계산 (역 스케일: 빠를수록 높은 점수)
   */
  static calculateResponseTimeScore(avgResponseTimeMs: number): number {
    // 500ms 이상: 0점
    // 100ms 이하: 25점
    // Linear interpolation
    if (avgResponseTimeMs >= 500) return 0;
    if (avgResponseTimeMs <= 100) return 25;

    return 25 * (1 - (avgResponseTimeMs - 100) / 400);
  }

  /**
   * 변경 빈도 점수 계산 (최근 30일 기준)
   */
  static calculateChangeFrequencyScore(changeCount: number): number {
    // 30일에 30회 이상: 50점
    // 30일에 0회: 0점
    // Linear: 변경 1회당 약 1.67점
    return Math.min(50, changeCount * 1.67);
  }

  /**
   * 참조도 점수 계산
   */
  static calculateReferenceScore(referenceCount: number): number {
    // 100회 이상: 100점
    // 0회: 0점
    // Logarithmic scale for better distribution
    return Math.min(100, Math.log(referenceCount + 1) * 30);
  }

  /**
   * 지연 점수 계산
   */
  static calculateOverdueScore(overdueDays: number): number {
    // 30일 이상 지연: 50점
    // 0일 지연: 0점
    return Math.min(50, overdueDays * 1.67);
  }

  /**
   * 동기화 일정 정렬 (우선순위 순)
   */
  static sortByPriority(
    items: PriorityItem[],
    sortByFinal: boolean = false
  ): PriorityItem[] {
    return items.sort((a, b) => {
      // Tier 우선 정렬
      const tierOrder = { TIER1: 0, TIER2: 1, TIER3: 2 };
      const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
      if (tierDiff !== 0) return tierDiff;

      // 같은 Tier내에서는 우선순위 점수로 정렬
      return b.basePriority - a.basePriority;
    });
  }

  /**
   * 데이터베이스에 우선순위 정보 저장
   */
  static async savePriorityItem(item: PriorityItem, priority: CalculatedPriority): Promise<void> {
    const database = db.getDatabase();

    try {
      database.exec(`
        INSERT OR REPLACE INTO sync_priority_tracking (
          id,
          data_type,
          entity_id,
          entity_name,
          base_priority,
          calculated_priority,
          priority_tier,
          sync_frequency,
          last_sync,
          next_sync,
          change_count,
          reference_count,
          avg_response_time_ms,
          created_at,
          updated_at
        ) VALUES (
          '${item.id}',
          '${item.dataType}',
          '${item.entityId}',
          '${item.entityName.replace(/'/g, "''")}',
          ${item.basePriority},
          ${priority.finalPriority.toFixed(2)},
          '${item.tier}',
          '${item.syncFrequency}',
          ${item.lastSync ? `'${item.lastSync.toISOString()}'` : 'NULL'},
          ${item.nextSync ? `'${item.nextSync.toISOString()}'` : 'NULL'},
          ${priority.factors.changeFrequency},
          ${priority.factors.referenceCount},
          ${Math.round(priority.factors.responseTime)},
          datetime('now'),
          datetime('now')
        )
      `);
    } catch (error) {
      console.error(`Failed to save priority item ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * 다음 동기화 대기열 조회 (우선순위 기반)
   */
  static async getNextSyncQueue(limit: number = 50): Promise<PriorityItem[]> {
    const database = db.getDatabase();

    try {
      const stmt = database.prepare(`
        SELECT * FROM sync_priority_tracking
        WHERE next_sync <= datetime('now')
        ORDER BY calculated_priority DESC
        LIMIT ${limit}
      `);

      const result = stmt.all();

      return result.map((row: any) => ({
        id: row.id,
        dataType: row.data_type,
        entityId: row.entity_id,
        entityName: row.entity_name,
        basePriority: row.base_priority,
        tier: row.priority_tier,
        syncFrequency: row.sync_frequency,
        lastSync: row.last_sync ? new Date(row.last_sync) : undefined,
        nextSync: row.next_sync ? new Date(row.next_sync) : undefined,
      }));
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      throw error;
    }
  }

  /**
   * 우선순위 통계 조회
   */
  static async getPriorityStats(): Promise<{
    tier1Count: number;
    tier2Count: number;
    tier3Count: number;
    totalCount: number;
    overduCount: number;
    avgPriority: number;
  }> {
    const database = db.getDatabase();

    try {
      const stmt = database.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN priority_tier = 'TIER1' THEN 1 ELSE 0 END) as tier1,
          SUM(CASE WHEN priority_tier = 'TIER2' THEN 1 ELSE 0 END) as tier2,
          SUM(CASE WHEN priority_tier = 'TIER3' THEN 1 ELSE 0 END) as tier3,
          SUM(CASE WHEN next_sync <= datetime('now') THEN 1 ELSE 0 END) as overdue,
          AVG(calculated_priority) as avg_priority
        FROM sync_priority_tracking
      `);

      const result = stmt.all();
      const row = result[0] as any;
      return {
        tier1Count: row?.tier1 || 0,
        tier2Count: row?.tier2 || 0,
        tier3Count: row?.tier3 || 0,
        totalCount: row?.total || 0,
        overduCount: row?.overdue || 0,
        avgPriority: row?.avg_priority || 0,
      };
    } catch (error) {
      console.error('Failed to get priority stats:', error);
      throw error;
    }
  }
}

// ============================================
// Batch Priority Initialization
// ============================================

export async function initializePriorityItems(): Promise<void> {
  console.log('📊 Initializing priority items for all data types...');

  const items: PriorityItem[] = [];

  // 1. Laws
  const allLawsConfig = [
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
  ];

  allLawsConfig.forEach(section => {
    section.forEach(law => {
      items.push(
        PriorityCalculator.createPriorityItem(
          'law',
          law.keyword,
          law.keyword,
          law.priority,
          law.frequency
        )
      );
    });
  });

  // 2. Precedents
  TIER1_PRECEDENT_CONFIG.config.keywords.forEach(prec => {
    items.push(
      PriorityCalculator.createPriorityItem(
        'precedent',
        prec.keyword,
        prec.keyword,
        prec.priority,
        'DAILY'
      )
    );
  });

  // 3. Admin Rules
  const allAdminRulesConfig = [
    TIER1_ADMIN_RULES_CONFIG.decrees,
    TIER1_ADMIN_RULES_CONFIG.ordinances,
    TIER1_ADMIN_RULES_CONFIG.notices,
  ];

  allAdminRulesConfig.forEach(section => {
    section.forEach(rule => {
      items.push(
        PriorityCalculator.createPriorityItem(
          'admin_rule',
          rule.keyword,
          rule.keyword,
          rule.priority,
          rule.frequency
        )
      );
    });
  });

  // 4. Local Ordinances
  TIER2_LOCAL_ORDINANCE_CONFIG.priorityRegions.forEach(region => {
    items.push(
      PriorityCalculator.createPriorityItem(
        'local_ordinance',
        region.region,
        `${region.region} 자치법규`,
        region.priority,
        'TWICE_WEEKLY'
      )
    );
  });

  // 5. Interpretations
  TIER2_INTERPRETATION_CONFIG.priorityAgencies.forEach(agency => {
    items.push(
      PriorityCalculator.createPriorityItem(
        'interpretation',
        agency.agency,
        `${agency.agency} 법령해석`,
        agency.priority,
        'WEEKLY'
      )
    );
  });

  // 6. Constitutional Decisions
  items.push(
    PriorityCalculator.createPriorityItem(
      'constitutional_decision',
      'all',
      '헌법재판소 결정',
      PRIORITY_SCORES.CONSTITUTIONAL_DECISION,
      'MONTHLY'
    )
  );

  // 7. Administrative Appeals
  items.push(
    PriorityCalculator.createPriorityItem(
      'administrative_appeal',
      'all',
      '행정심판 결정',
      PRIORITY_SCORES.ADMINISTRATIVE_APPEAL,
      'MONTHLY'
    )
  );

  // 8. Treaties
  items.push(
    PriorityCalculator.createPriorityItem(
      'treaty',
      'all',
      '국제조약',
      PRIORITY_SCORES.TREATY,
      'MONTHLY'
    )
  );

  // Save all items
  console.log(`✅ Saving ${items.length} priority items to database...`);
  for (const item of items) {
    const factors: DynamicPriorityFactors = {
      referenceCount: 0,
      changeFrequency: 0,
      responseTime: 0,
      overdueDays: 0,
    };
    const priority = PriorityCalculator.calculatePriority(item, factors);
    await PriorityCalculator.savePriorityItem(item, priority);
  }

  // Print summary
  const stats = await PriorityCalculator.getPriorityStats();
  console.log(`✅ Priority initialization complete!`);
  console.log(`   Total items: ${stats.totalCount}`);
  console.log(`   Tier 1: ${stats.tier1Count}`);
  console.log(`   Tier 2: ${stats.tier2Count}`);
  console.log(`   Tier 3: ${stats.tier3Count}`);
}
