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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar permissões
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    const { data: isMod } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'moderator' 
    });

    if (!isAdmin && !isMod) {
      throw new Error('Insufficient permissions');
    }

    const { source_url, image_url, category_id, premium_only } = await req.json();

    if (!source_url) {
      throw new Error('source_url is required');
    }

    console.log(`IA Repórter Pró: Processing URL ${source_url}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // 1. Buscar conteúdo da URL (simplificado - em produção usar web scraping)
    const fetchResponse = await fetch(source_url);
    const htmlContent = await fetchResponse.text();
    
    // Extrair texto básico (remover tags HTML)
    const textContent = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limitar para API

    // 2. Usar IA para reescrever conteúdo
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um jornalista profissional especializado em reescrever notícias.
            
INSTRUÇÕES:
1. Reescreva a notícia de forma original e jornalística
2. Mantenha os fatos principais
3. Melhore a clareza e objetividade
4. Adicione contexto quando relevante
5. Use linguagem acessível
6. Organize em parágrafos bem estruturados

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título atrativo (6-120 caracteres)",
  "summary": "Resumo objetivo (máx 160 caracteres)",
  "content": "Conteúdo completo em HTML com <p>, <h2>, <strong>, <em>",
  "tags": ["tag1", "tag2", ...] (exatamente 12 tags relevantes),
  "seo_meta_title": "Título SEO (máx 60 caracteres)",
  "seo_meta_description": "Descrição SEO (máx 160 caracteres)"
}`
          },
          {
            role: 'user',
            content: `Reescreva esta notícia:\n\n${textContent}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "format_article",
            description: "Formata artigo reescrito",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", minLength: 6, maxLength: 120 },
                summary: { type: "string", maxLength: 160 },
                content: { type: "string", minLength: 50 },
                tags: { 
                  type: "array", 
                  items: { type: "string" },
                  minItems: 12,
                  maxItems: 12
                },
                seo_meta_title: { type: "string", maxLength: 60 },
                seo_meta_description: { type: "string", maxLength: 160 }
              },
              required: ["title", "summary", "content", "tags", "seo_meta_title", "seo_meta_description"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "format_article" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Extrair argumentos da tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const articleData = JSON.parse(toolCall.function.arguments);

    // 3. Gerar slug a partir do título
    const slug = articleData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120);

    // 4. Salvar no banco
    const { data: newArticle, error: insertError } = await supabase
      .from('articles')
      .insert([{
        title: articleData.title,
        slug: slug,
        summary: articleData.summary,
        content: articleData.content,
        image_url: image_url || null,
        image_og_url: image_url || null,
        image_card_url: image_url || null,
        source_url: source_url,
        tags: articleData.tags,
        seo_meta_title: articleData.seo_meta_title,
        seo_meta_description: articleData.seo_meta_description,
        category_id: category_id || null,
        premium_only: premium_only || false,
        status: 'draft',
        author: 'IA Repórter Pró'
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    console.log(`Article created successfully: ${newArticle.id}`);

    return new Response(JSON.stringify({
      success: true,
      article: newArticle
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ia-reporter-pro:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
