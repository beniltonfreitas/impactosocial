import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArticleFormComplete } from '@/components/admin/ArticleFormComplete';
import { IAReporterImport } from '@/components/admin/IAReporterImport';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Eye, Calendar, Upload, FileText, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SEO } from '@/components/SEO';
import { useNavigate } from 'react-router-dom';

export default function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'created' | 'published'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [categories, setCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [deletingId, setDeletingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchTerm, statusFilter, categoryFilter, dateFilter, dateFrom, dateTo]);

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
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title?.toLowerCase().includes(term) ||
          a.slug?.toLowerCase().includes(term) ||
          a.content?.toLowerCase().includes(term)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Filtro de categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category_id === categoryFilter);
    }

    // Validar período
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast({
        title: 'Data inválida',
        description: 'A data inicial não pode ser maior que a data final',
        variant: 'destructive',
      });
      return;
    }

    // Filtro de data
    if (dateFilter !== 'all' && (dateFrom || dateTo)) {
      filtered = filtered.filter((a) => {
        const dateToCompare = dateFilter === 'created' 
          ? a.created_at 
          : a.published_at;
        
        if (!dateToCompare) return false;
        
        const articleDate = new Date(dateToCompare);
        
        if (dateFrom && dateTo) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          return articleDate >= from && articleDate <= to;
        } else if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          return articleDate >= from;
        } else if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          return articleDate <= to;
        }
        
        return true;
      });
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
    <TooltipProvider>
      <ErrorBoundary>
        <SEO 
          title="Gerenciar Notícias - Admin"
          description="Painel de administração de notícias"
        />
        
        <div className="container mx-auto py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div>
                <h1 className="text-3xl font-bold">Gerenciar Notícias</h1>
                <p className="text-muted-foreground">
                  {filteredArticles.length} de {articles.length} notícias
                  {dateFrom && dateTo && (
                    <span className="ml-2 text-sm">
                      • {format(dateFrom, "dd/MM/yyyy", { locale: ptBR })} até {format(dateTo, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </p>
              </div>
              {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all') && (
                <div className="flex gap-2 flex-wrap">
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: {searchTerm}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {statusFilter === 'published' ? 'Publicado' : 'Rascunho'}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                    </Badge>
                  )}
                  {categoryFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Categoria
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter('all')} />
                    </Badge>
                  )}
                  {dateFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {dateFilter === 'created' ? 'Criação' : 'Publicação'}
                      {dateFrom && dateTo && `: ${format(dateFrom, "dd/MM", { locale: ptBR })} - ${format(dateTo, "dd/MM", { locale: ptBR })}`}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => {
                        setDateFilter('all');
                        setDateFrom(undefined);
                        setDateTo(undefined);
                      }} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Barra de Ações */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 dark:border-blue-900"
              onClick={() => setShowForm(true)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Plus className="h-5 w-5" />
                  Nova Notícia
                </CardTitle>
                <CardDescription>
                  Criar uma nova notícia do zero
                </CardDescription>
              </CardHeader>
            </Card>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 dark:border-purple-900"
                  onClick={() => navigate('/admin/bulk-import')}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <Upload className="h-5 w-5" />
                      Importar em Massa
                    </CardTitle>
                    <CardDescription>
                      Importar múltiplas notícias via JSON
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importar via JSON Premium v2.1</p>
              </TooltipContent>
            </Tooltip>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer opacity-50 border-orange-200 dark:border-orange-900"
              onClick={() => toast({ 
                title: "Em breve", 
                description: "Funcionalidade em desenvolvimento" 
              })}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <FileText className="h-5 w-5" />
                  Post Blog
                </CardTitle>
                <CardDescription>
                  Criar post para blog (em breve)
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* IA Repórter Pró */}
          <IAReporterImport
          categories={categories}
          onSuccess={(articleId) => {
            loadData();
            toast({
              title: 'Artigo importado',
              description: 'A notícia foi criada e está disponível como rascunho',
            });
          }}
        />

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

              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sem filtro de data</SelectItem>
                  <SelectItem value="created">Data de criação</SelectItem>
                  <SelectItem value="published">Data de publicação</SelectItem>
                </SelectContent>
              </Select>
              
              {dateFilter !== 'all' && (
                <DateRangePicker
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateChange={(from, to) => {
                    setDateFrom(from);
                    setDateTo(to);
                  }}
                  placeholder={
                    dateFilter === 'created'
                      ? 'Período de criação'
                      : 'Período de publicação'
                  }
                />
              )}
              
              {dateFilter !== 'all' && (dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                  title="Limpar filtro de data"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

          {/* Lista de notícias */}
          <div className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Carregando notícias...</p>
                </CardContent>
              </Card>
            ) : filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-muted-foreground space-y-2">
                    <Calendar className="h-12 w-12 mx-auto opacity-50" />
                    <p className="text-lg font-medium">Nenhuma notícia encontrada</p>
                    <p className="text-sm">
                      {dateFrom || dateTo
                        ? 'Tente ajustar o período de busca'
                        : 'Crie sua primeira notícia ou ajuste os filtros'}
                    </p>
                    {(dateFrom || dateTo || searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setCategoryFilter('all');
                          setDateFilter('all');
                          setDateFrom(undefined);
                          setDateTo(undefined);
                        }}
                      >
                        Limpar todos os filtros
                      </Button>
                    )}
                  </div>
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
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                            </TooltipTrigger>
                            <TooltipContent>Editar notícia</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setDeletingId(article.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir notícia</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {article.status === 'draft' && (
                          <Badge variant="secondary">Rascunho</Badge>
                        )}
                        {article.status === 'scheduled' && (
                          <>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Agendado
                            </Badge>
                            {article.published_at && (
                              <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                                <Clock className="h-3 w-3" />
                                {format(new Date(article.published_at), "dd/MM 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </Badge>
                            )}
                          </>
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
      </ErrorBoundary>
    </TooltipProvider>
  );
}
