import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { useCommunityData } from '@/hooks/useCommunityData';
import { CommunityStats } from './CommunityStats';
import { ReferralGenerator } from './ReferralGenerator';
import { ChallengesList } from './ChallengesList';
import { useAuth } from '@/components/auth/AuthContext';

export function CommunityPanel() {
  const { profile } = useAuth();
  const {
    stats,
    challenges,
    isLoading,
    isSubscriber,
    generateLink,
    isGenerating,
  } = useCommunityData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSubscriber) {
    return (
      <Card className="border-amber-400">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-center">Comunidade Illúmina</CardTitle>
          <CardDescription className="text-center">
            Acesso exclusivo para assinantes Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950">
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              🔒 A Comunidade Illúmina é exclusiva para membros Premium. Assine agora e
              tenha acesso a recursos de networking, gamificação e divulgação.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/assinaturas">Ver Planos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultRefCode = profile?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'usuario';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">🌐 Comunidade Illúmina</h2>
              <p className="text-sm text-muted-foreground">
                Acesso exclusivo para membros — conecte-se, compartilhe e participe de desafios sociais.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-emerald-500">
                ✔ Assinatura Ativa
              </Badge>
              <Button asChild>
                <a
                  href="https://beniltonfreitas.com.br/comunidade"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Entrar na Comunidade
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <CommunityStats
        clicks={stats?.total_clicks || 0}
        shares={stats?.total_shares || 0}
        conversions={stats?.total_conversions || 0}
      />

      {/* Referral Generator */}
      <ReferralGenerator
        onGenerate={generateLink}
        isGenerating={isGenerating}
        defaultRefCode={defaultRefCode}
      />

      {/* Challenges */}
      <ChallengesList
        challenges={challenges}
        totalPoints={stats?.points || 0}
      />
    </div>
  );
}
