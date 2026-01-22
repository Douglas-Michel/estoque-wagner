import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrdemSaida } from '@/types/ordem-saida';
import { ITEM_TYPE_LABELS } from '@/types/inventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Sanitize text for PDF generation to prevent potential XSS
const sanitizeForPDF = (text: string | undefined | null): string => {
  if (!text) return '';
  return text
    .replace(/[<>"']/g, '') // Remove HTML special chars
    .slice(0, 1000); // Enforce max length
};

export class PDFGenerator {
  static gerarOrdemSaida(ordem: OrdemSaida): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header - Logo and Title
    doc.setFillColor(41, 128, 185); // Blue header
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Sistema de Estoque', 15, 20);
    
    doc.setFontSize(16);
    doc.text('Ordem de Saída', 15, 32);

    // Order info box
    doc.setFillColor(236, 240, 241);
    doc.rect(0, 45, pageWidth, 35, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORDEM DE SAÍDA - ${ordem.numero_ordem}`, 15, 57);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emitido por: ${ordem.usuario_nome || 'N/A'}`, 15, 67);
    doc.text(
      `Data: ${format(ordem.data_emissao, "dd/MM/yyyy - HH:mm", { locale: ptBR })}`,
      15,
      73
    );

    // Items table
    const tableData = (ordem.itens || []).map((item) => {
      // Build observation field with empresa name - sanitize for PDF
      let observacao = sanitizeForPDF(item.empresa) || '-';
      if (item.observacoes) {
        const sanitizedObs = sanitizeForPDF(item.observacoes);
        observacao += observacao === '-' ? sanitizedObs : ` | ${sanitizedObs}`;
      }
      
      return [
        sanitizeForPDF(item.codigo),
        ITEM_TYPE_LABELS[item.tipo as keyof typeof ITEM_TYPE_LABELS] || sanitizeForPDF(item.tipo),
        item.quantidade.toString(),
        `${item.position_column}${item.position_floor}`,
        observacao
      ];
    });

    autoTable(doc, {
      startY: 90,
      head: [['Código', 'Material', 'Qtde', 'Posição', 'Empresa/Observação']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        4: { cellWidth: 'auto' }
      }
    });

    // Get the Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY || 90;

    // Observations - sanitized
    if (ordem.observacoes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações Gerais:', 15, finalY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(sanitizeForPDF(ordem.observacoes), 15, finalY + 22);
    }

    // Signature section
    const signatureY = finalY + (ordem.observacoes ? 40 : 30);
    doc.setDrawColor(0, 0, 0);
    doc.line(15, signatureY, 90, signatureY);
    doc.line(120, signatureY, 195, signatureY);
    
    doc.setFontSize(9);
    doc.text('Retirado por:', 15, signatureY + 7);
    doc.text('Liberado por:', 120, signatureY + 7);

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Save PDF
    doc.save(`Ordem_Saida_${ordem.numero_ordem}.pdf`);
  }
}
