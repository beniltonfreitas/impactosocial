import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, MapPin } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function PerfilPublico() {
  const { username } = useParams();

  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data: communityProfile, error: profileError } = await supabase
        .from('community_profiles')
        .select('*')
        .eq('public_url', username)
        .single();

      if (profileError) throw profileError;

      // Buscar informações do perfil do usuário
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', communityProfile.user_id)
        .single();

      // Buscar ranking do usuário
      const { data: ranking } = await supabase
        .rpc('get_user_ranking', { target_user_id: communityProfile.user_id });

      return { 
        profile: { ...communityProfile, profiles: userProfile }, 
        ranking: ranking?.[0] || null 
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Carregando perfil...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Perfil não encontrado</h2>
              <p className="text-muted-foreground">
                Este perfil não existe ou não está mais disponível.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const { profile, ranking } = profileData;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${profile.profiles?.full_name || 'Perfil'} - Comunidade Illúmina`}
        description={profile.bio || 'Perfil de membro Premium da Comunidade Illúmina'}
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.profiles?.avatar_url || ''} />
                <AvatarFallback>{profile.profiles?.full_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{profile.profiles?.full_name || 'Usuário'}</h1>
                
                {ranking && (
                  <div className="flex items-center gap-4 mt-3">
                    <Badge>{ranking.level}</Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold">#{ranking.rank_position}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {ranking.total_points} pontos
                    </span>
                  </div>
                )}

                {profile.bio && (
                  <p className="text-muted-foreground mt-4">{profile.bio}</p>
                )}

                {profile.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">Interesses:</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest: string) => (
                        <Badge key={interest} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
