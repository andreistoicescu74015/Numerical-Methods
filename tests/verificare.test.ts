import { describe, expect, it } from 'vitest'
import { BIBLIOTECA, type Algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { PRAG, areVerificare, verifica } from '../src/motor/verificare'
import fixturi from './fixtures/algoritmi.json'

function intrariExemplu(alg: Algoritm) {
  return Object.fromEntries(alg.intrari.map((i) => [i.nume, i.exemplu]))
}

describe('verificările numerice', () => {
  it('fiecare algoritm din bibliotecă are verificare', () => {
    for (const alg of BIBLIOTECA) expect(areVerificare(alg.id), alg.id).toBe(true)
  })

  for (const alg of BIBLIOTECA) {
    it(`${alg.id}: reziduurile sunt sub prag pe exemplul din bibliotecă`, () => {
      const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
      expect(rez.final).toBe('gata')
      const v = verifica(alg.id, intrariExemplu(alg), rez.stare, rez.scalari)
      expect(v.length).toBeGreaterThan(0)
      for (const x of v) if (x.fel === 'reziduu') expect(x.valoare, `${alg.id}: ${x.text.ro}`).toBeLessThan(x.prag ?? PRAG)
    })
  }

  it('și pe cazurile din fixture-uri, când algoritmul se termină', () => {
    for (const caz of (fixturi as unknown as { cazuri: { algoritm: string; intrari: Record<string, number | number[] | number[][]>; iesiri: Record<string, unknown> }[] }).cazuri) {
      if ('final' in caz.iesiri) continue
      const alg = BIBLIOTECA.find((a) => a.id === caz.algoritm)!
      const rez = urma(parseaza(alg.sursa), caz.intrari)
      for (const x of verifica(alg.id, caz.intrari, rez.stare, rez.scalari)) {
        if (x.fel === 'reziduu') expect(x.valoare, `${alg.id}: ${x.text.ro}`).toBeLessThan(x.prag ?? PRAG)
      }
    }
  })

  it('un rezultat greșit dă un reziduu mare', () => {
    const alg = BIBLIOTECA.find((a) => a.id === 'CHOL')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    rez.stare.A.d[0] += 0.5
    const v = verifica('CHOL', intrariExemplu(alg), rez.stare, rez.scalari)
    expect(v[0].valoare).toBeGreaterThan(0.1)
  })

  it('MP raportează valoarea proprie dominantă', () => {
    const alg = BIBLIOTECA.find((a) => a.id === 'MP')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    const v = verifica('MP', intrariExemplu(alg), rez.stare, rez.scalari)
    const rand = (inceput: string) => v.find((x) => x.text.ro.startsWith(inceput))!
    expect(rand('λ = yᵀAy').fel).toBe('valoare')
    expect(rand('λ = yᵀAy').valoare).toBeCloseTo(3, 4)
    expect(rand('e = ').prag).toBe(1e-15)
    expect(rand('|λ| față de').valoare).toBeLessThan(rand('|λ| față de').prag!)
  })

  it('MP pe un vector de pornire fără componentă pe vectorul propriu dominant: λ nu este cea dominantă, iar verificarea o spune', () => {
    const alg = BIBLIOTECA.find((a) => a.id === 'MP')!
    const intrari = { A: [[-2, 3], [0, -5]], y: [1, 0], tol: 1e-6, maxiter: 50 }
    const rez = urma(parseaza(alg.sursa), intrari)
    const v = verifica('MP', intrari, rez.stare, rez.scalari)
    const comparatie = v.find((x) => x.text.ro.startsWith('|λ| față de'))!
    // λ = -2, iar valoarea dominanta este -5
    expect(comparatie.valoare).toBeCloseTo(0.6, 6)
    expect(comparatie.valoare).toBeGreaterThan(comparatie.prag!)
  })

  it('un program editat care nu mai produce formele așteptate nu aruncă', () => {
    expect(verifica('G', { A: [[1, 2], [3, 4]] }, {}, {})).toEqual([])
  })
})
