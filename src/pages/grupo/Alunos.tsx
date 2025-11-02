import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoAlunos() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'alunos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'alunos');

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
      name="Alunos"
      emoji="🎓"
      description="Jovens que estão construindo o futuro inclusivo do Brasil"
      impactText="Os Alunos representam o futuro do país. No Desafio Social, cada estudante que participa ajuda a construir uma geração mais consciente, empática e engajada com a inclusão. Sua participação promove a cultura da acessibilidade desde cedo, transformando escolas e universidades em ambientes mais inclusivos."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
