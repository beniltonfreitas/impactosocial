import { useMemo } from "react";
import { useRegionCoords } from "@/hooks/useRegionCoords";
import { Navigation } from "lucide-react";

export function WidgetTraffic() {
  const coords = useRegionCoords();

  if (!coords) {
    return (
      <div className="rounded-2xl p-4 shadow bg-card border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Navigation className="w-5 h-5 text-muted-foreground" />
          <div className="font-semibold text-card-foreground">Trânsito</div>
        </div>
        <div className="text-sm text-muted-foreground">
          Carregando mapa da sua região…
        </div>
      </div>
    );
  }

  const src = useMemo(
    () =>
      `https://embed.waze.com/iframe?zoom=12&lat=${coords.lat}&lon=${coords.lng}&pin=1`,
    [coords]
  );

  return (
    <div className="rounded-2xl overflow-hidden shadow bg-card border border-border">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-muted-foreground" />
        <div className="font-semibold text-card-foreground">Trânsito</div>
      </div>
      <iframe
        title="Trânsito ao vivo (Waze)"
        src={src}
        className="w-full"
        style={{ height: 300, border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
