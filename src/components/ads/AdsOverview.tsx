import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TENANT_NAME } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MousePointer, TrendingUp, DollarSign, Play, Pause, Clock, AlertTriangle } from "lucide-react";
import { startOfDay, endOfDay, subDays } from "date-fns";

interface OverviewStats {
  activeCampaigns: number;
  pausedCampaigns: number;
  scheduledCampaigns: number;
  todayImpressions: number;
  todayClicks: number;
  weekImpressions: number;
  weekClicks: number;
  avgCtr: number;
  todayRevenue: number;
  weekRevenue: number;
  alertsCount: number;
}

export function AdsOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      
      // Buscar campanhas
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('id, status, start_at, cpc, cpm, budget_total, spent_amount, impressions_count, clicks_count, impressions_limit, clicks_limit')
        .eq('tenant_id', TENANT_NAME);

      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const pausedCampaigns = campaigns?.filter(c => c.status === 'paused').length || 0;
      const scheduledCampaigns = campaigns?.filter(c => 
        c.status === 'active' && new Date(c.start_at) > new Date()
      ).length || 0;

      // Buscar stats de hoje
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      
      const { data: todayStats } = await supabase
        .from('ad_stats')
        .select('event, campaign_id')
        .eq('tenant_id', TENANT_NAME)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      const todayImpressions = todayStats?.filter(s => s.event === 'impression').length || 0;
      const todayClicks = todayStats?.filter(s => s.event === 'click').length || 0;

      // Buscar stats da semana
      const weekStart = startOfDay(subDays(new Date(), 6));
      
      const { data: weekStats } = await supabase
        .from('ad_stats')
        .select('event')
        .eq('tenant_id', TENANT_NAME)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      const weekImpressions = weekStats?.filter(s => s.event === 'impression').length || 0;
      const weekClicks = weekStats?.filter(s => s.event === 'click').length || 0;
      const avgCtr = weekImpressions > 0 ? (weekClicks / weekImpressions * 100) : 0;

      // Calcular receita estimada
      let todayRevenue = 0;
      let weekRevenue = 0;

      campaigns?.forEach(campaign => {
        const campaignTodayImpressions = todayStats?.filter(
          s => s.campaign_id === campaign.id && s.event === 'impression'
        ).length || 0;
        const campaignTodayClicks = todayStats?.filter(
          s => s.campaign_id === campaign.id && s.event === 'click'
        ).length || 0;

        todayRevenue += (campaignTodayClicks * (campaign.cpc || 0)) + 
                        ((campaignTodayImpressions / 1000) * (campaign.cpm || 0));
      });

      weekRevenue = campaigns?.reduce((sum, c) => sum + (c.spent_amount || 0), 0) || 0;

      // Contar alertas (campanhas com problemas)
      const alertsCount = campaigns?.filter(c => {
        if (c.status !== 'active') return false;
        
        // 80% do orçamento gasto
        if (c.budget_total && c.spent_amount) {
          if (c.spent_amount / c.budget_total >= 0.8) return true;
        }
        
        // Atingindo limites
        if (c.impressions_limit && c.impressions_count) {
          if (c.impressions_count / c.impressions_limit >= 0.8) return true;
        }
        if (c.clicks_limit && c.clicks_count) {
          if (c.clicks_count / c.clicks_limit >= 0.8) return true;
        }
        
        return false;
      }).length || 0;

      setStats({
        activeCampaigns,
        pausedCampaigns,
        scheduledCampaigns,
        todayImpressions,
        todayClicks,
        weekImpressions,
        weekClicks,
        avgCtr,
        todayRevenue,
        weekRevenue,
        alertsCount,
      });
    } catch (error) {
      console.error('Erro ao carregar overview:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {stats.alertsCount > 0 && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-orange-700 dark:text-orange-400">
                {stats.alertsCount} {stats.alertsCount === 1 ? 'Alerta' : 'Alertas'} Ativo{stats.alertsCount === 1 ? '' : 's'}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Campanhas Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas</CardTitle>
            <Play className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground mb-2">Ativas agora</p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                <Pause className="w-3 h-3 mr-1" />
                {stats.pausedCampaigns} pausadas
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {stats.scheduledCampaigns} agendadas
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Impressões Hoje vs Semana */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayImpressions.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.weekImpressions.toLocaleString('pt-BR')} esta semana
            </p>
          </CardContent>
        </Card>

        {/* Cliques e CTR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques & CTR</CardTitle>
            <MousePointer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayClicks.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                CTR: {stats.avgCtr.toFixed(2)}% (7 dias)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Receita */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Hoje</p>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {stats.weekRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} esta semana
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
