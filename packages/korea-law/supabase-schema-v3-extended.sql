-- ============================================
-- korea-law: Supabase Schema v3 - 2024.12 신규 API 확장
-- 중앙부처 1차해석, 한눈보기, 국세/산재 판례
-- ============================================

-- ============================================
-- 1. 중앙부처 1차해석 테이블 (cgmExpc)
-- 2024.12 신규 개방 - 15만여 건
-- ============================================
CREATE TABLE IF NOT EXISTS cgm_expc_interpretations (
    id BIGSERIAL PRIMARY KEY,
    interp_seq TEXT NOT NULL,                -- 해석일련번호
    ministry_code TEXT NOT NULL,             -- 부처코드 (nts, kcs, moi 등)
    ministry_name TEXT NOT NULL,             -- 부처명 (국세청, 관세청 등)
    
    -- 기본 정보
    case_no TEXT,                            -- 안건번호
    title TEXT NOT NULL,                     -- 안건명
    requestor TEXT,                          -- 질의기관
    interpretation_date DATE,                -- 해석일자
    receipt_date DATE,                       -- 접수일자
    reply_status TEXT,                       -- 회신여부
    process_status TEXT,                     -- 처리상태
    
    -- 본문 필드
    background TEXT,                         -- 질의배경
    related_law TEXT,                        -- 관련법령조항
    question TEXT,                           -- 질의요지
    answer TEXT,                             -- 회답
    reasoning TEXT,                          -- 이유
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(interp_seq, ministry_code)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cgm_expc_ministry ON cgm_expc_interpretations(ministry_code);
CREATE INDEX IF NOT EXISTS idx_cgm_expc_date ON cgm_expc_interpretations(interpretation_date);
CREATE INDEX IF NOT EXISTS idx_cgm_expc_title ON cgm_expc_interpretations USING gin(to_tsvector('simple', title));

-- ============================================
-- 2. 한눈보기 테이블 (OneView)
-- 2024.10 신규 개방 - 법령 시각화 콘텐츠
-- ============================================
CREATE TABLE IF NOT EXISTS one_view_contents (
    id BIGSERIAL PRIMARY KEY,
    oneview_seq TEXT UNIQUE NOT NULL,        -- 한눈보기일련번호
    
    -- 기본 정보
    title TEXT NOT NULL,                     -- 제목
    category TEXT,                           -- 주제분류
    related_law_name TEXT,                   -- 관련법령명
    related_law_id TEXT,                     -- 법령ID
    author_dept TEXT,                        -- 담당부서
    created_date DATE,                       -- 작성일자
    
    -- 본문 필드
    content TEXT,                            -- 본문 내용
    related_article TEXT,                    -- 관련조문
    
    -- 시각 콘텐츠 (JSON 배열로 저장)
    visual_content_urls JSONB,               -- 시각콘텐츠 URL 배열
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_oneview_title ON one_view_contents USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_oneview_law ON one_view_contents(related_law_name);
CREATE INDEX IF NOT EXISTS idx_oneview_category ON one_view_contents(category);

-- ============================================
-- 3. 국세법령정보시스템 판례 테이블
-- 2024.12 신규 개방 - 4만 5천여 건
-- ============================================
CREATE TABLE IF NOT EXISTS nts_precedents (
    id BIGSERIAL PRIMARY KEY,
    prec_seq TEXT UNIQUE NOT NULL,           -- 판례일련번호
    
    -- 기본 정보
    case_id TEXT,                            -- 사건번호
    case_name TEXT,                          -- 사건명
    decision_date DATE,                      -- 선고일자
    court TEXT,                              -- 법원명
    judgment_type TEXT,                      -- 판결유형
    tax_type TEXT,                           -- 세목 (소득세, 법인세 등)
    
    -- 본문 필드
    summary TEXT,                            -- 판시사항
    holding TEXT,                            -- 판결요지
    full_text TEXT,                          -- 전문
    
    -- 참조 정보
    ref_articles TEXT,                       -- 참조조문
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_nts_prec_case_id ON nts_precedents(case_id);
CREATE INDEX IF NOT EXISTS idx_nts_prec_date ON nts_precedents(decision_date);
CREATE INDEX IF NOT EXISTS idx_nts_prec_tax_type ON nts_precedents(tax_type);

-- ============================================
-- 4. 근로복지공단 산재 판례 테이블
-- 2024.12 신규 개방 - 2만 7천여 건
-- ============================================
CREATE TABLE IF NOT EXISTS comwel_precedents (
    id BIGSERIAL PRIMARY KEY,
    prec_seq TEXT UNIQUE NOT NULL,           -- 판례일련번호
    
    -- 기본 정보
    case_id TEXT,                            -- 사건번호
    case_name TEXT,                          -- 사건명
    decision_date DATE,                      -- 선고일자
    injury_type TEXT,                        -- 재해유형
    recognition_status TEXT,                 -- 인정여부 (인정/불인정)
    
    -- 본문 필드
    summary TEXT,                            -- 판시사항
    holding TEXT,                            -- 판결요지
    full_text TEXT,                          -- 전문
    
    -- 참조 정보
    ref_articles TEXT,                       -- 참조조문
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_comwel_prec_case_id ON comwel_precedents(case_id);
CREATE INDEX IF NOT EXISTS idx_comwel_prec_date ON comwel_precedents(decision_date);
CREATE INDEX IF NOT EXISTS idx_comwel_prec_injury ON comwel_precedents(injury_type);

-- ============================================
-- 5. 조세심판원 재결례 확장 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS tax_tribunal_decisions (
    id BIGSERIAL PRIMARY KEY,
    decision_seq TEXT UNIQUE NOT NULL,       -- 재결일련번호
    
    -- 기본 정보
    case_id TEXT,                            -- 사건번호
    case_name TEXT,                          -- 사건명
    decision_date DATE,                      -- 재결일자
    disposition_type TEXT,                   -- 처분유형
    disposition_amount TEXT,                 -- 처분금액
    disputed_law TEXT,                       -- 쟁점법령
    decision_result TEXT,                    -- 재결결과 (인용/기각/각하)
    
    -- 본문 필드
    summary TEXT,                            -- 재결요지
    full_text TEXT,                          -- 전문
    
    -- 메타데이터
    source_url TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tax_tribunal_case_id ON tax_tribunal_decisions(case_id);
CREATE INDEX IF NOT EXISTS idx_tax_tribunal_date ON tax_tribunal_decisions(decision_date);
CREATE INDEX IF NOT EXISTS idx_tax_tribunal_result ON tax_tribunal_decisions(decision_result);

-- ============================================
-- sync_sources 업데이트
-- ============================================
INSERT INTO sync_sources (source_type, api_target, priority) VALUES
    ('cgm_expc_nts', 'cgmExpcNts', 200),
    ('cgm_expc_kcs', 'cgmExpcKcs', 201),
    ('cgm_expc_moi', 'cgmExpcMoi', 202),
    ('cgm_expc_moef', 'cgmExpcMoef', 203),
    ('cgm_expc_moel', 'cgmExpcMoel', 204),
    ('cgm_expc_mohw', 'cgmExpcMohw', 205),
    ('cgm_expc_molit', 'cgmExpcMolit', 206),
    ('one_view', 'oneview', 210),
    ('nts_precedents', 'ntsPrec', 220),
    ('comwel_precedents', 'comwelPrec', 230),
    ('tax_tribunal', 'taxtrExt', 240)
ON CONFLICT (source_type) DO NOTHING;

-- ============================================
-- RLS 정책
-- ============================================
ALTER TABLE cgm_expc_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_view_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE nts_precedents ENABLE ROW LEVEL SECURITY;
ALTER TABLE comwel_precedents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_tribunal_decisions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access on cgm_expc" ON cgm_expc_interpretations FOR SELECT USING (true);
CREATE POLICY "Public read access on one_view" ON one_view_contents FOR SELECT USING (true);
CREATE POLICY "Public read access on nts_prec" ON nts_precedents FOR SELECT USING (true);
CREATE POLICY "Public read access on comwel_prec" ON comwel_precedents FOR SELECT USING (true);
CREATE POLICY "Public read access on tax_tribunal" ON tax_tribunal_decisions FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full on cgm_expc" ON cgm_expc_interpretations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full on one_view" ON one_view_contents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full on nts_prec" ON nts_precedents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full on comwel_prec" ON comwel_precedents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full on tax_tribunal" ON tax_tribunal_decisions FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 통계 뷰 업데이트
-- ============================================
CREATE OR REPLACE VIEW sync_statistics_v3 AS
SELECT
    'laws' as source_type,
    COUNT(*) as total_count,
    MAX(last_synced_at) as last_synced
FROM laws
UNION ALL
SELECT 'precedents', COUNT(*), MAX(last_synced_at) FROM precedents
UNION ALL
SELECT 'cgm_expc_interpretations', COUNT(*), MAX(last_synced_at) FROM cgm_expc_interpretations
UNION ALL
SELECT 'one_view_contents', COUNT(*), MAX(last_synced_at) FROM one_view_contents
UNION ALL
SELECT 'nts_precedents', COUNT(*), MAX(last_synced_at) FROM nts_precedents
UNION ALL
SELECT 'comwel_precedents', COUNT(*), MAX(last_synced_at) FROM comwel_precedents
UNION ALL
SELECT 'tax_tribunal_decisions', COUNT(*), MAX(last_synced_at) FROM tax_tribunal_decisions;

-- ============================================
-- 부처별 1차해석 통계 뷰
-- ============================================
CREATE OR REPLACE VIEW cgm_expc_statistics AS
SELECT 
    ministry_code,
    ministry_name,
    COUNT(*) as total_count,
    MIN(interpretation_date) as earliest_date,
    MAX(interpretation_date) as latest_date,
    MAX(last_synced_at) as last_synced
FROM cgm_expc_interpretations
GROUP BY ministry_code, ministry_name
ORDER BY total_count DESC;
