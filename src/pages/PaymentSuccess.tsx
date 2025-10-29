import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      toast({
        title: "Pagamento confirmado!",
        description: "Sua assinatura foi ativada com sucesso.",
      });
    }
  }, [sessionId, toast]);

  return (
    <>
      <Helmet>
        <title>Pagamento Confirmado | Conexão na Cidade</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-lg w-full border-primary/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">Pagamento Confirmado!</CardTitle>
              <CardDescription className="text-base">
                Sua assinatura foi ativada com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Agora você tem acesso completo a todos os conteúdos premium da plataforma.
                Aproveite sua experiência sem limites!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button onClick={() => navigate("/dashboard")}>
                  Ir para Meu Painel
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Voltar ao Início
                </Button>
              </div>

              {sessionId && (
                <p className="text-xs text-muted-foreground pt-4">
                  ID da Sessão: {sessionId}
                </p>
              )}
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}
