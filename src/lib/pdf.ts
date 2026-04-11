import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './utils';
import { supabase } from './supabase';

export async function generateMonthlyPDF(business: any) {
  try {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const añoActual = hoy.getFullYear();
    const primerDiaMes = new Date(añoActual, mesActual, 1).toISOString();
    const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0, 23, 59, 59).toISOString();

    const { data: services, error } = await supabase
      .from('services')
      .select('amount, date, status, clients(name)')
      .eq('business_id', business.id)
      .gte('date', primerDiaMes)
      .lte('date', ultimoDiaMes)
      .order('date', { ascending: true });

    if (error) throw error;

    const totalCobrado = (services || []).filter(s => s.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalPendiente = (services || []).filter(s => s.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalServicios = (services || []).length;

    const doc = new jsPDF();
    const isES = business?.country === 'ES';

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(business.business_name || 'Velora Pure', 14, 20);
    
    let currentY = 28;
    if (isES && business?.nif_cif) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`NIF/CIF: ${business.nif_cif}`, 14, currentY);
      currentY += 6;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporte Mensual - ${hoy.toLocaleString(isES ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase()}`, 14, currentY);

    // Resumen
    currentY += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Resumen del Mes', 14, currentY);
    
    currentY += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Cobrado: ${formatCurrency(totalCobrado, business?.country)}`, 14, currentY);
    if (isES) {
      doc.setFontSize(9);
      doc.text(`(Exento de Base: ${formatCurrency(totalCobrado / 1.21, business?.country)} | IVA 21%: ${formatCurrency(totalCobrado - (totalCobrado / 1.21), business?.country)})`, 14, currentY + 5);
      currentY += 5;
      doc.setFontSize(11);
    }
    
    currentY += 7;
    doc.text(`Total Pendiente: ${formatCurrency(totalPendiente, business?.country)}`, 14, currentY);
    currentY += 7;
    doc.text(`Total Servicios Realizados: ${totalServicios}`, 14, currentY);

    currentY += 8;

    // Tabla de Servicios
    const tableBody = (services || []).map(s => {
      const clientName = Array.isArray(s.clients) ? (s.clients as any[])[0]?.name : (s.clients as any)?.name;
      return [
        formatDate(s.date, business?.country),
        clientName || 'Cliente sin nombre',
        formatCurrency(s.amount, business?.country),
        s.status === 'paid' ? 'Pagado' : 'Pendiente'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Fecha', 'Cliente', 'Monto', 'Estado']],
      body: tableBody,
      headStyles: { fillColor: [139, 92, 246] }, // --accent color
      theme: 'grid',
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
            'Generado por Velora Pure',
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    const mesStr = (mesActual + 1).toString().padStart(2, '0');
    doc.save(`reporte-${mesStr}-${añoActual}-${business.business_name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    return true;
  } catch (err) {
    console.error('Error al generar PDF', err);
    return false;
  }
}
