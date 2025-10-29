import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  uniqueUsersToday: number;
  uniqueUsersWeek: number;
  topArticles: Array<{
    id: string;
    title: string;
    slug: string;
    viewCount: number;
    uniqueViewers: number;
  }>;
  viewsByDate: Array<{
    date: string;
    views: number;
    uniqueUsers: number;
  }>;
  viewsByCategory: Array<{
    category: string;
    views: number;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação e role de admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se usuário é admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total views from articles table
    const { count: totalViews } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    // Today's views
    const { count: todayViews } = await supabase
      .from('article_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', today.toISOString());

    // Week views
    const { count: weekViews } = await supabase
      .from('article_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', weekAgo.toISOString());

    // Month views
    const { count: monthViews } = await supabase
      .from('article_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', monthAgo.toISOString());

    // Unique users today
    const { data: uniqueTodayData } = await supabase
      .from('article_views')
      .select('session_id')
      .gte('viewed_at', today.toISOString());
    const uniqueUsersToday = new Set(uniqueTodayData?.map(v => v.session_id) || []).size;

    // Unique users this week
    const { data: uniqueWeekData } = await supabase
      .from('article_views')
      .select('session_id')
      .gte('viewed_at', weekAgo.toISOString());
    const uniqueUsersWeek = new Set(uniqueWeekData?.map(v => v.session_id) || []).size;

    // Top articles (last 7 days)
    const { data: topArticlesData } = await supabase
      .from('article_views')
      .select('article_id, articles(id, title, slug), session_id')
      .gte('viewed_at', weekAgo.toISOString());

    const articleStats = new Map<string, { title: string; slug: string; sessions: Set<string>; count: number }>();
    
    topArticlesData?.forEach(view => {
      if (view.articles && typeof view.articles === 'object' && !Array.isArray(view.articles) && 'id' in view.articles) {
        const article = view.articles as { id: string; title: string; slug: string };
        if (!articleStats.has(article.id)) {
          articleStats.set(article.id, {
            title: article.title,
            slug: article.slug,
            sessions: new Set(),
            count: 0
          });
        }
        const stats = articleStats.get(article.id)!;
        stats.count++;
        if (view.session_id) stats.sessions.add(view.session_id);
      }
    });

    const topArticles = Array.from(articleStats.entries())
      .map(([id, stats]) => ({
        id,
        title: stats.title,
        slug: stats.slug,
        viewCount: stats.count,
        uniqueViewers: stats.sessions.size
      }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    // Views by date (last 30 days)
    const { data: viewsByDateData } = await supabase
      .from('article_views')
      .select('viewed_at, session_id')
      .gte('viewed_at', monthAgo.toISOString())
      .order('viewed_at', { ascending: true });

    const dateStats = new Map<string, { count: number; sessions: Set<string> }>();
    viewsByDateData?.forEach(view => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      if (!dateStats.has(date)) {
        dateStats.set(date, { count: 0, sessions: new Set() });
      }
      const stats = dateStats.get(date)!;
      stats.count++;
      if (view.session_id) stats.sessions.add(view.session_id);
    });

    const viewsByDate = Array.from(dateStats.entries())
      .map(([date, stats]) => ({
        date,
        views: stats.count,
        uniqueUsers: stats.sessions.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Views by category
    const { data: categoryViewsData } = await supabase
      .from('article_views')
      .select('article_id, articles(category_id, categories(name))')
      .gte('viewed_at', weekAgo.toISOString());

    const categoryStats = new Map<string, number>();
    categoryViewsData?.forEach(view => {
      if (view.articles && typeof view.articles === 'object' && !Array.isArray(view.articles) && 'categories' in view.articles) {
        const article = view.articles as { categories: { name: string } | null };
        const categoryName = article.categories?.name || 'Sem categoria';
        categoryStats.set(categoryName, (categoryStats.get(categoryName) || 0) + 1);
      }
    });

    const viewsByCategory = Array.from(categoryStats.entries())
      .map(([category, views]) => ({ category, views }))
      .sort((a, b) => b.views - a.views);

    const stats: AnalyticsStats = {
      totalViews: totalViews || 0,
      todayViews: todayViews || 0,
      weekViews: weekViews || 0,
      monthViews: monthViews || 0,
      uniqueUsersToday,
      uniqueUsersWeek,
      topArticles,
      viewsByDate,
      viewsByCategory,
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[analytics-stats] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
