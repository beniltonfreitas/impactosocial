import { LucideIcon, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PermissionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  permission: string;
  route: string;
  gradient?: string;
}

export function PermissionCard({
  title,
  description,
  icon: Icon,
  permission,
  route,
  gradient = 'from-primary to-primary/80'
}: PermissionCardProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const hasAccess = hasPermission(permission);

  const handleClick = () => {
    if (!hasAccess) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta funcionalidade.",
        variant: "destructive",
      });
      return;
    }
    navigate(route);
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer group ${
        !hasAccess ? 'opacity-60' : ''
      }`}
      onClick={handleClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          {!hasAccess && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Bloqueado
            </Badge>
          )}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Button 
          variant={hasAccess ? "default" : "outline"} 
          className="w-full"
          disabled={!hasAccess}
        >
          {hasAccess ? 'Acessar' : 'Sem Permissão'}
        </Button>
      </CardContent>
    </Card>
  );
}
