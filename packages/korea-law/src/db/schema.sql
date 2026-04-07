-- ============================================
-- korea-law: 한국 법률 MCP 서버 DB 스키마
-- ============================================
-- ⚠️ 중요: 이 DB는 "검증용(Verification)" 목적입니다.
-- AI가 생성한 법률 인용의 정확성을 검증하기 위한 기준 데이터입니다.
-- 법적 효력의 최종 판단은 국가법령정보센터(law.go.kr)를 참조하세요.
-- ============================================

-- 법령 마스터 테이블 (버전 관리)
-- 용도: AI 인용 검증의 "기준값" 저장
CREATE TABLE IF NOT EXISTS Laws (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_mst_id TEXT UNIQUE NOT NULL,    -- 국가법령정보센터 법령 ID
    law_name TEXT NOT NULL,              -- 법령명 (예: 근로기준법)
    law_name_eng TEXT,                   -- 영문 법령명
    promulgation_date DATE NOT NULL,     -- 공포일 (법이 세상에 알려진 날)
    enforcement_date DATE NOT NULL,      -- 시행일 (실제 효력 발생일)
    law_type TEXT,                       -- 법률/시행령/시행규칙 등
    ministry TEXT,                       -- 소관부처
    status TEXT DEFAULT 'ACTIVE',        -- ACTIVE(현행)/PENDING(미시행)/EXPIRED(폐지)
    
    -- 검증용 메타데이터
    source_url TEXT,                     -- 원본 출처 URL
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT,                       -- 데이터 무결성 확인용 해시
    
    -- 인덱스를 위한 정규화된 검색 필드
    law_name_normalized TEXT,            -- 검색용 정규화 (공백/특수문자 제거)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 조문 데이터 테이블
-- 용도: AI가 "제23조"를 인용했을 때, 실제 내용과 대조하는 "정답지"
CREATE TABLE IF NOT EXISTS Articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,
    article_no TEXT NOT NULL,            -- "제23조", "제23조의2" 등
    article_no_normalized TEXT,          -- 정규화된 조문번호 (23, 23-2)
    article_title TEXT,                  -- 조문 제목 (예: 해고의 제한)
    content TEXT NOT NULL,               -- 조문 본문 전체
    paragraph_count INTEGER DEFAULT 1,   -- 항 개수
    
    -- ⚠️ 검증 전용 필드
    content_hash TEXT,                   -- 내용 해시 (변경 감지용)
    is_definition BOOLEAN DEFAULT FALSE, -- 제2조(정의) 여부 (용어 검증용)
    
    effective_from DATE,                 -- 이 조문의 시행일
    effective_until DATE,                -- 효력 종료일 (NULL = 현행)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE,
    UNIQUE(law_id, article_no)          -- 같은 법령의 같은 조문번호는 중복 불가
);

-- 변경 이력 테이블 (Diff Engine)
-- 용도: "어제와 오늘 뭐가 바뀌었나?" 추적
CREATE TABLE IF NOT EXISTS Diff_Logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,
    article_id INTEGER,                  -- NULL이면 법령 전체 변경
    
    change_type TEXT NOT NULL,           -- 'ADDED', 'MODIFIED', 'DELETED'
    
    -- 변경 전후 내용 (검증용)
    previous_content TEXT,
    current_content TEXT,
    diff_summary TEXT,                   -- 변경 요약 (예: "과태료 500만원 → 1000만원")
    
    -- 시점 정보
    detected_at DATE DEFAULT CURRENT_DATE,
    effective_from DATE,                 -- 변경 시행일
    
    -- ⚠️ AI 경고용 플래그
    is_critical BOOLEAN DEFAULT FALSE,   -- 중요 변경 여부 (금액/기간/처벌 등)
    warning_message TEXT,                -- AI에게 전달할 경고 메시지
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES Articles(id) ON DELETE SET NULL
);

