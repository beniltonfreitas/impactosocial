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
    const url = new URL(req.url);
    const refCode = url.searchParams.get('ref');
    const targetUrl = url.searchParams.get('url');

    if (!refCode || !targetUrl) {
      throw new Error('Missing ref or url parameter');
    }

    console.log('Tracking click for ref:', refCode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the referral
    const { data: referral, error: findError } = await supabase
      .from('community_referrals')
      .select('*')
      .eq('ref_code', refCode)
      .maybeSingle();

    if (findError) {
      console.error('Error finding referral:', findError);
    }

    if (referral) {
      // Increment clicks
      const { error: updateError } = await supabase
        .from('community_referrals')
        .update({ clicks: referral.clicks + 1 })
        .eq('id', referral.id);

      if (updateError) {
        console.error('Error updating clicks:', updateError);
      } else {
        console.log('Click tracked successfully for referral:', referral.id);
      }
    }

    // Redirect to target URL
    return Response.redirect(targetUrl, 302);

  } catch (error) {
    console.error('Error:', error);
    // Still redirect even if tracking fails
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    if (targetUrl) {
      return Response.redirect(targetUrl, 302);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
