import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFunctionsHealth, type FunctionStatus } from "@/hooks/useFunctionsHealth";
import { Activity, CheckCircle2, AlertCircle, XCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: "Funções OK",
    color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
    dotColor: "bg-green-500",
  },
  degraded: {
    icon: AlertCircle,
    label: "Atenção",
    color: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
    dotColor: "bg-yellow-500",
  },
  down: {
    icon: XCircle,
    label: "Alerta",
    color: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
    dotColor: "bg-red-500",
  },
};

const getLatencyColor = (latency: number) => {
  if (latency < 200) return "text-green-600";
  if (latency < 500) return "text-yellow-600";
  return "text-red-600";
};

const getFunctionStatusIcon = (status: FunctionStatus) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  return <Icon className="w-4 h-4" />;
};

export function FunctionsHealthBadge() {
  const { health, loading, refresh } = useFunctionsHealth();

  if (loading || !health) {
    return (
      <Badge variant="outline" className="gap-2">
        <Activity className="w-3 h-3 animate-pulse" />
        <span>Verificando...</span>
      </Badge>
    );
  }

  const config = statusConfig[health.status];
  const Icon = config.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={`gap-2 ${config.color}`}>
          <div className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{config.label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Status das Edge Functions
          </DialogTitle>
          <DialogDescription>
            Monitoramento em tempo real das funções críticas do sistema
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
              <div>
                <p className="font-medium">Status Geral</p>
                <p className="text-sm text-muted-foreground">
                  {config.label}
                </p>
              </div>
            </div>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Functions List */}
          <div className="space-y-2">
            {Object.entries(health.functions).map(([name, func]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {getFunctionStatusIcon(func.status)}
                  <div>
                    <p className="font-medium text-sm">{name}</p>
                    {func.error && (
                      <p className="text-xs text-red-600">{func.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-mono ${getLatencyColor(func.latency)}`}>
                    {func.latency}ms
                  </span>
                  <Badge variant={func.status === 'healthy' ? 'default' : 'destructive'}>
                    {func.status === 'healthy' ? 'Saudável' : func.status === 'degraded' ? 'Lento' : 'Fora'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Deployment Info */}
          <div className="pt-4 border-t text-sm text-muted-foreground">
            <p>
              Última verificação:{" "}
              {format(new Date(health.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
            </p>
            <p>
              Deploy: {health.deployment.version} •{" "}
              {format(new Date(health.deployment.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
