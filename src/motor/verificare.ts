// Verificarile numerice de dupa rulare: identitatile pe care le promite fiecare algoritm din
// curs (LU = A, LL^T = A, QR = A, Ax = b...), calculate independent de urma, cu eroarea raportata
// la marimea datelor. Un reziduu sub 1e-9 inseamna ca rezultatul e corect.
import type { Intrari } from './interpretor'
import type { Limba } from './mesaje'
import { coloana, diferenta, identitate, inferior, matvec, norma2, normaMax, produs, reflector, superior, transpusa } from './numeric'
import { citeste, matriceDin, scrie, vectorDin, type Matrice, type Tablou, type Vector } from './valori'

export interface Verificare {
  text: Record<Limba, string>
  // 'reziduu': trebuie sa fie sub prag (PRAG, daca nu e dat altul); 'valoare': doar de aratat
  fel: 'reziduu' | 'valoare'
  valoare: number
  prag?: number
}

export const PRAG = 1e-9

interface Date {
  intrari: Record<string, Tablou | number>
  stare: Record<string, Tablou>
  scalari: Record<string, number>
}

type Verificator = (d: Date) => Verificare[]

function matrice(d: Date, nume: string, deUnde: 'intrari' | 'stare'): Matrice {
  const v = d[deUnde][nume]
  if (typeof v !== 'object' || v.tip !== 'matrice') throw new Error(`${nume} nu este matrice`)
  return v
}

function vector(d: Date, nume: string, deUnde: 'intrari' | 'stare'): Vector {
  const v = d[deUnde][nume]
  if (typeof v !== 'object' || v.tip !== 'vector') throw new Error(`${nume} nu este vector`)
  return v
}

const scara = (d: number[]): number => Math.max(1, normaMax(d))

function reziduu(text: Record<Limba, string>, obtinut: Matrice | Vector, asteptat: Matrice | Vector): Verificare {
  return { text, fel: 'reziduu', valoare: normaMax(diferenta(obtinut, asteptat)) / scara(asteptat.d) }
}

const sistem = (A: Matrice, x: Vector, b: Vector): Verificare => ({
  text: { ro: '‖Ax - b‖ / ‖b‖', en: '‖Ax - b‖ / ‖b‖' },
  fel: 'reziduu',
  valoare: normaMax(diferenta(matvec(A, x), b)) / scara(b.d),
})

