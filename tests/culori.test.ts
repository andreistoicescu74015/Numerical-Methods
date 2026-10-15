// Culorile interfetei, masurate: contrastul WCAG al textelor si separarea rolurilor din grila
// sub daltonism simulat. Valorile se citesc din src/index.css si din src/paleta.ts, deci o
// culoare schimbata acolo trece din nou prin aceste praguri.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PALETA, type RolGrila } from '../src/paleta'
import type { Tema } from '../src/preferinte'

// Simularea lui Machado, Oliveira si Fernandes (2009), severitate 1.0, pe RGB liniar.
const MACHADO = {
  protanopie: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopie: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
}

const liniar = (hex: string): number[] =>
  [0, 2, 4].map((i) => {
    const c = parseInt(hex.replace('#', '').slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })

// raportul de contrast din WCAG 2
function contrast(a: string, b: string): number {
  const lum = (h: string) => {
    const [r, g, bl] = liniar(h)
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [mare, mic] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (mare + 0.05) / (mic + 0.05)
}

function oklab([r, g, b]: number[]): number[] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}

// distanta euclidiana in OKLab, inmultita cu 100; `vedere` simuleaza un daltonism
function distanta(a: string, b: string, vedere?: keyof typeof MACHADO): number {
  const vazut = (h: string) => {
    const v = liniar(h)
    return oklab(vedere ? MACHADO[vedere].map((rand) => Math.min(1, Math.max(0, rand[0] * v[0] + rand[1] * v[1] + rand[2] * v[2]))) : v)
  }
  const [x, y] = [vazut(a), vazut(b)]
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

// variabilele CSS ale unei teme: blocul :root pentru cea luminoasa, [data-tema='intunecat'] peste el
const css = readFileSync(join(__dirname, '..', 'src', 'index.css'), 'utf8')
function variabile(tema: Tema): Record<string, string> {
  const bloc = (selector: string) => Object.fromEntries([...css.slice(css.indexOf(selector)).split('}')[0].matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]))
  return tema === 'luminos' ? bloc(':root {') : { ...bloc(':root {'), ...bloc("[data-tema='intunecat'] {") }
}

// culorile de sintaxa ale editorului (src/componente/Editor.tsx): cuvintele cheie si functiile au
// culoarea titlurilor, textele si comentariile pe cea stearsa, numerele si operatorii pe cea a textului
const sintaxa = (v: Record<string, string>): Record<string, string> => ({ 'cuvânt cheie': v['--titlu'], funcție: v['--titlu'], număr: v['--text'], text: v['--text-sters'], comentariu: v['--text-sters'] })

const ROLURI: RolGrila[] = ['pivot', 'scris', 'citit', 'gata', 'mult', 'neatins']
const TEXT = 4.5
const GRAFIC = 3
// pragul de separare folosit pentru palete categoriale: 8 in OKLab x 100
const SEPARARE = 8

for (const tema of ['luminos', 'intunecat'] as const) {
  const v = variabile(tema)
  const fond = PALETA[tema]

  describe(`culorile temei ${tema}`, () => {
    it('numărul din celulă se citește pe fondul fiecărui rol', () => {
      for (const rol of ROLURI) expect(contrast(v['--text'], fond[rol]), rol).toBeGreaterThanOrEqual(TEXT)
    })

    it('fondurile rolurilor rămân distincte două câte două: vedere normală, protanopie, deuteranopie', () => {
      for (let i = 0; i < ROLURI.length; i++)
        for (let j = i + 1; j < ROLURI.length; j++)
          for (const vedere of [undefined, 'protanopie', 'deuteranopie'] as const)
            expect(distanta(fond[ROLURI[i]], fond[ROLURI[j]], vedere), `${ROLURI[i]} și ${ROLURI[j]}, ${vedere ?? 'vedere normală'}`).toBeGreaterThanOrEqual(SEPARARE)
    })

    it('culorile rolurilor din formulă (țintă, pivot, citit) se citesc pe panou și se disting între ele', () => {
      const formula = ['--c-scris', '--c-pivot', '--c-citit']
      for (const c of [...formula, '--c-gata', '--c-mult']) expect(contrast(v[c], v['--panou']), c).toBeGreaterThanOrEqual(TEXT)
      expect(contrast(v['--c-pivot'], v['--fundal']), 'mesajul de eroare pe fundal').toBeGreaterThanOrEqual(TEXT)
      for (let i = 0; i < formula.length; i++)
        for (let j = i + 1; j < formula.length; j++)
          for (const vedere of [undefined, 'protanopie', 'deuteranopie'] as const)
            expect(distanta(v[formula[i]], v[formula[j]], vedere), `${formula[i]} și ${formula[j]}, ${vedere ?? 'vedere normală'}`).toBeGreaterThanOrEqual(SEPARARE)
    })

    it('semnele din colțul celulei se văd pe fondul rolului lor', () => {
      expect(contrast(v['--c-mult'], fond.mult), 'litera μ').toBeGreaterThanOrEqual(TEXT)
      expect(contrast(v['--c-gata'], fond.gata), 'colțul verde').toBeGreaterThanOrEqual(GRAFIC)
    })

    it('textele interfeței au cel puțin 4.5:1, iar contururile comenzilor și linia graficului 3:1', () => {
      for (const text of ['--text', '--text-sters', '--text-slab', '--titlu'])
        for (const pe of ['--fundal', '--panou']) expect(contrast(v[text], v[pe]), `${text} pe ${pe}`).toBeGreaterThanOrEqual(TEXT)
      expect(contrast(v['--pe-titlu'], v['--titlu']), 'butonul principal').toBeGreaterThanOrEqual(TEXT)
      expect(contrast(v['--text'], v['--f-linie']), 'etapa curentă din lista operațiilor').toBeGreaterThanOrEqual(TEXT)
      for (const pe of ['--fundal', '--panou']) expect(contrast(v['--contur-control'], v[pe]), `conturul comenzilor pe ${pe}`).toBeGreaterThanOrEqual(GRAFIC)
      expect(contrast(v['--serie'], v['--panou']), 'linia graficului').toBeGreaterThanOrEqual(GRAFIC)
    })

    it('pseudocodul se citește pe linia curentă și pe linia cu eroare din editor', () => {
      for (const [ce, culoare] of Object.entries(sintaxa(v)))
        for (const linie of ['--f-linie', '--f-eroare']) expect(contrast(culoare, v[linie]), `${ce} pe ${linie}`).toBeGreaterThanOrEqual(TEXT)
    })
  })
}
