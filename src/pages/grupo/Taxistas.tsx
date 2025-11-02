import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoTaxistas() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'taxistas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'taxistas');

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
      name="Taxistas"
      emoji="🚕"
      description="Profissionais do transporte que podem tornar a cidade mais acessível"
      impactText="Os Taxistas têm um papel fundamental na mobilidade urbana. No Desafio Social, cada taxista que participa pode fazer a diferença ao garantir atendimento adequado a PcDs, promover veículos acessíveis e conscientizar outros profissionais sobre a importância do transporte inclusivo."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
