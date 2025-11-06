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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[publish-scheduled-articles] Starting scheduled publication check...');

    // Buscar artigos agendados cuja data já passou
    const { data: scheduledArticles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, slug, published_at')
      .eq('status', 'scheduled')
      .lte('published_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    console.log(`[publish-scheduled-articles] Found ${scheduledArticles?.length || 0} articles to publish`);

    if (!scheduledArticles || scheduledArticles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No articles to publish',
          published: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Publicar artigos
    const articleIds = scheduledArticles.map(a => a.id);
    
    const { error: updateError } = await supabase
      .from('articles')
      .update({ status: 'published' })
      .in('id', articleIds);

    if (updateError) throw updateError;

    console.log(`[publish-scheduled-articles] Successfully published ${articleIds.length} articles`);

    return new Response(
      JSON.stringify({
        message: 'Articles published successfully',
        published: articleIds.length,
        articles: scheduledArticles.map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          published_at: a.published_at
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[publish-scheduled-articles] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
