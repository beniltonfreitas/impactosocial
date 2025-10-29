import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Newspaper, 
  Scale, 
  AlertTriangle, 
  Video, 
  Trophy, 
  Users, 
  ShoppingBag, 
  Briefcase, 
  PenLine, 
  GraduationCap, 
  Gift, 
  Heart 
} from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  {
    icon: Newspaper,
    name: "PcD+",
    slug: "feed",
    description: "Central de inclusão e notícias acessíveis",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Scale,
    name: "PcD Direitos",
    slug: "direitos",
    description: "Informação e orientação jurídica acessível",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    icon: AlertTriangle,
    name: "PcD Alerta",
    slug: "alerta",
    description: "Canal de denúncia e fiscalização cidadã",
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  },
  {
    icon: Video,
    name: "PcD Play",
    slug: "play",
    description: "Streaming de vídeos, lives e eventos inclusivos",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: Trophy,
    name: "PcD Esportes",
    slug: "esportes",
    description: "Cobertura do Esporte Adaptado e Paralímpico",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Users,
    name: "CDDPcD",
    slug: "conselhos",
    description: "Conselhos de Defesa dos Direitos das PcD",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    icon: ShoppingBag,
    name: "PcD Shop",
    slug: "shop",
    description: "Marketplace Inclusivo",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: Briefcase,
    name: "PcD Vitrine",
    slug: "vitrine",
    description: "Portfólio Profissional e Negócios Inclusivos",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: PenLine,
    name: "PcD Blog",
    slug: "blog",
    description: "Espaço de expressão e autoria PcD",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    icon: GraduationCap,
    name: "PcD Academy",
    slug: "academy",
    description: "Formação e Capacitação Inclusiva",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: Gift,
    name: "PcD Clube",
    slug: "clube",
    description: "Rede de Benefícios e Parcerias Inclusivas",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Heart,
    name: "PcD Rede do Bem",
    slug: "rede-do-bem",
    description: "Campanhas Solidárias e Apoio Comunitário",
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  }
];

export default function RedePcd() {
  return (
    <>
      <Helmet>
        <title>Rede PcD - Portal de Inclusão | Conexão na Cidade</title>
        <meta 
          name="description" 
          content="Espaço inclusivo dedicado à informação, empreendedorismo e cidadania das pessoas com deficiência. Notícias acessíveis, direitos, denúncias, marketplace e mais." 
        />
        <meta 
          name="keywords" 
          content="acessibilidade, inclusão, pessoa com deficiência, PcD, direitos, legislação, marketplace inclusivo, esportes adaptados" 
        />
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Rede PcD
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Espaço inclusivo do Portal Conexão na Cidade dedicado à informação, 
                empreendedorismo e cidadania das pessoas com deficiência.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/rede-pcd/feed">
                    Acessar PcD+
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/rede-pcd/direitos">
                    Conheça seus Direitos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Módulos */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nossos Módulos
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                12 plataformas integradas para apoiar, informar e conectar pessoas com deficiência
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card 
                  key={module.slug} 
                  className="group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/rede-pcd/${module.slug}`}
                >
                  <CardHeader>
                    <div className={`w-14 h-14 ${module.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <module.icon className={`w-7 h-7 ${module.color}`} />
                    </div>
                    <CardTitle className="text-xl">{module.name}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full group-hover:bg-accent/10">
                      Acessar módulo →
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
                Recursos de Acessibilidade
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Linguagem Simplificada</h3>
                    <p className="text-muted-foreground">
                      Conteúdo reescrito com IA para facilitar a compreensão
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🔊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Áudio Automático</h3>
                    <p className="text-muted-foreground">
                      Leitura de textos com síntese de voz de alta qualidade
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👐</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Libras Integrado</h3>
                    <p className="text-muted-foreground">
                      Tradução para Língua Brasileira de Sinais
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">100% Responsivo</h3>
                    <p className="text-muted-foreground">
                      Acesse de qualquer dispositivo com total acessibilidade
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Faça Parte da Rede PcD
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Cadastre-se gratuitamente e tenha acesso a todos os benefícios da maior 
                rede de inclusão digital do Brasil
              </p>
              <Button size="lg" asChild>
                <Link to="/auth">
                  Cadastrar Gratuitamente
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