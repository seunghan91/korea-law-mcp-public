/**
 * korea-law: Full Law Sync Engine v2
 * 
 * 전체 법령(약 5,500개)을 동기화합니다.
 * 개선된 파싱 로직 (항/호/목 포함)을 사용합니다.
 * 
 * ⚠️ 중요: 이 동기화 데이터는 AI 검증용입니다.
 */

import { format } from 'date-fns';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import * as db from '../db/database';
import * as api from '../api/law-api';

// ============================================
// 설정
// ============================================

const API_KEY = process.env.KOREA_LAW_API_KEY || 'sapphire_5';
const BASE_URL = 'http://www.law.go.kr/DRF';

interface FullSyncConfig {
  pageSize: number;
  maxPages: number;
  apiDelay: number;
  startPage: number;
  /** 병렬 처리 수 (동시에 처리할 법령 수) */
  concurrency: number;
}

const DEFAULT_CONFIG: FullSyncConfig = {
  pageSize: 100,
  maxPages: 60,  // 최대 6,000개 법령
  apiDelay: 300,
  startPage: 1,
  concurrency: 5,  // 동시에 5개 법령 처리
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  trimValues: true,
});

// ============================================
// 통계
// ============================================

interface SyncStats {
  totalLaws: number;
  lawsSynced: number;
  articlesAdded: number;
  errors: number;
  skipped: number;
}

// ============================================
// 유틸리티
// ============================================

function formatApiDate(dateStr: string | number): string {
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isChapterTitle(content: string): boolean {
  const trimmed = content.trim();
  return /^\s*제\d+[장절관편]\s/.test(trimmed) || 
         /^\s*제\d+[장절관편]$/.test(trimmed) ||
         trimmed.length < 10 && /^제\d+[장절관편]/.test(trimmed);
}

function isValidArticleNo(articleNo: string): boolean {
  return /^\d+/.test(articleNo);
}

function buildFullArticleContent(article: api.ArticleInfo): string {
  const parts: string[] = [];
  
  const mainContent = article.조문내용 || '';
  if (mainContent.trim()) {
    parts.push(mainContent.trim());
  }
  
  if (article.항 && Array.isArray(article.항)) {
    for (const paragraph of article.항) {
      const paragraphNo = paragraph.항번호 || '';
      const paragraphContent = paragraph.항내용 || '';
      
      if (paragraphContent.trim()) {
        parts.push(`${paragraphNo} ${paragraphContent.trim()}`);
      }
      
      if (paragraph.호 && Array.isArray(paragraph.호)) {
        for (const subitem of paragraph.호) {
          const subitemNo = subitem.호번호 || '';
          const subitemContent = subitem.호내용 || '';
          
          if (subitemContent.trim()) {
            parts.push(`  ${subitemNo} ${subitemContent.trim()}`);
          }
          
          // 목(目) 처리
          if ((subitem as any).목 && Array.isArray((subitem as any).목)) {
            for (const mok of (subitem as any).목) {
              const mokNo = mok.목번호 || '';
              const mokContent = mok.목내용 || '';
              if (mokContent.trim()) {
                parts.push(`    ${mokNo} ${mokContent.trim()}`);
              }
            }
          }
        }
      }
    }
  }
  
  return parts.join('\n');
}

function countParagraphs(article: api.ArticleInfo): number {
  if (!article.항) return 1;
  return Array.isArray(article.항) ? article.항.length : 1;
}

// ============================================
// API 함수
// ============================================

async function getLawListByPage(page: number, display: number): Promise<{ laws: api.LawListItem[], totalCount: number }> {
  const response = await axios.get(`${BASE_URL}/lawSearch.do`, {
    params: {
      OC: API_KEY,
      target: 'law',
      type: 'XML',
      display: display,
      page: page,
      sort: 'lawNm',  // 법령명순 정렬
    },
    timeout: 30000,
  });

  const parsed = xmlParser.parse(response.data);
  
  // HTML 응답 체크 (에러)
  if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html')) {
    throw new Error('API 에러: HTML 응답 반환됨');
  }

  const totalCount = parsed?.LawSearch?.totalCnt || 0;
  const items = parsed?.LawSearch?.law;

  if (!items) return { laws: [], totalCount };
  
  const laws = Array.isArray(items) ? items : [items];
  return { laws, totalCount };
}

