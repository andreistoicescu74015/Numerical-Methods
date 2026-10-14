// Natura intrarilor: valorile generate de "aleator" au proprietatea ceruta de algoritm, algoritmul
// se termina pe ele si identitatile lui se verifica; valorile care nu o au sunt semnalate.
import { describe, expect, it } from 'vitest'
import { abatere, aleatoare, faraGarantie, forma, intrariDinDefinitii, type Definitie } from '../src/intrari'
import { BIBLIOTECA, algoritm, type Algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { PRAG, verifica } from '../src/motor/verificare'
import { genereaza, incalca, rang, type Natura, type Valoare } from '../src/natura'
import { generator } from './ajutor'

type Forme = Record<string, [number, number]>

// toate matricele n x n, toti vectorii de lungime n
const patrat = (alg: Algoritm, n: number): Forme => Object.fromEntries(alg.intrari.filter((i) => i.tip !== 'scalar').map((i) => [i.nume, i.tip === 'matrice' ? [n, n] : [n, 1]]))

const FORME: Record<string, (alg: Algoritm) => Forme[]> = {
  matvec: () => [{ A: [4, 3], x: [3, 1] }, { A: [2, 5], x: [5, 1] }, { A: [1, 1], x: [1, 1] }],
  matmul: () => [{ A: [3, 2], B: [2, 3] }, { A: [2, 4], B: [4, 1] }],
  KACZMARZ: () => [{ A: [2, 2], b: [2, 1], x: [2, 1] }, { A: [3, 3], b: [3, 1], x: [3, 1] }, { A: [4, 2], b: [4, 1], x: [2, 1] }, { A: [2, 3], b: [2, 1], x: [3, 1] }],
  RFG: () => [{ x: [3, 1] }, { x: [5, 1] }, { x: [2, 1] }],
  QR: () => [{ A: [3, 2] }, { A: [4, 4] }, { A: [2, 4] }, { A: [5, 3] }],
  SQR: () => [{ A: [3, 2], b: [3, 1] }, { A: [5, 3], b: [5, 1] }, { A: [4, 1], b: [4, 1] }],
}
const formeAle = (alg: Algoritm): Forme[] => FORME[alg.id]?.(alg) ?? [2, 3, 4, 5].map((n) => patrat(alg, n))

// definitii cu formele date si zerouri in loc de valori
function goale(alg: Algoritm, forme: Forme): Definitie[] {
  return alg.intrari.map((i) => {
    const [m, n] = forme[i.nume] ?? [1, 1]
    const text = i.tip === 'scalar' ? '0' : i.tip === 'vector' ? Array(m).fill(0).join(' ') : Array.from({ length: m }, () => Array(n).fill(0).join(' ')).join('\n')
    return { nume: i.nume, tip: i.tip, text }
  })
}

// "aleator" apasat pe rand la fiecare intrare, in ordinea din biblioteca
function toateAleatoare(alg: Algoritm, forme: Forme, rnd: () => number): Definitie[] {
  let defs = goale(alg, forme)
  alg.intrari.forEach((_, k) => {
    defs = aleatoare(defs, k, alg.intrari, rnd)
  })
  return defs
}

describe('valorile aleatoare respectă natura cerută de algoritm', () => {
  for (const alg of BIBLIOTECA) {
    it(`${alg.id}: natura e respectată, algoritmul se termină și identitățile lui se verifică`, () => {
      const rnd = generator(2026)
      const program = parseaza(alg.sursa)
      for (const forme of formeAle(alg)) {
        for (let runda = 0; runda < 40; runda++) {
          const defs = toateAleatoare(alg, forme, rnd)
          const unde = `${alg.id} ${JSON.stringify(defs.map((d) => d.text))}`
          defs.forEach((d, k) => {
            expect(abatere(defs, k, alg.intrari), unde).toBeNull()
            // dimensiunile cerute se pastreaza
            if (forme[d.nume]) expect(forma(d), unde).toEqual(forme[d.nume])
          })
          const intrari = intrariDinDefinitii(defs)
          // aceeasi limita de pasi ca in aplicatie
          const rez = urma(program, intrari)
          expect(rez.final, `${unde}: ${rez.eroare ?? rez.pasi.at(-1)?.mesaj ?? ''}`).toBe('gata')
          for (const v of verifica(alg.id, intrari, rez.stare, rez.scalari)) {
            if (v.fel === 'reziduu') expect(v.valoare, `${unde}: ${v.text.ro}`).toBeLessThanOrEqual(v.prag ?? PRAG)
          }
        }
      }
    })
  }

  it('Jacobi și Gauss-Seidel primesc matrice strict diagonal dominante pe linii', () => {
    const rnd = generator(7)
    for (const id of ['JACOBI', 'GS']) {
      const alg = algoritm(id)!
      for (const n of [2, 3, 4, 5]) {
        const A = intrariDinDefinitii(toateAleatoare(alg, patrat(alg, n), rnd)).A as number[][]
        A.forEach((l, i) => expect(Math.abs(l[i])).toBeGreaterThan(l.reduce((s, x, j) => s + (j === i ? 0 : Math.abs(x)), 0)))
      }
    }
  })

  it('Cholesky primește A = LLᵀ cu L întreagă: simetrică, cu factorul exact', () => {
    const rnd = generator(11)
    const alg = algoritm('CHOL')!
    for (const n of [2, 3, 4]) {
      const intrari = intrariDinDefinitii(toateAleatoare(alg, patrat(alg, n), rnd))
      const A = intrari.A as number[][]
      A.forEach((l, i) => l.forEach((x, j) => expect(x).toBe(A[j][i])))
      const L = urma(parseaza(alg.sursa), intrari).stare.A
      for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) expect(Number.isInteger(L.d[i * n + j])).toBe(true)
    }
  })

  it('metoda puterii primește A asemenea cu o matrice diagonală: valoarea proprie găsită este cea dominantă aleasă, un întreg de modul 4, 5 sau 6', () => {
    const rnd = generator(13)
    const alg = algoritm('MP')!
    for (const n of [2, 3, 4])
      for (let k = 0; k < 10; k++) {
        const intrari = intrariDinDefinitii(toateAleatoare(alg, patrat(alg, n), rnd))
        const A = intrari.A as number[][]
        expect(A.flat().every(Number.isInteger)).toBe(true)
        const rez = urma(parseaza(alg.sursa), { ...intrari, tol: 1e-12, maxiter: 500 })
        expect(rez.final).toBe('gata')
        const y = rez.stare.y.d
        const lambda = y.reduce((s, v, i) => s + v * A[i].reduce((t, a, j) => t + a * y[j], 0), 0)
        expect([4, 5, 6]).toContain(Math.round(Math.abs(lambda)))
        expect(Math.abs(Math.abs(lambda) - Math.round(Math.abs(lambda)))).toBeLessThan(1e-4)
      }
  })

  it('un vector de pornire perpendicular pe vectorul propriu dominant este semnalat', () => {
    // A = diag(3, 1): vectorul propriu dominant este e₁, iar y = (0, 1) nu are componentă pe el
    expect(incalca('pornire', [0, 1], [[3, 0], [0, 1]])).toEqual({ cheie: 'naturaPornire', args: [] })
    expect(incalca('pornire', [1, 1], [[3, 0], [0, 1]])).toBeNull()
    // fără valoare proprie dominantă (rotație) nu se poate spune: nicio notă
    expect(incalca('pornire', [0, 1], [[0, -1], [1, 0]])).toBeNull()
  })

  it('fără natură cerută: întregi între -5 și 5, cu dimensiunile textului', () => {
    const rnd = generator(3)
    const defs = aleatoare([{ nume: 'B', tip: 'matrice', text: '1 2 3 4\n5 6 7 8' }], 0, [], rnd)
    const B = intrariDinDefinitii(defs).B as number[][]
    expect([B.length, B[0].length]).toEqual([2, 4])
    expect(B.flat().every((x) => Number.isInteger(x) && Math.abs(x) <= 5)).toBe(true)
    // un text gol sau cu greseli isi pastreaza forma numarata ingaduitor
    expect(forma({ nume: 'x', tip: 'vector', text: '1 a 3' })).toEqual([3, 1])
    expect(forma({ nume: 'A', tip: 'matrice', text: '' })).toEqual([3, 3])
  })
})

