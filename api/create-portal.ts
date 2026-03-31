import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { customerId } = req.body;
    const customerUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

    if (!customerId) return res.status(400).json({ error: 'Missing customerId' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${customerUrl}/billing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Error in create-portal:', err);
    return res.status(500).json({ error: err.message });
  }
}
