-- Adicionar campos de controle de limites e orçamento em ad_campaigns
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS impressions_limit INTEGER,
ADD COLUMN IF NOT EXISTS clicks_limit INTEGER,
ADD COLUMN IF NOT EXISTS impressions_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spent_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5;

-- Criar índice para melhorar performance nas consultas de campanhas ativas
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_limits 
ON ad_campaigns(status, impressions_count, clicks_count, spent_amount) 
WHERE status = 'active';

-- Criar índice para ordenação por prioridade
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_priority
ON ad_campaigns(priority DESC, created_at DESC)
WHERE status = 'active';

-- Adicionar comentários para documentação
COMMENT ON COLUMN ad_campaigns.impressions_limit IS 'Limite máximo de impressões para a campanha';
COMMENT ON COLUMN ad_campaigns.clicks_limit IS 'Limite máximo de cliques para a campanha';
COMMENT ON COLUMN ad_campaigns.impressions_count IS 'Contador de impressões realizadas';
COMMENT ON COLUMN ad_campaigns.clicks_count IS 'Contador de cliques realizados';
COMMENT ON COLUMN ad_campaigns.spent_amount IS 'Valor gasto até o momento (calculado baseado em CPC/CPM)';
COMMENT ON COLUMN ad_campaigns.priority IS 'Prioridade da campanha (1-10, padrão 5) para rotação';