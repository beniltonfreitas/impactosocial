import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';
import { TagsInput } from './TagsInput';
import { ImageGalleryManager } from './ImageGalleryManager';
import { Copy, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArticleFormFieldsProps {
  control: Control<any>;
  categories: any[];
  tenants: any[];
  onApplyAutoSeo: () => void;
}

export function ArticleFormFields({ control, categories, tenants, onApplyAutoSeo }: ArticleFormFieldsProps) {
  const { toast } = useToast();

  const handleCopyToOgAndCard = (heroUrl: string) => {
    if (heroUrl) {
      toast({
        title: 'Modo rápido ativado',
        description: 'Imagem Hero copiada para OG e Card',
      });
    }
  };

  return (
    <>
      {/* Seção: Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título * (6-120 caracteres)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Digite o título da notícia..."
                    {...field}
                    maxLength={120}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/120 caracteres
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug * (6-120 caracteres)</FormLabel>
                <FormControl>
                  <Input placeholder="slug-da-noticia" {...field} maxLength={120} />
                </FormControl>
                <div className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/120 | {field.value?.length >= 6 ? '✅ Válido' : '❌ Inválido'}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumo (máx. 160 caracteres)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Breve descrição da notícia (será usada como meta description)..."
                    {...field}
                    value={field.value || ''}
                    maxLength={160}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground">
                  {(field.value || '').length}/160 caracteres
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Seção: Categoria e Fonte */}
      <Card>
        <CardHeader>
          <CardTitle>Categoria e Fonte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
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
            control={control}
            name="source_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da Fonte (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://fonte-original.com.br/noticia"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  URL da matéria original (usado para reescrita com IA)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Seção: Imagens (Hero, OG, Card) */}
      <Card>
        <CardHeader>
          <CardTitle>Imagens (Hero, OG, Card)</CardTitle>
          <p className="text-sm text-muted-foreground">
            💡 Modo rápido: Cole uma URL no Hero e clique no botão para replicar para OG e Card automaticamente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hero (1200×675) *</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/hero.jpg"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e);
                        // Replicação automática: quando Hero é preenchido, replica para OG e Card
                        const heroUrl = e.target.value;
                        if (heroUrl && !control._formValues.image_og_url) {
                          control._formValues.image_og_url = heroUrl;
                        }
                        if (heroUrl && !control._formValues.image_card_url) {
                          control._formValues.image_card_url = heroUrl;
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const heroUrl = field.value;
                        if (heroUrl) {
                          control._formValues.image_og_url = heroUrl;
                          control._formValues.image_card_url = heroUrl;
                          handleCopyToOgAndCard(heroUrl);
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar para OG e Card
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>Imagem principal (hero) - será replicada automaticamente</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="image_og_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OG/Social (1200×630)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://exemplo.com/og.jpg"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>Imagem para compartilhamento social</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="image_card_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card (800×450)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://exemplo.com/card.jpg"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>Imagem para cartões/thumbnails</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="image_alt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto Alternativo (Alt) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Descrição da imagem para acessibilidade"
                    {...field}
                    value={field.value || ''}
                    maxLength={140}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground">
                  {(field.value || '').length}/140 caracteres
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="image_credit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crédito da Imagem</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome do fotógrafo / Agência"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Seção: Galeria de Imagens */}
      <Card>
        <CardHeader>
          <CardTitle>Galeria de Imagens</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="gallery_images"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ImageGalleryManager
                    value={field.value || []}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Seção: Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TagsInput
                    value={field.value || []}
                    onChange={field.onChange}
                    suggestions={[
                      'política',
                      'economia',
                      'saúde',
                      'educação',
                      'tecnologia',
                      'meio ambiente',
                      'esportes',
                      'cultura',
                    ]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Seção: SEO */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>SEO</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={onApplyAutoSeo}>
              Aplicar SEO Auto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="seo_meta_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Título (máx. 60 caracteres)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Título para mecanismos de busca..."
                    {...field}
                    value={field.value || ''}
                    maxLength={60}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground">
                  {(field.value || '').length}/60 caracteres
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="seo_meta_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Descrição (máx. 160 caracteres)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição para mecanismos de busca..."
                    {...field}
                    value={field.value || ''}
                    maxLength={160}
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground">
                  {(field.value || '').length}/160 caracteres
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Seção: Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
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
              control={control}
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
              control={control}
              name="published_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Publicação</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const newDate = e.target.value ? new Date(e.target.value).toISOString() : null;
                          field.onChange(newDate);
                          
                          // Auto-ajustar status para "scheduled" se data futura
                          if (newDate && new Date(newDate) > new Date()) {
                            control._formValues.status = 'scheduled';
                          } else if (newDate && new Date(newDate) <= new Date()) {
                            control._formValues.status = 'published';
                          }
                        }}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      {field.value && new Date(field.value) > new Date() && (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <CalendarIcon className="h-4 w-4" />
                          <span>
                            Será publicado automaticamente em {new Date(field.value).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Deixe vazio para publicar imediatamente. Escolha data futura para agendar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="flex items-center gap-6">
            <FormField
              control={control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Artigo em Destaque</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={control}
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
              control={control}
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
        </CardContent>
      </Card>
    </>
  );
}
