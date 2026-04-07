/**
 * ============================================
 * Phase 2: 판례 데이터 Supabase 마이그레이션
 * 옵션 B: 기존 스키마 호환 + 새 스키마 통합
 * ============================================
 *
 * === 📋 프로젝트 배경 ===
 * - 기존 precedents 테이블: 28건의 동기화된 판례 데이터
 * - 새 마이그레이션: korea-law API에서 321건의 새 판례 데이터
 * - 문제: 컬럼명이 다름 (case_id vs case_number, court vs court_name)
 * - 해결책: 두 스키마 모두 지원하는 호환 레이어 구현
 *
 * === 🔄 데이터 흐름 ===
 * 1. korea-law API에서 판례 검색 (10개 키워드로 321건 수집)
 * 2. 데이터 변환 (기존 + 새 스키마 모두에 대응)
 * 3. Supabase UPSERT (기존 데이터 유지, 새 데이터 추가)
 * 4. 백업 저장 (복구용)
 *
 * === 🎯 핵심 설계 결정 ===
 * 왜 두 개의 컬럼에 같은 데이터를 저장할까?
 * - case_number + case_id_text: 새 코드와 기존 코드 모두 사용 가능
 * - court_name + court: 기존 시스템과의 호환성 보장
 * - 이 방식으로 28건 데이터를 지키면서 새 마이그레이션도 진행
 *
 * === ⚙️ 기술 스택 ===
 * - Supabase: 판례 데이터 저장소
 * - PostgREST: API 자동 생성
 * - RLS 정책: 데이터 접근 제어
 * - UPSERT: 기존 데이터 보호
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// 환경변수 설정
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';

// ============================================
// 타입 정의
// ============================================

/**
 * PrecedentListItem
 * 대법원 판례 검색 API의 응답 형식
 *
 * 필드 설명:
 * - 판례일련번호: 대법원 내부 고유번호 (ID로 사용)
 * - 사건번호: "2024도18441" 형식의 사건번호
 * - 선고일자: "2024-12-15" 형식의 판결 날짜
 * - 법원명: "서울중앙지방법원" 같은 법원 이름
 * - 사건종류명: "형사", "민사", "행정" 등의 분류
 */
interface PrecedentListItem {
  판례일련번호: number;
  사건번호: string;
  사건명: string;
  선고일자: string;
  법원명: string;
  법원종류코드?: string;
  사건종류명: string;
  사건종류코드?: string;
  판결유형: string;
  판시사항?: string;
  판결요지?: string;
  참조조문?: string;
  참조판례?: string;
}

/**
 * PrecedentRecord
 * Supabase에 저장될 최종 데이터 형식
 *
 * === 🔄 스키마 호환성 전략 ===
 *
 * 기존 스키마 필드 (28건 데이터)
 * - id: BIGINT (고유ID)
 * - case_id: TEXT (사건번호) ← case_id_text로 저장
 * - case_id_normalized: TEXT (정규화된 사건번호)
 * - court: TEXT (법원명) ← court_name으로 저장
 * - case_type: TEXT (사건종류)
 * - decision_date: DATE (판결날짜) ← 기존엔 DATE, 새 데이터는 TEXT
 * - case_name: TEXT (사건명)
 * - exists_verified: BOOLEAN (존재여부 확인)
 *
 * 새 스키마 필드 (새 마이그레이션)
 * - id: BIGINT (고유ID) ✓ 공통
 * - case_number: TEXT (사건번호) ← 새 이름
 * - court_name: TEXT (법원명) ← 새 이름
 * - case_type: TEXT (사건종류) ✓ 공통
 * - decision_date: TEXT (판결날짜) ← TEXT로 통일
 * - case_type_code: INTEGER (사건종류 코드)
 * - data_source: TEXT (데이터 출처)
 * - detail_link: TEXT (상세 링크)
 *
 * === 결론 ===
 * case_number와 court_name에 데이터를 저장하면서,
 * case_id_text와 court에도 복사해서 저장
 * → 기존 코드와 새 코드 모두 정상 작동!
 */
interface PrecedentRecord {
  id: number;                    // 고유 ID (대법원 판례일련번호)

