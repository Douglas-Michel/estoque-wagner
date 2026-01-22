import { useState, useEffect } from 'react';
import { loadTowerConfig, TowerConfig } from '@/lib/tower-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Package, Circle, Settings, Cylinder, Box } from 'lucide-react';
import { TowerPosition, COLUMNS, FLOORS, InventoryItem, ITEM_TYPE_LABELS } from '@/types/inventory';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import { InventoryStorage } from '@/lib/storage';
import { TowerConfigDialog } from './TowerConfigDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { PositionItemsDialog } from './PositionItemsDialog';

interface TowerVisualizationProps {
  positions: TowerPosition[];
  onUpdate: () => void;
}

const STATUS_COLORS = {
  disponivel: 'bg-blue-500 border-blue-500',
  reservado: 'bg-yellow-500 border-yellow-500',
  avaria: 'bg-red-500 border-red-500'
};

const TYPE_ICONS = {
  tarugo: Cylinder,
  lingote: Box
};

export function TowerVisualization({ positions, onUpdate }: TowerVisualizationProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [columnConfig, setColumnConfig] = useState<TowerConfig>({});
  const [loading, setLoading] = useState(true);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [itemsAtPosition, setItemsAtPosition] = useState<InventoryItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const config = await loadTowerConfig();
    setColumnConfig(config);
    setLoading(false);
  };

  const getPosition = (column: string, floor: number) => {
    return positions.find(p => p.position.column === column && p.position.floor === floor);
  };

  const handlePositionClick = (position: TowerPosition) => {
    if (position.occupied && position.items && position.items.length > 0) {
      if (position.items.length === 1) {
        setSelectedItem(position.items[0]);
        setDialogOpen(true);
      } else {
        setItemsAtPosition(position.items);
        setItemsDialogOpen(true);
      }
    }
  };

  const handleUpdateConfig = async (newConfig: TowerConfig) => {
    setColumnConfig(newConfig);
    await loadConfig(); // Reload from database to ensure we have the latest
    onUpdate(); // Trigger parent component update
  };

  const columns = Object.keys(columnConfig).sort();
  const allFloors = Array.from(
    new Set(Object.values(columnConfig).flat())
  ).sort((a, b) => a - b);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Carregando configuração do estoque...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        <Card className="shadow-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-industrial-blue" />
                  <span className="text-base sm:text-lg">Posições de Estoque</span>
                </div>
                <Button onClick={() => setConfigDialogOpen(true)} variant="outline" size="sm" className="text-xs sm:text-sm">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Configurar</span>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Circle className="h-3 w-3 sm:h-4 sm:w-4 fill-available text-available" />
                  <span>Livre</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-blue-500" />
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-yellow-500" />
                  <span>Reservado</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500" />
                  <span>Avaria</span>
                </div>
                <div className="border-l pl-3 ml-2 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Cylinder className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <span>Tarugo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Box className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <span>Lingote</span>
                  </div>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-max px-4 sm:px-0 space-y-3 sm:space-y-6">
              {/* Column Headers */}
              <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `60px repeat(${columns.length}, minmax(140px, 1fr))` }}>
                <div className="text-center text-xs sm:text-sm font-medium text-muted-foreground">Andar</div>
                {columns.map(column => (
                  <div key={column} className="text-center">
                    <div className="text-base sm:text-lg font-bold text-industrial-steel">{column}</div>
                  </div>
                ))}
              </div>

              {/* Grid */}
              {allFloors.slice().reverse().map(floor => (
                <div key={floor} className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `60px repeat(${columns.length}, minmax(140px, 1fr))` }}>
                  <div className="flex items-center justify-center">
                    <span className="text-base sm:text-lg font-bold text-industrial-steel">{floor}º</span>
                  </div>
                {columns.map(column => {
                  // Verifica se esta coluna tem este andar
                  const columnHasFloor = columnConfig[column]?.includes(floor);
                  
                  if (!columnHasFloor) {
                    // Mostra célula vazia/desabilitada
                    return (
                      <div key={`${column}${floor}`} className="h-32 sm:h-36 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/20" />
                    );
                  }

                  const position = getPosition(column, floor);
                  
                  // Aggregate quantities from all items at this position
                  const allItems = position?.items || [];
                  const totalQuantidade = allItems.reduce((sum, item) => sum + item.quantidade, 0);
                  const totalPesoBruto = allItems.reduce((sum, item) => sum + (item.peso_bruto || 0), 0);
                  const totalPesoLiquido = allItems.reduce((sum, item) => sum + (item.peso_liquido || 0), 0);
                  const totalDisponivel = allItems.reduce((sum, item) => sum + item.quantidade_disponivel, 0);
                  const totalReservado = allItems.reduce((sum, item) => sum + item.quantidade_reservada, 0);
                  const totalAvaria = allItems.reduce((sum, item) => sum + item.quantidade_avaria, 0);
                  
                  // Get the primary type (first item's type or most common)
                  const primaryType = allItems[0]?.tipo;
                  const TypeIcon = primaryType ? TYPE_ICONS[primaryType as keyof typeof TYPE_ICONS] || Package : Package;
                  
                  // Determine the visual representation based on aggregated quantities
                  const hasDisponivel = totalDisponivel > 0;
                  const hasReservado = totalReservado > 0;
                  const hasAvaria = totalAvaria > 0;
                  
                  // Determine background color based on status
                  let bgColor = 'bg-blue-500/10 border-blue-500';
                  let textColor = 'text-blue-700';
                  if (totalAvaria === totalQuantidade && totalQuantidade > 0) {
                    bgColor = 'bg-red-500/10 border-red-500';
                    textColor = 'text-red-700';
                  } else if (totalReservado === totalQuantidade && totalQuantidade > 0) {
                    bgColor = 'bg-yellow-500/10 border-yellow-500';
                    textColor = 'text-yellow-700';
                  } else if (hasReservado || hasAvaria) {
                    bgColor = 'bg-orange-500/10 border-orange-500';
                    textColor = 'text-orange-700';
                  }
                  
                  return (
                    <Tooltip key={`${column}${floor}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            h-32 sm:h-36 rounded-lg border-2 transition-all cursor-pointer p-2 sm:p-3 flex flex-col
                            ${position?.occupied 
                              ? `${bgColor} hover:opacity-80` 
                              : 'bg-available/10 border-available border-dashed hover:bg-available/20'
                            }
                          `}
                          onClick={() => position && handlePositionClick(position)}
                        >
                          {position?.occupied && allItems.length > 0 ? (
                            <>
                              {/* Header with position and type icon */}
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs font-bold">
                                  {column}{floor}
                                </Badge>
                                <TypeIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${textColor}`} />
                              </div>
                              
                              {/* Type label */}
                              <div className={`text-xs sm:text-sm font-semibold ${textColor} mb-1`}>
                                {ITEM_TYPE_LABELS[primaryType as keyof typeof ITEM_TYPE_LABELS] || primaryType}
                              </div>
                              
                              {/* Quantity */}
                              <div className="text-lg sm:text-xl font-bold text-foreground">
                                {totalQuantidade} <span className="text-xs font-normal text-muted-foreground">un.</span>
                              </div>
                              
                              {/* Weight info */}
                              <div className="mt-auto space-y-0.5">
                                {totalPesoBruto > 0 && (
                                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                                    <span className="font-medium">Bruto:</span> {totalPesoBruto.toFixed(1)} kg
                                  </div>
                                )}
                                {totalPesoLiquido > 0 && (
                                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                                    <span className="font-medium">Líq:</span> {totalPesoLiquido.toFixed(1)} kg
                                  </div>
                                )}
                              </div>
                              
                              {/* Status indicators */}
                              {(hasReservado || hasAvaria) && (
                                <div className="flex gap-1 mt-1">
                                  {hasDisponivel && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500" title={`Disponível: ${totalDisponivel}`} />
                                  )}
                                  {hasReservado && (
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" title={`Reservado: ${totalReservado}`} />
                                  )}
                                  {hasAvaria && (
                                    <div className="w-2 h-2 rounded-full bg-red-500" title={`Avaria: ${totalAvaria}`} />
                                  )}
                                </div>
                              )}
                              
                              {/* Multiple items indicator */}
                              {allItems.length > 1 && (
                                <div className="text-[10px] text-muted-foreground mt-1">
                                  {allItems.length} itens
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <Circle className="h-6 w-6 sm:h-8 sm:w-8 text-available mb-2" />
                              <Badge variant="secondary" className="text-xs">
                                {column}{floor}
                              </Badge>
                              <span className="text-xs text-muted-foreground mt-1">Livre</span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      {position?.occupied && allItems.length > 0 && (
                        <TooltipContent className="max-w-xs">
                          <div className="text-sm space-y-2">
                            <div className="font-bold border-b pb-1">
                              Posição {column}{floor}
                            </div>
                            {allItems.map((item, idx) => (
                              <div key={item.id} className={idx > 0 ? 'border-t pt-2' : ''}>
                                <div className="font-semibold">{item.codigo}</div>
                                {item.nome && <div className="text-muted-foreground">{item.nome}</div>}
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 text-xs">
                                  <span>Tipo:</span>
                                  <span className="font-medium">{ITEM_TYPE_LABELS[item.tipo as keyof typeof ITEM_TYPE_LABELS]}</span>
                                  <span>Qtd:</span>
                                  <span className="font-medium">{item.quantidade} un.</span>
                                  {item.peso_bruto && (
                                    <>
                                      <span>Peso Bruto:</span>
                                      <span className="font-medium">{item.peso_bruto} kg</span>
                                    </>
                                  )}
                                  {item.peso_liquido && (
                                    <>
                                      <span>Peso Líq:</span>
                                      <span className="font-medium">{item.peso_liquido} kg</span>
                                    </>
                                  )}
                                  {item.attributes?.polegada && (
                                    <>
                                      <span>Polegada:</span>
                                      <span className="font-medium">{item.attributes.polegada}"</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm sm:text-base font-medium mb-2 sm:mb-3">Legenda</h4>
            <div className="grid gap-2 text-xs sm:text-sm">
              <div>
                <strong>Configuração:</strong> {columns.length} colunas com diferentes alturas
              </div>
              <div>
                <strong>Ocupação:</strong> {positions.filter(p => p.occupied).length} posições ocupadas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ItemDetailsDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={onUpdate}
        availablePositions={positions}
      />

      <TowerConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        columnConfig={columnConfig}
        positions={positions}
        onUpdateConfig={handleUpdateConfig}
      />

      <PositionItemsDialog
        open={itemsDialogOpen}
        onOpenChange={setItemsDialogOpen}
        items={itemsAtPosition}
        onSelect={(it) => {
          setItemsDialogOpen(false);
          setSelectedItem(it);
          setDialogOpen(true);
        }}
      />
    </div>
    </TooltipProvider>
  );
}