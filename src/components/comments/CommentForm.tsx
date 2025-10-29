import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string()
    .min(3, "Comentário deve ter no mínimo 3 caracteres")
    .max(1000, "Comentário deve ter no máximo 1000 caracteres"),
});

interface CommentFormProps {
  articleId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CommentForm({ articleId, parentId, onSuccess, onCancel }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Faça login para comentar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate input
      commentSchema.parse({ content });

      setLoading(true);

      const { error } = await supabase
        .from('comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          parent_id: parentId || null,
          content: content.trim(),
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: "Comentário enviado",
        description: "Seu comentário foi publicado com sucesso",
      });

      setContent("");
      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error('[CommentForm] Error submitting comment:', error);
        toast({
          title: "Erro",
          description: "Não foi possível enviar o comentário",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50 text-center">
        <p className="text-muted-foreground">Faça login para comentar</p>
      </div>
    );
  }

  const charCount = content.length;
  const maxChars = 1000;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentId ? "Escreva sua resposta..." : "Escreva seu comentário..."}
          className="min-h-[100px] resize-none"
          disabled={loading}
        />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          {charCount}/{maxChars}
        </div>
      </div>
      
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading || charCount < 3 || charCount > maxChars}>
          {loading ? "Enviando..." : "Enviar Comentário"}
        </Button>
      </div>
    </form>
  );
}
