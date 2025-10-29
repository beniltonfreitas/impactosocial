import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Newspaper } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: {
    name: string;
    color: string;
  } | null;
}

interface NewsTickerProps {
  articles: Article[];
}

export function NewsTicker({ articles }: NewsTickerProps) {
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker || articles.length === 0) return;

    let scrollAmount = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      if (ticker) {
        scrollAmount += scrollSpeed;
        if (scrollAmount >= ticker.scrollWidth / 2) {
          scrollAmount = 0;
        }
        ticker.style.transform = `translateX(-${scrollAmount}px)`;
      }
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [articles]);

  if (!articles || articles.length === 0) return null;

  // Duplicar artigos para scroll infinito suave
  const duplicatedArticles = [...articles, ...articles];

  return (
    <div className="bg-primary text-primary-foreground py-3 overflow-hidden relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Newspaper className="w-5 h-5" />
            <span className="font-bold text-sm uppercase">Últimas</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            <div
              ref={tickerRef}
              className="flex gap-8 items-center whitespace-nowrap will-change-transform"
              style={{ display: 'inline-flex' }}
            >
              {duplicatedArticles.map((article, index) => (
                <a
                  key={`${article.id}-${index}`}
                  href={`/news/${article.slug}`}
                  className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
                >
                  {article.category && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: article.category.color, color: 'white' }}
                    >
                      {article.category.name}
                    </Badge>
                  )}
                  <span className="text-sm font-medium">{article.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
