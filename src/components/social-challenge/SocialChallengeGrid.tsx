import { SocialChallengeCard } from './SocialChallengeCard';
import type { SocialChallenge } from '@/hooks/useSocialChallengeData';

interface SocialChallengeGridProps {
  challenges: SocialChallenge[];
  onComplete: (challengeId: string) => void;
  isCompleting: boolean;
}

export function SocialChallengeGrid({
  challenges,
  onComplete,
  isCompleting,
}: SocialChallengeGridProps) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        🎯 Lista dos 12 Desafios Oficiais
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <SocialChallengeCard
            key={challenge.id}
            challenge={challenge}
            onComplete={onComplete}
            isCompleting={isCompleting}
          />
        ))}
      </div>
    </section>
  );
}
