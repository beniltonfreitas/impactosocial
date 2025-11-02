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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Autenticar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se usuário é admin
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'moderator']);

    if (roleError || !roles || roles.length === 0) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({ error: 'Permissão negada. Apenas admins podem validar desafios.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter dados do body
    const { progressId, action } = await req.json();
    
    if (!progressId || !action) {
      return new Response(JSON.stringify({ error: 'progressId e action são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'validate') {
      // Validar desafio
      const { data: updateData, error: updateError } = await supabase
        .from('user_challenge_progress')
        .update({
          admin_validated: true,
          validated_by: user.id,
          validated_at: new Date().toISOString(),
        })
        .eq('id', progressId)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(JSON.stringify({ error: 'Erro ao validar desafio' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Desafio validado:', progressId, 'por', user.id);
      
      return new Response(JSON.stringify({ success: true, data: updateData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } else if (action === 'reject') {
      // Rejeitar desafio (marcar como não completado)
      const { data: updateData, error: updateError } = await supabase
        .from('user_challenge_progress')
        .update({
          completed: false,
          completed_at: null,
          admin_validated: false,
          validated_by: null,
          validated_at: null,
        })
        .eq('id', progressId)
        .select()
        .single();

      if (updateError) {
        console.error('Reject error:', updateError);
        return new Response(JSON.stringify({ error: 'Erro ao rejeitar desafio' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Desafio rejeitado:', progressId, 'por', user.id);
      
      return new Response(JSON.stringify({ success: true, data: updateData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Ação inválida. Use "validate" ou "reject"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
