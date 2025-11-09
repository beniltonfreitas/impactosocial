import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TENANT_NAME } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Info, TrendingDown } from "lucide-react";
import { differenceInDays } from "date-fns";

interface CampaignAlert {
  id: string;
  name: string;
  type: 'budget' | 'expiring' | 'no_creatives' | 'low_ctr' | 'limit';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export function CampaignAlerts() {
  const [alerts, setAlerts] = useState<CampaignAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      setLoading(true);
      const detectedAlerts: CampaignAlert[] = [];

      // Buscar campanhas ativas
      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('id, name, budget_total, spent_amount, end_at, impressions_count, clicks_count, impressions_limit, clicks_limit')
        .eq('tenant_id', TENANT_NAME)
        .eq('status', 'active');

      if (!campaigns) return;

      for (const campaign of campaigns) {
        // Alerta: 80% do orçamento gasto
        if (campaign.budget_total && campaign.spent_amount) {
          const percentSpent = (campaign.spent_amount / campaign.budget_total) * 100;
          if (percentSpent >= 80) {
            detectedAlerts.push({
              id: campaign.id,
              name: campaign.name,
              type: 'budget',
              severity: percentSpent >= 95 ? 'high' : 'medium',
              message: `Orçamento em ${percentSpent.toFixed(0)}% (R$ ${campaign.spent_amount.toFixed(2)} de R$ ${campaign.budget_total.toFixed(2)})`,
            });
          }
        }

        // Alerta: Campanha expira em menos de 3 dias
        if (campaign.end_at) {
          const daysUntilEnd = differenceInDays(new Date(campaign.end_at), new Date());
          if (daysUntilEnd <= 3 && daysUntilEnd >= 0) {
            detectedAlerts.push({
              id: campaign.id,
              name: campaign.name,
              type: 'expiring',
              severity: daysUntilEnd <= 1 ? 'high' : 'medium',
              message: `Expira em ${daysUntilEnd} ${daysUntilEnd === 1 ? 'dia' : 'dias'}`,
            });
          }
        }

        // Alerta: Limite de impressões atingindo
        if (campaign.impressions_limit && campaign.impressions_count) {
          const percentImpressions = (campaign.impressions_count / campaign.impressions_limit) * 100;
          if (percentImpressions >= 80) {
            detectedAlerts.push({
              id: campaign.id,
              name: campaign.name,
              type: 'limit',
              severity: percentImpressions >= 95 ? 'high' : 'medium',
              message: `Limite de impressões em ${percentImpressions.toFixed(0)}% (${campaign.impressions_count.toLocaleString()} de ${campaign.impressions_limit.toLocaleString()})`,
            });
          }
        }

        // Alerta: Limite de cliques atingindo
        if (campaign.clicks_limit && campaign.clicks_count) {
          const percentClicks = (campaign.clicks_count / campaign.clicks_limit) * 100;
          if (percentClicks >= 80) {
            detectedAlerts.push({
              id: campaign.id,
              name: campaign.name,
              type: 'limit',
              severity: percentClicks >= 95 ? 'high' : 'medium',
              message: `Limite de cliques em ${percentClicks.toFixed(0)}% (${campaign.clicks_count.toLocaleString()} de ${campaign.clicks_limit.toLocaleString()})`,
            });
          }
        }

        // Alerta: Campanha sem criativos
        const { data: creatives } = await supabase
          .from('ad_creatives')
          .select('id')
          .eq('campaign_id', campaign.id);

        if (!creatives || creatives.length === 0) {
          detectedAlerts.push({
            id: campaign.id,
            name: campaign.name,
            type: 'no_creatives',
            severity: 'high',
            message: 'Campanha ativa sem criativos associados',
          });
        }

        // Alerta: CTR muito baixo (< 0.5%)
        if (campaign.impressions_count > 100) {
          const ctr = campaign.clicks_count > 0 
            ? (campaign.clicks_count / campaign.impressions_count) * 100 
            : 0;
          
          if (ctr < 0.5) {
            detectedAlerts.push({
              id: campaign.id,
              name: campaign.name,
              type: 'low_ctr',
              severity: 'low',
              message: `CTR baixo: ${ctr.toFixed(2)}% (${campaign.clicks_count} cliques em ${campaign.impressions_count.toLocaleString()} impressões)`,
            });
          }
        }
      }

      setAlerts(detectedAlerts);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-green-500" />
            Nenhum Alerta
          </CardTitle>
          <CardDescription>Todas as campanhas estão operando normalmente</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  const getIcon = (type: string) => {
    switch (type) {
      case 'budget': return AlertTriangle;
      case 'expiring': return AlertCircle;
      case 'no_creatives': return AlertTriangle;
      case 'low_ctr': return TrendingDown;
      case 'limit': return AlertTriangle;
      default: return Info;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Alertas de Campanhas</CardTitle>
        <CardDescription>
          {highAlerts.length} crítico{highAlerts.length !== 1 ? 's' : ''}, {' '}
          {mediumAlerts.length} importante{mediumAlerts.length !== 1 ? 's' : ''}, {' '}
          {lowAlerts.length} informativo{lowAlerts.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Alertas Críticos */}
        {highAlerts.map((alert) => {
          const Icon = getIcon(alert.type);
          return (
            <Alert key={`${alert.id}-${alert.type}`} variant="destructive">
              <Icon className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                {alert.name}
                <Badge variant="destructive" className="text-xs">Crítico</Badge>
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          );
        })}

        {/* Alertas Importantes */}
        {mediumAlerts.map((alert) => {
          const Icon = getIcon(alert.type);
          return (
            <Alert key={`${alert.id}-${alert.type}`} className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <Icon className="h-4 w-4 text-orange-500" />
              <AlertTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                {alert.name}
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 dark:text-orange-400">
                  Importante
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-orange-600 dark:text-orange-300">
                {alert.message}
              </AlertDescription>
            </Alert>
          );
        })}

        {/* Alertas Informativos */}
        {lowAlerts.map((alert) => {
          const Icon = getIcon(alert.type);
          return (
            <Alert key={`${alert.id}-${alert.type}`} className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <Icon className="h-4 w-4 text-blue-500" />
              <AlertTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                {alert.name}
                <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 dark:text-blue-400">
                  Info
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-blue-600 dark:text-blue-300">
                {alert.message}
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
