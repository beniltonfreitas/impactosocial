import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar se é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar role admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Acesso negado');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total de assinantes ativos
    const { count: totalSubscribers } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Novos assinantes este mês
    const { count: newThisMonth } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', startOfMonth.toISOString());

    // Cancelamentos este mês
    const { count: canceledThisMonth } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('expires_at', startOfMonth.toISOString());

    // Calcular MRR (Monthly Recurring Revenue)
    const { data: subscriptions } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan_id, subscription_plans(price_monthly_cents)')
      .eq('status', 'active');

    const mrr = subscriptions?.reduce((sum, sub: any) => {
      return sum + (sub.subscription_plans?.price_monthly_cents || 0);
    }, 0) || 0;

    // MRR do mês passado para calcular crescimento
    const { data: lastMonthSubs } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan_id, subscription_plans(price_monthly_cents)')
      .eq('status', 'active')
      .lte('started_at', endOfLastMonth.toISOString());

    const lastMonthMrr = lastMonthSubs?.reduce((sum, sub: any) => {
      return sum + (sub.subscription_plans?.price_monthly_cents || 0);
    }, 0) || 0;

    const growthRate = lastMonthMrr > 0 
      ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100 
      : 0;

    // Churn rate
    const churnRate = totalSubscribers && totalSubscribers > 0
      ? ((canceledThisMonth || 0) / totalSubscribers) * 100
      : 0;

    // Receita hoje
    const { data: todayTransactions } = await supabaseAdmin
      .from('payment_transactions')
      .select('amount_cents')
      .eq('status', 'completed')
      .gte('completed_at', startOfToday.toISOString());

    const revenueToday = todayTransactions?.reduce((sum, t) => sum + t.amount_cents, 0) || 0;

    // Receita este mês
    const { data: monthTransactions } = await supabaseAdmin
      .from('payment_transactions')
      .select('amount_cents')
      .eq('status', 'completed')
      .gte('completed_at', startOfMonth.toISOString());

    const revenueThisMonth = monthTransactions?.reduce((sum, t) => sum + t.amount_cents, 0) || 0;

    // Receita este ano
    const { data: yearTransactions } = await supabaseAdmin
      .from('payment_transactions')
      .select('amount_cents')
      .eq('status', 'completed')
      .gte('completed_at', startOfYear.toISOString());

    const revenueThisYear = yearTransactions?.reduce((sum, t) => sum + t.amount_cents, 0) || 0;

    // Transações recentes
    const { data: recentTransactions } = await supabaseAdmin
      .from('payment_transactions')
      .select(`
        *,
        profiles:user_id(full_name),
        subscription_plans:subscription_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Distribuição de métodos de pagamento
    const { data: paymentMethods } = await supabaseAdmin
      .from('payment_transactions')
      .select('payment_method')
      .eq('status', 'completed')
      .gte('completed_at', startOfMonth.toISOString());

    const methodsDistribution = paymentMethods?.reduce((acc: any, t) => {
      acc[t.payment_method] = (acc[t.payment_method] || 0) + 1;
      return acc;
    }, {}) || {};

    const total = Object.values(methodsDistribution).reduce((sum: number, count) => sum + (count as number), 0) as number;
    const methodsPercentage = Object.entries(methodsDistribution).reduce((acc: any, [method, count]) => {
      acc[method] = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
      return acc;
    }, {});

    console.log('Dashboard stats calculated successfully');

    return new Response(
      JSON.stringify({
        mrr,
        total_subscribers: totalSubscribers || 0,
        new_this_month: newThisMonth || 0,
        canceled_this_month: canceledThisMonth || 0,
        churn_rate: Math.round(churnRate * 10) / 10,
        revenue_today: revenueToday,
        revenue_this_month: revenueThisMonth,
        revenue_this_year: revenueThisYear,
        growth_rate: Math.round(growthRate * 10) / 10,
        recent_transactions: recentTransactions,
        payment_methods_distribution: methodsPercentage,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro em financial-dashboard-stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});