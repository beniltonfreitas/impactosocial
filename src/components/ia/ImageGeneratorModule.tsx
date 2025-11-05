import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Loader2, Download, Share2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import { IAUsageBadge } from "./IAUsageBadge";

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
}

const PROMPT_SUGGESTIONS = [
  "Um pôr do sol vibrante sobre montanhas nevadas",
  "Gato astronauta explorando planetas coloridos",
  "Cidade futurista com carros voadores",
  "Floresta mágica com criaturas bioluminescentes"
];

export function ImageGeneratorModule() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_generated_images')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: prompt.trim(), size }
      });

      if (error) throw error;

      setGeneratedImage({
        id: data.imageId,
        prompt: prompt.trim(),
        image_url: data.imageUrl,
        created_at: new Date().toISOString()
      });

      toast.success('Imagem gerada com sucesso!');
      loadHistory();
    } catch (error: any) {
      console.error('Error generating image:', error);
      if (error.message?.includes('rate limit')) {
        toast.error('Limite de IA excedido. Aguarde 1 minuto.');
      } else if (error.message?.includes('credits')) {
        toast.error('Créditos de IA esgotados.');
      } else if (error.message?.includes('daily limit')) {
        toast.error('Limite diário de gerações atingido (10/dia).');
      } else {
        toast.error('Erro ao gerar imagem: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao fazer download');
    }
  };

  const shareImage = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Imagem gerada por IA',
          text: prompt,
          url: imageUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
      toast.success('Link copiado para área de transferência');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Gerador de Imagens IA
              </CardTitle>
              <CardDescription>
                Crie imagens únicas a partir de descrições em texto
              </CardDescription>
            </div>
            <IAUsageBadge type="images" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição da Imagem</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva a imagem que deseja gerar..."
              className="min-h-[100px]"
              disabled={loading}
            />
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Tamanho</label>
              <Select value={size} onValueChange={setSize} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="256x256">256x256 (Pequeno)</SelectItem>
                  <SelectItem value="512x512">512x512 (Médio)</SelectItem>
                  <SelectItem value="1024x1024">1024x1024 (Grande)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={generateImage}
                disabled={loading || !prompt.trim()}
                className="gap-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4" />
                    Gerar Imagem
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Imagem Gerada</CardTitle>
            <CardDescription>{generatedImage.prompt}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={generatedImage.image_url}
                alt={generatedImage.prompt}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => downloadImage(generatedImage.image_url)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => shareImage(generatedImage.image_url)}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPrompt(generatedImage.prompt);
                  generateImage();
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
          <CardDescription>Suas últimas 8 gerações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {history.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 ring-primary transition-all"
                onClick={() => setGeneratedImage(img)}
              >
                <img
                  src={img.image_url}
                  alt={img.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}