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
import { Routes, Route, useNavigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

const UnderConstruction = lazy(() => import('./pages/UnderConstruction'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Start = lazy(() => import('./pages/Start'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));

function NotFoundWithNav() {
  const navigate = useNavigate();
  return <NotFound onNavigate={(path: string) => navigate(path)} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<UnderConstruction />} />
          <Route path="/start" element={<Start />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFoundWithNav />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
