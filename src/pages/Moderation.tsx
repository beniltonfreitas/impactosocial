import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { Flag, Clock, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  flags_count: number;
  status: string;
  full_name: string;
  avatar_url: string | null;
  article_id: string;
}

interface CommentFlag {
  reason: string;
  details: string | null;
  created_at: string;
}

const Moderation = () => {
  const [flaggedComments, setFlaggedComments] = useState<Comment[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [deletedComments, setDeletedComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchComments();

    // Real-time para novos comentários denunciados
    const channel = supabase
      .channel('moderation-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comment_flags'
        },
        () => {
          toast({
            title: "Nova denúncia",
            description: "Um novo comentário foi denunciado.",
          });
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);

      // Comentários denunciados
      const { data: flagged } = await supabase
        .from('comments_with_users')
        .select('*')
        .eq('status', 'active')
        .gt('flags_count', 0)
        .order('flags_count', { ascending: false })
        .limit(50);

      // Comentários recentes
      const { data: recent } = await supabase
        .from('comments_with_users')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      // Comentários deletados
      const { data: deleted } = await supabase
        .from('comments_with_users')
        .select('*')
        .eq('status', 'deleted')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (flagged) setFlaggedComments(flagged as any);
      if (recent) setRecentComments(recent as any);
      if (deleted) setDeletedComments(deleted as any);

    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os comentários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      // Deletar todas as flags do comentário
      await supabase
        .from('comment_flags')
        .delete()
        .eq('comment_id', commentId);

      // Resetar contador de flags
      await supabase
        .from('comments')
        .update({ flags_count: 0 })
        .eq('id', commentId);

      toast({
        title: "Comentário aprovado",
        description: "As denúncias foram removidas.",
      });

      fetchComments();
    } catch (error) {
      console.error('Error approving comment:', error);
      toast({
        title: "Erro ao aprovar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedComment) return;

    try {
      await supabase
        .from('comments')
        .update({ status: 'deleted' })
        .eq('id', selectedComment);

      toast({
        title: "Comentário deletado",
        description: "O comentário foi removido.",
      });

      setDeleteDialogOpen(false);
      setSelectedComment(null);
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Erro ao deletar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const CommentCard = ({ comment, showActions = true }: { comment: Comment; showActions?: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold">
                {comment.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <CardTitle className="text-base">{comment.full_name}</CardTitle>
              <CardDescription className="text-xs">
                {new Date(comment.created_at).toLocaleString('pt-BR')}
              </CardDescription>
            </div>
          </div>
          {comment.flags_count > 0 && (
            <Badge variant="destructive">
              <Flag className="h-3 w-3 mr-1" />
              {comment.flags_count} denúncias
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{comment.content}</p>

        {showActions && comment.status === 'active' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApprove(comment.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setSelectedComment(comment.id);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Deletar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!hasRole('moderator') && !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta página.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Moderação de Comentários" />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel de Moderação</h1>
          <p className="text-muted-foreground">
            Gerencie comentários denunciados e mantenha a comunidade segura.
          </p>
        </div>

        <Tabs defaultValue="flagged" className="space-y-6">
          <TabsList>
            <TabsTrigger value="flagged" className="gap-2">
              <Flag className="h-4 w-4" />
              Denunciados ({flaggedComments.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="h-4 w-4" />
              Recentes ({recentComments.length})
            </TabsTrigger>
            <TabsTrigger value="deleted" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Deletados ({deletedComments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flagged" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : flaggedComments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum comentário denunciado no momento.
                </CardContent>
              </Card>
            ) : (
              flaggedComments.map(comment => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              recentComments.map(comment => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="deleted" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : deletedComments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum comentário deletado.
                </CardContent>
              </Card>
            ) : (
              deletedComments.map(comment => (
                <CommentCard key={comment.id} comment={comment} showActions={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este comentário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default Moderation;
