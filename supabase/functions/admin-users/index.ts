import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar se usuário logado é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se tem role admin
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Acesso negado: apenas administradores');
    }

    // Buscar todos os usuários
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar usuários:', authError);
      throw authError;
    }

    // Buscar profiles e roles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name');

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role');

    // Montar resposta com dados combinados
    const usersWithRoles: UserWithRoles[] = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);
      const userRoles = roles?.filter(r => r.user_id === authUser.id).map(r => r.role) || [];

      return {
        id: authUser.id,
        email: authUser.email || 'Sem email',
        full_name: profile?.full_name || 'Sem nome',
        roles: userRoles,
        created_at: authUser.created_at,
      };
    });

    return new Response(
      JSON.stringify(usersWithRoles),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro em admin-users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const isAccessDenied = errorMessage.includes('Acesso negado');
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isAccessDenied ? 403 : 500,
      }
    );
  }
});
