#!/usr/bin/env node
/**
 * 판례 매칭 정확도 검증 스크립트
 * DB의 precedent_serial_number가 실제로 올바른 판례를 가리키는지 확인
 */

const axios = require("axios");
const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/korea-law.db");
const db = new Database(DB_PATH);
const API_KEY = process.env.KOREA_LAW_API_KEY || "theqwe2000";

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyMatches() {
  // full_text가 있는 판례들만 조회
  const precedents = db.prepare(`
    SELECT case_id, case_name, precedent_serial_number
    FROM Precedents
    WHERE length(full_text) > 0
  `).all();

  console.log("═══════════════════════════════════════════");
  console.log("📋 매칭 정확도 검증 (" + precedents.length + "건)");
  console.log("═══════════════════════════════════════════\n");

  let correct = 0;
  let wrong = 0;
  const wrongList = [];

  for (const prec of precedents) {
    try {
      // API에서 해당 serial number로 직접 조회
      const res = await axios.get("http://www.law.go.kr/DRF/lawService.do", {
        params: {
          OC: API_KEY,
          target: "prec",
          type: "XML",
          ID: prec.precedent_serial_number
        },
        timeout: 10000
      });

      // 사건번호 추출
      const match = res.data.match(/<사건번호>([^<]+)<\/사건번호>/);
      const apiCaseId = match ? match[1] : "N/A";

      if (apiCaseId === prec.case_id) {
        console.log("✅ " + prec.case_id + " → serial " + prec.precedent_serial_number);
        correct++;
      } else {
        console.log("❌ " + prec.case_id + " → API: " + apiCaseId + " (불일치!)");
        wrongList.push({ db: prec.case_id, api: apiCaseId, serial: prec.precedent_serial_number });
        wrong++;
      }

      await delay(300);
    } catch (err) {
      console.log("⚠️ " + prec.case_id + " → 오류: " + err.message);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("📊 검증 결과");
  console.log("═══════════════════════════════════════════");
  console.log("  ✅ 정확한 매칭: " + correct + "건");
  console.log("  ❌ 불일치: " + wrong + "건");
  console.log("  📈 정확도: " + ((correct / (correct + wrong)) * 100).toFixed(1) + "%");

  if (wrongList.length > 0) {
    console.log("\n=== 불일치 목록 ===");
    wrongList.forEach(w => {
      console.log("  DB: " + w.db);
      console.log("  → API: " + w.api + " (serial: " + w.serial + ")");
      console.log("");
    });
  }

  db.close();
}

verifyMatches().catch(console.error);
