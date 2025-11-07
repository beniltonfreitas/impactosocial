import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { TENANT_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const placementSchema = z.object({
  slot: z.string()
    .min(3, "Slot deve ter pelo menos 3 caracteres")
    .regex(/^[a-z0-9_]+$/, "Use apenas letras minúsculas, números e underscore")
    .max(50, "Máximo 50 caracteres"),
  allowed_types: z.array(z.enum(['image', 'html', 'video']))
    .min(1, "Selecione pelo menos um tipo"),
  max_ads: z.number()
    .int()
    .min(1, "Mínimo 1 anúncio")
    .max(5, "Máximo 5 anúncios"),
  is_active: z.boolean().default(true),
});

type PlacementFormData = z.infer<typeof placementSchema>;

interface PlacementFormProps {
  mode: 'create' | 'edit';
  placement?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const SUGGESTED_SLOTS = [
  'header_top',
  'sidebar_1',
  'sidebar_2',
  'article_inline',
  'footer',
  'mobile_sticky',
];

export function PlacementForm({ mode, placement, onSuccess, onCancel }: PlacementFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlacementFormData>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      slot: placement?.slot || '',
      allowed_types: placement?.allowed_types || ['image'],
      max_ads: placement?.max_ads || 1,
      is_active: placement?.is_active ?? true,
    },
  });

  async function onSubmit(values: PlacementFormData) {
    try {
      setLoading(true);

      const placementData = {
        slot: values.slot,
        allowed_types: values.allowed_types,
        max_ads: values.max_ads,
        is_active: values.is_active,
        tenant_id: TENANT_NAME,
      };

      if (mode === 'create') {
        const { error } = await supabase
          .from('ad_placements')
          .insert([placementData]);

        if (error) throw error;

        toast({
          title: "Posição Criada",
          description: `A posição "${values.slot}" foi criada com sucesso.`,
        });
      } else {
        const { error } = await supabase
          .from('ad_placements')
          .update(placementData)
          .eq('id', placement.id);

        if (error) throw error;

        toast({
          title: "Posição Atualizada",
          description: `A posição "${values.slot}" foi atualizada.`,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving placement:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a posição.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Slot Name */}
        <FormField
          control={form.control}
          name="slot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Slot</FormLabel>
              <FormControl>
                <Input 
                  placeholder="sidebar_1" 
                  {...field} 
                  disabled={mode === 'edit'}
                />
              </FormControl>
              <FormDescription>
                Use snake_case (ex: header_top, article_inline_1)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sugestões de Slots */}
        {mode === 'create' && (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Slots Sugeridos:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SLOTS.map(slot => (
                <Button
                  key={slot}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('slot', slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Tipos Permitidos */}
        <FormField
          control={form.control}
          name="allowed_types"
          render={() => (
            <FormItem>
              <FormLabel>Tipos de Anúncios Permitidos</FormLabel>
              <div className="space-y-2">
                {(['image', 'html', 'video'] as const).map((type) => (
                  <FormField
                    key={type}
                    control={form.control}
                    name="allowed_types"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={type}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(type)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, type])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== type)
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {type === 'image' && '🖼️ Imagem'}
                            {type === 'html' && '📄 HTML'}
                            {type === 'video' && '🎬 Vídeo'}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Max Anúncios */}
        <FormField
          control={form.control}
          name="max_ads"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Máximo de Anúncios Simultâneos</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {field.value} anúncio{field.value > 1 ? 's' : ''}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Quantidade de anúncios que podem aparecer ao mesmo tempo nesta posição
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Ativo */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Posição Ativa</FormLabel>
                <FormDescription>
                  Desative para parar de exibir anúncios nesta posição
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Ações */}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'create' ? 'Criar Posição' : 'Salvar Alterações'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
