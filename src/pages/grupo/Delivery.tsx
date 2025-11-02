import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GrupoTemplate } from './GrupoTemplate';
import { Skeleton } from '@/components/ui/skeleton';

export default function GrupoDelivery() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['group-stats', 'delivery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_challenge_stats')
        .select('*')
        .eq('user_group', 'delivery');

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
      name="Delivery"
      emoji="🛵"
      description="Profissionais de entrega que conectam pessoas e negócios todos os dias"
      impactText="Os profissionais de delivery são essenciais para a mobilidade urbana e a economia. No Desafio Social, cada entregador que participa ajuda a divulgar causas de inclusão, fortalecer a rede de apoio PcD e promover acessibilidade nas entregas. Sua participação mostra que inclusão é responsabilidade de todos e que cada entrega pode carregar também uma mensagem de esperança."
      stats={stats || { totalParticipants: 0, totalPoints: 0, completedChallenges: 0 }}
    />
  );
}
