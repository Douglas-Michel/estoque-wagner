import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { OrdensEmitidas } from '@/components/OrdensEmitidas';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const OrdensPage = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [userStatus, setUserStatus] = useState<string>('approved');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, mounted, navigate]);

  // Check and monitor user status
  useEffect(() => {
    if (!user || authLoading) return;

    const checkStatus = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();
      
      if (data?.status) {
        setUserStatus(data.status);
      }
    };

    checkStatus();

    // Subscribe to status changes
    const profileChannel = supabase
      .channel('profile-status-ordens')
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
  }, [user, authLoading]);

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

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Relatório de Ordens de Saída</h1>
        </div>
        <OrdensEmitidas />
      </div>
    </div>
  );
};

export default OrdensPage;
