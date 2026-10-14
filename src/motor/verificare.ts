// Verificarile numerice de dupa rulare: identitatile pe care le promite fiecare algoritm din
// curs (LU = A, LL^T = A, QR = A, Ax = b...), calculate independent de urma, cu eroarea raportata
// la marimea datelor. Un reziduu sub 1e-9 spune ca identitatea e satisfacuta pana la rotunjiri;
// pentru Ax = b nu spune cat de precis e x, care depinde si de conditionarea lui A.
import type { Intrari } from './interpretor'
import type { Limba } from './mesaje'
import { diferenta, identitate, inferior, matvec, norma2, normaMax, produs, reflector, rezolva, superior, transpusa } from './numeric'
import { citeste, matriceDin, scrie, vectorDin, vectorNou, type Matrice, type Tablou, type Vector } from './valori'

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
  text: { ro: '‖Ax - b‖∞ / max(1, ‖b‖∞)', en: '‖Ax - b‖∞ / max(1, ‖b‖∞)' },
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
    const T = matriceDin(liniiDin(matrice(d, 'A', 'intrari')))
    for (let k = 1; k <= n - 1; k++) {
      const ik = p.d[k - 1]
      for (let j = 1; j <= n; j++) {
        const a = citeste(T, k, j)
        scrie(T, citeste(T, ik, j), k, j)
        scrie(T, a, ik, j)
      }
      for (let i = k + 1; i <= n; i++) for (let j = 1; j <= n; j++) scrie(T, citeste(T, i, j) - citeste(F, i, k) * citeste(T, k, j), i, j)
    }
    return [reziduu({ ro: 'U față de M_(n-1) P_(n-1) ··· M_1 P_1 A', en: 'U against M_(n-1) P_(n-1) ··· M_1 P_1 A' }, superior(F, true), T)]
  },
  S_GPP: (d) => [sistem(matrice(d, 'A', 'intrari'), vector(d, 'x', 'stare'), vector(d, 'b', 'intrari'))],
  S_G: (d) => [sistem(matrice(d, 'A', 'intrari'), vector(d, 'x', 'stare'), vector(d, 'b', 'intrari'))],
  // pe o matrice banda, elementele din afara benzii sunt zero, deci verificarile sunt cele de la G si GPP
  Gb: (d) => VERIFICATORI.G(d),
  GPPb: (d) => VERIFICATORI.GPP(d),
  UTRISb: (d) => [sistem(matrice(d, 'U', 'intrari'), vector(d, 'x', 'stare'), vector(d, 'b', 'intrari'))],
  LU: (d) => {
    const F = matrice(d, 'A', 'stare')
    return [reziduu({ ro: 'LU față de A, cu U unitate', en: 'LU against A, with unit U' }, produs(inferior(F, true), superior(F, false, true)), matrice(d, 'A', 'intrari'))]
  },
  CHOL: (d) => {
    const L = inferior(matrice(d, 'A', 'stare'), true)
    return [reziduu({ ro: 'LLᵀ față de A', en: 'LLᵀ against A' }, produs(L, transpusa(L)), matrice(d, 'A', 'intrari'))]
  },
  QR: (d) => verificaQR(d),
  SQR: (d) => {
    const A = matrice(d, 'A', 'intrari')
    const b = vector(d, 'b', 'intrari')
    const x = vector(d, 'x', 'stare')
    const rez = vectorDin(diferenta(b, matvec(A, x)))
    const ortogonal = normaMax(matvec(transpusa(A), rez).d) / scara(b.d)
    const r = d.scalari.r ?? Number.NaN
    return [
      ...verificaQR(d),
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
    const dominanta = valoareDominanta(A)
    // algoritmul promite doar criteriul de oprire; reziduul vectorului propriu scade cu tol
    return [
      ...(dominanta === null
        ? []
        : [
            {
              text: {
                ro: '|λ| față de cea mai mare valoare proprie în modul, aflată din alt vector de pornire',
                en: '|λ| against the largest eigenvalue in absolute value, found from another starting vector',
              },
              fel: 'reziduu' as const,
              valoare: Math.abs(Math.abs(lambda) - Math.abs(dominanta)) / Math.abs(dominanta),
              // e ≈ θ²/2 < tol lasa in λ o eroare de ordinul lui √tol
              prag: Math.max(1e-6, 10 * Math.sqrt(tol)),
            },
          ]),
      { text: { ro: 'λ = yᵀAy, câtul Rayleigh al lui y', en: 'λ = yᵀAy, the Rayleigh quotient of y' }, fel: 'valoare', valoare: lambda },
      { text: { ro: 'e = |1 - |zᵀy|| la oprire, față de tol', en: 'e = |1 - |zᵀy|| at the stop, against tol' }, fel: 'reziduu', valoare: d.scalari.e ?? Number.NaN, prag: tol },
      { text: { ro: '‖Ay - λy‖∞ / max(1, ‖Ay‖∞), cât de bine e y vector propriu', en: '‖Ay - λy‖∞ / max(1, ‖Ay‖∞), how well y is an eigenvector' }, fel: 'valoare', valoare: normaMax(diferenta(Ay, vectorDin(y.d.map((v) => lambda * v)))) / scara(Ay.d) },
    ]
  },
  JACOBI: (d) => iterativ(d),
  GS: (d) => iterativ(d),
  KACZMARZ: (d) => iterativ(d),
  RFG: (d) => {
    // u are zerouri pana la k, beta pe pozitia k si partea esentiala, pastrata in x, sub ea
    const x0 = vector(d, 'x', 'intrari')
    const x = vector(d, 'x', 'stare')
    const k = typeof d.intrari.k === 'number' ? d.intrari.k : 1
    const beta = d.scalari.β ?? 0
    const u = vectorDin(x.d.map((v, i) => (i + 1 < k ? 0 : i + 1 === k ? beta : v)))
    const asteptat = vectorDin(x0.d.map((v, i) => (i + 1 < k ? v : i + 1 === k ? x.d[i] : 0)))
    const U = reflector(u, beta)
    return [
      reziduu({ ro: 'U_k x față de (x_1, ..., x_{k-1}, -σ, 0, ..., 0)', en: 'U_k x against (x_1, ..., x_{k-1}, -σ, 0, ..., 0)' }, matvec(U, x0), asteptat),
      reziduu({ ro: 'U_kᵀU_k față de I', en: 'U_kᵀU_k against I' }, produs(transpusa(U), U), identitate(x0.n)),
    ]
  },
}

