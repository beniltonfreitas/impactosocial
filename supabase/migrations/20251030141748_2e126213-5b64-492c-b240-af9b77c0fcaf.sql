-- 1. Adicionar novas categorias baseadas na Agência Brasil
INSERT INTO categories (name, slug, color) VALUES
  ('Segurança', 'seguranca', '#EF4444'),
  ('Cidades', 'cidades', '#06B6D4'),
  ('Rural/Agronegócio', 'rural-agronegocio', '#84CC16'),
  ('Governo', 'governo', '#6366F1')
ON CONFLICT (slug) DO NOTHING;

-- 2. Adicionar novas colunas na tabela articles para campos avançados
ALTER TABLE articles 
  ADD COLUMN IF NOT EXISTS image_og_url TEXT,
  ADD COLUMN IF NOT EXISTS image_card_url TEXT,
  ADD COLUMN IF NOT EXISTS image_credit TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_meta_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_meta_description TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'scheduled'));

-- 3. Adicionar índice GIN para busca eficiente em tags
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);

-- 4. Adicionar índice para status
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

-- 5. Comentários para documentação
COMMENT ON COLUMN articles.image_og_url IS 'URL da imagem Open Graph (1200x630) para compartilhamento social';
COMMENT ON COLUMN articles.image_card_url IS 'URL da imagem Card (800x450) para thumbnails';
COMMENT ON COLUMN articles.image_credit IS 'Crédito da imagem (fotógrafo/agência)';
COMMENT ON COLUMN articles.source_url IS 'URL da matéria original (para reescrita com IA)';
COMMENT ON COLUMN articles.gallery_images IS 'Array de URLs de imagens da galeria';
COMMENT ON COLUMN articles.tags IS 'Array de tags/palavras-chave do artigo';
COMMENT ON COLUMN articles.seo_meta_title IS 'Meta título customizado para SEO (máx 60 chars)';
COMMENT ON COLUMN articles.seo_meta_description IS 'Meta descrição customizada para SEO (máx 160 chars)';
COMMENT ON COLUMN articles.status IS 'Status: draft (rascunho), published (publicado), scheduled (agendado)';