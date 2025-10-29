import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { useGeoTenant } from "@/hooks/useGeoTenant";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface GeoResolverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeoResolverModal({ open, onOpenChange }: GeoResolverModalProps) {
  const { byCEP, byCity, byGeo } = useGeoTenant();
  const [loading, setLoading] = useState(false);
  
  const [cep, setCep] = useState("");
  const [uf, setUf] = useState("");
  const [city, setCity] = useState("");

  const handleCEP = async () => {
    if (!cep || cep.length < 8) {
      toast({ title: "CEP inválido", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await byCEP(cep);
    } catch (e) {
      toast({ title: "Erro ao resolver CEP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCity = async () => {
    if (!uf || !city) {
      toast({ title: "Preencha UF e Cidade", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await byCity(uf, city);
    } catch (e) {
      toast({ title: "Erro ao resolver cidade", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGPS = async () => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Geolocalização não disponível", variant: "destructive" });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await byGeo(pos.coords.latitude, pos.coords.longitude);
        } catch (e) {
          toast({ title: "Erro ao resolver GPS", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast({ title: "Erro ao obter localização", variant: "destructive" });
        setLoading(false);
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha sua região</DialogTitle>
          <DialogDescription>
            Para oferecer o melhor conteúdo local, precisamos saber sua localização.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cep" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cep">CEP</TabsTrigger>
            <TabsTrigger value="city">UF + Cidade</TabsTrigger>
            <TabsTrigger value="gps">GPS</TabsTrigger>
          </TabsList>

          <TabsContent value="cep" className="space-y-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                maxLength={9}
              />
            </div>
            <Button onClick={handleCEP} disabled={loading} className="w-full">
              <MapPin className="mr-2 h-4 w-4" />
              {loading ? "Buscando..." : "Buscar por CEP"}
            </Button>
          </TabsContent>

          <TabsContent value="city" className="space-y-4">
            <div>
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                placeholder="SP"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="São Paulo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <Button onClick={handleCity} disabled={loading} className="w-full">
              <MapPin className="mr-2 h-4 w-4" />
              {loading ? "Buscando..." : "Buscar por Cidade"}
            </Button>
          </TabsContent>

          <TabsContent value="gps" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clique no botão abaixo para permitir que detectemos sua localização
              automaticamente.
            </p>
            <Button onClick={handleGPS} disabled={loading} className="w-full">
              <Navigation className="mr-2 h-4 w-4" />
              {loading ? "Detectando..." : "Usar Minha Localização"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
