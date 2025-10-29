import { FN_BASE, NATIONAL_DOMAIN, COOKIE_NAME, COOKIE_DOMAIN, COOKIE_MAX_AGE } from './constants';

export type GeoResolve = {
  region: { uf: string; city: string } | null;
  tenant: { slug: string; domain?: string } | null;
  fallback: boolean;
} | { error: string };

export async function geoResolveByCEP(cep: string): Promise<GeoResolve> {
  const r = await fetch(`${FN_BASE}/geo-resolve?cep=${cep}`, { cache: 'no-store' });
  return r.json();
}

export async function geoResolveByGeo(lat: number, lng: number): Promise<GeoResolve> {
  const r = await fetch(`${FN_BASE}/geo-resolve?lat=${lat}&lng=${lng}`, { cache: 'no-store' });
  return r.json();
}

export async function geoResolveByCity(uf: string, city: string): Promise<GeoResolve> {
  const r = await fetch(`${FN_BASE}/geo-resolve?uf=${uf}&city=${encodeURIComponent(city)}`, { cache: 'no-store' });
  return r.json();
}

export function setTenantCookie(slug: string) {
  document.cookie = `${COOKIE_NAME}=${slug}; Max-Age=${COOKIE_MAX_AGE}; Secure; SameSite=Lax; Domain=${COOKIE_DOMAIN}; Path=/`;
}

export function getTenantCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}

export function goToTenant(slug: string) {
  const path = window.location.pathname + window.location.search + window.location.hash;
  window.location.href = `https://${slug}.conexaonacidade.com.br${path}`;
}

export function goToNational() {
  const path = window.location.pathname + window.location.search + window.location.hash;
  window.location.href = `https://${NATIONAL_DOMAIN}${path}`;
}
