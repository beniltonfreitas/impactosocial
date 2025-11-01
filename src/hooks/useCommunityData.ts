import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CommunityStats {
  total_clicks: number;
  total_shares: number;
  total_conversions: number;
  points: number;
}

interface Challenge {
  id: string;
  challenge_type: string;
  current_value: number;
  target_value: number;
  completed: boolean;
  points_reward: number;
}

export function useCommunityData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check subscription status
  const { data: isSubscriber } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch community stats and challenges
  const { data, isLoading } = useQuery({
    queryKey: ['community-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('community-stats', {
        method: 'GET',
      });

      if (error) throw error;
      return data as {
        stats: CommunityStats;
        challenges: Challenge[];
        ranking: any[];
        rankPosition: number | null;
      };
    },
    enabled: !!user && isSubscriber === true,
  });

  // Generate referral link
  const generateLink = useMutation({
    mutationFn: async ({ targetUrl, refCode }: { targetUrl: string; refCode?: string }) => {
      const { data, error } = await supabase.functions.invoke('community-generate-link', {
        method: 'POST',
        body: { targetUrl, refCode },
      });

      if (error) throw error;
      return data as { link: string; refCode: string };
    },
    onSuccess: (data) => {
      // Copy to clipboard
      navigator.clipboard.writeText(data.link);
      toast({
        title: 'Link gerado!',
        description: 'Link copiado para a área de transferência',
      });
      // Refetch stats
      queryClient.invalidateQueries({ queryKey: ['community-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    stats: data?.stats,
    challenges: data?.challenges || [],
    ranking: data?.ranking || [],
    rankPosition: data?.rankPosition,
    isLoading,
    isSubscriber: isSubscriber === true,
    generateLink: generateLink.mutate,
    isGenerating: generateLink.isPending,
  };
}
