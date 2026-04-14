// ─── Shared Types for Admin Panel ───────────────────────────────

export interface Employee {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  position: string;
  department: string;
  hireDate: string;
  endDate: string | null;
  contractType: string;
  workSchedule: string;
  weeklyHours: number;
  grossSalary: number;
  colacion: number;
  movilizacion: number;
  afp: string;
  healthSystem: string;
  isapreName: string | null;
  isapreUf: number | null;
  afcActive: boolean;
  bankName: string;
  bankAccountType: string;
  bankAccountNumber: string;
  status: string;
  profilePictureUrl?: string | null;
  isArt22Exempt?: boolean;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRut?: string;
  employeePosition?: string;
  employeeAfp?: string;
  employeeHealthSystem?: string;
  periodMonth: number;
  periodYear: number;
  grossSalary: number;
  gratificacion: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonuses: number;
  colacion: number;
  movilizacion: number;
  totalHaberesImponibles: number;
  totalHaberesNoImponibles: number;
  afpEmployee: number;
  healthEmployee: number;
  afcEmployee: number;
  taxAmount: number;
  voluntaryDeductions?: number;
  otherDeductions?: number;
  totalDeductions: number;
  netSalary: number;
  afpEmployer: number;
  afcEmployer: number;
  mutualEmployer: number;
  totalEmployerCost: number;
  status: string;
  paidAt?: string | null;
}

export interface OperationalExpense {
  id: string;
  category: string;
  description: string;
  amountClp: number;
  amountUsd: number | null;
  providerName: string;
  providerRut: string | null;
  documentNumber: string;
  documentType: string;
  taxDeductible: boolean;
  ivaAmount: number | null;
  periodMonth: number;
  periodYear: number;
  recurring: boolean;
  recurringFrequency: string | null;
  createdAt: string;
}

export interface PreviredData {
  period: string;
  employees: {
    rut: string;
    name: string;
    afp: string;
    afpAmount: number;
    healthSystem: string;
    healthAmount: number;
    afcEmployee: number;
    afcEmployer: number;
    sis: number;
    mutual: number;
    taxableIncome: number;
  }[];
  totals: {
    totalAfp: number;
    totalHealth: number;
    totalAfcEmployee: number;
    totalAfcEmployer: number;
    totalSis: number;
    totalMutual: number;
  };
}

export interface AdminModule {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'hr' | 'payroll' | 'finance' | 'legal' | 'tools';
  route: string;
  windowSize?: { width: number; height: number };
  isNew?: boolean;
  ownerOnly?: boolean;
  status: 'active' | 'coming-soon';
}
