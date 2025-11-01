import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSubscriptionCount() {
  return useQuery({
    queryKey: ['subscription-count'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('subscription-count');
      
      if (error) throw error;
      
      return data as { total: number; timestamp: string };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
}
