// Modul exercitiu: ce se asteapta la un pas si cum se citeste raspunsul scris de mana.
import { describe, expect, it } from 'vitest'
import { asteptat, verifica } from '../src/exercitiu'
import { algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'

describe('răspunsul scris de mână', () => {
  it('numere cu punct, cu virgulă sau ca fracții; toleranța este 0.5%', () => {
    expect(verifica('0.5', [0.5])).toBe('corect')
    expect(verifica('0,5', [0.5])).toBe('corect')
    expect(verifica('1/2', [0.5])).toBe('corect')
    expect(verifica('2/3', [2 / 3])).toBe('corect')
    expect(verifica('0.667', [2 / 3])).toBe('corect')
    expect(verifica('0.66', [2 / 3])).toBe('gresit')
    expect(verifica('-1/3', [-1 / 3])).toBe('corect')
    // un zero calculat ca 1e-16 primeste si raspunsul 0
    expect(verifica('0', [1.4e-16])).toBe('corect')
  })

  it('mai multe valori, în ordine, despărțite prin spațiu, punct și virgulă sau virgulă urmată de spațiu', () => {
    expect(verifica('1 2 3', [1, 2, 3])).toBe('corect')
    expect(verifica('1; 2; 3', [1, 2, 3])).toBe('corect')
    expect(verifica('1, 2, 3', [1, 2, 3])).toBe('corect')
    expect(verifica('1 3 2', [1, 2, 3])).toBe('gresit')
    expect(verifica('1 2', [1, 2, 3])).toBe('necitit')
    expect(verifica('1 doi 3', [1, 2, 3])).toBe('necitit')
    expect(verifica('1/0', [1])).toBe('necitit')
  })

  it('condiții: adevărat, fals și variantele lor', () => {
    for (const da of ['adevărat', 'adevarat', 'Da', 'true', 'a', '1']) expect(verifica(da, true)).toBe('corect')
    for (const nu of ['fals', 'nu', 'false', 'f', '0']) expect(verifica(nu, true)).toBe('gresit')
    expect(verifica('poate', true)).toBe('necitit')
  })
})

describe('ce se așteaptă la un pas', () => {
  it('o atribuire pe un element, un scalar, un tablou întreg și o condiție', () => {
    const g = urma(parseaza(algoritm('G')!.sursa), { A: [[1, 2, 1], [2, 1, 2], [1, 1, 2]] })
    // pasul 3: a_21 ← μ_21 = 2
    expect(asteptat(g.pasi[2])).toEqual([2])
    // antetul buclei nu calculeaza nimic de raspuns
    expect(asteptat(g.pasi[0])).toBeNull()
    const j = urma(parseaza(algoritm('JACOBI')!.sursa), { A: [[2, 1], [5, 7]], b: [11, 13], x: [1, 1], tol: 1e-3, maxiter: 100 })
    // r ← A x - b scrie un vector intreg
    const r = j.pasi.find((p) => p.noi?.r)!
    expect(asteptat(r)).toEqual([2 + 1 - 11, 5 + 7 - 13])
    const e = j.pasi.find((p) => p.scalarScris?.nume === 'e')!
    expect(asteptat(e)).toEqual([e.scalari.e])
    const cond = j.pasi.find((p) => p.fel === 'conditie')!
    expect(asteptat(cond)).toBe(true)
  })
})