describe('intrările care depind una de alta', () => {
  it('Kaczmarz cu mai multe ecuații decât necunoscute: o matrice nouă aduce și un termen liber compatibil', () => {
    const rnd = generator(5)
    const alg = algoritm('KACZMARZ')!
    let defs: Definitie[] = [
      { nume: 'A', tip: 'matrice', text: '1 0\n0 1\n1 1' },
      { nume: 'b', tip: 'vector', text: '1 2 3' },
      { nume: 'x', tip: 'vector', text: '0 0' },
      { nume: 'tol', tip: 'scalar', text: '0.001' },
      { nume: 'maxiter', tip: 'scalar', text: '100' },
    ]
    for (let k = 0; k < 20; k++) {
      defs = aleatoare(defs, 0, alg.intrari, rnd)
      const { A, b } = intrariDinDefinitii(defs) as { A: number[][]; b: number[] }
      expect(A).toHaveLength(3)
      expect(rang(A.map((l, i) => [...l, b[i]]))).toBe(rang(A))
    }
  })

  it('un termen liber compatibil rămâne neschimbat când matricea nouă e nesingulară', () => {
    const alg = algoritm('KACZMARZ')!
    const defs = aleatoare(toateAleatoare(alg, { A: [2, 2], b: [2, 1], x: [2, 1] }, generator(1)), 0, alg.intrari, generator(2))
    const inainte = toateAleatoare(alg, { A: [2, 2], b: [2, 1], x: [2, 1] }, generator(1))
    expect(defs[1].text).toBe(inainte[1].text)
    expect(defs[0].text).not.toBe(inainte[0].text)
  })

  it('RFG: indicele rămâne între 1 și lungimea vectorului', () => {
    const rnd = generator(9)
    const alg = algoritm('RFG')!
    for (const m of [2, 3, 6]) {
      for (let k = 0; k < 20; k++) {
        const { x, k: indice } = intrariDinDefinitii(toateAleatoare(alg, { x: [m, 1] }, rnd)) as { x: number[]; k: number }
        expect(x).toHaveLength(m)
        expect(indice).toBeGreaterThanOrEqual(1)
        expect(indice).toBeLessThan(m)
      }
    }
  })
})

