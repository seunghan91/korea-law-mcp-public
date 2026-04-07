-- ============================================
-- 법령 변경사항 테이블 (Web Scraping Data)
-- ============================================
-- 국가법령정보센터에서 스크래핑한 법령 변경사항
-- 카테고리: 시행예정, 폐지, 한시법령, 한시조문, 위헌조문
-- ============================================

-- 법령 변경사항 마스터 테이블
CREATE TABLE IF NOT EXISTS law_changes (
    id BIGSERIAL PRIMARY KEY,

    -- 분류
    category TEXT NOT NULL CHECK (category IN (
        'pending',           -- 시행예정법령
        'abolished',         -- 폐지법령
        'temporary_law',     -- 한시법령
        'temporary_article', -- 한시조문
        'unconstitutional'   -- 위헌조문
    )),

    -- 법령 정보
    law_name TEXT NOT NULL,
    article_title TEXT DEFAULT '',        -- 조문 제목 (한시조문/위헌조문용)
    target_date DATE,                     -- 시행일/폐지일/만료일/결정일

    -- 법령 상세
    law_type TEXT,                        -- 법률/대통령령/부령 등
    promulgation_no TEXT,                 -- 공포번호
    promulgation_date DATE,               -- 공포일
    revision_type TEXT,                   -- 제정/일부개정/전부개정 등
    ministry TEXT,                        -- 소관부처

    -- 계산 필드
    days_until_target INTEGER,            -- 시행일까지 남은 일수 (음수: 과거)

    -- 메타데이터
    source TEXT DEFAULT 'web_scraping',   -- 데이터 소스
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 중복 방지
    UNIQUE(category, law_name, promulgation_no, article_title)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_law_changes_category ON law_changes(category);
CREATE INDEX IF NOT EXISTS idx_law_changes_target_date ON law_changes(target_date);
CREATE INDEX IF NOT EXISTS idx_law_changes_days_until ON law_changes(days_until_target);
CREATE INDEX IF NOT EXISTS idx_law_changes_law_name ON law_changes(law_name);
CREATE INDEX IF NOT EXISTS idx_law_changes_ministry ON law_changes(ministry);

-- 정규화된 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_law_changes_law_name_lower ON law_changes(LOWER(law_name));

-- RLS 설정
ALTER TABLE law_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on law_changes" ON law_changes FOR SELECT USING (true);
CREATE POLICY "Service role full access on law_changes" ON law_changes FOR ALL USING (auth.role() = 'service_role');

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_law_changes_updated_at BEFORE UPDATE ON law_changes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 뷰: 시행 임박 법령 (30일 이내)
-- ============================================
CREATE OR REPLACE VIEW upcoming_laws AS
SELECT
    lc.*,
    CASE
        WHEN lc.days_until_target <= 7 THEN '🚨 긴급'
        WHEN lc.days_until_target <= 14 THEN '⚠️ 주의'
        WHEN lc.days_until_target <= 30 THEN 'ℹ️ 예정'
        ELSE '📋 예고'
    END AS urgency_level
FROM law_changes lc
WHERE lc.category = 'pending'
  AND lc.days_until_target IS NOT NULL
  AND lc.days_until_target BETWEEN 0 AND 90
ORDER BY lc.days_until_target ASC;

-- ============================================
-- 뷰: 카테고리별 통계
-- ============================================
CREATE OR REPLACE VIEW law_changes_stats AS
SELECT
    category,
    COUNT(*) as total_count,
    COUNT(CASE WHEN days_until_target BETWEEN 0 AND 30 THEN 1 END) as within_30_days,
    COUNT(CASE WHEN days_until_target BETWEEN 0 AND 7 THEN 1 END) as within_7_days,
    MAX(scraped_at) as last_scraped
FROM law_changes
GROUP BY category;

-- ============================================
-- 함수: 시행일 기준 일수 자동 업데이트
-- ============================================
CREATE OR REPLACE FUNCTION update_days_until_target()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.target_date IS NOT NULL THEN
        NEW.days_until_target := NEW.target_date - CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_days_until BEFORE INSERT OR UPDATE ON law_changes
    FOR EACH ROW EXECUTE FUNCTION update_days_until_target();

-- ============================================
-- 인공지능 관련 법령 뷰 (특별 관심)
-- ============================================
CREATE OR REPLACE VIEW ai_related_laws AS
SELECT *
FROM law_changes
WHERE law_name ILIKE '%인공지능%'
   OR law_name ILIKE '%AI%'
   OR law_name ILIKE '%디지털%'
   OR law_name ILIKE '%데이터%'
ORDER BY days_until_target ASC NULLS LAST;
