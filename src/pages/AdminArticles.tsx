import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArticleFormComplete } from '@/components/admin/ArticleFormComplete';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Eye, Calendar } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SEO } from '@/components/SEO';

export default function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [deletingId, setDeletingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [articlesRes, categoriesRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*, category:categories(name, slug, color)')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (articlesRes.data) setArticles(articlesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error: any) {
      console.error('Load error:', error);
      toast({
        title: 'Erro ao carregar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      if (statusFilter === 'published') {
        filtered = filtered.filter((a) => a.published_at);
      } else if (statusFilter === 'draft') {
        filtered = filtered.filter((a) => !a.published_at);
      } else if (statusFilter === 'featured') {
        filtered = filtered.filter((a) => a.featured);
      } else if (statusFilter === 'breaking') {
        filtered = filtered.filter((a) => a.breaking);
      } else if (statusFilter === 'premium') {
        filtered = filtered.filter((a) => a.premium_only);
      }
    }

    // Filtro de categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category_id === categoryFilter);
    }

    setFilteredArticles(filtered);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase.from('articles').delete().eq('id', deletingId);

      if (error) throw error;

      toast({
        title: 'Notícia excluída',
        description: 'A notícia foi removida com sucesso',
      });

      loadData();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(undefined);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingId(undefined);
    loadData();
  };

  return (
    <>
      <SEO 
        title="Gerenciar Notícias - Admin"
        description="Painel de administração de notícias"
      />
      
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Notícias</h1>
            <p className="text-muted-foreground">
              {filteredArticles.length} de {articles.length} notícias
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Notícia
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Busque e filtre os artigos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título ou slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="featured">Destaques</SelectItem>
                  <SelectItem value="breaking">Urgentes</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de artigos */}
        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Carregando artigos...
              </CardContent>
            </Card>
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum artigo encontrado
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {article.image_url && (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-32 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{article.title}</h3>
                          <p className="text-sm text-muted-foreground">/{article.slug}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setEditingId(article.id);
                              setShowForm(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setDeletingId(article.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {!article.published_at && (
                          <Badge variant="secondary">Rascunho</Badge>
                        )}
                        {article.featured && <Badge>Destaque</Badge>}
                        {article.breaking && <Badge variant="destructive">Urgente</Badge>}
                        {article.premium_only && <Badge variant="outline">Premium</Badge>}
                        {article.category && (
                          <Badge style={{ backgroundColor: article.category.color }}>
                            {article.category.name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {article.published_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(article.published_at), "dd 'de' MMM, yyyy", {
                              locale: ptBR,
                            })}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views} visualizações
                        </div>
                        {article.author && <span>Por {article.author}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de formulário */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Notícia' : 'Nova Notícia'}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para {editingId ? 'atualizar' : 'criar'} a notícia
              </DialogDescription>
            </DialogHeader>
            <ArticleFormComplete
              articleId={editingId}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingId(undefined);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(undefined)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A notícia será permanentemente removida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
