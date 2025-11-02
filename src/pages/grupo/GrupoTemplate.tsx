import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface GrupoTemplateProps {
  name: string;
  emoji: string;
  description: string;
  impactText: string;
  stats: {
    totalParticipants: number;
    totalPoints: number;
    completedChallenges: number;
  };
}

export function GrupoTemplate({ name, emoji, description, impactText, stats }: GrupoTemplateProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`Como ${name} fortalecem a Rede de Apoio PcD`}
        description={description}
        type="website"
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <span className="text-8xl block mb-6 animate-bounce">{emoji}</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Como {name} fortalecem a Rede de Apoio PcD
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed opacity-90">
              {description}
            </p>
          </div>
        </section>

        {/* Impacto */}
        <section className="container mx-auto px-4 py-16">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <span className="text-4xl">💡</span>
                Qual é o impacto?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {impactText}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Estatísticas */}
        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              📊 O que já conquistamos juntos
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="py-12">
                  <p className="text-6xl font-bold text-primary mb-3">
                    {stats.totalParticipants}
                  </p>
                  <p className="text-lg text-muted-foreground">Participantes</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="py-12">
                  <p className="text-6xl font-bold text-primary mb-3">
                    {stats.totalPoints}
                  </p>
                  <p className="text-lg text-muted-foreground">Códigos Acumulados</p>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="py-12">
                  <p className="text-6xl font-bold text-primary mb-3">
                    {stats.completedChallenges}
                  </p>
                  <p className="text-lg text-muted-foreground">Desafios Concluídos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            🚀 Faça parte dessa transformação!
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Cada {name} que participa do Desafio Social fortalece a rede de apoio
            e aproxima o Brasil de uma inclusão real.
          </p>
          <Button asChild size="lg" className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all">
            <Link to="/desafio-social">
              👉 Quero participar do Desafio Social
            </Link>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
