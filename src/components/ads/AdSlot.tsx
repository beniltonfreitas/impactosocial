import { useEffect, useState } from "react";
import { FN_BASE, TENANT_NAME } from "@/lib/constants";

interface Creative {
  campaignId: string;
  creativeId: string;
  type: "image" | "html" | "video";
  imageUrl?: string;
  htmlContent?: string;
  videoUrl?: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
  targetUrl: string;
  width?: number;
  height?: number;
}

interface AdSlotProps {
  slot: string;
  page?: string;
  className?: string;
}

export function AdSlot({ slot, page = "/", className = "" }: AdSlotProps) {
  const [creative, setCreative] = useState<Creative | null>(null);
  const [loading, setLoading] = useState(true);
  const tenant = TENANT_NAME;

  useEffect(() => {
    if (!tenant) return;

    const fetchAd = async () => {
      try {
        const response = await fetch(
          `${FN_BASE}/ad-fetch?slot=${encodeURIComponent(slot)}&page=${encodeURIComponent(page)}&tenant=${encodeURIComponent(tenant)}`
        );
        
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data && data.campaignId) {
          setCreative(data);
          
          // Registrar impressão via sendBeacon (não bloqueia)
          if (navigator.sendBeacon) {
            const impressionData = JSON.stringify({
              campaignId: data.campaignId,
              creativeId: data.creativeId,
              tenantId: tenant,
              slot,
              page,
            });
            
            navigator.sendBeacon(`${FN_BASE}/ad-impression`, impressionData);
          }
        }
      } catch (error) {
        console.error("Error fetching ad:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [slot, page, tenant]);

  if (loading || !creative) {
    return null;
  }

  const clickUrl = `${FN_BASE}/ad-click?c=${encodeURIComponent(creative.campaignId)}&k=${encodeURIComponent(creative.creativeId)}&s=${encodeURIComponent(slot)}&u=${encodeURIComponent(creative.targetUrl)}&t=${encodeURIComponent(tenant)}`;

  // Renderizar anúncio HTML customizado
  if (creative.type === "html" && creative.htmlContent) {
    const htmlWithClick = creative.htmlContent.replace(
      /__CLICK__/g,
      clickUrl
    );
    
    return (
      <div
        className={`ad-slot ad-slot-${slot} ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlWithClick }}
      />
    );
  }

  // Renderizar anúncio de vídeo
  if (creative.type === "video" && creative.videoUrl) {
    return (
      <div className={`ad-slot ad-slot-${slot} ${className}`}>
        <a
          href={clickUrl}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="block"
        >
          <video
            src={creative.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: creative.width || 300,
              height: creative.height || 250,
              maxWidth: "100%",
            }}
            className="rounded-lg"
          />
        </a>
      </div>
    );
  }

  // Renderizar anúncio de imagem (padrão)
  if (creative.imageUrl) {
    return (
      <div className={`ad-slot ad-slot-${slot} ${className}`}>
        <a
          href={clickUrl}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="block"
        >
          <img
            src={creative.imageUrl}
            alt={creative.headline || "Publicidade"}
            style={{
              width: creative.width || 300,
              height: creative.height || 250,
              maxWidth: "100%",
            }}
            className="rounded-lg object-cover"
          />
          {creative.headline && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {creative.headline}
            </p>
          )}
        </a>
      </div>
    );
  }

  return null;
}
