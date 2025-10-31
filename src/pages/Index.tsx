import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgentFAB } from "@/components/ai/AgentFAB";
import { NewsTicker } from "@/components/news/NewsTicker";
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
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary via-primary/90 to-accent py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                Impacto Social - PcD Cotia
              </h1>
              <p className="text-lg text-primary-foreground/90">
                Seu portal de notícias regional com informações relevantes da sua
                cidade e região.
              </p>
            </div>
          </div>
        </section>

        {/* News Ticker */}
        <NewsTicker articles={articles.slice(0, 10)} />

        {/* News Grid & Sidebar */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
                <Newspaper className="text-primary" />
                Últimas Notícias
              </h2>

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
