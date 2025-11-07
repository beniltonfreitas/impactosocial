import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArticleGallery } from '@/components/article/ArticleGallery';
import { ShareButtons } from '@/components/article/ShareButtons';

interface ArticlePreviewProps {
  open: boolean;
  onClose: () => void;
  article: {
    title?: string;
    slug?: string;
    summary?: string;
    content?: string;
    image_url?: string;
    image_alt?: string;
    image_credit?: string;
    author?: string;
    category_id?: string;
    published_at?: string;
    gallery?: Array<{
      id: string;
      url: string;
      caption?: string;
      credit?: string;
    }>;
  };
  categoryName?: string;
}

export function ArticlePreview({ open, onClose, article, categoryName }: ArticlePreviewProps) {
  const publishDate = article.published_at ? new Date(article.published_at) : new Date();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Editor
              </Button>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                🔍 PREVIEW
              </Badge>
            </div>
            <DialogTitle className="sr-only">Preview do Artigo</DialogTitle>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto h-full">
          <article className="max-w-4xl mx-auto px-6 py-8">
            {/* Hero Image */}
            {article.image_url && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={article.image_url}
                  alt={article.image_alt || article.title}
                  className="w-full h-auto object-cover"
                />
                {article.image_credit && (
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    Crédito: {article.image_credit}
                  </p>
                )}
              </div>
            )}

            {/* Category */}
            {categoryName && (
              <Badge variant="secondary" className="mb-4">
                {categoryName}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              {article.title || 'Sem título'}
            </h1>

            {/* Summary */}
            {article.summary && (
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {article.summary}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{article.author || 'Autor'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <time dateTime={publishDate.toISOString()}>
                  {format(publishDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </time>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mb-8">
              <ShareButtons
                title={article.title || 'Artigo'}
                url={`/news/${article.slug || 'preview'}`}
              />
            </div>

            {/* Content */}
            <div
              className="prose prose-lg dark:prose-invert max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: article.content || '<p>Sem conteúdo</p>' }}
            />

            {/* Gallery */}
            {article.gallery && article.gallery.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Galeria de Fotos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {article.gallery.map((image, index) => (
                    <div key={index} className="rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={image.url}
                        alt={image.caption || `Imagem ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      {image.caption && (
                        <div className="p-3 text-sm">
                          <p className="text-muted-foreground">{image.caption}</p>
                          {image.credit && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Crédito: {image.credit}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Placeholder */}
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">Comentários</h2>
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  Seção de comentários (preview)
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Os comentários aparecerão aqui quando o artigo for publicado
                </p>
              </div>
            </div>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}
