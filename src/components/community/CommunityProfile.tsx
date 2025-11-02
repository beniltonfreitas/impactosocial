import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Link as LinkIcon, Trophy } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';

export function CommunityProfile() {
  const { user, profile } = useAuth();

  const { data: communityProfile } = useQuery({
    queryKey: ['community-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['user-ranking', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_ranking', { target_user_id: user!.id });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user,
  });

  const shareUrl = communityProfile?.public_url 
    ? `${window.location.origin}/perfil/${communityProfile.public_url}`
    : null;

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado!');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Perfil Premium</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>{profile?.full_name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold">{profile?.full_name}</h3>
            {communityProfile?.bio && (
              <p className="text-sm text-muted-foreground mt-1">{communityProfile.bio}</p>
            )}
            
            {communityProfile?.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                {communityProfile.location}
              </div>
            )}
          </div>

          {stats && (
            <div className="text-right">
              <Badge className="mb-2">{stats.level}</Badge>
              <div className="flex items-center gap-1 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-bold">#{stats.rank_position}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total_points} pontos
              </p>
            </div>
          )}
        </div>

        {shareUrl && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Compartilhe seu perfil:</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Ver Perfil Público
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyLink}
              >
                Copiar Link
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
