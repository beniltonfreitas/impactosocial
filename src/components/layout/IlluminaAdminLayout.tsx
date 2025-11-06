import { ReactNode } from "react";
import { IlluminaSidebar } from "./IlluminaSidebar";
import { IlluminaMobileNav } from "./IlluminaMobileNav";
import { NotificationCenter } from "@/components/admin/NotificationCenter";

interface IlluminaAdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function IlluminaAdminLayout({ children, title }: IlluminaAdminLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-background">
      <IlluminaSidebar />
      
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        {/* Header com título e notificações */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            {title && (
              <h1 className="text-2xl font-bold">{title}</h1>
            )}
            <div className="ml-auto">
              <NotificationCenter />
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      <IlluminaMobileNav />
    </div>
  );
}
