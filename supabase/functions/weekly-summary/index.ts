import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Date Calculation: Previous Week (Mon-Sun) and Current Week
  const now = new Date()

  // Last Monday (7 days ago from the start of this week)
  const lastMonday = new Date(now)
  lastMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7)
  lastMonday.setHours(0, 0, 0, 0)

  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  lastSunday.setHours(23, 59, 59, 999)

  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  thisMonday.setHours(0, 0, 0, 0)

  const thisSunday = new Date(thisMonday)
  thisSunday.setDate(thisMonday.getDate() + 6)
  thisSunday.setHours(23, 59, 59, 999)

  const lastWeekISO = { start: lastMonday.toISOString(), end: lastSunday.toISOString() }
  const lastWeekDate = { start: lastMonday.toISOString().split('T')[0], end: lastSunday.toISOString().split('T')[0] }
  const currentWeekDate = { start: thisMonday.toISOString().split('T')[0], end: thisSunday.toISOString().split('T')[0] }

  // 1. Fetch active businesses
  const { data: activeBusinesses, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .in('subscription_status', ['active', 'trial', 'trialing'])

  if (bizError) return new Response(JSON.stringify(bizError), { status: 500 })

  const results = []

  for (const business of activeBusinesses) {
    try {
      // 2. Metrics for the previous week
      // Total collected (paid services in last week)
      const { data: collectedData } = await supabase
        .from('services')
        .select('amount')
        .eq('business_id', business.id)
        .eq('status', 'paid')
        .gte('service_date', lastWeekDate.start)
        .lte('service_date', lastWeekDate.end)

      const totalCollected = (collectedData || []).reduce((acc, curr) => acc + Number(curr.amount), 0)

      // Completed services count (all services in last week)
      const { count: completedCount } = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .gte('service_date', lastWeekDate.start)
        .lte('service_date', lastWeekDate.end)

      // If no services last week, skip
      if (!completedCount || completedCount === 0) continue

      // 3. Overall Pending Debt
      const { data: pendingData } = await supabase
        .from('services')
        .select('amount')
        .eq('business_id', business.id)
        .eq('status', 'pending')

      const totalPending = (pendingData || []).reduce((acc, curr) => acc + Number(curr.amount), 0)

      // 4. Scheduled services for THIS week
      const { count: scheduledCount } = await supabase
        .from('scheduled_services')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .gte('scheduled_date', currentWeekDate.start)
        .lte('scheduled_date', currentWeekDate.end)
        .eq('status', 'pending')

      // 5. Send Email
      const emailHtml = generateEmailHtml(business, {
        totalCollected,
        completedCount,
        totalPending,
        scheduledCount
      })

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Velora Pure <resúmenes@velorapure.com>',
          to: [business.email],
          subject: `📊 Tu resumen semanal — ${business.business_name}`,
          html: emailHtml
        })
      })

      results.push({ businessId: business.id, sent: resendRes.ok })
    } catch (err) {
      console.error(`Error processing business ${business.id}:`, err)
    }
  }

  return new Response(JSON.stringify(results), { status: 200 })
})

function generateEmailHtml(business: any, data: any) {
  const formatCurrency = (n: number) => `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  const pendingColor = data.totalPending > 0 ? '#F87171' : '#10B981'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#080810;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#111;border:1px solid #222;border-radius:24px;padding:40px;color:#F1F0FF">
    <div style="text-align:center;margin-bottom:40px">
      <div style="font-size:24px;font-weight:700;color:#F1F0FF"><span style="color:#8B5CF6">V</span>elora Pure</div>
      <div style="font-size:12px;color:#4B4A65;text-transform:uppercase;letter-spacing:1.5px;margin-top:8px">Resumen semanal de rendimiento</div>
    </div>
    
    <div style="margin-bottom:32px">
      <h1 style="font-size:20px;margin:0;font-weight:600">Tu resumen de la semana pasada</h1>
      <p style="color:#8B8AA8;font-size:15px;margin:8px 0 0">Hola ${business.owner_name}, aquí están las métricas de <strong>${business.business_name}</strong>.</p>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px">
      <div style="background:#16161F;border:1px solid #222;border-radius:16px;padding:20px;text-align:center">
        <div style="font-size:11px;color:#8B8AA8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">💰 Cobrado</div>
        <div style="font-size:24px;font-weight:700;color:#10B981;font-family:monospace">${formatCurrency(data.totalCollected)}</div>
      </div>
      <div style="background:#16161F;border:1px solid #222;border-radius:16px;padding:20px;text-align:center">
        <div style="font-size:11px;color:#8B8AA8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">✅ Completados</div>
        <div style="font-size:24px;font-weight:700;color:#F1F0FF">${data.completedCount}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px">
      <div style="background:#16161F;border:1px solid #222;border-radius:16px;padding:20px;text-align:center">
        <div style="font-size:11px;color:#8B8AA8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">⏳ Pendiente</div>
        <div style="font-size:24px;font-weight:700;color:${pendingColor};font-family:monospace">${formatCurrency(data.totalPending)}</div>
      </div>
      <div style="background:#16161F;border:1px solid #222;border-radius:16px;padding:20px;text-align:center">
        <div style="font-size:11px;color:#8B8AA8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📅 Esta semana</div>
        <div style="font-size:24px;font-weight:700;color:#8B5CF6">${data.scheduledCount}</div>
      </div>
    </div>

    <div style="background:#1E1D35/20;border:1px dashed #3D3B5C;border-radius:16px;padding:24px;text-align:center;margin-bottom:32px">
      <p style="color:#A1A1C2;font-size:14px;margin:0;line-height:1.5 italic">"¡Gran trabajo! Cada servicio es un paso más hacia un negocio más sólido. ¡Por una semana productiva!"</p>
    </div>

    <div style="text-align:center;margin-bottom:40px">
      <a href="https://velora-pure.vercel.app/dashboard" style="display:inline-block;background:#8B5CF6;color:white;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:15px;font-weight:600;box-shadow:0 10px 20px rgba(139,92,246,0.2)">
        Ver mi Dashboard →
      </a>
    </div>

    <div style="border-top:1px solid #222;padding-top:24px;text-align:center">
      <p style="color:#4B4A65;font-size:12px;margin:0">Velora Pure · Gestión para tu negocio de limpieza</p>
      <p style="color:#4B4A65;font-size:11px;margin:4px 0 0">Recibes este email como parte de tu suscripción activa.</p>
    </div>
  </div>
</body>
</html>
  `
}
