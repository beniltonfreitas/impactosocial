import { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ImportArticle, ImportConfig, ImportResult } from "@/pages/AdminBulkImport";

const newsItemSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  titulo: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  slug: z.string().min(1, "Slug é obrigatório"),
  resumo: z.string(),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  fonte: z.string().url("Fonte deve ser uma URL válida").optional(),
  imagem: z.object({
    hero: z.string().url("URL da imagem inválida"),
    og: z.string().url().optional(),
    card: z.string().url().optional(),
    alt: z.string().optional(),
    credito: z.string().optional(),
  }),
  tags: z.array(z.string()).optional(),
  seo: z.object({
    meta_titulo: z.string().optional(),
    meta_descricao: z.string().optional(),
  }).optional(),
});

const bulkImportSchema = z.object({
  noticias: z.array(newsItemSchema).min(1, "Deve conter pelo menos uma notícia"),
});

type BulkImportFormProps = {
  onValidJson: (articles: ImportArticle[]) => void;
  onConfigChange: (config: ImportConfig) => void;
  onImport: (result: ImportResult) => void;
  importing: boolean;
  setImporting: (value: boolean) => void;
  setProgress: (value: number) => void;
  config: ImportConfig;
};

export function BulkImportForm({
  onValidJson,
  onConfigChange,
  onImport,
  importing,
  setImporting,
  setProgress,
  config,
}: BulkImportFormProps) {
  const [jsonText, setJsonText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    const { data } = await supabase.from("tenant").select("*");
    if (data) {
      setTenants(data);
      if (data.length > 0 && !config.tenantId) {
        onConfigChange({ ...config, tenantId: data[0].id });
      }
    }
  };

  const validateJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const validated = bulkImportSchema.parse(parsed);
      setValidationError(null);
      setIsValid(true);
      onValidJson(validated.noticias as ImportArticle[]);
      toast({
        title: "JSON Válido",
        description: `${validated.noticias.length} notícias prontas para importação`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      } else if (error instanceof SyntaxError) {
        setValidationError("JSON inválido: " + error.message);
      } else {
        setValidationError("Erro ao validar JSON");
      }
      setIsValid(false);
      onValidJson([]);
    }
  };

  const ensureUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const { data } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) return slug;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  };

  const getOrCreateCategory = async (categoryName: string): Promise<string> => {
    // Buscar categoria existente
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("name", categoryName)
      .maybeSingle();

    if (existing) return existing.id;

    // Criar nova categoria
    const slug = categoryName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data: newCategory, error } = await supabase
      .from("categories")
      .insert({ name: categoryName, slug })
      .select("id")
      .single();

    if (error) {
      throw new Error(
        `Erro ao criar categoria "${categoryName}": ${error.message}. ` +
        `Verifique se você tem permissões de admin/moderador.`
      );
    }
    return newCategory.id;
  };

  const handleImport = async () => {
    if (!isValid) return;

    setImporting(true);
    setProgress(0);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      const parsed = JSON.parse(jsonText);
      const articles: ImportArticle[] = parsed.noticias;
      const total = articles.length;

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        try {
          // Buscar ou criar categoria
          const categoryId = await getOrCreateCategory(article.categoria);

          // Garantir slug único
          const finalSlug = config.overwriteSlugs
            ? await ensureUniqueSlug(article.slug)
            : article.slug;

          // Preparar dados do artigo
          const articleData = {
            title: article.titulo,
            slug: finalSlug,
            summary: article.resumo || article.seo?.meta_descricao || "",
            content: article.conteudo,
            image_url: article.imagem.hero,
            author: article.fonte || "Importação em Massa",
            category_id: categoryId,
            tenant_id: config.tenantId,
            published_at: config.publishImmediately ? new Date().toISOString() : null,
            featured: false,
            breaking: false,
            premium_only: false,
          };

          // Inserir artigo
          const { error } = await supabase.from("articles").insert(articleData);

          if (error) throw error;

          result.success++;
        } catch (error: any) {
          result.failed++;
          const errorMsg = error.message || "Erro desconhecido";
          const detailedError = errorMsg.includes("categoria")
            ? `${errorMsg} (Categoria: ${article.categoria})`
            : errorMsg;
          
          result.errors.push({
            slug: article.slug,
            error: detailedError,
          });
          
          console.error(`Erro ao importar "${article.titulo}":`, error);
        }

        // Atualizar progresso
        setProgress(((i + 1) / total) * 100);
      }

      toast({
        title: "Importação Concluída",
        description: `${result.success} notícias importadas com sucesso${
          result.failed > 0 ? `, ${result.failed} com erro` : ""
        }`,
      });

      onImport(result);
    } catch (error: any) {
      toast({
        title: "Erro na Importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cole o JSON</CardTitle>
          <CardDescription>
            Cole aqui o JSON no formato do Repórter AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="json-input">JSON das Notícias</Label>
            <Textarea
              id="json-input"
              placeholder='{"noticias": [...]}'
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="font-mono text-sm min-h-[200px]"
              disabled={importing}
            />
          </div>

          <Button onClick={validateJson} disabled={!jsonText || importing}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Validar JSON
          </Button>

          {validationError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erro de Validação</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {isValid && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>JSON Válido</AlertTitle>
              <AlertDescription>
                As notícias estão prontas para importação
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Importação</CardTitle>
            <CardDescription>
              Defina como as notícias serão importadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tenant-select">Tenant Padrão</Label>
              <Select
                value={config.tenantId}
                onValueChange={(value) =>
                  onConfigChange({ ...config, tenantId: value })
                }
                disabled={importing}
              >
                <SelectTrigger id="tenant-select">
                  <SelectValue placeholder="Selecione o tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="publish-switch">Publicar Imediatamente</Label>
                <p className="text-sm text-muted-foreground">
                  Se desativado, notícias ficarão como rascunho
                </p>
              </div>
              <Switch
                id="publish-switch"
                checked={config.publishImmediately}
                onCheckedChange={(checked) =>
                  onConfigChange({ ...config, publishImmediately: checked })
                }
                disabled={importing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="slug-switch">Reescrever Slugs Duplicados</Label>
                <p className="text-sm text-muted-foreground">
                  Adiciona sufixo numérico em slugs já existentes
                </p>
              </div>
              <Switch
                id="slug-switch"
                checked={config.overwriteSlugs}
                onCheckedChange={(checked) =>
                  onConfigChange({ ...config, overwriteSlugs: checked })
                }
                disabled={importing}
              />
            </div>

            <Button
              onClick={handleImport}
              disabled={importing || !config.tenantId}
              className="w-full"
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importando..." : "Importar Notícias"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
