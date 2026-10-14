// Algebra liniara marunta pentru verificari: produse, transpuse, norme pe tablouri cu indici
// de la 1 (aceleasi structuri ca in valori.ts).
import { citeste, matriceNoua, scrie, vectorNou, type Matrice, type Vector } from './valori'

export function transpusa(A: Matrice): Matrice {
  const T = matriceNoua(A.n, A.m)
  for (let i = 1; i <= A.m; i++) for (let j = 1; j <= A.n; j++) scrie(T, citeste(A, i, j), j, i)
  return T
}

export function produs(A: Matrice, B: Matrice): Matrice {
  if (A.n !== B.m) throw new Error(`produs ${A.m}x${A.n} cu ${B.m}x${B.n}`)
  const C = matriceNoua(A.m, B.n)
  for (let i = 1; i <= A.m; i++)
    for (let j = 1; j <= B.n; j++) {
      let s = 0
      for (let k = 1; k <= A.n; k++) s += citeste(A, i, k) * citeste(B, k, j)
      scrie(C, s, i, j)
    }
  return C
}

export function matvec(A: Matrice, x: Vector): Vector {
  if (A.n !== x.n) throw new Error(`matvec ${A.m}x${A.n} cu ${x.n}`)
  const y = vectorNou(A.m)
  for (let i = 1; i <= A.m; i++) {
    let s = 0
    for (let j = 1; j <= A.n; j++) s += citeste(A, i, j) * x.d[j - 1]
    y.d[i - 1] = s
  }
  return y
}

export function identitate(n: number): Matrice {
  const I = matriceNoua(n, n)
  for (let i = 1; i <= n; i++) scrie(I, 1, i, i)
  return I
}

export function diferenta(A: Matrice | Vector, B: Matrice | Vector): number[] {
  if (A.d.length !== B.d.length) throw new Error('diferență între tablouri de mărimi diferite')
  return A.d.map((x, k) => x - B.d[k])
}

export const normaMax = (d: number[]): number => d.reduce((m, x) => Math.max(m, Math.abs(x)), 0)

export const norma2 = (d: number[]): number => Math.sqrt(d.reduce((s, x) => s + x * x, 0))

// Partea de sub diagonala (cu diagonala daca `cuDiagonala`), restul zero; `unitate` pune 1 pe diagonala.
export function inferior(A: Matrice, cuDiagonala: boolean, unitate = false): Matrice {
  const L = matriceNoua(A.m, A.n)
  for (let i = 1; i <= A.m; i++)
    for (let j = 1; j <= A.n; j++) {
      if (j < i || (j === i && cuDiagonala)) scrie(L, citeste(A, i, j), i, j)
      if (j === i && unitate) scrie(L, 1, i, j)
    }
  return L
}

export function superior(A: Matrice, cuDiagonala: boolean, unitate = false): Matrice {
  const U = matriceNoua(A.m, A.n)
  for (let i = 1; i <= A.m; i++)
    for (let j = 1; j <= A.n; j++) {
      if (j > i || (j === i && cuDiagonala)) scrie(U, citeste(A, i, j), i, j)
      if (j === i && unitate) scrie(U, 1, i, j)
    }
  return U
}

// Solutia lui Ax = b prin eliminare gaussiana cu pivotare partiala; null daca A e singulara.
export function rezolva(A: Matrice, b: Vector): Vector | null {
  const n = A.n
  if (A.m !== n || b.n !== n) return null
  const T = { ...A, d: [...A.d] }
  const x = vectorNou(n)
  x.d = [...b.d]
  for (let k = 1; k <= n; k++) {
    let p = k
    for (let i = k + 1; i <= n; i++) if (Math.abs(citeste(T, i, k)) > Math.abs(citeste(T, p, k))) p = i
    if (citeste(T, p, k) === 0) return null
    for (let j = 1; j <= n; j++) {
      const t = citeste(T, k, j)
      scrie(T, citeste(T, p, j), k, j)
      scrie(T, t, p, j)
    }
    ;[x.d[k - 1], x.d[p - 1]] = [x.d[p - 1], x.d[k - 1]]
    for (let i = k + 1; i <= n; i++) {
      const mu = citeste(T, i, k) / citeste(T, k, k)
      for (let j = k; j <= n; j++) scrie(T, citeste(T, i, j) - mu * citeste(T, k, j), i, j)
      x.d[i - 1] -= mu * x.d[k - 1]
    }
  }
  for (let i = n; i >= 1; i--) {
    for (let j = i + 1; j <= n; j++) x.d[i - 1] -= citeste(T, i, j) * x.d[j - 1]
    x.d[i - 1] /= citeste(T, i, i)
  }
  return x
}

export function coloana(A: Matrice, j: number): Vector {
  const v = vectorNou(A.m)
  for (let i = 1; i <= A.m; i++) v.d[i - 1] = citeste(A, i, j)
  return v
}

// I - u u^T / beta, reflectorul Householder cu vectorul u de lungime m.
export function reflector(u: Vector, beta: number): Matrice {
  const H = identitate(u.n)
  if (beta === 0) return H
  for (let i = 1; i <= u.n; i++) for (let j = 1; j <= u.n; j++) scrie(H, citeste(H, i, j) - (u.d[i - 1] * u.d[j - 1]) / beta, i, j)
  return H
}
