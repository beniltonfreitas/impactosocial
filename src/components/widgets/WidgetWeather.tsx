import { useEffect, useState } from "react";
import { fetchWeather, WeatherResp } from "@/lib/widgets";
import { useRegionCoords } from "@/hooks/useRegionCoords";
import { Cloud } from "lucide-react";

export function WidgetWeather() {
  const coords = useRegionCoords();
  const [data, setData] = useState<WeatherResp | null>(null);

  async function loadByCoords(lat: number, lng: number) {
    try {
      setData(await fetchWeather(lat, lng));
    } catch (e) {
      console.error("Error loading weather:", e);
    }
  }

  useEffect(() => {
    if (coords) {
      loadByCoords(coords.lat, coords.lng);
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadByCoords(pos.coords.latitude, pos.coords.longitude),
        () => {}
      );
    }
  }, [coords]);

  return (
    <div className="rounded-2xl p-4 shadow bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-muted-foreground" />
        <div className="font-semibold text-card-foreground">Clima Agora</div>
      </div>
      <div className="text-4xl font-bold text-card-foreground">
        {data?.temperature != null ? `${Math.round(data.temperature)}°C` : "—"}
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        Sensação:{" "}
        {data?.apparent_temperature != null
          ? `${Math.round(data.apparent_temperature)}°C`
          : "—"}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {data?.updated_at
          ? `Atualizado: ${new Date(data.updated_at).toLocaleTimeString()}`
          : "Atualizando..."}
      </div>
    </div>
  );
}
