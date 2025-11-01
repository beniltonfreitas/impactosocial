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

    const { challengeId, proofUrl, notes } = await req.json();

    if (!challengeId) {
      throw new Error('Challenge ID is required');
    }

    console.log(`User ${user.id} completing challenge ${challengeId}`);

    // Verificar se já foi completado
    const { data: existing, error: checkError } = await supabase
      .from('user_challenge_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    if (checkError) {
      console.error('Check error:', checkError);
      throw checkError;
    }

    if (existing?.completed) {
      return new Response(
        JSON.stringify({ error: 'Challenge already completed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Inserir ou atualizar progresso
    const { error: upsertError } = await supabase
      .from('user_challenge_progress')
      .upsert({
        user_id: user.id,
        challenge_id: challengeId,
        completed: true,
        completed_at: new Date().toISOString(),
        proof_url: proofUrl || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,challenge_id',
      });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw upsertError;
    }

    // Buscar stats atualizadas (trigger já atualizou)
    const { data: stats, error: statsError } = await supabase
      .from('social_challenge_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statsError) {
      console.error('Stats error:', statsError);
      throw statsError;
    }

    console.log(`Challenge completed successfully. New stats:`, stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in social-challenge-complete:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