const VERIFICATORI: Record<string, Verificator> = {
  matvec: (d) => [reziduu({ ro: 'y față de Ax, recalculat', en: 'y against Ax, recomputed' }, vector(d, 'y', 'stare'), matvec(matrice(d, 'A', 'intrari'), vector(d, 'x', 'intrari')))],
  matmul: (d) => [reziduu({ ro: 'C față de AB, recalculat', en: 'C against AB, recomputed' }, matrice(d, 'C', 'stare'), produs(matrice(d, 'A', 'intrari'), matrice(d, 'B', 'intrari')))],
  LTRIS: (d) => [sistem(matrice(d, 'L', 'intrari'), vector(d, 'x', 'stare'), vector(d, 'b', 'intrari'))],
  UTRIS: (d) => [sistem(matrice(d, 'U', 'intrari'), vector(d, 'x', 'stare'), vector(d, 'b', 'intrari'))],
  G: (d) => {
    const F = matrice(d, 'A', 'stare')
    return [reziduu({ ro: 'LU față de A, cu L unitate din multiplicatori', en: 'LU against A, with unit L from the multipliers' }, produs(inferior(F, false, true), superior(F, true)), matrice(d, 'A', 'intrari'))]
  },
  GPP: (d) => {
    // U = M_{n-1} P_{n-1} ... M_1 P_1 A, cu P_k din p si M_k din multiplicatorii coloanei k
    const F = matrice(d, 'A', 'stare')
    const p = vector(d, 'p', 'stare')
    const n = F.n
    let T = matriceDin(matrice(d, 'A', 'intrari').d.length ? liniiDin(matrice(d, 'A', 'intrari')) : [])
    for (let k = 1; k <= n - 1; k++) {
      const ik = p.d[k - 1]
      for (let j = 1; j <= n; j++) {
        const a = citeste(T, k, j)
        scrie(T, citeste(T, ik, j), k, j)
        scrie(T, a, ik, j)
      }
      for (let i = k + 1; i <= n; i++) for (let j = 1; j <= n; j++) scrie(T, citeste(T, i, j) - citeste(F, i, k) * citeste(T, k, j), i, j)
    }
    T = superior(T, true)
    return [reziduu({ ro: 'U față de M_{n-1}P_{n-1}···M_1P_1A', en: 'U against M_{n-1}P_{n-1}···M_1P_1A' }, superior(F, true), T)]
  },
  S_GPP: (d) => [sistem(matrice(d, 'A', 'intrari'), vector(d, 'x', 'stare'), vector(d, 'b', 'intrari'))],
  LU: (d) => {
    const F = matrice(d, 'A', 'stare')
    return [reziduu({ ro: 'LU față de A, cu U unitate', en: 'LU against A, with unit U' }, produs(inferior(F, true), superior(F, false, true)), matrice(d, 'A', 'intrari'))]
  },
  CHOL: (d) => {
    const L = inferior(matrice(d, 'A', 'stare'), true)
    return [reziduu({ ro: 'LLᵀ față de A', en: 'LLᵀ against A' }, produs(L, transpusa(L)), matrice(d, 'A', 'intrari'))]
  },
  TORT: (d) => verificaTort(d),
  CMMP: (d) => {
    const A = matrice(d, 'A', 'intrari')
    const b = vector(d, 'b', 'intrari')
    const x = vector(d, 'x', 'stare')
    const rez = vectorDin(diferenta(b, matvec(A, x)))
    const ortogonal = normaMax(matvec(transpusa(A), rez).d) / scara(b.d)
    const r = d.scalari.r ?? Number.NaN
    return [
      ...verificaTort(d),
      { text: { ro: 'Aᵀ(b - Ax), reziduul e ortogonal pe Im A', en: 'Aᵀ(b - Ax), the residual is orthogonal to Im A' }, fel: 'reziduu', valoare: ortogonal },
      { text: { ro: '‖b - Ax‖ față de r', en: '‖b - Ax‖ against r' }, fel: 'reziduu', valoare: Math.abs(norma2(rez.d) - r) / scara(b.d) },
    ]
  },
  MP: (d) => {
    const A = matrice(d, 'A', 'intrari')
    const y = vector(d, 'y', 'stare')
    const Ay = matvec(A, y)
    const lambda = y.d.reduce((s, v, k) => s + v * Ay.d[k], 0)
    const tol = typeof d.intrari.tol === 'number' ? d.intrari.tol : PRAG
    // algoritmul promite doar criteriul de oprire; reziduul vectorului propriu scade cu tol
    return [
      { text: { ro: 'λ = yᵀAy, valoarea proprie dominantă', en: 'λ = yᵀAy, the dominant eigenvalue' }, fel: 'valoare', valoare: lambda },
      { text: { ro: 'e = |1 - |zᵀy|| la oprire, față de tol', en: 'e = |1 - |zᵀy|| at the stop, against tol' }, fel: 'reziduu', valoare: d.scalari.e ?? Number.NaN, prag: tol },
      { text: { ro: '‖Ay - λy‖ / ‖Ay‖', en: '‖Ay - λy‖ / ‖Ay‖' }, fel: 'valoare', valoare: normaMax(diferenta(Ay, vectorDin(y.d.map((v) => lambda * v)))) / scara(Ay.d) },
    ]
  },
}

function liniiDin(M: Matrice): number[][] {
  return Array.from({ length: M.m }, (_, i) => M.d.slice(i * M.n, (i + 1) * M.n))
}

function verificaTort(d: Date): Verificare[] {
  const A0 = matrice(d, 'A', 'intrari')
  const F = matrice(d, 'A', 'stare')
  const U = matrice(d, 'U', 'stare')
  const beta = vector(d, 'β', 'stare')
  const R = superior(F, true)
  let Q = identitate(A0.m)
  for (let k = 1; k <= U.n; k++) Q = produs(Q, reflector(coloana(U, k), beta.d[k - 1]))
  return [
    reziduu({ ro: 'QR față de A', en: 'QR against A' }, produs(Q, R), A0),
    reziduu({ ro: 'QᵀQ față de I', en: 'QᵀQ against I' }, produs(transpusa(Q), Q), identitate(A0.m)),
  ]
}

function dinIntrari(intrari: Intrari): Record<string, Tablou | number> {
  const rez: Record<string, Tablou | number> = {}
  for (const [nume, v] of Object.entries(intrari)) {
    if (typeof v === 'number') rez[nume] = v
    else if (Array.isArray(v[0])) rez[nume] = matriceDin(v as number[][])
    else rez[nume] = vectorDin(v as number[])
  }
  return rez
}

export function areVerificare(id: string): boolean {
  return id in VERIFICATORI
}

// Verificarile algoritmului `id`; [] daca nu are, sau daca starea nu mai are formele asteptate
// (programul a fost editat).
export function verifica(id: string, intrari: Intrari, stare: Record<string, Tablou>, scalari: Record<string, number>): Verificare[] {
  const v = VERIFICATORI[id]
  if (!v) return []
  try {
    return v({ intrari: dinIntrari(intrari), stare, scalari })
  } catch {
    return []
  }
}
