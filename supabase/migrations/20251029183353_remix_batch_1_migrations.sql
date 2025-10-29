
-- Migration: 20251029181943

-- Migration: 20251026172641
-- 1) Tabela de Tenants (parceiros/portais)
CREATE TABLE IF NOT EXISTS tenant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Tabela de Regiões (UF/Cidade)
CREATE TABLE IF NOT EXISTS region (
  id BIGSERIAL PRIMARY KEY,
  country_code CHAR(2) NOT NULL DEFAULT 'BR',
  uf CHAR(2) NOT NULL,
  city TEXT NOT NULL,
  city_ibge_id BIGINT,
  cep_start CHAR(8),
  cep_end CHAR(8),
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  bbox_geojson JSONB,
  UNIQUE (uf, city)
);

-- 3) Mapa de parceiros (região → tenant)
CREATE TABLE IF NOT EXISTS partner_map (
  id BIGSERIAL PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES region(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  priority SMALLINT NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  UNIQUE (region_id, tenant_id)
);

-- 4) Preferências do usuário/visitante
CREATE TABLE IF NOT EXISTS tenant_pref (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  anon_id UUID,
  tenant_id_preferred UUID REFERENCES tenant(id),
  region_id BIGINT REFERENCES region(id),
  cep CHAR(8),
  last_resolved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Entitlements (recursos premium como portal_bonus)
CREATE TABLE IF NOT EXISTS entitlement (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_until TIMESTAMPTZ,
  UNIQUE (tenant_id, feature_key)
);

-- 6) Funções auxiliares para normalização de CEP
CREATE OR REPLACE FUNCTION normalize_cep(cep_in TEXT)
RETURNS CHAR(8) LANGUAGE SQL IMMUTABLE AS $$
  SELECT lpad(regexp_replace(cep_in, '\D', '', 'g'), 8, '0')::CHAR(8);
$$;

-- 7) Função para resolver por CEP
CREATE OR REPLACE FUNCTION resolve_by_cep(cep_in TEXT)
RETURNS TABLE (
  uf CHAR(2), city TEXT,
  tenant_slug TEXT, tenant_domain TEXT,
  fallback BOOLEAN
) LANGUAGE SQL STABLE AS $$
  WITH cep AS (SELECT normalize_cep(cep_in) AS c)
  SELECT r.uf, r.city, t.slug, t.domain,
         CASE WHEN t.slug IS NULL THEN TRUE ELSE FALSE END AS fallback
  FROM cep
  LEFT JOIN region r
    ON r.cep_start IS NOT NULL AND r.cep_end IS NOT NULL
   AND cep.c BETWEEN r.cep_start AND r.cep_end
  LEFT JOIN partner_map pm ON pm.region_id = r.id AND pm.active = TRUE
  LEFT JOIN tenant t ON t.id = pm.tenant_id
  LIMIT 1;
$$;

-- 8) Função para resolver por coordenadas GPS
CREATE OR REPLACE FUNCTION resolve_by_geo(lat_in NUMERIC, lng_in NUMERIC)
RETURNS TABLE (
  uf CHAR(2), city TEXT,
  tenant_slug TEXT, tenant_domain TEXT,
  fallback BOOLEAN
) LANGUAGE SQL STABLE AS $$
  SELECT r.uf, r.city, t.slug, t.domain,
         CASE WHEN t.slug IS NULL THEN TRUE ELSE FALSE END AS fallback
  FROM region r
  LEFT JOIN partner_map pm ON pm.region_id = r.id AND pm.active = TRUE
  LEFT JOIN tenant t ON t.id = pm.tenant_id
  ORDER BY (ABS(r.lat - lat_in) + ABS(r.lng - lng_in)) ASC NULLS LAST
  LIMIT 1;
$$;

-- 9) Seeds: Portal Nacional + 4 cidades SP
INSERT INTO tenant (slug, name) VALUES ('nacional','Portal Nacional')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO region (uf, city, cep_start, cep_end, lat, lng)
VALUES 
('SP','Cotia','06700000','06729999', -23.6020, -46.9190),
('SP','Barueri','06400000','06499999', -23.5106, -46.8761),
('SP','Itapevi','06650000','06699999', -23.5489, -46.9342),
('SP','Osasco','06000000','06299999', -23.5324, -46.7916)
ON CONFLICT (uf, city) DO NOTHING;

