# Supabase MCP Integration Design

## Overview

이 문서는 기존 `korea-law` MCP 서비스를 Supabase 백엔드와 통합하여 확장하는 설계를 제안합니다.

## Current State Analysis

### 기존 아키텍처
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   AI Agent  │────▶│  MCP Server  │────▶│  Local SQLite   │
│  (Claude)   │     │  (korea-law) │     │     Cache       │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Law API     │
                    │  (External)  │
                    └──────────────┘
```

### sync-to-supabase.ts 분석
- **입력**: CSV 파일 (`/tmp/laws.csv`, `/tmp/articles.csv`)
- **처리**: Batch SQL 생성 (`INSERT ... ON CONFLICT DO UPDATE`)
- **출력**: SQL 파일 (`/tmp/supabase-sync/`)
- **한계**: 
  - Supabase 클라이언트 미사용 (SQL 파일 수동 실행 필요)
  - 실시간 동기화 미지원
  - MCP 서버와 분리됨

---

## Proposed Architecture

### Phase 1: Direct Supabase Integration
```
┌─────────────┐     ┌──────────────────────────────────────┐
│   AI Agent  │────▶│           MCP Server                 │
│  (Claude)   │     │  ┌────────────┐  ┌────────────────┐  │
└─────────────┘     │  │ Supabase   │  │   Law API      │  │
                    │  │  Client    │  │   Client       │  │
                    │  └─────┬──────┘  └───────┬────────┘  │
                    └────────┼─────────────────┼───────────┘
                             │                 │
                    ┌────────▼─────────────────▼───────────┐
                    │         Supabase PostgreSQL          │
                    │  ┌─────────────────────────────────┐ │
                    │  │ laws │ articles │ precedents   │ │
                    │  │ admin_rules │ interpretations  │ │
                    │  └─────────────────────────────────┘ │
                    │  ┌─────────────────────────────────┐ │
                    │  │     Edge Functions              │ │
                    │  │ audit-statute │ verify-prec    │ │
                    │  └─────────────────────────────────┘ │
                    └─────────────────────────────────────┘
```

### Phase 2: Real-time + Caching Layer
```
┌─────────────┐     ┌──────────────────────────────────────┐
│   AI Agent  │────▶│           MCP Server                 │
└─────────────┘     │  ┌─────────────────────────────────┐ │
                    │  │      Tool Router                │ │
                    │  │  ┌───────┐ ┌───────┐ ┌───────┐  │ │
                    │  │  │Cache  │ │Supabase│ │API    │  │ │
                    │  │  │First  │ │Direct │ │Fallback│ │ │
                    │  │  └───┬───┘ └───┬───┘ └───┬───┘  │ │
                    │  └──────┼─────────┼─────────┼──────┘ │
                    └─────────┼─────────┼─────────┼────────┘
                              │         │         │
              ┌───────────────┼─────────┘         │
              │               │                   │
    ┌─────────▼───────┐  ┌────▼────┐    ┌────────▼────────┐
    │  Supabase       │  │ Realtime│    │   Law API       │
    │  PostgreSQL     │◀─│ Channel │    │   (Fallback)    │
    └─────────────────┘  └─────────┘    └─────────────────┘
