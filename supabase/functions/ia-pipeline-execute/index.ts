import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PipelineStep {
  type: 'chat' | 'image' | 'summarize';
  input: string;
  config?: {
    context?: string;
    size?: string;
    model?: string;
  };
}

interface PipelineRequest {
  pipelineId?: string;
  steps: PipelineStep[];
  savePipeline?: boolean;
  pipelineName?: string;
  pipelineDescription?: string;
}

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

    const { pipelineId, steps, savePipeline, pipelineName, pipelineDescription }: PipelineRequest = await req.json();

    // Criar registro de execução
    const { data: execution, error: execError } = await supabaseClient
      .from('ia_pipeline_executions')
      .insert({
        pipeline_id: pipelineId || null,
        user_id: user.id,
        input_data: { steps },
        status: 'running'
      })
      .select()
      .single();

    if (execError) throw execError;

    const results: any[] = [];
    let currentInput = steps[0]?.input || '';

    // Executar steps sequencialmente
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`Executing step ${i + 1}/${steps.length}: ${step.type}`);

      try {
        let stepResult;

        if (step.type === 'chat' || step.type === 'summarize') {
          // Chamar ai-agent
          const { data, error } = await supabaseClient.functions.invoke('ai-agent', {
            body: {
              type: step.type,
              payload: i === 0 ? step.input : currentInput,
              context: step.config?.context
            }
          });

          if (error) throw error;
          stepResult = data.response;
          currentInput = stepResult;

        } else if (step.type === 'image') {
          // Chamar generate-image
          const { data, error } = await supabaseClient.functions.invoke('generate-image', {
            body: {
              prompt: i === 0 ? step.input : currentInput,
              size: step.config?.size || '1024x1024'
            }
          });

          if (error) throw error;
          stepResult = data.imageUrl;
          currentInput = `Image generated: ${stepResult}`;
        }

        results.push({
          step: i + 1,
          type: step.type,
          output: stepResult,
          success: true
        });

      } catch (stepError) {
        console.error(`Error in step ${i + 1}:`, stepError);
        const errorMsg = stepError instanceof Error ? stepError.message : 'Unknown error';
        results.push({
          step: i + 1,
          type: step.type,
          error: errorMsg,
          success: false
        });

        // Atualizar execução como failed
        await supabaseClient
          .from('ia_pipeline_executions')
          .update({
            status: 'failed',
            error_message: `Failed at step ${i + 1}: ${errorMsg}`,
            results: { steps: results },
            completed_at: new Date().toISOString()
          })
          .eq('id', execution.id);

        return new Response(
          JSON.stringify({
            error: `Pipeline failed at step ${i + 1}`,
            results
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Salvar pipeline como template se solicitado
    if (savePipeline && pipelineName) {
      await supabaseClient
        .from('ia_pipelines')
        .insert({
          user_id: user.id,
          name: pipelineName,
          description: pipelineDescription || '',
          steps: steps,
          template: false
        });
    }

    // Atualizar execução como completed
    await supabaseClient
      .from('ia_pipeline_executions')
      .update({
        status: 'completed',
        results: { steps: results },
        completed_at: new Date().toISOString()
      })
      .eq('id', execution.id);

    return new Response(
      JSON.stringify({
        success: true,
        executionId: execution.id,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pipeline execution error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});