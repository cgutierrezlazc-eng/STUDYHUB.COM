/**
 * cookieConsentService.ts
 *
 * Servicio para gestión del consentimiento de cookies.
 * Sincroniza estado entre localStorage, cookie HTTP y backend.
 *
 * Referencia legal:
 * - GDPR Art. 7(1): demostrabilidad del consentimiento.
 * - GDPR Art. 4(11): consentimiento libre, específico, informado, inequívoco.
 * - Planet49 C-673/17 (TJUE 2019-10-01): toggles no esenciales OFF por defecto.
 * - Orange Romania C-61/19 (TJUE 2020-11-11): registro con evidencia.
 * - Ley 19.628 Art. 4° (Chile): información al titular al recolectar datos.
 * - Ley 21.719 (Chile, vigencia 2026-12-01): consentimiento GDPR-like.
 *   Diario Oficial CVE 2583630, Art. 1° transitorio (día primero del mes
 *   vigésimo cuarto posterior a la publicación 2024-12-13).
 *
 * Pieza 2 del bloque bloque-cookie-consent-banner-v1.
 */

export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export type ConsentOrigin = 'banner_initial' | 'settings_change' | 'dnt_auto' | 'iframe_auto';

export interface CookieConsent {
  visitorUuid: string;
  categoriesAccepted: string[];
  policyVersion: string;
  policyHash: string;
  acceptedAtUtc: string;
  retentionExpiresAt: string;
  origin: ConsentOrigin;
  userId?: string;
}

export interface SaveToBackendPayload {
  visitorUuid: string;
  categoriesAccepted: string[];
  policyVersion: string;
  policyHash: string;
  origin: ConsentOrigin;
  userTimezone: string;
  userAgentHint?: string;
}

/** Hash de la política canónica de cookies v1.0.0.
 * Fuente de verdad: shared/cookie_consent_texts.py::COOKIE_CATEGORIES_HASH.
 * Pieza 4 del bloque recalcula y valida la coincidencia byte-a-byte.
 */
export const COOKIE_CONSENT_POLICY_VERSION = '1.0.0';
export const COOKIE_CONSENT_POLICY_HASH =
  '766ee8e1f84e514fa5430e9107b6638c20acfa2fda4175ae25ef3ce23890d2ef';

const LS_CONSENT_KEY = 'conniku_cookie_consent_v1';
const LS_VISITOR_UUID_KEY = 'conniku_cc_visitor_uuid';
const COOKIE_VISITOR_UUID_NAME = 'cc_visitor_uuid';
const COOKIE_CONSENT_NAME = 'cc_consent_v1';

// Endpoint base del backend (usa la misma variable que api.ts)
function getBackendUrl(): string {
  const stored = localStorage.getItem('conniku_server_url');
  if (stored) return stored;
  return import.meta.env.VITE_API_URL ?? 'https://studyhub-api-bpco.onrender.com';
}

// ─── Visitor UUID ─────────────────────────────────────────────────────────────

/** Genera un UUID v4 usando crypto.randomUUID (Web Crypto API). */
export function generateVisitorUuid(): string {
  return crypto.randomUUID();
}

/**
 * Obtiene el visitor UUID persistido, o genera uno nuevo.
 * Busca primero en localStorage, luego en cookie HTTP.
 * Si no existe en ninguno, genera uno nuevo y persiste en ambos.
 */
export function getOrCreateVisitorUuid(): string {
  // Buscar en localStorage
  const fromLS = localStorage.getItem(LS_VISITOR_UUID_KEY);
  if (fromLS) {
    ensureVisitorCookie(fromLS);
    return fromLS;
  }

  // Buscar en cookie HTTP
  const fromCookie = readCookie(COOKIE_VISITOR_UUID_NAME);
  if (fromCookie) {
    try {
      localStorage.setItem(LS_VISITOR_UUID_KEY, fromCookie);
    } catch {
      // localStorage no disponible: continuar con cookie
    }
    return fromCookie;
  }

  // Generar nuevo UUID
  const newUuid = generateVisitorUuid();
  try {
    localStorage.setItem(LS_VISITOR_UUID_KEY, newUuid);
  } catch {
    // localStorage bloqueado: continuar
  }
  ensureVisitorCookie(newUuid);
  return newUuid;
}

