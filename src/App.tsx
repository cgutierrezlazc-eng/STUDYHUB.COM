/**
 * App.tsx — versión mínima durante bloque-reset-frontend-from-orbit-v1.
 *
 * Sistema legal completo eliminado · será reconstruido módulo a módulo
 * desde ORBIT-U con los respaldos del abogado.
 *
 * Solo expone:
 *   - `/`              · UnderConstruction
 *   - `*`              · NotFound
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

const UnderConstruction = lazy(() => import('./pages/UnderConstruction'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Start = lazy(() => import('./pages/Start'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Support = lazy(() => import('./pages/Support'));
const Contact = lazy(() => import('./pages/Contact'));
const Careers = lazy(() => import('./pages/Careers'));
const Cookies = lazy(() => import('./pages/Cookies'));

function NotFoundWithNav() {
  const navigate = useNavigate();
  return <NotFound onNavigate={(path: string) => navigate(path)} />;
}

function UnderConstructionWithNav() {
  const navigate = useNavigate();
  return <UnderConstruction onStaffLogin={() => navigate('/start')} />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="route-transition">
      <Routes location={location}>
        <Route path="/" element={<UnderConstructionWithNav />} />
        <Route path="/start" element={<Start />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="*" element={<NotFoundWithNav />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <AnimatedRoutes />
      </Suspense>
    </ErrorBoundary>
  );
}
