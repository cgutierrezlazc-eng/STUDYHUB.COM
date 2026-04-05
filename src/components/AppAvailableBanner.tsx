import React, { useState, useEffect } from 'react'
import { Download, X, Monitor, Smartphone, Tablet } from './Icons'

/**
 * Banner for existing users: lets them know Conniku is available
 * as a desktop app and mobile PWA. Shows once per user, with a
 * warm humanized message. Appears after 2s on first post-update session.
 */
export default function AppAvailableBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Only show once — key tracks the version so we can re-show on major updates
    const key = 'conniku_apps_banner_v2'
    const seen = localStorage.getItem(key)
    if (seen) return

    // Don't show inside Electron or standalone PWA
    if ((window as any).electronAPI) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const timer = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem('conniku_apps_banner_v2', String(Date.now()))
  }

  if (!visible) return null

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  const isMobile = isIOS || isAndroid

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? 68 : 20,
      right: isMobile ? 8 : 20,
      left: isMobile ? 8 : 'auto',
      width: isMobile ? 'auto' : 380,
      zIndex: 9998,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      padding: '18px 20px',
      animation: 'slideUp 0.4s ease',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Close button */}
      <button
        onClick={dismiss}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4,
        }}
        aria-label="Cerrar"
      >
        {X({ size: 16 })}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #2D62C8, #5B8DEF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {Download({ size: 20, color: '#fff' })}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            Conniku ahora en todos tus dispositivos
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            Lleva tu estudio a donde vayas
          </div>
        </div>
      </div>

      {/* Friendly message */}
      <p style={{
        fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)',
        margin: '0 0 14px 0',
      }}>
        {isMobile
          ? 'Puedes instalar Conniku directamente en tu telefono para acceder mas rapido, recibir notificaciones y estudiar sin abrir el navegador. Es gratis y ocupa muy poco espacio.'
          : 'Ahora puedes descargar Conniku como app de escritorio para Windows y Mac. Recibe notificaciones de mensajes, accede con un clic desde tu barra de tareas y estudia sin distracciones del navegador.'
        }
      </p>

      {/* Device options */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{
            width: '100%', padding: '10px 16px',
            background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {Download({ size: 16, color: '#fff' })} Ver opciones de descarga
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Desktop */}
          {!isMobile && (
            <>
              <a
                href="https://github.com/conniku/desktop/releases/latest/download/Conniku-Setup.exe"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  textDecoration: 'none', color: 'var(--text-primary)',
                  fontSize: 13, fontWeight: 500,
                }}
              >
                {Monitor({ size: 18 })}
                <div>
                  <div style={{ fontWeight: 600 }}>Windows</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Descarga el instalador .exe</div>
                </div>
              </a>
              <a
                href="https://github.com/conniku/desktop/releases/latest/download/Conniku.dmg"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  textDecoration: 'none', color: 'var(--text-primary)',
                  fontSize: 13, fontWeight: 500,
                }}
              >
                {Monitor({ size: 18 })}
                <div>
                  <div style={{ fontWeight: 600 }}>macOS</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Descarga el archivo .dmg</div>
                </div>
              </a>
            </>
          )}

          {/* Mobile */}
          {isAndroid && (
            <button
              onClick={() => {
                // Trigger PWA install if available
                const evt = new Event('conniku-trigger-pwa-install')
                window.dispatchEvent(evt)
                dismiss()
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                cursor: 'pointer', color: 'var(--text-primary)',
                fontSize: 13, fontWeight: 500, textAlign: 'left',
              }}
            >
              {Smartphone({ size: 18 })}
              <div>
                <div style={{ fontWeight: 600 }}>Instalar en Android</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Se agrega a tu pantalla de inicio</div>
              </div>
            </button>
          )}

          {isIOS && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              fontSize: 13,
            }}>
              {Smartphone({ size: 18 })}
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Instalar en iPhone/iPad</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Toca el boton de compartir <span style={{ fontSize: 15 }}>&#x2191;</span> en Safari y selecciona "Agregar a pantalla de inicio"
                </div>
              </div>
            </div>
          )}

          {/* Tablet hint */}
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 8,
              fontSize: 12, color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
            }}>
              {Tablet({ size: 14 })}
              Tambien disponible en tablets — abre conniku.com desde tu tablet y te guiaremos
            </div>
          )}

          <button
            onClick={dismiss}
            style={{
              marginTop: 4, padding: '8px',
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: 12, textAlign: 'center',
            }}
          >
            Ahora no, quizas despues
          </button>
        </div>
      )}
    </div>
  )
}
