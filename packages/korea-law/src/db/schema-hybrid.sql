-- ============================================
-- korea-law: 하이브리드 지식 엔진 (RAG + CAG) 스키마 확장
-- ============================================
-- 목적: 법률 생애주기 관리 및 시점 인식형 캐시 시스템
-- 버전: 2.0
-- ============================================

-- ============================================
-- 1. 법률 생애주기 관리 (Temporal Layering)
-- ============================================

-- 법률 상태 이력 테이블 (버전 관리)
-- 용도: 특정 시점에 유효했던 법률 버전 추적
CREATE TABLE IF NOT EXISTS Law_Versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,
    version_no INTEGER NOT NULL DEFAULT 1,      -- 버전 번호

    -- 시간 속성 (Temporal Metadata)
    promulgation_date DATE NOT NULL,            -- 공포일
    enforcement_date DATE NOT NULL,             -- 시행일
    expiry_date DATE,                           -- 효력 종료일 (NULL = 현행)

    -- 법률 상태 분류
    lifecycle_status TEXT NOT NULL DEFAULT 'CURRENT',
    -- CURRENT: 현행법 (CAG Main Cache)
    -- UPCOMING: 시행 예정 (CAG Delta Cache)
    -- HISTORIC: 폐지/개정 (RAG Cold Storage)
    -- DRAFT: 입법 예고 (RAG News/Web)

    -- 캐시 계층 지정
    cache_tier TEXT DEFAULT 'COLD',
    -- HOT: Main Cache (항상 메모리 상주)
    -- WARM: Delta Cache (변경 대비용)
    -- COLD: Cold Storage (필요 시 검색)
    -- NONE: 캐시 안함 (입법예고 등)

    -- 변경 추적
    previous_version_id INTEGER,                -- 이전 버전 참조
    change_reason TEXT,                         -- 개정 이유
    change_summary TEXT,                        -- 변경 요약

    -- 메타데이터
    source_document_no TEXT,                    -- 공포번호
    gazette_issue TEXT,                         -- 관보 정보

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_version_id) REFERENCES Law_Versions(id) ON DELETE SET NULL,
    UNIQUE(law_id, version_no)
);

-- 조문 버전 이력 테이블
-- 용도: 조문 단위 버전 관리 (Point-in-Time Retrieval)
CREATE TABLE IF NOT EXISTS Article_Versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    law_version_id INTEGER NOT NULL,            -- 해당 법률 버전 참조

    -- 조문 내용
    content TEXT NOT NULL,
    content_hash TEXT,

    -- 시간 속성
    effective_from DATE NOT NULL,               -- 효력 발생일
    effective_until DATE,                       -- 효력 종료일 (NULL = 현행)

    -- 변경 정보
    change_type TEXT,                           -- ADDED/MODIFIED/DELETED
    previous_content TEXT,                      -- 이전 버전 내용
    diff_detail TEXT,                           -- JSON 형식 상세 변경 내역

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (article_id) REFERENCES Articles(id) ON DELETE CASCADE,
    FOREIGN KEY (law_version_id) REFERENCES Law_Versions(id) ON DELETE CASCADE
);

-- ============================================
-- 2. CAG 캐시 관리 시스템
-- ============================================

-- KV 캐시 설정 테이블
-- 용도: LLM KV Cache에 로드할 법률 목록 및 우선순위 관리
CREATE TABLE IF NOT EXISTS Cache_Config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,

    -- 캐시 우선순위 (1이 가장 높음)
    priority INTEGER NOT NULL DEFAULT 100,

    -- 캐시 계층
    cache_tier TEXT NOT NULL DEFAULT 'HOT',     -- HOT/WARM/COLD

    -- 캐시 대상 범위
    include_all_articles BOOLEAN DEFAULT TRUE,
    included_articles TEXT,                      -- JSON 배열: 특정 조문만 캐시
    excluded_articles TEXT,                      -- JSON 배열: 제외할 조문

    -- 사용 통계 (캐시 최적화용)
    access_count INTEGER DEFAULT 0,
    last_accessed_at DATETIME,
    avg_response_time_ms INTEGER,

    -- 캐시 상태
    is_active BOOLEAN DEFAULT TRUE,
    preload_on_startup BOOLEAN DEFAULT TRUE,    -- 시작 시 자동 로드

    -- 자동 갱신 설정
    auto_refresh BOOLEAN DEFAULT TRUE,
    refresh_interval_hours INTEGER DEFAULT 24,
    last_refreshed_at DATETIME,
    next_refresh_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE,
    UNIQUE(law_id)
);

