// Estimatorul de complexitate: formula de cost din biblioteca (termenul dominant din curs),
// evaluata pentru intrarile date, fata de flopii numarati de interpretor. Trei verificari:
// formulele exacte coincid cu numaratoarea, estimarea se apropie de ea cand n creste, iar ordinul
// masurat prin dublarea lui n este cel din formula (n, n² sau n³).
import { describe, expect, it } from 'vitest'
import { BIBLIOTECA, algoritm, marimiDin } from '../src/motor/biblioteca'
import type { Intrari } from '../src/motor/interpretor'
import { aleatoare, banda, cuSpectru, dominanta, generator, inferioara, peVector, pozitivDefinita, ruleaza, superioara, vector } from './ajutor'

// intrari de marime n pentru fiecare algoritm, pe clasa de matrice pe care merge, si ordinul costului
const CAZURI: Record<string, { intrari: (n: number, rnd: () => number) => Intrari; ordin: number }> = {
  matvec: { intrari: (n, r) => ({ A: aleatoare(n, n, r), x: vector(n, r) }), ordin: 2 },
  matmul: { intrari: (n, r) => ({ A: aleatoare(n, n, r), B: aleatoare(n, n, r) }), ordin: 3 },
  LTRIS: { intrari: (n, r) => ({ L: inferioara(dominanta(n, r), false), b: vector(n, r) }), ordin: 2 },
  UTRIS: { intrari: (n, r) => ({ U: superioara(dominanta(n, r), false), b: vector(n, r) }), ordin: 2 },
  G: { intrari: (n, r) => ({ A: dominanta(n, r) }), ordin: 3 },
  GPP: { intrari: (n, r) => ({ A: aleatoare(n, n, r) }), ordin: 3 },
  S_GPP: { intrari: (n, r) => ({ A: aleatoare(n, n, r), b: vector(n, r) }), ordin: 3 },
  S_G: { intrari: (n, r) => ({ A: dominanta(n, r), b: vector(n, r) }), ordin: 3 },
  // pe o banda de latimi fixe costul creste liniar cu n
  Gb: { intrari: (n, r) => ({ A: banda(n, 2, 1, r), r: 2, q: 1 }), ordin: 1 },
  GPPb: { intrari: (n, r) => ({ A: banda(n, 2, 1, r), r: 2, q: 1 }), ordin: 1 },
  UTRISb: { intrari: (n, r) => ({ U: superioara(banda(n, 0, 2, r), false), b: vector(n, r), q: 2 }), ordin: 1 },
  LU: { intrari: (n, r) => ({ A: dominanta(n, r) }), ordin: 3 },
  CHOL: { intrari: (n, r) => ({ A: pozitivDefinita(n, r) }), ordin: 3 },
  // la metodele iterative ordinul este al unei iteratii
  JACOBI: { intrari: (n, r) => ({ A: dominanta(n, r), b: vector(n, r), x: Array<number>(n).fill(0), tol: 1e-8, maxiter: 500 }), ordin: 2 },
  GS: { intrari: (n, r) => ({ A: dominanta(n, r), b: vector(n, r), x: Array<number>(n).fill(0), tol: 1e-8, maxiter: 500 }), ordin: 2 },
  KACZMARZ: {
    intrari: (n, r) => {
      const A = dominanta(n, r)
      return { A, b: peVector(A, vector(n, r)), x: Array<number>(n).fill(0), tol: 1e-6, maxiter: 500 }
    },
    ordin: 2,
  },
  RFG: { intrari: (n, r) => ({ x: vector(n, r), k: 1 }), ordin: 1 },
  QR: { intrari: (n, r) => ({ A: aleatoare(2 * n, n, r) }), ordin: 3 },
  SQR: { intrari: (n, r) => ({ A: aleatoare(2 * n, n, r), b: vector(2 * n, r) }), ordin: 3 },
  MP: { intrari: (n, r) => ({ A: cuSpectru([5, 2, ...Array.from({ length: n - 2 }, (_, k) => 1 / (k + 1))], r), y: vector(n, r), tol: 1e-10, maxiter: 500 }), ordin: 2 },
  // la fiecare iteratie se rezolva un sistem n x n
  MPI: { intrari: (n, r) => ({ A: cuSpectru([5, 2, ...Array.from({ length: n - 2 }, (_, k) => 1 / (k + 1))], r), y: vector(n, r), tol: 1e-10, maxiter: 500 }), ordin: 3 },
}

