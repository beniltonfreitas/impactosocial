import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SocialChallenge } from '@/hooks/useSocialChallengeData';

interface SocialChallengeCardProps {
  challenge: SocialChallenge;
  onComplete: (challengeId: string) => void;
  isCompleting: boolean;
}

export function SocialChallengeCard({
  challenge,
  onComplete,
  isCompleting,
}: SocialChallengeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        challenge.completed
          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'hover:-translate-y-1 hover:shadow-lg',
        isHovered && !challenge.completed && 'border-primary'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl" role="img" aria-label={challenge.title}>
              {challenge.icon_emoji}
            </span>
            <div>
              <CardTitle className="text-lg">
                {challenge.challenge_number}️⃣ {challenge.title}
              </CardTitle>
            </div>
          </div>

          {challenge.completed && (
            <Badge className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-3 w-3 mr-1" />
              Completo
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {challenge.description}
        </p>

        {!challenge.completed ? (
          <Button
            onClick={() => onComplete(challenge.id)}
            disabled={isCompleting}
            className="w-full"
            variant="default"
          >
            {isCompleting ? 'Salvando...' : 'Marcar como Concluído'}
          </Button>
        ) : (
          <p className="text-xs text-center text-emerald-600 dark:text-emerald-400">
            Concluído em {format(new Date(challenge.completed_at!), 'dd/MM/yyyy')}
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground mt-2">
          +{challenge.points_reward} códigos
        </p>
      </CardContent>
    </Card>
  );
}
