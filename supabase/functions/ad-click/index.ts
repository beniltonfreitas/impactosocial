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
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('c');
    const creativeId = url.searchParams.get('k');
    const slot = url.searchParams.get('s');
    const targetUrl = url.searchParams.get('u');
    const tenantId = url.searchParams.get('t');

    if (!targetUrl || !campaignId || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Capturar IP e User-Agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    // Inserir clique (async, não aguarda)
    supabaseClient
      .from('ad_stats')
      .insert({
        campaign_id: campaignId,
        creative_id: creativeId || null,
        tenant_id: tenantId,
        event: 'click',
        slot: slot || null,
        page: null,
        ip_address: ip,
        user_agent: userAgent,
      })
      .then(({ error }) => {
        if (error) console.error('Error inserting click:', error);
      });

    // Redirecionar imediatamente
    return Response.redirect(decodeURIComponent(targetUrl), 302);
  } catch (error) {
    console.error('Ad click error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
