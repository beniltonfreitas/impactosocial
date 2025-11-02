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

    // Verificar se é admin ou moderator
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    const { data: isMod } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'moderator' 
    });
    const privileged = !!isAdmin || !!isMod;

    // Verificar se é Premium
    if (!privileged) {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!subscription) {
        throw new Error('Premium subscription required');
      }
    }

    const { post_id, content } = await req.json();

    if (!post_id || !content || content.trim().length === 0) {
      throw new Error('post_id and content are required');
    }

    console.log(`Adding comment to post ${post_id} by user ${user.id}`);

    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        user_id: user.id,
        post_id,
        content: content.trim(),
      })
      .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Insert comment error:', error);
      throw error;
    }

    console.log('Comment added successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in community-add-comment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
