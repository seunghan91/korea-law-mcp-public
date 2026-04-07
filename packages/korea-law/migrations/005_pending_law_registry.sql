-- ============================================
-- 시행예정/폐지예정 법률 등록 및 추적 시스템
--
-- 목적:
-- 1. lawSearch API에서 검색되지 않는 시행 예정 법률을 MST로 수동/자동 등록
-- 2. 폐지 예정 법률을 추적하여 계약 검토 시 경고
-- 3. 개정 예정 법률의 변경사항 미리 파악
--
-- API 조회 방법:
-- - 시행예정: efYd 파라미터에 미래 날짜 설정 또는 MST로 직접 조회
-- - 폐지예정: 신규 법률의 부칙에서 폐지 조항 파싱
-- ============================================

-- 시행예정 법률 등록 테이블
CREATE TABLE IF NOT EXISTS PendingLawRegistry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 법령 식별자 (lawService API 조회용)
    mst_id TEXT UNIQUE NOT NULL,            -- 법령일련번호 (MST 파라미터)
    law_id TEXT,                            -- 법령ID (조회 후 저장)

    -- 기본 정보 (등록 시 입력 또는 조회 후 자동 갱신)
    law_name TEXT,                          -- 법령명
    law_name_abbreviated TEXT,              -- 약칭
    law_type TEXT,                          -- 법률/시행령/시행규칙
    ministry TEXT,                          -- 소관부처

    -- 시간 정보
    promulgation_date DATE,                 -- 공포일
    promulgation_no TEXT,                   -- 공포번호
    effective_date DATE NOT NULL,           -- 시행 예정일

    -- 등록 정보
    registration_source TEXT NOT NULL,      -- 'MANUAL', 'AUTO_DETECT', 'IMPORT'
    registration_reason TEXT,               -- 등록 사유 (예: "인공지능 규제 대응")
    registered_by TEXT,                     -- 등록자 (사용자 또는 시스템)

    -- 동기화 상태
    sync_status TEXT DEFAULT 'PENDING',     -- 'PENDING', 'SYNCED', 'FAILED', 'NOT_FOUND'
    last_sync_attempt DATETIME,
    sync_error_message TEXT,
    synced_law_id INTEGER,                  -- 동기화된 Laws 테이블 ID (FK)

    -- 알림 설정
    notify_before_days INTEGER DEFAULT 30,  -- 시행 n일 전 알림
    notification_sent BOOLEAN DEFAULT FALSE,

    -- 메타데이터
    source_url TEXT,                        -- 국가법령정보센터 URL
    notes TEXT,                             -- 메모
    tags TEXT,                              -- JSON 배열: ["AI", "규제", "신산업"]

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (synced_law_id) REFERENCES Laws(id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_pending_registry_mst ON PendingLawRegistry(mst_id);
CREATE INDEX IF NOT EXISTS idx_pending_registry_effective ON PendingLawRegistry(effective_date);
CREATE INDEX IF NOT EXISTS idx_pending_registry_status ON PendingLawRegistry(sync_status);
CREATE INDEX IF NOT EXISTS idx_pending_registry_source ON PendingLawRegistry(registration_source);

-- 시행예정 법률 뷰 (동기화 대상)
CREATE VIEW IF NOT EXISTS v_pending_laws_to_sync AS
SELECT
    plr.*,
    julianday(plr.effective_date) - julianday('now') as days_until_effective,
    CASE
        WHEN plr.sync_status = 'SYNCED' THEN '동기화 완료'
        WHEN plr.sync_status = 'FAILED' THEN '동기화 실패'
        WHEN plr.sync_status = 'NOT_FOUND' THEN 'API에서 찾을 수 없음'
        ELSE '동기화 대기'
    END as sync_status_text
FROM PendingLawRegistry plr
WHERE plr.effective_date > DATE('now')  -- 아직 시행 전인 법률만
ORDER BY plr.effective_date ASC;

-- 곧 시행될 법률 뷰 (알림용)
CREATE VIEW IF NOT EXISTS v_upcoming_effective_laws AS
SELECT
    plr.*,
    l.id as laws_table_id,
    l.law_name as synced_law_name,
    julianday(plr.effective_date) - julianday('now') as days_until_effective
FROM PendingLawRegistry plr
LEFT JOIN Laws l ON plr.synced_law_id = l.id
WHERE plr.effective_date > DATE('now')
  AND plr.effective_date <= DATE('now', '+' || plr.notify_before_days || ' days')
  AND plr.notification_sent = FALSE
ORDER BY plr.effective_date ASC;

-- 시행예정 법률 변경 이력 테이블
CREATE TABLE IF NOT EXISTS PendingLawHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registry_id INTEGER NOT NULL,

    change_type TEXT NOT NULL,              -- 'REGISTERED', 'UPDATED', 'SYNCED', 'EFFECTIVE', 'DELETED'
    change_detail TEXT,                     -- JSON: 변경 내용 상세

    previous_status TEXT,
    new_status TEXT,

    changed_by TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (registry_id) REFERENCES PendingLawRegistry(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pending_history_registry ON PendingLawHistory(registry_id);
CREATE INDEX IF NOT EXISTS idx_pending_history_type ON PendingLawHistory(change_type);

-- 초기 데이터: 인공지능기본법 등록
INSERT OR IGNORE INTO PendingLawRegistry (
    mst_id,
    law_id,
    law_name,
    law_name_abbreviated,
    law_type,
    ministry,
    promulgation_date,
    promulgation_no,
    effective_date,
    registration_source,
    registration_reason,
    registered_by,
    source_url,
    tags
) VALUES (
    '268543',
    '014820',
    '인공지능 발전과 신뢰 기반 조성 등에 관한 기본법',
    '인공지능기본법',
    '법률',
    '과학기술정보통신부',
    '2025-01-21',
    '20676',
    '2026-01-22',
    'MANUAL',
    'AI 규제 대응 - 고영향 인공지능 정의 및 의무사항 포함',
    'system',
    'https://www.law.go.kr/lsInfoP.do?lsiSeq=268543',
    '["AI", "인공지능", "규제", "고영향AI", "신산업"]'
);

-- 트리거: 시행예정 법률 갱신 시 히스토리 기록
CREATE TRIGGER IF NOT EXISTS tr_pending_law_update
AFTER UPDATE ON PendingLawRegistry
BEGIN
    INSERT INTO PendingLawHistory (
        registry_id,
        change_type,
        change_detail,
        previous_status,
        new_status,
        changed_by
    ) VALUES (
        NEW.id,
        'UPDATED',
        json_object(
            'field', 'sync_status',
            'old', OLD.sync_status,
            'new', NEW.sync_status
        ),
        OLD.sync_status,
        NEW.sync_status,
        'system'
    );

    -- updated_at 갱신
    UPDATE PendingLawRegistry SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 트리거: 시행일 도래 시 자동 상태 변경
-- (실제로는 스케줄러에서 처리하지만, 뷰에서 참조할 수 있도록 준비)

-- ============================================
-- 폐지예정 법률 추적 시스템
-- ============================================

-- 폐지예정 법률 등록 테이블
CREATE TABLE IF NOT EXISTS RepealRegistry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 폐지 대상 법령 식별자
    target_law_id INTEGER,                  -- Laws 테이블 FK (현행법)
    target_mst_id TEXT NOT NULL,            -- 폐지 대상 법령일련번호
    target_law_name TEXT NOT NULL,          -- 폐지 대상 법령명

    -- 폐지 근거 (신규 법률 정보)
    replacing_mst_id TEXT,                  -- 대체 법률 MST (있는 경우)
    replacing_law_name TEXT,                -- 대체 법률명
    repeal_provision TEXT,                  -- 폐지 근거 조항 (부칙 등)

    -- 폐지 일정
    repeal_date DATE NOT NULL,              -- 폐지 예정일
    announcement_date DATE,                 -- 폐지 공고일

    -- 폐지 유형
    repeal_type TEXT NOT NULL,              -- 'FULL_REPEAL', 'PARTIAL_REPEAL', 'MERGE', 'SUPERSEDE'
    -- FULL_REPEAL: 전부 폐지
    -- PARTIAL_REPEAL: 일부 조항 폐지
    -- MERGE: 다른 법률에 통합
    -- SUPERSEDE: 신규 법률로 대체

    -- 영향받는 조항 (PARTIAL_REPEAL인 경우)
    affected_articles TEXT,                 -- JSON 배열: ["제5조", "제10조제2항"]

    -- 등록 정보
    registration_source TEXT NOT NULL,      -- 'MANUAL', 'AUTO_DETECT', 'GAZETTE'
    detection_method TEXT,                  -- 'ADDENDA_PARSING', 'GAZETTE_SCAN', 'USER_INPUT'
    registered_by TEXT,

    -- 알림 설정
    notify_before_days INTEGER DEFAULT 90,  -- 폐지 n일 전 알림 (계약 검토용)
    notification_sent BOOLEAN DEFAULT FALSE,

    -- 영향 분석
    impact_assessment TEXT,                 -- JSON: 영향받는 계약/문서 수 등
    warning_message TEXT,                   -- 사용자에게 표시할 경고 메시지

    -- 메타데이터
    source_url TEXT,
    notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (target_law_id) REFERENCES Laws(id) ON DELETE SET NULL
);

-- 폐지예정 인덱스
CREATE INDEX IF NOT EXISTS idx_repeal_target_mst ON RepealRegistry(target_mst_id);
CREATE INDEX IF NOT EXISTS idx_repeal_date ON RepealRegistry(repeal_date);
CREATE INDEX IF NOT EXISTS idx_repeal_type ON RepealRegistry(repeal_type);
CREATE INDEX IF NOT EXISTS idx_repeal_replacing ON RepealRegistry(replacing_mst_id);

-- 폐지예정 법률 뷰 (경고 대상)
CREATE VIEW IF NOT EXISTS v_laws_pending_repeal AS
SELECT
    rr.*,
    l.law_name as current_law_name,
    l.status as current_status,
    julianday(rr.repeal_date) - julianday('now') as days_until_repeal,
    CASE
        WHEN julianday(rr.repeal_date) - julianday('now') <= 30 THEN '긴급'
        WHEN julianday(rr.repeal_date) - julianday('now') <= 90 THEN '주의'
        ELSE '예정'
    END as urgency_level
FROM RepealRegistry rr
LEFT JOIN Laws l ON rr.target_law_id = l.id
WHERE rr.repeal_date > DATE('now')
ORDER BY rr.repeal_date ASC;

-- 곧 폐지될 법률 뷰 (알림용)
CREATE VIEW IF NOT EXISTS v_upcoming_repeal_laws AS
SELECT
    rr.*,
    l.law_name as current_law_name,
    julianday(rr.repeal_date) - julianday('now') as days_until_repeal
FROM RepealRegistry rr
LEFT JOIN Laws l ON rr.target_law_id = l.id
WHERE rr.repeal_date > DATE('now')
  AND rr.repeal_date <= DATE('now', '+' || rr.notify_before_days || ' days')
  AND rr.notification_sent = FALSE
ORDER BY rr.repeal_date ASC;

-- 폐지예정 변경 이력 테이블
CREATE TABLE IF NOT EXISTS RepealHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registry_id INTEGER NOT NULL,

    change_type TEXT NOT NULL,              -- 'REGISTERED', 'UPDATED', 'CONFIRMED', 'CANCELLED', 'EXECUTED'
    change_detail TEXT,                     -- JSON: 변경 내용

    changed_by TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (registry_id) REFERENCES RepealRegistry(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_repeal_history_registry ON RepealHistory(registry_id);

-- ============================================
-- 통합 법률 변경 예정 뷰
-- (시행예정 + 폐지예정 통합 조회)
-- ============================================

CREATE VIEW IF NOT EXISTS v_all_pending_changes AS
SELECT
    'EFFECTIVE' as change_type,
    plr.mst_id,
    plr.law_name,
    plr.effective_date as change_date,
    julianday(plr.effective_date) - julianday('now') as days_until_change,
    '신규 시행' as change_description,
    plr.tags,
    plr.registration_reason as notes,
    CASE
        WHEN julianday(plr.effective_date) - julianday('now') <= 30 THEN '긴급'
        WHEN julianday(plr.effective_date) - julianday('now') <= 90 THEN '주의'
        ELSE '예정'
    END as urgency_level
FROM PendingLawRegistry plr
WHERE plr.effective_date > DATE('now')

UNION ALL

SELECT
    'REPEAL' as change_type,
    rr.target_mst_id as mst_id,
    rr.target_law_name as law_name,
    rr.repeal_date as change_date,
    julianday(rr.repeal_date) - julianday('now') as days_until_change,
    CASE rr.repeal_type
        WHEN 'FULL_REPEAL' THEN '전부 폐지'
        WHEN 'PARTIAL_REPEAL' THEN '일부 폐지'
        WHEN 'MERGE' THEN '통합'
        WHEN 'SUPERSEDE' THEN '대체'
        ELSE '폐지'
    END as change_description,
    NULL as tags,
    rr.warning_message as notes,
    CASE
        WHEN julianday(rr.repeal_date) - julianday('now') <= 30 THEN '긴급'
        WHEN julianday(rr.repeal_date) - julianday('now') <= 90 THEN '주의'
        ELSE '예정'
    END as urgency_level
FROM RepealRegistry rr
WHERE rr.repeal_date > DATE('now')

ORDER BY change_date ASC;

-- ============================================
-- 트리거: 폐지예정 등록 시 히스토리 기록
-- ============================================

CREATE TRIGGER IF NOT EXISTS tr_repeal_registry_insert
AFTER INSERT ON RepealRegistry
BEGIN
    INSERT INTO RepealHistory (
        registry_id,
        change_type,
        change_detail,
        changed_by
    ) VALUES (
        NEW.id,
        'REGISTERED',
        json_object(
            'target_law', NEW.target_law_name,
            'repeal_date', NEW.repeal_date,
            'repeal_type', NEW.repeal_type
        ),
        NEW.registered_by
    );
END;

CREATE TRIGGER IF NOT EXISTS tr_repeal_registry_update
AFTER UPDATE ON RepealRegistry
BEGIN
    INSERT INTO RepealHistory (
        registry_id,
        change_type,
        change_detail,
        changed_by
    ) VALUES (
        NEW.id,
        'UPDATED',
        json_object(
            'field', 'repeal_date',
            'old', OLD.repeal_date,
            'new', NEW.repeal_date
        ),
        'system'
    );

    UPDATE RepealRegistry SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
