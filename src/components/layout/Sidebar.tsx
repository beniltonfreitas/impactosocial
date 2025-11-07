import { WidgetMarkets } from "@/components/widgets/WidgetMarkets";
import { WidgetWeather } from "@/components/widgets/WidgetWeather";
import { WidgetTraffic } from "@/components/widgets/WidgetTraffic";
import { AdSlot } from "@/components/ads/AdSlot";

export function Sidebar() {
  return (
    <aside className="space-y-4">
      <AdSlot slot="sidebar_1" className="mb-4" />
      <WidgetMarkets />
      <WidgetWeather />
      <WidgetTraffic />
    </aside>
  );
}
