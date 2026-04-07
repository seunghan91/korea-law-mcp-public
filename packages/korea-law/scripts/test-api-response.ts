import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const API_KEY = 'theqwe2000';
const REFERER = 'https://ainote.dev';

async function testApiResponse() {
  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseTagValue: true,
    trimValues: true,
  });

  // 가상자산법 검색
  console.log('=== 가상자산 이용자 보호법 검색 ===');
  const query = encodeURIComponent('가상자산 이용자 보호 등에 관한 법률');
  const searchUrl = `http://www.law.go.kr/DRF/lawSearch.do?OC=${API_KEY}&target=law&type=XML&query=${query}&display=5`;

  const searchRes = await axios.get(searchUrl, { headers: { 'Referer': REFERER } });
  const searchParsed = xmlParser.parse(searchRes.data);
  const laws = searchParsed?.LawSearch?.law;
  const lawArray = Array.isArray(laws) ? laws : [laws];

  const targetLaw = lawArray.find((l: any) => l.법령명한글 === '가상자산 이용자 보호 등에 관한 법률');
  if (!targetLaw) {
    console.log('법령을 찾을 수 없음');
    console.log('검색결과:', lawArray.map((l: any) => l.법령명한글));
    return;
  }

  console.log('법령ID:', targetLaw.법령ID);

  // 상세 조회
  console.log('\n=== 상세 조회 (제2조) ===');
  const detailUrl = `http://www.law.go.kr/DRF/lawService.do?OC=${API_KEY}&target=law&type=XML&ID=${targetLaw.법령ID}`;
  const detailRes = await axios.get(detailUrl, { headers: { 'Referer': REFERER } });

  const detailParsed = xmlParser.parse(detailRes.data);
  const law = detailParsed?.법령;
  const 조문목록 = law?.조문?.조문단위;
  const 조문배열 = Array.isArray(조문목록) ? 조문목록 : [조문목록];

  // 제2조만 출력
  const article2 = 조문배열.find((a: any) => String(a.조문번호) === '2');

  if (article2) {
    console.log('조문번호:', article2.조문번호);
    console.log('조문제목:', article2.조문제목);
    console.log('조문내용:', article2.조문내용);
    console.log('항 존재:', !!article2.항);

    if (article2.항) {
      const 항들 = Array.isArray(article2.항) ? article2.항 : [article2.항];
      console.log('항 개수:', 항들.length);

      for (const 항 of 항들.slice(0, 3)) {
        console.log('\n  항번호:', 항.항번호);
        const 항내용Str = typeof 항.항내용 === 'string' ? 항.항내용 : JSON.stringify(항.항내용);
        console.log('  항내용:', 항내용Str?.substring?.(0, 100) || 항내용Str);

        if (항.호) {
          const 호들 = Array.isArray(항.호) ? 항.호 : [항.호];
          console.log('  호 개수:', 호들.length);

          for (const 호 of 호들.slice(0, 2)) {
            console.log('    호번호:', 호.호번호);
            const 호내용Str = typeof 호.호내용 === 'string' ? 호.호내용 : JSON.stringify(호.호내용);
            console.log('    호내용:', 호내용Str?.substring?.(0, 80) || 호내용Str);

            if (호.목) {
              const 목들 = Array.isArray(호.목) ? 호.목 : [호.목];
              console.log('    목 개수:', 목들.length);
              for (const 목 of 목들.slice(0, 2)) {
                console.log('      목번호:', 목.목번호);
                const 목내용Str = typeof 목.목내용 === 'string' ? 목.목내용 : JSON.stringify(목.목내용);
                console.log('      목내용:', 목내용Str?.substring?.(0, 60) || 목내용Str);
              }
            }
          }
        }
      }
    }
  } else {
    console.log('제2조를 찾을 수 없음');
    console.log('조문 목록:', 조문배열.slice(0, 10).map((a: any) => `${a.조문번호}(${a.조문제목 || ''})`));
  }
}

testApiResponse().catch(console.error);
