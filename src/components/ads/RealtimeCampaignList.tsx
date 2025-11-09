import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Eye, MousePointer, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RealtimeEvent {
  id: string;
  campaign_id: string;
  event_type: 'impression' | 'click';
  created_at: string;
}

interface RealtimeCampaignListProps {
  events: RealtimeEvent[];
}

export function RealtimeCampaignList({ events }: RealtimeCampaignListProps) {
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-realtime-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('id, name, status')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
  });

  // Calcular métricas por campanha
  const campaignMetrics = new Map<string, { impressions: number; clicks: number; ctr: number }>();

  events.forEach((event) => {
    const existing = campaignMetrics.get(event.campaign_id) || { impressions: 0, clicks: 0, ctr: 0 };
    
    if (event.event_type === 'impression') {
      existing.impressions++;
    } else {
      existing.clicks++;
    }
    
    existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0;
    campaignMetrics.set(event.campaign_id, existing);
  });

  // Filtrar apenas campanhas com atividade
  const activeCampaigns = campaigns?.filter((c) => campaignMetrics.has(c.id)) || [];

  // Ordenar por impressões
  activeCampaigns.sort((a, b) => {
    const metricsA = campaignMetrics.get(a.id)!;
    const metricsB = campaignMetrics.get(b.id)!;
    return metricsB.impressions - metricsA.impressions;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Campanhas Ativas Agora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeCampaigns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma campanha ativa nos últimos 15 minutos
            </p>
          ) : (
            activeCampaigns.map((campaign) => {
              const metrics = campaignMetrics.get(campaign.id)!;
              
              return (
                <div
                  key={campaign.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{campaign.name}</h4>
                      <Badge variant="default" className="mt-1 text-xs">
                        Ativa
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Impressões</span>
                      </div>
                      <p className="text-lg font-bold">{metrics.impressions}</p>
                    </div>

                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <MousePointer className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Cliques</span>
                      </div>
                      <p className="text-lg font-bold">{metrics.clicks}</p>
                    </div>

                    <div className="text-center p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">CTR</span>
                      </div>
                      <p className="text-lg font-bold">{metrics.ctr.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
