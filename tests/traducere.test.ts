// Pseudocodul din biblioteca in engleza: aceleasi linii, aceleasi rezultate, fara cuvinte cheie romanesti.
import { describe, expect, it } from 'vitest'
import { BIBLIOTECA } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { inEngleza } from '../src/motor/traducere'

const exemplu = (a: (typeof BIBLIOTECA)[number]) => Object.fromEntries(a.intrari.map((i) => [i.nume, i.exemplu]))

describe('pseudocodul din bibliotecă, în engleză', () => {
  for (const alg of BIBLIOTECA) {
    it(`${alg.id}: aceleași linii, aceleași valori și același număr de flopi`, () => {
      const en = inEngleza(alg.sursa)
      expect(en.split('\n')).toHaveLength(alg.sursa.split('\n').length)
      // nimic romanesc in afara numelor de variabile
      expect(en).not.toMatch(/\b(pentru|atunci|altfel|peste|fie)\b|dacă|cât timp|convers|definită|slide-ul|față/)
      const ro = urma(parseaza(alg.sursa), exemplu(alg), { cifre: alg.cifre })
      const eng = urma(parseaza(en), exemplu(alg), { cifre: alg.cifre })
      expect(eng.final).toBe(ro.final)
      expect(eng.flopi).toBe(ro.flopi)
      expect(eng.pasi.length).toBe(ro.pasi.length)
      expect(eng.stare).toEqual(ro.stare)
      expect(eng.pasi.map((p) => p.linie)).toEqual(ro.pasi.map((p) => p.linie))
    })
  }

  it('mesajul de oprire și comentariile se traduc; numele din șiruri și comentarii necunoscute rămân', () => {
    expect(inEngleza("dacă α ≤ 0 atunci stop 'A nu este pozitiv definită'")).toBe("if α ≤ 0 then stop 'A is not positive definite'")
    expect(inEngleza('β ← 0    % nu este pe slide')).toBe('β ← 0    % not on the slide')
    expect(inEngleza("tipărește 'pentru fiecare'")).toBe("print 'pentru fiecare'")
    // o variabila care incepe cu un cuvant cheie nu se atinge
    expect(inEngleza('pentrux ← fie1 + 1')).toBe('pentrux ← fie1 + 1')
  })
})
