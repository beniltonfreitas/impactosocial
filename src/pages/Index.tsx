import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgentFAB } from "@/components/ai/AgentFAB";

import { NewsGrid } from "@/components/news/NewsGrid";
import { NewsSearch } from "@/components/news/NewsSearch";
import { NewsFilters } from "@/components/news/NewsFilters";
import { SEO } from "@/components/SEO";
import { TENANT_NAME } from "@/lib/constants";
import { fetchArticles, type Article } from "@/lib/widgets";
import { Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string>();
  const [orderBy, setOrderBy] = useState("recent");

  useEffect(() => {
    // Fetch articles
    const loadArticles = async () => {
      try {
        setLoading(true);
        const tenantSlug = 'nacional';
        const data = await fetchArticles(
          tenantSlug, 
          12, 
          false, 
          searchTerm || undefined, 
          categoryId, 
          orderBy
        );
        setArticles(data);
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [searchTerm, categoryId, orderBy]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Conexão na Cidade - Notícias da sua Região"
        description="Portal de notícias regional com informações relevantes da sua cidade e região."
        type="website"
      />
      <Header />

      <main className="flex-1">
        {/* News Grid & Sidebar */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-2">
                  <Newspaper className="text-primary" />
                  Todas as Notícias
                </h1>
                <p className="text-muted-foreground">
                  Acompanhe as últimas notícias da sua região
                </p>
              </div>

              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <NewsSearch 
                  onSearch={setSearchTerm} 
                  initialValue={searchTerm}
                />
                <NewsFilters 
                  onFilterChange={({ categoryId: cat, orderBy: order }) => {
                    setCategoryId(cat);
                    setOrderBy(order);
                  }}
                  initialCategory={categoryId}
                  initialOrderBy={orderBy}
                />
              </div>

              <NewsGrid articles={articles} loading={loading} />
            </div>

            {/* Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AgentFAB />
    </div>
  );
};

export default Index;
