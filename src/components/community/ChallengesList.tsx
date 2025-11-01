import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Challenge {
  id: string;
  challenge_type: string;
  current_value: number;
  target_value: number;
  completed: boolean;
  points_reward: number;
}

interface ChallengesListProps {
  challenges: Challenge[];
  totalPoints: number;
}

const challengeNames: Record<string, string> = {
  clicks_10: 'Primeiros 10 cliques',
  shares_5: 'Compartilhe 5 links',
  conversions_3: 'Traga 3 membros',
};

export function ChallengesList({ challenges, totalPoints }: ChallengesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Desafios da Comunidade
        </CardTitle>
        <CardDescription>
          Conclua ações e ganhe pontos no ranking de Embaixadores Illúmina.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const progress = Math.min(100, (challenge.current_value / challenge.target_value) * 100);
            const isCompleted = challenge.completed;

            return (
              <div key={challenge.id} className="p-3 rounded-xl border space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{challengeNames[challenge.challenge_type] || challenge.challenge_type}</span>
                  <span className={isCompleted ? 'text-emerald-500' : 'text-muted-foreground'}>
                    {isCompleted && '✔ '}
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {challenge.current_value} / {challenge.target_value}
                  </span>
                  <span>{challenge.points_reward} pontos</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Seu score: <span className="font-bold text-foreground">{totalPoints}</span> pontos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
