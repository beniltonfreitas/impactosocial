import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Rss, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  content?: string;
}

interface RssFeedImporterProps {
  onImportComplete?: (results: any) => void;
}

export function RssFeedImporter({ onImportComplete }: RssFeedImporterProps) {
  const [feedUrl, setFeedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [tenantId, setTenantId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const { toast } = useToast();

  const loadCategoriesAndTenants = async () => {
    const [categoriesRes, tenantsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('tenant').select('*').order('name'),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (tenantsRes.data) setTenants(tenantsRes.data);
  };

  const fetchFeed = async () => {
    if (!feedUrl.trim()) {
      toast({
        title: 'URL obrigatória',
        description: 'Por favor, insira a URL do feed RSS/Atom',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await loadCategoriesAndTenants();

      const { data, error } = await supabase.functions.invoke('rss-import', {
        body: { feedUrl },
      });

      if (error) throw error;

      if (data.items && data.items.length > 0) {
        setFeedItems(data.items);
        // Select all by default
        setSelectedItems(new Set(data.items.map((_: any, i: number) => i)));
        toast({
          title: 'Feed carregado',
          description: `${data.items.length} artigos encontrados`,
        });
      } else {
        toast({
          title: 'Nenhum artigo',
          description: 'Não foram encontrados artigos neste feed',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Fetch feed error:', error);
      toast({
        title: 'Erro ao buscar feed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === feedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(feedItems.map((_, i) => i)));
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 200);
  };

  const importSelected = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: 'Nenhum item selecionado',
        description: 'Selecione pelo menos um artigo para importar',
        variant: 'destructive',
      });
      return;
    }

    try {
      setImporting(true);
      const itemsToImport = feedItems.filter((_, i) => selectedItems.has(i));
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const item of itemsToImport) {
        try {
          const slug = generateSlug(item.title);
          
          // Check if slug already exists
          const { data: existing } = await supabase
            .from('articles')
            .select('id')
            .eq('slug', slug)
            .single();

          let finalSlug = slug;
          if (existing) {
            finalSlug = `${slug}-${Date.now()}`;
          }

          const articleData = {
            title: item.title.slice(0, 200),
            slug: finalSlug,
            summary: item.description?.slice(0, 160) || null,
            content: item.content || item.description || '',
            image_url: item.imageUrl || null,
            source_url: item.link || null,
            author: item.author || 'Feed RSS',
            category_id: categoryId || null,
            tenant_id: tenantId || null,
            published_at: publishImmediately ? new Date().toISOString() : null,
            featured: false,
            breaking: false,
            premium_only: false,
            status: publishImmediately ? 'published' : 'draft',
          };

          const { error } = await supabase
            .from('articles')
            .insert([articleData]);

          if (error) throw error;
          successCount++;
        } catch (error: any) {
          console.error('Import error:', error);
          errorCount++;
          errors.push(`${item.title}: ${error.message}`);
        }
      }

      toast({
        title: 'Importação concluída',
        description: `${successCount} artigos importados com sucesso${errorCount > 0 ? `, ${errorCount} erros` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      onImportComplete?.({ successCount, errorCount, errors });

      // Reset
      setFeedItems([]);
      setSelectedItems(new Set());
      setFeedUrl('');
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Importar Feed RSS/Atom
          </CardTitle>
          <CardDescription>
            Cole a URL de um feed RSS ou Atom para importar artigos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                placeholder="https://example.com/feed.xml"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button onClick={fetchFeed} disabled={loading || !feedUrl.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Buscar Feed'
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p><strong>Exemplos de feeds públicos:</strong></p>
            <ul className="list-disc list-inside mt-1">
              <li>Agência Brasil: https://agenciabrasil.ebc.com.br/rss/ultimasnoticias</li>
              <li>G1: https://g1.globo.com/rss/g1/</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {feedItems.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Categoria Padrão</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Portal (Tenant)</Label>
                  <Select value={tenantId} onValueChange={setTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um portal" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={publishImmediately}
                  onCheckedChange={setPublishImmediately}
                />
                <Label>Publicar imediatamente</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Artigos Encontrados ({feedItems.length})</CardTitle>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={toggleAll}>
                    {selectedItems.size === feedItems.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </Button>
                  <Badge variant="secondary">
                    {selectedItems.size} selecionados
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {feedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedItems.has(index)}
                      onCheckedChange={() => toggleItem(index)}
                    />
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium line-clamp-2">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.pubDate && <span>{new Date(item.pubDate).toLocaleDateString()}</span>}
                        {item.author && <span>• {item.author}</span>}
                        {item.category && <Badge variant="outline">{item.category}</Badge>}
                      </div>
                    </div>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end">
                <Button
                  onClick={importSelected}
                  disabled={importing || selectedItems.size === 0}
                  size="lg"
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    `Importar ${selectedItems.size} Artigo${selectedItems.size !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
