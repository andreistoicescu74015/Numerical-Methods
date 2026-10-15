// Teste de logica: fiecare algoritm din biblioteca ruleaza prin interpretor pe matrice aleatoare
// (cu samanta fixa) de mai multe marimi, iar rezultatul trebuie sa satisfaca identitatile de
// algebra liniara pe care le promite: LU = A, LLᵀ = A, QR = A, QᵀQ = I, Ax = b, Aᵀ(b - Ax) = 0...
// Identitatile se calculeaza cu functiile din tests/ajutor.ts, scrise separat de motor.
import { describe, expect, it } from 'vitest'
import { algoritm } from '../src/motor/biblioteca'
import { stareLa, urma, type Intrari } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import {
  abatere,
  abatereV,
  aleatoare,
  banda,
  coloana,
  cuSpectru,
  det,
  dominanta,
  generator,
  inferioara,
  matrice,
  maxim,
  norma,
  ori,
  ortogonala,
  peVector,
  pozitivDefinita,
  ruleaza,
  superioara,
  transpusa,
  unitate,
  vec,
  vector,
  type M,
} from './ajutor'

const MARIMI = [1, 2, 3, 5, 8]
const SEMINTE = [11, 12, 13]
const TOL = 1e-9

// cate un caz pentru fiecare marime si samanta
function pentruFiecare(f: (n: number, rnd: () => number, eticheta: string) => void, marimi = MARIMI): void {
  for (const n of marimi) for (const s of SEMINTE) f(n, generator(1000 * n + s), `n = ${n}, sămânța ${s}`)
}

describe('produse', () => {
  it('matvec: y = Ax, A e_j este coloana j, A·0 = 0 și liniaritatea', () => {
    pentruFiecare((n, rnd, unde) => {
      const m = n + 2
      const A = aleatoare(m, n, rnd)
      const x = vector(n, rnd)
      const z = vector(n, rnd)
      const y = vec(ruleaza('matvec', { A, x }), 'y')
      expect(abatereV(y, peVector(A, x)), unde).toBeLessThan(TOL)
      for (let j = 0; j < n; j++) expect(abatereV(vec(ruleaza('matvec', { A, x: unitate(n)[j] }), 'y'), coloana(A, j)), `${unde}, e_${j + 1}`).toBe(0)
      expect(vec(ruleaza('matvec', { A, x: x.map(() => 0) }), 'y').every((v) => v === 0), unde).toBe(true)
      const suma = vec(ruleaza('matvec', { A, x: x.map((v, i) => 2 * v + z[i]) }), 'y')
      const Az = vec(ruleaza('matvec', { A, x: z }), 'y')
      expect(abatereV(suma, y.map((v, i) => 2 * v + Az[i])), unde).toBeLessThan(TOL)
    })
  })

  it('matmul: AI = A, IA = A, (AB)x = A(Bx) și (AB)ᵀ = BᵀAᵀ', () => {
    pentruFiecare((n, rnd, unde) => {
      const A = aleatoare(n + 1, n, rnd)
      const B = aleatoare(n, n + 2, rnd)
      const x = vector(n + 2, rnd)
      const C = matrice(ruleaza('matmul', { A, B }), 'C')
      expect(abatere(matrice(ruleaza('matmul', { A, B: unitate(n) }), 'C'), A), unde).toBe(0)
      expect(abatere(matrice(ruleaza('matmul', { A: unitate(n + 1), B: A }), 'C'), A), unde).toBe(0)
      expect(abatereV(peVector(C, x), peVector(A, peVector(B, x))), unde).toBeLessThan(TOL)
      expect(abatere(transpusa(C), matrice(ruleaza('matmul', { A: transpusa(B), B: transpusa(A) }), 'C')), unde).toBeLessThan(TOL)
    })
  })
})

