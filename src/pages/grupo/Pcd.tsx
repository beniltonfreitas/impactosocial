import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoPcd() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'pcd'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'pcd');

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
      name="Pessoas com Deficiência"
      emoji="♿"
      description="Protagonistas do movimento de inclusão, lutando por direitos e acessibilidade"
      impactText="As Pessoas com Deficiência são as protagonistas deste movimento. No Desafio Social, cada PcD que participa não apenas acumula códigos, mas também compartilha sua voz, experiência e necessidades reais. Sua participação é fundamental para garantir que as soluções de inclusão sejam autênticas, práticas e efetivas."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
