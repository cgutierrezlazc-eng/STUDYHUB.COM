import React from 'react'

// ══════════════════════════════════════════════════════════════
//  CONNIKU ADS INFRASTRUCTURE
//  Estado: DESACTIVADO por defecto
//  Para activar: cambiar ADS_ENABLED = true
//  Solo bajo instrucción de Cristian (CEO)
// ══════════════════════════════════════════════════════════════

export const ADS_ENABLED = false   // ← INTERRUPTOR MAESTRO

// Tipos de slots disponibles
export type AdPlacement = 'feed-inline' | 'sidebar-top' | 'sidebar-mid' | 'sidebar-bottom'

export interface Ad {
  id: string
  placement: AdPlacement
  imageUrl?: string
  title: string
  description?: string
  ctaLabel?: string
  ctaUrl: string
  sponsorName: string
  sponsorLogoUrl?: string
  backgroundColor?: string
  textColor?: string
  isPriority?: boolean
}

// Ads de ejemplo/placeholder (se reemplazarán con datos reales del backend)
const PLACEHOLDER_ADS: Record<AdPlacement, Ad[]> = {
  'feed-inline': [
    {
      id: 'ad-feed-1',
      placement: 'feed-inline',
      title: 'Espacio publicitario disponible',
      description: 'Llega a miles de estudiantes universitarios',
      ctaLabel: 'Anunciar aquí',
      ctaUrl: 'mailto:contacto@conniku.com',
      sponsorName: 'Conniku Ads',
      backgroundColor: 'rgba(45,98,200,0.06)',
    },
  ],
  'sidebar-top': [
    {
      id: 'ad-sidebar-1',
      placement: 'sidebar-top',
      title: 'Tu marca aquí',
      description: 'Publicidad segmentada para universitarios',
      ctaLabel: 'Contactar',
      ctaUrl: 'mailto:contacto@conniku.com',
      sponsorName: 'Conniku Ads',
    },
  ],
  'sidebar-mid': [
    {
      id: 'ad-sidebar-2',
      placement: 'sidebar-mid',
      title: 'Patrocina Conniku',
      description: 'Visibilidad premium en la red universitaria',
      ctaLabel: 'Saber más',
      ctaUrl: 'mailto:contacto@conniku.com',
      sponsorName: 'Conniku Ads',
    },
  ],
  'sidebar-bottom': [],
}

// ── Componente de ad individual ──────────────────────────────
interface AdSlotProps {
  placement: AdPlacement
  className?: string
  style?: React.CSSProperties
}

export default function AdSlot({ placement, className, style }: AdSlotProps) {
  // Si los ads están desactivados → no renderizar nada
  if (!ADS_ENABLED) return null

  const ads = PLACEHOLDER_ADS[placement] || []
  if (ads.length === 0) return null

  // Por ahora muestra el primero; en el futuro se puede rotar o cargar del backend
  const ad = ads[0]

  return (
    <div
      className={`ad-slot ad-slot--${placement}${className ? ` ${className}` : ''}`}
      style={style}
      role="complementary"
      aria-label={`Publicidad: ${ad.sponsorName}`}
    >
      {/* Etiqueta "Publicidad" obligatoria */}
      <div className="ad-slot__label">Publicidad</div>

      <a
        href={ad.ctaUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="ad-slot__inner"
        style={{ background: ad.backgroundColor }}
        onClick={() => {
          // Aquí se puede agregar tracking cuando esté listo
          // analytics.track('ad_click', { adId: ad.id, placement })
        }}
      >
        {ad.imageUrl && (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="ad-slot__image"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        )}
        <div className="ad-slot__content">
          {ad.sponsorLogoUrl && (
            <img src={ad.sponsorLogoUrl} alt={ad.sponsorName} className="ad-slot__sponsor-logo" />
          )}
          <div className="ad-slot__title" style={ad.textColor ? { color: ad.textColor } : {}}>
            {ad.title}
          </div>
          {ad.description && (
            <div className="ad-slot__desc">{ad.description}</div>
          )}
          <div className="ad-slot__footer">
            <span className="ad-slot__sponsor">{ad.sponsorName}</span>
            {ad.ctaLabel && (
              <span className="ad-slot__cta">{ad.ctaLabel} →</span>
            )}
          </div>
        </div>
      </a>
    </div>
  )
}
