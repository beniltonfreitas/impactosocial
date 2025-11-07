import { IlluminaAdminLayout } from "@/components/layout/IlluminaAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignList } from "@/components/ads/CampaignList";
import { CreativeList } from "@/components/ads/CreativeList";
import { PlacementList } from "@/components/ads/PlacementList";
import { Megaphone, Palette, MapPin, BarChart3 } from "lucide-react";

export default function AdminAds() {
  return (
    <IlluminaAdminLayout title="Publicidade & Monetização">
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="creatives" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Criativos</span>
          </TabsTrigger>
          <TabsTrigger value="placements" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Posições</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignList />
        </TabsContent>

        <TabsContent value="creatives" className="space-y-4">
          <CreativeList />
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          <PlacementList />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            Relatórios em breve...
          </div>
        </TabsContent>
      </Tabs>
    </IlluminaAdminLayout>
  );
}
