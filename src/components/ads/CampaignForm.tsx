import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TagsInput } from "./TagsInput";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TENANT_NAME } from "@/lib/constants";

const campaignSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  advertiser: z.string().min(2, "Nome do anunciante é obrigatório"),
  budget_total: z.number().positive("Orçamento total deve ser maior que zero").optional(),
  budget_daily: z.number().positive("Orçamento diário deve ser maior que zero").optional(),
  impressions_limit: z.number().int().positive("Limite de impressões deve ser positivo").optional(),
  clicks_limit: z.number().int().positive("Limite de cliques deve ser positivo").optional(),
  priority: z.number().int().min(1).max(10).optional(),
  cpc: z.number().positive("CPC deve ser maior que zero").optional(),
  cpm: z.number().positive("CPM deve ser maior que zero").optional(),
  start_at: z.date({ required_error: "Data de início é obrigatória" }),
  end_at: z.date().optional(),
  status: z.enum(["active", "paused", "ended"]),
  domains: z.array(z.string()).optional(),
  pages: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => {
  if (data.budget_daily && data.budget_total) {
    return data.budget_daily <= data.budget_total;
  }
  return true;
}, {
  message: "Orçamento diário não pode exceder o total",
  path: ["budget_daily"],
}).refine(data => {
  if (data.end_at) {
    return data.end_at > data.start_at;
  }
  return true;
}, {
  message: "Data de término deve ser posterior à data de início",
  path: ["end_at"],
}).refine(data => {
  return data.cpc || data.cpm;
}, {
  message: "Preencha pelo menos CPC ou CPM",
  path: ["cpc"],
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  mode: "create" | "edit";
  campaign?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CampaignForm({ mode, campaign, onSuccess, onCancel }: CampaignFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: "active",
      domains: [],
      pages: [],
      tags: [],
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (mode === "edit" && campaign) {
      setValue("name", campaign.name);
      setValue("advertiser", campaign.advertiser);
      setValue("budget_total", campaign.budget_total || undefined);
      setValue("budget_daily", campaign.budget_daily || undefined);
      setValue("impressions_limit", campaign.impressions_limit || undefined);
      setValue("clicks_limit", campaign.clicks_limit || undefined);
      setValue("priority", campaign.priority || 5);
      setValue("cpc", campaign.cpc || undefined);
      setValue("cpm", campaign.cpm || undefined);
      setValue("start_at", new Date(campaign.start_at));
      if (campaign.end_at) setValue("end_at", new Date(campaign.end_at));
      setValue("status", campaign.status);
      
      // Load targeting if exists
      if (campaign.targeting) {
        setValue("domains", campaign.targeting.domains || []);
        setValue("pages", campaign.targeting.pages || []);
        setValue("tags", campaign.targeting.tags || []);
      }
    }
  }, [mode, campaign, setValue]);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const campaignData = {
        name: data.name,
        advertiser: data.advertiser,
        budget_total: data.budget_total || null,
        budget_daily: data.budget_daily || null,
        impressions_limit: data.impressions_limit || null,
        clicks_limit: data.clicks_limit || null,
        priority: data.priority || 5,
        cpc: data.cpc || null,
        cpm: data.cpm || null,
        start_at: data.start_at.toISOString(),
        end_at: data.end_at?.toISOString() || null,
        status: data.status,
        tenant_id: TENANT_NAME,
      };

      let campaignId: string;

      if (mode === "create") {
        const { data: newCampaign, error } = await supabase
          .from("ad_campaigns")
          .insert(campaignData)
          .select()
          .single();

        if (error) throw error;
        campaignId = newCampaign.id;
      } else {
        const { error } = await supabase
          .from("ad_campaigns")
          .update(campaignData)
          .eq("id", campaign.id);

        if (error) throw error;
        campaignId = campaign.id;
      }

      // Handle targeting
      const hasTargeting = data.domains?.length || data.pages?.length || data.tags?.length;
      
      if (hasTargeting) {
        const targetingData = {
          campaign_id: campaignId,
          domains: data.domains || [],
          pages: data.pages || [],
          tags: data.tags || [],
        };

        if (mode === "edit") {
          // Delete old targeting and insert new
          await supabase.from("ad_targeting").delete().eq("campaign_id", campaignId);
        }

        const { error: targetingError } = await supabase
          .from("ad_targeting")
          .insert(targetingData);

        if (targetingError) throw targetingError;
      }

      toast({
        title: mode === "create" ? "Campanha criada!" : "Campanha atualizada!",
        description: `A campanha "${data.name}" foi ${mode === "create" ? "criada" : "atualizada"} com sucesso.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar campanha",
        description: error.message,
      });
    }
  };

  const estimatedDailyCost = watchedValues.budget_daily || 0;
  const daysRemaining = watchedValues.start_at && watchedValues.end_at
    ? Math.ceil((watchedValues.end_at.getTime() - watchedValues.start_at.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Campanha *</Label>
          <Input id="name" {...register("name")} placeholder="Campanha de Verão 2025" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="advertiser">Anunciante *</Label>
          <Input id="advertiser" {...register("advertiser")} placeholder="Empresa XYZ" />
          {errors.advertiser && <p className="text-sm text-destructive">{errors.advertiser.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget_total">Orçamento Total (R$)</Label>
          <Input
            id="budget_total"
            type="number"
            step="0.01"
            {...register("budget_total", { valueAsNumber: true })}
            placeholder="1000.00"
          />
          {errors.budget_total && <p className="text-sm text-destructive">{errors.budget_total.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget_daily">Orçamento Diário (R$)</Label>
          <Input
            id="budget_daily"
            type="number"
            step="0.01"
            {...register("budget_daily", { valueAsNumber: true })}
            placeholder="50.00"
          />
          {errors.budget_daily && <p className="text-sm text-destructive">{errors.budget_daily.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpc">CPC - Custo por Clique (R$)</Label>
          <Input
            id="cpc"
            type="number"
            step="0.01"
            {...register("cpc", { valueAsNumber: true })}
            placeholder="0.50"
          />
          {errors.cpc && <p className="text-sm text-destructive">{errors.cpc.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpm">CPM - Custo por Mil (R$)</Label>
          <Input
            id="cpm"
            type="number"
            step="0.01"
            {...register("cpm", { valueAsNumber: true })}
            placeholder="5.00"
          />
          {errors.cpm && <p className="text-sm text-destructive">{errors.cpm.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="impressions_limit">Limite de Impressões</Label>
          <Input
            id="impressions_limit"
            type="number"
            {...register("impressions_limit", { valueAsNumber: true })}
            placeholder="10000"
          />
          {errors.impressions_limit && <p className="text-sm text-destructive">{errors.impressions_limit.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clicks_limit">Limite de Cliques</Label>
          <Input
            id="clicks_limit"
            type="number"
            {...register("clicks_limit", { valueAsNumber: true })}
            placeholder="1000"
          />
          {errors.clicks_limit && <p className="text-sm text-destructive">{errors.clicks_limit.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade (1-10)</Label>
          <Input
            id="priority"
            type="number"
            min="1"
            max="10"
            {...register("priority", { valueAsNumber: true })}
            placeholder="5"
          />
          {errors.priority && <p className="text-sm text-destructive">{errors.priority.message}</p>}
          <p className="text-xs text-muted-foreground">Campanhas com maior prioridade têm mais chances de serem exibidas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !watchedValues.start_at && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watchedValues.start_at ? format(watchedValues.start_at, "dd/MM/yyyy") : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={watchedValues.start_at}
                onSelect={(date) => setValue("start_at", date as Date)}
              />
            </PopoverContent>
          </Popover>
          {errors.start_at && <p className="text-sm text-destructive">{errors.start_at.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Data de Término</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !watchedValues.end_at && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watchedValues.end_at ? format(watchedValues.end_at, "dd/MM/yyyy") : "Sem data limite"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={watchedValues.end_at}
                onSelect={(date) => setValue("end_at", date as Date)}
              />
            </PopoverContent>
          </Popover>
          {errors.end_at && <p className="text-sm text-destructive">{errors.end_at.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={watchedValues.status}
          onValueChange={(value) => setValue("status", value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
            <SelectItem value="ended">Finalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {estimatedDailyCost > 0 && daysRemaining > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estimativa de Custos</CardTitle>
            <CardDescription>Baseado nas configurações atuais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Gasto Diário</p>
                <p className="text-lg font-semibold">R$ {estimatedDailyCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gasto Total Estimado</p>
                <p className="text-lg font-semibold">
                  R$ {(estimatedDailyCost * daysRemaining).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Accordion type="single" collapsible>
        <AccordionItem value="targeting">
          <AccordionTrigger>Segmentação Avançada (Opcional)</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <TagsInput
              label="Páginas (slugs)"
              placeholder="/noticias, /grupos"
              value={watchedValues.pages || []}
              onChange={(tags) => setValue("pages", tags)}
            />

            <TagsInput
              label="Tags de Notícias"
              placeholder="tecnologia, saúde, educação"
              value={watchedValues.tags || []}
              onChange={(tags) => setValue("tags", tags)}
            />

            <TagsInput
              label="Domínios Alvo"
              placeholder="exemplo.com.br"
              value={watchedValues.domains || []}
              onChange={(tags) => setValue("domains", tags)}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Criar Campanha" : "Atualizar Campanha"}
        </Button>
      </div>
    </form>
  );
}
