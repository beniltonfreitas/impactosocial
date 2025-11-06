-- Função helper para agrupar publicações por período
CREATE OR REPLACE FUNCTION get_publications_by_period(
  date_format TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  period TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('
    SELECT
      %s as period,
      COUNT(*)::BIGINT as count
    FROM articles
    WHERE status = ''published''
      AND published_at >= $1
      AND published_at <= $2
      AND published_at IS NOT NULL
    GROUP BY period
    ORDER BY period ASC
  ', date_format)
  USING start_date, end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar extensões necessárias para cron job
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;