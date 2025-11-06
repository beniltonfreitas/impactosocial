import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IlluminaAdminLayout } from '@/components/layout/IlluminaAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscription {
  id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  plan_price: number;
  profile: {
    full_name: string;
    email: string;
  } | null;
  plans: {
    name: string;
  } | null;
}

export default function AdminAssinaturas() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // Placeholder: tabela subscriptions ainda não existe
      // Quando existir, descomentar o código abaixo
      /*
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          start_date,
          end_date,
          plan_price,
          profiles!user_id(full_name, email),
          plans!plan_id(name)
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        profile: item.profiles,
        plans: item.plans,
      }));
      
      setSubscriptions(formattedData as Subscription[]);
      */
      
      // Por enquanto, retorna array vazio
      setSubscriptions([]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar',
        description: error.message,
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
    const variants: Record<string, any> = {
      active: { variant: 'default', label: 'Ativa' },
      canceled: { variant: 'secondary', label: 'Cancelada' },
      past_due: { variant: 'destructive', label: 'Vencida' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Plano', 'Status', 'Valor', 'Data Início', 'Data Fim'];
    const rows = filteredSubscriptions.map(s => [
      s.profile?.full_name || 'N/A',
      s.profile?.email || 'N/A',
      s.plans?.name || 'N/A',
      s.status,
      formatCurrency(s.plan_price),
      s.start_date,
      s.end_date || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `assinaturas_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      s.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plans?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <IlluminaAdminLayout title="Gerenciar Assinaturas">
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas do Sistema</CardTitle>
          <CardDescription>
            {filteredSubscriptions.length} assinaturas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data Início</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.profile?.full_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{sub.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{sub.plans?.name || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>{formatCurrency(sub.plan_price)}</TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {format(new Date(sub.start_date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </IlluminaAdminLayout>
  );
}
