-- ============================================
-- korea-law: 확장 스키마 (191개 API 지원)
-- ============================================
-- Phase 2-4 API 확장을 위한 추가 테이블
-- 판례, 해석례, 위원회 결정문, 조약 등
-- ============================================

-- ============================================
-- 헌법재판소 결정례 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Constitutional_Decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_serial_number TEXT UNIQUE NOT NULL,  -- 헌재결정일련번호
    case_id TEXT NOT NULL,                        -- 사건번호 (예: 2020헌마123)
    case_id_normalized TEXT,                      -- 정규화된 사건번호
    case_name TEXT,                               -- 사건명
    decision_date DATE,                           -- 선고일자
    decision_type TEXT,                           -- 결정유형 (합헌, 위헌, 헌법불합치 등)
    decision_type_code TEXT,                      -- 결정유형코드

    -- 본문 내용
    judgment TEXT,                                -- 주문
    reason TEXT,                                  -- 이유
    summary TEXT,                                 -- 결정요지
    referenced_statutes TEXT,                     -- 참조조문
    referenced_cases TEXT,                        -- 참조판례
    full_text TEXT,                               -- 결정문전문

    -- 메타데이터
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_const_dec_case_id ON Constitutional_Decisions(case_id);
CREATE INDEX IF NOT EXISTS idx_const_dec_normalized ON Constitutional_Decisions(case_id_normalized);
CREATE INDEX IF NOT EXISTS idx_const_dec_date ON Constitutional_Decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_const_dec_type ON Constitutional_Decisions(decision_type);

-- ============================================
-- 법령해석례 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Legal_Interpretations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interpretation_serial_number TEXT UNIQUE NOT NULL,  -- 법령해석일련번호
    case_number TEXT,                             -- 안건번호
    case_name TEXT,                               -- 사안명
    reply_agency TEXT,                            -- 회신기관명
    reply_agency_code TEXT,                       -- 회신기관코드
    reply_date DATE,                              -- 회신일자

    -- 본문 내용
    question_summary TEXT,                        -- 질의요지
    answer TEXT,                                  -- 회답
    reason TEXT,                                  -- 이유
    referenced_statutes TEXT,                     -- 참조조문
    referenced_cases TEXT,                        -- 참조판례

    -- 메타데이터
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_legal_interp_serial ON Legal_Interpretations(interpretation_serial_number);
CREATE INDEX IF NOT EXISTS idx_legal_interp_case ON Legal_Interpretations(case_number);
CREATE INDEX IF NOT EXISTS idx_legal_interp_agency ON Legal_Interpretations(reply_agency);
CREATE INDEX IF NOT EXISTS idx_legal_interp_date ON Legal_Interpretations(reply_date);

-- ============================================
-- 행정심판례 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Admin_Appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appeal_serial_number TEXT UNIQUE NOT NULL,    -- 행정심판일련번호
    case_id TEXT NOT NULL,                        -- 사건번호
    case_id_normalized TEXT,                      -- 정규화된 사건번호
    case_name TEXT,                               -- 사건명
    decision_date DATE,                           -- 재결일자
    decision_result TEXT,                         -- 재결결과 (인용, 기각, 각하 등)
    decision_result_code TEXT,                    -- 재결결과코드

    -- 본문 내용
    summary TEXT,                                 -- 재결요지
    claim_purpose TEXT,                           -- 청구취지
    claim_reason TEXT,                            -- 청구이유
    respondent_claim TEXT,                        -- 피청구인주장
    reason TEXT,                                  -- 이유
    referenced_statutes TEXT,                     -- 참조조문

    -- 메타데이터
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_appeal_serial ON Admin_Appeals(appeal_serial_number);
CREATE INDEX IF NOT EXISTS idx_admin_appeal_case ON Admin_Appeals(case_id);
CREATE INDEX IF NOT EXISTS idx_admin_appeal_normalized ON Admin_Appeals(case_id_normalized);
CREATE INDEX IF NOT EXISTS idx_admin_appeal_date ON Admin_Appeals(decision_date);
CREATE INDEX IF NOT EXISTS idx_admin_appeal_result ON Admin_Appeals(decision_result);

