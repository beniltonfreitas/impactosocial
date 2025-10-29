import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Share2, Eye } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ShareButtons } from "@/components/article/ShareButtons";
import { PremiumGate } from "@/components/paywall/PremiumGate";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useArticleView } from "@/hooks/useArticleView";
import { trackArticleView } from "@/lib/analytics";

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  author: string | null;
  image_url: string | null;
  published_at: string | null;
  views: number;
  breaking: boolean;
  premium_only: boolean;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [canViewPremium, setCanViewPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Track article view after 3 seconds
  useArticleView(article?.id || '');

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;

      try {
        // Fetch article
        const { data: articleData, error: articleError } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .single();

        if (articleError) throw articleError;

        setArticle(articleData);

        // Fetch category if exists
        if (articleData.category_id) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('*')
            .eq('id', articleData.category_id)
            .single();

          if (categoryData) {
            setCategory(categoryData);
          }
        }

        // Check if user can view premium content
        if (articleData.premium_only && user) {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
          
          setCanViewPremium(!!subscription);
        } else {
          setCanViewPremium(!articleData.premium_only);
        }

        // Track article view in Google Analytics
        trackArticleView(articleData.id, articleData.title);

      } catch (error) {
        console.error('[Article] Error fetching article:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o artigo",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, toast, user]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = article?.title || "Conexão na Cidade";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
      } catch (error) {
        console.log('[Article] Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-8 w-24 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-64 mb-8" />
            <Skeleton className="h-96 w-full mb-8" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Home
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const contentPreview = article.content?.substring(0, 200) || article.summary?.substring(0, 200) || "";

  // Generate JSON-LD schema for article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.summary || "",
    "image": article.image_url || "",
    "datePublished": article.published_at || "",
    "author": {
      "@type": "Person",
      "name": article.author || "Conexão na Cidade"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Conexão na Cidade",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/icons/icon-512.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={article.title}
        description={article.summary || undefined}
        image={article.image_url || undefined}
        type="article"
        author={article.author || undefined}
        publishedTime={article.published_at || undefined}
        schema={articleSchema}
      />
      <Header />
      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Link>
          </nav>

          {/* Breaking badge */}
          {article.breaking && (
            <Badge variant="destructive" className="mb-4">
              🔴 URGENTE
            </Badge>
          )}

          {/* Category */}
          {category && (
            <Badge
              variant="outline"
              className="mb-4"
              style={{ borderColor: category.color, color: category.color }}
            >
              {category.name}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            {article.author && (
              <span className="font-medium">Por {article.author}</span>
            )}
            {article.published_at && (
              <>
                <span>•</span>
                <time dateTime={article.published_at}>
                  {format(new Date(article.published_at), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </time>
              </>
            )}
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.views} visualizações
            </span>
          </div>

          {/* Hero Image */}
          {article.image_url && (
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-auto rounded-lg mb-8 object-cover max-h-[500px]"
            />
          )}

          {/* Summary */}
          {article.summary && (
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {article.summary}
            </p>
          )}

          <Separator className="mb-8" />

          {/* Content or Premium Gate */}
          {canViewPremium ? (
            <>
              {article.content && (
                <div className="prose prose-lg max-w-none mb-12">
                  {article.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              <Separator className="my-12" />

              {/* Social Share Buttons */}
              <ShareButtons 
                url={window.location.href}
                title={article.title}
                description={article.summary || ''}
              />

              <Separator className="my-12" />

              {/* Comments Section */}
              <CommentsSection articleId={article.id} />
            </>
          ) : (
            <PremiumGate preview={contentPreview} />
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
