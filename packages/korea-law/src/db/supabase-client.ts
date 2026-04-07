/**
 * Supabase Client for korea-law MCP Server
 * Provides direct access to cached legal data in Supabase PostgreSQL
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types (simplified - full types should be generated via supabase gen types)
interface Law {
  id: number;
  law_mst_id: string;
  law_name: string;
  law_name_eng?: string;
  law_name_normalized?: string;
  law_type?: string;
  ministry?: string;
  promulgation_date?: string;
  enforcement_date?: string;
  abolition_date?: string;
  is_current?: boolean;
  source_url?: string;
  checksum?: string;
  created_at?: string;
  updated_at?: string;
}

interface Article {
  id: number;
  law_id: number;
  article_no: string;
  article_no_normalized?: string;
  article_title?: string;
  content: string;
  is_current?: boolean;
  is_definition?: boolean;
  created_at?: string;
  updated_at?: string;
  laws?: Law;
}

interface Precedent {
  id: number;
  prec_seq?: string;
  case_id: string;
  case_id_normalized?: string;
  case_name?: string;
  court?: string;
  case_type?: string;
  decision_date?: string;
  exists_verified?: boolean;
  last_verified_at?: string;
}

interface LegalDocument {
  doc_type: string;
  id: number;
  title: string;
  case_id?: string;
  effective_date?: string;
  organization?: string;
  source_url?: string;
}

interface SyncStatistic {
  source_type: string;
  total_count: number;
  last_synced?: string;
}

interface SearchOptions {
  law_type?: string;
  ministry?: string;
  limit?: number;
  offset?: number;
}

interface DocumentSearchOptions {
  doc_types?: string[];
  date_from?: string;
  date_to?: string;
  organization?: string;
  limit?: number;
}

class SupabaseDB {
  private client: SupabaseClient | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.client = createClient(supabaseUrl, supabaseKey);
      this.isConnected = true;
      console.log('✅ Supabase client initialized');
    } else {
      console.warn('⚠️ Supabase credentials not found. Running in API-only mode.');
      this.isConnected = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Search laws by name with optional filters
   */
  async searchLaws(query: string, options: SearchOptions = {}): Promise<Law[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    let queryBuilder = this.client
      .from('laws')
      .select('*')
      .or(`law_name.ilike.%${query}%,law_name_normalized.ilike.%${query}%`);

    if (options.law_type) {
      queryBuilder = queryBuilder.eq('law_type', options.law_type);
    }

    if (options.ministry) {
      queryBuilder = queryBuilder.ilike('ministry', `%${options.ministry}%`);
    }

    // Only current laws by default
    queryBuilder = queryBuilder.eq('is_current', true);

    const { data, error } = await queryBuilder
      .order('law_name')
      .limit(options.limit || 20);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get law by ID
   */
  async getLawById(lawId: number): Promise<Law | null> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client
      .from('laws')
      .select('*')
      .eq('id', lawId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Get law by law_mst_id (National Law ID)
   */
  async getLawByMstId(lawMstId: string): Promise<Law | null> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client
      .from('laws')
      .select('*')
      .eq('law_mst_id', lawMstId)
      .eq('is_current', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Get articles for a specific law
   */
  async getArticlesByLawId(lawId: number, articleNo?: string): Promise<Article[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    let queryBuilder = this.client
      .from('articles')
      .select('*, laws(law_name)')
      .eq('law_id', lawId)
      .eq('is_current', true);

    if (articleNo) {
      queryBuilder = queryBuilder.or(
        `article_no.ilike.%${articleNo}%,article_no_normalized.ilike.%${articleNo}%`
      );
    }

    const { data, error } = await queryBuilder.order('article_no');

    if (error) throw error;
    return data || [];
  }

  /**
   * Search articles by content (full-text search)
   */
  async searchArticles(query: string, lawId?: number, limit: number = 50): Promise<Article[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    let queryBuilder = this.client
      .from('articles')
      .select('*, laws(law_name)')
      .ilike('content', `%${query}%`)
      .eq('is_current', true);

    if (lawId) {
      queryBuilder = queryBuilder.eq('law_id', lawId);
    }

    const { data, error } = await queryBuilder.limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Verify a legal citation exists
   */
  async verifyCitation(
    lawName: string,
    articleNo?: string,
    contentSnippet?: string
  ): Promise<{
    verified: boolean;
    law?: Law;
    article?: Article;
    contentMatch?: boolean;
  }> {
    if (!this.client) throw new Error('Supabase client not initialized');

    // Find the law
    const { data: laws } = await this.client
      .from('laws')
      .select('*')
      .or(`law_name.ilike.%${lawName}%,law_name_normalized.ilike.%${lawName}%`)
      .eq('is_current', true)
      .limit(1);

    if (!laws || laws.length === 0) {
      return { verified: false };
    }

    const law = laws[0];

    // If no article specified, law exists is enough
    if (!articleNo) {
      return { verified: true, law };
    }

    // Find the article
    const { data: articles } = await this.client
      .from('articles')
      .select('*')
      .eq('law_id', law.id)
      .or(`article_no.ilike.%${articleNo}%,article_no_normalized.ilike.%${articleNo}%`)
      .eq('is_current', true)
      .limit(1);

    if (!articles || articles.length === 0) {
      return { verified: false, law };
    }

    const article = articles[0];

    // Content verification if snippet provided
    let contentMatch: boolean | undefined;
    if (contentSnippet) {
      contentMatch = article.content.includes(contentSnippet);
    }

    return {
      verified: true,
      law,
      article,
      contentMatch
    };
  }

  /**
   * Search precedents (case law)
   */
  async searchPrecedents(query: string, limit: number = 20): Promise<Precedent[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client
      .from('precedents')
      .select('*')
      .or(`case_id.ilike.%${query}%,case_name.ilike.%${query}%`)
      .order('decision_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Verify a precedent exists by case ID
   */
  async verifyPrecedent(caseId: string): Promise<Precedent | null> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client
      .from('precedents')
      .select('*')
      .or(`case_id.ilike.%${caseId}%,case_id_normalized.ilike.%${caseId}%`)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Search all legal documents using the unified view
   */
  async searchAllDocuments(
    query: string,
    options: DocumentSearchOptions = {}
  ): Promise<LegalDocument[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    let queryBuilder = this.client
      .from('all_legal_documents')
      .select('*')
      .ilike('title', `%${query}%`);

    if (options.doc_types && options.doc_types.length > 0) {
      queryBuilder = queryBuilder.in('doc_type', options.doc_types);
    }

    if (options.date_from) {
      queryBuilder = queryBuilder.gte('effective_date', options.date_from);
    }

    if (options.date_to) {
      queryBuilder = queryBuilder.lte('effective_date', options.date_to);
    }

    if (options.organization) {
      queryBuilder = queryBuilder.ilike('organization', `%${options.organization}%`);
    }

    const { data, error } = await queryBuilder
      .order('effective_date', { ascending: false })
      .limit(options.limit || 50);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<SyncStatistic[]> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const { data, error } = await this.client
      .from('sync_statistics')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get total counts for each table
   */
  async getDataCounts(): Promise<Record<string, number>> {
    if (!this.client) throw new Error('Supabase client not initialized');

    const counts: Record<string, number> = {};

    // Laws count
    const { count: lawsCount } = await this.client
      .from('laws')
      .select('*', { count: 'exact', head: true });
    counts.laws = lawsCount || 0;

    // Articles count
    const { count: articlesCount } = await this.client
      .from('articles')
      .select('*', { count: 'exact', head: true });
    counts.articles = articlesCount || 0;

    // Precedents count
    const { count: precedentsCount } = await this.client
      .from('precedents')
      .select('*', { count: 'exact', head: true });
    counts.precedents = precedentsCount || 0;

    return counts;
  }
}

// Singleton instance
export const supabaseDB = new SupabaseDB();

// Export types
export type {
  Law,
  Article,
  Precedent,
  LegalDocument,
  SyncStatistic,
  SearchOptions,
  DocumentSearchOptions
};
