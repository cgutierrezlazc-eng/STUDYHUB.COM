// ─── Shared Constants for Admin Panel ──────────────────────────

// ─── Datos legales de la empresa ─────────────────────────────────
// Fuente: SII — inscripción 08-04-2026
export const COMPANY = {
  name:        'CONNIKU SpA',
  rut:         '78.395.702-7',
  giro:        'Portales y Plataformas Web',                      // Código SII 631200
  address:     'Avenida Argentina 01805, Depto. 502',
  commune:     'Antofagasta',
  city:        'Antofagasta',
  cityHeader:  'Antofagasta, Chile',                              // Para encabezados
  region:      'II Región de Antofagasta',
  repName:     'Cristian Gaete Lazcano',                          // Representante legal
  repRut:      '',                                                 // Completar con RUT personal del rep. legal
} as const

export const AFP_OPTIONS = [
  { value: 'capital', label: 'Capital', rate: 11.44 },
  { value: 'cuprum', label: 'Cuprum', rate: 11.44 },
  { value: 'habitat', label: 'Habitat', rate: 11.27 },
  { value: 'modelo', label: 'Modelo', rate: 10.58 },
  { value: 'planvital', label: 'PlanVital', rate: 10.41 },
  { value: 'provida', label: 'ProVida', rate: 11.45 },
  { value: 'uno', label: 'Uno', rate: 10.69 },
]

export const HEALTH_OPTIONS = [
  { value: 'fonasa', label: 'Fonasa (7%)' },
  { value: 'isapre', label: 'Isapre' },
]

export const CONTRACT_TYPES = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'plazo_fijo', label: 'Plazo Fijo' },
  { value: 'por_obra', label: 'Por Obra o Faena' },
  { value: 'honorarios', label: 'Honorarios' },
]

export const DEPARTMENTS = [
  'Tecnologia', 'Diseno', 'Marketing', 'Ventas', 'Operaciones',
  'Finanzas', 'Legal', 'Recursos Humanos', 'Soporte', 'Direccion'
]

export const BANKS = [
  'Banco de Chile', 'Banco Estado', 'Banco Santander', 'BCI', 'Scotiabank',
  'Banco Itau', 'Banco BICE', 'Banco Security', 'Banco Falabella',
  'Banco Ripley', 'MACH', 'Cuenta RUT', 'Mercado Pago', 'Tenpo'
]

export const EXPENSE_CATEGORIES = [
  { value: 'suscripcion', label: 'Suscripciones y Software' },
  { value: 'arriendo', label: 'Arriendo Oficina/Cowork' },
  { value: 'servicios', label: 'Servicios Basicos (luz, agua, internet)' },
  { value: 'equipamiento', label: 'Equipamiento y Hardware' },
  { value: 'marketing', label: 'Marketing y Publicidad' },
  { value: 'legal', label: 'Servicios Legales' },
  { value: 'contabilidad', label: 'Contabilidad y Auditoria' },
  { value: 'hosting', label: 'Hosting y Infraestructura Cloud' },
  { value: 'dominio', label: 'Dominios y Certificados' },
  { value: 'capacitacion', label: 'Capacitacion' },
  { value: 'viajes', label: 'Viajes y Representacion' },
  { value: 'seguros', label: 'Seguros' },
  { value: 'otro', label: 'Otro' },
]
