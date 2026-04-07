-- ============================================
-- korea-law: Supabase (PostgreSQL) Schema v2
-- 국가법령정보 OPEN API 전체 커버리지
-- ============================================
-- 자동 생성됨 - 크롤링된 API 스펙 기반
-- ⚠️ 중요: 이 DB는 "검증용(Verification)" 목적입니다.
-- ============================================

-- ============================================
-- 1. 행정규칙 테이블
-- API: admrul (행정규칙 목록/본문 조회)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_rules (
    id BIGSERIAL PRIMARY KEY,
    admin_rule_seq TEXT UNIQUE NOT NULL,     -- 행정규칙일련번호
    admin_rule_name TEXT NOT NULL,           -- 행정규칙명
    admin_rule_type TEXT,                    -- 행정규칙종류명 (훈령/예규/고시 등)
    ministry TEXT,                           -- 소관부처명
    ministry_code TEXT,                      -- 소관부처코드
    issue_date DATE,                         -- 발령일자
    enforcement_date DATE,                   -- 시행일자
    
    -- 본문 데이터
    content TEXT,                            -- 본문 전체
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_rules_name ON admin_rules(admin_rule_name);
CREATE INDEX IF NOT EXISTS idx_admin_rules_type ON admin_rules(admin_rule_type);
CREATE INDEX IF NOT EXISTS idx_admin_rules_ministry ON admin_rules(ministry);

-- ============================================
-- 2. 자치법규 테이블
-- API: ordin (자치법규 목록/본문 조회)
-- ============================================
CREATE TABLE IF NOT EXISTS local_laws (
    id BIGSERIAL PRIMARY KEY,
    local_law_seq TEXT UNIQUE NOT NULL,      -- 자치법규일련번호
    local_law_name TEXT NOT NULL,            -- 자치법규명
    local_law_type TEXT,                     -- 자치법규종류명 (조례/규칙)
    local_gov TEXT,                          -- 지방자치단체명
    local_gov_code TEXT,                     -- 지방자치단체코드
    promulgation_date DATE,                  -- 공포일자
    promulgation_no TEXT,                    -- 공포번호
    enforcement_date DATE,                   -- 시행일자
    
    -- 본문 데이터
    content TEXT,
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_local_laws_name ON local_laws(local_law_name);
CREATE INDEX IF NOT EXISTS idx_local_laws_type ON local_laws(local_law_type);
CREATE INDEX IF NOT EXISTS idx_local_laws_gov ON local_laws(local_gov);

-- ============================================
-- 3. 판례 테이블 확장 (기존 테이블 대체)
-- API: prec (판례 목록/본문 조회)
-- ============================================
DROP TABLE IF EXISTS precedents CASCADE;

CREATE TABLE IF NOT EXISTS precedents (
    id BIGSERIAL PRIMARY KEY,
    prec_seq TEXT UNIQUE NOT NULL,           -- 판례정보일련번호
    case_id TEXT,                            -- 사건번호 (예: 2023다12345)
    case_id_normalized TEXT,                 -- 정규화된 사건번호
    case_name TEXT,                          -- 사건명
    court TEXT,                              -- 법원명
    court_type_code TEXT,                    -- 법원종류코드
    case_type TEXT,                          -- 사건종류명
    case_type_code TEXT,                     -- 사건종류코드
    decision_date DATE,                      -- 선고일자
    decision_type TEXT,                      -- 선고 (판결/결정)
    judgment_type TEXT,                      -- 판결유형
    
    -- 본문 필드
    summary TEXT,                            -- 판시사항
    holding TEXT,                            -- 판결요지
    full_text TEXT,                          -- 판례내용 (전문)
    
    -- 참조 정보
    ref_articles TEXT,                       -- 참조조문
    ref_precedents TEXT,                     -- 참조판례
    
    -- 검증용
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_precedents_case_id ON precedents(case_id);
CREATE INDEX IF NOT EXISTS idx_precedents_case_normalized ON precedents(case_id_normalized);
CREATE INDEX IF NOT EXISTS idx_precedents_court ON precedents(court);
CREATE INDEX IF NOT EXISTS idx_precedents_date ON precedents(decision_date);

-- ============================================
-- 4. 헌재결정례 테이블
-- API: detc (헌재결정례 목록/본문 조회)
-- ============================================
CREATE TABLE IF NOT EXISTS constitutional_decisions (
    id BIGSERIAL PRIMARY KEY,
    detc_seq TEXT UNIQUE NOT NULL,           -- 헌재결정례일련번호
    case_id TEXT,                            -- 사건번호
    case_name TEXT,                          -- 사건명
    decision_date DATE,                      -- 선고일
    decision_type TEXT,                      -- 결정유형 (위헌/합헌/헌법불합치 등)
    
    -- 본문 필드
    summary TEXT,                            -- 결정요지
    full_text TEXT,                          -- 전문
    
    -- 참조 정보
    ref_articles TEXT,                       -- 참조조문
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_const_decisions_case_id ON constitutional_decisions(case_id);
CREATE INDEX IF NOT EXISTS idx_const_decisions_date ON constitutional_decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_const_decisions_type ON constitutional_decisions(decision_type);

-- ============================================
-- 5. 법령해석례 테이블
-- API: expc (법령해석례 목록/본문 조회)
-- ============================================
CREATE TABLE IF NOT EXISTS legal_interpretations (
    id BIGSERIAL PRIMARY KEY,
    expc_seq TEXT UNIQUE NOT NULL,           -- 법령해석례일련번호
    title TEXT NOT NULL,                     -- 제목
    interpretation_type TEXT,                -- 해석유형
    interpretation_date DATE,                -- 해석일자
    requestor TEXT,                          -- 질의기관
    answerer TEXT,                           -- 회답기관
    
    -- 본문 필드
    question TEXT,                           -- 질의요지
    answer TEXT,                             -- 회답
    reasoning TEXT,                          -- 이유
    
    -- 참조 정보
    ref_articles TEXT,                       -- 관련조문
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_legal_interp_title ON legal_interpretations(title);
CREATE INDEX IF NOT EXISTS idx_legal_interp_date ON legal_interpretations(interpretation_date);
CREATE INDEX IF NOT EXISTS idx_legal_interp_type ON legal_interpretations(interpretation_type);

-- ============================================
-- 6. 행정심판례 테이블
-- API: decc (행정심판례 목록/본문 조회)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_appeals (
    id BIGSERIAL PRIMARY KEY,
    decc_seq TEXT UNIQUE NOT NULL,           -- 행정심판례일련번호
    case_id TEXT,                            -- 사건번호
    case_name TEXT,                          -- 사건명
    decision_date DATE,                      -- 재결일
    decision_type TEXT,                      -- 재결유형 (인용/기각/각하)
    agency TEXT,                             -- 재결청
    
    -- 본문 필드
    summary TEXT,                            -- 재결요지
    full_text TEXT,                          -- 전문
    
    -- 참조 정보
    ref_articles TEXT,                       -- 관련조문
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_appeals_case_id ON admin_appeals(case_id);
CREATE INDEX IF NOT EXISTS idx_admin_appeals_date ON admin_appeals(decision_date);
CREATE INDEX IF NOT EXISTS idx_admin_appeals_type ON admin_appeals(decision_type);

-- ============================================
-- 7. 조약 테이블
-- API: trty (조약 목록/본문 조회)
-- ============================================
CREATE TABLE IF NOT EXISTS treaties (
    id BIGSERIAL PRIMARY KEY,
    treaty_seq TEXT UNIQUE NOT NULL,         -- 조약일련번호
    treaty_name TEXT NOT NULL,               -- 조약명
    treaty_name_eng TEXT,                    -- 영문조약명
    treaty_no TEXT,                          -- 조약번호
    treaty_type TEXT,                        -- 조약유형 (양자/다자)
    conclusion_date DATE,                    -- 체결일
    enforcement_date DATE,                   -- 발효일
    counterpart TEXT,                        -- 상대국
    
    -- 본문 데이터
    content TEXT,
    content_eng TEXT,
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_treaties_name ON treaties(treaty_name);
CREATE INDEX IF NOT EXISTS idx_treaties_type ON treaties(treaty_type);
CREATE INDEX IF NOT EXISTS idx_treaties_date ON treaties(enforcement_date);

-- ============================================
-- 8. 위원회 결정문 테이블 (통합)
-- API: ppc, ftc, acr, fsc, nlrc 등 12개 위원회
-- ============================================
CREATE TABLE IF NOT EXISTS committee_decisions (
    id BIGSERIAL PRIMARY KEY,
    decision_seq TEXT NOT NULL,              -- 결정문일련번호
    committee_code TEXT NOT NULL,            -- 위원회코드 (ppc, ftc 등)
    committee_name TEXT NOT NULL,            -- 위원회명
    case_id TEXT,                            -- 사건번호
    case_name TEXT,                          -- 사건명
    decision_date DATE,                      -- 결정일
    decision_type TEXT,                      -- 결정유형
    
    -- 본문 필드
    summary TEXT,                            -- 결정요지
    full_text TEXT,                          -- 전문
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(decision_seq, committee_code)
);

CREATE INDEX IF NOT EXISTS idx_committee_decisions_code ON committee_decisions(committee_code);
CREATE INDEX IF NOT EXISTS idx_committee_decisions_name ON committee_decisions(committee_name);
CREATE INDEX IF NOT EXISTS idx_committee_decisions_date ON committee_decisions(decision_date);

-- ============================================
-- 9. 중앙부처 법령해석 테이블
-- API: moelCgmExpc, molitCgmExpc 등 39개 부처
-- ============================================
CREATE TABLE IF NOT EXISTS ministry_interpretations (
    id BIGSERIAL PRIMARY KEY,
    interp_seq TEXT NOT NULL,                -- 해석례일련번호
    ministry_code TEXT NOT NULL,             -- 부처코드 (moel, molit 등)
    ministry_name TEXT NOT NULL,             -- 부처명
    title TEXT,                              -- 제목
    interpretation_date DATE,                -- 해석일자
    
    -- 본문 필드
    question TEXT,                           -- 질의요지
    answer TEXT,                             -- 회답
    
    -- 참조 정보
    ref_articles TEXT,
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(interp_seq, ministry_code)
);

CREATE INDEX IF NOT EXISTS idx_ministry_interp_code ON ministry_interpretations(ministry_code);
CREATE INDEX IF NOT EXISTS idx_ministry_interp_name ON ministry_interpretations(ministry_name);
CREATE INDEX IF NOT EXISTS idx_ministry_interp_date ON ministry_interpretations(interpretation_date);

-- ============================================
-- 10. 특별행정심판 테이블
-- API: ttSpecialDecc, kmstSpecialDecc, acrSpecialDecc, adapSpecialDecc
-- ============================================
CREATE TABLE IF NOT EXISTS special_admin_appeals (
    id BIGSERIAL PRIMARY KEY,
    appeal_seq TEXT NOT NULL,                -- 재결례일련번호
    tribunal_code TEXT NOT NULL,             -- 심판원코드
    tribunal_name TEXT NOT NULL,             -- 심판원명 (조세심판원, 해양안전심판원 등)
    case_id TEXT,                            -- 사건번호
    case_name TEXT,                          -- 사건명
    decision_date DATE,                      -- 재결일
    decision_type TEXT,                      -- 재결유형
    
    -- 본문 필드
    summary TEXT,
    full_text TEXT,
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(appeal_seq, tribunal_code)
);

CREATE INDEX IF NOT EXISTS idx_special_appeals_tribunal ON special_admin_appeals(tribunal_code);
CREATE INDEX IF NOT EXISTS idx_special_appeals_date ON special_admin_appeals(decision_date);

-- ============================================
-- 동기화 설정 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS sync_sources (
    id BIGSERIAL PRIMARY KEY,
    source_type TEXT UNIQUE NOT NULL,        -- laws, precedents, admin_rules 등
    api_target TEXT NOT NULL,                -- API target 값 (eflaw, prec 등)
    is_enabled BOOLEAN DEFAULT TRUE,         -- 동기화 활성화 여부
    priority INTEGER DEFAULT 100,            -- 동기화 우선순위 (낮을수록 먼저)
    last_full_sync_at TIMESTAMP,             -- 마지막 전체 동기화
    last_incremental_sync_at TIMESTAMP,      -- 마지막 증분 동기화
    sync_interval_hours INTEGER DEFAULT 24,  -- 동기화 주기 (시간)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 동기화 소스 설정
INSERT INTO sync_sources (source_type, api_target, priority) VALUES
    ('laws', 'eflaw', 10),
    ('laws_history', 'lsHistory', 20),
    ('admin_rules', 'admrul', 30),
    ('local_laws', 'ordin', 40),
    ('precedents', 'prec', 50),
    ('constitutional_decisions', 'detc', 60),
    ('legal_interpretations', 'expc', 70),
    ('admin_appeals', 'decc', 80),
    ('treaties', 'trty', 90),
    ('committee_decisions', 'ppc', 100),
    ('ministry_interpretations', 'moelCgmExpc', 110),
    ('special_admin_appeals', 'ttSpecialDecc', 120)
ON CONFLICT (source_type) DO NOTHING;

-- ============================================
-- RLS 정책 (신규 테이블용)
-- ============================================
ALTER TABLE admin_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitutional_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE treaties ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_admin_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_sources ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access on admin_rules" ON admin_rules FOR SELECT USING (true);
CREATE POLICY "Public read access on local_laws" ON local_laws FOR SELECT USING (true);
CREATE POLICY "Public read access on constitutional_decisions" ON constitutional_decisions FOR SELECT USING (true);
CREATE POLICY "Public read access on legal_interpretations" ON legal_interpretations FOR SELECT USING (true);
CREATE POLICY "Public read access on admin_appeals" ON admin_appeals FOR SELECT USING (true);
CREATE POLICY "Public read access on treaties" ON treaties FOR SELECT USING (true);
CREATE POLICY "Public read access on committee_decisions" ON committee_decisions FOR SELECT USING (true);
CREATE POLICY "Public read access on ministry_interpretations" ON ministry_interpretations FOR SELECT USING (true);
CREATE POLICY "Public read access on special_admin_appeals" ON special_admin_appeals FOR SELECT USING (true);
CREATE POLICY "Public read access on sync_sources" ON sync_sources FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access on admin_rules" ON admin_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on local_laws" ON local_laws FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on constitutional_decisions" ON constitutional_decisions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on legal_interpretations" ON legal_interpretations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on admin_appeals" ON admin_appeals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on treaties" ON treaties FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on committee_decisions" ON committee_decisions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on ministry_interpretations" ON ministry_interpretations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on special_admin_appeals" ON special_admin_appeals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on sync_sources" ON sync_sources FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 뷰 (통합 검색용)
-- ============================================

-- 모든 법률 문서 통합 뷰
CREATE OR REPLACE VIEW all_legal_documents AS
SELECT 
    'law' as doc_type,
    id,
    law_name as title,
    NULL as case_id,
    enforcement_date as effective_date,
    ministry as organization,
    source_url
FROM laws WHERE status = 'ACTIVE'
UNION ALL
SELECT 
    'precedent' as doc_type,
    id,
    case_name as title,
    case_id,
    decision_date as effective_date,
    court as organization,
    source_url
FROM precedents
UNION ALL
SELECT 
    'constitutional_decision' as doc_type,
    id,
    case_name as title,
    case_id,
    decision_date as effective_date,
    '헌법재판소' as organization,
    source_url
FROM constitutional_decisions
UNION ALL
SELECT 
    'legal_interpretation' as doc_type,
    id,
    title,
    NULL as case_id,
    interpretation_date as effective_date,
    answerer as organization,
    source_url
FROM legal_interpretations
UNION ALL
SELECT 
    'admin_appeal' as doc_type,
    id,
    case_name as title,
    case_id,
    decision_date as effective_date,
    agency as organization,
    source_url
FROM admin_appeals;

-- ============================================
-- 통계 뷰
-- ============================================
CREATE OR REPLACE VIEW sync_statistics AS
SELECT
    'laws' as source_type,
    COUNT(*) as total_count,
    MAX(last_synced_at) as last_synced
FROM laws
UNION ALL
SELECT 'precedents', COUNT(*), MAX(last_synced_at) FROM precedents
UNION ALL
SELECT 'admin_rules', COUNT(*), MAX(last_synced_at) FROM admin_rules
UNION ALL
SELECT 'local_laws', COUNT(*), MAX(last_synced_at) FROM local_laws
UNION ALL
SELECT 'constitutional_decisions', COUNT(*), MAX(last_synced_at) FROM constitutional_decisions
UNION ALL
SELECT 'legal_interpretations', COUNT(*), MAX(last_synced_at) FROM legal_interpretations
UNION ALL
SELECT 'admin_appeals', COUNT(*), MAX(last_synced_at) FROM admin_appeals
UNION ALL
SELECT 'treaties', COUNT(*), MAX(last_synced_at) FROM treaties
UNION ALL
SELECT 'committee_decisions', COUNT(*), MAX(last_synced_at) FROM committee_decisions
UNION ALL
SELECT 'ministry_interpretations', COUNT(*), MAX(last_synced_at) FROM ministry_interpretations
UNION ALL
SELECT 'special_admin_appeals', COUNT(*), MAX(last_synced_at) FROM special_admin_appeals;



