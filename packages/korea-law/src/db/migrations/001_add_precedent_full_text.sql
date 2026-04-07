-- ============================================
-- Migration: 판례 전문 컬럼 추가
-- Date: 2025-12-10
-- Purpose: 판례 내용 검증을 위한 전문 저장
-- ============================================

-- 1. 판례일련번호 추가 (API 전문 조회용)
ALTER TABLE Precedents ADD COLUMN precedent_serial_number INTEGER;

-- 2. 판시사항 (핵심 쟁점)
ALTER TABLE Precedents ADD COLUMN summary TEXT;

-- 3. 판결요지 (법원의 판단)
ALTER TABLE Precedents ADD COLUMN key_points TEXT;

-- 4. 판례 전문
ALTER TABLE Precedents ADD COLUMN full_text TEXT;

-- 5. 참조조문
ALTER TABLE Precedents ADD COLUMN referenced_statutes TEXT;

-- 6. 참조판례
ALTER TABLE Precedents ADD COLUMN referenced_cases TEXT;

-- 7. 전문 동기화 시간
ALTER TABLE Precedents ADD COLUMN full_text_synced_at DATETIME;

-- 8. 동기화 우선순위 (high/medium/low)
ALTER TABLE Precedents ADD COLUMN sync_priority TEXT DEFAULT 'medium';

-- 9. updated_at 컬럼 추가
ALTER TABLE Precedents ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 10. 전문 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_precedents_full_text_synced ON Precedents(full_text_synced_at);
CREATE INDEX IF NOT EXISTS idx_precedents_priority ON Precedents(sync_priority);
CREATE INDEX IF NOT EXISTS idx_precedents_decision_date ON Precedents(decision_date);

-- ============================================
-- 마이그레이션 완료
-- ============================================
