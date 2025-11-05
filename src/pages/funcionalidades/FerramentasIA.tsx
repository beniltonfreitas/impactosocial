import { ModuleLayout } from '@/components/funcionalidades/ModuleLayout';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FerramentasIA() {
  return (
    <PermissionGate permission="ia_tools">
      <ModuleLayout
        title="Ferramentas IA"
        description="Explore o poder da inteligência artificial"
      >
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bem-vindo às Ferramentas IA</CardTitle>
                <Badge>Em Desenvolvimento</Badge>
              </div>
              <CardDescription>
                Seu hub de criação com inteligência artificial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                O módulo Ferramentas IA estará disponível em breve com:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>Chat IA - Assistente textual inteligente</li>
                <li>Imagem IA - Geração de designs automáticos</li>
                <li>Vídeo IA - Transforme texto em vídeo</li>
                <li>Studio IA - Automações visuais combinadas</li>
                <li>Análises IA - Dashboards e insights de dados</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </ModuleLayout>
    </PermissionGate>
  );
}
