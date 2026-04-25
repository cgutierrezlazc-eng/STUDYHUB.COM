/**
 * App.tsx — versión mínima durante bloque-reset-frontend-from-orbit-v1.
 *
 * Solo expone:
 *   - `/`              · UnderConstruction (página pública)
 *   - `/legal/*`       · documentos legales (terms, privacy, cookies, age-declaration)
 *   - `/terms`         · alias legacy
 *   - `/privacy`       · alias legacy
 *   - `/cookies`       · alias legacy
 *   - `/delete-account`
 *   - `*`              · NotFound
 *
 * Todo el resto del frontend (módulos, dashboard, auth UI, mensajería, etc.)
 * será reconstruido módulo a módulo desde ORBIT-U en commits posteriores.
 */
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CookieConsentProvider } from './components/CookieConsent/CookieConsentProvider';
import ErrorBoundary from './components/ErrorBoundary';

const UnderConstruction = lazy(() => import('./pages/UnderConstruction'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CookiesPolicy = lazy(() => import('./pages/CookiesPolicy'));
const LegalLayout = lazy(() => import('./pages/Legal/LegalLayout'));
const LegalDocumentPage = lazy(() => import('./pages/Legal/LegalDocumentPage'));

/** Wrapper que inyecta `onNavigate` usando react-router para páginas legacy. */
function withNavigate<P extends { onNavigate: (path: string) => void }>(
  Comp: React.ComponentType<P>
): React.FC<Omit<P, 'onNavigate'>> {
  return function Wrapped(props) {
    const navigate = useNavigate();
    return <Comp {...(props as P)} onNavigate={(path: string) => navigate(path)} />;
  };
}

const TermsOfServicePage = withNavigate(
  TermsOfService as React.ComponentType<{ onNavigate: (p: string) => void }>
);
const PrivacyPolicyPage = withNavigate(
  PrivacyPolicy as React.ComponentType<{ onNavigate: (p: string) => void }>
);
const CookiesPolicyPage = withNavigate(
  CookiesPolicy as React.ComponentType<{ onNavigate: (p: string) => void }>
);
const DeleteAccountPage = withNavigate(
  DeleteAccount as React.ComponentType<{ onNavigate: (p: string) => void }>
);
const NotFoundPage = withNavigate(
  NotFound as React.ComponentType<{ onNavigate: (p: string) => void }>
);

export default function App() {
  return (
    <ErrorBoundary>
      <CookieConsentProvider>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<UnderConstruction />} />

            <Route path="/legal" element={<LegalLayout />}>
              <Route index element={<Navigate to="/legal/terms" replace />} />
              <Route path="terms" element={<LegalDocumentPage docKey="terms" />} />
              <Route path="privacy" element={<LegalDocumentPage docKey="privacy" />} />
              <Route path="cookies" element={<LegalDocumentPage docKey="cookies" />} />
              <Route
                path="age-declaration"
                element={<LegalDocumentPage docKey="age-declaration" />}
              />
            </Route>

            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/cookies" element={<CookiesPolicyPage />} />
            <Route path="/delete-account" element={<DeleteAccountPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </CookieConsentProvider>
    </ErrorBoundary>
  );
}
