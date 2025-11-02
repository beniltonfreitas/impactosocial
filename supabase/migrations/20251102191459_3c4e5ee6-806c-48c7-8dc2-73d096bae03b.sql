-- Tabela de Postagens da Comunidade
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'none')) DEFAULT 'none',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  visibility TEXT DEFAULT 'members' CHECK (visibility IN ('members', 'public')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Curtidas
CREATE TABLE public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Tabela de Comentários
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Perfis Públicos Premium
CREATE TABLE public.community_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio TEXT,
  location TEXT,
  public_url TEXT UNIQUE,
  social_links JSONB DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Pontos e Ações
CREATE TABLE public.community_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('post', 'like', 'comment', 'referral', 'challenge')),
  points INTEGER NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Ranking (view materializada para performance)
CREATE MATERIALIZED VIEW public.community_ranking AS
SELECT 
  user_id,
  SUM(points) as total_points,
  COUNT(*) as total_actions,
  RANK() OVER (ORDER BY SUM(points) DESC) as rank_position,
  CASE 
    WHEN SUM(points) >= 1000 THEN 'Líder'
    WHEN SUM(points) >= 500 THEN 'Conectado'
    WHEN SUM(points) >= 100 THEN 'Engajado'
    ELSE 'Iniciante'
  END as level
FROM public.community_points
GROUP BY user_id;

-- Criar índices para otimização
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX idx_community_likes_user_id ON community_likes(user_id);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_community_points_user_id ON community_points(user_id);
CREATE INDEX idx_community_profiles_user_id ON community_profiles(user_id);
CREATE INDEX idx_community_profiles_public_url ON community_profiles(public_url);

-- Habilitar RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_points ENABLE ROW LEVEL SECURITY;

-- Policies RLS para community_posts
CREATE POLICY "Premium members can view posts"
ON community_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

CREATE POLICY "Premium members can create posts"
ON community_posts FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

CREATE POLICY "Users can update own posts"
ON community_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON community_posts FOR DELETE
USING (auth.uid() = user_id);

-- Policies para community_likes
CREATE POLICY "Premium members can view likes"
ON community_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

CREATE POLICY "Premium members can like"
ON community_likes FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

CREATE POLICY "Users can unlike own likes"
ON community_likes FOR DELETE
USING (auth.uid() = user_id);

-- Policies para community_comments
CREATE POLICY "Premium members can view comments"
ON community_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

CREATE POLICY "Premium members can comment"
ON community_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

CREATE POLICY "Users can update own comments"
ON community_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON community_comments FOR DELETE
USING (auth.uid() = user_id);

-- Policies para community_profiles
CREATE POLICY "Premium members can view profiles"
ON community_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
  ) OR TRUE -- Perfis públicos são visíveis para todos
);

CREATE POLICY "Users can manage own profile"
ON community_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies para community_points (apenas leitura para usuários)
CREATE POLICY "Users can view own points"
ON community_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all points"
ON community_points FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar contadores de posts
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'community_likes' THEN
      UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
      UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'community_likes' THEN
      UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
      UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON community_likes
FOR EACH ROW EXECUTE FUNCTION update_post_counters();

CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON community_comments
FOR EACH ROW EXECUTE FUNCTION update_post_counters();

-- Trigger para adicionar pontos automaticamente
CREATE OR REPLACE FUNCTION add_community_points()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'community_posts' AND TG_OP = 'INSERT' THEN
    INSERT INTO community_points (user_id, action, points, reference_id)
    VALUES (NEW.user_id, 'post', 10, NEW.id);
  ELSIF TG_TABLE_NAME = 'community_likes' AND TG_OP = 'INSERT' THEN
    INSERT INTO community_points (user_id, action, points, reference_id)
    VALUES (NEW.user_id, 'like', 2, NEW.post_id);
  ELSIF TG_TABLE_NAME = 'community_comments' AND TG_OP = 'INSERT' THEN
    INSERT INTO community_points (user_id, action, points, reference_id)
    VALUES (NEW.user_id, 'comment', 5, NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_points_post
AFTER INSERT ON community_posts
FOR EACH ROW EXECUTE FUNCTION add_community_points();

CREATE TRIGGER trigger_points_like
AFTER INSERT ON community_likes
FOR EACH ROW EXECUTE FUNCTION add_community_points();

CREATE TRIGGER trigger_points_comment
AFTER INSERT ON community_comments
FOR EACH ROW EXECUTE FUNCTION add_community_points();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
BEFORE UPDATE ON community_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_profiles_updated_at
BEFORE UPDATE ON community_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para recompensar indicações quando há conversão
CREATE OR REPLACE FUNCTION reward_referral_conversion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_id UUID;
BEGIN
  -- Se é nova assinatura ativa
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'active') THEN
    -- Buscar quem indicou este usuário através dos cliques de referral
    SELECT cr.user_id INTO referrer_id
    FROM community_referrals cr
    WHERE NEW.user_id = auth.uid()
    LIMIT 1;

    IF referrer_id IS NOT NULL THEN
      -- Adicionar pontos de indicação
      INSERT INTO community_points (user_id, action, points, reference_id)
      VALUES (referrer_id, 'referral', 50, NEW.user_id);
      
      -- Incrementar conversões no referral
      UPDATE community_referrals 
      SET conversions = conversions + 1 
      WHERE user_id = referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_reward_referral
AFTER INSERT OR UPDATE ON user_subscriptions
FOR EACH ROW EXECUTE FUNCTION reward_referral_conversion();

-- Criar índice único para refresh do ranking
CREATE UNIQUE INDEX idx_community_ranking_user_id ON community_ranking(user_id);