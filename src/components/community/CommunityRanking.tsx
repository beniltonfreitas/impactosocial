import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface RankingUser {
  user_id: string;
  total_points: number;
  total_actions: number;
  rank_position: number;
  level: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function CommunityRanking() {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['community-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_community_ranking', { limit_rows: 10 });
      
      if (error) throw error;

      // Buscar informações dos perfis
      const userIds = data.map((u: any) => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Combinar dados
      return data.map((user: any) => ({
        ...user,
        profiles: profiles?.find((p) => p.id === user.user_id),
      })) as RankingUser[];
    },
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Líder': return 'bg-purple-500';
      case 'Conectado': return 'bg-blue-500';
      case 'Engajado': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando ranking...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Ranking da Comunidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!ranking || ranking.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum participante no ranking ainda
          </p>
        ) : (
          <div className="space-y-3">
            {ranking.map((user) => (
              <div 
                key={user.user_id} 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(user.rank_position)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profiles?.avatar_url || ''} />
                  <AvatarFallback>{user.profiles?.full_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{user.profiles?.full_name || 'Usuário'}</p>
                  <Badge className={getLevelColor(user.level)} variant="secondary">
                    {user.level}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{user.total_points}</p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
