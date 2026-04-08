// ─── Seed Employee Data ─────────────────────────────────────────
// 5 core roles for Conniku SpA daily operations
// Emails follow the pattern: cargo@conniku.com
// ─────────────────────────────────────────────────────────────────

import type { Employee } from './types'

export const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    rut: '12.345.678-9',
    firstName: 'Tomás',
    lastName: 'Herrera',
    email: 'cto@conniku.com',
    phone: '+56 9 1234 5678',
    address: 'Av. Providencia 1234, Santiago',
    birthDate: '1990-03-15',
    nationality: 'Chilena',
    maritalStatus: 'Soltero',
    emergencyContactName: 'Ana Herrera',
    emergencyContactPhone: '+56 9 8765 4321',
    position: 'CTO — Director de Tecnología',
    department: 'Tecnologia',
    hireDate: '2026-04-08',
    endDate: null,
    contractType: 'indefinido',
    workSchedule: 'Lunes a Viernes',
    weeklyHours: 45,
    grossSalary: 2800000,
    colacion: 80000,
    movilizacion: 50000,
    afp: 'habitat',
    healthSystem: 'fonasa',
    isapreName: null,
    isapreUf: null,
    afcActive: true,
    bankName: 'Banco Estado',
    bankAccountType: 'Cuenta Vista',
    bankAccountNumber: '12345678',
    status: 'active',
    createdAt: '2026-04-08T00:00:00Z',
  },
  {
    id: 'emp-002',
    rut: '13.456.789-0',
    firstName: 'Valentina',
    lastName: 'Muñoz',
    email: 'operaciones@conniku.com',
    phone: '+56 9 2345 6789',
    address: 'Las Condes 567, Santiago',
    birthDate: '1992-07-22',
    nationality: 'Chilena',
    maritalStatus: 'Casada',
    emergencyContactName: 'Carlos Muñoz',
    emergencyContactPhone: '+56 9 7654 3210',
    position: 'Head of Operations',
    department: 'Operaciones',
    hireDate: '2026-04-08',
    endDate: null,
    contractType: 'indefinido',
    workSchedule: 'Lunes a Viernes',
    weeklyHours: 45,
    grossSalary: 2200000,
    colacion: 80000,
    movilizacion: 50000,
    afp: 'modelo',
    healthSystem: 'fonasa',
    isapreName: null,
    isapreUf: null,
    afcActive: true,
    bankName: 'Banco Santander',
    bankAccountType: 'Cuenta Corriente',
    bankAccountNumber: '23456789',
    status: 'active',
    createdAt: '2026-04-08T00:00:00Z',
  },
  {
    id: 'emp-003',
    rut: '14.567.890-1',
    firstName: 'Matías',
    lastName: 'Rojas',
    email: 'comunidad@conniku.com',
    phone: '+56 9 3456 7890',
    address: 'Ñuñoa 890, Santiago',
    birthDate: '1995-11-10',
    nationality: 'Chilena',
    maritalStatus: 'Soltero',
    emergencyContactName: 'Rosa Rojas',
    emergencyContactPhone: '+56 9 6543 2109',
    position: 'Community Manager',
    department: 'Marketing',
    hireDate: '2026-04-08',
    endDate: null,
    contractType: 'indefinido',
    workSchedule: 'Lunes a Viernes',
    weeklyHours: 45,
    grossSalary: 1200000,
    colacion: 70000,
    movilizacion: 40000,
    afp: 'provida',
    healthSystem: 'fonasa',
    isapreName: null,
    isapreUf: null,
    afcActive: true,
    bankName: 'Banco de Chile',
    bankAccountType: 'Cuenta Vista',
    bankAccountNumber: '34567890',
    status: 'active',
    createdAt: '2026-04-08T00:00:00Z',
  },
  {
    id: 'emp-004',
    rut: '15.678.901-2',
    firstName: 'Catalina',
    lastName: 'Soto',
    email: 'soporte@conniku.com',
    phone: '+56 9 4567 8901',
    address: 'Vitacura 123, Santiago',
    birthDate: '1997-01-28',
    nationality: 'Chilena',
    maritalStatus: 'Soltera',
    emergencyContactName: 'Pedro Soto',
    emergencyContactPhone: '+56 9 5432 1098',
    position: 'Customer Support Lead',
    department: 'Soporte',
    hireDate: '2026-04-08',
    endDate: null,
    contractType: 'indefinido',
    workSchedule: 'Lunes a Viernes',
    weeklyHours: 45,
    grossSalary: 1000000,
    colacion: 70000,
    movilizacion: 40000,
    afp: 'planvital',
    healthSystem: 'fonasa',
    isapreName: null,
    isapreUf: null,
    afcActive: true,
    bankName: 'Banco BCI',
    bankAccountType: 'Cuenta Vista',
    bankAccountNumber: '45678901',
    status: 'active',
    createdAt: '2026-04-08T00:00:00Z',
  },
  {
    id: 'emp-005',
    rut: '16.789.012-3',
    firstName: 'Sebastián',
    lastName: 'Lagos',
    email: 'marketing@conniku.com',
    phone: '+56 9 5678 9012',
    address: 'Santiago Centro 456, Santiago',
    birthDate: '1993-09-05',
    nationality: 'Chilena',
    maritalStatus: 'Soltero',
    emergencyContactName: 'María Lagos',
    emergencyContactPhone: '+56 9 4321 0987',
    position: 'Marketing & Growth Lead',
    department: 'Marketing',
    hireDate: '2026-04-08',
    endDate: null,
    contractType: 'indefinido',
    workSchedule: 'Lunes a Viernes',
    weeklyHours: 45,
    grossSalary: 1500000,
    colacion: 70000,
    movilizacion: 40000,
    afp: 'capital',
    healthSystem: 'fonasa',
    isapreName: null,
    isapreUf: null,
    afcActive: true,
    bankName: 'Banco Scotiabank',
    bankAccountType: 'Cuenta Corriente',
    bankAccountNumber: '56789012',
    status: 'active',
    createdAt: '2026-04-08T00:00:00Z',
  },
]

