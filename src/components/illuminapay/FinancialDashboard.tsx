import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MetricCard } from './MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, TrendingDown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  mrr: number;
  total_subscribers: number;
  new_this_month: number;
  canceled_this_month: number;
  churn_rate: number;
  revenue_today: number;
  revenue_this_month: number;
  revenue_this_year: number;
  growth_rate: number;
  recent_transactions: any[];
  payment_methods_distribution: Record<string, number>;
}

export function FinancialDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('financial-dashboard-stats');

      if (error) throw error;

      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      credit_card: 'Cartão',
      pix: 'PIX',
      boleto: 'Boleto',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>Erro ao carregar dashboard</div>;
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="MRR"
          value={formatCurrency(stats.mrr)}
          icon={DollarSign}
          trend={`${stats.growth_rate > 0 ? '+' : ''}${stats.growth_rate}%`}
          trendUp={stats.growth_rate > 0}
        />
        <MetricCard
          title="Assinantes"
          value={stats.total_subscribers.toString()}
          icon={Users}
          trend={`+${stats.new_this_month} este mês`}
          trendUp={true}
        />
        <MetricCard
          title="Churn Rate"
          value={`${stats.churn_rate}%`}
          icon={TrendingDown}
          trend={`${stats.canceled_this_month} cancelamentos`}
          trendUp={false}
        />
        <MetricCard
          title="Receita Hoje"
          value={formatCurrency(stats.revenue_today)}
          icon={Calendar}
        />
      </div>

      {/* Receitas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receita do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue_this_month)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receita do Ano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue_this_year)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.payment_methods_distribution).map(([method, percentage]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span>{getPaymentMethodLabel(method)}</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recent_transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{transaction.profiles?.full_name || 'Usuário'}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount_cents)}</TableCell>
                  <TableCell>{getPaymentMethodLabel(transaction.payment_method)}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}