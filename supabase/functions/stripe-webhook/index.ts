import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY não configurado');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Assinatura do webhook ausente');
    }

    const body = await req.text();
    
    // Validar webhook (em produção, use STRIPE_WEBHOOK_SECRET)
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || stripeKey // Fallback para teste
    );

    console.log('Webhook recebido:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const subscriptionId = session.subscription as string;

        if (!userId || !planId) {
          console.error('Metadata ausente na sessão');
          break;
        }

        // Criar registro de assinatura
        const { error } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            started_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Erro ao criar assinatura:', error);
        } else {
          console.log('Assinatura criada para usuário:', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Atualizar status
        const { error } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('Erro ao atualizar assinatura:', error);
        } else {
          console.log('Assinatura atualizada:', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Cancelar assinatura
        const { error } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            expires_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('Erro ao cancelar assinatura:', error);
        } else {
          console.log('Assinatura cancelada:', subscriptionId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Renovar assinatura
        const { error } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('Erro ao renovar assinatura:', error);
        } else {
          console.log('Assinatura renovada:', subscriptionId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Marcar como pendente
        const { error } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('Erro ao marcar assinatura como pendente:', error);
        } else {
          console.log('Assinatura marcada como pendente:', subscriptionId);
        }
        break;
      }

      default:
        console.log('Evento não tratado:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro em stripe-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
