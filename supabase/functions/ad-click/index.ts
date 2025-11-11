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
    const { campaignId, creativeId, slot, targetUrl, tenantSlug } = await req.json();

    if (!targetUrl || !campaignId || !tenantSlug) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Resolve tenant slug to UUID
    const { data: tenant } = await supabaseClient
      .from('tenant')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    const tenantId = tenant?.id;
    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capturar IP e User-Agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    // Inserir clique e atualizar contadores (não bloqueia o redirect)
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
      .then(async ({ error }) => {
        if (error) {
          console.error('Error inserting click:', error);
          return;
        }

        // Atualizar contadores da campanha
        const { data: campaign } = await supabaseClient
          .from('ad_campaigns')
          .select('clicks_count, impressions_count, spent_amount, cpc')
          .eq('id', campaignId)
          .single();

        if (campaign) {
          const newClickCount = (campaign.clicks_count || 0) + 1;
          const cpcCost = campaign.cpc || 0;
          const newSpentAmount = (campaign.spent_amount || 0) + cpcCost;

          await supabaseClient
            .from('ad_campaigns')
            .update({
              clicks_count: newClickCount,
              spent_amount: newSpentAmount
            })
            .eq('id', campaignId);
        }

        // Salvar em realtime tracking para dashboard ao vivo
        await supabaseClient
          .from('ad_realtime_tracking')
          .insert({
            campaign_id: campaignId,
            creative_id: creativeId || null,
            slot: slot || null,
            page: null,
            event_type: 'click',
            tenant_id: tenantId,
          });
      });

    // Return success (frontend handles redirect)
    return new Response(
      JSON.stringify({ ok: true, targetUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ad click error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
