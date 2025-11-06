import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Download } from 'lucide-react';

export function SubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles:user_id(full_name, email),
          subscription_plans(name, price_monthly_cents)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as assinaturas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId },
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Assinatura cancelada com sucesso',
      });

      fetchSubscriptions();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a assinatura',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      canceled: 'destructive',
      past_due: 'secondary',
    };
    const labels: Record<string, string> = {
      active: 'Ativa',
      canceled: 'Cancelada',
      past_due: 'Pendente',
    };
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sub.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      sub.profiles?.email?.toLowerCase().includes(searchLower) ||
      sub.subscription_plans?.name?.toLowerCase().includes(searchLower)
    );
  });

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Plano', 'Valor', 'Status', 'Início'];
    const rows = filteredSubscriptions.map((sub) => [
      sub.profiles?.full_name || '',
      sub.profiles?.email || '',
      sub.subscription_plans?.name || '',
      formatCurrency(sub.subscription_plans?.price_monthly_cents || 0),
      sub.status,
      format(new Date(sub.started_at), 'dd/MM/yyyy', { locale: ptBR }),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `assinaturas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assinaturas</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={exportToCSV} variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{sub.profiles?.full_name}</div>
                    <div className="text-sm text-muted-foreground">{sub.profiles?.email}</div>
                  </div>
                </TableCell>
                <TableCell>{sub.subscription_plans?.name}</TableCell>
                <TableCell>{formatCurrency(sub.subscription_plans?.price_monthly_cents || 0)}</TableCell>
                <TableCell>{getStatusBadge(sub.status)}</TableCell>
                <TableCell>
                  {format(new Date(sub.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {sub.status === 'active' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelSubscription(sub.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}