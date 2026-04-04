import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const appUrl = Deno.env.get('APP_URL')!
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const today = new Date()
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  // Buscar servicios pendientes de más de 7 días
  const { data: pendingServices } = await supabase
    .from('services')
    .select(`
      id, amount, date, business_id,
      clients(name),
      businesses(business_name, owner_name, email)
    `)
    .eq('status', 'pending')
    .lte('date', sevenDaysAgo)

  if (!pendingServices || pendingServices.length === 0) {
    return new Response('No pending services', { status: 200 })
  }

  // Agrupar por business
  const byBusiness: Record<string, any> = {}
  for (const service of pendingServices) {
    const bid = service.business_id
    if (!byBusiness[bid]) {
      byBusiness[bid] = {
        business: service.businesses,
        services: []
      }
    }
    byBusiness[bid].services.push(service)
  }

  // Verificar que no se haya enviado email hoy
  const { data: todayReminders } = await supabase
    .from('payment_reminders')
    .select('business_id')
    .eq('channel', 'email')
    .gte('sent_at', new Date().toISOString().split('T')[0])

  const alreadySentToday = new Set(todayReminders?.map(r => r.business_id) || [])

  // Enviar email a cada business que no haya recibido uno hoy
  for (const [businessId, data] of Object.entries(byBusiness)) {
    if (alreadySentToday.has(businessId)) continue

    const { business, services } = data
    if (!business?.email) continue

    const totalPending = services.reduce((sum: number, s: any) => sum + Number(s.amount), 0)
    const formatCurrency = (n: number) => `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('es-US', { day: 'numeric', month: 'long', year: 'numeric' })
    const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000)

    const servicesRows = services.map((s: any) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #1E1D35;color:#F1F0FF;font-size:14px">${s.clients?.name || '—'}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #1E1D35;color:#F1F0FF;font-size:14px">${formatDate(s.date)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #1E1D35;color:#FBBF24;font-size:14px;font-family:monospace">${formatCurrency(Number(s.amount))}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #1E1D35;font-size:13px;color:#F87171">${daysSince(s.date)} días</td>
      </tr>
    `).join('')

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080810;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:40px">
      <div style="font-size:22px;font-weight:600;color:#F1F0FF;letter-spacing:-0.5px">
        <span style="color:#8B5CF6">V</span>elora Pure
      </div>
      <div style="font-size:12px;color:#4B4A65;margin-top:4px;text-transform:uppercase;letter-spacing:1px">Resumen de cobros pendientes</div>
    </div>
    <div style="margin-bottom:24px">
      <p style="color:#8B8AA8;font-size:15px;margin:0">Hola, <strong style="color:#F1F0FF">${business.owner_name}</strong> 👋</p>
      <p style="color:#8B8AA8;font-size:14px;margin:8px 0 0">Tienes cobros pendientes de más de 7 días en <strong style="color:#F1F0FF">${business.business_name}</strong>. Te los resumimos para que puedas cobrarlos hoy.</p>
    </div>
    <div style="background:#13131F;border:1px solid #2A2847;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center">
      <div style="font-size:13px;color:#4B4A65;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Total pendiente de cobro</div>
      <div style="font-size:42px;font-weight:300;color:#FBBF24;font-family:monospace;letter-spacing:-1px">${formatCurrency(totalPending)}</div>
      <div style="font-size:13px;color:#8B8AA8;margin-top:8px">${services.length} servicio${services.length > 1 ? 's' : ''} sin cobrar</div>
    </div>
    <div style="background:#13131F;border:1px solid #1E1D35;border-radius:12px;overflow:hidden;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#0F0F1A">
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:#4B4A65;text-transform:uppercase;letter-spacing:0.8px;font-weight:500">Cliente</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:#4B4A65;text-transform:uppercase;letter-spacing:0.8px;font-weight:500">Fecha</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:#4B4A65;text-transform:uppercase;letter-spacing:0.8px;font-weight:500">Monto</th>
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:#4B4A65;text-transform:uppercase;letter-spacing:0.8px;font-weight:500">Atraso</th>
          </tr>
        </thead>
        <tbody>${servicesRows}</tbody>
      </table>
    </div>
    <div style="text-align:center;margin-bottom:40px">
      <a href="${appUrl}/pending" style="display:inline-block;background:#8B5CF6;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:500;letter-spacing:-0.2px">
        Ver cobros y enviar recordatorios →
      </a>
      <p style="color:#4B4A65;font-size:12px;margin-top:16px">Un clic en el botón de WhatsApp y tu cliente recibe el recordatorio al instante.</p>
    </div>
    <div style="border-top:1px solid #1E1D35;padding-top:20px;text-align:center">
      <p style="color:#4B4A65;font-size:12px;margin:0">Velora Pure · Plataforma para negocios de limpieza</p>
      <p style="color:#4B4A65;font-size:11px;margin:4px 0 0">Recibes este email porque tienes cobros pendientes de más de 7 días.</p>
    </div>
  </div>
</body>
</html>`

    // Enviar email con Resend
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Velora Pure <alertas@velorapure.com>',
        to: [business.email],
        subject: `⚠️ Tienes ${formatCurrency(totalPending)} sin cobrar — ${business.business_name}`,
        html: emailHtml
      })
    })

    // Registrar en payment_reminders
    await supabase.from('payment_reminders').insert({
      business_id: businessId,
      client_id: services[0].clients?.id || null, // Dummy since it's a batch email
      channel: 'email',
      amount: totalPending
    })
  }

  return new Response('Emails sent', { status: 200 })
})
