/**
 * Tests para useCookieConsent hook.
 * Cubre invariantes I-03, I-04, I-05 del plan.
 *
 * TDD RED phase: falla porque el hook no existe aún.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Mocks de cookieConsentService
vi.mock('../../services/cookieConsentService', () => ({
  COOKIE_CONSENT_POLICY_VERSION: '1.0.0',
  COOKIE_CONSENT_POLICY_HASH: '766ee8e1f84e514fa5430e9107b6638c20acfa2fda4175ae25ef3ce23890d2ef',
  generateVisitorUuid: () => 'test-uuid-1234',
  getOrCreateVisitorUuid: () => 'test-uuid-1234',
  loadFromLocalStorage: vi.fn().mockReturnValue(null),
  saveToLocalStorage: vi.fn(),
  isConsentValid: vi.fn().mockReturnValue(false),
  fetchFromBackend: vi.fn().mockResolvedValue(null),
  saveToBackend: vi.fn().mockResolvedValue(undefined),
  fetchPolicyVersion: vi.fn().mockResolvedValue({
    version: '1.0.0',
    hash: '766ee8e1f84e514fa5430e9107b6638c20acfa2fda4175ae25ef3ce23890d2ef',
  }),
  computeRetentionExpiry: vi
    .fn()
    .mockReturnValue(new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString()),
}));

describe('useCookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exporta el hook useCookieConsent', async () => {
    const mod = await import('../../hooks/useCookieConsent');
    expect(mod.useCookieConsent).toBeDefined();
    expect(typeof mod.useCookieConsent).toBe('function');
  });

  it('lanza error si se usa fuera del provider', async () => {
    const { useCookieConsent } = await import('../../hooks/useCookieConsent');
    expect(() => renderHook(() => useCookieConsent())).toThrow();
  });

  it('retorna hasConsented helper que verifica categorías', async () => {
    const { CookieConsentProvider } =
      await import('../../components/CookieConsent/CookieConsentProvider');
    const { useCookieConsent } = await import('../../hooks/useCookieConsent');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CookieConsentProvider, null, children);

    const { result } = renderHook(() => useCookieConsent(), { wrapper });

    expect(typeof result.current.hasConsented).toBe('function');
    expect(typeof result.current.isAnalyticsAllowed).toBe('function');
    expect(typeof result.current.isMarketingAllowed).toBe('function');
  });

  it('isAnalyticsAllowed retorna false cuando no hay consentimiento (I-03)', async () => {
    const { CookieConsentProvider } =
      await import('../../components/CookieConsent/CookieConsentProvider');
    const { useCookieConsent } = await import('../../hooks/useCookieConsent');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CookieConsentProvider, null, children);

    const { result } = renderHook(() => useCookieConsent(), { wrapper });
    expect(result.current.isAnalyticsAllowed()).toBe(false);
  });

  it('isMarketingAllowed retorna false cuando no hay consentimiento', async () => {
    const { CookieConsentProvider } =
      await import('../../components/CookieConsent/CookieConsentProvider');
    const { useCookieConsent } = await import('../../hooks/useCookieConsent');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CookieConsentProvider, null, children);

    const { result } = renderHook(() => useCookieConsent(), { wrapper });
    expect(result.current.isMarketingAllowed()).toBe(false);
  });

  it('expone métodos acceptAll, rejectAll, savePreferences, showBanner, updateConsent', async () => {
    const { CookieConsentProvider } =
      await import('../../components/CookieConsent/CookieConsentProvider');
    const { useCookieConsent } = await import('../../hooks/useCookieConsent');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CookieConsentProvider, null, children);

    const { result } = renderHook(() => useCookieConsent(), { wrapper });
    expect(typeof result.current.acceptAll).toBe('function');
    expect(typeof result.current.rejectAll).toBe('function');
    expect(typeof result.current.savePreferences).toBe('function');
    expect(typeof result.current.showBanner).toBe('function');
    expect(typeof result.current.updateConsent).toBe('function');
  });

  it('hasConsented(necessary) retorna false cuando no hay consentimiento aún', async () => {
    const { CookieConsentProvider } =
      await import('../../components/CookieConsent/CookieConsentProvider');
    const { useCookieConsent } = await import('../../hooks/useCookieConsent');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CookieConsentProvider, null, children);

    const { result } = renderHook(() => useCookieConsent(), { wrapper });
    // Sin consentimiento previo, ni siquiera "necessary" está confirmado
    expect(result.current.hasConsented('necessary')).toBe(false);
  });

  it('después de acceptAll, isAnalyticsAllowed retorna true (I-05)', async () => {
    const { saveToLocalStorage, loadFromLocalStorage, isConsentValid } =
      await import('../../services/cookieConsentService');

    // Simula que después de acceptAll el servicio reporta consent válido con analytics
    vi.mocked(isConsentValid).mockReturnValue(true);
    vi.mocked(loadFromLocalStorage).mockReturnValue({
      visitorUuid: 'test-uuid-1234',
      categoriesAccepted: ['necessary', 'functional', 'analytics', 'marketing'],
      policyVersion: '1.0.0',
      policyHash: '766ee8e1f84e514fa5430e9107b6638c20acfa2fda4175ae25ef3ce23890d2ef',
      acceptedAtUtc: new Date().toISOString(),
      retentionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      origin: 'banner_initial',
    });

    const { CookieConsentProvider } =
      await import('../../components/CookieConsent/CookieConsentProvider');
    const { useCookieConsent } = await import('../../hooks/useCookieConsent');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(CookieConsentProvider, null, children);

    const { result } = renderHook(() => useCookieConsent(), { wrapper });

    await act(async () => {
      await result.current.acceptAll();
    });

    expect(result.current.isAnalyticsAllowed()).toBe(true);
    expect(saveToLocalStorage).toHaveBeenCalled();
  });
});
