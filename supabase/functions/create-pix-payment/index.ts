import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { planId } = await req.json();
    if (!planId) {
      throw new Error('planId é obrigatório');
    }

    // Buscar plano
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plano não encontrado');
    }

    // Verificar se PIX está habilitado
    const { data: pixConfig } = await supabase
      .from('payment_config')
      .select('config_value')
      .eq('config_key', 'pix_settings')
      .single();

    const pixSettings = pixConfig?.config_value as any;
    if (!pixSettings?.enabled) {
      throw new Error('Pagamento PIX não está habilitado');
    }

    // Gerar txid único
    const txid = crypto.randomUUID();
    
    // Calcular expiração (15 minutos)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // MOCK: Em produção, aqui chamaria API do provedor PIX (Mercado Pago, etc)
    // Por enquanto, gera dados fictícios para desenvolvimento
    const qrCodeText = `00020126580014br.gov.bcb.pix0136${txid}520400005303986540${(plan.price_monthly_cents / 100).toFixed(2)}5802BR5925CONEXAO NA CIDADE6014Sao Paulo62070503***6304`;
    const qrCodeBase64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;

    console.log('Gerando pagamento PIX para usuário:', user.id, 'txid:', txid);

    // Criar transação
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        amount_cents: plan.price_monthly_cents,
        payment_method: 'pix',
        status: 'pending',
        provider: pixSettings.provider || 'mercadopago',
        metadata: {
          plan_id: planId,
          plan_name: plan.name,
          txid,
        },
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      console.error('Erro ao criar transação:', transactionError);
      throw new Error('Erro ao criar transação');
    }

    // Criar registro PIX
    const { error: pixError } = await supabase
      .from('pix_payments')
      .insert({
        transaction_id: transaction.id,
        pix_key: pixSettings.pix_key,
        qr_code_base64: qrCodeBase64,
        qr_code_text: qrCodeText,
        txid,
        expires_at: expiresAt.toISOString(),
      });

    if (pixError) {
      console.error('Erro ao criar PIX:', pixError);
      throw new Error('Erro ao criar pagamento PIX');
    }

    console.log('Pagamento PIX criado com sucesso:', transaction.id);

    return new Response(
      JSON.stringify({
        transaction_id: transaction.id,
        qr_code_base64: qrCodeBase64,
        qr_code_text: qrCodeText,
        txid,
        expires_at: expiresAt.toISOString(),
        amount_cents: plan.price_monthly_cents,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro em create-pix-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});