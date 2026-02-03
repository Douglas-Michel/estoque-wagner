import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { ItemType, ITEM_TYPE_LABELS, TowerPosition, InventoryItem } from '@/types/inventory';
import { InventoryStorage } from '@/lib/storage';
import { MultipleItemsEntry, ItemEntry } from './MultipleItemsEntry';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const observationSchema = z.string()
  .max(1000, 'Observações não podem exceder 1000 caracteres')
  .trim()
  .optional();

interface StockEntryFormProps {
  onStockEntry: (item: InventoryItem) => void;
  availablePositions: TowerPosition[];
}

export function StockEntryForm({ onStockEntry, availablePositions }: StockEntryFormProps) {
  const { toast } = useToast();
  const [cadastroMultiplo, setCadastroMultiplo] = useState(false);
  const [multipleItems, setMultipleItems] = useState<ItemEntry[]>([]);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo: '' as ItemType,
    acabamento: '',
    peso_bruto: '',
    peso_liquido: '',
    quantidade: '',
    position: '',
    polegada: '',
    lote_id: '',
    usina: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.tipo) {
      return;
    }

    // Validação para cadastro múltiplo
    if (cadastroMultiplo) {
      if (multipleItems.length === 0) {
        toast({
          title: 'Erro',
          description: 'Adicione pelo menos um item',
          variant: 'destructive'
        });
        return;
      }

      const itensInvalidos = multipleItems.some(b => !b.peso_bruto || !b.peso_liquido);
      if (itensInvalidos) {
        toast({
          title: 'Erro',
          description: 'Todos os itens devem ter peso bruto e líquido informados',
          variant: 'destructive'
        });
        return;
      }
    }

    // Posição padrão se não informada
    const positionStr = formData.position || 'A1';
    // Converter para formato de posição (primeiros 2 caracteres ou padrão)
    const posCode = positionStr.length >= 2 ? positionStr.substring(0, 2) : 'A1';
    const column = posCode.charAt(0).toUpperCase();
    const floor = parseInt(posCode.charAt(1)) || 1;
    
    const position = {
      column: (column >= 'A' && column <= 'H' ? column : 'A') as any,
      floor: (floor >= 1 && floor <= 4 ? floor : 1) as any,
      toString: () => formData.position || 'A1'
    };

    try {
      if (cadastroMultiplo) {
        // Cadastro múltiplo otimizado - inserção em lote
        const loteId = formData.lote_id || `LOTE-${Date.now()}`;
        
        const itemsToAdd = multipleItems.map((item, i) => ({
          codigo: `${formData.codigo}-${i + 1}`,
          nome: formData.nome ? `${formData.nome} - Item ${i + 1}` : `Item ${i + 1}`,
          tipo: formData.tipo,
          attributes: {
            polegada: parseFloat(formData.polegada) || undefined
          },
          acabamento: formData.acabamento,
          peso_bruto: item.peso_bruto,
          peso_liquido: item.peso_liquido,
          quantidade: 1,
          quantidade_disponivel: 1,
          quantidade_reservada: 0,
          quantidade_avaria: 0,
          position,
          status: 'disponivel' as const,
          observacoes: item.observacoes,
          lote_id: loteId,
          usina: formData.usina || undefined
        }));

        const newItems = await InventoryStorage.addMultipleItems(itemsToAdd);
        
        if (newItems.length > 0) {
          onStockEntry(newItems[0]);
        }

        toast({
          title: 'Sucesso',
          description: `${multipleItems.length} itens cadastrados com sucesso!`
        });
      } else {
        // Cadastro simples
        const newItem = await InventoryStorage.addItem({
          codigo: formData.codigo,
          nome: formData.nome,
          tipo: formData.tipo,
          attributes: {
            polegada: parseFloat(formData.polegada) || undefined
          },
          acabamento: formData.acabamento,
          peso_bruto: parseFloat(formData.peso_bruto) || undefined,
          peso_liquido: parseFloat(formData.peso_liquido) || undefined,
          quantidade: parseInt(formData.quantidade) || 1,
          quantidade_disponivel: parseInt(formData.quantidade) || 1,
          quantidade_reservada: 0,
          quantidade_avaria: 0,
          position,
          status: 'disponivel',
          lote_id: formData.lote_id || undefined,
          usina: formData.usina || undefined,
          observacoes: formData.observacoes || undefined
        });

        onStockEntry(newItem);
        
        toast({
          title: 'Sucesso',
          description: 'Item cadastrado com sucesso!'
        });
      }
      
      // Reset form
      setFormData({
        codigo: '',
        nome: '',
        tipo: '' as ItemType,
        acabamento: '',
        peso_bruto: '',
        peso_liquido: '',
        quantidade: '',
        position: '',
        polegada: '',
        lote_id: '',
        usina: '',
        observacoes: ''
      });
      setMultipleItems([]);
      setCadastroMultiplo(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar item(s)',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-industrial-blue" />
          Nova Entrada de Estoque
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle para Cadastro Múltiplo */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Cadastro Múltiplo por Peso</Label>
              <p className="text-sm text-muted-foreground">
                Cadastre vários itens de uma vez, cada um com peso individual
              </p>
            </div>
            <Switch
              checked={cadastroMultiplo}
              onCheckedChange={(checked) => {
                setCadastroMultiplo(checked);
                if (checked) {
                  // Limpar campos individuais quando ativar modo múltiplo
                  setFormData(prev => ({
                    ...prev,
                    quantidade: '',
                    peso_bruto: '',
                    peso_liquido: ''
                  }));
                  setMultipleItems([{ peso_bruto: 0, peso_liquido: 0, observacoes: '' }]);
                } else {
                  setMultipleItems([]);
                }
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código / Perfil</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: ALU001"
                required
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

          <div className="grid gap-4 md:grid-cols-2">
            {!cadastroMultiplo && (
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Material</Label>
              <Select value={formData.tipo} onValueChange={(value: ItemType) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ITEM_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position">Empresa/Local de Armazenamento</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: ALCAST, BAUX, IBRAME, Galpão 1..."
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Nome da empresa ou local onde o material está armazenado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="polegada">Polegada</Label>
              <Input
                id="polegada"
                type="number"
                step="0.01"
                value={formData.polegada}
                onChange={(e) => setFormData({ ...formData, polegada: e.target.value })}
                placeholder="Ex: 1.5"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="acabamento">Acabamento</Label>
              <Input
                id="acabamento"
                value={formData.acabamento}
                onChange={(e) => setFormData({ ...formData, acabamento: e.target.value })}
                placeholder="Ex: Anodizado, Pintado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lote_id">Número do Lote</Label>
              <Input
                id="lote_id"
                value={formData.lote_id}
                onChange={(e) => setFormData({ ...formData, lote_id: e.target.value })}
                placeholder="Ex: LOTE-2024-001 (opcional)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usina">Usina</Label>
            <Input
              id="usina"
              value={formData.usina}
              onChange={(e) => setFormData({ ...formData, usina: e.target.value })}
              placeholder="Nome da usina de fabricação"
            />
          </div>

          {!cadastroMultiplo && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="peso_bruto">Peso Bruto (kg)</Label>
                  <Input
                    id="peso_bruto"
                    type="number"
                    step="0.01"
                    value={formData.peso_bruto}
                    onChange={(e) => setFormData({ ...formData, peso_bruto: e.target.value })}
                    placeholder="0.00"
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
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value.slice(0, 1000) })}
                  placeholder="Adicione observações sobre este item... (máx. 1000 caracteres)"
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </>
          )}

          {/* Cadastro Múltiplo por Peso */}
          {cadastroMultiplo && (
            <MultipleItemsEntry
              items={multipleItems}
              onChange={setMultipleItems}
              itemName={formData.nome || "Item"}
            />
          )}


          <Button type="submit" className="w-full bg-gradient-primary shadow-industrial">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar ao Estoque
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}