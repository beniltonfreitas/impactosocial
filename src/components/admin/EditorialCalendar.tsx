import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScheduledArticle {
  id: string;
  article_id: string;
  scheduled_for: string;
  status: string;
  articles: {
    title: string;
    category_id: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export function EditorialCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [articles, setArticles] = useState<ScheduledArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar categorias
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*');
      
      setCategories(categoriesData || []);

      // Carregar artigos agendados do mês
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data: schedules } = await supabase
        .from('article_schedule')
        .select(`
          *,
          articles(title, category_id)
        `)
        .eq('status', 'pending')
        .gte('scheduled_for', start.toISOString())
        .lte('scheduled_for', end.toISOString());

      setArticles(schedules || []);
    } catch (error) {
      console.error('Erro ao carregar calendário:', error);
      toast.error('Erro ao carregar calendário');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const articleId = active.id as string;
    const newDate = over.id as string;

    try {
      const schedule = articles.find(a => a.id === articleId);
      if (!schedule) return;

      // Manter hora original, mudar apenas o dia
      const originalDate = parseISO(schedule.scheduled_for);
      const [year, month, day] = newDate.split('-').map(Number);
      const newDateTime = new Date(year, month - 1, day, originalDate.getHours(), originalDate.getMinutes());

      // Validar que não é data no passado
      if (newDateTime < new Date()) {
        toast.error('Não é possível agendar para data passada');
        return;
      }

      // Atualizar no banco
      const { error } = await supabase
        .from('article_schedule')
        .update({ scheduled_for: newDateTime.toISOString() })
        .eq('id', articleId);

      if (error) throw error;

      toast.success('Artigo reagendado com sucesso');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao reagendar artigo');
      console.error(error);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6366f1';
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <Card className="p-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Calendário Editorial
        </h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[150px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
          >
            Hoje
          </Button>
        </div>
      </div>

      {/* Grid do calendário */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 gap-2">
            {/* Dias da semana */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center font-bold text-sm py-2 border-b">
                {day}
              </div>
            ))}

            {/* Dias do mês */}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayArticles = articles.filter(a => 
                isSameDay(parseISO(a.scheduled_for), day)
              );
              const isToday = isSameDay(day, new Date());

              return (
                <DayCell
                  key={dateStr}
                  date={day}
                  dateStr={dateStr}
                  articles={dayArticles}
                  isToday={isToday}
                  getCategoryColor={getCategoryColor}
                />
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Legenda */}
      {categories.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Legenda:</p>
          <div className="flex flex-wrap gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// Componente de célula do dia (com drag & drop)
interface DayCellProps {
  date: Date;
  dateStr: string;
  articles: ScheduledArticle[];
  isToday: boolean;
  getCategoryColor: (categoryId: string) => string;
}

function DayCell({ date, dateStr, articles, isToday, getCategoryColor }: DayCellProps) {
  const { setNodeRef: setDropRef } = useDroppable({ id: dateStr });

  return (
    <div
      ref={setDropRef}
      className={cn(
        'min-h-[120px] p-2 border rounded-lg transition-colors',
        isToday && 'bg-primary/5 border-primary',
        'hover:bg-muted/50'
      )}
    >
      <div className="font-medium text-sm mb-2">{format(date, 'd')}</div>
      <div className="space-y-1">
        {articles.map((article) => (
          <DraggableArticle
            key={article.id}
            article={article}
            color={getCategoryColor(article.articles.category_id)}
          />
        ))}
      </div>
    </div>
  );
}

// Componente de artigo arrastável
interface DraggableArticleProps {
  article: ScheduledArticle;
  color: string;
}

function DraggableArticle({ article, color }: DraggableArticleProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: article.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="text-xs p-2 rounded cursor-move hover:shadow-md transition-shadow"
      title={article.articles.title}
    >
      <div 
        className="w-full h-full rounded px-2 py-1 text-white"
        style={{ backgroundColor: color }}
      >
        <p className="font-medium truncate">{article.articles.title}</p>
        <p className="text-[10px] opacity-80">
          {format(parseISO(article.scheduled_for), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
