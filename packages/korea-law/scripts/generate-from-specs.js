/**
 * API 스펙에서 TypeScript 타입, 클라이언트 코드, 문서 자동 생성
 */

const fs = require('fs');
const path = require('path');

const SPECS_FILE = path.join(__dirname, '../docs/api-specs/crawled/_all-specs.json');
const OUTPUT_DIR = path.join(__dirname, '../src/generated');
const DOCS_DIR = path.join(__dirname, '../docs/generated');

// 스펙 로드
const specs = JSON.parse(fs.readFileSync(SPECS_FILE, 'utf-8'));

// 디렉토리 생성
[OUTPUT_DIR, DOCS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// target별로 그룹화
const groupedSpecs = {};
specs.forEach(spec => {
  const target = spec.target || 'unknown';
  if (!groupedSpecs[target]) {
    groupedSpecs[target] = [];
  }
  groupedSpecs[target].push(spec);
});

/**
 * 1. TypeScript 타입 생성
 */
function generateTypes() {
  console.log('📝 TypeScript 타입 생성 중...');
  
  let typesContent = `/**
 * 국가법령정보 OPEN API 타입 정의
 * 자동 생성됨 - ${new Date().toISOString()}
 */

// 공통 타입
export type OutputType = 'XML' | 'JSON' | 'HTML';

export interface BaseSearchParams {
  OC: string;       // 사용자 이메일 ID (필수)
  type?: OutputType; // 출력 형태 (기본: XML)
  display?: number;  // 결과 개수 (기본: 20, 최대: 100)
  page?: number;     // 페이지 번호 (기본: 1)
}

export interface BaseSearchResponse<T> {
  target: string;
  totalCnt: number;
  page: number;
  items: T[];
}

`;

  // target별 타입 생성
  Object.entries(groupedSpecs).forEach(([target, apiSpecs]) => {
    if (target === 'unknown' || !apiSpecs[0]) return;
    
    const searchSpec = apiSpecs.find(s => s.name.includes('목록') || s.name.includes('검색'));
    const detailSpec = apiSpecs.find(s => s.name.includes('본문') || s.name.includes('상세'));
    
    const targetPascal = toPascalCase(target);
    
    // 검색 파라미터 타입
    if (searchSpec && searchSpec.requestParams.length > 0) {
      typesContent += `// ==================== ${target.toUpperCase()} ====================\n\n`;
      typesContent += generateParamsInterface(searchSpec, `${targetPascal}SearchParams`);
    }
    
    // 응답 아이템 타입
    if (searchSpec && searchSpec.responseFields.length > 0) {
      typesContent += generateResponseInterface(searchSpec, `${targetPascal}ListItem`);
    }
    
    // 상세 응답 타입
    if (detailSpec && detailSpec.responseFields.length > 0) {
      typesContent += generateResponseInterface(detailSpec, `${targetPascal}Detail`);
    }
  });

  // API 대상 타입 (Union)
  const allTargets = Object.keys(groupedSpecs).filter(t => t !== 'unknown');
  typesContent += `\n// API 대상 타입\nexport type ApiTarget = \n  | '${allTargets.join("'\n  | '")}';\n`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'types.ts'), typesContent);
  console.log(`   ✅ types.ts 생성 완료 (${allTargets.length}개 API 타입)`);
}

function generateParamsInterface(spec, name) {
  let content = `/** ${spec.name} 요청 파라미터 */\nexport interface ${name} extends BaseSearchParams {\n`;
  content += `  target: '${spec.target}';\n`;
  
  spec.requestParams.forEach(param => {
    if (['OC', 'target', 'type', 'display', 'page'].includes(param.name)) return;
    
    const tsType = convertType(param.type);
    const required = param.type.includes('필수');
    const optional = required ? '' : '?';
    const comment = param.description.replace(/\n/g, ' ').substring(0, 80);
    
    content += `  /** ${comment} */\n`;
    content += `  ${param.name}${optional}: ${tsType};\n`;
  });
  
  content += '}\n\n';
  return content;
}

function generateResponseInterface(spec, name) {
  let content = `/** ${spec.name} 응답 */\nexport interface ${name} {\n`;
  
  spec.responseFields.forEach(field => {
    const fieldName = sanitizeFieldName(field.name);
    const tsType = convertType(field.type);
    const comment = field.description.replace(/\n/g, ' ').substring(0, 80);
    
    content += `  /** ${comment} */\n`;
    content += `  ${fieldName}?: ${tsType};\n`;
  });
  
  content += '}\n\n';
  return content;
}

/**
 * 2. API 클라이언트 코드 생성
 */
