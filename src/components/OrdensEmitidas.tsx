import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { OrdemSaidaStorage } from '@/lib/ordem-saida-storage';
import { PDFGenerator } from '@/lib/pdf-generator';
import { OrdemSaida, ORDEM_STATUS_LABELS } from '@/types/ordem-saida';
import { FileText, Printer, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';
import { EditOrdemDialog } from '@/components/EditOrdemDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function OrdensEmitidas() {
  const [ordens, setOrdens] = useState<OrdemSaida[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemSaida | null>(null);
  const { toast } = useToast();

  const loadOrdens = async () => {
    setLoading(true);
    try {
      const data = await OrdemSaidaStorage.getOrdens();
      setOrdens(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar ordens de saída',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdens();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('ordens-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordens_saida'
        },
        (payload) => {
          console.log('Ordem atualizada em tempo real:', payload);
          // Reload all orders when any change occurs
          loadOrdens();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleReimprimir = async (ordemId: string) => {
    try {
      const ordem = await OrdemSaidaStorage.getOrdem(ordemId);
      if (ordem) {
        PDFGenerator.gerarOrdemSaida(ordem);
        toast({
          title: 'Sucesso',
          description: 'PDF gerado com sucesso!'
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF',
        variant: 'destructive'
      });
    }
  };

  const handleAtualizarStatus = async (ordemId: string, novoStatus: string) => {
    try {
      await OrdemSaidaStorage.atualizarStatus(
        ordemId,
        novoStatus as 'em_separacao' | 'aguardando_envio' | 'concluida' | 'cancelada'
      );
      
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso!'
      });
      
      loadOrdens();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'em_separacao':
        return <Clock className="h-4 w-4" />;
      case 'aguardando_envio':
        return <FileText className="h-4 w-4" />;
      case 'concluida':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelada':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'em_separacao':
        return 'secondary';
      case 'aguardando_envio':
        return 'default';
      case 'concluida':
        return 'default';
      case 'cancelada':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ordens Emitidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ordens Emitidas ({ordens.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ordens.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma ordem emitida ainda
          </p>
        ) : (
          <div className="space-y-3">
            {ordens.map((ordem) => (
              <div
                key={ordem.id}
                className="p-4 border rounded-lg space-y-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        {ordem.numero_ordem}
                      </span>
                      <Badge variant={getStatusVariant(ordem.status)} className="flex items-center gap-1">
                        {getStatusIcon(ordem.status)}
                        {ORDEM_STATUS_LABELS[ordem.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Emitido por: {ordem.usuario_nome || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Data: {format(ordem.data_emissao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {ordem.itens && (
                      <p className="text-sm text-muted-foreground">
                        Itens: {ordem.itens.length}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrdem(ordem);
                        setEditDialogOpen(true);
                      }}
                      title="Editar ordem"
                      disabled={ordem.status === 'concluida' || ordem.status === 'cancelada'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReimprimir(ordem.id)}
                      title="Reimprimir PDF"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={ordem.status}
                    onValueChange={(value) => handleAtualizarStatus(ordem.id, value)}
                    disabled={ordem.status === 'concluida' || ordem.status === 'cancelada'}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_separacao">Em Separação</SelectItem>
                      <SelectItem value="aguardando_envio">Aguardando Envio</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  {(ordem.status === 'concluida' || ordem.status === 'cancelada') && (
                    <span className="text-xs text-muted-foreground">
                      Status bloqueado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {selectedOrdem && (
        <EditOrdemDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          ordem={selectedOrdem}
          onSuccess={loadOrdens}
        />
      )}
    </Card>
  );
}
