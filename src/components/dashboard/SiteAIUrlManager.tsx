import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Link2, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeSource {
  type: 'file' | 'url';
  name: string;
  url: string;
  size?: number;
  content_preview?: string;
  uploaded_at: string;
  status?: 'pending' | 'processed' | 'error';
  error_message?: string;
}

interface Props {
  urls: KnowledgeSource[];
  onAddUrl: (url: string) => Promise<void>;
  onRemoveUrl: (url: string) => void;
  onRefreshUrl: (url: string) => Promise<void>;
  maxUrls?: number;
}

export function SiteAIUrlManager({ urls, onAddUrl, onRemoveUrl, onRefreshUrl, maxUrls = 10 }: Props) {
  const [urlInput, setUrlInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [refreshingUrl, setRefreshingUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "URL vazia",
        description: "Por favor, insira uma URL válida.",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(urlInput)) {
      toast({
        title: "URL inválida",
        description: "A URL deve começar com https://",
        variant: "destructive",
      });
      return;
    }

    if (urls.some(u => u.url === urlInput)) {
      toast({
        title: "URL duplicada",
        description: "Esta URL já foi adicionada.",
        variant: "destructive",
      });
      return;
    }

    if (urls.length >= maxUrls) {
      toast({
        title: "Limite atingido",
        description: `Você pode adicionar no máximo ${maxUrls} links.`,
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      await onAddUrl(urlInput);
      setUrlInput("");
      toast({
        title: "Link adicionado",
        description: "O conteúdo está sendo processado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar link",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRefresh = async (url: string) => {
    setRefreshingUrl(url);
    try {
      await onRefreshUrl(url);
      toast({
        title: "Link atualizado",
        description: "O conteúdo foi reprocessado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setRefreshingUrl(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://exemplo.com/artigo"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
          disabled={isAdding}
        />
        <Button 
          onClick={handleAddUrl} 
          disabled={isAdding || urls.length >= maxUrls}
        >
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Adicionar
            </>
          )}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {urls.length}/{maxUrls} links adicionados
      </div>

      <div className="space-y-3">
        {urls.map((source) => (
          <Card key={source.url} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h4 className="font-medium truncate">{source.name}</h4>
                  {source.status === 'pending' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {source.status === 'error' && (
                    <span className="text-xs text-red-500">Erro</span>
                  )}
                </div>
                
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                >
                  {source.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
                
                <p className="text-xs text-muted-foreground mt-1">
                  Processado {formatDate(source.uploaded_at)}
                </p>
                
                {source.content_preview && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {source.content_preview}
                  </p>
                )}
                
                {source.error_message && (
                  <p className="text-sm text-red-500 mt-2">
                    {source.error_message}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRefresh(source.url)}
                  disabled={refreshingUrl === source.url}
                >
                  {refreshingUrl === source.url ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemoveUrl(source.url)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {urls.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum link externo adicionado</p>
          <p className="text-sm mt-1">Adicione URLs para alimentar a base de conhecimento</p>
        </div>
      )}
    </div>
  );
}
