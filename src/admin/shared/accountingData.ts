// ═════════════════════════════════════════════════════════════════
// ACCOUNTING DATA — Central structure for Conniku SpA
// Regimen 14D N°3 ProPyme Transparente — Contabilidad Simplificada
// RUT: 78.395.702-7 | Giro: 631200 Portales Web | Afecto IVA
// ═════════════════════════════════════════════════════════════════

// ─── COMPANY INFO ───
export const COMPANY = {
  rut: '78.395.702-7',
  razonSocial: 'CONNIKU SPA',
  giro: 'Portales Web',
  codigoSII: '631200',
  regimen: '14D N°3 ProPyme Transparente',
  categoria: 'PRIMERA',
  segmento: 'MICRO EMPRESA',
  afectoIVA: true,
  ivaRate: 0.19,
  domicilio: 'Av. Argentina 01805, Depto 502, Antofagasta',
  comuna: 'Antofagasta',
  region: 'Antofagasta',
  representante: 'Cristian Andres Gutierrez Lazcano',
  rutRepresentante: '14.112.896-5',
  emailSII: 'ceo@conniku.com',
  telefono: '+56 9 3032 1072',
  capitalSocial: 150000,
  fechaInicioActividades: '2026-04-08',
  fechaConstitucion: '2026-04-08',
};

// ─── TRANSACTION TYPES ───
export type TransactionType = 'ingreso' | 'egreso' | 'costo' | 'inversion';
export type DocumentType =
  | 'factura'
  | 'factura_exenta'
  | 'boleta'
  | 'boleta_honorarios'
  | 'invoice_internacional'
  | 'recibo'
  | 'comprobante_transferencia'
  | 'sin_documento';
export type PaymentMethod =
  | 'transferencia'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'efectivo'
  | 'pago_internacional'
  | 'debito_automatico'
  | 'cheque';
export type Currency = 'CLP' | 'USD';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string; // key from ACCOUNT_CATEGORIES
  subcategory: string;
  description: string;
  provider: string; // nombre proveedor
  providerRut: string | null; // RUT proveedor (null si internacional)
  documentType: DocumentType;
  documentNumber: string; // N° factura, boleta, etc.
  currency: Currency;
  amountOriginal: number; // monto en moneda original
  exchangeRate: number; // tasa USD→CLP (1 si es CLP)
  amountCLP: number; // monto total en CLP
  neto: number; // monto neto (sin IVA)
  iva: number; // monto IVA (19% o 0)
  ivaRecuperable: boolean; // si el IVA es credito fiscal
  retencion: number; // retencion (ej: 13.75% boleta honorarios)
  taxDeductible: boolean; // deducible de impuestos
  deductiblePercent: number; // % deducible (100%, 40% para luz, etc.)
  deductibleAmount: number; // monto efectivamente deducible
  paymentMethod: PaymentMethod;
  recurring: boolean;
  recurringFrequency: 'mensual' | 'trimestral' | 'semestral' | 'anual' | null;
  periodMonth: number; // mes del periodo (1-12)
  periodYear: number; // ano del periodo
  notes: string;
  attachmentName: string | null; // nombre archivo adjunto
  createdAt: string;
}

// ─── SMART CATEGORIES ───
// Auto-classification: when user types a keyword, system suggests category
export interface AccountCategory {
  key: string;
  name: string;
  group:
    | 'ingreso'
    | 'costo_operacional'
    | 'gasto_admin'
    | 'gasto_ventas'
    | 'inversion'
    | 'remuneracion'
    | 'prevision'
    | 'impuesto';
  codigoSII: string; // codigo cuenta SII simplificado
  defaultIVA: boolean; // si normalmente tiene IVA
  defaultDeductible: number; // % deducible por defecto
  defaultCurrency: Currency;
  keywords: string[]; // para auto-clasificacion inteligente
  icon: string;
}

