import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  status: string;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  avatar_url: string | null;
  replies_count: number;
}

interface CommentsSectionProps {
  articleId: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments_with_users')
        .select('*')
        .eq('article_id', articleId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('[CommentsSection] Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`comments:${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          console.log('[CommentsSection] Real-time update received');
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Comentários</h2>
        <Separator />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Comentários</h2>
        <p className="text-sm text-muted-foreground">
          {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
        </p>
      </div>

      <CommentForm articleId={articleId} onSuccess={fetchComments} />

      <Separator />

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              id={comment.id}
              content={comment.content}
              userId={comment.user_id}
              fullName={comment.full_name}
              avatarUrl={comment.avatar_url}
              createdAt={comment.created_at}
              editedAt={comment.edited_at}
              repliesCount={comment.replies_count}
              articleId={articleId}
              onReplyAdded={fetchComments}
            />
          ))
        )}
      </div>
    </div>
  );
}
