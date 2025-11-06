import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'day';
    const startDate = url.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = url.searchParams.get('endDate') || new Date().toISOString();

    console.log(`[publications-stats] Fetching stats - Period: ${period}, Range: ${startDate} to ${endDate}`);

    // Query base
    let dateFormat;
    switch (period) {
      case 'year':
        dateFormat = "to_char(published_at, 'YYYY')";
        break;
      case 'month':
        dateFormat = "to_char(published_at, 'YYYY-MM')";
        break;
      case 'day':
      default:
        dateFormat = "to_char(published_at, 'YYYY-MM-DD')";
        break;
    }

    // Buscar publicações agrupadas por período
    const { data: publicationsByPeriod, error: periodError } = await supabase
      .rpc('get_publications_by_period', {
        date_format: dateFormat,
        start_date: startDate,
        end_date: endDate
      });

    if (periodError) {
      console.error('[publications-stats] Period query error:', periodError);
      throw periodError;
    }

    // Estatísticas totais
    const { count: totalPublished, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', startDate)
      .lte('published_at', endDate);

    if (countError) throw countError;

    // Artigos agendados
    const { count: scheduledCount, error: scheduledError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('published_at', new Date().toISOString());

    if (scheduledError) throw scheduledError;

    // Publicações por categoria
    const { data: byCategory, error: categoryError } = await supabase
      .from('articles')
      .select('category_id, categories(name)')
      .eq('status', 'published')
      .gte('published_at', startDate)
      .lte('published_at', endDate);

    if (categoryError) throw categoryError;

    const categoryCounts = byCategory?.reduce((acc: any, article: any) => {
      const categoryName = article.categories?.name || 'Sem categoria';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});

    return new Response(
      JSON.stringify({
        period,
        startDate,
        endDate,
        totalPublished: totalPublished || 0,
        scheduledCount: scheduledCount || 0,
        publicationsByPeriod: publicationsByPeriod || [],
        publicationsByCategory: Object.entries(categoryCounts || {}).map(([category, count]) => ({
          category,
          count
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[publications-stats] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
