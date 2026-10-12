import { afterEach, describe, expect, it } from 'vitest'
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
