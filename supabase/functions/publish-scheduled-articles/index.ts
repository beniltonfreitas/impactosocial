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
        
        // Enviar notificação breaking (se configurado) com retry
        if (schedule.articles?.breaking) {
          let notificationSent = false;
          let lastError = null;
          
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              console.log(`[publish-scheduled-articles] Sending breaking notification (attempt ${attempt}/3) for article ${schedule.article_id}`);
              
              const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/push-notify-breaking`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ articleId: schedule.article_id })
              });
              
              if (!response.ok) {
                throw new Error(`Notification failed with status ${response.status}`);
              }
              
              notificationSent = true;
              console.log(`[publish-scheduled-articles] Breaking notification sent successfully for article ${schedule.article_id}`);
              break;
            } catch (err) {
              lastError = err;
              console.error(`[publish-scheduled-articles] Error sending breaking notification (attempt ${attempt}/3):`, err);
              
              // Backoff exponencial: 1s, 2s, 4s
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
              }
            }
          }
          
          if (!notificationSent) {
            console.error(`[publish-scheduled-articles] Failed to send breaking notification after 3 attempts for article ${schedule.article_id}:`, lastError);
            // Não falhar a publicação se notificação falhar
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
