import { Trophy } from 'lucide-react';

export function SocialChallengeHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="h-10 w-10 text-primary" />
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Desafio Social – Semana do Impacto
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Participe dos desafios e acumule Códigos Sociais de Impacto. Cada ação
        aproxima o Brasil de uma inclusão real.
      </p>
    </div>
  );
}
