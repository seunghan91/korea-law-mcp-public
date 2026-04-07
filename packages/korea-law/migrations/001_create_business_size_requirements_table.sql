-- Business Size Requirements Table
-- 사업장 규모별 근로기준법 의무사항 데이터

CREATE TABLE IF NOT EXISTS business_size_requirements (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question_type TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  legal_references TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 메타데이터
  min_business_size INTEGER DEFAULT 1,
  max_business_size INTEGER DEFAULT NULL,
  effective_from DATE,
  effective_to DATE,
  severity TEXT DEFAULT 'normal', -- critical, warning, normal, info

  CONSTRAINT valid_severity CHECK (severity IN ('critical', 'warning', 'normal', 'info'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_business_size_requirements_category
  ON business_size_requirements(category);

CREATE INDEX IF NOT EXISTS idx_business_size_requirements_business_size
  ON business_size_requirements(min_business_size, max_business_size);

CREATE INDEX IF NOT EXISTS idx_business_size_requirements_keywords
  ON business_size_requirements USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_business_size_requirements_effective_date
  ON business_size_requirements(effective_from, effective_to);

-- Full Text Search Index
CREATE INDEX IF NOT EXISTS idx_business_size_requirements_question_fts
  ON business_size_requirements USING GIN(to_tsvector('korean', question || ' ' || answer));

-- RLS 정책 (읽기 전용)
ALTER TABLE business_size_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_size_requirements_public_read"
  ON business_size_requirements
  FOR SELECT
  USING (TRUE);

-- 업데이트 함수
CREATE OR REPLACE FUNCTION update_business_size_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거
DROP TRIGGER IF NOT EXISTS trigger_business_size_requirements_updated_at
  ON business_size_requirements;

CREATE TRIGGER trigger_business_size_requirements_updated_at
BEFORE UPDATE ON business_size_requirements
FOR EACH ROW
EXECUTE FUNCTION update_business_size_requirements_updated_at();

-- 데이터 삽입
INSERT INTO business_size_requirements (
  id, category, question_type, question, answer, legal_references, keywords,
  min_business_size, max_business_size, effective_from, severity
) VALUES
('ABS-010', '사업장규모별_의무', '필수의무사항', '사업장 규모별로 근로기준법 적용이 달라지는 경우는 무엇인가요?',
 '근로기준법 제5조에 따라 1인~4인 사업장과 5인 이상 사업장의 적용 범위가 다릅니다. 주요 내용을 정리합니다.',
 ARRAY['근로기준법 제5조', '산업안전보건법 제15조'],
 ARRAY['사업장규모', '5인', '10인', '50인', '100인', '300인', '규모별의무'],
 1, 300, '2025-01-01', 'critical'),
('ABS-011', '50인미만_특별규정', '예외사항', '5인 미만 사업장과 50인 미만 사업장에서 근로기준법 적용이 다른 부분은 무엇인가요?',
 '근로기준법 제5조에 따라 1인~4인 사업장과 5인 이상 사업장의 적용 범위가 다릅니다.',
 ARRAY['근로기준법 제5조', '근로기준법 제11조'],
 ARRAY['5인미만', '1인~4인', '예외사항', '적용제외', '상시근로자'],
 1, 49, '2025-01-01', 'warning'),
('ABS-012', '50인이상_의무', '필수의무사항', '50인 이상 사업장에서 반드시 지켜야 할 노동관계법령의 주요 의무사항은 무엇인가요?',
 '50인 이상 사업장에서 준수해야 할 법률 의무를 종합적으로 정리합니다.',
 ARRAY['근로기준법', '산업안전보건법', '중대재해처벌법'],
 ARRAY['50인사업장', '노동관계법령', '중대재해처벌법', '산업안전보건법', '남녀고용평등법', '종합준수사항'],
 50, NULL, '2025-01-01', 'critical'),
('ABS-013', '업종별_특례', '특별_적용', '업종에 따라 사업장 규모별 근로기준법 적용이 달라지는 경우는 무엇인가요?',
 '업종에 따라 근로기준법 및 관련 법률의 적용이 달라지는 주요 사례를 정리합니다.',
 ARRAY['근로기준법 제59조', '근로기준법 제63조'],
 ARRAY['업종별특례', '근로시간특례', '건설업', '농림어업', '감시단속', '선원법', '파견금지'],
 1, NULL, '2025-01-01', 'warning'),
('ABS-014', '2024_개정사항', '최신_법령', '2024년~2026년 시행 예정인 사업장 규모별 근로기준법 개정사항은 무엇인가요?',
 '2024년부터 2026년까지 시행 예정 및 논의 중인 주요 개정사항을 정리합니다.',
 ARRAY['중대재해처벌법 부칙', '근로기준법 개정안', '고용보험법 개정'],
 ARRAY['2024개정', '2026개정', '중대재해처벌법확대', '5인미만적용', '52시간유연화', '육아휴직확대'],
 1, NULL, '2025-01-01', 'info'),
('ABS-015', '실무_가이드', '체크리스트', '사업장을 새로 설립할 때 규모별로 반드시 확인해야 할 노무관리 체크리스트는 무엇인가요?',
 '사업장 규모별 노무관리 체크리스트를 단계별로 정리합니다.',
 ARRAY['근로기준법 전반', '산업안전보건법', '남녀고용평등법'],
 ARRAY['노무관리체크리스트', '사업장설립', '필수확인사항', '단계별의무', '규모별준수사항', '실무가이드'],
 1, NULL, '2025-01-01', 'normal');

-- 조회 쿼리
SELECT COUNT(*) as total_records FROM business_size_requirements;
