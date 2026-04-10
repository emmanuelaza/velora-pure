import { useBusiness } from '../context/BusinessContext';

export function useCurrency() {
  const { business } = useBusiness();
  const country = business?.country || 'US';

  const formatter = new Intl.NumberFormat(country === 'ES' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: country === 'ES' ? 'EUR' : 'USD',
  });

  return {
    format: (amount: number) => formatter.format(amount),
    symbol: country === 'ES' ? '€' : '$',
    country
  };
}
