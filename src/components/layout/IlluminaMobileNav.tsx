import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Newspaper,
  Paintbrush,
  Globe,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { icon: LayoutDashboard, label: "Início", href: "/admin" },
  { icon: Newspaper, label: "Notícias", href: "/admin/articles" },
  { icon: Paintbrush, label: "IA", href: "/dashboard/funcionalidades/ferramentas-ia" },
  { icon: Globe, label: "Site", href: "/site-ai" },
  { icon: Settings, label: "Config", href: "/dashboard" },
];

export function IlluminaMobileNav() {
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-lg">
      <div className="flex justify-around items-center py-2 px-2">
        {mobileItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-150 min-w-[60px]",
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 mb-1",
              isActive(item.href) && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
            )} />
            <span className="text-[10px] font-medium">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
