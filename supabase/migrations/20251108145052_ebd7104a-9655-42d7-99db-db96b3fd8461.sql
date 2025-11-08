-- PARTE 1: WORKFLOW DE APROVAÇÃO

-- Criar enums para workflow
CREATE TYPE workflow_status AS ENUM (
  'draft',
  'submitted_for_review',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
  'scheduled',
  'published'
);

CREATE TYPE workflow_action AS ENUM (
  'submit',
  'assign_reviewer',
  'add_comment',
  'request_changes',
  'approve',
  'reject',
  'schedule',
  'publish'
);

CREATE TYPE comment_type AS ENUM ('general', 'inline', 'suggestion');
CREATE TYPE comment_status AS ENUM ('open', 'resolved', 'wont_fix');

-- Tabela de workflow de artigos
CREATE TABLE article_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  
  current_status workflow_status NOT NULL DEFAULT 'draft',
  previous_status workflow_status,
  
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  assigned_reviewer UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  priority INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ,
  estimated_publish_time TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_article_workflow UNIQUE(article_id)
);

CREATE INDEX idx_workflow_status ON article_workflow(current_status);
CREATE INDEX idx_workflow_reviewer ON article_workflow(assigned_reviewer);
CREATE INDEX idx_workflow_deadline ON article_workflow(deadline);

-- Tabela de histórico de workflow
CREATE TABLE article_workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES article_workflow(id) ON DELETE CASCADE,
  
  action workflow_action NOT NULL,
  from_status workflow_status,
  to_status workflow_status NOT NULL,
  
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_workflow_history_workflow ON article_workflow_history(workflow_id);
CREATE INDEX idx_workflow_history_date ON article_workflow_history(performed_at);

-- Tabela de comentários de revisão
CREATE TABLE article_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES article_workflow(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  
  comment_type comment_type NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  
  field_name TEXT,
  selection_start INTEGER,
  selection_end INTEGER,
  selected_text TEXT,
  
  status comment_status NOT NULL DEFAULT 'open',
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  
  parent_comment_id UUID REFERENCES article_review_comments(id) ON DELETE CASCADE,
  thread_order INTEGER DEFAULT 0
);

CREATE INDEX idx_review_comments_workflow ON article_review_comments(workflow_id);
CREATE INDEX idx_review_comments_article ON article_review_comments(article_id);
CREATE INDEX idx_review_comments_status ON article_review_comments(status);
CREATE INDEX idx_review_comments_parent ON article_review_comments(parent_comment_id);

-- RLS Policies para workflow
ALTER TABLE article_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Editores podem ver próprios workflows"
  ON article_workflow FOR SELECT
  USING (
    auth.uid() = submitted_by OR
    auth.uid() = assigned_reviewer OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Editores podem criar workflows"
  ON article_workflow FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Revisores e admins podem atualizar workflows"
  ON article_workflow FOR UPDATE
  USING (
    auth.uid() = assigned_reviewer OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  );

-- RLS para histórico
ALTER TABLE article_workflow_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes podem ver histórico"
  ON article_workflow_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM article_workflow w
      WHERE w.id = article_workflow_history.workflow_id
      AND (
        auth.uid() = w.submitted_by OR
        auth.uid() = w.assigned_reviewer OR
        has_role(auth.uid(), 'admin'::app_role) OR
        has_role(auth.uid(), 'moderator'::app_role)
      )
    )
  );

-- RLS para comentários
ALTER TABLE article_review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes podem ver comentários"
  ON article_review_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM article_workflow w
      WHERE w.id = article_review_comments.workflow_id
      AND (
        auth.uid() = w.submitted_by OR
        auth.uid() = w.assigned_reviewer OR
        has_role(auth.uid(), 'admin'::app_role) OR
        has_role(auth.uid(), 'moderator'::app_role)
      )
    )
  );

CREATE POLICY "Participantes podem criar comentários"
  ON article_review_comments FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Autor pode atualizar próprios comentários"
  ON article_review_comments FOR UPDATE
  USING (auth.uid() = created_by);

-- Funções e Triggers para workflow
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workflow_updated_at
  BEFORE UPDATE ON article_workflow
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_updated_at();

CREATE OR REPLACE FUNCTION log_workflow_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO article_workflow_history (
      workflow_id,
      action,
      from_status,
      to_status,
      performed_by
    ) VALUES (
      NEW.id,
      'status_change'::workflow_action,
      OLD.current_status,
      NEW.current_status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_workflow_transition
  AFTER UPDATE ON article_workflow
  FOR EACH ROW
  EXECUTE FUNCTION log_workflow_transition();

CREATE OR REPLACE FUNCTION notify_reviewer_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_status = 'submitted_for_review' AND NEW.assigned_reviewer IS NOT NULL THEN
    INSERT INTO system_notifications (
      user_id,
      type,
      title,
      message,
      action,
      read
    ) VALUES (
      NEW.assigned_reviewer,
      'info',
      '📝 Novo artigo para revisar',
      'Um artigo foi submetido para sua revisão.',
      jsonb_build_object(
        'label', 'Revisar artigo',
        'href', '/admin/articles?id=' || NEW.article_id::text
      ),
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_reviewer
  AFTER INSERT OR UPDATE ON article_workflow
  FOR EACH ROW
  EXECUTE FUNCTION notify_reviewer_on_submission();

-- PARTE 2: ANALYTICS PREDITIVO

-- Tabela de analytics de publicação
CREATE TABLE publication_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  
  published_at TIMESTAMPTZ NOT NULL,
  publish_hour INTEGER NOT NULL,
  publish_day_of_week INTEGER NOT NULL,
  category_id UUID REFERENCES categories(id),
  
  views_first_hour INTEGER DEFAULT 0,
  views_first_3_hours INTEGER DEFAULT 0,
  views_first_24_hours INTEGER DEFAULT 0,
  views_total INTEGER DEFAULT 0,
  
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  avg_read_time_seconds INTEGER,
  
  performance_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_article_analytics UNIQUE(article_id)
);

CREATE INDEX idx_analytics_category ON publication_analytics(category_id);
CREATE INDEX idx_analytics_hour ON publication_analytics(publish_hour);
CREATE INDEX idx_analytics_day ON publication_analytics(publish_day_of_week);
CREATE INDEX idx_analytics_score ON publication_analytics(performance_score);

-- Tabela de horários ótimos
CREATE TABLE optimal_publishing_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category_id UUID NOT NULL REFERENCES categories(id),
  day_of_week INTEGER NOT NULL,
  hour INTEGER NOT NULL,
  
  total_publications INTEGER DEFAULT 0,
  avg_views_first_hour DECIMAL(10,2),
  avg_views_first_24_hours DECIMAL(10,2),
  avg_performance_score DECIMAL(5,2),
  
  rank_position INTEGER,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_optimal_time UNIQUE(category_id, day_of_week, hour)
);

