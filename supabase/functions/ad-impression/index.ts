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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { campaignId, creativeId, tenantId, slot, page } = await req.json();

    if (!campaignId || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capturar IP e User-Agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    // Inserir impressão
    const { error } = await supabaseClient
      .from('ad_stats')
      .insert({
        campaign_id: campaignId,
        creative_id: creativeId || null,
        tenant_id: tenantId,
        event: 'impression',
        slot: slot || null,
        page: page || null,
        ip_address: ip,
        user_agent: userAgent,
      });

    if (error) {
      console.error('Error inserting impression:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar contadores da campanha
    const { data: campaign } = await supabaseClient
      .from('ad_campaigns')
      .select('impressions_count, cpm, spent_amount')
      .eq('id', campaignId)
      .single();

    if (campaign) {
      const newImpressionCount = (campaign.impressions_count || 0) + 1;
      const cpmCost = campaign.cpm ? (campaign.cpm / 1000) : 0;
      const newSpentAmount = (campaign.spent_amount || 0) + cpmCost;

      await supabaseClient
        .from('ad_campaigns')
        .update({
          impressions_count: newImpressionCount,
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
        page: page || null,
        event_type: 'impression',
        tenant_id: tenantId,
      });

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ad impression error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
