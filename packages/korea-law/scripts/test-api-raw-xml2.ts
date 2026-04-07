import axios from 'axios';

const API_KEY = 'theqwe2000';
const REFERER = 'https://ainote.dev';

async function testRawXml() {
  const detailUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=law&type=XML&ID=14474`;
  const detailRes = await axios.get(detailUrl, { headers: { 'Referer': REFERER } });
  const xml = detailRes.data;

  // 전체 구조 확인
  console.log('=== 전체 XML 길이 ===');
  console.log(xml.length, '자');

  // 조문 관련 태그 찾기
  console.log('\n=== 조문 관련 태그 패턴 ===');

  // <조문> 태그 찾기
  const 조문시작 = xml.indexOf('<조문>');
  const 조문끝 = xml.indexOf('</조문>');
  console.log('조문 태그 위치:', 조문시작, '~', 조문끝);

  if (조문시작 > 0) {
    // 조문 섹션 일부 출력
    const 조문섹션 = xml.substring(조문시작, Math.min(조문시작 + 5000, 조문끝 + 10));
    console.log('\n=== 조문 섹션 (처음 5000자) ===\n');
    console.log(조문섹션);
  }

  // 제2조 위치 찾기
  console.log('\n=== 제2조 검색 ===');
  const patterns = [
    '<조문번호>2</조문번호>',
    '<조문번호>2 </조문번호>',
    '조문번호>2<',
    '정의',
    '가상자산"이란',
  ];

  for (const p of patterns) {
    const idx = xml.indexOf(p);
    if (idx > 0) {
      console.log(`"${p}" 위치: ${idx}`);
      console.log('  주변 내용:', xml.substring(Math.max(0, idx - 50), idx + 200).replace(/\n/g, ' ').substring(0, 200));
    }
  }
}

testRawXml().catch(console.error);