CREATE INDEX idx_optimal_category ON optimal_publishing_times(category_id);
CREATE INDEX idx_optimal_rank ON optimal_publishing_times(rank_position);

-- RLS para analytics
ALTER TABLE publication_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver analytics"
  ON publication_analytics FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

ALTER TABLE optimal_publishing_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e editores podem ver horários ótimos"
  ON optimal_publishing_times FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Funções para cálculo de analytics
CREATE OR REPLACE FUNCTION calculate_performance_score(
  p_views_first_hour INTEGER,
  p_views_first_24_hours INTEGER,
  p_comments INTEGER,
  p_shares INTEGER
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_score DECIMAL(5,2);
  v_view_score DECIMAL;
  v_engagement_score DECIMAL;
BEGIN
  v_view_score := (
    (p_views_first_hour * 2.0) + 
    (p_views_first_24_hours * 0.5)
  ) / 100.0;
  
  v_view_score := LEAST(v_view_score, 60);
  
  v_engagement_score := (
    (p_comments * 5.0) + 
    (p_shares * 3.0)
  ) / 10.0;
  
  v_engagement_score := LEAST(v_engagement_score, 40);
  
  v_score := v_view_score + v_engagement_score;
  
  RETURN LEAST(v_score, 100.0);
END;
$$;

CREATE OR REPLACE FUNCTION update_publication_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO publication_analytics (
    article_id,
    published_at,
    publish_hour,
    publish_day_of_week,
    category_id,
    views_first_hour,
    views_first_3_hours,
    views_first_24_hours,
    views_total,
    comments_count,
    performance_score
  )
  SELECT
    a.id,
    a.published_at,
    EXTRACT(HOUR FROM a.published_at)::INTEGER,
    EXTRACT(DOW FROM a.published_at)::INTEGER,
    a.category_id,
    
    (SELECT COUNT(*) FROM article_views 
     WHERE article_id = a.id 
     AND viewed_at BETWEEN a.published_at AND (a.published_at + INTERVAL '1 hour')),
    
    (SELECT COUNT(*) FROM article_views 
     WHERE article_id = a.id 
     AND viewed_at BETWEEN a.published_at AND (a.published_at + INTERVAL '3 hours')),
    
    (SELECT COUNT(*) FROM article_views 
     WHERE article_id = a.id 
     AND viewed_at BETWEEN a.published_at AND (a.published_at + INTERVAL '24 hours')),
    
    a.views,
    
    (SELECT COUNT(*) FROM comments WHERE article_id = a.id),
    
    0
  FROM articles a
  WHERE a.status = 'published'
    AND a.published_at >= NOW() - INTERVAL '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM publication_analytics pa WHERE pa.article_id = a.id
    )
  ON CONFLICT (article_id) DO UPDATE SET
    views_total = EXCLUDED.views_total,
    comments_count = EXCLUDED.comments_count,
    updated_at = NOW();
  
  UPDATE publication_analytics
  SET performance_score = calculate_performance_score(
    views_first_hour,
    views_first_24_hours,
    comments_count,
    0
  )
  WHERE performance_score IS NULL OR performance_score = 0;
END;
$$;

CREATE OR REPLACE FUNCTION generate_optimal_times()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  TRUNCATE optimal_publishing_times;
  
  INSERT INTO optimal_publishing_times (
    category_id,
    day_of_week,
    hour,
    total_publications,
    avg_views_first_hour,
    avg_views_first_24_hours,
    avg_performance_score
  )
  SELECT
    category_id,
    publish_day_of_week,
    publish_hour,
    COUNT(*) as total_publications,
    AVG(views_first_hour) as avg_views_first_hour,
    AVG(views_first_24_hours) as avg_views_first_24_hours,
    AVG(performance_score) as avg_performance_score
  FROM publication_analytics
  WHERE performance_score IS NOT NULL
  GROUP BY category_id, publish_day_of_week, publish_hour
  HAVING COUNT(*) >= 3;
  
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY category_id, day_of_week
        ORDER BY avg_performance_score DESC
      ) as rank
    FROM optimal_publishing_times
  )
  UPDATE optimal_publishing_times opt
  SET rank_position = ranked.rank
  FROM ranked
  WHERE opt.id = ranked.id;
END;
$$;