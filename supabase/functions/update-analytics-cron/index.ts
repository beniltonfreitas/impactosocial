import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('[CRON] Starting analytics update...');

    const { error: analyticsError } = await supabase.rpc('update_publication_analytics');
    if (analyticsError) throw analyticsError;

    console.log('[CRON] Publication analytics updated');

    const { error: optimalError } = await supabase.rpc('generate_optimal_times');
    if (optimalError) throw optimalError;

    console.log('[CRON] Optimal times generated');

    return new Response(
      JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[CRON] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
