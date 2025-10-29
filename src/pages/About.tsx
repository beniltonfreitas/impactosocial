import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { Newspaper, Users, MapPin, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Sobre Nós"
        description="Conheça a história, missão e valores do Conexão na Cidade - seu portal de notícias regionais."
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary via-primary/90 to-accent py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                Sobre o Conexão na Cidade
              </h1>
              <p className="text-lg text-primary-foreground/90">
                Conectando você às notícias que realmente importam na sua região.
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Mission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Nossa Missão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  O Conexão na Cidade nasceu com o propósito de democratizar o acesso à informação
                  regional de qualidade. Acreditamos que cada cidade tem suas histórias únicas e
                  merece uma cobertura jornalística dedicada e comprometida com a verdade.
                </p>
              </CardContent>
            </Card>

            {/* Values */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Nossos Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Transparência</h3>
                  <p className="text-muted-foreground text-sm">
                    Compromisso com a verdade e clareza nas informações.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Proximidade</h3>
                  <p className="text-muted-foreground text-sm">
                    Cobertura focada nas necessidades da sua comunidade.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Diversidade</h3>
                  <p className="text-muted-foreground text-sm">
                    Representação plural de vozes e perspectivas.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Inovação</h3>
                  <p className="text-muted-foreground text-sm">
                    Uso de tecnologia para melhorar a experiência de leitura.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Coverage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Cobertura Regional
                </CardTitle>
                <CardDescription>
                  Presente em todo o Brasil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nossa rede de correspondentes está presente nas principais cidades brasileiras,
                  garantindo cobertura local com alcance nacional. Seja qual for sua região,
                  o Conexão na Cidade está lá para trazer as notícias que afetam seu dia a dia.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Entre em Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Tem uma sugestão de pauta ou quer falar conosco? Estamos sempre abertos ao diálogo.
                </p>
                <a
                  href="/contato"
                  className="text-primary hover:underline font-medium"
                >
                  Acesse nossa página de contato →
                </a>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
