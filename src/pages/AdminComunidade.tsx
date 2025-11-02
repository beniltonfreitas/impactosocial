import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Navigate } from 'react-router-dom';

export default function AdminComunidade() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Postagem deletada');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar');
    },
  });

  const refreshRanking = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('refresh_community_ranking');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ranking atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar ranking');
    },
  });

  if (!hasRole('admin')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Moderação da Comunidade - Admin"
        description="Painel de moderação da Comunidade Illúmina"
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Moderação da Comunidade</h1>
            <Button
              onClick={() => refreshRanking.mutate()}
              disabled={refreshRanking.isPending}
              variant="outline"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshRanking.isPending ? 'animate-spin' : ''}`} />
              Atualizar Ranking
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Postagens Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando postagens...
                </div>
              )}

              {!isLoading && (!posts || posts.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma postagem encontrada
                </div>
              )}

              <div className="space-y-4">
                {posts?.map((post: any) => (
                  <div key={post.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{post.profiles?.full_name || 'Usuário'}</span>
                        <Badge variant="outline" className="text-xs">
                          {new Date(post.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>❤️ {post.likes_count} curtidas</span>
                        <span>💬 {post.comments_count} comentários</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/dashboard?tab=community`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja deletar esta postagem?')) {
                            deletePost.mutate(post.id);
                          }
                        }}
                        disabled={deletePost.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
