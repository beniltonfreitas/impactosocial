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

    console.log(`Fetching stats for user ${user.id}`);

    // Buscar stats do usuário
    const { data: userStats, error: statsError } = await supabase
      .from('social_challenge_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Stats error:', statsError);
      throw statsError;
    }

    // Buscar progresso nos desafios
    const { data: challenges, error: challengesError } = await supabase
      .from('social_challenges')
      .select(`
        *,
        user_challenge_progress!inner(
          completed,
          completed_at,
          proof_url,
          notes
        )
      `)
      .eq('user_challenge_progress.user_id', user.id)
      .order('challenge_number');

    if (challengesError) {
      console.error('Challenges error:', challengesError);
    }

    // Buscar todos os desafios (mesmo não iniciados)
    const { data: allChallenges, error: allChallengesError } = await supabase
      .from('social_challenges')
      .select('*')
      .order('challenge_number');

    if (allChallengesError) {
      console.error('All challenges error:', allChallengesError);
      throw allChallengesError;
    }

    // Merge progresso com desafios
    const challengesWithProgress = allChallenges.map(challenge => {
      const progress = challenges?.find(c => c.id === challenge.id);
      return {
        ...challenge,
        completed: progress?.user_challenge_progress?.[0]?.completed || false,
        completed_at: progress?.user_challenge_progress?.[0]?.completed_at || null,
        proof_url: progress?.user_challenge_progress?.[0]?.proof_url || null,
        notes: progress?.user_challenge_progress?.[0]?.notes || null,
      };
    });

    // Buscar ranking global (top 10)
    const { data: globalRanking, error: rankingError } = await supabase
      .from('social_challenge_stats')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .order('total_points', { ascending: false })
      .limit(10);

    if (rankingError) {
      console.error('Ranking error:', rankingError);
    }

    console.log(`Stats fetched successfully`);

    return new Response(
      JSON.stringify({
        userStats: userStats || {
          total_points: 0,
          completed_challenges: 0,
          status: 'participando',
          pix_points: 0,
          referral_points: 0,
          challenge_points: 0,
        },
        challenges: challengesWithProgress,
        globalRanking: globalRanking || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in social-challenge-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
