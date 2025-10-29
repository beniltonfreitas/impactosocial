import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import type { ImportArticle } from "@/pages/AdminBulkImport";

type ImportPreviewProps = {
  articles: ImportArticle[];
};

export function ImportPreview({ articles }: ImportPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Preview das Notícias
        </CardTitle>
        <CardDescription>
          {articles.length} {articles.length === 1 ? "notícia será importada" : "notícias serão importadas"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {articles.map((article, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-start gap-4">
                {article.imagem?.hero && (
                  <img
                    src={article.imagem.hero}
                    alt={article.imagem.alt || article.titulo}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold line-clamp-2">{article.titulo}</h3>
                    <Badge variant="outline">{article.categoria}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.resumo || article.seo?.meta_descricao || "Sem resumo"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Slug: {article.slug}</span>
                    {article.fonte && (
                      <span className="truncate max-w-xs">Fonte: {article.fonte}</span>
                    )}
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 5).map((tag, tagIdx) => (
                        <Badge key={tagIdx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{article.tags.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
