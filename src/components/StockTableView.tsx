import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Edit, ArrowUpDown, Cylinder, Box, MapPin, Package2 } from 'lucide-react';
import { InventoryItem, ITEM_TYPE_LABELS } from '@/types/inventory';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import { EditItemDialog } from './EditItemDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StockTableViewProps {
  items: InventoryItem[];
  onUpdate: () => void;
  showAllByDefault?: boolean; // Se true, mostra todos os itens sem precisar buscar
}

type SortField = 'codigo' | 'tipo' | 'quantidade' | 'usina' | 'position';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'tarugo' | 'lingote';
type FilterStatus = 'all' | 'disponivel' | 'reservado' | 'avaria' | 'indisponivel';

const STATUS_LABELS = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  avaria: 'Avaria',
  indisponivel: 'Indisponível'
};

const STATUS_COLORS = {
  disponivel: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  reservado: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  avaria: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  indisponivel: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
};

export function StockTableView({ items, onUpdate, showAllByDefault = false }: StockTableViewProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('codigo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [hasSearched, setHasSearched] = useState(showAllByDefault);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleClear = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setHasSearched(false);
  };

  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.usina?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || item.tipo === filterType;
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'codigo':
          comparison = a.codigo.localeCompare(b.codigo);
          break;
        case 'tipo':
          comparison = a.tipo.localeCompare(b.tipo);
          break;
        case 'quantidade':
          comparison = a.quantidade - b.quantidade;
          break;
        case 'usina':
          comparison = (a.usina || '').localeCompare(b.usina || '');
          break;
        case 'position':
          comparison = a.position.toString().localeCompare(b.position.toString());
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditItem(item);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setEditItem(null);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nome, usina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="tarugo">Tarugos</SelectItem>
            <SelectItem value="lingote">Lingotes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="reservado">Reservado</SelectItem>
            <SelectItem value="avaria">Avaria</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>

        {hasSearched && (
          <Button onClick={handleClear} variant="outline">
            Limpar
          </Button>
        )}
      </div>

      {/* Empty State - Before Search */}
      {!hasSearched ? (
        <div className="border rounded-lg">
          <div className="py-24 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">Buscar itens no estoque</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Use os filtros acima para encontrar produtos. Pesquise por código, nome, usina ou empresa.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'item' : 'itens'}
          </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]">
                <div className="flex items-center gap-1">
                  <Package2 className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('tipo')}
                  className="-ml-3 h-8"
                >
                  Tipo
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('codigo')}
                  className="-ml-3 h-8"
                >
                  Código / Nome
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('usina')}
                  className="-ml-3 h-8"
                >
                  Usina / Empresa
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('position')}
                  className="-ml-3 h-8"
                >
                  Empresa/Local
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('quantidade')}
                  className="-ml-3 h-8"
                >
                  Total
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Disponível</TableHead>
              <TableHead className="text-center">Reservado</TableHead>
              <TableHead className="text-center">Avaria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    {item.tipo === 'tarugo' ? (
                      <Cylinder className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Box className="h-5 w-5 text-purple-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {ITEM_TYPE_LABELS[item.tipo]}
                      {item.attributes.polegada && ` ${item.attributes.polegada}"`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium text-sm">{item.codigo}</div>
                      {item.nome && (
                        <div className="text-xs text-muted-foreground">{item.nome}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {item.usina && (
                        <div className="text-sm font-medium">{item.usina}</div>
                      )}
                      {item.observacoes && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.observacoes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {item.position.column}{item.position.floor}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-base">{item.quantidade}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {item.quantidade_disponivel}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      {item.quantidade_reservada}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {item.quantidade_avaria}
                    </span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const actualStatus = item.quantidade_disponivel > 0 ? 'disponivel' : 'indisponivel';
                      return (
                        <Badge variant="outline" className={STATUS_COLORS[actualStatus]}>
                          {STATUS_LABELS[actualStatus]}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </>
      )}

      {selectedItem && (
        <ItemDetailsDialog
          item={selectedItem}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          onUpdate={onUpdate}
        />
      )}

      {editItem && (
        <EditItemDialog
          item={editItem}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
