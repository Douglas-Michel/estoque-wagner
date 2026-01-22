import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';

interface PositionItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onSelect: (item: InventoryItem) => void;
  isOrdemSaida?: boolean; // Se true, apenas itens disponíveis podem ser selecionados
}

export function PositionItemsDialog({ open, onOpenChange, items, onSelect, isOrdemSaida = false }: PositionItemsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Itens nesta posição
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((it) => {
            const isAvailable = it.quantidade_disponivel > 0;
            const hasReservado = it.quantidade_reservada > 0;
            const hasAvaria = it.quantidade_avaria > 0;
            
            // Determinar o badge correto
            let statusBadge = null;
            if (!isAvailable && hasReservado) {
              statusBadge = (
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                  Reservado
                </Badge>
              );
            } else if (!isAvailable && hasAvaria) {
              statusBadge = (
                <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-700">
                  Avaria
                </Badge>
              );
            }
            
            const canSelect = !isOrdemSaida || isAvailable;
            // Compat: aceitar itens com position ou com position_column/position_floor
            const column = (it as any).position?.column ?? (it as any).position_column;
            const floor = (it as any).position?.floor ?? (it as any).position_floor;
            
            return (
              <button
                key={it.id}
                className={`w-full text-left p-3 border rounded-md transition-colors ${
                  canSelect ? 'hover:bg-muted/40 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => canSelect && onSelect(it)}
                disabled={!canSelect}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {it.codigo}{it.nome ? ` — ${it.nome}` : ''}
                      {statusBadge}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="h-3.5 w-3.5" /> {column}{floor}
                    </div>
                  </div>
                  <Badge className={isAvailable ? "" : "bg-muted"}>
                    {isAvailable ? `${it.quantidade_disponivel} disp.` : '0 disp.'}
                  </Badge>
                </div>
                <div className="text-sm mt-2 space-y-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div className={isAvailable ? "text-green-600" : "text-red-600"}>
                      Disponível: {it.quantidade_disponivel}
                    </div>
                    {it.peso_bruto != null && (
                      <div className="text-muted-foreground">Peso Bruto: {it.peso_bruto} kg</div>
                    )}
                  </div>
                  {(it.quantidade_reservada > 0 || it.quantidade_avaria > 0 || it.peso_liquido != null) && (
                    <div className="grid grid-cols-2 gap-2">
                      {it.quantidade_reservada > 0 && (
                        <div className="text-muted-foreground">Reservado: {it.quantidade_reservada}</div>
                      )}
                      {it.quantidade_avaria > 0 && (
                        <div className="text-muted-foreground">Avaria: {it.quantidade_avaria}</div>
                      )}
                      {it.peso_liquido != null && (
                        <div className="text-muted-foreground">Peso Líquido: {it.peso_liquido} kg</div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhum item nesta posição.</div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
