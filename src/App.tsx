import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './services/auth';
import { wsService } from './services/websocket';
import { isNative } from './services/capacitor';
import { useDevice } from './hooks/useDevice';
import Sidebar from './components/Sidebar';
import SEOHead, { PAGE_SEO } from './components/SEOHead';
import TopBar from './components/TopBar';
import RightPanel from './components/RightPanel';
import MobileBottomNav from './components/MobileBottomNav';
import NewProjectModal from './components/NewProjectModal';
import Onboarding from './components/Onboarding';
import OnboardingWizard from './components/OnboardingWizard';
import FocusMode from './components/FocusMode';
import { useFocusMode } from './hooks/useFocusMode';
import WelcomeModal from './components/WelcomeModal';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AppAvailableBanner from './components/AppAvailableBanner';
import SupportChat from './components/SupportChat';
import CommandBar from './components/CommandBar';

// Landing legacy — respaldo en disco, NO se renderiza. No borrar.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import LandingLegacy from './pages/Landing';
import { Project } from './types';
import { api, initPushNotifications } from './services/api';

// ─── Lazy-loaded pages (code-split) ──────────────────────────────
// Módulo 02 Landing nuevo — tab-based SPA dark theme
const LandingNew = lazy(() => import('./pages/Landing/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectView = lazy(() => import('./pages/ProjectView'));
const Suggestions = lazy(() => import('./pages/Suggestions'));
const Messages = lazy(() => import('./pages/Messages'));
const Admin = lazy(() => import('./pages/Admin'));
const Friends = lazy(() => import('./pages/Friends'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Subscription = lazy(() => import('./pages/Subscription'));
const Checkout = lazy(() => import('./pages/Checkout'));

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UnderConstruction = lazy(() => import('./pages/UnderConstruction'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityView = lazy(() => import('./pages/CommunityView'));
const Jobs = React.lazy(() => import('./pages/Jobs'));
const Courses = React.lazy(() => import('./pages/Courses'));
const Events = React.lazy(() => import('./pages/Events'));
const Mentorship = React.lazy(() => import('./pages/Mentorship'));
const StudyRooms = React.lazy(() => import('./pages/StudyRooms'));
const StudyPaths = React.lazy(() => import('./pages/StudyPaths'));
const Quizzes = React.lazy(() => import('./pages/Quizzes'));
const Gamification = React.lazy(() => import('./pages/Gamification'));
const CeoDashboard = React.lazy(() => import('./pages/CeoDashboard'));
const CeoMail = React.lazy(() => import('./pages/CeoMail'));
const HRDashboard = React.lazy(() => import('./pages/HRDashboard'));
const Search = React.lazy(() => import('./pages/Search'));
const Conferences = React.lazy(() => import('./pages/Conferences'));
const TutorDirectory = React.lazy(() => import('./pages/TutorDirectory'));
const CVProfile = React.lazy(() => import('./pages/CVProfile'));
const Biblioteca = React.lazy(() => import('./pages/Biblioteca'));
const AIWorkflows = React.lazy(() => import('./pages/AIWorkflows'));
// GroupDocs (V1 collab) deprecado 2026-04-19 — reemplazado por Workspaces v2
// const GroupDocs = React.lazy(() => import('./pages/GroupDocs'));
// const GroupDocEditor = React.lazy(() => import('./pages/GroupDocEditor'));
// ─── Workspaces v2 (Bloque 2a — 2026-04-18) ─────────────────────
const WorkspacesList = React.lazy(() => import('./pages/Workspaces/WorkspacesList'));
const WorkspaceEditor = React.lazy(() => import('./pages/Workspaces/WorkspaceEditor'));
const WorkspaceSettings = React.lazy(() => import('./pages/Workspaces/WorkspaceSettings'));
const WorkspaceInvite = React.lazy(() => import('./pages/Workspaces/WorkspaceInvite'));
// ─────────────────────────────────────────────────────────────────
const NotFound = React.lazy(() => import('./pages/NotFound'));
const AdminPanelRoutes = React.lazy(() => import('./admin/AdminPanelRoutes'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const DeleteAccount = React.lazy(() => import('./pages/DeleteAccount'));
const AboutPage = React.lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.AboutPage }))
);
const EnterprisePage = React.lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.EnterprisePage }))
);
const SafetyPage = React.lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.SafetyPage }))
);
const AccessibilityPage = React.lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.AccessibilityPage }))
);
const CareersPage = React.lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.CareersPage }))
);
const AdvertisingPage = React.lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.AdvertisingPage }))
);
const MobilePage = React.lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.MobilePage }))
);
const BlogPage = React.lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.BlogPage }))
);
const CertVerify = React.lazy(() => import('./pages/CertVerify'));
const LandingProposals = React.lazy(() => import('./pages/LandingProposals'));
const MyTutorDashboard = React.lazy(() => import('./pages/MyTutorDashboard'));
const ClassRoom = React.lazy(() => import('./pages/ClassRoom'));
const PublicTutorPage = React.lazy(() => import('./pages/PublicTutorPage'));
const MiUniversidad = React.lazy(() => import('./pages/MiUniversidad'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));

