import { Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileEditor } from '@/components/dashboard/ProfileEditor';
import { PasswordChanger } from '@/components/dashboard/PasswordChanger';
import { SubscriptionManager } from '@/components/dashboard/SubscriptionManager';
import { PreferencesEditor } from '@/components/dashboard/PreferencesEditor';
import { PushToggle } from '@/components/notifications/PushToggle';
import { Shield, User, Bell, Settings, Lock, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const { profile, roles, hasRole } = useAuth();

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meu Painel</h1>
            <p className="text-muted-foreground">Gerencie sua conta e preferências</p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="subscription">
                <CreditCard className="h-4 w-4 mr-2" />
                Assinatura
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings className="h-4 w-4 mr-2" />
                Preferências
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="h-4 w-4 mr-2" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais e foto de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-6 pb-6 border-b">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(profile?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="text-lg font-medium">{profile?.full_name || 'Usuário'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Permissões</p>
                        <div className="flex flex-wrap gap-2">
                          {roles.map(role => (
                            <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                              {role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                              {role === 'moderator' && <Shield className="h-3 w-3 mr-1" />}
                              {role === 'user' && <User className="h-3 w-3 mr-1" />}
                              {role === 'admin' ? 'Administrador' : role === 'moderator' ? 'Moderador' : 'Usuário'}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {(hasRole('admin') || hasRole('moderator')) && (
                        <Button asChild size="sm" variant="outline">
                          <Link to="/admin">
                            <Shield className="h-4 w-4 mr-2" />
                            Acessar Painel Administrativo
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  <ProfileEditor />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Assinatura</CardTitle>
                  <CardDescription>
                    Veja e gerencie seu plano de assinatura premium
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências</CardTitle>
                  <CardDescription>
                    Personalize sua experiência no portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PreferencesEditor />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Segurança da Conta</CardTitle>
                  <CardDescription>
                    Altere sua senha e gerencie configurações de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordChanger />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações Push
                  </CardTitle>
                  <CardDescription>
                    Receba alertas instantâneos de notícias urgentes diretamente no seu dispositivo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PushToggle />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