-- 판례 인덱스 테이블
-- 용도: AI가 인용한 판례가 실제 존재하는지 "가짜 판례 방지" + 판례 내용 검증
CREATE TABLE IF NOT EXISTS Precedents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    precedent_serial_number INTEGER,     -- 판례일련번호 (API용)
    case_id TEXT UNIQUE NOT NULL,        -- 사건번호 (예: 2023다12345)
    case_id_normalized TEXT,             -- 정규화된 사건번호
    court TEXT,                          -- 법원명 (대법원, 서울고등법원 등)
    case_type TEXT,                      -- 민사/형사/행정 등
    decision_date DATE,                  -- 선고일
    case_name TEXT,                      -- 사건명

    -- ⚠️ 검증 전용: 존재 여부만 확인
    exists_verified BOOLEAN DEFAULT TRUE,
    last_verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 📄 판례 전문 데이터 (Phase 2 추가)
    summary TEXT,                        -- 판시사항 (핵심 쟁점)
    key_points TEXT,                     -- 판결요지 (법원의 판단)
    full_text TEXT,                      -- 판례 전문
    referenced_statutes TEXT,            -- 참조조문
    referenced_cases TEXT,               -- 참조판례

    -- 전문 동기화 메타데이터
    full_text_synced_at DATETIME,        -- 전문 동기화 시간
    sync_priority TEXT DEFAULT 'medium', -- 동기화 우선순위 (high/medium/low)

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 용어 정의 테이블 (법률 용어 사전)
-- 용도: AI가 "해고"라고 썼는데 "권고사직"이 맞는지 검증
CREATE TABLE IF NOT EXISTS LegalTerms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_id INTEGER NOT NULL,
    term TEXT NOT NULL,                  -- 용어 (예: 해고, 근로자)
    term_normalized TEXT,                -- 정규화된 용어
    definition TEXT NOT NULL,            -- 정의 내용
    article_ref TEXT,                    -- 출처 조문 (예: 제2조제1항제1호)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (law_id) REFERENCES Laws(id) ON DELETE CASCADE
);

