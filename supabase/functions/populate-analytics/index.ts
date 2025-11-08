import { createClient } from '@supabase/supabase-js';

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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar se usuário é admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      throw new Error('Admin access required');
    }

    console.log('[POPULATE] Starting analytics population...');

    // Executar função para atualizar analytics
    const { error: analyticsError } = await supabase.rpc('update_publication_analytics');
    if (analyticsError) {
      console.error('[POPULATE] Analytics error:', analyticsError);
      throw analyticsError;
    }

    console.log('[POPULATE] Publication analytics updated');

    // Executar função para gerar horários ótimos
    const { error: optimalError } = await supabase.rpc('generate_optimal_times');
    if (optimalError) {
      console.error('[POPULATE] Optimal times error:', optimalError);
      throw optimalError;
    }

    console.log('[POPULATE] Optimal times generated');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Analytics populated successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[POPULATE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: error.message === 'Unauthorized' || error.message === 'Admin access required' ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
