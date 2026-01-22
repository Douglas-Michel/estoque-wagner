import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbList, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';

interface DashboardHeaderProps {
  activeTab: string;
}

const tabLabels: Record<string, string> = {
  overview: 'Visão Geral',
  towers: 'Estoque',
  entry: 'Nova Entrada de Estoque',
  search: 'Consultar Estoque',
  movements: 'Movimentações e Relatórios',
  relatorio: 'Relatórios de Entrada',
};

export function DashboardHeader({ activeTab }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">
              {tabLabels[activeTab] || 'Dashboard'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-normal">
          Tarugo & Lingote
        </Badge>
      </div>
    </header>
  );
}
