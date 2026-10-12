// Intrarile se editeaza ca text: o linie pe rand, numerele despartite prin spatii sau virgule.
// O definitie are nume, tip si textul cu valorile; biblioteca da definitiile de pornire.
import type { Algoritm, Intrare } from './motor/biblioteca'
import type { Intrari } from './motor/interpretor'
import { mesaj } from './motor/mesaje'

export type TipIntrare = Intrare['tip']

export interface Definitie {
  nume: string
  tip: TipIntrare
  text: string
}

export class EroareIntrare extends Error {}

export function textDinValoare(v: Intrare['exemplu']): string {
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v[0])) return (v as number[][]).map((l) => l.join(' ')).join('\n')
  return (v as number[]).join(' ')
}

export function definitiiDin(alg: Algoritm): Definitie[] {
  return alg.intrari.map((i) => ({ nume: i.nume, tip: i.tip, text: textDinValoare(i.exemplu) }))
}

const EXEMPLE: Record<TipIntrare, string> = { matrice: '1 2\n3 4', vector: '1 2 3', scalar: '1' }
const NUME: Record<TipIntrare, string[]> = { matrice: ['A', 'B', 'C', 'L', 'U'], vector: ['x', 'b', 'y', 'z', 'v'], scalar: ['c', 'tol', 't', 'r'] }

// O definitie noua, cu primul nume liber pentru tipul ei.
export function definitieNoua(existente: Definitie[], tip: TipIntrare): Definitie {
  const luate = new Set(existente.map((d) => d.nume))
  const nume = NUME[tip].find((n) => !luate.has(n)) ?? `${NUME[tip][0]}${existente.length + 1}`
  return { nume, tip, text: EXEMPLE[tip] }
}

// „0,5” si „0,5 1,5” sunt zecimale cu virgula; „1,2,3” si „1, 2, 3” sunt numere despartite prin virgula.
export function virgulaZecimala(linie: string): string {
  const t = linie.trim()
  if (!/\d,\d/.test(t) || /,\s|\s,/.test(t)) return t
  if (/[\s;]/.test(t) || !/,.*,/.test(t)) return t.replace(/(\d),(\d)/g, '$1.$2')
  return t
}

function numere(linie: string, nume: string): number[] {
  const parti = virgulaZecimala(linie).split(/[\s,;]+/).filter(Boolean)
  return parti.map((p) => {
    const x = Number(p)
    if (Number.isNaN(x)) throw new EroareIntrare(mesaj('nuEsteNumar', nume, p))
    return x
  })
}

export function valoareDinText(tip: TipIntrare, nume: string, text: string): number | number[] | number[][] {
  const linii = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '')
  if (tip === 'scalar') {
    const v = numere(linii.join(' '), nume)
    if (v.length !== 1) throw new EroareIntrare(mesaj('unSingurNumar', nume))
    return v[0]
  }
  if (tip === 'vector') {
    const v = linii.flatMap((l) => numere(l, nume))
    if (v.length === 0) throw new EroareIntrare(mesaj('vectorGol', nume))
    return v
  }
  const m = linii.map((l) => numere(l, nume))
  if (m.length === 0) throw new EroareIntrare(mesaj('matriceGoala', nume))
  if (m.some((l) => l.length !== m[0].length)) throw new EroareIntrare(mesaj('liniiLungimi', nume))
  return m
}

const NUME_VALID = /^[\p{L}][\p{L}\p{N}]*$/u

export function intrariDinDefinitii(definitii: Definitie[]): Intrari {
  const rez: Intrari = {}
  for (const d of definitii) {
    const nume = d.nume.trim()
    if (!NUME_VALID.test(nume)) throw new EroareIntrare(mesaj('numeInvalid', d.nume))
    if (nume in rez) throw new EroareIntrare(mesaj('numeDublat', nume))
    rez[nume] = valoareDinText(d.tip, nume, d.text)
  }
  return rez
}
