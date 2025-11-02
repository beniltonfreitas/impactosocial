import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, FileJson, Loader2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ArticleJSONExportProps {
  articleId: string;
  articleTitle: string;
}

export function ArticleJSONExport({ articleId, articleTitle }: ArticleJSONExportProps) {
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('article-json-premium', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: null,
      });

      if (error) throw error;

      const jsonString = JSON.stringify(data, null, 2);
      setJsonData(jsonString);
      setShowDialog(true);

      toast({
        title: 'JSON gerado com sucesso',
        description: 'Formato Premium v2.1 ITL Brasil',
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Erro ao gerar JSON',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!jsonData) return;

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `article-${articleId}-premium-v2.1.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download iniciado',
      description: 'Arquivo JSON salvo',
    });
  };

  const handleCopy = async () => {
    if (!jsonData) return;

    await navigator.clipboard.writeText(jsonData);
    toast({
      title: 'JSON copiado',
      description: 'Copiado para área de transferência',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <CardTitle>Exportar JSON Premium v2.1</CardTitle>
          </div>
          <CardDescription>
            Gerar JSON no formato ITL Brasil Premium v2.1 com todos os metadados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando JSON...
              </>
            ) : (
              <>
                <FileJson className="mr-2 h-4 w-4" />
                Gerar JSON Premium
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>JSON Premium v2.1 - {articleTitle}</DialogTitle>
            <DialogDescription>
              Formato ITL Brasil com todos os metadados do artigo
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              <Copy className="mr-2 h-4 w-4" />
              Copiar JSON
            </Button>
          </div>

          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <pre className="text-xs">{jsonData}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
