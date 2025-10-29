-- =====================================================
-- REDE PCD - INFRAESTRUTURA BASE
-- Sistema de Inclusão Digital para Pessoas com Deficiência
-- =====================================================

-- 1. Configurações Gerais dos Módulos
CREATE TABLE IF NOT EXISTS pcd_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PcD+ Feed Acessível
CREATE TABLE IF NOT EXISTS pcd_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  simplified_content TEXT,
  accessibility_level TEXT CHECK (accessibility_level IN ('alto', 'medio', 'basico')),
  disability_tags TEXT[] DEFAULT '{}',
  audio_url TEXT,
  sign_language_video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PcD Direitos - Legislação
CREATE TABLE IF NOT EXISTS pcd_legislation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('lei', 'decreto', 'portaria', 'resolucao', 'instrucao_normativa')),
  number TEXT,
  year INTEGER,
  summary TEXT,
  full_text TEXT,
  simplified_guide TEXT,
  benefit_type TEXT[] DEFAULT '{}',
  disability_types TEXT[] DEFAULT '{}',
  federal_law BOOLEAN DEFAULT true,
  state_uf CHAR(2),
  municipality TEXT,
  file_url TEXT,
  published_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PcD Alerta - Denúncias
CREATE TABLE IF NOT EXISTS pcd_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('acessibilidade', 'discriminacao', 'transporte', 'saude', 'educacao', 'trabalho', 'outro')),
  location_lat NUMERIC(10, 7),
  location_lng NUMERIC(10, 7),
  location_address TEXT,
  city TEXT,
  state CHAR(2),
  media_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'rejected')),
  public_body TEXT,
  protocol_number TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'anonymous')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PcD Play - Vídeos
CREATE TABLE IF NOT EXISTS pcd_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  has_subtitles BOOLEAN DEFAULT false,
  has_audio_description BOOLEAN DEFAULT false,
  has_sign_language BOOLEAN DEFAULT false,
  category TEXT,
  tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PcD Esportes - Atletas
CREATE TABLE IF NOT EXISTS pcd_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  disability_type TEXT,
  sport TEXT,
  achievements JSONB DEFAULT '[]',
  photo_url TEXT,
  social_media JSONB DEFAULT '{}',
  state CHAR(2),
  city TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CDDPcD - Conselhos
CREATE TABLE IF NOT EXISTS pcd_councils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('municipal', 'estadual', 'federal')),
  state CHAR(2),
  city TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  president_name TEXT,
  meeting_schedule TEXT,
  website TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PcD Shop - Produtos
CREATE TABLE IF NOT EXISTS pcd_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('assistivo', 'artesanal', 'servico', 'tecnologia', 'vestuario', 'outro')),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  commission_rate DECIMAL(5,2) DEFAULT 0.20 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PcD Vitrine - Portfólios
CREATE TABLE IF NOT EXISTS pcd_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  social_media JSONB DEFAULT '{}',
  portfolio_images TEXT[] DEFAULT '{}',
  qr_code_url TEXT,
  state CHAR(2),
  city TEXT,
  premium BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PcD Blog - Artigos
CREATE TABLE IF NOT EXISTS pcd_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  audio_url TEXT,
  featured_image TEXT,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PcD Academy - Cursos
CREATE TABLE IF NOT EXISTS pcd_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT,
  duration_hours INTEGER,
  thumbnail_url TEXT,
  price_cents INTEGER DEFAULT 0 CHECK (price_cents >= 0),
  has_certificate BOOLEAN DEFAULT true,
  accessibility_features JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PcD Clube - Benefícios
CREATE TABLE IF NOT EXISTS pcd_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  description TEXT,
  category TEXT,
  valid_until DATE,
  coupon_code TEXT,
  state CHAR(2),
  city TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. PcD Rede do Bem - Campanhas
CREATE TABLE IF NOT EXISTS pcd_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_cents INTEGER CHECK (goal_cents >= 0),
  raised_cents INTEGER DEFAULT 0 CHECK (raised_cents >= 0),
  payment_platform TEXT CHECK (payment_platform IN ('apoiese', 'vakinha', 'pix', 'benfeitoria')),
  external_url TEXT,
  beneficiary_name TEXT,
  verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  ends_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS DE ATUALIZAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION update_pcd_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pcd_config_updated_at BEFORE UPDATE ON pcd_config FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_articles_updated_at BEFORE UPDATE ON pcd_articles FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_legislation_updated_at BEFORE UPDATE ON pcd_legislation FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_complaints_updated_at BEFORE UPDATE ON pcd_complaints FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_videos_updated_at BEFORE UPDATE ON pcd_videos FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_athletes_updated_at BEFORE UPDATE ON pcd_athletes FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_councils_updated_at BEFORE UPDATE ON pcd_councils FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_products_updated_at BEFORE UPDATE ON pcd_products FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_portfolios_updated_at BEFORE UPDATE ON pcd_portfolios FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_blog_posts_updated_at BEFORE UPDATE ON pcd_blog_posts FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_courses_updated_at BEFORE UPDATE ON pcd_courses FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_benefits_updated_at BEFORE UPDATE ON pcd_benefits FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();
CREATE TRIGGER pcd_campaigns_updated_at BEFORE UPDATE ON pcd_campaigns FOR EACH ROW EXECUTE FUNCTION update_pcd_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- 1. PCD Config (Admin only)
ALTER TABLE pcd_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin pode gerenciar configurações" ON pcd_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Todos podem ver configurações ativas" ON pcd_config FOR SELECT USING (active = true);

