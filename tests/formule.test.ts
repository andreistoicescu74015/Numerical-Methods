import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { TEXTE } from '../src/i18n'
import { BIBLIOTECA, type Algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { NOTIUNI } from '../src/notiuni'
import { OPERATII } from '../src/operatii'

function intrariExemplu(alg: Algoritm) {
  return Object.fromEntries(alg.intrari.map((i) => [i.nume, i.exemplu]))
}

describe('formulele scrise de mână sunt LaTeX valid pentru KaTeX', () => {
  const valid = (tex: string, unde: string) => expect(() => katex.renderToString(tex, { throwOnError: true, strict: false }), `${unde}: ${tex}`).not.toThrow()

  it('forma matriceală și etapele fiecărui algoritm, cu liniile în ordine și în pseudocod', () => {
    for (const alg of BIBLIOTECA) {
      valid(alg.forma, alg.id)
      const linii = alg.sursa.split('\n').length
      for (const e of alg.etape) {
        valid(e.tex, alg.id)
        expect(e.linii[0], alg.id).toBeGreaterThanOrEqual(1)
        expect(e.linii[0], alg.id).toBeLessThanOrEqual(e.linii[1])
        expect(e.linii[1], alg.id).toBeLessThanOrEqual(linii)
      }
    }
  })

  it('noțiunile și definițiile operațiilor', () => {
    for (const n of NOTIUNI) if (n.formula) valid(n.formula, n.id)
    for (const [fel, o] of Object.entries(OPERATII)) valid(o.definitie, fel)
  })

  it('fiecare noțiune cerută de un algoritm există', () => {
    for (const alg of BIBLIOTECA) for (const id of alg.notiuni) expect(NOTIUNI.some((n) => n.id === id), `${alg.id}: ${id}`).toBe(true)
  })

  it('fiecare algoritm începe nota "În curs" cu locul lui: cursul și slide-ul, sau cartea cursului', () => {
    for (const alg of BIBLIOTECA) {
      expect(alg.curs.ro, alg.id).toMatch(/^(Curs (I|II|III|IV|V|VI), slide-(ul|urile) "[^"]+"|Algoritmul [\d.]+ \(\w+\) din cartea cursului|Cartea cursului, secțiunea [\d.]+ "[^"]+")/)
      expect(alg.curs.en, alg.id).toMatch(/^(Course (I|II|III|IV|V|VI), slides? "[^"]+"|Algorithm [\d.]+ \(\w+\) in the book of the course|The book of the course, section [\d.]+ "[^"]+")/)
      // slide-ul citat este acelasi in ambele limbi
      expect(alg.curs.en.match(/"[^"]+"/)?.[0], alg.id).toBe(alg.curs.ro.match(/"[^"]+"/)?.[0])
    }
  })

  it('textele nu au ghilimele tipografice, linii de pauză sau săgeți decorative', () => {
    const texte = [
      ...BIBLIOTECA.flatMap((a) => [a.titlu, a.descriere, a.curs, a.cost, a.practic, ...a.etape.map((e) => e.text), ...a.intrari.map((i) => i.descriere)]),
      ...NOTIUNI.flatMap((n) => [n.titlu, n.text, ...(n.exemplu ? [n.exemplu] : [])]),
      ...Object.values(TEXTE),
    ]
    for (const t of texte) for (const s of [t.ro, t.en]) expect(s).not.toMatch(/[„”“’‘–—→]/)
  })
})

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