// Valoarea proprie de modul maxim, prin iteratiile metodei puterii pornite dintr-un vector fara
// legatura cu cel al utilizatorului; null cand sirul nu se stabilizeaza (fara valoare dominanta).
function valoareDominanta(A: Matrice): number | null {
  const n = A.n
  let y = vectorDin(Array.from({ length: n }, (_, i) => 1 + (i + 1) / (n + 2)))
  for (let k = 0; k < 5000; k++) {
    const z = matvec(A, y)
    const nz = norma2(z.d)
    if (nz === 0) return 0
    const nou = vectorDin(z.d.map((x) => x / nz))
    const cos = Math.abs(nou.d.reduce((s, x, i) => s + x * y.d[i], 0))
    y = nou
    if (k > 20 && 1 - cos <= 1e-15) {
      const Ay = matvec(A, y)
      return y.d.reduce((s, x, i) => s + x * Ay.d[i], 0)
    }
  }
  return null
}

// Metodele iterative promit doar testul de oprire. Langa el se arata numarul de iteratii si, pentru
// o matrice patrata, eroarea fata de solutia metodei directe: reziduul mic nu e totuna cu eroarea mica.
function iterativ(d: Date): Verificare[] {
  const A = matrice(d, 'A', 'intrari')
  const b = vector(d, 'b', 'intrari')
  const x = vector(d, 'x', 'stare')
  const tol = typeof d.intrari.tol === 'number' ? d.intrari.tol : PRAG
  const rez: Verificare[] = [
    { text: { ro: '‖Ax - b‖ / ‖b‖ la oprire, recalculat, față de tol', en: '‖Ax - b‖ / ‖b‖ at the stop, recomputed, against tol' }, fel: 'reziduu', valoare: norma2(diferenta(matvec(A, x), b)) / norma2(b.d), prag: tol },
    { text: { ro: 'treceri făcute (k)', en: 'sweeps done (k)' }, fel: 'valoare', valoare: d.scalari.k ?? Number.NaN },
  ]
  const exact = A.m === A.n ? rezolva(A, b) : null
  if (exact) {
    rez.push({
      text: { ro: '‖x - x*‖ / ‖x*‖, eroarea față de soluția eliminării gaussiene', en: '‖x - x*‖ / ‖x*‖, the error against the Gaussian elimination solution' },
      fel: 'valoare',
      valoare: norma2(diferenta(x, exact)) / norma2(exact.d),
    })
  }
  return rez
}

function liniiDin(M: Matrice): number[][] {
  return Array.from({ length: M.m }, (_, i) => M.d.slice(i * M.n, (i + 1) * M.n))
}

// Q = U_1 ··· U_s, cu vectorii Householder asa cum ii lasa Algoritmul QR: u_k are zerouri pana la
// k, β_k pe pozitia k si, sub ea, ce a ramas in coloana k a lui A.
function verificaQR(d: Date): Verificare[] {
  const A0 = matrice(d, 'A', 'intrari')
  const F = matrice(d, 'A', 'stare')
  const beta = vector(d, 'β', 'stare')
  const R = superior(F, true)
  let Q = identitate(A0.m)
  for (let k = 1; k <= beta.n; k++) {
    const u = vectorNou(A0.m)
    u.d[k - 1] = beta.d[k - 1]
    for (let i = k + 1; i <= A0.m; i++) u.d[i - 1] = citeste(F, i, k)
    Q = produs(Q, reflector(u, beta.d[k - 1]))
  }
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

// Pragul reziduurilor cand rularea rotunjeste fiecare operatie la t cifre semnificative: 10^(2-t),
// cu doua ordine de marime peste precizia aritmeticii, cat lasa rotunjirile unui algoritm stabil.
export const pragCifre = (cifre: number): number => Math.max(PRAG, 10 ** (2 - cifre))

// Verificarile algoritmului `id`; [] daca nu are, sau daca starea nu mai are formele asteptate
// (programul a fost editat). Cu `cifre`, reziduurile fara prag propriu primesc pragul aritmeticii.
export function verifica(id: string, intrari: Intrari, stare: Record<string, Tablou>, scalari: Record<string, number>, cifre?: number): Verificare[] {
  const v = VERIFICATORI[id]
  if (!v) return []
  try {
    const rez = v({ intrari: dinIntrari(intrari), stare, scalari })
    return cifre ? rez.map((x) => (x.fel === 'reziduu' && x.prag === undefined ? { ...x, prag: pragCifre(cifre) } : x)) : rez
  } catch {
    return []
  }
}
