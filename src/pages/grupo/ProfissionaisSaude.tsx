import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoProfissionaisSaude() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'saude'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'saude');

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
      name="Profissionais da Saúde"
      emoji="⚕️"
      description="Cuidadores que garantem saúde e bem-estar com dignidade"
      impactText="Os Profissionais da Saúde estão na linha de frente do cuidado. No Desafio Social, cada médico, enfermeiro, terapeuta ou técnico que participa pode garantir atendimento humanizado, promover acessibilidade nos serviços de saúde e conscientizar outros profissionais sobre as necessidades específicas das PcDs."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
