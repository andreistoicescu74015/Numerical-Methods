import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { BIBLIOTECA, type Algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'

function intrariExemplu(alg: Algoritm) {
  return Object.fromEntries(alg.intrari.map((i) => [i.nume, i.exemplu]))
}

describe('formulele fiecărui pas sunt LaTeX valid pentru KaTeX', () => {
  for (const alg of BIBLIOTECA) {
    it(`${alg.id}, cu culori, pe exemplul din bibliotecă`, () => {
      const rez = urma(parseaza(alg.sursa), intrariExemplu(alg), { culori: true })
      expect(rez.final).toBe('gata')
      for (const pas of rez.pasi) {
        if (!pas.formula) continue
        expect(() => katex.renderToString(pas.formula!, { throwOnError: true, trust: true, strict: false })).not.toThrow()
      }
    })
  }

  it('ținta, pivotul și elementele citite primesc clasele lor', () => {
    const rez = urma(parseaza(BIBLIOTECA.find((a) => a.id === 'G')!.sursa), { A: [[1, 2, 1], [2, 1, 2], [1, 1, 2]] }, { culori: true })
    const primul = rez.pasi.find((p) => p.celule.some((c) => c.rol === 'scris'))!
    expect(primul.formula).toBe(
      '\\htmlClass{rol-scris}{a_{21}} \\leftarrow \\htmlClass{rol-scris}{\\mu_{21}} = \\htmlClass{rol-citit}{a_{21}} / \\htmlClass{rol-pivot}{a_{11}} = 2 / 1 = 2',
    )
    const html = katex.renderToString(primul.formula!, { throwOnError: true, trust: true, strict: false })
    expect(html).toContain('rol-pivot')
  })
})
