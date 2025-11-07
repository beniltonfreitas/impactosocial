import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Version {
  version_number: number;
  title: string;
  summary: string | null;
  content: string | null;
  author: string | null;
  tags: string[] | null;
  status: string | null;
}

interface VersionComparisonProps {
  oldVersion: Version;
  newVersion: any;
  onClose: () => void;
}

export function VersionComparison({ oldVersion, newVersion, onClose }: VersionComparisonProps) {
  const isCurrentVersion = !newVersion.version_number;
  
  const getDiff = (oldText: string | null, newText: string | null) => {
    const old = oldText || '';
    const newer = newText || '';
    
    if (old === newer) return { type: 'unchanged', text: newer };
    if (!old) return { type: 'added', text: newer };
    if (!newer) return { type: 'removed', text: old };
    return { type: 'changed', old, new: newer };
  };

  const titleDiff = getDiff(oldVersion.title, newVersion.title);
  const summaryDiff = getDiff(oldVersion.summary, newVersion.summary);
  const contentDiff = getDiff(oldVersion.content, newVersion.content);

  const getWordCount = (text: string | null) => {
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  };

  const oldWordCount = getWordCount(oldVersion.content);
  const newWordCount = getWordCount(newVersion.content);
  const wordDiff = newWordCount - oldWordCount;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Comparação: Versão {oldVersion.version_number} ↔ {isCurrentVersion ? 'Versão Atual' : `Versão ${newVersion.version_number}`}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="space-y-6 pr-4">
            {/* Título */}
            <div>
              <h3 className="font-semibold mb-2">Título</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge variant="outline">Versão {oldVersion.version_number}</Badge>
                  <p className={titleDiff.type === 'changed' ? 'line-through text-muted-foreground' : ''}>
                    {oldVersion.title}
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant={isCurrentVersion ? 'default' : 'outline'}>
                    {isCurrentVersion ? 'Versão Atual' : `Versão ${newVersion.version_number}`}
                  </Badge>
                  <p className={titleDiff.type === 'changed' ? 'font-medium' : ''}>
                    {newVersion.title}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Resumo */}
            {(oldVersion.summary || newVersion.summary) && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Resumo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className={`text-sm ${summaryDiff.type === 'changed' ? 'line-through text-muted-foreground' : ''}`}>
                        {oldVersion.summary || <span className="text-muted-foreground italic">Sem resumo</span>}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className={`text-sm ${summaryDiff.type === 'changed' ? 'font-medium' : ''}`}>
                        {newVersion.summary || <span className="text-muted-foreground italic">Sem resumo</span>}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Conteúdo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Conteúdo</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{oldWordCount} palavras</Badge>
                  <span>→</span>
                  <Badge variant="outline">{newWordCount} palavras</Badge>
                  {wordDiff !== 0 && (
                    <Badge variant={wordDiff > 0 ? 'default' : 'secondary'}>
                      {wordDiff > 0 ? '+' : ''}{wordDiff}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className={`text-sm prose prose-sm max-w-none ${contentDiff.type === 'changed' ? 'opacity-60' : ''}`}>
                    <div dangerouslySetInnerHTML={{ __html: oldVersion.content || '<p class="text-muted-foreground italic">Sem conteúdo</p>' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: newVersion.content || '<p class="text-muted-foreground italic">Sem conteúdo</p>' }} />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Metadados */}
            <div>
              <h3 className="font-semibold mb-2">Metadados</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p><strong>Autor:</strong> {oldVersion.author || 'N/A'}</p>
                  <p><strong>Status:</strong> {oldVersion.status || 'N/A'}</p>
                  <p><strong>Tags:</strong> {oldVersion.tags?.length || 0} tags</p>
                  {oldVersion.tags && oldVersion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {oldVersion.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p><strong>Autor:</strong> {newVersion.author || 'N/A'}</p>
                  <p><strong>Status:</strong> {newVersion.status || 'N/A'}</p>
                  <p><strong>Tags:</strong> {newVersion.tags?.length || 0} tags</p>
                  {newVersion.tags && newVersion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newVersion.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
