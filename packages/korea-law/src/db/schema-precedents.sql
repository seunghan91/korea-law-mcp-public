-- Phase 2: 판례 데이터 테이블
-- AI Hub 데이터 통합을 위한 Supabase 스키마

-- 판례 목록 테이블 (검색용)
CREATE TABLE IF NOT EXISTS precedents (
  -- 기본 정보
  id BIGINT PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL, -- 사건번호
  case_name TEXT NOT NULL, -- 사건명

  -- 메타데이터
  decision_date DATE NOT NULL, -- 선고일자
  case_type TEXT, -- 사건종류명 (민사, 형사 등)
  case_type_code INTEGER, -- 사건종류코드
  court_name TEXT, -- 법원명
  data_source TEXT, -- 데이터출처명

  -- 링크
  detail_link TEXT, -- 판례상세링크

  -- 검색 최적화
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fulltext_indexed BOOLEAN DEFAULT FALSE,

  CONSTRAINT valid_date CHECK (decision_date <= CURRENT_DATE)
);

-- 판례 상세 내용 테이블 (대용량)
CREATE TABLE IF NOT EXISTS precedent_details (
  id BIGINT PRIMARY KEY,
  case_id BIGINT NOT NULL UNIQUE REFERENCES precedents(id) ON DELETE CASCADE,

  -- 상세 내용
  full_text TEXT, -- 판결문 전문
  summary TEXT, -- 요약
  judgment_type TEXT, -- 판결유형

  -- 법령 링크
  related_laws TEXT[] DEFAULT '{}', -- 관련 법령 배열

  -- 메타데이터
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 판례 검색 로그 (분석용)
CREATE TABLE IF NOT EXISTS precedent_search_logs (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER,
  response_time_ms INTEGER,
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source TEXT -- 'api' 또는 'supabase'
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_precedents_case_number ON precedents(case_number);
CREATE INDEX IF NOT EXISTS idx_precedents_decision_date ON precedents(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_precedents_case_type ON precedents(case_type);
CREATE INDEX IF NOT EXISTS idx_precedents_created_at ON precedents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_precedent_details_case_id ON precedent_details(case_id);

-- 전문 검색 인덱스 (한글 검색)
CREATE INDEX IF NOT EXISTS idx_precedents_case_name_trgm ON precedents USING gin(case_name gin_trgm_ops);

-- 함수: 자동 updated_at 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_precedents_updated_at BEFORE UPDATE ON precedents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_precedent_details_updated_at BEFORE UPDATE ON precedent_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 권한 설정
ALTER TABLE precedents ENABLE ROW LEVEL SECURITY;
ALTER TABLE precedent_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE precedent_search_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (모든 사용자 읽기 가능)
CREATE POLICY "Allow public read precedents" ON precedents FOR SELECT USING (true);
CREATE POLICY "Allow public read precedent_details" ON precedent_details FOR SELECT USING (true);
CREATE POLICY "Allow public read search_logs" ON precedent_search_logs FOR SELECT USING (true);

-- 관리자 쓰기
CREATE POLICY "Allow insert precedents" ON precedents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update precedents" ON precedents FOR UPDATE USING (true);
CREATE POLICY "Allow insert details" ON precedent_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert logs" ON precedent_search_logs FOR INSERT WITH CHECK (true);
