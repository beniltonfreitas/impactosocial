import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface PremiumGateProps {
  preview: string;
}

export function PremiumGate({ preview }: PremiumGateProps) {
  return (
    <div className="relative">
      {/* Preview with blur */}
      <div className="relative">
        <div className="prose max-w-none text-muted-foreground">
          <p>{preview}...</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
      </div>

      {/* Premium CTA */}
      <Card className="mt-8 border-primary/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Conteúdo Exclusivo Premium</CardTitle>
          <CardDescription>
            Este artigo é exclusivo para assinantes Premium. Assine agora e tenha
            acesso ilimitado a conteúdos especiais.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/assinaturas">
                Ver Planos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/auth">
                Já sou assinante
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A partir de R$ 19,90/mês • Cancele quando quiser
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