// ============================================
// 단일 법령 동기화
// ============================================

async function syncSingleLaw(lawItem: api.LawListItem): Promise<{ articlesAdded: number; success: boolean }> {
  const result = { articlesAdded: 0, success: false };

  try {
    const lawDetail = await api.getLawDetail(lawItem.법령ID);
    if (!lawDetail) return result;

    // 법령 마스터 저장
    const lawRecord: db.LawRecord = {
      law_mst_id: String(lawDetail.기본정보.법령ID),
      law_name: lawDetail.기본정보.법령명_한글,
      law_name_eng: lawDetail.기본정보.법령명_영문,
      promulgation_date: formatApiDate(lawDetail.기본정보.공포일자),
      enforcement_date: formatApiDate(lawDetail.기본정보.시행일자),
      law_type: lawDetail.기본정보.법령구분명,
      ministry: lawDetail.기본정보.소관부처명,
      status: 'ACTIVE',
      source_url: `https://www.law.go.kr/법령/${encodeURIComponent(lawDetail.기본정보.법령명_한글)}`,
    };

    const lawId = db.upsertLaw(lawRecord);

    // 조문 저장 (개선된 파싱)
    for (const article of lawDetail.조문) {
      // 조문여부가 '전문'이면 장/절 제목이므로 건너뛰기
      if (article.조문여부 === '전문') continue;

      // 조문번호 + 가지번호 조합: 347 + 2 = "347의2"
      const baseNo = String(article.조문번호 || '');
      const branchNo = article.조문가지번호 ? String(article.조문가지번호) : '';
      const articleNo = branchNo ? `${baseNo}의${branchNo}` : baseNo;

      const rawContent = article.조문내용 || '';

      // 장/절/관 제목 필터링
      if (isChapterTitle(rawContent) || !isValidArticleNo(articleNo)) {
        continue;
      }
      
      // 조문 내용 구성 (항/호/목 포함)
      const content = buildFullArticleContent(article);

      const articleRecord: db.ArticleRecord = {
        law_id: lawId,
        article_no: articleNo,
        article_title: article.조문제목,
        content: content,
        paragraph_count: countParagraphs(article),
        is_definition: (article.조문제목 || '').includes('정의') || articleNo.includes('2'),
        effective_from: formatApiDate(lawDetail.기본정보.시행일자),
      };

      db.upsertArticle(articleRecord);
      result.articlesAdded++;
    }

    result.success = true;
  } catch (error) {
    // 에러는 호출자에서 처리
    throw error;
  }

  return result;
}

// ============================================
// 전체 동기화 실행
// ============================================

