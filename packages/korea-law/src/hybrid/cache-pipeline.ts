/**
 * korea-law: 자동 캐시 갱신 파이프라인
 *
 * 기능:
 * 1. 일일 자동 캐시 갱신 (Daily Sync 연동)
 * 2. 시행일 도래 법령 캐시 계층 승격
 * 3. 법령 변경 감지 시 실시간 캐시 무효화
 * 4. 캐시 상태 모니터링 및 알림
 */

import { getDatabase } from '../db/database';
import { cacheManager, type CacheConfig } from './cache-manager';

// ============================================
// 타입 정의
// ============================================

export interface PipelineConfig {
  // 갱신 주기
  refreshIntervalHours: number;

  // 자동 승격 설정
  autoPromoteUpcoming: boolean;
  promoteDaysBeforeEnforcement: number;

  // 캐시 무효화 설정
  invalidateOnChange: boolean;
  criticalChangeAlerts: boolean;

  // 성능 설정
  maxConcurrentRefresh: number;
  refreshBatchSize: number;
}

export interface PipelineResult {
  timestamp: string;
  duration_ms: number;

  // 갱신 결과
  refreshed: {
    hot: number;
    warm: number;
    failed: number;
  };

  // 승격 결과
  promoted: number;

  // 무효화 결과
  invalidated: number;

  // 오류
  errors: string[];

  // 알림
  alerts: PipelineAlert[];
}

export interface PipelineAlert {
  type: 'CRITICAL_CHANGE' | 'CACHE_STALE' | 'PROMOTION_DUE' | 'SYNC_FAILED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  lawName: string;
  message: string;
  actionRequired: boolean;
}

// ============================================
// 캐시 파이프라인 클래스
// ============================================

