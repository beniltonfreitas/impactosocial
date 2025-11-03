import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLOCKED_KEYWORDS = [
  'violência', 'violent', 'sangue', 'blood',
  'adulto', 'adult', 'sexual', 'nude', 'naked',
  'arma', 'weapon', 'gun', 'knife', 'faca',
  'drogas', 'drugs', 'ilegal', 'illegal',
  'gore', 'nsfw', 'porn'
];

function isContentSafe(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return !BLOCKED_KEYWORDS.some(word => lower.includes(word));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, size = '1024' } = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt não pode estar vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validação de conteúdo (Guardian IA)
    if (!isContentSafe(prompt)) {
      console.log('Prompt bloqueado pelo Guardian IA:', prompt);
      return new Response(
        JSON.stringify({ error: 'Conteúdo inapropriado detectado pelo Guardian IA' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar autenticação
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar limite diário (10 imagens para usuários free)
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabaseClient
      .from('ai_generated_images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today);

    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ 
          error: 'Limite diário atingido. Você pode gerar até 10 imagens por dia.',
          attemptsLeft: 0
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chamar Lovable AI (Gemini Flash Image)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    console.log('Gerando imagem com prompt:', prompt);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Generate a high-quality image: ${prompt}`
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na API Lovable AI:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de uso da IA excedido. Tente novamente mais tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos da IA esgotados. Entre em contato com o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro na API: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error('Nenhuma imagem retornada pela IA');
    }

    // Converter base64 para blob
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload para Storage
    const filename = `${user.id}/${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('ai-generated-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabaseClient.storage
      .from('ai-generated-images')
      .getPublicUrl(filename);

    // Salvar no banco de dados
    const { data: dbData, error: dbError } = await supabaseClient
      .from('ai_generated_images')
      .insert({
        user_id: user.id,
        prompt: prompt,
        image_url: publicUrl,
        size: `${size}x${size}`,
        quality: 'standard'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError);
      throw dbError;
    }

    console.log('Imagem gerada com sucesso:', dbData.id);

    return new Response(
      JSON.stringify({ 
        imageUrl: publicUrl,
        imageId: dbData.id,
        attemptsLeft: 10 - (count || 0) - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar imagem'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
