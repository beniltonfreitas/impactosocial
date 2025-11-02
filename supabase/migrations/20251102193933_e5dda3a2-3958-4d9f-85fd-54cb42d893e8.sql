-- Criar tabela article_gallery para galeria de imagens
CREATE TABLE IF NOT EXISTS public.article_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  credit TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para buscar imagens por artigo
CREATE INDEX idx_article_gallery_article_id ON public.article_gallery(article_id);

-- RLS para article_gallery
ALTER TABLE public.article_gallery ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem ver galeria de artigos publicados"
ON public.article_gallery FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.articles
    WHERE articles.id = article_gallery.article_id
    AND articles.published_at IS NOT NULL
  )
);

CREATE POLICY "Admins e moderadores podem gerenciar galeria"
ON public.article_gallery FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_article_gallery_updated_at
BEFORE UPDATE ON public.article_gallery
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();