import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, MousePointer, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface RealtimeEvent {
  id: string;
  campaign_id: string;
  creative_id: string | null;
  slot: string;
  page: string | null;
  event_type: 'impression' | 'click';
  tenant_id: string | null;
  created_at: string;
}

interface RealtimeEventStreamProps {
  events: RealtimeEvent[];
}

export function RealtimeEventStream({ events }: RealtimeEventStreamProps) {
  const [filter, setFilter] = useState('');

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-for-stream'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('id, name');
      
      if (error) throw error;
      return data;
    },
  });

  const campaignMap = new Map(campaigns?.map(c => [c.id, c.name]) || []);

  const filteredEvents = events.filter((event) => {
    if (!filter) return true;
    const campaignName = campaignMap.get(event.campaign_id)?.toLowerCase() || '';
    const searchTerm = filter.toLowerCase();
    return (
      campaignName.includes(searchTerm) ||
      event.slot.toLowerCase().includes(searchTerm) ||
      event.event_type.toLowerCase().includes(searchTerm)
    );
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline de Eventos
        </CardTitle>
        <Input
          placeholder="Filtrar por campanha, slot ou tipo..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {filteredEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum evento nos últimos 15 minutos
              </p>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5">
                    {event.event_type === 'impression' ? (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <MousePointer className="h-4 w-4 text-blue-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={event.event_type === 'impression' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {event.event_type === 'impression' ? 'Impressão' : 'Click'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(event.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {campaignMap.get(event.campaign_id) || 'Campanha'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {event.slot}
                      </Badge>
                      {event.page && (
                        <span className="text-xs text-muted-foreground truncate">
                          {event.page}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
