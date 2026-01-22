import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { InventoryItem } from '@/types/inventory';
import { ITEM_TYPE_LABELS } from '@/types/inventory';
import { OrdemSaidaItem } from '@/types/ordem-saida';
import { Search, Package, CheckSquare, Layers } from 'lucide-react';
import { PositionItemsDialog } from './PositionItemsDialog';

interface SelecionarItensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onConfirmar: (itensSelecionados: OrdemSaidaItem[]) => void;
}

export function SelecionarItensDialog({
  open,
  onOpenChange,
  items,
  onConfirmar
}: SelecionarItensDialogProps) {
  const [busca, setBusca] = useState('');
  const [itensSelecionados, setItensSelecionados] = useState<Map<string, number>>(new Map());
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [itemsAtPosition, setItemsAtPosition] = useState<InventoryItem[]>([]);

  // Group items by position
  const itemsGroupedByPosition = items.reduce((acc, item) => {
    const posKey = `${item.position.column}${item.position.floor}`;
    if (!acc[posKey]) {
      acc[posKey] = [];
    }
    acc[posKey].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const itemsFiltrados = items.filter(item => {
    const searchLower = busca.toLowerCase();
    return (
      item.codigo.toLowerCase().includes(searchLower) ||
      ITEM_TYPE_LABELS[item.tipo]?.toLowerCase().includes(searchLower) ||
      `${item.position.column}${item.position.floor}`.toLowerCase().includes(searchLower)
    );
  });

  // Group filtered items by position for display
  const groupedFiltered = itemsFiltrados.reduce((acc, item) => {
    const posKey = `${item.position.column}${item.position.floor}`;
    if (!acc[posKey]) {
      acc[posKey] = [];
    }
    acc[posKey].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const handleToggleItem = (itemId: string) => {
    const newMap = new Map(itensSelecionados);
    if (newMap.has(itemId)) {
      newMap.delete(itemId);
    } else {
      newMap.set(itemId, 1);
    }
    setItensSelecionados(newMap);
  };

  const handleQuantidadeChange = (itemId: string, quantidade: number) => {
    const newMap = new Map(itensSelecionados);
    if (quantidade > 0) {
      newMap.set(itemId, quantidade);
      setItensSelecionados(newMap);
    }
  };

  const handlePositionClick = (positionKey: string) => {
    const itemsInPosition = itemsGroupedByPosition[positionKey];
    if (itemsInPosition && itemsInPosition.length > 1) {
      setItemsAtPosition(itemsInPosition);
      setItemsDialogOpen(true);
    } else if (itemsInPosition && itemsInPosition.length === 1) {
      handleToggleItem(itemsInPosition[0].id);
    }
  };

  const handleSelectItemFromDialog = (item: InventoryItem) => {
    setItemsDialogOpen(false);
    handleToggleItem(item.id);
  };

  const handleConfirmar = () => {
    const itensParaOrdem: OrdemSaidaItem[] = items
      .filter(item => itensSelecionados.has(item.id))
      .map(item => ({
        item_id: item.id,
        codigo: item.codigo,
        tipo: item.tipo,
        quantidade: itensSelecionados.get(item.id) || 1,
        position_column: item.position.column,
        position_floor: item.position.floor,
        observacoes: ''
      }));

    onConfirmar(itensParaOrdem);
    setItensSelecionados(new Map());
    setBusca('');
  };

  const handleCancelar = () => {
    setItensSelecionados(new Map());
    setBusca('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selecionar Itens para Ordem de Saída
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, tipo ou posição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Count */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <CheckSquare className="h-4 w-4 mr-1" />
              {itensSelecionados.size} selecionados
            </Badge>
            {itensSelecionados.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setItensSelecionados(new Map())}
              >
                Limpar seleção
              </Button>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {Object.keys(groupedFiltered).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {items.length === 0 ? (
                  <p>Nenhum item em estoque</p>
                ) : (
                  <p>Nenhum item encontrado com "{busca}"</p>
                )}
              </div>
            ) : (
              Object.entries(groupedFiltered).map(([positionKey, positionItems]) => {
                const hasMultipleItems = positionItems.length > 1;
                const firstItem = positionItems[0];
                
                // Check if any item in this position is selected
                const hasSelectedItems = positionItems.some(item => itensSelecionados.has(item.id));
                const selectedCount = positionItems.filter(item => itensSelecionados.has(item.id)).length;

                if (hasMultipleItems) {
                  // Show grouped view for multiple items
                  // Get the common name or first item's name/tipo
                  const allSameTipo = positionItems.every(item => item.tipo === firstItem.tipo);
                  const allSameNome = positionItems.every(item => item.nome === firstItem.nome);
                  const displayName = allSameNome && firstItem.nome 
                    ? firstItem.nome 
                    : allSameTipo 
                      ? ITEM_TYPE_LABELS[firstItem.tipo] || firstItem.tipo
                      : `${firstItem.codigo}`;
                  
                  return (
                    <div
                      key={positionKey}
                      className={`p-4 border rounded-lg transition-colors ${
                        hasSelectedItems ? 'bg-primary/10 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div 
                            onClick={() => handlePositionClick(positionKey)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4" />
                              <span className="font-semibold">{displayName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {positionItems.length} itens
                              </Badge>
                              {selectedCount > 0 && (
                                <Badge className="text-xs">
                                  {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Posição: {positionKey} • Clique para ver os itens
                            </div>
                          </div>
                          
                          {/* Show selected items from this position */}
                          {selectedCount > 0 && (
                            <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary">
                              {positionItems
                                .filter(item => itensSelecionados.has(item.id))
                                .map(item => {
                                  const quantidade = itensSelecionados.get(item.id) || 1;
                                  return (
                                    <div key={item.id} className="text-sm space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={true}
                                          onCheckedChange={() => handleToggleItem(item.id)}
                                        />
                                        <span className="font-medium">{item.codigo}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {ITEM_TYPE_LABELS[item.tipo] || item.tipo}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 pl-6">
                                        <Label className="text-xs whitespace-nowrap">Qtd:</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          max={item.quantidade_disponivel}
                                          value={quantidade}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            handleQuantidadeChange(item.id, Math.min(val, item.quantidade_disponivel));
                                          }}
                                          className="w-20 h-7 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                          / {item.quantidade_disponivel} disp.
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Show single item view
                  const item = firstItem;
                  const isSelected = itensSelecionados.has(item.id);
                  const quantidade = itensSelecionados.get(item.id) || 1;
                  const isAvailable = item.quantidade_disponivel > 0;
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : ''
                      } ${!isAvailable ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => isAvailable && handleToggleItem(item.id)}
                          disabled={!isAvailable}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div 
                            onClick={() => isAvailable && handleToggleItem(item.id)}
                            className={isAvailable ? "cursor-pointer" : "cursor-not-allowed"}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{item.codigo}</span>
                              <Badge variant="outline" className="text-xs">
                                {ITEM_TYPE_LABELS[item.tipo] || item.tipo}
                              </Badge>
                              {!isAvailable && (
                                <Badge variant="destructive" className="text-xs">
                                  Sem estoque disponível
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Posição: Torre - {item.position.column}{item.position.floor} • 
                              <span className={isAvailable ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                Disponível: {item.quantidade_disponivel}
                              </span>
                              {item.quantidade_reservada > 0 && ` • Reservado: ${item.quantidade_reservada}`}
                              {item.quantidade_avaria > 0 && ` • Avaria: ${item.quantidade_avaria}`}
                              {item.peso_bruto && ` • Peso Bruto: ${item.peso_bruto} kg`}
                              {item.peso_liquido && ` • Peso Líquido: ${item.peso_liquido} kg`}
                            </div>
                            {item.observacoes && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Obs: {item.observacoes}
                              </div>
                            )}
                            {item.lote_id && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Lote: {item.lote_id}
                              </div>
                            )}
                          </div>
                          
                          {isSelected && (
                            <div className="flex items-center gap-2 pt-2">
                              <Label className="text-sm whitespace-nowrap">Quantidade:</Label>
                              <Input
                                type="number"
                                min="1"
                                max={item.quantidade_disponivel}
                                value={quantidade}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  handleQuantidadeChange(item.id, Math.min(val, item.quantidade_disponivel));
                                }}
                                className="w-24"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-sm text-muted-foreground">
                                / {item.quantidade_disponivel} disponível
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleCancelar}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={itensSelecionados.size === 0}
          >
            Continuar ({itensSelecionados.size})
          </Button>
        </DialogFooter>
      </DialogContent>

      <PositionItemsDialog
        open={itemsDialogOpen}
        onOpenChange={setItemsDialogOpen}
        items={itemsAtPosition}
        onSelect={handleSelectItemFromDialog}
        isOrdemSaida={true}
      />
    </Dialog>
  );
}
