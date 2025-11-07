import { toast } from 'sonner';
import { Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScheduleNotification {
  title: string;
  articleTitle: string;
  minutesUntil: number;
  articleId: string;
}

export function showScheduleNotification(data: ScheduleNotification) {
  toast(
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-orange-500" />
        <p className="font-semibold">{data.title}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        "{data.articleTitle}" será publicado em {data.minutesUntil} minutos
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          window.location.href = `/admin/articles?id=${data.articleId}`;
        }}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Ver artigo
      </Button>
    </div>,
    {
      duration: 10000,
      position: 'top-right',
    }
  );
}