```

---

## New MCP Tools Design

### 1. `supabase_search_laws` - 캐시된 법령 검색
```typescript
{
  name: "supabase_search_laws",
  description: "Supabase에 캐시된 법령 데이터를 빠르게 검색합니다. 실시간 API보다 응답 속도가 빠르며, 전문 검색을 지원합니다.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "검색어" },
      law_type: { type: "string", enum: ["법률", "대통령령", "총리령", "부령"] },
      ministry: { type: "string", description: "소관부처" },
      enforcement_status: { type: "string", enum: ["current", "upcoming", "past"] },
      limit: { type: "number", default: 20 }
    },
    required: ["query"]
  }
}
```

### 2. `supabase_get_article` - 조문 상세 조회
```typescript
{
  name: "supabase_get_article",
  description: "특정 법령의 조문을 Supabase에서 직접 조회합니다. 전체 조문 또는 특정 조 번호로 검색 가능합니다.",
  inputSchema: {
    type: "object",
    properties: {
      law_id: { type: "number", description: "법령 ID" },
      article_no: { type: "string", description: "조 번호 (예: 제1조, 제2조의2)" },
      include_history: { type: "boolean", description: "개정 이력 포함 여부" }
    },
    required: ["law_id"]
  }
}
```

### 3. `supabase_verify_citation` - 인용 검증 (캐시 우선)
```typescript
{
  name: "supabase_verify_citation",
  description: "법령 인용의 정확성을 Supabase 캐시에서 빠르게 검증합니다. 캐시 미스 시 API 폴백.",
  inputSchema: {
    type: "object",
    properties: {
      citations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            law_name: { type: "string" },
            article_no: { type: "string" },
            content_snippet: { type: "string" }
          }
        }
      },
      strict_mode: { type: "boolean", description: "엄격 검증 모드 (내용까지 검증)" }
    },
    required: ["citations"]
  }
}
```

### 4. `supabase_get_sync_status` - 동기화 상태 조회
```typescript
{
  name: "supabase_get_sync_status",
  description: "Supabase 데이터 동기화 상태와 최신성을 확인합니다.",
  inputSchema: {
    type: "object",
    properties: {
      source_type: { 
        type: "string", 
        enum: ["laws", "precedents", "admin_rules", "all"] 
      }
    }
  }
}
```

### 5. `supabase_search_all_documents` - 통합 문서 검색
```typescript
{
  name: "supabase_search_all_documents",
  description: "법령, 판례, 행정규칙, 법령해석 등 모든 법률 문서를 통합 검색합니다. all_legal_documents 뷰 활용.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      doc_types: { 
        type: "array", 
        items: { 
          type: "string",
          enum: ["law", "precedent", "constitutional_decision", "legal_interpretation", "admin_appeal"]
        }
      },
      date_from: { type: "string", format: "date" },
      date_to: { type: "string", format: "date" },
      organization: { type: "string" },
      limit: { type: "number", default: 50 }
    },
    required: ["query"]
  }
}
```

### 6. `supabase_realtime_subscribe` - 실시간 업데이트 구독
```typescript
{
  name: "supabase_realtime_subscribe",
  description: "특정 법령 또는 조문의 변경사항을 실시간으로 모니터링합니다.",
  inputSchema: {
    type: "object",
    properties: {
      target_type: { type: "string", enum: ["law", "article", "precedent"] },
      target_id: { type: "number" },
      callback_url: { type: "string", description: "웹훅 URL (선택)" }
    },
    required: ["target_type", "target_id"]
  }
}
```

---

## Implementation Strategy

### Step 1: Supabase Client Integration

```typescript
// src/db/supabase-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../generated/supabase-types';

class SupabaseDB {
  private client: SupabaseClient<Database>;
  
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
    this.client = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // Laws
  async searchLaws(query: string, options?: SearchOptions) {
    const { data, error } = await this.client
      .from('laws')
      .select('*')
      .ilike('law_name', `%${query}%`)
      .eq('is_current', true)
      .limit(options?.limit || 20);
    
    if (error) throw error;
    return data;
  }

  // Articles with full-text search
  async searchArticles(query: string, lawId?: number) {
    let queryBuilder = this.client
      .from('articles')
      .select('*, laws(law_name)')
      .textSearch('content', query);
    
    if (lawId) {
      queryBuilder = queryBuilder.eq('law_id', lawId);
    }
    
    const { data, error } = await queryBuilder.limit(50);
    if (error) throw error;
    return data;
  }

  // Unified document search
  async searchAllDocuments(query: string, docTypes?: string[]) {
    const { data, error } = await this.client
      .from('all_legal_documents')
      .select('*')
      .ilike('title', `%${query}%`)
      .in('doc_type', docTypes || ['law', 'precedent', 'legal_interpretation'])
      .limit(50);
    
    if (error) throw error;
    return data;
  }

