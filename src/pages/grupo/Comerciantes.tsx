import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoComerciantes() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'comerciantes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'comerciantes');

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
      name="Comerciantes"
      emoji="🏪"
      description="Empreendedores locais que podem tornar o comércio mais acessível"
      impactText="Os Comerciantes são fundamentais para a economia local. No Desafio Social, cada lojista que participa pode adaptar seu estabelecimento para ser acessível, treinar funcionários para atender bem PcDs e criar um ambiente comercial mais inclusivo. Sua participação mostra que todos merecem ser bem atendidos."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
