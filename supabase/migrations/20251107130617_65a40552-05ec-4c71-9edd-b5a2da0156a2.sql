-- Criar tabela de notificações do sistema
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'info', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_notifications_user ON system_notifications(user_id);
CREATE INDEX idx_system_notifications_read ON system_notifications(read);
CREATE INDEX idx_system_notifications_created ON system_notifications(created_at DESC);

-- RLS Policies para system_notifications
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON system_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON system_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar tabela de controle de notificações de campanhas
CREATE TABLE IF NOT EXISTS campaign_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_notifications_campaign ON campaign_notifications(campaign_id);
CREATE INDEX idx_campaign_notifications_type ON campaign_notifications(type);

-- Adicionar campo created_by em ad_campaigns
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Preencher created_by com primeiro admin encontrado (temporário)
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    UPDATE ad_campaigns 
    SET created_by = admin_id
    WHERE created_by IS NULL;
  END IF;
END $$;