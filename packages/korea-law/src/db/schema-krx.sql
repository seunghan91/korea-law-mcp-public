-- ============================================
-- KRX 규정 (한국거래소 규정) 스키마
-- ============================================
-- 용도: 거래소 규정 검색 및 조문 검증
-- 원본: krx_listing 프로젝트 크롤링 데이터
-- ============================================

-- KRX 규정 마스터 테이블
CREATE TABLE IF NOT EXISTS KrxRegulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reg_id TEXT UNIQUE,                    -- 규정 ID (예: 210073336)
    reg_name TEXT NOT NULL,                -- 규정명 (예: 유가증권시장 상장규정)
    reg_type TEXT,                         -- 규정/시행세칙/운영기준/지침
    market TEXT,                           -- 유가증권/코스닥/코넥스/파생상품/공통
    status TEXT DEFAULT 'ACTIVE',          -- ACTIVE/EXPIRED
    source_url TEXT,                       -- 원본 URL
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- KRX 규정 조문(청크) 테이블
CREATE TABLE IF NOT EXISTS KrxRegulationChunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regulation_id INTEGER NOT NULL,
    chunk_id TEXT,                          -- 청크 고유 ID
    article_no TEXT,                        -- 조문번호 (제1조, 제2조 등)
    title TEXT,                             -- 조문 제목
    content TEXT NOT NULL,                  -- 조문 본문
    chunk_index INTEGER,                    -- 청크 순서
    metadata TEXT,                          -- JSON 메타데이터

    FOREIGN KEY (regulation_id) REFERENCES KrxRegulations(id) ON DELETE CASCADE
);

-- 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_krx_reg_name ON KrxRegulations(reg_name);
CREATE INDEX IF NOT EXISTS idx_krx_reg_market ON KrxRegulations(market);
CREATE INDEX IF NOT EXISTS idx_krx_chunks_reg_id ON KrxRegulationChunks(regulation_id);
CREATE INDEX IF NOT EXISTS idx_krx_chunks_article ON KrxRegulationChunks(article_no);

-- FTS5 전문 검색 (조문 내용)
CREATE VIRTUAL TABLE IF NOT EXISTS KrxRegulationChunks_fts USING fts5(
    content,
    title,
    article_no,
    content='KrxRegulationChunks',
    content_rowid='id',
    tokenize='unicode61'
);

-- FTS 트리거: INSERT
CREATE TRIGGER IF NOT EXISTS krx_chunks_ai AFTER INSERT ON KrxRegulationChunks BEGIN
    INSERT INTO KrxRegulationChunks_fts(rowid, content, title, article_no)
    VALUES (new.id, new.content, new.title, new.article_no);
END;

-- FTS 트리거: DELETE
CREATE TRIGGER IF NOT EXISTS krx_chunks_ad AFTER DELETE ON KrxRegulationChunks BEGIN
    INSERT INTO KrxRegulationChunks_fts(KrxRegulationChunks_fts, rowid, content, title, article_no)
    VALUES ('delete', old.id, old.content, old.title, old.article_no);
END;

-- FTS 트리거: UPDATE
CREATE TRIGGER IF NOT EXISTS krx_chunks_au AFTER UPDATE ON KrxRegulationChunks BEGIN
    INSERT INTO KrxRegulationChunks_fts(KrxRegulationChunks_fts, rowid, content, title, article_no)
    VALUES ('delete', old.id, old.content, old.title, old.article_no);
    INSERT INTO KrxRegulationChunks_fts(rowid, content, title, article_no)
    VALUES (new.id, new.content, new.title, new.article_no);
END;
