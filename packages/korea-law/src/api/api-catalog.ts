/**
 * API 카탈로그 유틸리티
 * 
 * docs/api-catalog.json을 기반으로 API 정보를 제공합니다.
 * - API 목록 조회
 * - 구현 상태 확인
 * - 타겟 코드 조회
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// 타입 정의
// ============================================

export interface ApiInfo {
  id: string;
  name: string;
  type: 'list' | 'detail';
  target: string;
  endpoint: string;
  note?: string;
  implemented: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  code?: string;
  apis: ApiInfo[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface ApiCatalog {
  version: string;
  lastUpdated: string;
  source: string;
  totalApis: number;
  categories: Category[];
  implementationSummary: {
    implemented: number;
    notImplemented: number;
    implementedApis: string[];
  };
}

// ============================================
// 카탈로그 로더
// ============================================

let catalogCache: ApiCatalog | null = null;

/**
 * API 카탈로그 로드
 */
export function loadCatalog(): ApiCatalog {
  if (catalogCache) return catalogCache;

  const catalogPath = path.join(__dirname, '../../docs/api-catalog.json');
  const content = fs.readFileSync(catalogPath, 'utf-8');
  catalogCache = JSON.parse(content) as ApiCatalog;
  return catalogCache;
}

/**
 * 카탈로그 캐시 초기화
 */
export function clearCatalogCache(): void {
  catalogCache = null;
}

// ============================================
// 조회 함수들
// ============================================

/**
 * 모든 API 목록 조회
 */
export function getAllApis(): ApiInfo[] {
  const catalog = loadCatalog();
  const apis: ApiInfo[] = [];

  for (const category of catalog.categories) {
    for (const subcategory of category.subcategories) {
      apis.push(...subcategory.apis);
    }
  }

  return apis;
}

/**
 * 카테고리별 API 목록 조회
 */
export function getApisByCategory(categoryId: string): ApiInfo[] {
  const catalog = loadCatalog();
  const category = catalog.categories.find(c => c.id === categoryId);
  
  if (!category) return [];

  const apis: ApiInfo[] = [];
  for (const subcategory of category.subcategories) {
    apis.push(...subcategory.apis);
  }

  return apis;
}

/**
 * 구현된 API만 조회
 */
export function getImplementedApis(): ApiInfo[] {
  return getAllApis().filter(api => api.implemented);
}

/**
 * 미구현 API만 조회
 */
export function getNotImplementedApis(): ApiInfo[] {
  return getAllApis().filter(api => !api.implemented);
}

/**
 * target 코드로 API 조회
 */
export function getApiByTarget(target: string): ApiInfo | undefined {
  return getAllApis().find(api => api.target === target);
}

/**
 * API ID로 조회
 */
export function getApiById(apiId: string): ApiInfo | undefined {
  return getAllApis().find(api => api.id === apiId);
}

/**
 * 카테고리 목록 조회
 */
export function getCategories(): { id: string; name: string; apiCount: number }[] {
  const catalog = loadCatalog();
  
  return catalog.categories.map(category => {
    let apiCount = 0;
    for (const subcategory of category.subcategories) {
      apiCount += subcategory.apis.length;
    }
    return {
      id: category.id,
      name: category.name,
      apiCount,
    };
  });
}

/**
 * 구현 통계 조회
 */
export function getImplementationStats(): {
  total: number;
  implemented: number;
  notImplemented: number;
  percentage: number;
} {
  const catalog = loadCatalog();
  const summary = catalog.implementationSummary;

  return {
    total: summary.implemented + summary.notImplemented,
    implemented: summary.implemented,
    notImplemented: summary.notImplemented,
    percentage: Math.round((summary.implemented / (summary.implemented + summary.notImplemented)) * 100),
  };
}

// ============================================
// API 정보 검색
// ============================================

/**
 * API 검색 (이름으로)
 */
export function searchApis(query: string): ApiInfo[] {
  const lowerQuery = query.toLowerCase();
  return getAllApis().filter(api => 
    api.name.toLowerCase().includes(lowerQuery) ||
    api.id.toLowerCase().includes(lowerQuery) ||
    api.target.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 특정 타입의 API만 조회
 */
export function getApisByType(type: 'list' | 'detail'): ApiInfo[] {
  return getAllApis().filter(api => api.type === type);
}

// ============================================
// API 엔드포인트 빌더
// ============================================

const BASE_URL = 'http://www.law.go.kr/DRF';

/**
 * 목록 조회 API URL 생성
 */
export function buildListUrl(target: string, query: string, options?: {
  display?: number;
  page?: number;
  sort?: string;
}): string {
  const params = new URLSearchParams({
    OC: process.env.KOREA_LAW_API_KEY || 'sapphire_5',
    target,
    type: 'XML',
    query,
    display: String(options?.display || 100),
    page: String(options?.page || 1),
  });

  if (options?.sort) {
    params.set('sort', options.sort);
  }

  return `${BASE_URL}/lawSearch.do?${params.toString()}`;
}

/**
 * 상세 조회 API URL 생성
 */
export function buildDetailUrl(target: string, id: string | number): string {
  const params = new URLSearchParams({
    OC: process.env.KOREA_LAW_API_KEY || 'sapphire_5',
    target,
    type: 'XML',
    ID: String(id),
  });

  return `${BASE_URL}/lawService.do?${params.toString()}`;
}

// ============================================
// CLI용 출력
// ============================================

/**
 * 카탈로그 요약 출력
 */
export function printCatalogSummary(): void {
  const stats = getImplementationStats();
  const categories = getCategories();

  console.log('='.repeat(50));
  console.log('📚 국가법령정보 OPEN API 카탈로그');
  console.log('='.repeat(50));
  console.log(`총 API 수: ${stats.total}개`);
  console.log(`구현 완료: ${stats.implemented}개 (${stats.percentage}%)`);
  console.log(`미구현: ${stats.notImplemented}개`);
  console.log('');
  console.log('📂 카테고리별 현황:');
  console.log('-'.repeat(40));
  
  for (const category of categories) {
    const categoryApis = getApisByCategory(category.id);
    const implemented = categoryApis.filter(a => a.implemented).length;
    console.log(`  ${category.name}: ${implemented}/${category.apiCount} 구현`);
  }
  
  console.log('='.repeat(50));
}

/**
 * 미구현 API 목록 출력
 */
export function printNotImplementedApis(): void {
  const apis = getNotImplementedApis();
  
  console.log('='.repeat(50));
  console.log('⚠️ 미구현 API 목록');
  console.log('='.repeat(50));
  
  for (const api of apis) {
    console.log(`  - [${api.type}] ${api.name}`);
    console.log(`    target: ${api.target}`);
  }
  
  console.log(`\n총 ${apis.length}개`);
}

// Export for testing
export { catalogCache };

