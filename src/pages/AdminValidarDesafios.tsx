import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IlluminaAdminLayout } from '@/components/layout/IlluminaAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChallengeSubmission {
  id: string;
  status: string;
  submitted_at: string;
  profile: {
    full_name: string;
  } | null;
  social_challenges: {
    title: string;
    points: number;
  } | null;
}

export default function AdminValidarDesafios() {
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Placeholder: tabela social_challenge_progress ainda não existe
      // Quando existir, descomentar o código abaixo
      /*
      const { data, error } = await supabase
        .from('social_challenge_progress')
        .select(`
          id,
          status,
          submitted_at,
          profiles!user_id(full_name),
          social_challenges!challenge_id(title, points)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        profile: item.profiles,
        social_challenges: item.social_challenges,
      }));
      
      setSubmissions(formattedData as ChallengeSubmission[]);
      */
      
      // Por enquanto, retorna array vazio
      setSubmissions([]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('social-challenge-validate', {
        body: { progressId: id, approved },
      });

      if (error) throw error;

      toast({
        title: approved ? 'Desafio aprovado' : 'Desafio rejeitado',
        description: approved
          ? 'Os pontos foram creditados ao usuário'
          : 'O usuário foi notificado da rejeição',
      });

      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: 'Erro ao validar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <IlluminaAdminLayout title="Validar Desafios Sociais">
      <Card>
        <CardHeader>
          <CardTitle>Desafios Pendentes de Validação</CardTitle>
          <CardDescription>
            {submissions.length} desafios aguardando aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mb-2 opacity-20" />
              <p>Nenhum desafio pendente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Desafio</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Data Envio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <span className="font-medium">{sub.profile?.full_name || 'Anônimo'}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{sub.social_challenges?.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sub.social_challenges?.points} pts</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(sub.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleValidate(sub.id, true)}
                          className="gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleValidate(sub.id, false)}
                          className="gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </IlluminaAdminLayout>
  );
}
