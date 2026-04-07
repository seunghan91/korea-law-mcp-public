-- Admin Rules 및 Local Ordinances 테이블 생성
-- Supabase 및 Render PostgreSQL 공통

-- Admin Rules (행정규칙)
CREATE TABLE IF NOT EXISTS admin_rules (
    id SERIAL PRIMARY KEY,
    rule_serial_number TEXT UNIQUE NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT,
    ministry TEXT,
    issuance_date DATE,
    enforcement_date DATE,
    content TEXT,
    status TEXT DEFAULT 'ACTIVE',
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Rules 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_rules_name ON admin_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_admin_rules_ministry ON admin_rules(ministry);
CREATE INDEX IF NOT EXISTS idx_admin_rules_serial ON admin_rules(rule_serial_number);

-- Local Ordinances (자치법규)
CREATE TABLE IF NOT EXISTS local_ordinances (
    id SERIAL PRIMARY KEY,
    ordinance_serial_number TEXT UNIQUE NOT NULL,
    ordinance_name TEXT NOT NULL,
    local_government_code TEXT,
    local_government_name TEXT,
    promulgation_date DATE,
    enforcement_date DATE,
    content TEXT,
    status TEXT DEFAULT 'ACTIVE',
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Local Ordinances 인덱스
CREATE INDEX IF NOT EXISTS idx_local_ordinances_name ON local_ordinances(ordinance_name);
CREATE INDEX IF NOT EXISTS idx_local_ordinances_gov ON local_ordinances(local_government_name);
CREATE INDEX IF NOT EXISTS idx_local_ordinances_serial ON local_ordinances(ordinance_serial_number);

-- 완료 메시지
SELECT 'Tables created successfully' as status;