describe('sisteme triunghiulare', () => {
  it('LTRIS și UTRIS: Lx = b, Ux = b; cu matricea unitate x = b, cu una diagonală x_i = b_i / d_i', () => {
    pentruFiecare((n, rnd, unde) => {
      const A = dominanta(n, rnd)
      const b = vector(n, rnd)
      const L = inferioara(A, false)
      const U = superioara(A, false)
      const xl = vec(ruleaza('LTRIS', { L, b }), 'x')
      const xu = vec(ruleaza('UTRIS', { U, b }), 'x')
      expect(abatereV(peVector(L, xl), b), unde).toBeLessThan(TOL)
      expect(abatereV(peVector(U, xu), b), unde).toBeLessThan(TOL)
      expect(abatereV(vec(ruleaza('LTRIS', { L: unitate(n), b }), 'x'), b), unde).toBe(0)
      expect(abatereV(vec(ruleaza('UTRIS', { U: unitate(n), b }), 'x'), b), unde).toBe(0)
      const D = unitate(n).map((r, i) => r.map((e) => e * A[i][i]))
      expect(abatereV(vec(ruleaza('LTRIS', { L: D, b }), 'x'), b.map((v, i) => v / A[i][i])), unde).toBe(0)
      expect(abatereV(vec(ruleaza('UTRIS', { U: D, b }), 'x'), b.map((v, i) => v / A[i][i])), unde).toBe(0)
    })
  })
})

describe('eliminare gaussiană și factorizări', () => {
  it('G: LU = A cu L unitate din multiplicatori, det A = produsul pivoților, o matrice superior triunghiulară rămâne neschimbată', () => {
    pentruFiecare((n, rnd, unde) => {
      const A = dominanta(n, rnd)
      const F = matrice(ruleaza('G', { A }), 'A')
      expect(abatere(ori(inferioara(F, true), superioara(F, false)), A), unde).toBeLessThan(TOL * Math.max(1, maxim(A)))
      if (n <= 4) expect(Math.abs(F.reduce((p, r, i) => p * r[i], 1) - det(A)), unde).toBeLessThan(TOL * Math.max(1, Math.abs(det(A))))
      const U = superioara(A, false)
      expect(abatere(matrice(ruleaza('G', { A: U }), 'A'), U), unde).toBe(0)
    })
  })

  it('GPP: multiplicatorii au modulul cel mult 1, M_{n-1}P_{n-1}···M_1P_1 A = U și det A = ± produsul pivoților', () => {
    pentruFiecare((n, rnd, unde) => {
      const A = aleatoare(n, n, rnd)
      const rez = ruleaza('GPP', { A })
      const F = matrice(rez, 'A')
      const p = vec(rez, 'p')
      for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) expect(Math.abs(F[i][j]), unde).toBeLessThanOrEqual(1)
      const T = A.map((r) => [...r])
      let schimbari = 0
      for (let k = 0; k < n - 1; k++) {
        expect(p[k], unde).toBeGreaterThanOrEqual(k + 1)
        const ik = p[k] - 1
        if (ik !== k) schimbari++
        ;[T[k], T[ik]] = [T[ik], T[k]]
        for (let i = k + 1; i < n; i++) for (let j = 0; j < n; j++) T[i][j] -= F[i][k] * T[k][j]
      }
      expect(abatere(T, superioara(F, false)), unde).toBeLessThan(TOL)
      if (n <= 4) expect(Math.abs((schimbari % 2 ? -1 : 1) * F.reduce((q, r, i) => q * r[i], 1) - det(A)), unde).toBeLessThan(TOL)
    })
  })

  it('S_GPP: Ax = b; dacă b = A x₀, soluția este x₀; cu A = I soluția este b', () => {
    pentruFiecare((n, rnd, unde) => {
      // matrice oarecare, nu diagonal dominanta: pivotarea chiar schimba linii
      const A = aleatoare(n, n, rnd)
      const x0 = vector(n, rnd)
      const b = peVector(A, x0)
      const x = vec(ruleaza('S_GPP', { A, b }), 'x')
      expect(abatereV(peVector(A, x), b), unde).toBeLessThan(TOL * Math.max(1, maxim([b])))
      expect(abatereV(x, x0), unde).toBeLessThan(1e-6)
      expect(abatereV(vec(ruleaza('S_GPP', { A: unitate(n), b }), 'x'), b), unde).toBe(0)
      // matricea unitate cu liniile in ordine inversa: fiecare pas interschimba, iar x este b rasturnat
      const rasturnata = unitate(n).reverse()
      expect(abatereV(vec(ruleaza('S_GPP', { A: rasturnata, b }), 'x'), [...b].reverse()), unde).toBe(0)
    })
  })

  it('LU Crout: LU = A cu U unitate; factorii se obțin din cei ai lui G prin scalarea cu pivoții', () => {
    pentruFiecare((n, rnd, unde) => {
      const A = dominanta(n, rnd)
      const F = matrice(ruleaza('LU', { A }), 'A')
      expect(abatere(ori(inferioara(F, false), superioara(F, true)), A), unde).toBeLessThan(TOL * Math.max(1, maxim(A)))
      // A = L_G U_G = (L_G D)(D⁻¹ U_G), cu D diagonala lui U_G: factorizarea LDU e unica
      const G = matrice(ruleaza('G', { A }), 'A')
      const dinG = G.map((r, i) => r.map((a, j) => (j < i ? a * G[j][j] : j === i ? a : a / G[i][i])))
      expect(abatere(F, dinG), unde).toBeLessThan(TOL * Math.max(1, maxim(A)))
    })
  })

  it('Cholesky: LLᵀ = A, diagonala lui L este pozitivă, det A = produsul pătratelor ei; o matrice diagonală dă radicalii', () => {
    pentruFiecare((n, rnd, unde) => {
      const A = pozitivDefinita(n, rnd)
      const rez = ruleaza('CHOL', { A })
      expect(rez.final, unde).toBe('gata')
      const L = inferioara(matrice(rez, 'A'), false)
      expect(abatere(ori(L, transpusa(L)), A), unde).toBeLessThan(TOL * Math.max(1, maxim(A)))
      L.forEach((r, i) => expect(r[i], unde).toBeGreaterThan(0))
      if (n <= 4) expect(Math.abs(L.reduce((q, r, i) => q * r[i] * r[i], 1) - det(A)), unde).toBeLessThan(TOL * Math.abs(det(A)))
      const D = unitate(n).map((r, i) => r.map((e) => e * (i + 2)))
      expect(abatere(inferioara(matrice(ruleaza('CHOL', { A: D }), 'A'), false), D.map((r) => r.map(Math.sqrt))), unde).toBe(0)
    })
  })

  it('Cholesky se oprește pe o matrice simetrică fără să fie pozitiv definită', () => {
    pentruFiecare((n, rnd, unde) => {
      const A = pozitivDefinita(n, rnd).map((r) => r.map((a) => -a))
      expect(ruleaza('CHOL', { A }).final, unde).toBe('stop')
      // o valoare proprie negativa ascunsa: 5, 2 si -1 pe o baza ortogonala oarecare
      if (n >= 3) expect(ruleaza('CHOL', { A: cuSpectru([5, 2, -1, ...Array(n - 3).fill(1)], rnd) }).final, unde).toBe('stop')
    })
  })
})

