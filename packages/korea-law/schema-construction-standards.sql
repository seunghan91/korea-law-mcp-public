-- ============================================
-- 국가건설기준 (KDS/KCS) 통합 스키마
-- ============================================
-- 기존 Laws, Articles 테이블과 유사한 구조로 설계
-- 법령 데이터와 건설기준 데이터를 통합 관리

-- ============================================
-- 건설기준 테이블 (Laws 테이블에 대응)
-- ============================================
CREATE TABLE IF NOT EXISTS ConstructionStandards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 기준 식별자 (Laws.law_mst_id에 대응)
    kcsc_cd TEXT UNIQUE NOT NULL,        -- 'KDS 10 00 00', 'KCS 10 10 05' 등
    group_seq INTEGER,                   -- KCSC 내부 그룹 ID

    -- 기준명 (Laws.law_name에 대응)
    standard_name TEXT NOT NULL,         -- 기준명 (예: 공통설계기준)
    standard_name_eng TEXT,              -- 영문 기준명

    -- 분류 체계
    doc_type TEXT NOT NULL,              -- 'KDS', 'KCS', 'NHCS', 'SMCS'
    main_category TEXT,                  -- 대분류 (예: 공통 설계기준)
    middle_category TEXT,                -- 중분류 (예: 공통설계기준)

    -- 시행/개정 정보 (Laws.enforcement_date에 대응)
    establishment_date DATE,             -- 제정일
    revision_date DATE,                  -- 최종 개정일
    effective_date DATE,                 -- 시행일

    -- 담당 기관 (Laws.ministry에 대응)
    dept TEXT,                           -- 소관부서 (예: 국토교통부 기술혁신과)
    consider_org TEXT,                   -- 심의기관 (예: 중앙건설기술심의위원회)
    advice_org TEXT,                     -- 자문기관
    publish_org TEXT,                    -- 발행기관

    -- 문서 파일
    doc_file_grp_id TEXT,                -- 문서 파일 그룹 ID (PDF 다운로드용)

    -- 상태 (Laws.status에 대응)
    is_latest BOOLEAN DEFAULT TRUE,      -- 최신 버전 여부
    status TEXT DEFAULT 'ACTIVE',        -- ACTIVE/DEPRECATED/SUPERSEDED

    -- 동기화 메타데이터
    source TEXT DEFAULT 'KCSC',          -- 데이터 출처
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT,                       -- 데이터 무결성 해시

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 건설기준 개정 이력 (Diff_Logs에 대응)
-- ============================================
CREATE TABLE IF NOT EXISTS ConstructionStandardRevisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    standard_id INTEGER NOT NULL,

    -- 이력 정보
    doc_info_seq INTEGER,                -- KCSC 문서 정보 시퀀스
    doc_year TEXT,                       -- 문서 연도 (예: '2021')
    doc_cycle INTEGER,                   -- 개정 차수
    doc_er TEXT,                         -- 제/개정 구분 (R: 개정)

    -- 날짜 정보
    establishment_date DATE,             -- 제정일
    revision_date DATE,                  -- 개정일
    effective_from DATE,                 -- 적용 시작일
    effective_until DATE,                -- 적용 종료일 (NULL = 현행)

    -- 변경 내용
    revision_remark TEXT,                -- 개정 사유/요약
    doc_brief TEXT,                      -- 문서 개요

    -- 파일 정보
    doc_file_grp_id TEXT,                -- 해당 버전 파일 ID

    -- 버전 정보
    is_latest BOOLEAN DEFAULT FALSE,     -- 최신 버전 여부
    doc_order INTEGER,                   -- 문서 순서

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (standard_id) REFERENCES ConstructionStandards(id) ON DELETE CASCADE
);

-- ============================================
-- 건설기준 조문 (Articles에 대응) - Phase 2
-- ============================================
-- PDF 파싱 후 조문 단위 데이터 저장용
CREATE TABLE IF NOT EXISTS ConstructionStandardArticles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    standard_id INTEGER NOT NULL,
    revision_id INTEGER,

    chapter_no TEXT,                   -- 장 번호 (예: '1')
    section_no TEXT,                   -- 절 번호 (예: '1.1')
    article_no TEXT,                   -- 조 번호 (예: '1.1.1')

    title TEXT,                        -- 조문 제목
    content TEXT,                      -- 조문 내용

    content_hash TEXT,                 -- 변경 감지용 해시

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (standard_id) REFERENCES ConstructionStandards(id) ON DELETE CASCADE,
    FOREIGN KEY (revision_id) REFERENCES ConstructionStandardRevisions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_csa_standard_id ON ConstructionStandardArticles(standard_id);
CREATE INDEX IF NOT EXISTS idx_csa_article_no ON ConstructionStandardArticles(article_no);

-- ============================================
-- 건설기준 용어 (LegalTerms에 대응) - Phase 2
-- ============================================
CREATE TABLE IF NOT EXISTS ConstructionTerms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    standard_id INTEGER NOT NULL,

    term TEXT NOT NULL,                -- 용어
    term_normalized TEXT,              -- 정규화된 용어
    definition TEXT NOT NULL,          -- 정의
    article_ref TEXT,                  -- 출처 (예: 1.2.1)

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (standard_id) REFERENCES ConstructionStandards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ct_term ON ConstructionTerms(term);
CREATE INDEX IF NOT EXISTS idx_ct_standard_id ON ConstructionTerms(standard_id);

-- ============================================
-- 법령-건설기준 연계 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS LawStandardRelations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER,                      -- Laws 테이블 참조
    standard_id INTEGER,                 -- ConstructionStandards 테이블 참조

    relation_type TEXT,                  -- 'REFERENCES', 'BASED_ON', 'RELATED'
    description TEXT,                    -- 관계 설명

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE,
    FOREIGN KEY (standard_id) REFERENCES ConstructionStandards(id) ON DELETE CASCADE
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cs_kcsc_cd ON ConstructionStandards(kcsc_cd);
CREATE INDEX IF NOT EXISTS idx_cs_doc_type ON ConstructionStandards(doc_type);
CREATE INDEX IF NOT EXISTS idx_cs_main_category ON ConstructionStandards(main_category);
CREATE INDEX IF NOT EXISTS idx_cs_status ON ConstructionStandards(status);
CREATE INDEX IF NOT EXISTS idx_cs_effective ON ConstructionStandards(effective_date);

CREATE INDEX IF NOT EXISTS idx_csr_standard_id ON ConstructionStandardRevisions(standard_id);
CREATE INDEX IF NOT EXISTS idx_csr_doc_year ON ConstructionStandardRevisions(doc_year);

CREATE INDEX IF NOT EXISTS idx_lsr_law_id ON LawStandardRelations(law_id);
CREATE INDEX IF NOT EXISTS idx_lsr_standard_id ON LawStandardRelations(standard_id);

-- ============================================
-- 뷰: 통합 검색용
-- ============================================
CREATE VIEW IF NOT EXISTS v_all_regulations AS
SELECT
    'LAW' as type,
    law_mst_id as code,
    law_name as name,
    law_type as category,
    enforcement_date as effective_date,
    ministry as org,
    status,
    last_synced_at
FROM Laws
UNION ALL
SELECT
    'STANDARD' as type,
    kcsc_cd as code,
    standard_name as name,
    doc_type || ' - ' || COALESCE(main_category, '') as category,
    effective_date,
    dept as org,
    status,
    last_synced_at
FROM ConstructionStandards;
