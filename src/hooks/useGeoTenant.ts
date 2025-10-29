import { useCallback } from 'react';
import { geoResolveByCEP, geoResolveByCity, geoResolveByGeo, setTenantCookie, goToTenant, goToNational } from '@/lib/geo';

export function useGeoTenant() {
  const resolveAndRoute = useCallback((res: any) => {
    if (!res || 'error' in res) return;
    
    if (res.tenant?.slug) {
      setTenantCookie(res.tenant.slug);
      goToTenant(res.tenant.slug);
    } else {
      goToNational();
    }
  }, []);

  const byCEP = useCallback(async (cep: string) => {
    const res = await geoResolveByCEP(cep);
    resolveAndRoute(res);
  }, [resolveAndRoute]);

  const byCity = useCallback(async (uf: string, city: string) => {
    const res = await geoResolveByCity(uf, city);
    resolveAndRoute(res);
  }, [resolveAndRoute]);

  const byGeo = useCallback(async (lat: number, lng: number) => {
    const res = await geoResolveByGeo(lat, lng);
    resolveAndRoute(res);
  }, [resolveAndRoute]);

  return { byCEP, byCity, byGeo };
}
