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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Iniciando verificação de limites de campanhas...');

    // Buscar todas as campanhas ativas
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('ad_campaigns')
      .select('id, name, status, budget_total, spent_amount, impressions_limit, impressions_count, clicks_limit, clicks_count')
      .eq('status', 'active');

    if (campaignsError) {
      console.error('Erro ao buscar campanhas:', campaignsError);
      throw campaignsError;
    }

    const pausedCampaigns: string[] = [];
    const completedCampaigns: string[] = [];

    for (const campaign of campaigns || []) {
      let shouldPause = false;
      let reason = '';

      // Verificar limite de orçamento total
      if (campaign.budget_total && campaign.spent_amount >= campaign.budget_total) {
        shouldPause = true;
        reason = `Orçamento total atingido (R$ ${campaign.spent_amount.toFixed(2)})`;
        completedCampaigns.push(campaign.name);
      }

      // Verificar limite de impressões
      if (!shouldPause && campaign.impressions_limit && campaign.impressions_count >= campaign.impressions_limit) {
        shouldPause = true;
        reason = `Limite de impressões atingido (${campaign.impressions_count.toLocaleString()})`;
        completedCampaigns.push(campaign.name);
      }

      // Verificar limite de cliques
      if (!shouldPause && campaign.clicks_limit && campaign.clicks_count >= campaign.clicks_limit) {
        shouldPause = true;
        reason = `Limite de cliques atingido (${campaign.clicks_count.toLocaleString()})`;
        completedCampaigns.push(campaign.name);
      }

      if (shouldPause) {
        console.log(`⏸️  Pausando campanha: ${campaign.name} - ${reason}`);
        
        // Atualizar status da campanha para 'ended'
        const { error: updateError } = await supabaseClient
          .from('ad_campaigns')
          .update({ status: 'ended' })
          .eq('id', campaign.id);

        if (updateError) {
          console.error(`Erro ao pausar campanha ${campaign.name}:`, updateError);
        } else {
          pausedCampaigns.push(campaign.name);
          
          // Inserir notificação para admins
          const { data: admins } = await supabaseClient
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');

          if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
              user_id: admin.user_id,
              type: 'info',
              title: '🚫 Campanha Pausada Automaticamente',
              message: `A campanha "${campaign.name}" foi pausada: ${reason}`,
              action: JSON.stringify({
                label: 'Ver campanha',
                href: '/admin/ads'
              }),
              read: false
            }));

            await supabaseClient
              .from('system_notifications')
              .insert(notifications);
          }
        }
      }
    }

    const summary = {
      checked: campaigns?.length || 0,
      paused: pausedCampaigns.length,
      completed: completedCampaigns,
    };

    console.log(`✅ Verificação concluída: ${summary.checked} campanhas verificadas, ${summary.paused} pausadas`);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        pausedCampaigns,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na verificação de limites:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
