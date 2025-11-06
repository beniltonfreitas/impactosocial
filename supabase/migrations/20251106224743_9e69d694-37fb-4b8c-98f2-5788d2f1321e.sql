-- =====================================================
-- IMPACTO SOCIAL PCD COTIA - DATABASE STRUCTURE
-- =====================================================

-- Tabela de usuários do Impacto Social
CREATE TABLE IF NOT EXISTS impacto_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT,
  telefone TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pontos INTEGER DEFAULT 0 CHECK (pontos >= 0),
  nivel TEXT DEFAULT 'Agente',
  link_indicacao TEXT UNIQUE,
  ref_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS impacto_usuarios_email_idx ON impacto_usuarios(email);
CREATE INDEX IF NOT EXISTS impacto_usuarios_ref_code_idx ON impacto_usuarios(ref_code);
CREATE INDEX IF NOT EXISTS impacto_usuarios_user_id_idx ON impacto_usuarios(user_id);

-- RLS para impacto_usuarios
ALTER TABLE impacto_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprio registro"
  ON impacto_usuarios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar próprio registro"
  ON impacto_usuarios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprio registro"
  ON impacto_usuarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os registros"
  ON impacto_usuarios FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar todos os registros"
  ON impacto_usuarios FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de assinaturas/pagamentos
CREATE TABLE IF NOT EXISTS impacto_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impacto_user_id UUID REFERENCES impacto_usuarios NOT NULL,
  valor_cents INTEGER NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('PIX', 'CARTAO')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado', 'cancelado')),
  data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pontos_creditados INTEGER DEFAULT 0,
  transacao_id TEXT UNIQUE NOT NULL,
  external_reference JSONB,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS impacto_assinaturas_user_idx ON impacto_assinaturas(impacto_user_id);
CREATE INDEX IF NOT EXISTS impacto_assinaturas_transacao_idx ON impacto_assinaturas(transacao_id);
CREATE INDEX IF NOT EXISTS impacto_assinaturas_status_idx ON impacto_assinaturas(status);

-- RLS para impacto_assinaturas
ALTER TABLE impacto_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprias assinaturas"
  ON impacto_assinaturas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM impacto_usuarios
      WHERE impacto_usuarios.id = impacto_assinaturas.impacto_user_id
      AND impacto_usuarios.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem gerenciar todas as assinaturas"
  ON impacto_assinaturas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de desafios
CREATE TABLE IF NOT EXISTS impacto_desafios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  pontos INTEGER DEFAULT 12 CHECK (pontos >= 0),
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed inicial dos 6 desafios
INSERT INTO impacto_desafios (titulo, descricao, pontos, ordem) VALUES
  ('Cadastrar-se na plataforma', 'Complete seu cadastro e faça parte da comunidade', 12, 1),
  ('Convidar 3 amigos', 'Compartilhe seu link e traga 3 pessoas para o impacto', 12, 2),
  ('Participar de 1 evento local', 'Compareça a um evento de inclusão PcD', 12, 3),
  ('Concluir 1 ação solidária', 'Realize uma ação solidária documentada', 12, 4),
  ('Postar sua história de impacto', 'Compartilhe como você faz diferença', 12, 5),
  ('Responder pesquisa de acessibilidade', 'Ajude-nos a melhorar com seu feedback', 12, 6)
ON CONFLICT DO NOTHING;

-- RLS para impacto_desafios
ALTER TABLE impacto_desafios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver desafios ativos"
  ON impacto_desafios FOR SELECT
  USING (status = 'ativo');

CREATE POLICY "Admins podem gerenciar desafios"
  ON impacto_desafios FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS impacto_conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impacto_user_id UUID REFERENCES impacto_usuarios NOT NULL,
  desafio_id UUID REFERENCES impacto_desafios NOT NULL,
  data_conclusao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pontos_ganhos INTEGER NOT NULL,
  validado_por UUID REFERENCES auth.users,
  validado_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(impacto_user_id, desafio_id)
);

CREATE INDEX IF NOT EXISTS impacto_conquistas_user_idx ON impacto_conquistas(impacto_user_id);
CREATE INDEX IF NOT EXISTS impacto_conquistas_desafio_idx ON impacto_conquistas(desafio_id);

-- RLS para impacto_conquistas
ALTER TABLE impacto_conquistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver próprias conquistas"
  ON impacto_conquistas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM impacto_usuarios
      WHERE impacto_usuarios.id = impacto_conquistas.impacto_user_id
      AND impacto_usuarios.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem gerenciar conquistas"
  ON impacto_conquistas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de indicações
CREATE TABLE IF NOT EXISTS impacto_indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES impacto_usuarios NOT NULL,
  referred_id UUID REFERENCES impacto_usuarios,
  ref_code_usado TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmado')),
  pontos_bonus INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmado_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS impacto_indicacoes_referrer_idx ON impacto_indicacoes(referrer_id);
CREATE INDEX IF NOT EXISTS impacto_indicacoes_referred_idx ON impacto_indicacoes(referred_id);
CREATE INDEX IF NOT EXISTS impacto_indicacoes_status_idx ON impacto_indicacoes(status);

-- RLS para impacto_indicacoes
ALTER TABLE impacto_indicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver indicações onde são referrer"
  ON impacto_indicacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM impacto_usuarios
      WHERE impacto_usuarios.id = impacto_indicacoes.referrer_id
      AND impacto_usuarios.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem gerenciar indicações"
  ON impacto_indicacoes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_impacto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_impacto_usuarios_updated_at
  BEFORE UPDATE ON impacto_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_impacto_updated_at();