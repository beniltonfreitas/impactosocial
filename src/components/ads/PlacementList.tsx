import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TENANT_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlacementForm } from "./PlacementForm";

interface Placement {
  id: string;
  slot: string;
  allowed_types: string[];
  max_ads: number;
  is_active: boolean;
  created_at: string;
}

export function PlacementList() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const { toast } = useToast();

  useEffect(() => {
    loadPlacements();
  }, []);

  async function loadPlacements() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ad_placements")
        .select("*")
        .eq("tenant_id", TENANT_NAME)
        .order("slot");

      if (error) throw error;
      setPlacements(data || []);
    } catch (error) {
      console.error("Erro ao carregar posições:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as posições.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function togglePlacementStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("ad_placements")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Posição ${!currentStatus ? "ativada" : "desativada"}.`,
      });
      
      loadPlacements();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  }

  async function deletePlacement(id: string) {
    if (!confirm("Tem certeza que deseja deletar esta posição?")) return;

    try {
      const { error } = await supabase
        .from("ad_placements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Posição deletada com sucesso.",
      });
      
      loadPlacements();
    } catch (error) {
      console.error("Erro ao deletar posição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a posição.",
        variant: "destructive",
      });
    }
  }

  const getTypeIcons = (types: string[]) => {
    const icons: Record<string, string> = {
      image: "🖼️",
      html: "📄",
      video: "🎬",
    };

    return types.map(type => (
      <Badge key={type} variant="outline" className="mr-1">
        {icons[type] || "❓"} {type}
      </Badge>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Posições de Anúncios</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os espaços publicitários do site
          </p>
        </div>
        <Button onClick={() => {
          setFormMode('create');
          setSelectedPlacement(null);
          setFormOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Posição
        </Button>
      </div>

      {/* Tabela */}
      {placements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Nenhuma posição cadastrada.</p>
            <Button onClick={() => {
              setFormMode('create');
              setSelectedPlacement(null);
              setFormOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Posição
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Tipos Permitidos</TableHead>
                  <TableHead className="text-center">Max Anúncios</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.map((placement) => (
                  <TableRow key={placement.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{placement.slot}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getTypeIcons(placement.allowed_types)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{placement.max_ads}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={placement.is_active}
                        onCheckedChange={() => togglePlacementStatus(placement.id, placement.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setFormMode('edit');
                            setSelectedPlacement(placement);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePlacement(placement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Slots Sugeridos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Slots Sugeridos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <code className="bg-muted px-2 py-1 rounded">header_top</code>
              <span className="text-muted-foreground">728x90</span>
              <span className="text-muted-foreground">Leaderboard</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <code className="bg-muted px-2 py-1 rounded">sidebar_1</code>
              <span className="text-muted-foreground">300x250</span>
              <span className="text-muted-foreground">Medium Rectangle</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <code className="bg-muted px-2 py-1 rounded">sidebar_2</code>
              <span className="text-muted-foreground">300x600</span>
              <span className="text-muted-foreground">Half Page</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <code className="bg-muted px-2 py-1 rounded">article_inline</code>
              <span className="text-muted-foreground">300x250</span>
              <span className="text-muted-foreground">In-content</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <code className="bg-muted px-2 py-1 rounded">footer</code>
              <span className="text-muted-foreground">728x90</span>
              <span className="text-muted-foreground">Bottom Banner</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog com Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Nova Posição' : 'Editar Posição'}
            </DialogTitle>
          </DialogHeader>
          <PlacementForm
            mode={formMode}
            placement={selectedPlacement}
            onSuccess={() => {
              setFormOpen(false);
              loadPlacements();
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
