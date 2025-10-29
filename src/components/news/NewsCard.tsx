import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewsCardProps {
  article: {
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
  };
  featured?: boolean;
}

export function NewsCard({ article, featured = false }: NewsCardProps) {
  const imageUrl = article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop';
  
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : null;

  return (
    <article className={`group rounded-lg overflow-hidden shadow hover:shadow-xl transition-all duration-300 bg-card border border-border ${featured ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
      <Link to={`/news/${article.slug}`} className="block">
        <div className={`relative overflow-hidden ${featured ? 'h-80' : 'h-48'}`}>
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {article.category && (
            <Badge
              className="absolute top-4 left-4 font-semibold"
              style={{ backgroundColor: article.category.color }}
            >
              {article.category.name}
            </Badge>
          )}
          {featured && (
            <Badge className="absolute top-4 right-4 bg-primary font-semibold">
              Destaque
            </Badge>
          )}
        </div>
        
        <div className={`p-4 ${featured ? 'lg:p-6' : ''}`}>
          <h3 className={`font-bold text-card-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors ${featured ? 'text-2xl lg:text-3xl' : 'text-lg'}`}>
            {article.title}
          </h3>
          
          {article.summary && (
            <p className={`text-muted-foreground mb-4 ${featured ? 'line-clamp-3 text-base' : 'line-clamp-2 text-sm'}`}>
              {article.summary}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {article.author && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{article.author}</span>
              </div>
            )}
            {timeAgo && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
