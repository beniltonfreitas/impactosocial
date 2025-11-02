import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SocialChallenge } from '@/hooks/useSocialChallengeData';

interface SocialChallengeCardProps {
  challenge: SocialChallenge;
  onComplete: (challengeId: string) => void;
  isCompleting: boolean;
}

export function SocialChallengeCard({ challenge }: SocialChallengeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-lg',
        challenge.completed && challenge.admin_validated && 'border-emerald-500 bg-emerald-50/50',
        challenge.completed && !challenge.admin_validated && 'border-yellow-500 bg-yellow-50/50',
        isHovered && 'scale-105'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="text-4xl">{challenge.icon_emoji}</span>
          <Badge variant="outline" className="font-mono">
            #{challenge.challenge_number}
          </Badge>
        </div>
        <CardTitle className="text-lg">{challenge.title}</CardTitle>
        <CardDescription>{challenge.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Recompensa:</span>
          <span className="text-lg font-bold text-primary">
            +{challenge.points_reward} códigos
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {!challenge.completed ? (
          <div className="w-full text-center">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              📋 Disponível para completar
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Complete a ação descrita acima
            </p>
          </div>
        ) : challenge.admin_validated ? (
          <div className="w-full text-center space-y-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-700">
              ✅ Desafio Validado
            </Badge>
            {challenge.validated_at && (
              <p className="text-xs text-muted-foreground">
                Validado em {format(new Date(challenge.validated_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full text-center space-y-2">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              ⏳ Aguardando Validação
            </Badge>
            <p className="text-xs text-muted-foreground">
              Complete a ação e aguarde a validação da equipe organizadora
            </p>
            {challenge.completed_at && (
              <p className="text-xs text-muted-foreground">
                Marcado como concluído em {format(new Date(challenge.completed_at), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
