import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Download, Share2, RefreshCw, AlertCircle, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface GeneratedImage {
  url: string;
  id: string;
  prompt: string;
  createdAt: string;
}

const PROMPT_SUGGESTIONS = [
  "Uma praça inclusiva com pessoas de todas as idades e deficiências convivendo em harmonia",
  "Espaço urbano acessível com rampas e sinalização tátil detalhada",
  "Parque com brinquedos adaptados para crianças PcD em cores vibrantes",
  "Centro comunitário moderno e acolhedor com arquitetura inclusiva",
  "Biblioteca com recursos de acessibilidade e tecnologia assistiva"
];

export default function GerarImagem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState(10);

  useEffect(() => {
    if (!user) {
      toast.error("Você precisa estar logado para usar o gerador de imagens");
      navigate("/auth");
      return;
    }
    loadHistory();
    checkDailyLimit();
  }, [user, navigate]);

  const loadHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('ai_generated_images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8);

    if (!error && data) {
      setHistory(data.map(img => ({
        url: img.image_url,
        id: img.id,
        prompt: img.prompt,
        createdAt: img.created_at
      })));
    }
  };

  const checkDailyLimit = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('ai_generated_images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today);

    setAttemptsLeft(10 - (count || 0));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Por favor, descreva o que deseja gerar");
      return;
    }

    if (attemptsLeft <= 0) {
      toast.error("Limite diário atingido. Tente novamente amanhã!");
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
        prompt: prompt,
        createdAt: new Date().toISOString()
      };

      setGeneratedImage(newImage);
      setAttemptsLeft(data.attemptsLeft);
      setHistory(prev => [newImage, ...prev].slice(0, 8));
      toast.success("Imagem gerada com sucesso!");

    } catch (error: any) {
      console.error('Erro ao gerar imagem:', error);
      toast.error(error.message || "Erro ao gerar imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `impacto-social-${Date.now()}.png`;
    a.click();
    toast.success("Download iniciado!");
  };

  const handleShare = async (imageUrl: string, prompt: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Imagem gerada por IA',
          text: `"${prompt}" - Gerado no Impacto Social`,
          url: imageUrl
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      await navigator.clipboard.writeText(imageUrl);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handleRegenerate = () => {
    handleGenerate({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <>
      <SEO 
        title="IA Criativa - Gerador de Imagens"
        description="Crie imagens exclusivas com inteligência artificial. Descreva sua visão e veja a mágica acontecer."
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gradient-to-b from-background to-muted/20 py-12 px-4">
          <div className="container max-w-4xl mx-auto">
            {/* Cabeçalho */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Powered by Lovable AI</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                🧠 IA Criativa - Gerador de Imagens
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Digite o que deseja visualizar e veja a mágica acontecer. 
                A IA do Impacto Social cria imagens exclusivas inspiradas em sua imaginação.
              </p>
            </div>

            {/* Alerta de limite */}
            {attemptsLeft < 3 && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você tem {attemptsLeft} gerações restantes hoje.
                  {attemptsLeft === 0 && " Tente novamente amanhã!"}
                </AlertDescription>
              </Alert>
            )}

            {/* Formulário */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Descreva sua imagem</CardTitle>
                <CardDescription>
                  Seja detalhado e criativo para melhores resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Uma praça inclusiva com pessoas de todas as idades e deficiências convivendo em harmonia."
                    className="min-h-[120px] resize-none"
                    disabled={loading}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tamanho</label>
                      <Select value={size} onValueChange={setSize} disabled={loading}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1024">1024×1024 (Recomendado)</SelectItem>
                          <SelectItem value="512">512×512</SelectItem>
                          <SelectItem value="256">256×256</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading || attemptsLeft <= 0}
                  >
                    {loading ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                        Gerando imagem...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="mr-2 h-5 w-5" />
                        Gerar Imagem
                      </>
                    )}
                  </Button>
                </form>

                {/* Sugestões */}
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Sugestões de prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_SUGGESTIONS.slice(0, 3).map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt(suggestion)}
                        disabled={loading}
                        className="text-xs"
                      >
                        {suggestion.slice(0, 40)}...
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading */}
            {loading && (
              <Card className="mb-8">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="relative mb-4">
                    <Sparkles className="w-16 h-16 text-primary animate-pulse" />
                    <div className="absolute inset-0 animate-ping">
                      <Sparkles className="w-16 h-16 text-primary/30" />
                    </div>
                  </div>
                  <p className="text-primary font-medium text-lg">
                    Gerando imagem, aguarde...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Isso pode levar até 30 segundos
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Resultado */}
            {generatedImage && !loading && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>🖼️ Resultado</CardTitle>
                  <CardDescription>{generatedImage.prompt}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <img 
                    src={generatedImage.url} 
                    alt="Imagem gerada pela IA"
                    className="w-full rounded-lg shadow-lg"
                  />
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => handleDownload(generatedImage.url)}
                      variant="secondary"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                    <Button 
                      onClick={() => handleShare(generatedImage.url, generatedImage.prompt)}
                      variant="secondary"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
                    <Button 
                      onClick={handleRegenerate}
                      variant="secondary"
                      disabled={attemptsLeft <= 0}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Gerar Novamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico */}
            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>📜 Suas últimas criações</CardTitle>
                  <CardDescription>Suas últimas 8 imagens geradas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {history.map((img) => (
                      <div 
                        key={img.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setGeneratedImage(img)}
                      >
                        <img 
                          src={img.url} 
                          alt={img.prompt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                          <p className="text-white text-xs text-center line-clamp-3">
                            {img.prompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
