/**
 * Open API → PostgreSQL 직접 동기화 스크립트
 *
 * GitHub Actions에서 사용 - SQLite 없이 직접 PostgreSQL로 동기화
 *
 * 사용법:
 *   npx ts-node scripts/sync-api-to-postgres.ts --supabase
 *   npx ts-node scripts/sync-api-to-postgres.ts --render
 *   npx ts-node scripts/sync-api-to-postgres.ts --all
 *
 * 환경변수:
 *   KOREA_LAW_API_KEY        국가법령정보센터 API 키
 *   KOREA_LAW_REFERER        API 신청 시 등록한 도메인
 *   SUPABASE_URL             Supabase 프로젝트 URL
 *   SUPABASE_SERVICE_ROLE_KEY Supabase 서비스 역할 키
 *   RENDER_PG_PASSWORD       Render PostgreSQL 비밀번호
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool, PoolClient } from 'pg';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import * as api from '../src/api/law-api';
import { TIER1_LAWS_CONFIG } from '../src/config/priority-config';

// ============================================
// 설정
// ============================================

// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rmqsukldnmileszpndgh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Render PostgreSQL 설정
const RENDER_PG_HOST = process.env.RENDER_PG_HOST || 'dpg-d5131q5actks73f0aa1g-a.singapore-postgres.render.com';
const RENDER_PG_PORT = process.env.RENDER_PG_PORT || '5432';
const RENDER_PG_DATABASE = process.env.RENDER_PG_DATABASE || 'legal_audit_db';
const RENDER_PG_USER = process.env.RENDER_PG_USER || 'legal_audit_db_user';
const RENDER_PG_PASSWORD = process.env.RENDER_PG_PASSWORD || '';

// 동기화 설정
const API_DELAY = 500; // API 호출 간격 (ms)
const BATCH_SIZE = 50;

// ============================================
// 타입 정의
// ============================================

interface LawRecord {
  law_mst_id: string;
  law_name: string;
  law_name_eng?: string;
  promulgation_date?: string;
  enforcement_date?: string;
  law_type?: string;
  ministry?: string;
  status: string;
  source_url?: string;
}

interface ArticleRecord {
  law_mst_id: string;
  article_no: string;
  article_title?: string;
  content: string;
  paragraph_count: number;
}

interface SyncStats {
  lawsProcessed: number;
  articlesProcessed: number;
  errors: number;
}

// ============================================
// 유틸리티
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatApiDate(dateStr: string | number): string {
  const str = String(dateStr);
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

function extractLawKeywords(config: typeof TIER1_LAWS_CONFIG): string[] {
  const keywords: string[] = [];
  Object.values(config).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item.keyword) {
          keywords.push(item.keyword);
        }
      });
    }
  });
  return keywords;
}

/**
 * 조문 전체 내용 구성 (항/호/목 모두 포함)
 *
 * API XML 구조:
 * - 일반 조문: <항><항번호>①</항번호><항내용>...</항내용></항>
 * - 정의 조문: <항><호><호번호>1.</호번호><호내용>...</호내용><목>...</목></호></항>
 *   (항번호/항내용 없이 바로 호가 올 수 있음)
 */