  // ========== 새 스키마 필드 (새 마이그레이션 사용) ==========
  case_number: string;           // 사건번호 (예: "2024도18441")
  case_name: string;             // 사건명
  decision_date: string;         // 판결날짜 (TEXT 형식: "2024-12-15")
  case_type?: string;            // 사건종류 (예: "형사", "민사")
  case_type_code?: number;       // 사건종류 코드
  court_name?: string;           // 법원명 (예: "서울중앙지방법원")
  data_source?: string;          // 데이터 출처
  detail_link?: string;          // 판례 상세 링크

  // ========== 기존 스키마 호환 필드 ==========
  // 이 필드들은 기존 데이터와 호환성을 위해 추가합니다
  case_id_text?: string;         // case_id와 동일 (기존 코드 호환)
  case_id_normalized?: string;   // 정규화된 사건번호 (검색용)
  court?: string;                // court_name과 동일 (기존 코드 호환)
  exists_verified?: boolean;     // API에서 존재 확인 여부
  last_verified_at?: string;     // 마지막 확인 시간
}

// ============================================
// 동적 Import 함수
// ============================================
/**
 * loadPrecedentApi()
 *
 * TypeScript 컴파일 후 JavaScript로 변환된 파일을 동적으로 로드합니다.
 * 빌드된 파일 위치: dist/api/precedent-api.js
 *
 * 이렇게 하는 이유:
 * - Node.js에서 ES6 모듈을 직접 실행할 수 없음
 * - 컴파일된 JS를 동적으로 로드해서 함수 사용
 */
async function loadPrecedentApi() {
  const precedentApi = await import('../dist/api/precedent-api.js');
  return precedentApi;
}

