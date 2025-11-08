import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  UserCheck, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

interface WorkflowPanelProps {
  articleId: string;
  onStatusChange?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: any; icon: any }> = {
  draft: { label: 'Rascunho', color: 'secondary', icon: Clock },
  submitted_for_review: { label: 'Aguardando Revisão', color: 'default', icon: Clock },
  in_review: { label: 'Em Revisão', color: 'default', icon: UserCheck },
  changes_requested: { label: 'Mudanças Solicitadas', color: 'destructive', icon: AlertCircle },
  approved: { label: 'Aprovado', color: 'default', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'destructive', icon: XCircle },
  scheduled: { label: 'Agendado', color: 'default', icon: Clock },
  published: { label: 'Publicado', color: 'default', icon: CheckCircle },
};

export function ArticleWorkflowPanel({ articleId, onStatusChange }: WorkflowPanelProps) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState('');

  useEffect(() => {
    loadWorkflow();
    loadReviewers();
  }, [articleId]);

  const loadWorkflow = async () => {
    try {
      const { data, error } = await supabase
        .from('article_workflow')
        .select(`
          *,
          submitted_by_profile:profiles!submitted_by(full_name),
          assigned_reviewer_profile:profiles!assigned_reviewer(full_name),
          approved_by_profile:profiles!approved_by(full_name)
        `)
        .eq('article_id', articleId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        const { data: newWorkflow } = await supabase
          .from('article_workflow')
          .insert({ article_id: articleId, current_status: 'draft' })
          .select()
          .single();
        
        setWorkflow(newWorkflow);
      } else {
        setWorkflow(data);
      }
    } catch (error: any) {
      console.error('Error loading workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewers = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'moderator']);
    
    if (data) {
      // Buscar perfis em query separada
      const userIds = data.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesData) {
        setReviewers(profilesData.map(p => ({
          id: p.id,
          name: p.full_name || 'Sem nome'
        })));
      }
    }
  };

  const handleTransition = async (action: string) => {
    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('workflow-transition', {
        body: {
          workflowId: workflow.id,
          action,
          notes: notes || undefined,
          assignedReviewer: selectedReviewer || undefined
        }
      });

      if (response.error) throw response.error;

      toast.success('Ação realizada com sucesso!');
      setNotes('');
      await loadWorkflow();
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao executar ação');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center">Carregando workflow...</CardContent></Card>;
  }

  if (!workflow) {
    return <Card><CardContent className="py-8 text-center">Erro ao carregar workflow</CardContent></Card>;
  }

  const statusConfig = STATUS_CONFIG[workflow.current_status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Workflow de Aprovação
          </CardTitle>
          <Badge variant={statusConfig.color} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          {workflow.submitted_by_profile && (
            <p>
              <span className="font-medium">Submetido por:</span>{' '}
              {workflow.submitted_by_profile.full_name}
            </p>
          )}
          {workflow.assigned_reviewer_profile && (
            <p>
              <span className="font-medium">Revisor:</span>{' '}
              {workflow.assigned_reviewer_profile.full_name}
            </p>
          )}
          {workflow.approved_by_profile && (
            <p>
              <span className="font-medium">Aprovado por:</span>{' '}
              {workflow.approved_by_profile.full_name}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {workflow.current_status === 'draft' && (
            <>
              <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar revisor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {reviewers.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={() => handleTransition('submit')}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submeter para Revisão
              </Button>
            </>
          )}

          {['submitted_for_review', 'in_review'].includes(workflow.current_status) && (
            <>
              <Textarea
                placeholder="Adicione observações (opcional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTransition('request_changes')}
                  disabled={actionLoading}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Solicitar Mudanças
                </Button>
                <Button
                  onClick={() => handleTransition('approve')}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => handleTransition('reject')}
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar Artigo
              </Button>
            </>
          )}

          {workflow.current_status === 'changes_requested' && (
            <Button
              className="w-full"
              onClick={() => handleTransition('submit')}
              disabled={actionLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Resubmeter para Revisão
            </Button>
          )}

          {workflow.current_status === 'approved' && (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => handleTransition('publish')}
                disabled={actionLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publicar Imediatamente
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                ou use a aba "Agendamento" para programar publicação
              </p>
            </div>
          )}
        </div>

        {workflow.previous_status && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Última mudança: {STATUS_CONFIG[workflow.previous_status]?.label} → {statusConfig.label}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
