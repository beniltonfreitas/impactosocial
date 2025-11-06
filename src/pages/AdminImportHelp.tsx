import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SEO } from "@/components/SEO";

export default function AdminImportHelp() {
  const navigate = useNavigate();

  const exampleJson = {
    noticias: [
      {
        categoria: "Política",
        titulo: "Congresso aprova nova lei de educação digital",
        slug: "congresso-aprova-lei-educacao-digital",
        resumo: "Projeto estabelece diretrizes para ensino de tecnologia nas escolas públicas de todo o país.",
        conteudo: "<p>O Congresso Nacional aprovou nesta terça-feira...</p><blockquote>Nova lei estabelece diretrizes para ensino de tecnologia.</blockquote>",
        fonte: "https://agenciabrasil.ebc.com.br/educacao/noticia/2025-10/congresso-aprova-lei",
        imagem: {
          hero: "https://cdn.exemplo.com/imagem-1200x675.jpg",
          og: "https://cdn.exemplo.com/imagem-1200x630.jpg",
          card: "https://cdn.exemplo.com/imagem-800x450.jpg",
          alt: "Descrição acessível da imagem",
          credito: "Agência Brasil/EBC"
        },
        tags: ["política", "educação", "congresso"],
        seo: {
          meta_titulo: "Congresso aprova lei de educação digital",
          meta_descricao: "Nova legislação estabelece diretrizes para ensino de tecnologia nas escolas públicas brasileiras."
        }
      }
    ]
  };

  return (
    <>
      <SEO
        title="Ajuda - Importação de Notícias"
        description="Documentação completa do sistema de importação em massa"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/admin/bulk-import")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Importação
            </Button>
            <h1 className="text-4xl font-bold">Ajuda - Importação de Notícias</h1>
            <p className="text-muted-foreground mt-2">
              Guia completo para importar notícias em massa via JSON
            </p>
          </div>

          <div className="space-y-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Formato JSON Aceito
                </CardTitle>
                <CardDescription>
                  Estrutura completa do JSON de importação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{JSON.stringify(exampleJson, null, 2)}
                </pre>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(exampleJson, null, 2));
                  }}
                >
                  Copiar Exemplo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campos Obrigatórios</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>categoria:</strong> Nome da categoria (será criada se não existir)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>titulo:</strong> Título da notícia (máx. 200 caracteres)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>slug:</strong> URL amigável (único)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>conteudo:</strong> Conteúdo HTML da notícia
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>imagem.hero:</strong> URL da imagem principal
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campos Opcionais</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li><strong>resumo:</strong> Resumo/subtítulo</li>
                  <li><strong>fonte:</strong> URL da fonte original</li>
                  <li><strong>imagem.og:</strong> Imagem Open Graph (1200x630)</li>
                  <li><strong>imagem.card:</strong> Imagem para card (800x450)</li>
                  <li><strong>imagem.alt:</strong> Texto alternativo</li>
                  <li><strong>imagem.credito:</strong> Crédito do fotógrafo/agência</li>
                  <li><strong>tags:</strong> Array de palavras-chave</li>
                  <li><strong>seo.meta_titulo:</strong> Título SEO customizado</li>
                  <li><strong>seo.meta_descricao:</strong> Descrição SEO customizada</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Erros Comuns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>JSON Inválido</AlertTitle>
                  <AlertDescription>
                    Verifique vírgulas, aspas e estrutura. Use um validador JSON online.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle>URLs de Imagem Inválidas</AlertTitle>
                  <AlertDescription>
                    Todas as URLs devem começar com https:// e apontar para arquivos de imagem.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle>Slugs Duplicados</AlertTitle>
                  <AlertDescription>
                    Ative "Reescrever Slugs Duplicados" para adicionar sufixo automático.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTitle>Sem Permissão</AlertTitle>
                  <AlertDescription>
                    Apenas usuários Admin e Moderador podem importar notícias.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Boas Práticas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Teste com 1-2 notícias antes de importar grandes lotes</li>
                  <li>Use imagens com URLs públicas e estáveis (CDN recomendado)</li>
                  <li>Mantenha títulos concisos (máximo 200 caracteres)</li>
                  <li>Adicione pelo menos 3-5 tags por notícia para melhor SEO</li>
                  <li>Sempre preencha os campos SEO para melhor ranqueamento</li>
                  <li>Use HTML limpo no conteúdo (será sanitizado automaticamente)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