// ─── Page loading spinner ────────────────────────────────────────
function PageLoader() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400 }}
      >
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        <div className="skeleton skeleton-text" style={{ width: '50%' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

/** Auto-applies SEO meta tags based on current route */
function SEORouter() {
  const location = useLocation();
  const path = location.pathname;

  const routeMap: Record<string, string> = {
    '/': 'profile',
    '/dashboard': 'dashboard',
    '/feed': 'profile',
    '/courses': 'courses',
    '/jobs': 'jobs',
    '/communities': 'communities',
    '/events': 'events',
    '/messages': 'messages',
    '/friends': 'friends',
    '/mentorship': 'mentoring',
    '/marketplace': 'marketplace',
    '/search': 'search',
    '/calendar': 'calendar',
    '/profile': 'profile',
    '/subscription': 'subscription',
    '/admin': 'admin',
    '/ceo': 'ceo',
  };

  const seoKey = routeMap[path];
  const seo = seoKey ? PAGE_SEO[seoKey] : undefined;

  return <SEOHead title={seo?.title} description={seo?.description} path={path} />;
}

export default function App() {
  const { user, isLoading, refreshUser } = useAuth();
  const device = useDevice();
  const showMobileUI = device.isMobile || isNative;
  const showTabletUI = device.isTablet;
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'forgot'>('landing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isFocusMode, exitFocus } = useFocusMode();
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (showMobileUI) setSidebarOpen(false);
  }, [location.pathname, showMobileUI]);

  // Add device class to body for CSS targeting
  useEffect(() => {
    document.body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
    document.body.classList.add(`device-${device.type}`);
    if (device.isTouchDevice) {
      document.body.classList.add('touch-device');
    } else {
      document.body.classList.remove('touch-device');
    }
  }, [device.type, device.isTouchDevice]);

  // WebSocket connection management
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('conniku_token');
      if (token) wsService.connect(token);
    } else {
      wsService.disconnect();
    }
    return () => {
      wsService.disconnect();
    };
  }, [user?.id]);

  // Load projects from backend
  useEffect(() => {
    if (user) {
      api
        .getProjects()
        .then((data) => {
          const mapped = data.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            description: (p.description as string) || '',
            color: (p.color as string) || '#4f8cff',
            icon: (p.name as string)?.charAt(0)?.toUpperCase() || 'P',
            documents: (p.documents as unknown[]) || [],
            createdAt: (p.createdAt as string) || new Date().toISOString(),
            updatedAt: (p.updatedAt as string) || new Date().toISOString(),
          }));
          setProjects(mapped);
        })
        .catch((err) => {
          console.error('Failed to load projects:', err);
        });

      // Show onboarding if not completed
      if (user.onboardingCompleted === false) {
        setShowOnboarding(true);
      }

      // Show welcome modal for new users (first 5 minutes after creation)
      const createdAt = new Date(user.createdAt).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      const welcomed = localStorage.getItem('conniku_welcomed');
      if (Date.now() - createdAt < fiveMinutes && !welcomed) {
        setShowWelcome(true);
      }
    }
  }, [user]);

  // Initialize push notifications when user is logged in
  useEffect(() => {
    if (user) {
      initPushNotifications();
    }
  }, [user]);

  // Apply theme — opciones: corporativo (claro) | conniku (oscuro)
  useEffect(() => {
    const saved = localStorage.getItem('conniku_theme');
    const allowed = ['corporativo', 'conniku'];
    // Migrar temas eliminados al tema por defecto
    const theme = allowed.includes(saved || '') ? saved! : 'conniku';
    if (!allowed.includes(saved || '')) localStorage.setItem('conniku_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#2D62C8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 40 40" width={24} height={24}>
              <circle
                cx="20"
                cy="20"
                r="12"
                fill="none"
                stroke="#fff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="56 19"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Outfit', -apple-system, sans-serif",
              fontSize: 36,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em',
            }}
          >
            conni<span style={{ color: '#2D62C8' }}>ku</span>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <div className="skeleton skeleton-text" style={{ width: '70%' }} />
          <div className="skeleton skeleton-text" style={{ width: '50%' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  if (!user) {
    // Token exists but user failed to load — backend might be waking up (Render cold start)
    const hasToken = localStorage.getItem('conniku_token');
    if (hasToken) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#2D62C8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 40 40" width={24} height={24}>
                <circle
                  cx="20"
                  cy="20"
                  r="12"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="56 19"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 20 20"
                    to="360 20 20"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Outfit', -apple-system, sans-serif",
                fontSize: 36,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.04em',
              }}
            >
              conni<span style={{ color: '#2D62C8' }}>ku</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Conectando con el servidor...
          </p>
          <button
            onClick={() => {
              refreshUser();
            }}
            style={{
              padding: '10px 28px',
              borderRadius: 10,
              border: 'none',
              background: '#2D62C8',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('conniku_token');
              localStorage.removeItem('conniku_refresh_token');
              window.location.reload();
            }}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cerrar sesion e iniciar de nuevo
          </button>
        </div>
      );
    }

    // Legal pages accessible without authentication
    if (location.pathname === '/terms') {
      return (
        <Suspense fallback={<PageLoader />}>
          <TermsOfService onNavigate={(path) => navigate(path)} />
        </Suspense>
      );
    }
    if (location.pathname === '/privacy') {
      return (
        <Suspense fallback={<PageLoader />}>
          <PrivacyPolicy onNavigate={(path) => navigate(path)} />
        </Suspense>
      );
    }
    if (location.pathname === '/delete-account') {
      return (
        <Suspense fallback={<PageLoader />}>
          <DeleteAccount onNavigate={(path) => navigate(path)} />
        </Suspense>
      );
    }
    if (location.pathname.startsWith('/cert/')) {
      const certCode = location.pathname.replace('/cert/', '');
      return (
        <Suspense fallback={<PageLoader />}>
          <CertVerify code={certCode} />
        </Suspense>
      );
    }
    if (location.pathname === '/proposals') {
      return (
        <Suspense fallback={<PageLoader />}>
          <LandingProposals />
        </Suspense>
      );
    }
    if (location.pathname.startsWith('/tutor/')) {
      const tutorUsername = location.pathname.split('/tutor/')[1];
      return (
        <Suspense fallback={<PageLoader />}>
          <PublicTutorPage username={tutorUsername} onNavigate={(path) => navigate(path)} />
        </Suspense>
      );
    }

    // ── Guest Mode: rutas accesibles sin login ──
    const guestPaths = ['/biblioteca', '/courses', '/communities', '/jobs'];
    const isGuestRoute = guestPaths.some((p) => location.pathname.startsWith(p));

    if (isGuestRoute) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
          {/* TopBar minimal para guest */}
          <div
            style={{
              height: 56,
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>conniku</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setAuthView('login')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ingresar
              </button>
              <button
                onClick={() => setAuthView('register')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Registrarse
              </button>
            </div>
          </div>
          {/* Guest content area */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/biblioteca"
                  element={<Biblioteca onNavigate={(path) => navigate(path)} />}
                />
              </Routes>
            </Suspense>
          </div>
        </div>
      );
    }

    const authSEO =
      authView === 'login'
        ? PAGE_SEO.login
        : authView === 'register'
          ? PAGE_SEO.register
          : PAGE_SEO.landing;
    return (
      <Suspense fallback={<PageLoader />}>
        <SEOHead {...authSEO} />
        {authView === 'landing' && <UnderConstruction />}
        {authView === 'forgot' && <ForgotPassword onBack={() => setAuthView('login')} />}
        {authView === 'login' && (
          <Login
            onSwitchToRegister={() => setAuthView('register')}
            onForgotPassword={() => setAuthView('forgot')}
            onBack={() => setAuthView('landing')}
          />
        )}
        {authView === 'register' && (
          <Register
            onSwitchToLogin={() => setAuthView('login')}
            onBack={() => setAuthView('landing')}
          />
        )}
      </Suspense>
    );
  }

  const activeProjectId = location.pathname.startsWith('/project/')
    ? location.pathname.split('/project/')[1]
    : null;

  const handleCreateProject = async (name: string, description: string, color: string) => {
    try {
      const newProject = await api.createProject({ name, description, color });
      const mapped: Project = {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description || '',
        color: newProject.color || '#4f8cff',
        icon: newProject.name?.charAt(0)?.toUpperCase() || 'P',
        documents: newProject.documents || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, mapped]);
      setShowNewProject(false);
      navigate(`/project/${mapped.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) navigate('/');
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Extract IDs from URL
  const convMatch = location.pathname.match(/^\/messages\/(.+)$/);
  const conversationId = convMatch ? convMatch[1] : undefined;
  const userMatch = location.pathname.match(/^\/user\/(.+)$/);
  const profileUserId = userMatch ? userMatch[1] : undefined;
  const classRoomMatch = location.pathname.match(/^\/class-room\/(.+)$/);
  const classRoomId = classRoomMatch ? classRoomMatch[1] : undefined;
  const tutorPageMatch = location.pathname.match(/^\/tutor\/(.+)$/);
  const tutorPageUsername = tutorPageMatch ? tutorPageMatch[1] : undefined;

  return (
    <div
      className={`app-layout ${showMobileUI ? 'mobile-layout' : ''} ${showTabletUI ? 'tablet-layout' : ''}`}
    >
      <CommandBar onNavigate={(path) => navigate(path)} />
      <TopBar
        onNavigate={(path) => navigate(path)}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={showMobileUI || showTabletUI}
      />
      <div className="app-body">
        {/* Sidebar overlay for mobile/tablet */}
        {(showMobileUI || showTabletUI) && sidebarOpen && (
          <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />
        )}
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          currentPath={location.pathname}
          onNavigate={(path) => navigate(path)}
          onNewProject={() => setShowNewProject(true)}
          onClose={showMobileUI || showTabletUI ? () => setSidebarOpen(false) : undefined}
          className={showMobileUI || showTabletUI ? (sidebarOpen ? 'open' : '') : ''}
        />
        <main className="main-content">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <SEORouter />
              <Routes>
                <Route path="/" element={<Navigate to="/my-profile" replace />} />
                <Route path="/feed" element={<Navigate to="/my-profile" replace />} />
                <Route
                  path="/my-profile"
                  element={
                    user ? (
                      <UserProfile userId={user.id} onNavigate={(path) => navigate(path)} />
                    ) : null
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <Dashboard
                      projects={projects}
                      onNavigate={(path) => navigate(path)}
                      onNewProject={() => setShowNewProject(true)}
                    />
                  }
                />
                <Route
                  path="/project/:id"
                  element={
                    <ProjectView
                      projects={projects}
                      onUpdate={handleUpdateProject}
                      onDelete={handleDeleteProject}
                    />
                  }
                />
                <Route path="/profile" element={<Navigate to="/my-profile" replace />} />
                <Route
                  path="/mi-universidad"
                  element={<MiUniversidad onNavigate={(path) => navigate(path)} />}
                />
                <Route path="/suggestions" element={<Suggestions />} />
                <Route
                  path="/messages"
                  element={<Messages onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/messages/:convId"
                  element={
                    <Messages
                      conversationId={conversationId}
                      onNavigate={(path) => navigate(path)}
                    />
                  }
                />
                <Route
                  path="/friends"
                  element={<Friends onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/calendar"
                  element={<Calendar projects={projects} onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/marketplace"
                  element={<Marketplace onNavigate={(path) => navigate(path)} />}
                />
                <Route path="/jobs" element={<Jobs onNavigate={(path) => navigate(path)} />} />
                <Route
                  path="/courses"
                  element={<Courses onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/user/:userId"
                  element={
                    profileUserId ? (
                      <UserProfile userId={profileUserId} onNavigate={(path) => navigate(path)} />
                    ) : null
                  }
                />
                <Route path="/events" element={<Events onNavigate={(path) => navigate(path)} />} />
                <Route
                  path="/mentorship"
                  element={<Mentorship onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/study-rooms"
                  element={<StudyRooms onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/study-paths"
                  element={<StudyPaths projects={projects} onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/quizzes"
                  element={<Quizzes projects={projects} onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/gamification"
                  element={<Gamification onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/communities"
                  element={<Communities onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/communities/:id"
                  element={<CommunityView onNavigate={(path) => navigate(path)} />}
                />
                <Route path="/search" element={<Search onNavigate={(path) => navigate(path)} />} />
                <Route
                  path="/conferences"
                  element={<Conferences onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/tutores"
                  element={<TutorDirectory onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/my-tutor"
                  element={<MyTutorDashboard onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/my-tutor/materias"
                  element={
                    <MyTutorDashboard onNavigate={(path) => navigate(path)} subPath="materias" />
                  }
                />
                <Route
                  path="/my-tutor/clases"
                  element={
                    <MyTutorDashboard onNavigate={(path) => navigate(path)} subPath="clases" />
                  }
                />
                <Route
                  path="/my-tutor/pagos"
                  element={
                    <MyTutorDashboard onNavigate={(path) => navigate(path)} subPath="pagos" />
                  }
                />
                <Route
                  path="/class-room/:classId"
                  element={
                    classRoomId ? (
                      <ClassRoom classId={classRoomId} onNavigate={(path) => navigate(path)} />
                    ) : null
                  }
                />
                <Route
                  path="/biblioteca"
                  element={<Biblioteca onNavigate={(path) => navigate(path)} />}
                />
                {/* GroupDocs V1 deprecado 2026-04-19 — reemplazado por Workspaces v2 */}
                {/* ── Workspaces v2 (Bloque 2a — 2026-04-18) ── */}
                <Route
                  path="/workspaces"
                  element={<WorkspacesList onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/workspaces/invite/:token"
                  element={<WorkspaceInvite onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/workspaces/:id/settings"
                  element={<WorkspaceSettings onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/workspaces/:id"
                  element={<WorkspaceEditor onNavigate={(path) => navigate(path)} />}
                />
                {/* ─────────────────────────────────────────── */}
                <Route path="/ceo" element={<Navigate to="/admin-panel" replace />} />
                <Route
                  path="/ceo/mail"
                  element={<CeoMail onNavigate={(path) => navigate(path)} />}
                />
                <Route path="/hr" element={<Navigate to="/admin-panel" replace />} />
                <Route
                  path="/ai-workflows"
                  element={<Navigate to="/admin-panel/tools/ai-workflows" replace />}
                />
                <Route
                  path="/admin-panel/*"
                  element={<AdminPanelRoutes onNavigate={(path) => navigate(path)} />}
                />
                <Route path="/cv" element={<CVProfile onNavigate={(path) => navigate(path)} />} />
                <Route
                  path="/cv/:username"
                  element={<CVProfile onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/tutor/:username"
                  element={
                    tutorPageUsername ? (
                      <PublicTutorPage
                        username={tutorPageUsername}
                        onNavigate={(path) => navigate(path)}
                      />
                    ) : null
                  }
                />
                <Route
                  path="/terms"
                  element={<TermsOfService onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/privacy"
                  element={<PrivacyPolicy onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/delete-account"
                  element={<DeleteAccount onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/about"
                  element={<AboutPage onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/enterprise"
                  element={<EnterprisePage onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/safety"
                  element={<SafetyPage onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/accessibility"
                  element={<AccessibilityPage onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/careers"
                  element={<CareersPage onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/advertising"
                  element={<AdvertisingPage onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/mobile"
                  element={<MobilePage onNavigate={(path) => navigate(path)} />}
                />
                <Route path="/blog" element={<BlogPage onNavigate={(path) => navigate(path)} />} />
                <Route path="/cert/:code" element={<CertVerify />} />
                <Route path="/admin" element={<Admin />} />
                <Route
                  path="/subscription"
                  element={<Subscription onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/checkout"
                  element={<Checkout onNavigate={(path) => navigate(path)} />}
                />
                <Route
                  path="/soporte"
                  element={<SupportPage onNavigate={(path) => navigate(path)} />}
                />
                <Route path="*" element={<NotFound onNavigate={(path) => navigate(path)} />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        {!showMobileUI && !showTabletUI && (
          <RightPanel currentPath={location.pathname} onNavigate={(path) => navigate(path)} />
        )}
      </div>

      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={handleCreateProject} />
      )}

      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            setShowOnboarding(false);
            api.completeOnboarding().catch(() => {});
          }}
          onSkip={() => {
            setShowOnboarding(false);
            api.completeOnboarding().catch(() => {});
          }}
        />
      )}

      {isFocusMode && <FocusMode onExit={exitFocus} />}

      {showMobileUI && (
        <MobileBottomNav currentPath={location.pathname} onNavigate={(path) => navigate(path)} />
      )}

      {showWelcome && (
        <WelcomeModal
          onAccept={() => {
            setShowWelcome(false);
            localStorage.setItem('conniku_welcomed', 'true');
          }}
        />
      )}

      <PWAInstallPrompt />
      <AppAvailableBanner />
      <SupportChat />
    </div>
  );
}