INSERT INTO partner_map (region_id, tenant_id, priority, active)
SELECT r.id, t.id, 100, TRUE FROM region r JOIN tenant t ON t.slug='nacional'
ON CONFLICT DO NOTHING;

INSERT INTO entitlement (tenant_id, feature_key, active)
SELECT id, 'portal_bonus', TRUE FROM tenant WHERE slug='nacional'
ON CONFLICT DO NOTHING;

-- 10) RLS Policies
ALTER TABLE region ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_pref ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "region: read public" ON region FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "partner_map: read public active" ON partner_map FOR SELECT TO anon, authenticated USING (active = TRUE);
CREATE POLICY "tenant: read public" ON tenant FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "tenant_pref: select own" ON tenant_pref FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tenant_pref: insert own" ON tenant_pref FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tenant_pref: update own" ON tenant_pref FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entitlement: read public" ON entitlement FOR SELECT TO anon, authenticated USING (active = TRUE);

-- Migration: 20251026193118
-- ============================================
-- FASE 1.1: HOTFIX DE SEGURANÇA (search_path)
-- ============================================

ALTER FUNCTION public.normalize_cep(text) SET search_path = public;
ALTER FUNCTION public.resolve_by_cep(text) SET search_path = public;
ALTER FUNCTION public.resolve_by_geo(numeric, numeric) SET search_path = public;

-- ============================================
-- FASE 1.2: TABELAS DE NOTÍCIAS
-- ============================================

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#C1121F',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de artigos
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenant(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_articles_tenant_pub ON public.articles(tenant_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published_at DESC) WHERE published_at IS NOT NULL;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FASE 1.2: RLS POLICIES
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Leitura pública de categorias
CREATE POLICY "categories: read public"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Leitura pública de artigos publicados
CREATE POLICY "articles: read public published"
  ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());

-- ============================================
-- FASE 1.3: SEED DE DADOS
-- ============================================

-- Categorias padrão
INSERT INTO public.categories (name, slug, color) VALUES
  ('Política', 'politica', '#C1121F'),
  ('Economia', 'economia', '#1E3A8A'),
  ('Esportes', 'esportes', '#10B981'),
  ('Cultura', 'cultura', '#F59E0B'),
  ('Tecnologia', 'tecnologia', '#8B5CF6'),
  ('Saúde', 'saude', '#EC4899')
ON CONFLICT (slug) DO NOTHING;

-- Artigos de exemplo para o tenant Nacional
INSERT INTO public.articles (tenant_id, category_id, title, slug, summary, content, image_url, author, published_at, featured)
SELECT 
  t.id,
  c.id,
  'Inauguração do Portal Conexão na Cidade',
  'inauguracao-portal-regional',
  'Chegamos para conectar sua cidade às notícias que realmente importam. Cobertura local, informação de qualidade.',
  E'# Bem-vindo ao Conexão na Cidade\n\nEstamos felizes em anunciar o lançamento oficial do portal Conexão na Cidade, sua nova fonte de notícias locais e regionais.\n\n## Nossa Missão\n\nLevar informação de qualidade, com cobertura hiperlocal e relevância para o seu dia a dia.\n\n## O que você encontrará aqui\n\n- Notícias da sua cidade\n- Economia e mercado em tempo real\n- Previsão do tempo atualizada\n- Informações de trânsito\n- E muito mais!\n\nFique conectado com a gente!',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
  'Redação Conexão',
  now(),
  true
FROM public.tenant t
CROSS JOIN public.categories c
WHERE t.slug = 'nacional' AND c.slug = 'cultura'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Mais artigos de exemplo
INSERT INTO public.articles (tenant_id, category_id, title, slug, summary, image_url, author, published_at, featured)
SELECT 
  t.id,
  c.id,
  'Economia em Foco: Mercados em Alta',
  'economia-mercados-alta-' || extract(epoch from now())::text,
  'Dólar recua e bolsa brasileira registra ganhos expressivos nesta semana.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
  'Redação Economia',
  now() - interval '2 hours',
  false