describe('transformări ortogonale', () => {
  // Vectorul Householder al pasului k, cum il lasa Algoritmul QR: zerouri pana la k, β_k pe
  // pozitia k si, sub ea, ce a ramas in coloana k a lui A.
  const householder = (F: M, beta: number[], k: number): number[] => F.map((r, i) => (i < k ? 0 : i === k ? beta[k] : r[k]))

  // Q = U_1 U_2 ··· U_s
  function q(F: M, beta: number[], m: number): M {
    let Q = unitate(m)
    for (let k = 0; k < beta.length; k++) {
      if (beta[k] === 0) continue
      const u = householder(F, beta, k)
      Q = ori(Q, unitate(m).map((r, i) => r.map((e, j) => e - (u[i] * u[j]) / beta[k])))
    }
    return Q
  }

  it('QR: QR = A, QᵀQ = I, coloanele păstrează norma, vectorii Householder sunt cei scalați (‖u_k‖² = 2β_k, 1 ≤ β_k ≤ 2); pentru m > n, m = n și m < n', () => {
    pentruFiecare((n, rnd, unde) => {
      for (const m of [n + 3, n, Math.max(1, n - 1)]) {
        const A = aleatoare(m, n, rnd)
        const rez = ruleaza('QR', { A })
        const F = matrice(rez, 'A')
        const beta = vec(rez, 'β')
        const R = superioara(F, false)
        const Q = q(F, beta, m)
        const loc = `${unde}, ${m} x ${n}`
        expect(beta, loc).toHaveLength(Math.min(m - 1, n))
        expect(abatere(ori(Q, R), A), loc).toBeLessThan(TOL)
        expect(abatere(ori(transpusa(Q), Q), unitate(m)), loc).toBeLessThan(TOL)
        for (let j = 0; j < n; j++) expect(Math.abs(norma(coloana(R, j)) - norma(coloana(A, j))), loc).toBeLessThan(TOL)
        beta.forEach((b, k) => {
          expect(b, loc).toBeGreaterThanOrEqual(1)
          expect(b, loc).toBeLessThanOrEqual(2)
          expect(Math.abs(norma(householder(F, beta, k)) ** 2 - 2 * b), loc).toBeLessThan(TOL)
        })
      }
    })
  })

  it('QR pe o coloană deja nulă sub diagonală cu a_kk = 0 sare peste reflector; pe exemplul din curs dă valorile de pe slide', () => {
    const nul = ruleaza('QR', { A: [[0, 1], [0, 2], [0, 3]] })
    expect(vec(nul, 'β')[0]).toBe(0)
    expect(coloana(matrice(nul, 'A'), 0)).toEqual([0, 0, 0])
    const curs = ruleaza('QR', { A: [[2, 3], [-1, 1], [2, -1]] })
    const F = matrice(curs, 'A')
    expect(abatereV(vec(curs, 'β'), [5 / 3, 1 + 1.8 / Math.sqrt(10)])).toBeLessThan(TOL)
    expect(abatere(F, [[-3, -1], [-1 / 3, -Math.sqrt(10)], [2 / 3, -2.6 / Math.sqrt(10)]])).toBeLessThan(TOL)
  })

  it('SQR: reziduul e ortogonal pe coloanele lui A, r este norma lui, orice alt x dă un reziduu mai mare; un sistem compatibil dă soluția lui', () => {
    pentruFiecare((n, rnd, unde) => {
      const m = n + 3
      const A = aleatoare(m, n, rnd)
      const b = vector(m, rnd)
      const rez = ruleaza('SQR', { A, b })
      const x = vec(rez, 'x')
      const reziduu = b.map((v, i) => v - peVector(A, x)[i])
      expect(Math.max(...peVector(transpusa(A), reziduu).map(Math.abs)), unde).toBeLessThan(TOL)
      expect(Math.abs(norma(reziduu) - rez.scalari.r), unde).toBeLessThan(TOL)
      for (let k = 0; k < 5; k++) {
        const altul = x.map((v) => v + 0.1 * (2 * rnd() - 1))
        expect(norma(b.map((v, i) => v - peVector(A, altul)[i])), unde).toBeGreaterThan(rez.scalari.r)
      }
      const x0 = vector(n, rnd)
      const compatibil = ruleaza('SQR', { A, b: peVector(A, x0) })
      expect(abatereV(vec(compatibil, 'x'), x0), unde).toBeLessThan(1e-8)
      expect(compatibil.scalari.r, unde).toBeLessThan(1e-8)
    })
  })

  it('RFG: U_k x = (x_1, ..., x_{k-1}, -σ, 0, ..., 0), U_k ortogonală și simetrică, β între 1 și 2', () => {
    pentruFiecare(
      (m, rnd, unde) => {
        for (let k = 1; k <= m; k++) {
          const x0 = vector(m, rnd)
          const rez = ruleaza('RFG', { x: x0, k })
          const x = vec(rez, 'x')
          const beta = rez.scalari.β
          const loc = `${unde}, k = ${k}`
          if (k === m) {
            // nu e nimic de anulat: reflectorul este matricea unitate
            expect(beta, loc).toBe(0)
            expect(abatereV(x, x0), loc).toBe(0)
            continue
          }
          expect(beta, loc).toBeGreaterThanOrEqual(1)
          expect(beta, loc).toBeLessThanOrEqual(2)
          const u = x.map((v, i) => (i + 1 < k ? 0 : i + 1 === k ? beta : v))
          const U = unitate(m).map((r, i) => r.map((e, j) => e - (u[i] * u[j]) / beta))
          const asteptat = x0.map((v, i) => (i + 1 < k ? v : i + 1 === k ? x[i] : 0))
          expect(abatereV(peVector(U, x0), asteptat), loc).toBeLessThan(TOL)
          expect(Math.abs(Math.abs(x[k - 1]) - norma(x0.slice(k - 1))), loc).toBeLessThan(TOL)
          expect(abatere(ori(transpusa(U), U), unitate(m)), loc).toBeLessThan(TOL)
          expect(abatere(U, transpusa(U)), loc).toBeLessThan(TOL)
        }
        expect(ruleaza('RFG', { x: [1, 0, 0], k: 2 }).scalari.β, unde).toBe(0)
      },
      [2, 3, 5],
    )
  })
})

