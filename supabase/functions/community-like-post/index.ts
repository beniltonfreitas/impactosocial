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

    const { post_id } = await req.json();

    if (!post_id) {
      throw new Error('post_id is required');
    }

    console.log(`Toggling like for post ${post_id} by user ${user.id}`);

    // Verificar se já curtiu
    const { data: existing } = await supabase
      .from('community_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', post_id)
      .maybeSingle();

    if (existing) {
      // Remover curtida
      const { error: deleteError } = await supabase
        .from('community_likes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Delete like error:', deleteError);
        throw deleteError;
      }

      console.log('Like removed');

      return new Response(JSON.stringify({ liked: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Adicionar curtida
      const { error: insertError } = await supabase
        .from('community_likes')
        .insert({ user_id: user.id, post_id });

      if (insertError) {
        console.error('Insert like error:', insertError);
        throw insertError;
      }

      console.log('Like added');

      return new Response(JSON.stringify({ liked: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error in community-like-post:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
