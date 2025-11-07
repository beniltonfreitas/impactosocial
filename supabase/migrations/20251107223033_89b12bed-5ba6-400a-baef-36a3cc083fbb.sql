-- Criar tabela de versões de artigos
CREATE TABLE article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  image_og_url TEXT,
  image_card_url TEXT,
  author TEXT,
  tags TEXT[],
  category_id UUID REFERENCES categories(id),
  status TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT,
  full_data JSONB,
  UNIQUE(article_id, version_number)
);

CREATE INDEX idx_article_versions_article ON article_versions(article_id);
CREATE INDEX idx_article_versions_created ON article_versions(created_at DESC);

-- RLS policies para article_versions
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e moderadores podem ver versões"
  ON article_versions FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Sistema pode inserir versões"
  ON article_versions FOR INSERT
  WITH CHECK (true);

-- Trigger para criar versões automaticamente
CREATE OR REPLACE FUNCTION create_article_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.content IS DISTINCT FROM NEW.content OR
      OLD.summary IS DISTINCT FROM NEW.summary OR
      OLD.status IS DISTINCT FROM NEW.status
    ) THEN
      SELECT COALESCE(MAX(version_number), 0) + 1
      INTO next_version
      FROM article_versions
      WHERE article_id = NEW.id;

      INSERT INTO article_versions (
        article_id,
        version_number,
        title,
        slug,
        summary,
        content,
        image_url,
        image_og_url,
        image_card_url,
        author,
        tags,
        category_id,
        status,
        published_at,
        created_by,
        change_summary,
        full_data
      ) VALUES (
        OLD.id,
        next_version,
        OLD.title,
        OLD.slug,
        OLD.summary,
        OLD.content,
        OLD.image_url,
        OLD.image_og_url,
        OLD.image_card_url,
        OLD.author,
        OLD.tags,
        OLD.category_id,
        OLD.status,
        OLD.published_at,
        auth.uid(),
        'Versão criada automaticamente',
        row_to_json(OLD)::jsonb
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER article_version_trigger
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION create_article_version();

-- Criar tabela de agendamentos
CREATE TABLE article_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE UNIQUE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'cancelled')),
  notification_sent_at TIMESTAMPTZ,
  notification_hours_before INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX idx_article_schedule_date ON article_schedule(scheduled_for);
CREATE INDEX idx_article_schedule_status ON article_schedule(status);

-- RLS policies para article_schedule
ALTER TABLE article_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e moderadores gerenciam agendamentos"
  ON article_schedule FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  );