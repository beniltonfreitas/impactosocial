import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Buscar agendamentos próximos (1h antes)
    const { data: schedules, error: fetchError } = await supabase
      .from('article_schedule')
      .select('*, articles(*)')
      .eq('status', 'pending')
      .is('notification_sent_at', null)
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', oneHourFromNow.toISOString());
    
    if (fetchError) throw fetchError;
    
    const results = {
      total: schedules?.length || 0,
      notified: 0,
      errors: [] as any[]
    };
    
    for (const schedule of schedules || []) {
      try {
        // Criar notificação no sistema
        await supabase
          .from('notifications')
          .insert({
            user_id: schedule.created_by,
            type: 'schedule_reminder',
            title: 'Publicação Agendada Próxima',
            message: `O artigo "${schedule.articles?.title}" será publicado em 1 hora.`,
            data: {
              article_id: schedule.article_id,
              scheduled_for: schedule.scheduled_for
            }
          });
        
        // Marcar notificação como enviada
        await supabase
          .from('article_schedule')
          .update({ notification_sent_at: now.toISOString() })
          .eq('id', schedule.id);
        
        results.notified++;
        
      } catch (error: any) {
        results.errors.push({ 
          schedule_id: schedule.id,
          error: error.message 
        });
      }
    }
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
