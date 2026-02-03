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
import { Search, Package, CheckSquare } from 'lucide-react';

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

  const itemsFiltrados = items.filter(item => {
    const searchLower = busca.toLowerCase();
    return (
      item.codigo.toLowerCase().includes(searchLower) ||
      (item.nome && item.nome.toLowerCase().includes(searchLower)) ||
      ITEM_TYPE_LABELS[item.tipo]?.toLowerCase().includes(searchLower) ||
      (item.usina && item.usina.toLowerCase().includes(searchLower)) ||
      `${item.position.column}${item.position.floor}`.toLowerCase().includes(searchLower)
    );
  }).filter(item => item.quantidade_disponivel > 0); // Mostrar apenas itens disponíveis

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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold">Selecionar Itens</span>
              <span className="text-sm font-normal text-muted-foreground">Escolha os produtos para a ordem de saída</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, tipo ou posição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-12 h-12 text-base bg-muted/50 border-2 focus:border-primary transition-colors"
            />
          </div>

          {/* Selected Count */}
          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                itensSelecionados.size > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <CheckSquare className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {itensSelecionados.size > 0 ? `${itensSelecionados.size} ${itensSelecionados.size === 1 ? 'item selecionado' : 'itens selecionados'}` : 'Nenhum item selecionado'}
                </span>
                <span className="text-xs text-muted-foreground">Clique nos itens para selecionar</span>
              </div>
            </div>
            {itensSelecionados.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setItensSelecionados(new Map())}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {itemsFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                {items.filter(i => i.quantidade_disponivel > 0).length === 0 ? (
                  <p className="text-muted-foreground text-lg font-medium">Nenhum item disponível em estoque</p>
                ) : (
                  <>
                    <p className="text-muted-foreground text-lg font-medium mb-1">Nenhum item encontrado</p>
                    <p className="text-muted-foreground text-sm">Tente buscar por outro termo</p>
                  </>
                )}
              </div>
            ) : (
              itemsFiltrados.map((item) => {
                const isSelected = itensSelecionados.has(item.id);
                const quantidade = itensSelecionados.get(item.id) || 1;
                const isAvailable = item.quantidade_disponivel > 0;
                
                return (
                  <div
                    key={item.id}
                    className={`border-2 rounded-xl overflow-hidden transition-all hover:shadow-md ${
                      isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-4 p-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleItem(item.id)}
                        className="mt-2 h-5 w-5 data-[state=checked]:bg-primary"
                      />
                      <div className="flex-1 space-y-3">
                        <div 
                          onClick={() => handleToggleItem(item.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="font-bold text-lg">{item.codigo}</span>
                                <Badge variant="outline" className="text-xs font-semibold">
                                  {ITEM_TYPE_LABELS[item.tipo] || item.tipo}
                                  {item.attributes.polegada && ` ${item.attributes.polegada}\"` }
                                </Badge>
                              </div>
                              {item.nome && (
                                <p className="text-sm text-muted-foreground mb-2">{item.nome}</p>
                              )}
                              {item.usina && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {item.usina}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs font-mono shrink-0">
                              {item.position.column}{item.position.floor}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-3 bg-muted/30 rounded-lg">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Disponível</span>
                              <span className="text-base font-bold text-green-600 dark:text-green-400">
                                {item.quantidade_disponivel}
                              </span>
                            </div>
                            {item.quantidade_reservada > 0 && (
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Reservado</span>
                                <span className="text-base font-bold text-yellow-600 dark:text-yellow-400">
                                  {item.quantidade_reservada}
                                </span>
                              </div>
                            )}
                            {item.peso_bruto && (
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Peso Bruto</span>
                                <span className="text-sm font-semibold">{item.peso_bruto} kg</span>
                              </div>
                            )}
                            {item.peso_liquido && (
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Peso Líquido</span>
                                <span className="text-sm font-semibold">{item.peso_liquido} kg</span>
                              </div>
                            )}
                          </div>
                          
                          {item.observacoes && (
                            <div className="text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/50">
                              <span className="text-xs font-semibold uppercase tracking-wide text-primary block mb-1">Observações</span>
                              {item.observacoes}
                            </div>
                          )}
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-3 pt-3 border-t bg-primary/5 -mx-4 -mb-3 px-4 py-3">
                            <Label className="text-sm font-semibold whitespace-nowrap">Quantidade:</Label>
                            <Input
                              type="number"
                              min="1"
                              max={item.quantidade_disponivel}
                              value={quantidade}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                handleQuantidadeChange(item.id, Math.min(val, item.quantidade_disponivel));
                              }}
                              className="w-28 h-10 font-semibold"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm text-muted-foreground font-medium">
                              de {item.quantidade_disponivel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="pt-6 border-t gap-3 flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={handleCancelar}
            className="h-11 text-base w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={itensSelecionados.size === 0}
            className="h-11 text-base font-semibold w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
          >
            {itensSelecionados.size > 0 ? `Continuar com ${itensSelecionados.size} ${itensSelecionados.size === 1 ? 'item' : 'itens'}` : 'Selecione itens para continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
