import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './services/auth'
import { isNative } from './services/capacitor'
import Sidebar from './components/Sidebar'
import MobileBottomNav from './components/MobileBottomNav'
import Dashboard from './pages/Dashboard'
import ProjectView from './pages/ProjectView'
import Profile from './pages/Profile'
import Suggestions from './pages/Suggestions'
import Messages from './pages/Messages'
import Admin from './pages/Admin'
import Friends from './pages/Friends'
import UserProfile from './pages/UserProfile'
import Subscription from './pages/Subscription'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './components/ForgotPassword'
import NewProjectModal from './components/NewProjectModal'
import Onboarding from './components/Onboarding'
import { Project } from './types'
import { api } from './services/api'

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
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          color: p.color || '#4f8cff',
          icon: p.name?.charAt(0)?.toUpperCase() || 'P',
          documents: p.documents || [],
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        }))
        setProjects(mapped)
      }).catch(() => {})

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
        <h1 className="sidebar-brand" style={{ fontSize: 32 }}>StudyHub</h1>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    )
  }

  if (!user) {
    if (authView === 'forgot') return <ForgotPassword onBack={() => setAuthView('login')} />
    if (authView === 'login') return <Login onSwitchToRegister={() => setAuthView('register')} onForgotPassword={() => setAuthView('forgot')} />
    return <Register onSwitchToLogin={() => setAuthView('login')} />
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
    } catch {}
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      if (activeProjectId === id) navigate('/')
    } catch {}
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
