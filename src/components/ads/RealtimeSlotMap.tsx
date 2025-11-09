import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Eye, MousePointer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SlotActivity {
  slot: string;
  lastSeen: string;
  campaignId: string;
  impressions: number;
  clicks: number;
}

interface RealtimeSlotMapProps {
  slotActivity: Map<string, SlotActivity>;
}

export function RealtimeSlotMap({ slotActivity }: RealtimeSlotMapProps) {
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-for-realtime'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('id, name')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
  });

  const campaignMap = new Map(campaigns?.map(c => [c.id, c.name]) || []);
  const activeSlots = Array.from(slotActivity.values());

  // Lista de todos os slots conhecidos
  const allSlots = [
    'header_banner',
    'sidebar_1',
    'sidebar_2',
    'content_top',
    'content_mid',
    'content_bottom',
    'footer_banner',
    'sticky_bottom',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Slots Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {allSlots.map((slot) => {
            const activity = slotActivity.get(slot);
            const isActive = activity !== undefined;
            const campaignName = activity ? campaignMap.get(activity.campaignId) : null;

            return (
              <TooltipProvider key={slot}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-primary bg-primary/5 hover:bg-primary/10'
                          : 'border-border bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{slot}</span>
                        {isActive ? (
                          <Badge variant="default" className="text-xs">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      
                      {isActive && activity && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground truncate">
                            {campaignName || 'Campanha'}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {activity.impressions}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />
                              {activity.clicks}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isActive && activity ? (
                      <div className="space-y-1">
                        <p className="font-semibold">{campaignName || 'Campanha'}</p>
                        <p className="text-xs">Impressões: {activity.impressions}</p>
                        <p className="text-xs">Cliques: {activity.clicks}</p>
                        <p className="text-xs">
                          Última atividade:{' '}
                          {new Date(activity.lastSeen).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    ) : (
                      <p>Nenhuma atividade nos últimos 5 minutos</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
