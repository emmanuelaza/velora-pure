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

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(business.business_name || 'Velora Pure', 14, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporte Mensual - ${hoy.toLocaleString('es', { month: 'long', year: 'numeric' }).toUpperCase()}`, 14, 28);

    // Resumen
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Resumen del Mes', 14, 45);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Cobrado: ${formatCurrency(totalCobrado)}`, 14, 53);
    doc.text(`Total Pendiente: ${formatCurrency(totalPendiente)}`, 14, 60);
    doc.text(`Total Servicios Realizados: ${totalServicios}`, 14, 67);

    // Tabla de Servicios
    const tableBody = (services || []).map(s => {
      const clientName = Array.isArray(s.clients) ? (s.clients as any[])[0]?.name : (s.clients as any)?.name;
      return [
        formatDate(s.date),
        clientName || 'Cliente sin nombre',
      formatCurrency(s.amount),
      s.status === 'paid' ? 'Pagado' : 'Pendiente'
      ];
    });

    autoTable(doc, {
      startY: 75,
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
