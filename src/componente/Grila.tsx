import { motion } from 'motion/react'
import type { CheieText } from '../i18n'
import type { Celula, FelPas, Rol } from '../motor/interpretor'
import type { Tablou } from '../motor/valori'
import { PALETA, type RolGrila } from '../paleta'
import { usePreferinte } from '../preferinte'

export const TEXT_ROL: Record<RolGrila, CheieText | null> = { pivot: 'rolPivot', scris: 'rolScris', citit: 'rolCitit', gata: 'rolGata', mult: 'rolMult', neatins: null }

export function fmtCelula(x: number): string {
  if (Number.isNaN(x)) return 'NaN'
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '-∞'
  const s = Number.isInteger(x) ? String(x) : String(Number(x.toPrecision(4)))
  if (s.length <= LATIME_CELULA) return s
  // 0.009497 si 123456789 nu incap in celula: 9.5e-3 si 1.23e+8, cu atatea zecimale cate au loc
  const scurt = [2, 1, 0].map((z) => x.toExponential(z).replace(/\.?0+e/, 'e')).find((e) => e.length <= LATIME_CELULA)
  return scurt ?? s
}

// cate caractere incap intr-o celula; valoarea intreaga ramane in titlul ei
const LATIME_CELULA = 7

interface Props {
  nume: string
  tablou: Tablou
  celule: Celula[]
  // celulele „i:j” scrise la pasi dinainte si nemodificate pana la sfarsit
  gata?: Set<string>
  // dintre ele, valorile pastrate (scrieri etichetate cu μ sau u)
  mult?: Set<string>
  // dintre cele pastrate, componentele vectorilor Householder (litera u in colt, in loc de μ)
  householder?: Set<string>
  // pozitiile care sunt zero stiut dinainte (in afara benzii); algoritmul nu le atinge
  zerouri?: Set<string>
  // cate caractere are cel mai lung text din fiecare coloana, pe toata urma: latimea coloanei
  // nu se schimba de la un pas la altul
  latimi?: number[]
  // linia (de la 1) a ecuatiei la care lucreaza pasul curent, incadrata
  ecuatie?: number
  pasIdx: number
  fel?: FelPas
  // rezultatul pasului e inca ascuns: celulele care se scriu arata "?"
  intrebare: boolean
  // durata tranzitiilor, in secunde, scurtata la viteze mari
  durata: number
  // fara animatii la grile mari
  animat: boolean
}

export function Grila({ nume, tablou, celule, gata, mult, householder, zerouri, latimi, ecuatie, pasIdx, fel, intrebare, durata, animat }: Props) {
  const { tema, t } = usePreferinte()
  const paleta = PALETA[tema]
  const roluri = new Map<string, Rol>()
  const ale = celule.filter((c) => c.nume === nume)
  for (const c of ale) roluri.set(`${c.i}:${c.j ?? 1}`, c.rol)
  // la o interschimbare, cele doua celule se apropie una de alta
  const schimbate = fel === 'schimb' ? ale.filter((c) => c.rol === 'scris') : []
  const m = tablou.tip === 'vector' ? tablou.n : tablou.m
  const scara = Math.max(1, ...tablou.d.map((x) => (Number.isFinite(x) ? Math.abs(x) : 0)))
  const n = tablou.tip === 'vector' ? 1 : tablou.n
  const coloane = `var(--indice) ${Array.from({ length: n }, (_, j) => `max(var(--cel-min), ${Math.max(latimi?.[j] ?? 1, 1)}ch + 1.1rem)`).join(' ')}`

  const antet: React.ReactNode[] = [<div key="colt" className="indice" role="presentation" />]
  for (let j = 1; j <= n; j++)
    antet.push(
      <div key={`c${j}`} className="indice" role="columnheader">
        {n > 1 ? j : ''}
      </div>,
    )
  const randuri: React.ReactNode[] = [
    <div key="antet" className="rand" role="row">
      {antet}
    </div>,
  ]
  for (let i = 1; i <= m; i++) {
    const marcat = ecuatie === i
    const rand: React.ReactNode[] = [
      <div key={`r${i}`} className={`indice${marcat ? ' ec' : ''}`} role="rowheader">
        {i}
      </div>,
    ]
    for (let j = 1; j <= n; j++) {
      const v = tablou.d[(i - 1) * n + (j - 1)]
      const cheie = `${i}:${j}`
      const rol: RolGrila = roluri.get(cheie) ?? (mult?.has(cheie) ? 'mult' : gata?.has(cheie) ? 'gata' : 'neatins')
      const ascuns = intrebare && rol === 'scris'
      // un zero ratat de rotunjiri (1e-16 langa valori de ordinul 1) se arata ca ≈0; valoarea exacta ramane in titlu
      const zgomot = v !== 0 && Math.abs(v) < 1e-13 * scara
      const text = ascuns ? '?' : zgomot ? '≈0' : fmtCelula(v)
      const pozitie = `${nume}(${i}${n > 1 ? `,${j}` : ''})`
      const cheieRol = TEXT_ROL[rol]
      const zero = rol === 'neatins' && !!zerouri?.has(cheie)
      const eticheta = `${pozitie} = ${text}${cheieRol ? `, ${t(cheieRol)}` : ''}${zero ? `, ${t('zeroStiut')}` : ''}`
      const clasa = `celula rol-${rol}${zero ? ' zero-stiut' : ''}${rol === 'mult' && householder?.has(cheie) ? ' householder' : ''}`
      const titlu = ascuns ? pozitie : `${pozitie} = ${v}`
      if (!animat) {
        rand.push(
          <div key={cheie} className={`${clasa} static`} role="cell" aria-label={eticheta} title={titlu} style={{ backgroundColor: paleta[rol] }}>
            {text}
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
      rand.push(
        <motion.div
          key={cheie}
          className={clasa}
          role="cell"
          aria-label={eticheta}
          title={titlu}
          animate={{ backgroundColor: paleta[rol], x: dx ? [0, dx, 0] : 0, y: dy ? [0, dy, 0] : 0 }}
          transition={{ duration: durata }}
        >
          {rol === 'scris' ? (
            <motion.span key={`${pasIdx}:${text}`} initial={{ scale: 1.35, opacity: 0.3 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: durata }}>
              {text}
            </motion.span>
          ) : (
            <span>{text}</span>
          )}
        </motion.div>,
      )
    }
    randuri.push(
      <div key={`rand${i}`} className={`rand${marcat ? ' ec' : ''}`} role="row">
        {rand}
      </div>,
    )
  }

  const forma = tablou.tip === 'vector' ? `${m}` : `${m} × ${n}`
  return (
    <figure className="grila">
      <figcaption>
        {nume} <span>{forma}</span>
      </figcaption>
      <div className="celule" role="table" aria-label={`${nume}, ${forma}`} style={{ gridTemplateColumns: coloane }}>
        {randuri}
      </div>
    </figure>
  )
}