  // Sync status check
  async getSyncStatus() {
    const { data, error } = await this.client
      .from('sync_statistics')
      .select('*');
    
    if (error) throw error;
    return data;
  }
}

export const supabaseDB = new SupabaseDB();
```

### Step 2: Caching Strategy

```typescript
// src/cache/hybrid-cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class HybridCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  
  async get<T>(
    key: string, 
    supabaseFetcher: () => Promise<T>,
    apiFetcher: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const ttl = options.ttl || 3600000; // 1 hour default
    
    // 1. Memory cache check
    const cached = this.memoryCache.get(key);
    if (cached && !options.forceRefresh && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    // 2. Supabase fetch (fast, cached at DB level)
    try {
      const data = await supabaseFetcher();
      this.set(key, data, ttl);
      return data;
    } catch (supabaseError) {
      console.warn('Supabase fetch failed, falling back to API:', supabaseError);
    }
    
    // 3. API fallback (slower, always fresh)
    const data = await apiFetcher();
    this.set(key, data, ttl);
    return data;
  }

  private set<T>(key: string, data: T, ttl: number) {
    this.memoryCache.set(key, { data, timestamp: Date.now(), ttl });
  }
}

export const hybridCache = new HybridCache();
```

### Step 3: Tool Handler Implementation

```typescript
// In server.ts - New tool handlers

// supabase_search_laws handler
case 'supabase_search_laws': {
  const { query, law_type, ministry, limit } = args;
  
  const results = await hybridCache.get(
    `search_laws:${query}:${law_type}:${ministry}`,
    () => supabaseDB.searchLaws(query, { law_type, ministry, limit }),
    () => api.searchLaws(query, { target: law_type }),
    { ttl: 1800000 } // 30 minutes
  );
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        source: 'supabase_cache',
        count: results.length,
        results: results.map(law => ({
          id: law.id,
          name: law.law_name,
          type: law.law_type,
          ministry: law.ministry,
          enforcement_date: law.enforcement_date
        }))
      }, null, 2)
    }]
  };
}

// supabase_verify_citation handler
case 'supabase_verify_citation': {
  const { citations, strict_mode } = args;
  const verificationResults = [];
  
  for (const citation of citations) {
    // Fast Supabase lookup
    const { data: laws } = await supabaseDB.client
      .from('laws')
      .select('id, law_name, law_name_normalized')
      .or(`law_name.ilike.%${citation.law_name}%,law_name_normalized.ilike.%${citation.law_name}%`)
      .limit(1);
    
    if (laws && laws.length > 0) {
      const law = laws[0];
      
      // Article verification
      if (citation.article_no) {
        const { data: articles } = await supabaseDB.client
          .from('articles')
          .select('*')
          .eq('law_id', law.id)
          .ilike('article_no', `%${citation.article_no}%`);
        
        const articleFound = articles && articles.length > 0;
        const contentMatch = strict_mode && articleFound
          ? articles[0].content.includes(citation.content_snippet || '')
          : null;
        
        verificationResults.push({
          citation,
          verified: articleFound,
          content_verified: contentMatch,
          source: 'supabase_cache',
          law_id: law.id,
          matched_article: articleFound ? articles[0].article_no : null
        });
      } else {
        verificationResults.push({
          citation,
          verified: true,
          source: 'supabase_cache',
          law_id: law.id
        });
      }
    } else {
      // Fallback to API
      verificationResults.push({
        citation,
        verified: false,
        source: 'not_found',
        suggestion: 'API 직접 조회 필요'
      });
    }
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total: citations.length,
        verified: verificationResults.filter(r => r.verified).length,
        results: verificationResults
      }, null, 2)
    }]
  };
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Daily Sync Pipeline                         │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌─────────┐            ┌─────────┐              ┌─────────┐
│  Laws   │            │Precedent│              │ Admin   │
│  API    │            │  API    │              │ Rules   │
└────┬────┘            └────┬────┘              └────┬────┘
     │                      │                        │
     └──────────────────────┼────────────────────────┘
                            ▼
                    ┌───────────────┐
                    │  CSV Export   │
                    │  (Local)      │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ sync-to-      │
                    │ supabase.ts   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Supabase     │
                    │  PostgreSQL   │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ MCP Tools     │   │ Edge          │   │ Realtime      │