-- ============================================
-- 위원회 결정문 테이블 (12개 위원회 통합)
-- ============================================
CREATE TABLE IF NOT EXISTS Committee_Decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_serial_number TEXT NOT NULL,         -- 결정문일련번호
    committee_type TEXT NOT NULL,                 -- 위원회 유형 (pipc, ftc, nlrc, ...)
    committee_name TEXT NOT NULL,                 -- 위원회명 (개인정보보호위원회, ...)
    case_id TEXT,                                 -- 사건번호
    case_name TEXT,                               -- 사건명
    decision_date DATE,                           -- 결정일자
    decision_type TEXT,                           -- 결정유형

    -- 본문 내용
    summary TEXT,                                 -- 결정요지
    main_text TEXT,                               -- 주문
    reason TEXT,                                  -- 이유
    full_text TEXT,                               -- 전문

    -- 메타데이터
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(committee_type, decision_serial_number)
);

CREATE INDEX IF NOT EXISTS idx_committee_dec_serial ON Committee_Decisions(decision_serial_number);
CREATE INDEX IF NOT EXISTS idx_committee_dec_type ON Committee_Decisions(committee_type);
CREATE INDEX IF NOT EXISTS idx_committee_dec_case ON Committee_Decisions(case_id);
CREATE INDEX IF NOT EXISTS idx_committee_dec_date ON Committee_Decisions(decision_date);

-- ============================================
-- 중앙부처 법령해석 테이블 (24개 부처 통합)
-- ============================================
CREATE TABLE IF NOT EXISTS Ministry_Interpretations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interpretation_serial_number TEXT NOT NULL,   -- 해석례일련번호
    ministry_type TEXT NOT NULL,                  -- 부처 유형 (moel, nts, molit, ...)
    ministry_name TEXT NOT NULL,                  -- 부처명 (고용노동부, 국세청, ...)
    case_number TEXT,                             -- 안건번호
    case_name TEXT,                               -- 안건명
    interpretation_date DATE,                     -- 해석일자

    -- 본문 내용
    question_summary TEXT,                        -- 질의요지
    answer TEXT,                                  -- 회답
    reason TEXT,                                  -- 이유
    referenced_statutes TEXT,                     -- 참조조문
    referenced_cases TEXT,                        -- 참조판례

    -- 메타데이터
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(ministry_type, interpretation_serial_number)
);

CREATE INDEX IF NOT EXISTS idx_ministry_interp_serial ON Ministry_Interpretations(interpretation_serial_number);
CREATE INDEX IF NOT EXISTS idx_ministry_interp_type ON Ministry_Interpretations(ministry_type);
CREATE INDEX IF NOT EXISTS idx_ministry_interp_case ON Ministry_Interpretations(case_number);
CREATE INDEX IF NOT EXISTS idx_ministry_interp_date ON Ministry_Interpretations(interpretation_date);

-- ============================================
-- 특별행정심판 테이블 (4개 심판원 통합)
-- ============================================
CREATE TABLE IF NOT EXISTS Special_Appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appeal_serial_number TEXT NOT NULL,           -- 심판례일련번호
    appeal_type TEXT NOT NULL,                    -- 심판 유형 (ttAppeal, kmstAppeal, ...)
    tribunal_name TEXT NOT NULL,                  -- 심판원명 (조세심판원, ...)
    case_id TEXT,                                 -- 사건번호
    case_name TEXT,                               -- 사건명
    decision_date DATE,                           -- 재결일자
    decision_result TEXT,                         -- 재결결과

    -- 본문 내용
    summary TEXT,                                 -- 재결요지
    claim_purpose TEXT,                           -- 청구취지
    reason TEXT,                                  -- 이유
    full_text TEXT,                               -- 전문

    -- 메타데이터
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(appeal_type, appeal_serial_number)
);

