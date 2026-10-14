// Unelte pentru testele de logica: algebra liniara marunta pe number[][], scrisa separat de
// motor, si matrice aleatoare cu samanta fixa, pe clasele cerute de algoritmi.
import { algoritm } from '../src/motor/biblioteca'
import { urma, type Intrari, type Rezultat } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { linii } from '../src/motor/valori'

export type M = number[][]

// generator cu samanta (mulberry32), ca un test picat sa pice la fel si a doua oara
export function generator(samanta: number): () => number {
  let a = samanta >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const ori = (A: M, B: M): M => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)))
export const transpusa = (A: M): M => (A.length ? A[0].map((_, j) => A.map((r) => r[j])) : [])
export const unitate = (n: number): M => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
export const peVector = (A: M, x: number[]): number[] => A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0))
export const norma = (x: number[]): number => Math.sqrt(x.reduce((s, v) => s + v * v, 0))
export const maxim = (A: M): number => Math.max(0, ...A.flat().map(Math.abs))
// cea mai mare diferenta in modul; zero inseamna egalitate exacta (-0 si 0 sunt la fel)
export const abatere = (A: M, B: M): number => Math.max(0, ...A.flatMap((r, i) => r.map((a, j) => Math.abs(a - B[i][j]))))
export const abatereV = (x: number[], y: number[]): number => Math.max(0, ...x.map((a, i) => Math.abs(a - y[i])))
export const coloana = (A: M, j: number): number[] => A.map((r) => r[j])
export const inferioara = (F: M, unitara: boolean): M => F.map((r, i) => r.map((a, j) => (j < i ? a : j === i ? (unitara ? 1 : a) : 0)))
export const superioara = (F: M, unitara: boolean): M => F.map((r, i) => r.map((a, j) => (j > i ? a : j === i ? (unitara ? 1 : a) : 0)))

// determinantul prin dezvoltare dupa prima linie, pentru matrice mici
export function det(A: M): number {
  if (A.length === 1) return A[0][0]
  return A[0].reduce((s, a, j) => s + (j % 2 ? -1 : 1) * a * det(A.slice(1).map((r) => r.filter((_, c) => c !== j))), 0)
}

export const aleatoare = (m: number, n: number, rnd: () => number): M => Array.from({ length: m }, () => Array.from({ length: n }, () => 2 * rnd() - 1))
export const vector = (n: number, rnd: () => number): number[] => Array.from({ length: n }, () => 2 * rnd() - 1)

// strict diagonal dominanta pe linii: toate submatricele lider principale sunt nesingulare
export function dominanta(n: number, rnd: () => number): M {
  const A = aleatoare(n, n, rnd)
  A.forEach((r, i) => {
    r[i] = (rnd() < 0.5 ? -1 : 1) * (r.reduce((s, a, j) => s + (j === i ? 0 : Math.abs(a)), 0) + 1 + rnd())
  })
  return A
}

// banda de latime inferioara r si superioara q, strict diagonal dominanta: A[k] nesingulare
export function banda(n: number, r: number, q: number, rnd: () => number): M {
  const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i - j <= r && j - i <= q ? 2 * rnd() - 1 : 0)))
  A.forEach((l, i) => {
    l[i] = (rnd() < 0.5 ? -1 : 1) * (l.reduce((s, a, j) => s + (j === i ? 0 : Math.abs(a)), 0) + 1 + rnd())
  })
  return A
}

// simetrica si pozitiv definita: B Bᵀ + n I, cu simetria exacta
export function pozitivDefinita(n: number, rnd: () => number): M {
  const B = aleatoare(n, n, rnd)
  const A = ori(B, transpusa(B))
  for (let i = 0; i < n; i++) {
    A[i][i] += n
    for (let j = 0; j < i; j++) A[i][j] = A[j][i]
  }
  return A
}

// reflector I - 2vvᵀ/vᵀv: o matrice ortogonala oarecare
export function ortogonala(n: number, rnd: () => number): M {
  const v = vector(n, rnd)
  const vv = v.reduce((s, a) => s + a * a, 0)
  return unitate(n).map((r, i) => r.map((e, j) => e - (2 * v[i] * v[j]) / vv))
}

// simetrica, cu valorile proprii date: Q diag(valori) Qᵀ
export function cuSpectru(valori: number[], rnd: () => number): M {
  const Q = ortogonala(valori.length, rnd)
  const A = ori(ori(Q, valori.map((v, i) => valori.map((_, j) => (i === j ? v : 0)))), transpusa(Q))
  for (let i = 0; i < A.length; i++) for (let j = 0; j < i; j++) A[i][j] = A[j][i]
  return A
}

// Ruleaza algoritmul `id` din biblioteca prin interpretor; o eroare la rulare pica testul.
export function ruleaza(id: string, intrari: Intrari): Rezultat {
  const rez = urma(parseaza(algoritm(id)!.sursa), intrari, { maxPasi: 2_000_000 })
  if (rez.final === 'eroare') throw new Error(`${id}: ${rez.eroare}`)
  return rez
}

export const matrice = (rez: Rezultat, nume: string): M => {
  const t = rez.stare[nume]
  if (t.tip !== 'matrice') throw new Error(`${nume} nu e matrice`)
  return linii(t)
}

export const vec = (rez: Rezultat, nume: string): number[] => rez.stare[nume].d