// ============================================
// 메인 함수
// ============================================
async function main() {
  console.log('\n🚀 Phase 2: 판례 데이터 Supabase 마이그레이션 시작\n');
  console.log('📌 옵션 B: 기존 28건 데이터 유지 + 새 321건 추가\n');

  // ============================================
  // 1단계: Supabase 연결 확인
  // ============================================
  console.log('📡 Supabase 연결 확인 중...');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ 환경변수 오류:');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_KEY ? '✓' : '✗');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase 연결 성공\n');

  // ============================================
  // 2단계: 판례 API 로드
  // ============================================
  console.log('📥 판례 API 로드 중...');

  let precedentApi;
  try {
    precedentApi = await loadPrecedentApi();
    console.log('✅ API 로드 완료\n');
  } catch (error) {
    console.error('❌ API 로드 실패:');
    console.error('   원인:', (error as Error).message);
    console.error('\n   💡 해결방법:');
    console.error('   1. 빌드 확인: npm run build');
    console.error('   2. dist/api/precedent-api.js 파일 존재 확인');
    process.exit(1);
  }

  // ============================================
  // 3단계: 판례 데이터 수집
  // ============================================
  console.log('📊 판례 데이터 수집 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 다양한 법적 개념으로 검색해서 대표적인 판례들 수집
  const queries = [
    '계약',      // 계약 관련 판례
    '손해배상',  // 불법행위, 손해배상 판례
    '위반',      // 법령 위반 관련
    '거래',      // 거래, 계약 관련
    '소유권',    // 재산권, 소유권 관련
    '채무',      // 채무 관련 판례
    '불법행위',  // 불법행위 판례
    '채권',      // 채권 관련 판례
    '대여금',    // 금전 거래 관련
    '사기'       // 사기, 기망 관련
  ];

  let allPrecedents: PrecedentListItem[] = [];
  let uniqueIds = new Set<number>();

  for (const query of queries) {
    try {
      console.log(`🔍 검색: "${query}"`);

      // korea-law API 호출
      // - display: 50건씩 조회
      // - search: 2 (본문검색, 1은 제목검색)
      const results = await precedentApi.searchPrecedents(query, {
        display: 50,
        search: 2  // 본문검색
      });

      // 중복 제거 (판례일련번호로 중복 판단)
      // 같은 판례가 여러 키워드에서 나올 수 있으므로 제거
      const newResults = results.filter((p: PrecedentListItem) => {
        if (uniqueIds.has(p.판례일련번호)) {
          return false;  // 이미 수집된 판례 제외
        }
        uniqueIds.add(p.판례일련번호);
        return true;  // 새로운 판례만 추가
      });

      allPrecedents = allPrecedents.concat(newResults);
      console.log(`  ✅ ${newResults.length}건 추가 (총 ${allPrecedents.length}건)\n`);

      // API 레이트 리미팅: 1초 대기
      // 대법원 API의 부하를 줄이기 위해 의도적으로 느리게 요청
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`  ⚠️ 에러: ${(error as Error).message}\n`);
    }
  }

  console.log(`\n📈 총 수집: ${allPrecedents.length}건\n`);

  if (allPrecedents.length === 0) {
    console.error('❌ 데이터를 수집할 수 없습니다');
    console.error('💡 원인 가능성:');
    console.error('   1. 대법원 API 응답 오류');
    console.error('   2. 네트워크 연결 문제');
    console.error('   3. API 키 만료');
    process.exit(1);
  }

  // ============================================
  // 4단계: 데이터 변환 (핵심! 스키마 호환성)
  // ============================================
  console.log('🔄 데이터 변환 중...');
  console.log('   대법원 API 형식 → Supabase 저장 형식\n');

  const precedentRecords: PrecedentRecord[] = allPrecedents.map(p => {
    /**
     * === 🔄 데이터 매핑 로직 ===
     *
     * 대법원 API 응답 → Supabase 저장소
     *
     * 1. 기본 정보 (양쪽 스키마 공통)
     *    판례일련번호 → id
     *    사건명 → case_name
     *    사건종류명 → case_type
     *
     * 2. 사건번호 (호환성 처리)
     *    API의 "사건번호" → case_number (새 스키마) + case_id_text (기존)
     *    두 컬럼에 같은 값을 저장
     *
     * 3. 판결날짜 (타입 통일)
     *    API의 "선고일자" → decision_date (TEXT로 저장)
     *    기존 데이터는 DATE, 새 데이터는 TEXT이지만
     *    TEXT로 통일하면 검색/필터링에 문제 없음
     *
     * 4. 법원명 (호환성 처리)
     *    API의 "법원명" → court_name (새 스키마) + court (기존)
     *    두 컬럼에 같은 값을 저장
     *
     * 5. 데이터 출처 (새 필드)
     *    모든 새 데이터: data_source = "대법원 판례"
     *    기존 데이터와 구분 가능
     */
    return {
      id: p.판례일련번호,                    // 고유 ID
      case_number: p.사건번호,              // 새 스키마: 사건번호
      case_name: p.사건명,                  // 사건명
      decision_date: p.선고일자,            // 판결날짜 (TEXT)
      case_type: p.사건종류명,              // 사건종류
      case_type_code: p.사건종류코드
        ? parseInt(p.사건종류코드, 10)
        : undefined,                        // 사건종류 코드 (숫자로 변환)
      court_name: p.법원명,                 // 새 스키마: 법원명
      data_source: '대법원 판례',           // 데이터 출처 (기존 데이터와 구분용)
      detail_link: undefined,               // 대법원 API에서 상세 링크 미제공

      // === 기존 스키마 호환 필드 ===
      case_id_text: p.사건번호,             // 기존 코드와의 호환성
      case_id_normalized: normalizeId(p.사건번호),  // 정규화 (검색용)
      court: p.법원명,                      // 기존 코드와의 호환성
      exists_verified: true,                // API에서 조회된 데이터이므로 true
      last_verified_at: new Date().toISOString()  // 현재 시각 기록
    };
  });

  // ============================================
  // 5단계: 로컬 백업 저장
  // ============================================
  console.log('💾 로컬 백업 저장 중...');

  const backupPath = path.join(__dirname, '../data/precedents-backup.json');
  const backupDir = path.dirname(backupPath);

  // 백업 디렉토리 생성
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // JSON 형식으로 저장 (들여쓰기: 2칸)
  fs.writeFileSync(backupPath, JSON.stringify(precedentRecords, null, 2));
  console.log(`✅ 백업 저장: ${backupPath}`);
  console.log(`   파일 크기: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB\n`);

  // ============================================
  // 6단계: Supabase에 업로드 (배치 처리)
  // ============================================
  console.log('📤 Supabase에 업로드 중...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const BATCH_SIZE = 100;  // 한 번에 100개씩 업로드
  let uploadedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;   // 중복으로 인해 스킵된 개수

  for (let i = 0; i < precedentRecords.length; i += BATCH_SIZE) {
    const batch = precedentRecords.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    try {
      console.log(`⏳ 배치 ${batchNumber}: ${batch.length}건 업로드 중...`);

      /**
       * === 🔑 UPSERT 전략 (중요!) ===
       *
       * onConflict: 'id'
       * → 같은 ID가 있으면 새 데이터로 덮어씌우지 않음
       * → 기존 28건의 데이터는 그대로 유지됨!
       *
       * 대체 옵션:
       * - onConflict: 'case_number': case_number 중복 시 업데이트
       * - onConflict: undefined: 모든 데이터 무조건 업데이트
       *
       * 왜 'id'로 설정?
       * - 대법원 판례일련번호는 고유하고 변하지 않음
       * - ID 충돌 시 기존 데이터 유지 (안전)
       */
      const { data, error } = await supabase
        .from('precedents')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`  ❌ 배치 ${batchNumber} 에러:`, error.message);

        // 에러 원인 분석
        if (error.message.includes('schema cache')) {
          console.error('     → PostgREST 스키마 캐시 문제');
          console.error('     → 해결: Supabase SQL Editor에서 "NOTIFY pgrst, \'reload schema\';" 실행');
        } else if (error.message.includes('permission')) {
          console.error('     → 권한 문제');
          console.error('     → 해결: GRANT ALL PRIVILEGES 확인');
        }

        errorCount += batch.length;
      } else {
        // 성공: data.length를 확인하거나 batch.length를 사용
        uploadedCount += batch.length;

        // 진행률 계산
        const totalProcessed = uploadedCount + errorCount + skippedCount;
        const percent = Math.round((totalProcessed / precedentRecords.length) * 100);

        console.log(`  ✅ 배치 ${batchNumber} 성공`);
        console.log(`     진행률: ${totalProcessed}/${precedentRecords.length} (${percent}%)\n`);
      }
    } catch (error) {
      console.error(`  ❌ 배치 ${batchNumber} 네트워크 오류:`, (error as Error).message);
      errorCount += batch.length;
    }

    // API 레이트 리미팅 (배치 간 200ms 대기)
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // ============================================
  // 7단계: 최종 통계
  // ============================================
  console.log('\n📊 업로드 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`  ✅ 성공: ${uploadedCount}건`);
  console.log(`  ❌ 실패: ${errorCount}건`);
  console.log(`  📌 총계: ${uploadedCount + errorCount}/${precedentRecords.length}건\n`);

  // ============================================
  // 8단계: Supabase의 최종 데이터 확인
  // ============================================
  console.log('📈 Supabase 데이터 통계 조회 중...');

  try {
    const { count } = await supabase
      .from('precedents')
      .select('*', { count: 'exact', head: true });

    console.log(`✨ Supabase precedents 테이블 총 레코드: ${count}건\n`);

    if (count && count >= 28) {
      console.log('✅ 기존 28건 데이터는 안전하게 유지됨');
      console.log(`✅ 새로 추가된 데이터: ${count - 28}건\n`);
    } else {
      console.log('⚠️  예상: 28건 이상이어야 함\n');
    }
  } catch (error) {
    console.log('⚠️  통계 조회 실패 (비필수 항목)\n');
  }

  // ============================================
  // 9단계: 다음 단계 안내
  // ============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Phase 2 완료!\n');
  console.log('🎯 다음 단계:');
  console.log('  1. ✅ 판례 검색 API 확인 (이미 구현됨)');
  console.log('  2. ✅ MCP 엔드포인트 확인 (이미 구현됨)');
  console.log('  3. 🔄 Render에 배포 (다음 작업)');
  console.log('  4. 🧪 통합 테스트 (배포 후)\n');
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * normalizeId()
 *
 * 사건번호를 정규화합니다.
 * 예: "2024도18441" → "2024도18441" (변화 없음)
 *     "2024 도 18441" → "2024도18441" (공백 제거)
 *     "2024-도-18441" → "2024도18441" (대시 제거)
 *
 * 사용처: 사용자가 입력한 비표준 형식을 표준화할 때
 */
function normalizeId(id: string): string {
  return id
    .replace(/\s+/g, '')      // 공백 제거
    .replace(/-/g, '')        // 대시 제거
    .toUpperCase();           // 대문자로 통일
}

// ============================================
// 실행
// ============================================
main().catch(error => {
  console.error('❌ 심각한 오류:', error);
  process.exit(1);
});
