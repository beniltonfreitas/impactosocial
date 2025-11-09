import { IlluminaAdminLayout } from "@/components/layout/IlluminaAdminLayout";
import { RealtimeOverview } from "@/components/ads/RealtimeOverview";
import { RealtimeSlotMap } from "@/components/ads/RealtimeSlotMap";
import { RealtimeEventStream } from "@/components/ads/RealtimeEventStream";
import { RealtimeCampaignList } from "@/components/ads/RealtimeCampaignList";
import { useRealtimeAds } from "@/hooks/useRealtimeAds";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";

export default function AdminAdsRealtime() {
  const { events, metrics, slotActivity, loading } = useRealtimeAds();

  // Calcular campanhas e slots ativos únicos
  const activeCampaigns = new Set(events.map((e) => e.campaign_id)).size;
  const activeSlots = slotActivity.size;

  if (loading) {
    return (
      <IlluminaAdminLayout title="Anúncios em Tempo Real">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </IlluminaAdminLayout>
    );
  }

  return (
    <IlluminaAdminLayout title="Anúncios em Tempo Real">
      <div className="space-y-6">
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertDescription>
            Dashboard atualizado automaticamente. Mostrando eventos dos últimos 15 minutos.
          </AlertDescription>
        </Alert>

        {/* Métricas gerais ao vivo */}
        <RealtimeOverview
          metrics={metrics}
          activeCampaigns={activeCampaigns}
          activeSlots={activeSlots}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mapa de slots ativos */}
          <RealtimeSlotMap slotActivity={slotActivity} />

          {/* Campanhas rodando agora */}
          <RealtimeCampaignList events={events} />
        </div>

        {/* Stream de eventos */}
        <RealtimeEventStream events={events} />
      </div>
    </IlluminaAdminLayout>
  );
}
