'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { setDigiLang, useLanguage, type DigiLang } from '@/lib/use-language'
import { cn } from '@/lib/utils'

export function LanguageToggle({
  variant = 'default',
}: {
  variant?: 'default' | 'on-dark'
}) {
  const router = useRouter()
  const { lang: storeLang } = useLanguage()
  const [lang, setLang] = useState<DigiLang>('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLang(storeLang)
    setMounted(true)
  }, [storeLang])

  const toggle = () => {
    const next: DigiLang = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    setDigiLang(next)
    document.documentElement.lang = next === 'en' ? 'en' : 'fr'
    router.refresh()
  }

  if (!mounted) {
    return (
      <span
        className="inline-flex h-7 w-12 items-center justify-center rounded-full border border-transparent text-xs opacity-0"
        aria-hidden
      />
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 transition-colors font-medium',
        variant === 'on-dark'
          ? 'border border-white/35 bg-white/15 text-white hover:bg-white/25'
          : 'border border-[var(--digi-border)] text-[var(--digi-navy)] hover:bg-white/80 dark:text-[var(--digi-dark-fg)] dark:border-[var(--digi-border)] dark:hover:bg-white/10'
      )}
      title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Globe size={12} aria-hidden />
      <span>{lang === 'fr' ? 'FR' : 'EN'}</span>
    </button>
  )
}
