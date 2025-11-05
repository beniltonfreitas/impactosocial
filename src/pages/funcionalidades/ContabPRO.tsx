import { ModuleLayout } from '@/components/funcionalidades/ModuleLayout';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ContabPRO() {
  return (
    <PermissionGate permission="contabilidade">
      <ModuleLayout
        title="ContabPRÓ"
        description="Sistema de contabilidade digital inteligente"
      >
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bem-vindo ao ContabPRÓ</CardTitle>
                <Badge>Em Desenvolvimento</Badge>
              </div>
              <CardDescription>
                Seu sistema completo de gestão contábil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O módulo ContabPRÓ estará disponível em breve com:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>Upload e OCR de documentos fiscais</li>
                <li>Emissão de guias e notas fiscais</li>
                <li>Relatórios contábeis (DRE, Balanço, Fluxo de Caixa)</li>
                <li>CRM para clientes</li>
                <li>Chat IA especializado em contabilidade</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </ModuleLayout>
    </PermissionGate>
  );
}
