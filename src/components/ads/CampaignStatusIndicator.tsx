import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { differenceInDays, isBefore } from "date-fns";

interface CampaignStatusIndicatorProps {
  campaign: {
    status: string;
    start_at: string;
    end_at: string | null;
  };
}

export function CampaignStatusIndicator({ campaign }: CampaignStatusIndicatorProps) {
  const now = new Date();
  const startDate = new Date(campaign.start_at);
  const endDate = campaign.end_at ? new Date(campaign.end_at) : null;

  // Campanha agendada (ainda não começou)
  if (isBefore(now, startDate)) {
    const daysUntilStart = differenceInDays(startDate, now);
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="w-3 h-3" />
        Inicia em {daysUntilStart} {daysUntilStart === 1 ? 'dia' : 'dias'}
      </Badge>
    );
  }

  // Campanha ativa
  if (campaign.status === 'active') {
    if (endDate) {
      const daysUntilEnd = differenceInDays(endDate, now);
      
      if (daysUntilEnd <= 1) {
        return (
          <Badge variant="destructive" className="gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Expira {daysUntilEnd === 0 ? 'hoje' : 'amanhã'}
          </Badge>
        );
      }
      
      if (daysUntilEnd <= 3) {
        return (
          <Badge className="gap-1 bg-orange-500 hover:bg-orange-600">
            <AlertTriangle className="w-3 h-3" />
            Expira em {daysUntilEnd} dias
          </Badge>
        );
      }
    }

    return (
      <Badge className="gap-1 bg-green-500 hover:bg-green-600">
        <CheckCircle className="w-3 h-3" />
        Ativa
      </Badge>
    );
  }

  // Campanha pausada
  if (campaign.status === 'paused') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="w-3 h-3" />
        Pausada
      </Badge>
    );
  }

  // Campanha finalizada
  return (
    <Badge variant="outline" className="gap-1">
      <XCircle className="w-3 h-3" />
      Finalizada
    </Badge>
  );
}
