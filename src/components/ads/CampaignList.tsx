import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TENANT_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pause, Play, Trash2, Edit, Eye, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CampaignForm } from "./CampaignForm";
import { CampaignStatusIndicator } from "./CampaignStatusIndicator";

interface Campaign {
  id: string;
  name: string;
  advertiser: string;
  status: string;
  budget_total: number | null;
  budget_daily: number | null;
  cpc: number | null;
  cpm: number | null;
  start_at: string;
  end_at: string | null;
  created_at: string;
}

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "ended">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setLoading(true);
      let query = supabase
        .from("ad_campaigns")
        .select("*")
        .eq("tenant_id", TENANT_NAME)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as campanhas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggleCampaignStatus(id: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      const { error } = await supabase
        .from("ad_campaigns")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Campanha ${newStatus === "active" ? "ativada" : "pausada"}.`,
      });
      
      loadCampaigns();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Tem certeza que deseja deletar esta campanha?")) return;

    try {
      const { error } = await supabase
        .from("ad_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campanha deletada com sucesso.",
      });
      
      loadCampaigns();
    } catch (error) {
      console.error("Erro ao deletar campanha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a campanha.",
        variant: "destructive",
      });
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      paused: "secondary",
      ended: "destructive",
    };

    const labels: Record<string, string> = {
      active: "Ativa",
      paused: "Pausada",
      ended: "Finalizada",
    };

    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.advertiser.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              placeholder="Buscar campanhas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="paused">Pausadas</SelectItem>
              <SelectItem value="ended">Finalizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={() => {
            setFormMode("create");
            setSelectedCampaign(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Grid de Campanhas */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhuma campanha encontrada.</p>
          <Button
            onClick={() => {
              setFormMode("create");
              setSelectedCampaign(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Campanha
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.advertiser}</CardDescription>
                  </div>
                  <CampaignStatusIndicator campaign={campaign} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Período */}
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Período</p>
                  <p className="font-medium">
                    {format(new Date(campaign.start_at), "dd/MM/yyyy", { locale: ptBR })}
                    {campaign.end_at && ` → ${format(new Date(campaign.end_at), "dd/MM/yyyy", { locale: ptBR })}`}
                  </p>
                </div>

                {/* Orçamento */}
                {campaign.budget_total && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Orçamento</span>
                      <span className="font-medium">R$ {campaign.budget_total.toLocaleString('pt-BR')}</span>
                    </div>
                    <Progress value={Math.random() * 100} className="h-2" />
                  </div>
                )}

                {/* Métricas Rápidas */}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                  >
                    {campaign.status === "active" ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setFormMode("edit");
                      setSelectedCampaign(campaign);
                      setFormOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => deleteCampaign(campaign.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Nova Campanha" : "Editar Campanha"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create" 
                ? "Crie uma nova campanha publicitária com segmentação e orçamento." 
                : "Atualize as informações da campanha."}
            </DialogDescription>
          </DialogHeader>
          <CampaignForm
            mode={formMode}
            campaign={selectedCampaign}
            onSuccess={() => {
              setFormOpen(false);
              loadCampaigns();
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
