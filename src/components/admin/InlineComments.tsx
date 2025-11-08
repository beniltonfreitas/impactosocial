import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InlineCommentsProps {
  articleId: string;
  workflowId: string;
}

export function InlineComments({ articleId, workflowId }: InlineCommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
    
    const channel = supabase
      .channel('review-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_review_comments',
          filter: `article_id=eq.${articleId}`
        },
        () => loadComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId]);

  const loadComments = async () => {
    const { data } = await supabase
      .from('article_review_comments')
      .select(`
        *,
        created_by_profile:profiles!created_by(full_name),
        resolved_by_profile:profiles!resolved_by(full_name)
      `)
      .eq('article_id', articleId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('article_review_comments')
        .insert({
          workflow_id: workflowId,
          article_id: articleId,
          content: newComment,
          comment_type: 'general',
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Comentário adicionado!');
      setNewComment('');
      await loadComments();
    } catch (error: any) {
      toast.error('Erro ao adicionar comentário');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    const { error } = await supabase
      .from('article_review_comments')
      .update({
        status: 'resolved',
        resolved_by: (await supabase.auth.getUser()).data.user?.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (!error) {
      toast.success('Comentário resolvido!');
      loadComments();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Textarea
              placeholder="Adicionar comentário de revisão..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Adicionar Comentário
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum comentário de revisão ainda.
            </CardContent>
          </Card>
        ) : (
          comments.map(comment => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {comment.created_by_profile?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {comment.created_by_profile?.full_name || 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      
                      <Badge variant={comment.status === 'resolved' ? 'default' : 'secondary'}>
                        {comment.status === 'resolved' ? 'Resolvido' : 'Aberto'}
                      </Badge>
                    </div>

                    <p className="text-sm">{comment.content}</p>

                    {comment.status !== 'resolved' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(comment.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Marcar como Resolvido
                        </Button>
                      </div>
                    )}

                    {comment.status === 'resolved' && comment.resolved_by_profile && (
                      <p className="text-xs text-muted-foreground">
                        Resolvido por {comment.resolved_by_profile.full_name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
