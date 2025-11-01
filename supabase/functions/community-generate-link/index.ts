import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateLinkRequest {
  targetUrl: string;
  refCode?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Check if user has active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: 'Active subscription required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { targetUrl, refCode }: GenerateLinkRequest = await req.json();

    if (!targetUrl || !targetUrl.startsWith('http')) {
      throw new Error('Invalid target URL');
    }

    // Generate or use provided ref code
    const finalRefCode = refCode || user.email?.split('@')[0] || user.id.substring(0, 8);

    // Check rate limit (max 10 links per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('community_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 10 links per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate tracking link
    const baseUrl = 'https://wlbdscnfizpqsfcezrnn.supabase.co/functions/v1/community-track-click';
    const generatedLink = `${baseUrl}?ref=${encodeURIComponent(finalRefCode)}&url=${encodeURIComponent(targetUrl)}`;

    // Create referral record
    const { data, error } = await supabase
      .from('community_referrals')
      .insert({
        user_id: user.id,
        ref_code: finalRefCode,
        target_url: targetUrl,
        generated_link: generatedLink,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating referral:', error);
      throw error;
    }

    console.log('Referral link created:', data.id);

    return new Response(
      JSON.stringify({ link: generatedLink, refCode: finalRefCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
