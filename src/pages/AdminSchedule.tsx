import { useState, useEffect } from 'react';
import { IlluminaAdminLayout } from '@/components/layout/IlluminaAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow, startOfDay, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Edit, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditorialCalendar } from '@/components/admin/EditorialCalendar';
import { WeeklyCalendar } from '@/components/admin/WeeklyCalendar';

interface ScheduledArticle {
  id: string;
  article_id: string;
  scheduled_for: string;
  status: string;
  notification_sent_at: string | null;
  created_at: string;
  articles: {
    title: string;
    slug: string;
    author: string | null;
    category_id: string | null;
    breaking: boolean;
  };
}

export default function AdminSchedule() {
  const [schedules, setSchedules] = useState<ScheduledArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSchedules();
  }, []);

  const upcomingSchedules = schedules.filter(s => {
    const minutesUntil = differenceInMinutes(
      new Date(s.scheduled_for),
      new Date()
    );
    return minutesUntil > 0 && minutesUntil <= 30;
  });

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('article_schedule')
        .select('*, articles(*)')
        .in('status', ['pending', 'failed'])
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar agendamentos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async (scheduleId: string, articleId: string) => {
    try {
      // Publicar artigo
      const { error: updateError } = await supabase
        .from('articles')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', articleId);

      if (updateError) throw updateError;

      // Atualizar agendamento
      await supabase
        .from('article_schedule')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      toast.success('Artigo publicado com sucesso');
      loadSchedules();
    } catch (error: any) {
      toast.error('Erro ao publicar artigo');
      console.error(error);
    }
  };

  const handleCancel = async (scheduleId: string) => {
    try {
      await supabase
        .from('article_schedule')
        .update({ status: 'cancelled' })
        .eq('id', scheduleId);

      toast.success('Agendamento cancelado');
      loadSchedules();
    } catch (error: any) {
      toast.error('Erro ao cancelar agendamento');
      console.error(error);
    }
  };

  const groupSchedulesByDate = () => {
    const groups: Record<string, ScheduledArticle[]> = {};
    
    schedules.forEach(schedule => {
      const date = startOfDay(new Date(schedule.scheduled_for));
      const key = format(date, 'yyyy-MM-dd');
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(schedule);
    });

    return groups;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'HOJE';
    if (isTomorrow(date)) return 'AMANHÃ';
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }).toUpperCase();
  };

  const groupedSchedules = groupSchedulesByDate();
  const totalPending = schedules.filter(s => s.status === 'pending').length;
  const todaySchedules = schedules.filter(s => 
    isToday(new Date(s.scheduled_for)) && s.status === 'pending'
  ).length;

  return (
    <IlluminaAdminLayout>
      <SEO 
        title="Agendamentos - Admin" 
        description="Gerencie artigos agendados para publicação"
      />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Artigos Agendados</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie publicações programadas
          </p>
        </div>

        {upcomingSchedules.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <p className="font-medium text-orange-900 dark:text-orange-100">
                {upcomingSchedules.length} artigo(s) será(ão) publicado(s) nos próximos 30 minutos
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="list">📋 Lista</TabsTrigger>
            <TabsTrigger value="calendar">📅 Mensal</TabsTrigger>
            <TabsTrigger value="weekly">📆 Semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {/* Estatísticas */}
            <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Agendado</CardDescription>
              <CardTitle className="text-3xl">{totalPending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Hoje</CardDescription>
              <CardTitle className="text-3xl">{todaySchedules}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Com Falha</CardDescription>
              <CardTitle className="text-3xl text-destructive">
                {schedules.filter(s => s.status === 'failed').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Carregando...</p>
            </CardContent>
          </Card>
        ) : schedules.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center space-y-2">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum artigo agendado</p>
                <Button onClick={() => navigate('/admin/articles')}>
                  Criar Artigo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSchedules).map(([dateKey, daySchedules]) => (
              <div key={dateKey} className="space-y-4">
                <h2 className="text-xl font-semibold text-primary">
                  {getDateLabel(dateKey)} - {format(new Date(dateKey), 'dd/MM/yyyy')}
                </h2>
                
                <div className="space-y-4">
                  {daySchedules.map(schedule => (
                    <Card key={schedule.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4" />
                              <CardTitle className="text-lg">
                                {format(new Date(schedule.scheduled_for), 'HH:mm')} - {schedule.articles.title}
                              </CardTitle>
                            </div>
                            <CardDescription className="flex items-center gap-2 flex-wrap">
                              {schedule.articles.author && (
                                <span>Por {schedule.articles.author}</span>
                              )}
                              {schedule.status === 'failed' && (
                                <Badge variant="destructive">Falhou</Badge>
                              )}
                              {schedule.articles.breaking && (
                                <Badge variant="default">⚡ Urgente</Badge>
                              )}
                              {schedule.notification_sent_at && (
                                <Badge variant="outline">
                                  🔔 Notificado
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/articles?edit=${schedule.article_id}`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublishNow(schedule.id, schedule.article_id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Publicar Agora
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="calendar">
            <EditorialCalendar />
          </TabsContent>

          <TabsContent value="weekly">
            <WeeklyCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </IlluminaAdminLayout>
  );
}
