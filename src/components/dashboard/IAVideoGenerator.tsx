import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Video, Download, Share2, Sparkles, Clock, Film } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface GeneratedVideo {
  url: string;
  id: string;
  prompt: string;
  duration: string;
  resolution: string;
  createdAt: string;
}

const PROMPT_SUGGESTIONS = [
  "Um gato caminhando em câmera lenta em um jardim florido",
  "Drone sobrevoando uma praia ao pôr do sol",
  "Time-lapse de nuvens se movendo no céu azul",
  "Pessoa correndo em uma trilha de montanha",
  "Gotas de chuva caindo em um lago calmo"
];

export default function IAVideoGenerator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("5s");
  const [resolution, setResolution] = useState("720p");
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'validating' | 'generating' | 'uploading' | 'success' | 'error'>('idle');
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(5);

  useEffect(() => {
    if (user) {
      loadHistory();
      checkDailyLimit();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("ai_generated_videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6);

    if (data) {
      setHistory(data.map(v => ({
        url: v.video_url,
        id: v.id,
        prompt: v.prompt,
        duration: v.duration,
        resolution: v.resolution,
        createdAt: v.created_at
      })));
    }
  };

  const checkDailyLimit = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from("ai_generated_videos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`);

    setAttemptsLeft(5 - (count || 0));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Digite uma descrição para o vídeo");
      return;
    }

    if (attemptsLeft <= 0) {
      toast.error("Limite diário atingido (5 vídeos/dia). Volte amanhã!");
      return;
    }

    setLoading(true);
    setLoadingState('validating');

    try {
      setLoadingState('generating');
      
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: { prompt, duration, resolution }
      });

      if (error) throw error;

      if (data?.error) {
        setLoadingState('error');
        
        const errorMessages: Record<string, string> = {
          NOT_AUTHENTICATED: 'Você precisa estar logado',
          RATE_LIMIT: 'Limite diário atingido (5/dia)',
          BLOCKED_CONTENT: 'Conteúdo bloqueado pelo Guardian IA',
          AI_ERROR: 'Erro na IA. Tente novamente',
          STORAGE_ERROR: 'Erro ao salvar vídeo',
          TIMEOUT: 'Geração demorou demais',
        };
        
        throw new Error(errorMessages[data.error] || data.message || 'Erro ao gerar vídeo');
      }

      setLoadingState('success');
      
      const newVideo: GeneratedVideo = {
        url: data.videoUrl,
        id: data.videoId,
        prompt,
        duration,
        resolution,
        createdAt: new Date().toISOString()
      };

      setCurrentVideo(newVideo);
      setHistory([newVideo, ...history.slice(0, 5)]);
      setAttemptsLeft(data.attemptsLeft || attemptsLeft - 1);
      
      toast.success("Vídeo gerado com sucesso!");
    } catch (error: any) {
      setLoadingState('error');
      console.error("Erro ao gerar vídeo:", error);
      toast.error(error.message || "Erro ao gerar vídeo");
    } finally {
      setLoading(false);
      setTimeout(() => setLoadingState('idle'), 2000);
    }
  };

  const handleDownload = (videoUrl: string, videoId: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video-ia-${videoId}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download iniciado!");
  };

  const handleShare = async (video: GeneratedVideo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vídeo gerado por IA',
          text: video.prompt,
          url: video.url
        });
        toast.success("Compartilhado com sucesso!");
      } catch (err) {
        console.log("Erro ao compartilhar:", err);
      }
    } else {
      navigator.clipboard.writeText(video.url);
      toast.success("Link copiado!");
    }
  };

  const LoadingStateDisplay = () => {
    const states = {
      validating: { icon: Sparkles, text: "Validando conteúdo...", time: "" },
      generating: { icon: Film, text: "Gerando vídeo com IA...", time: "Isso pode levar até 2 minutos" },
      uploading: { icon: Video, text: "Salvando vídeo...", time: "" },
    };

    const state = states[loadingState as keyof typeof states];
    if (!state) return null;

    const Icon = state.icon;

    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium flex items-center gap-2 justify-center">
            <Icon className="h-5 w-5" />
            {state.text}
          </p>
          {state.time && (
            <p className="text-sm text-muted-foreground mt-1">{state.time}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Como funciona?</AlertTitle>
        <AlertDescription>
          Descreva o vídeo que deseja criar e nossa IA gerará um vídeo único em poucos minutos.
          Limite: <strong>{attemptsLeft} vídeos restantes hoje</strong>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Gerador de Vídeo IA
          </CardTitle>
          <CardDescription>
            Crie vídeos personalizados usando inteligência artificial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Descreva o vídeo que deseja criar
            </label>
            <Textarea
              placeholder="Ex: Um gato caminhando em câmera lenta em um jardim florido"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={loading}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(suggestion)}
                  disabled={loading}
                >
                  {suggestion.substring(0, 30)}...
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duração
              </label>
              <Select value={duration} onValueChange={setDuration} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5s">5 segundos</SelectItem>
                  <SelectItem value="10s">10 segundos</SelectItem>
                  <SelectItem value="15s">15 segundos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Film className="h-4 w-4" />
                Resolução
              </label>
              <Select value={resolution} onValueChange={setResolution} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || attemptsLeft <= 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Video className="mr-2 h-4 w-4" />
            )}
            {loading ? "Gerando..." : "Gerar Vídeo"}
          </Button>

          {loading && <LoadingStateDisplay />}

          {currentVideo && !loading && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <video
                  src={currentVideo.url}
                  controls
                  className="w-full rounded-lg mb-4"
                  autoPlay
                  loop
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(currentVideo.url, currentVideo.id)}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(currentVideo)}
                    className="flex-1"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico Recente</CardTitle>
            <CardDescription>Seus últimos vídeos gerados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((video) => (
                <Card key={video.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-3">
                    <video
                      src={video.url}
                      className="w-full h-40 object-cover rounded-lg mb-2"
                      onClick={() => setCurrentVideo(video)}
                    />
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {video.prompt}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(video.url, video.id)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(video)}
                        className="flex-1"
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
