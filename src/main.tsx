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