FROM public.tenant t
CROSS JOIN public.categories c
WHERE t.slug = 'nacional' AND c.slug = 'economia'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.articles (tenant_id, category_id, title, slug, summary, image_url, author, published_at, featured)
SELECT 
  t.id,
  c.id,
  'Novo Parque Será Inaugurado no Centro',
  'novo-parque-centro-' || extract(epoch from now())::text,
  'Prefeitura anuncia obra que deve trazer mais área verde para a região central da cidade.',
  'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&h=450&fit=crop',
  'Redação Local',
  now() - interval '5 hours',
  false
FROM public.tenant t
CROSS JOIN public.categories c
WHERE t.slug = 'nacional' AND c.slug = 'politica'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Migration: 20251027171911
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- User roles policies (only admins can manage roles)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for profile updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251027185623
-- ============================================
-- FASE 4: SISTEMA DE COMENTÁRIOS
-- ============================================

-- Criar tabela de comentários
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'deleted')),
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT content_length CHECK (char_length(content) >= 3 AND char_length(content) <= 1000)
);

-- Índices para performance
CREATE INDEX comments_article_id_idx ON public.comments(article_id);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);
CREATE INDEX comments_parent_id_idx ON public.comments(parent_id);
CREATE INDEX comments_created_at_idx ON public.comments(created_at DESC);
CREATE INDEX comments_status_idx ON public.comments(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para comentários
CREATE POLICY "Todos podem ler comentários ativos"
  ON public.comments
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Autenticados podem inserir comentários"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'active');

CREATE POLICY "Usuários podem editar próprios comentários (15 min)"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    status = 'active' AND
    created_at > now() - interval '15 minutes'
  )
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'active' AND
    content IS NOT NULL
  );

CREATE POLICY "Usuários podem soft-delete próprios comentários"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'active')
  WITH CHECK (auth.uid() = user_id AND status = 'deleted');

CREATE POLICY "Admins e Moderators podem gerenciar todos comentários"
  ON public.comments
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'moderator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'moderator')
  );

-- View com informações de usuário
CREATE VIEW public.comments_with_users AS
SELECT 
  c.id,
  c.article_id,
  c.user_id,
  c.parent_id,
  c.content,
  c.status,
  c.edited_at,
  c.created_at,
  c.updated_at,
  p.full_name,
  p.avatar_url,
  (SELECT COUNT(*) FROM public.comments replies WHERE replies.parent_id = c.id AND replies.status = 'active') as replies_count
FROM public.comments c
LEFT JOIN public.profiles p ON p.id = c.user_id
WHERE c.status = 'active';

-- Habilitar Realtime para comentários
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- ============================================
-- FASE 5: NOTIFICAÇÕES PUSH
-- ============================================

-- Adicionar campo breaking em articles
ALTER TABLE public.articles ADD COLUMN breaking BOOLEAN NOT NULL DEFAULT false;

-- Índice para breaking news
CREATE INDEX articles_breaking_idx ON public.articles(breaking, published_at DESC) WHERE breaking = true;

-- Tabela de push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (endpoint)
);

-- Índices para performance
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
CREATE INDEX push_subscriptions_tenant_id_idx ON public.push_subscriptions(tenant_id);

-- Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para push subscriptions
CREATE POLICY "Usuários podem gerenciar próprias subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Função para notificar breaking news
CREATE OR REPLACE FUNCTION public.notify_breaking_news()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
BEGIN
  -- Apenas se breaking = true e published_at foi setado
  IF NEW.breaking = true AND NEW.published_at IS NOT NULL AND (OLD.published_at IS NULL OR OLD.breaking = false) THEN
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/push-notify-breaking';
    
    -- Chamar edge function via HTTP POST (async)
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('articleId', NEW.id::text)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar breaking news
CREATE TRIGGER notify_breaking_news_trigger
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_breaking_news();

-- Migration: 20251027191805
-- FASE 6: Índice de busca full-text
CREATE INDEX IF NOT EXISTS articles_search_idx ON articles 
USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(content, '')));

