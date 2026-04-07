#!/usr/bin/env node
/**
 * 판례 전문 동기화 스크립트 (개선 버전)
 * 사건번호로 검색 → 사건번호 정확 일치 검증 → 판례일련번호 획득 → 전문 조회 → DB 저장
 *
 * 🚨 중요: 반드시 API 반환 사건번호가 원본과 정확히 일치하는지 검증
 *          (fuzzy 매칭으로 인한 잘못된 판례 저장 방지)
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

// CDATA 추출 함수
function getCDATA(xml, tag) {
  const regex = new RegExp("<" + tag + "><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></" + tag + ">");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

// 사건번호 정규화 (비교용)
function normalizeCaseId(caseId) {
  // 공백 제거, 쉼표로 분리된 경우 첫 번째만 사용
  return caseId.trim().split(",")[0].trim();
}

// 사건번호가 일치하는지 확인
function isCaseIdMatch(dbCaseId, apiCaseId) {
  const normalizedDb = normalizeCaseId(dbCaseId);
  const normalizedApi = normalizeCaseId(apiCaseId);

  // 정확 일치 확인
  if (normalizedDb === normalizedApi) return true;

  // API가 병합 사건을 반환하는 경우 (예: "2024므13669, 13676")
  // DB의 사건번호가 API 반환 문자열에 정확히 포함되는지 확인
  const apiParts = apiCaseId.split(",").map(s => s.trim());
  if (apiParts.includes(normalizedDb)) return true;

  return false;
}

async function syncPrecedentFullText() {
  console.log("═══════════════════════════════════════════");
  console.log("📚 판례 전문 동기화 (사건번호 정확 일치 검증)");
  console.log("═══════════════════════════════════════════\n");

  // 전문이 없는 판례 조회
  const precedents = db.prepare(`
    SELECT case_id, case_name FROM Precedents
    WHERE full_text IS NULL OR length(full_text) = 0
    LIMIT 30
  `).all();

  console.log("📋 동기화 대상:", precedents.length, "건\n");

  let success = 0;
  let failed = 0;
  let notFound = 0;
  let mismatch = 0;

  for (let i = 0; i < precedents.length; i++) {
    const prec = precedents[i];
    console.log("[" + (i+1) + "/" + precedents.length + "] 🔍 " + prec.case_id);

    try {
      // 1. 사건번호로 검색하여 판례일련번호 획득
      const searchRes = await axios.get("http://www.law.go.kr/DRF/lawSearch.do", {
        params: {
          OC: API_KEY,
          target: "prec",
          type: "XML",
          query: prec.case_id,
          display: 10  // 더 많은 결과에서 정확 일치 찾기
        },
        timeout: 10000
      });

      // 검색 결과 파싱 - 모든 결과에서 정확 일치 찾기
      const precRegex = /<prec[^>]*>[\s\S]*?<판례일련번호>(\d+)<\/판례일련번호>[\s\S]*?<사건번호>([^<]+)<\/사건번호>[\s\S]*?<\/prec>/g;
      let match;
      let foundSerial = null;
      let foundCaseId = null;

      while ((match = precRegex.exec(searchRes.data)) !== null) {
        const apiSerial = match[1];
        const apiCaseId = match[2];

        if (isCaseIdMatch(prec.case_id, apiCaseId)) {
          foundSerial = apiSerial;
          foundCaseId = apiCaseId;
          break;
        }
      }

      if (!foundSerial) {
        // 첫 번째 결과 확인 (불일치 로깅용)
        const firstMatch = searchRes.data.match(/<사건번호>([^<]+)<\/사건번호>/);
        if (firstMatch) {
          console.log("     ⚠️  사건번호 불일치: API=" + firstMatch[1]);
          mismatch++;
        } else {
          console.log("     ⚠️  검색 결과 없음 (API 미등록)");
          notFound++;
        }
        failed++;
        await delay(1000);
        continue;
      }

      console.log("     ✅ 사건번호 일치: " + foundCaseId);
      console.log("     📍 판례일련번호:", foundSerial);

      // 2. 판례 상세 조회
      const detailRes = await axios.get("http://www.law.go.kr/DRF/lawService.do", {
        params: {
          OC: API_KEY,
          target: "prec",
          type: "XML",
          ID: foundSerial
        },
        timeout: 15000
      });

      const fullText = getCDATA(detailRes.data, "판례내용");
      const summary = getCDATA(detailRes.data, "판시사항");
      const keyPoints = getCDATA(detailRes.data, "판결요지");
      const refStatutes = getCDATA(detailRes.data, "참조조문");
      const refCases = getCDATA(detailRes.data, "참조판례");

      if (!fullText && !summary && !keyPoints) {
        console.log("     ⚠️  전문 내용 없음");
        failed++;
        await delay(1000);
        continue;
      }

      // 3. DB 업데이트
      const updateStmt = db.prepare(`
        UPDATE Precedents SET
          precedent_serial_number = ?,
          summary = COALESCE(?, summary),
          key_points = ?,
          full_text = ?,
          referenced_statutes = ?,
          referenced_cases = ?,
          updated_at = datetime('now')
        WHERE case_id = ?
      `);

      updateStmt.run(
        parseInt(foundSerial),
        summary,
        keyPoints,
        fullText,
        refStatutes,
        refCases,
        prec.case_id
      );

      const textLen = (fullText || "").length;
      console.log("     ✅ 저장 완료 (" + textLen.toLocaleString() + " 글자)");
      success++;

      await delay(1500); // API 부하 방지

    } catch (err) {
      console.log("     ❌ 오류:", err.message);
      failed++;
      await delay(1000);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("📊 동기화 완료");
  console.log("   ✅ 성공 (정확 일치): " + success + " 건");
  console.log("   ❌ 실패 합계: " + failed + " 건");
  console.log("      - API 미등록: " + notFound + " 건");
  console.log("      - 사건번호 불일치: " + mismatch + " 건");
  console.log("═══════════════════════════════════════════");

  db.close();
}

syncPrecedentFullText().catch(console.error);
