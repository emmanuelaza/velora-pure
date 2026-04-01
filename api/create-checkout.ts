import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userEmail, businessId } = req.body

  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const appUrl = process.env.APP_URL || 'https://velora-pure.vercel.app'

  if (!apiKey || !storeId || !variantId) {
    console.error('Missing Lemon Squeezy configuration')
    return res.status(500).json({ error: 'Configuración de Lemon Squeezy incompleta' })
  }

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/checkouts`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userEmail,
              custom: {
                business_id: businessId
              }
            },
            checkout_options: {
              embed: false,
              media: false,
              desc: false
            },
            product_options: {
              name: 'Velora Pure',
              description: 'Plataforma para negocios de limpieza · $229/mes',
              redirect_url: `${appUrl}/billing?success=true`,
              receipt_button_text: 'Ir a mi dashboard',
              receipt_thank_you_note: '¡Bienvenido a Velora Pure! Tu cuenta está activa.'
            }
          },
          relationships: {
            store: {
              data: { type: 'stores', id: String(storeId) }
            },
            variant: {
              data: { type: 'variants', id: String(variantId) }
            }
          }
        }
      })
    }
  )

  const data = await response.json()
  const checkoutUrl = data?.data?.attributes?.url

  if (!checkoutUrl) {
    console.error('Lemon Squeezy error:', JSON.stringify(data))
    return res.status(500).json({ error: 'No se pudo generar el checkout' })
  }

  return res.status(200).json({ url: checkoutUrl })
}
