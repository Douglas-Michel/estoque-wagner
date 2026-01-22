import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { OrdemSaidaStorage } from '@/lib/ordem-saida-storage';
import { PDFGenerator } from '@/lib/pdf-generator';
import { OrdemSaidaItem } from '@/types/ordem-saida';
import { ITEM_TYPE_LABELS } from '@/types/inventory';
import { Truck, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const observationSchema = z.string()
  .max(1000, 'Observações não podem exceder 1000 caracteres')
  .trim()
  .optional();

const itemObservationSchema = z.string()
  .max(500, 'Observações não podem exceder 500 caracteres')
  .trim()
  .optional();

interface OrdemSaidaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itensSelecionados: OrdemSaidaItem[];
  onSuccess: () => void;
}

export function OrdemSaidaDialog({
  open,
  onOpenChange,
  itensSelecionados,
  onSuccess
}: OrdemSaidaDialogProps) {
  const [itens, setItens] = useState<OrdemSaidaItem[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setItens(itensSelecionados);
    }
  }, [open, itensSelecionados]);

  const handleQuantidadeChange = (index: number, novaQuantidade: string) => {
    const quantidade = parseInt(novaQuantidade) || 0;
    const novosItens = [...itens];
    novosItens[index].quantidade = quantidade;
    setItens(novosItens);
  };

  const handleObservacoesChange = (index: number, obs: string) => {
    const novosItens = [...itens];
    novosItens[index].observacoes = obs;
    setItens(novosItens);
  };

  const handleEmpresaChange = (index: number, empresa: string) => {
    const novosItens = [...itens];
    novosItens[index].empresa = empresa;
    setItens(novosItens);
  };

  const handleRemoverItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleGerarOrdem = async () => {
    if (itens.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um item à ordem de saída',
        variant: 'destructive'
      });
      return;
    }

    if (itens.some(item => item.quantidade <= 0)) {
      toast({
        title: 'Erro',
        description: 'Todos os itens devem ter quantidade maior que zero',
        variant: 'destructive'
      });
      return;
    }

    // Validar observações gerais
    const obsValidation = observationSchema.safeParse(observacoes);
    if (!obsValidation.success) {
      toast({
        title: 'Erro',
        description: obsValidation.error.issues[0].message,
        variant: 'destructive'
      });
      return;
    }

    // Validar observações dos itens
    for (const item of itens) {
      const itemObsValidation = itemObservationSchema.safeParse(item.observacoes);
      if (!itemObsValidation.success) {
        toast({
          title: 'Erro',
          description: `${item.codigo}: ${itemObsValidation.error.issues[0].message}`,
          variant: 'destructive'
        });
        return;
      }
    }

    setLoading(true);

    try {
      const ordem = await OrdemSaidaStorage.criarOrdem(itens, observacoes);
      
      toast({
        title: 'Sucesso',
        description: `Ordem ${ordem.numero_ordem} criada com sucesso!`
      });

      // Generate PDF
      PDFGenerator.gerarOrdemSaida(ordem);

      onSuccess();
      onOpenChange(false);
      setItens([]);
      setObservacoes('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar ordem de saída',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Nova Ordem de Saída
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2 flex-1">
          <div className="space-y-2">
            <Label>Observações Gerais (Tipo de Embalagem, Instruções Especiais, etc.)</Label>
            <Textarea
              placeholder="Ex: Embalar em caixas de madeira, usar palete específico, etc... (máx. 1000 caracteres)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value.slice(0, 1000))}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="space-y-3">
            <Label>Itens da Ordem ({itens.length})</Label>
            {itens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum item selecionado
              </p>
            ) : (
              itens.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-3 bg-muted/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{item.codigo}</div>
                      <div className="text-sm text-muted-foreground">
                        {ITEM_TYPE_LABELS[item.tipo as keyof typeof ITEM_TYPE_LABELS] || item.tipo}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Posição: {item.position_column}{item.position_floor}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoverItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Nome da Empresa/Cliente</Label>
                      <Input
                        placeholder="Nome da empresa que comprou..."
                        value={item.empresa || ''}
                        onChange={(e) => handleEmpresaChange(index, e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Observação Extra</Label>
                        <Input
                          placeholder="Obs. adicional... (máx. 500 caracteres)"
                          value={item.observacoes || ''}
                          onChange={(e) => handleObservacoesChange(index, e.target.value.slice(0, 500))}
                          maxLength={500}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGerarOrdem}
            disabled={loading || itens.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Gerando...' : 'Gerar Ordem de Saída'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
