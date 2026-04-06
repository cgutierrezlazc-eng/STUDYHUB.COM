import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './services/auth'
import { I18nProvider } from './services/i18n'
import { isNative, initNative } from './services/capacitor'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './styles/global.css'
import './styles/auth.css'
import './styles/mobile-native.css'

// Add native platform class for CSS targeting
if (isNative) {
  document.body.classList.add('native-platform')
}

// Initialize native features (status bar, keyboard, back button)
initNative()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

// ─── Service Worker Registration ────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister old push-only SW if it exists
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        if (reg.active?.scriptURL?.includes('sw-push.js')) {
          await reg.unregister()
          console.log('[SW] Unregistered old sw-push.js')
        }
      }

      // Register new full SW
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('[SW] Registered with scope:', registration.scope)

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW waiting - auto-activate for seamless updates
            newWorker.postMessage('skipWaiting')
          }
        })
      })

      // Periodic cache cleanup (every 24h)
      setInterval(() => {
        registration.active?.postMessage('cleanCaches')
      }, 24 * 60 * 60 * 1000)
    } catch (err) {
      console.error('[SW] Registration failed:', err)
    }
  })
}
