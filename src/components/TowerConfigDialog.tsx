import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Settings, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TowerPosition } from '@/types/inventory';
import { saveTowerConfig, TowerConfig } from '@/lib/tower-config';

interface TowerConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnConfig: TowerConfig;
  positions: TowerPosition[];
  onUpdateConfig: (newConfig: TowerConfig) => void;
}

export function TowerConfigDialog({
  open,
  onOpenChange,
  columnConfig,
  positions,
  onUpdateConfig,
}: TowerConfigDialogProps) {
  const [localConfig, setLocalConfig] = useState<{ [column: string]: number[] }>(columnConfig);
  const [newColumn, setNewColumn] = useState('');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [floorsInput, setFloorsInput] = useState('');
  const { toast } = useToast();

  const handleAddColumn = () => {
    const columnUpper = newColumn.toUpperCase().trim();
    
    if (!columnUpper) {
      toast({
        title: 'Campo vazio',
        description: 'Digite uma letra para a coluna',
        variant: 'destructive',
      });
      return;
    }

    if (columnUpper.length !== 1 || !/[A-Z]/.test(columnUpper)) {
      toast({
        title: 'Formato inválido',
        description: 'Use apenas uma letra (A-Z)',
        variant: 'destructive',
      });
      return;
    }

    if (localConfig[columnUpper]) {
      toast({
        title: 'Coluna já existe',
        description: `A coluna ${columnUpper} já está na configuração`,
        variant: 'destructive',
      });
      return;
    }

    setLocalConfig({ ...localConfig, [columnUpper]: [1, 2, 3, 4] });
    setNewColumn('');
    toast({
      title: 'Coluna adicionada',
      description: `Coluna ${columnUpper} foi adicionada com 4 andares`,
    });
  };

  const handleRemoveColumn = (column: string) => {
    const hasItems = positions.some(p => p.position.column === column && p.occupied);
    
    if (hasItems) {
      toast({
        title: 'Não é possível remover',
        description: 'Esta coluna contém itens armazenados',
        variant: 'destructive',
      });
      return;
    }

    const newConfig = { ...localConfig };
    delete newConfig[column];
    setLocalConfig(newConfig);
    toast({
      title: 'Coluna removida',
      description: `Coluna ${column} foi removida`,
    });
  };

  const handleEditColumn = (column: string) => {
    setEditingColumn(column);
    setFloorsInput(localConfig[column].join(', '));
  };

  const handleSaveFloors = () => {
    if (!editingColumn) return;

    const input = floorsInput.trim();
    const floors: number[] = [];

    if (!input) {
      toast({
        title: 'Campo vazio',
        description: 'Digite os andares desejados',
        variant: 'destructive',
      });
      return;
    }

    const parts = input.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end) || start < 1 || end > 99 || start > end) {
          toast({
            title: 'Range inválido',
            description: `O range "${part}" é inválido. Use formato como "1-4"`,
            variant: 'destructive',
          });
          return;
        }
        for (let i = start; i <= end; i++) {
          floors.push(i);
        }
      } else {
        const num = parseInt(part);
        if (isNaN(num) || num < 1 || num > 99) {
          toast({
            title: 'Número inválido',
            description: `"${part}" não é um número válido (use 1-99)`,
            variant: 'destructive',
          });
          return;
        }
        floors.push(num);
      }
    }

    const uniqueFloors = Array.from(new Set(floors)).sort((a, b) => a - b);

    if (uniqueFloors.length === 0) {
      toast({
        title: 'Sem andares',
        description: 'É necessário pelo menos um andar',
        variant: 'destructive',
      });
      return;
    }

    const currentFloors = localConfig[editingColumn];
    const removedFloors = currentFloors.filter(f => !uniqueFloors.includes(f));
    
    for (const floor of removedFloors) {
      const hasItems = positions.some(
        p => p.position.column === editingColumn && p.position.floor === floor && p.occupied
      );
      if (hasItems) {
        toast({
          title: 'Não é possível remover',
          description: `O andar ${floor} da coluna ${editingColumn} contém itens armazenados`,
          variant: 'destructive',
        });
        return;
      }
    }

    setLocalConfig({ ...localConfig, [editingColumn]: uniqueFloors });
    setEditingColumn(null);
    setFloorsInput('');
    toast({
      title: 'Andares atualizados',
      description: `Coluna ${editingColumn} agora tem ${uniqueFloors.length} andar(es)`,
    });
  };

  const handleSave = async () => {
    if (Object.keys(localConfig).length === 0) {
      toast({
        title: 'Configuração inválida',
        description: 'É necessário ter pelo menos uma coluna',
        variant: 'destructive',
      });
      return;
    }

    const success = await saveTowerConfig(localConfig);
    
    if (!success) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    onUpdateConfig(localConfig);
    onOpenChange(false);
    
    const totalPositions = Object.values(localConfig).reduce((sum, floors) => sum + floors.length, 0);
    toast({
      title: 'Configuração salva',
      description: `Estoque atualizado: ${Object.keys(localConfig).length} colunas com ${totalPositions} posições totais`,
    });
  };

  const handleCancel = () => {
    setLocalConfig(columnConfig);
    setNewColumn('');
    setEditingColumn(null);
    setFloorsInput('');
    onOpenChange(false);
  };

  const columns = Object.keys(localConfig).sort();
  const totalPositions = Object.values(localConfig).reduce((sum, floors) => sum + floors.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração do Estoque
          </DialogTitle>
          <DialogDescription>
            Adicione colunas e defina quantos andares cada uma terá. Posições com itens não podem ser removidas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Nova Coluna</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="new-column">Letra da Coluna (A-Z)</Label>
                  <Input
                    id="new-column"
                    value={newColumn}
                    onChange={(e) => setNewColumn(e.target.value.toUpperCase())}
                    placeholder="Ex: I"
                    maxLength={1}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
                  />
                </div>
                <Button 
                  onClick={handleAddColumn}
                  className="mt-6"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Coluna
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Nova coluna será criada com 4 andares (1, 2, 3, 4) por padrão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Colunas Configuradas ({columns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {columns.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {columns.map(column => {
                    const floors = localConfig[column];
                    const hasItems = positions.some(p => p.position.column === column && p.occupied);
                    const isEditing = editingColumn === column;
                    
                    return (
                      <div key={column} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xl px-3 py-1">
                            Coluna {column}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveColumn(column)}
                            disabled={hasItems}
                            title={hasItems ? 'Coluna contém itens' : 'Remover coluna'}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <Label className="text-xs">
                              Andares (ex: 1,2,3,4 ou 1-4)
                            </Label>
                            <Input
                              value={floorsInput}
                              onChange={(e) => setFloorsInput(e.target.value)}
                              placeholder="1-4 ou 1,2,3,4"
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveFloors()}
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={handleSaveFloors}
                                className="flex-1"
                              >
                                Salvar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingColumn(null);
                                  setFloorsInput('');
                                }}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-muted-foreground">
                              <strong>{floors.length} andar(es):</strong> {floors.join(', ')}
                            </div>
                            {hasItems && (
                              <Badge variant="secondary" className="text-xs">
                                Contém itens
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditColumn(column)}
                              className="w-full"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Editar Andares
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma coluna configurada. Adicione uma coluna para começar.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total de Colunas</p>
                <p className="text-2xl font-bold">{columns.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Posições</p>
                <p className="text-2xl font-bold">{totalPositions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Posições Ocupadas</p>
                <p className="text-2xl font-bold">
                  {positions.filter(p => p.occupied).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Posições Livres</p>
                <p className="text-2xl font-bold">
                  {totalPositions - positions.filter(p => p.occupied).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
