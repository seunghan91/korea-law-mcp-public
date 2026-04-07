#!/bin/bash
# ============================================
# 확장 API 전체 동기화 스크립트
# ============================================
# 사용법: ./scripts/sync-all-extended.sh [pages]
# 예: ./scripts/sync-all-extended.sh 5  # 각 소스당 5페이지씩

PAGES=${1:-5}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "═══════════════════════════════════════════"
echo "  korea-law 확장 API 전체 동기화"
echo "  페이지 수: $PAGES"
echo "═══════════════════════════════════════════"

# 1. 중앙부처 1차해석 동기화 (주요 부처)
echo -e "\n📌 [1/5] 중앙부처 1차해석 동기화"
MINISTRIES=("nts" "kcs" "moi" "moef" "moel" "mohw" "molit")

for ministry in "${MINISTRIES[@]}"; do
  echo -e "\n🔄 $ministry 동기화..."
  npx ts-node scripts/sync-extended-api.ts --source=cgm_expc --ministry=$ministry --pages=$PAGES
  sleep 2
done

# 2. 한눈보기 동기화
echo -e "\n📌 [2/5] 한눈보기 동기화"
npx ts-node scripts/sync-extended-api.ts --source=oneview --pages=$PAGES

# 3. 국세법령정보시스템 판례 동기화
echo -e "\n📌 [3/5] 국세법령정보시스템 판례 동기화"
npx ts-node scripts/sync-extended-api.ts --source=nts_prec --pages=$PAGES

# 4. 근로복지공단 산재 판례 동기화
echo -e "\n📌 [4/5] 근로복지공단 산재 판례 동기화"
npx ts-node scripts/sync-extended-api.ts --source=comwel_prec --pages=$PAGES

# 5. Supabase 업로드
echo -e "\n📌 [5/5] Supabase 업로드"
npx ts-node scripts/sync-extended-api.ts --upload

echo -e "\n═══════════════════════════════════════════"
echo "  ✅ 전체 동기화 완료"
echo "═══════════════════════════════════════════"

# 통계 출력
DB_PATH="$PROJECT_DIR/data/korea-law-extended.db"
if [ -f "$DB_PATH" ]; then
  echo -e "\n📊 로컬 DB 통계:"
  sqlite3 "$DB_PATH" "
    SELECT '중앙부처 1차해석' as source, COUNT(*) as count FROM cgm_expc_interpretations
    UNION ALL
    SELECT '한눈보기', COUNT(*) FROM one_view_contents
    UNION ALL
    SELECT '국세판례', COUNT(*) FROM nts_precedents
    UNION ALL
    SELECT '산재판례', COUNT(*) FROM comwel_precedents;
  "
fi
