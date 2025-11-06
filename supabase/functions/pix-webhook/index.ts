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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { txid, status } = await req.json();
    
    if (!txid) {
      throw new Error('txid é obrigatório');
    }

    console.log('Webhook PIX recebido:', txid, status);

    // Buscar pagamento PIX
    const { data: pixPayment, error: pixError } = await supabaseAdmin
      .from('pix_payments')
      .select('transaction_id')
      .eq('txid', txid)
      .single();

    if (pixError || !pixPayment) {
      console.error('Pagamento PIX não encontrado:', txid);
      throw new Error('Pagamento não encontrado');
    }

    // Buscar transação
    const { data: transaction, error: transError } = await supabaseAdmin
      .from('payment_transactions')
      .select('*, metadata')
      .eq('id', pixPayment.transaction_id)
      .single();

    if (transError || !transaction) {
      throw new Error('Transação não encontrada');
    }

    // Se já foi processada, retornar sucesso
    if (transaction.status === 'completed') {
      console.log('Transação já processada:', transaction.id);
      return new Response(
        JSON.stringify({ success: true, message: 'Já processado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status da transação
    const newStatus = status === 'approved' || status === 'paid' ? 'completed' : 'failed';
    
    const { error: updateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Erro ao atualizar transação:', updateError);
      throw updateError;
    }

    if (newStatus === 'completed') {
      const metadata = transaction.metadata as any;
      const planId = metadata?.plan_id;

      if (planId) {
        // Verificar se já tem assinatura ativa
        const { data: existingSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', transaction.user_id)
          .eq('status', 'active')
          .single();

        if (!existingSub) {
          // Criar assinatura
          const { error: subError } = await supabaseAdmin
            .from('user_subscriptions')
            .insert({
              user_id: transaction.user_id,
              plan_id: planId,
              status: 'active',
              started_at: new Date().toISOString(),
            });

          if (subError) {
            console.error('Erro ao criar assinatura:', subError);
          } else {
            console.log('Assinatura criada para usuário:', transaction.user_id);
          }
        } else {
          console.log('Usuário já possui assinatura ativa');
        }
      }

      // TODO: Gerar recibo automaticamente
      // await supabase.functions.invoke('generate-receipt', {
      //   body: { transactionId: transaction.id }
      // });
    }

    console.log('Webhook PIX processado com sucesso:', txid);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro em pix-webhook:', error);
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