'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

type ScrollButtonsProps = {
  /** Évite le chevauchement avec la nav mobile, la barre de stats et les FAB à droite. */
  variant?: 'default' | 'dashboard'
}

export function ScrollButtons({ variant = 'default' }: ScrollButtonsProps) {
  const [showTop, setShowTop] = useState(false)
  const [showBottom, setShowBottom] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      setShowTop(scrollY > 300)
      setShowBottom(scrollY < maxScroll - 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!showTop && !showBottom) return null

  const positionClass =
    variant === 'dashboard'
      ? /* À droite, au-dessus des FAB (assistant + feedback) et de la nav mobile */
        'right-6 bottom-[5.75rem] md:bottom-28 max-md:pb-[env(safe-area-inset-bottom)]'
      : 'right-6 bottom-6'

  return (
    <div
      className={`fixed flex flex-col gap-2 z-40 pointer-events-none ${positionClass}`}
    >
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="pointer-events-auto w-10 h-10 rounded-full bg-[#030A8C] text-white flex items-center justify-center shadow-lg hover:bg-[#030A8C]/90 transition-all hover:scale-110"
          title="Retour en haut"
          aria-label="Retour en haut"
        >
          <ChevronUp size={18} aria-hidden />
        </button>
      )}
      {showBottom && (
        <button
          type="button"
          onClick={() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: 'smooth',
            })
          }
          className="pointer-events-auto w-10 h-10 rounded-full bg-[#030A8C]/20 text-[#030A8C] flex items-center justify-center shadow hover:bg-[#030A8C]/30 transition-all hover:scale-110"
          title="Aller en bas"
          aria-label="Aller en bas"
        >
          <ChevronDown size={18} aria-hidden />
        </button>
      )}
    </div>
  )
}
