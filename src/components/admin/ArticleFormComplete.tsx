import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Clock } from 'lucide-react';
import { ArticleFormFields } from './ArticleFormFields';
import { ArticleEditor } from './ArticleEditor';
import { ArticlePreview } from './ArticlePreview';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArticleVersionHistory } from './ArticleVersionHistory';
import { ArticleScheduler } from './ArticleScheduler';
import { ArticleWorkflowPanel } from './ArticleWorkflowPanel';
import { InlineComments } from './InlineComments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const articleSchema = z.object({
  title: z.string().min(6, 'Título deve ter no mínimo 6 caracteres').max(120),
  slug: z.string().min(6).max(120).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  summary: z.string().max(160).optional().nullable(),
  content: z.string().min(50, 'Conteúdo deve ter no mínimo 50 caracteres'),
  image_url: z.string().url().optional().nullable(),
  image_og_url: z.string().url().optional().nullable(),
  image_card_url: z.string().url().optional().nullable(),
  image_alt: z.string().max(140).optional().nullable(),
  image_credit: z.string().max(100).optional().nullable(),
  source_url: z.string().url().optional().nullable(),
  gallery_images: z.array(z.string().url()).default([]),
  gallery: z.array(z.object({
    id: z.string(),
    url: z.string(),
    caption: z.string().optional(),
    credit: z.string().optional(),
  })).optional(),
  tags: z.array(z.string())
    .length(12, 'Você deve adicionar exatamente 12 tags')
    .default([]),
  seo_meta_title: z.string().max(60).optional().nullable(),
  seo_meta_description: z.string().max(160).optional().nullable(),
  author: z.string().min(2).max(100).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tenant_id: z.string().uuid().optional().nullable(),
  featured: z.boolean().default(false),
  breaking: z.boolean().default(false),
  premium_only: z.boolean().default(false),
  published_at: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'scheduled']).default('published'),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface ArticleFormCompleteProps {
  articleId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ArticleFormComplete({ articleId, onSuccess, onCancel }: ArticleFormCompleteProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date>();
  const [versionsCount, setVersionsCount] = useState(0);
  const [scheduleData, setScheduleData] = useState<{
    publishMode: 'immediate' | 'scheduled';
    scheduledFor?: Date;
    notifyBefore: boolean;
  }>({
    publishMode: 'immediate',
    scheduledFor: undefined,
    notifyBefore: true,
  });
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      summary: '',
      content: '',
      image_url: '',
      image_og_url: '',
      image_card_url: '',
      image_alt: '',
      image_credit: '',
      source_url: '',
      gallery_images: [],
      gallery: [],
      tags: [],
      seo_meta_title: '',
      seo_meta_description: '',
      author: '',
      category_id: undefined,
      tenant_id: undefined,
      featured: false,
      breaking: false,
      premium_only: false,
      published_at: null,
      status: 'published',
    },
  });

  useEffect(() => {
    loadData();
  }, [articleId]);

  const loadData = async () => {
    try {
      const [categoriesRes, tenantsRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('tenant').select('*').order('name'),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);

      if (articleId) {
        const { data: article, error: articleError } = await supabase
          .from('articles')
          .select(`
            *,
            article_gallery (
              id,
              image_url,
              caption,
              credit,
              display_order
            )
          `)
          .eq('id', articleId)
          .single();

        if (articleError) throw articleError;
        if (article) {
          const gallery = article.article_gallery?.map((img: any) => ({
            id: img.id,
            url: img.image_url,
            caption: img.caption,
            credit: img.credit,
          })) || [];
          
          form.reset({
            ...article,
            gallery,
            status: (article.status as 'draft' | 'published' | 'scheduled') || 'published',
            gallery_images: article.gallery_images || [],
            tags: article.tags || [],
            category_id: article.category_id || undefined,
            tenant_id: article.tenant_id || undefined,
          });

          // Carregar agendamento se existir
          const { data: schedule } = await supabase
            .from('article_schedule')
            .select('*')
            .eq('article_id', articleId)
            .eq('status', 'pending')
            .single();

          if (schedule) {
            setScheduleData({
              publishMode: 'scheduled',
              scheduledFor: new Date(schedule.scheduled_for),
              notifyBefore: schedule.notification_hours_before === 1,
            });
          }

          // Contar versões
          const { count } = await supabase
            .from('article_versions')
            .select('*', { count: 'exact', head: true })
            .eq('article_id', articleId);

          setVersionsCount(count || 0);

          // Carregar workflow
          const { data: workflowData } = await supabase
            .from('article_workflow')
            .select('id')
            .eq('article_id', articleId)
            .single();

          if (workflowData) {
            setWorkflowId(workflowData.id);
          }
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120);
  };

  const handleApplyAutoSeo = () => {
    const title = form.getValues('title');
    const summary = form.getValues('summary');
    
    if (!form.getValues('seo_meta_title') && title) {
      form.setValue('seo_meta_title', title.substring(0, 60));
    }
    
    if (!form.getValues('seo_meta_description') && summary) {
      form.setValue('seo_meta_description', summary.substring(0, 160));
    }
    
    toast({
      title: 'SEO aplicado',
      description: 'Meta título e descrição foram preenchidos automaticamente',
    });
  };

  const handlePreview = () => {
    const errors = form.formState.errors;
    if (errors.title || errors.content) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha pelo menos título e conteúdo para visualizar o preview',
        variant: 'destructive',
      });
      return;
    }
    setShowPreview(true);
  };

  const autoSave = async (data: ArticleFormData) => {
    if (!data.title || !data.content) return;

    try {
      const slug = data.slug || generateSlug(data.title);
      
      const payload: any = {
        title: data.title,
        slug,
        content: data.content,
        summary: data.summary || null,
        tags: data.tags || [],
        status: articleId ? data.status : 'draft',
        category_id: data.category_id || null,
        tenant_id: data.tenant_id || null,
        author: data.author || null,
        image_url: data.image_url || null,
        image_og_url: data.image_og_url || null,
        image_card_url: data.image_card_url || null,
        image_alt: data.image_alt || null,
        image_credit: data.image_credit || null,
        source_url: data.source_url || null,
        gallery_images: data.gallery_images || [],
        seo_meta_title: data.seo_meta_title || null,
        seo_meta_description: data.seo_meta_description || null,
        published_at: data.published_at || null,
        featured: data.featured,
        breaking: data.breaking,
        premium_only: data.premium_only,
      };

      if (articleId) {
        const { error } = await supabase
          .from('articles')
          .update(payload)
          .eq('id', articleId);

        if (error) throw error;
      } else {
        const { data: newArticle, error } = await supabase
          .from('articles')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save error:', error);
      throw error;
    }
  };

  useAutoSave({
    data: form.watch(),
    onSave: autoSave,
    delay: 3000,
    enabled: !isLoading,
    onStatusChange: setAutoSaveStatus,
  });

  const onSubmit = async (data: ArticleFormData) => {
    try {
      setIsLoading(true);

      if (!data.slug && data.title) {
        data.slug = generateSlug(data.title);
      }

      const payload: any = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        category_id: data.category_id || null,
        tenant_id: data.tenant_id || null,
        summary: data.summary || null,
        image_url: data.image_url || null,
        image_og_url: data.image_og_url || null,
        image_card_url: data.image_card_url || null,
        image_alt: data.image_alt || null,
        image_credit: data.image_credit || null,
        source_url: data.source_url || null,
        gallery_images: data.gallery_images || [],
        tags: data.tags || [],
        seo_meta_title: data.seo_meta_title || null,
        seo_meta_description: data.seo_meta_description || null,
        author: data.author || null,
        published_at: data.published_at || null,
        featured: data.featured,
        breaking: data.breaking,
        premium_only: data.premium_only,
        status: data.status || 'published',
      };

      if (articleId) {
        const { error } = await supabase
          .from('articles')
          .update(payload as any)
          .eq('id', articleId);

        if (error) throw error;

        if (data.gallery) {
          await supabase
            .from('article_gallery')
            .delete()
            .eq('article_id', articleId);

          if (data.gallery.length > 0) {
            const galleryData = data.gallery.map((img, index) => ({
              article_id: articleId,
              image_url: img.url,
              caption: img.caption,
              credit: img.credit,
              display_order: index,
            }));

            await supabase.from('article_gallery').insert(galleryData);
          }
        }

        toast({
          title: 'Artigo atualizado',
          description: 'As alterações foram salvas com sucesso',
        });
      } else {
        const { data: savedArticle, error } = await supabase
          .from('articles')
          .insert([payload as any])
          .select()
          .single();

        if (error) throw error;

        if (data.gallery && data.gallery.length > 0 && savedArticle) {
          const galleryData = data.gallery.map((img, index) => ({
            article_id: savedArticle.id,
            image_url: img.url,
            caption: img.caption,
            credit: img.credit,
            display_order: index,
          }));

          await supabase.from('article_gallery').insert(galleryData);
        }

        // Salvar agendamento para novo artigo
        if (savedArticle && scheduleData.publishMode === 'scheduled' && scheduleData.scheduledFor) {
          await supabase
            .from('article_schedule')
            .insert({
              article_id: savedArticle.id,
              scheduled_for: scheduleData.scheduledFor.toISOString(),
              notification_hours_before: scheduleData.notifyBefore ? 1 : 0,
              status: 'pending',
            });

          await supabase
            .from('articles')
            .update({ status: 'scheduled' })
            .eq('id', savedArticle.id);
        }

        toast({
          title: 'Artigo criado',
          description: 'O artigo foi criado com sucesso',
        });
      }

      // Salvar agendamento para artigo existente
      if (articleId && scheduleData.publishMode === 'scheduled' && scheduleData.scheduledFor) {
        await supabase
          .from('article_schedule')
          .delete()
          .eq('article_id', articleId);

        await supabase
          .from('article_schedule')
          .insert({
            article_id: articleId,
            scheduled_for: scheduleData.scheduledFor.toISOString(),
            notification_hours_before: scheduleData.notifyBefore ? 1 : 0,
            status: 'pending',
          });

        await supabase
          .from('articles')
          .update({ status: 'scheduled' })
          .eq('id', articleId);
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    await loadData();
    toast({
      title: 'Artigo restaurado',
      description: 'Artigo restaurado com sucesso',
    });
  };

  const currentCategory = categories.find(c => c.id === form.watch('category_id'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {articleId ? 'Editar Artigo' : 'Novo Artigo'}
            </h2>
            <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={isLoading}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scheduleData.publishMode === 'scheduled' 
                ? 'Salvar e Agendar' 
                : articleId 
                  ? 'Atualizar Artigo' 
                  : 'Criar Artigo'}
            </Button>
          </div>
        </div>

        {/* Badge de status agendado */}
        {scheduleData.publishMode === 'scheduled' && scheduleData.scheduledFor && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Agendado para publicação
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {format(scheduleData.scheduledFor, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit">
              ✏️ Editar
            </TabsTrigger>
            <TabsTrigger value="versions" disabled={!articleId}>
              📜 Histórico {versionsCount > 0 && `(${versionsCount})`}
            </TabsTrigger>
            <TabsTrigger value="schedule">
              📅 Agendamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            <ArticleFormFields
              control={form.control}
              categories={categories}
              tenants={tenants}
              onApplyAutoSeo={handleApplyAutoSeo}
            />

            <Card>
              <CardHeader>
                <CardTitle>Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo do Artigo</FormLabel>
                      <FormControl>
                        <ArticleEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Escreva o conteúdo do artigo aqui..."
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-2">
                        {field.value ? `${field.value.split(/\s+/).length} palavras • ${field.value.length} caracteres` : '0 palavras • 0 caracteres'}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow">
            {articleId ? (
              <div className="grid gap-6 md:grid-cols-2">
                <ArticleWorkflowPanel 
                  articleId={articleId}
                  onStatusChange={() => {
                    toast({
                      title: "Status atualizado",
                      description: "O workflow do artigo foi atualizado."
                    });
                  }}
                />
                {workflowId && (
                  <InlineComments 
                    articleId={articleId}
                    workflowId={workflowId}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Salve o artigo primeiro para acessar o workflow
              </div>
            )}
          </TabsContent>

          <TabsContent value="versions">
            {articleId ? (
              <ArticleVersionHistory 
                articleId={articleId}
                currentVersion={form.getValues()}
                onRestore={handleRestore}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Salve o artigo primeiro para ver o histórico de versões
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule">
            <ArticleScheduler
              value={scheduleData}
              onChange={setScheduleData}
              categoryId={form.watch('category_id') || undefined}
            />
          </TabsContent>
        </Tabs>
      </form>

      <ArticlePreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        article={{
          ...form.getValues(),
          gallery: form.getValues('gallery')?.filter((img): img is { id: string; url: string; caption?: string; credit?: string } => !!img.id && !!img.url)
        }}
        categoryName={currentCategory?.name}
      />
    </Form>
  );
}
