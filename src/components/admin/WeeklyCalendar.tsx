import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  eachHourOfInterval,
  isSameHour,
  addWeeks,
  subWeeks,
  parseISO,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ScheduledArticle {
  id: string;
  article_id: string;
  scheduled_for: string;
  status: string;
  articles: {
    id: string;
    title: string;
    category_id: string;
    author: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export function WeeklyCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [articles, setArticles] = useState<ScheduledArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    loadData();
  }, [currentWeek, selectedCategory, selectedAuthor]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*');
      
      setCategories(categoriesData || []);

      let query = supabase
        .from('article_schedule')
        .select(`
          *,
          articles (
            id,
            title,
            category_id,
            author
          )
        `)
        .eq('status', 'pending')
        .gte('scheduled_for', weekStart.toISOString())
        .lte('scheduled_for', weekEnd.toISOString());

      const { data: schedules } = await query;
      
      let filtered = schedules || [];
      
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(s => s.articles.category_id === selectedCategory);
      }
      
      if (selectedAuthor !== 'all') {
        filtered = filtered.filter(s => s.articles.author === selectedAuthor);
      }

      setArticles(filtered);
    } catch (error) {
      console.error('Erro ao carregar calendário semanal:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6366f1';
  };

  const uniqueAuthors = Array.from(
    new Set(articles.map(a => a.articles.author).filter(Boolean))
  );

  const previousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  const baseDate = startOfDay(weekStart);
  const timeSlots = eachHourOfInterval({
    start: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 8),
    end: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 22),
  });

  return (
    <Card className="p-6">
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Visão Semanal</h2>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[200px] text-center">
              {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os autores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os autores</SelectItem>
              {uniqueAuthors.map(author => (
                <SelectItem key={author} value={author!}>
                  {author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedCategory !== 'all' || selectedAuthor !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedAuthor('all');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-xs font-semibold text-muted-foreground">Horário</div>
              {days.map(day => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'text-center py-2 rounded-t-lg',
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
                      'bg-primary/10 font-bold'
                  )}
                >
                  <div className="text-sm font-semibold">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              ))}
            </div>

            {timeSlots.map(hour => (
              <div key={hour.toISOString()} className="grid grid-cols-8 gap-2 mb-1">
                <div className="text-xs text-muted-foreground py-2">
                  {format(hour, 'HH:mm')}
                </div>
                {days.map(day => {
                  const cellDate = new Date(day);
                  cellDate.setHours(hour.getHours());

                  const cellArticles = articles.filter(a => 
                    isSameHour(parseISO(a.scheduled_for), cellDate)
                  );

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={cn(
                        'min-h-[60px] p-1 border rounded-lg',
                        'hover:bg-muted/50 transition-colors'
                      )}
                    >
                      {cellArticles.map(article => (
                        <div
                          key={article.id}
                          className="text-xs p-2 rounded mb-1 text-white cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: getCategoryColor(article.articles.category_id) }}
                          title={article.articles.title}
                        >
                          <p className="font-medium truncate">{article.articles.title}</p>
                          <p className="text-[10px] opacity-80">
                            {format(parseISO(article.scheduled_for), 'HH:mm')}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{articles.length}</p>
            <p className="text-sm text-muted-foreground">Artigos agendados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{uniqueAuthors.length}</p>
            <p className="text-sm text-muted-foreground">Autores envolvidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {categories.filter(cat => 
                articles.some(a => a.articles.category_id === cat.id)
              ).length}
            </p>
            <p className="text-sm text-muted-foreground">Categorias ativas</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
