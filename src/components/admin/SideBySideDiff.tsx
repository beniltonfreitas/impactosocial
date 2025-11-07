import { diffLines, Change } from 'diff';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SideBySideDiffProps {
  oldText: string;
  newText: string;
}

export function SideBySideDiff({ oldText, newText }: SideBySideDiffProps) {
  const diffs = diffLines(oldText || '', newText || '');

  const leftLines: { content: string; type: 'removed' | 'unchanged' }[] = [];
  const rightLines: { content: string; type: 'added' | 'unchanged' }[] = [];

  diffs.forEach((part: Change) => {
    const lines = part.value.split('\n');
    lines.forEach((line, i) => {
      if (i === lines.length - 1 && line === '') return;

      if (part.removed) {
        leftLines.push({ content: line, type: 'removed' });
      } else if (part.added) {
        rightLines.push({ content: line, type: 'added' });
      } else {
        leftLines.push({ content: line, type: 'unchanged' });
        rightLines.push({ content: line, type: 'unchanged' });
      }
    });
  });

  const maxLength = Math.max(leftLines.length, rightLines.length);
  while (leftLines.length < maxLength) {
    leftLines.push({ content: '', type: 'unchanged' });
  }
  while (rightLines.length < maxLength) {
    rightLines.push({ content: '', type: 'unchanged' });
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 border-b">
          <p className="text-sm font-medium">Versão Anterior</p>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="font-mono text-xs">
            {leftLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'px-3 py-1 border-b',
                  line.type === 'removed' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
                  line.type === 'unchanged' && 'text-muted-foreground'
                )}
              >
                <span className="text-muted-foreground mr-4">{i + 1}</span>
                {line.content || <span className="text-muted-foreground/30">∅</span>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-3 py-2 border-b">
          <p className="text-sm font-medium">Versão Nova</p>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="font-mono text-xs">
            {rightLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'px-3 py-1 border-b',
                  line.type === 'added' && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
                  line.type === 'unchanged' && 'text-muted-foreground'
                )}
              >
                <span className="text-muted-foreground mr-4">{i + 1}</span>
                {line.content || <span className="text-muted-foreground/30">∅</span>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
