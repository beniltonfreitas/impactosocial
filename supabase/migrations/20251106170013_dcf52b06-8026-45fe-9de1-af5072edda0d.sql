-- Histórico completo de transações
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'pix', 'boleto')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'mercadopago', 'pagseguro')),
  provider_transaction_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Pagamentos PIX específicos
CREATE TABLE pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES payment_transactions NOT NULL,
  pix_key TEXT NOT NULL,
  qr_code_base64 TEXT NOT NULL,
  qr_code_text TEXT NOT NULL,
  txid TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recibos emitidos
CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES payment_transactions UNIQUE NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_data JSONB NOT NULL
);

-- Configurações de pagamento
CREATE TABLE payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO payment_config (config_key, config_value) VALUES
('pix_settings', '{"enabled": false, "pix_key": "", "provider": "mercadopago"}'::jsonb),
('company_data', '{"name": "", "cnpj": "", "address": "", "city": "", "state": "", "cep": ""}'::jsonb),
('receipt_settings', '{"auto_send_email": true, "logo_url": "", "next_receipt_number": 1}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- RLS Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar tudo
CREATE POLICY "Admins can manage transactions" ON payment_transactions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage pix_payments" ON pix_payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage receipts" ON payment_receipts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage payment_config" ON payment_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver próprias transações
CREATE POLICY "Users can view own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own receipts" ON payment_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payment_transactions pt
      WHERE pt.id = payment_receipts.transaction_id
      AND pt.user_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX payment_transactions_user_idx ON payment_transactions(user_id);
CREATE INDEX payment_transactions_status_idx ON payment_transactions(status);
CREATE INDEX payment_transactions_created_idx ON payment_transactions(created_at DESC);
CREATE INDEX pix_payments_txid_idx ON pix_payments(txid);
CREATE INDEX payment_receipts_transaction_idx ON payment_receipts(transaction_id);

-- Storage bucket para recibos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage
CREATE POLICY "Users can view own receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-receipts' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "System can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-receipts' AND
    has_role(auth.uid(), 'admin'::app_role)
  );