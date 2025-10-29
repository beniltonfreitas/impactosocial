import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { CreditCard, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscription {
  id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  plan: {
    name: string;
    price_monthly_cents: number;
  };
}

export function SubscriptionManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          started_at,
          expires_at,
          plan:subscription_plans(name, price_monthly_cents)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data as any);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) throw error;
      if (!data?.success) throw new Error('Falha ao cancelar assinatura');

      toast({
        title: 'Assinatura cancelada',
        description: data.message,
      });
      
      fetchSubscription();
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium mb-1">Nenhuma assinatura ativa</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Assine um plano premium para acessar conteúdo exclusivo e funcionalidades avançadas.
            </p>
            <Button asChild>
              <Link to="/pricing">Ver Planos Disponíveis</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: 'default', label: 'Ativa' },
      cancelled: { variant: 'secondary', label: 'Cancelada' },
      expired: { variant: 'destructive', label: 'Expirada' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{subscription.plan.name}</h3>
              {getStatusBadge(subscription.status)}
            </div>
            <p className="text-2xl font-bold text-primary">
              R$ {(subscription.plan.price_monthly_cents / 100).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
          </div>
          <CreditCard className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="grid gap-3 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Início:</span>
            <span className="font-medium">
              {format(new Date(subscription.started_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          
          {subscription.expires_at && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {subscription.status === 'cancelled' ? 'Acesso até:' : 'Renovação:'}
              </span>
              <span className="font-medium">
                {format(new Date(subscription.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          {subscription.status === 'active' && (
            <>
              <Button variant="outline" asChild>
                <Link to="/pricing">Fazer Upgrade</Link>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isCancelling}>
                    {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancelar Assinatura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sua assinatura será cancelada, mas você continuará tendo acesso ao conteúdo premium até o fim do período pago.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSubscription}>
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          
          {subscription.status !== 'active' && (
            <Button asChild>
              <Link to="/pricing">Reativar Assinatura</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
