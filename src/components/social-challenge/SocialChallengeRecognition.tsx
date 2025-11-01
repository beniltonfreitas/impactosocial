import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, Target } from 'lucide-react';
import type { SocialChallengeStats } from '@/hooks/useSocialChallengeData';

interface SocialChallengeRecognitionProps {
  stats: SocialChallengeStats | undefined;
}

const statusLabels = {
  participando: 'Participando',
  ativo: 'Ativo',
  apoiador_oficial: 'Apoiador Oficial',
};

const statusColors = {
  participando: 'bg-gray-500',
  ativo: 'bg-blue-500',
  apoiador_oficial: 'bg-emerald-500',
};

export function SocialChallengeRecognition({
  stats,
}: SocialChallengeRecognitionProps) {
  if (!stats) return null;

  const completedPercentage = (stats.completed_challenges / 12) * 100;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏅 Reconhecimento e Impacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">
              {stats.total_points}
            </p>
            <p className="text-sm text-muted-foreground">Códigos Totais</p>
          </div>

          <div className="text-center p-4 bg-accent/5 rounded-lg">
            <Target className="h-8 w-8 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold text-foreground">
              {stats.completed_challenges}/12
            </p>
            <p className="text-sm text-muted-foreground">Desafios Concluídos</p>
          </div>

          <div className="text-center p-4 bg-secondary/5 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Badge className={statusColors[stats.status]}>
                {statusLabels[stats.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Status Atual</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.round(completedPercentage)}%</span>
          </div>
          <Progress value={completedPercentage} className="h-3" />
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            🎯 Meta de Reconhecimento
          </p>
          <p className="text-sm text-muted-foreground">
            {stats.completed_challenges < 6
              ? `Complete ao menos 6 desafios para obter o reconhecimento oficial de Apoiador. Faltam ${
                  6 - stats.completed_challenges
                } desafios.`
              : 'Parabéns! Você alcançou o status de Apoiador Oficial. Continue participando para aumentar seu impacto!'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <p className="font-medium text-muted-foreground">Pagamentos</p>
            <p className="text-lg font-bold text-primary">{stats.pix_points}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Indicações</p>
            <p className="text-lg font-bold text-primary">
              {stats.referral_points}
            </p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Desafios</p>
            <p className="text-lg font-bold text-primary">
              {stats.challenge_points}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
