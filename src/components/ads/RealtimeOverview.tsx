import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Eye, MousePointer, Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RealtimeOverviewProps {
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    impressionsPerMin: number;
    clicksPerMin: number;
  };
  activeCampaigns: number;
  activeSlots: number;
}

export function RealtimeOverview({ metrics, activeCampaigns, activeSlots }: RealtimeOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Impressões</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.impressions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.impressionsPerMin.toFixed(1)}/min
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cliques</CardTitle>
          <MousePointer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.clicks.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.clicksPerMin.toFixed(1)}/min
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CTR</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.ctr.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">
            Taxa de cliques
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCampaigns}</div>
          <p className="text-xs text-muted-foreground">
            Rodando agora
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Slots Ativos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSlots}</div>
          <p className="text-xs text-muted-foreground">
            Posições com ads
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
