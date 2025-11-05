import { ModuleLayout } from '@/components/funcionalidades/ModuleLayout';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function IlluminaPay() {
  return (
    <PermissionGate permission="financeiro">
      <ModuleLayout
        title="Illúmina Pay"
        description="Gestão integrada de pagamentos e assinaturas"
      >
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bem-vindo ao Illúmina Pay</CardTitle>
                <Badge>Em Desenvolvimento</Badge>
              </div>
              <CardDescription>
                Sua plataforma de pagamentos integrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O módulo Illúmina Pay estará disponível em breve com:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>Dashboard financeiro em tempo real</li>
                <li>Checkout integrado (Pix e Cartão)</li>
                <li>Gestão de assinaturas recorrentes</li>
                <li>Emissão automática de recibos</li>
                <li>Relatórios financeiros e repasses</li>
                <li>Configuração de chaves Pix e APIs</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </ModuleLayout>
    </PermissionGate>
  );
}
