import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { subscribeToPush, unsubscribeFromPush, hasPushSubscription } from "@/lib/pushNotifications";

export function PushToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if push is already enabled
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const hasSubscription = await hasPushSubscription();
        setEnabled(hasSubscription);
      } catch (error) {
        console.error('[PushToggle] Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, []);

  const togglePush = async () => {
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Faça login para habilitar notificações",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (enabled) {
        // Unsubscribe
        await unsubscribeFromPush();
        setEnabled(false);
        toast({
          title: "Notificações desabilitadas",
          description: "Você não receberá mais alertas de notícias urgentes",
        });
      } else {
        // Subscribe - using 'nacional' as default tenant for now
        await subscribeToPush('nacional');
        setEnabled(true);
        toast({
          title: "Notificações habilitadas",
          description: "Você receberá alertas de notícias urgentes",
        });
      }
    } catch (error) {
      console.error('[PushToggle] Error toggling push:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao configurar notificações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <Button
      onClick={togglePush}
      disabled={loading}
      variant={enabled ? "default" : "outline"}
      size="lg"
      className="w-full"
    >
      {loading ? (
        <span className="animate-spin mr-2">⏳</span>
      ) : enabled ? (
        <Bell className="mr-2 h-5 w-5" />
      ) : (
        <BellOff className="mr-2 h-5 w-5" />
      )}
      {enabled ? "Notificações Ativadas" : "Ativar Notificações"}
    </Button>
  );
}
