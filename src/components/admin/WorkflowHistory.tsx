import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileEdit, 
  UserPlus, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Send,
  Clock
} from 'lucide-react';

interface WorkflowHistoryProps {
  workflowId: string;
}

const ACTION_CONFIG = {
  submit: { label: 'Enviado para revisão', icon: Send, color: 'blue' },
  assign: { label: 'Revisor atribuído', icon: UserPlus, color: 'purple' },
  request_changes: { label: 'Mudanças solicitadas', icon: MessageSquare, color: 'orange' },
  approve: { label: 'Aprovado', icon: CheckCircle, color: 'green' },
  reject: { label: 'Rejeitado', icon: XCircle, color: 'red' },
  schedule: { label: 'Agendado', icon: Calendar, color: 'indigo' },
  publish: { label: 'Publicado', icon: CheckCircle, color: 'emerald' },
  edit: { label: 'Editado', icon: FileEdit, color: 'gray' },
};

export function WorkflowHistory({ workflowId }: WorkflowHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [workflowId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('article_workflow_history')
        .select(`
          *,
          performer:profiles!performed_by(full_name)
        `)
        .eq('workflow_id', workflowId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string): string => {
    return ACTION_CONFIG[action as keyof typeof ACTION_CONFIG]?.label || action;
  };

  const getActionIcon = (action: string) => {
    const Icon = ACTION_CONFIG[action as keyof typeof ACTION_CONFIG]?.icon || Clock;
    return Icon;
  };

  const getActionColor = (action: string): string => {
    return ACTION_CONFIG[action as keyof typeof ACTION_CONFIG]?.color || 'gray';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico do Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma ação registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => {
              const Icon = getActionIcon(item.action);
              const color = getActionColor(item.action);
              
              return (
                <div 
                  key={item.id}
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-${color}-100 dark:bg-${color}-900 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-medium">
                            {getActionLabel(item.action)}
                          </Badge>
                          {item.from_status && (
                            <span className="text-xs text-muted-foreground">
                              {item.from_status} → {item.to_status}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {item.performer?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {item.performer?.full_name || 'Usuário'}
                          </span>
                        </div>
                        
                        {item.notes && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.performed_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
