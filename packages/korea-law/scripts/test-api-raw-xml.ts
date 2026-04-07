import axios from 'axios';

const API_KEY = 'theqwe2000';
const REFERER = 'https://ainote.dev';

async function testRawXml() {
  // 가상자산법 상세 조회
  const detailUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=law&type=XML&ID=14474`;
  const detailRes = await axios.get(detailUrl, { headers: { 'Referer': REFERER } });

  // XML에서 제2조 부분만 추출
  const xml = detailRes.data;

  // 조문번호가 2인 조문 찾기
  const regex = /<조문단위>[\s\S]*?<조문번호>2<\/조문번호>[\s\S]*?<\/조문단위>/;
  const match = xml.match(regex);

  if (match) {
    console.log('=== 제2조 원본 XML (처음 3000자) ===\n');
    console.log(match[0].substring(0, 3000));
    console.log('\n...(truncated)');
  } else {
    console.log('제2조를 찾을 수 없음');

    // 조문단위 태그들 확인
    const 조문들 = xml.match(/<조문단위>[\s\S]*?<조문번호>(\d+)<\/조문번호>/g);
    if (조문들) {
      console.log('조문번호들:', 조문들.slice(0, 10).map((s: string) => {
        const m = s.match(/<조문번호>(\d+)<\/조문번호>/);
        return m ? m[1] : null;
      }));
    }
  }
}

testRawXml().catch(console.error);
