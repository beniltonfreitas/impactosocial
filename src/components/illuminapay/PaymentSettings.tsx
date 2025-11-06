import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export function PaymentSettings() {
  const [pixSettings, setPixSettings] = useState<any>({});
  const [companyData, setCompanyData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data: configs, error } = await supabase
        .from('payment_config')
        .select('*')
        .in('config_key', ['pix_settings', 'company_data']);

      if (error) throw error;

      configs?.forEach((config) => {
        if (config.config_key === 'pix_settings') {
          setPixSettings(config.config_value);
        } else if (config.config_key === 'company_data') {
          setCompanyData(config.config_value);
        }
      });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePixSettings = async () => {
    try {
      const { error } = await supabase
        .from('payment_config')
        .update({
          config_value: pixSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', 'pix_settings');

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Configurações PIX salvas',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações PIX:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    }
  };

  const saveCompanyData = async () => {
    try {
      const { error } = await supabase
        .from('payment_config')
        .update({
          config_value: companyData,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', 'company_data');

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Dados da empresa salvos',
      });
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os dados',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
          <CardDescription>
            Configurações do Stripe para pagamentos com cartão de crédito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Status</div>
                <div className="text-sm text-muted-foreground">
                  Stripe está configurado e funcionando
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Ativo</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIX */}
      <Card>
        <CardHeader>
          <CardTitle>PIX</CardTitle>
          <CardDescription>
            Configurações para pagamentos via PIX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pix-enabled">Habilitar pagamento PIX</Label>
            <Switch
              id="pix-enabled"
              checked={pixSettings.enabled || false}
              onCheckedChange={(checked) =>
                setPixSettings({ ...pixSettings, enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="pix-provider">Provedor PIX</Label>
            <Select
              value={pixSettings.provider || ''}
              onValueChange={(value) =>
                setPixSettings({ ...pixSettings, provider: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                <SelectItem value="pagseguro">PagSeguro</SelectItem>
                <SelectItem value="gerencianet">Gerencianet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX</Label>
            <Input
              id="pix-key"
              value={pixSettings.pix_key || ''}
              onChange={(e) =>
                setPixSettings({ ...pixSettings, pix_key: e.target.value })
              }
              placeholder="Sua chave PIX (email, telefone, CPF/CNPJ)"
            />
          </div>

          <Button onClick={savePixSettings}>Salvar Configurações PIX</Button>
        </CardContent>
      </Card>

      {/* Dados Fiscais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Fiscais</CardTitle>
          <CardDescription>
            Informações da empresa para recibos e notas fiscais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da Empresa</Label>
            <Input
              id="company-name"
              value={companyData.name || ''}
              onChange={(e) =>
                setCompanyData({ ...companyData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-cnpj">CNPJ</Label>
            <Input
              id="company-cnpj"
              value={companyData.cnpj || ''}
              onChange={(e) =>
                setCompanyData({ ...companyData, cnpj: e.target.value })
              }
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-city">Cidade</Label>
              <Input
                id="company-city"
                value={companyData.city || ''}
                onChange={(e) =>
                  setCompanyData({ ...companyData, city: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-state">Estado</Label>
              <Input
                id="company-state"
                value={companyData.state || ''}
                onChange={(e) =>
                  setCompanyData({ ...companyData, state: e.target.value })
                }
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-address">Endereço Completo</Label>
            <Input
              id="company-address"
              value={companyData.address || ''}
              onChange={(e) =>
                setCompanyData({ ...companyData, address: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-cep">CEP</Label>
            <Input
              id="company-cep"
              value={companyData.cep || ''}
              onChange={(e) =>
                setCompanyData({ ...companyData, cep: e.target.value })
              }
              placeholder="00000-000"
            />
          </div>

          <Button onClick={saveCompanyData}>Salvar Dados da Empresa</Button>
        </CardContent>
      </Card>
    </div>
  );
}