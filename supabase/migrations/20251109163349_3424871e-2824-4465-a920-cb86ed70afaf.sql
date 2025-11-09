-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar o cron job para verificar limites a cada 5 minutos
SELECT cron.schedule(
  'ad-check-limits-every-5min',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://wlbdscnfizpqsfcezrnn.supabase.co/functions/v1/ad-check-limits',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsYmRzY25maXpwcXNmY2V6cm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTk1MTUsImV4cCI6MjA3NzMzNTUxNX0.SefJK6GeqJKYZh8HbLvA6KA0c-pD_uhLp9tK85UMdgI"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Criar tabela para tracking em tempo real
CREATE TABLE public.ad_realtime_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  page TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  tenant_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX idx_ad_realtime_recent 
ON public.ad_realtime_tracking(created_at DESC, event_type);

CREATE INDEX idx_ad_realtime_campaign
ON public.ad_realtime_tracking(campaign_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.ad_realtime_tracking ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver tracking
CREATE POLICY "Admins podem ver tracking em tempo real"
ON public.ad_realtime_tracking FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política: Sistema pode inserir
CREATE POLICY "Sistema pode inserir tracking"
ON public.ad_realtime_tracking FOR INSERT
WITH CHECK (true);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_realtime_tracking;

-- Função para limpar dados antigos (mais de 1 hora)
CREATE OR REPLACE FUNCTION public.cleanup_old_realtime_tracking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ad_realtime_tracking 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Agendar limpeza a cada hora
SELECT cron.schedule(
  'cleanup-realtime-tracking',
  '0 * * * *',
  'SELECT public.cleanup_old_realtime_tracking()'
);