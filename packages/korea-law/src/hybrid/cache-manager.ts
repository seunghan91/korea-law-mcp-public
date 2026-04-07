/**
 * korea-law: CAG (Cache-Augmented Generation) 캐시 매니저
 *
 * 목적: 빈출 법령의 KV 캐시 관리 및 고속 응답 지원
 *
 * 캐시 계층:
 * - HOT: 기본 6법 (헌법, 민법, 형법, 상법, 민사소송법, 형사소송법)
 * - WARM: 빈출 법령 (근로기준법, 세법 등)
 * - COLD: 필요 시 검색
 */

import { getDatabase, type LawRecord, type ArticleRecord } from '../db/database';
import * as crypto from 'crypto';

// ============================================
// 타입 정의
// ============================================

export interface CacheConfig {
  id: number;
  law_id: number;
  priority: number;
  cache_tier: 'HOT' | 'WARM' | 'COLD';
  include_all_articles: boolean;
  included_articles: string | null;
  excluded_articles: string | null;
  access_count: number;
  last_accessed_at: string | null;
  avg_response_time_ms: number | null;
  is_active: boolean;
  preload_on_startup: boolean;
  auto_refresh: boolean;
  refresh_interval_hours: number;
  last_refreshed_at: string | null;
  next_refresh_at: string | null;
}

export interface CacheContent {
  id: number;
  cache_config_id: number;
  content_type: 'FULL_LAW' | 'SUMMARY' | 'KEY_ARTICLES' | 'DEFINITIONS';
  compiled_content: string;
  token_count: number | null;
  content_hash: string;
  valid_from: string;
  valid_until: string | null;
  metadata: string | null;
  is_current: boolean;
}

export interface TemporalMetadata {
  lawName: string;
  status: 'CURRENT' | 'UPCOMING' | 'HISTORIC';
  enforcementDate: string;
  expiryDate: string | null;
  daysUntilChange: number | null;
  upcomingChanges: UpcomingChange[];
}

export interface UpcomingChange {
  effectiveDate: string;
  changeType: string;
  summary: string;
}

export interface CompiledContext {
  content: string;
  tokenCount: number;
  temporal: TemporalMetadata;
  source: 'HOT_CACHE' | 'WARM_CACHE' | 'COLD_STORAGE' | 'REAL_TIME';
  responseTimeMs: number;
}

// ============================================
// 인메모리 캐시 (Hot/Warm Tier)
// ============================================

interface InMemoryCache {
  [lawId: number]: {
    content: CompiledContext;
    loadedAt: Date;
    expiresAt: Date;
  };
}

const hotCache: InMemoryCache = {};
const warmCache: InMemoryCache = {};

// ============================================
// 캐시 매니저 클래스
// ============================================

export class CacheManager {
  private db = getDatabase();
  private initialized = false;

