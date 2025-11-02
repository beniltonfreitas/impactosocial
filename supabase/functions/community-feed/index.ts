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
      console.error('Authentication error:', authError);
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    console.log(`Fetching feed for user ${user.id}, page ${page}`);

    // Buscar posts com informações do autor
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Posts fetch error:', postsError);
      throw postsError;
    }

    // Para cada post, verificar se o usuário atual curtiu
    const postsWithLikes = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: userLike } = await supabase
          .from('community_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();

        return {
          ...post,
          user_has_liked: !!userLike,
        };
      })
    );

    console.log(`Found ${postsWithLikes.length} posts`);

    return new Response(JSON.stringify(postsWithLikes), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in community-feed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