-- 캐시 콘텐츠 테이블 (프리컴파일된 컨텍스트)
-- 용도: LLM에 주입할 사전 준비된 텍스트 블록
CREATE TABLE IF NOT EXISTS Cache_Contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_config_id INTEGER NOT NULL,

    -- 콘텐츠 유형
    content_type TEXT NOT NULL,                  -- FULL_LAW/SUMMARY/KEY_ARTICLES/DEFINITIONS

    -- 프리컴파일된 컨텍스트
    compiled_content TEXT NOT NULL,              -- LLM 주입용 텍스트
    token_count INTEGER,                         -- 토큰 수 (비용 계산용)

    -- 시간 속성 (캐시 무효화 판단용)
    content_hash TEXT,
    valid_from DATE NOT NULL,
    valid_until DATE,                            -- NULL = 현재 유효

    -- 메타데이터
    metadata TEXT,                               -- JSON: 추가 정보

    -- 상태
    is_current BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cache_config_id) REFERENCES Cache_Config(id) ON DELETE CASCADE
);

-- 캐시 갱신 로그
-- 용도: 캐시 자동 갱신 이력 추적
CREATE TABLE IF NOT EXISTS Cache_Refresh_Log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_config_id INTEGER NOT NULL,

    -- 갱신 정보
    refresh_type TEXT NOT NULL,                  -- AUTO/MANUAL/EVENT_TRIGGERED
    trigger_reason TEXT,                         -- 갱신 사유

    -- 결과
    status TEXT NOT NULL,                        -- SUCCESS/FAILED/PARTIAL
    items_updated INTEGER DEFAULT 0,
    items_invalidated INTEGER DEFAULT 0,

    -- 성능 지표
    duration_ms INTEGER,
    old_token_count INTEGER,
    new_token_count INTEGER,

    -- 에러 정보
    error_message TEXT,

    started_at DATETIME NOT NULL,
    completed_at DATETIME,

    FOREIGN KEY (cache_config_id) REFERENCES Cache_Config(id) ON DELETE CASCADE
);

-- ============================================
-- 3. 시점 인식형 검색 (Point-in-Time Retrieval)
-- ============================================

-- 시점 쿼리 로그 테이블
-- 용도: 사건 발생일 기준 검색 기록 및 분석
CREATE TABLE IF NOT EXISTS Temporal_Query_Log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 쿼리 정보
    query_text TEXT NOT NULL,                    -- 원본 쿼리
    extracted_date DATE,                         -- 추출된 시점 (사건 발생일)
    extraction_method TEXT,                      -- EXPLICIT/NLP/INFERRED

    -- 검색 결과
    laws_searched INTEGER DEFAULT 0,
    articles_returned INTEGER DEFAULT 0,

    -- 성능 지표
    source TEXT,                                 -- CAG/RAG/HYBRID
    response_time_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,

    -- 사용자 피드백
    was_helpful BOOLEAN,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 법률 시간선 테이블 (타임라인 뷰어용)
-- 용도: 특정 조항의 개정 이력 시각화
CREATE TABLE IF NOT EXISTS Law_Timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,
    article_no TEXT,                             -- NULL이면 법률 전체 이벤트

    -- 이벤트 정보
    event_type TEXT NOT NULL,
    -- ENACTED: 제정
    -- AMENDED: 개정
    -- REPEALED: 폐지
    -- PROMULGATED: 공포
    -- ENFORCED: 시행
    -- SCHEDULED: 시행 예정

    event_date DATE NOT NULL,
    event_description TEXT,

    -- 변경 상세
    old_value TEXT,
    new_value TEXT,
    change_magnitude TEXT,                       -- MAJOR/MINOR/TECHNICAL

    -- 관련 문서
    reference_document TEXT,                     -- 개정법률명, 공포번호 등

    -- 알림 설정
    notify_users BOOLEAN DEFAULT FALSE,
    notification_sent BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE
);

-- ============================================
-- 4. 하이브리드 엔진 라우팅 설정
-- ============================================

