import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { quote, business } = req.body

  const frequencyLabel: Record<string, string> = {
    once: 'Única vez', weekly: 'Semanal',
    biweekly: 'Bi-semanal', monthly: 'Mensual'
  }

  const cleanTypeLabel: Record<string, string> = {
    regular: 'Limpieza regular', deep_clean: 'Deep Clean',
    post_construction: 'Post-construcción', airbnb: 'Airbnb Turnover'
  }

  const extrasLabel: Record<string, string> = {
    pet: 'Suplemento mascota', fridge: 'Interior de nevera',
    windows: 'Ventanas', oven: 'Horno', laundry: 'Lavandería'
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; padding: 40px; background: #fff; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #0EA5E9; }
  .logo-area h1 { font-size: 24px; font-weight: 700; color: #0EA5E9; }
  .logo-area p { font-size: 13px; color: #64748B; margin-top: 4px; }
  .quote-info { text-align: right; }
  .quote-info .quote-num { font-size: 13px; color: #64748B; }
  .quote-info .quote-date { font-size: 13px; color: #64748B; margin-top: 4px; }
  .section-title { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; margin-top: 24px; }
  .pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
  .pill { background: #E0F2FE; color: #0284C7; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 999px; }
  .pill-amber { background: #FEF3C7; color: #92400E; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  th { text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 0; border-bottom: 1px solid #E2E8F0; }
  td { padding: 10px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #F1F5F9; }
  td:last-child { text-align: right; font-weight: 500; color: #0F172A; }
  .total-row td { font-size: 16px; font-weight: 700; color: #0F172A; border-bottom: none; padding-top: 16px; }
  .total-row td:first-child { color: #0F172A; }
  .total-row td:last-child { color: #0EA5E9; font-size: 20px; }
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; }
  .footer p { font-size: 12px; color: #94A3B8; }
  .validity { background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 12px 16px; margin-bottom: 28px; font-size: 13px; color: #0284C7; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <h1>${business?.business_name || 'Mi Negocio de Limpieza'}</h1>
      <p>${business?.owner_name || ''}</p>
      <p>${business?.phone || ''}</p>
    </div>
    <div class="quote-info">
      <div class="quote-num">Cotización #${Date.now().toString().slice(-6)}</div>
      <div class="quote-date">${new Date().toLocaleDateString('es-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <div class="section-title">Resumen del servicio</div>
  <div class="pills">
    <span class="pill">${cleanTypeLabel[quote.clean_type] || quote.clean_type}</span>
    <span class="pill">${quote.bedrooms} cuartos / ${quote.bathrooms} baños</span>
    <span class="pill">${frequencyLabel[quote.frequency] || quote.frequency}</span>
    ${quote.extras?.map((e: string) => `<span class="pill-amber">${extrasLabel[e] || e}</span>`).join('') || ''}
  </div>

  <div class="validity">Esta cotización es válida por 7 días a partir de la fecha de emisión.</div>

  <div class="section-title">Desglose de precio</div>
  <table>
    <thead>
      <tr><th>Concepto</th><th style="text-align:right">Monto</th></tr>
    </thead>
    <tbody>
      <tr><td>Limpieza base (${quote.property_type}, ${quote.sqft || '—'} sqft)</td><td>$${quote.base_price?.toFixed(2)}</td></tr>
      <tr><td>Multiplicador tipo (${cleanTypeLabel[quote.clean_type] || quote.clean_type})</td><td>×${quote.multiplier}</td></tr>
      ${quote.frequency_discount > 0 ? `<tr><td>Descuento por frecuencia (${frequencyLabel[quote.frequency]})</td><td>–$${quote.frequency_discount?.toFixed(2)}</td></tr>` : ''}
      ${quote.extras_total > 0 ? `<tr><td>Extras adicionales</td><td>+$${quote.extras_total?.toFixed(2)}</td></tr>` : ''}
      <tr class="total-row"><td>Total por visita</td><td>$${quote.total_price?.toFixed(2)}</td></tr>
    </tbody>
  </table>

  <div class="section-title">Detalles adicionales</div>
  <table>
    <thead>
      <tr><th>Detalle</th><th style="text-align:right">Valor</th></tr>
    </thead>
    <tbody>
      <tr><td>Duración estimada</td><td>${quote.duration_hours} horas</td></tr>
      <tr><td>Precio por hora implícito</td><td>$${(quote.total_price / quote.duration_hours).toFixed(2)}/hr</td></tr>
      <tr><td>Frecuencia de servicio</td><td>${frequencyLabel[quote.frequency] || quote.frequency}</td></tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Generado con Velora Pure · velorapure.com</p>
    <p>Para aceptar esta cotización, contáctenos vía WhatsApp.</p>
  </div>

  <script>
    window.onload = () => {
      // Small delay to ensure styles are loaded
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html')
  res.status(200).send(html)
}
