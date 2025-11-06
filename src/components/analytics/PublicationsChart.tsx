import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, TrendingUp } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { subDays, subMonths, subYears } from 'date-fns';
import { Button } from '@/components/ui/button';

interface PublicationsStats {
  period: string;
  startDate: string;
  endDate: string;
  totalPublished: number;
  scheduledCount: number;
  publicationsByPeriod: Array<{
    period: string;
    count: number;
  }>;
  publicationsByCategory: Array<{
    category: string;
    count: number;
  }>;
}

export function PublicationsChart() {
  const [stats, setStats] = useState<PublicationsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [period, dateFrom, dateTo]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('publications-stats', {
        method: 'GET',
        body: {
          period,
          startDate: dateFrom.toISOString(),
          endDate: dateTo.toISOString(),
        }
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('[PublicationsChart] Error:', error);
      toast({
        title: 'Erro ao carregar estatísticas',
        description: 'Não foi possível carregar dados de publicações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilter = (filter: 'week' | 'month' | 'year') => {
    const now = new Date();
    switch (filter) {
      case 'week':
        setDateFrom(subDays(now, 7));
        setPeriod('day');
        break;
      case 'month':
        setDateFrom(subMonths(now, 1));
        setPeriod('day');
        break;
      case 'year':
        setDateFrom(subYears(now, 1));
        setPeriod('month');
        break;
    }
    setDateTo(now);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publicado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPublished || 0}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artigos Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.scheduledCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando publicação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Dia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalPublished && dateFrom && dateTo
                ? ((stats.totalPublished / Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24))).toFixed(1))
                : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Publicações/dia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Publicações por Período</CardTitle>
              <CardDescription>Visualize o volume de publicações ao longo do tempo</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Por Dia</SelectItem>
                  <SelectItem value="month">Por Mês</SelectItem>
                  <SelectItem value="year">Por Ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Linha</SelectItem>
                  <SelectItem value="bar">Barras</SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={(from, to) => {
                  if (from) setDateFrom(from);
                  if (to) setDateTo(to);
                }}
              />
            </div>
          </div>
          
          {/* Filtros rápidos */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('week')}
            >
              Última semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('month')}
            >
              Último mês
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter('year')}
            >
              Último ano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={stats?.publicationsByPeriod || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Publicações"
                />
              </LineChart>
            ) : (
              <BarChart data={stats?.publicationsByPeriod || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  name="Publicações"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Publicações por categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Publicações por Categoria</CardTitle>
          <CardDescription>Distribuição das publicações no período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.publicationsByCategory.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="font-medium">{cat.category}</span>
                <span className="text-muted-foreground">{cat.count} publicações</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