describe('metode iterative', () => {
  const intrari = (A: M, b: number[], tol: number, maxiter: number): Intrari => ({ A, b, x: b.map(() => 0), tol, maxiter })

  it('Jacobi și Gauss-Seidel converg pe matrice strict diagonal dominante: reziduul relativ ajunge sub tol și x se apropie de soluție', () => {
    pentruFiecare(
      (n, rnd, unde) => {
        const A = dominanta(n, rnd)
        const x0 = vector(n, rnd)
        const b = peVector(A, x0)
        for (const id of ['JACOBI', 'GS']) {
          const rez = ruleaza(id, intrari(A, b, 1e-10, 2000))
          expect(rez.final, `${id}, ${unde}`).toBe('gata')
          const x = vec(rez, 'x')
          expect(norma(peVector(A, x).map((v, i) => v - b[i])) / norma(b), `${id}, ${unde}`).toBeLessThanOrEqual(1e-10)
          expect(abatereV(x, x0), `${id}, ${unde}`).toBeLessThan(1e-7)
        }
      },
      [2, 3, 5, 8],
    )
  })

  it('cazuri limită: Jacobi rezolvă într-o iterație un sistem diagonal, Gauss-Seidel unul inferior triunghiular', () => {
    pentruFiecare(
      (n, rnd, unde) => {
        const A = dominanta(n, rnd)
        const b = vector(n, rnd)
        const D = unitate(n).map((r, i) => r.map((e) => e * A[i][i]))
        const jacobi = ruleaza('JACOBI', intrari(D, b, 1e-12, 5))
        expect(jacobi.scalari.k, unde).toBe(1)
        expect(abatereV(vec(jacobi, 'x'), b.map((v, i) => v / A[i][i])), unde).toBe(0)
        const L = inferioara(A, false)
        const gs = ruleaza('GS', intrari(L, b, 1e-12, 5))
        expect(gs.scalari.k, unde).toBe(1)
        expect(abatereV(vec(gs, 'x'), vec(ruleaza('LTRIS', { L, b }), 'x')), unde).toBeLessThan(TOL)
      },
      [2, 3, 5],
    )
  })

  it('Gauss-Seidel converge pe matrice simetrice pozitiv definite, chiar dacă nu sunt diagonal dominante', () => {
    pentruFiecare(
      (n, rnd, unde) => {
        // B Bᵀ + I/2: pozitiv definita, cu elemente mari in afara diagonalei
        const B = aleatoare(n, n, rnd)
        const A = ori(B, transpusa(B)).map((r, i) => r.map((a, j) => a + (i === j ? 0.5 : 0)))
        for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) A[i][j] = A[j][i]
        const b = vector(n, rnd)
        const rez = ruleaza('GS', intrari(A, b, 1e-8, 20000))
        expect(rez.final, unde).toBe('gata')
        expect(norma(peVector(A, vec(rez, 'x')).map((v, i) => v - b[i])) / norma(b), unde).toBeLessThanOrEqual(1e-8)
      },
      [2, 3, 4],
    )
  })

  it('fără convergență, bucla se oprește la maxiter: raza spectrală a iterației Jacobi este √6 pentru [1 2; 3 1]', () => {
    const rez = ruleaza('JACOBI', intrari([[1, 2], [3, 1]], [1, 1], 1e-6, 30))
    expect(rez.final).toBe('stop')
    expect(rez.scalari.k).toBe(30)
    expect(rez.scalari.e).toBeGreaterThan(1e6)
  })

  it('Kaczmarz: după pasul pe linia i ecuația i este satisfăcută; un sistem compatibil dă soluția lui; cu linii ortogonale ajunge o trecere', () => {
    pentruFiecare(
      (n, rnd, unde) => {
        const A = [...dominanta(n, rnd), ...aleatoare(2, n, rnd)]
        const x0 = vector(n, rnd)
        const b = peVector(A, x0)
        const rez = ruleaza('KACZMARZ', { A, b, x: x0.map(() => 0), tol: 1e-9, maxiter: 5000 })
        expect(rez.final, unde).toBe('gata')
        expect(abatereV(vec(rez, 'x'), x0), unde).toBeLessThan(1e-6)
        rez.pasi.forEach((p, idx) => {
          if (p.linie !== 6 || idx > 400) return
          const i = p.scalari.i - 1
          const x = stareLa(rez, idx).x.d
          expect(Math.abs(A[i].reduce((s, a, j) => s + a * x[j], 0) - b[i]), `${unde}, pasul ${idx}`).toBeLessThan(TOL)
        })
        const Q = ortogonala(n, rnd)
        const drept = ruleaza('KACZMARZ', { A: Q, b: peVector(Q, x0), x: x0.map(() => 0), tol: 1e-12, maxiter: 5 })
        expect(drept.scalari.k, unde).toBe(1)
        expect(abatereV(vec(drept, 'x'), x0), unde).toBeLessThan(TOL)
      },
      [2, 3, 5],
    )
  })

  it('Kaczmarz: un pas scade pătratul erorii cu (a_iᵀe)²/‖a_i‖², deci un pas pe o linie perpendiculară pe eroare nu o schimbă', () => {
    const eroare2 = (x: number[], xs: number[]) => x.reduce((s, v, j) => s + (v - xs[j]) ** 2, 0)
    pentruFiecare(
      (n, rnd, unde) => {
        const A = [...dominanta(n, rnd), ...aleatoare(2, n, rnd)]
        const xs = vector(n, rnd)
        const rez = ruleaza('KACZMARZ', { A, b: peVector(A, xs), x: xs.map(() => 0), tol: 1e-9, maxiter: 50 })
        let inainte = xs.map(() => 0)
        rez.pasi.forEach((p, idx) => {
          if (p.linie !== 6 || idx > 400) return
          const a = A[p.scalari.i - 1]
          const e = inainte.map((v, j) => v - xs[j])
          const dupa = stareLa(rez, idx).x.d
          const scadere = a.reduce((s, v, j) => s + v * e[j], 0) ** 2 / a.reduce((s, v) => s + v * v, 0)
          expect(Math.abs(eroare2(dupa, xs) - (eroare2(inainte, xs) - scadere)), `${unde}, pasul ${idx}`).toBeLessThan(TOL)
          inainte = [...dupa]
        })
      },
      [2, 3, 5],
    )
    // eroarea de pornire (0, 0, 1) este perpendiculara pe primele doua linii: primii doi pasi nu o schimba
    const A = [[1, 0, 0], [0, 1, 0], [1, 1, 1]]
    const xs = [1, 2, 3]
    const rez = ruleaza('KACZMARZ', { A, b: peVector(A, xs), x: [1, 2, 4], tol: 1e-12, maxiter: 3 })
    const pasi = rez.pasi.map((p, idx) => [p, idx] as const).filter(([p]) => p.linie === 6)
    expect(eroare2(stareLa(rez, pasi[0][1]).x.d, xs)).toBeCloseTo(1, 12)
    expect(eroare2(stareLa(rez, pasi[1][1]).x.d, xs)).toBeCloseTo(1, 12)
    expect(eroare2(stareLa(rez, pasi[2][1]).x.d, xs)).toBeCloseTo(2 / 3, 12)
  })
})

