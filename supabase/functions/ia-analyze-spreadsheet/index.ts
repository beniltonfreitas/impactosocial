import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { fileName, fileContent, fileType } = await req.json();

    console.log(`Analyzing ${fileType} file: ${fileName}`);

    // Parse CSV/JSON content
    let parsedData: any[];
    let columns: string[] = [];

    if (fileType === 'csv') {
      const lines = fileContent.trim().split('\n');
      columns = lines[0].split(',').map((col: string) => col.trim());
      
      parsedData = lines.slice(1).map((line: string) => {
        const values = line.split(',');
        const row: any = {};
        columns.forEach((col, idx) => {
          row[col] = values[idx]?.trim();
        });
        return row;
      });
    } else if (fileType === 'json') {
      parsedData = JSON.parse(fileContent);
      if (parsedData.length > 0) {
        columns = Object.keys(parsedData[0]);
      }
    } else {
      throw new Error('Unsupported file type');
    }

    // Limit sample data
    const sampleData = parsedData.slice(0, 100);

    // Identificar tipos de colunas
    const columnTypes: Record<string, string> = {};
    columns.forEach(col => {
      const sampleValue = sampleData[0]?.[col];
      if (!isNaN(Number(sampleValue))) {
        columnTypes[col] = 'numeric';
      } else if (!isNaN(Date.parse(sampleValue))) {
        columnTypes[col] = 'date';
      } else {
        columnTypes[col] = 'text';
      }
    });

    // Calcular estatísticas básicas
    const stats: any = {};
    columns.forEach(col => {
      if (columnTypes[col] === 'numeric') {
        const values = parsedData.map(row => Number(row[col])).filter(v => !isNaN(v));
        stats[col] = {
          type: 'numeric',
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          sum: values.reduce((a, b) => a + b, 0)
        };
      } else if (columnTypes[col] === 'text') {
        const uniqueValues = new Set(parsedData.map(row => row[col]));
        stats[col] = {
          type: 'text',
          count: parsedData.length,
          unique: uniqueValues.size,
          topValues: Array.from(uniqueValues).slice(0, 5)
        };
      }
    });

    // Preparar prompt para IA
    const prompt = `Você é um analista de dados especializado. Analise a planilha abaixo e forneça insights valiosos.

ESTRUTURA DA PLANILHA:
- Nome do arquivo: ${fileName}
- Total de registros: ${parsedData.length}
- Colunas: ${columns.join(', ')}

TIPOS DE DADOS:
${Object.entries(columnTypes).map(([col, type]) => `- ${col}: ${type}`).join('\n')}

ESTATÍSTICAS:
${JSON.stringify(stats, null, 2)}

AMOSTRA DOS DADOS (primeiras 5 linhas):
${JSON.stringify(sampleData.slice(0, 5), null, 2)}

Por favor, retorne uma análise em formato JSON com:
1. "summary": Resumo executivo (2-3 frases)
2. "insights": Array com 5 insights principais (strings)
3. "recommendations": Array com 3 recomendações de ações (strings)
4. "chartSuggestions": Array com 2-3 sugestões de visualizações (objetos com type, xAxis, yAxis)`;

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'You are a data analyst. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please contact administrator.');
      }
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;

    // Extrair JSON da resposta
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        summary: analysisText.substring(0, 200),
        insights: ['Análise processada com sucesso'],
        recommendations: ['Revise os dados manualmente'],
        chartSuggestions: []
      };
    } catch {
      analysis = {
        summary: analysisText.substring(0, 200),
        insights: ['Análise processada com sucesso'],
        recommendations: ['Revise os dados manualmente'],
        chartSuggestions: []
      };
    }

    // Preparar dados para gráficos
    const chartData: any[] = [];
    const numericCols = columns.filter(col => columnTypes[col] === 'numeric');
    
    if (numericCols.length > 0) {
      // Pegar primeiras 10 linhas para gráfico
      chartData.push(...parsedData.slice(0, 10).map((row, idx) => ({
        index: idx + 1,
        ...row
      })));
    }

    // Salvar análise no banco
    const { data: savedAnalysis, error: saveError } = await supabaseClient
      .from('ia_spreadsheet_analyses')
      .insert({
        user_id: user.id,
        file_name: fileName,
        summary: analysis.summary,
        insights: analysis.insights,
        chart_data: {
          columns,
          columnTypes,
          stats,
          chartData,
          chartSuggestions: analysis.chartSuggestions
        }
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({
        success: true,
        analysisId: savedAnalysis.id,
        summary: analysis.summary,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        chartData: {
          columns,
          columnTypes,
          stats,
          data: chartData,
          suggestions: analysis.chartSuggestions
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});