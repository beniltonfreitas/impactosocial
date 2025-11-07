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

    const now = new Date();
    
    // Buscar artigos agendados para publicar
    const { data: schedules, error: fetchError } = await supabase
      .from('article_schedule')
      .select('*, articles(*)')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString());
    
    if (fetchError) throw fetchError;
    
    console.log(`[publish-scheduled-articles] Found ${schedules?.length || 0} articles to publish`);

    const results = {
      total: schedules?.length || 0,
      published: 0,
      failed: 0,
      errors: [] as any[]
    };
    
    for (const schedule of schedules || []) {
      try {
        // Publicar artigo
        const { error: updateError } = await supabase
          .from('articles')
          .update({ 
            status: 'published',
            published_at: now.toISOString()
          })
          .eq('id', schedule.article_id);
        
        if (updateError) throw updateError;
        
        // Atualizar agendamento
        await supabase
          .from('article_schedule')
          .update({ 
            status: 'published',
            published_at: now.toISOString()
          })
          .eq('id', schedule.id);
        
        // Enviar notificação breaking (se configurado)
        if (schedule.articles?.breaking) {
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notify-breaking`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ articleId: schedule.article_id })
            });
          } catch (err) {
            console.error('Error sending breaking notification:', err);
          }
        }
        
        results.published++;
        
      } catch (error: any) {
        results.failed++;
        results.errors.push({ 
          schedule_id: schedule.id,
          article_id: schedule.article_id,
          error: error.message 
        });
        
        // Marcar como falha
        await supabase
          .from('article_schedule')
          .update({ 
            status: 'failed',
            error_message: error.message
          })
          .eq('id', schedule.id);
      }
    }
    
    console.log(`[publish-scheduled-articles] Results:`, results);
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[publish-scheduled-articles] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
