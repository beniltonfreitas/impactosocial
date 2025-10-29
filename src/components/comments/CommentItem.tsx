import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, Pencil, Trash2, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
  id: string;
  content: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  editedAt: string | null;
  repliesCount: number;
  articleId: string;
  level?: number;
  onReplyAdded?: () => void;
}

export function CommentItem({
  id,
  content,
  userId,
  fullName,
  avatarUrl,
  createdAt,
  editedAt,
  repliesCount,
  articleId,
  level = 0,
  onReplyAdded,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  const isOwner = user?.id === userId;
  const canModerate = hasRole('admin') || hasRole('moderator');
  const canEdit = isOwner && new Date().getTime() - new Date(createdAt).getTime() < 15 * 60 * 1000; // 15 min
  const maxNestingLevel = 3;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Comentário atualizado",
        description: "Suas alterações foram salvas",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('[CommentItem] Error updating comment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o comentário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status: 'deleted' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Comentário excluído",
        description: "O comentário foi removido",
      });
    } catch (error) {
      console.error('[CommentItem] Error deleting comment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o comentário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`space-y-3 ${level > 0 ? 'ml-8 pl-4 border-l-2 border-border' : ''}`}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{fullName || "Usuário"}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {editedAt && (
              <>
                <span className="text-muted-foreground">•</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs">
                        Editado
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Editado em {format(new Date(editedAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                disabled={loading}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={loading}>
                  <Check className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(content);
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{content}</p>
          )}

          <div className="flex gap-2">
            {level < maxNestingLevel && user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Responder {repliesCount > 0 && `(${repliesCount})`}
              </Button>
            )}

            {canEdit && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}

            {(isOwner || canModerate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="ml-12">
          <CommentForm
            articleId={articleId}
            parentId={id}
            onSuccess={() => {
              setShowReplyForm(false);
              onReplyAdded?.();
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  );
}
