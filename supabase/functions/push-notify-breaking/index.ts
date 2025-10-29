import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface Article {
  id: string;
  title: string;
  summary: string;
  slug: string;
  tenant_id: string;
  breaking: boolean;
  published_at: string;
}

// Helper to send Web Push notification
async function sendWebPush(
  subscription: PushSubscription,
  payload: any,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    const vapidHeaders = await generateVAPIDHeaders(
      subscription.endpoint,
      vapidPublicKey,
      vapidPrivateKey
    );

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        ...vapidHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 410 || response.status === 404) {
      console.log(`[push-notify] Subscription expired: ${subscription.id}`);
      return false;
    }

    if (!response.ok) {
      console.error(`[push-notify] Push failed: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[push-notify] Error sending push:', error);
    return false;
  }
}

// Simple VAPID header generation (for demonstration)
async function generateVAPIDHeaders(
  endpoint: string,
  publicKey: string,
  privateKey: string
): Promise<Record<string, string>> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  return {
    'Authorization': `vapid t=${generateJWT(audience, privateKey)}, k=${publicKey}`,
  };
}

// Basic JWT generation for VAPID (simplified)
function generateJWT(audience: string, privateKey: string): string {
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    aud: audience,
    exp: now + 43200, // 12 hours
    sub: 'mailto:admin@conexaonacidade.com.br',
  }));
  
  // Note: In production, you should use proper JWT signing with the private key
  // This is a simplified version for demonstration
  return `${header}.${payload}.signature`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[push-notify] VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { articleId } = await req.json();

    if (!articleId) {
      return new Response(
        JSON.stringify({ error: 'articleId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[push-notify] Processing breaking news for article: ${articleId}`);

    // Fetch article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, summary, slug, tenant_id, breaking, published_at')
      .eq('id', articleId)
      .single<Article>();

    if (articleError || !article) {
      console.error('[push-notify] Article not found:', articleError);
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!article.breaking) {
      console.log('[push-notify] Article is not marked as breaking');
      return new Response(
        JSON.stringify({ message: 'Article is not breaking news' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch push subscriptions for this tenant
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('tenant_id', article.tenant_id);

    if (subsError) {
      console.error('[push-notify] Error fetching subscriptions:', subsError);
      return new Response(
        JSON.stringify({ error: 'Error fetching subscriptions' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[push-notify] No subscriptions found for tenant');
      return new Response(
        JSON.stringify({ message: 'No subscriptions to notify', sent: 0, failed: 0 }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[push-notify] Sending to ${subscriptions.length} subscribers`);

    // Prepare notification payload
    const notificationPayload = {
      title: '🔴 URGENTE',
      body: article.summary || article.title.substring(0, 120),
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `breaking-${article.id}`,
      requireInteraction: true,
      data: {
        url: `/news/${article.slug}`,
        articleId: article.id,
      },
    };

    // Send notifications
    let sent = 0;
    let failed = 0;
    const expiredSubscriptions: string[] = [];

    for (const subscription of subscriptions) {
      const success = await sendWebPush(
        subscription,
        notificationPayload,
        vapidPublicKey,
        vapidPrivateKey
      );

      if (success) {
        sent++;
      } else {
        failed++;
        expiredSubscriptions.push(subscription.id);
      }
    }

    // Remove expired subscriptions
    if (expiredSubscriptions.length > 0) {
      console.log(`[push-notify] Removing ${expiredSubscriptions.length} expired subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
    }

    console.log(`[push-notify] Completed: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent',
        sent,
        failed,
        expired: expiredSubscriptions.length
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[push-notify] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
