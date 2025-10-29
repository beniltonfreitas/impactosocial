import { supabase } from "@/integrations/supabase/client";

// Convert base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Request notification permission from browser
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Este navegador não suporta notificações');
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('Este navegador não suporta Service Workers');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(tenantId: string): Promise<void> {
  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada');
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Fetch VAPID public key from edge function
    const { data: vapidData, error: vapidError } = await supabase.functions.invoke(
      'push-vapid-key',
      { method: 'GET' }
    );

    if (vapidError || !vapidData?.publicKey) {
      console.error('[push] Error fetching VAPID key:', vapidError);
      throw new Error('Erro ao buscar chave de notificação');
    }

    console.log('[push] VAPID key fetched successfully');

    // Subscribe to push notifications
    const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    console.log('[push] Push subscription created:', subscription.endpoint);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // Extract subscription details
    const subscriptionJson = subscription.toJSON();
    const p256dh = subscriptionJson.keys?.p256dh;
    const auth = subscriptionJson.keys?.auth;

    if (!p256dh || !auth) {
      throw new Error('Falha ao obter chaves de subscription');
    }

    // Save subscription to database
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        tenant_id: tenantId,
      }, {
        onConflict: 'endpoint',
      });

    if (dbError) {
      console.error('[push] Error saving subscription:', dbError);
      throw new Error('Erro ao salvar inscrição de notificação');
    }

    console.log('[push] Subscription saved to database');
  } catch (error) {
    console.error('[push] Subscribe error:', error);
    throw error;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<void> {
  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get existing subscription
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.log('[push] No subscription found');
      return;
    }

    console.log('[push] Unsubscribing from:', subscription.endpoint);

    // Unsubscribe
    await subscription.unsubscribe();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[push] User not authenticated, skipping database cleanup');
      return;
    }

    // Remove from database
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', subscription.endpoint);

    if (dbError) {
      console.error('[push] Error removing subscription from database:', dbError);
    } else {
      console.log('[push] Subscription removed from database');
    }
  } catch (error) {
    console.error('[push] Unsubscribe error:', error);
    throw error;
  }
}

// Check if user has an active push subscription
export async function hasPushSubscription(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return subscription !== null;
  } catch (error) {
    console.error('[push] Error checking subscription:', error);
    return false;
  }
}
