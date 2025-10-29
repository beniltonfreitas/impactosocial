import React from "react";
import { NewsCard } from "./NewsCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  featured?: boolean;
  category: {
    name: string;
    slug: string;
    color: string;
  } | null;
}

interface NewsGridProps {
  articles: Article[];
  loading?: boolean;
}

export function NewsGrid({ articles, loading = false }: NewsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-border">
            <Skeleton className="w-full h-48" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Nenhuma notícia disponível no momento.</p>
      </div>
    );
  }

  // Separar artigo em destaque (se houver)
  const featuredArticle = articles.find(a => a.featured);
  const regularArticles = articles.filter(a => !a.featured);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
      {featuredArticle && (
        <NewsCard article={featuredArticle} featured />
      )}
      {regularArticles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
