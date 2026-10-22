// Matricele din formula, calculate din starea curenta: la final factorii refac A (LU = A, PA = LU,
// LLᵀ = A, QR = A), iar in timpul rularii L A_(k+1) = A; B si c sunt cele de pe slide-uri.
import { describe, expect, it } from 'vitest'
import { limite } from '../src/invarianti'
import { algoritm } from '../src/motor/biblioteca'
import { urma, type Intrari } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { linii, type Matrice } from '../src/motor/valori'
import { vederi, type Vedere } from '../src/vederi'
import { abatere, ori, transpusa, unitate, type M } from './ajutor'

function ruleaza(id: string, intrari: Intrari) {
  const program = parseaza(algoritm(id)!.sursa)
  const rez = urma(program, intrari)
  expect(rez.final).toBe('gata')
  const la = (k: number) => vederi(id, program, rez, intrari, k)
  return { program, rez, la, final: la(rez.pasi.length - 1) }
}
const mat = (v: Vedere[], nume: string): M => linii(v.find((x) => x.nume === nume)!.tablou as Matrice)
const TOL = 1e-9

describe('matricele din formulă', () => {
  const A3 = [
    [1, 2, 1],
    [2, 1, 2],
    [1, 1, 2],
  ]

  it('G: la final LU = A, iar după primul pas L A_(2) = A', () => {
    const r = ruleaza('G', { A: A3 })
    expect(abatere(ori(mat(r.final, 'L'), mat(r.final, 'U')), A3)).toBeLessThan(TOL)
    const dupaUnPas = limite(r.program, r.rez).find((l) => l.complete === 1)!
    const v = r.la(dupaUnPas.pas)
    expect(abatere(ori(mat(v, 'L'), mat(v, 'U')), A3)).toBeLessThan(TOL)
    // L are deocamdata o singura coloana de multiplicatori
    expect(mat(v, 'L')[2][1]).toBe(0)
    expect(mat(v, 'L')[1][0]).toBe(2)
  })

  it('GPP pe exemplul de pe slide: PA = LU, cu L din multiplicatorii permutați', () => {
    const A = [
      [0.01, 1, 1],
      [1, 2, 0],
      [2, 0, 1],
    ]
    const r = ruleaza('GPP', { A })
    const p = (r.rez.stare.p as { d: number[] }).d
    // P A: liniile interschimbate in ordinea pasilor
    const PA = A.map((l) => [...l])
    p.forEach((pk, k) => {
      if (pk > 0 && pk - 1 !== k) [PA[k], PA[pk - 1]] = [PA[pk - 1], PA[k]]
    })
    expect(abatere(ori(mat(r.final, 'L'), mat(r.final, 'U')), PA)).toBeLessThan(TOL)
  })

  it('Crout și Cholesky refac A la final', () => {
    const lu = ruleaza('LU', { A: A3 })
    expect(abatere(ori(mat(lu.final, 'L'), mat(lu.final, 'U')), A3)).toBeLessThan(TOL)
    const spd = [
      [4, 2, 2],
      [2, 5, 3],
      [2, 3, 6],
    ]
    const ch = ruleaza('CHOL', { A: spd })
    expect(abatere(ori(mat(ch.final, 'L'), mat(ch.final, 'Lᵀ')), spd)).toBeLessThan(TOL)
    expect(abatere(mat(ch.final, 'Lᵀ'), transpusa(mat(ch.final, 'L')))).toBe(0)
  })

  it('QR: Q R = A și QᵀQ = I, cu vectorii Householder pe coloane', () => {
    const A = [
      [2, 3],
      [-1, 1],
      [2, -1],
    ]
    const r = ruleaza('QR', { A })
    const Q = mat(r.final, 'Q')
    const R = mat(r.final, 'R')
    expect(abatere(ori(Q, R), A)).toBeLessThan(TOL)
    expect(abatere(ori(transpusa(Q), Q), unitate(3))).toBeLessThan(TOL)
    const u = mat(r.final, 'u')
    expect(u[0][0]).toBeCloseTo(5 / 3, 12)
    expect(u[1][0]).toBeCloseTo(-1 / 3, 12)
    expect(u[0][1]).toBe(0)
  })

  it('Jacobi și Gauss-Seidel: B și c de pe slide-uri', () => {
    const j = ruleaza('JACOBI', { A: [[2, 1], [5, 7]], b: [11, 13], x: [1, 1], tol: 1e-3, maxiter: 100 })
    expect(abatere(mat(j.final, 'B'), [[0, -1 / 2], [-5 / 7, 0]])).toBeLessThan(TOL)
    expect((j.final.find((v) => v.nume === 'c')!.tablou as { d: number[] }).d).toEqual([11 / 2, 13 / 7])
    const g = ruleaza('GS', { A: [[16, 3], [7, -11]], b: [11, 13], x: [1, 1], tol: 1e-6, maxiter: 100 })
    expect(abatere(mat(g.final, 'B'), [[0, -0.1875], [0, -21 / 176]])).toBeLessThan(TOL)
  })

  it('MPI: μI − A la iterația curentă; RFG: U_k x are zerouri sub k', () => {
    const A = [
      [2, 3, 2, -6],
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
    ]
    const r = ruleaza('MPI', { A, y: [1, 0, 0, 0], tol: 1e-15, maxiter: 50 })
    const B = mat(r.final, 'μI−A')
    const mu = r.rez.scalari['μ']
    expect(B[0][0]).toBeCloseTo(mu - 2, 12)
    expect(B[1][0]).toBe(-1)
    const f = ruleaza('RFG', { x: [2, -1, 2], k: 1 })
    const U = mat(f.final, 'U')
    const Ux = U.map((l) => l.reduce((s, v, i) => s + v * [2, -1, 2][i], 0))
    expect(Ux[0]).toBeCloseTo(-3, 12)
    expect(Math.abs(Ux[1]) + Math.abs(Ux[2])).toBeLessThan(TOL)
  })

  it('algoritmii fără factorizare nu au vederi', () => {
    expect(ruleaza('matvec', { A: [[1, 2], [3, 4]], x: [1, 1] }).final).toEqual([])
    expect(ruleaza('LTRIS', { L: [[2, 0], [1, 3]], b: [2, 4] }).final).toEqual([])
  })
})
