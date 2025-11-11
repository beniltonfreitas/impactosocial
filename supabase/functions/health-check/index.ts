import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUNCTIONS_TO_CHECK = [
  { name: 'ad-fetch', testBody: { slot: 'test', page: '/', tenantSlug: 'nacional' } },
  { name: 'ad-impression', testBody: { campaignId: 'test', tenantSlug: 'nacional' } },
  { name: 'ad-click', testBody: { campaignId: 'test', targetUrl: 'https://example.com', tenantSlug: 'nacional' } },
  { name: 'articles-list', testBody: { tenantSlug: 'nacional', limit: 1 } },
  { name: 'weather-current', testBody: { lat: -23.5505, lng: -46.6333 } },
  { name: 'market-ticker', testBody: null },
  { name: 'geo-resolve', testBody: { cep: '01310-100' } },
];

type FunctionStatus = 'healthy' | 'degraded' | 'down';

interface FunctionHealth {
  status: FunctionStatus;
  latency: number;
  lastChecked: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const results: Record<string, FunctionHealth> = {};
    let overallStatus: FunctionStatus = 'healthy';

    // Test each function
    for (const func of FUNCTIONS_TO_CHECK) {
      const startTime = Date.now();
      
      try {
        const { error } = await supabaseClient.functions.invoke(func.name, {
          body: func.testBody || {},
        });

        const latency = Date.now() - startTime;
        
        let status: FunctionStatus = 'healthy';
        if (latency > 2000) {
          status = 'down';
          overallStatus = 'down';
        } else if (latency > 500) {
          status = 'degraded';
          if (overallStatus === 'healthy') overallStatus = 'degraded';
        }

        results[func.name] = {
          status: error ? 'down' : status,
          latency,
          lastChecked: new Date().toISOString(),
          ...(error && { error: error.message }),
        };

        if (error) overallStatus = 'down';
      } catch (error) {
        results[func.name] = {
          status: 'down',
          latency: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
          error: String(error),
        };
        overallStatus = 'down';
      }
    }

    return new Response(
      JSON.stringify({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        functions: results,
        deployment: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'down',
        error: String(error),
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