describe('valorile scrise de mână care nu au natura cerută', () => {
  const CAZURI: [Natura, Valoare, Valoare | undefined, string, (string | number)[]][] = [
    ['inferior', [[1, 2], [0, 3]], undefined, 'naturaInferior', [1, 2, 2]],
    ['inferior', [[1, 0], [4, 0]], undefined, 'naturaDiagonala', [2]],
    ['superior', [[1, 2], [5, 3]], undefined, 'naturaSuperior', [2, 1, 5]],
    ['superior', [[1, 2, 3], [0, 1, 2]], undefined, 'naturaPatrata', [2, 3]],
    ['lider', [[0, 1], [1, 0]], undefined, 'naturaLider', [1]],
    ['lider', [[1, 2, 3], [2, 4, 5], [1, 1, 1]], undefined, 'naturaLider', [2]],
    ['nesingulara', [[1, 2, 3], [4, 5, 6], [7, 8, 9]], undefined, 'naturaSingulara', []],
    ['spd', [[4, 1], [2, 3]], undefined, 'naturaSimetrica', [2, 1, 2, 1]],
    ['spd', [[1, 2], [2, 1]], undefined, 'naturaPozitivDefinita', [2]],
    ['spd', [[-1, 0], [0, 1]], undefined, 'naturaPozitivDefinita', [1]],
    ['diagonalaNenula', [[1, 2], [3, 0]], undefined, 'naturaDiagonala', [2]],
    ['liniiNenule', [[1, 2], [0, 0]], undefined, 'naturaLinieNula', [2]],
    ['coloaneIndependente', [[1, 2], [3, 4]], undefined, 'naturaInalta', [2, 2]],
    ['coloaneIndependente', [[1, 2], [2, 4], [3, 6]], undefined, 'naturaColoane', [1, 2]],
    ['nenul', [0, 0, 0], undefined, 'naturaNenul', []],
    ['compatibil', [1, 2, 4], [[1, 0], [0, 1], [1, 1]], 'naturaCompatibil', []],
    ['compatibil', [0, 0], [[1, 0], [0, 1]], 'naturaNenul', []],
    ['toleranta', 1, undefined, 'naturaToleranta', []],
    ['toleranta', -0.001, undefined, 'naturaToleranta', []],
    ['iteratii', 0, undefined, 'naturaIteratii', []],
    ['iteratii', 2.5, undefined, 'naturaIteratii', []],
    ['indice', 4, [1, 2, 3], 'naturaIndice', [3]],
    ['indice', 0, [1, 2, 3], 'naturaIndice', [3]],
  ]
  it.each(CAZURI)('%s: %j', (natura, v, cu, cheie, args) => {
    expect(incalca(natura, v, cu)).toEqual({ cheie, args })
  })

  const BUNE: [Natura, Valoare, Valoare | undefined][] = [
    ['inferior', [[2, 0], [1, 3]], undefined],
    ['superior', [[2, 1], [0, 3]], undefined],
    // A[1] si A[2] nesingulare; A insasi poate fi singulara
    ['lider', [[1, 2, 3], [4, 5, 6], [7, 8, 9]], undefined],
    ['nesingulara', [[0, 1], [1, 0]], undefined],
    ['spd', [[4, 2, 2], [2, 5, 3], [2, 3, 6]], undefined],
    ['coloaneIndependente', [[2, 3], [-1, 1], [2, -1]], undefined],
    ['compatibil', [1, 2, 3], [[1, 0], [0, 1], [1, 1]]],
    ['toleranta', 0, undefined],
    ['toleranta', 1e-6, undefined],
    ['iteratii', 1, undefined],
    ['indice', 3, [1, 2, 3]],
  ]
  it.each(BUNE)('%s are natura cerută: %j', (natura, v, cu) => {
    expect(incalca(natura, v, cu)).toBeNull()
  })

  it('exemplele din bibliotecă au natura pe care o declară', () => {
    for (const alg of BIBLIOTECA) {
      const defs: Definitie[] = alg.intrari.map((i) => ({ nume: i.nume, tip: i.tip, text: typeof i.exemplu === 'number' ? String(i.exemplu) : Array.isArray(i.exemplu[0]) ? (i.exemplu as number[][]).map((l) => l.join(' ')).join('\n') : (i.exemplu as number[]).join(' ') }))
      defs.forEach((_, k) => expect(abatere(defs, k, alg.intrari), `${alg.id}.${defs[k].nume}`).toBeNull())
    }
  })

  it('o intrare redenumită sau cu alt tip nu mai e judecată după natura din bibliotecă', () => {
    const alg = algoritm('UTRIS')!
    const U: Definitie = { nume: 'U', tip: 'matrice', text: '1 2\n3 4' }
    expect(abatere([U], 0, alg.intrari)?.cheie).toBe('naturaSuperior')
    expect(abatere([{ ...U, nume: 'V' }], 0, alg.intrari)).toBeNull()
    expect(abatere([{ ...U, text: '1 2\n3' }], 0, alg.intrari)).toBeNull()
  })

  it('o matrice bună ca natură, dar fără condiția de convergență din curs, primește o notă: Jacobi cere dominanța, Gauss-Seidel o acceptă și pe cea pozitiv definită', () => {
    const A = (text: string): Definitie[] => [{ nume: 'A', tip: 'matrice', text }]
    const jacobi = algoritm('JACOBI')!.intrari
    const gs = algoritm('GS')!.intrari
    // exemplele din curs sunt strict diagonal dominante
    expect(faraGarantie(A('2 1\n5 7'), 0, jacobi)).toBeNull()
    expect(faraGarantie(A('16 3\n7 -11'), 0, gs)).toBeNull()
    // Jacobi pe [1 2; 3 1]: D⁻¹N = [0 -2; -3 0], cu valorile proprii ±√6
    const j = faraGarantie(A('1 2\n3 1'), 0, jacobi)!
    expect(j.cheie).toBe('garantieJacobi')
    expect(j.rho).toBeCloseTo(Math.sqrt(6), 3)
    // Gauss-Seidel: L⁻¹U = [0 -2; 0 6], deci ρ = 6
    const g = faraGarantie(A('1 2\n3 1'), 0, gs)!
    expect(g.cheie).toBe('garantieGS')
    expect(g.rho).toBeCloseTo(6, 3)
    // simetrica si pozitiv definita, fara dominanta: 2 nu e mai mare decat 1.5 + 1
    expect(faraGarantie(A('2 1.5 1\n1.5 2 1\n1 1 2'), 0, jacobi)!.cheie).toBe('garantieJacobi')
    expect(faraGarantie(A('2 1.5 1\n1.5 2 1\n1 1 2'), 0, gs)).toBeNull()
    // fara dominanta, dar cu ρ < 1, deci Jacobi converge totusi: [1 0.6; 0.7 0.5], ρ = √(0.6 · 0.7 / 0.5)
    expect(faraGarantie(A('1 0.6\n0.7 0.5'), 0, jacobi)!.rho).toBeCloseTo(Math.sqrt(0.84), 3)
    // alte intrari si alti algoritmi nu au o astfel de conditie
    expect(faraGarantie([{ nume: 'b', tip: 'vector', text: '1 2' }], 0, jacobi)).toBeNull()
    expect(faraGarantie(A('1 2\n3 1'), 0, algoritm('GPP')!.intrari)).toBeNull()
  })

  it('generatorul direct: fiecare natură de matrice, la mai multe mărimi', () => {
    const rnd = generator(21)
    const naturi: Natura[] = ['inferior', 'superior', 'lider', 'nesingulara', 'spd', 'diagonalaNenula', 'liniiNenule', 'coloaneIndependente']
    for (const natura of naturi)
      for (const n of [1, 2, 3, 6])
        for (let k = 0; k < 25; k++) {
          const v = genereaza({ tip: 'matrice', natura, forma: [natura === 'coloaneIndependente' ? n + 2 : n, n] }, rnd)
          expect(incalca(natura, v), `${natura} ${JSON.stringify(v)}`).toBeNull()
        }
  })
})