-- 쿼리 분류 규칙 테이블
-- 용도: 질문 유형에 따른 CAG/RAG 라우팅 결정
CREATE TABLE IF NOT EXISTS Query_Routing_Rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 규칙 이름 및 설명
    rule_name TEXT NOT NULL UNIQUE,
    description TEXT,

    -- 분류 조건 (패턴 매칭)
    query_patterns TEXT,                         -- JSON 배열: 정규식 패턴들
    keyword_triggers TEXT,                       -- JSON 배열: 트리거 키워드들

    -- 라우팅 설정
    route_to TEXT NOT NULL DEFAULT 'HYBRID',     -- CAG/RAG/HYBRID
    cag_weight REAL DEFAULT 0.5,                 -- CAG 비중 (0-1)
    rag_weight REAL DEFAULT 0.5,                 -- RAG 비중 (0-1)

    -- 우선순위 (낮을수록 먼저 적용)
    priority INTEGER DEFAULT 100,

    -- 상태
    is_active BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 라우팅 규칙 삽입
INSERT OR IGNORE INTO Query_Routing_Rules (rule_name, description, query_patterns, keyword_triggers, route_to, cag_weight, rag_weight, priority) VALUES
('simple_lookup', '단순 법령 조회', '["^(.*)(조)?\\s*(내용|뭐야|알려줘|설명)"]', '["조문", "제몇조", "법조문"]', 'CAG', 1.0, 0.0, 10),
('definition_check', '법률 용어 정의 확인', '["정의", "뜻", "의미"]', '["정의", "뜻", "의미"]', 'CAG', 0.9, 0.1, 20),
('case_analysis', '복잡한 판례 분석', '["판례", "판결", "대법원", "고등법원"]', '["판례", "판결", "선고"]', 'RAG', 0.2, 0.8, 30),
('recent_changes', '최신 개정 사항', '["개정", "변경", "최신", "신설"]', '["개정", "변경", "신설"]', 'RAG', 0.3, 0.7, 40),
('temporal_query', '시점 기반 질문', '["(\\d{4}년|작년|올해|지난해)"]', '["당시", "시점", "기준"]', 'HYBRID', 0.4, 0.6, 50),
('default', '기본 하이브리드', '[".*"]', '[]', 'HYBRID', 0.5, 0.5, 999);

-- ============================================
-- 5. 캐시 계층 초기화 (기본 6법 + 빈출 법령)
-- ============================================

-- HOT Cache 대상 법령 (기본 6법)
INSERT OR IGNORE INTO Cache_Config (law_id, priority, cache_tier, preload_on_startup)
SELECT id,
    CASE law_name
        WHEN '헌법' THEN 1
        WHEN '민법' THEN 2
        WHEN '형법' THEN 3
        WHEN '상법' THEN 4
        WHEN '민사소송법' THEN 5
        WHEN '형사소송법' THEN 6
        ELSE 10
    END as priority,
    'HOT',
    TRUE
FROM Laws
WHERE law_name IN ('헌법', '민법', '형법', '상법', '민사소송법', '형사소송법')
AND status = 'ACTIVE';

-- WARM Cache 대상 법령 (빈출 노동법/세법)
INSERT OR IGNORE INTO Cache_Config (law_id, priority, cache_tier, preload_on_startup)
SELECT id, 20 + ROW_NUMBER() OVER (ORDER BY law_name), 'WARM', TRUE
FROM Laws
WHERE law_name IN (
    '근로기준법', '노동조합 및 노동관계조정법',
    '국세기본법', '소득세법', '법인세법', '부가가치세법',
    '건강보험법', '국민연금법', '고용보험법', '산업재해보상보험법'
)
AND status = 'ACTIVE'
AND id NOT IN (SELECT law_id FROM Cache_Config);

-- ============================================
-- 6. 인덱스 생성
-- ============================================

