import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Pagamento Cancelado | Conexão na Cidade</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="text-3xl">Pagamento Cancelado</CardTitle>
              <CardDescription className="text-base">
                Você cancelou o processo de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Não se preocupe! Você pode tentar novamente quando quiser.
                Nossos planos continuam disponíveis para você.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button onClick={() => navigate("/assinaturas")}>
                  Ver Planos Novamente
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Voltar ao Início
                </Button>
              </div>

              <p className="text-xs text-muted-foreground pt-4">
                Ainda tem dúvidas? Entre em contato conosco!
              </p>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}
