import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar permissões
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    const { data: isMod } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'moderator' 
    });

    if (!isAdmin && !isMod) {
      throw new Error('Insufficient permissions');
    }

    const url = new URL(req.url);
    const articleId = url.searchParams.get('article_id');

    if (!articleId) {
      throw new Error('article_id is required');
    }

    // Buscar artigo completo com categoria e galeria
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        *,
        category:categories(name, slug, color)
      `)
      .eq('id', articleId)
      .single();

    if (articleError) throw articleError;

    // Buscar galeria de imagens
    const { data: gallery } = await supabase
      .from('article_gallery')
      .select('*')
      .eq('article_id', articleId)
      .order('display_order');

    // Gerar JSON no formato Premium v2.1 ITL Brasil
    const jsonPremium = {
      version: "2.1",
      source: "ITL Brasil",
      generated_at: new Date().toISOString(),
      article: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        summary: article.summary || "",
        content: article.content || "",
        author: article.author || "Redação",
        
        category: article.category ? {
          id: article.category_id,
          name: article.category.name,
          slug: article.category.slug,
          color: article.category.color
        } : null,
        
        images: {
          hero: {
            url: article.image_url || "",
            alt: article.image_alt || article.title,
            credit: article.image_credit || "",
            dimensions: "1200x675"
          },
          og: {
            url: article.image_og_url || article.image_url || "",
            alt: article.image_alt || article.title,
            dimensions: "1200x630"
          },
          card: {
            url: article.image_card_url || article.image_url || "",
            alt: article.image_alt || article.title,
            dimensions: "800x450"
          }
        },
        
        gallery: (gallery || []).map((img: any) => ({
          url: img.image_url,
          caption: img.caption || "",
          credit: img.credit || "",
          order: img.display_order
        })),
        
        seo: {
          meta_title: article.seo_meta_title || article.title,
          meta_description: article.seo_meta_description || article.summary || "",
          canonical_url: `https://conexaonacidade.com.br/noticia/${article.slug}`,
          robots: "index, follow"
        },
        
        tags: article.tags || [],
        
        metadata: {
          source_url: article.source_url || "",
          published_at: article.published_at || null,
          created_at: article.created_at,
          updated_at: article.updated_at,
          views: article.views || 0,
          featured: article.featured || false,
          breaking: article.breaking || false,
          premium_only: article.premium_only || false,
          status: article.status || "published"
        }
      }
    };

    console.log(`JSON Premium generated for article: ${article.slug}`);

    return new Response(JSON.stringify(jsonPremium, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in article-json-premium:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
