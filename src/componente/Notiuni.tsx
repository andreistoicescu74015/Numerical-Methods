import { useEffect, useState } from 'react'
import { GRUPURI, NOTIUNI } from '../notiuni'
import { usePreferinte } from '../preferinte'
import { Formula } from './Formula'

interface Props {
  // notiunea cerut din etichetele algoritmului: deschide panoul si deruleaza la ea
  tinta: string | null
  cerere: number
}

export function Notiuni({ tinta, cerere }: Props) {
  const { t, limba } = usePreferinte()
  const [deschis, setDeschis] = useState(false)

  useEffect(() => {
    if (!tinta) return
    setDeschis(true)
    const timer = setTimeout(() => document.getElementById(`notiune-${tinta}`)?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 50)
    return () => clearTimeout(timer)
  }, [tinta, cerere])

  return (
    <details className="notiuni" id="notiuni" open={deschis} onToggle={(e) => setDeschis((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>{t('notiuni')}</summary>
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
    </details>
  )
}
