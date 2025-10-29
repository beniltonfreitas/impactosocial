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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const { full_name, avatar_url, preferences } = await req.json();

    // Validação básica
    if (full_name && typeof full_name !== 'string') {
      throw new Error('Invalid full_name');
    }
    if (avatar_url && typeof avatar_url !== 'string') {
      throw new Error('Invalid avatar_url');
    }

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (preferences !== undefined) updates.preferences = preferences;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    console.log('Profile updated successfully for user:', user.id);

    return new Response(JSON.stringify({ success: true, profile: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in update-profile:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
