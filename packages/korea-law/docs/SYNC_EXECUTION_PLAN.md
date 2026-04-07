# 핵심 3대 서비스 동기화 실행 계획

## 📊 현재 현황 (2025-12-20)

| 서비스 | 현재 | 전체 | 진행률 | 필요 동기화 |
|--------|------|------|--------|-------------|
| 법령 (Laws) | 141건 | 5,527건 | 2.6% | 5,386건 |
| 행정규칙 (Admin_Rules) | 20건 | 23,666건 | 0.08% | 23,646건 |
| 자치법규 (Local_Ordinances) | 32건 | 157,204건 | 0.02% | 157,172건 |
| **합계** | **193건** | **186,397건** | **0.1%** | **186,204건** |

## 🔧 동기화 도구

### core-sync.ts 사용법

```bash
# 행정규칙 동기화
npx ts-node src/sync/core-sync.ts --admrul --limit 100

# 자치법규 동기화
npx ts-node src/sync/core-sync.ts --ordin --limit 100

# 특정 지자체만 동기화 (예: 서울시)
npx ts-node src/sync/core-sync.ts --ordin --org 6110000 --limit 500

# 목록만 수집 (본문 제외)
npx ts-node src/sync/core-sync.ts --admrul --list-only
```

## 📋 동기화 실행 계획

### Phase 1: 행정규칙 전체 동기화 (23,666건)

**예상 소요시간**: 약 2시간 (0.3초/건 기준)

```bash
# 단계별 실행 (서버 부하 고려)
# 1차: 5,000건
KOREA_LAW_API_KEY=theqwe2000 npx ts-node src/sync/core-sync.ts --admrul --limit 5000

# 2차: 10,000건
KOREA_LAW_API_KEY=theqwe2000 npx ts-node src/sync/core-sync.ts --admrul --limit 10000

# 3차: 전체
KOREA_LAW_API_KEY=theqwe2000 npx ts-node src/sync/core-sync.ts --admrul
```

### Phase 2: 자치법규 동기화 (157,204건)

**예상 소요시간**: 약 13시간 (0.3초/건 기준)

**전략**: 주요 지자체 우선 동기화

```bash
# 1. 서울시 (약 8,000건 예상)
KOREA_LAW_API_KEY=theqwe2000 npx ts-node src/sync/core-sync.ts --ordin --org 6110000

# 2. 경기도 (약 15,000건 예상)
KOREA_LAW_API_KEY=theqwe2000 npx ts-node src/sync/core-sync.ts --ordin --org 6410000

# 3. 부산시 (약 5,000건 예상)
KOREA_LAW_API_KEY=theqwe2000 npx ts-node src/sync/core-sync.ts --ordin --org 6260000

# 4. 나머지 지자체 순차 동기화...
```

### Phase 3: 법령 보완 동기화 (5,386건)

**예상 소요시간**: 약 30분

기존 daily-sync.ts 활용하여 미동기화 법령 추가

## 🗺️ 주요 지자체 코드

| 지자체 | 코드 | 비고 |
|--------|------|------|
| 서울특별시 | 6110000 | 우선순위 1 |
| 부산광역시 | 6260000 | 우선순위 2 |
| 대구광역시 | 6270000 | |
| 인천광역시 | 6280000 | |
| 광주광역시 | 6290000 | |
| 대전광역시 | 6300000 | |
| 울산광역시 | 6310000 | |
| 세종특별자치시 | 6360000 | |
| 경기도 | 6410000 | 우선순위 1 |
| 강원도 | 6420000 | |
| 충청북도 | 6430000 | |
| 충청남도 | 6440000 | |
| 전라북도 | 6450000 | |
| 전라남도 | 6460000 | |
| 경상북도 | 6470000 | |
| 경상남도 | 6480000 | |
| 제주특별자치도 | 6500000 | |

## ⚙️ 배치 동기화 스크립트

### batch-sync.sh (권장)

```bash
#!/bin/bash
# 배치 동기화 스크립트

export KOREA_LAW_API_KEY=theqwe2000

echo "========================================="
echo "🏛️ 핵심 3대 서비스 전체 동기화"
echo "========================================="
echo "시작 시간: $(date)"

# Phase 1: 행정규칙
echo ""
echo "📋 Phase 1: 행정규칙 동기화..."
npx ts-node src/sync/core-sync.ts --admrul

# Phase 2: 자치법규 (지자체별)
echo ""
echo "📜 Phase 2: 자치법규 동기화..."

# 주요 지자체
for org in 6110000 6260000 6270000 6280000 6290000 6300000 6310000 6360000 6410000 6420000 6430000 6440000 6450000 6460000 6470000 6480000 6500000; do
  echo "  지자체 $org 동기화 중..."
  npx ts-node src/sync/core-sync.ts --ordin --org $org
  sleep 5  # 서버 부하 방지
done

echo ""
echo "========================================="
echo "✅ 동기화 완료: $(date)"
echo "========================================="
```

## 📈 예상 결과

| 항목 | 값 |
|------|-----|
| 총 동기화 건수 | ~186,000건 |
| 예상 소요 시간 | ~15시간 (연속 실행 시) |
| API 호출 횟수 | ~188,000회 |
| DB 예상 크기 | ~500MB |

## ⚠️ 주의사항

1. **API Rate Limit**: 0.3초 간격 유지 (내장)
2. **중복 실행 방지**: `INSERT OR REPLACE` 사용 (자동 중복 처리)
3. **네트워크 오류**: 자동 재시도 없음 (수동 재실행 필요)
4. **서버 부하**: 야간 시간대 실행 권장

## 🔄 증분 동기화 (향후 계획)

- 매일 신규/변경 법령 감지
- GitHub Actions 기반 자동화
- 변경 이력 추적 및 알림
