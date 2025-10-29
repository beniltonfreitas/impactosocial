import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantIdPreferred, regionId, cep, anonId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    console.log('Saving geo choice:', { tenantIdPreferred, regionId, userId, anonId });

    // Upsert preference
    const { error } = await supabase
      .from('tenant_pref')
      .upsert({
        user_id: userId,
        anon_id: anonId,
        tenant_id_preferred: tenantIdPreferred,
        region_id: regionId,
        cep: cep,
        last_resolved_at: new Date().toISOString(),
      }, {
        onConflict: userId ? 'user_id' : 'anon_id',
      });

    if (error) {
      console.error('Error saving preference:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('geo-choice error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