export const ACCOUNT_CATEGORIES: AccountCategory[] = [
  // ─── INGRESOS ───
  {
    key: 'suscripciones_ingreso',
    name: 'Ingresos por Suscripciones',
    group: 'ingreso',
    codigoSII: '4.1.01',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: [
      'suscripcion',
      'plan pro',
      'plan basico',
      'premium',
      'mensualidad',
      'pago estudiante',
    ],
    icon: '💰',
  },
  {
    key: 'licencias_ingreso',
    name: 'Licencias Institucionales',
    group: 'ingreso',
    codigoSII: '4.1.02',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['licencia', 'universidad', 'institucion', 'corporativo', 'contrato anual'],
    icon: '🏛️',
  },
  {
    key: 'otros_ingresos',
    name: 'Otros Ingresos',
    group: 'ingreso',
    codigoSII: '4.1.99',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['otro ingreso', 'devolucion', 'reembolso'],
    icon: '📥',
  },

  // ─── COSTOS OPERACIONALES (directos del servicio) ───
  {
    key: 'hosting',
    name: 'Hosting e Infraestructura Cloud',
    group: 'costo_operacional',
    codigoSII: '5.1.01',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'USD',
    keywords: [
      'render',
      'vercel',
      'aws',
      'heroku',
      'railway',
      'netlify',
      'digitalocean',
      'hosting',
      'cloud',
      'servidor',
    ],
    icon: '☁️',
  },
  {
    key: 'api_ia',
    name: 'APIs de Inteligencia Artificial',
    group: 'costo_operacional',
    codigoSII: '5.1.02',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'USD',
    keywords: [
      'anthropic',
      'claude',
      'openai',
      'gemini',
      'google ai',
      'api ia',
      'tokens',
      'chatgpt',
    ],
    icon: '🤖',
  },
  {
    key: 'dominio_ssl',
    name: 'Dominios y Certificados SSL',
    group: 'costo_operacional',
    codigoSII: '5.1.03',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'USD',
    keywords: [
      'dominio',
      'namecheap',
      'godaddy',
      'cloudflare',
      'ssl',
      'certificado',
      'conniku.com',
    ],
    icon: '🌐',
  },
  {
    key: 'email_corporativo',
    name: 'Correo Corporativo',
    group: 'costo_operacional',
    codigoSII: '5.1.04',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'USD',
    keywords: ['zoho', 'google workspace', 'microsoft 365', 'correo', 'email', 'smtp'],
    icon: '📧',
  },
  {
    key: 'app_stores',
    name: 'Tiendas de Aplicaciones',
    group: 'costo_operacional',
    codigoSII: '5.1.05',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'USD',
    keywords: [
      'google play',
      'apple store',
      'app store',
      'play console',
      'developer account',
      'apple developer',
    ],
    icon: '📱',
  },
  {
    key: 'software_suscripciones',
    name: 'Software y Suscripciones',
    group: 'costo_operacional',
    codigoSII: '5.1.06',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'USD',
    keywords: [
      'github',
      'figma',
      'canva',
      'slack',
      'notion',
      'trello',
      'jira',
      'adobe',
      'copilot',
      'cursor',
      'vscode',
    ],
    icon: '💻',
  },
  {
    key: 'pasarela_pago',
    name: 'Pasarelas de Pago (comisiones)',
    group: 'costo_operacional',
    codigoSII: '5.1.07',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['mercadopago', 'paypal', 'stripe', 'flow', 'transbank', 'comision', 'pasarela'],
    icon: '💳',
  },
  {
    key: 'base_datos',
    name: 'Bases de Datos',
    group: 'costo_operacional',
    codigoSII: '5.1.08',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'USD',
    keywords: [
      'postgresql',
      'mongodb',
      'redis',
      'supabase',
      'firebase',
      'neon',
      'planetscale',
      'database',
    ],
    icon: '🗄️',
  },

  // ─── GASTOS ADMINISTRATIVOS ───
  {
    key: 'arriendo',
    name: 'Arriendo Oficina / Cowork',
    group: 'gasto_admin',
    codigoSII: '5.2.01',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: [
      'arriendo',
      'alquiler',
      'oficina',
      'cowork',
      'leasity',
      'miss propiedades',
      'corredora',
      'gastos comunes',
    ],
    icon: '🏢',
  },
  {
    key: 'luz',
    name: 'Electricidad',
    group: 'gasto_admin',
    codigoSII: '5.2.02',
    defaultIVA: true,
    defaultDeductible: 40,
    defaultCurrency: 'CLP',
    keywords: ['luz', 'electricidad', 'enel', 'cge', 'saesa', 'elecda', 'energia'],
    icon: '⚡',
  },
  {
    key: 'agua',
    name: 'Agua',
    group: 'gasto_admin',
    codigoSII: '5.2.03',
    defaultIVA: true,
    defaultDeductible: 25,
    defaultCurrency: 'CLP',
    keywords: ['agua', 'aguas antofagasta', 'sanitaria', 'esval'],
    icon: '💧',
  },
  {
    key: 'gas',
    name: 'Gas',
    group: 'gasto_admin',
    codigoSII: '5.2.04',
    defaultIVA: true,
    defaultDeductible: 20,
    defaultCurrency: 'CLP',
    keywords: ['gas', 'abastible', 'gasco', 'lipigas', 'metrogas'],
    icon: '🔥',
  },
  {
    key: 'internet',
    name: 'Internet',
    group: 'gasto_admin',
    codigoSII: '5.2.05',
    defaultIVA: true,
    defaultDeductible: 80,
    defaultCurrency: 'CLP',
    keywords: [
      'internet',
      'fibra',
      'banda ancha',
      'movistar',
      'entel',
      'vtr',
      'wom',
      'claro',
      'telsur',
      'gtd',
    ],
    icon: '📶',
  },
  {
    key: 'telefonia',
    name: 'Telefonia Movil',
    group: 'gasto_admin',
    codigoSII: '5.2.06',
    defaultIVA: true,
    defaultDeductible: 60,
    defaultCurrency: 'CLP',
    keywords: ['celular', 'telefono', 'plan movil', 'entel', 'movistar', 'wom', 'claro'],
    icon: '📞',
  },
  {
    key: 'servicios_legales',
    name: 'Servicios Legales',
    group: 'gasto_admin',
    codigoSII: '5.2.07',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['abogado', 'legal', 'notaria', 'escritura', 'contrato', 'asesoria legal', 'patente'],
    icon: '⚖️',
  },
  {
    key: 'contabilidad',
    name: 'Contabilidad y Auditoria',
    group: 'gasto_admin',
    codigoSII: '5.2.08',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['contador', 'contabilidad', 'auditoria', 'declaracion', 'f29', 'renta'],
    icon: '📊',
  },
  {
    key: 'patente_municipal',
    name: 'Patente Municipal',
    group: 'gasto_admin',
    codigoSII: '5.2.09',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['patente', 'municipal', 'municipalidad', 'antofagasta', 'rentas municipales'],
    icon: '🏛️',
  },
  {
    key: 'seguros',
    name: 'Seguros',
    group: 'gasto_admin',
    codigoSII: '5.2.10',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['seguro', 'poliza', 'siniestro', 'cobertura'],
    icon: '🛡️',
  },
  {
    key: 'utiles_oficina',
    name: 'Utiles de Oficina',
    group: 'gasto_admin',
    codigoSII: '5.2.11',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['utiles', 'papel', 'tinta', 'impresora', 'escritorio', 'oficina'],
    icon: '📎',
  },
  {
    key: 'constitucion_empresa',
    name: 'Gastos de Constitucion',
    group: 'gasto_admin',
    codigoSII: '5.2.12',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['constitucion', 'registro empresas', 'inscripcion', 'tu empresa en un dia'],
    icon: '📜',
  },

  // ─── GASTOS DE VENTAS Y MARKETING ───
  {
    key: 'marketing_digital',
    name: 'Marketing Digital (Ads)',
    group: 'gasto_ventas',
    codigoSII: '5.3.01',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'USD',
    keywords: [
      'google ads',
      'meta ads',
      'facebook ads',
      'instagram ads',
      'tiktok ads',
      'publicidad',
      'campana',
    ],
    icon: '📢',
  },
  {
    key: 'marketing_contenido',
    name: 'Marketing de Contenido',
    group: 'gasto_ventas',
    codigoSII: '5.3.02',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['contenido', 'blog', 'video', 'diseno', 'branding', 'logo', 'marca'],
    icon: '🎨',
  },
  {
    key: 'eventos',
    name: 'Eventos y Representacion',
    group: 'gasto_ventas',
    codigoSII: '5.3.03',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['evento', 'webinar', 'conferencia', 'feria', 'networking', 'representacion'],
    icon: '🎪',
  },

  // ─── INVERSIONES ───
  {
    key: 'equipamiento',
    name: 'Equipamiento y Hardware',
    group: 'inversion',
    codigoSII: '5.4.01',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: [
      'computador',
      'notebook',
      'monitor',
      'teclado',
      'mouse',
      'macbook',
      'hardware',
      'equipo',
    ],
    icon: '🖥️',
  },
  {
    key: 'mobiliario',
    name: 'Mobiliario de Oficina',
    group: 'inversion',
    codigoSII: '5.4.02',
    defaultIVA: true,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['escritorio', 'silla', 'mueble', 'estante', 'mobiliario'],
    icon: '🪑',
  },

  // ─── REMUNERACIONES ───
  {
    key: 'sueldos',
    name: 'Sueldos y Salarios',
    group: 'remuneracion',
    codigoSII: '5.5.01',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['sueldo', 'salario', 'remuneracion', 'liquidacion', 'nomina'],
    icon: '👥',
  },
  {
    key: 'honorarios',
    name: 'Honorarios (Boleta)',
    group: 'remuneracion',
    codigoSII: '5.5.02',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: [
      'honorario',
      'boleta honorarios',
      'tutor',
      'freelancer',
      'externo',
      'prestacion servicios',
    ],
    icon: '📄',
  },
  {
    key: 'gratificacion',
    name: 'Gratificacion Legal',
    group: 'remuneracion',
    codigoSII: '5.5.03',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['gratificacion', 'art 50'],
    icon: '🎁',
  },
  {
    key: 'colacion_movilizacion',
    name: 'Colacion y Movilizacion',
    group: 'remuneracion',
    codigoSII: '5.5.04',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['colacion', 'movilizacion', 'transporte', 'alimentacion laboral'],
    icon: '🍽️',
  },

  // ─── PREVISION SOCIAL ───
  {
    key: 'afp_empleador',
    name: 'AFP (aporte empleador)',
    group: 'prevision',
    codigoSII: '5.6.01',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['afp', 'pension', 'prevision', 'cotizacion'],
    icon: '🏦',
  },
  {
    key: 'afc_empleador',
    name: 'AFC Seguro Cesantia (empleador)',
    group: 'prevision',
    codigoSII: '5.6.02',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['afc', 'cesantia', 'seguro cesantia'],
    icon: '🛡️',
  },
  {
    key: 'sis',
    name: 'SIS Seguro Invalidez',
    group: 'prevision',
    codigoSII: '5.6.03',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['sis', 'invalidez', 'sobrevivencia'],
    icon: '🏥',
  },
  {
    key: 'mutual',
    name: 'Mutual de Seguridad',
    group: 'prevision',
    codigoSII: '5.6.04',
    defaultIVA: false,
    defaultDeductible: 100,
    defaultCurrency: 'CLP',
    keywords: ['mutual', 'achs', 'ist', 'museg', 'cchc'],
    icon: '⛑️',
  },

  // ─── IMPUESTOS (no deducibles, pero se registran) ───
  {
    key: 'iva_pago',
    name: 'Pago IVA (F29)',
    group: 'impuesto',
    codigoSII: '6.1.01',
    defaultIVA: false,
    defaultDeductible: 0,
    defaultCurrency: 'CLP',
    keywords: ['iva', 'f29', 'formulario 29', 'debito fiscal'],
    icon: '🏛️',
  },
  {
    key: 'ppm',
    name: 'PPM (Pago Provisional Mensual)',
    group: 'impuesto',
    codigoSII: '6.1.02',
    defaultIVA: false,
    defaultDeductible: 0,
    defaultCurrency: 'CLP',
    keywords: ['ppm', 'provisional', 'anticipo impuesto'],
    icon: '📋',
  },
  {
    key: 'impuesto_renta',
    name: 'Impuesto a la Renta (F22)',
    group: 'impuesto',
    codigoSII: '6.1.03',
    defaultIVA: false,
    defaultDeductible: 0,
    defaultCurrency: 'CLP',
    keywords: ['renta', 'f22', 'declaracion anual', 'abril'],
    icon: '📑',
  },
];

