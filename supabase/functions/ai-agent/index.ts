import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, payload, history } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY não configurada');

    let messages: ChatMessage[] = [];

    if (type === 'search') {
      // Monta contexto com últimas notícias do tenant "nacional"
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      const { data: tenant } = await supabase
        .from('tenant')
        .select('id')
        .eq('slug', 'nacional')
        .single();

      let articlesContext = '';
      if (tenant) {
        const { data: articles } = await supabase
          .from('articles')
          .select(`
            title,
            summary,
            category:categories(
              name
            )
          `)
          .eq('tenant_id', tenant.id)
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(20);

        if (articles && articles.length > 0) {
          articlesContext = '\n\nNotícias recentes disponíveis:\n\n' +
            articles
              .map((a: any, i: number) => `${i + 1}. [${a.category?.name || 'Geral'}] ${a.title}${a.summary ? '\n   ' + a.summary : ''}`)
              .join('\n\n');
        }
      }

      messages = [
        {
          role: 'system',
          content:
            'Você é um assistente de busca do portal Conexão na Cidade. Com base nas notícias recentes fornecidas abaixo, responda à pergunta do usuário de forma clara e objetiva. Se a informação não estiver nas notícias, diga que não encontrou informações específicas nas notícias recentes.' +
            articlesContext,
        },
        { role: 'user', content: payload },
      ];
    } else if (type === 'summarize') {
      messages = [
        {
          role: 'system',
          content: 'Você é um especialista em resumir conteúdo web. Crie um resumo claro, objetivo e estruturado do seguinte texto em até 5 pontos-chave principais. Responda em português brasileiro.',
        },
        { role: 'user', content: payload },
      ];
    } else if (type === 'chat') {
      const recentHistory: ChatMessage[] = Array.isArray(history) ? history.slice(-20) : [];
      messages = [
        {
          role: 'system',
          content: 'Você é o assistente virtual do portal Conexão na Cidade, um portal de notícias regionalizadas do Brasil. Seja prestativo, cordial e objetivo. Ajude os usuários com informações sobre o portal e notícias locais. Responda sempre em português brasileiro.',
        },
        ...recentHistory,
        { role: 'user', content: payload },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error('[ai-agent] gateway error', aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: 'rate_limit', message: 'Muitas requisições. Aguarde e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: 'no_credits', message: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'ai_gateway_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await aiResp.json();
    const responseText: string = data?.choices?.[0]?.message?.content ?? 'Não foi possível gerar resposta.';

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[ai-agent] error', e);
    return new Response(
      JSON.stringify({ error: 'server_error', message: e instanceof Error ? e.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
