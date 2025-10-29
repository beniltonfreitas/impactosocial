import { useEffect, useState } from 'react';

// Coordenadas padrão: São Paulo, SP
const DEFAULT_COORDS = { lat: -23.5505, lng: -46.6333 };

export function useRegionCoords() {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(DEFAULT_COORDS);

  useEffect(() => {
    try {
      const loc = localStorage.getItem('cnc_location_detail');
      if (loc) {
        const j = JSON.parse(loc);
        if (j?.lat && j?.lng) {
          setCoords({ lat: j.lat, lng: j.lng });
          return;
        }
      }
      // Se não houver coords salvas, usar padrão
      setCoords(DEFAULT_COORDS);
    } catch {
      setCoords(DEFAULT_COORDS);
    }
  }, []);

  return coords;
}
