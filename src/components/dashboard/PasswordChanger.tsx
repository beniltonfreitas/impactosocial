import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, X } from 'lucide-react';

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function PasswordChanger() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Média', color: 'bg-yellow-500' };
    return { score, label: 'Forte', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength();

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);
    try {
      const { data: functionData, error } = await supabase.functions.invoke('update-password', {
        body: { newPassword: data.newPassword },
      });

      if (error) throw error;
      if (!functionData?.success) throw new Error('Falha ao atualizar senha');

      toast({
        title: 'Senha atualizada',
        description: 'Sua senha foi alterada com sucesso.',
      });
      reset();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar senha',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova Senha</Label>
        <Input
          id="newPassword"
          type="password"
          {...register('newPassword')}
          placeholder="Digite sua nova senha"
        />
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}
        
        {newPassword && (
          <div className="space-y-2 mt-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${strength.color}`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{strength.label}</span>
            </div>
            <ul className="text-xs space-y-1">
              <li className="flex items-center gap-1">
                {newPassword.length >= 8 ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                Pelo menos 8 caracteres
              </li>
              <li className="flex items-center gap-1">
                {/[A-Z]/.test(newPassword) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                Letra maiúscula
              </li>
              <li className="flex items-center gap-1">
                {/[a-z]/.test(newPassword) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                Letra minúscula
              </li>
              <li className="flex items-center gap-1">
                {/[0-9]/.test(newPassword) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                Número
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          placeholder="Digite novamente sua nova senha"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Alterar Senha
      </Button>
    </form>
  );
}