export async function runFullSync(config: FullSyncConfig = DEFAULT_CONFIG): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('🔄 korea-law Full Sync v2 시작');
  console.log(`   시간: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  console.log(`   설정: pageSize=${config.pageSize}, maxPages=${config.maxPages}, concurrency=${config.concurrency}`);
  console.log('═══════════════════════════════════════════');
  console.log('⚠️ 주의: 이 데이터는 AI 검증용입니다.');
  console.log('═══════════════════════════════════════════');

  db.initDatabase();

  const stats: SyncStats = {
    totalLaws: 0,
    lawsSynced: 0,
    articlesAdded: 0,
    errors: 0,
    skipped: 0,
  };

  const startTime = Date.now();
  let allLawIds = new Set<number>();

  try {
    // 1. 전체 법령 목록 수집 (페이지네이션)
    console.log('\n📋 전체 법령 목록 수집 중...');
    
    for (let page = config.startPage; page <= config.maxPages; page++) {
      try {
        const { laws, totalCount } = await getLawListByPage(page, config.pageSize);
        
        if (page === config.startPage) {
          stats.totalLaws = totalCount;
          console.log(`   총 법령 수: ${totalCount}건`);
        }
        
        if (laws.length === 0) {
          console.log(`   페이지 ${page}: 더 이상 결과 없음`);
          break;
        }

        // 중복 제거하면서 추가
        for (const law of laws) {
          allLawIds.add(law.법령ID);
        }

        const progress = Math.min(100, (allLawIds.size / totalCount) * 100).toFixed(1);
        console.log(`   페이지 ${page}: ${laws.length}건 수집 (누적: ${allLawIds.size}건, ${progress}%)`);

        if (allLawIds.size >= totalCount) {
          console.log('   모든 법령 목록 수집 완료');
          break;
        }

        await delay(config.apiDelay);
      } catch (error) {
        console.error(`   페이지 ${page} 조회 실패:`, error);
        await delay(1000);
      }
    }

    console.log(`\n📜 총 ${allLawIds.size}개 법령 동기화 시작... (병렬 처리: ${config.concurrency}개)\n`);

    // 2. 각 법령 상세 동기화 (병렬 처리)
    const lawIds = Array.from(allLawIds);
    
    // 병렬 처리 함수
    async function processBatch(batch: number[]): Promise<void> {
      const promises = batch.map(async (lawId) => {
        try {
          const lawItem = { 법령ID: lawId } as api.LawListItem;
          return await syncSingleLaw(lawItem);
        } catch (error) {
          stats.errors++;
          return { articlesAdded: 0, success: false };
        }
      });

      const results = await Promise.allSettled(promises);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          stats.lawsSynced++;
          stats.articlesAdded += result.value.articlesAdded;
        }
      }
    }

    // 배치 단위로 처리
    for (let i = 0; i < lawIds.length; i += config.concurrency) {
      const batch = lawIds.slice(i, i + config.concurrency);
      await processBatch(batch);

      const progress = Math.min(100, ((i + batch.length) / lawIds.length * 100)).toFixed(1);
      
      // 진행상황 출력 (50개마다 또는 마지막)
      if ((i + batch.length) % 50 === 0 || i + batch.length >= lawIds.length) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const rate = stats.lawsSynced / (elapsed || 1);
        const remaining = Math.round((lawIds.length - stats.lawsSynced) / rate / 60);
        console.log(`[${progress}%] ${stats.lawsSynced}/${lawIds.length} 법령, ${stats.articlesAdded} 조문 (경과: ${elapsed}초, 예상 잔여: ${remaining}분)`);
      }

      // 배치 간 짧은 딜레이 (API 부하 방지)
      if (i + config.concurrency < lawIds.length) {
        await delay(Math.max(100, config.apiDelay / config.concurrency));
      }
    }

  } catch (error) {
    console.error('동기화 중 치명적 오류:', error);
    stats.errors++;
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);

  // 결과 출력
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 Full Sync v2 완료');
  console.log(`   총 법령: ${stats.totalLaws}건`);
  console.log(`   동기화: ${stats.lawsSynced}건`);
  console.log(`   조문: ${stats.articlesAdded}건`);
  console.log(`   오류: ${stats.errors}건`);
  console.log(`   소요 시간: ${Math.floor(totalTime / 60)}분 ${totalTime % 60}초`);
  console.log('═══════════════════════════════════════════');

  db.closeDatabase();
}

// ============================================
// CLI 실행
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  // CLI 인자 처리
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start-page' && args[i + 1]) {
      config.startPage = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--max-pages' && args[i + 1]) {
      config.maxPages = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--delay' && args[i + 1]) {
      config.apiDelay = parseInt(args[i + 1], 10);
    }
    if (args[i] === '--concurrency' && args[i + 1]) {
      config.concurrency = parseInt(args[i + 1], 10);
    }
  }
  
  runFullSync(config).catch(console.error);
}