-- 2. PCD Articles (Public read, moderator write)
ALTER TABLE pcd_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver artigos acessíveis" ON pcd_articles FOR SELECT USING (true);
CREATE POLICY "Moderadores podem gerenciar artigos acessíveis" ON pcd_articles FOR ALL USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 3. PCD Legislation (Public read, admin write)
ALTER TABLE pcd_legislation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver legislação" ON pcd_legislation FOR SELECT USING (true);
CREATE POLICY "Admins podem gerenciar legislação" ON pcd_legislation FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. PCD Complaints (Own + moderators)
ALTER TABLE pcd_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem criar denúncias" ON pcd_complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem ver próprias denúncias" ON pcd_complaints FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Denúncias públicas são visíveis" ON pcd_complaints FOR SELECT USING (visibility = 'public');
CREATE POLICY "Moderadores podem gerenciar denúncias" ON pcd_complaints FOR ALL USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 5. PCD Videos (Public read published, moderator write)
ALTER TABLE pcd_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver vídeos publicados" ON pcd_videos FOR SELECT USING (published_at IS NOT NULL AND published_at <= NOW());
CREATE POLICY "Moderadores podem gerenciar vídeos" ON pcd_videos FOR ALL USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 6. PCD Athletes (Public read active, admin write)
ALTER TABLE pcd_athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver atletas ativos" ON pcd_athletes FOR SELECT USING (active = true);
CREATE POLICY "Admins podem gerenciar atletas" ON pcd_athletes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. PCD Councils (Public read)
ALTER TABLE pcd_councils ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver conselhos ativos" ON pcd_councils FOR SELECT USING (active = true);
CREATE POLICY "Admins podem gerenciar conselhos" ON pcd_councils FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. PCD Products (Public read active, sellers manage own)
ALTER TABLE pcd_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver produtos ativos" ON pcd_products FOR SELECT USING (active = true);
CREATE POLICY "Vendedores podem criar produtos" ON pcd_products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Vendedores podem gerenciar próprios produtos" ON pcd_products FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Admins podem gerenciar produtos" ON pcd_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. PCD Portfolios (Public read, owners manage)
ALTER TABLE pcd_portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver portfólios" ON pcd_portfolios FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar portfólio" ON pcd_portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem gerenciar próprio portfólio" ON pcd_portfolios FOR ALL USING (auth.uid() = user_id);

-- 10. PCD Blog Posts (Public read published, authors manage own)
ALTER TABLE pcd_blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver posts publicados" ON pcd_blog_posts FOR SELECT USING (published_at IS NOT NULL AND published_at <= NOW());
CREATE POLICY "Autores podem criar posts" ON pcd_blog_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Autores podem gerenciar próprios posts" ON pcd_blog_posts FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Moderadores podem gerenciar posts" ON pcd_blog_posts FOR ALL USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 11. PCD Courses (Public read published, admin write)
ALTER TABLE pcd_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver cursos publicados" ON pcd_courses FOR SELECT USING (published_at IS NOT NULL AND published_at <= NOW());
CREATE POLICY "Admins podem gerenciar cursos" ON pcd_courses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. PCD Benefits (Public read active, admin write)
ALTER TABLE pcd_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver benefícios ativos" ON pcd_benefits FOR SELECT USING (active = true);
CREATE POLICY "Admins podem gerenciar benefícios" ON pcd_benefits FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 13. PCD Campaigns (Public read active, creators manage own)
ALTER TABLE pcd_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver campanhas ativas" ON pcd_campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Criadores podem criar campanhas" ON pcd_campaigns FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Criadores podem gerenciar próprias campanhas" ON pcd_campaigns FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Admins podem gerenciar campanhas" ON pcd_campaigns FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_pcd_articles_original ON pcd_articles(original_article_id);
CREATE INDEX idx_pcd_legislation_type ON pcd_legislation(type);
CREATE INDEX idx_pcd_complaints_status ON pcd_complaints(status);
CREATE INDEX idx_pcd_complaints_location ON pcd_complaints(location_lat, location_lng);
CREATE INDEX idx_pcd_videos_published ON pcd_videos(published_at);
CREATE INDEX idx_pcd_athletes_state ON pcd_athletes(state, city);
CREATE INDEX idx_pcd_councils_level ON pcd_councils(level, state);
CREATE INDEX idx_pcd_products_seller ON pcd_products(seller_id);
CREATE INDEX idx_pcd_portfolios_user ON pcd_portfolios(user_id);
CREATE INDEX idx_pcd_blog_posts_author ON pcd_blog_posts(author_id);
CREATE INDEX idx_pcd_campaigns_creator ON pcd_campaigns(creator_id);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

INSERT INTO pcd_config (module, settings, active) VALUES
  ('pcd_plus', '{"accessibility_default": "medio", "ai_simplification": true}'::jsonb, true),
  ('pcd_direitos', '{"auto_update_legislation": true}'::jsonb, true),
  ('pcd_alerta', '{"public_map": true, "auto_notify_authorities": true}'::jsonb, true),
  ('pcd_play', '{"auto_generate_subtitles": true}'::jsonb, true),
  ('pcd_esportes', '{"featured_athletes_count": 6}'::jsonb, true),
  ('pcd_conselhos', '{"show_meeting_calendar": true}'::jsonb, true),
  ('pcd_shop', '{"commission_rate": 0.20, "min_stock_alert": 5}'::jsonb, true),
  ('pcd_vitrine', '{"free_portfolios_per_user": 1}'::jsonb, true),
  ('pcd_blog', '{"moderation_enabled": true, "ai_writing_assistance": true}'::jsonb, true),
  ('pcd_academy', '{"auto_generate_certificates": true}'::jsonb, true),
  ('pcd_clube', '{"featured_benefits_count": 10}'::jsonb, true),
  ('pcd_rede_bem', '{"verification_required": true}'::jsonb, true)
ON CONFLICT (module) DO NOTHING;