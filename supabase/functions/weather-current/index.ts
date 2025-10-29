import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  if (!lat || !lng) {
    return new Response(JSON.stringify({ error: "lat/lng required" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  try {
    const om = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature&timezone=auto`,
      { headers: { accept: "application/json" } }
    );

    if (!om.ok) throw new Error(`open-meteo ${om.status}`);
    
    const data = await om.json();
    const current = data?.current ?? {};
    
    const out = {
      temperature: typeof current.temperature_2m === "number" ? current.temperature_2m : null,
      apparent_temperature: typeof current.apparent_temperature === "number" ? current.apparent_temperature : null,
      unit: "°C",
      updated_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(out), {
      headers: {
        ...corsHeaders,
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300"
      }
    });
  } catch (e) {
    console.error("weather-current error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
