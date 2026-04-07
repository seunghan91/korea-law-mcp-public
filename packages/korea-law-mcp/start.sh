#!/bin/bash
# Korea Law MCP Server 시작 스크립트
# 로컬 번들 DB(판례 포함) 사용

set -e

# 로컬에 번들된 DB 파일 사용 (리포지토리에 포함됨)
DB_PATH="./data/korea-law.db"

if [ -f "$DB_PATH" ]; then
  echo "📦 번들 DB 사용: $DB_PATH"

  # DB 통계 출력
  LAW_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM Laws;" 2>/dev/null || echo "0")
  ARTICLE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM Articles;" 2>/dev/null || echo "0")
  PRECEDENT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM Precedents;" 2>/dev/null || echo "0")

  echo "✅ DB 로드 완료"
  echo "   📊 법령: ${LAW_COUNT}개"
  echo "   📊 조항: ${ARTICLE_COUNT}개"
  echo "   📊 판례: ${PRECEDENT_COUNT}개"
else
  echo "❌ 오류: 번들 DB 파일 없음: $DB_PATH"
  echo "   리포지토리에 data/korea-law.db가 포함되어야 합니다."
  exit 1
fi

export KOREA_LAW_DB_PATH="$DB_PATH"

# 서버 시작
echo "🚀 MCP 서버 시작..."
exec node dist/index.js
# Deploy trigger - #오후
