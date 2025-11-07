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
    const slot = url.searchParams.get('slot');
    const page = url.searchParams.get('page') || '/';
    const tenantId = url.searchParams.get('tenant');

    if (!slot || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Buscar campanhas ativas para o tenant
    const now = new Date().toISOString();
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('ad_campaigns')
      .select('id, ad_targeting(*), ad_creatives(*)')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .lte('start_at', now)
      .or(`end_at.is.null,end_at.gte.${now}`);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return new Response(
        JSON.stringify({ error: campaignsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ creative: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar por targeting (páginas)
    const validCampaigns = campaigns.filter((campaign: any) => {
      if (!campaign.ad_targeting || campaign.ad_targeting.length === 0) return true;
      
      const targeting = campaign.ad_targeting[0];
      
      // Se não tem páginas definidas, aceita todas
      if (!targeting.pages || targeting.pages.length === 0) return true;
      
      // Verifica se a página atual está na lista
      return targeting.pages.some((p: string) => page.startsWith(p));
    });

    if (validCampaigns.length === 0) {
      return new Response(
        JSON.stringify({ creative: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Selecionar campanha aleatória
    const campaign = validCampaigns[Math.floor(Math.random() * validCampaigns.length)];
    
    // Selecionar criativo aleatório da campanha
    const creatives = campaign.ad_creatives || [];
    if (creatives.length === 0) {
      return new Response(
        JSON.stringify({ creative: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creative = creatives[Math.floor(Math.random() * creatives.length)];

    return new Response(
      JSON.stringify({
        campaignId: campaign.id,
        creativeId: creative.id,
        type: creative.type,
        imageUrl: creative.image_url,
        htmlContent: creative.html_content,
        videoUrl: creative.video_url,
        headline: creative.headline,
        description: creative.description,
        ctaLabel: creative.cta_label,
        targetUrl: creative.target_url,
        width: creative.width,
        height: creative.height,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Ad fetch error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
