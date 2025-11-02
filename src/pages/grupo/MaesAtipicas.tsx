import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoMaesAtipicas() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'maes-atipicas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'maes-atipicas');

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
      name="Mães Atípicas"
      emoji="👩‍👧"
      description="Mães e cuidadoras de pessoas com deficiência que lutam diariamente pela inclusão"
      impactText="As Mães Atípicas são parte essencial do movimento de inclusão, trazendo empatia, mobilização e apoio direto às famílias PcD. No Desafio Social, cada mãe que participa ajuda a criar uma rede de apoio mais forte, compartilha experiências valiosas e promove a conscientização sobre os direitos das pessoas com deficiência. Sua participação é vital para o sucesso do movimento inclusivo."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
