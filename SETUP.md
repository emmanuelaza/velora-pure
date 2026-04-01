# Configuración de Lemon Squeezy

Sigue estos pasos para completar la integración de pagos en tu tienda de Lemon Squeezy:

## 1. Configurar Webhook

1. Ve a tu panel de **Lemon Squeezy** → **Settings** → **Webhooks**.
2. Haz clic en **"Add webhook"**.
3. En **Callback URL**, pega la URL de tu aplicación en Vercel seguida de `/api/lemonsqueezy-webhook`:
   `https://velora-pure.vercel.app/api/lemonsqueezy-webhook`
4. En **Signing Secret**, escribe una clave secreta (ej. una cadena aleatoria larga).
5. En **Events**, selecciona los siguientes:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
6. Haz clic en **"Save webhook"**.

## 2. Variables de Entorno en Vercel

Asegúrate de configurar las siguientes variables en el panel de **Vercel** → **Settings** → **Environment Variables**:

| Variable | Origen |
| :--- | :--- |
| `VITE_LEMONSQUEEZY_STORE_ID` | Lemon Squeezy → Settings → Store |
| `VITE_LEMONSQUEEZY_VARIANT_ID` | Lemon Squeezy → Products → Velora Pure → Variant ID |
| `VITE_LEMONSQUEEZY_API_KEY` | Lemon Squeezy → Settings → API Keys |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | El "Signing Secret" que configuraste en el paso 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API |

## 3. Despliegue

Una vez configuradas las variables, realiza un nuevo **Redeploy** en Vercel para que los cambios surtan efecto.

---

> [!IMPORTANT]
> **Base de Datos (Supabase):** Asegúrate de que la tabla `businesses` tenga la columna `lemonsqueezy_subscription_id` (tipo `text` o `varchar`). Si aún se llama `stripe_subscription_id`, debes renombrarla o el webhook fallará al intentar actualizar el registro.
