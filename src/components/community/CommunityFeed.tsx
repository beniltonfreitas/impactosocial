import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CommunityComments } from './CommunityComments';

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function CommunityFeed() {
  const [newPost, setNewPost] = useState('');
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-feed'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('community-feed');
      if (error) throw error;
      return data as Post[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase.functions.invoke('community-create-post', {
        body: { content },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewPost('');
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      toast.success('Postagem publicada!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao publicar');
    },
  });

  const likePost = useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.functions.invoke('community-like-post', {
        body: { post_id: postId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando feed...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Nova Postagem */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Compartilhe algo com a comunidade</h3>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="O que você está pensando?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <Button
            onClick={() => createPost.mutate(newPost)}
            disabled={!newPost.trim() || createPost.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {createPost.isPending ? 'Publicando...' : 'Publicar'}
          </Button>
        </CardContent>
      </Card>

      {/* Feed de Postagens */}
      {posts && posts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma postagem ainda. Seja o primeiro a compartilhar!
          </CardContent>
        </Card>
      )}

      {posts?.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.profiles?.avatar_url || ''} />
                <AvatarFallback>{post.profiles?.full_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{post.profiles?.full_name || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
            
            {post.media_url && post.media_type === 'image' && (
              <img
                src={post.media_url}
                alt="Post media"
                className="rounded-lg w-full mb-4 max-h-96 object-cover"
              />
            )}

            <div className="flex items-center gap-4 text-muted-foreground border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => likePost.mutate(post.id)}
                className="gap-2"
              >
                <Heart 
                  className={`h-4 w-4 ${post.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} 
                />
                {post.likes_count}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
              >
                <MessageCircle className="h-4 w-4" />
                {post.comments_count}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {expandedComments === post.id && (
              <CommunityComments postId={post.id} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
