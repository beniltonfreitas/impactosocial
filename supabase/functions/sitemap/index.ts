import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = Deno.env.get('VITE_NATIONAL_DOMAIN') || 'www.conexaonacidade.com.br';
    const protocol = 'https://';

    // Buscar todos os artigos publicados
    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, published_at, updated_at')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      return new Response('Error generating sitemap', { status: 500 });
    }

    // Construir XML do sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // URLs estáticas
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: 'sobre', priority: '0.8', changefreq: 'monthly' },
      { url: 'contato', priority: '0.8', changefreq: 'monthly' },
      { url: 'privacidade', priority: '0.5', changefreq: 'yearly' },
      { url: 'termos', priority: '0.5', changefreq: 'yearly' },
      { url: 'assinaturas', priority: '0.9', changefreq: 'monthly' },
    ];

    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${protocol}${baseUrl}/${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // URLs de artigos
    articles?.forEach(article => {
      xml += '  <url>\n';
      xml += `    <loc>${protocol}${baseUrl}/news/${article.slug}</loc>\n`;
      xml += `    <lastmod>${article.updated_at || article.published_at}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
});
