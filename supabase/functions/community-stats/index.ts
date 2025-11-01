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

    console.log('Fetching stats for user:', user.id);

    // Get user stats
    const { data: stats, error: statsError } = await supabase
      .from('community_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      throw statsError;
    }

    // Get user challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      throw challengesError;
    }

    // Get top 10 ranking
    const { data: ranking, error: rankingError } = await supabase
      .from('community_stats')
      .select('user_id, points, total_clicks, total_shares, total_conversions')
      .order('points', { ascending: false })
      .limit(10);

    if (rankingError) {
      console.error('Error fetching ranking:', rankingError);
    }

    // Calculate user's rank position
    let rankPosition = null;
    if (stats && ranking) {
      const userIndex = ranking.findIndex(r => r.user_id === user.id);
      if (userIndex !== -1) {
        rankPosition = userIndex + 1;
      }
    }

    return new Response(
      JSON.stringify({
        stats: stats || {
          total_clicks: 0,
          total_shares: 0,
          total_conversions: 0,
          points: 0,
        },
        challenges: challenges || [],
        ranking: ranking || [],
        rankPosition,
      }),
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
