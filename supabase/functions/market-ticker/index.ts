import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MarketOut = {
  usd_brl: number | null;
  eur_brl: number | null;
  ibov: number | null;
  btc_brl: number | null;
  eth_brl: number | null;
  updated_at: string;
};

async function fetchJSON(url: string) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const out: MarketOut = {
    usd_brl: null,
    eur_brl: null,
    ibov: null,
    btc_brl: null,
    eth_brl: null,
    updated_at: new Date().toISOString()
  };

  try {
    // Forex
    try {
      const fx = await fetchJSON("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL");
      out.usd_brl = fx?.USDBRL ? Number(fx.USDBRL.bid) : null;
      out.eur_brl = fx?.EURBRL ? Number(fx.EURBRL.bid) : null;
    } catch (e) {
      console.error("Forex error:", e);
    }

    // Crypto
    try {
      const cg = await fetchJSON("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl");
      out.btc_brl = cg?.bitcoin?.brl ?? null;
      out.eth_brl = cg?.ethereum?.brl ?? null;
    } catch (e) {
      console.error("Crypto error:", e);
    }

    // IBOV
    try {
      const ib = await fetchJSON("https://brapi.dev/api/quote/IBOV");
      const p = ib?.results?.[0]?.regularMarketPrice;
      out.ibov = typeof p === "number" ? p : null;
    } catch (e) {
      console.error("IBOV error:", e);
    }

    return new Response(JSON.stringify(out), {
      headers: {
        ...corsHeaders,
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=300"
      }
    });
  } catch (e) {
    console.error("market-ticker error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
