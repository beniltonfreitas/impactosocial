import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Eye, GitCompare, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { VersionComparison } from './VersionComparison';

interface Version {
  id: string;
  version_number: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  author: string | null;
  tags: string[] | null;
  status: string | null;
  created_at: string;
  created_by: string | null;
  change_summary: string | null;
  full_data: any;
}

interface ArticleVersionHistoryProps {
  articleId: string;
  currentVersion: any;
  onRestore?: () => void;
}

export function ArticleVersionHistory({ articleId, currentVersion, onRestore }: ArticleVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoreVersion, setRestoreVersion] = useState<Version | null>(null);
  const [compareVersions, setCompareVersions] = useState<{ old: Version; new: Version } | null>(null);

  useEffect(() => {
    loadVersions();
  }, [articleId]);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('article_versions')
        .select('*')
        .eq('article_id', articleId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar histórico de versões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreVersion) return;

    try {
      const { error } = await supabase
        .from('articles')
        .update({
          title: restoreVersion.title,
          slug: restoreVersion.slug,
          summary: restoreVersion.summary,
          content: restoreVersion.content,
          author: restoreVersion.author,
          tags: restoreVersion.tags,
          image_url: restoreVersion.full_data?.image_url,
          image_og_url: restoreVersion.full_data?.image_og_url,
          image_card_url: restoreVersion.full_data?.image_card_url,
          category_id: restoreVersion.full_data?.category_id,
        })
        .eq('id', articleId);

      if (error) throw error;

      toast.success(`Versão ${restoreVersion.version_number} restaurada com sucesso`);
      setRestoreVersion(null);
      onRestore?.();
    } catch (error: any) {
      toast.error('Erro ao restaurar versão');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Versões</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Versões
          </CardTitle>
          <CardDescription>
            {versions.length > 0 ? `${versions.length} versões salvas` : 'Nenhuma versão anterior'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Versão Atual */}
              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Versão Atual</Badge>
                      <CardTitle className="text-base">{currentVersion.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription>
                    {currentVersion.updated_at && format(new Date(currentVersion.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-muted-foreground">
                    {currentVersion.author && `Por ${currentVersion.author}`}
                  </p>
                </CardContent>
              </Card>

              {/* Versões Anteriores */}
              {versions.map((version, index) => (
                <Card key={version.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Versão {version.version_number}</Badge>
                        <CardTitle className="text-base">{version.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>
                      {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {version.change_summary && ` • ${version.change_summary}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground mb-3">
                      {version.author && `Por ${version.author}`}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareVersions({ 
                          old: version, 
                          new: index > 0 ? versions[index - 1] : currentVersion 
                        })}
                      >
                        <GitCompare className="h-4 w-4 mr-1" />
                        Comparar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRestoreVersion(version)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restaurar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Restauração */}
      <AlertDialog open={!!restoreVersion} onOpenChange={(open) => !open && setRestoreVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Restaurar Versão {restoreVersion?.version_number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-2">
                <p>Isso irá:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Criar uma nova versão automática do estado atual</li>
                  <li>Restaurar o conteúdo da Versão {restoreVersion?.version_number}</li>
                  <li>Manter todo o histórico de versões</li>
                </ul>
                <p className="mt-4 font-medium">Esta ação não pode ser desfeita, mas você poderá restaurar qualquer versão posteriormente.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Confirmar Restauração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Comparação */}
      {compareVersions && (
        <VersionComparison
          oldVersion={compareVersions.old}
          newVersion={compareVersions.new}
          onClose={() => setCompareVersions(null)}
        />
      )}
    </>
  );
}
