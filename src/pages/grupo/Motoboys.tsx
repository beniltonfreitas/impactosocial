import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoMotoboys() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'motoboys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'motoboys');

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
      name="Motoboys"
      emoji="🏍️"
      description="Profissionais que conectam a cidade e podem conectar a inclusão"
      impactText="Os Motoboys estão nas ruas todos os dias, conhecendo a cidade por inteiro. No Desafio Social, cada motoboy que participa ajuda a divulgar causas de inclusão, identificar barreiras de acessibilidade urbana e promover conscientização sobre a importância da mobilidade para todos. Sua presença nas ruas é uma poderosa ferramenta de mudança."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
