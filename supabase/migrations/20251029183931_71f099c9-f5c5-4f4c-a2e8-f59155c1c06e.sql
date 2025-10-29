-- Criar bucket para imagens de artigos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS: Todos podem ver imagens (bucket público)
CREATE POLICY "Imagens de artigos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- RLS: Admins e moderadores podem fazer upload
CREATE POLICY "Admins e moderadores podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-images' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
);

-- RLS: Admins e moderadores podem atualizar
CREATE POLICY "Admins e moderadores podem atualizar imagens"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'article-images' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
);

-- RLS: Admins e moderadores podem deletar
CREATE POLICY "Admins e moderadores podem deletar imagens"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-images' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
);

-- Adicionar RLS policies para artigos permitindo admins/moderadores gerenciarem
CREATE POLICY "Admins e moderadores podem criar artigos"
ON articles FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins e moderadores podem atualizar artigos"
ON articles FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins e moderadores podem deletar artigos"
ON articles FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins e moderadores podem ver todos artigos"
ON articles FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
);