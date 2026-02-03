import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Package, MapPin, Minus, ArrowRightLeft, Filter } from 'lucide-react';
import { InventoryItem, ItemType, ITEM_TYPE_LABELS, TEMPERA_OPTIONS } from '@/types/inventory';

interface SearchFormProps {
  items: InventoryItem[];
  onStockExit: (itemId: string, quantidade: number) => void;
  onTransfer?: (item: InventoryItem) => void;
}

export function SearchForm({ items, onStockExit, onTransfer }: SearchFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'codigo' | 'nome' | 'tipo' | 'acabamento' | 'atributos' | 'lote'>('codigo');
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');
  const [filterAcabamento, setFilterAcabamento] = useState<string>('all');
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [exitQuantities, setExitQuantities] = useState<{ [key: string]: number }>({});

  const handleSearch = () => {
    setHasSearched(true);
    let filtered = items;

    if (searchTerm) {
      switch (searchType) {
        case 'codigo':
          filtered = filtered.filter(item => 
            item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
          );
          break;
        case 'nome':
          filtered = filtered.filter(item => 
            item.nome?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          break;
        case 'tipo':
          filtered = filtered.filter(item => 
            ITEM_TYPE_LABELS[item.tipo].toLowerCase().includes(searchTerm.toLowerCase())
          );
          break;
        case 'acabamento':
          filtered = filtered.filter(item => 
            item.acabamento?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          break;
        case 'atributos':
          filtered = filtered.filter(item => 
            item.attributes.largura.toString().includes(searchTerm) ||
            item.attributes.altura.toString().includes(searchTerm) ||
            item.attributes.espessura.toString().includes(searchTerm) ||
            item.attributes.tempera.includes(searchTerm.toUpperCase())
          );
          break;
        case 'lote':
          filtered = filtered.filter(item => 
            item.lote_id?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          break;
      }
    }

    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(item => item.tipo === filterType);
    }

    if (filterAcabamento && filterAcabamento !== 'all') {
      filtered = filtered.filter(item => item.acabamento === filterAcabamento);
    }

    setResults(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSearchType('codigo');
    setFilterType('all');
    setFilterAcabamento('all');
    setResults([]);
    setHasSearched(false);
  };

  const acabamentoOptions = Array.from(new Set(items.map(item => item.acabamento).filter(Boolean)));

  const handleExit = (itemId: string) => {
    const quantidade = exitQuantities[itemId] || 1;
    onStockExit(itemId, quantidade);
    setExitQuantities({ ...exitQuantities, [itemId]: 1 });
  };

  const updateExitQuantity = (itemId: string, quantidade: number) => {
    setExitQuantities({ ...exitQuantities, [itemId]: quantidade });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-industrial-blue" />
            Consulta e Busca de Itens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search-term">Termo de Busca</Label>
              <Input
                id="search-term"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o termo..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-type">Buscar por</Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="codigo">Código / Perfil</SelectItem>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="tipo">Tipo de Material</SelectItem>
                  <SelectItem value="acabamento">Acabamento</SelectItem>
                  <SelectItem value="atributos">Atributos Técnicos</SelectItem>
                  <SelectItem value="lote">Número do Lote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-type">Filtrar por Tipo</Label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
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
              <Label htmlFor="filter-acabamento">Filtrar por Acabamento</Label>
              <Select value={filterAcabamento} onValueChange={(value: string) => setFilterAcabamento(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os acabamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os acabamentos</SelectItem>
                  {acabamentoOptions.map((acabamento) => (
                    <SelectItem key={acabamento} value={acabamento!}>
                      {acabamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1 bg-gradient-primary shadow-industrial">
              <Search className="w-4 h-4 mr-2" />
              Buscar Itens
            </Button>
            <Button onClick={handleClearFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Legend */}
      {hasSearched && (searchTerm || filterType !== 'all' || filterAcabamento !== 'all') && (
        <Card className="border-industrial-blue/20 bg-card/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-industrial-blue" />
              <span className="text-sm font-medium text-muted-foreground">Filtros ativos:</span>
              
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  <span className="text-muted-foreground">
                    {searchType === 'codigo' && 'Código/Perfil:'}
                    {searchType === 'nome' && 'Nome:'}
                    {searchType === 'tipo' && 'Tipo:'}
                    {searchType === 'acabamento' && 'Acabamento:'}
                    {searchType === 'atributos' && 'Atributos:'}
                    {searchType === 'lote' && 'Lote:'}
                  </span>
                  <span className="font-semibold">{searchTerm}</span>
                </Badge>
              )}
              
              {filterType !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-semibold">{ITEM_TYPE_LABELS[filterType as ItemType]}</span>
                </Badge>
              )}
              
              {filterAcabamento !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <span className="text-muted-foreground">Acabamento:</span>
                  <span className="font-semibold">{filterAcabamento}</span>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - Before Search */}
      {!hasSearched && (
        <Card className="shadow-card border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium">Pronto para buscar</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Configure os filtros acima e clique em "Buscar" para encontrar itens no estoque
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {hasSearched && results.length === 0 && (
        <Card className="shadow-card border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium">Nenhum item encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Tente ajustar os filtros ou usar outros termos de busca
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {hasSearched && results.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-industrial-blue" />
              Resultados da Busca ({results.length} {results.length === 1 ? 'item encontrado' : 'itens encontrados'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-lg">{item.codigo}</h3>
                        <Badge variant="outline">
                          {ITEM_TYPE_LABELS[item.tipo]}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                        <div>
                          <strong>Dimensões:</strong> {item.attributes.largura} × {item.attributes.altura} × {item.attributes.espessura}mm
                        </div>
                        <div>
                          <strong>Têmpera:</strong> {item.attributes.tempera}
                        </div>
                        {item.lote_id && (
                          <div>
                            <strong>Lote:</strong> {item.lote_id}
                          </div>
                        )}
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
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <strong>Posição:</strong> {item.position.column}{item.position.floor}
                        </div>
                        <div>
                          <strong>Quantidade:</strong> {item.quantidade} unidades
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={item.quantidade}
                          value={exitQuantities[item.id] || 1}
                          onChange={(e) => updateExitQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExit(item.id)}
                          disabled={!exitQuantities[item.id] && item.quantidade === 0}
                        >
                          <Minus className="w-4 h-4 mr-1" />
                          Saída
                        </Button>
                      </div>
                      {onTransfer && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onTransfer(item)}
                        >
                          <ArrowRightLeft className="w-4 h-4 mr-1" />
                          Transferir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm && results.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum item encontrado com os critérios especificados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}