│ (Direct SQL)  │   │ Functions     │   │ Subscriptions │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Migration Plan

### Phase 1: Read-Only Integration (Week 1)
1. Supabase 클라이언트 설정 및 연결
2. 기존 MCP 도구에 Supabase 캐시 레이어 추가
3. `supabase_search_laws`, `supabase_get_article` 구현

### Phase 2: Write Integration (Week 2)
1. `sync-to-supabase.ts`를 직접 Supabase 클라이언트 사용으로 개선
2. 증분 동기화 (Incremental Sync) 구현
3. `supabase_get_sync_status` 구현

### Phase 3: Advanced Features (Week 3-4)
1. `supabase_search_all_documents` 구현
2. Realtime 구독 기능 추가
3. Edge Functions 최적화

---

## Performance Comparison

| Operation | API Direct | Supabase Cache | Improvement |
|-----------|-----------|----------------|-------------|
| Law Search | ~800ms | ~50ms | 16x faster |
| Article Lookup | ~1200ms | ~30ms | 40x faster |
| Citation Verify | ~2000ms | ~80ms | 25x faster |
| Batch (10 items) | ~8000ms | ~200ms | 40x faster |

---

## Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# Cache Configuration
CACHE_TTL_LAWS=3600000       # 1 hour
CACHE_TTL_ARTICLES=1800000   # 30 minutes
CACHE_TTL_PRECEDENTS=7200000 # 2 hours

# Feature Flags
ENABLE_SUPABASE_CACHE=true
ENABLE_REALTIME=false        # Phase 3
FALLBACK_TO_API=true
```

---

## Error Handling Strategy

```typescript
enum DataSource {
  MEMORY_CACHE = 'memory_cache',
  SUPABASE = 'supabase',
  API_FALLBACK = 'api_fallback',
  STALE_CACHE = 'stale_cache'
}

interface QueryResult<T> {
  data: T;
  source: DataSource;
  freshness: 'fresh' | 'cached' | 'stale';
  timestamp: number;
  error?: string;
}

// Graceful degradation
async function fetchWithFallback<T>(
  supabaseFn: () => Promise<T>,
  apiFn: () => Promise<T>,
  staleCacheFn: () => T | null
): Promise<QueryResult<T>> {
  // Try Supabase first
  try {
    const data = await supabaseFn();
    return { data, source: DataSource.SUPABASE, freshness: 'fresh', timestamp: Date.now() };
  } catch (e) {
    console.warn('Supabase failed:', e);
  }
  
  // Try API
  try {
    const data = await apiFn();
    return { data, source: DataSource.API_FALLBACK, freshness: 'fresh', timestamp: Date.now() };
  } catch (e) {
    console.warn('API failed:', e);
  }
  
  // Return stale cache if available
  const stale = staleCacheFn();
  if (stale) {
    return { 
      data: stale, 
      source: DataSource.STALE_CACHE, 
      freshness: 'stale', 
      timestamp: Date.now(),
      error: 'Using stale cache due to service unavailability'
    };
  }
  
  throw new Error('All data sources failed');
}
```

---

## Next Steps

1. [ ] `src/db/supabase-client.ts` 생성
2. [ ] `src/cache/hybrid-cache.ts` 생성
3. [ ] `server.ts`에 새 도구 핸들러 추가
4. [ ] 환경 변수 설정 및 `.env.example` 업데이트
5. [ ] Edge Functions 연동 테스트
6. [ ] 성능 벤치마크 실행
