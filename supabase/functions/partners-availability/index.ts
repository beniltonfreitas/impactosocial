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
    const url = new URL(req.url);
    const uf = url.searchParams.get('uf');
    const city = url.searchParams.get('city');

    if (!uf || !city) {
      return new Response(JSON.stringify({ error: 'uf and city are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Finding partners for:', { uf, city });

    // Find region
    const { data: region, error: regionError } = await supabase
      .from('region')
      .select('id')
      .eq('uf', uf)
      .ilike('city', city)
      .single();

    if (regionError || !region) {
      console.log('No region found:', regionError);
      return new Response(JSON.stringify({ partners: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find active partners
    const { data: partners, error: partnersError } = await supabase
      .from('partner_map')
      .select(`
        priority,
        tenant:tenant_id (
          id,
          slug,
          domain,
          name
        )
      `)
      .eq('region_id', region.id)
      .eq('active', true)
      .order('priority', { ascending: true });

    if (partnersError) {
      console.error('Error fetching partners:', partnersError);
      return new Response(JSON.stringify({ error: partnersError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formattedPartners = (partners || []).map((p: any) => ({
      slug: p.tenant.slug,
      domain: p.tenant.domain,
      name: p.tenant.name,
      priority: p.priority,
    }));

    return new Response(JSON.stringify({ partners: formattedPartners }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    });
  } catch (error) {
    console.error('partners-availability error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
