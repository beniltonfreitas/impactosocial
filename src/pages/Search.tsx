import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, Clock, TrendingUp, User, Calendar, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { NewsSearch } from "@/components/news/NewsSearch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { trackSearch } from "@/lib/analytics";

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  published_at: string | null;
  author: string | null;
  views: number;
  breaking: boolean;
  premium_only: boolean;
  category_id: string | null;
}

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 5;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const history = localStorage.getItem(STORAGE_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('[Search] Error loading history:', error);
    }
  }, []);

  // Save search to history
  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    
    try {
      const newHistory = [
        term,
        ...searchHistory.filter(h => h !== term)
      ].slice(0, MAX_HISTORY);
      
      setSearchHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('[Search] Error saving history:', error);
    }
  };

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
          .order('published_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setResults(data || []);
        saveToHistory(query);
        trackSearch(query);
      } catch (error) {
        console.error('[Search] Error searching:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleSearch = (term: string) => {
    setSearchParams(term ? { q: term } : {});
  };

  const handleHistoryClick = (term: string) => {
    setSearchParams({ q: term });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const highlightTerm = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-primary/20 font-semibold">{part}</mark> : part
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={query ? `Busca: ${query}` : "Buscar Notícias"}
        description="Busque notícias e artigos em nossa base de conteúdo regional."
      />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <SearchIcon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Buscar Notícias</h1>
            </div>
            
            <NewsSearch onSearch={handleSearch} initialValue={query} />
          </div>

          {/* Search Results */}
          {query ? (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {loading ? (
                    "Buscando..."
                  ) : (
                    <>
                      {results.length > 0 ? (
                        <>
                          <span className="font-semibold text-foreground">{results.length}</span> resultado
                          {results.length !== 1 && 's'} para{' '}
                          <span className="font-semibold text-foreground">"{query}"</span>
                        </>
                      ) : (
                        <>Nenhum resultado encontrado para <span className="font-semibold text-foreground">"{query}"</span></>
                      )}
                    </>
                  )}
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-48 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((article) => (
                    <article key={article.id} className="group rounded-lg overflow-hidden shadow hover:shadow-xl transition-all duration-300 bg-card border border-border">
                      <Link to={`/news/${article.slug}`} className="block">
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop'}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          {article.breaking && (
                            <Badge className="absolute top-4 left-4 bg-destructive font-semibold">
                              🔴 URGENTE
                            </Badge>
                          )}
                          {article.premium_only && (
                            <Badge className="absolute top-4 right-4 bg-accent font-semibold">
                              Premium
                            </Badge>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-bold text-card-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors text-lg">
                            {highlightTerm(article.title, query)}
                          </h3>
                          
                          {article.summary && (
                            <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                              {highlightTerm(article.summary.substring(0, 150), query)}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {article.author && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{article.author}</span>
                              </div>
                            )}
                            {article.published_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {formatDistanceToNow(new Date(article.published_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{article.views} views</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <SearchIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Tente buscar com termos diferentes ou mais genéricos
                  </p>
                  <Button onClick={() => setSearchParams({})} variant="outline">
                    Limpar busca
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <h2 className="text-lg font-semibold">Buscas Recentes</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                    >
                      Limpar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((term, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleHistoryClick(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches Suggestions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Sugestões Populares</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['política', 'economia', 'esportes', 'cultura', 'tecnologia'].map((term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      onClick={() => handleHistoryClick(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-12 text-center">
                <p className="text-muted-foreground">
                  Digite um termo de busca acima para encontrar notícias
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