// ─── SMART CATEGORY MATCHER ───
export function matchCategory(text: string): AccountCategory | null {
  const lower = text.toLowerCase().trim();
  if (!lower) return null;

  // Score each category by keyword matches
  let bestMatch: AccountCategory | null = null;
  let bestScore = 0;

  for (const cat of ACCOUNT_CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length; // longer keyword = more specific match
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// ─── IVA CALCULATOR ───
export function calculateIVA(totalAmount: number, hasIVA: boolean): { neto: number; iva: number } {
  if (!hasIVA) return { neto: totalAmount, iva: 0 };
  const neto = Math.round(totalAmount / 1.19);
  const iva = totalAmount - neto;
  return { neto, iva };
}

export function calculateIVAFromNeto(neto: number): { total: number; iva: number } {
  const iva = Math.round(neto * 0.19);
  return { total: neto + iva, iva };
}

// ─── FISCAL DEADLINES ───
export interface FiscalDeadline {
  key: string;
  name: string;
  description: string;
  frequency: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  dayOfMonth: number | null; // dia del mes (null si es anual con mes fijo)
  month: number | null; // mes (solo para anual/semestral)
  platform: string; // donde se paga/declara
  url: string; // link directo
  alertDaysBefore: number; // dias antes para enviar alerta
  requiresData: string[]; // que datos necesita del sistema
}

export const FISCAL_DEADLINES: FiscalDeadline[] = [
  {
    key: 'f29',
    name: 'Formulario 29 — Declaracion IVA Mensual',
    description:
      'Declaracion y pago mensual de IVA (debito - credito fiscal). Incluye PPM si hay ingresos.',
    frequency: 'mensual',
    dayOfMonth: 12,
    month: null,
    platform: 'SII — Servicio de Impuestos Internos',
    url: 'https://www.sii.cl/servicios_online/1080-1082.html',
    alertDaysBefore: 2,
    requiresData: ['libro_compras', 'libro_ventas', 'iva_credito', 'iva_debito', 'ppm'],
  },
  {
    key: 'previred',
    name: 'Previred — Cotizaciones Previsionales',
    description: 'Declaracion y pago de AFP, Salud, AFC, SIS y Mutual para todos los trabajadores.',
    frequency: 'mensual',
    dayOfMonth: 13,
    month: null,
    platform: 'Previred',
    url: 'https://www.previred.com/',
    alertDaysBefore: 2,
    requiresData: ['empleados', 'remuneraciones', 'afp', 'salud', 'afc'],
  },
  {
    key: 'remuneraciones',
    name: 'Pago de Remuneraciones',
    description: 'Pago de sueldos a trabajadores. Cierre dia 22, pago ultimo dia habil.',
    frequency: 'mensual',
    dayOfMonth: 30, // ultimo dia habil (aproximado)
    month: null,
    platform: 'Banco / Transferencia',
    url: 'https://www.bancoestado.cl/',
    alertDaysBefore: 2,
    requiresData: ['liquidaciones', 'neto_a_pagar'],
  },
  {
    key: 'f22',
    name: 'Formulario 22 — Declaracion Renta Anual',
    description: 'Declaracion anual de impuesto a la renta. Regimen 14D N°3: base flujo de caja.',
    frequency: 'anual',
    dayOfMonth: 30,
    month: 4, // Abril
    platform: 'SII — Servicio de Impuestos Internos',
    url: 'https://www.sii.cl/servicios_online/1080-1083.html',
    alertDaysBefore: 7,
    requiresData: ['ingresos_anuales', 'gastos_anuales', 'resultado_tributario'],
  },
  {
    key: 'patente_1',
    name: 'Patente Municipal — 1er Semestre',
    description: 'Pago patente comercial Municipalidad de Antofagasta.',
    frequency: 'semestral',
    dayOfMonth: 31,
    month: 1, // Enero
    platform: 'Municipalidad de Antofagasta',
    url: 'https://www.municipalidadantofagasta.cl/',
    alertDaysBefore: 7,
    requiresData: ['capital_propio'],
  },
  {
    key: 'patente_2',
    name: 'Patente Municipal — 2do Semestre',
    description: 'Pago patente comercial Municipalidad de Antofagasta.',
    frequency: 'semestral',
    dayOfMonth: 31,
    month: 7, // Julio
    platform: 'Municipalidad de Antofagasta',
    url: 'https://www.municipalidadantofagasta.cl/',
    alertDaysBefore: 7,
    requiresData: ['capital_propio'],
  },
  {
    key: 'dj1887',
    name: 'DJ 1887 — Declaracion Jurada Sueldos',
    description: 'Declaracion jurada anual de sueldos pagados a trabajadores.',
    frequency: 'anual',
    dayOfMonth: 28,
    month: 3, // Marzo
    platform: 'SII — Servicio de Impuestos Internos',
    url: 'https://www.sii.cl/servicios_online/1080-1399.html',
    alertDaysBefore: 7,
    requiresData: ['sueldos_anuales', 'retenciones'],
  },
];

// ─── PRE-LOADED RECURRING EXPENSES (Conniku actual) ───
export interface RecurringExpense {
  description: string;
  provider: string;
  category: string;
  currency: Currency;
  estimatedAmount: number; // monto estimado
  frequency: 'mensual' | 'anual';
  documentType: DocumentType;
  hasIVA: boolean;
  notes: string;
}

export const KNOWN_RECURRING_EXPENSES: RecurringExpense[] = [
  {
    description: 'Arriendo oficina + gastos comunes',
    provider: 'Miss Propiedades / Leasity',
    category: 'arriendo',
    currency: 'CLP',
    estimatedAmount: 697688,
    frequency: 'mensual',
    documentType: 'boleta',
    hasIVA: false,
    notes: 'Domicilio comercial declarado ante SII',
  },
  {
    description: 'Backend hosting (Starter)',
    provider: 'Render',
    category: 'hosting',
    currency: 'USD',
    estimatedAmount: 7,
    frequency: 'mensual',
    documentType: 'invoice_internacional',
    hasIVA: false,
    notes: 'FastAPI backend',
  },
  {
    description: 'Correo corporativo',
    provider: 'Zoho Mail',
    category: 'email_corporativo',
    currency: 'USD',
    estimatedAmount: 0,
    frequency: 'mensual',
    documentType: 'invoice_internacional',
    hasIVA: false,
    notes: 'Plan gratuito actualmente',
  },
  {
    description: 'Dominio conniku.com',
    provider: 'Namecheap',
    category: 'dominio_ssl',
    currency: 'USD',
    estimatedAmount: 12,
    frequency: 'anual',
    documentType: 'invoice_internacional',
    hasIVA: false,
    notes: '',
  },
  {
    description: 'Google Play Console',
    provider: 'Google',
    category: 'app_stores',
    currency: 'USD',
    estimatedAmount: 25,
    frequency: 'anual',
    documentType: 'invoice_internacional',
    hasIVA: false,
    notes: 'Pago unico developer account',
  },
  {
    description: 'Apple Developer Program',
    provider: 'Apple',
    category: 'app_stores',
    currency: 'USD',
    estimatedAmount: 99,
    frequency: 'anual',
    documentType: 'invoice_internacional',
    hasIVA: false,
    notes: 'Developer account iOS',
  },
  {
    description: 'API Claude (Anthropic)',
    provider: 'Anthropic',
    category: 'api_ia',
    currency: 'USD',
    estimatedAmount: 0,
    frequency: 'mensual',
    documentType: 'invoice_internacional',
    hasIVA: false,
    notes: 'Pago por uso (tokens)',
  },
  {
    description: 'Frontend hosting',
    provider: 'Vercel',
    category: 'hosting',
    currency: 'USD',
    estimatedAmount: 0,
    frequency: 'mensual',
    documentType: 'invoice_internacional',
    hasIVA: false,
    notes: 'Plan gratuito Hobby',
  },
];

// ─── TRANSACTION STORAGE (localStorage until backend) ───
const TX_STORAGE_KEY = 'conniku_transactions';

export function loadTransactions(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(TX_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveTransaction(tx: Transaction) {
  const all = loadTransactions();
  const idx = all.findIndex((t) => t.id === tx.id);
  if (idx >= 0) all[idx] = tx;
  else all.push(tx);
  localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(all));
}

export function deleteTransaction(id: string) {
  const all = loadTransactions().filter((t) => t.id !== id);
  localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(all));
}

export function getTransactionsByPeriod(month: number, year: number): Transaction[] {
  return loadTransactions().filter((t) => t.periodMonth === month && t.periodYear === year);
}

// ─── FISCAL SUMMARY FOR A PERIOD ───
export interface FiscalSummary {
  period: string;
  month: number;
  year: number;
  // Ingresos
  totalIngresos: number;
  ivaDebito: number; // IVA de ventas (lo que debes al fisco)
  // Egresos
  totalEgresos: number;
  ivaCreditoRecuperable: number; // IVA de compras (lo que el fisco te debe)
  totalDeducible: number;
  // Resultado
  ivaAPagar: number; // debito - credito (si positivo, pagas; si negativo, remanente)
  remanente: number; // credito a favor para siguiente mes
  resultadoTributario: number; // ingresos - gastos deducibles (base para impuesto renta)
  // PPM
  ppm: number; // 0.25% de ingresos brutos (micro empresa)
  // Breakdown por grupo
  byGroup: Record<string, number>;
  byCategory: Record<string, number>;
}

// ─── Accepts transactions array directly (for API-backed components) ───
export function calculateFiscalSummaryFromTxs(
  txs: Transaction[],
  month: number,
  year: number,
  remanentePrevio: number = 0
): FiscalSummary {
  let totalIngresos = 0,
    ivaDebito = 0;
  let totalEgresos = 0,
    ivaCreditoRecuperable = 0,
    totalDeducible = 0;
  const byGroup: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const tx of txs) {
    const cat = ACCOUNT_CATEGORIES.find((c) => c.key === tx.category);
    const group = cat?.group || 'otro';

    if (tx.type === 'ingreso') {
      totalIngresos += tx.neto;
      ivaDebito += tx.iva;
    } else {
      totalEgresos += tx.amountCLP;
      if (tx.ivaRecuperable) ivaCreditoRecuperable += tx.iva;
      totalDeducible += tx.deductibleAmount;
    }

    byGroup[group] = (byGroup[group] || 0) + tx.amountCLP;
    byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amountCLP;
  }

  const ivaDiff = ivaDebito - ivaCreditoRecuperable - remanentePrevio;
  const ivaAPagar = Math.max(0, ivaDiff);
  const remanente = Math.max(0, -ivaDiff);
  const ppm = Math.round(totalIngresos * 0.0025);
  const resultadoTributario = totalIngresos - totalDeducible;

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    month,
    year,
    totalIngresos,
    ivaDebito,
    totalEgresos,
    ivaCreditoRecuperable,
    totalDeducible,
    ivaAPagar,
    remanente,
    resultadoTributario,
    ppm,
    byGroup,
    byCategory,
  };
}

