import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileJson, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { BulkImportForm } from "@/components/admin/BulkImportForm";
import { RssFeedImporter } from "@/components/admin/RssFeedImporter";
import { ImportPreview } from "@/components/admin/ImportPreview";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <>
      <SEO
        title="Importar Notícias - Admin"
        description="Importe múltiplas notícias via JSON ou RSS/Feed"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Admin
            </Button>
            <h1 className="text-4xl font-bold">Importar Notícias em Massa</h1>
            <p className="text-muted-foreground mt-2">
              Importe múltiplas notícias via JSON ou RSS/Feed
            </p>
          </div>

          <Tabs defaultValue="json" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="json" className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="rss" className="flex items-center gap-2">
                <Rss className="h-4 w-4" />
                RSS/Feed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="json" className="space-y-6">
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
                    <CardDescription>Por favor, aguarde</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={progress} className="w-full" />
                  </CardContent>
                </Card>
              )}

              {result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {result.failed === 0 ? (
                        <><CheckCircle2 className="h-5 w-5 text-green-500" />Sucesso!</>
                      ) : (
                        <><XCircle className="h-5 w-5 text-yellow-500" />Concluído com Avisos</>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertTitle>Resultado</AlertTitle>
                      <AlertDescription>
                        {result.success} importadas, {result.failed} falharam
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rss">
              <RssFeedImporter onImportComplete={setResult} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
