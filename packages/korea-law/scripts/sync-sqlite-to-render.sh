#!/bin/bash
# SQLite → Render PostgreSQL 동기화 스크립트
# 사용법: ./scripts/sync-sqlite-to-render.sh

set -e

SQLITE_DB="/Users/seunghan/law/korea-law/data/korea-law.db"
PG_HOST="dpg-d5131q5actks73f0aa1g-a.singapore-postgres.render.com"
PG_PORT="5432"
PG_DB="legal_audit_db"
PG_USER="legal_audit_db_user"
PG_PASSWORD="rLFu09xBnIvGYZI2jUs8Dn7TnIkU8lfw"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     SQLite → Render PostgreSQL 동기화                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 현재 SQLite 데이터 현황
echo "📊 SQLite 데이터 현황:"
sqlite3 "$SQLITE_DB" "
SELECT 'Laws' as tbl, COUNT(*) as cnt FROM Laws
UNION ALL SELECT 'Articles', COUNT(*) FROM Articles
UNION ALL SELECT 'Admin_Rules', COUNT(*) FROM Admin_Rules
UNION ALL SELECT 'Local_Ordinances', COUNT(*) FROM Local_Ordinances;
"

echo ""
echo "🚀 PostgreSQL 동기화 시작..."

# Laws 동기화
echo ""
echo "📜 Laws 동기화..."
sqlite3 -header -csv "$SQLITE_DB" "SELECT id, law_mst_id, law_name, law_name_eng, promulgation_date, enforcement_date, law_type, ministry, status FROM Laws;" > /tmp/laws_export.csv

PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "\COPY laws(id, law_mst_id, law_name, law_name_eng, promulgation_date, enforcement_date, law_type, ministry, status) FROM '/tmp/laws_export.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');" 2>/dev/null || echo "  ⚠️ Laws 동기화 중 일부 오류 발생 (중복 무시)"

echo "  ✅ Laws 완료"

# Articles 동기화 (대용량이므로 배치 처리)
echo ""
echo "📄 Articles 동기화 (대용량)..."
sqlite3 -header -csv "$SQLITE_DB" "SELECT id, law_id, article_no, article_title, substr(content, 1, 50000) as content FROM Articles;" > /tmp/articles_export.csv

# 기존 데이터 삭제 후 삽입 (충돌 방지)
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "TRUNCATE articles CASCADE;" 2>/dev/null || true
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "\COPY articles(id, law_id, article_no, article_title, content) FROM '/tmp/articles_export.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');" 2>/dev/null || echo "  ⚠️ Articles 동기화 중 일부 오류"

echo "  ✅ Articles 완료"

# Admin Rules 동기화
echo ""
echo "📋 Admin_Rules 동기화..."
sqlite3 -header -csv "$SQLITE_DB" "SELECT id, rule_serial_number, rule_name, rule_type, ministry, issuance_date, enforcement_date, substr(content, 1, 100000) as content, status FROM Admin_Rules;" > /tmp/admin_rules_export.csv

PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "TRUNCATE admin_rules CASCADE;" 2>/dev/null || true
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "\COPY admin_rules(id, rule_serial_number, rule_name, rule_type, ministry, issuance_date, enforcement_date, content, status) FROM '/tmp/admin_rules_export.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');" 2>/dev/null || echo "  ⚠️ Admin_Rules 동기화 중 일부 오류"

echo "  ✅ Admin_Rules 완료"

# Local Ordinances 동기화
echo ""
echo "📜 Local_Ordinances 동기화..."
sqlite3 -header -csv "$SQLITE_DB" "SELECT id, ordinance_serial_number, ordinance_name, local_government_code, local_government_name, promulgation_date, enforcement_date, substr(content, 1, 100000) as content, status FROM Local_Ordinances;" > /tmp/local_ordinances_export.csv

PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "TRUNCATE local_ordinances CASCADE;" 2>/dev/null || true
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -c "\COPY local_ordinances(id, ordinance_serial_number, ordinance_name, local_government_code, local_government_name, promulgation_date, enforcement_date, content, status) FROM '/tmp/local_ordinances_export.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');" 2>/dev/null || echo "  ⚠️ Local_Ordinances 동기화 중 일부 오류"

echo "  ✅ Local_Ordinances 완료"

# 시퀀스 업데이트
echo ""
echo "🔧 시퀀스 업데이트..."
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB << EOF
SELECT setval('laws_id_seq', (SELECT COALESCE(MAX(id), 0) FROM laws));
SELECT setval('articles_id_seq', (SELECT COALESCE(MAX(id), 0) FROM articles));
SELECT setval('admin_rules_id_seq', (SELECT COALESCE(MAX(id), 0) FROM admin_rules));
SELECT setval('local_ordinances_id_seq', (SELECT COALESCE(MAX(id), 0) FROM local_ordinances));
EOF

# 최종 확인
echo ""
echo "📊 Render PostgreSQL 동기화 결과:"
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB << EOF
SELECT 'laws' as table_name, COUNT(*) as count FROM laws
UNION ALL SELECT 'articles', COUNT(*) FROM articles
UNION ALL SELECT 'admin_rules', COUNT(*) FROM admin_rules
UNION ALL SELECT 'local_ordinances', COUNT(*) FROM local_ordinances;
EOF

echo ""
echo "✅ Render PostgreSQL 동기화 완료!"

# 임시 파일 정리
rm -f /tmp/laws_export.csv /tmp/articles_export.csv /tmp/admin_rules_export.csv /tmp/local_ordinances_export.csv
