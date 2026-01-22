import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { StockMovement, InventoryItem } from '@/types/inventory';
import { MovementStorage } from '@/lib/storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MovementsListProps {
  movements: StockMovement[];
  items: InventoryItem[];
}

export function MovementsList({ movements, items }: MovementsListProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredMovements, setFilteredMovements] = useState(movements);

  const filterByDate = () => {
    if (!startDate || !endDate) {
      setFilteredMovements(movements);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include full end date
    
    const filtered = movements.filter(movement => 
      movement.timestamp >= start && movement.timestamp <= end
    );
    setFilteredMovements(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredMovements(movements);
  };

  const getItemCode = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item?.codigo || 'Item removido';
  };

  const exportToCSV = async () => {
    await MovementStorage.logReportGeneration('CSV Export');
    
    const dataAtual = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const periodoInicio = startDate ? format(new Date(startDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Início';
    const periodoFim = endDate ? format(new Date(endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'Hoje';
    
    // Separador para Excel PT-BR (ponto-e-vírgula)
    const separator = ';';
    
    // Cabeçalho do relatório com informações da empresa
    const header = [
      '═══════════════════════════════════════════════════════════════════════',
      'SISTEMA DE ESTOQUE',
      'Relatório de Movimentações de Estoque',
      `Data de Emissão${separator} ${dataAtual}`,
      `Período${separator} ${periodoInicio} até ${periodoFim}`,
      '═══════════════════════════════════════════════════════════════════════',
      ''
    ].join('\n');
    
    // Cabeçalhos das colunas
    const columnHeaders = ['Data/Hora', 'Tipo', 'Código do Item', 'Posição Torre', 'Quantidade', 'Usuário', 'Observações'].join(separator);
    
    // Dados das movimentações
    const movementsData = filteredMovements
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map(movement => [
        format(movement.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        movement.tipo.toUpperCase(),
        getItemCode(movement.itemId),
        `${movement.position.column}${movement.position.floor}`,
        movement.quantidade,
        movement.userName || movement.userEmail || '-',
        movement.observacoes || '-'
      ].join(separator));
    
    // Rodapé com resumo
    const summary = [
      '',
      '═══════════════════════════════════════════════════════════════════════',
      'RESUMO DO PERÍODO',
      '═══════════════════════════════════════════════════════════════════════',
      `Total de Movimentações${separator}${filteredMovements.length}`,
      `Total de Entradas${separator}${totalEntradas}`,
      `Total de Saídas${separator}${totalSaidas}`,
      `Saldo Líquido${separator}${totalEntradas - totalSaidas}`,
      '',
      '═══════════════════════════════════════════════════════════════════════',
      `Relatório gerado em${separator}${dataAtual}`,
      `Sistema de Estoque`,
      '═══════════════════════════════════════════════════════════════════════'
    ].join('\n');
    
    // Monta o CSV completo
    const csvData = [
      header,
      columnHeaders,
      ...movementsData,
      summary
    ].join('\n');

    // UTF-8 BOM para garantir que os caracteres especiais sejam exibidos corretamente no Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `Estoque_Movimentacoes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalEntradas = filteredMovements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.quantidade, 0);
  const totalSaidas = filteredMovements.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.quantidade, 0);

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-industrial-blue" />
            Relatório de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-2">
              <Label className="invisible md:visible">Ações</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={filterByDate} className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex-1"
                >
                  Limpar Filtros
                </Button>
                <Button 
                  variant="outline" 
                  onClick={exportToCSV}
                  disabled={filteredMovements.length === 0}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Entradas</p>
                    <p className="text-2xl font-bold text-available">{totalEntradas}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-available" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Saídas</p>
                    <p className="text-2xl font-bold text-occupied">{totalSaidas}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-occupied" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                    <p className={`text-2xl font-bold ${totalEntradas - totalSaidas >= 0 ? 'text-available' : 'text-occupied'}`}>
                      {totalEntradas - totalSaidas}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-industrial-blue" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            Histórico de Movimentações ({filteredMovements.length} {filteredMovements.length === 1 ? 'registro' : 'registros'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-mono text-sm">
                        {format(movement.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={movement.tipo === 'entrada' ? 'default' : 'secondary'}>
                          {movement.tipo === 'entrada' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {movement.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getItemCode(movement.itemId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {movement.position.column}{movement.position.floor}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.quantidade} un.
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.userName || movement.userEmail || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {movement.observacoes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {startDate || endDate ? 'Nenhuma movimentação encontrada no período selecionado.' : 'Nenhuma movimentação registrada.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}