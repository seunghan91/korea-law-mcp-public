#!/usr/bin/env node
/**
 * 나머지 11건 판례 동기화 스크립트
 *
 * 전략:
 * 1. 각 사건번호로 law.go.kr API 검색
 * 2. 검색 결과에서 정확한 사건번호 일치 확인
 * 3. 일치하면 전문 조회 후 저장
 * 4. 불일치하면 대체 검색어로 재시도 (사건명 키워드)
 */

const axios = require("axios");
const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/korea-law.db");
const db = new Database(DB_PATH);
const API_KEY = process.env.KOREA_LAW_API_KEY || "theqwe2000";

// 동기화 대상 11건 (case_id와 대체 검색 키워드)
const TARGET_CASES = [
  { case_id: "2021다225074", keywords: ["최저임금", "소정근로시간", "택시"] },
  { case_id: "2024다229794", keywords: ["격일제", "최저임금"] },
  { case_id: "2021다270555", keywords: ["교통사고", "정신건강", "PTSD"] },
  { case_id: "70도704", keywords: ["명예훼손", "피해자 의사"] },
  { case_id: "2024도18320", keywords: ["위안부", "명예훼손"] },
  { case_id: "2018도2738", keywords: ["뇌물수수", "공동정범"] },
  { case_id: "2017도661", keywords: ["음주측정", "채혈", "호흡"] },
  { case_id: "2024도8174", keywords: ["상표", "유사"] },
  { case_id: "2024도14181", keywords: ["저작권", "교재", "배포"] },
  { case_id: "2025다209384", keywords: ["공동저작권", "지분"] },
  { case_id: "2023다281009", keywords: ["보이스피싱", "부당이득"] }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CDATA 추출
function getCDATA(xml, tag) {
  const regex = new RegExp("<" + tag + "><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></" + tag + ">");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// 일반 태그 추출
function getTagValue(xml, tag) {
  const regex = new RegExp("<" + tag + ">([^<]*)</" + tag + ">");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// 사건번호 정규화
function normalizeCaseId(caseId) {
  return caseId.trim().replace(/\s+/g, "").split(",")[0];
}

// 사건번호 일치 검증
function isCaseIdMatch(dbCaseId, apiCaseId) {
  const normalizedDb = normalizeCaseId(dbCaseId);
  const normalizedApi = normalizeCaseId(apiCaseId);

  // 정확 일치
  if (normalizedDb === normalizedApi) return true;

  // 병합 사건 확인
  const apiParts = apiCaseId.split(",").map(s => s.trim().replace(/\s+/g, ""));
  if (apiParts.some(p => p === normalizedDb)) return true;

  return false;
}

// API 검색 및 정확 일치 찾기
async function searchPrecedent(query, targetCaseId) {
  try {
    const res = await axios.get("http://www.law.go.kr/DRF/lawSearch.do", {
      params: {
        OC: API_KEY,
        target: "prec",
        type: "XML",
        query: query,
        display: 20
      },
      timeout: 15000
    });

    // 모든 검색 결과에서 정확 일치 찾기
    const precRegex = /<prec[^>]*>[\s\S]*?<판례일련번호>(\d+)<\/판례일련번호>[\s\S]*?<사건번호>([^<]+)<\/사건번호>[\s\S]*?<\/prec>/g;
    let match;

    while ((match = precRegex.exec(res.data)) !== null) {
      const apiSerial = match[1];
      const apiCaseId = match[2];

      if (isCaseIdMatch(targetCaseId, apiCaseId)) {
        return { serial: apiSerial, caseId: apiCaseId };
      }
    }

    return null;
  } catch (err) {
    console.log("     검색 오류:", err.message);
    return null;
  }
}

// 판례 상세 조회
async function getPrecedentDetail(serial) {
  try {
    const res = await axios.get("http://www.law.go.kr/DRF/lawService.do", {
      params: {
        OC: API_KEY,
        target: "prec",
        type: "XML",
        ID: serial
      },
      timeout: 20000
    });

    return {
      fullText: getCDATA(res.data, "판례내용"),
      summary: getCDATA(res.data, "판시사항"),
      keyPoints: getCDATA(res.data, "판결요지"),
      refStatutes: getCDATA(res.data, "참조조문"),
      refCases: getCDATA(res.data, "참조판례"),
      judgmentDate: getTagValue(res.data, "선고일자"),
      courtName: getTagValue(res.data, "법원명")
    };
  } catch (err) {
    console.log("     상세 조회 오류:", err.message);
    return null;
  }
}

// DB 업데이트
function updatePrecedent(caseId, serial, detail) {
  const stmt = db.prepare(`
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

  stmt.run(
    parseInt(serial),
    detail.summary,
    detail.keyPoints,
    detail.fullText,
    detail.refStatutes,
    detail.refCases,
    caseId
  );
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📚 나머지 11건 판례 전문 동기화");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let success = 0;
  let failed = 0;
  const notFoundList = [];

  for (let i = 0; i < TARGET_CASES.length; i++) {
    const target = TARGET_CASES[i];
    console.log(`[${i + 1}/${TARGET_CASES.length}] 🔍 ${target.case_id}`);

    // 1차: 사건번호로 직접 검색
    let found = await searchPrecedent(target.case_id, target.case_id);

    // 2차: 키워드로 검색
    if (!found && target.keywords.length > 0) {
      for (const keyword of target.keywords) {
        console.log(`     → 키워드 검색: "${keyword}"`);
        found = await searchPrecedent(keyword, target.case_id);
        if (found) break;
        await delay(500);
      }
    }

    if (!found) {
      console.log("     ⚠️  API에서 찾을 수 없음 (미등록 또는 비공개)");
      notFoundList.push(target.case_id);
      failed++;
      await delay(1000);
      continue;
    }

    console.log(`     ✅ 일치 발견: ${found.caseId} (serial: ${found.serial})`);

    // 상세 조회
    const detail = await getPrecedentDetail(found.serial);
    if (!detail || (!detail.fullText && !detail.summary && !detail.keyPoints)) {
      console.log("     ⚠️  전문 내용 없음");
      failed++;
      await delay(1000);
      continue;
    }

    // DB 저장
    updatePrecedent(target.case_id, found.serial, detail);

    const textLen = (detail.fullText || "").length;
    console.log(`     💾 저장 완료 (${textLen.toLocaleString()} 글자)`);
    success++;

    await delay(1500);
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📊 동기화 결과");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  ✅ 성공: ${success} 건`);
  console.log(`  ❌ 실패: ${failed} 건`);

  if (notFoundList.length > 0) {
    console.log("\n⚠️  API 미등록 사건 (수동 확인 필요):");
    notFoundList.forEach(id => console.log(`     - ${id}`));
  }

  // 최종 상태 확인
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN full_text IS NOT NULL AND length(full_text) > 0 THEN 1 ELSE 0 END) as with_text
    FROM Precedents
  `).get();

  console.log(`\n📈 전체 현황: ${stats.with_text}/${stats.total} 건 전문 보유 (${(stats.with_text/stats.total*100).toFixed(1)}%)`);

  db.close();
}

main().catch(console.error);
