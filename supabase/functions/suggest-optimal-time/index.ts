import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestionRequest {
  categoryId?: string;
  targetDate?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { categoryId, targetDate }: SuggestionRequest = await req.json();

    const date = targetDate ? new Date(targetDate) : new Date();
    const dayOfWeek = date.getDay();

    let query = supabase
      .from('optimal_publishing_times')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .order('avg_performance_score', { ascending: false })
      .limit(5);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: optimalTimes, error } = await query;

    if (error) throw error;

    if (!optimalTimes || optimalTimes.length === 0) {
      return new Response(
        JSON.stringify({
          suggestions: [
            { hour: 8, score: 75, reason: 'Horário matinal (pico de leitura)' },
            { hour: 12, score: 70, reason: 'Horário de almoço' },
            { hour: 18, score: 80, reason: 'Fim de tarde (alto engajamento)' },
          ],
          hasHistoricalData: false,
          message: 'Sugestões baseadas em melhores práticas (sem histórico suficiente)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const suggestions = optimalTimes.map(time => ({
      hour: time.hour,
      score: Math.round(time.avg_performance_score),
      avgViewsFirstHour: Math.round(time.avg_views_first_hour),
      avgViews24h: Math.round(time.avg_views_first_24_hours),
      totalPublications: time.total_publications,
      rank: time.rank_position,
      reason: `${time.total_publications} publicações anteriores com média de ${Math.round(time.avg_views_first_hour)} views na primeira hora`
    }));

    const { data: categoryStats } = await supabase
      .from('publication_analytics')
      .select('performance_score')
      .eq('category_id', categoryId)
      .not('performance_score', 'is', null);

    const avgCategoryScore = categoryStats?.length 
      ? categoryStats.reduce((sum, s) => sum + (s.performance_score || 0), 0) / categoryStats.length
      : 0;

    return new Response(
      JSON.stringify({
        suggestions,
        hasHistoricalData: true,
        categoryAverageScore: Math.round(avgCategoryScore),
        message: `Baseado em ${optimalTimes[0].total_publications}+ publicações históricas`,
        metadata: {
          dayOfWeek,
          analysisDate: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Suggestion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
