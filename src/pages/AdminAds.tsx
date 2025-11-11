import { IlluminaAdminLayout } from "@/components/layout/IlluminaAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignList } from "@/components/ads/CampaignList";
import { CreativeList } from "@/components/ads/CreativeList";
import { PlacementList } from "@/components/ads/PlacementList";
import { AdsAnalytics } from "@/components/ads/AdsAnalytics";
import { AdsOverview } from "@/components/ads/AdsOverview";
import { CampaignAlerts } from "@/components/ads/CampaignAlerts";
import { FunctionsHealthBadge } from "@/components/ads/FunctionsHealthBadge";
import { Megaphone, Palette, MapPin, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function AdminAds() {
  return (
    <IlluminaAdminLayout title="Publicidade & Monetização">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <AdsOverview />
          </div>
          <div className="flex items-center gap-3">
            <FunctionsHealthBadge />
            <Button asChild variant="outline">
              <Link to="/admin/ads/realtime">
                <Activity className="mr-2 h-4 w-4" />
                Tempo Real
              </Link>
            </Button>
          </div>
        </div>
        
        <CampaignAlerts />
      </div>
      
      <Tabs defaultValue="campaigns" className="space-y-6 mt-6">
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
          <AdsAnalytics />
        </TabsContent>
      </Tabs>
    </IlluminaAdminLayout>
  );
}