function generateClient() {
  console.log('🔧 API 클라이언트 코드 생성 중...');
  
  let clientContent = `/**
 * 국가법령정보 OPEN API 클라이언트
 * 자동 생성됨 - ${new Date().toISOString()}
 */

import axios, { AxiosInstance } from 'axios';
import { parseStringPromise } from 'xml2js';

const BASE_URL = 'http://www.law.go.kr/DRF';

export interface ApiClientConfig {
  oc: string;           // 사용자 이메일 ID
  timeout?: number;     // 타임아웃 (ms)
  retries?: number;     // 재시도 횟수
}

export class KoreaLawApiClient {
  private client: AxiosInstance;
  private oc: string;
  private retries: number;

  constructor(config: ApiClientConfig) {
    this.oc = config.oc;
    this.retries = config.retries || 3;
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: config.timeout || 30000,
    });
  }

  private async request<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    const fullParams = { OC: this.oc, type: 'XML', ...params };
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await this.client.get(endpoint, { params: fullParams });
        const data = await parseStringPromise(response.data, { explicitArray: false });
        return data as T;
      } catch (error) {
        if (attempt === this.retries) throw error;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

`;

  // target별 메서드 생성
  const processedTargets = new Set();
  
  Object.entries(groupedSpecs).forEach(([target, apiSpecs]) => {
    if (target === 'unknown' || processedTargets.has(target)) return;
    processedTargets.add(target);
    
    const searchSpec = apiSpecs.find(s => s.name.includes('목록') || s.name.includes('검색'));
    const detailSpec = apiSpecs.find(s => s.name.includes('본문') || s.name.includes('상세'));
    
    const methodName = toCamelCase(target);
    const targetPascal = toPascalCase(target);
    
    // 검색 메서드
    if (searchSpec) {
      const endpoint = searchSpec.requestUrl.includes('lawSearch') ? 'lawSearch.do' : 'lawService.do';
      clientContent += `  /**
   * ${searchSpec.name}
   * @see ${searchSpec.requestUrl}
   */
  async search${targetPascal}(params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/${endpoint}', { target: '${target}', ...params });
  }

`;
    }
    
    // 상세 조회 메서드
    if (detailSpec) {
      const endpoint = detailSpec.requestUrl.includes('lawService') ? 'lawService.do' : 'lawSearch.do';
      clientContent += `  /**
   * ${detailSpec.name}
   * @see ${detailSpec.requestUrl}
   */
  async get${targetPascal}Detail(id: string | number, params: Partial<Record<string, any>> = {}): Promise<any> {
    return this.request('/${endpoint}', { target: '${target}', ID: id, ...params });
  }

`;
    }
  });

  clientContent += `}

// 싱글톤 인스턴스 생성 헬퍼
let defaultClient: KoreaLawApiClient | null = null;

export function initClient(config: ApiClientConfig): KoreaLawApiClient {
  defaultClient = new KoreaLawApiClient(config);
  return defaultClient;
}

export function getClient(): KoreaLawApiClient {
  if (!defaultClient) {
    throw new Error('Client not initialized. Call initClient() first.');
  }
  return defaultClient;
}

export default KoreaLawApiClient;
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'client.ts'), clientContent);
  console.log(`   ✅ client.ts 생성 완료 (${processedTargets.size}개 API 메서드)`);
}

/**
 * 3. 문서 생성
 */
function generateDocs() {
  console.log('📚 API 문서 생성 중...');
  
  let mdContent = `# 국가법령정보 OPEN API 문서

> 자동 생성됨: ${new Date().toISOString()}

## 목차

`;

  // 목차 생성
  const categories = categorizeApis();
  Object.keys(categories).forEach(cat => {
    mdContent += `- [${cat}](#${cat.toLowerCase().replace(/\s+/g, '-')})\n`;
  });

  mdContent += `\n---\n\n`;

  // 카테고리별 API 문서
  Object.entries(categories).forEach(([category, apis]) => {
    mdContent += `## ${category}\n\n`;
    
    apis.forEach(spec => {
      mdContent += `### ${spec.name}\n\n`;
      mdContent += `- **Target**: \`${spec.target}\`\n`;
      mdContent += `- **URL**: \`${spec.requestUrl}\`\n\n`;
      
      // 요청 파라미터
      if (spec.requestParams.length > 0) {
        mdContent += `#### 요청 파라미터\n\n`;
        mdContent += `| 파라미터 | 타입 | 설명 |\n`;
        mdContent += `|---------|------|------|\n`;
        spec.requestParams.forEach(param => {
          const desc = param.description.replace(/\|/g, '\\|').substring(0, 100);
          mdContent += `| \`${param.name}\` | ${param.type} | ${desc} |\n`;
        });
        mdContent += '\n';
      }
      
      // 응답 필드
      if (spec.responseFields.length > 0) {
        mdContent += `#### 응답 필드\n\n`;
        mdContent += `| 필드 | 타입 | 설명 |\n`;
        mdContent += `|------|------|------|\n`;
        spec.responseFields.forEach(field => {
          const desc = field.description.replace(/\|/g, '\\|').substring(0, 100);
          mdContent += `| \`${field.name}\` | ${field.type} | ${desc} |\n`;
        });
        mdContent += '\n';
      }
      
      // 샘플 URL
      if (spec.sampleUrls.length > 0) {
        mdContent += `#### 샘플 URL\n\n`;
        spec.sampleUrls.forEach(sample => {
          mdContent += `- ${sample.description}\n  \`${sample.url}\`\n`;
        });
        mdContent += '\n';
      }
      
      mdContent += `---\n\n`;
    });
  });

  fs.writeFileSync(path.join(DOCS_DIR, 'API_REFERENCE.md'), mdContent);
  console.log(`   ✅ API_REFERENCE.md 생성 완료 (${specs.length}개 API 문서화)`);

  // API 요약 JSON 생성
  const summary = {
    generatedAt: new Date().toISOString(),
    totalApis: specs.length,
    categories: Object.entries(categories).map(([name, apis]) => ({
      name,
      count: apis.length,
      targets: [...new Set(apis.map(a => a.target))],
    })),
    allTargets: [...new Set(specs.map(s => s.target).filter(Boolean))],
  };
  
  fs.writeFileSync(path.join(DOCS_DIR, 'api-summary.json'), JSON.stringify(summary, null, 2));
  console.log(`   ✅ api-summary.json 생성 완료`);
}

