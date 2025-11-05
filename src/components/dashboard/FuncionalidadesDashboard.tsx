import { PermissionCard } from '@/components/funcionalidades/PermissionCard';
import { Calculator, CreditCard, Sparkles } from 'lucide-react';

export function FuncionalidadesDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Funcionalidades da Plataforma</h2>
        <p className="text-muted-foreground">
          Acesse e gerencie suas ferramentas integradas Illúmina.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PermissionCard
          title="ContabPRÓ"
          description="Contabilidade digital inteligente com a sua marca."
          icon={Calculator}
          permission="contabilidade"
          route="/dashboard/funcionalidades/contabpro"
          gradient="from-blue-500 to-blue-600"
        />

        <PermissionCard
          title="Illúmina Pay"
          description="Gestão integrada de pagamentos, assinaturas e doações em tempo real."
          icon={CreditCard}
          permission="financeiro"
          route="/dashboard/funcionalidades/illuminapay"
          gradient="from-green-500 to-green-600"
        />

        <PermissionCard
          title="Ferramentas IA"
          description="Explore o poder da inteligência artificial em suas criações."
          icon={Sparkles}
          permission="ia_tools"
          route="/dashboard/funcionalidades/ferramentas-ia"
          gradient="from-purple-500 to-purple-600"
        />
      </div>
    </div>
  );
}