-- FASE 7: Tabela de mensagens de contato
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FASE 9: Sistema de denúncias de comentários
ALTER TABLE comments ADD COLUMN IF NOT EXISTS flags_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS comments_flags_idx ON comments(flags_count) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS comment_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'misinformation', 'other')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS comment_flags_comment_idx ON comment_flags(comment_id);

-- RLS para comment_flags
ALTER TABLE comment_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem denunciar comentários"
ON comment_flags FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderadores e admins podem ver denúncias"
ON comment_flags FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Trigger para incrementar flags_count
CREATE OR REPLACE FUNCTION increment_comment_flags()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE comments SET flags_count = flags_count + 1 WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_comment_flag_insert
AFTER INSERT ON comment_flags
FOR EACH ROW EXECUTE FUNCTION increment_comment_flags();

-- FASE 10: Sistema de assinaturas Premium
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly_cents INT NOT NULL,
  features JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_idx ON user_subscriptions(user_id);

-- RLS para subscriptions
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver planos ativos"
ON subscription_plans FOR SELECT
USING (active = true);

CREATE POLICY "Usuários podem ver próprias assinaturas"
ON user_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Adicionar coluna premium_only em articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS premium_only BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS articles_premium_idx ON articles(premium_only) WHERE premium_only = TRUE;

-- Inserir planos padrão
INSERT INTO subscription_plans (name, slug, price_monthly_cents, description, features) VALUES
('Básico', 'basico', 0, 'Acesso gratuito a notícias públicas', '["Acesso a notícias públicas", "Comentários"]'::jsonb),
('Premium', 'premium', 1990, 'Acesso completo sem anúncios', '["Acesso ilimitado", "Sem anúncios", "Conteúdo exclusivo", "Newsletters semanais"]'::jsonb),
('Premium+', 'premium-plus', 3990, 'Todos os benefícios + eventos exclusivos', '["Todos benefícios Premium", "Acesso antecipado", "Eventos exclusivos"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Migration: 20251027191857
-- Habilitar RLS na tabela contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver mensagens de contato
CREATE POLICY "Admins podem ver mensagens de contato"
ON contact_messages FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migration: 20251027195141
-- Habilitar realtime para a tabela comment_flags
ALTER PUBLICATION supabase_realtime ADD TABLE comment_flags;

-- Migration: 20251027204222
-- Adicionar campo de preferências na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{"favorite_categories": [], "email_notifications": true, "push_notifications": true}'::jsonb;

-- Migration: 20251027211522
-- Corrigir Security Definer View: adicionar security_invoker = true
DROP VIEW IF EXISTS public.comments_with_users;

CREATE VIEW public.comments_with_users
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.article_id,
  c.user_id,
  c.parent_id,
  c.content,
  c.status,
  c.created_at,
  c.updated_at,
  c.edited_at,
  p.full_name,
  p.avatar_url,
  (
    SELECT count(*)
    FROM comments replies
    WHERE replies.parent_id = c.id
      AND replies.status = 'active'
  ) AS replies_count
FROM comments c
LEFT JOIN profiles p ON p.id = c.user_id
WHERE c.status = 'active';

-- Migration: 20251028104057
-- Tabela para rastrear visualizações detalhadas
CREATE TABLE IF NOT EXISTS public.article_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  viewed_at timestamp with time zone DEFAULT now() NOT NULL,
  referrer text,
  user_agent text,
  ip_address inet
);

-- Índices para performance
CREATE INDEX idx_article_views_article_id ON public.article_views(article_id);
CREATE INDEX idx_article_views_viewed_at ON public.article_views(viewed_at DESC);
CREATE INDEX idx_article_views_user_id ON public.article_views(user_id);

-- RLS: apenas admins podem ver views detalhadas
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todas as visualizações"
ON public.article_views FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Função para registrar visualização
CREATE OR REPLACE FUNCTION public.register_article_view(
  p_article_id uuid,
  p_session_id text,
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir visualização
  INSERT INTO public.article_views (
    article_id,
    user_id,
    session_id,
    referrer,
    user_agent
  ) VALUES (
    p_article_id,
    auth.uid(),
    p_session_id,
    p_referrer,
    p_user_agent
  );
  
  -- Incrementar contador no artigo
  UPDATE public.articles
  SET views = views + 1
  WHERE id = p_article_id;
END;
$$;

