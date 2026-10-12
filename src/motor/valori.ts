// Valorile cu care lucreaza interpretorul. Tablourile tin datele intr-un singur vector,
// pe linii; indicii din pseudocod sunt de la 1, cei din `d` de la 0.
import { mesaj } from './mesaje'

export interface Scalar {
  tip: 'scalar'
  v: number
}
export interface Vector {
  tip: 'vector'
  n: number
  d: number[]
}
// vector transpus (y^T), apare doar in expresii
export interface Rand {
  tip: 'rand'
  n: number
  d: number[]
}
export interface Matrice {
  tip: 'matrice'
  m: number
  n: number
  d: number[]
}
export type Valoare = Scalar | Vector | Rand | Matrice
export type Tablou = Vector | Matrice

export const scalar = (v: number): Scalar => ({ tip: 'scalar', v })
export const vectorNou = (n: number): Vector => ({ tip: 'vector', n, d: new Array<number>(n).fill(0) })
export const vectorDin = (d: number[]): Vector => ({ tip: 'vector', n: d.length, d: [...d] })
export const matriceNoua = (m: number, n: number): Matrice => ({ tip: 'matrice', m, n, d: new Array<number>(m * n).fill(0) })
export const matriceDin = (linii: number[][]): Matrice => {
  const m = linii.length
  const n = m ? linii[0].length : 0
  if (linii.some((l) => l.length !== n)) throw new Error(mesaj('liniiDiferite'))
  return { tip: 'matrice', m, n, d: linii.flat() }
}
export const linii = (M: Matrice): number[][] => Array.from({ length: M.m }, (_, i) => M.d.slice(i * M.n, (i + 1) * M.n))

export function cloneaza<T extends Valoare>(v: T): T {
  return v.tip === 'scalar' ? { ...v } : ({ ...v, d: [...v.d] } as T)
}

export const esteTablou = (v: Valoare | undefined): v is Tablou => v?.tip === 'vector' || v?.tip === 'matrice'

export const citeste = (t: Tablou, i: number, j?: number): number => (t.tip === 'vector' ? t.d[i - 1] : t.d[(i - 1) * t.n + (j! - 1)])
export const scrie = (t: Tablou, x: number, i: number, j?: number): void => {
  if (t.tip === 'vector') t.d[i - 1] = x
  else t.d[(i - 1) * t.n + (j! - 1)] = x
}
