import { supabase } from '@/integrations/supabase/client';

export type MarketResp = {
  usd_brl: number | null;
  eur_brl: number | null;
  ibov: number | null;
  btc_brl: number | null;
  eth_brl: number | null;
  updated_at: string;
};

export async function fetchMarkets(): Promise<MarketResp> {
  const { data, error } = await supabase.functions.invoke('market-ticker');
  if (error) throw error;
  return data as MarketResp;
}

export type WeatherResp = {
  temperature: number | null;
  apparent_temperature: number | null;
  unit: '°C';
  updated_at: string;
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResp> {
  const { data, error } = await supabase.functions.invoke('weather-current', {
    body: { lat, lng }
  });
  if (error) throw error;
  return data as WeatherResp;
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
    const { data, error } = await supabase.functions.invoke('articles-list', {
      body: {
        tenantSlug,
        limit,
        featured,
        search,
        categoryId,
        orderBy
      }
    });
    
    if (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
    
    return (data as any)?.articles || [];
  } catch (e) {
    console.error('Error fetching articles:', e);
    return [];
  }
}
