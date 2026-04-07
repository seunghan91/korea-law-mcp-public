-- Migration: Add Priority Tracking Tables for Daily Sync v2
-- Purpose: Support priority-based synchronization across all data types
-- Date: 2025-12-19

-- ============================================
-- Priority Tracking Table
-- ============================================

CREATE TABLE IF NOT EXISTS sync_priority_tracking (
  id TEXT PRIMARY KEY,
  data_type VARCHAR(50) NOT NULL,        -- 'law', 'precedent', 'admin_rule', 'local_ordinance', etc.
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,

  -- Priority Information
  base_priority INT NOT NULL,            -- 기본 우선순위 (10-70)
  calculated_priority INT,               -- 계산된 현재 우선순위
  priority_tier VARCHAR(20) NOT NULL,    -- 'TIER1', 'TIER2', 'TIER3'

  -- Sync Schedule
  sync_frequency VARCHAR(50) NOT NULL,   -- 'DAILY', 'TWICE_WEEKLY', 'WEEKLY', 'TWICE_MONTHLY', 'MONTHLY'
  last_sync TIMESTAMP,
  next_sync TIMESTAMP,

  -- Change Tracking
  change_count INT DEFAULT 0,            -- 최근 30일 변경 횟수
  change_last_detected TIMESTAMP,

  -- Reference Tracking
  reference_count INT DEFAULT 0,         -- 다른 항목에서 참조 횟수
  referenced_by TEXT,                    -- JSON array of referencing entity IDs

  -- Performance Metrics
  avg_response_time_ms INT DEFAULT 0,
  last_response_time_ms INT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(data_type, entity_id)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_sync_priority_tracking_tier
  ON sync_priority_tracking(priority_tier);
CREATE INDEX IF NOT EXISTS idx_sync_priority_tracking_frequency
  ON sync_priority_tracking(sync_frequency);
CREATE INDEX IF NOT EXISTS idx_sync_priority_tracking_next_sync
  ON sync_priority_tracking(next_sync);
CREATE INDEX IF NOT EXISTS idx_sync_priority_tracking_data_type
  ON sync_priority_tracking(data_type);

-- ============================================
-- Sync Execution Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS sync_execution_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,                  -- 실행 ID (uuid로 각 sync run 식별)
  phase INT NOT NULL,                    -- Phase 1-4
  phase_name VARCHAR(100),               -- 'Critical Laws', 'Precedent & Admin Rules', etc.

  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_ms INT,                       -- 실행 시간 (ms)

  -- Statistics
  api_calls INT DEFAULT 0,               -- 총 API 호출 수
  success_count INT DEFAULT 0,           -- 성공
  error_count INT DEFAULT 0,             -- 실패
  skipped_count INT DEFAULT 0,           -- 스킵됨
  timeout_count INT DEFAULT 0,           -- 타임아웃

  -- Data Processed
  laws_processed INT DEFAULT 0,
  precedents_processed INT DEFAULT 0,
  admin_rules_processed INT DEFAULT 0,
  local_ordinances_processed INT DEFAULT 0,
  interpretations_processed INT DEFAULT 0,
  const_decisions_processed INT DEFAULT 0,
  admin_appeals_processed INT DEFAULT 0,
  treaties_processed INT DEFAULT 0,

  -- Status
  status VARCHAR(20) NOT NULL,           -- 'SUCCESS', 'PARTIAL', 'TIMEOUT', 'ERROR', 'SKIPPED'
  error_message TEXT,
  error_details TEXT,                    -- JSON 형식의 상세 에러 정보

  -- Recovery Info
  retry_count INT DEFAULT 0,
  last_retry_time TIMESTAMP,
  fallback_applied VARCHAR(50),          -- 'skip', 'defer', 'partial'

  -- Created Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_sync_execution_log_run_id
  ON sync_execution_log(run_id);
CREATE INDEX IF NOT EXISTS idx_sync_execution_log_phase
  ON sync_execution_log(phase);
CREATE INDEX IF NOT EXISTS idx_sync_execution_log_status
  ON sync_execution_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_execution_log_created_at
  ON sync_execution_log(created_at);

-- ============================================
-- Phase Performance Tracking Table
-- ============================================

CREATE TABLE IF NOT EXISTS phase_performance_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  phase INT NOT NULL,

  -- Timing Performance
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  actual_duration_ms INT,
  timeout_ms INT,
  is_timeout INT DEFAULT 0,              -- 1 if timeout occurred

  -- Resource Usage
  api_calls_made INT DEFAULT 0,
  api_calls_limit INT DEFAULT 0,
  memory_usage_mb REAL,

  -- Fallback Information
  fallback_reason VARCHAR(255),
  fallback_strategy VARCHAR(50),         -- 'skip', 'defer', 'partial'
  items_deferred INT DEFAULT 0,
  items_skipped INT DEFAULT 0,

  -- Next Action
  next_phase_recommended INT,            -- 다음 phase 추천

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phase_performance_run_id
  ON phase_performance_tracking(run_id);
CREATE INDEX IF NOT EXISTS idx_phase_performance_phase
  ON phase_performance_tracking(phase);

-- ============================================
-- Daily Sync Summary Table
-- ============================================

CREATE TABLE IF NOT EXISTS sync_summary_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_date DATE NOT NULL UNIQUE,
  run_id TEXT NOT NULL,

  -- Overall Status
  status VARCHAR(20) NOT NULL,           -- 'SUCCESS', 'PARTIAL', 'FAILED'
  total_duration_ms INT,

  -- Phase Information
  phases_completed INT,                  -- 1-4
  phases_failed INT,

  -- Data Totals
  total_laws_synced INT DEFAULT 0,
  total_precedents_synced INT DEFAULT 0,
  total_admin_rules_synced INT DEFAULT 0,
  total_local_ordinances_synced INT DEFAULT 0,
  total_interpretations_synced INT DEFAULT 0,
  total_const_decisions_synced INT DEFAULT 0,
  total_admin_appeals_synced INT DEFAULT 0,
  total_treaties_synced INT DEFAULT 0,

  -- Error Summary
  total_api_calls INT DEFAULT 0,
  total_errors INT DEFAULT 0,
  error_summary TEXT,                    -- JSON format error breakdown

  -- Performance Metrics
  avg_response_time_ms INT DEFAULT 0,
  slowest_api_call_ms INT DEFAULT 0,
  fastest_api_call_ms INT DEFAULT 0,

  -- Data Quality
  duplicate_detection_count INT DEFAULT 0,
  validation_errors INT DEFAULT 0,

  -- Notes
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_summary_daily_date
  ON sync_summary_daily(sync_date);
CREATE INDEX IF NOT EXISTS idx_sync_summary_daily_run_id
  ON sync_summary_daily(run_id);
CREATE INDEX IF NOT EXISTS idx_sync_summary_daily_status
  ON sync_summary_daily(status);

-- ============================================
-- Migration Status Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_ms INT,
  status VARCHAR(20) DEFAULT 'SUCCESS'   -- 'SUCCESS', 'FAILED', 'ROLLED_BACK'
);

-- Insert this migration
INSERT OR IGNORE INTO schema_migrations (migration_name, status)
VALUES ('001_add_priority_tracking', 'SUCCESS');

-- ============================================
-- Views for Easy Analysis
-- ============================================

CREATE VIEW IF NOT EXISTS v_priority_items_by_tier AS
SELECT
  data_type,
  priority_tier,
  sync_frequency,
  COUNT(*) as item_count,
  MIN(calculated_priority) as min_priority,
  MAX(calculated_priority) as max_priority,
  AVG(calculated_priority) as avg_priority,
  MAX(last_sync) as last_sync_date,
  COUNT(CASE WHEN next_sync < datetime('now') THEN 1 END) as overdue_count
FROM sync_priority_tracking
GROUP BY data_type, priority_tier, sync_frequency;

CREATE VIEW IF NOT EXISTS v_recent_sync_performance AS
SELECT
  phase,
  phase_name,
  COUNT(*) as execution_count,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_count,
  SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) as error_count,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  AVG(api_calls) as avg_api_calls
FROM sync_execution_log
WHERE created_at > datetime('now', '-30 days')
GROUP BY phase, phase_name;

-- ============================================
-- End of Migration
-- ============================================
