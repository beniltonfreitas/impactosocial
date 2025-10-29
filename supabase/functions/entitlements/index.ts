import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const slug = new URL(req.url).searchParams.get("tenantSlug");
  
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing tenantSlug" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  try {
    const { data: tenant } = await supabase
      .from("tenant")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!tenant) {
      return new Response(JSON.stringify({ portal_bonus: false }), {
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    const { data: ent } = await supabase
      .from("entitlement")
      .select("feature_key, active, valid_until")
      .eq("tenant_id", tenant.id)
      .eq("feature_key", "portal_bonus")
      .eq("active", true)
      .maybeSingle();

    return new Response(JSON.stringify({
      portal_bonus: !!ent,
      valid_until: ent?.valid_until ?? null
    }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  } catch (e) {
    console.error("entitlements error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
