import { FN_BASE } from './constants';

export type MarketResp = {
  usd_brl: number | null;
  eur_brl: number | null;
  ibov: number | null;
  btc_brl: number | null;
  eth_brl: number | null;
  updated_at: string;
};

export async function fetchMarkets(): Promise<MarketResp> {
  const r = await fetch(`${FN_BASE}/market-ticker`, { cache: 'no-store' });
  return r.json();
}

export type WeatherResp = {
  temperature: number | null;
  apparent_temperature: number | null;
  unit: '°C';
  updated_at: string;
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResp> {
  const r = await fetch(`${FN_BASE}/weather-current?lat=${lat}&lng=${lng}`, { cache: 'no-store' });
  return r.json();
}

export type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  featured: boolean;
  views: number;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  } | null;
};

export async function fetchArticles(
  tenantSlug = 'nacional',
  limit = 12,
  featured = false,
  search?: string,
  categoryId?: string,
  orderBy = 'recent'
): Promise<Article[]> {
  try {
    const params = new URLSearchParams({
      tenantSlug,
      limit: limit.toString(),
      ...(featured && { featured: 'true' }),
      ...(search && { search }),
      ...(categoryId && { categoryId }),
      ...(orderBy && { orderBy }),
    });
    const r = await fetch(`${FN_BASE}/articles-list?${params}`, { cache: 'no-store' });
    if (!r.ok) return [];
    const data = await r.json();
    return data.articles || [];
  } catch (e) {
    console.error('Error fetching articles:', e);
    return [];
  }
}