describe('metoda puterii', () => {
  it('găsește valoarea proprie dominantă a unei matrice cu spectru cunoscut, și când e negativă: Ay = λy, ‖y‖ = 1', () => {
    pentruFiecare(
      (n, rnd, unde) => {
        for (const dominanta of [5, -5]) {
          const spectru = [dominanta, 2, ...Array.from({ length: n - 2 }, (_, k) => 1 / (k + 1))]
          const A = cuSpectru(spectru, rnd)
          const rez = ruleaza('MP', { A, y: vector(n, rnd), tol: 1e-13, maxiter: 500 })
          expect(rez.final, unde).toBe('gata')
          const y = vec(rez, 'y')
          const Ay = peVector(A, y)
          const lambda = y.reduce((s, v, i) => s + v * Ay[i], 0)
          expect(Math.abs(lambda - dominanta), unde).toBeLessThan(1e-6)
          expect(norma(Ay.map((v, i) => v - lambda * y[i])), unde).toBeLessThan(1e-5)
          expect(Math.abs(norma(y) - 1), unde).toBeLessThan(TOL)
        }
      },
      [2, 3, 5, 8],
    )
  })

  it('cu cât |λ₂/λ₁| e mai aproape de 1, cu atât are nevoie de mai multe iterații', () => {
    pentruFiecare(
      (n, rnd, unde) => {
        const y = vector(n, rnd)
        const restul = Array.from({ length: n - 2 }, () => 0.5)
        const samanta = Math.floor(rnd() * 1e6)
        const iteratii = (lambda2: number) => ruleaza('MP', { A: cuSpectru([5, lambda2, ...restul], generator(samanta)), y, tol: 1e-10, maxiter: 5000 }).scalari.i
        const [repede, mediu, incet] = [1, 3, 4.5].map(iteratii)
        expect(repede, unde).toBeLessThan(mediu)
        expect(mediu, unde).toBeLessThan(incet)
      },
      [3, 5],
    )
  })

  it('pe o matrice diagonală ajunge la vectorul unitate al celui mai mare element', () => {
    const rez = ruleaza('MP', { A: [[3, 0], [0, 1]], y: [1, 1], tol: 1e-14, maxiter: 200 })
    expect(Math.abs(vec(rez, 'y')[0])).toBeCloseTo(1, 6)
    expect(Math.abs(vec(rez, 'y')[1])).toBeLessThan(1e-6)
  })
})

