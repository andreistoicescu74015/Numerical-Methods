import { useEffect } from 'react'
import { GRUPURI, NOTIUNI } from '../notiuni'
import { usePreferinte } from '../preferinte'
import { Formula } from './Formula'

interface Props {
  // notiunea ceruta din etichetele algoritmului: panoul e deja deschis, aici se deruleaza la ea
  tinta: string | null
  cerere: number
}

export function Notiuni({ tinta, cerere }: Props) {
  const { t, limba } = usePreferinte()

  useEffect(() => {
    if (!tinta) return
    // fara derulare animata cand sistemul cere miscare redusa
    const lin = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    const timer = setTimeout(() => document.getElementById(`notiune-${tinta}`)?.scrollIntoView?.({ block: 'start', behavior: lin }), 50)
    return () => clearTimeout(timer)
  }, [tinta, cerere])

  return (
    <>
      <p className="ajutor">{t('notiuniAjutor')}</p>
      {GRUPURI.map((g) => (
        <section key={g.id}>
          <h3>{g.titlu[limba]}</h3>
          {NOTIUNI.filter((n) => n.grup === g.id).map((n) => (
            <article key={n.id} id={`notiune-${n.id}`} className={n.id === tinta ? 'aleasa' : ''}>
              <h4>{n.titlu[limba]}</h4>
              <p>{n.text[limba]}</p>
              {n.formula && <Formula tex={n.formula} />}
              {n.exemplu && <p className="exemplu">{n.exemplu[limba]}</p>}
            </article>
          ))}
        </section>
      ))}
    </>
  )
}
