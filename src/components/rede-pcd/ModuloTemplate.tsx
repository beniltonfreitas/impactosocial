import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useSubscriptionCount } from "@/hooks/useSubscriptionCount";
import { RedePcdBreadcrumb } from "./RedePcdBreadcrumb";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface ModuloTemplateProps {
  titulo: string;
  subtitulo: string;
  emoji: string;
  descricao: string;
  beneficios: string[];
  ctaTexto: string;
  ctaLink: string;
  corDestaque: "primary" | "secondary" | "destructive" | "accent";
  slug: string;
  seoDescription: string;
  imagemHero?: string;
}

const colorVariants = {
  primary: "from-primary/20 via-primary/10 to-background",
  secondary: "from-secondary/20 via-secondary/10 to-background",
  destructive: "from-destructive/20 via-destructive/10 to-background",
  accent: "from-accent/20 via-accent/10 to-background",
};

const badgeVariants = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  accent: "bg-accent/10 text-accent border-accent/20",
};

export function ModuloTemplate({
  titulo,
  subtitulo,
  emoji,
  descricao,
  beneficios,
  ctaTexto,
  ctaLink,
  corDestaque,
  slug,
  seoDescription,
  imagemHero,
}: ModuloTemplateProps) {
  const { data: subscriptionData } = useSubscriptionCount();

  return (
    <>
      <Helmet>
        <title>{titulo} | Rede PcD - Conexão na Cidade</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={`${titulo} | Rede PcD`} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <RedePcdBreadcrumb moduloNome={titulo} />

        {/* Hero Section */}
        <section className={`bg-gradient-to-br ${colorVariants[corDestaque]} py-16 md:py-24`}>
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="text-6xl md:text-7xl mb-6 animate-scale-in">
                {emoji}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
                {titulo}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in">
                {subtitulo}
              </p>
              
              {subscriptionData && (
                <Badge 
                  variant="outline" 
                  className={`mb-6 text-base px-4 py-2 animate-counter ${badgeVariants[corDestaque]}`}
                >
                  {subscriptionData.total.toLocaleString('pt-BR')} membros ativos
                </Badge>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                <Button size="lg" asChild>
                  <Link to={ctaLink}>
                    {ctaTexto}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/rede-pcd">
                    Ver Todos os Módulos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-8">
                Como Funciona
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {descricao}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="bg-muted/50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
                Benefícios de Fazer Parte
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {beneficios.map((beneficio, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <p className="text-base leading-relaxed">{beneficio}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pronto para Começar?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Faça parte da maior rede de inclusão digital do Brasil
              </p>
              <Button size="lg" asChild>
                <Link to={ctaLink}>
                  {ctaTexto}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
