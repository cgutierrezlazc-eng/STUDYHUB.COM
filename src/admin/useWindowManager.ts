import { useCallback, useRef } from 'react'
import { ADMIN_MODULES } from './adminModules'

const windowRefs = new Map<string, Window>()
let cascadeOffset = 0

export function useWindowManager() {
  const offsetRef = useRef(cascadeOffset)

  const openModule = useCallback((moduleId: string) => {
    const mod = ADMIN_MODULES.find(m => m.id === moduleId)
    if (!mod) return

    // Check if window already open
    const existing = windowRefs.get(moduleId)
    if (existing && !existing.closed) {
      existing.focus()
      return
    }

    const width = mod.windowSize?.width || 1200
    const height = mod.windowSize?.height || 800
    const left = 100 + offsetRef.current * 30
    const top = 80 + offsetRef.current * 30
    offsetRef.current = (offsetRef.current + 1) % 10

    const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`

    const win = window.open(mod.route, `admin-${moduleId}`, features)
    if (win) {
      windowRefs.set(moduleId, win)
      win.addEventListener('beforeunload', () => {
        windowRefs.delete(moduleId)
      })
    }
  }, [])

  const isOpen = useCallback((moduleId: string) => {
    const win = windowRefs.get(moduleId)
    return win ? !win.closed : false
  }, [])

  const closeAll = useCallback(() => {
    windowRefs.forEach((win) => {
      if (!win.closed) win.close()
    })
    windowRefs.clear()
  }, [])

  return { openModule, isOpen, closeAll }
}
