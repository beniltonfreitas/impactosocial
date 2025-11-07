import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdPreview } from "./AdPreview";
import { Upload, Loader2, Info } from "lucide-react";

const creativeSchema = z.object({
  campaign_id: z.string().uuid("Selecione uma campanha válida"),
  type: z.enum(["image", "html", "video"]),
  headline: z.string().max(100, "Máximo 100 caracteres").optional(),
  description: z.string().max(200, "Máximo 200 caracteres").optional(),
  cta_label: z.string().max(30, "Máximo 30 caracteres").optional(),
  target_url: z.string().url("URL inválida"),
  width: z.number().int().positive().max(2000, "Máximo 2000px").optional(),
  height: z.number().int().positive().max(2000, "Máximo 2000px").optional(),
  image_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  html_content: z.string().optional(),
}).refine(data => {
  if (data.type === "image") return !!data.image_url;
  if (data.type === "video") return !!data.video_url;
  if (data.type === "html") return !!data.html_content;
  return true;
}, {
  message: "Preencha o conteúdo do criativo",
  path: ["image_url"],
});

type CreativeFormData = z.infer<typeof creativeSchema>;

interface CreativeFormProps {
  mode: "create" | "edit";
  creative?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreativeForm({ mode, creative, onSuccess, onCancel }: CreativeFormProps) {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreativeFormData>({
    resolver: zodResolver(creativeSchema),
    defaultValues: {
      type: "image",
      width: 300,
      height: 250,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (mode === "edit" && creative) {
      setValue("campaign_id", creative.campaign_id);
      setValue("type", creative.type);
      setValue("headline", creative.headline || "");
      setValue("description", creative.description || "");
      setValue("cta_label", creative.cta_label || "");
      setValue("target_url", creative.target_url);
      setValue("width", creative.width || 300);
      setValue("height", creative.height || 250);
      if (creative.image_url) setValue("image_url", creative.image_url);
      if (creative.video_url) setValue("video_url", creative.video_url);
      if (creative.html_content) setValue("html_content", creative.html_content);
    }
  }, [mode, creative, setValue]);

  const loadCampaigns = async () => {
    const { data } = await supabase
      .from("ad_campaigns")
      .select("id, name, status")
      .eq("status", "active")
      .order("name");
    
    if (data) setCampaigns(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: `O tamanho máximo é ${type === "image" ? "5MB" : "50MB"}`,
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `ads/${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ai-generated-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ai-generated-images')
        .getPublicUrl(filePath);

      if (type === "image") {
        setValue("image_url", publicUrl);
      } else {
        setValue("video_url", publicUrl);
      }

      toast({
        title: "Upload concluído!",
        description: "Arquivo enviado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: CreativeFormData) => {
    try {
      const creativeData = {
        campaign_id: data.campaign_id,
        type: data.type,
        headline: data.headline || null,
        description: data.description || null,
        cta_label: data.cta_label || null,
        target_url: data.target_url,
        width: data.width || null,
        height: data.height || null,
        image_url: data.image_url || null,
        video_url: data.video_url || null,
        html_content: data.html_content || null,
      };

      if (mode === "create") {
        const { error } = await supabase.from("ad_creatives").insert(creativeData);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ad_creatives")
          .update(creativeData)
          .eq("id", creative.id);
        if (error) throw error;
      }

      toast({
        title: mode === "create" ? "Criativo criado!" : "Criativo atualizado!",
        description: `O criativo foi ${mode === "create" ? "criado" : "atualizado"} com sucesso.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar criativo",
        description: error.message,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="campaign_id">Campanha *</Label>
        <Select
          value={watchedValues.campaign_id}
          onValueChange={(value) => setValue("campaign_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma campanha" />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.campaign_id && <p className="text-sm text-destructive">{errors.campaign_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Tipo de Criativo *</Label>
        <RadioGroup
          value={watchedValues.type}
          onValueChange={(value) => setValue("type", value as any)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="type-image" />
            <Label htmlFor="type-image" className="font-normal cursor-pointer">
              🖼️ Imagem
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="html" id="type-html" />
            <Label htmlFor="type-html" className="font-normal cursor-pointer">
              📄 HTML
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="type-video" />
            <Label htmlFor="type-video" className="font-normal cursor-pointer">
              🎬 Vídeo
            </Label>
          </div>
        </RadioGroup>
      </div>

      {watchedValues.type === "image" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload de Imagem</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "image")}
                disabled={uploading}
                className="max-w-xs mx-auto"
              />
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, GIF ou WebP (máx. 5MB)
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image_url">Ou URL da Imagem</Label>
            <Input
              id="image_url"
              type="url"
              {...register("image_url")}
              placeholder="https://exemplo.com/imagem.jpg"
            />
            {errors.image_url && <p className="text-sm text-destructive">{errors.image_url.message}</p>}
          </div>
        </div>
      )}

      {watchedValues.type === "html" && (
        <div className="space-y-2">
          <Label htmlFor="html_content">Código HTML *</Label>
          <Textarea
            id="html_content"
            {...register("html_content")}
            rows={10}
            placeholder="<div>Seu código HTML aqui...</div>"
            className="font-mono text-sm"
          />
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Use <code className="bg-muted px-1 py-0.5 rounded">__CLICK__</code> como placeholder para o link de clique.
            </AlertDescription>
          </Alert>
          {errors.html_content && <p className="text-sm text-destructive">{errors.html_content.message}</p>}
        </div>
      )}

      {watchedValues.type === "video" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload de Vídeo</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, "video")}
                disabled={uploading}
                className="max-w-xs mx-auto"
              />
              <p className="text-xs text-muted-foreground mt-2">
                MP4 ou WebM (máx. 50MB)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Ou URL do Vídeo</Label>
            <Input
              id="video_url"
              type="url"
              {...register("video_url")}
              placeholder="https://exemplo.com/video.mp4"
            />
            {errors.video_url && <p className="text-sm text-destructive">{errors.video_url.message}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">Largura (px)</Label>
          <Input
            id="width"
            type="number"
            {...register("width", { valueAsNumber: true })}
            placeholder="300"
          />
          {errors.width && <p className="text-sm text-destructive">{errors.width.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Altura (px)</Label>
          <Input
            id="height"
            type="number"
            {...register("height", { valueAsNumber: true })}
            placeholder="250"
          />
          {errors.height && <p className="text-sm text-destructive">{errors.height.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headline">Título</Label>
        <Input
          id="headline"
          {...register("headline")}
          placeholder="Seu produto aqui"
          maxLength={100}
        />
        {errors.headline && <p className="text-sm text-destructive">{errors.headline.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Descrição do anúncio"
          maxLength={200}
          rows={3}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cta_label">Texto do Botão (CTA)</Label>
        <Input
          id="cta_label"
          {...register("cta_label")}
          placeholder="Saiba mais"
          maxLength={30}
        />
        {errors.cta_label && <p className="text-sm text-destructive">{errors.cta_label.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_url">URL de Destino *</Label>
        <Input
          id="target_url"
          type="url"
          {...register("target_url")}
          placeholder="https://exemplo.com/landing"
        />
        {errors.target_url && <p className="text-sm text-destructive">{errors.target_url.message}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview em Tempo Real</CardTitle>
          <CardDescription>Visualize como seu criativo aparecerá</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <AdPreview creative={watchedValues as any} />
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading}>
          {(isSubmitting || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Criar Criativo" : "Atualizar Criativo"}
        </Button>
      </div>
    </form>
  );
}
