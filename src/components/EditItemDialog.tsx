import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InventoryItem, ItemType, ITEM_TYPE_LABELS, Tempera, TEMPERA_OPTIONS, TowerPosition } from '@/types/inventory';
import { InventoryStorage } from '@/lib/storage';
import { toast } from 'sonner';
import { Edit } from 'lucide-react';

interface EditItemDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  availablePositions: TowerPosition[];
}

export function EditItemDialog({ item, open, onOpenChange, onUpdate, availablePositions }: EditItemDialogProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo: '' as ItemType,
    largura: '',
    altura: '',
    espessura: '',
    tempera: '' as Tempera | '',
    polegada: '',
    acabamento: '',
    peso_bruto: '',
    peso_liquido: '',
    quantidade: '',
    position_column: '',
    position_floor: '',
    observacoes: '',
    lote_id: '',
    usina: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      const column = (item as any).position?.column ?? (item as any).position_column;
      const floor = (item as any).position?.floor ?? (item as any).position_floor;
      const attrs = item.attributes || {};
      
      setFormData({
        codigo: item.codigo,
        nome: item.nome || '',
        tipo: item.tipo,
        largura: attrs.largura?.toString() || '',
        altura: attrs.altura?.toString() || '',
        espessura: attrs.espessura?.toString() || '',
        tempera: attrs.tempera || '',
        polegada: attrs.polegada?.toString() || '',
        acabamento: item.acabamento || '',
        peso_bruto: item.peso_bruto?.toString() || '',
        peso_liquido: item.peso_liquido?.toString() || '',
        quantidade: item.quantidade.toString(),
        position_column: column,
        position_floor: floor?.toString(),
        observacoes: item.observacoes || '',
        lote_id: item.lote_id || '',
        usina: item.usina || ''
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;

    if (!formData.codigo || !formData.tipo || !formData.quantidade || !formData.position_column || !formData.position_floor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        codigo: formData.codigo,
        nome: formData.nome || null,
        tipo: formData.tipo,
        acabamento: formData.acabamento || null,
        peso_bruto: formData.peso_bruto ? parseFloat(formData.peso_bruto) : null,
        peso_liquido: formData.peso_liquido ? parseFloat(formData.peso_liquido) : null,
        quantidade: parseInt(formData.quantidade),
        observacoes: formData.observacoes || null,
        lote_id: formData.lote_id || null,
        usina: formData.usina || null,
        attributes: {
          largura: formData.largura ? parseFloat(formData.largura) : undefined,
          altura: formData.altura ? parseFloat(formData.altura) : undefined,
          espessura: formData.espessura ? parseFloat(formData.espessura) : undefined,
          tempera: formData.tempera || undefined,
          polegada: formData.polegada ? parseFloat(formData.polegada) : undefined
        },
        position: {
          column: formData.position_column,
          floor: parseInt(formData.position_floor),
          toString: () => `${formData.position_column}${formData.position_floor}`
        }
      };

      const success = await InventoryStorage.updateItem(item.id, updates);
      
      if (success) {
        toast.success('Item atualizado com sucesso!');
        onUpdate();
        onOpenChange(false);
      } else {
        toast.error('Erro ao atualizar item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar item');
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  // Get all positions including occupied ones
  const allPositions = [...availablePositions];
  const currentColumn = (item as any).position?.column ?? (item as any).position_column;
  const currentFloor = (item as any).position?.floor ?? (item as any).position_floor;
  
  // Add current position if not in list
  if (!allPositions.some(p => p.position.column === currentColumn && p.position.floor === currentFloor)) {
    allPositions.push({
      position: {
        column: currentColumn,
        floor: currentFloor,
        toString: () => `${currentColumn}${currentFloor}`
      },
      occupied: true,
      item: item
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: ALU-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do item"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Material *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value as ItemType })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="largura">Largura (mm)</Label>
              <Input
                id="largura"
                type="number"
                value={formData.largura}
                onChange={(e) => setFormData({ ...formData, largura: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="altura">Altura (mm)</Label>
              <Input
                id="altura"
                type="number"
                value={formData.altura}
                onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="espessura">Espessura (mm)</Label>
              <Input
                id="espessura"
                type="number"
                step="0.01"
                value={formData.espessura}
                onChange={(e) => setFormData({ ...formData, espessura: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tempera">Têmpera</Label>
              <Select value={formData.tempera} onValueChange={(value) => setFormData({ ...formData, tempera: value as Tempera })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPERA_OPTIONS.map((temp) => (
                    <SelectItem key={temp} value={temp}>
                      {temp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="polegada">Polegadas</Label>
              <Input
                id="polegada"
                type="number"
                step="0.01"
                value={formData.polegada}
                onChange={(e) => setFormData({ ...formData, polegada: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso_bruto">Peso Bruto (kg)</Label>
              <Input
                id="peso_bruto"
                type="number"
                step="0.01"
                value={formData.peso_bruto}
                onChange={(e) => setFormData({ ...formData, peso_bruto: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso_liquido">Peso Líquido (kg)</Label>
              <Input
                id="peso_liquido"
                type="number"
                step="0.01"
                value={formData.peso_liquido}
                onChange={(e) => setFormData({ ...formData, peso_liquido: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acabamento">Acabamento</Label>
              <Input
                id="acabamento"
                value={formData.acabamento}
                onChange={(e) => setFormData({ ...formData, acabamento: e.target.value })}
                placeholder="Ex: Anodizado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lote_id">Lote ID</Label>
              <Input
                id="lote_id"
                value={formData.lote_id}
                onChange={(e) => setFormData({ ...formData, lote_id: e.target.value })}
                placeholder="ID do lote"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usina">Usina</Label>
              <Input
                id="usina"
                value={formData.usina}
                onChange={(e) => setFormData({ ...formData, usina: e.target.value })}
                placeholder="Nome da usina"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Posição *</Label>
            <Select 
              value={`${formData.position_column}${formData.position_floor}`}
              onValueChange={(value) => {
                const column = value.slice(0, 1);
                const floor = value.slice(1);
                setFormData({ ...formData, position_column: column, position_floor: floor });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a posição" />
              </SelectTrigger>
              <SelectContent>
                {allPositions.map((pos) => (
                  <SelectItem 
                    key={`${pos.position.column}${pos.position.floor}`} 
                    value={`${pos.position.column}${pos.position.floor}`}
                  >
                    {pos.position.column}{pos.position.floor} {pos.occupied && pos.position.column !== currentColumn || pos.position.floor !== currentFloor ? '(Ocupada)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações sobre o item..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
