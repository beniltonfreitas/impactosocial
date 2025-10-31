import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from './ImageUpload';
import { ArticleEditor } from './ArticleEditor';
import { TagsInput } from './TagsInput';
import { ImageGalleryManager } from './ImageGalleryManager';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy } from 'lucide-react';

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

interface ArticleFormProps {
  articleId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ArticleForm({ articleId, onSuccess, onCancel }: ArticleFormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyAutoSeo, setApplyAutoSeo] = useState(false);
  const [titleCharCount, setTitleCharCount] = useState(0);
  const [slugCharCount, setSlugCharCount] = useState(0);
  const [summaryCharCount, setSummaryCharCount] = useState(0);
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
    // Carregar categorias e tenants
    const [categoriesRes, tenantsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('tenant').select('*').order('name'),
    ]);

    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (tenantsRes.data) setTenants(tenantsRes.data);

    // Se editando, carregar artigo
    if (articleId) {
      const { data, error } = await supabase
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
      .replace(/-+/g, '-');
  };

  const onSubmit = async (data: ArticleFormData) => {
    try {
      setLoading(true);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o título do artigo"
                  {...field}
                  onBlur={(e) => {
                    field.onBlur();
                    if (!form.getValues('slug')) {
                      form.setValue('slug', generateSlug(e.target.value));
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL) *</FormLabel>
              <FormControl>
                <Input placeholder="titulo-do-artigo" {...field} />
              </FormControl>
              <FormDescription>
                URL amigável (use apenas letras minúsculas, números e hífens)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Breve resumo do artigo (até 500 caracteres)"
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem de Capa</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || ''}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo *</FormLabel>
              <FormControl>
                <ArticleEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Escreva o conteúdo do artigo aqui..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Autor</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do autor" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tenant_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portal (Tenant)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um portal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="published_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Publicação</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormDescription>
                  Deixe vazio para rascunho
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Destaque</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="breaking"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Urgente</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="premium_only"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Premium</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {articleId ? 'Atualizar' : 'Criar'} Artigo
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
