import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const groupsData: Record<string, { name: string; emoji: string; description: string }> = {
  'maes-atipicas': {
    name: 'Mães Atípicas',
    emoji: '👩‍👧',
    description: 'Mães de crianças com deficiência ou condições especiais',
  },
  pcd: {
    name: 'Pessoas com Deficiência',
    emoji: '♿',
    description: 'Comunidade PcD',
  },
  motoboys: {
    name: 'Motoboys',
    emoji: '🏍️',
    description: 'Profissionais de entrega e mototaxistas',
  },
  taxistas: {
    name: 'Taxistas',
    emoji: '🚕',
    description: 'Motoristas de táxi',
  },
  'motoristas-app': {
    name: 'Motoristas de App',
    emoji: '🚗',
    description: 'Motoristas Uber, 99, Cabify',
  },
  alunos: {
    name: 'Alunos',
    emoji: '🎓',
    description: 'Estudantes de todos os níveis',
  },
  empreendedores: {
    name: 'Empreendedores',
    emoji: '💼',
    description: 'Donos de negócio e startups',
  },
  educadores: {
    name: 'Educadores',
    emoji: '🏫',
    description: 'Professores e profissionais da educação',
  },
  saude: {
    name: 'Profissionais da Saúde',
    emoji: '🩺',
    description: 'Médicos, enfermeiros, terapeutas',
  },
  comerciantes: {
    name: 'Comerciantes',
    emoji: '🏪',
    description: 'Lojistas e comerciantes locais',
  },
  influenciadores: {
    name: 'Influenciadores',
    emoji: '📱',
    description: 'Criadores de conteúdo digital',
  },
  voluntarios: {
    name: 'Voluntários',
    emoji: '🤝',
    description: 'Pessoas engajadas em ações sociais',
  },
};

export default function DesafioSocialGrupo() {
  const { grupo } = useParams<{ grupo: string }>();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const groupInfo = grupo ? groupsData[grupo] : null;

  const { data: ranking, isLoading } = useQuery({
    queryKey: ['group-ranking', grupo],
    queryFn: async () => {
      const { data: stats, error: statsError } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', grupo)
        .order('total_points', { ascending: false })
        .limit(50);

      if (statsError) throw statsError;
      if (!stats) return [];

      // Fetch profiles separately
      const userIds = stats.map(s => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Merge data
      return stats.map(stat => ({
        ...stat,
        profile: profiles?.find(p => p.id === stat.user_id),
      }));
    },
    enabled: !!grupo && !!groupInfo,
  });

  if (!groupInfo) {
    return <Navigate to="/desafio-social" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`${groupInfo.name} - Desafio Social`}
        description={`Ranking e desafios do grupo ${groupInfo.name}`}
        type="website"
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/desafio-social">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos Desafios
          </Link>
        </Button>

        <div className="mb-8 text-center">
          <span className="text-6xl block mb-4">{groupInfo.emoji}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {groupInfo.name}
          </h1>
          <p className="text-lg text-muted-foreground">{groupInfo.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🏆 Ranking do Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">
                Carregando ranking...
              </p>
            ) : !ranking || ranking.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Ainda não há participantes neste grupo. Seja o primeiro!
              </p>
            ) : (
              <div className="space-y-4">
                {ranking.map((user, index) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-muted-foreground w-8">
                        {index + 1}º
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.profile?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.profile?.full_name || 'Usuário'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.completed_challenges}/12 desafios
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {user.total_points}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
