import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";

interface IAUsageBadgeProps {
  type: 'images' | 'videos' | 'analyses';
}

export function IAUsageBadge({ type }: IAUsageBadgeProps) {
  const { user } = useAuth();
  const [usage, setUsage] = useState<{ used: number; limit: number }>({ used: 0, limit: 0 });
  const [loading, setLoading] = useState(true);

  const limits = {
    images: 10,
    videos: 5,
    analyses: 5
  };

  useEffect(() => {
    if (!user) return;

    const fetchUsage = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let query;
        if (type === 'images') {
          query = supabase
            .from('ai_generated_images')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString());
        } else if (type === 'videos') {
          query = supabase
            .from('ai_generated_videos')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString());
        } else {
          query = supabase
            .from('ia_spreadsheet_analyses')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString());
        }

        const { count } = await query;
        setUsage({ used: count || 0, limit: limits[type] });
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user, type]);

  if (loading) return null;

  const remaining = usage.limit - usage.used;
  const isNearLimit = remaining <= 2;
  const isAtLimit = remaining <= 0;

  return (
    <Badge 
      variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "default"}
      className="gap-1"
    >
      <Sparkles className="h-3 w-3" />
      {remaining}/{usage.limit} hoje
    </Badge>
  );
}