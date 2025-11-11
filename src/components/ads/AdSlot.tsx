import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TENANT_NAME } from "@/lib/constants";

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
        const { data, error } = await supabase.functions.invoke('ad-fetch', {
          body: { slot, page, tenantSlug: tenant }
        });
        
        if (error || !data || !data.campaignId) {
          setLoading(false);
          return;
        }

        setCreative(data);
        
        // Registrar impressão
        supabase.functions.invoke('ad-impression', {
          body: {
            campaignId: data.campaignId,
            creativeId: data.creativeId,
            tenantSlug: tenant,
            slot,
            page,
          }
        });
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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Track click
    await supabase.functions.invoke('ad-click', {
      body: {
        campaignId: creative.campaignId,
        creativeId: creative.creativeId,
        slot,
        targetUrl: creative.targetUrl,
        tenantSlug: tenant
      }
    });
    
    // Redirect
    window.open(creative.targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Renderizar anúncio HTML customizado
  if (creative.type === "html" && creative.htmlContent) {
    return (
      <div
        className={`ad-slot ad-slot-${slot} ${className} cursor-pointer`}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: creative.htmlContent }}
      />
    );
  }

  // Renderizar anúncio de vídeo
  if (creative.type === "video" && creative.videoUrl) {
    return (
      <div className={`ad-slot ad-slot-${slot} ${className}`}>
        <div
          onClick={handleClick}
          className="block cursor-pointer"
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
        </div>
      </div>
    );
  }

  // Renderizar anúncio de imagem (padrão)
  if (creative.imageUrl) {
    return (
      <div className={`ad-slot ad-slot-${slot} ${className}`}>
        <div
          onClick={handleClick}
          className="block cursor-pointer"
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
        </div>
      </div>
    );
  }

  return null;
}
