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
    expect(primul.celule).toContainEqual({ nume: 'A', i: 2, j: 1, rol: 'scris', mult: true })
    expect(scrieri.length).toBe(2 + 4 + 1 + 1)
    expect(rez.flopi).toBe(2 + 8 + 1 + 2)
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
