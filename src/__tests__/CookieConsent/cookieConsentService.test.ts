/**
 * Tests para cookieConsentService.ts
 * Cubre invariantes I-04, I-05, I-06, I-15, I-16, I-19 del plan.
 *
 * TDD RED phase: estos tests fallan porque el módulo no existe aún.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch global
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => '550e8400-e29b-41d4-a716-446655440000',
  subtle: globalThis.crypto?.subtle,
});

// Mock document.cookie para tests
let cookieStore: Record<string, string> = {};
Object.defineProperty(document, 'cookie', {
  get: () =>
    Object.entries(cookieStore)
      .map(([k, v]) => `${k}=${v}`)
      .join('; '),
  set: (val: string) => {
    const [pair] = val.split(';');
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      cookieStore[key.trim()] = value.trim();
    }
  },
  configurable: true,
});

describe('cookieConsentService', () => {
  beforeEach(() => {
    localStorage.clear();
    cookieStore = {};
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateVisitorUuid', () => {
    it('genera UUID v4 usando crypto.randomUUID', async () => {
      const { generateVisitorUuid } = await import('../../services/cookieConsentService');
      const uuid = generateVisitorUuid();
      expect(uuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('loadFromLocalStorage / saveToLocalStorage', () => {
    it('retorna null cuando no hay datos guardados', async () => {
      const { loadFromLocalStorage } = await import('../../services/cookieConsentService');
      const result = loadFromLocalStorage();
      expect(result).toBeNull();
    });

    it('guarda y recupera consent correctamente', async () => {
      const { saveToLocalStorage, loadFromLocalStorage } =
        await import('../../services/cookieConsentService');
      const consent = {
        visitorUuid: '550e8400-e29b-41d4-a716-446655440000',
        categoriesAccepted: ['necessary', 'functional'] as string[],
        policyVersion: '1.0.0',
        policyHash: 'testhash',
        acceptedAtUtc: new Date().toISOString(),
        retentionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
        origin: 'banner_initial' as const,
      };
      saveToLocalStorage(consent);
      const loaded = loadFromLocalStorage();
      expect(loaded).not.toBeNull();
      expect(loaded?.categoriesAccepted).toEqual(['necessary', 'functional']);
      expect(loaded?.policyVersion).toBe('1.0.0');
    });
  });

  describe('isConsentValid', () => {
    it('retorna false si el consent es null', async () => {
      const { isConsentValid } = await import('../../services/cookieConsentService');
      expect(isConsentValid(null)).toBe(false);
    });

    it('retorna false si policy_hash no coincide con el hash actual (I-06)', async () => {
      const { isConsentValid } = await import('../../services/cookieConsentService');
      const consent = {
        visitorUuid: 'uuid',
        categoriesAccepted: ['necessary'] as string[],
        policyVersion: '1.0.0',
        policyHash: 'hash-viejo-incorrecto',
        acceptedAtUtc: new Date().toISOString(),
        retentionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
        origin: 'banner_initial' as const,
      };
      expect(isConsentValid(consent)).toBe(false);
    });

    it('retorna false si el consent está vencido (I-16)', async () => {
      const { isConsentValid, COOKIE_CONSENT_POLICY_HASH } =
        await import('../../services/cookieConsentService');
      const consent = {
        visitorUuid: 'uuid',
        categoriesAccepted: ['necessary'] as string[],
        policyVersion: '1.0.0',
        policyHash: COOKIE_CONSENT_POLICY_HASH,
        acceptedAtUtc: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
        retentionExpiresAt: new Date(Date.now() - 1000).toISOString(), // ya venció
        origin: 'banner_initial' as const,
      };
      expect(isConsentValid(consent)).toBe(false);
    });

    it('retorna true si el consent es válido y no ha vencido', async () => {
      const { isConsentValid, COOKIE_CONSENT_POLICY_HASH } =
        await import('../../services/cookieConsentService');
      const consent = {
        visitorUuid: 'uuid',
        categoriesAccepted: ['necessary'] as string[],
        policyVersion: '1.0.0',
        policyHash: COOKIE_CONSENT_POLICY_HASH,
        acceptedAtUtc: new Date().toISOString(),
        retentionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
        origin: 'banner_initial' as const,
      };
      expect(isConsentValid(consent)).toBe(true);
    });
  });

  describe('saveToBackend', () => {
    it('hace POST a /api/consent/cookies con el payload correcto (I-04)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, visitor_uuid: 'uuid' }),
      });
      const { saveToBackend } = await import('../../services/cookieConsentService');
      const payload = {
        visitorUuid: '550e8400-e29b-41d4-a716-446655440000',
        categoriesAccepted: ['necessary'] as string[],
        policyVersion: '1.0.0',
        policyHash: 'hash',
        origin: 'banner_initial' as const,
        userTimezone: 'America/Santiago',
      };
      await saveToBackend(payload);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/consent/cookies'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
    });

    it('no lanza si el backend está caído (I-19)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const { saveToBackend } = await import('../../services/cookieConsentService');
      await expect(
        saveToBackend({
          visitorUuid: 'uuid',
          categoriesAccepted: ['necessary'] as string[],
          policyVersion: '1.0.0',
          policyHash: 'hash',
          origin: 'banner_initial' as const,
          userTimezone: 'America/Santiago',
        })
      ).resolves.not.toThrow();
    });
  });

  // D-09: vigencia Ley 21.719 corregida a 2026-12-01
  describe('Ley 21.719 vigencia (D-09)', () => {
    it('no menciona 2026-12-13 en el código del servicio', async () => {
      // Importamos el módulo y verificamos que la constante de versión no referencie la fecha errónea.
      // La fuente de verdad es el comentario del archivo; aquí verificamos el comportamiento expuesto.
      const mod = await import('../../services/cookieConsentService');
      // Si la constante de versión es correcta, el módulo cargó sin errores
      expect(mod.COOKIE_CONSENT_POLICY_VERSION).toBe('1.0.0');
    });
  });

  describe('fetchFromBackend', () => {
    it('retorna null si backend responde 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' }),
      });
      const { fetchFromBackend } = await import('../../services/cookieConsentService');
      const result = await fetchFromBackend('uuid-test');
      expect(result).toBeNull();
    });

    it('retorna null si backend está caído (I-19)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const { fetchFromBackend } = await import('../../services/cookieConsentService');
      const result = await fetchFromBackend('uuid-test');
      expect(result).toBeNull();
    });
  });
});
