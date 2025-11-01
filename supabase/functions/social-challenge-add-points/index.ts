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

    const { targetUserId, pointType, points } = await req.json();

    // Validar permissões (apenas admins ou próprio usuário)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    const isSelf = user.id === targetUserId;

    if (!isAdmin && !isSelf) {
      throw new Error('Unauthorized: Only admins can add points to other users');
    }

    if (!targetUserId || !pointType || typeof points !== 'number') {
      throw new Error('Invalid parameters');
    }

    if (!['pix', 'referral'].includes(pointType)) {
      throw new Error('Invalid point type. Must be "pix" or "referral"');
    }

    console.log(`Adding ${points} ${pointType} points to user ${targetUserId}`);

    // Buscar stats atuais
    const { data: currentStats, error: fetchError } = await supabase
      .from('social_challenge_stats')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    // Calcular novos pontos
    const currentPixPoints = currentStats?.pix_points || 0;
    const currentReferralPoints = currentStats?.referral_points || 0;
    const currentChallengePoints = currentStats?.challenge_points || 0;

    const newPixPoints = pointType === 'pix' ? currentPixPoints + points : currentPixPoints;
    const newReferralPoints = pointType === 'referral' ? currentReferralPoints + points : currentReferralPoints;
    const newTotalPoints = newPixPoints + newReferralPoints + currentChallengePoints;

    // Atualizar stats
    const { error: updateError } = await supabase
      .from('social_challenge_stats')
      .upsert({
        user_id: targetUserId,
        pix_points: newPixPoints,
        referral_points: newReferralPoints,
        total_points: newTotalPoints,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log(`Points added successfully. New total: ${newTotalPoints}`);

    return new Response(
      JSON.stringify({
        success: true,
        newTotalPoints,
        pixPoints: newPixPoints,
        referralPoints: newReferralPoints,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in social-challenge-add-points:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
