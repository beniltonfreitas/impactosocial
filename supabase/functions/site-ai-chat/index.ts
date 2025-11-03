import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface KnowledgeSource {
  type?: 'file' | 'url';
  name: string;
  url: string;
  size?: number;
  content_preview?: string;
  uploaded_at: string;
  status?: 'pending' | 'processed' | 'error';
  error_message?: string;
}

interface SiteAIConfig {
  agent_name: string;
  agent_description: string | null;
  agent_instructions: string | null;
  knowledge_files: KnowledgeSource[];
}

async function extractTextFromFile(url: string, filename: string): Promise<string> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(`Error extracting text from ${filename}:`, error);
    return '';
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractTextFromUrl(url: string): Promise<string> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    // Prevent SSRF attacks
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.local')) {
      throw new Error('Private network URLs not allowed');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SiteAI-Bot/1.0'
      }
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error('Unsupported content type');
    }

    const html = await response.text();
    const cleanText = stripHtml(html);
    
    // Limit to 50KB
    return cleanText.slice(0, 50000);
  } catch (error) {
    console.error(`Error fetching URL ${url}:`, error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Default configuration
    let config: SiteAIConfig = {
      agent_name: 'Site AI',
      agent_description: 'Assistente virtual do portal de notícias',
      agent_instructions: `Você é o assistente virtual deste portal de notícias.
Responda perguntas sobre o site, notícias publicadas e tópicos relacionados.
Seja cordial, objetivo e sempre em português brasileiro.
Se não souber algo, seja honesto e sugira onde o usuário pode encontrar a informação.`,
      knowledge_files: []
    };

    // If user is authenticated, try to get their custom config
    if (user) {
      const { data: userConfig } = await supabase
        .from('site_ai_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userConfig) {
        config = {
          agent_name: userConfig.agent_name,
          agent_description: userConfig.agent_description,
          agent_instructions: userConfig.agent_instructions,
          knowledge_files: userConfig.knowledge_files || []
        };
      }
    }

    // Extract knowledge from uploaded files and URLs
    let knowledgeContext = '';
    if (config.knowledge_files.length > 0) {
      knowledgeContext = '\n\n=== BASE DE CONHECIMENTO ADICIONAL ===\n';
      for (const source of config.knowledge_files) {
        let text = '';
        
        if (source.type === 'file' || !source.type) {
          text = await extractTextFromFile(source.url, source.name);
        } else if (source.type === 'url') {
          text = await extractTextFromUrl(source.url);
        }
        
        if (text) {
          knowledgeContext += `\n--- Fonte: ${source.name} ---\n${text}\n`;
        }
      }
    }

    // Get recent articles for context
    const { data: articles } = await supabase
      .from('articles')
      .select('title, summary, category_id, published_at')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(10);

    let articlesContext = '\n\n=== NOTÍCIAS RECENTES DO SITE ===\n';
    if (articles && articles.length > 0) {
      articles.forEach((article) => {
        articlesContext += `- ${article.title}\n`;
        if (article.summary) {
          articlesContext += `  Resumo: ${article.summary}\n`;
        }
      });
    }

    // Build system prompt
    const systemPrompt = `${config.agent_name}
${config.agent_description ? `\n${config.agent_description}\n` : ''}

INSTRUÇÕES:
${config.agent_instructions || ''}

CONTEXTO DO SITE:${articlesContext}${knowledgeContext}

Responda sempre em português brasileiro, de forma cordial e objetiva.`;

    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-20), // Last 20 messages for context
      { role: 'user', content: message }
    ];

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error('Erro ao comunicar com AI Gateway');
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in site-ai-chat:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : null) || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
