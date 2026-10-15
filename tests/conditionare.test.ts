// Experimentul de conditionare: κ∞ pe exemplele din cartea cursului, iar schimbarea lui x ramane
// sub marginea κ∞(A) ‖Δb‖/‖b‖ si o atinge cand ‖b‖ = ‖A‖‖x‖, in directia aleasa pentru Δb.
import { describe, expect, it } from 'vitest'
import { exempleCarte, experiment, inversa, normaInf } from '../src/conditionare'
import { algoritm } from '../src/motor/biblioteca'
import { genereaza } from '../src/natura'
import { generator } from './ajutor'

const exemplu = (id: string) => exempleCarte().find((e) => e.id === id)!
const kappa = (A: number[][]) => normaInf(A) * normaInf(inversa(A)!)

describe('condiționarea unui sistem', () => {
  it('κ∞ pe exemplele din carte: D = 1, T = n 2ⁿ⁻¹ = 80 pentru n = 5, H₃ ≈ 748', () => {
    expect(kappa(exemplu('D').A)).toBeCloseTo(1, 12)
    expect(kappa(exemplu('T').A)).toBeCloseTo(80, 9)
    expect(Math.round(kappa(exemplu('H3').A))).toBe(748)
    // det(D) = 10⁻⁴ este mic, dar D este bine conditionata
    expect(exemplu('D').A.reduce((p, l, i) => p * l[i], 1)).toBeCloseTo(1e-4, 15)
  })

  it('schimbarea lui x nu trece de marginea κ∞ ε, pe sisteme aleatoare și pe exemplele din carte', () => {
    const rnd = generator(4)
    for (let rep = 0; rep < 10; rep++) {
      const A = genereaza({ tip: 'matrice', natura: 'nesingulara', forma: [4, 4] }, rnd) as number[][]
      const b = genereaza({ tip: 'vector', natura: 'nenul', forma: [4, 1] }, rnd) as number[]
      const e = experiment(algoritm('S_GPP')!, { A, b }, 1e-6)!
      expect(e.schimbare).toBeLessThanOrEqual(e.margine * (1 + 1e-6))
    }
    for (const ex of exempleCarte())
      for (const id of ex.pentru) {
        const nume = id === 'LTRIS' ? 'L' : id === 'UTRIS' ? 'U' : 'A'
        const e = experiment(algoritm(id)!, { [nume]: ex.A, b: ex.b }, 1e-6)!
        expect(e.schimbare, `${ex.id}, ${id}`).toBeLessThanOrEqual(e.margine * (1 + 1e-6))
      }
  })

  it('pe exemplele din carte schimbarea atinge marginea: x se schimbă de κ∞ ori mai mult decât b', () => {
    const T = exemplu('T')
    // b = T s, cu s = (1, -1, -1, -1, -1): ‖b‖∞ = 5 = ‖T‖∞ ‖x‖∞, deci inegalitatea devine egalitate
    expect(T.b).toEqual([5, 2, 1, 0, -1])
    const e = experiment(algoritm('UTRIS')!, { U: T.A, b: T.b }, 1e-6)!
    expect(e.schimbare / e.eps).toBeCloseTo(80, 4)
    const H = exemplu('H3')
    const h = experiment(algoritm('S_GPP')!, { A: H.A, b: H.b }, 1e-6)!
    expect(h.schimbare / h.eps).toBeCloseTo(748, 0)
    // pe D, diagonala, schimbarea relativa a lui x este cea a lui b
    const D = exemplu('D')
    const d = experiment(algoritm('S_GPP')!, { A: D.A, b: D.b }, 1e-6)!
    expect(d.schimbare / d.eps).toBeCloseTo(1, 6)
  })

  it('la LTRIS contează doar triunghiul citit: marginea ține și când în L s-a scris altceva deasupra diagonalei', () => {
    // L scrisa cu -100 deasupra diagonalei: LTRIS rezolva sistemul cu triunghiul [1 0; 100 1]
    const e = experiment(algoritm('LTRIS')!, { L: [[1, -100], [100, 1]], b: [1, 100] }, 1e-6)!
    expect(e.kappa).toBeCloseTo(101 * 101, 6)
    expect(e.schimbare).toBeLessThanOrEqual(e.margine * (1 + 1e-6))
    // un triunghi cu diagonala nenula nu e singular, chiar daca matricea scrisa este
    expect(experiment(algoritm('LTRIS')!, { L: [[1, 1], [1, 1]], b: [1, 2] }, 1e-6)).not.toBeNull()
  })

  it('cu b = 0 schimbarea relativă a lui x nu se poate calcula; intrările de altă formă nu opresc experimentul cu o excepție', () => {
    const e = experiment(algoritm('S_GPP')!, { A: [[2, 1], [1, 3]], b: [0, 0] }, 1e-6)!
    expect(Number.isFinite(e.schimbare)).toBe(false)
    expect(experiment(algoritm('S_GPP')!, { A: [[2, 1, 0], [1, 3, 1]], b: [1, 2] }, 1e-6)).toBeNull()
    expect(experiment(algoritm('S_GPP')!, { A: [1, 2], b: [1, 2] }, 1e-6)).toBeNull()
  })

  it('o matrice singulară nu are κ: experimentul nu se face', () => {
    expect(experiment(algoritm('S_GPP')!, { A: [[1, 2], [2, 4]], b: [1, 2] }, 1e-6)).toBeNull()
  })
})