  /**
   * 캐시 시스템 초기화
   * 서버 시작 시 호출하여 HOT/WARM 캐시 프리로드
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔥 CAG 캐시 시스템 초기화 중...');

    // 하이브리드 스키마 적용 확인
    this.ensureHybridSchema();

    // HOT 캐시 로드 (기본 6법)
    const hotConfigs = this.getCacheConfigs('HOT');
    for (const config of hotConfigs) {
      await this.loadToCache(config, 'HOT');
    }
    console.log(`  ✅ HOT 캐시 로드 완료: ${hotConfigs.length}개 법령`);

    // WARM 캐시 로드 (빈출 법령)
    const warmConfigs = this.getCacheConfigs('WARM');
    for (const config of warmConfigs) {
      await this.loadToCache(config, 'WARM');
    }
    console.log(`  ✅ WARM 캐시 로드 완료: ${warmConfigs.length}개 법령`);

    this.initialized = true;
    console.log('🚀 CAG 캐시 시스템 초기화 완료');
  }

  /**
   * 하이브리드 스키마 테이블 존재 확인 및 생성
   */
  private ensureHybridSchema(): void {
    // Cache_Config 테이블 존재 여부 확인
    const tableExists = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='Cache_Config'
    `).get();

    if (!tableExists) {
      console.log('  📦 하이브리드 스키마 테이블 생성 중...');
      // 스키마 파일 적용은 별도로 진행
      // 여기서는 기본 테이블만 생성
      this.createBasicCacheTables();
    }
  }

  /**
   * 기본 캐시 테이블 생성
   */
  private createBasicCacheTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS Cache_Config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        law_id INTEGER NOT NULL,
        priority INTEGER NOT NULL DEFAULT 100,
        cache_tier TEXT NOT NULL DEFAULT 'HOT',
        include_all_articles BOOLEAN DEFAULT TRUE,
        included_articles TEXT,
        excluded_articles TEXT,
        access_count INTEGER DEFAULT 0,
        last_accessed_at DATETIME,
        avg_response_time_ms INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        preload_on_startup BOOLEAN DEFAULT TRUE,
        auto_refresh BOOLEAN DEFAULT TRUE,
        refresh_interval_hours INTEGER DEFAULT 24,
        last_refreshed_at DATETIME,
        next_refresh_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE,
        UNIQUE(law_id)
      );

      CREATE TABLE IF NOT EXISTS Cache_Contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_config_id INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        compiled_content TEXT NOT NULL,
        token_count INTEGER,
        content_hash TEXT,
        valid_from DATE NOT NULL,
        valid_until DATE,
        metadata TEXT,
        is_current BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cache_config_id) REFERENCES Cache_Config(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_cache_config_tier ON Cache_Config(cache_tier);
      CREATE INDEX IF NOT EXISTS idx_cache_config_active ON Cache_Config(is_active);
      CREATE INDEX IF NOT EXISTS idx_cache_contents_current ON Cache_Contents(is_current);
    `);
  }

  /**
   * 캐시 설정 조회
   */
  getCacheConfigs(tier: 'HOT' | 'WARM' | 'COLD'): CacheConfig[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM Cache_Config
        WHERE cache_tier = ? AND is_active = TRUE
        ORDER BY priority ASC
      `);
      return stmt.all(tier) as CacheConfig[];
    } catch (e) {
      return [];
    }
  }

  /**
   * 법령을 캐시에 로드
   */
  private async loadToCache(
    config: CacheConfig,
    tier: 'HOT' | 'WARM'
  ): Promise<void> {
    const startTime = Date.now();

    // 법령 정보 조회
    const law = this.db.prepare('SELECT * FROM Laws WHERE id = ?')
      .get(config.law_id) as LawRecord | undefined;

    if (!law) return;

    // 조문 조회
    const articles = this.db.prepare(`
      SELECT * FROM Articles
      WHERE law_id = ?
      AND (effective_until IS NULL OR effective_until > DATE('now'))
      ORDER BY CAST(article_no_normalized AS INTEGER), article_no
    `).all(config.law_id) as ArticleRecord[];

    // 시간 메타데이터 생성
    const temporal = this.buildTemporalMetadata(law);

    // 컴파일된 컨텍스트 생성
    const compiledContent = this.compileContext(law, articles, temporal);

    const responseTime = Date.now() - startTime;

    const context: CompiledContext = {
      content: compiledContent,
      tokenCount: this.estimateTokenCount(compiledContent),
      temporal,
      source: tier === 'HOT' ? 'HOT_CACHE' : 'WARM_CACHE',
      responseTimeMs: responseTime,
    };

    // 인메모리 캐시에 저장
    const cache = tier === 'HOT' ? hotCache : warmCache;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + config.refresh_interval_hours);

    cache[config.law_id] = {
      content: context,
      loadedAt: new Date(),
      expiresAt,
    };

    // DB에 컴파일된 컨텐츠 저장 (영구 캐시)
    this.saveCacheContent(config.id, compiledContent, temporal);
  }

  /**
   * 시간 메타데이터 생성
   */
  private buildTemporalMetadata(law: LawRecord): TemporalMetadata {
    const today = new Date().toISOString().split('T')[0];
    const enforcementDate = law.enforcement_date;

    // 상태 결정
    let status: 'CURRENT' | 'UPCOMING' | 'HISTORIC';
    if (law.status === 'ACTIVE' && enforcementDate <= today) {
      status = 'CURRENT';
    } else if (enforcementDate > today) {
      status = 'UPCOMING';
    } else {
      status = 'HISTORIC';
    }

    // 시행 예정 변경사항 조회
    const upcomingChanges = this.getUpcomingChanges(law.id!);

    // D-Day 계산
    let daysUntilChange: number | null = null;
    if (upcomingChanges.length > 0) {
      const nextChange = new Date(upcomingChanges[0].effectiveDate);
      const todayDate = new Date(today);
      daysUntilChange = Math.ceil(
        (nextChange.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      lawName: law.law_name,
      status,
      enforcementDate,
      expiryDate: null, // TODO: 폐지 예정일 추가
      daysUntilChange,
      upcomingChanges,
    };
  }

  /**
   * 시행 예정 변경사항 조회
   */
  private getUpcomingChanges(lawId: number): UpcomingChange[] {
    try {
      const stmt = this.db.prepare(`
        SELECT effective_from as effectiveDate, change_type as changeType, diff_summary as summary
        FROM Diff_Logs
        WHERE law_id = ?
        AND effective_from > DATE('now')
        ORDER BY effective_from ASC
        LIMIT 5
      `);
      return stmt.all(lawId) as UpcomingChange[];
    } catch (e) {
      return [];
    }
  }

  /**
   * LLM 컨텍스트용 텍스트 컴파일
   */
  private compileContext(
    law: LawRecord,
    articles: ArticleRecord[],
    temporal: TemporalMetadata
  ): string {
    const parts: string[] = [];

    // 헤더: 법령 정보 + 시간 속성
    parts.push(`=== ${law.law_name} ===`);
    parts.push(`[시행 ${law.enforcement_date}] [공포 ${law.promulgation_date}]`);

    // 시간 경고 (해당하는 경우)
    if (temporal.status === 'UPCOMING') {
      parts.push(`⚠️ 주의: 이 법령은 아직 시행 전입니다. 시행일: ${law.enforcement_date}`);
    }
    if (temporal.daysUntilChange !== null && temporal.daysUntilChange <= 30) {
      parts.push(`⚠️ 주의: ${temporal.daysUntilChange}일 후 개정 시행 예정`);
    }

    parts.push('');

    // 조문 내용
    for (const article of articles) {
      const title = article.article_title
        ? `${article.article_no}(${article.article_title})`
        : article.article_no;
      parts.push(`${title}`);
      parts.push(article.content);
      parts.push('');
    }

    // 시행 예정 변경사항 추가 (있는 경우)
    if (temporal.upcomingChanges.length > 0) {
      parts.push('--- 시행 예정 변경사항 ---');
      for (const change of temporal.upcomingChanges) {
        parts.push(`[${change.effectiveDate}] ${change.changeType}: ${change.summary || '변경 예정'}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * 토큰 수 추정 (대략적)
   */
  private estimateTokenCount(text: string): number {
    // 한글 기준: 대략 1.5자 = 1토큰
    // 영어 기준: 대략 4자 = 1토큰
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const otherChars = text.length - koreanChars;

    return Math.ceil(koreanChars / 1.5 + otherChars / 4);
  }

  /**
   * 캐시 콘텐츠 DB 저장
   */
  private saveCacheContent(
    configId: number,
    content: string,
    temporal: TemporalMetadata
  ): void {
    try {
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      const today = new Date().toISOString().split('T')[0];

      // 기존 현행 콘텐츠 비활성화
      this.db.prepare(`
        UPDATE Cache_Contents SET is_current = FALSE
        WHERE cache_config_id = ? AND is_current = TRUE
      `).run(configId);

      // 새 콘텐츠 저장
      this.db.prepare(`
        INSERT INTO Cache_Contents
        (cache_config_id, content_type, compiled_content, token_count, content_hash, valid_from, metadata, is_current)
        VALUES (?, 'FULL_LAW', ?, ?, ?, ?, ?, TRUE)
      `).run(
        configId,
        content,
        this.estimateTokenCount(content),
        contentHash,
        today,
        JSON.stringify(temporal)
      );
    } catch (e) {
      // 저장 실패 시 무시 (인메모리 캐시는 정상 동작)
    }
  }

  /**
   * 캐시에서 법령 조회 (고속 응답)
   */
  async get(lawId: number): Promise<CompiledContext | null> {
    const startTime = Date.now();

    // 1. HOT 캐시 확인
    if (hotCache[lawId] && hotCache[lawId].expiresAt > new Date()) {
      this.recordAccess(lawId, Date.now() - startTime);
      return { ...hotCache[lawId].content, responseTimeMs: Date.now() - startTime };
    }

    // 2. WARM 캐시 확인
    if (warmCache[lawId] && warmCache[lawId].expiresAt > new Date()) {
      this.recordAccess(lawId, Date.now() - startTime);
      return { ...warmCache[lawId].content, responseTimeMs: Date.now() - startTime };
    }

    // 3. COLD 스토리지 (DB에서 조회)
    const cachedContent = await this.loadFromColdStorage(lawId);
    if (cachedContent) {
      return cachedContent;
    }

    return null;
  }

  /**
   * 법령명으로 캐시 조회
   */
  async getByName(lawName: string): Promise<CompiledContext | null> {
    // 법령 ID 조회
    const law = this.db.prepare(`
      SELECT id FROM Laws WHERE law_name = ? OR law_name_normalized LIKE ?
      LIMIT 1
    `).get(lawName, `%${lawName.replace(/\s+/g, '')}%`) as { id: number } | undefined;

    if (!law) return null;

    return this.get(law.id);
  }

  /**
   * COLD 스토리지에서 로드
   */
  private async loadFromColdStorage(lawId: number): Promise<CompiledContext | null> {
    const startTime = Date.now();

    try {
      // DB에서 캐시된 콘텐츠 조회
      const cached = this.db.prepare(`
        SELECT cc.* FROM Cache_Contents cc
        JOIN Cache_Config cfg ON cc.cache_config_id = cfg.id
        WHERE cfg.law_id = ? AND cc.is_current = TRUE
        LIMIT 1
      `).get(lawId) as CacheContent | undefined;

      if (cached) {
        const metadata = cached.metadata ? JSON.parse(cached.metadata) : {};
        return {
          content: cached.compiled_content,
          tokenCount: cached.token_count || this.estimateTokenCount(cached.compiled_content),
          temporal: metadata as TemporalMetadata,
          source: 'COLD_STORAGE',
          responseTimeMs: Date.now() - startTime,
        };
      }
    } catch (e) {
      // DB 오류 시 null 반환
    }

    return null;
  }

  /**
   * 접근 통계 기록
   */
  private recordAccess(lawId: number, responseTimeMs: number): void {
    try {
      this.db.prepare(`
        UPDATE Cache_Config
        SET
          access_count = access_count + 1,
          last_accessed_at = CURRENT_TIMESTAMP,
          avg_response_time_ms = COALESCE(
            (avg_response_time_ms * access_count + ?) / (access_count + 1),
            ?
          )
        WHERE law_id = ?
      `).run(responseTimeMs, responseTimeMs, lawId);
    } catch (e) {
      // 통계 기록 실패 시 무시
    }
  }

  /**
   * 특정 법령 캐시 강제 갱신
   */
  async refresh(lawId: number): Promise<void> {
    // 인메모리 캐시에서 제거
    delete hotCache[lawId];
    delete warmCache[lawId];

    // 캐시 설정 조회
    const config = this.db.prepare(`
      SELECT * FROM Cache_Config WHERE law_id = ?
    `).get(lawId) as CacheConfig | undefined;

    if (config && config.is_active) {
      await this.loadToCache(config, config.cache_tier as 'HOT' | 'WARM');
    }
  }

  /**
   * 전체 캐시 갱신 (Daily Cron용)
   */
  async refreshAll(): Promise<{ hot: number; warm: number; failed: number }> {
    let hot = 0, warm = 0, failed = 0;

    // HOT 캐시 갱신
    const hotConfigs = this.getCacheConfigs('HOT');
    for (const config of hotConfigs) {
      try {
        await this.loadToCache(config, 'HOT');
        hot++;
      } catch (e) {
        failed++;
      }
    }

    // WARM 캐시 갱신
    const warmConfigs = this.getCacheConfigs('WARM');
    for (const config of warmConfigs) {
      try {
        await this.loadToCache(config, 'WARM');
        warm++;
      } catch (e) {
        failed++;
      }
    }

    return { hot, warm, failed };
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): {
    hotCount: number;
    warmCount: number;
    totalTokens: number;
    avgResponseTime: number;
  } {
    const hotCount = Object.keys(hotCache).length;
    const warmCount = Object.keys(warmCache).length;

    let totalTokens = 0;
    let totalResponseTime = 0;
    let count = 0;

    for (const entry of Object.values(hotCache)) {
      totalTokens += entry.content.tokenCount;
      totalResponseTime += entry.content.responseTimeMs;
      count++;
    }
    for (const entry of Object.values(warmCache)) {
      totalTokens += entry.content.tokenCount;
      totalResponseTime += entry.content.responseTimeMs;
      count++;
    }

    return {
      hotCount,
      warmCount,
      totalTokens,
      avgResponseTime: count > 0 ? Math.round(totalResponseTime / count) : 0,
    };
  }

  /**
   * 시행일 도래 법령 캐시 계층 승격
   * Daily Cron에서 호출하여 Upcoming → Current 전환
   */
  async promoteUpcomingLaws(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    let promoted = 0;

    // 오늘 시행 시작하는 법령 조회
    const newlyEffective = this.db.prepare(`
      SELECT l.id, l.law_name, cc.cache_tier
      FROM Laws l
      LEFT JOIN Cache_Config cc ON l.id = cc.law_id
      WHERE l.enforcement_date = ?
      AND l.status = 'PENDING'
    `).all(today) as Array<{ id: number; law_name: string; cache_tier: string | null }>;

    for (const law of newlyEffective) {
      // 법령 상태 업데이트
      this.db.prepare(`
        UPDATE Laws SET status = 'ACTIVE' WHERE id = ?
      `).run(law.id);

      // 캐시 갱신
      if (law.cache_tier) {
        await this.refresh(law.id);
        promoted++;
        console.log(`  📌 캐시 승격: ${law.law_name}`);
      }
    }

    return promoted;
  }

  /**
   * 법령을 HOT 캐시에 추가
   */
  async addToHotCache(lawId: number, priority: number = 50): Promise<void> {
    // 캐시 설정 추가/업데이트
    this.db.prepare(`
      INSERT INTO Cache_Config (law_id, priority, cache_tier, is_active, preload_on_startup)
      VALUES (?, ?, 'HOT', TRUE, TRUE)
      ON CONFLICT(law_id) DO UPDATE SET
        cache_tier = 'HOT',
        priority = excluded.priority,
        is_active = TRUE
    `).run(lawId, priority);

    // 캐시 로드
    const config = this.db.prepare(`
      SELECT * FROM Cache_Config WHERE law_id = ?
    `).get(lawId) as CacheConfig;

    if (config) {
      await this.loadToCache(config, 'HOT');
    }
  }

  /**
   * 법령을 WARM 캐시에 추가
   */
  async addToWarmCache(lawId: number, priority: number = 100): Promise<void> {
    this.db.prepare(`
      INSERT INTO Cache_Config (law_id, priority, cache_tier, is_active, preload_on_startup)
      VALUES (?, ?, 'WARM', TRUE, TRUE)
      ON CONFLICT(law_id) DO UPDATE SET
        cache_tier = 'WARM',
        priority = excluded.priority,
        is_active = TRUE
    `).run(lawId, priority);

    const config = this.db.prepare(`
      SELECT * FROM Cache_Config WHERE law_id = ?
    `).get(lawId) as CacheConfig;

    if (config) {
      await this.loadToCache(config, 'WARM');
    }
  }
}

// 싱글톤 인스턴스
export const cacheManager = new CacheManager();
