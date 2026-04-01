import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './services/auth'
import { isNative } from './services/capacitor'
import Sidebar from './components/Sidebar'
import MobileBottomNav from './components/MobileBottomNav'
import NewProjectModal from './components/NewProjectModal'
import Onboarding from './components/Onboarding'
import { Project } from './types'
import { api } from './services/api'

// ─── Lazy-loaded pages (code-split) ──────────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ProjectView = lazy(() => import('./pages/ProjectView'))
const Profile = lazy(() => import('./pages/Profile'))
const Suggestions = lazy(() => import('./pages/Suggestions'))
const Messages = lazy(() => import('./pages/Messages'))
const Admin = lazy(() => import('./pages/Admin'))
const Friends = lazy(() => import('./pages/Friends'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Subscription = lazy(() => import('./pages/Subscription'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./components/ForgotPassword'))

// ─── Page loading spinner ────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div className="loading-dots"><span /><span /><span /></div>
    </div>
  )
}

export default function App() {
  const { user, isLoading, refreshUser } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login')
  const [projects, setProjects] = useState<Project[]>([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Load projects from backend
  useEffect(() => {
    if (user) {
      api.getProjects().then(data => {
        const mapped = data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          description: (p.description as string) || '',
          color: (p.color as string) || '#4f8cff',
          icon: ((p.name as string)?.charAt(0)?.toUpperCase()) || 'P',
          documents: (p.documents as unknown[]) || [],
          createdAt: (p.createdAt as string) || new Date().toISOString(),
          updatedAt: (p.updatedAt as string) || new Date().toISOString(),
        }))
        setProjects(mapped)
      }).catch((err) => {
        console.error('Failed to load projects:', err)
      })

      // Show onboarding if not completed
      if (user.onboardingCompleted === false) {
        setShowOnboarding(true)
      }
    }
  }, [user])

  // Apply theme
  useEffect(() => {
    if (user?.theme) {
      document.documentElement.setAttribute('data-theme', user.theme)
    }
  }, [user?.theme])

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: 16 }}>
        <h1 className="sidebar-brand" style={{ fontSize: 32 }}>Conniku</h1>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        {authView === 'forgot' && <ForgotPassword onBack={() => setAuthView('login')} />}
        {authView === 'login' && <Login onSwitchToRegister={() => setAuthView('register')} onForgotPassword={() => setAuthView('forgot')} />}
        {authView === 'register' && <Register onSwitchToLogin={() => setAuthView('login')} />}
      </Suspense>
    )
  }

  const activeProjectId = location.pathname.startsWith('/project/')
    ? location.pathname.split('/project/')[1]
    : null

  const handleCreateProject = async (name: string, description: string, color: string) => {
    try {
      const newProject = await api.createProject({ name, description, color })
      const mapped: Project = {
        id: newProject.id,
        name: newProject.name,
        description: newProject.description || '',
        color: newProject.color || '#4f8cff',
        icon: newProject.name?.charAt(0)?.toUpperCase() || 'P',
        documents: newProject.documents || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setProjects(prev => [...prev, mapped])
      setShowNewProject(false)
      navigate(`/project/${mapped.id}`)
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      if (activeProjectId === id) navigate('/')
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const handleUpdateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  // Extract IDs from URL
  const convMatch = location.pathname.match(/^\/messages\/(.+)$/)
  const conversationId = convMatch ? convMatch[1] : undefined
  const userMatch = location.pathname.match(/^\/user\/(.+)$/)
  const profileUserId = userMatch ? userMatch[1] : undefined

  return (
    <div className="app-layout">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
        onNewProject={() => setShowNewProject(true)}
      />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={user ? <UserProfile userId={user.id} onNavigate={(path) => navigate(path)} /> : <Dashboard projects={projects} onNavigate={(path) => navigate(path)} />} />
            <Route path="/dashboard" element={<Dashboard projects={projects} onNavigate={(path) => navigate(path)} />} />
            <Route path="/project/:id" element={<ProjectView projects={projects} onUpdate={handleUpdateProject} onDelete={handleDeleteProject} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/messages" element={<Messages onNavigate={(path) => navigate(path)} />} />
            <Route path="/messages/:convId" element={<Messages conversationId={conversationId} onNavigate={(path) => navigate(path)} />} />
            <Route path="/friends" element={<Friends onNavigate={(path) => navigate(path)} />} />
            <Route path="/user/:userId" element={profileUserId ? <UserProfile userId={profileUserId} onNavigate={(path) => navigate(path)} /> : null} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/subscription" element={<Subscription onNavigate={(path) => navigate(path)} />} />
            <Route path="/checkout" element={<Checkout onNavigate={(path) => navigate(path)} />} />
          </Routes>
        </Suspense>
      </main>

      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={handleCreateProject} />
      )}

      {showOnboarding && (
        <Onboarding onComplete={() => { setShowOnboarding(false); refreshUser() }} />
      )}

      {isNative && (
        <MobileBottomNav
          currentPath={location.pathname}
          onNavigate={(path) => navigate(path)}
        />
      )}
    </div>
  )
}
