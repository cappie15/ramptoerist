import { useState, useEffect } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

function classify(w: number): Breakpoint {
  if (w < 768) return 'mobile'
  if (w < 1200) return 'tablet'
  return 'desktop'
}

export function useBreakpoint() {
  const [bp, setBp] = useState<Breakpoint>(() => classify(window.innerWidth))

  useEffect(() => {
    const handler = () => setBp(classify(window.innerWidth))
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return {
    breakpoint: bp,
    isMobile: bp === 'mobile',
    isTablet: bp === 'tablet',
    isDesktop: bp === 'desktop',
    isSplit: bp !== 'mobile',
  }
}
