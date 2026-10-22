// Matricele din formulele cursului (A = LU, A = LLᵀ, A = QR, μI − A, D⁻¹N...), calculate din
// starea de la pasul curent si aratate ca grile doar de citit. Pseudocodul ramane cel din curs,
// care scrie factorii peste A; aici se vede ce inseamna celulele lui.
import { limite } from './invarianti'
import type { Program } from './motor/ast'
import { stareLa, type Intrari, type Rezultat } from './motor/interpretor'
import type { Limba } from './motor/mesaje'
import { identitate, inferior, produs, reflector, rezolva } from './motor/numeric'
import { linii, matriceDin, vectorDin, type Matrice, type Tablou, type Vector } from './motor/valori'
import { matriceIteratie } from './natura'

type Text = Record<Limba, string>

export interface Vedere {
  // numele grilei (L, U, Q, R, B, c...)
  nume: string
  text: Text
  tablou: Tablou
}

// pasii compleți ai buclei exterioare la pasul k: ultima limita de pana la k
function compleți(program: Program, rez: Rezultat, k: number): number {
  let c = 0
  for (const l of limite(program, rez)) {
    if (l.pas > k) break
    c = l.complete
  }
  return c
}

// celulele „i:j” (de la 0) ale matricei `nume` scrise ca valori pastrate (multiplicatori, vectori
// Householder) pana la pasul k: exact celulele mov din grila
function pastrate(rez: Rezultat, nume: string, k: number): Set<string> {
  const s = new Set<string>()
  for (let idx = 0; idx <= k && idx < rez.pasi.length; idx++) for (const c of rez.pasi[idx].celule) if (c.nume === nume && c.rol === 'scris' && c.mult) s.add(`${c.i - 1}:${(c.j ?? 1) - 1}`)
  return s
}

const matrice = (s: Record<string, Tablou>, nume: string): Matrice | null => (s[nume]?.tip === 'matrice' ? s[nume] : null)
const vector = (s: Record<string, Tablou>, nume: string): Vector | null => (s[nume]?.tip === 'vector' ? s[nume] : null)
const din = (m: number, n: number, f: (i: number, j: number) => number): Matrice => matriceDin(Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => f(i, j))))
const la = (A: Matrice, i: number, j: number) => A.d[i * A.n + j]

// L din multiplicatorii scrisi pana acum (1 pe diagonala) si matricea curenta fara multiplicatori:
// L A_(k+1) = A la fiecare iesire din bucla, iar la final A_(n) = U
function eliminare(A: Matrice, mult: Set<string>, p?: Vector): Vedere[] {
  const n = A.n
  const L = din(n, n, (i, j) => (i === j ? 1 : mult.has(`${i}:${j}`) ? la(A, i, j) : 0))
  // cu pivotare, coloana j a lui L este m_j permutata de interschimbarile de dupa pasul j (p_k scris)
  if (p) {
    for (let j = 0; j < n - 1; j++) {
      const col = Array.from({ length: n }, (_, i) => (i > j && mult.has(`${i}:${j}`) ? la(A, i, j) : 0))
      for (let k = j + 1; k < n - 1; k++) {
        const pk = p.d[k] - 1
        if (pk >= 0 && pk !== k) [col[k], col[pk]] = [col[pk], col[k]]
      }
      for (let i = j + 1; i < n; i++) L.d[i * n + j] = col[i]
    }
  }
  const U = din(n, n, (i, j) => (mult.has(`${i}:${j}`) ? 0 : la(A, i, j)))
  return [
    {
      nume: 'L',
      text: p
        ? { ro: 'multiplicatorii coloanelor terminate, cu 1 pe diagonală, permutați de interschimbările de după pasul lor: PA = LU', en: 'the multipliers of the finished columns, with 1 on the diagonal, permuted by the swaps after their step: PA = LU' }
        : { ro: 'multiplicatorii coloanelor terminate, cu 1 pe diagonală: L A_(k+1) = A', en: 'the multipliers of the finished columns, with 1 on the diagonal: L A_(k+1) = A' },
      tablou: L,
    },
    {
      nume: 'U',
      text: { ro: 'matricea curentă fără multiplicatori (A_(k+1)); la sfârșit este U', en: 'the current matrix without the multipliers (A_(k+1)); at the end it is U' },
      tablou: U,
    },
  ]
}

// vectorul Householder u_k din coloana k: β_k pe diagonala, A(k+1:m, k) sub ea
function householder(A: Matrice, beta: Vector, k: number): Vector {
  return vectorDin(Array.from({ length: A.m }, (_, i) => (i < k ? 0 : i === k ? beta.d[k] : la(A, i, k))))
}