-- Law_Versions 인덱스
CREATE INDEX IF NOT EXISTS idx_law_versions_law_id ON Law_Versions(law_id);
CREATE INDEX IF NOT EXISTS idx_law_versions_status ON Law_Versions(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_law_versions_enforcement ON Law_Versions(enforcement_date);
CREATE INDEX IF NOT EXISTS idx_law_versions_cache_tier ON Law_Versions(cache_tier);
CREATE INDEX IF NOT EXISTS idx_law_versions_dates ON Law_Versions(enforcement_date, expiry_date);

-- Article_Versions 인덱스
CREATE INDEX IF NOT EXISTS idx_article_versions_article ON Article_Versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_dates ON Article_Versions(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_article_versions_law_version ON Article_Versions(law_version_id);

-- Cache 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_cache_config_tier ON Cache_Config(cache_tier);
CREATE INDEX IF NOT EXISTS idx_cache_config_priority ON Cache_Config(priority);
CREATE INDEX IF NOT EXISTS idx_cache_config_active ON Cache_Config(is_active);
CREATE INDEX IF NOT EXISTS idx_cache_contents_current ON Cache_Contents(is_current);
CREATE INDEX IF NOT EXISTS idx_cache_contents_valid ON Cache_Contents(valid_from, valid_until);

-- Temporal 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_temporal_query_date ON Temporal_Query_Log(extracted_date);
CREATE INDEX IF NOT EXISTS idx_law_timeline_law_id ON Law_Timeline(law_id);
CREATE INDEX IF NOT EXISTS idx_law_timeline_event_date ON Law_Timeline(event_date);
CREATE INDEX IF NOT EXISTS idx_law_timeline_article ON Law_Timeline(law_id, article_no);

-- ============================================
-- 7. 유틸리티 뷰
-- ============================================

-- 현행법 + 시행예정법 캐시 대상 뷰
CREATE VIEW IF NOT EXISTS CacheableLaws AS
SELECT
    l.*,
    cc.priority,
    cc.cache_tier,
    cc.access_count,
    cc.last_accessed_at,
    CASE
        WHEN l.enforcement_date > DATE('now') THEN 'UPCOMING'
        WHEN l.status = 'ACTIVE' THEN 'CURRENT'
        ELSE 'HISTORIC'
    END as lifecycle_status
FROM Laws l
LEFT JOIN Cache_Config cc ON l.id = cc.law_id
WHERE l.status IN ('ACTIVE', 'PENDING')
ORDER BY cc.priority ASC NULLS LAST;

-- 시행 예정 법령 (D-Day 포함)
CREATE VIEW IF NOT EXISTS UpcomingLaws AS
SELECT
    l.*,
    julianday(l.enforcement_date) - julianday('now') as days_until_effective,
    cc.cache_tier
FROM Laws l
LEFT JOIN Cache_Config cc ON l.id = cc.law_id
WHERE l.enforcement_date > DATE('now')
ORDER BY l.enforcement_date ASC;

-- 특정 시점 기준 유효 법령 조회 함수용 뷰
CREATE VIEW IF NOT EXISTS PointInTimeLaws AS
SELECT
    lv.*,
    l.law_name,
    l.law_type,
    l.ministry
FROM Law_Versions lv
JOIN Laws l ON lv.law_id = l.id
WHERE lv.lifecycle_status = 'CURRENT'
OR (lv.enforcement_date <= DATE('now') AND (lv.expiry_date IS NULL OR lv.expiry_date > DATE('now')));

-- 캐시 통계 뷰
CREATE VIEW IF NOT EXISTS CacheStats AS
SELECT
    cache_tier,
    COUNT(*) as law_count,
    SUM(access_count) as total_accesses,
    AVG(avg_response_time_ms) as avg_response_time
FROM Cache_Config
WHERE is_active = TRUE
GROUP BY cache_tier;

-- ============================================
-- 8. 트리거: 자동 캐시 무효화
-- ============================================

-- 법령 업데이트 시 캐시 무효화
CREATE TRIGGER IF NOT EXISTS invalidate_cache_on_law_update
AFTER UPDATE ON Laws
WHEN OLD.checksum != NEW.checksum
BEGIN
    UPDATE Cache_Contents
    SET is_current = FALSE
    WHERE cache_config_id IN (
        SELECT id FROM Cache_Config WHERE law_id = NEW.id
    );

    -- 타임라인 이벤트 추가
    INSERT INTO Law_Timeline (law_id, event_type, event_date, event_description)
    VALUES (NEW.id, 'AMENDED', DATE('now'), '법령 내용 변경 감지');
END;

-- 조문 업데이트 시 캐시 무효화
CREATE TRIGGER IF NOT EXISTS invalidate_cache_on_article_update
AFTER UPDATE ON Articles
WHEN OLD.content_hash != NEW.content_hash
BEGIN
    UPDATE Cache_Contents
    SET is_current = FALSE
    WHERE cache_config_id IN (
        SELECT cc.id FROM Cache_Config cc
        JOIN Articles a ON cc.law_id = a.law_id
        WHERE a.id = NEW.id
    );
END;

-- 시행일 도래 시 캐시 계층 자동 승격 (Daily Cron에서 호출)
-- (이 로직은 daily-sync.ts에서 프로그래밍적으로 처리)

