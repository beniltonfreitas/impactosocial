import { diffWords, Change } from 'diff';
import { cn } from '@/lib/utils';

interface InlineDiffProps {
  oldText: string;
  newText: string;
}

export function InlineDiff({ oldText, newText }: InlineDiffProps) {
  const diffs = diffWords(oldText || '', newText || '');

  return (
    <div className="space-y-2">
      <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
        {diffs.map((part: Change, index: number) => {
          if (part.added) {
            return (
              <span
                key={index}
                className={cn(
                  'bg-green-100 dark:bg-green-900/30',
                  'text-green-800 dark:text-green-200',
                  'px-1 rounded'
                )}
                title="Adicionado"
              >
                {part.value}
              </span>
            );
          }
          
          if (part.removed) {
            return (
              <span
                key={index}
                className={cn(
                  'bg-red-100 dark:bg-red-900/30',
                  'text-red-800 dark:text-red-200',
                  'line-through px-1 rounded'
                )}
                title="Removido"
              >
                {part.value}
              </span>
            );
          }
          
          return (
            <span key={index} className="text-muted-foreground">
              {part.value}
            </span>
          );
        })}
      </div>
    </div>
  );
}
