import type { VercelRequest, VercelResponse } from '@vercel/node'

const PADDLE_API_BASE = 'https://sandbox-api.paddle.com' // Change to api.paddle.com for production

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { priceId, userEmail, businessId } = req.body

  const apiKey = process.env.PADDLE_API_KEY
  const appUrl = process.env.APP_URL || 'https://velora-pure.vercel.app'

  if (!apiKey || !priceId) {
    console.error('Missing Paddle configuration or priceId')
    return res.status(500).json({ error: 'Configuración de Paddle incompleta' })
  }

  try {
    const response = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer: userEmail ? { email: userEmail } : undefined,
        custom_data: {
          business_id: businessId,
        },
        checkout: {
          url: `${appUrl}/billing?success=true`,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Paddle API error:', JSON.stringify(data))
      return res.status(500).json({ error: 'Error al crear el checkout con Paddle' })
    }

    const checkoutUrl = data?.data?.checkout?.url

    if (!checkoutUrl) {
      console.error('No checkout URL from Paddle:', JSON.stringify(data))
      return res.status(500).json({ error: 'No se pudo generar el checkout' })
    }

    return res.status(200).json({ url: checkoutUrl })
  } catch (err) {
    console.error('Unexpected error creating Paddle checkout:', err)
    return res.status(500).json({ error: 'Error inesperado al generar el checkout' })
  }
}
