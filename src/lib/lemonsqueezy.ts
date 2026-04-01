export const createCheckoutUrl = async (
  userEmail: string,
  businessId: string
): Promise<string> => {
  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail, businessId })
  })

  // Verificar si la respuesta es JSON antes de parsearla
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Invalid response from API:', text);
    throw new Error('Error de servidor al generar el checkout');
  }

  const data = await response.json()

  if (!data.url) throw new Error(data.error || 'No se pudo obtener la URL de checkout')

  return data.url
}
