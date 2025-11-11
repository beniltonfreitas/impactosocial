import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pesos para o algoritmo de scoring
const WEIGHTS = {
  ctr: 0.40,        // 40% - Performance (CTR)
  budget: 0.30,     // 30% - Orçamento restante
  frequency: 0.20,  // 20% - Frequência (evitar repetição)
  priority: 0.10,   // 10% - Prioridade manual
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slot, page = '/', tenantSlug, sessionId = '' } = await req.json();

    if (!slot || !tenantSlug) {
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
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenant')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = tenant.id;

    const now = new Date().toISOString();

    // Buscar campanhas ativas elegíveis com targeting e criativos
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('ad_campaigns')
      .select(`
        id,
        name,
        priority,
        budget_total,
        budget_daily,
        spent_amount,
        impressions_count,
        clicks_count,
        impressions_limit,
        clicks_limit,
        cpc,
        cpm,
        ad_targeting(*),
        ad_creatives(*)
      `)
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

    // Filtrar campanhas elegíveis
    const eligibleCampaigns = campaigns.filter((campaign: any) => {
      // Verificar se tem criativos
      if (!campaign.ad_creatives || campaign.ad_creatives.length === 0) {
        return false;
      }

      // Verificar limites
      if (campaign.impressions_limit && campaign.impressions_count >= campaign.impressions_limit) {
        return false;
      }
      if (campaign.clicks_limit && campaign.clicks_count >= campaign.clicks_limit) {
        return false;
      }
      if (campaign.budget_total && campaign.spent_amount >= campaign.budget_total) {
        return false;
      }

      // Verificar targeting por página
      if (campaign.ad_targeting && campaign.ad_targeting.length > 0) {
        const targeting = campaign.ad_targeting[0];
        if (targeting.pages && targeting.pages.length > 0) {
          const pageMatches = targeting.pages.some((p: string) => page.startsWith(p));
          if (!pageMatches) return false;
        }
      }

      return true;
    });

    if (eligibleCampaigns.length === 0) {
      return new Response(
        JSON.stringify({ creative: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar histórico recente de impressões para controle de frequência (últimas 10)
    let recentCampaigns: string[] = [];
    if (sessionId) {
      const { data: recentStats } = await supabaseClient
        .from('ad_stats')
        .select('campaign_id')
        .eq('event', 'impression')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      recentCampaigns = recentStats?.map((s: any) => s.campaign_id) || [];
    }

    // Calcular score para cada campanha
    const campaignsWithScores = eligibleCampaigns.map((campaign: any) => {
      // 1. Score de CTR (0-100)
      const ctr = campaign.impressions_count > 0 
        ? (campaign.clicks_count / campaign.impressions_count) * 100 
        : 0;
      const ctrScore = Math.min(ctr * 20, 100); // Normalizar CTR (5% = score 100)

      // 2. Score de orçamento restante (0-100)
      let budgetScore = 100;
      if (campaign.budget_total && campaign.budget_total > 0) {
        const remaining = campaign.budget_total - campaign.spent_amount;
        budgetScore = (remaining / campaign.budget_total) * 100;
      }

      // 3. Score de frequência (0-100) - penaliza se apareceu recentemente
      const timesShownRecently = recentCampaigns.filter(id => id === campaign.id).length;
      const frequencyPenalty = timesShownRecently * 15; // -15 pontos por cada aparição recente
      const frequencyScore = Math.max(100 - frequencyPenalty, 0);

      // 4. Score de prioridade (0-100) - prioridade 1-10
      const priorityScore = ((campaign.priority || 5) / 10) * 100;

      // Calcular score total ponderado
      const totalScore = 
        (ctrScore * WEIGHTS.ctr) +
        (budgetScore * WEIGHTS.budget) +
        (frequencyScore * WEIGHTS.frequency) +
        (priorityScore * WEIGHTS.priority);

      return {
        ...campaign,
        score: totalScore,
        breakdown: { ctrScore, budgetScore, frequencyScore, priorityScore, totalScore }
      };
    });

    // Ordenar por score
    campaignsWithScores.sort((a, b) => b.score - a.score);

    // Weighted random selection (favorece scores altos mas não é determinístico)
    const totalWeight = campaignsWithScores.reduce((sum, c) => sum + c.score, 0);
    let random = Math.random() * totalWeight;
    
    let selectedCampaign = campaignsWithScores[0]; // fallback
    for (const campaign of campaignsWithScores) {
      random -= campaign.score;
      if (random <= 0) {
        selectedCampaign = campaign;
        break;
      }
    }

    // Selecionar criativo aleatório da campanha
    const creatives = selectedCampaign.ad_creatives || [];
    const creative = creatives[Math.floor(Math.random() * creatives.length)];

    console.log(`Selected campaign: ${selectedCampaign.name} (score: ${selectedCampaign.score.toFixed(2)})`);

    return new Response(
      JSON.stringify({
        campaignId: selectedCampaign.id,
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
