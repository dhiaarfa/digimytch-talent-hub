'use client'

import { useSyncExternalStore } from 'react'

export type DigiLang = 'fr' | 'en'

const LANG_STORAGE_KEY = 'digi-lang'
const listeners = new Set<() => void>()

function emitLangChange() {
  listeners.forEach((l) => l())
}

function subscribeLang(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readLang(): DigiLang {
  if (typeof window === 'undefined') return 'fr'
  const stored = localStorage.getItem(LANG_STORAGE_KEY)
  return stored === 'en' ? 'en' : 'fr'
}

export function setDigiLang(lang: DigiLang) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANG_STORAGE_KEY, lang)
  emitLangChange()
}

export function useLanguage() {
  const lang = useSyncExternalStore(subscribeLang, readLang, () => 'fr' as DigiLang)
  return { lang, isFr: lang === 'fr', isEn: lang === 'en' }
}
