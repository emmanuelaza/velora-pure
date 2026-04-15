/**
 * Paddle checkout helpers
 * Calls the /api/create-checkout serverless function with the chosen priceId.
 */

export type PaddlePlan = 'monthly' | 'yearly' | 'lifetime'

const PRICE_IDS: Record<PaddlePlan, string> = {
  monthly:  import.meta.env.VITE_PADDLE_PRICE_ID_MONTHLY  || '',
  yearly:   import.meta.env.VITE_PADDLE_PRICE_ID_YEARLY   || '',
  lifetime: import.meta.env.VITE_PADDLE_PRICE_ID_LIFETIME || '',
}

export async function createPaddleCheckout(
  plan: PaddlePlan,
  userEmail: string,
  businessId: string
): Promise<string> {
  const priceId = PRICE_IDS[plan]

  if (!priceId) {
    throw new Error(`Price ID for plan "${plan}" is not configured. Set VITE_PADDLE_PRICE_ID_${plan.toUpperCase()} in your .env.`)
  }

  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, userEmail, businessId }),
  })

  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    const text = await response.text()
    console.error('Invalid response from API:', text)
    throw new Error('Error de servidor al generar el checkout')
  }

  const data = await response.json()
  if (!data.url) throw new Error(data.error || 'No se pudo obtener la URL de checkout')

  return data.url
}
