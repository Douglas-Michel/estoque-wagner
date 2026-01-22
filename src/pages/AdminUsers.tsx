import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, ShieldOff, CheckCircle, XCircle, Clock, Pause, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'inactive';
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userStatus, setUserStatus] = useState<string>('approved');

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check admin status before rendering anything
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!data) {
        navigate('/', { replace: true });
        return;
      }

      // Get user status
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();
      
      if (profile?.status) {
        setUserStatus(profile.status);
      }

      setIsAdmin(true);
      fetchUsers();
    };

    checkAccess();
  }, [user, authLoading, navigate]);

  // Monitor status changes
  useEffect(() => {
    if (!user || authLoading || !isAdmin) return;

    const profileChannel = supabase
      .channel('profile-status-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const nextStatus = (payload as any)?.new?.status;
          if (nextStatus) {
            setUserStatus(nextStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user, authLoading, isAdmin]);

  // Auto-logout if inactive or rejected
  useEffect(() => {
    if (!user || authLoading) return;
    
    if (userStatus === 'inactive' || userStatus === 'rejected') {
      setTimeout(async () => {
        await signOut();
        toast({
          title: 'Acesso bloqueado',
          description: userStatus === 'inactive' 
            ? 'Seu acesso está pausado' 
            : 'Seu acesso foi rejeitado',
          variant: 'destructive'
        });
        navigate('/auth');
      }, 100);
    }
  }, [userStatus, user, authLoading]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all users from profiles with email
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, status');
      
      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');
      
      if (rolesError) throw rolesError;

      const adminIds = new Set(roles?.map(r => r.user_id) || []);

      // Map profiles to users with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: (profile as any).email || '',
        full_name: profile.full_name || '',
        is_admin: adminIds.has(profile.id),
        status: (profile as any).status || 'approved'
      }));

      // Sort: pending first, then approved, then inactive, then rejected
      usersWithRoles.sort((a, b) => {
        const order = { pending: 0, approved: 1, inactive: 2, rejected: 3 };
        return order[a.status] - order[b.status];
      });

      setUsers(usersWithRoles);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Permissões de admin removidas"
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Usuário promovido a administrador"
        });
      }
      
      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as permissões",
        variant: "destructive"
      });
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'approved' | 'rejected' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      const messages = {
        approved: "Usuário aprovado com sucesso",
        rejected: "Acesso rejeitado",
        inactive: "Usuário pausado com sucesso"
      };
      
      toast({
        title: "Sucesso",
        description: messages[newStatus]
      });
      
      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso"
      });
      
      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive"
      });
    }
  };

  // Don't render anything until admin check completes
  if (isAdmin === null || authLoading || loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold">Gerenciamento de Usuários</h1>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl">Usuários do Sistema</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Gerencie permissões de administrador para controle total do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 sm:p-6 sm:pt-0">
            {users.map(user => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-sm sm:text-base truncate">{user.full_name || 'Sem nome'}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  {user.status === 'pending' && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                  {user.status === 'approved' && (
                    <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aprovado
                    </Badge>
                  )}
                  {user.status === 'rejected' && (
                    <Badge variant="outline" className="text-xs border-red-500 text-red-700 dark:text-red-400">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejeitado
                    </Badge>
                  )}
                  {user.status === 'inactive' && (
                    <Badge variant="outline" className="text-xs border-gray-500 text-gray-700 dark:text-gray-400">
                      <Pause className="h-3 w-3 mr-1" />
                      Pausado
                    </Badge>
                  )}
                  
                  {user.is_admin && (
                    <Badge variant="default" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  
                  {user.status === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs"
                        onClick={() => updateUserStatus(user.id, 'approved')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => updateUserStatus(user.id, 'rejected')}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                  
                  {user.status === 'approved' && (
                    <>
                      <Button
                        variant={user.is_admin ? "destructive" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                      >
                        {user.is_admin ? (
                          <>
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Remover Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Tornar Admin
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => updateUserStatus(user.id, 'inactive')}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pausar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </>
                  )}
                  
                  {user.status === 'inactive' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs"
                        onClick={() => updateUserStatus(user.id, 'approved')}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Reativar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
