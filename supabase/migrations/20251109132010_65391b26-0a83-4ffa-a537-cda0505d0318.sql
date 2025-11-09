-- Criar índice único para slugs (prevenir duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Índices de performance para queries comuns
CREATE INDEX IF NOT EXISTS idx_articles_published_status 
  ON articles(published_at DESC, status) 
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_category_published 
  ON articles(category_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_tenant_published 
  ON articles(tenant_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_views 
  ON articles(views DESC);