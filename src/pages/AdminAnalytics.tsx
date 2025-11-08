import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IlluminaAdminLayout } from '@/components/layout/IlluminaAdminLayout';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Target, RefreshCw } from 'lucide-react';

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [populatingAnalytics, setPopulatingAnalytics] = useState(false);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [optimalTimes, setOptimalTimes] = useState<any[]>([]);
  const [totalPublications, setTotalPublications] = useState(0);
  const [avgEngagement, setAvgEngagement] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Buscar estatísticas por categoria
      const { data: pubAnalytics } = await supabase
        .from('publication_analytics')
        .select('*')
        .order('total_publications', { ascending: false })
        .limit(10);

      if (pubAnalytics) {
        setCategoryStats(pubAnalytics);
        
        const total = pubAnalytics.reduce((sum, item) => sum + (item.total_publications || 0), 0);
        const avgEng = pubAnalytics.reduce((sum, item) => sum + (item.avg_engagement_rate || 0), 0) / pubAnalytics.length;
        
        setTotalPublications(total);
        setAvgEngagement(avgEng || 0);
      }

      // Buscar horários ótimos
      const { data: optimal } = await supabase
        .from('optimal_publication_times')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (optimal) {
        setOptimalTimes(optimal);
      }

    } catch (error: any) {
      console.error('Analytics error:', error);
      toast({
        title: 'Erro ao carregar analytics',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateAnalytics = async () => {
    try {
      setPopulatingAnalytics(true);

      const { data, error } = await supabase.functions.invoke('populate-analytics');

      if (error) throw error;

      toast({
        title: 'Analytics atualizado',
        description: 'Dados de analytics foram recalculados com sucesso',
      });

      // Recarregar dados
      await loadAnalytics();

    } catch (error: any) {
      console.error('Populate error:', error);
      toast({
        title: 'Erro ao popular analytics',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setPopulatingAnalytics(false);
    }
  };

  const categoryChartData = categoryStats.map(stat => ({
    name: stat.category_name || 'Sem categoria',
    publicacoes: stat.total_publications || 0,
    engajamento: Math.round((stat.avg_engagement_rate || 0) * 100),
  }));

  const timeChartData = optimalTimes.map(time => ({
    hora: `${String(time.hour_of_day).padStart(2, '0')}:00`,
    score: Math.round((time.score || 0) * 100),
  }));

  return (
    <IlluminaAdminLayout title="Analytics de Publicações">
      <SEO 
        title="Analytics - Admin"
        description="Dashboard de analytics de publicações"
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics de Publicações</h1>
            <p className="text-muted-foreground">
              Insights sobre o melhor momento e desempenho por categoria
            </p>
          </div>
          <Button
            onClick={handlePopulateAnalytics}
            disabled={populatingAnalytics || loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${populatingAnalytics ? 'animate-spin' : ''}`} />
            {populatingAnalytics ? 'Atualizando...' : 'Atualizar Analytics'}
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Publicações
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPublications}</div>
              <p className="text-xs text-muted-foreground">
                Últimas 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Engajamento Médio
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgEngagement.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de visualizações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Melhor Horário
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {optimalTimes[0] ? `${String(optimalTimes[0].hour_of_day).padStart(2, '0')}:00` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Maior taxa de engajamento
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando analytics...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Gráfico de Performance por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Performance por Categoria</CardTitle>
                <CardDescription>
                  Publicações e engajamento médio por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="publicacoes" fill="hsl(var(--primary))" name="Publicações" />
                      <Bar dataKey="engajamento" fill="hsl(var(--accent))" name="Engajamento %" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>Nenhum dado disponível</p>
                    <p className="text-sm mt-2">Clique em "Atualizar Analytics" para gerar dados</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Horários Ótimos */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Melhores Horários</CardTitle>
                <CardDescription>
                  Horários com maior score de engajamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Score de Engajamento"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>Nenhum dado disponível</p>
                    <p className="text-sm mt-2">Clique em "Atualizar Analytics" para gerar dados</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabela de horários ótimos */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Horários</CardTitle>
                <CardDescription>
                  Análise detalhada dos melhores horários para publicação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {optimalTimes.length > 0 ? (
                  <div className="space-y-2">
                    {optimalTimes.map((time, index) => (
                      <div 
                        key={time.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-lg text-primary">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">
                              {String(time.hour_of_day).padStart(2, '0')}:00
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {time.category_name || 'Todas as categorias'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {Math.round((time.score || 0) * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Score
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum horário ótimo calculado ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </IlluminaAdminLayout>
  );
}