export class CachePipeline {
  private db = getDatabase();
  private config: PipelineConfig;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      refreshIntervalHours: 24,
      autoPromoteUpcoming: true,
      promoteDaysBeforeEnforcement: 7,
      invalidateOnChange: true,
      criticalChangeAlerts: true,
      maxConcurrentRefresh: 5,
      refreshBatchSize: 10,
      ...config,
    };
  }

  /**
   * 일일 캐시 갱신 파이프라인 실행
   * (GitHub Actions 또는 Cron에서 호출)
   */
  async runDailyPipeline(): Promise<PipelineResult> {
    const startTime = Date.now();
    const result: PipelineResult = {
      timestamp: new Date().toISOString(),
      duration_ms: 0,
      refreshed: { hot: 0, warm: 0, failed: 0 },
      promoted: 0,
      invalidated: 0,
      errors: [],
      alerts: [],
    };

    console.log('🔄 일일 캐시 갱신 파이프라인 시작...');

    try {
      // 1. 시행일 도래 법령 승격
      if (this.config.autoPromoteUpcoming) {
        result.promoted = await this.promoteUpcomingLaws();
        console.log(`  📌 시행일 도래 법령 승격: ${result.promoted}건`);
      }

      // 2. 변경된 법령 캐시 무효화
      if (this.config.invalidateOnChange) {
        result.invalidated = await this.invalidateChangedLaws();
        console.log(`  🗑️  변경 법령 캐시 무효화: ${result.invalidated}건`);
      }

      // 3. HOT/WARM 캐시 갱신
      const refreshResult = await cacheManager.refreshAll();
      result.refreshed = refreshResult;
      console.log(`  ✅ 캐시 갱신 완료: HOT ${refreshResult.hot}, WARM ${refreshResult.warm}, 실패 ${refreshResult.failed}`);

      // 4. 알림 생성
      result.alerts = await this.generateAlerts();

      // 5. 갱신 로그 저장
      await this.logPipelineRun(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.error(`  ❌ 파이프라인 오류: ${errorMessage}`);
    }

    result.duration_ms = Date.now() - startTime;
    console.log(`✅ 일일 캐시 갱신 파이프라인 완료 (${result.duration_ms}ms)`);

    return result;
  }

  /**
   * 시행일 도래 법령 캐시 계층 승격
   */
  private async promoteUpcomingLaws(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    let promoted = 0;

    // 오늘 시행 시작하는 법령
    const newlyEffective = this.db.prepare(`
      SELECT l.id, l.law_name
      FROM Laws l
      WHERE l.enforcement_date = ?
      AND l.status = 'PENDING'
    `).all(today) as Array<{ id: number; law_name: string }>;

    for (const law of newlyEffective) {
      try {
        // 법령 상태 업데이트
        this.db.prepare(`
          UPDATE Laws SET status = 'ACTIVE' WHERE id = ?
        `).run(law.id);

        // 캐시 갱신
        await cacheManager.refresh(law.id);
        promoted++;

        console.log(`    📌 승격: ${law.law_name}`);
      } catch (e) {
        console.error(`    ❌ 승격 실패: ${law.law_name}`);
      }
    }

    // 곧 시행될 법령 WARM 캐시에 추가
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + this.config.promoteDaysBeforeEnforcement);
    const upcomingDateStr = upcomingDate.toISOString().split('T')[0];

    const upcomingLaws = this.db.prepare(`
      SELECT l.id, l.law_name
      FROM Laws l
      LEFT JOIN Cache_Config cc ON l.id = cc.law_id
      WHERE l.enforcement_date > ?
      AND l.enforcement_date <= ?
      AND l.status = 'PENDING'
      AND cc.id IS NULL
    `).all(today, upcomingDateStr) as Array<{ id: number; law_name: string }>;

    for (const law of upcomingLaws) {
      try {
        await cacheManager.addToWarmCache(law.id, 90);
        console.log(`    🔥 WARM 캐시 추가 (시행 예정): ${law.law_name}`);
      } catch (e) {
        // 무시
      }
    }

    return promoted;
  }

  /**
   * 변경된 법령 캐시 무효화
   */
  private async invalidateChangedLaws(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    let invalidated = 0;

    // 오늘 변경 감지된 법령
    const changedLaws = this.db.prepare(`
      SELECT DISTINCT d.law_id, l.law_name
      FROM Diff_Logs d
      JOIN Laws l ON d.law_id = l.id
      JOIN Cache_Config cc ON l.id = cc.law_id
      WHERE d.detected_at = ?
    `).all(today) as Array<{ law_id: number; law_name: string }>;

    for (const law of changedLaws) {
      try {
        // 캐시 콘텐츠 무효화
        this.db.prepare(`
          UPDATE Cache_Contents
          SET is_current = FALSE
          WHERE cache_config_id IN (
            SELECT id FROM Cache_Config WHERE law_id = ?
          )
        `).run(law.law_id);

        // 캐시 갱신
        await cacheManager.refresh(law.law_id);
        invalidated++;

        console.log(`    🔄 무효화 및 갱신: ${law.law_name}`);
      } catch (e) {
        console.error(`    ❌ 무효화 실패: ${law.law_name}`);
      }
    }

    return invalidated;
  }

  /**
   * 알림 생성
   */
  private async generateAlerts(): Promise<PipelineAlert[]> {
    const alerts: PipelineAlert[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. 중요 변경 알림
    if (this.config.criticalChangeAlerts) {
      const criticalChanges = this.db.prepare(`
        SELECT l.law_name, d.diff_summary, d.warning_message
        FROM Diff_Logs d
        JOIN Laws l ON d.law_id = l.id
        WHERE d.detected_at = ?
        AND d.is_critical = TRUE
      `).all(today) as Array<{
        law_name: string;
        diff_summary: string;
        warning_message: string;
      }>;

      for (const change of criticalChanges) {
        alerts.push({
          type: 'CRITICAL_CHANGE',
          severity: 'HIGH',
          lawName: change.law_name,
          message: change.warning_message || change.diff_summary || '중요 변경 감지',
          actionRequired: true,
        });
      }
    }

    // 2. 캐시 부실화 경고
    const staleThresholdHours = this.config.refreshIntervalHours * 2;
    const staleThreshold = new Date();
    staleThreshold.setHours(staleThreshold.getHours() - staleThresholdHours);

    const staleCaches = this.db.prepare(`
      SELECT l.law_name, cc.last_refreshed_at
      FROM Cache_Config cc
      JOIN Laws l ON cc.law_id = l.id
      WHERE cc.is_active = TRUE
      AND (cc.last_refreshed_at IS NULL OR cc.last_refreshed_at < ?)
    `).all(staleThreshold.toISOString()) as Array<{
      law_name: string;
      last_refreshed_at: string | null;
    }>;

    for (const cache of staleCaches) {
      alerts.push({
        type: 'CACHE_STALE',
        severity: 'MEDIUM',
        lawName: cache.law_name,
        message: `캐시가 ${staleThresholdHours}시간 이상 갱신되지 않음`,
        actionRequired: false,
      });
    }

    // 3. 승격 예정 알림
    const promotionDue = new Date();
    promotionDue.setDate(promotionDue.getDate() + 3);

    const upcomingPromotions = this.db.prepare(`
      SELECT l.law_name, l.enforcement_date
      FROM Laws l
      WHERE l.enforcement_date > ?
      AND l.enforcement_date <= ?
      AND l.status = 'PENDING'
    `).all(today, promotionDue.toISOString().split('T')[0]) as Array<{
      law_name: string;
      enforcement_date: string;
    }>;

    for (const law of upcomingPromotions) {
      alerts.push({
        type: 'PROMOTION_DUE',
        severity: 'LOW',
        lawName: law.law_name,
        message: `${law.enforcement_date} 시행 예정 - 캐시 승격 준비 필요`,
        actionRequired: false,
      });
    }

    return alerts;
  }

  /**
   * 파이프라인 실행 로그 저장
   */
  private async logPipelineRun(result: PipelineResult): Promise<void> {
    try {
      // 테이블 존재 확인 및 생성
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS Cache_Pipeline_Log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME NOT NULL,
          duration_ms INTEGER,
          hot_refreshed INTEGER,
          warm_refreshed INTEGER,
          failed INTEGER,
          promoted INTEGER,
          invalidated INTEGER,
          errors TEXT,
          alerts TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.prepare(`
        INSERT INTO Cache_Pipeline_Log
        (timestamp, duration_ms, hot_refreshed, warm_refreshed, failed, promoted, invalidated, errors, alerts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        result.timestamp,
        result.duration_ms,
        result.refreshed.hot,
        result.refreshed.warm,
        result.refreshed.failed,
        result.promoted,
        result.invalidated,
        JSON.stringify(result.errors),
        JSON.stringify(result.alerts)
      );
    } catch (e) {
      // 로그 저장 실패 시 무시
    }
  }

  /**
   * 실시간 법령 변경 감지 핸들러
   * (daily-sync.ts에서 변경 감지 시 호출)
   */
  async onLawChanged(lawId: number, changeType: string, isCritical: boolean): Promise<void> {
    console.log(`📢 법령 변경 감지: ${lawId} (${changeType})`);

    // 캐시 대상 법령인지 확인
    const cacheConfig = this.db.prepare(`
      SELECT * FROM Cache_Config WHERE law_id = ? AND is_active = TRUE
    `).get(lawId) as CacheConfig | undefined;

    if (!cacheConfig) {
      return; // 캐시 대상 아님
    }

    // 캐시 무효화 및 갱신
    if (this.config.invalidateOnChange) {
      await cacheManager.refresh(lawId);
      console.log(`  🔄 캐시 갱신 완료`);
    }

    // 중요 변경 알림
    if (isCritical && this.config.criticalChangeAlerts) {
      const law = this.db.prepare('SELECT law_name FROM Laws WHERE id = ?')
        .get(lawId) as { law_name: string };

      console.log(`  ⚠️ 중요 변경 알림: ${law.law_name}`);
      // TODO: 웹훅/이메일 알림 연동
    }
  }

  /**
   * 특정 법령 수동 캐시 갱신
   */
  async refreshLaw(lawName: string): Promise<boolean> {
    const law = this.db.prepare(`
      SELECT l.id FROM Laws l
      JOIN Cache_Config cc ON l.id = cc.law_id
      WHERE l.law_name = ?
    `).get(lawName) as { id: number } | undefined;

    if (!law) {
      console.log(`❌ 캐시 대상 법령이 아닙니다: ${lawName}`);
      return false;
    }

    await cacheManager.refresh(law.id);
    console.log(`✅ 캐시 갱신 완료: ${lawName}`);
    return true;
  }

  /**
   * 캐시 통계 조회
   */
  getCacheStats(): {
    total: number;
    hot: number;
    warm: number;
    cold: number;
    stale: number;
    avgRefreshAge: number;
  } {
    try {
      const stats = this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN cache_tier = 'HOT' THEN 1 ELSE 0 END) as hot,
          SUM(CASE WHEN cache_tier = 'WARM' THEN 1 ELSE 0 END) as warm,
          SUM(CASE WHEN cache_tier = 'COLD' THEN 1 ELSE 0 END) as cold,
          SUM(CASE WHEN last_refreshed_at < datetime('now', '-48 hours') THEN 1 ELSE 0 END) as stale,
          AVG(julianday('now') - julianday(last_refreshed_at)) * 24 as avgRefreshAge
        FROM Cache_Config
        WHERE is_active = TRUE
      `).get() as {
        total: number;
        hot: number;
        warm: number;
        cold: number;
        stale: number;
        avgRefreshAge: number;
      };

      return {
        total: stats.total || 0,
        hot: stats.hot || 0,
        warm: stats.warm || 0,
        cold: stats.cold || 0,
        stale: stats.stale || 0,
        avgRefreshAge: Math.round(stats.avgRefreshAge || 0),
      };
    } catch (e) {
      return { total: 0, hot: 0, warm: 0, cold: 0, stale: 0, avgRefreshAge: 0 };
    }
  }

  /**
   * 최근 파이프라인 실행 이력 조회
   */
  getRecentRuns(limit: number = 10): PipelineResult[] {
    try {
      const runs = this.db.prepare(`
        SELECT * FROM Cache_Pipeline_Log
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit) as Array<{
        timestamp: string;
        duration_ms: number;
        hot_refreshed: number;
        warm_refreshed: number;
        failed: number;
        promoted: number;
        invalidated: number;
        errors: string;
        alerts: string;
      }>;

      return runs.map((r) => ({
        timestamp: r.timestamp,
        duration_ms: r.duration_ms,
        refreshed: {
          hot: r.hot_refreshed,
          warm: r.warm_refreshed,
          failed: r.failed,
        },
        promoted: r.promoted,
        invalidated: r.invalidated,
        errors: JSON.parse(r.errors || '[]'),
        alerts: JSON.parse(r.alerts || '[]'),
      }));
    } catch (e) {
      return [];
    }
  }
}

// 싱글톤 인스턴스
export const cachePipeline = new CachePipeline();

// CLI 실행용
if (require.main === module) {
  (async () => {
    console.log('🚀 캐시 파이프라인 수동 실행');
    const result = await cachePipeline.runDailyPipeline();
    console.log('\n📊 결과 요약:');
    console.log(JSON.stringify(result, null, 2));
  })();
}
