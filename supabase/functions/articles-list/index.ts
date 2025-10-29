import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  featured: boolean;
  views: number;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  } | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tenantSlug = url.searchParams.get('tenantSlug') || 'nacional';
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const featured = url.searchParams.get('featured') === 'true';
    const search = url.searchParams.get('search');
    const categoryId = url.searchParams.get('categoryId');
    const orderBy = url.searchParams.get('orderBy') || 'recent';
    
    console.log('[articles-list] Fetching articles:', { 
      tenantSlug, 
      limit, 
      featured, 
      search, 
      categoryId, 
      orderBy 
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get tenant ID first
    const { data: tenant, error: tenantError } = await supabase
      .from('tenant')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      console.error('[articles-list] Tenant not found:', tenantError);
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        slug,
        summary,
        image_url,
        author,
        published_at,
        featured,
        views,
        category:categories (
          id,
          name,
          slug,
          color
        )
      `)
      .eq('tenant_id', tenant.id)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString());

    // Apply featured filter
    if (featured) {
      query = query.eq('featured', true);
    }

    // Apply category filter
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Apply ordering
    switch (orderBy) {
      case 'views':
        query = query.order('views', { ascending: false });
        break;
      case 'relevance':
        // For relevance, if there's a search term, order by published_at desc
        query = query.order('published_at', { ascending: false });
        break;
      case 'recent':
      default:
        query = query.order('published_at', { ascending: false });
        break;
    }

    query = query.limit(limit);

    const { data: articles, error: articlesError } = await query;

    if (articlesError) {
      console.error('[articles-list] Query error:', articlesError);
      return new Response(
        JSON.stringify({ error: articlesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[articles-list] Found ${articles?.length || 0} articles`);

    return new Response(
      JSON.stringify({ articles: articles || [] }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('[articles-list] Error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
