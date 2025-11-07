import { Link, useLocation } from "react-router-dom";
import {
  Newspaper,
  Users,
  CheckCircle,
  Compass,
  Paintbrush,
  Video,
  Cpu,
  Globe,
  Briefcase,
  CreditCard,
  MessageSquare,
  UserCheck,
  Settings,
  Lock,
  Bell,
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Megaphone,
  Calendar,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/components/auth/AuthContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
}

const menuSections = (scheduledCount: number): MenuSection[] => [
  {
    title: "Ações Principais",
    items: [
      { icon: Newspaper, label: "Notícias", href: "/admin/articles" },
      { icon: Calendar, label: "Calendário", href: "/admin/schedule", badge: scheduledCount > 0 ? String(scheduledCount) : undefined },
      { icon: Users, label: "Comunidade", href: "/admin/comunidade" },
      { icon: CheckCircle, label: "Validar", href: "/admin/validar-desafios" },
      { icon: Compass, label: "Moderar", href: "/moderation" },
    ],
  },
  {
    title: "Ferramentas e IA",
    items: [
      { icon: Paintbrush, label: "IA Criativa", href: "/dashboard/funcionalidades/ferramentas-ia?tab=criativa" },
      { icon: Video, label: "Vídeo IA", href: "/dashboard/funcionalidades/ferramentas-ia?tab=video" },
      { icon: Cpu, label: "Studio IA", href: "/dashboard/funcionalidades/ferramentas-ia?tab=studio" },
      { icon: Globe, label: "Site IA", href: "/site-ai" },
      { icon: Briefcase, label: "ContabPRÓ", href: "/dashboard/funcionalidades/contabpro" },
      { icon: CreditCard, label: "Pay", href: "/dashboard/funcionalidades/illuminapay" },
    ],
  },
  {
    title: "Monetização",
    items: [
      { icon: Megaphone, label: "Anúncios", href: "/admin/ads" },
      { icon: DollarSign, label: "Receitas", href: "/admin/ads?tab=reports" },
    ],
  },
  {
    title: "Social",
    items: [
      { icon: MessageSquare, label: "Comentários", href: "/admin/comentarios" },
      { icon: UserCheck, label: "Assinaturas", href: "/admin/assinaturas" },
    ],
  },
  {
    title: "Impacto Social PCD",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin/impacto" },
      { icon: Users, label: "Participantes", href: "/admin/impacto?tab=usuarios" },
      { icon: CheckCircle, label: "Validações", href: "/admin/impacto?tab=validacoes" },
      { icon: TrendingUp, label: "Transações", href: "/admin/impacto?tab=transacoes" },
    ],
  },
  {
    title: "Configurações",
    items: [
      { icon: Settings, label: "Preferências", href: "/dashboard?tab=preferences" },
      { icon: Lock, label: "Segurança", href: "/dashboard?tab=security" },
      { icon: Bell, label: "Notificações", href: "/dashboard?tab=notifications" },
    ],
  },
];

export function IlluminaSidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    const loadScheduledCount = async () => {
      const { count } = await supabase
        .from('article_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      setScheduledCount(count || 0);
    };
    loadScheduledCount();
  }, []);

  const isActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      return location.pathname === path && location.search.includes(query);
    }
    return location.pathname === href;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border overflow-y-auto">
      {/* Logo + Nome */}
      <div className="flex flex-col items-center p-6 border-b border-border">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-primary">I</span>
        </div>
        <span className="font-semibold text-sm text-center">
          {profile?.full_name || 'Admin'}
        </span>
        <span className="text-xs text-muted-foreground">Illúmina Admin</span>
      </div>

      {/* Theme Toggle */}
      <div className="p-4 border-b border-border">
        <ThemeToggle />
      </div>

      {/* Seções */}
      <div className="flex-1 p-4 space-y-6">
        {menuSections(scheduledCount).map((section, index) => (
          <div key={index}>
            <h3 className="text-xs uppercase font-bold text-muted-foreground mb-3 px-2">
              {section.title}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {section.items.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-150 hover:shadow-md relative",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] text-center font-medium leading-tight">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] px-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="p-4 border-t border-border text-center">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} Illúmina
        </p>
        <p className="text-[10px] text-muted-foreground">
          Todos os direitos reservados
        </p>
      </div>
    </aside>
  );
}
