import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InventoryItem, ItemStatus, ITEM_TYPE_LABELS, TowerPosition } from '@/types/inventory';
import { Package, MapPin, AlertCircle, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { EditItemDialog } from './EditItemDialog';
import { z } from 'zod';

const observationSchema = z.string()
  .max(1000, 'Observações não podem exceder 1000 caracteres')
  .trim()
  .optional();

const statusObservationSchema = z.string()
  .max(500, 'Observações não podem exceder 500 caracteres')
  .trim()
  .optional();

interface ItemDetailsDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  availablePositions?: TowerPosition[];
}

const STATUS_LABELS: Record<ItemStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  avaria: 'Com Avaria'
};

const STATUS_COLORS: Record<ItemStatus, string> = {
  disponivel: 'bg-blue-500',
  reservado: 'bg-yellow-500',
  avaria: 'bg-red-500'
};

export function ItemDetailsDialog({ item, open, onOpenChange, onUpdate, availablePositions = [] }: ItemDetailsDialogProps) {
  const [quantidadeReservada, setQuantidadeReservada] = useState(item?.quantidade_reservada || 0);
  const [quantidadeAvaria, setQuantidadeAvaria] = useState(item?.quantidade_avaria || 0);
  const [observacoes, setObservacoes] = useState(item?.observacoes || '');
  const [observacaoReservado, setObservacaoReservado] = useState(item?.observacao_reservado || '');
  const [observacaoAvaria, setObservacaoAvaria] = useState(item?.observacao_avaria || '');
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Update state when item changes
  useEffect(() => {
    if (item) {
      setQuantidadeReservada(item.quantidade_reservada);
      setQuantidadeAvaria(item.quantidade_avaria);
      setObservacoes(item.observacoes || '');
      setObservacaoReservado(item.observacao_reservado || '');
      setObservacaoAvaria(item.observacao_avaria || '');
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;

    // Validar observações
    const obsValidation = observationSchema.safeParse(observacoes);
    const obsReservadoValidation = statusObservationSchema.safeParse(observacaoReservado);
    const obsAvariaValidation = statusObservationSchema.safeParse(observacaoAvaria);

    if (!obsValidation.success) {
      toast.error(obsValidation.error.issues[0].message);
      return;
    }

    if (!obsReservadoValidation.success) {
      toast.error(obsReservadoValidation.error.issues[0].message);
      return;
    }

    if (!obsAvariaValidation.success) {
      toast.error(obsAvariaValidation.error.issues[0].message);
      return;
    }

    const quantidadeDisponivel = item.quantidade - quantidadeReservada - quantidadeAvaria;
    const quantidadeTotal = quantidadeDisponivel + quantidadeReservada + quantidadeAvaria;
    
    if (quantidadeTotal !== item.quantidade) {
      toast.error(`A soma das quantidades deve ser ${item.quantidade}`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          quantidade_disponivel: quantidadeDisponivel,
          quantidade_reservada: quantidadeReservada,
          quantidade_avaria: quantidadeAvaria,
          observacoes: observacoes || null,
          observacao_reservado: observacaoReservado || null,
          observacao_avaria: observacaoAvaria || null
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Item atualizado com sucesso!');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao atualizar item');
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  const column = (item as any).position?.column ?? (item as any).position_column;
  const floor = (item as any).position?.floor ?? (item as any).position_floor;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detalhes do Item
              </DialogTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditDialogOpen(true);
                  onOpenChange(false);
                }}
                className="flex items-center gap-2 shrink-0"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Editar Item</span>
                <span className="sm:hidden">Editar</span>
              </Button>
            </div>
          </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          {/* Item Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">{item.codigo}</span>
              <Badge variant="outline">{ITEM_TYPE_LABELS[item.tipo]}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Quantidade:</strong> {item.quantidade} un.
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{column}{floor}</span>
              </div>
              {item.peso_bruto && (
                <div>
                  <strong>Peso Bruto:</strong> {item.peso_bruto} kg
                </div>
              )}
              {item.peso_liquido && (
                <div>
                  <strong>Peso Líquido:</strong> {item.peso_liquido} kg
                </div>
              )}
              {item.acabamento && (
                <div>
                  <strong>Acabamento:</strong> {item.acabamento}
                </div>
              )}
            </div>
          </div>

          {/* Quantidades por Status */}
          <div className="space-y-3">
            <Label>Distribuição de Quantidades</Label>
            <div className="grid gap-3">
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="font-medium">Reservado</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.quantidade}
                    value={quantidadeReservada}
                    onChange={(e) => {
                      const valor = parseInt(e.target.value) || 0;
                      const total = valor + quantidadeAvaria;
                      if (total <= item.quantidade) {
                        setQuantidadeReservada(valor);
                      }
                    }}
                    className="w-20 px-2 py-1 border rounded text-right"
                  />
                </div>
                {quantidadeReservada > 0 && (
                  <Textarea
                    placeholder="Observações sobre reservados... (máx. 500 caracteres)"
                    value={observacaoReservado}
                    onChange={(e) => setObservacaoReservado(e.target.value.slice(0, 500))}
                    rows={2}
                    className="text-sm"
                    maxLength={500}
                  />
                )}
              </div>
              
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="font-medium">Com Avaria</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.quantidade}
                    value={quantidadeAvaria}
                    onChange={(e) => {
                      const valor = parseInt(e.target.value) || 0;
                      const total = quantidadeReservada + valor;
                      if (total <= item.quantidade) {
                        setQuantidadeAvaria(valor);
                      }
                    }}
                    className="w-20 px-2 py-1 border rounded text-right"
                  />
                </div>
                {quantidadeAvaria > 0 && (
                  <Textarea
                    placeholder="Observações sobre avarias... (máx. 500 caracteres)"
                    value={observacaoAvaria}
                    onChange={(e) => setObservacaoAvaria(e.target.value.slice(0, 500))}
                    rows={2}
                    className="text-sm"
                    maxLength={500}
                  />
                )}
              </div>
              
              <div className="text-sm text-muted-foreground text-right">
                Total: {quantidadeReservada + quantidadeAvaria} de {item.quantidade}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Observações
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações sobre este item... (máx. 1000 caracteres)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value.slice(0, 1000))}
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <EditItemDialog
      item={item}
      open={editDialogOpen}
      onOpenChange={setEditDialogOpen}
      onUpdate={() => {
        onUpdate();
        setEditDialogOpen(false);
      }}
      availablePositions={availablePositions}
    />
    </>
  );
}