export function calculateFiscalSummary(
  month: number,
  year: number,
  remanentePrevio: number = 0
): FiscalSummary {
  const txs = getTransactionsByPeriod(month, year);

  let totalIngresos = 0,
    ivaDebito = 0;
  let totalEgresos = 0,
    ivaCreditoRecuperable = 0,
    totalDeducible = 0;
  const byGroup: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const tx of txs) {
    const cat = ACCOUNT_CATEGORIES.find((c) => c.key === tx.category);
    const group = cat?.group || 'otro';

    if (tx.type === 'ingreso') {
      totalIngresos += tx.neto;
      ivaDebito += tx.iva;
    } else {
      totalEgresos += tx.amountCLP;
      if (tx.ivaRecuperable) ivaCreditoRecuperable += tx.iva;
      totalDeducible += tx.deductibleAmount;
    }

    byGroup[group] = (byGroup[group] || 0) + tx.amountCLP;
    byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amountCLP;
  }

  const ivaDiff = ivaDebito - ivaCreditoRecuperable - remanentePrevio;
  const ivaAPagar = Math.max(0, ivaDiff);
  const remanente = Math.max(0, -ivaDiff);

  // PPM: 0.25% de ingresos brutos para micro empresa ProPyme
  const ppm = Math.round(totalIngresos * 0.0025);

  const resultadoTributario = totalIngresos - totalDeducible;

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    month,
    year,
    totalIngresos,
    ivaDebito,
    totalEgresos,
    ivaCreditoRecuperable,
    totalDeducible,
    ivaAPagar,
    remanente,
    resultadoTributario,
    ppm,
    byGroup,
    byCategory,
  };
}

