import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workflow, Play, Loader2, Save, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: any;
  template: boolean;
}

interface PipelineExecution {
  id: string;
  status: string;
  results: any;
  created_at: string;
}

const PIPELINE_TEMPLATES = [
  {
    name: "Artigo → Resumo → Imagem",
    description: "Transforma um artigo longo em resumo e gera imagem ilustrativa",
    steps: [
      { type: 'summarize', input: '', config: {} },
      { type: 'image', input: '', config: { size: '1024x1024' } }
    ]
  },
  {
    name: "Ideia → Texto Expandido",
    description: "Expande uma ideia curta em texto completo e detalhado",
    steps: [
      { type: 'chat', input: '', config: { context: 'general' } }
    ]
  },
  {
    name: "Notícia → Resumo + Hashtags",
    description: "Resume notícia e gera hashtags para redes sociais",
    steps: [
      { type: 'summarize', input: '', config: {} },
      { type: 'chat', input: 'Gere 5 hashtags relevantes para: ', config: { context: 'news' } }
    ]
  }
];

export function StudioIAModule() {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [executions, setExecutions] = useState<PipelineExecution[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [input, setInput] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadPipelines();
      loadExecutions();
    }
  }, [user]);

  const loadPipelines = async () => {
    try {
      const { data, error } = await supabase
        .from('ia_pipelines')
        .select('*')
        .or(`user_id.eq.${user!.id},template.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPipelines(data || []);
    } catch (error) {
      console.error('Error loading pipelines:', error);
    }
  };

  const loadExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from('ia_pipeline_executions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Error loading executions:', error);
    }
  };

  const executePipeline = async (template: any, saveAs?: string) => {
    if (!input.trim() || executing) return;

    setExecuting(true);
    try {
      // Atualizar input no primeiro step
      const stepsWithInput = template.steps.map((step: any, idx: number) => ({
        ...step,
        input: idx === 0 ? input.trim() : step.input
      }));

      const { data, error } = await supabase.functions.invoke('ia-pipeline-execute', {
        body: {
          steps: stepsWithInput,
          savePipeline: !!saveAs,
          pipelineName: saveAs,
          pipelineDescription: template.description
        }
      });

      if (error) throw error;

      setLastResult(data);
      toast.success('Pipeline executado com sucesso!');
      loadExecutions();

      if (saveAs) {
        loadPipelines();
      }
    } catch (error: any) {
      console.error('Error executing pipeline:', error);
      if (error.message?.includes('rate limit')) {
        toast.error('Limite de IA excedido. Aguarde 1 minuto.');
      } else if (error.message?.includes('credits')) {
        toast.error('Créditos de IA esgotados.');
      } else {
        toast.error('Erro ao executar pipeline: ' + error.message);
      }
    } finally {
      setExecuting(false);
    }
  };

  const handleExecuteTemplate = (template: any) => {
    setSelectedTemplate(template);
    if (input.trim()) {
      executePipeline(template);
    } else {
      toast.error('Digite um texto de entrada primeiro');
    }
  };

  const handleSaveAndExecute = () => {
    if (!pipelineName.trim()) {
      toast.error('Digite um nome para salvar o pipeline');
      return;
    }
    executePipeline(selectedTemplate, pipelineName.trim());
    setPipelineName('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Studio IA - Pipelines Automáticos
          </CardTitle>
          <CardDescription>
            Combine múltiplas IAs em workflows inteligentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Texto de Entrada</label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Cole seu texto aqui para processar com IA..."
              className="min-h-[120px]"
              disabled={executing}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Meus Pipelines</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {PIPELINE_TEMPLATES.map((template, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {template.steps.length} steps
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {template.steps.map((step: any, stepIdx: number) => (
                    <Badge key={stepIdx} variant="outline">
                      {stepIdx + 1}. {step.type === 'chat' ? '💬 Chat' : step.type === 'image' ? '🎨 Imagem' : '📝 Resumo'}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={() => handleExecuteTemplate(template)}
                  disabled={executing || !input.trim()}
                  className="w-full gap-2"
                >
                  {executing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Executar Pipeline
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Salvar Pipeline</CardTitle>
                <CardDescription>Salve este pipeline para reutilizar depois</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="Nome do pipeline"
                  disabled={executing}
                />
                <Button
                  onClick={handleSaveAndExecute}
                  disabled={executing || !pipelineName.trim() || !input.trim()}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar e Executar
                </Button>
              </CardContent>
            </Card>
          )}

          {pipelines.filter(p => !p.template).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Você ainda não salvou nenhum pipeline personalizado.</p>
                <p className="text-sm mt-2">Execute um template e salve para criar o seu próprio.</p>
              </CardContent>
            </Card>
          ) : (
            pipelines.filter(p => !p.template).map((pipeline) => (
              <Card key={pipeline.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <CardDescription>{pipeline.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {pipeline.steps.length} steps
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => executePipeline(pipeline)}
                    disabled={executing || !input.trim()}
                    className="w-full gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Executar
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {executions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Nenhuma execução ainda.</p>
                <p className="text-sm mt-2">Execute um pipeline para ver o histórico aqui.</p>
              </CardContent>
            </Card>
          ) : (
            executions.map((exec) => (
              <Card key={exec.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(exec.created_at).toLocaleString()}
                      </CardTitle>
                      <CardDescription>
                        Status: {exec.status === 'completed' ? '✅ Completado' : exec.status === 'failed' ? '❌ Falhou' : '⏳ Executando'}
                      </CardDescription>
                    </div>
                    <Badge variant={exec.status === 'completed' ? 'default' : exec.status === 'failed' ? 'destructive' : 'secondary'}>
                      {exec.status}
                    </Badge>
                  </div>
                </CardHeader>
                {exec.results?.steps && (
                  <CardContent>
                    <div className="space-y-2">
                      {exec.results.steps.map((step: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Step {step.step}: {step.type}</p>
                          {step.output && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {step.output.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Última Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lastResult.results?.map((step: any, idx: number) => (
                <div key={idx} className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">
                    Step {step.step}: {step.type}
                  </p>
                  {step.success ? (
                    step.type === 'image' ? (
                      <img src={step.output} alt="Generated" className="w-full rounded-lg" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{step.output}</p>
                    )
                  ) : (
                    <p className="text-sm text-destructive">Erro: {step.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}