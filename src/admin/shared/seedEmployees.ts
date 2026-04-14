// ─── Employee Data ──────────────────────────────────────────────
// Real employees are loaded from the API via PersonalTab.
// SEED_EMPLOYEES is kept empty — populate via the admin panel.
// ─────────────────────────────────────────────────────────────────

import type { Employee } from './types';

export const SEED_EMPLOYEES: Employee[] = [];

// Default module access: all modules enabled
export function getDefaultModuleAccess(): Record<string, boolean> {
  return {
    personal: true,
    contratos: true,
    asistencia: true,
    vacaciones: true,
    liquidaciones: true,
    previred: true,
    finiquitos: true,
    'historial-pagos': true,
    'libro-rem': true,
    dj1887: true,
    impuestos: true,
    inspeccion: true,
    'dashboard-ceo': true,
    gastos: true,
    financiero: true,
    contabilidad: true,
    facturacion: true,
    presupuestos: true,
    legal: true,
    fraude: true,
    'email-ceo': false, // CEO email restricted by default
    'email-contacto': true,
    certificaciones: true,
    'ai-workflows': true,
    tutores: true,
    'push-notifications': false, // Push restricted by default
    'guia-owner': false, // Owner guide restricted by default
  };
}

// ─── Permission Storage (localStorage until backend is ready) ───

const PERMISSIONS_KEY = 'conniku_employee_permissions';

export interface EmployeePermissions {
  employeeId: string;
  moduleAccess: Record<string, boolean>;
  isActive: boolean;
  lastUpdated: string;
}

export function loadAllPermissions(): Record<string, EmployeePermissions> {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Initialize with defaults for seed employees
  const defaults: Record<string, EmployeePermissions> = {};
  SEED_EMPLOYEES.forEach((emp) => {
    defaults[emp.id] = {
      employeeId: emp.id,
      moduleAccess: getDefaultModuleAccess(),
      isActive: true,
      lastUpdated: new Date().toISOString(),
    };
  });
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(defaults));
  return defaults;
}

export function savePermissions(employeeId: string, perms: EmployeePermissions) {
  const all = loadAllPermissions();
  all[employeeId] = { ...perms, lastUpdated: new Date().toISOString() };
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(all));
}

export function getEmployeePermissions(employeeId: string): EmployeePermissions {
  const all = loadAllPermissions();
  return (
    all[employeeId] || {
      employeeId,
      moduleAccess: getDefaultModuleAccess(),
      isActive: true,
      lastUpdated: new Date().toISOString(),
    }
  );
}
