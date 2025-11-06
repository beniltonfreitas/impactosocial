import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IlluminaAdminLayout } from '@/components/layout/IlluminaAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  article_id: string;
  profile: {
    full_name: string;
  } | null;
  articles: {
    title: string;
  } | null;
}

export default function AdminComentarios() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          article_id,
          profiles!user_id(full_name),
          articles!article_id(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformar dados para o formato esperado
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        profile: item.profiles,
        articles: item.articles,
      }));
      
      setComments(formattedData as Comment[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Comentário excluído',
        description: 'O comentário foi removido com sucesso',
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredComments = comments.filter(
    (c) =>
      c.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.articles?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <IlluminaAdminLayout title="Gerenciar Comentários">
      <Card>
        <CardHeader>
          <CardTitle>Comentários do Sistema</CardTitle>
          <CardDescription>
            {filteredComments.length} comentários encontrados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por conteúdo, autor ou notícia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Autor</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Notícia</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <span className="font-medium">{comment.profile?.full_name || 'Anônimo'}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate">{comment.content}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate">{comment.articles?.title}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </IlluminaAdminLayout>
  );
}
