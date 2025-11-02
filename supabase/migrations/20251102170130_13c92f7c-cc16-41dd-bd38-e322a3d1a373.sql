-- Adicionar policies para admins gerenciarem community_challenges de todos os usuários
CREATE POLICY "Admins podem ver todos os desafios"
ON public.community_challenges
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar todos os desafios"
ON public.community_challenges
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);