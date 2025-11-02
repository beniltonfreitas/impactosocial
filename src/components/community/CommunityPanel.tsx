import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, MessageSquare, Trophy, Share2, Users } from 'lucide-react';
import { useCommunityData } from '@/hooks/useCommunityData';
import { CommunityStats } from './CommunityStats';
import { ReferralGenerator } from './ReferralGenerator';
import { ChallengesList } from './ChallengesList';
import { CommunityFeed } from './CommunityFeed';
import { CommunityRanking } from './CommunityRanking';
import { CommunityDashboard } from './CommunityDashboard';
import { useAuth } from '@/components/auth/AuthContext';

export function CommunityPanel() {
  const { profile, hasRole } = useAuth();
  const {
    stats,
    challenges,
    isLoading,
    isSubscriber,
    generateLink,
    isGenerating,
  } = useCommunityData();

  const isPrivileged = hasRole('admin') || hasRole('moderator');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSubscriber && !isPrivileged) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Comunidade Illúmina</CardTitle>
              <CardDescription>
                Conecte-se, compartilhe e cresça junto com outros membros Premium
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dashboard Stats */}
      <CommunityDashboard />

      {/* Tabs de Navegação */}
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">
            <MessageSquare className="mr-2 h-4 w-4" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <Trophy className="mr-2 h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="referral">
            <Share2 className="mr-2 h-4 w-4" />
            Divulgação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          <CommunityFeed />
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <CommunityRanking />
        </TabsContent>

        <TabsContent value="referral" className="mt-6 space-y-6">
          <CommunityStats
            clicks={stats?.total_clicks || 0}
            shares={stats?.total_shares || 0}
            conversions={stats?.total_conversions || 0}
          />

          <ReferralGenerator
            onGenerate={generateLink}
            isGenerating={isGenerating}
            defaultRefCode={profile?.full_name?.toLowerCase().replace(/\s+/g, '-') || 'usuario'}
          />

          <ChallengesList
            challenges={challenges}
            totalPoints={stats?.points || 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
