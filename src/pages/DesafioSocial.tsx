import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { SocialChallengeHeader } from '@/components/social-challenge/SocialChallengeHeader';
import { SocialChallengeImpact } from '@/components/social-challenge/SocialChallengeImpact';
import { SocialChallengeScoring } from '@/components/social-challenge/SocialChallengeScoring';
import { SocialChallengeGrid } from '@/components/social-challenge/SocialChallengeGrid';
import { SocialChallengeGroups } from '@/components/social-challenge/SocialChallengeGroups';
import { SocialChallengeRecognition } from '@/components/social-challenge/SocialChallengeRecognition';
import { useSocialChallengeData } from '@/hooks/useSocialChallengeData';
import { Skeleton } from '@/components/ui/skeleton';

export default function DesafioSocial() {
  const { user } = useAuth();
  const { stats, challenges, isLoading, completeChallenge, isCompleting } =
    useSocialChallengeData();

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Desafio Social - Semana do Impacto"
        description="Participe dos desafios sociais e acumule Códigos Sociais de Impacto. Cada ação aproxima o Brasil de uma inclusão real."
        type="website"
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <SocialChallengeHeader />

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Seção A: Resumo do Impacto */}
            <SocialChallengeImpact totalPoints={stats?.total_points || 0} />

            {/* Seção B: Sistema de Pontuação */}
            <SocialChallengeScoring />

            {/* Seção C: Grid de 12 Desafios */}
            <SocialChallengeGrid
              challenges={challenges}
              onComplete={(challengeId) => completeChallenge({ challengeId })}
              isCompleting={isCompleting}
            />

            {/* Seção D: Grupos de Participação */}
            <SocialChallengeGroups />

            {/* Seção E: Reconhecimento e Impacto */}
            <SocialChallengeRecognition stats={stats} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