/** Escribe la cookie cc_visitor_uuid con expiración 5 años. */
function ensureVisitorCookie(uuid: string): void {
  const fiveYears = 5 * 365 * 24 * 60 * 60;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_VISITOR_UUID_NAME}=${uuid}; Max-Age=${fiveYears}; Path=/; SameSite=Lax${secure}`;
}

/** Lee una cookie HTTP por nombre. */
function readCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const [k, v] = c.trim().split('=');
    if (k === name && v) return v;
  }
  return null;
}

// ─── localStorage ─────────────────────────────────────────────────────────────

/** Carga el consentimiento desde localStorage. Retorna null si no existe. */
export function loadFromLocalStorage(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(LS_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    return parsed;
  } catch {
    return null;
  }
}

/** Guarda el consentimiento en localStorage y actualiza la cookie cc_consent_v1. */
export function saveToLocalStorage(consent: CookieConsent): void {
  try {
    localStorage.setItem(LS_CONSENT_KEY, JSON.stringify(consent));
    // Cookie cc_consent_v1 para server-rendered contexts
    const summary = consent.categoriesAccepted.join(',');
    const maxAge = Math.floor((new Date(consent.retentionExpiresAt).getTime() - Date.now()) / 1000);
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_CONSENT_NAME}=${summary}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  } catch {
    // localStorage no disponible: solo cookie
  }
}

// ─── Validación ───────────────────────────────────────────────────────────────

/**
 * Verifica si el consentimiento almacenado es válido.
 * Falla si:
 * - Es null
 * - El policy_hash no coincide con COOKIE_CONSENT_POLICY_HASH actual
 * - El retention_expires_at ya pasó
 *
 * Invariante I-06: si hash no coincide → hasConsent = false → banner reaparece.
 * Invariante I-16: si vencido → banner reaparece.
 */
export function isConsentValid(consent: CookieConsent | null): boolean {
  if (!consent) return false;
  if (consent.policyHash !== COOKIE_CONSENT_POLICY_HASH) return false;
  if (new Date(consent.retentionExpiresAt).getTime() < Date.now()) return false;
  return true;
}

// ─── Backend ──────────────────────────────────────────────────────────────────

/**
 * Obtiene el consentimiento almacenado en el backend para un visitor_uuid.
 * Retorna null si no existe o si el backend está caído (I-19: fail-safe).
 */
export async function fetchFromBackend(visitorUuid: string): Promise<CookieConsent | null> {
  try {
    const base = getBackendUrl();
    const resp = await fetch(`${base}/api/consent/cookies/${visitorUuid}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      visitorUuid: data.visitor_uuid,
      categoriesAccepted: data.categories_accepted,
      policyVersion: data.policy_version,
      policyHash: data.policy_hash,
      acceptedAtUtc: data.accepted_at_utc,
      retentionExpiresAt: data.retention_expires_at,
      origin: data.origin ?? 'banner_initial',
    };
  } catch {
    // Backend caído: fail-safe, no lanza (I-19)
    return null;
  }
}

/**
 * Guarda el consentimiento en el backend.
 * No lanza si el backend está caído: la persistencia local ya ocurrió (I-19).
 */
export async function saveToBackend(payload: SaveToBackendPayload): Promise<void> {
  try {
    const base = getBackendUrl();
    await fetch(`${base}/api/consent/cookies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_uuid: payload.visitorUuid,
        categories_accepted: payload.categoriesAccepted,
        policy_version: payload.policyVersion,
        policy_hash: payload.policyHash,
        origin: payload.origin,
        user_timezone: payload.userTimezone,
        user_agent_hint: payload.userAgentHint ?? navigator.userAgent,
      }),
    });
  } catch {
    // Backend caído: fail-safe (I-19)
  }
}

/**
 * Verifica la versión de política en el backend.
 * Retorna null si backend está caído.
 */
export async function fetchPolicyVersion(): Promise<{
  version: string;
  hash: string;
} | null> {
  try {
    const base = getBackendUrl();
    const resp = await fetch(`${base}/api/consent/cookies/policy-version`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// ─── Helpers de categoría ─────────────────────────────────────────────────────

/** Calcula la fecha de expiración de retención según categorías aceptadas.
 * - Si incluye analytics o marketing: 12 meses.
 * - Si solo necesarias + funcionales: 24 meses.
 * Conforme a recomendación EDPB 05/2020 §110.
 */
export function computeRetentionExpiry(categories: string[]): string {
  const hasTracking = categories.includes('analytics') || categories.includes('marketing');
  const months = hasTracking ? 12 : 24;
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  return expiry.toISOString();
}
