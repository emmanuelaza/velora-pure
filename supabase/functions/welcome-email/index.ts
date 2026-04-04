import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const appUrl = Deno.env.get('APP_URL')!
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { businessId } = await req.json()
    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Missing businessId' }), { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: business } = await supabase
      .from('businesses')
      .select('business_name, owner_name, email')
      .eq('id', businessId)
      .single()

    if (!business || !business.email) {
      return new Response(JSON.stringify({ error: 'Business or email not found' }), { status: 404 })
    }

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
    </div>

    <div style="background:#13131F;border:1px solid #2A2847;border-radius:12px;padding:32px;text-align:center;margin-bottom:24px">
      <h1 style="color:#F1F0FF;font-size:24px;margin:0 0 16px;">¡Bienvenido a Velora Pure, ${business.owner_name}! 🎉</h1>
      <p style="color:#8B8AA8;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Tu negocio <strong>${business.business_name}</strong> ya está configurado y listo para cobrar de manera inteligente y profesional.
      </p>
      
      <div style="text-align:left;background:#0F0F1A;padding:20px;border-radius:8px;margin-bottom:24px">
        <p style="color:#F1F0FF;font-size:14px;font-weight:bold;margin:0 0 12px;">Lo que puedes hacer ahora:</p>
        <ul style="color:#8B8AA8;font-size:14px;margin:0;padding-left:20px;line-height:1.6">
          <li style="margin-bottom:8px">Registrar servicios prestados y sus montos a cobrar.</li>
          <li style="margin-bottom:8px">Conocer exactamente qué clientes te deben dinero y desde cuándo.</li>
          <li style="margin-bottom:8px">Enviar recordatorios de cobro a tus clientes por WhatsApp con 1 solo clic.</li>
        </ul>
      </div>

      <a href="${appUrl}/dashboard" style="display:inline-block;background:#8B5CF6;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:500;letter-spacing:-0.2px">
        Ir a mi Dashboard →
      </a>
    </div>

    <div style="border-top:1px solid #1E1D35;padding-top:20px;text-align:center">
      <p style="color:#4B4A65;font-size:12px;margin:0">Velora Pure · Plataforma Premium para Negocios de Limpieza</p>
    </div>

  </div>
</body>
</html>`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Velora Pure <hola@velorapure.com>',
        to: [business.email],
        subject: 'Bienvenido a Velora Pure 🎉',
        html: emailHtml
      })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } })
  }
})
