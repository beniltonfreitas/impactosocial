import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogIn, MapPin, ChevronDown } from "lucide-react";
import { TENANT_NAME } from "@/lib/constants";
import { AccessibilityBar } from "@/components/accessibility/AccessibilityBar";
import { GeoResolverModal } from "@/components/geo/GeoResolverModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "./UserMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [geoModalOpen, setGeoModalOpen] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['moderator', 'admin'])
        .maybeSingle()
        .then(({ data }) => {
          setIsModerator(!!data);
        });
    } else {
      setIsModerator(false);
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <AccessibilityBar />
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">
                Conexão na Cidade
              </div>
            </a>
            <div className="hidden md:block text-sm text-muted-foreground border-l border-border pl-4">
              {TENANT_NAME}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <a
                href="/"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Home
              </a>
              <a
                href="/noticias"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Notícias
              </a>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                  Rede PcD
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-background border border-border shadow-lg">
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd" className="w-full cursor-pointer">
                      🏠 Início Rede PcD
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/feed" className="w-full cursor-pointer">
                      📰 PcD+
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/direitos" className="w-full cursor-pointer">
                      ⚖️ PcD Direitos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/alerta" className="w-full cursor-pointer">
                      🚨 PcD Alerta
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/play" className="w-full cursor-pointer">
                      ▶️ PcD Play
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/esportes" className="w-full cursor-pointer">
                      🏆 PcD Esportes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/conselhos" className="w-full cursor-pointer">
                      👥 CDDPcD
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/shop" className="w-full cursor-pointer">
                      🛍️ PcD Shop
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/vitrine" className="w-full cursor-pointer">
                      💼 PcD Vitrine
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/blog" className="w-full cursor-pointer">
                      ✍️ PcD Blog
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/academy" className="w-full cursor-pointer">
                      🎓 PcD Academy
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/clube" className="w-full cursor-pointer">
                      🎁 PcD Clube
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rede-pcd/rede-do-bem" className="w-full cursor-pointer">
                      ❤️ PcD Rede do Bem
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <a
                href="/sobre"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Sobre
              </a>
              <a
                href="/contato"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Contato
              </a>
              <a
                href="/assinaturas"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Assinaturas
              </a>
              {isModerator && (
                <a
                  href="/moderation"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Moderação
                </a>
              )}
            </nav>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGeoModalOpen(true)}
                className="hidden lg:flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Região
              </Button>
              
              {user ? (
                <UserMenu />
              ) : (
                <Button asChild size="sm">
                  <Link to="/auth">
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a
                href="/"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Home
              </a>
              <a
                href="/noticias"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Notícias
              </a>
              
              <div className="border-l-2 border-primary pl-3">
                <Link 
                  to="/rede-pcd"
                  className="text-sm font-semibold text-primary block mb-2"
                >
                  Rede PcD
                </Link>
                <div className="flex flex-col gap-2 text-sm">
                  <Link to="/rede-pcd/feed" className="text-muted-foreground hover:text-primary">
                    📰 PcD+
                  </Link>
                  <Link to="/rede-pcd/direitos" className="text-muted-foreground hover:text-primary">
                    ⚖️ PcD Direitos
                  </Link>
                  <Link to="/rede-pcd/alerta" className="text-muted-foreground hover:text-primary">
                    🚨 PcD Alerta
                  </Link>
                  <Link to="/rede-pcd/play" className="text-muted-foreground hover:text-primary">
                    ▶️ PcD Play
                  </Link>
                  <Link to="/rede-pcd/shop" className="text-muted-foreground hover:text-primary">
                    🛍️ PcD Shop
                  </Link>
                  <Link to="/rede-pcd/blog" className="text-muted-foreground hover:text-primary">
                    ✍️ PcD Blog
                  </Link>
                </div>
              </div>
              
              <a
                href="/sobre"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Sobre
              </a>
              <a
                href="/contato"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Contato
              </a>
              <a
                href="/assinaturas"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Assinaturas
              </a>
              {isModerator && (
                <a
                  href="/moderation"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Moderação
                </a>
              )}
              
              {!user && (
                <Button asChild size="sm" className="w-full">
                  <Link to="/auth">
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
      
      <GeoResolverModal open={geoModalOpen} onOpenChange={setGeoModalOpen} />
    </header>
  );
}
