import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsFilters } from "@/components/news/NewsFilters";
import { NewsSearch } from "@/components/news/NewsSearch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"recent" | "views">("recent");
  const articlesPerPage = 12;

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ["news", selectedCategory, searchQuery, page, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*, categories(name, slug, color)", { count: "exact" })
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString());

      if (selectedCategory) {
        const category = categories?.find((c) => c.slug === selectedCategory);
        if (category) {
          query = query.eq("category_id", category.id);
        }
      }

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
        );
      }

      if (sortBy === "recent") {
        query = query.order("published_at", { ascending: false });
      } else {
        query = query.order("views", { ascending: false });
      }

      const from = (page - 1) * articlesPerPage;
      const to = from + articlesPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { articles: data || [], count: count || 0 };
    },
  });

  const totalPages = Math.ceil((articlesData?.count || 0) / articlesPerPage);

  return (
    <>
      <Helmet>
        <title>Notícias | Conexão na Cidade</title>
        <meta
          name="description"
          content="Confira as últimas notícias da sua região. Mantenha-se atualizado com informações locais relevantes."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Todas as Notícias
            </h1>
            <p className="text-lg text-muted-foreground">
              Acompanhe as últimas notícias da sua região
            </p>
          </header>

          <div className="mb-6 space-y-4">
            <NewsSearch
              onSearch={setSearchQuery}
              initialValue={searchQuery}
            />
            
            <NewsFilters
              onFilterChange={({ categoryId, orderBy }) => {
                if (categoryId) setSelectedCategory(categoryId);
                else setSelectedCategory(null);
                if (orderBy === "views") setSortBy("views");
                else setSortBy("recent");
              }}
              initialCategory={selectedCategory || "all"}
              initialOrderBy={sortBy}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : articlesData?.articles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">
                {searchQuery
                  ? "Nenhuma notícia encontrada para sua busca."
                  : "Nenhuma notícia disponível no momento."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {articlesData?.articles.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={{
                      ...article,
                      category: article.categories || { name: '', slug: '', color: '' },
                    }}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
