import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoMotoristasApp() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'motoristas-app'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'motoristas-app');

      if (error) throw error;

      return {
        totalParticipants: data?.length || 0,
        totalPoints: data?.reduce((sum, u) => sum + u.total_points, 0) || 0,
        completedChallenges: data?.reduce((sum, u) => sum + u.completed_challenges, 0) || 0,
      };
    },
  });

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <GrupoTemplate
      name="Motoristas de App"
      emoji="🚗"
      description="Conectando pessoas através da tecnologia e da inclusão"
      impactText="Os Motoristas de App estão na linha de frente do transporte moderno. No Desafio Social, cada motorista que participa pode transformar viagens em experiências inclusivas, garantir acessibilidade no transporte por aplicativo e educar passageiros sobre a importância da inclusão no dia a dia."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
