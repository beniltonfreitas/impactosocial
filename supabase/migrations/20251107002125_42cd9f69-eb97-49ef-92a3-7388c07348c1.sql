-- Criar enum para status de campanha
CREATE TYPE ad_campaign_status AS ENUM ('active', 'paused', 'ended');

-- Criar enum para tipo de criativo
CREATE TYPE ad_creative_type AS ENUM ('image', 'html', 'video');

-- Criar enum para evento de tracking
CREATE TYPE ad_event_type AS ENUM ('impression', 'click');

-- Tabela de campanhas publicitárias
CREATE TABLE public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  advertiser TEXT NOT NULL,
  budget_total DECIMAL(10, 2),
  budget_daily DECIMAL(10, 2),
  cpc DECIMAL(10, 2),
  cpm DECIMAL(10, 2),
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  status ad_campaign_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de segmentação/targeting
CREATE TABLE public.ad_targeting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE UNIQUE NOT NULL,
  domains TEXT[] DEFAULT '{}',
  pages TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}'
);

-- Tabela de criativos (materiais publicitários)
CREATE TABLE public.ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  type ad_creative_type NOT NULL,
  image_url TEXT,
  html_content TEXT,
  video_url TEXT,
  headline TEXT,
  description TEXT,
  cta_label TEXT,
  target_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de posições/slots de anúncios
CREATE TABLE public.ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
  slot TEXT NOT NULL,
  allowed_types TEXT[] DEFAULT '{}',
  max_ads INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(tenant_id, slot)
);

-- Tabela de estatísticas/tracking
CREATE TABLE public.ad_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  creative_id UUID REFERENCES public.ad_creatives(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
  event ad_event_type NOT NULL,
  slot TEXT,
  page TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX idx_ad_stats_campaign ON public.ad_stats(campaign_id, created_at DESC);
CREATE INDEX idx_ad_stats_event ON public.ad_stats(event, tenant_id, created_at DESC);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status, tenant_id);
CREATE INDEX idx_ad_campaigns_dates ON public.ad_campaigns(start_at, end_at);

-- Habilitar RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_targeting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_stats ENABLE ROW LEVEL SECURITY;

-- Policies para ad_campaigns
CREATE POLICY "Admins podem gerenciar campanhas"
  ON public.ad_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderadores podem ver campanhas do tenant"
  ON public.ad_campaigns
  FOR SELECT
  USING (has_role(auth.uid(), 'moderator'));

-- Policies para ad_targeting
CREATE POLICY "Admins podem gerenciar targeting"
  ON public.ad_targeting
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderadores podem ver targeting"
  ON public.ad_targeting
  FOR SELECT
  USING (has_role(auth.uid(), 'moderator'));

-- Policies para ad_creatives
CREATE POLICY "Admins podem gerenciar criativos"
  ON public.ad_creatives
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderadores podem ver criativos"
  ON public.ad_creatives
  FOR SELECT
  USING (has_role(auth.uid(), 'moderator'));

-- Policies para ad_placements
CREATE POLICY "Admins podem gerenciar placements"
  ON public.ad_placements
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos podem ver placements ativos"
  ON public.ad_placements
  FOR SELECT
  USING (is_active = TRUE);

-- Policies para ad_stats
CREATE POLICY "Admins podem ver stats"
  ON public.ad_stats
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema pode inserir stats"
  ON public.ad_stats
  FOR INSERT
  WITH CHECK (TRUE);