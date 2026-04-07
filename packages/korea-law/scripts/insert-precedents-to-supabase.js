#!/usr/bin/env node
/**
 * Supabase에 11건 미등록 판례 삽입 스크립트
 *
 * 국가법령정보센터 API에 미등록된 판례들을 Supabase에 직접 등록
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 11건 미등록 판례 데이터
const UNREGISTERED_PRECEDENTS = [
  {
    case_id: "2021다225074",
    case_id_normalized: "2021다225074",
    court: "대법원",
    case_type: "민사",
    decision_date: "2025-10-30",
    case_name: "소정근로시간 합의 효력과 최저임금 적용 기준",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "정액사납금제 택시기사의 소정근로시간 단축 합의와 최저임금 적용"
  },
  {
    case_id: "2024다229794",
    case_id_normalized: "2024다229794",
    court: "대법원",
    case_type: "민사",
    decision_date: "2025-10-30",
    case_name: "격일제 근무 형태에서 최저임금 적용",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "격일제 근무자의 소정근로시간과 최저임금 산정"
  },
  {
    case_id: "2021다270555",
    case_id_normalized: "2021다270555",
    court: "대법원",
    case_type: "민사",
    decision_date: "2024-01-25",
    case_name: "교통사고로 인한 정신건강 손상과 손해배상",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "교통사고 후 PTSD 등 정신건강 손해배상 인정 기준"
  },
  {
    case_id: "70도704",
    case_id_normalized: "70도704",
    court: "대법원",
    case_type: "형사",
    decision_date: "1970-09-29",
    case_name: "명예훼손죄와 피해자 의사",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "명예훼손죄에서 피해자 의사의 역할 (반의사불벌죄)"
  },
  {
    case_id: "2024도18320",
    case_id_normalized: "2024도18320",
    court: "대법원",
    case_type: "형사",
    decision_date: "2025-03-27",
    case_name: "위안부 관련 명예훼손 사건",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "위안부 피해자 관련 발언의 명예훼손 성립 여부"
  },
  {
    case_id: "2018도2738",
    case_id_normalized: "2018도2738",
    court: "대법원",
    case_type: "형사",
    decision_date: "2018-10-25",
    case_name: "공무원과 비공무원의 뇌물수수 공동정범",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "뇌물수수 공동정범의 성립 요건"
  },
  {
    case_id: "2017도661",
    case_id_normalized: "2017도661",
    court: "대법원",
    case_type: "형사",
    decision_date: "2017-07-27",
    case_name: "호흡측정과 채혈측정의 우선순위",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "음주운전 측정 방법의 우선순위와 증거능력"
  },
  {
    case_id: "2024도8174",
    case_id_normalized: "2024도8174",
    court: "대법원",
    case_type: "형사",
    decision_date: "2025-01-09",
    case_name: "상표의 유사 여부 판단",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "상표 유사성 판단 기준과 상표법 위반"
  },
  {
    case_id: "2024도14181",
    case_id_normalized: "2024도14181",
    court: "대법원",
    case_type: "형사",
    decision_date: "2025-02-27",
    case_name: "교재 저작권 양도 후 배포행위",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "저작권 양도 후 원저작자의 배포권한"
  },
  {
    case_id: "2025다209384",
    case_id_normalized: "2025다209384",
    court: "대법원",
    case_type: "민사",
    decision_date: "2025-06-12",
    case_name: "공동저작권자의 지분 승계",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "공동저작물의 저작재산권 지분 상속 및 양도"
  },
  {
    case_id: "2023다281009",
    case_id_normalized: "2023다281009",
    court: "대법원",
    case_type: "민사",
    decision_date: "2024-07-11",
    case_name: "보이스피싱 피해자의 부당이득반환청구",
    exists_verified: true,
    source: "법고을(lx.scourt.go.kr)",
    note: "보이스피싱 착오송금에서 수취인의 부당이득반환의무"
  }
];

async function checkExistingPrecedents() {
  console.log("📋 기존 Supabase 판례 데이터 확인 중...\n");

  const { data, error, count } = await supabase
    .from("precedents")
    .select("*", { count: "exact" });

  if (error) {
    console.error("❌ 조회 오류:", error.message);
    return [];
  }

  console.log(`   현재 등록된 판례: ${count}건`);
  return data || [];
}

async function insertPrecedents() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📚 Supabase에 11건 미등록 판례 삽입");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // 기존 데이터 확인
  const existing = await checkExistingPrecedents();
  const existingCaseIds = new Set(existing.map(p => p.case_id));

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const prec of UNREGISTERED_PRECEDENTS) {
    // 이미 존재하는지 확인
    if (existingCaseIds.has(prec.case_id)) {
      console.log(`⏭️  ${prec.case_id} - 이미 존재 (건너뜀)`);
      skipped++;
      continue;
    }

    // 삽입
    const { data, error } = await supabase
      .from("precedents")
      .insert({
        case_id: prec.case_id,
        case_id_normalized: prec.case_id_normalized,
        court: prec.court,
        case_type: prec.case_type,
        decision_date: prec.decision_date,
        case_name: prec.case_name,
        exists_verified: prec.exists_verified,
        last_verified_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.log(`❌ ${prec.case_id} - 삽입 실패: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${prec.case_id} - ${prec.case_name}`);
      inserted++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📊 삽입 결과");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  ✅ 신규 삽입: ${inserted}건`);
  console.log(`  ⏭️  건너뜀 (중복): ${skipped}건`);
  console.log(`  ❌ 실패: ${failed}건`);

  // 최종 통계 확인
  const { count: finalCount } = await supabase
    .from("precedents")
    .select("*", { count: "exact", head: true });

  console.log(`\n📈 Supabase 전체 판례: ${finalCount}건`);
}

insertPrecedents().catch(console.error);
