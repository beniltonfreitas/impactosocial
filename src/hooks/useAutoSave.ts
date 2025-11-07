import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  onStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 3000,
  enabled = true,
  onStatusChange
}: UseAutoSaveOptions<T>) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>();
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current || !enabled) return;

    const currentData = JSON.stringify(data);
    
    // Não salvar se os dados não mudaram
    if (currentData === previousDataRef.current) {
      return;
    }

    isSavingRef.current = true;
    onStatusChange?.('saving');

    try {
      await onSave(data);
      previousDataRef.current = currentData;
      onStatusChange?.('saved');
      
      // Voltar para idle após 2 segundos
      setTimeout(() => {
        onStatusChange?.('idle');
      }, 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      onStatusChange?.('error');
      toast({
        title: 'Erro ao salvar automaticamente',
        description: 'Suas alterações não foram salvas. Tente salvar manualmente.',
        variant: 'destructive',
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [data, enabled, onSave, onStatusChange, toast]);

  useEffect(() => {
    if (!enabled) return;

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Criar novo timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  return { save };
}
