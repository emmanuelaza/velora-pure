import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Verify the Paddle webhook signature using HMAC-SHA256.
 * Paddle sends the signature in the header: Paddle-Signature
 * Format: "ts=<timestamp>;h1=<hmac_hash>"
 */
function verifyPaddleSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(';').map(p => p.split('=') as [string, string])
    )
    const ts = parts['ts']
    const h1 = parts['h1']
    if (!ts || !h1) return false

    const signed = `${ts}:${rawBody}`
    const computed = crypto.createHmac('sha256', secret).update(signed).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(computed, 'utf8'), Buffer.from(h1, 'utf8'))
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) {
    console.error('PADDLE_WEBHOOK_SECRET not set')
    return res.status(500).json({ error: 'Missing webhook secret' })
  }

  // Paddle sends raw body — Vercel parses it automatically, so we need to re-stringify
  const rawBody = JSON.stringify(req.body)
  const signatureHeader = req.headers['paddle-signature'] as string || ''

  if (!verifyPaddleSignature(rawBody, signatureHeader, secret)) {
    console.error('Invalid Paddle signature')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const event = req.body
  const eventType: string = event.event_type ?? event.notification_type ?? ''
  const data = event.data ?? {}

  // business_id is passed as custom_data in the checkout
  const businessId: string | undefined =
    data.custom_data?.business_id ?? data.items?.[0]?.custom_data?.business_id

  const PRICE_MONTHLY  = process.env.PADDLE_PRICE_ID_MONTHLY
  const PRICE_YEARLY   = process.env.PADDLE_PRICE_ID_YEARLY
  const PRICE_LIFETIME = process.env.PADDLE_PRICE_ID_LIFETIME

  console.log(`[Paddle Webhook] event_type=${eventType} businessId=${businessId}`)

  // ──────────────────────────────────────────────
  // subscription.created — new recurring subscription
  // ──────────────────────────────────────────────
  if (eventType === 'subscription.created') {
    if (!businessId) return res.status(200).json({ received: true })

    const subscriptionId  = data.id
    const priceId         = data.items?.[0]?.price?.id
    const nextBillingDate = data.next_billed_at ?? data.next_transaction?.billing_period?.ends_at
    const customerId      = data.customer_id

    const planType =
      priceId === PRICE_MONTHLY  ? 'monthly'
      : priceId === PRICE_YEARLY ? 'yearly'
      : null

    if (!planType) {
      console.warn(`[Paddle] Unknown priceId on subscription.created: ${priceId}`)
      return res.status(200).json({ received: true })
    }

    await supabase
      .from('businesses')
      .update({
        subscription_status:    'active',
        plan_type:              planType,
        paddle_subscription_id: subscriptionId,
        paddle_customer_id:     customerId ?? null,
        next_billing_date:      nextBillingDate ?? null,
      })
      .eq('id', businessId)

    console.log(`[Paddle] Activated ${planType} plan for business ${businessId}`)
  }

  // ──────────────────────────────────────────────
  // subscription.updated — renewal or plan change
  // ──────────────────────────────────────────────
  if (eventType === 'subscription.updated') {
    if (!businessId) return res.status(200).json({ received: true })

    const priceId         = data.items?.[0]?.price?.id
    const nextBillingDate = data.next_billed_at ?? data.next_transaction?.billing_period?.ends_at
    const status          = data.status // 'active' | 'past_due' | 'canceled' | 'paused'

    const planType =
      priceId === PRICE_MONTHLY  ? 'monthly'
      : priceId === PRICE_YEARLY ? 'yearly'
      : null

    const mappedStatus =
      status === 'active'   ? 'active'
      : status === 'past_due' ? 'past_due'
      : status === 'paused'   ? 'past_due'
      : 'canceled'

    const updatePayload: Record<string, unknown> = {
      subscription_status: mappedStatus,
      next_billing_date:   nextBillingDate ?? null,
    }
    if (planType) updatePayload.plan_type = planType

    await supabase
      .from('businesses')
      .update(updatePayload)
      .eq('id', businessId)

    console.log(`[Paddle] Updated subscription status=${mappedStatus} for business ${businessId}`)
  }

  // ──────────────────────────────────────────────
  // subscription.canceled — cancel (unless lifetime)
  // ──────────────────────────────────────────────
  if (eventType === 'subscription.canceled') {
    if (!businessId) return res.status(200).json({ received: true })

    // Don't touch lifetime users
    const { data: biz } = await supabase
      .from('businesses')
      .select('lifetime')
      .eq('id', businessId)
      .single()

    if (biz?.lifetime) {
      console.log(`[Paddle] subscription.canceled ignored for lifetime user ${businessId}`)
      return res.status(200).json({ received: true })
    }

    await supabase
      .from('businesses')
      .update({ subscription_status: 'canceled', next_billing_date: null })
      .eq('id', businessId)

    console.log(`[Paddle] Canceled subscription for business ${businessId}`)
  }

  // ──────────────────────────────────────────────
  // subscription.payment_failed — deactivate (unless lifetime)
  // ──────────────────────────────────────────────
  if (eventType === 'subscription.payment_failed') {
    if (!businessId) return res.status(200).json({ received: true })

    const { data: biz } = await supabase
      .from('businesses')
      .select('lifetime')
      .eq('id', businessId)
      .single()

    if (biz?.lifetime) {
      console.log(`[Paddle] payment_failed ignored for lifetime user ${businessId}`)
      return res.status(200).json({ received: true })
    }

    await supabase
      .from('businesses')
      .update({ subscription_status: 'past_due' })
      .eq('id', businessId)

    console.log(`[Paddle] Marked past_due for business ${businessId}`)
  }

  // ──────────────────────────────────────────────
  // transaction.completed — one-time payment (Lifetime)
  // ──────────────────────────────────────────────
  if (eventType === 'transaction.completed') {
    if (!businessId) return res.status(200).json({ received: true })

    const priceId    = data.items?.[0]?.price?.id
    const customerId = data.customer_id

    if (priceId === PRICE_LIFETIME) {
      await supabase
        .from('businesses')
        .update({
          subscription_status: 'active',
          plan_type:           'lifetime',
          lifetime:            true,
          paddle_customer_id:  customerId ?? null,
          next_billing_date:   null,
        })
        .eq('id', businessId)

      console.log(`[Paddle] Lifetime access granted for business ${businessId}`)
    }
  }

  return res.status(200).json({ received: true })
}
