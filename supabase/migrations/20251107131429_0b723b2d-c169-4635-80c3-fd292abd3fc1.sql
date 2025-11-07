-- Habilitar RLS na tabela campaign_notifications
ALTER TABLE campaign_notifications ENABLE ROW LEVEL SECURITY;

-- Policy para admins verem todas as notificações de campanhas
CREATE POLICY "Admins can view all campaign notifications"
  ON campaign_notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy para moderadores verem notificações de campanhas
CREATE POLICY "Moderators can view campaign notifications"
  ON campaign_notifications FOR SELECT
  USING (has_role(auth.uid(), 'moderator'::app_role));