// Default module access: all modules enabled
export function getDefaultModuleAccess(): Record<string, boolean> {
  return {
    'personal': true,
    'contratos': true,
    'asistencia': true,
    'vacaciones': true,
    'liquidaciones': true,
    'previred': true,
    'finiquitos': true,
    'historial-pagos': true,
    'libro-rem': true,
    'dj1887': true,
    'impuestos': true,
    'inspeccion': true,
    'dashboard-ceo': true,
    'gastos': true,
    'financiero': true,
    'contabilidad': true,
    'facturacion': true,
    'presupuestos': true,
    'legal': true,
    'fraude': true,
    'email-ceo': false,       // CEO email restricted by default
    'email-contacto': true,
    'certificaciones': true,
    'ai-workflows': true,
    'tutores': true,
    'push-notifications': false, // Push restricted by default
    'guia-owner': false,         // Owner guide restricted by default
  }
}

// ─── Permission Storage (localStorage until backend is ready) ───

const PERMISSIONS_KEY = 'conniku_employee_permissions'

export interface EmployeePermissions {
  employeeId: string
  moduleAccess: Record<string, boolean>
  isActive: boolean
  lastUpdated: string
}

export function loadAllPermissions(): Record<string, EmployeePermissions> {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}

  // Initialize with defaults for seed employees
  const defaults: Record<string, EmployeePermissions> = {}
  SEED_EMPLOYEES.forEach(emp => {
    defaults[emp.id] = {
      employeeId: emp.id,
      moduleAccess: getDefaultModuleAccess(),
      isActive: true,
      lastUpdated: new Date().toISOString(),
    }
  })
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(defaults))
  return defaults
}

export function savePermissions(employeeId: string, perms: EmployeePermissions) {
  const all = loadAllPermissions()
  all[employeeId] = { ...perms, lastUpdated: new Date().toISOString() }
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(all))
}

export function getEmployeePermissions(employeeId: string): EmployeePermissions {
  const all = loadAllPermissions()
  return all[employeeId] || {
    employeeId,
    moduleAccess: getDefaultModuleAccess(),
    isActive: true,
    lastUpdated: new Date().toISOString(),
  }
}
