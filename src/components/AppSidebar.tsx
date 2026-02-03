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
  { id: 'towers', label: 'Estoque', icon: Package },
  { id: 'entry', label: 'Nova Entrada', icon: Plus },
  { id: 'search', label: 'Busca Avançada', icon: Search },
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
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {isCollapsed ? (
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sidebar-foreground text-base">Estoque</span>
                  <span className="text-xs text-sidebar-foreground/60">Gestão de Materiais</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        {isCollapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors mt-2 mx-auto"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Quick Action */}
        <SidebarGroup className="py-4">
          <Button 
            onClick={onNewOrder} 
            className={`w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 ${isCollapsed ? 'h-11 w-11 mx-auto rounded-xl' : 'rounded-lg'}`}
            size={isCollapsed ? "icon" : "default"}
            title={isCollapsed ? "Nova Ordem de Saída" : undefined}
          >
            <Truck className={isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2"} />
            {!isCollapsed && "Nova Ordem de Saída"}
          </Button>
        </SidebarGroup>

        {/* Stats Card */}
        {!isCollapsed && (
          <SidebarGroup className="py-2">
            <div className="mx-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">Estoque Total</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-sidebar-foreground">{stats.totalItems}</span>
                <span className="text-sm text-sidebar-foreground/60 mb-1">itens</span>
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
                      transition-all duration-200 ${isCollapsed ? 'rounded-xl h-11 w-11 mx-auto' : 'rounded-lg'}
                      ${activeTab === item.id 
                        ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-4 border-primary shadow-sm' 
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:border-l-4 hover:border-sidebar-accent'
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
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className="h-10 w-10 rounded-xl text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shrink-0">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {userName || 'Usuário'}
                </span>
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {userEmail}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className="h-9 w-9 rounded-lg text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
