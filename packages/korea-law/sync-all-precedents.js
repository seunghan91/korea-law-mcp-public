require('dotenv').config({ path: '/Users/seunghan/law/korea-law/.env' });
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');

const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';
const parser = new XMLParser();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

const DISPLAY = 100;
const DELAY_MS = 500;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(page) {
  const r = await axios.get('http://www.law.go.kr/DRF/lawSearch.do', {
    params: { OC: API_KEY, target: 'prec', type: 'XML', display: DISPLAY, page },
    timeout: 15000
  });
  const d = parser.parse(r.data);
  const totalCnt = d.PrecSearch?.totalCnt || 0;
  let items = d.PrecSearch?.prec || [];
  if (!Array.isArray(items)) items = [items];

  return { totalCnt, items };
}

function toRecord(p) {
  return {
    id: Number(p.판례일련번호),
    case_number: String(p.사건번호 || ''),
    case_name: String(p.사건명 || ''),
    decision_date: String(p.선고일자 || '').replace(/\./g, '-') || null,
    case_type: String(p.사건종류명 || ''),
    case_type_code: String(p.사건종류코드 || ''),
    court_name: String(p.법원명 || '') || null,
    data_source: 'law.go.kr',
    detail_link: String(p.판례상세링크 || ''),
    case_id_text: String(p.사건번호 || ''),
    case_id_normalized: String(p.사건번호 || '').replace(/[-\s]/g, ''),
    exists_verified: true,
    last_verified_at: new Date().toISOString(),
  };
}

async function main() {
  // 총 건수 확인
  const { totalCnt } = await fetchPage(1);
  const totalPages = Math.ceil(totalCnt / DISPLAY);
  console.log(`전체: ${totalCnt}건, ${totalPages} 페이지`);
  console.log(`시작: ${new Date().toLocaleTimeString()}\n`);

  let synced = 0;
  let errors = 0;

  for (let page = 1; page <= totalPages; page++) {
    try {
      const { items } = await fetchPage(page);
      const records = items.map(toRecord);

      // case_number 중복 시 최신으로 덮어쓰기
      const { error } = await supabase.from('precedents')
        .upsert(records, { onConflict: 'case_number', ignoreDuplicates: false });

      if (error) {
        // 배치 실패 시 개별 upsert 폴백
        let batchSynced = 0;
        for (const rec of records) {
          const { error: e2 } = await supabase.from('precedents')
            .upsert(rec, { onConflict: 'case_number', ignoreDuplicates: false });
          if (!e2) batchSynced++;
        }
        synced += batchSynced;
        if (batchSynced < records.length) {
          console.log(`⚠️ p${page}: ${batchSynced}/${records.length} (개별 폴백)`);
          errors++;
        } else {
          synced += 0; // already counted
        }
      } else {
        synced += records.length;
      }

      if (page % 50 === 0 || page === totalPages) {
        console.log(`📊 ${page}/${totalPages} (${synced}건 완료, ${errors} 에러) ${new Date().toLocaleTimeString()}`);
      }

      await sleep(DELAY_MS);

    } catch (e) {
      console.log(`❌ p${page} fetch error: ${e.message}`);
      errors++;
      await sleep(2000); // 에러 시 2초 대기
    }
  }

  const { count } = await supabase.from('precedents').select('*', { count: 'exact', head: true });
  console.log(`\n=== 완료 ===`);
  console.log(`Supabase 총: ${count}건`);
  console.log(`동기화: ${synced}건, 에러: ${errors}건`);
  console.log(`종료: ${new Date().toLocaleTimeString()}`);
}

main().catch(e => console.error(e));
