import { ModuleLayout } from '@/components/funcionalidades/ModuleLayout';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinancialDashboard } from '@/components/illuminapay/FinancialDashboard';
import { SubscriptionsTable } from '@/components/illuminapay/SubscriptionsTable';
import { TransactionsTable } from '@/components/illuminapay/TransactionsTable';
import { PaymentSettings } from '@/components/illuminapay/PaymentSettings';
import { BarChart3, CreditCard, Receipt, Settings } from 'lucide-react';

export default function IlluminaPay() {
  return (
    <PermissionGate permission="financeiro">
      <ModuleLayout
        title="Illúmina Pay"
        description="Gestão completa de pagamentos e assinaturas"
      >
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Assinaturas</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Transações</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <FinancialDashboard />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionsTable />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionsTable />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PaymentSettings />
          </TabsContent>
        </Tabs>
      </ModuleLayout>
    </PermissionGate>
  );
}
