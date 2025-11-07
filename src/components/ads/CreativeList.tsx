import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Edit, Eye, Copy } from "lucide-react";

interface Creative {
  id: string;
  campaign_id: string;
  type: string;
  image_url?: string;
  video_url?: string;
  html_content?: string;
  width?: number;
  height?: number;
  headline?: string;
  description?: string;
  target_url: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

export function CreativeList() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const [creativesRes, campaignsRes] = await Promise.all([
        supabase
          .from("ad_creatives")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("ad_campaigns")
          .select("id, name")
          .order("name")
      ]);

      if (creativesRes.error) throw creativesRes.error;
      if (campaignsRes.error) throw campaignsRes.error;

      setCreatives(creativesRes.data || []);
      setCampaigns(campaignsRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os criativos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteCreative(id: string) {
    if (!confirm("Tem certeza que deseja deletar este criativo?")) return;

    try {
      const { error } = await supabase
        .from("ad_creatives")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Criativo deletado com sucesso.",
      });
      
      loadData();
    } catch (error) {
      console.error("Erro ao deletar criativo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o criativo.",
        variant: "destructive",
      });
    }
  }

  const getTypeBadge = (type: string) => {
    const icons: Record<string, string> = {
      image: "🖼️",
      html: "📄",
      video: "🎬",
    };

    return (
      <Badge variant="outline">
        {icons[type] || "❓"} {type.toUpperCase()}
      </Badge>
    );
  };

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || "Campanha não encontrada";
  };

  const filteredCreatives = creatives.filter(creative => {
    const matchesSearch = creative.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creative.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCampaign = campaignFilter === "all" || creative.campaign_id === campaignFilter;
    const matchesType = typeFilter === "all" || creative.type === typeFilter;
    
    return matchesSearch && matchesCampaign && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar criativos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Campanhas</SelectItem>
              {campaigns.map(campaign => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="image">🖼️ Imagem</SelectItem>
              <SelectItem value="html">📄 HTML</SelectItem>
              <SelectItem value="video">🎬 Vídeo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Criativo
        </Button>
      </div>

      {/* Grid de Criativos */}
      {filteredCreatives.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhum criativo encontrado.</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Criativo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCreatives.map((creative) => (
            <Card key={creative.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">
                      {creative.headline || "Sem título"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {getCampaignName(creative.campaign_id)}
                    </CardDescription>
                  </div>
                  {getTypeBadge(creative.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview */}
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                  {creative.type === "image" && creative.image_url ? (
                    <img 
                      src={creative.image_url} 
                      alt={creative.headline || "Criativo"}
                      className="w-full h-full object-cover"
                    />
                  ) : creative.type === "video" && creative.video_url ? (
                    <video 
                      src={creative.video_url}
                      className="w-full h-full object-cover"
                      controls={false}
                    />
                  ) : creative.type === "html" ? (
                    <div className="flex items-center justify-center text-muted-foreground">
                      <span className="text-4xl">📄</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">Sem preview</div>
                  )}
                </div>

                {/* Dimensões */}
                {creative.width && creative.height && (
                  <div className="text-xs text-muted-foreground">
                    {creative.width}x{creative.height}px
                  </div>
                )}

                {/* Descrição */}
                {creative.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {creative.description}
                  </p>
                )}

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Impressões</p>
                    <p className="text-sm font-bold">-</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Cliques</p>
                    <p className="text-sm font-bold">-</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className="text-sm font-bold">-</p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => deleteCreative(creative.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
