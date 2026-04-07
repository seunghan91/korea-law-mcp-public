/**
 * ordinance-pipeline 통합 테스트
 *
 * 파싱 → 임베딩 → ES indexing → 검색 풀 파이프라인 검증.
 *
 * 필요 전제:
 *   1. embedding-server 가동 (http://localhost:8082)
 *   2. Elasticsearch 접속 설정 (ELASTICSEARCH_ADDR/USERNAME/PASSWORD)
 *   3. ordinances_v1 인덱스 존재
 *
 * 실행:
 *   ELASTICSEARCH_ADDR=... ELASTICSEARCH_USERNAME=... ELASTICSEARCH_PASSWORD=... \
 *     pnpm --filter korea-law exec ts-node src/sync/__tests__/ordinance-pipeline.test.ts
 *
 * 부수 효과: ordinances_v1 인덱스에 광진구 조례 실제 데이터 indexing.
 * Phase C 검증 후 남아도 되지만 원한다면 pipeline.test.ts 실행 후 수동 삭제.
 */

import * as fs from 'fs';
import * as path from 'path';
import { processOrdinanceXml, ORDINANCES_INDEX } from '../ordinance-pipeline';
import { ElasticsearchClient, configFromEnv } from '../../es/client';
import { isEmbedderAlive } from '../../embedding/ordinance-embedder';

interface Check {
  name: string;
  pass: boolean;
  detail?: string;
}

function check(name: string, condition: boolean, detail?: string): Check {
  return { name, pass: condition, detail };
}

function report(title: string, checks: Check[]): number {
  console.log(`\n=== ${title} ===`);
  let passed = 0;
  checks.forEach((c) => {
    const mark = c.pass ? '  ✓' : '  ✗';
    const detail = c.detail ? ` (${c.detail})` : '';
    console.log(`${mark} ${c.name}${detail}`);
    if (c.pass) passed++;
  });
  return passed;
}

async function main() {
  console.log('ordinance-pipeline 통합 테스트 시작');

  // 전제 조건 확인
  const embReady = await isEmbedderAlive();
  if (!embReady) {
    console.error('ERROR: embedding-server (http://localhost:8082) not reachable');
    process.exit(1);
  }
  console.log('  ✓ embedding-server alive');

  let es: ElasticsearchClient;
  try {
    es = new ElasticsearchClient(configFromEnv());
  } catch (e) {
    console.error('ERROR:', (e as Error).message);
    process.exit(1);
  }

  const hasIndex = await es.indexExists(ORDINANCES_INDEX);
  console.log(`  ${hasIndex ? '✓' : '✗'} index ${ORDINANCES_INDEX} exists`);
  if (!hasIndex) {
    console.error(`ERROR: ${ORDINANCES_INDEX} missing. Phase A5 쪽 인덱스 생성 스크립트 먼저 실행해야 함.`);
    process.exit(1);
  }

  // 광진구 조례 픽스처로 풀 파이프라인 실행
  const fixture = path.join(__dirname, 'fixtures', 'ordinance-1941163-gwangjin-bokmu.xml');
  const xml = fs.readFileSync(fixture, 'utf-8');

  console.log('\n--- Pipeline 실행 ---');
  const t0 = Date.now();
  const result = await processOrdinanceXml(xml, {
    municipalityCode: '11215',
    municipalityLevel: 2,
    parentMunicipalityCode: '11000',
    esClient: es,
    refresh: 'wait_for',
  });
  const elapsed = Date.now() - t0;
  console.log(`  elapsed: ${elapsed}ms`);
  console.log(`  counts: articles=${result.counts.articles}, sections=${result.counts.sections}, appendices=${result.counts.appendices}, indexed=${result.counts.indexed}`);

  // 기본 검증
  const pipelineChecks: Check[] = [
    check('파싱 완료', !!result.parsed),
    check('docs 생성됨', result.docs.length > 0),
    check('docs count = 1(header) + articles + appendices',
      result.docs.length === 1 + result.counts.articles + result.counts.appendices,
      `${result.docs.length}`),
    check('헤더 doc 1개', result.docs.filter((d) => d.doc_type === 'ordinance').length === 1),
    check(`article doc ${result.counts.articles}개`,
      result.docs.filter((d) => d.doc_type === 'article').length === result.counts.articles),
    check(`appendix doc ${result.counts.appendices}개`,
      result.docs.filter((d) => d.doc_type === 'appendix').length === result.counts.appendices),
    check('모든 doc에 1024dim embedding',
      result.docs.every((d) => Array.isArray(d.embedding) && d.embedding.length === 1024)),
    check('임베딩 정규화 확인 (norm ≈ 1)',
      result.docs.every((d) => {
        const norm = Math.sqrt(d.embedding.reduce((s, v) => s + v * v, 0));
        return norm > 0.95 && norm < 1.05;
      })),
    check('bulk response errors false', result.bulkResponse?.errors === false),
    check(`indexed count = ${result.docs.length}`, result.counts.indexed === result.docs.length),
  ];
  const p1 = report('파이프라인 검증', pipelineChecks);

  // 검색 검증
  console.log('\n--- ES 검색 검증 ---');

  // BM25 텍스트 검색
  const bm25 = await es.search<any>(ORDINANCES_INDEX, {
    query: {
      bool: {
        must: [{ match: { content: '봉사자 책임' } }],
        filter: [{ term: { municipality_code: '11215' } }, { term: { doc_type: 'article' } }],
      },
    },
    _source: ['article_no', 'article_title'],
    highlight: { fields: { content: {} } },
    size: 3,
  });

  const bm25Top = bm25.hits.hits[0]?._source as any;
  console.log(`  BM25 top hit: ${bm25Top?.article_no} ${bm25Top?.article_title}`);

  // 벡터 KNN 검색
  const queryVec = result.docs.find((d) => d.doc_type === 'article' && (d as any).article_no === '제3조')?.embedding;
  const knn = await es.search<any>(ORDINANCES_INDEX, {
    knn: {
      field: 'embedding',
      query_vector: queryVec,
      k: 3,
      num_candidates: 50,
    },
    _source: ['article_no', 'article_title', 'municipality_name'],
  });

  const knnTop = knn.hits.hits[0]?._source as any;
  console.log(`  KNN top hit: ${knnTop?.article_no} ${knnTop?.article_title}`);

  const searchChecks: Check[] = [
    check('BM25 검색 hit 존재', bm25.hits.total.value > 0, `total=${bm25.hits.total.value}`),
    check('BM25 top hit = 제3조 (책임완수)',
      bm25Top?.article_no === '제3조' && bm25Top?.article_title === '책임완수',
      `got ${bm25Top?.article_no}`),
    check('BM25 highlight 동작', !!bm25.hits.hits[0]?.highlight?.content?.length),
    check('KNN 검색 hit 존재', knn.hits.total.value > 0),
    check('KNN top hit = 제3조 (자기 자신)',
      knnTop?.article_no === '제3조'),
  ];
  const p2 = report('검색 검증', searchChecks);

  // 합계
  const total = pipelineChecks.length + searchChecks.length;
  const passed = p1 + p2;
  console.log(`\n==== 합계: ${passed}/${total} passed ====`);

  if (passed < total) process.exit(1);
}

main().catch((e) => {
  console.error('\nFATAL:', e);
  process.exit(1);
});
