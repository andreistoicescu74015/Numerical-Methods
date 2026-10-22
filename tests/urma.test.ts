import { describe, expect, it } from 'vitest'
import { variabilePeLinie } from '../src/motor/analiza'
import { BIBLIOTECA, algoritm, type Algoritm } from '../src/motor/biblioteca'
import { CADRU, stareLa, urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { valoareDinText, virgulaZecimala } from '../src/intrari'

function intrariExemplu(alg: Algoritm) {
  return Object.fromEntries(alg.intrari.map((i) => [i.nume, i.exemplu]))
}

describe('diferențele și cadrele refac starea de la orice pas', () => {
  for (const alg of BIBLIOTECA) {
    it(`${alg.id}: stareLa coincide cu instantaneele complete`, () => {
      const program = parseaza(alg.sursa)
      const cadre = urma(program, intrariExemplu(alg))
      const toate = urma(program, intrariExemplu(alg), { instantanee: 'toate' })
      expect(cadre.pasi.length).toBe(toate.pasi.length)
      const cuCadru = cadre.pasi.filter((p) => p.stare).length
      expect(cuCadru).toBe(Math.ceil(cadre.pasi.length / CADRU))
      for (let k = 0; k < toate.pasi.length; k++) expect(stareLa(cadre, k), `pasul ${k}`).toEqual(toate.pasi[k].stare)
      expect(stareLa(cadre, cadre.pasi.length - 1)).toEqual(cadre.stare)
    })
  }

  it('un program lung trece de un cadru', () => {
    const A = Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => (i === j ? 10 : (i * 3 + j) % 5)))
    const program = parseaza(algoritm('G')!.sursa)
    const cadre = urma(program, { A })
    const toate = urma(program, { A }, { instantanee: 'toate' })
    expect(cadre.pasi.length).toBeGreaterThan(CADRU)
    for (const k of [0, 1, CADRU - 1, CADRU, CADRU + 1, 250, cadre.pasi.length - 1]) expect(stareLa(cadre, k)).toEqual(toate.pasi[k].stare)
  })
})

describe('felul pașilor și rolurile', () => {
  it('matvec: fie marchează celulele noi, anteturile nu scriu nimic', () => {
    const alg = algoritm('matvec')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    expect(rez.pasi[0].fel).toBe('fie')
    expect(rez.pasi[0].celule.filter((c) => c.rol === 'scris')).toHaveLength(4)
    expect(rez.pasi[0].noi?.y.nou.n).toBe(4)
    expect(rez.pasi[1].fel).toBe('antet')
    expect(rez.pasi[1].celule).toHaveLength(0)
    expect(rez.pasi.at(-1)?.fel).toBe('final')
  })

  it('G: scrierile etichetate cu μ sunt multiplicatori, celelalte nu', () => {
    const alg = algoritm('G')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    const scrieri = rez.pasi.filter((p) => p.fel === 'atrib')
    expect(scrieri[0].celule.find((c) => c.rol === 'scris')?.mult).toBe(true)
    expect(scrieri[2].celule.find((c) => c.rol === 'scris')?.mult).toBeUndefined()
  })

  it('GPP: interschimbarea are felul ei și două scrieri cu valorile vechi', () => {
    const alg = algoritm('GPP')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    const schimb = rez.pasi.find((p) => p.fel === 'schimb')!
    expect(schimb.scrieri).toHaveLength(2)
    expect(schimb.scrieri[0].vechi).toBe(schimb.scrieri[1].nou)
    expect(schimb.scrieri[1].vechi).toBe(schimb.scrieri[0].nou)
  })

  it('MP: formula numerică scrie vectorii coloană și matricea întreagă', () => {
    const alg = algoritm('MP')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    const y = '\\begin{bmatrix} 1 \\\\ 0 \\\\ 0 \\\\ 0 \\end{bmatrix}'
    expect(rez.pasi[0].formula).toBe(`y \\leftarrow y / \\left\\|y\\right\\| = ${y} / \\left\\|${y}\\right\\| = ${y}`)
    const matvec = rez.pasi.find((p) => p.linie === 4)!
    expect(matvec.formula).toBe(`z \\leftarrow A\\,y = \\begin{bmatrix} 2 & 3 & 2 & -6 \\\\ 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 1 & 0 \\end{bmatrix} \\cdot ${y} = \\begin{bmatrix} 2 \\\\ 1 \\\\ 0 \\\\ 0 \\end{bmatrix}`)
  })
})

describe('variabilele fiecărei linii', () => {
  it('G: ținta, eticheta și expresia, în ordinea apariției', () => {
    const v = variabilePeLinie(parseaza(algoritm('G')!.sursa))
    expect(v.get(2)).toEqual(['k', 'n'])
    expect(v.get(4)).toEqual(['i', 'k'])
    expect(v.get(7)).toEqual(['i', 'j', 'k'])
  })

  it('variabila sumei nu apare, dar limitele ei da', () => {
    const v = variabilePeLinie(parseaza('s ← Σ_{j=1}^{k-1} l_ij l_kj'))
    expect(v.get(1)).toEqual(['k', 'i'])
  })
})

describe('virgula zecimală în intrări', () => {
  it('se recunoaște când nu e separator', () => {
    expect(virgulaZecimala('0,5')).toBe('0.5')
    expect(virgulaZecimala('0,5 1,25 -2')).toBe('0.5 1.25 -2')
    expect(virgulaZecimala('1,2,3')).toBe('1,2,3')
    expect(virgulaZecimala('1, 2, 3')).toBe('1, 2, 3')
    expect(virgulaZecimala('1 2 3')).toBe('1 2 3')
  })

  it('Infinity și numerele prea mari pentru virgula mobilă nu sunt valori de intrare', () => {
    expect(() => valoareDinText('matrice', 'A', 'Infinity 1\n1 1')).toThrow('"Infinity" nu este număr')
    expect(() => valoareDinText('vector', 'x', '1e400 1')).toThrow('"1e400" nu este număr')
    expect(valoareDinText('vector', 'x', '1e300 1')).toEqual([1e300, 1])
  })
})
