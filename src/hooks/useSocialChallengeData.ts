import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

export interface SocialChallenge {
  id: string;
  challenge_number: number;
  title: string;
  description: string;
  icon_emoji: string;
  points_reward: number;
  completed: boolean;
  completed_at: string | null;
  proof_url: string | null;
  notes: string | null;
}

export interface SocialChallengeStats {
  total_points: number;
  completed_challenges: number;
  pix_points: number;
  referral_points: number;
  challenge_points: number;
  status: 'participando' | 'ativo' | 'apoiador_oficial';
  user_group: string | null;
  rank_position: number | null;
}

export interface GlobalRankingUser {
  user_id: string;
  total_points: number;
  completed_challenges: number;
  status: string;
  user_group: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useSocialChallengeData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all data (stats + challenges + ranking)
  const { data, isLoading, error } = useQuery({
    queryKey: ['social-challenge-data', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('social-challenge-stats');

      if (error) throw error;

      return data as {
        userStats: SocialChallengeStats;
        challenges: SocialChallenge[];
        globalRanking: GlobalRankingUser[];
      };
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  // Mutation to complete challenge
  const completeMutation = useMutation({
    mutationFn: async ({
      challengeId,
      proofUrl,
      notes,
    }: {
      challengeId: string;
      proofUrl?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('social-challenge-complete', {
        body: { challengeId, proofUrl, notes },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-challenge-data'] });
      toast.success('🎉 Desafio concluído! +12 códigos', {
        description: 'Continue participando e acumule mais pontos.',
      });
    },
    onError: (error: any) => {
      console.error('Error completing challenge:', error);
      toast.error('Erro ao completar desafio', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    },
  });

  return {
    stats: data?.userStats,
    challenges: data?.challenges || [],
    globalRanking: data?.globalRanking || [],
    isLoading,
    error,
    completeChallenge: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
  };
}
