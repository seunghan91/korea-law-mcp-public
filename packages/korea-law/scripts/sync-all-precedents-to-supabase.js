#!/usr/bin/env node
/**
 * SQLite에서 Supabase로 모든 판례 동기화
 */

const { createClient } = require("@supabase/supabase-js");
const Database = require("better-sqlite3");
const path = require("path");
require("dotenv").config();

const DB_PATH = path.join(__dirname, "../data/korea-law.db");
const db = new Database(DB_PATH);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPrecedents() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📚 SQLite → Supabase 전체 판례 동기화");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // SQLite에서 모든 판례 가져오기
  const precedents = db.prepare(`
    SELECT
      case_id,
      case_name,
      court,
      case_type,
      decision_date,
      summary,
      key_points,
      full_text,
      referenced_statutes,
      referenced_cases,
      precedent_serial_number,
      exists_verified
    FROM Precedents
    ORDER BY case_id
  `).all();

  console.log(`📋 SQLite 판례: ${precedents.length}건\n`);

  // 기존 Supabase 데이터 확인
  const { data: existing } = await supabase
    .from("precedents")
    .select("case_id");

  const existingCaseIds = new Set((existing || []).map(p => p.case_id));
  console.log(`📋 Supabase 기존 판례: ${existingCaseIds.size}건\n`);

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const prec of precedents) {
    // 사건 유형 추출 (SQLite 값 우선, 없으면 추론)
    let caseType = prec.case_type || "기타";
    if (!prec.case_type) {
      if (prec.case_id.includes("다")) caseType = "민사";
      else if (prec.case_id.includes("도")) caseType = "형사";
      else if (prec.case_id.includes("두")) caseType = "행정";
      else if (prec.case_id.includes("므")) caseType = "가사";
      else if (prec.case_id.includes("누")) caseType = "행정";
    }

    const record = {
      case_id: prec.case_id,
      case_id_normalized: prec.case_id.replace(/\s/g, ""),
      court: prec.court || "대법원",
      case_type: caseType,
      decision_date: prec.decision_date || null,
      case_name: prec.case_name,
      exists_verified: prec.exists_verified === 1 || prec.full_text ? true : false,
      last_verified_at: new Date().toISOString()
    };

    if (existingCaseIds.has(prec.case_id)) {
      // 업데이트
      const { error } = await supabase
        .from("precedents")
        .update(record)
        .eq("case_id", prec.case_id);

      if (error) {
        console.log(`❌ ${prec.case_id} - 업데이트 실패: ${error.message}`);
        failed++;
      } else {
        console.log(`🔄 ${prec.case_id} - 업데이트 완료`);
        updated++;
      }
    } else {
      // 삽입
      const { error } = await supabase
        .from("precedents")
        .insert(record);

      if (error) {
        console.log(`❌ ${prec.case_id} - 삽입 실패: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ ${prec.case_id} - 신규 삽입`);
        inserted++;
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📊 동기화 결과");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  ✅ 신규 삽입: ${inserted}건`);
  console.log(`  🔄 업데이트: ${updated}건`);
  console.log(`  ❌ 실패: ${failed}건`);

  // 최종 통계
  const { count } = await supabase
    .from("precedents")
    .select("*", { count: "exact", head: true });

  console.log(`\n📈 Supabase 전체 판례: ${count}건`);

  db.close();
}

syncPrecedents().catch(console.error);
