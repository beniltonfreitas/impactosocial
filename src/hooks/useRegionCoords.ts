import { useEffect, useState } from 'react';

export function useRegionCoords() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    try {
      const loc = localStorage.getItem('cnc_location_detail');
      if (loc) {
        const j = JSON.parse(loc);
        if (j?.lat && j?.lng) {
          setCoords({ lat: j.lat, lng: j.lng });
        }
      }
    } catch {}
  }, []);

  return coords;
}
