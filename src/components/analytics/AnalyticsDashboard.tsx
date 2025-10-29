import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, Users, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  uniqueUsersToday: number;
  uniqueUsersWeek: number;
  topArticles: Array<{
    id: string;
    title: string;
    slug: string;
    viewCount: number;
    uniqueViewers: number;
  }>;
  viewsByDate: Array<{
    date: string;
    views: number;
    uniqueUsers: number;
  }>;
  viewsByCategory: Array<{
    category: string;
    views: number;
  }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics-stats');
      
      if (error) throw error;
      
      setStats(data);
    } catch (error) {
      console.error('[AnalyticsDashboard] Error fetching stats:', error);
      toast({
        title: 'Erro ao carregar estatísticas',
        description: 'Não foi possível carregar os dados de analytics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações Hoje</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.uniqueUsersToday} usuários únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.uniqueUsersWeek} usuários únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Todas as visualizações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views by Date */}
        <Card>
          <CardHeader>
            <CardTitle>Visualizações por Dia</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.viewsByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="uniqueUsers" stroke="hsl(var(--secondary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Views by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Visualizações por Categoria</CardTitle>
            <CardDescription>Esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.viewsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.category}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="views"
                >
                  {stats.viewsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Artigos Mais Vistos</CardTitle>
          <CardDescription>Últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.topArticles} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="title" 
                type="category" 
                width={200}
                tickFormatter={(title) => title.length > 30 ? title.substring(0, 30) + '...' : title}
              />
              <Tooltip />
              <Bar dataKey="viewCount" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
