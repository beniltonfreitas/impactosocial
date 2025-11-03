import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Bot, Save, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { SiteAIUrlManager } from "@/components/dashboard/SiteAIUrlManager";

interface KnowledgeSource {
  type: 'file' | 'url';
  name: string;
  url: string;
  size?: number;
  content_preview?: string;
  uploaded_at: string;
  status?: 'pending' | 'processed' | 'error';
  error_message?: string;
}

interface SiteAIConfigType {
  agent_name: string;
  agent_description: string;
  agent_instructions: string;
  knowledge_files: KnowledgeSource[];
}

export default function SiteAI() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<SiteAIConfigType>({
    agent_name: 'Site AI',
    agent_description: '',
    agent_instructions: '',
    knowledge_files: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [profile?.id]);

  const loadConfig = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('site_ai_config')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig({
          agent_name: data.agent_name,
          agent_description: data.agent_description || '',
          agent_instructions: data.agent_instructions || '',
          knowledge_files: (data.knowledge_files as any) || []
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_ai_config')
        .upsert({
          user_id: profile.id,
          agent_name: config.agent_name,
          agent_description: config.agent_description,
          agent_instructions: config.agent_instructions,
          knowledge_files: config.knowledge_files as any
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Limite: 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use: PDF, TXT, MD ou DOCX');
      return;
    }

    // Check file limit
    if (config.knowledge_files.length >= 10) {
      toast.error('Você atingiu o limite de 10 arquivos');
      return;
    }

    setUploading(true);
    try {
      const filePath = `${profile.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('site-ai-knowledge')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-ai-knowledge')
        .getPublicUrl(filePath);

      const newFile: KnowledgeSource = {
        type: 'file',
        name: file.name,
        url: publicUrl,
        size: file.size,
        uploaded_at: new Date().toISOString(),
        status: 'processed'
      };

      setConfig(prev => ({
        ...prev,
        knowledge_files: [...prev.knowledge_files, newFile]
      }));

      toast.success('Arquivo carregado com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (fileToDelete: KnowledgeSource) => {
    if (!profile?.id) return;

    try {
      const filePath = fileToDelete.url.split('/').slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from('site-ai-knowledge')
        .remove([filePath]);

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        knowledge_files: prev.knowledge_files.filter(f => f.url !== fileToDelete.url)
      }));

      toast.success('Arquivo removido');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const handleAddUrl = async (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname;
      const name = hostname + (pathname !== '/' ? pathname : '');

      const newSource: KnowledgeSource = {
        type: 'url',
        name: name.length > 50 ? name.substring(0, 47) + '...' : name,
        url,
        uploaded_at: new Date().toISOString(),
        status: 'processed',
        content_preview: 'Conteúdo externo será processado durante o uso.'
      };

      setConfig(prev => ({
        ...prev,
        knowledge_files: [...prev.knowledge_files, newSource]
      }));
    } catch (error) {
      throw new Error('Erro ao validar URL');
    }
  };

  const handleRefreshUrl = async (url: string) => {
    setConfig(prev => ({
      ...prev,
      knowledge_files: prev.knowledge_files.map(source =>
        source.url === url
          ? { ...source, uploaded_at: new Date().toISOString(), status: 'processed' as const }
          : source
      )
    }));
  };

  const handleRemoveUrl = (url: string) => {
    setConfig(prev => ({
      ...prev,
      knowledge_files: prev.knowledge_files.filter(source => source.url !== url)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Site AI - Configuração do Agente"
        description="Configure seu agente de IA personalizado"
      />
      
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Site AI</h1>
          <p className="text-muted-foreground">
            Configure seu agente de IA personalizado para responder perguntas sobre o site
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Agente</CardTitle>
                <CardDescription>
                  Personalize o nome, descrição e instruções do seu agente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent_name">Nome do Agente</Label>
                  <Input
                    id="agent_name"
                    value={config.agent_name}
                    onChange={(e) => setConfig(prev => ({ ...prev, agent_name: e.target.value }))}
                    placeholder="Site AI"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent_description">Descrição</Label>
                  <Textarea
                    id="agent_description"
                    value={config.agent_description}
                    onChange={(e) => setConfig(prev => ({ ...prev, agent_description: e.target.value }))}
                    placeholder="Assistente virtual especializado em..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent_instructions">Instruções Personalizadas</Label>
                  <Textarea
                    id="agent_instructions"
                    value={config.agent_instructions}
                    onChange={(e) => setConfig(prev => ({ ...prev, agent_instructions: e.target.value }))}
                    placeholder="Você é um assistente que... Foque em... Sempre responda..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Base de Conhecimento</CardTitle>
                <CardDescription>
                  Adicione arquivos e links externos para alimentar o conhecimento do agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="files" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="files">
                      Arquivos ({config.knowledge_files.filter(f => f.type === 'file' || !f.type).length}/10)
                    </TabsTrigger>
                    <TabsTrigger value="links">
                      Links ({config.knowledge_files.filter(f => f.type === 'url').length}/10)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="files" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="file_upload" className="cursor-pointer">
                        <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Clique para selecionar arquivos
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, TXT, MD ou DOCX (máx. 5MB)
                          </p>
                        </div>
                        <Input
                          id="file_upload"
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.txt,.md,.docx"
                          disabled={uploading || config.knowledge_files.filter(f => f.type === 'file' || !f.type).length >= 10}
                        />
                      </Label>
                    </div>

                    {config.knowledge_files.filter(f => f.type === 'file' || !f.type).length > 0 && (
                      <div className="space-y-2">
                        {config.knowledge_files
                          .filter(f => f.type === 'file' || !f.type)
                          .map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {file.size ? formatFileSize(file.size) : 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFile(file)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {config.knowledge_files.filter(f => f.type === 'file' || !f.type).length}/10 arquivos carregados
                    </p>
                  </TabsContent>

                  <TabsContent value="links" className="mt-4">
                    <SiteAIUrlManager
                      urls={config.knowledge_files.filter(f => f.type === 'url')}
                      onAddUrl={handleAddUrl}
                      onRemoveUrl={handleRemoveUrl}
                      onRefreshUrl={handleRefreshUrl}
                      maxUrls={10}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>

          {/* Preview Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Prévia do Agente
                </CardTitle>
                <CardDescription>
                  Visualize como seu agente está configurado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{config.agent_name}</h3>
                  {config.agent_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.agent_description}
                    </p>
                  )}
                </div>

                {config.agent_instructions && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Instruções:</h4>
                    <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap">
                      {config.agent_instructions}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm mb-2">Base de Conhecimento:</h4>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    {config.knowledge_files.filter(f => f.type === 'file' || !f.type).length > 0 && (
                      <div>
                        <p className="text-sm font-medium">
                          📄 {config.knowledge_files.filter(f => f.type === 'file' || !f.type).length} arquivo(s)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatFileSize(config.knowledge_files.filter(f => f.type === 'file' || !f.type).reduce((acc, f) => acc + (f.size || 0), 0))}
                        </p>
                      </div>
                    )}
                    {config.knowledge_files.filter(f => f.type === 'url').length > 0 && (
                      <div>
                        <p className="text-sm font-medium">
                          🔗 {config.knowledge_files.filter(f => f.type === 'url').length} link(s) externo(s)
                        </p>
                      </div>
                    )}
                    {config.knowledge_files.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma fonte de conhecimento adicionada
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    💡 Seu agente responderá perguntas baseado nas informações do site, 
                    nas instruções personalizadas e nos arquivos de conhecimento carregados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
