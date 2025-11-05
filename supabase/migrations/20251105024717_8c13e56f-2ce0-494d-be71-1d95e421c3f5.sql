-- Criar tipo enum para permissões específicas
CREATE TYPE public.permission_type AS ENUM (
  'rede_pcd',
  'contabilidade', 
  'financeiro',
  'ia_tools',
  'social'
);

-- Criar tabela de permissões de usuários
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission permission_type NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, permission)
);

-- Habilitar RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_permissions
CREATE POLICY "Users can view own permissions"
  ON public.user_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions"
  ON public.user_permissions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Função para verificar permissões específicas
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission permission_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- Inserir permissões padrão para o super admin existente
INSERT INTO public.user_permissions (user_id, permission)
SELECT '6ccfe4a5-ed59-4e4e-8f94-99f23c07c322', unnest(ARRAY['rede_pcd', 'contabilidade', 'financeiro', 'ia_tools', 'social']::permission_type[])
ON CONFLICT (user_id, permission) DO NOTHING;

-- Criar índice para performance
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);

-- Comentários para documentação
COMMENT ON TABLE public.user_permissions IS 'Permissões granulares por usuário para módulos específicos';
COMMENT ON FUNCTION public.has_permission IS 'Verifica se usuário tem permissão específica (admins sempre têm todas)';