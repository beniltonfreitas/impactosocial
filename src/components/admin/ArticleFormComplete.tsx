import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArticleEditor } from './ArticleEditor';
import { ArticleFormFields } from './ArticleFormFields';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
  tags: z.array(z.string()).default([]),
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
  const [categories, setCategories] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    // Load categories and tenants
    const [categoriesRes, tenantsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('tenant').select('*').order('name'),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (tenantsRes.data) setTenants(tenantsRes.data);

    // If editing, load article
    if (articleId) {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (data) {
        form.reset({
          ...data,
          gallery_images: data.gallery_images || [],
          tags: data.tags || [],
          status: (data.status as 'draft' | 'published' | 'scheduled') || 'published',
          category_id: data.category_id || undefined,
          tenant_id: data.tenant_id || undefined,
        });
      }
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
    
    if (title && !form.getValues('seo_meta_title')) {
      form.setValue('seo_meta_title', title.slice(0, 60));
    }
    
    if (summary && !form.getValues('seo_meta_description')) {
      form.setValue('seo_meta_description', summary.slice(0, 160));
    }
    
    toast({
      title: 'SEO aplicado',
      description: 'Campos SEO preenchidos automaticamente',
    });
  };

  const onSubmit = async (data: ArticleFormData) => {
    try {
      setLoading(true);

      // Auto-generate slug if not provided
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
          .update(payload)
          .eq('id', articleId);

        if (error) throw error;

        toast({
          title: 'Artigo atualizado',
          description: 'As alterações foram salvas com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([payload]);

        if (error) throw error;

        toast({
          title: 'Artigo criado',
          description: 'O artigo foi criado com sucesso',
        });
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
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
        <ArticleFormFields
          control={form.control}
          categories={categories}
          tenants={tenants}
          onApplyAutoSeo={handleApplyAutoSeo}
        />

        {/* Seção: Conteúdo */}
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
                  <FormLabel>CTA</FormLabel>
                  <FormControl>
                    <ArticleEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Escreva o conteúdo do artigo aqui..."
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-2">
                    {field.value ? `${field.value.split(/\s+/).length} palavras • ${field.value.length} caracteres` : '0 palavras • 0 caracteres'}
                    {' • '}
                    {field.value?.includes('<a ') || field.value?.includes('<button') ? '✅ CTA presente' : '❌ CTA ausente'}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {articleId ? 'Atualizar' : 'Criar'} Artigo
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} size="lg">
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
