import { afterEach, describe, expect, it } from 'vitest'
import { nrPasi, text } from '../src/i18n'
import { algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { setLimba } from '../src/motor/mesaje'
import { parseaza } from '../src/motor/parser'

afterEach(() => setLimba('ro'))

describe('mesajele motorului urmează limba aleasă', () => {
  it('eroarea de rulare, în engleză', () => {
    setLimba('en')
    const rez = urma(parseaza(algoritm('G')!.sursa), { A: [[0, 1], [1, 1]] })
    expect(rez.eroare).toBe('line 4: division by zero')
    expect(rez.pasi.find((p) => p.mesaj?.startsWith('no iteration'))).toBeUndefined()
  })

  it('eroarea de sintaxă, în engleză, cu linia', () => {
    setLimba('en')
    expect(() => parseaza('for i = 1 : n\nx ← 1')).toThrow('the loop body is missing: indent the lines under "for"')
  })

  it('pasul fără iterații și condițiile, în engleză', () => {
    setLimba('en')
    const rez = urma(parseaza(algoritm('LTRIS')!.sursa), { L: [[2, 0], [1, 4]], b: [2, 9] })
    expect(rez.pasi.find((p) => p.mesaj === 'no iteration: the range is empty')).toBeDefined()
    expect(rez.pasi.at(-1)?.mesaj).toBe('the algorithm has finished')
    const chol = urma(parseaza(algoritm('CHOL')!.sursa), { A: [[4, 2], [2, 5]] })
    expect(chol.pasi.find((p) => p.formula?.includes('\\text{false}'))).toBeDefined()
  })
})

describe('numărul de pași, acordat', () => {
  it('singular la 1, "de" de la 20 în română, plural în engleză', () => {
    expect([0, 1, 2, 19, 20, 101, 120].map((n) => nrPasi('ro', n, true))).toEqual(['0 pași compleți', '1 pas complet', '2 pași compleți', '19 pași compleți', '20 de pași compleți', '101 pași compleți', '120 de pași compleți'])
    expect([0.5, 1, 2].map((n) => nrPasi('ro', n))).toEqual(['0.5 pași', '1 pas', '2 pași'])
    expect([1, 2].map((n) => nrPasi('en', n, true))).toEqual(['1 complete step', '2 complete steps'])
    expect(nrPasi('en', 1)).toBe('1 step')
  })

  it('mesajele despre forma intrărilor acordă substantivul cu numărul', () => {
    expect(text('ro', 'naturaPatrata', 'A', 1, 3)).toBe('A trebuie să fie pătrată; are 1 linie și 3 coloane.')
    expect(text('en', 'naturaPatrata', 'A', 1, 3)).toBe('A must be square; it has 1 row and 3 columns.')
    expect(text('ro', 'naturaLiniiColoane', 'x', 20, 'A', 3)).toBe('x trebuie să aibă 20 de linii, câte coloane are A; are 3.')
    expect(text('ro', 'naturaLungimeLinii', 'b', 1, 'A', 2)).toBe('b trebuie să aibă 1 element, câte linii are A; are 2.')
  })
})