function masoara(id: string, n: number) {
  const intrari = CAZURI[id].intrari(n, generator(n))
  const rez = ruleaza(id, intrari)
  expect(rez.final, `${id}, n = ${n}`).toBe('gata')
  // corpul buclei "cat timp" s-a executat de atatea ori cate evaluari adevarate a avut conditia
  const iteratii = Math.max(rez.pasi.filter((p) => p.iteratie).length - 1, 0)
  const estimat = algoritm(id)!.estimare(marimiDin(intrari, iteratii))
  return { flopi: rez.flopi, estimat, iteratii }
}

describe('estimatorul de complexitate', () => {
  it('fiecare algoritm din bibliotecă are un caz de măsurat', () => {
    expect(Object.keys(CAZURI).sort()).toEqual(BIBLIOTECA.map((a) => a.id).sort())
  })

  it('formulele exacte: 2mn pentru matvec, 2mnl pentru matmul, n² pentru substituții, n(n-1)(4n+1)/6 pentru G', () => {
    for (const n of [1, 2, 3, 7, 12]) {
      for (const id of ['matvec', 'matmul', 'LTRIS', 'UTRIS', 'Gb', 'GPPb', 'UTRISb']) {
        const m = masoara(id, n)
        expect(m.flopi, `${id}, n = ${n}`).toBe(m.estimat)
      }
      expect(masoara('G', n).flopi, `G, n = ${n}`).toBe((n * (n - 1) * (4 * n + 1)) / 6)
      // pivotarea adauga doar comparatii, care nu sunt flopi
      expect(masoara('GPP', n).flopi, `GPP, n = ${n}`).toBe(masoara('G', n).flopi)
    }
    const dreptunghiulara = { A: aleatoare(5, 3, generator(1)), x: [1, 2, 3] }
    expect(ruleaza('matvec', dreptunghiulara).flopi).toBe(2 * 5 * 3)
    expect(ruleaza('matmul', { A: aleatoare(4, 2, generator(2)), B: aleatoare(2, 5, generator(3)) }).flopi).toBe(2 * 4 * 5 * 2)
  })

  for (const id of Object.keys(CAZURI)) {
    it(`${id}: estimarea se apropie de flopii numărați când n crește, iar ordinul măsurat este ${CAZURI[id].ordin}`, () => {
      const mic = masoara(id, 12)
      const mare = masoara(id, 24)
      const abatere = (x: { flopi: number; estimat: number }) => Math.abs(x.flopi / x.estimat - 1)
      // la n = 24 termenul dominant explica cel putin 88% din cost
      expect(abatere(mare), `${id}: ${mare.flopi} numărați, ${Math.round(mare.estimat)} estimați`).toBeLessThan(0.12)
      // termenii lasati deoparte au un ordin mai mic: la dublarea lui n, abaterea scade
      if (abatere(mic) > 0) expect(abatere(mare), id).toBeLessThan(0.7 * abatere(mic))
      const peIteratie = (x: { flopi: number; iteratii: number }) => x.flopi / Math.max(x.iteratii, 1)
      expect(Math.log2(peIteratie(mare) / peIteratie(mic)), id).toBeGreaterThan(CAZURI[id].ordin - 0.3)
      expect(Math.log2(peIteratie(mare) / peIteratie(mic)), id).toBeLessThan(CAZURI[id].ordin + 0.3)
    })
  }

  it('QR pe o matrice lată: formula cu rolurile lui m și n schimbate', () => {
    const A = aleatoare(12, 24, generator(5))
    const flopi = ruleaza('QR', { A }).flopi
    const estimat = algoritm('QR')!.estimare(marimiDin({ A }))
    expect(estimat).toBe(2 * (24 * 12 * 12 - 12 ** 3 / 3))
    expect(Math.abs(flopi / estimat - 1)).toBeLessThan(0.12)
  })
})
