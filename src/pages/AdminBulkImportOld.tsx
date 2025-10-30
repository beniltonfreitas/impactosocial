import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { BulkImportForm } from "@/components/admin/BulkImportForm";
import { ImportPreview } from "@/components/admin/ImportPreview";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

export type ImportArticle = {
  categoria: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  fonte: string;
  imagem: {
    hero: string;
    og?: string;
    card?: string;
    alt?: string;
    credito?: string;
  };
  tags?: string[];
  seo?: {
    meta_titulo?: string;
    meta_descricao?: string;
  };
};

export type ImportConfig = {
  tenantId: string;
  publishImmediately: boolean;
  overwriteSlugs: boolean;
};

export type ImportResult = {
  success: number;
  failed: number;
  errors: { slug: string; error: string }[];
};

export default function AdminBulkImport() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ImportArticle[]>([]);
  const [config, setConfig] = useState<ImportConfig>({
    tenantId: "",
    publishImmediately: false,
    overwriteSlugs: true,
  });
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleValidJson = (parsedArticles: ImportArticle[]) => {
    setArticles(parsedArticles);
    setResult(null);
  };

  const handleConfigChange = (newConfig: ImportConfig) => {
    setConfig(newConfig);
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    setResult(null);

    // A lógica de importação será implementada no BulkImportForm
    // Este é apenas o estado de controle da UI
  };

  return (
    <>
      <SEO
        title="Importar Notícias em Massa - Admin"
        description="Importe múltiplas notícias de uma vez usando formato JSON"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Admin
            </Button>
            <h1 className="text-4xl font-bold">Importar Notícias em Massa</h1>
            <p className="text-muted-foreground mt-2">
              Cole o JSON gerado pelo Repórter AI para importar múltiplas notícias de uma vez
            </p>
          </div>

          <div className="space-y-6">
            <BulkImportForm
              onValidJson={handleValidJson}
              onConfigChange={handleConfigChange}
              onImport={setResult}
              importing={importing}
              setImporting={setImporting}
              setProgress={setProgress}
              config={config}
            />

            {articles.length > 0 && !importing && !result && (
              <ImportPreview articles={articles} />
            )}

            {importing && (
              <Card>
                <CardHeader>
                  <CardTitle>Importando Notícias...</CardTitle>
                  <CardDescription>
                    Por favor, aguarde enquanto as notícias são processadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {Math.round(progress)}% concluído
                  </p>
                </CardContent>
              </Card>
            )}

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.failed === 0 ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Importação Concluída com Sucesso!
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-yellow-500" />
                        Importação Concluída com Avisos
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Sucesso</AlertTitle>
                      <AlertDescription>
                        {result.success} notícias importadas
                      </AlertDescription>
                    </Alert>
                    {result.failed > 0 && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Falhas</AlertTitle>
                        <AlertDescription>
                          {result.failed} notícias com erro
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Detalhes dos Erros:</h3>
                      <div className="space-y-2">
                        {result.errors.map((err, idx) => (
                          <Alert key={idx} variant="destructive">
                            <AlertTitle className="text-sm">
                              Slug: {err.slug}
                            </AlertTitle>
                            <AlertDescription className="text-xs">
                              {err.error}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => window.location.reload()}>
                      Importar Novamente
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/admin/articles")}>
                      Ver Artigos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
