import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Plus, Package, MapPin, Activity, FileText, CheckSquare, Cylinder, Box } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InventoryItem, StockMovement, TowerPosition, ITEM_TYPE_LABELS } from '@/types/inventory';
import { InventoryStorage, MovementStorage } from '@/lib/storage';
import { StockEntryForm } from './StockEntryForm';
import { StockTableView } from './StockTableView';
import { TowerVisualization } from './TowerVisualization';
import { SearchForm } from './SearchForm';
import { MovementsList } from './MovementsList';
import { RelatorioEntradas } from './RelatorioEntradas';
import { OrdemSaidaDialog } from './OrdemSaidaDialog';
import { SelecionarItensDialog } from './SelecionarItensDialog';
import { TransferirItemDialog } from './TransferirItemDialog';
import { AppSidebar } from './AppSidebar';
import { DashboardHeader } from './DashboardHeader';
import { OrdemSaidaItem } from '@/types/ordem-saida';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { loadTowerConfig, getAvailablePositions, TowerConfig } from '@/lib/tower-config';

export function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [positions, setPositions] = useState<TowerPosition[]>([]);
  const [towerConfig, setTowerConfig] = useState<TowerConfig>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userStatus, setUserStatus] = useState<string>('approved');
  const [itensSelecionados, setItensSelecionados] = useState<OrdemSaidaItem[]>([]);
  const [selecionarDialogOpen, setSelecionarDialogOpen] = useState(false);
  const [ordemDialogOpen, setOrdemDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [itemToTransfer, setItemToTransfer] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [newItems, newMovements, newPositions, config, profile, adminRole] = await Promise.all([
        InventoryStorage.getItems(),
        MovementStorage.getMovements(),
        InventoryStorage.getAvailablePositions(),
        loadTowerConfig(),
        user?.id ? supabase.from('profiles').select('full_name, status').eq('id', user.id).single() : null,
        user?.id ? supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single() : null
      ]);
      
      if (profile?.data?.full_name) {
        setUserName(profile.data.full_name);
      }

      if (profile?.data?.status) {
        setUserStatus(profile.data.status);
      }

      if (adminRole?.data) {
        setIsAdmin(true);
      }
      
      setItems(newItems);
      setMovements(newMovements);
      setPositions(newPositions);
      setTowerConfig(config);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    loadData();

    const inventoryChannel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => loadData())
      .subscribe();

    const ordensChannel = supabase
      .channel('ordens-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_saida' }, () => loadData())
      .subscribe();

    const profileChannel = supabase
      .channel('profile-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
        const nextStatus = (payload as any)?.new?.status;
        if (nextStatus) {
          setUserStatus(nextStatus);
          if (nextStatus === 'inactive' || nextStatus === 'rejected') {
            setTimeout(async () => {
              await signOut();
              toast({
                title: 'Acesso bloqueado',
                description: nextStatus === 'inactive' ? 'Seu acesso foi pausado pelo administrador' : 'Seu acesso foi rejeitado pelo administrador',
                variant: 'destructive'
              });
              navigate('/auth');
            }, 100);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(ordensChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || authLoading) return;
    if (userStatus === 'inactive' || userStatus === 'rejected') {
      setTimeout(async () => {
        await signOut();
        toast({
          title: 'Acesso bloqueado',
          description: userStatus === 'inactive' ? 'Seu acesso está pausado' : 'Seu acesso foi rejeitado',
          variant: 'destructive'
        });
        navigate('/auth');
      }, 100);
    }
  }, [userStatus, user, authLoading]);

  const handleStockEntry = async (newItem: InventoryItem) => {
    const [newItems, newMovements, newPositions] = await Promise.all([
      InventoryStorage.getItems(),
      MovementStorage.getMovements(),
      InventoryStorage.getAvailablePositions()
    ]);
    
    setItems(newItems);
    setMovements(newMovements);
    setPositions(newPositions);
    
    toast({
      title: 'Item adicionado',
      description: `${newItem.codigo} foi adicionado ao estoque na posição ${newItem.position.column}${newItem.position.floor}`,
    });
  };

  const handleStockExit = async (itemId: string, quantidade: number) => {
    const success = await InventoryStorage.removeQuantity(itemId, quantidade);
    if (success) {
      await loadData();
      toast({ title: 'Saída registrada', description: `${quantidade} unidades foram retiradas do estoque` });
    } else {
      toast({ title: 'Erro na saída', description: 'Quantidade insuficiente em estoque', variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Logout realizado', description: 'Até logo!' });
    navigate('/auth');
  };

  const handleIniciarNovaOrdem = () => setSelecionarDialogOpen(true);

  const handleConfirmarSelecao = (itens: OrdemSaidaItem[]) => {
    setItensSelecionados(itens);
    setSelecionarDialogOpen(false);
    setOrdemDialogOpen(true);
  };

  const handleOrdemCriada = () => {
    setItensSelecionados([]);
    loadData();
  };

  const handleTransferItem = (item: InventoryItem) => {
    setItemToTransfer(item);
    setTransferDialogOpen(true);
  };

  const handleTransferSuccess = () => {
    loadData();
    toast({ title: 'Item transferido', description: 'A posição do item foi atualizada com sucesso' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando estoque...</p>
        </div>
      </div>
    );
  }

  if (userStatus === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Activity className="h-6 w-6" />
              Aguardando Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Sua conta foi criada com sucesso! No momento, ela está aguardando aprovação de um administrador.
            </p>
            <Button onClick={handleSignOut} variant="outline" className="w-full">Sair</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Activity className="h-6 w-6" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Seu acesso ao sistema foi negado. Entre em contato com o administrador.
            </p>
            <Button onClick={handleSignOut} variant="outline" className="w-full">Sair</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantidade, 0);
  const occupiedPositions = positions.filter(p => p.occupied).length;
  const totalPositions = getAvailablePositions(towerConfig).length;
  const availablePositions = totalPositions - occupiedPositions;
  const recentMovements = movements.slice(-5);

  // Count by type
  const tarugos = items.filter(i => i.tipo === 'tarugo');
  const lingotes = items.filter(i => i.tipo === 'lingote');
  const totalPesoBruto = items.reduce((sum, item) => sum + (item.peso_bruto || 0), 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card border shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Tarugos</p>
                      <p className="text-2xl font-bold mt-1">{tarugos.reduce((sum, i) => sum + i.quantidade, 0)}</p>
                      <p className="text-xs text-muted-foreground">{tarugos.length} itens</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cylinder className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Lingotes</p>
                      <p className="text-2xl font-bold mt-1">{lingotes.reduce((sum, i) => sum + i.quantidade, 0)}</p>
                      <p className="text-xs text-muted-foreground">{lingotes.length} itens</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Box className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Peso Total</p>
                      <p className="text-2xl font-bold mt-1">{totalPesoBruto.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">kg (bruto)</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                      <Package className="h-6 w-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Posições</p>
                      <p className="text-2xl font-bold mt-1">{occupiedPositions}/{totalPositions}</p>
                      <p className="text-xs text-muted-foreground">{availablePositions} livres</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-accent-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Items and Movements */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4 text-primary" />
                    Últimos Itens Adicionados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {items.length > 0 ? (
                    <div className="space-y-2">
                      {items.slice(-5).reverse().map((item) => {
                        const TypeIcon = item.tipo === 'tarugo' ? Cylinder : Box;
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <TypeIcon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{item.codigo}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {ITEM_TYPE_LABELS[item.tipo as keyof typeof ITEM_TYPE_LABELS]}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.position.column}{item.position.floor} • {item.quantidade} un. • {item.peso_bruto || 0} kg
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum item no estoque</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-warning" />
                    Últimas Movimentações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentMovements.length > 0 ? (
                    <div className="space-y-2">
                      {recentMovements.reverse().map((movement) => (
                        <div key={movement.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div className={`h-2 w-2 rounded-full ${movement.tipo === 'entrada' ? 'bg-success' : 'bg-destructive'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant={movement.tipo === 'entrada' ? 'default' : 'secondary'} className="text-[10px]">
                                {movement.tipo}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(movement.timestamp, 'dd/MM HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {movement.position.column}{movement.position.floor} • {movement.quantidade} un.
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhuma movimentação</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'entry':
        return (
          <div className="animate-fade-in">
            <StockEntryForm 
              onStockEntry={handleStockEntry} 
              availablePositions={positions.filter(p => {
                if (p.occupied) return false;
                const dynamicPositions = getAvailablePositions(towerConfig);
                return dynamicPositions.some(dp => dp.column === p.position.column && dp.floor === p.position.floor);
              })} 
            />
          </div>
        );

      case 'search':
        return (
          <div className="animate-fade-in">
            <StockTableView items={items} onUpdate={loadData} />
          </div>
        );

      case 'towers':
        return (
          <div className="animate-fade-in">
            <StockTableView items={items} onUpdate={loadData} showAllByDefault={true} />
          </div>
        );

      case 'relatorio':
        return (
          <div className="animate-fade-in">
            <RelatorioEntradas items={items} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        isAdmin={isAdmin}
        userName={userName}
        userEmail={user?.email || ''}
        onSignOut={handleSignOut}
        onNewOrder={handleIniciarNovaOrdem}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={{
          totalItems,
          occupiedPositions,
          availablePositions
        }}
      />
      
      <SidebarInset className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader activeTab={activeTab} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {renderContent()}
        </main>
      </SidebarInset>

      <SelecionarItensDialog
        open={selecionarDialogOpen}
        onOpenChange={setSelecionarDialogOpen}
        items={items}
        onConfirmar={handleConfirmarSelecao}
      />

      <OrdemSaidaDialog
        open={ordemDialogOpen}
        onOpenChange={setOrdemDialogOpen}
        itensSelecionados={itensSelecionados}
        onSuccess={handleOrdemCriada}
      />

      <TransferirItemDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        item={itemToTransfer}
        onSuccess={handleTransferSuccess}
      />
    </SidebarProvider>
  );
}