describe('matrice bandă', () => {
  const LATIMI: [number, number][] = [
    [1, 1],
    [2, 1],
    [1, 3],
    [0, 2],
  ]

  it('Gb dă exact ce dă G pe o matrice bandă, cu mai puțini flopi, iar zerourile din afara benzii rămân zero', () => {
    pentruFiecare((n, rnd, unde) => {
      for (const [r, q] of LATIMI) {
        const A = banda(n, r, q, rnd)
        const g = ruleaza('G', { A })
        const gb = ruleaza('Gb', { A, r, q })
        const F = matrice(gb, 'A')
        // la fel pana la ultimul bit; G scrie -0 unde Gb lasa 0, iar abaterea le socoteste egale
        expect(abatere(F, matrice(g, 'A')), `${unde}, r = ${r}, q = ${q}`).toBe(0)
        expect(gb.flopi).toBeLessThanOrEqual(g.flopi)
        F.forEach((l, i) => l.forEach((x, j) => (i - j > r || j - i > q ? expect(x).toBe(0) : undefined)))
      }
    })
  })

  it('GPPb dă exact ce dă GPP pe o matrice bandă; U are cel mult q + r diagonale deasupra diagonalei principale', () => {
    pentruFiecare((n, rnd, unde) => {
      for (const [r, q] of LATIMI) {
        const A = aleatoare(n, n, rnd).map((l, i) => l.map((x, j) => (i - j > r || j - i > q ? 0 : x)))
        const gpp = ruleaza('GPP', { A })
        const gppb = ruleaza('GPPb', { A, r, q })
        const loc = `${unde}, r = ${r}, q = ${q}`
        expect(abatere(matrice(gppb, 'A'), matrice(gpp, 'A')), loc).toBe(0)
        expect(vec(gppb, 'p'), loc).toEqual(vec(gpp, 'p'))
        matrice(gppb, 'A').forEach((l, i) => l.forEach((x, j) => (j - i > q + r ? expect(x, loc).toBe(0) : undefined)))
      }
    })
  })

  it('UTRISb dă exact ce dă UTRIS pe o matrice superior triunghiulară bandă, iar flopii sunt n(2q + 1) pentru n mare', () => {
    pentruFiecare((n, rnd, unde) => {
      for (const q of [0, 1, 2]) {
        const U = superioara(banda(n, 0, q, rnd), false)
        const b = vector(n, rnd)
        const bandaRez = ruleaza('UTRISb', { U, b, q })
        expect(abatereV(vec(bandaRez, 'x'), vec(ruleaza('UTRIS', { U, b }), 'x')), unde).toBe(0)
        expect(abatereV(peVector(U, vec(bandaRez, 'x')), b), unde).toBeLessThan(TOL * Math.max(1, maxim([b])))
      }
    })
    const U = superioara(banda(40, 0, 1, generator(4)), false)
    expect(ruleaza('UTRISb', { U, b: vector(40, generator(5)), q: 1 }).flopi).toBe(3 * 40 - 2)
  })
})

