import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/AuthContext';
import { Trophy, TrendingUp, Users, Zap } from 'lucide-react';

export function CommunityDashboard() {
  const { user } = useAuth();

  const { data: userStats } = useQuery({
    queryKey: ['user-community-stats', user?.id],
    queryFn: async () => {
      // Buscar pontos totais
      const { data: points } = await supabase
        .from('community_points')
        .select('points')
        .eq('user_id', user!.id);

      // Buscar posts
      const { data: posts } = await supabase
        .from('community_posts')
        .select('id')
        .eq('user_id', user!.id);

      // Buscar ranking
      const { data: ranking } = await supabase
        .rpc('get_user_ranking', { target_user_id: user!.id });

      // Buscar referrals
      const { data: referrals } = await supabase
        .from('community_referrals')
        .select('conversions')
        .eq('user_id', user!.id);

      return {
        totalPoints: points?.reduce((sum, p) => sum + p.points, 0) || 0,
        totalPosts: posts?.length || 0,
        rankPosition: ranking?.[0]?.rank_position || null,
        level: ranking?.[0]?.level || 'Iniciante',
        referrals: referrals?.reduce((sum, r) => sum + r.conversions, 0) || 0,
      };
    },
    enabled: !!user,
  });

  const stats = [
    {
      title: 'Total de Pontos',
      value: userStats?.totalPoints || 0,
      icon: Zap,
      color: 'text-yellow-500',
    },
    {
      title: 'Posição no Ranking',
      value: userStats?.rankPosition ? `#${userStats.rankPosition}` : '-',
      icon: Trophy,
      color: 'text-purple-500',
    },
    {
      title: 'Postagens',
      value: userStats?.totalPosts || 0,
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      title: 'Indicações',
      value: userStats?.referrals || 0,
      icon: Users,
      color: 'text-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.title === 'Posição no Ranking' && userStats?.level && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nível: {userStats.level}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
