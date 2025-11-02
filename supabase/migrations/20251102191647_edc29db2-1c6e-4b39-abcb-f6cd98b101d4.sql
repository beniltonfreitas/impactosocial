-- Habilitar RLS na materialized view community_ranking
-- Como é uma view materializada, precisamos recriá-la com políticas de acesso

-- Primeiro, criar uma função para atualizar o ranking
CREATE OR REPLACE FUNCTION refresh_community_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY community_ranking;
END;
$$;

-- Adicionar RLS na view materializada não é suportado diretamente
-- Então vamos criar uma função helper para acessar o ranking de forma segura

CREATE OR REPLACE FUNCTION get_community_ranking(limit_rows INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  total_points BIGINT,
  total_actions BIGINT,
  rank_position BIGINT,
  level TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, total_points, total_actions, rank_position, level
  FROM community_ranking
  ORDER BY rank_position
  LIMIT limit_rows;
$$;

CREATE OR REPLACE FUNCTION get_user_ranking(target_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  total_points BIGINT,
  total_actions BIGINT,
  rank_position BIGINT,
  level TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, total_points, total_actions, rank_position, level
  FROM community_ranking
  WHERE user_id = target_user_id;
$$;