/**
 * 국가법령정보 OPEN API 스펙 크롤러 (Simple 버전)
 * 
 * SEQ 번호를 순차적으로 시도하여 API 스펙을 수집합니다.
 * playwright 없이 axios + cheerio로 동작합니다.
 * 
 * 사용법:
 *   npx ts-node scripts/crawl-api-specs-simple.ts
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// 타입 정의
// ============================================

interface RequestParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

interface ResponseField {
  name: string;
  type: string;
  description: string;
}

interface SampleUrl {
  description: string;
  url: string;
}

interface ApiSpec {
  seq: number;
  name: string;
  target: string;
  endpoint: string;
  requestUrl: string;
  requestParams: RequestParam[];
  responseFields: ResponseField[];
  sampleUrls: SampleUrl[];
  crawledAt: string;
  rawHtml?: string;
}

// ============================================
// HTML 파서 (간단 버전)
// ============================================

function parseHtml(html: string): Partial<ApiSpec> {
  const result: Partial<ApiSpec> = {
    requestParams: [],
    responseFields: [],
    sampleUrls: [],
  };

  // API 이름 추출
  const titleMatch = html.match(/<h3[^>]*>([^<]+(?:API)?)<\/h3>/);
  if (titleMatch) {
    result.name = titleMatch[1].trim().replace(' API', '');
  }

  // 요청 URL 추출
  const urlMatch = html.match(/요청\s*URL[^:]*:\s*(http:\/\/[^\s<"]+)/);
  if (urlMatch) {
    result.requestUrl = urlMatch[1];
    
    // target 추출
    const targetMatch = urlMatch[1].match(/target=(\w+)/);
    if (targetMatch) {
      result.target = targetMatch[1];
    }
    
    // endpoint 추출
    if (urlMatch[1].includes('lawSearch.do')) {
      result.endpoint = '/lawSearch.do';
    } else if (urlMatch[1].includes('lawService.do')) {
      result.endpoint = '/lawService.do';
    }
  }

  // 테이블 파싱 (요청 변수) - "요청 변수" 텍스트 이후 첫 번째 테이블
  const requestSectionMatch = html.match(/요청\s*변수[^]*?<table[^>]*class="[^"]*guide[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (requestSectionMatch) {
    const rows = requestSectionMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    rows.forEach(row => {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length >= 3) {
        const name = (cells[0] || '').replace(/<[^>]+>/g, '').trim();
        const type = (cells[1] || '').replace(/<[^>]+>/g, '').trim();
        const desc = (cells[2] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        
        if (name && name !== '요청변수' && !name.includes('요청변수') && result.requestParams) {
          result.requestParams.push({
            name,
            type,
            description: desc,
            required: type.includes('필수'),
          });
        }
      }
    });
  }

  // 테이블 파싱 (응답 필드) - "출력 결과" 텍스트 이후 테이블
  const responseSectionMatch = html.match(/출력\s*결과\s*필드[^]*?<table[^>]*class="[^"]*guide[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (responseSectionMatch) {
    const rows = responseSectionMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    rows.forEach(row => {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length >= 3) {
        const name = (cells[0] || '').replace(/<[^>]+>/g, '').trim();
        const type = (cells[1] || '').replace(/<[^>]+>/g, '').trim();
        const desc = (cells[2] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        
        if (name && name !== '필드' && !name.includes('필드') && result.responseFields) {
          result.responseFields.push({ name, type, description: desc });
        }
      }
    });
  }

  // 샘플 URL 추출
  const sampleMatches = html.matchAll(/href="(https?:\/\/[^"]*law\.go\.kr[^"]*)"/gi);
  for (const match of sampleMatches) {
    if (match[1].includes('DRF')) {
      result.sampleUrls!.push({
        description: match[1],
        url: match[1],
      });
    }
  }

  return result;
}

// ============================================
// 크롤러
// ============================================

async function crawlApiSpec(seq: number): Promise<ApiSpec | null> {
  try {
    const response = await axios.get(
      `https://open.law.go.kr/LSO/openApi/guideResult.do?SEQ=${seq}`,
      {
        timeout: 10000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }
    );

    const html = response.data as string;
    
    // 페이지가 비어있거나 에러인지 확인
    if (!html.includes('요청 URL') && !html.includes('target=')) {
      return null;
    }

    const spec = parseHtml(html);
    
    if (!spec.target) {
      return null;
    }

    return {
      seq,
      name: spec.name || `API-${seq}`,
      target: spec.target || '',
      endpoint: spec.endpoint || '',
      requestUrl: spec.requestUrl || '',
      requestParams: spec.requestParams || [],
      responseFields: spec.responseFields || [],
      sampleUrls: spec.sampleUrls || [],
      crawledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error(`  ❌ SEQ ${seq} 에러:`, error.message);
    return null;
  }
}

async function main() {
  const outputDir = path.join(__dirname, '../docs/api-specs/crawled');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🚀 API 스펙 크롤링 시작...\n');

  const allSpecs: ApiSpec[] = [];
  const maxSeq = 300; // 최대 SEQ 번호 (191개 + 여유)
  let consecutiveEmpty = 0;

  for (let seq = 1; seq <= maxSeq; seq++) {
    process.stdout.write(`[${seq}/${maxSeq}] SEQ=${seq}... `);
    
    const spec = await crawlApiSpec(seq);
    
    if (spec) {
      allSpecs.push(spec);
      consecutiveEmpty = 0;
      
      // 개별 파일 저장
      const filename = `${spec.target}-${spec.endpoint.includes('Search') ? 'list' : 'detail'}-seq${seq}.json`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(spec, null, 2), 'utf-8');
      
      console.log(`✅ ${spec.name} (${spec.target})`);
    } else {
      consecutiveEmpty++;
      console.log('⬜ empty');
      
      // 연속 20개가 비어있으면 종료
      if (consecutiveEmpty >= 20) {
        console.log('\n⚠️ 연속 20개 빈 응답, 크롤링 종료');
        break;
      }
    }

    // 요청 간격 (서버 부하 방지)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 전체 카탈로그 저장
  const catalogPath = path.join(outputDir, '_catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify({
    totalCount: allSpecs.length,
    crawledAt: new Date().toISOString(),
    specs: allSpecs.map(s => ({
      seq: s.seq,
      name: s.name,
      target: s.target,
      endpoint: s.endpoint,
      paramsCount: s.requestParams.length,
      fieldsCount: s.responseFields.length,
    })),
  }, null, 2), 'utf-8');

  console.log(`\n📊 크롤링 완료!`);
  console.log(`  수집된 API: ${allSpecs.length}개`);
  console.log(`  저장 위치: ${outputDir}`);

  // 요약 출력
  console.log('\n📋 수집된 API 목록:');
  const byTarget = new Map<string, number>();
  allSpecs.forEach(s => {
    byTarget.set(s.target, (byTarget.get(s.target) || 0) + 1);
  });
  byTarget.forEach((count, target) => {
    console.log(`  ${target}: ${count}개`);
  });
}

main().catch(console.error);

