import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { OrdemSaidaStorage } from '@/lib/ordem-saida-storage';
import { OrdemSaida, OrdemSaidaItem } from '@/types/ordem-saida';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trash2, Plus } from 'lucide-react';
import { InventoryStorage } from '@/lib/storage';
import { SelecionarItensDialog } from './SelecionarItensDialog';
import type { InventoryItem } from '@/types/inventory';

interface EditOrdemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordem: OrdemSaida;
  onSuccess: () => void;
}

export function EditOrdemDialog({
  open,
  onOpenChange,
  ordem,
  onSuccess
}: EditOrdemDialogProps) {
  const [observacoes, setObservacoes] = useState(ordem.observacoes || '');
  const [itens, setItens] = useState<OrdemSaidaItem[]>(ordem.itens || []);
  const [saving, setSaving] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const { toast } = useToast();

  const canEdit = ordem.status === 'em_separacao' || ordem.status === 'aguardando_envio';

  useEffect(() => {
    setObservacoes(ordem.observacoes || '');
    setItens(ordem.itens || []);
  }, [ordem]);

  useEffect(() => {
    if (open && canEdit) {
      InventoryStorage.getItems()
        .then((items) => setAvailableItems(items.filter((i) => i.quantidade_disponivel > 0)))
        .catch(() => setAvailableItems([]));
    }
  }, [open, canEdit]);

  const handleItemChange = (index: number, field: keyof OrdemSaidaItem, value: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [field]: value };
    setItens(novosItens);
  };

  const handleRemoverItem = (index: number) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
  };

  const handleAdicionarItens = (novosItens: OrdemSaidaItem[]) => {
    setItens([...itens, ...novosItens]);
    setSelectOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        observacoes: observacoes.trim() || null
      };

      if (canEdit && itens.length > 0) {
        updates.itens = itens;
      }

      await OrdemSaidaStorage.atualizarOrdem(ordem.id, updates);

      toast({
        title: 'Sucesso',
        description: 'Ordem atualizada com sucesso!'
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar ordem',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ordem {ordem.numero_ordem}</DialogTitle>
          <DialogDescription>
            Edite observações e itens enquanto a ordem estiver em separação ou aguardando envio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!canEdit && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta ordem não pode ser editada porque seu status é "{ordem.status}". 
                Ordens concluídas ou canceladas não podem ser alteradas por questão de segurança.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Gerais</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a ordem..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Itens da Ordem</Label>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Itens
                </Button>
              )}
            </div>
            
            {itens.map((item, index) => (
              <div key={item.id || index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Posição: {item.position_column}{item.position_floor} | Tipo: {item.tipo}
                    </p>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoverItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`codigo-${index}`}>Código / Perfil</Label>
                      <Input
                        id={`codigo-${index}`}
                        placeholder="Código do item..."
                        value={item.codigo || ''}
                        onChange={(e) => handleItemChange(index, 'codigo', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`tipo-${index}`}>Nome/Descrição</Label>
                      <Input
                        id={`tipo-${index}`}
                        placeholder="Nome do item..."
                        value={item.tipo || ''}
                        onChange={(e) => handleItemChange(index, 'tipo', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`empresa-${index}`}>Nome da Empresa/Cliente</Label>
                    <Input
                      id={`empresa-${index}`}
                      placeholder="Nome da empresa..."
                      value={item.empresa || ''}
                      onChange={(e) => handleItemChange(index, 'empresa', e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`quantidade-${index}`}>Quantidade</Label>
                      <Input
                        id={`quantidade-${index}`}
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value) || 1)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`observacoes-${index}`}>Observação Extra</Label>
                      <Input
                        id={`observacoes-${index}`}
                        placeholder="Obs. adicional..."
                        value={item.observacoes || ''}
                        onChange={(e) => handleItemChange(index, 'observacoes', e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
            <p>
              <span className="font-medium">Status:</span> {ordem.status}
            </p>
            <p>
              <span className="font-medium">Total de Itens:</span> {itens.length}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <SelecionarItensDialog
        open={selectOpen}
        onOpenChange={setSelectOpen}
        items={availableItems}
        onConfirmar={handleAdicionarItens}
      />
    </Dialog>
  );
}
