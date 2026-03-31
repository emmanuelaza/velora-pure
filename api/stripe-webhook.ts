import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const event = req.body;
    
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const businessId = session.client_reference_id;
      const customerId = session.customer as string;

      if (businessId && customerId) {
        await supabaseAdmin
          .from('businesses')
          .update({ stripe_customer_id: customerId, subscription_status: 'active' })
          .eq('id', businessId);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: 'Webhook Handler Failed' });
  }
}