-- ============================================
-- 인덱스 생성 (검색 성능 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_laws_name ON Laws(law_name);
CREATE INDEX IF NOT EXISTS idx_laws_name_normalized ON Laws(law_name_normalized);
CREATE INDEX IF NOT EXISTS idx_laws_enforcement ON Laws(enforcement_date);
CREATE INDEX IF NOT EXISTS idx_laws_status ON Laws(status);

CREATE INDEX IF NOT EXISTS idx_articles_law_id ON Articles(law_id);
CREATE INDEX IF NOT EXISTS idx_articles_no ON Articles(article_no);
CREATE INDEX IF NOT EXISTS idx_articles_no_normalized ON Articles(article_no_normalized);

CREATE INDEX IF NOT EXISTS idx_diff_law_id ON Diff_Logs(law_id);
CREATE INDEX IF NOT EXISTS idx_diff_detected ON Diff_Logs(detected_at);
CREATE INDEX IF NOT EXISTS idx_diff_effective ON Diff_Logs(effective_from);

CREATE INDEX IF NOT EXISTS idx_precedents_case_id ON Precedents(case_id);
CREATE INDEX IF NOT EXISTS idx_precedents_case_normalized ON Precedents(case_id_normalized);

CREATE INDEX IF NOT EXISTS idx_terms_term ON LegalTerms(term);
CREATE INDEX IF NOT EXISTS idx_terms_normalized ON LegalTerms(term_normalized);

-- ============================================
-- 검증 메타데이터 테이블
-- 용도: DB 자체의 신뢰성 및 최신성 확인
-- ============================================
CREATE TABLE IF NOT EXISTS SyncMetadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,             -- 'FULL', 'INCREMENTAL', 'DIFF'
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    status TEXT DEFAULT 'RUNNING',       -- 'RUNNING', 'SUCCESS', 'FAILED'
    
    laws_added INTEGER DEFAULT 0,
    laws_updated INTEGER DEFAULT 0,
    articles_added INTEGER DEFAULT 0,
    articles_updated INTEGER DEFAULT 0,
    diffs_detected INTEGER DEFAULT 0,
    
    error_message TEXT,
    
    -- ⚠️ 검증용: 마지막 동기화 시점 확인
    source_data_date DATE,               -- 원본 데이터의 기준 날짜
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 뷰 생성 (자주 사용하는 쿼리)
-- ============================================

-- 현행 유효 법령만 조회
CREATE VIEW IF NOT EXISTS CurrentLaws AS
SELECT * FROM Laws 
WHERE status = 'ACTIVE' 
AND enforcement_date <= DATE('now');

-- 오늘 변경된 사항
CREATE VIEW IF NOT EXISTS TodayDiffs AS
SELECT 
    d.*,
    l.law_name,
    a.article_no,
    a.article_title
FROM Diff_Logs d
JOIN Laws l ON d.law_id = l.id
LEFT JOIN Articles a ON d.article_id = a.id
WHERE d.detected_at = DATE('now');

-- 미래 시행 예정 (공포됨/미시행)
CREATE VIEW IF NOT EXISTS PendingLaws AS
SELECT * FROM Laws 
WHERE status = 'PENDING'
OR enforcement_date > DATE('now');

-- ============================================
-- Full Text Search (FTS5) 테이블
-- 용도: 시나리오 기반 법령 검색 (review_compliance)
-- ============================================
CREATE VIRTUAL TABLE IF NOT EXISTS Articles_FTS USING fts5(
    article_no,
    article_title,
    content,
    content='Articles',
    content_rowid='id'
);

-- FTS 트리거: Articles 테이블 변경 시 자동 동기화
CREATE TRIGGER IF NOT EXISTS articles_fts_insert AFTER INSERT ON Articles BEGIN
    INSERT INTO Articles_FTS(rowid, article_no, article_title, content)
    VALUES (NEW.id, NEW.article_no, NEW.article_title, NEW.content);
END;

CREATE TRIGGER IF NOT EXISTS articles_fts_delete AFTER DELETE ON Articles BEGIN
    INSERT INTO Articles_FTS(Articles_FTS, rowid, article_no, article_title, content)
    VALUES ('delete', OLD.id, OLD.article_no, OLD.article_title, OLD.content);
END;

CREATE TRIGGER IF NOT EXISTS articles_fts_update AFTER UPDATE ON Articles BEGIN
    INSERT INTO Articles_FTS(Articles_FTS, rowid, article_no, article_title, content)
    VALUES ('delete', OLD.id, OLD.article_no, OLD.article_title, OLD.content);
    INSERT INTO Articles_FTS(rowid, article_no, article_title, content)
    VALUES (NEW.id, NEW.article_no, NEW.article_title, NEW.content);
END;

-- ============================================
-- 인용 검증 로그 테이블
-- 용도: check_legal_citation 결과 저장
-- ============================================
CREATE TABLE IF NOT EXISTS Citation_Logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    law_name TEXT NOT NULL,
    article_no TEXT NOT NULL,
    quoted_text TEXT,
    actual_text TEXT,
    similarity_score REAL,
    match_status TEXT,              -- 'EXACT', 'PARTIAL', 'MISMATCH', 'NOT_FOUND'
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 검증 메타데이터
    law_id INTEGER,
    article_id INTEGER,
    FOREIGN KEY (law_id) REFERENCES Laws(id),
    FOREIGN KEY (article_id) REFERENCES Articles(id)
);

-- ============================================
-- 교차 참조 테이블
-- 용도: validate_references 결과 저장
-- ============================================
CREATE TABLE IF NOT EXISTS Cross_References (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_law_id INTEGER NOT NULL,
    source_article_id INTEGER,
    source_article_no TEXT,
    
    referenced_law_name TEXT,       -- 참조된 법령명 (추출된 텍스트)
    referenced_article_no TEXT,     -- 참조된 조문번호 (추출된 텍스트)
    
    target_law_id INTEGER,          -- 실제 매칭된 법령 ID (NULL이면 broken)
    target_article_id INTEGER,      -- 실제 매칭된 조문 ID (NULL이면 broken)
    
    is_valid BOOLEAN DEFAULT FALSE, -- 유효한 참조인지
    is_external BOOLEAN DEFAULT FALSE, -- 외부 법령 참조인지
    
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (source_law_id) REFERENCES Laws(id),
    FOREIGN KEY (source_article_id) REFERENCES Articles(id)
);

CREATE INDEX IF NOT EXISTS idx_cross_ref_source ON Cross_References(source_law_id);
CREATE INDEX IF NOT EXISTS idx_cross_ref_valid ON Cross_References(is_valid);
CREATE INDEX IF NOT EXISTS idx_citation_law ON Citation_Logs(law_name);

