import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Filter, Calendar, Package, MapPin, Tag, Weight, BarChart3 } from 'lucide-react';
import { InventoryItem, ITEM_TYPE_LABELS } from '@/types/inventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface RelatorioEntradasProps {
  items: InventoryItem[];
}

interface FiltrosRelatorio {
  dataInicio: string;
  dataFim: string;
  tipo: string;
  posicao: string;
  usina: string;
  lote: string;
}

interface CamposRelatorio {
  codigo: boolean;
  nome: boolean;
  tipo: boolean;
  quantidade: boolean;
  posicao: boolean;
  peso_bruto: boolean;
  peso_liquido: boolean;
  acabamento: boolean;
  polegada: boolean;
  usina: boolean;
  lote_id: boolean;
  data_entrada: boolean;
  observacoes: boolean;
}

export function RelatorioEntradas({ items }: RelatorioEntradasProps) {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    dataInicio: '',
    dataFim: '',
    tipo: 'todos',
    posicao: 'todas',
    usina: '',
    lote: ''
  });

  const [campos, setCampos] = useState<CamposRelatorio>({
    codigo: true,
    nome: true,
    tipo: true,
    quantidade: true,
    posicao: true,
    peso_bruto: true,
    peso_liquido: true,
    acabamento: false,
    polegada: false,
    usina: false,
    lote_id: false,
    data_entrada: true,
    observacoes: false
  });

  // Filtrar itens
  const itensFiltrados = useMemo(() => {
    return items.filter(item => {
      // Filtro de data
      if (filtros.dataInicio && item.createdAt) {
        const dataItem = new Date(item.createdAt);
        const dataInicio = new Date(filtros.dataInicio);
        if (dataItem < dataInicio) return false;
      }
      
      if (filtros.dataFim && item.createdAt) {
        const dataItem = new Date(item.createdAt);
        const dataFim = new Date(filtros.dataFim);
        dataFim.setHours(23, 59, 59);
        if (dataItem > dataFim) return false;
      }

      // Filtro de tipo
      if (filtros.tipo !== 'todos' && item.tipo !== filtros.tipo) return false;

      // Filtro de posição
      if (filtros.posicao !== 'todas') {
        const posicaoItem = `${item.position.column}${item.position.floor}`;
        if (posicaoItem !== filtros.posicao) return false;
      }

      // Filtro de usina
      if (filtros.usina && item.usina?.toLowerCase().includes(filtros.usina.toLowerCase()) === false) {
        return false;
      }

      // Filtro de lote
      if (filtros.lote && item.lote_id?.toLowerCase().includes(filtros.lote.toLowerCase()) === false) {
        return false;
      }

      return true;
    });
  }, [items, filtros]);

  // Obter posições únicas
  const posicoesUnicas = useMemo(() => {
    const posicoes = new Set(items.map(item => `${item.position.column}${item.position.floor}`));
    return Array.from(posicoes).sort();
  }, [items]);

  const gerarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Entradas - Estoque', 14, 22);
    
    // Data do relatório
    doc.setFontSize(11);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 30);
    doc.text(`Total de Itens: ${itensFiltrados.length}`, 14, 36);

    // Filtros aplicados
    let yPos = 42;
    doc.setFontSize(10);
    doc.text('Filtros Aplicados:', 14, yPos);
    yPos += 6;
    
    if (filtros.dataInicio) {
      doc.text(`• Período: ${format(new Date(filtros.dataInicio), 'dd/MM/yyyy', { locale: ptBR })} até ${filtros.dataFim ? format(new Date(filtros.dataFim), 'dd/MM/yyyy', { locale: ptBR }) : 'hoje'}`, 14, yPos);
      yPos += 5;
    }
    if (filtros.tipo !== 'todos') {
      doc.text(`• Tipo: ${ITEM_TYPE_LABELS[filtros.tipo as keyof typeof ITEM_TYPE_LABELS]}`, 14, yPos);
      yPos += 5;
    }

    // Preparar dados da tabela
    const headers: string[] = [];
    const camposAtivos = Object.entries(campos).filter(([_, value]) => value);

    camposAtivos.forEach(([campo]) => {
      switch (campo) {
        case 'codigo': headers.push('Código'); break;
        case 'nome': headers.push('Nome'); break;
        case 'tipo': headers.push('Tipo'); break;
        case 'quantidade': headers.push('Qtd'); break;
        case 'posicao': headers.push('Posição'); break;
        case 'peso_bruto': headers.push('P. Bruto'); break;
        case 'peso_liquido': headers.push('P. Líquido'); break;
        case 'acabamento': headers.push('Acabamento'); break;
        case 'polegada': headers.push('Polegada'); break;
        case 'usina': headers.push('Usina'); break;
        case 'lote_id': headers.push('Lote'); break;
        case 'data_entrada': headers.push('Data'); break;
        case 'observacoes': headers.push('Observações'); break;
      }
    });

    const data = itensFiltrados.map(item => {
      const row: any[] = [];
      camposAtivos.forEach(([campo]) => {
        switch (campo) {
          case 'codigo': row.push(item.codigo); break;
          case 'nome': row.push(item.nome || '-'); break;
          case 'tipo': row.push(ITEM_TYPE_LABELS[item.tipo]); break;
          case 'quantidade': row.push(item.quantidade); break;
          case 'posicao': row.push(`${item.position.column}${item.position.floor}`); break;
          case 'peso_bruto': row.push(item.peso_bruto ? `${item.peso_bruto} kg` : '-'); break;
          case 'peso_liquido': row.push(item.peso_liquido ? `${item.peso_liquido} kg` : '-'); break;
          case 'acabamento': row.push(item.acabamento || '-'); break;
          case 'polegada': row.push(item.attributes?.polegada || '-'); break;
          case 'usina': row.push(item.usina || '-'); break;
          case 'lote_id': row.push(item.lote_id || '-'); break;
          case 'data_entrada': 
            row.push(item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yy', { locale: ptBR }) : '-'); 
            break;
          case 'observacoes': row.push(item.observacoes || '-'); break;
        }
      });
      return row;
    });

    // Adicionar tabela
    (doc as any).autoTable({
      startY: yPos + 5,
      head: [headers],
      body: data,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 10 }
    });

    // Salvar PDF
    const nomeArquivo = `relatorio_entradas_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
    doc.save(nomeArquivo);
  };

  const exportarCSV = () => {
    const camposAtivos = Object.entries(campos).filter(([_, value]) => value);
    
    // Cabeçalho
    const headers = camposAtivos.map(([campo]) => {
      switch (campo) {
        case 'codigo': return 'Código';
        case 'nome': return 'Nome';
        case 'tipo': return 'Tipo';
        case 'quantidade': return 'Quantidade';
        case 'posicao': return 'Posição';
        case 'peso_bruto': return 'Peso Bruto (kg)';
        case 'peso_liquido': return 'Peso Líquido (kg)';
        case 'acabamento': return 'Acabamento';
        case 'polegada': return 'Polegada';
        case 'usina': return 'Usina';
        case 'lote_id': return 'Lote';
        case 'data_entrada': return 'Data de Entrada';
        case 'observacoes': return 'Observações';
        default: return campo;
      }
    });

    // Dados
    const rows = itensFiltrados.map(item => {
      return camposAtivos.map(([campo]) => {
        let value: any;
        switch (campo) {
          case 'codigo': value = item.codigo; break;
          case 'nome': value = item.nome || ''; break;
          case 'tipo': value = ITEM_TYPE_LABELS[item.tipo]; break;
          case 'quantidade': value = item.quantidade; break;
          case 'posicao': value = `${item.position.column}${item.position.floor}`; break;
          case 'peso_bruto': value = item.peso_bruto || ''; break;
          case 'peso_liquido': value = item.peso_liquido || ''; break;
          case 'acabamento': value = item.acabamento || ''; break;
          case 'polegada': value = item.attributes?.polegada || ''; break;
          case 'usina': value = item.usina || ''; break;
          case 'lote_id': value = item.lote_id || ''; break;
          case 'data_entrada': 
            value = item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''; 
            break;
          case 'observacoes': value = item.observacoes || ''; break;
          default: value = '';
        }
        // Escapar aspas duplas e envolver em aspas se contém vírgula
        const stringValue = String(value);
        return stringValue.includes(',') || stringValue.includes('"') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue;
      });
    });

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_entradas_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Relatório de Entradas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filtros */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Filter className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Filtros</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dataInicio" className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Data Início
                </Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim" className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Data Fim
                </Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo" className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  Tipo de Material
                </Label>
                <Select value={filtros.tipo} onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {Object.entries(ITEM_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="posicao" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Posição
                </Label>
                <Select value={filtros.posicao} onValueChange={(value) => setFiltros({ ...filtros, posicao: value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todas as posições" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as posições</SelectItem>
                    {posicoesUnicas.map(pos => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usina" className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Usina
                </Label>
                <Input
                  id="usina"
                  value={filtros.usina}
                  onChange={(e) => setFiltros({ ...filtros, usina: e.target.value })}
                  placeholder="Filtrar por usina..."
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lote" className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Lote
                </Label>
                <Input
                  id="lote"
                  value={filtros.lote}
                  onChange={(e) => setFiltros({ ...filtros, lote: e.target.value })}
                  placeholder="Filtrar por lote..."
                  className="h-10"
                />
              </div>
            </div>

            {/* Campos do Relatório */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Weight className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Campos do Relatório</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(campos).map(([campo, ativo]) => (
                  <div key={campo} className="flex items-center space-x-2">
                    <Checkbox
                      id={campo}
                      checked={ativo}
                      onCheckedChange={(checked) => 
                        setCampos({ ...campos, [campo]: checked as boolean })
                      }
                    />
                    <label
                      htmlFor={campo}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {campo === 'codigo' && 'Código'}
                      {campo === 'nome' && 'Nome'}
                      {campo === 'tipo' && 'Tipo'}
                      {campo === 'quantidade' && 'Quantidade'}
                      {campo === 'posicao' && 'Posição'}
                      {campo === 'peso_bruto' && 'Peso Bruto'}
                      {campo === 'peso_liquido' && 'Peso Líquido'}
                      {campo === 'acabamento' && 'Acabamento'}
                      {campo === 'polegada' && 'Polegada'}
                      {campo === 'usina' && 'Usina'}
                      {campo === 'lote_id' && 'Lote'}
                      {campo === 'data_entrada' && 'Data Entrada'}
                      {campo === 'observacoes' && 'Observações'}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo e Ações */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{itensFiltrados.length}</span> {itensFiltrados.length === 1 ? 'item encontrado' : 'itens encontrados'}
              </div>
              <div className="flex gap-2">
                <Button onClick={exportarCSV} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
                <Button onClick={gerarPDF} className="gap-2 bg-gradient-primary">
                  <FileText className="h-4 w-4" />
                  Gerar PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview dos Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {campos.codigo && <th className="text-left p-2 font-semibold">Código</th>}
                  {campos.nome && <th className="text-left p-2 font-semibold">Nome</th>}
                  {campos.tipo && <th className="text-left p-2 font-semibold">Tipo</th>}
                  {campos.quantidade && <th className="text-left p-2 font-semibold">Qtd</th>}
                  {campos.posicao && <th className="text-left p-2 font-semibold">Posição</th>}
                  {campos.peso_bruto && <th className="text-left p-2 font-semibold">P. Bruto</th>}
                  {campos.peso_liquido && <th className="text-left p-2 font-semibold">P. Líquido</th>}
                  {campos.data_entrada && <th className="text-left p-2 font-semibold">Data</th>}
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.slice(0, 10).map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                    {campos.codigo && <td className="p-2">{item.codigo}</td>}
                    {campos.nome && <td className="p-2">{item.nome || '-'}</td>}
                    {campos.tipo && <td className="p-2">{ITEM_TYPE_LABELS[item.tipo]}</td>}
                    {campos.quantidade && <td className="p-2">{item.quantidade}</td>}
                    {campos.posicao && <td className="p-2">{item.position.column}{item.position.floor}</td>}
                    {campos.peso_bruto && <td className="p-2">{item.peso_bruto ? `${item.peso_bruto} kg` : '-'}</td>}
                    {campos.peso_liquido && <td className="p-2">{item.peso_liquido ? `${item.peso_liquido} kg` : '-'}</td>}
                    {campos.data_entrada && (
                      <td className="p-2">
                        {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {itensFiltrados.length > 10 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Mostrando 10 de {itensFiltrados.length} itens. Exporte para ver todos.
              </p>
            )}
            {itensFiltrados.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum item encontrado com os filtros aplicados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
