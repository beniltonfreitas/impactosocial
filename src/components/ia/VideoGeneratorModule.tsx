import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Video, AlertTriangle } from "lucide-react";
import { IAUsageBadge } from "./IAUsageBadge";

export function VideoGeneratorModule() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5s');
  const [resolution, setResolution] = useState('720p');

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Recurso em Configuração</AlertTitle>
        <AlertDescription>
          O Gerador de Vídeos IA requer integração com API externa (RunwayML ou Pika Labs).
          Entre em contato com o administrador para habilitar este recurso.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Gerador de Vídeos IA
              </CardTitle>
              <CardDescription>
                Transforme texto em vídeos impressionantes (em breve)
              </CardDescription>
            </div>
            <IAUsageBadge type="videos" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição do Vídeo</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva o vídeo que deseja gerar..."
              className="min-h-[100px]"
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração</label>
              <Select value={duration} onValueChange={setDuration} disabled>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Resolução</label>
              <Select value={resolution} onValueChange={setResolution} disabled>
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

          <Button disabled className="w-full gap-2">
            <Video className="h-4 w-4" />
            Gerar Vídeo (Em breve)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            O Gerador de Vídeos IA utiliza modelos avançados de inteligência artificial para
            criar vídeos curtos a partir de descrições em texto.
          </p>
          <p>
            <strong>Recursos planejados:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Vídeos de 5 a 15 segundos</li>
            <li>Resolução HD e Full HD</li>
            <li>Estilos: realista, animado, cinematográfico</li>
            <li>Músicas e efeitos sonoros automáticos</li>
            <li>Exportação em MP4</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}