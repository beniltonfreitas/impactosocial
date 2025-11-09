import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface RealtimeMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  impressionsPerMin: number;
  clicksPerMin: number;
}

interface SlotActivity {
  slot: string;
  lastSeen: string;
  campaignId: string;
  impressions: number;
  clicks: number;
}

export function useRealtimeAds() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    impressions: 0,
    clicks: 0,
    ctr: 0,
    impressionsPerMin: 0,
    clicksPerMin: 0,
  });
  const [slotActivity, setSlotActivity] = useState<Map<string, SlotActivity>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentEvents = async () => {
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('ad_realtime_tracking')
          .select('*')
          .gte('created_at', fifteenMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          console.error('Erro ao carregar eventos:', error);
          return;
        }

        if (data) {
          setEvents(data as RealtimeEvent[]);
          calculateMetrics(data as RealtimeEvent[]);
          calculateSlotActivity(data as RealtimeEvent[]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados realtime:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentEvents();

    // Subscrever a novos eventos em tempo real
    const channel = supabase
      .channel('ad_realtime_tracking_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ad_realtime_tracking',
        },
        (payload) => {
          const newEvent = payload.new as RealtimeEvent;
          setEvents((prev) => {
            const updated = [newEvent, ...prev].slice(0, 200);
            calculateMetrics(updated);
            calculateSlotActivity(updated);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateMetrics = (data: RealtimeEvent[]) => {
    const impressions = data.filter((e) => e.event_type === 'impression').length;
    const clicks = data.filter((e) => e.event_type === 'click').length;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    // Calcular taxa por minuto (últimos 15 min)
    const impressionsPerMin = impressions / 15;
    const clicksPerMin = clicks / 15;

    setMetrics({ impressions, clicks, ctr, impressionsPerMin, clicksPerMin });
  };

  const calculateSlotActivity = (data: RealtimeEvent[]) => {
    const slotMap = new Map<string, SlotActivity>();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    data.forEach((event) => {
      const eventTime = new Date(event.created_at).getTime();
      
      // Considerar apenas eventos dos últimos 5 minutos para "ativo agora"
      if (eventTime < fiveMinutesAgo) return;

      const existing = slotMap.get(event.slot);
      if (!existing || new Date(existing.lastSeen).getTime() < eventTime) {
        const slotEvents = data.filter((e) => e.slot === event.slot);
        const slotImpressions = slotEvents.filter((e) => e.event_type === 'impression').length;
        const slotClicks = slotEvents.filter((e) => e.event_type === 'click').length;

        slotMap.set(event.slot, {
          slot: event.slot,
          lastSeen: event.created_at,
          campaignId: event.campaign_id,
          impressions: slotImpressions,
          clicks: slotClicks,
        });
      }
    });

    setSlotActivity(slotMap);
  };

  return { events, metrics, slotActivity, loading };
}
