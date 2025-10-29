import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate } from "react-router-dom";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly_cents: number;
  features: string[];
}

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('active', true)
          .order('price_monthly_cents');

        if (data) {
          const parsedPlans = data.map(plan => ({
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            description: plan.description,
            price_monthly_cents: plan.price_monthly_cents,
            features: Array.isArray(plan.features) ? plan.features.map(f => String(f)) : [],
          }));
          setPlans(parsedPlans);
        }

        // Buscar plano atual do usuário
        if (user) {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

          if (subscription) {
            setCurrentPlanId(subscription.plan_id);
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [user]);

  const handleSubscribe = async (planSlug: string) => {
    if (!user) {
      navigate('/auth', { state: { from: '/assinaturas' } });
      return;
    }

    try {
      const plan = plans.find(p => p.slug === planSlug);
      if (!plan) return;

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { planId: plan.id }
      });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      
      if (errorMessage.includes('STRIPE_SECRET_KEY')) {
        alert('Sistema de pagamentos ainda não configurado. Entre em contato com o suporte.');
      } else {
        alert('Não foi possível iniciar o processo de pagamento. Tente novamente.');
      }
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Assinaturas Premium"
        description="Escolha o melhor plano para você e tenha acesso a conteúdo exclusivo."
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary via-primary/90 to-accent py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Escolha Seu Plano
            </h1>
            <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              Acesso a conteúdo exclusivo e sem anúncios. Cancele quando quiser.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const isCurrentPlan = currentPlanId === plan.id;
              const isPremium = plan.price_monthly_cents > 0;
              const isMostPopular = index === 1; // Middle plan

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    isMostPopular ? 'border-primary shadow-lg scale-105' : ''
                  }`}
                >
                  {isMostPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {formatPrice(plan.price_monthly_cents)}
                      </span>
                      {isPremium && (
                        <span className="text-muted-foreground">/mês</span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={isMostPopular ? "default" : "outline"}
                      disabled={isCurrentPlan}
                      onClick={() => handleSubscribe(plan.slug)}
                    >
                      {isCurrentPlan
                        ? "Plano Atual"
                        : isPremium
                        ? "Assinar Agora"
                        : "Começar Grátis"}
                    </Button>

                    {isCurrentPlan && (
                      <Badge variant="secondary" className="w-full justify-center">
                        Seu plano atual
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Perguntas Frequentes</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura quando quiser. O acesso permanece até o fim do período pago.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Como funciona o pagamento?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  O pagamento é processado mensalmente através de cartão de crédito com renovação automática.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Posso mudar de plano?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento através do seu painel.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
