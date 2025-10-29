import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";

interface FlagCommentDialogProps {
  commentId: string;
  onFlagged?: () => void;
}

export function FlagCommentDialog({ commentId, onFlagged }: FlagCommentDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para denunciar comentários.",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Selecione um motivo",
        description: "Por favor, selecione o motivo da denúncia.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('comment_flags')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          reason,
          details: details || null,
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Você já denunciou este comentário",
            description: "Cada usuário pode denunciar um comentário apenas uma vez.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Denúncia enviada",
          description: "Obrigado pela denúncia. Nossa equipe irá analisar.",
        });
        setOpen(false);
        setReason("");
        setDetails("");
        onFlagged?.();
      }
    } catch (error) {
      console.error('Error flagging comment:', error);
      toast({
        title: "Erro ao denunciar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          <Flag className="h-3 w-3 mr-1" />
          Denunciar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar Comentário</DialogTitle>
          <DialogDescription>
            Ajude-nos a manter a comunidade segura. Selecione o motivo da denúncia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Motivo *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam ou publicidade</SelectItem>
                <SelectItem value="offensive">Conteúdo ofensivo</SelectItem>
                <SelectItem value="misinformation">Desinformação</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="details">Detalhes (opcional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Forneça mais informações sobre a denúncia..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {details.length}/500 caracteres
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !reason}
              variant="destructive"
            >
              {loading ? "Enviando..." : "Enviar Denúncia"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
