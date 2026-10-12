import { motion } from 'motion/react'
import type { Celula, FelPas, Rol } from '../motor/interpretor'
import type { Tablou } from '../motor/valori'
import { usePreferinte, type Tema } from '../preferinte'

export type RolGrila = Rol | 'gata' | 'mult' | 'neatins'

// Culorile din anexa pentru tema luminoasa; pentru cea intunecata, aceleasi nuante, inversate.
export const PALETA: Record<Tema, Record<RolGrila, { fond: string; text: string }>> = {
  luminos: {
    pivot: { fond: '#fad4d0', text: '#b92d28' },
    scris: { fond: '#ffe0a5', text: '#b45f00' },
    citit: { fond: '#d2e5fa', text: '#1e5aa0' },
    gata: { fond: '#d4eedb', text: '#237341' },
    mult: { fond: '#e7ddf6', text: '#694196' },
    neatins: { fond: '#ffffff', text: '#1c1c1c' },
  },
  intunecat: {
    pivot: { fond: '#6b2a26', text: '#ffc2bd' },
    scris: { fond: '#6b4a10', text: '#ffd98a' },
    citit: { fond: '#1f3d63', text: '#b0d0fa' },
    gata: { fond: '#1f4a30', text: '#9fe0b4' },
    mult: { fond: '#3d2a5c', text: '#d7c3f7' },
    neatins: { fond: '#262b33', text: '#e8e8e8' },
  },
}

export function fmtCelula(x: number): string {
  if (Number.isNaN(x)) return 'NaN'
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '-∞'
  if (Number.isInteger(x)) return String(x)
  return String(Number(x.toPrecision(4)))
}

interface Props {
  nume: string
  tablou: Tablou
  celule: Celula[]
  // celulele „i:j” scrise la pasi dinainte si nemodificate pana la sfarsit
  gata?: Set<string>
  // dintre ele, multiplicatorii (scrieri etichetate cu μ)
  mult?: Set<string>
  pasIdx: number
  fel?: FelPas
  // durata tranzitiilor, in secunde, scurtata la viteze mari
  durata: number
  // fara animatii la grile mari
  animat: boolean
}

export function Grila({ nume, tablou, celule, gata, mult, pasIdx, fel, durata, animat }: Props) {
  const { tema } = usePreferinte()
  const paleta = PALETA[tema]
  const roluri = new Map<string, Rol>()
  const ale = celule.filter((c) => c.nume === nume)
  for (const c of ale) roluri.set(`${c.i}:${c.j ?? 1}`, c.rol)
  // la o interschimbare, cele doua celule se apropie una de alta
  const schimbate = fel === 'schimb' ? ale.filter((c) => c.rol === 'scris') : []
  const m = tablou.tip === 'vector' ? tablou.n : tablou.m
  const n = tablou.tip === 'vector' ? 1 : tablou.n
  const coloane = `var(--indice) repeat(${n}, var(--cel))`

  const randuri: React.ReactNode[] = []
  randuri.push(<div key="colt" className="indice" />)
  for (let j = 1; j <= n; j++) randuri.push(<div key={`c${j}`} className="indice">{n > 1 ? j : ''}</div>)
  for (let i = 1; i <= m; i++) {
    randuri.push(<div key={`r${i}`} className="indice">{i}</div>)
    for (let j = 1; j <= n; j++) {
      const v = tablou.d[(i - 1) * n + (j - 1)]
      const cheie = `${i}:${j}`
      const rol: RolGrila = roluri.get(cheie) ?? (mult?.has(cheie) ? 'mult' : gata?.has(cheie) ? 'gata' : 'neatins')
      const c = paleta[rol]
      const titlu = `${nume}(${i}${n > 1 ? `,${j}` : ''}) = ${v}`
      if (!animat) {
        randuri.push(
          <div key={cheie} className={`celula static rol-${rol}`} title={titlu} style={{ backgroundColor: c.fond, color: c.text }}>
            {fmtCelula(v)}
          </div>,
        )
        continue
      }
      let dx = 0
      let dy = 0
      if (schimbate.length === 2 && rol === 'scris') {
        const cealalta = schimbate.find((s) => s.i !== i || (s.j ?? 1) !== j)
        if (cealalta) {
          dx = Math.sign((cealalta.j ?? 1) - j) * 10
          dy = Math.sign(cealalta.i - i) * 10
        }
      }
      randuri.push(
        <motion.div
          key={cheie}
          className={`celula rol-${rol}`}
          title={titlu}
          animate={{ backgroundColor: c.fond, color: c.text, x: dx ? [0, dx, 0] : 0, y: dy ? [0, dy, 0] : 0 }}
          transition={{ duration: durata }}
        >
          {rol === 'scris' ? (
            <motion.span key={pasIdx} initial={{ scale: 1.35, opacity: 0.3 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: durata }}>
              {fmtCelula(v)}
            </motion.span>
          ) : (
            <span>{fmtCelula(v)}</span>
          )}
        </motion.div>,
      )
    }
  }

  return (
    <figure className="grila">
      <figcaption>
        {nume} <span>{tablou.tip === 'vector' ? `${m}` : `${m} × ${n}`}</span>
      </figcaption>
      <div className="celule" style={{ gridTemplateColumns: coloane }}>
        {randuri}
      </div>
    </figure>
  )
}
