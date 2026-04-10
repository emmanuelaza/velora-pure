export const COUNTRIES = [
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', currency: 'USD', locale: 'en-US' },
  { code: 'ES', name: 'España', flag: '🇪🇸', currency: 'EUR', locale: 'es-ES' },
];

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export const ES_PROVINCES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Baleares', 'Barcelona', 'Burgos',
  'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Gerona', 'Granada', 'Guadalajara',
  'Guipúzcoa', 'Huelva', 'Huesca', 'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lérida', 'Lugo',
  'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia', 'Pontevedra', 'Salamanca', 'Segovia', 'Sevilla',
  'Soria', 'Tarragona', 'Santa Cruz de Tenerife', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
];

export const PAYMENT_METHODS = {
  US: [
    { id: 'zelle_info', label: 'Zelle', placeholder: 'Email o teléfono' },
    { id: 'venmo_info', label: 'Venmo', placeholder: '@usuario' },
    { id: 'cashapp_info', label: 'Cash App', placeholder: '$Cashtag' },
  ],
  ES: [
    { id: 'bizum_info', label: 'Bizum', placeholder: 'Número de teléfono' },
    { id: 'bank_name', label: 'Nombre del Banco', placeholder: 'Ej: Santander' },
    { id: 'iban', label: 'IBAN', placeholder: 'ES00 0000 ...' },
  ]
};
