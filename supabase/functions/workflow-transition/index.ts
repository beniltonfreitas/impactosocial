import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransitionRequest {
  workflowId: string;
  action: 'submit' | 'assign_reviewer' | 'request_changes' | 'approve' | 'reject' | 'schedule' | 'publish';
  notes?: string;
  assignedReviewer?: string;
  scheduledFor?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { workflowId, action, notes, assignedReviewer, scheduledFor }: TransitionRequest = await req.json();

    const { data: workflow, error: workflowError } = await supabase
      .from('article_workflow')
      .select('*, articles(*)')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      throw new Error('Workflow not found');
    }

    let newStatus: string | null = null;
    let updates: any = {};

    switch (action) {
      case 'submit':
        if (workflow.current_status !== 'draft') {
          throw new Error('Can only submit from draft status');
        }
        newStatus = 'submitted_for_review';
        updates.submitted_by = user.id;
        updates.submitted_at = new Date().toISOString();
        
        if (!assignedReviewer) {
          const { data: reviewers } = await supabase
            .from('user_roles')
            .select('user_id')
            .in('role', ['admin', 'moderator'])
            .limit(1);
          
          if (reviewers && reviewers.length > 0) {
            updates.assigned_reviewer = reviewers[0].user_id;
            updates.assigned_at = new Date().toISOString();
          }
        } else {
          updates.assigned_reviewer = assignedReviewer;
          updates.assigned_at = new Date().toISOString();
        }
        break;

      case 'assign_reviewer':
        if (!assignedReviewer) {
          throw new Error('Reviewer ID required');
        }
        updates.assigned_reviewer = assignedReviewer;
        updates.assigned_at = new Date().toISOString();
        newStatus = 'in_review';
        break;

      case 'request_changes':
        newStatus = 'changes_requested';
        
        await supabase.from('system_notifications').insert({
          user_id: workflow.submitted_by,
          type: 'warning',
          title: '✏️ Mudanças solicitadas',
          message: `Seu artigo "${workflow.articles.title}" precisa de revisões.`,
          action: {
            label: 'Ver comentários',
            href: `/admin/articles?id=${workflow.article_id}`
          },
          read: false
        });
        break;

      case 'approve':
        newStatus = 'approved';
        updates.approved_by = user.id;
        updates.approved_at = new Date().toISOString();
        
        await supabase.from('system_notifications').insert({
          user_id: workflow.submitted_by,
          type: 'success',
          title: '✅ Artigo aprovado!',
          message: `Seu artigo "${workflow.articles.title}" foi aprovado e está pronto para publicação.`,
          action: {
            label: 'Publicar agora',
            href: `/admin/articles?id=${workflow.article_id}`
          },
          read: false
        });
        break;

      case 'reject':
        newStatus = 'rejected';
        
        await supabase.from('system_notifications').insert({
          user_id: workflow.submitted_by,
          type: 'error',
          title: '❌ Artigo rejeitado',
          message: `Seu artigo "${workflow.articles.title}" foi rejeitado. Veja os comentários para mais detalhes.`,
          action: {
            label: 'Ver motivo',
            href: `/admin/articles?id=${workflow.article_id}`
          },
          read: false
        });
        break;

      case 'schedule':
        if (workflow.current_status !== 'approved') {
          throw new Error('Can only schedule approved articles');
        }
        newStatus = 'scheduled';
        
        if (scheduledFor) {
          await supabase.from('article_schedule').insert({
            article_id: workflow.article_id,
            scheduled_for: scheduledFor,
            status: 'pending'
          });
          
          await supabase.from('articles').update({
            status: 'scheduled'
          }).eq('id', workflow.article_id);
        }
        break;

      case 'publish':
        if (workflow.current_status !== 'approved') {
          throw new Error('Can only publish approved articles');
        }
        newStatus = 'published';
        
        await supabase.from('articles').update({
          status: 'published',
          published_at: new Date().toISOString()
        }).eq('id', workflow.article_id);
        break;
    }

    if (newStatus) {
      updates.previous_status = workflow.current_status;
      updates.current_status = newStatus;
    }

    const { error: updateError } = await supabase
      .from('article_workflow')
      .update(updates)
      .eq('id', workflowId);

    if (updateError) throw updateError;

    await supabase.from('article_workflow_history').insert({
      workflow_id: workflowId,
      action,
      from_status: workflow.current_status,
      to_status: newStatus || workflow.current_status,
      performed_by: user.id,
      notes
    });

    return new Response(
      JSON.stringify({ success: true, newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Workflow transition error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
