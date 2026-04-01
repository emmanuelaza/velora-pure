import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verificar firma del webhook
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
  const hmac = crypto.createHmac('sha256', secret)
  const digest = Buffer.from(hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8')
  const signature = Buffer.from(req.headers['x-signature'] as string || '', 'utf8')

  if (!crypto.timingSafeEqual(digest, signature)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = req.body
  const eventName = event.meta?.event_name
  const businessId = event.meta?.custom_data?.business_id
  const subscriptionId = event.data?.id

  if (!businessId) return res.status(200).end()

  // Manejar eventos
  if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
    const status = event.data?.attributes?.status
    const supabaseStatus = status === 'active' ? 'active'
      : status === 'past_due' ? 'past_due'
      : status === 'cancelled' ? 'canceled'
      : 'trial'

    await supabase
      .from('businesses')
      .update({
        subscription_status: supabaseStatus,
        lemonsqueezy_subscription_id: subscriptionId
      })
      .eq('id', businessId)
  }

  if (eventName === 'subscription_cancelled') {
    await supabase
      .from('businesses')
      .update({ subscription_status: 'canceled' })
      .eq('id', businessId)
  }

  return res.status(200).json({ received: true })
}
