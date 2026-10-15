// Contraexemplele din curs: fiecare se termina cum spune, are toate intrarile algoritmului, iar
// numerele din explicatii (raze spectrale, pivoti, pasi care nu schimba x) ies din calcul.
import { describe, expect, it } from 'vitest'
import { CONTRAEXEMPLE } from '../src/contraexemple'
import { algoritm } from '../src/motor/biblioteca'
import { stareLa, urma, type Intrari } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { matriceIteratie, proprietati, razaSpectrala } from '../src/natura'

const ruleaza = (id: string, valori: Intrari) => urma(parseaza(algoritm(id)!.sursa), valori, { instantanee: 'toate' })
const caz = (id: string, k = 0) => CONTRAEXEMPLE[id][k]

describe('contraexemplele din curs', () => {
  it('fiecare are exact intrările algoritmului și se termină cum spune', () => {
    for (const [id, lista] of Object.entries(CONTRAEXEMPLE)) {
      const alg = algoritm(id)!
      expect(alg, id).toBeDefined()
      for (const c of lista) {
        expect(Object.keys(c.valori).sort(), `${id}: ${c.titlu.ro}`).toEqual(alg.intrari.map((i) => i.nume).sort())
        expect(ruleaza(id, c.valori).final, `${id}: ${c.titlu.ro}`).toBe(c.final)
      }
    }
  })

  it('razele spectrale din explicațiile de la Jacobi și Gauss-Seidel', () => {
    const rho = (A: number[][], m: 'jacobi' | 'gs') => razaSpectrala(matriceIteratie(A, m))
    expect(rho(caz('JACOBI', 0).valori.A as number[][], 'jacobi')).toBeCloseTo(Math.sqrt(6), 3)
    expect(rho(caz('JACOBI', 1).valori.A as number[][], 'jacobi')).toBeCloseTo(Math.sqrt(0.1), 3)
    expect(rho(caz('JACOBI', 2).valori.A as number[][], 'jacobi')).toBeCloseTo(1.8, 3)
    expect(rho(caz('GS', 0).valori.A as number[][], 'gs')).toBeCloseTo(6, 3)
    // aceeasi matrice simetrica pozitiv definita, nedominanta: Gauss-Seidel are raza sub 1
    const spd = caz('GS', 1).valori.A as number[][]
    expect(proprietati(spd).map((p) => p.cheie)).toEqual(expect.arrayContaining(['propSimetrica', 'propSpd']))
    expect(proprietati(spd).map((p) => p.cheie)).not.toContain('propDominanta')
    expect(rho(spd, 'gs')).toBeLessThan(1)
  })

  it('G se oprește la pivotul nul, iar matricea este totuși nesingulară; GPP o duce la capăt', () => {
    const A = caz('G').valori.A as number[][]
    expect(proprietati(A).map((p) => p.cheie)).toEqual(expect.arrayContaining(['propNesingulara']))
    expect(ruleaza('G', { A }).eroare).toContain('linia 4')
    expect(ruleaza('GPP', { A }).final).toBe('gata')
  })

  it('GPP pe matricea singulară lasă u_33 = 0', () => {
    const rez = ruleaza('GPP', caz('GPP', 1).valori)
    expect(rez.stare.A.d[8]).toBe(0)
  })

  it('Kaczmarz: primii doi pași nu schimbă x, iar pe sistemul fără soluție x sare între cele două drepte', () => {
    const rez = ruleaza('KACZMARZ', caz('KACZMARZ', 1).valori)
    const pasi = rez.pasi.map((p, idx) => [p, idx] as const).filter(([p]) => p.linie === 6)
    expect(stareLa(rez, pasi[0][1]).x.d).toEqual([1, 2, 4])
    expect(stareLa(rez, pasi[1][1]).x.d).toEqual([1, 2, 4])
    expect(stareLa(rez, pasi[2][1]).x.d).not.toEqual([1, 2, 4])
    // x_1 + x_2 alterneaza intre 1 si 3: x trece de pe o dreapta pe cealalta
    const fara = ruleaza('KACZMARZ', caz('KACZMARZ', 0).valori)
    const sume = fara.pasi.map((p, idx) => [p, idx] as const).filter(([p]) => p.linie === 6).slice(0, 4).map(([, idx]) => stareLa(fara, idx).x.d.reduce((s, v) => s + v, 0))
    expect(sume.map((s) => Number(s.toFixed(12)))).toEqual([1, 3, 1, 3])
  })

  it('RFG: cu x_k = 0, σ = 5, u = (1, 0.6, 0.8), β = 1; fără nimic de anulat, β = 0 și x rămâne', () => {
    const a = ruleaza('RFG', caz('RFG', 0).valori)
    expect(a.stare.x.d).toEqual([-5, 0.6, 0.8])
    expect(a.scalari['β']).toBe(1)
    const b = ruleaza('RFG', caz('RFG', 1).valori)
    expect(b.stare.x.d).toEqual([2, 0, 0])
    expect(b.scalari['β']).toBe(0)
  })

  it('metoda puterii: fără valoare proprie dominantă e rămâne 1; cu γ₁ = 0 se oprește pe vectorul propriu al lui 1', () => {
    const a = ruleaza('MP', caz('MP', 0).valori)
    expect(a.scalari.e).toBe(1)
    const b = ruleaza('MP', caz('MP', 1).valori)
    const y = b.stare.y.d
    // y e paralel cu (1, -1), vectorul propriu al valorii proprii 1, nu cu (1, 0), al lui 2
    expect(Math.abs(y[0] + y[1])).toBeLessThan(1e-12)
    expect(b.scalari.i).toBe(1)
  })

  it('GPPb lărgește banda: u_13 devine nenul', () => {
    const rez = ruleaza('GPPb', caz('GPPb').valori)
    expect(rez.stare.A.d[2]).not.toBe(0)
  })
})