// 유틸리티 함수들
function toPascalCase(str) {
  return str.replace(/(?:^|_)(\w)/g, (_, c) => c.toUpperCase());
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function convertType(typeStr) {
  const lower = typeStr.toLowerCase();
  if (lower.includes('int') || lower.includes('number')) return 'number';
  if (lower.includes('char') || lower.includes('string')) return 'string';
  return 'string';
}

function sanitizeFieldName(name) {
  // 한글 필드명을 영문으로 변환하거나 그대로 유지
  const cleaned = name.replace(/[^a-zA-Z0-9가-힣_]/g, '_');
  // 숫자로 시작하면 앞에 _ 추가
  if (/^\d/.test(cleaned)) return '_' + cleaned;
  return cleaned;
}

function categorizeApis() {
  const categories = {
    '법령': [],
    '행정규칙': [],
    '자치법규': [],
    '판례/결정례': [],
    '조약': [],
    '부가서비스': [],
    '모바일': [],
    '법령정보 지식베이스': [],
    '중앙부처 법령해석': [],
    '위원회 결정문': [],
    '특별행정심판': [],
    '기타': [],
  };
  
  specs.forEach(spec => {
    const name = spec.name || '';
    const target = spec.target || '';
    
    if (target.includes('CgmExpc')) {
      categories['중앙부처 법령해석'].push(spec);
    } else if (target.includes('SpecialDecc')) {
      categories['특별행정심판'].push(spec);
    } else if (name.includes('위원회') || target.includes('Decc')) {
      categories['위원회 결정문'].push(spec);
    } else if (name.includes('모바일') || spec.index >= 75 && spec.index <= 102) {
      categories['모바일'].push(spec);
    } else if (target.includes('law') || target.includes('eflaw') || target === 'lsHistory') {
      categories['법령'].push(spec);
    } else if (target === 'admrul') {
      categories['행정규칙'].push(spec);
    } else if (target === 'ordin') {
      categories['자치법규'].push(spec);
    } else if (target === 'prec' || target === 'detc' || target === 'expc' || target === 'decc') {
      categories['판례/결정례'].push(spec);
    } else if (target === 'trty') {
      categories['조약'].push(spec);
    } else if (target.includes('lstrm') || target.includes('kb')) {
      categories['법령정보 지식베이스'].push(spec);
    } else if (name.includes('체계도') || name.includes('신구법') || name.includes('비교')) {
      categories['부가서비스'].push(spec);
    } else {
      categories['기타'].push(spec);
    }
  });
  
  // 빈 카테고리 제거
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) delete categories[key];
  });
  
  return categories;
}

// 메인 실행
console.log('🚀 코드 생성 시작...\n');

generateTypes();
generateClient();
generateDocs();

console.log('\n✅ 모든 코드 생성 완료!');
console.log(`   - 타입: ${OUTPUT_DIR}/types.ts`);
console.log(`   - 클라이언트: ${OUTPUT_DIR}/client.ts`);
console.log(`   - 문서: ${DOCS_DIR}/API_REFERENCE.md`);



