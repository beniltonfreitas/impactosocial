import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BLOCKED_KEYWORDS = [
  'nude', 'naked', 'porn', 'sex', 'nsfw', 'violence', 'gore', 'blood',
  'weapon', 'gun', 'drugs', 'suicide', 'racist', 'hate'
];

const isContentSafe = (prompt: string): boolean => {
  const lowerPrompt = prompt.toLowerCase();
  return !BLOCKED_KEYWORDS.some(keyword => lowerPrompt.includes(keyword));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('1. Iniciando geração de vídeo...');
    
    const { prompt, duration = '5s', resolution = '720p' } = await req.json();
    console.log('2. Prompt recebido:', { prompt, duration, resolution });

    // Validar prompt
    if (!prompt || prompt.trim().length < 10) {
      console.log('❌ Prompt muito curto');
      return new Response(
        JSON.stringify({ error: 'INVALID_PROMPT', message: 'Prompt deve ter pelo menos 10 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Guardian IA - Verificar conteúdo
    if (!isContentSafe(prompt)) {
      console.log('❌ Conteúdo bloqueado pelo Guardian IA');
      return new Response(
        JSON.stringify({ error: 'BLOCKED_CONTENT', message: 'Conteúdo inapropriado detectado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('3. ✅ Conteúdo aprovado pelo Guardian IA');

    // Autenticar usuário
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Usuário não autenticado:', authError);
      return new Response(
        JSON.stringify({ error: 'NOT_AUTHENTICATED', message: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('4. ✅ Usuário autenticado:', user.id);

    // Verificar limite diário (5 vídeos/dia)
    const today = new Date().toISOString().split('T')[0];
    const { count, error: countError } = await supabaseClient
      .from('ai_generated_videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`);

    if (countError) {
      console.log('❌ Erro ao verificar limite:', countError);
      throw new Error('Erro ao verificar limite diário');
    }

    const attemptsUsed = count || 0;
    const attemptsLeft = 5 - attemptsUsed;

    console.log('5. Limite verificado:', { attemptsUsed, attemptsLeft });

    if (attemptsLeft <= 0) {
      console.log('❌ Limite diário atingido');
      return new Response(
        JSON.stringify({ 
          error: 'RATE_LIMIT', 
          message: 'Limite diário de 5 vídeos atingido',
          attemptsLeft: 0 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IMPORTANTE: Para geração de vídeo, você precisa configurar uma API externa
    // Opções populares: RunwayML, Pika Labs, Stability AI
    // Por enquanto, vamos simular com um erro informativo
    
    console.log('❌ API de vídeo não configurada');
    return new Response(
      JSON.stringify({ 
        error: 'NOT_IMPLEMENTED',
        message: 'Geração de vídeo requer configuração de API externa (RunwayML, Pika Labs, etc). Entre em contato com o suporte para ativar.',
        attemptsLeft
      }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // EXEMPLO DE IMPLEMENTAÇÃO COM API EXTERNA (descomentar quando configurar):
    /*
    const VIDEO_API_KEY = Deno.env.get('VIDEO_API_KEY'); // Adicionar via secrets
    
    console.log('6. Chamando API de vídeo...');
    const videoResponse = await fetch('https://api.runwayml.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VIDEO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration: parseInt(duration),
        resolution
      })
    });

    if (!videoResponse.ok) {
      console.log('❌ Erro na API de vídeo:', videoResponse.status);
      throw new Error('Erro ao gerar vídeo com IA');
    }

    const videoData = await videoResponse.json();
    const videoBase64 = videoData.video; // ou videoData.url dependendo da API
    
    console.log('7. ✅ Vídeo gerado, tamanho:', videoBase64?.length);

    // Upload para Storage
    console.log('8. Fazendo upload para Storage...');
    const videoBuffer = Uint8Array.from(atob(videoBase64), c => c.charCodeAt(0));
    const fileName = `${user.id}/${crypto.randomUUID()}.mp4`;

    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('ai-generated-videos')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      console.log('❌ Erro no upload:', uploadError);
      throw new Error('Erro ao salvar vídeo');
    }
    console.log('9. ✅ Upload realizado:', uploadData.path);

    // Obter URL pública
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('ai-generated-videos')
      .getPublicUrl(fileName);

    console.log('10. URL pública:', publicUrl);

    // Salvar no banco
    const { data: dbData, error: dbError } = await supabaseClient
      .from('ai_generated_videos')
      .insert({
        user_id: user.id,
        prompt,
        video_url: publicUrl,
        duration,
        resolution,
      })
      .select()
      .single();

    if (dbError) {
      console.log('❌ Erro ao salvar no banco:', dbError);
      throw new Error('Erro ao salvar metadata do vídeo');
    }
    console.log('11. ✅ Salvo no banco:', dbData.id);

    console.log('✅ SUCESSO - Vídeo gerado e salvo!');
    return new Response(
      JSON.stringify({
        videoUrl: publicUrl,
        videoId: dbData.id,
        attemptsLeft: attemptsLeft - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    */

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Erro desconhecido ao gerar vídeo' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
