import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { businessId, email, customerId } = req.body;
    const customerUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${customerUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${customerUrl}/billing`,
      customer: customerId || undefined,
      client_reference_id: businessId,
      customer_email: customerId ? undefined : email,
      metadata: { businessId },
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Error in create-checkout:', err);
    return res.status(500).json({ error: err.message });
  }
}
