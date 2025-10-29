import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Shield, User, UserCog, BarChart3 } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

export default function Admin() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (profilesError) {
      toast({
        title: "Erro ao carregar usuários",
        description: profilesError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Get auth users (admin only operation - would need edge function in production)
    // For now, combine profiles with roles
    const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
      id: profile.id,
      email: `user-${profile.id.slice(0, 8)}@email.com`, // Placeholder - would need edge function
      full_name: profile.full_name,
      roles: rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || [],
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Type guard to ensure role is valid
    if (newRole !== 'admin' && newRole !== 'moderator' && newRole !== 'user') {
      return;
    }

    // First, remove all existing roles for this user
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      toast({
        title: "Erro ao atualizar permissão",
        description: deleteError.message,
        variant: "destructive",
      });
      return;
    }

    // Then add the new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role: newRole as 'admin' | 'moderator' | 'user' }]);

    if (insertError) {
      toast({
        title: "Erro ao atualizar permissão",
        description: insertError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Permissão atualizada",
      description: "As permissões do usuário foram atualizadas com sucesso.",
    });

    fetchUsers();
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'admin') return 'default';
    if (role === 'moderator') return 'secondary';
    return 'outline';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Shield className="h-4 w-4" />;
    if (role === 'moderator') return <UserCog className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  if (!hasRole('admin') && !hasRole('moderator')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Administração</h1>
            <p className="text-muted-foreground">Gerencie usuários, permissões e analytics do sistema</p>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users" className="gap-2">
                <UserCog className="h-4 w-4" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>
                    Gerencie as permissões dos usuários registrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Permissão Atual</TableHead>
                          <TableHead>Alterar Permissão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {user.roles.map(role => (
                                  <Badge key={role} variant={getRoleBadgeVariant(role)} className="gap-1">
                                    {getRoleIcon(role)}
                                    {role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderador' : 'Usuário'}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasRole('admin') && (
                                <Select
                                  value={user.roles[0] || 'user'}
                                  onValueChange={(value) => handleRoleChange(user.id, value)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Usuário</SelectItem>
                                    <SelectItem value="moderator">Moderador</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
