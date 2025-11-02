import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoEmpreendedores() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'empreendedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'empreendedores');

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
      name="Empreendedores"
      emoji="💼"
      description="Inovadores que podem criar negócios e oportunidades inclusivas"
      impactText="Os Empreendedores têm o poder de transformar o mercado. No Desafio Social, cada empresário que participa pode criar oportunidades de emprego para PcDs, desenvolver produtos e serviços acessíveis e inspirar outros negócios a adotarem práticas inclusivas. Sua participação mostra que inclusão também é bom para os negócios."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
