import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoEducadores() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'educadores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'educadores');

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
      name="Educadores"
      emoji="👨‍🏫"
      description="Profissionais que moldam mentes e constroem uma sociedade mais inclusiva"
      impactText="Os Educadores são multiplicadores de conhecimento e valores. No Desafio Social, cada professor que participa pode transformar salas de aula em ambientes inclusivos, educar estudantes sobre diversidade e preparar a próxima geração para valorizar e respeitar as diferenças. Sua participação é fundamental para uma mudança cultural duradoura."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
