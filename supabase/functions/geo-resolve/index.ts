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

  const url = new URL(req.url);
  const cep = url.searchParams.get("cep") ?? "";
  const uf = url.searchParams.get("uf") ?? "";
  const city = url.searchParams.get("city") ?? "";
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  try {
    if (cep) {
      const { data, error } = await supabase.rpc("resolve_by_cep", { cep_in: cep });
      if (error) throw error;
      const row = (data as any[])[0] ?? null;
      return new Response(JSON.stringify({
        region: row ? { uf: row.uf, city: row.city } : null,
        tenant: row?.tenant_slug ? { slug: row.tenant_slug, domain: row.tenant_domain } : null,
        fallback: row?.fallback ?? true
      }), { headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    if (lat && lng) {
      const { data, error } = await supabase.rpc("resolve_by_geo", { 
        lat_in: Number(lat), 
        lng_in: Number(lng) 
      });
      if (error) throw error;
      const row = (data as any[])[0] ?? null;
      return new Response(JSON.stringify({
        region: row ? { uf: row.uf, city: row.city } : null,
        tenant: row?.tenant_slug ? { slug: row.tenant_slug, domain: row.tenant_domain } : null,
        fallback: row?.fallback ?? true
      }), { headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    if (uf && city) {
      const { data: reg } = await supabase
        .from("region")
        .select("id, uf, city, partner_map(tenant_id, active, tenant:tenant_id(slug, domain))")
        .eq("uf", uf)
        .eq("city", city)
        .maybeSingle();

      const tenant = reg?.partner_map?.[0]?.tenant;
      return new Response(JSON.stringify({
        region: reg ? { uf: reg.uf, city: reg.city } : null,
        tenant: tenant ?? null,
        fallback: !tenant
      }), { headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Missing params" }), { 
      status: 400, 
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });
  } catch (e) {
    console.error("geo-resolve error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" } 
    });
  }
});
