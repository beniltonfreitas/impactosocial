import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoVoluntarios() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'voluntarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'voluntarios');

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
      name="Voluntários"
      emoji="🤝"
      description="Pessoas de coração aberto que doam seu tempo para fazer a diferença"
      impactText="Os Voluntários são o coração do movimento social. No Desafio Social, cada pessoa que doa seu tempo e energia ajuda a fortalecer instituições, apoiar famílias PcD e criar projetos de impacto real. Sua participação é a prova de que a solidariedade pode transformar vidas e construir uma sociedade mais justa e inclusiva."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
