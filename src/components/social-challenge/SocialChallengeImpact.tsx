import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SocialChallengeImpactProps {
  totalPoints: number;
}

export function SocialChallengeImpact({ totalPoints }: SocialChallengeImpactProps) {
  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💙 Resumo do Impacto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-6">
          Ao participar do Desafio Social, você apoia a Rede de Apoio da Pessoa
          com Deficiência e ajuda a fortalecer a Casa da Pessoa com Deficiência.
        </p>
        <div className="text-center bg-background/50 rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-2">
            Códigos Acumulados
          </p>
          <p className="text-5xl md:text-6xl font-bold text-primary animate-pulse">
            {totalPoints}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
