import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres un asistente experto en cotizar servicios de limpieza en Estados Unidos. Tu trabajo es hacer preguntas cortas y precisas para recopilar la información necesaria y generar una cotización profesional.

PREGUNTAS QUE DEBES HACER (en este orden, una a la vez):
1. Tipo de propiedad (casa, apartamento, oficina, Airbnb, post-construcción)
2. Número de cuartos y baños
3. Pies cuadrados aproximados (si no saben, estima según cuartos)
4. Tipo de limpieza (mantenimiento regular, deep clean, post-construcción, Airbnb turnover)
5. Frecuencia (única vez, semanal, bi-semanal, mensual)
6. Extras (mascotas, interior de nevera, ventanas, horno, lavandería)

REGLAS:
- Haz UNA sola pregunta a la vez
- Sé amigable y breve
- Adapta las preguntas según las respuestas (si dice "post-construcción", no preguntes tipo de limpieza)
- Cuando tengas TODA la información, responde SOLO con un JSON así (sin texto adicional):

QUOTE_READY:{
  "property_type": "apartamento",
  "bedrooms": 2,
  "bathrooms": 1,
  "sqft": 850,
  "clean_type": "deep_clean",
  "frequency": "biweekly",
  "extras": ["pet", "fridge"],
  "base_price": 120,
  "multiplier": 1.4,
  "frequency_discount": 18,
  "extras_total": 30,
  "total_price": 165,
  "duration_hours": 3.5,
  "confidence_score": 87
}

LÓGICA DE PRECIOS:
- Base: $80 (studio/1bed), $100 (2bed), $130 (3bed), $160 (4bed+), $15 por baño adicional
- Multiplicador tipo: regular×1.0, deep_clean×1.4, post_construction×2.0, airbnb×1.2
- Descuento frecuencia: única_vez×0, semanal-15%, bi-semanal-10%, mensual-5%
- Extras: mascota+$15, nevera+$25, ventanas+$20, horno+$15, lavandería+$20
- Duración: base_price/45 horas (redondeado a 0.5)
- Confianza: 90% si todos los datos son precisos, 75% si sqft fue estimado

Responde SIEMPRE en español.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages
    })

    const content = response.content[0]
    const text = content.type === 'text' ? content.text : ''

    if (text.startsWith('QUOTE_READY:')) {
      const json = text.replace('QUOTE_READY:', '').trim()
      try {
        const quote = JSON.parse(json)
        return res.status(200).json({ type: 'quote', data: quote })
      } catch (err) {
        return res.status(200).json({ type: 'message', text })
      }
    }

    return res.status(200).json({ type: 'message', text })
  } catch (error: any) {
    console.error('Anthropic API Error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
