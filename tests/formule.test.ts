import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { bucatiFormula, grupuriRupt, rupturi } from '../src/componente/Formula'
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

describe('formulele care se pot rupe pe rânduri păstrează intervalele și indicii întregi', () => {
  it('\\nobreak după ":" și după "+" sau "-" urmate de o cifră; textul, clasele și termenii rămân neatinși', () => {
    expect(rupturi('i = k+1 : n')).toBe('i = k+\\nobreak 1 :\\nobreak  n')
    expect(rupturi('A(i,\\, k+1\\!:\\!n)')).toBe('A(i,\\, k+\\nobreak 1\\!:\\nobreak \\!n)')
    expect(rupturi('x^{k-1}')).toBe('x^{k-\\nobreak 1}')
    // doua formule alaturate pot trece una sub alta
    expect(rupturi('L = 1, \\quad U = 2')).toBe('L = 1, \\quad\\allowbreak  U = 2')
    expect(rupturi('L = 1, \\qquad U = 2')).toBe('L = 1, \\qquad\\allowbreak  U = 2')
    for (const tex of ['\\htmlClass{rol-pivot}{a_{11}}', '\\text{pasul 1-2: gata}', 'a_{ij} - \\mu_{ik} a_{kj}']) expect(rupturi(tex)).toBe(tex)
  })

  it('formula pasului se taie în bucăți la „=” de pe primul nivel, nu în paranteze sau acolade', () => {
    expect(bucatiFormula('a_{21} \\leftarrow \\mu_{21} = a_{21} / a_{11} = 2 / 1 = 2')).toEqual(['a_{21} \\leftarrow \\mu_{21}', '= a_{21} / a_{11}', '= 2 / 1', '= 2'])
    expect(bucatiFormula('k \\leftarrow 2 \\qquad (k = 1 : 3)')).toEqual(['k \\leftarrow 2 \\qquad (k = 1 : 3)'])
    expect(bucatiFormula('s \\leftarrow \\sum_{j=1}^{k-1} x_j = 3')).toEqual(['s \\leftarrow \\sum_{j=1}^{k-1} x_j', '= 3'])
    expect(bucatiFormula('y \\leftarrow \\left( b_2 - 1 \\right) / \\htmlClass{rol-pivot}{a_{22}} = (13 - 5) / 7 = \\;?')).toEqual([
      'y \\leftarrow \\left( b_2 - 1 \\right) / \\htmlClass{rol-pivot}{a_{22}}',
      '= (13 - 5) / 7',
      '= \\;?',
    ])
    expect(bucatiFormula('a_{11} = 0 \\text{fals}')).toEqual(['a_{11}', '= 0 \\text{fals}'])
  })

  it('o formulă din sertar se rupe doar între relațiile despărțite prin \\quad', () => {
    expect(grupuriRupt('D\\, x = N\\, x + b, \\qquad A = D - N, \\quad D = \\mathrm{diag}(a_{11})')).toBe('{D\\, x = N\\, x + b,} \\qquad {A = D - N,} \\quad {D = \\mathrm{diag}(a_{11})}')
    expect(grupuriRupt('A = LU')).toBe('A = LU')
    const html = katex.renderToString(`\\displaystyle ${rupturi(grupuriRupt('A = D - N, \\qquad D = I'))}`, { throwOnError: true, strict: false })
    // KaTeX rupe randul doar intre cutiile .katex-base; cele doua relatii raman fiecare intr-una
    expect(html.match(/class="katex-base"/g)?.length).toBe(2)
  })

  it('forma, etapele și definițiile rămân LaTeX valid după transformare', () => {
    const tex = [...BIBLIOTECA.flatMap((a) => [a.forma, ...a.etape.map((e) => e.tex)]), ...Object.values(OPERATII).map((o) => o.definitie)]
    for (const t of tex) {
      expect(() => katex.renderToString(rupturi(t), { throwOnError: true, trust: true, strict: false }), t).not.toThrow()
      expect(() => katex.renderToString(`\\displaystyle ${rupturi(grupuriRupt(t))}`, { throwOnError: true, trust: true, strict: false }), t).not.toThrow()
    }
  })
})
