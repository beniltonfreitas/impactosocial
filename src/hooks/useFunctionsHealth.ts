import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FunctionStatus = 'healthy' | 'degraded' | 'down';

export interface FunctionHealth {
  status: FunctionStatus;
  latency: number;
  lastChecked: string;
  error?: string;
}

export interface HealthData {
  status: FunctionStatus;
  timestamp: string;
  functions: Record<string, FunctionHealth>;
  deployment: {
    version: string;
    timestamp: string;
  };
}

export function useFunctionsHealth() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      
      if (!error && data) {
        setHealth(data as HealthData);
      }
    } catch (error) {
      console.error('Error checking functions health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { health, loading, refresh: checkHealth };
}