function buildFullArticleContent(article: api.ArticleInfo): string {
  const parts: string[] = [];

  const mainContent = article.조문내용 || '';
  if (mainContent.trim()) {
    parts.push(mainContent.trim());
  }

  if (article.항) {
    const 항배열 = Array.isArray(article.항) ? article.항 : [article.항];

    for (const 항 of 항배열) {
      const 항번호 = 항.항번호 || '';
      const 항내용 = 항.항내용 || '';

      // 항내용이 있으면 추가
      if (항내용.trim()) {
        parts.push(`${항번호} ${항내용.trim()}`);
      }

      // 호(subitem) 처리 - 항내용 유무와 관계없이 처리
      if (항.호) {
        const 호배열 = Array.isArray(항.호) ? 항.호 : [항.호];

        for (const 호 of 호배열) {
          const 호번호 = 호.호번호 || '';
          const 호내용 = 호.호내용 || '';

          if (호내용.trim()) {
            parts.push(`  ${호번호} ${호내용.trim()}`);
          }

          // 목(sub-subitem) 처리
          if (호.목) {
            const 목배열 = Array.isArray(호.목) ? 호.목 : [호.목];

            for (const 목 of 목배열) {
              const 목번호 = (목 as any).목번호 || '';
              const 목내용 = (목 as any).목내용 || '';

              if (목내용.trim()) {
                parts.push(`    ${목번호} ${목내용.trim()}`);
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
// Supabase 동기화
// ============================================

async function syncToSupabase(laws: LawRecord[], articles: ArticleRecord[]): Promise<SyncStats> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    return { lawsProcessed: 0, articlesProcessed: 0, errors: 1 };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const stats: SyncStats = { lawsProcessed: 0, articlesProcessed: 0, errors: 0 };

  console.log('\n🌐 Supabase 동기화 중...');

  // Laws 동기화
  for (let i = 0; i < laws.length; i += BATCH_SIZE) {
    const batch = laws.slice(i, i + BATCH_SIZE).map(law => ({
      law_mst_id: law.law_mst_id,
      law_name: law.law_name,
      law_name_eng: law.law_name_eng || null,
      law_name_normalized: law.law_name.replace(/\s+/g, '').toLowerCase(),
      promulgation_date: law.promulgation_date || null,
      enforcement_date: law.enforcement_date || null,
      law_type: law.law_type || null,
      ministry: law.ministry || null,
      status: law.status || 'ACTIVE',
      source_url: law.source_url || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('laws')
      .upsert(batch, { onConflict: 'law_mst_id' });

    if (error) {
      console.error(`  ❌ Laws batch 실패:`, error.message);
      stats.errors++;
    } else {
      stats.lawsProcessed += batch.length;
    }
  }

  console.log(`  ✅ Laws: ${stats.lawsProcessed}건 완료`);

  // Articles 동기화 - law_mst_id → law_id 맵핑 사전 로드
  console.log(`  📄 Articles 동기화 중 (${articles.length}건)...`);

  // 모든 laws를 한 번에 조회
  const { data: allLaws, error: lawsError } = await supabase
    .from('laws')
    .select('id, law_mst_id');

  if (lawsError || !allLaws) {
    console.error('  ❌ Laws 조회 실패:', lawsError?.message);
    return { ...stats, errors: stats.errors + articles.length };
  }

  // law_mst_id → law_id 맵핑
  const lawMap = new Map<string, string>();
  allLaws.forEach((law: any) => {
    lawMap.set(law.law_mst_id, law.id);
  });

  console.log(`  📊 법령 맵핑: ${lawMap.size}개 로드됨`);

  // Articles 배치 처리
  // 참고: Supabase upsert에 UNIQUE 제약이 필요하므로, DELETE → INSERT 방식 사용
  let unmappedCount = 0;

  // 1단계: 이전 articles 데이터 삭제
  console.log(`  🗑️  기존 articles 삭제 중...`);

  // 현재 법령 ID 목록
  const lawMstIds = Array.from(lawMap.keys());
  if (lawMstIds.length > 0) {
    // 동기화할 법령들의 articles만 삭제
    const lawIds = Array.from(lawMap.values());
    const { error: delError } = await supabase
      .from('articles')
      .delete()
      .in('law_id', lawIds);

    if (delError) {
      console.warn(`  ⚠️  articles 삭제 실패:`, delError.message);
    }
  }

  // 2단계: 새로운 articles 배치 처리 및 삽입
  console.log(`  📄 새로운 articles 삽입 중 (${articles.length}건)...`);

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE).map(article => {
      const law_id = lawMap.get(article.law_mst_id);
      if (!law_id) {
        unmappedCount++;
        return null;
      }

      return {
        law_id,
        article_no: article.article_no,
        article_title: article.article_title || null,
        content: article.content.substring(0, 50000),
        paragraph_count: article.paragraph_count,
        updated_at: new Date().toISOString(),
      };
    }).filter(Boolean);

    if (batch.length === 0) {
      stats.errors += articles.slice(i, i + BATCH_SIZE).length;
      continue;
    }

    // articles 삽입
    console.log(`  📌 배치 삽입 시도: ${batch.length}건, 인덱스 ${i}-${i + batch.length}`);

    const { error, status } = await supabase
      .from('articles')
      .insert(batch as any);

    if (error) {
      console.error(`  ❌ Articles batch 실패 (상태: ${status})`);
      console.error(`     에러 메시지:`, error.message);
      console.error(`     에러 코드:`, (error as any).code);
      console.error(`     첫 항목:`, JSON.stringify(batch[0], null, 2));
      stats.errors += batch.length;
    } else {
      stats.articlesProcessed += batch.length;
    }

    if (stats.articlesProcessed % 1000 === 0 && stats.articlesProcessed > 0) {
      console.log(`  ⏳ Articles: ${stats.articlesProcessed}건 완료...`);
    }
  }

  if (unmappedCount > 0) {
    console.warn(`  ⚠️  맵핑되지 않은 articles: ${unmappedCount}건`);
    stats.errors += unmappedCount;
  }

  console.log(`  ✅ Articles: ${stats.articlesProcessed}건 완료`);

  return stats;
}

// ============================================
// Render PostgreSQL 동기화
// ============================================

async function syncToRender(laws: LawRecord[], articles: ArticleRecord[]): Promise<SyncStats> {
  if (!RENDER_PG_PASSWORD) {
    console.error('❌ RENDER_PG_PASSWORD가 설정되지 않았습니다.');
    return { lawsProcessed: 0, articlesProcessed: 0, errors: 1 };
  }

  const pool = new Pool({
    host: RENDER_PG_HOST,
    port: parseInt(RENDER_PG_PORT),
    database: RENDER_PG_DATABASE,
    user: RENDER_PG_USER,
    password: RENDER_PG_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  const stats: SyncStats = { lawsProcessed: 0, articlesProcessed: 0, errors: 0 };

  console.log('\n🚀 Render PostgreSQL 동기화 중...');

  try {
    const client = await pool.connect();
    console.log('  ✅ Render PostgreSQL 연결 성공');

    // Laws 동기화
    for (const law of laws) {
      try {
        await client.query(`
          INSERT INTO laws (law_mst_id, law_name, law_name_eng, promulgation_date, enforcement_date, law_type, ministry, status, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (law_mst_id) DO UPDATE SET
            law_name = EXCLUDED.law_name,
            law_name_eng = EXCLUDED.law_name_eng,
            enforcement_date = EXCLUDED.enforcement_date,
            updated_at = NOW()
        `, [
          law.law_mst_id,
          law.law_name,
          law.law_name_eng || null,
          law.promulgation_date || null,
          law.enforcement_date || null,
          law.law_type || null,
          law.ministry || null,
          law.status || 'ACTIVE',
        ]);
        stats.lawsProcessed++;
      } catch (e: any) {
        stats.errors++;
      }
    }

    console.log(`  ✅ Laws: ${stats.lawsProcessed}건 완료`);

    // Articles 동기화
    console.log(`  📄 Articles 동기화 중 (${articles.length}건)...`);

    for (const article of articles) {
      try {
        // law_mst_id로 law_id 조회
        const result = await client.query(
          'SELECT id FROM laws WHERE law_mst_id = $1',
          [article.law_mst_id]
        );

        if (result.rows.length === 0) continue;

        const lawId = result.rows[0].id;

        await client.query(`
          INSERT INTO articles (law_id, article_no, article_title, content, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (law_id, article_no) DO UPDATE SET
            article_title = EXCLUDED.article_title,
            content = EXCLUDED.content,
            updated_at = NOW()
        `, [
          lawId,
          article.article_no,
          article.article_title || null,
          article.content.substring(0, 50000),
        ]);

        stats.articlesProcessed++;

        if (stats.articlesProcessed % 1000 === 0) {
          console.log(`  ⏳ Articles: ${stats.articlesProcessed}건 완료...`);
        }
      } catch (e: any) {
        stats.errors++;
      }
    }

    console.log(`  ✅ Articles: ${stats.articlesProcessed}건 완료`);

    client.release();

  } catch (e: any) {
    console.error('❌ Render PostgreSQL 연결 실패:', e.message);
    stats.errors++;
  } finally {
    await pool.end();
  }

  return stats;
}

// ============================================
// Open API에서 데이터 가져오기
// ============================================

async function fetchLawFromAPI(lawName: string): Promise<{
  law: LawRecord | null;
  articles: ArticleRecord[];
}> {
  const articles: ArticleRecord[] = [];

  try {
    console.log(`📜 API 조회: ${lawName}`);

    // 1. 법령 검색 (정확 매칭 우선, 충분한 범위)
    const searchResults = await api.searchLaws(lawName, 100);
    if (searchResults.length === 0) {
      console.log(`  ⚠️ "${lawName}" 검색 결과 없음`);
      return { law: null, articles: [] };
    }

    // 2. 정확 매칭 우선 선택
    //    법령명 == 검색어 → "대한민국"+검색어 → 접두사 매칭 → 첫 번째 결과
    const exactMatch = searchResults.find(r => r.법령명한글 === lawName);
    const koreanPrefixMatch = !exactMatch
      ? searchResults.find(r => r.법령명한글 === `대한민국${lawName}`)
      : null;
    const prefixMatch = !exactMatch && !koreanPrefixMatch
      ? searchResults.find(r => r.법령명한글.startsWith(lawName + ' ') || r.법령명한글 === lawName + '법')
      : null;
    const latestLaw = exactMatch || koreanPrefixMatch || prefixMatch || searchResults[0];

    if (latestLaw.법령명한글 !== lawName) {
      console.log(`  ℹ️ "${lawName}" → "${latestLaw.법령명한글}" (매칭)`);
    }

    // 3. 상세 정보 조회
    const lawDetail = await api.getLawDetail(latestLaw.법령ID);

    if (!lawDetail) {
      console.log(`  ⚠️ 상세 정보 조회 실패`);
      return { law: null, articles: [] };
    }

    // 3. 법령 레코드 생성
    const lawMstId = String(lawDetail.기본정보.법령ID);
    const law: LawRecord = {
      law_mst_id: lawMstId,
      law_name: lawDetail.기본정보.법령명_한글,
      law_name_eng: lawDetail.기본정보.법령명_영문,
      promulgation_date: formatApiDate(lawDetail.기본정보.공포일자),
      enforcement_date: formatApiDate(lawDetail.기본정보.시행일자),
      law_type: lawDetail.기본정보.법령구분명,
      ministry: lawDetail.기본정보.소관부처명,
      status: 'ACTIVE',
      source_url: `https://www.law.go.kr/법령/${encodeURIComponent(lawDetail.기본정보.법령명_한글)}`,
    };

    // 4. 조문 레코드 생성
    for (const article of lawDetail.조문) {
      if (article.조문여부 === '전문') continue;

      const baseNo = String(article.조문번호 || '');
      const branchNo = article.조문가지번호 ? String(article.조문가지번호) : '';
      const articleNo = branchNo ? `${baseNo}의${branchNo}` : baseNo;

      if (!/^\d+/.test(articleNo)) continue;

      const content = buildFullArticleContent(article);

      articles.push({
        law_mst_id: lawMstId,
        article_no: articleNo,
        article_title: article.조문제목,
        content: content,
        paragraph_count: countParagraphs(article),
      });
    }

    console.log(`  ✅ ${law.law_name}: ${articles.length}개 조문`);

    return { law, articles };

  } catch (error) {
    console.error(`  ❌ API 오류: ${error}`);
    return { law: null, articles: [] };
  }
}

// ============================================
// 전체 법령 동기화 (API → Supabase 직접, 페이지네이션)
// ============================================

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  trimValues: true,
});

const FULL_SYNC_API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';

async function getLawListPage(page: number, pageSize: number = 100): Promise<{ laws: api.LawListItem[], totalCount: number }> {
  const response = await axios.get('http://www.law.go.kr/DRF/lawSearch.do', {
    params: {
      OC: FULL_SYNC_API_KEY,
      target: 'law',
      type: 'XML',
      display: pageSize,
      page,
      sort: 'lawNm',
    },
    headers: { Referer: process.env.KOREA_LAW_REFERER || 'https://ainote.dev' },
    timeout: 30000,
  });

  const parsed = xmlParser.parse(response.data);
  const totalCount = parsed?.LawSearch?.totalCnt || 0;
  const items = parsed?.LawSearch?.law;
  if (!items) return { laws: [], totalCount };
  return { laws: Array.isArray(items) ? items : [items], totalCount };
}

async function runFullSyncToSupabase(): Promise<void> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     전체 법령 API → Supabase 직접 동기화                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`   시간: ${new Date().toISOString()}`);

  const startTime = Date.now();
  let totalLawsSynced = 0;
  let totalArticlesSynced = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  // 1단계: 전체 법령 목록 수집
  console.log('\n📋 전체 법령 목록 수집 중...');
  const allLawItems: api.LawListItem[] = [];

  for (let page = 1; page <= 60; page++) {
    try {
      const { laws, totalCount } = await getLawListPage(page, 100);

      if (page === 1) console.log(`   총 법령 수: ${totalCount}건`);
      if (laws.length === 0) break;

      allLawItems.push(...laws);
      console.log(`   페이지 ${page}: ${laws.length}건 (누적: ${allLawItems.length}건)`);

      if (allLawItems.length >= totalCount) break;
      await delay(300);
    } catch (err) {
      console.error(`   페이지 ${page} 실패:`, (err as Error).message);
      await delay(1000);
    }
  }

  const FULL_CONCURRENCY = 3;
  console.log(`\n📜 총 ${allLawItems.length}개 법령 동기화 시작 (병렬 ${FULL_CONCURRENCY}개)...\n`);

  // 단일 법령 처리 함수
  async function syncOneFullLaw(lawItem: api.LawListItem): Promise<{ ok: boolean; articles: number }> {
    try {
      const lawDetail = await api.getLawDetail(lawItem.법령ID);
      if (!lawDetail) return { ok: false, articles: 0 };

      const lawMstId = String(lawDetail.기본정보.법령ID);
      const serial = String((lawItem as any).법령일련번호 || '');

      const { error: lawErr } = await supabase.from('laws').upsert({
        law_mst_id: lawMstId,
        law_name: lawDetail.기본정보.법령명_한글,
        law_name_eng: lawDetail.기본정보.법령명_영문 || null,
        law_name_normalized: (lawDetail.기본정보.법령명_한글 || '').replace(/\s+/g, '').toLowerCase(),
        promulgation_date: formatApiDate(lawDetail.기본정보.공포일자),
        enforcement_date: formatApiDate(lawDetail.기본정보.시행일자),
        law_type: lawDetail.기본정보.법령구분명 || null,
        ministry: lawDetail.기본정보.소관부처명 || null,
        status: 'ACTIVE',
        source_url: `https://www.law.go.kr/법령/${encodeURIComponent(lawDetail.기본정보.법령명_한글)}`,
        checksum: serial,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'law_mst_id' });

      if (lawErr) return { ok: false, articles: 0 };

      const { data: lawRow } = await supabase.from('laws').select('id').eq('law_mst_id', lawMstId).single();
      if (!lawRow) return { ok: false, articles: 0 };

      const articleBatch: any[] = [];
      for (const article of lawDetail.조문) {
        if (article.조문여부 === '전문') continue;
        const baseNo = String(article.조문번호 || '');
        const branchNo = article.조문가지번호 ? String(article.조문가지번호) : '';
        const articleNo = branchNo ? `${baseNo}의${branchNo}` : baseNo;
        if (!/^\d+/.test(articleNo)) continue;

        articleBatch.push({
          law_id: lawRow.id,
          article_no: articleNo,
          article_title: article.조문제목 || null,
          content: buildFullArticleContent(article).substring(0, 50000),
          paragraph_count: countParagraphs(article),
          updated_at: new Date().toISOString(),
        });
      }

      if (articleBatch.length > 0) {
        await supabase.from('articles').delete().eq('law_id', lawRow.id);
        for (let j = 0; j < articleBatch.length; j += BATCH_SIZE) {
          const batch = articleBatch.slice(j, j + BATCH_SIZE);
          const { error: artErr } = await supabase.from('articles').insert(batch);
          if (artErr) { console.error(`  ❌ articles insert err: ${artErr.message?.substring(0, 100)}`); return { ok: false, articles: 0 }; }
        }
      }

      return { ok: true, articles: articleBatch.length };
    } catch {
      return { ok: false, articles: 0 };
    }
  }

  // 배치 병렬 실행
  let processed = 0;
  for (let i = 0; i < allLawItems.length; i += FULL_CONCURRENCY) {
    const batch = allLawItems.slice(i, i + FULL_CONCURRENCY);

    const results = await Promise.allSettled(batch.map(item => syncOneFullLaw(item)));

    for (const r of results) {
      processed++;
      if (r.status === 'fulfilled' && r.value.ok) {
        totalLawsSynced++;
        totalArticlesSynced += r.value.articles;
      } else {
        totalErrors++;
      }
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rate = totalLawsSynced / (elapsed || 1);
    const remaining = rate > 0 ? Math.round((allLawItems.length - processed) / rate / 60) : '?';
    console.log(`[${(processed / allLawItems.length * 100).toFixed(1)}%] ${totalLawsSynced}/${allLawItems.length} 법령, ${totalArticlesSynced} 조문 (${elapsed}초, ~${remaining}분 남음, err: ${totalErrors})`);

    await delay(1000);
  }

  // 3단계: sync_metadata 기록
  try {
    await supabase.from('sync_metadata').insert({
      sync_type: 'FULL_DIRECT',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      status: totalErrors > 10 ? 'PARTIAL' : 'SUCCESS',
      laws_added: totalLawsSynced,
      articles_added: totalArticlesSynced,
      diffs_detected: 0,
      error_message: totalErrors > 0 ? `${totalErrors}건 에러, ${totalSkipped}건 스킵` : null,
      source_data_date: new Date().toISOString().split('T')[0],
    });
  } catch (e) {
    console.error('sync_metadata 기록 실패:', e);
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     전체 동기화 완료                                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`   Laws: ${totalLawsSynced}건`);
  console.log(`   Articles: ${totalArticlesSynced}건`);
  console.log(`   Errors: ${totalErrors}건`);
  console.log(`   Skipped: ${totalSkipped}건`);
  console.log(`   소요 시간: ${Math.floor(totalTime / 60)}분 ${totalTime % 60}초`);
}

// ============================================
// 증분 동기화 (변경분만 Supabase로)
// ============================================

/**
 * 증분 동기화: API 법령일련번호(checksum)와 Supabase 저장값 비교.
 * 법령일련번호는 개정될 때마다 바뀌므로 정확한 변경 감지 가능.
 *
 * 동작:
 * 1. API 법령 목록 수집 (법령ID, 법령일련번호, 시행일자)
 * 2. Supabase laws.checksum에 저장된 법령일련번호와 비교
 * 3. 다르거나 없으면 → 상세 조회 → upsert (법령 + 조문)
 * 4. sync_metadata에 이력 기록
 */
async function runIncrementalSync(): Promise<void> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     증분 동기화 (법령일련번호 비교) API → Supabase               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`   시간: ${new Date().toISOString()}`);

  const startTime = Date.now();

  // 1단계: API 법령 목록 수집 (경량 — 상세 조회 안 함)
  console.log('\n📋 API 법령 목록 수집 중...');
  const apiLawList: { mstId: string; serial: string; name: string; enfDate: string }[] = [];

  for (let page = 1; page <= 60; page++) {
    try {
      const { laws, totalCount } = await getLawListPage(page, 100);
      if (page === 1) console.log(`   총 법령 수: ${totalCount}건`);
      if (laws.length === 0) break;

      for (const law of laws) {
        apiLawList.push({
          mstId: String(law.법령ID),
          serial: String((law as any).법령일련번호 || ''),
          name: law.법령명한글 || '',
          enfDate: formatApiDate(String(law.시행일자 || '')),
        });
      }

      if (page % 10 === 0) console.log(`   ${apiLawList.length}건 수집됨...`);
      if (apiLawList.length >= totalCount) break;
      await delay(300);
    } catch (err) {
      console.error(`   페이지 ${page} 실패:`, (err as Error).message);
    }
  }
  console.log(`   수집 완료: ${apiLawList.length}건`);

  // 2단계: Supabase 기존 법령의 checksum(법령일련번호) 맵 로드
  console.log('\n📊 Supabase 기존 법령 로드 중...');
  const existingMap = new Map<string, { checksum: string | null; id: number }>();

  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('laws')
      .select('id, law_mst_id, checksum')
      .range(offset, offset + 999);

    if (error || !data || data.length === 0) break;
    for (const row of data) {
      existingMap.set(row.law_mst_id, { checksum: row.checksum, id: row.id });
    }
    offset += data.length;
    if (data.length < 1000) break;
  }
  console.log(`   기존 법령: ${existingMap.size}건`);

  // 2.5단계: last_synced_at 맵도 로드 (오늘 동기화된 건 스킵용)
  const syncedTodaySet = new Set<string>();
  const todayStr = new Date().toISOString().split('T')[0];
  let offset2 = 0;
  while (true) {
    const { data, error } = await supabase
      .from('laws')
      .select('law_mst_id, last_synced_at')
      .not('last_synced_at', 'is', null)
      .gte('last_synced_at', todayStr + 'T00:00:00')
      .range(offset2, offset2 + 999);

    if (error || !data || data.length === 0) break;
    for (const row of data) syncedTodaySet.add(row.law_mst_id);
    offset2 += data.length;
    if (data.length < 1000) break;
  }
  if (syncedTodaySet.size > 0) {
    console.log(`   오늘 이미 동기화된 법령: ${syncedTodaySet.size}건 (스킵)`);
  }

  // 3단계: 변경분 식별 (법령일련번호 비교, 오늘 동기화분 스킵)
  const toSync: { mstId: string; name: string; reason: string }[] = [];

  for (const law of apiLawList) {
    if (syncedTodaySet.has(law.mstId)) continue; // 오늘 이미 처리됨

    const existing = existingMap.get(law.mstId);

    if (!existing) {
      toSync.push({ mstId: law.mstId, name: law.name, reason: '신규' });
    } else if (!existing.checksum) {
      toSync.push({ mstId: law.mstId, name: law.name, reason: 'checksum 미등록' });
    } else if (existing.checksum !== law.serial) {
      toSync.push({ mstId: law.mstId, name: law.name, reason: `개정 (${existing.checksum} → ${law.serial})` });
    }
  }

  const newCount = toSync.filter(t => t.reason === '신규').length;
  const updatedCount = toSync.length - newCount;

  console.log(`\n🔍 변경 감지: ${toSync.length}건 (신규: ${newCount}, 개정/미등록: ${updatedCount})`);

  if (toSync.length === 0) {
    console.log('✅ 변경사항 없음 — 동기화 최신 상태');

    await supabase.from('sync_metadata').insert({
      sync_type: 'INCREMENTAL',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      status: 'SUCCESS',
      laws_added: 0, laws_updated: 0, articles_added: 0, articles_updated: 0,
      diffs_detected: 0,
      source_data_date: new Date().toISOString().split('T')[0],
    });
    return;
  }

  // 4단계: 변경분만 상세 조회 → Supabase upsert
  // ⚠️ 법제처 API는 병렬 호출 불가 (rate limit) — 순차 처리
  const CONCURRENCY = 1;
  console.log(`\n🔄 ${toSync.length}건 동기화 시작 (순차, 중단 후 재개 가능)...\n`);
  let lawsSynced = 0;
  let articlesSynced = 0;
  let errors = 0;
  let processed = 0;

  // API 목록에서 법령일련번호 맵 생성 (upsert 시 checksum 저장용)
  const serialMap = new Map(apiLawList.map(l => [l.mstId, l.serial]));

  // 단일 법령 동기화 함수
  async function syncOneLaw(item: { mstId: string; name: string; reason: string }): Promise<{
    ok: boolean; articles: number;
  }> {
    try {
      const lawDetail = await api.getLawDetail(parseInt(item.mstId));
      if (!lawDetail) { console.error(`  ❌ ${item.name}: getLawDetail returned null`); return { ok: false, articles: 0 }; }

      const lawMstId = String(lawDetail.기본정보.법령ID);
      const serial = serialMap.get(item.mstId) || serialMap.get(lawMstId) || null;

      const lawData = {
        law_mst_id: lawMstId,
        law_name: lawDetail.기본정보.법령명_한글,
        law_name_eng: lawDetail.기본정보.법령명_영문 || null,
        law_name_normalized: (lawDetail.기본정보.법령명_한글 || '').replace(/\s+/g, '').toLowerCase(),
        promulgation_date: formatApiDate(lawDetail.기본정보.공포일자),
        enforcement_date: formatApiDate(lawDetail.기본정보.시행일자),
        law_type: lawDetail.기본정보.법령구분명 || null,
        ministry: lawDetail.기본정보.소관부처명 || null,
        status: 'ACTIVE',
        source_url: `https://www.law.go.kr/법령/${encodeURIComponent(lawDetail.기본정보.법령명_한글)}`,
        checksum: serial,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // select → update or insert (upsert PK sequence 충돌 회피)
      const { data: existing } = await supabase
        .from('laws').select('id').eq('law_mst_id', lawMstId).maybeSingle();

      let lawRow: { id: number } | null;
      if (existing) {
        const { error: upErr } = await supabase.from('laws').update(lawData).eq('id', existing.id);
        if (upErr) { console.error(`  ❌ ${item.name}: update: ${upErr.message}`); return { ok: false, articles: 0 }; }
        lawRow = existing;
      } else {
        const { data: ins, error: insErr } = await supabase.from('laws').insert(lawData).select('id').single();
        if (insErr || !ins) { console.error(`  ❌ ${item.name}: insert: ${insErr?.message}`); return { ok: false, articles: 0 }; }
        lawRow = ins;
      }

      const articleBatch: any[] = [];
      for (const article of lawDetail.조문) {
        if (article.조문여부 === '전문') continue;
        const baseNo = String(article.조문번호 || '');
        const branchNo = article.조문가지번호 ? String(article.조문가지번호) : '';
        const articleNo = branchNo ? `${baseNo}의${branchNo}` : baseNo;
        if (!/^\d+/.test(articleNo)) continue;

        articleBatch.push({
          law_id: lawRow.id,
          article_no: articleNo,
          article_title: article.조문제목 || null,
          content: buildFullArticleContent(article).substring(0, 50000),
          paragraph_count: countParagraphs(article),
          updated_at: new Date().toISOString(),
        });
      }

      if (articleBatch.length > 0) {
        await supabase.from('articles').delete().eq('law_id', lawRow.id);
        for (let j = 0; j < articleBatch.length; j += BATCH_SIZE) {
          const batch = articleBatch.slice(j, j + BATCH_SIZE);
          const { error: artErr } = await supabase.from('articles').insert(batch);
          if (artErr) { console.error(`  ❌ articles insert err: ${artErr.message?.substring(0, 100)}`); return { ok: false, articles: 0 }; }
        }
      }

      return { ok: true, articles: articleBatch.length };
    } catch (err) {
      console.error(`  ❌ ${item.name}: ${(err as Error).message?.substring(0, 100)}`);
      return { ok: false, articles: 0 };
    }
  }

  // 배치 병렬 실행
  for (let i = 0; i < toSync.length; i += CONCURRENCY) {
    const batch = toSync.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(item => syncOneLaw(item))
    );

    for (let k = 0; k < results.length; k++) {
      processed++;
      const r = results[k];
      if (r.status === 'fulfilled' && r.value.ok) {
        lawsSynced++;
        articlesSynced += r.value.articles;
      } else {
        errors++;
      }
    }

    // 진행 로그 (배치마다)
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rate = lawsSynced / (elapsed || 1);
    const remaining = rate > 0 ? Math.round((toSync.length - processed) / rate / 60) : '?';
    console.log(`[${(processed / toSync.length * 100).toFixed(1)}%] ${lawsSynced}/${toSync.length} 법령, ${articlesSynced} 조문 (${elapsed}초, ~${remaining}분 남음, err: ${errors})`);

    // API rate limit 방지 (배치 간 짧은 딜레이)
    await delay(1000);
  }

  // sync_metadata 기록
  await supabase.from('sync_metadata').insert({
    sync_type: 'INCREMENTAL',
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    status: errors > 10 ? 'PARTIAL' : 'SUCCESS',
    laws_added: newCount,
    laws_updated: updatedCount,
    articles_added: articlesSynced,
    diffs_detected: toSync.length,
    error_message: errors > 0 ? `${errors}건 에러` : null,
    source_data_date: new Date().toISOString().split('T')[0],
  });

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     증분 동기화 완료                                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`   Laws: ${lawsSynced}건 (신규 ${newCount} + 개정 ${updatedCount})`);
  console.log(`   Articles: ${articlesSynced}건`);
  console.log(`   Errors: ${errors}건`);
  console.log(`   소요 시간: ${Math.floor(totalTime / 60)}분 ${totalTime % 60}초`);
}

// ============================================
// 메인 동기화 함수 (Tier 1)
// ============================================

async function runSync(syncSupabase: boolean, syncRender: boolean): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Open API → PostgreSQL 직접 동기화                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`   대상: ${syncSupabase ? 'Supabase ' : ''}${syncRender ? 'Render' : ''}`);
  console.log(`   시간: ${new Date().toISOString()}`);
  console.log('');

  // Tier 1 법령 목록 가져오기
  const lawKeywords = extractLawKeywords(TIER1_LAWS_CONFIG);
  console.log(`📋 동기화 대상: ${lawKeywords.length}개 법령`);

  const allLaws: LawRecord[] = [];
  const allArticles: ArticleRecord[] = [];

  // Open API에서 데이터 수집
  console.log('\n═══════════════════════════════════════════════');
  console.log('🔄 Open API 데이터 수집 시작');
  console.log('═══════════════════════════════════════════════');

  for (const keyword of lawKeywords) {
    const { law, articles } = await fetchLawFromAPI(keyword);

    if (law) {
      allLaws.push(law);
      allArticles.push(...articles);
    }

    await delay(API_DELAY);
  }

  console.log(`\n📊 수집 완료: 법령 ${allLaws.length}개, 조문 ${allArticles.length}개`);

  // PostgreSQL로 동기화
  console.log('\n═══════════════════════════════════════════════');
  console.log('🌐 PostgreSQL 동기화 시작');
  console.log('═══════════════════════════════════════════════');

  let supabaseStats: SyncStats = { lawsProcessed: 0, articlesProcessed: 0, errors: 0 };
  let renderStats: SyncStats = { lawsProcessed: 0, articlesProcessed: 0, errors: 0 };

  if (syncSupabase) {
    supabaseStats = await syncToSupabase(allLaws, allArticles);
  }

  if (syncRender) {
    renderStats = await syncToRender(allLaws, allArticles);
  }

  // 결과 출력
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     동기화 완료                                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (syncSupabase) {
    console.log(`\n📦 Supabase:`);
    console.log(`   Laws: ${supabaseStats.lawsProcessed}건`);
    console.log(`   Articles: ${supabaseStats.articlesProcessed}건`);
    console.log(`   Errors: ${supabaseStats.errors}건`);
  }

  if (syncRender) {
    console.log(`\n📦 Render PostgreSQL:`);
    console.log(`   Laws: ${renderStats.lawsProcessed}건`);
    console.log(`   Articles: ${renderStats.articlesProcessed}건`);
    console.log(`   Errors: ${renderStats.errors}건`);
  }

  console.log('\n✅ 동기화 완료!');
}

// ============================================
// CLI
// ============================================

async function main() {
  const args = process.argv.slice(2);

  const fullMode = args.includes('--full');
  const incrementalMode = args.includes('--incremental');
  const syncSupabase = args.includes('--supabase') || args.includes('--all');
  const syncRender = args.includes('--render') || args.includes('--all');

  if (incrementalMode) {
    await runIncrementalSync();
    return;
  }

  if (fullMode) {
    await runFullSyncToSupabase();
    return;
  }

  if (!syncSupabase && !syncRender) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Open API → PostgreSQL 직접 동기화 스크립트                  ║
╚══════════════════════════════════════════════════════════════╝

사용법:
  npx ts-node scripts/sync-api-to-postgres.ts [옵션]

옵션:
  --supabase    Tier 1 주요 법령만 Supabase로 동기화
  --render      Render PostgreSQL로 동기화
  --all         모든 대상에 동기화
  --full        전체 법령(5,500+) API → Supabase 직접 동기화
  --incremental 변경분만 동기화 (시행일 비교, 권장)

환경변수:
  KOREA_LAW_API_KEY         국가법령정보센터 API 키
  KOREA_LAW_REFERER         API 신청 시 등록한 도메인
  SUPABASE_URL              Supabase 프로젝트 URL
  SUPABASE_SERVICE_ROLE_KEY Supabase 서비스 역할 키
  RENDER_PG_PASSWORD        Render PostgreSQL 비밀번호
`);
    return;
  }

  await runSync(syncSupabase, syncRender);
}

main().catch(console.error);
