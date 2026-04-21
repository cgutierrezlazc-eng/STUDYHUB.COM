/**
 * CookieConsentProvider.tsx — stub inicial (fase RED de TDD).
 * Implementación completa en fase GREEN.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { CookieConsent, ConsentOrigin } from '../../services/cookieConsentService';
import {
  COOKIE_CONSENT_POLICY_HASH,
  COOKIE_CONSENT_POLICY_VERSION,
  getOrCreateVisitorUuid,
  loadFromLocalStorage,
  saveToLocalStorage,
  isConsentValid,
  fetchFromBackend,
  saveToBackend,
  computeRetentionExpiry,
} from '../../services/cookieConsentService';

export interface CookieConsentContextValue {
  consent: CookieConsent | null;
  hasConsented: (category: string) => boolean;
  isAnalyticsAllowed: () => boolean;
  isMarketingAllowed: () => boolean;
  showBanner: () => void;
  acceptAll: () => Promise<void>;
  rejectAll: () => Promise<void>;
  savePreferences: (categories: string[]) => Promise<void>;
  updateConsent: () => Promise<void>;
  bannerVisible: boolean;
  settingsVisible: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsentContext(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsentContext debe usarse dentro de CookieConsentProvider');
  }
  return ctx;
}

interface ProviderProps {
  children: React.ReactNode;
}

export function CookieConsentProvider({ children }: ProviderProps) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Inicialización: carga consentimiento local y verifica contra backend
  useEffect(() => {
    async function init() {
      const visitorUuid = getOrCreateVisitorUuid();
      const local = loadFromLocalStorage();

      if (isConsentValid(local)) {
        setConsent(local);
        // Verificación en background contra servidor (detectar revocación)
        const remote = await fetchFromBackend(visitorUuid);
        if (remote && !isConsentValid(remote)) {
          setConsent(null);
          setBannerVisible(true);
        }
        return;
      }

      // No hay consentimiento válido: consultar backend
      const remote = await fetchFromBackend(visitorUuid);
      if (remote && isConsentValid(remote)) {
        setConsent(remote);
        saveToLocalStorage(remote);
        return;
      }

      // Sin consentimiento: mostrar banner
      setBannerVisible(true);
    }

    init();
  }, []);

  const persistConsent = useCallback(async (categories: string[], origin: ConsentOrigin) => {
    const visitorUuid = getOrCreateVisitorUuid();
    const retentionExpiresAt = computeRetentionExpiry(categories);
    const newConsent: CookieConsent = {
      visitorUuid,
      categoriesAccepted: categories,
      policyVersion: COOKIE_CONSENT_POLICY_VERSION,
      policyHash: COOKIE_CONSENT_POLICY_HASH,
      acceptedAtUtc: new Date().toISOString(),
      retentionExpiresAt,
      origin,
    };
    setConsent(newConsent);
    saveToLocalStorage(newConsent);
    setBannerVisible(false);
    setSettingsVisible(false);
    await saveToBackend({
      visitorUuid,
      categoriesAccepted: categories,
      policyVersion: COOKIE_CONSENT_POLICY_VERSION,
      policyHash: COOKIE_CONSENT_POLICY_HASH,
      origin,
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, []);

  const acceptAll = useCallback(async () => {
    await persistConsent(['necessary', 'functional', 'analytics', 'marketing'], 'banner_initial');
  }, [persistConsent]);

  const rejectAll = useCallback(async () => {
    await persistConsent(['necessary'], 'banner_initial');
  }, [persistConsent]);

  const savePreferences = useCallback(
    async (categories: string[]) => {
      const withNecessary = categories.includes('necessary')
        ? categories
        : ['necessary', ...categories];
      await persistConsent(withNecessary, 'settings_change');
    },
    [persistConsent]
  );

  const updateConsent = useCallback(async () => {
    const visitorUuid = getOrCreateVisitorUuid();
    const remote = await fetchFromBackend(visitorUuid);
    if (remote && isConsentValid(remote)) {
      setConsent(remote);
      saveToLocalStorage(remote);
    } else {
      setConsent(null);
      setBannerVisible(true);
    }
  }, []);

  const showBanner = useCallback(() => setBannerVisible(true), []);
  const openSettings = useCallback(() => setSettingsVisible(true), []);
  const closeSettings = useCallback(() => setSettingsVisible(false), []);

  const hasConsented = useCallback(
    (category: string): boolean => {
      if (!consent) return false;
      return consent.categoriesAccepted.includes(category);
    },
    [consent]
  );

  const isAnalyticsAllowed = useCallback(() => hasConsented('analytics'), [hasConsented]);

  const isMarketingAllowed = useCallback(() => hasConsented('marketing'), [hasConsented]);

  const value: CookieConsentContextValue = {
    consent,
    hasConsented,
    isAnalyticsAllowed,
    isMarketingAllowed,
    showBanner,
    acceptAll,
    rejectAll,
    savePreferences,
    updateConsent,
    bannerVisible,
    settingsVisible,
    openSettings,
    closeSettings,
  };

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export default CookieConsentProvider;
