-- Adicionar políticas RLS para permitir admins e moderadores gerenciarem categorias

-- Política para INSERT
CREATE POLICY "Admins e moderadores podem criar categorias"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Política para UPDATE
CREATE POLICY "Admins e moderadores podem atualizar categorias"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Política para DELETE
CREATE POLICY "Admins e moderadores podem deletar categorias"
ON public.categories
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);