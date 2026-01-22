import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Package } from 'lucide-react';

export interface ItemEntry {
  peso_bruto: number;
  peso_liquido: number;
  observacoes?: string;
}

interface MultipleItemsEntryProps {
  items: ItemEntry[];
  onChange: (items: ItemEntry[]) => void;
  itemName?: string;
}

export function MultipleItemsEntry({ items, onChange, itemName = "Item" }: MultipleItemsEntryProps) {
  const handleAddItem = () => {
    onChange([...items, { peso_bruto: 0, peso_liquido: 0, observacoes: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ItemEntry, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-industrial-blue" />
            Cadastro Múltiplo ({items.length} {items.length === 1 ? itemName : `${itemName}s`})
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar {itemName}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum {itemName.toLowerCase()} adicionado</p>
            <p className="text-sm mt-1">Clique em "Adicionar {itemName}" para começar</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{itemName} #{index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Peso Bruto (kg) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.peso_bruto || ''}
                    onChange={(e) => handleUpdateItem(index, 'peso_bruto', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Peso Líquido (kg) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.peso_liquido || ''}
                    onChange={(e) => handleUpdateItem(index, 'peso_liquido', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={item.observacoes || ''}
                  onChange={(e) => handleUpdateItem(index, 'observacoes', e.target.value)}
                  placeholder={`Observações específicas deste ${itemName.toLowerCase()}...`}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