// ─── GENERATE UNIQUE ID ───
export function generateTxId(): string {
  return 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

// ─── DEADLINE STATUS CALCULATOR ───
export type DeadlineStatus = 'ok' | 'warning' | 'danger' | 'overdue';

export function getDeadlineStatus(
  deadline: FiscalDeadline,
  today: Date = new Date()
): { status: DeadlineStatus; nextDate: Date; daysUntil: number } {
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let nextDate: Date;

  if (deadline.frequency === 'mensual') {
    // Next occurrence this month or next
    const thisMonth = new Date(currentYear, currentMonth - 1, deadline.dayOfMonth!);
    if (thisMonth >= today) {
      nextDate = thisMonth;
    } else {
      const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
      nextDate = new Date(nextY, nextM - 1, deadline.dayOfMonth!);
    }
  } else if (deadline.frequency === 'anual') {
    const thisYear = new Date(currentYear, deadline.month! - 1, deadline.dayOfMonth!);
    nextDate =
      thisYear >= today
        ? thisYear
        : new Date(currentYear + 1, deadline.month! - 1, deadline.dayOfMonth!);
  } else {
    // semestral
    const thisOccurrence = new Date(currentYear, deadline.month! - 1, deadline.dayOfMonth!);
    nextDate =
      thisOccurrence >= today
        ? thisOccurrence
        : new Date(currentYear + 1, deadline.month! - 1, deadline.dayOfMonth!);
  }

  const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let status: DeadlineStatus = 'ok';
  if (daysUntil < 0) status = 'overdue';
  else if (daysUntil <= deadline.alertDaysBefore) status = 'danger';
  else if (daysUntil <= deadline.alertDaysBefore + 5) status = 'warning';

  return { status, nextDate, daysUntil };
}
