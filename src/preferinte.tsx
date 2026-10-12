// Limba si tema: din URL (?limba=en&tema=dark), apoi din localStorage, apoi din sistem.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { text, type CheieText } from './i18n'
import { setLimba as setLimbaMotor, type Limba } from './motor/mesaje'

export type Tema = 'luminos' | 'intunecat'

interface Preferinte {
  limba: Limba
  tema: Tema
  setLimba: (l: Limba) => void
  setTema: (t: Tema) => void
  t: (cheie: CheieText, ...args: (string | number)[]) => string
}

const Context = createContext<Preferinte | null>(null)

function limbaDin(s: string | null): Limba | null {
  return s === 'ro' || s === 'en' ? s : null
}

function temaDin(s: string | null): Tema | null {
  if (s === 'dark' || s === 'intunecat') return 'intunecat'
  if (s === 'light' || s === 'luminos') return 'luminos'
  return null
}

function initial(): { limba: Limba; tema: Tema } {
  const url = new URLSearchParams(window.location.search)
  const limba = limbaDin(url.get('limba') ?? url.get('lang')) ?? limbaDin(localStorage.getItem('mn.limba')) ?? 'ro'
  const sistem: Tema = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'intunecat' : 'luminos'
  const tema = temaDin(url.get('tema') ?? url.get('theme')) ?? temaDin(localStorage.getItem('mn.tema')) ?? sistem
  return { limba, tema }
}

export function Preferinte({ children }: { children: ReactNode }) {
  const [stare, setStare] = useState(initial)
  setLimbaMotor(stare.limba)

  useEffect(() => {
    document.documentElement.dataset.tema = stare.tema
    localStorage.setItem('mn.tema', stare.tema)
  }, [stare.tema])

  useEffect(() => {
    document.documentElement.lang = stare.limba
    localStorage.setItem('mn.limba', stare.limba)
  }, [stare.limba])

  const setLimba = useCallback((limba: Limba) => setStare((s) => ({ ...s, limba })), [])
  const setTema = useCallback((tema: Tema) => setStare((s) => ({ ...s, tema })), [])
  const t = useCallback((cheie: CheieText, ...args: (string | number)[]) => text(stare.limba, cheie, ...args), [stare.limba])
  const valoare = useMemo(() => ({ limba: stare.limba, tema: stare.tema, setLimba, setTema, t }), [stare, setLimba, setTema, t])

  return <Context.Provider value={valoare}>{children}</Context.Provider>
}

export function usePreferinte(): Preferinte {
  const p = useContext(Context)
  if (!p) throw new Error('usePreferinte se foloseste sub <Preferinte>')
  return p
}
