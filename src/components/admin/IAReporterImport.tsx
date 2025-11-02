import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ExternalLink } from 'lucide-react';

interface IAReporterImportProps {
  categories: any[];
  onSuccess?: (articleId: string) => void;
}

export function IAReporterImport({ categories, onSuccess }: IAReporterImportProps) {
  const [loading, setLoading] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!sourceUrl) {
      toast({
        title: 'URL obrigatória',
        description: 'Informe a URL da matéria original',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('ia-reporter-pro', {
        body: {
          source_url: sourceUrl,
          image_url: imageUrl || null,
          category_id: categoryId || null,
          premium_only: premiumOnly,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: '🎉 Importação concluída!',
          description: `Notícia criada com sucesso. ID: ${data.article.id}`,
        });

        setSourceUrl('');
        setImageUrl('');
        setCategoryId('');
        setPremiumOnly(false);

        if (onSuccess) {
          onSuccess(data.article.id);
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>IA Repórter Pró</CardTitle>
        </div>
        <CardDescription>
          Importe e reescreva matérias automaticamente usando Inteligência Artificial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="source-url">URL da Matéria Original *</Label>
          <div className="flex gap-2">
            <Input
              id="source-url"
              type="url"
              placeholder="https://fonte-original.com.br/noticia"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              disabled={loading}
            />
            {sourceUrl && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.open(sourceUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-url">URL da Imagem (opcional)</Label>
          <Input
            id="image-url"
            type="url"
            placeholder="https://exemplo.com/imagem.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria (opcional)</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhuma</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="premium-only">Conteúdo Premium</Label>
          <Switch
            id="premium-only"
            checked={premiumOnly}
            onCheckedChange={setPremiumOnly}
            disabled={loading}
          />
        </div>

        <Button
          onClick={handleImport}
          disabled={loading || !sourceUrl}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando com IA...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Importar e Reescrever
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• A IA irá reescrever o conteúdo de forma original</p>
          <p>• Serão geradas 12 tags automaticamente</p>
          <p>• Meta tags SEO serão criadas</p>
          <p>• O artigo será salvo como rascunho para revisão</p>
        </div>
      </CardContent>
    </Card>
  );
}
