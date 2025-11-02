import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommunityCommentsProps {
  postId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function CommunityComments({ postId }: CommunityCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['community-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('community-get-comments', {
        body: { post_id: postId },
      });
      if (error) throw error;
      return data as Comment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase.functions.invoke('community-add-comment', {
        body: { post_id: postId, content },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['community-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      toast.success('Comentário adicionado!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao comentar');
    },
  });

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {/* Formulário de novo comentário */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Adicione um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button
          onClick={() => addComment.mutate(newComment)}
          disabled={!newComment.trim() || addComment.isPending}
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de comentários */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando comentários...</p>
      )}

      {comments && comments.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Seja o primeiro!</p>
      )}

      <div className="space-y-3">
        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.profiles?.avatar_url || ''} />
              <AvatarFallback>{comment.profiles?.full_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-muted rounded-lg p-3">
                <p className="font-semibold text-sm">{comment.profiles?.full_name || 'Usuário'}</p>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-3">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
