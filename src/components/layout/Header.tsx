import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogIn, MapPin } from "lucide-react";
import { TENANT_NAME } from "@/lib/constants";
import { AccessibilityBar } from "@/components/accessibility/AccessibilityBar";
import { GeoResolverModal } from "@/components/geo/GeoResolverModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "./UserMenu";

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
