import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Download, Share2, RefreshCw, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";

interface GeneratedImage {
  url: string;
  id: string;
  prompt: string;
  createdAt: string;
}

const PROMPT_SUGGESTIONS = [
  "Uma paisagem montanhosa ao pôr do sol",
  "Um gato branco em estilo aquarela",
  "Cidade futurista com carros voadores",
  "Retrato de uma pessoa sorrindo",
  "Abstrato com cores vibrantes"
];

export function IACreativeGenerator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(10);

  useEffect(() => {
    if (user) {
      loadHistory();
      checkDailyLimit();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setHistory(data.map(img => ({
        url: img.image_url,
        id: img.id,
        prompt: img.prompt,
        createdAt: img.created_at
      })));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const checkDailyLimit = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('ai_generated_images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today);

      setAttemptsLeft(10 - (count || 0));
    } catch (error) {
      console.error('Erro ao verificar limite:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, descreva a imagem que deseja gerar');
      return;
    }

    if (attemptsLeft <= 0) {
      toast.error('Você atingiu o limite diário de 10 imagens');
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, size }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const newImage: GeneratedImage = {
        url: data.imageUrl,
        id: data.imageId,
        prompt,
        createdAt: new Date().toISOString()
      };

      setGeneratedImage(newImage);
      setHistory(prev => [newImage, ...prev.slice(0, 9)]);
      setAttemptsLeft(data.attemptsLeft);
      toast.success('Imagem gerada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar imagem:', error);
      toast.error(error.message || 'Erro ao gerar imagem');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string, promptText: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ia-criativa-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao fazer download');
    }
  };

  const handleShare = async (imageUrl: string, promptText: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Imagem gerada com IA Criativa',
          text: `Imagem criada com o prompt: "${promptText}"`,
          url: imageUrl
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleRegenerate = () => {
    if (generatedImage) {
      setPrompt(generatedImage.prompt);
      handleGenerate();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            IA Criativa - Gerador de Imagens
          </CardTitle>
          <CardDescription>
            Crie imagens únicas usando inteligência artificial. {attemptsLeft} gerações restantes hoje.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Descreva a imagem que deseja criar</Label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Uma paisagem montanhosa ao pôr do sol com cores vibrantes"
                disabled={loading}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setPrompt(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Tamanho da Imagem</Label>
              <Select value={size} onValueChange={setSize} disabled={loading}>
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1024x1024 (Padrão)</SelectItem>
                  <SelectItem value="1536">1536x1024 (Paisagem)</SelectItem>
                  <SelectItem value="1024x1536">1024x1536 (Retrato)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || attemptsLeft <= 0}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando imagem...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Imagem
                </>
              )}
            </Button>

            {attemptsLeft <= 3 && attemptsLeft > 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-600">
                  Você tem apenas {attemptsLeft} {attemptsLeft === 1 ? 'geração' : 'gerações'} restante{attemptsLeft === 1 ? '' : 's'} hoje.
                </p>
              </div>
            )}
          </div>

          {generatedImage && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-background">
                <img
                  src={generatedImage.url}
                  alt={generatedImage.prompt}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Prompt:</strong> {generatedImage.prompt}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(generatedImage.url, generatedImage.prompt)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(generatedImage.url, generatedImage.prompt)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={loading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regerar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Histórico de Imagens
            </CardTitle>
            <CardDescription>
              Suas últimas 10 imagens geradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {history.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer">
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onClick={() => setGeneratedImage(img)}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-white text-xs line-clamp-2">{img.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
