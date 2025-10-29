import { WidgetMarkets } from "@/components/widgets/WidgetMarkets";
import { WidgetWeather } from "@/components/widgets/WidgetWeather";
import { WidgetTraffic } from "@/components/widgets/WidgetTraffic";

export function Sidebar() {
  return (
    <aside className="space-y-4">
      <WidgetMarkets />
      <WidgetWeather />
      <WidgetTraffic />
    </aside>
  );
}