describe('aritmetică cu t cifre', () => {
  const rulat = (id: string, intrari: Intrari, cifre?: number) => urma(parseaza(algoritm(id)!.sursa), intrari, { cifre })
  const exemplu = { A: [[0.0001, 1], [1, 1]], b: [1, 2] }

  it('exemplul din curs cu pivotul 10⁻⁴: cu 3 cifre, fără pivotare iese x = (0, 1), soluție falsă; cu pivotare x = (1, 1)', () => {
    expect(rulat('S_G', exemplu, 3).stare.x.d).toEqual([0, 1])
    expect(rulat('S_GPP', exemplu, 3).stare.x.d).toEqual([1, 1])
    // in dubla precizie amandoua dau solutia exacta, x₁ = 1.0001..., x₂ = 0.9999...
    for (const id of ['S_G', 'S_GPP']) {
      const x = rulat(id, exemplu).stare.x.d
      expect(x[0]).toBeCloseTo(1.00010001, 7)
      expect(x[1]).toBeCloseTo(0.99989999, 7)
    }
  })

  it('cu 4 cifre, cât ar da formula preciziei de pe slide pentru 10⁻³, G fără pivotare dă x₁ = 1', () => {
    expect(rulat('S_G', exemplu, 4).stare.x.d).toEqual([1, 0.9999])
  })

  it('fiecare operație și fiecare intrare se rotunjesc la t cifre semnificative', () => {
    const r = urma(parseaza('s ← a / 3\nt ← s * 3\nu ← x^T x'), { a: 1, x: [1.23456, 2] }, { cifre: 3 })
    expect(r.scalari.s).toBe(0.333)
    expect(r.scalari.t).toBe(0.999)
    // x₁ intra rotunjit la 1.23, iar 1.23² = 1.5129 se rotunjeste la 1.51 inainte de adunare
    expect(r.scalari.u).toBe(5.51)
    expect(r.stare.x.d).toEqual([1.23, 2])
  })

  it('cu precizie mare, rezultatele lui G se apropie de cele în dublă precizie', () => {
    const A = dominanta(6, generator(3))
    const exact = matrice(ruleaza('G', { A }), 'A')
    for (const [cifre, tol] of [
      [6, 1e-3],
      [10, 1e-7],
    ]) {
      const F = urma(parseaza(algoritm('G')!.sursa), { A }, { cifre }).stare.A
      const linii = Array.from({ length: 6 }, (_, i) => F.d.slice(6 * i, 6 * i + 6))
      expect(abatere(linii, exact)).toBeLessThan(tol * maxim(exact))
    }
  })
})
