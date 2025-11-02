-- Adicionar políticas RLS para permitir admin/moderator acessar comunidade sem assinatura

-- Políticas para community_posts
CREATE POLICY "Admins e moderadores podem ver todos os posts"
ON community_posts FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins e moderadores podem criar posts"
ON community_posts FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'moderator'::app_role))
);

CREATE POLICY "Admins e moderadores podem atualizar qualquer post"
ON community_posts FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins e moderadores podem deletar qualquer post"
ON community_posts FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Políticas para community_comments
CREATE POLICY "Admins e moderadores podem ver todos os comentários"
ON community_comments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins e moderadores podem criar comentários"
ON community_comments FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'moderator'::app_role))
);

CREATE POLICY "Admins e moderadores podem atualizar qualquer comentário"
ON community_comments FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins e moderadores podem deletar qualquer comentário"
ON community_comments FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Políticas para community_likes
CREATE POLICY "Admins e moderadores podem ver todos os likes"
ON community_likes FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins e moderadores podem dar like"
ON community_likes FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'moderator'::app_role))
);

CREATE POLICY "Admins e moderadores podem remover qualquer like"
ON community_likes FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);