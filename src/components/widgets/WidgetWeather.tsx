import { useEffect, useState } from "react";
import { fetchWeather, WeatherResp } from "@/lib/widgets";
import { useRegionCoords } from "@/hooks/useRegionCoords";
import { Cloud } from "lucide-react";

export function WidgetWeather() {
  const coords = useRegionCoords();
  const [data, setData] = useState<WeatherResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadByCoords(lat: number, lng: number) {
    try {
      setLoading(true);
      setError(false);
      setData(await fetchWeather(lat, lng));
    } catch (e) {
      console.error("Error loading weather:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // useRegionCoords agora sempre retorna coords (padrão ou salvos)
    loadByCoords(coords.lat, coords.lng);
  }, [coords]);

  return (
    <div className="rounded-2xl p-4 shadow bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="w-5 h-5 text-muted-foreground" />
        <div className="font-semibold text-card-foreground">Clima Agora</div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <div className="text-sm text-muted-foreground mb-2">
            Não foi possível carregar os dados do clima
          </div>
          <button
            onClick={() => loadByCoords(coords.lat, coords.lng)}
            className="text-xs text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
