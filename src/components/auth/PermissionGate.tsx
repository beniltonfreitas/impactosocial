import { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGate({ 
  children, 
  permission, 
  fallback,
  showMessage = true 
}: PermissionGateProps) {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    if (fallback) return <>{fallback}</>;
    
    if (showMessage) {
      return (
        <Alert variant="destructive" className="m-4">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta funcionalidade. 
            Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}
