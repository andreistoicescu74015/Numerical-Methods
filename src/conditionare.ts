// Experimentul de conditionare pentru un sistem Ax = b: b se schimba putin, algoritmul ruleaza din
// nou, iar schimbarea relativa a lui x se compara cu marginea κ(A) ‖Δb‖/‖b‖ din teorema de pe
// slide-ul "Conditionarea sistemelor liniare". Se lucreaza cu norma ∞, pe care cartea cursului o
// alege pentru κ fiindca se calculeaza usor; marginea cu Δb singur decurge din definitia normei.
import type { Algoritm } from './motor/biblioteca'
import { urma, type Intrari } from './motor/interpretor'
import { rezolva } from './motor/numeric'
import { parseaza } from './motor/parser'

type M = number[][]

// matricea sistemului, pentru fiecare algoritm care rezolva Ax = b direct
const MATRICEA: Record<string, string> = { LTRIS: 'L', UTRIS: 'U', UTRISb: 'U', S_GPP: 'A', S_G: 'A' }

export const areConditionare = (id: string): boolean => id in MATRICEA
export const matriceaSistemului = (id: string): string => MATRICEA[id]

// ‖A‖∞: cea mai mare suma a modulelor pe o linie
export const normaInf = (A: M): number => Math.max(...A.map((l) => l.reduce((s, x) => s + Math.abs(x), 0)))
const normaVInf = (x: number[]): number => Math.max(...x.map(Math.abs))

// A⁻¹, coloana cu coloana, din sisteme rezolvate prin eliminare cu pivotare; null pentru o matrice singulara
export function inversa(A: M): M | null {
  const n = A.length
  const Am = { tip: 'matrice' as const, m: n, n, d: A.flat() }
  const coloane: number[][] = []
  for (let j = 0; j < n; j++) {
    const x = rezolva(Am, { tip: 'vector', n, d: Array.from({ length: n }, (_, i) => (i === j ? 1 : 0)) })
    if (!x) return null
    coloane.push(x.d)
  }
  return A.map((_, i) => coloane.map((c) => c[i]))
}

export interface Experiment {
  normaA: number
  normaInv: number
  kappa: number
  eps: number
  x: number[]
  xPert: number[] | null
  // ‖x̃ − x‖∞ / ‖x‖∞
  schimbare: number
  // κ∞(A) ε, marginea din teorema
  margine: number
}

// b perturbat cu ε ‖b‖∞ in directia in care A⁻¹ mareste cel mai mult: semnele liniei lui A⁻¹ cu cea
// mai mare suma de module, deci ‖A⁻¹ Δb‖∞ = ‖A⁻¹‖∞ ‖Δb‖∞. Ambele rulari se fac in dubla precizie,
// ca sa se vada doar efectul datelor.
export function experiment(alg: Algoritm, intrari: Intrari, eps: number): Experiment | null {
  try {
    return calculeaza(alg, intrari, eps)
  } catch {
    // intrari de alta forma decat cere algoritmul: experimentul nu se face
    return null
  }
}

// Partea matricei pe care o citeste algoritmul: triunghiul la LTRIS si UTRIS, banda la UTRISb.
// Sistemul rezolvat este cel cu aceasta matrice, chiar daca in intrare s-a scris altceva.
function citita(id: string, A: M, intrari: Intrari): M {
  const q = typeof intrari.q === 'number' ? intrari.q : A.length
  const citeste = (i: number, j: number) => (id === 'LTRIS' ? j <= i : id === 'UTRIS' ? j >= i : id === 'UTRISb' ? j >= i && j - i <= q : true)
  return A.map((l, i) => l.map((x, j) => (citeste(i, j) ? x : 0)))
}

function calculeaza(alg: Algoritm, intrari: Intrari, eps: number): Experiment | null {
  const scris = intrari[MATRICEA[alg.id]]
  const b = intrari.b
  if (!Array.isArray(scris) || !Array.isArray(scris[0]) || !Array.isArray(b) || scris.length !== scris[0].length || b.length !== scris.length) return null
  const A = citita(alg.id, scris as M, intrari)
  const bv = b as number[]
  const inv = inversa(A)
  if (!inv) return null
  const program = parseaza(alg.sursa)
  const original = urma(program, intrari)
  if (original.final !== 'gata') return null
  const x = original.stare.x.d
  const sume = inv.map((l) => l.reduce((s, v) => s + Math.abs(v), 0))
  const r = sume.indexOf(Math.max(...sume))
  const db = inv[r].map((v) => (v >= 0 ? 1 : -1) * eps * normaVInf(bv))
  const pert = urma(program, { ...intrari, b: bv.map((v, i) => v + db[i]) })
  const xPert = pert.final === 'gata' ? pert.stare.x.d : null
  const normaA = normaInf(A)
  const normaInv = normaInf(inv)
  return {
    normaA,
    normaInv,
    kappa: normaA * normaInv,
    eps,
    x,
    xPert,
    // cu b = 0, x = 0 si schimbarea relativa nu are sens: ramane NaN, iar panoul o spune
    schimbare: xPert ? normaVInf(xPert.map((v, i) => v - x[i])) / normaVInf(x) : NaN,
    margine: normaA * normaInv * eps,
  }
}

// Exemplele din cartea cursului (sectiunea 2.7): D diagonala cu 0.1, bine conditionata desi are
// determinantul mic; T superior triunghiulara cu 1 pe diagonala si -1 deasupra, cu κ∞ = n 2ⁿ⁻¹;
// matricea Hilbert H₃, cu κ∞ ≈ 748. b = A s, unde s are semnele liniei lui A cu cea mai mare suma de
// module: solutia este x = s si ‖b‖∞ = ‖A‖∞ ‖x‖∞, deci schimbarea lui x poate atinge marginea.
export interface ExempluCarte {
  id: 'D' | 'T' | 'H3'
  A: M
  b: number[]
  // algoritmii pe care se poate rula: T e superior triunghiulara, H₃ nu e triunghiulara
  pentru: string[]
}

function termenLiber(A: M): number[] {
  const sume = A.map((l) => l.reduce((s, v) => s + Math.abs(v), 0))
  const s = A[sume.indexOf(Math.max(...sume))].map((v) => (v < 0 ? -1 : 1))
  return A.map((l) => l.reduce((acc, v, j) => acc + v * s[j], 0))
}

export function exempleCarte(): ExempluCarte[] {
  const D = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => (i === j ? 0.1 : 0)))
  const T = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => (i === j ? 1 : j > i ? -1 : 0)))
  const H3 = Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => 1 / (i + j + 1)))
  return [
    { id: 'D', A: D, b: termenLiber(D), pentru: ['LTRIS', 'UTRIS', 'S_GPP', 'S_G'] },
    { id: 'T', A: T, b: termenLiber(T), pentru: ['UTRIS', 'S_GPP', 'S_G'] },
    { id: 'H3', A: H3, b: termenLiber(H3), pentru: ['S_GPP', 'S_G'] },
  ]
}
