import { describe, expect, it } from 'vitest'
import { algoritm } from '../src/motor/biblioteca'
import { stareLa, urma, type Intrari } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import fixturi from './fixtures/algoritmi.json'

interface Caz {
  algoritm: string
  descriere: string
  intrari: Intrari
  iesiri: Record<string, unknown>
}

function ruleaza(id: string, intrari: Intrari) {
  const alg = algoritm(id)
  if (!alg) throw new Error(`algoritmul ${id} nu este în bibliotecă`)
  return urma(parseaza(alg.sursa), intrari)
}

function aproape(obtinut: number[], asteptat: number[], tol = 1e-9) {
  expect(obtinut.length).toBe(asteptat.length)
  obtinut.forEach((x, k) => {
    expect(Math.abs(x - asteptat[k]), `poziția ${k}: ${x} față de ${asteptat[k]}`).toBeLessThanOrEqual(tol)
  })
}

describe('pseudocodul din bibliotecă dă aceleași numere ca oracolul Python', () => {
  for (const caz of (fixturi as unknown as { cazuri: Caz[] }).cazuri) {
    it(`${caz.algoritm}: ${caz.descriere}`, () => {
      const rez = ruleaza(caz.algoritm, caz.intrari)
      for (const [nume, asteptat] of Object.entries(caz.iesiri)) {
        if (nume === 'final') {
          expect(rez.final).toBe(asteptat)
          continue
        }
        if (typeof asteptat === 'number') {
          expect(rez.scalari[nume]).toBe(asteptat)
          continue
        }
        const v = rez.stare[nume]
        expect(v, `${nume} lipsește din starea finală`).toBeDefined()
        aproape(v.d, (asteptat as number[] | number[][]).flat())
      }
      if (!('final' in caz.iesiri)) expect(rez.final).toBe('gata')
    })
  }
})

describe('urma de execuție', () => {
  it('G pe exemplul din curs: primul pas scrie μ_21 cu formula substituită', () => {
    const rez = ruleaza('G', { A: [[1, 2, 1], [2, 1, 2], [1, 1, 2]] })
    const scrieri = rez.pasi.filter((p) => p.celule.some((c) => c.rol === 'scris'))
    const primul = scrieri[0]
    expect(primul.linie).toBe(4)
    expect(primul.formula).toBe('a_{21} \\leftarrow \\mu_{21} = a_{21} / a_{11} = 2 / 1 = 2')
    expect(primul.celule).toHaveLength(2)
    expect(primul.celule).toContainEqual({ nume: 'A', i: 1, j: 1, rol: 'pivot' })
    expect(primul.celule).toContainEqual({ nume: 'A', i: 2, j: 1, rol: 'scris', mult: true, litera: 'μ' })
    expect(scrieri.length).toBe(2 + 4 + 1 + 1)
    expect(rez.flopi).toBe(2 + 8 + 1 + 2)
  })

  it('aritmetica pe indici și contoare nu e flop, nici în condiții; aritmetica pe date este, chiar cu rezultat întreg', () => {
    const flopi = (sursa: string, intrari = {}) => urma(parseaza(sursa), intrari).flopi
    expect(flopi('x ← 0\ndacă n - 1 > 0 atunci x ← 1', { A: [[1, 2], [3, 4]] })).toBe(0)
    expect(flopi('k ← 0\ncât timp k + 1 < 4\n    k ← k + 1')).toBe(0)
    // t vine din A: t * t e o înmulțire, oricare ar fi valoarea lui t
    expect(flopi('t ← a_11\ns ← t * t', { A: [[2]] })).toBe(1)
    expect(flopi('t ← a_11\ns ← t * t', { A: [[1.5]] })).toBe(1)
    // s adună elemente din A: fiecare adunare e un flop, deși valorile sunt întregi
    expect(flopi('s ← 0\npentru k = 1 : 4\n    s ← s + a_kk', { A: [[1, 0, 0, 0], [0, 2, 0, 0], [0, 0, 3, 0], [0, 0, 0, 4]] })).toBe(4)
  })

  it('adunarea de matrice cere aceeași formă, nu doar același număr de elemente', () => {
    const rez = urma(parseaza('C ← A + B'), { A: [[1, 2, 3], [4, 5, 6]], B: [[1, 2], [3, 4], [5, 6]] })
    expect(rez.final).toBe('eroare')
    expect(rez.eroare).toBe('linia 1: adunare între tablouri de forme diferite: o matrice 2 x 3 și o matrice 3 x 2')
  })

  it('formulele: minus în fața unei valori negative, o sumă cu un termen și rezultatul rotunjit la t cifre', () => {
    const formula = (sursa: string, intrari = {}, cifre?: number) => urma(parseaza(sursa), intrari, { cifre }).pasi.find((p) => p.formula)!.formula
    expect(formula('y ← -x', { x: -2 })).toBe('y \\leftarrow -x = -\\left(-2\\right) = 2')
    expect(formula('y ← 5 - Σ_{j=1}^{1} (x_j - 1)', { x: [4, 9] })).toContain('= 5 - (4 - 1) = 2')
    expect(formula('z ← 1 - 0.0001234567', {}, 6)).toContain('rotunjit la 6 cifre}}\\; 0.999877')
    // QR cu pivot negativ: a_11 ← -σ scrie -(-5), nu --5
    const qr = ruleaza('QR', { A: [[-3, 1], [4, 2], [0, 1]] })
    expect(qr.pasi.some((p) => p.formula?.includes('-\\left(-5\\right)'))).toBe(true)
    expect(qr.pasi.some((p) => p.formula?.includes('--'))).toBe(false)
  })

  it('un bloc 1 x n primește o linie de lungime n', () => {
    const rez = urma(parseaza('A(1:1, 1:2) ← x^T'), { A: [[1, 2], [3, 4]], x: [7, 8] })
    expect(rez.final).toBe('gata')
    expect(rez.stare.A.d).toEqual([7, 8, 3, 4])
  })

  it('LTRIS: bucla goală j = 1 : 0 lasă un pas fără iterații', () => {
    const rez = ruleaza('LTRIS', { L: [[2, 0], [1, 4]], b: [2, 9] })
    const gol = rez.pasi.find((p) => p.mesaj?.startsWith('nicio iterație'))
    expect(gol?.linie).toBe(3)
    expect(rez.stare.x.d).toEqual([1, 2])
  })

  it('Cholesky pe o matrice nedefinită se oprește cu mesajul din pseudocod', () => {
    const rez = ruleaza('CHOL', { A: [[1, 2], [2, 1]] })
    expect(rez.final).toBe('stop')
    expect(rez.pasi.at(-1)?.mesaj).toBe('A nu este pozitiv definită')
  })

  it('o împărțire la zero devine un pas de eroare cu linia', () => {
    const rez = ruleaza('G', { A: [[0, 1], [1, 1]] })
    expect(rez.final).toBe('eroare')
    expect(rez.eroare).toBe('linia 4: împărțire la zero')
  })

  it('starea de la un pas nu se schimbă după ce urma a fost generată', () => {
    const rez = ruleaza('G', { A: [[1, 2, 1], [2, 1, 2], [1, 1, 2]] })
    expect(stareLa(rez, 0).A.d).toEqual([1, 2, 1, 2, 1, 2, 1, 1, 2])
    expect(stareLa(rez, rez.pasi.length - 1).A.d).toEqual(rez.stare.A.d)
    expect(stareLa(rez, 3).A.d[3]).toBe(2)
  })
})
