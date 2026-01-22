import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
  Plus, 
  Search, 
  FileText, 
  Truck, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Cylinder,
  Box,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';

interface AppSidebarProps {
  isAdmin: boolean;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
  onNewOrder: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: {
    totalItems: number;
    occupiedPositions: number;
    availablePositions: number;
  };
}

const menuItems = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'towers', label: 'Estoque', icon: MapPin },
  { id: 'entry', label: 'Nova Entrada', icon: Plus },
  { id: 'search', label: 'Consultar Estoque', icon: Search },
  { id: 'movements', label: 'Movimentações', icon: FileText },
  { id: 'relatorio', label: 'Relatórios', icon: BarChart3 },
];

export function AppSidebar({ 
  isAdmin, 
  userName, 
  userEmail, 
  onSignOut, 
  onNewOrder,
  activeTab,
  onTabChange,
  stats
}: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sidebar-foreground">Estoque</span>
                <span className="text-xs text-sidebar-foreground/60">Gestão de Materiais</span>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Quick Action */}
        <SidebarGroup className="py-4">
          <Button 
            onClick={onNewOrder} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-industrial"
            size={isCollapsed ? "icon" : "default"}
          >
            <Truck className={isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2"} />
            {!isCollapsed && "Nova Ordem de Saída"}
          </Button>
        </SidebarGroup>

        {/* Stats Mini Cards */}
        {!isCollapsed && (
          <SidebarGroup className="py-2">
            <div className="grid grid-cols-2 gap-2 px-2">
              <div className="bg-sidebar-accent/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Cylinder className="h-3 w-3 text-primary" />
                  <Box className="h-3 w-3 text-primary" />
                </div>
                <div className="text-lg font-bold text-sidebar-foreground">{stats.totalItems}</div>
                <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wide">Itens</div>
              </div>
              <div className="bg-sidebar-accent/50 rounded-lg p-3 text-center">
                <MapPin className="h-3 w-3 text-available mx-auto mb-1" />
                <div className="text-lg font-bold text-sidebar-foreground">{stats.availablePositions}</div>
                <div className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wide">Livres</div>
              </div>
            </div>
          </SidebarGroup>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            {!isCollapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={isCollapsed ? item.label : undefined}
                    className={`
                      transition-all duration-200
                      ${activeTab === item.id 
                        ? 'bg-primary/20 text-primary border-l-2 border-primary' 
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ordens Link */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            {!isCollapsed && "Ordens"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate('/ordens')}
                  isActive={location.pathname === '/ordens'}
                  tooltip={isCollapsed ? "Ordens Emitidas" : undefined}
                  className={`
                    transition-all duration-200
                    ${location.pathname === '/ordens'
                      ? 'bg-primary/20 text-primary border-l-2 border-primary' 
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                    }
                  `}
                >
                  <FileText className="h-4 w-4" />
                  {!isCollapsed && <span>Ordens Emitidas</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
              {!isCollapsed && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/admin/users')}
                    isActive={location.pathname === '/admin/users'}
                    tooltip={isCollapsed ? "Gerenciar Usuários" : undefined}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    <Settings className="h-4 w-4" />
                    {!isCollapsed && <span>Gerenciar Usuários</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'}`}>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {userName || 'Usuário'}
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                {userEmail}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="h-9 w-9 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
