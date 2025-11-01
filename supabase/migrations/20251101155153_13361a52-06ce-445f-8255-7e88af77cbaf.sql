-- ============================================
-- DESAFIO SOCIAL - Sistema de Gamificação
-- ============================================

-- 1. Tabela: social_challenges (12 desafios oficiais)
CREATE TABLE IF NOT EXISTS public.social_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_number INTEGER NOT NULL UNIQUE CHECK (challenge_number BETWEEN 1 AND 12),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela: user_challenge_progress (progresso individual)
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.social_challenges(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- 3. Tabela: social_challenge_stats (estatísticas consolidadas)
CREATE TABLE IF NOT EXISTS public.social_challenge_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  completed_challenges INTEGER NOT NULL DEFAULT 0,
  pix_points INTEGER NOT NULL DEFAULT 0,
  referral_points INTEGER NOT NULL DEFAULT 0,
  challenge_points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'participando' CHECK (status IN ('participando', 'ativo', 'apoiador_oficial')),
  user_group TEXT,
  rank_position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela: social_challenge_groups (12 grupos oficiais)
CREATE TABLE IF NOT EXISTS public.social_challenge_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_number INTEGER NOT NULL UNIQUE CHECK (group_number BETWEEN 1 AND 12),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SEEDS: 12 Desafios Oficiais
-- ============================================
INSERT INTO public.social_challenges (challenge_number, title, description, icon_emoji, points_reward) VALUES
(1, '12 Amigos', 'Convide 12 pessoas para participarem do PcD Clube', '👥', 12),
(2, '12 Compras', 'Faça 12 compras em parceiros locais (mínimo R$20 cada)', '🛒', 12),
(3, '12 kg de Alimentos', 'Doe 12 kg de alimentos não perecíveis', '🍲', 12),
(4, '12 Depoimentos', 'Avalie 12 parceiros no Google Maps', '⭐', 12),
(5, '12 Assinaturas', 'Recolha 12 assinaturas pela inclusão', '✍️', 12),
(6, '12 Roupas', 'Doe 12 peças de roupa em bom estado', '👕', 12),
(7, '12 Brinquedos', 'Doe 12 brinquedos para crianças', '🧸', 12),
(8, '12 Garrafas PET', 'Entregue 12 garrafas PET para reciclagem', '♻️', 12),
(9, '12 Lençóis', 'Doe 12 cobertores ou lençóis', '🛏️', 12),
(10, '12 Sacolas', 'Use 12 sacolas reutilizáveis ou ecológicas', '🛍️', 12),
(11, '1L de Óleo', 'Doe 1 litro de óleo usado para reciclagem', '🫗', 12),
(12, '12 Caixas de Leite', 'Doe 12 caixas de leite longa vida', '🥛', 12)
ON CONFLICT (challenge_number) DO NOTHING;

-- ============================================
-- SEEDS: 12 Grupos de Participação
-- ============================================
INSERT INTO public.social_challenge_groups (group_number, name, description, slug, icon_emoji) VALUES
(1, 'Mães Atípicas', 'Mães de crianças com deficiência ou condições especiais', 'maes-atipicas', '👩‍👧'),
(2, 'Pessoas com Deficiência', 'Comunidade PcD', 'pcd', '♿'),
(3, 'Motoboys', 'Profissionais de entrega e mototaxistas', 'motoboys', '🏍️'),
(4, 'Taxistas', 'Motoristas de táxi', 'taxistas', '🚕'),
(5, 'Motoristas de App', 'Motoristas Uber, 99, Cabify', 'motoristas-app', '🚗'),
(6, 'Alunos', 'Estudantes de todos os níveis', 'alunos', '🎓'),
(7, 'Empreendedores', 'Donos de negócio e startups', 'empreendedores', '💼'),
(8, 'Educadores', 'Professores e profissionais da educação', 'educadores', '🏫'),
(9, 'Profissionais da Saúde', 'Médicos, enfermeiros, terapeutas', 'saude', '🩺'),
(10, 'Comerciantes', 'Lojistas e comerciantes locais', 'comerciantes', '🏪'),
(11, 'Influenciadores', 'Criadores de conteúdo digital', 'influenciadores', '📱'),
(12, 'Voluntários', 'Pessoas engajadas em ações sociais', 'voluntarios', '🤝')
ON CONFLICT (group_number) DO NOTHING;

-- ============================================
-- FUNÇÃO: Atualizar estatísticas automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.update_social_challenge_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_completed_count INTEGER;
  v_challenge_points INTEGER;
  v_total INTEGER;
  v_new_status TEXT;
  v_pix INTEGER;
  v_referral INTEGER;
BEGIN
  -- Buscar stats atuais
  SELECT pix_points, referral_points INTO v_pix, v_referral
  FROM public.social_challenge_stats
  WHERE user_id = NEW.user_id;
  
  -- Calcular desafios completados
  SELECT COUNT(*) INTO v_completed_count
  FROM public.user_challenge_progress
  WHERE user_id = NEW.user_id AND completed = TRUE;
  
  -- Calcular pontos de desafios
  SELECT COALESCE(SUM(sc.points_reward), 0) INTO v_challenge_points
  FROM public.user_challenge_progress ucp
  JOIN public.social_challenges sc ON sc.id = ucp.challenge_id
  WHERE ucp.user_id = NEW.user_id AND ucp.completed = TRUE;
  
  -- Calcular total
  v_total := v_challenge_points + COALESCE(v_pix, 0) + COALESCE(v_referral, 0);
  
  -- Determinar status
  IF v_completed_count >= 6 THEN
    v_new_status := 'apoiador_oficial';
  ELSIF v_completed_count >= 3 THEN
    v_new_status := 'ativo';
  ELSE
    v_new_status := 'participando';
  END IF;
  
  -- Atualizar ou inserir stats
  INSERT INTO public.social_challenge_stats (
    user_id,
    total_points,
    completed_challenges,
    challenge_points,
    pix_points,
    referral_points,
    status,
    updated_at
  ) VALUES (
    NEW.user_id,
    v_total,
    v_completed_count,
    v_challenge_points,
    COALESCE(v_pix, 0),
    COALESCE(v_referral, 0),
    v_new_status,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = v_total,
    completed_challenges = v_completed_count,
    challenge_points = v_challenge_points,
    status = v_new_status,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Atualizar stats após mudança
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_social_stats ON public.user_challenge_progress;
CREATE TRIGGER trigger_update_social_stats
AFTER INSERT OR UPDATE ON public.user_challenge_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_social_challenge_stats();

-- ============================================
-- FUNÇÃO: Inicializar stats para novos usuários
-- ============================================
CREATE OR REPLACE FUNCTION public.init_social_challenge_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.social_challenge_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Criar stats ao cadastrar usuário
-- ============================================
DROP TRIGGER IF EXISTS trigger_init_social_stats ON auth.users;
CREATE TRIGGER trigger_init_social_stats
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.init_social_challenge_stats();

-- ============================================
-- RLS POLICIES
-- ============================================

-- social_challenges: Todos podem ler
ALTER TABLE public.social_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver desafios"
ON public.social_challenges FOR SELECT
USING (TRUE);

-- user_challenge_progress: Usuários gerenciam próprio progresso
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprio progresso"
ON public.user_challenge_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar próprio progresso"
ON public.user_challenge_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprio progresso"
ON public.user_challenge_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os progressos"
ON public.user_challenge_progress FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- social_challenge_stats: Usuários veem próprias stats, todos veem ranking
ALTER TABLE public.social_challenge_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprias stats"
ON public.social_challenge_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Autenticados podem ver ranking"
ON public.social_challenge_stats FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem atualizar stats"
ON public.social_challenge_stats FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem ver todas stats"
ON public.social_challenge_stats FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- social_challenge_groups: Todos podem ler
ALTER TABLE public.social_challenge_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver grupos"
ON public.social_challenge_groups FOR SELECT
USING (TRUE);

-- ============================================
-- ÍNDICES para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user_id ON public.user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_completed ON public.user_challenge_progress(completed);
CREATE INDEX IF NOT EXISTS idx_social_challenge_stats_total_points ON public.social_challenge_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_social_challenge_stats_user_id ON public.social_challenge_stats(user_id);

-- ============================================
-- Inicializar stats para usuários existentes
-- ============================================
INSERT INTO public.social_challenge_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;