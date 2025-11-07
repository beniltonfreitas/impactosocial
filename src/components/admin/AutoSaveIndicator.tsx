import { Clock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
}

export function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Salvando...',
          className: 'text-blue-600 dark:text-blue-400',
          iconClassName: 'animate-spin'
        };
      case 'saved':
        return {
          icon: Check,
          text: 'Salvo',
          className: 'text-green-600 dark:text-green-400',
          iconClassName: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Erro ao salvar',
          className: 'text-destructive',
          iconClassName: ''
        };
      default:
        return {
          icon: Clock,
          text: 'Editando...',
          className: 'text-muted-foreground',
          iconClassName: ''
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`h-4 w-4 ${config.iconClassName}`} />
      <div className="flex flex-col">
        <span className={config.className}>
          {config.text}
        </span>
        {lastSaved && status === 'saved' && (
          <span className="text-xs text-muted-foreground">
            há {formatDistanceToNow(lastSaved, { locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  );
}
