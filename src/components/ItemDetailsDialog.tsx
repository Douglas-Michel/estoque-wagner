import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryItem, ItemStatus, ITEM_TYPE_LABELS } from '@/types/inventory';
import { Package, MapPin, Edit } from 'lucide-react';
import { EditItemDialog } from './EditItemDialog';

interface ItemDetailsDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const STATUS_LABELS: Record<ItemStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  avaria: 'Com Avaria',
  indisponivel: 'Indisponível'
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  disponivel: 'bg-green-500',
  reservado: 'bg-yellow-500',
  avaria: 'bg-red-500',
  indisponivel: 'bg-red-500'
};

export function ItemDetailsDialog({ item, open, onOpenChange, onUpdate }: ItemDetailsDialogProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (!item) return null;

  const column = (item as any).position?.column ?? (item as any).position_column;
  const floor = (item as any).position?.floor ?? (item as any).position_floor;
  const positionStr = item.position?.toString() || `${column}${floor}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes Completos do Item
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold">{item.codigo}</h3>
                  {item.nome && <p className="text-muted-foreground">{item.nome}</p>}
                </div>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {ITEM_TYPE_LABELS[item.tipo]}
                  {item.attributes.polegada && ` ${item.attributes.polegada}"`}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Badge className={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                {item.lote_id && <Badge variant="secondary">Lote: {item.lote_id}</Badge>}
              </div>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-2 gap-4">
              {/* Localização */}
              <div className="col-span-2 p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Empresa/Local:</span>
                    <p className="font-medium">{positionStr}</p>
                  </div>
                  {item.usina && (
                    <div>
                      <span className="text-muted-foreground">Usina:</span>
                      <p className="font-medium">{item.usina}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantidades */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Quantidades</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">{item.quantidade}</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Disponível:</span>
                    <span className="font-medium">{item.quantidade_disponivel}</span>
                  </div>
                  <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                    <span>Reservado:</span>
                    <span className="font-medium">{item.quantidade_reservada}</span>
                  </div>
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Avaria:</span>
                    <span className="font-medium">{item.quantidade_avaria}</span>
                  </div>
                </div>
              </div>

              {/* Pesos */}
              {(item.peso_bruto || item.peso_liquido) && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Pesos</h4>
                  <div className="space-y-2 text-sm">
                    {item.peso_bruto && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peso Bruto:</span>
                        <span className="font-medium">{item.peso_bruto} kg</span>
                      </div>
                    )}
                    {item.peso_liquido && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peso Líquido:</span>
                        <span className="font-medium">{item.peso_liquido} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Atributos Técnicos */}
              {(item.attributes.largura || item.attributes.altura || item.attributes.espessura || item.attributes.tempera) && (
                <div className="col-span-2 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Atributos Técnicos</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {item.attributes.largura && (
                      <div>
                        <span className="text-muted-foreground">Largura:</span>
                        <p className="font-medium">{item.attributes.largura} mm</p>
                      </div>
                    )}
                    {item.attributes.altura && (
                      <div>
                        <span className="text-muted-foreground">Altura:</span>
                        <p className="font-medium">{item.attributes.altura} mm</p>
                      </div>
                    )}
                    {item.attributes.espessura && (
                      <div>
                        <span className="text-muted-foreground">Espessura:</span>
                        <p className="font-medium">{item.attributes.espessura} mm</p>
                      </div>
                    )}
                    {item.attributes.tempera && (
                      <div>
                        <span className="text-muted-foreground">Têmpera:</span>
                        <p className="font-medium">{item.attributes.tempera}</p>
                      </div>
                    )}
                    {item.acabamento && (
                      <div>
                        <span className="text-muted-foreground">Acabamento:</span>
                        <p className="font-medium">{item.acabamento}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {item.observacoes && (
                <div className="col-span-2 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.observacoes}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setEditDialogOpen(true);
              onOpenChange(false);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditItemDialog
        item={item}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditDialogOpen(false);
          onUpdate();
        }}
      />
    </>
  );
}
