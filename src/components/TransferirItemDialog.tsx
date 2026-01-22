import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { InventoryStorage } from '@/lib/storage';
import { InventoryItem, TowerPosition } from '@/types/inventory';
import { loadTowerConfig, getAvailablePositions } from '@/lib/tower-config';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight } from 'lucide-react';

interface TransferirItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

export function TransferirItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess
}: TransferirItemDialogProps) {
  const [novaColuna, setNovaColuna] = useState('');
  const [novoAndar, setNovoAndar] = useState('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [availableFloors, setAvailableFloors] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPositions();
      setNovaColuna('');
      setNovoAndar('');
    }
  }, [open]);

  const loadPositions = async () => {
    try {
      const config = await loadTowerConfig();
      const positions = getAvailablePositions(config);
      
      // Get unique columns and floors
      const columns = [...new Set(positions.map(p => p.column))];
      const floors = [...new Set(positions.map(p => p.floor))].sort((a, b) => a - b);
      
      setAvailableColumns(columns);
      setAvailableFloors(floors);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const handleTransfer = async () => {
    if (!item || !novaColuna || !novoAndar) {
      toast({
        title: 'Erro',
        description: 'Selecione a nova posição',
        variant: 'destructive'
      });
      return;
    }

    const posicaoAtual = `${item.position.column}${item.position.floor}`;
    const novaPosicao = `${novaColuna}${novoAndar}`;

    if (posicaoAtual === novaPosicao) {
      toast({
        title: 'Erro',
        description: 'A nova posição não pode ser igual à posição atual',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const success = await InventoryStorage.updateItem(item.id, {
        position: {
          column: novaColuna as any,
          floor: parseInt(novoAndar) as any,
          toString: () => novaPosicao
        }
      });

      if (success) {
        toast({
          title: 'Sucesso',
          description: `Item transferido de ${posicaoAtual} para ${novaPosicao}`
        });

        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error('Falha ao transferir item');
      }
    } catch (error) {
      console.error('Error transferring item:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao transferir item',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir Item</DialogTitle>
          <DialogDescription>
            Altere a posição do item no pavilhão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{item.codigo}</span>
                <Badge variant="outline">{item.tipo}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {item.nome || 'Sem descrição'}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-occupied" />
                <span className="font-medium">
                  Posição atual: {item.position.column}{item.position.floor}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Quantidade: {item.quantidade} unidades
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center py-2">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coluna">Nova Coluna</Label>
              <Select value={novaColuna} onValueChange={setNovaColuna}>
                <SelectTrigger id="coluna">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      Coluna {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="andar">Novo Andar</Label>
              <Select value={novoAndar} onValueChange={setNovoAndar}>
                <SelectTrigger id="andar">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFloors.map((floor) => (
                    <SelectItem key={floor} value={floor.toString()}>
                      Andar {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {novaColuna && novoAndar && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-medium text-center">
                Nova posição: {novaColuna}{novoAndar}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleTransfer} disabled={saving || !novaColuna || !novoAndar}>
            {saving ? 'Transferindo...' : 'Transferir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
