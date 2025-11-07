import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  start_at: string;
  end_at: string | null;
  budget_total: number | null;
  cpc: number | null;
  cpm: number | null;
  created_by: string;
}

async function createNotification(supabase: any, data: {
  userId: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  action?: { label: string; href: string };
}) {
  await supabase.from('system_notifications').insert({
    user_id: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    action: data.action,
    read: false,
    created_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[campaign-scheduler] Starting campaign scheduling check...');

    const now = new Date();
    const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayAhead = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    let activatedCount = 0;
    let endedCount = 0;
    let expiring3DaysCount = 0;
    let expiring1DayCount = 0;
    let budgetDepletedCount = 0;

    // 1. Ativar campanhas agendadas
    const { data: toActivate } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'paused')
      .lte('start_at', now.toISOString())
      .or('end_at.is.null,end_at.gte.' + now.toISOString());

    for (const campaign of (toActivate as Campaign[]) || []) {
      await supabase
        .from('ad_campaigns')
        .update({ status: 'active' })
        .eq('id', campaign.id);

      if (campaign.created_by) {
        await createNotification(supabase, {
          userId: campaign.created_by,
          type: 'success',
          title: 'Campanha Ativada',
          message: `A campanha "${campaign.name}" foi ativada automaticamente.`,
          action: { label: 'Ver Campanha', href: '/admin/ads' },
        });
      }

      activatedCount++;
      console.log(`[campaign-scheduler] Activated campaign: ${campaign.name}`);
    }

    // 2. Finalizar campanhas expiradas
    const { data: toEnd } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'active')
      .not('end_at', 'is', null)
      .lte('end_at', now.toISOString());

    for (const campaign of (toEnd as Campaign[]) || []) {
      await supabase
        .from('ad_campaigns')
        .update({ status: 'ended' })
        .eq('id', campaign.id);

      if (campaign.created_by) {
        await createNotification(supabase, {
          userId: campaign.created_by,
          type: 'info',
          title: 'Campanha Finalizada',
          message: `A campanha "${campaign.name}" atingiu a data de término.`,
          action: { label: 'Ver Relatório', href: '/admin/ads?tab=reports' },
        });
      }

      endedCount++;
      console.log(`[campaign-scheduler] Ended campaign: ${campaign.name}`);
    }

    // 3. Alertar campanhas próximas de expirar (3 dias)
    const { data: expiring3Days } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'active')
      .not('end_at', 'is', null)
      .lte('end_at', threeDaysAhead.toISOString())
      .gt('end_at', now.toISOString());

    for (const campaign of (expiring3Days as Campaign[]) || []) {
      // Verificar se já enviou notificação
      const { data: existing } = await supabase
        .from('campaign_notifications')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('type', 'expiring_3days');

      if (!existing?.length && campaign.created_by) {
        await createNotification(supabase, {
          userId: campaign.created_by,
          type: 'warning',
          title: 'Campanha Expirando em Breve',
          message: `A campanha "${campaign.name}" expira em 3 dias.`,
          action: { label: 'Renovar', href: '/admin/ads' },
        });

        await supabase.from('campaign_notifications').insert({
          campaign_id: campaign.id,
          type: 'expiring_3days',
          sent_at: now.toISOString(),
        });

        expiring3DaysCount++;
        console.log(`[campaign-scheduler] Sent 3-day expiry warning for: ${campaign.name}`);
      }
    }

    // 4. Alertar campanhas próximas de expirar (1 dia) - URGENTE
    const { data: expiring1Day } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'active')
      .not('end_at', 'is', null)
      .lte('end_at', oneDayAhead.toISOString())
      .gt('end_at', now.toISOString());

    for (const campaign of (expiring1Day as Campaign[]) || []) {
      const { data: existing } = await supabase
        .from('campaign_notifications')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('type', 'expiring_1day');

      if (!existing?.length && campaign.created_by) {
        await createNotification(supabase, {
          userId: campaign.created_by,
          type: 'error',
          title: '⚠️ Campanha Expira Amanhã!',
          message: `A campanha "${campaign.name}" expira em 1 dia.`,
          action: { label: 'Renovar Agora', href: '/admin/ads' },
        });

        await supabase.from('campaign_notifications').insert({
          campaign_id: campaign.id,
          type: 'expiring_1day',
          sent_at: now.toISOString(),
        });

        expiring1DayCount++;
        console.log(`[campaign-scheduler] Sent 1-day expiry warning for: ${campaign.name}`);
      }
    }

    // 5. Verificar orçamento esgotado
    const { data: activeCampaigns } = await supabase
      .from('ad_campaigns')
      .select('id, name, budget_total, cpc, cpm, created_by')
      .eq('status', 'active')
      .not('budget_total', 'is', null);

    for (const campaign of (activeCampaigns as Campaign[]) || []) {
      // Calcular gasto real
      const { data: stats } = await supabase
        .from('ad_stats')
        .select('event')
        .eq('campaign_id', campaign.id);

      const clicks = stats?.filter((s: any) => s.event === 'click').length || 0;
      const impressions = stats?.filter((s: any) => s.event === 'impression').length || 0;

      const spent = (clicks * (campaign.cpc || 0)) + ((impressions / 1000) * (campaign.cpm || 0));

      if (spent >= campaign.budget_total!) {
        // Verificar se já enviou notificação
        const { data: existing } = await supabase
          .from('campaign_notifications')
          .select('id')
          .eq('campaign_id', campaign.id)
          .eq('type', 'budget_depleted');

        if (!existing?.length) {
          await supabase
            .from('ad_campaigns')
            .update({ status: 'paused' })
            .eq('id', campaign.id);

          if (campaign.created_by) {
            await createNotification(supabase, {
              userId: campaign.created_by,
              type: 'warning',
              title: 'Orçamento Esgotado',
              message: `A campanha "${campaign.name}" foi pausada por atingir o orçamento total de R$ ${campaign.budget_total!.toFixed(2)}.`,
              action: { label: 'Aumentar Orçamento', href: '/admin/ads' },
            });
          }

          await supabase.from('campaign_notifications').insert({
            campaign_id: campaign.id,
            type: 'budget_depleted',
            sent_at: now.toISOString(),
          });

          budgetDepletedCount++;
          console.log(`[campaign-scheduler] Budget depleted for: ${campaign.name}`);
        }
      }
    }

    const summary = {
      message: 'Campaign scheduler completed',
      timestamp: now.toISOString(),
      actions: {
        activated: activatedCount,
        ended: endedCount,
        expiring_3days_warned: expiring3DaysCount,
        expiring_1day_warned: expiring1DayCount,
        budget_depleted: budgetDepletedCount,
      },
    };

    console.log('[campaign-scheduler] Summary:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[campaign-scheduler] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
