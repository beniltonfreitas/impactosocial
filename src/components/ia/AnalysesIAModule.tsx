import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, Upload, Loader2, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import { IAUsageBadge } from "./IAUsageBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Analysis {
  id: string;
  file_name: string;
  summary: string;
  insights: any;
  chart_data: any;
  created_at: string;
}

export function AnalysesIAModule() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ia_spreadsheet_analyses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo
    const validTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|json|xlsx|xls)$/i)) {
      toast.error('Formato de arquivo não suportado. Use CSV ou JSON.');
      return;
    }

    // Validar tamanho (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    setFile(selectedFile);
  };

  const analyzeFile = async () => {
    if (!file || loading) return;

    setLoading(true);
    try {
      // Ler arquivo
      const fileContent = await file.text();
      const fileType = file.name.endsWith('.csv') ? 'csv' : 'json';

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('ia-analyze-spreadsheet', {
        body: {
          fileName: file.name,
          fileContent,
          fileType
        }
      });

      if (error) throw error;

      setAnalysis({
        id: data.analysisId,
        file_name: file.name,
        summary: data.summary,
        insights: data.insights,
        chart_data: data.chartData,
        created_at: new Date().toISOString()
      });

      toast.success('Análise concluída com sucesso!');
      loadHistory();
    } catch (error: any) {
      console.error('Error analyzing file:', error);
      if (error.message?.includes('rate limit')) {
        toast.error('Limite de IA excedido. Aguarde 1 minuto.');
      } else if (error.message?.includes('credits')) {
        toast.error('Créditos de IA esgotados.');
      } else if (error.message?.includes('daily limit')) {
        toast.error('Limite diário de análises atingido (5/dia).');
      } else {
        toast.error('Erro ao analisar arquivo: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;

    const report = `
RELATÓRIO DE ANÁLISE IA
Arquivo: ${analysis.file_name}
Data: ${new Date(analysis.created_at).toLocaleString()}

RESUMO EXECUTIVO:
${analysis.summary}

INSIGHTS PRINCIPAIS:
${analysis.insights.map((insight, idx) => `${idx + 1}. ${insight}`).join('\n')}

---
Gerado por Rede PcD - Ferramentas IA
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-${analysis.file_name}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Relatório baixado');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análises IA de Planilhas
              </CardTitle>
              <CardDescription>
                Upload de CSV/JSON para insights automáticos
              </CardDescription>
            </div>
            <IAUsageBadge type="analyses" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload de Arquivo</label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={analyzeFile}
                disabled={loading || !file}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Analisar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Suporte: CSV, JSON • Máximo: 5MB • Limite: 5 análises/dia
            </p>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Análise: {analysis.file_name}</CardTitle>
                  <CardDescription>
                    {new Date(analysis.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                <Button onClick={downloadReport} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Baixar Relatório
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Resumo Executivo</AlertTitle>
                <AlertDescription>{analysis.summary}</AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold mb-2">Insights Principais:</h3>
                <ul className="space-y-2">
                  {analysis.insights?.map((insight, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-primary font-semibold">{idx + 1}.</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {analysis.chart_data?.data && analysis.chart_data.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Visualização dos Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysis.chart_data.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {analysis.chart_data.columns
                      ?.filter((col: string) => analysis.chart_data.columnTypes[col] === 'numeric')
                      .map((col: string, idx: number) => (
                        <Bar key={col} dataKey={col} fill={`hsl(${idx * 60}, 70%, 50%)`} />
                      ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Análises</CardTitle>
          <CardDescription>Suas últimas 5 análises</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma análise ainda. Faça upload de um arquivo para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAnalysis(item)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                    analysis?.id === item.id ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <p className="font-medium">{item.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}