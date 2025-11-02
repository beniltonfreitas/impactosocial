import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';

interface PendingChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  proof_url: string | null;
  notes: string | null;
  admin_validated: boolean;
  profiles: {
    full_name: string | null;
  };
  social_challenges: {
    title: string;
    description: string;
    icon_emoji: string;
    points_reward: number;
  };
}

export default function AdminDesafioSocial() {
  const { user, hasRole } = useAuth();
  const [filter, setFilter] = useState<'pending' | 'validated' | 'all'>('pending');
  const queryClient = useQueryClient();

  // Verificar permissão
  if (!user || (!hasRole('admin') && !hasRole('moderator'))) {
    return <Navigate to="/desafio-social" />;
  }

  // Buscar todos os desafios com progresso
  const { data: challenges, isLoading } = useQuery({
    queryKey: ['admin-challenges', filter],
    queryFn: async () => {
      let query = supabase
        .from('user_challenge_progress')
        .select(`
          *,
          profiles(full_name),
          social_challenges(title, description, icon_emoji, points_reward)
        `)
        .eq('completed', true)
        .order('completed_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('admin_validated', false);
      } else if (filter === 'validated') {
        query = query.eq('admin_validated', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as PendingChallenge[];
    },
  });

  // Mutation para validar/rejeitar
  const validateMutation = useMutation({
    mutationFn: async ({ progressId, action }: { progressId: string; action: 'validate' | 'reject' }) => {
      const { data, error } = await supabase.functions.invoke('social-challenge-validate', {
        body: { progressId, action },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      toast.success(
        variables.action === 'validate' ? '✅ Desafio validado com sucesso!' : '❌ Desafio rejeitado'
      );
    },
    onError: (error: any) => {
      console.error('Validation error:', error);
      toast.error('Erro ao processar desafio', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    },
  });

  const pendingCount = challenges?.filter((c) => !c.admin_validated).length || 0;
  const validatedCount = challenges?.filter((c) => c.admin_validated).length || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎯 Validação de Desafios Sociais</h1>
          <p className="text-muted-foreground">
            Gerencie e valide os desafios completados pelos participantes
          </p>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              <Clock className="mr-2 h-4 w-4" />
              Pendentes ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="validated">
              <CheckCircle className="mr-2 h-4 w-4" />
              Validados ({validatedCount})
            </TabsTrigger>
            <TabsTrigger value="all">Todos ({challenges?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando desafios...</p>
              </div>
            ) : challenges && challenges.length > 0 ? (
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <Card key={challenge.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {challenge.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {challenge.profiles?.full_name || 'Usuário'}
                            </CardTitle>
                            <CardDescription>
                              Completado em{' '}
                              {format(new Date(challenge.completed_at), "dd 'de' MMMM 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        {challenge.admin_validated ? (
                          <Badge className="bg-emerald-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Validado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="mr-1 h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-start gap-4 mb-4">
                        <span className="text-4xl">{challenge.social_challenges.icon_emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{challenge.social_challenges.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {challenge.social_challenges.description}
                          </p>
                          <Badge variant="outline">
                            +{challenge.social_challenges.points_reward} códigos
                          </Badge>
                        </div>
                      </div>

                      {challenge.notes && (
                        <div className="bg-muted p-3 rounded-lg mb-4">
                          <p className="text-sm font-medium mb-1">Observações:</p>
                          <p className="text-sm text-muted-foreground">{challenge.notes}</p>
                        </div>
                      )}

                      {challenge.proof_url && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Comprovante:</p>
                          <a
                            href={challenge.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Ver comprovante →
                          </a>
                        </div>
                      )}

                      {!challenge.admin_validated && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={() =>
                              validateMutation.mutate({ progressId: challenge.id, action: 'validate' })
                            }
                            disabled={validateMutation.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Validar Desafio
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() =>
                              validateMutation.mutate({ progressId: challenge.id, action: 'reject' })
                            }
                            disabled={validateMutation.isPending}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {filter === 'pending'
                      ? 'Não há desafios pendentes de validação'
                      : filter === 'validated'
                      ? 'Nenhum desafio validado ainda'
                      : 'Nenhum desafio encontrado'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
