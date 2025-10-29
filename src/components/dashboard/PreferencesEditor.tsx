import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Preferences {
  favorite_categories: string[];
  email_notifications: boolean;
  push_notifications: boolean;
}

export function PreferencesEditor() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({
    favorite_categories: [],
    email_notifications: true,
    push_notifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    loadPreferences();
  }, [profile]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = () => {
    if (profile?.preferences) {
      setPreferences(profile.preferences as Preferences);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setPreferences(prev => {
      const current = prev.favorite_categories || [];
      const updated = current.includes(categoryId)
        ? current.filter(id => id !== categoryId)
        : [...current, categoryId];
      
      return { ...prev, favorite_categories: updated };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ preferences });
      toast({
        title: 'Preferências salvas',
        description: 'Suas configurações foram atualizadas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-3">Categorias Favoritas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Selecione as categorias de notícias que mais lhe interessam
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={preferences.favorite_categories?.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <Label htmlFor={category.id} className="cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Notificações</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure como deseja receber atualizações
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba resumos diários e notícias importantes por email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, email_notifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas instantâneos de notícias urgentes
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={preferences.push_notifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, push_notifications: checked }))
              }
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar Preferências
      </Button>
    </div>
  );
}
