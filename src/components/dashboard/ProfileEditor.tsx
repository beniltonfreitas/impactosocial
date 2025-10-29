import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  avatar_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileEditor() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || '',
    },
  });

  const avatarUrl = watch('avatar_url');

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await updateProfile(data);
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || profile?.avatar_url || ''} />
          <AvatarFallback className="text-2xl">
            {profile?.full_name ? getInitials(profile.full_name) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h3 className="font-medium">Foto de Perfil</h3>
          <p className="text-sm text-muted-foreground">
            Cole a URL de uma imagem ou deixe em branco para usar suas iniciais
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Nome Completo</Label>
        <Input
          id="full_name"
          {...register('full_name')}
          placeholder="Seu nome completo"
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar_url">URL do Avatar</Label>
        <Input
          id="avatar_url"
          {...register('avatar_url')}
          placeholder="https://exemplo.com/avatar.jpg"
        />
        {errors.avatar_url && (
          <p className="text-sm text-destructive">{errors.avatar_url.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Alterações
      </Button>
    </form>
  );
}
