import { Image, FileCode, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdPreviewProps {
  creative: {
    type?: "image" | "html" | "video";
    image_url?: string;
    video_url?: string;
    html_content?: string;
    width?: number;
    height?: number;
    headline?: string;
    description?: string;
  };
}

export function AdPreview({ creative }: AdPreviewProps) {
  if (!creative.type) {
    return (
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <Image className="h-8 w-8" />
          <FileCode className="h-8 w-8" />
          <Video className="h-8 w-8" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Selecione um tipo de criativo para ver o preview
        </p>
      </div>
    );
  }

  const style = {
    width: creative.width || 300,
    height: creative.height || 250,
  };

  if (creative.type === "image" && creative.image_url) {
    return (
      <div className="space-y-2">
        <div className="border rounded-lg overflow-hidden shadow-md bg-background">
          <img
            src={creative.image_url}
            alt="Preview"
            style={style}
            className="w-full h-full object-cover"
          />
        </div>
        {creative.headline && (
          <div className="px-2">
            <p className="font-semibold text-sm">{creative.headline}</p>
            {creative.description && (
              <p className="text-xs text-muted-foreground">{creative.description}</p>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 px-2">
          <Badge variant="outline" className="text-xs">
            <Image className="h-3 w-3 mr-1" />
            {creative.width || 300} × {creative.height || 250}px
          </Badge>
        </div>
      </div>
    );
  }

  if (creative.type === "html" && creative.html_content) {
    return (
      <div className="space-y-2">
        <div className="border rounded-lg overflow-hidden shadow-md bg-background">
          <iframe
            srcDoc={creative.html_content.replace(/__CLICK__/g, "javascript:void(0)")}
            style={style}
            sandbox="allow-same-origin"
            className="border-0 w-full"
            title="HTML Preview"
          />
        </div>
        <div className="flex items-center gap-2 px-2">
          <Badge variant="outline" className="text-xs">
            <FileCode className="h-3 w-3 mr-1" />
            {creative.width || 300} × {creative.height || 250}px
          </Badge>
        </div>
      </div>
    );
  }

  if (creative.type === "video" && creative.video_url) {
    return (
      <div className="space-y-2">
        <div className="border rounded-lg overflow-hidden shadow-md bg-background">
          <video
            src={creative.video_url}
            controls
            style={style}
            className="w-full h-full object-cover"
          />
        </div>
        {creative.headline && (
          <div className="px-2">
            <p className="font-semibold text-sm">{creative.headline}</p>
            {creative.description && (
              <p className="text-xs text-muted-foreground">{creative.description}</p>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 px-2">
          <Badge variant="outline" className="text-xs">
            <Video className="h-3 w-3 mr-1" />
            {creative.width || 640} × {creative.height || 360}px
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground"
      style={style}
    >
      <div className="text-center p-4">
        <p className="text-sm">Nenhum conteúdo disponível</p>
        <p className="text-xs mt-1">Adicione uma URL ou faça upload</p>
      </div>
    </div>
  );
}