export function vederi(id: string, program: Program, rez: Rezultat, intrari: Intrari, k: number): Vedere[] {
  const s = stareLa(rez, k)
  const scalari = rez.pasi[k]?.scalari ?? {}
  const c = compleți(program, rez, k)
  switch (id) {
    case 'G':
    case 'S_G':
    case 'Gb': {
      const A = matrice(s, 'A')
      return A ? eliminare(A, pastrate(rez, 'A', k)) : []
    }
    case 'GPP':
    case 'S_GPP':
    case 'GPPb': {
      const A = matrice(s, 'A')
      const p = vector(s, 'p')
      return A && p ? eliminare(A, pastrate(rez, 'A', k), p) : []
    }
    case 'LU': {
      const A = matrice(s, 'A')
      if (!A) return []
      const n = A.n
      return [
        { nume: 'L', text: { ro: 'coloanele calculate ale lui L (Crout): A = LU', en: 'the computed columns of L (Crout): A = LU' }, tablou: din(n, n, (i, j) => (j < c && i >= j ? la(A, i, j) : 0)) },
        { nume: 'U', text: { ro: 'liniile calculate ale lui U, cu 1 pe diagonală', en: 'the computed rows of U, with 1 on the diagonal' }, tablou: din(n, n, (i, j) => (i < c ? (i === j ? 1 : j > i ? la(A, i, j) : 0) : 0)) },
      ]
    }
    case 'CHOL': {
      const A = matrice(s, 'A')
      if (!A) return []
      const n = A.n
      const L = din(n, n, (i, j) => (j < c && i >= j ? la(A, i, j) : 0))
      return [
        { nume: 'L', text: { ro: 'coloanele calculate ale lui L: A = LLᵀ', en: 'the computed columns of L: A = LLᵀ' }, tablou: L },
        { nume: 'Lᵀ', text: { ro: 'transpusa lui L, al doilea factor', en: 'the transpose of L, the second factor' }, tablou: din(n, n, (i, j) => la(L, j, i)) },
      ]
    }
    case 'QR':
    case 'SQR': {
      const A = matrice(s, 'A')
      const beta = vector(s, 'β')
      if (!A || !beta) return []
      const { m, n } = A
      const R = din(m, n, (i, j) => (i < c && j >= i ? la(A, i, j) : 0))
      // un vector Householder exista de cand β_k a fost scris (nenul)
      const nU = beta.d.filter((b) => b !== 0).length
      const U = din(m, nU, (i, j) => householder(A, beta, j).d[i])
      let Q = identitate(m)
      for (let j = 0; j < nU; j++) Q = produs(Q, reflector(householder(A, beta, j), beta.d[j]))
      const lista: Vedere[] = [{ nume: 'R', text: { ro: 'liniile terminate ale lui R, triunghiul superior', en: 'the finished rows of R, the upper triangle' }, tablou: R }]
      if (U.n > 0) lista.push({ nume: 'u', text: { ro: 'vectorii Householder u_k pe coloane: β_k pe diagonală, restul de sub diagonala lui A', en: 'the Householder vectors u_k as columns: β_k on the diagonal, the rest from below the diagonal of A' }, tablou: U })
      lista.push({ nume: 'Q', text: { ro: 'Q = U₁ ⋯ U_k, reconstruit din vectorii Householder: A = QR la final', en: 'Q = U₁ ⋯ U_k, rebuilt from the Householder vectors: A = QR at the end' }, tablou: Q })
      return lista
    }
    case 'RFG': {
      const x = vector(s, 'x')
      const beta = scalari['β']
      const kk = typeof intrari.k === 'number' ? intrari.k : 1
      if (!x || !beta) return []
      const u = vectorDin(x.d.map((v, i) => (i + 1 < kk ? 0 : i + 1 === kk ? beta : v)))
      return [{ nume: 'U', text: { ro: 'U_k = I − uuᵀ/β, reflectorul ca matrice; algoritmul nu îl formează, îl aplică prin u și β', en: 'U_k = I − uuᵀ/β, the reflector as a matrix; the algorithm never forms it, it applies it through u and β' }, tablou: reflector(u, beta) }]
    }
    case 'MPI': {
      const A = matrice(s, 'A')
      const mu = scalari['μ']
      if (!A || mu === undefined) return []
      return [{ nume: 'μI−A', text: { ro: 'matricea sistemului (μI − A) z = y la iterația curentă, înainte de eliminare', en: 'the matrix of the system (μI − A) z = y at the current iteration, before the elimination' }, tablou: din(A.n, A.n, (i, j) => (i === j ? mu : 0) - la(A, i, j)) }]
    }
    case 'JACOBI':
    case 'GS': {
      const A = matrice(s, 'A')
      const b = vector(s, 'b')
      if (!A || !b) return []
      const metoda = id === 'JACOBI' ? 'jacobi' : 'gs'
      const B = matriceDin(matriceIteratie(linii(A), metoda))
      const cc = id === 'JACOBI' ? vectorDin(b.d.map((v, i) => v / la(A, i, i))) : rezolva(inferior(A, true), b)
      const lista: Vedere[] = [
        {
          nume: 'B',
          text: id === 'JACOBI' ? { ro: 'B = D⁻¹N, matricea de iterație: x⁽ᵏ⁺¹⁾ = Bx⁽ᵏ⁾ + c', en: 'B = D⁻¹N, the iteration matrix: x⁽ᵏ⁺¹⁾ = Bx⁽ᵏ⁾ + c' } : { ro: 'B = L⁻¹U, matricea de iterație: x⁽ᵏ⁺¹⁾ = Bx⁽ᵏ⁾ + c', en: 'B = L⁻¹U, the iteration matrix: x⁽ᵏ⁺¹⁾ = Bx⁽ᵏ⁾ + c' },
          tablou: B,
        },
      ]
      if (cc) lista.push({ nume: 'c', text: id === 'JACOBI' ? { ro: 'c = D⁻¹b', en: 'c = D⁻¹b' } : { ro: 'c = L⁻¹b', en: 'c = L⁻¹b' }, tablou: cc })
      return lista
    }
    default:
      return []
  }
}
