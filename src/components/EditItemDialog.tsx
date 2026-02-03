import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InventoryItem, ItemType, ITEM_TYPE_LABELS, Tempera, TEMPERA_OPTIONS, TowerPosition } from '@/types/inventory';
import { InventoryStorage } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';

interface EditItemDialogProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditItemDialog({ item, open, onOpenChange, onSuccess }: EditItemDialogProps) {
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
    quantidade_disponivel: '',
    quantidade_reservada: '',
    quantidade_avaria: '',
    position: '',
    observacoes: '',
    lote_id: '',
    usina: ''
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      const column = (item as any).position?.column ?? (item as any).position_column ?? 'A';
      const floor = (item as any).position?.floor ?? (item as any).position_floor ?? '1';
      const positionStr = item.position?.toString() || `${column}${floor}`;
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
        quantidade_disponivel: item.quantidade_disponivel?.toString() || item.quantidade.toString(),
        quantidade_reservada: item.quantidade_reservada?.toString() || '0',
        quantidade_avaria: item.quantidade_avaria?.toString() || '0',
        position: positionStr,
        observacoes: item.observacoes || '',
        lote_id: item.lote_id || '',
        usina: item.usina || ''
      });
    }
  }, [item]);

  // Recalcular disponível automaticamente
  const handleQuantidadeChange = (field: 'quantidade' | 'quantidade_reservada' | 'quantidade_avaria', value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'quantidade') {
      // Quando muda o total, ajusta o disponível mantendo reservado e avaria
      const total = parseInt(value) || 0;
      const reservado = parseInt(newFormData.quantidade_reservada) || 0;
      const avaria = parseInt(newFormData.quantidade_avaria) || 0;
      const disponivel = Math.max(0, total - reservado - avaria);
      newFormData.quantidade_disponivel = disponivel.toString();
    } else {
      // Quando muda reservado ou avaria, recalcula disponível
      const total = parseInt(newFormData.quantidade) || 0;
      const reservado = parseInt(newFormData.quantidade_reservada) || 0;
      const avaria = parseInt(newFormData.quantidade_avaria) || 0;
      const disponivel = Math.max(0, total - reservado - avaria);
      newFormData.quantidade_disponivel = disponivel.toString();
    }
    
    setFormData(newFormData);
  };

  const handleSave = async () => {
    if (!item) return;

    if (!formData.codigo || !formData.tipo || !formData.quantidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar consistência das quantidades
    const qtdTotal = parseInt(formData.quantidade) || 0;
    const qtdDisp = parseInt(formData.quantidade_disponivel) || 0;
    const qtdRes = parseInt(formData.quantidade_reservada) || 0;
    const qtdAvar = parseInt(formData.quantidade_avaria) || 0;
    const soma = qtdDisp + qtdRes + qtdAvar;

    if (soma !== qtdTotal) {
      toast.error(`A soma das quantidades (${soma}) deve ser igual à quantidade total (${qtdTotal})`);
      return;
    }

    setSaving(true);
    try {
      // Converter position para formato de coluna e andar
      const positionStr = formData.position || 'A1';
      const posCode = positionStr.length >= 2 ? positionStr.substring(0, 2) : 'A1';
      const column = posCode.charAt(0).toUpperCase();
      const floor = parseInt(posCode.charAt(1)) || 1;

      const updateData = {
        codigo: formData.codigo,
        nome: formData.nome || null,
        tipo: formData.tipo,
        position_column: column >= 'A' && column <= 'H' ? column : 'A',
        position_floor: floor >= 1 && floor <= 4 ? floor : 1,
        quantidade: parseInt(formData.quantidade) || 0,
        quantidade_disponivel: parseInt(formData.quantidade_disponivel) || 0,
        quantidade_reservada: parseInt(formData.quantidade_reservada) || 0,
        quantidade_avaria: parseInt(formData.quantidade_avaria) || 0,
        peso_bruto: formData.peso_bruto ? parseFloat(formData.peso_bruto) : null,
        peso_liquido: formData.peso_liquido ? parseFloat(formData.peso_liquido) : null,
        observacoes: formData.observacoes || null,
        lote_id: formData.lote_id || null,
        usina: formData.usina || null,
        acabamento: formData.acabamento || null,
        status: parseInt(formData.quantidade_disponivel) > 0 ? 'disponivel' : 'indisponivel' as const,
      };

      console.log('Updating item with data:', updateData);

      const { data, error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', item.id)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);
      toast.success('Item atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(`Erro ao atualizar item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!item) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast.success('Item excluído com sucesso!');
      onSuccess();
      onOpenChange(false);
      setConfirmDelete(false);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Erro ao excluir item: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setDeleting(false);
    }
  };
  if (!item) return null;

  return (
    <Dialog open={open || confirmDelete} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setConfirmDelete(false);
        onOpenChange(false);
      }
    }}>
      <DialogContent className={confirmDelete ? "sm:max-w-md" : "sm:max-w-[700px] max-h-[90vh] overflow-y-auto"}>
        {confirmDelete ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja excluir este item?
                </p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-semibold">
                    {item.codigo} - {item.nome || ITEM_TYPE_LABELS[item.tipo]}
                  </p>
                </div>
                <p className="text-xs text-destructive font-medium">
                  ⚠ Esta ação não pode ser desfeita!
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Editar Item - {item.codigo}
              </DialogTitle>
            </DialogHeader>        <div className="space-y-4 overflow-y-auto pr-2">
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
              <Label htmlFor="quantidade">Quantidade Total *</Label>
              <Input
                id="quantidade"
                type="number"
                value={formData.quantidade}
                onChange={(e) => handleQuantidadeChange('quantidade', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade_disponivel" className="text-green-600 dark:text-green-400">Disponível (auto)</Label>
              <Input
                id="quantidade_disponivel"
                type="number"
                value={formData.quantidade_disponivel}
                readOnly
                disabled
                placeholder="0"
                className="border-green-300 dark:border-green-700 bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade_reservada" className="text-yellow-600 dark:text-yellow-400">Reservado</Label>
              <Input
                id="quantidade_reservada"
                type="number"
                value={formData.quantidade_reservada}
                onChange={(e) => handleQuantidadeChange('quantidade_reservada', e.target.value)}
                placeholder="0"
                className="border-yellow-300 dark:border-yellow-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade_avaria" className="text-red-600 dark:text-red-400">Avaria</Label>
              <Input
                id="quantidade_avaria"
                type="number"
                value={formData.quantidade_avaria}
                onChange={(e) => handleQuantidadeChange('quantidade_avaria', e.target.value)}
                placeholder="0"
                className="border-red-300 dark:border-red-700"
              />
            </div>
          </div>

          {/* Validação visual */}
          {(() => {
            const total = parseInt(formData.quantidade) || 0;
            const disp = parseInt(formData.quantidade_disponivel) || 0;
            const res = parseInt(formData.quantidade_reservada) || 0;
            const avar = parseInt(formData.quantidade_avaria) || 0;
            const soma = disp + res + avar;
            const isValid = soma === total;
            const newStatus = disp > 0 ? 'Disponível' : 'Indisponível';
            const statusColor = disp > 0 ? 'text-green-600 dark:text-green-400 bg-green-500/10' : 'text-red-600 dark:text-red-400 bg-red-500/10';
            
            return (
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  isValid 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-600 shadow-sm' 
                    : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-600 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-bold flex items-center gap-2 ${isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {isValid ? (
                        <>
                          <span className="text-xl">✓</span>
                          <span>Quantidades consistentes</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">⚠</span>
                          <span>Atenção: Soma incorreta</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-lg font-bold bg-white/80 dark:bg-black/40 rounded-lg py-3 px-4 border">
                    <span className="text-green-700 dark:text-green-300 font-mono text-xl">{disp}</span>
                    <span className="text-gray-500 dark:text-gray-400">+</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-xl">{res}</span>
                    <span className="text-gray-500 dark:text-gray-400">+</span>
                    <span className="text-red-700 dark:text-red-300 font-mono text-xl">{avar}</span>
                    <span className="text-gray-500 dark:text-gray-400">=</span>
                    <span className={`font-mono text-xl ${isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {soma}
                    </span>
                    {!isValid && (
                      <>
                        <span className="text-red-700 dark:text-red-300">≠</span>
                        <span className="text-red-700 dark:text-red-300 font-mono text-xl">{total}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  disp > 0 
                    ? 'bg-green-50/50 dark:bg-green-950/30 border-green-400/50' 
                    : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-400/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${
                        disp > 0 
                          ? 'bg-green-500 animate-pulse shadow-md shadow-green-500/30' 
                          : 'bg-rose-500 shadow-md shadow-rose-500/30'
                      }`}></div>
                      <span className="text-sm font-medium text-foreground/80">Status após salvar:</span>
                    </div>
                    <span className={`text-base font-bold px-4 py-1.5 rounded-full ${
                      disp > 0 
                        ? 'bg-green-100/80 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                        : 'bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                    }`}>
                      {newStatus}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

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
            <Label htmlFor="position">Empresa/Local de Armazenamento</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Ex: ALCAST, BAUX, IBRAME..."
            />
            <p className="text-xs text-muted-foreground">
              Nome da empresa ou local onde o material está armazenado
            </p>
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

        <DialogFooter className="flex justify-between items-center">
          <Button 
            variant="destructive" 
            onClick={() => setConfirmDelete(true)}
            className="mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Item
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}