CREATE INDEX IF NOT EXISTS idx_special_appeal_serial ON Special_Appeals(appeal_serial_number);
CREATE INDEX IF NOT EXISTS idx_special_appeal_type ON Special_Appeals(appeal_type);
CREATE INDEX IF NOT EXISTS idx_special_appeal_case ON Special_Appeals(case_id);
CREATE INDEX IF NOT EXISTS idx_special_appeal_date ON Special_Appeals(decision_date);

-- ============================================
-- 조약 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Treaties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treaty_serial_number TEXT UNIQUE NOT NULL,    -- 조약일련번호
    treaty_name TEXT NOT NULL,                    -- 조약명
    treaty_type TEXT,                             -- 조약종류명
    conclusion_date DATE,                         -- 체결일자
    effective_date DATE,                          -- 발효일자
    parties TEXT,                                 -- 당사국

    -- 본문 내용
    content TEXT,                                 -- 조약내용
    remarks TEXT,                                 -- 비고

    -- 메타데이터
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_treaty_serial ON Treaties(treaty_serial_number);
CREATE INDEX IF NOT EXISTS idx_treaty_name ON Treaties(treaty_name);
CREATE INDEX IF NOT EXISTS idx_treaty_effective ON Treaties(effective_date);

-- ============================================
-- 영문법령 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS English_Laws (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,                      -- 원본 법령 ID (Laws 테이블 참조)
    law_mst_id TEXT NOT NULL,                     -- 국가법령정보센터 법령 ID
    law_name_korean TEXT NOT NULL,                -- 법령명 (한글)
    law_name_english TEXT NOT NULL,               -- 법령명 (영문)
    promulgation_date DATE,                       -- 공포일자
    enforcement_date DATE,                        -- 시행일자
    ministry TEXT,                                -- 소관부처명
    law_type TEXT,                                -- 법령구분명

    -- 본문 내용
    content_english TEXT,                         -- 영문 본문

    -- 메타데이터
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_english_law_id ON English_Laws(law_id);
CREATE INDEX IF NOT EXISTS idx_english_law_name ON English_Laws(law_name_english);

-- ============================================
-- 법령 체계도 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Law_System_Diagram (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,                      -- 법령 ID
    parent_law_id INTEGER,                        -- 상위법령 ID
    diagram_type TEXT,                            -- 체계도유형
    hierarchy_level INTEGER DEFAULT 0,            -- 체계 레벨 (0=최상위)

    -- 메타데이터
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_law_id) REFERENCES Laws(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_law_system_law_id ON Law_System_Diagram(law_id);
CREATE INDEX IF NOT EXISTS idx_law_system_parent ON Law_System_Diagram(parent_law_id);

-- ============================================
-- 신구법 비교 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Law_Comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,                      -- 법령 ID
    revision_order TEXT,                          -- 개정차수
    article_no_before TEXT,                       -- 개정전조문번호
    content_before TEXT,                          -- 개정전조문내용
    article_no_after TEXT,                        -- 개정후조문번호
    content_after TEXT,                           -- 개정후조문내용
    change_type TEXT,                             -- 변경유형 (신설, 삭제, 변경)

    -- 메타데이터
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_law_comp_law_id ON Law_Comparisons(law_id);
CREATE INDEX IF NOT EXISTS idx_law_comp_revision ON Law_Comparisons(revision_order);

-- ============================================
-- 한눈보기 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Law_Overviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    overview_id TEXT UNIQUE NOT NULL,             -- 한눈보기ID
    title TEXT NOT NULL,                          -- 제목
    related_law_name TEXT,                        -- 관련법령명
    law_id INTEGER,                               -- 법령 ID
    written_date DATE,                            -- 작성일자
    department TEXT,                              -- 담당부서
    view_count INTEGER DEFAULT 0,                 -- 조회수

    -- 본문 내용
    content TEXT,                                 -- 본문내용
    visual_content_urls TEXT,                     -- 시각콘텐츠URL (JSON)
    related_articles TEXT,                        -- 관련조문 (JSON)

    -- 메타데이터
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_overview_id ON Law_Overviews(overview_id);
CREATE INDEX IF NOT EXISTS idx_overview_law ON Law_Overviews(law_id);
CREATE INDEX IF NOT EXISTS idx_overview_date ON Law_Overviews(written_date);

-- ============================================
-- 행정규칙 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Admin_Rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_serial_number TEXT UNIQUE NOT NULL,      -- 행정규칙일련번호
    rule_name TEXT NOT NULL,                      -- 행정규칙명
    rule_type TEXT,                               -- 행정규칙종류명
    ministry TEXT,                                -- 소관부처명
    issuance_date DATE,                           -- 발령일자
    enforcement_date DATE,                        -- 시행일자

    -- 본문 내용
    content TEXT,                                 -- 본문

    -- 메타데이터
    status TEXT DEFAULT 'ACTIVE',
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_rule_serial ON Admin_Rules(rule_serial_number);
CREATE INDEX IF NOT EXISTS idx_admin_rule_name ON Admin_Rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_admin_rule_ministry ON Admin_Rules(ministry);

-- ============================================
-- 자치법규 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Local_Ordinances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordinance_serial_number TEXT UNIQUE NOT NULL, -- 자치법규일련번호
    ordinance_name TEXT NOT NULL,                 -- 자치법규명
    local_government_code TEXT,                   -- 자치단체코드
    local_government_name TEXT,                   -- 자치단체명
    promulgation_date DATE,                       -- 공포일자
    enforcement_date DATE,                        -- 시행일자

    -- 본문 내용
    content TEXT,                                 -- 본문

    -- 메타데이터
    status TEXT DEFAULT 'ACTIVE',
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ordinance_serial ON Local_Ordinances(ordinance_serial_number);
CREATE INDEX IF NOT EXISTS idx_ordinance_name ON Local_Ordinances(ordinance_name);
CREATE INDEX IF NOT EXISTS idx_ordinance_local_gov ON Local_Ordinances(local_government_name);

-- ============================================
-- 별표/서식 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attachment_id TEXT UNIQUE NOT NULL,           -- 별표서식ID
    attachment_name TEXT NOT NULL,                -- 별표서식명
    source_type TEXT NOT NULL,                    -- 출처유형 (law, admrul, ordin)
    source_name TEXT,                             -- 출처명 (법령명/행정규칙명/자치법규명)
    attachment_type TEXT,                         -- 별표서식종류
    file_url TEXT,                                -- 파일URL

    -- 메타데이터
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachment_id ON Attachments(attachment_id);
CREATE INDEX IF NOT EXISTS idx_attachment_source ON Attachments(source_type);

-- ============================================
-- 학칙/공단/공공기관 규정 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Institution_Rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id TEXT UNIQUE NOT NULL,                 -- 기관규정ID
    institution_name TEXT NOT NULL,               -- 기관명
    rule_name TEXT NOT NULL,                      -- 규정명
    rule_type TEXT,                               -- 규정유형
    enforcement_date DATE,                        -- 시행일자
    revision_type TEXT,                           -- 제개정구분

    -- 본문 내용
    content TEXT,                                 -- 본문

    -- 메타데이터
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inst_rule_id ON Institution_Rules(rule_id);
CREATE INDEX IF NOT EXISTS idx_inst_rule_name ON Institution_Rules(institution_name);

-- ============================================
-- 지식베이스 용어 테이블 (법령용어-일상용어)
-- ============================================
CREATE TABLE IF NOT EXISTS Knowledge_Base_Terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term_id TEXT UNIQUE NOT NULL,                 -- 용어ID
    term TEXT NOT NULL,                           -- 용어명
    term_type TEXT NOT NULL,                      -- 유형 (법령용어/일상용어)
    definition TEXT,                              -- 정의
    source_law TEXT,                              -- 출처법령
    source_article TEXT,                          -- 출처조문

    -- 연계 정보
    linked_terms TEXT,                            -- 연계된 용어 IDs (JSON)

    -- 메타데이터
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_term_id ON Knowledge_Base_Terms(term_id);
CREATE INDEX IF NOT EXISTS idx_kb_term_name ON Knowledge_Base_Terms(term);
CREATE INDEX IF NOT EXISTS idx_kb_term_type ON Knowledge_Base_Terms(term_type);

-- ============================================
-- API 동기화 상태 추적 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS API_Sync_Status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_category TEXT NOT NULL,                   -- API 카테고리 (prec, detc, committee, ...)
    api_name TEXT NOT NULL,                       -- API 이름
    last_sync_at DATETIME,                        -- 마지막 동기화 시간
    records_synced INTEGER DEFAULT 0,             -- 동기화된 레코드 수
    sync_status TEXT DEFAULT 'PENDING',           -- 상태 (PENDING, RUNNING, SUCCESS, FAILED)
    error_message TEXT,                           -- 에러 메시지

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(api_category, api_name)
);

CREATE INDEX IF NOT EXISTS idx_api_sync_category ON API_Sync_Status(api_category);
CREATE INDEX IF NOT EXISTS idx_api_sync_status ON API_Sync_Status(sync_status);

-- ============================================
-- 4-Phase Sync 실행 로그 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS sync_execution_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    phase INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_ms INTEGER,
    api_calls INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    timeout_count INTEGER DEFAULT 0,
    laws_processed INTEGER DEFAULT 0,
    precedents_processed INTEGER DEFAULT 0,
    admin_rules_processed INTEGER DEFAULT 0,
    local_ordinances_processed INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exec_log_run_id ON sync_execution_log(run_id);
CREATE INDEX IF NOT EXISTS idx_exec_log_phase ON sync_execution_log(phase);

-- ============================================
-- 일일 동기화 요약 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS sync_summary_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_date DATE NOT NULL UNIQUE,
    run_id TEXT NOT NULL,
    status TEXT NOT NULL,
    total_duration_ms INTEGER,
    phases_completed INTEGER DEFAULT 0,
    phases_failed INTEGER DEFAULT 0,
    total_laws_synced INTEGER DEFAULT 0,
    total_precedents_synced INTEGER DEFAULT 0,
    total_admin_rules_synced INTEGER DEFAULT 0,
    total_local_ordinances_synced INTEGER DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_summary_date ON sync_summary_daily(sync_date);

-- ============================================
-- 뷰: 통합 검증 대시보드
-- ============================================
CREATE VIEW IF NOT EXISTS Verification_Dashboard AS
SELECT
    '판례' as category,
    COUNT(*) as total_count,
    SUM(CASE WHEN exists_verified = 1 THEN 1 ELSE 0 END) as verified_count,
    MAX(updated_at) as last_updated
FROM Precedents
UNION ALL
SELECT
    '헌재결정례' as category,
    COUNT(*) as total_count,
    SUM(CASE WHEN exists_verified = 1 THEN 1 ELSE 0 END) as verified_count,
    MAX(updated_at) as last_updated
FROM Constitutional_Decisions
UNION ALL
SELECT
    '법령해석례' as category,
    COUNT(*) as total_count,
    SUM(CASE WHEN exists_verified = 1 THEN 1 ELSE 0 END) as verified_count,
    MAX(updated_at) as last_updated
FROM Legal_Interpretations
UNION ALL
SELECT
    '행정심판례' as category,
    COUNT(*) as total_count,
    SUM(CASE WHEN exists_verified = 1 THEN 1 ELSE 0 END) as verified_count,
    MAX(updated_at) as last_updated
FROM Admin_Appeals
UNION ALL
SELECT
    '위원회결정문' as category,
    COUNT(*) as total_count,
    SUM(CASE WHEN exists_verified = 1 THEN 1 ELSE 0 END) as verified_count,
    MAX(updated_at) as last_updated
FROM Committee_Decisions
UNION ALL
SELECT
    '조약' as category,
    COUNT(*) as total_count,
    SUM(CASE WHEN exists_verified = 1 THEN 1 ELSE 0 END) as verified_count,
    MAX(updated_at) as last_updated
FROM Treaties;
