// Ecuatia i a sistemului din scena: scrisa cu numerele curente, verificata cu x curent, iar linia
// marcata este variabila de linie a algoritmului, cand linia de pseudocod o foloseste.
import { describe, expect, it } from 'vitest'
import { ecuatia, linieEcuatie } from '../src/ecuatie'
import { variabilePeLinie } from '../src/motor/analiza'
import { BIBLIOTECA, algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { matriceDin, vectorDin } from '../src/motor/valori'

const exemplu = (id: string) => Object.fromEntries(algoritm(id)!.intrari.map((i) => [i.nume, i.exemplu]))

describe('ecuația i a sistemului', () => {
  const L = matriceDin([
    [2, 0, 0],
    [1, 3, 0],
    [-1, 2, 4],
  ])
  const b = vectorDin([2, 7, 9])

  it('scrie termenii cu coeficient nenul, fără coeficientul 1, cu semnul în față, și termenul liber', () => {
    expect(ecuatia(L, b, null, 'x', 1).tex).toBe('2\\,x_{1} = 2')
    expect(ecuatia(L, b, null, 'x', 2).tex).toBe('x_{1} + 3\\,x_{2} = 7')
    expect(ecuatia(L, b, null, 'x', 3).tex).toBe('-x_{1} + 2\\,x_{2} + 4\\,x_{3} = 9')
    expect(ecuatia(matriceDin([[0, 0]]), vectorDin([1]), null, 'x', 1).tex).toBe('0 = 1')
    expect(ecuatia(matriceDin([[0.5, -1]]), vectorDin([-2.5]), null, 'z', 1).tex).toBe('0.5\\,z_{1} - z_{2} = -2.5')
    // fara necunoscuta nu exista verificare
    expect(ecuatia(L, b, null, 'x', 2).verificare).toBeNull()
    expect(ecuatia(L, b, null, 'x', 2).satisfacuta).toBeNull()
  })

  it('cu x curent spune dacă ecuația este satisfăcută', () => {
    const x = vectorDin([1, 2, 1])
    const e2 = ecuatia(L, b, x, 'x', 2)
    expect(e2.satisfacuta).toBe(true)
    expect(e2.verificare).toBe('1 \\cdot 1 + 3 \\cdot 2 = 7')
    const e3 = ecuatia(L, b, x, 'x', 3)
    expect(e3.satisfacuta).toBe(false)
    expect(e3.verificare).toBe('-1 \\cdot 1 + 2 \\cdot 2 + 4 \\cdot 1 = 7 \\ne 9')
    // valorile negative stau in paranteze; o egalitate pana la cele 4 cifre scrise se arata cu ≈
    expect(ecuatia(L, b, vectorDin([-1, 0, 0]), 'x', 1).verificare).toBe('2 \\cdot (-1) = -2 \\ne 2')
    expect(ecuatia(L, b, vectorDin([1.00001, 0, 0]), 'x', 1).verificare).toBe('2 \\cdot 1 \\approx 2')
  })

  it('linia marcată la LTRIS: antetul "pentru i" și corpul lui, nu copierea x ← b', () => {
    const alg = algoritm('LTRIS')!
    const program = parseaza(alg.sursa)
    const rez = urma(program, exemplu('LTRIS'))
    const variabile = variabilePeLinie(program)
    const linii = rez.pasi.map((p) => linieEcuatie(alg, p, variabile.get(p.linie) ?? []))
    expect(linii[0]).toBeNull()
    expect(linii[1]).toBe(1)
    // ultimul pas cu o linie de cod este x_3 ← x_3 / l_33; pasul final nu are linie
    expect(linii.at(-2)).toBe(3)
    expect(linii.at(-1)).toBeNull()
    expect(new Set(linii.filter((l) => l !== null))).toEqual(new Set([1, 2, 3]))
    // un algoritm fara sistem nu marcheaza nimic
    expect(linieEcuatie(algoritm('G')!, rez.pasi[1], ['i'])).toBeNull()
  })

  it('fiecare algoritm cu sistem are matricea, necunoscuta și termenul liber în starea finală a exemplului, iar variabila de linie este o variabilă de buclă', () => {
    const cu = BIBLIOTECA.filter((a) => a.ecuatie)
    expect(cu.map((a) => a.id)).toEqual(['LTRIS', 'UTRIS', 'S_GPP', 'JACOBI', 'GS', 'KACZMARZ', 'MPI', 'S_G', 'UTRISb'])
    for (const a of cu) {
      const program = parseaza(a.sursa)
      const rez = urma(program, exemplu(a.id))
      const e = a.ecuatie!
      expect(rez.stare[e.A]?.tip, a.id).toBe('matrice')
      expect(rez.stare[e.x]?.tip, a.id).toBe('vector')
      expect(rez.stare[e.b]?.tip, a.id).toBe('vector')
      expect([...variabilePeLinie(program).values()].some((v) => v.includes(e.linie)), a.id).toBe(true)
      expect(rez.pasi.some((p) => linieEcuatie(a, p, variabilePeLinie(program).get(p.linie) ?? []) !== null), a.id).toBe(true)
    }
    // MPI: sistemul (μI − A) z = y pe copia B, cu linia l
    expect(algoritm('MPI')!.ecuatie).toEqual({ A: 'B', x: 'z', b: 'y', linie: 'l', tex: '(\\mu I - A)\\, z = y' })
  })

  it('fazele SQR acoperă toate liniile pseudocodului, în ordine', () => {
    const sqr = algoritm('SQR')!
    expect(sqr.faze!.map((f) => f.linii)).toEqual([
      [1, 14],
      [15, 20],
      [21, 24],
    ])
    expect(sqr.sursa.split('\n')).toHaveLength(24)
    expect(sqr.faze!.map((f) => f.tex)).toEqual(['Q^T A = R', 'd = Q^T b', "R' x = d'"])
    expect(BIBLIOTECA.filter((a) => a.faze).map((a) => a.id)).toEqual(['SQR'])
  })
})
