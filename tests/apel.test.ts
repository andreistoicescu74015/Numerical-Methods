// Apelurile de algoritmi din biblioteca in pseudocod: parsarea, rularea ca un singur pas cu
// flopii algoritmului apelat si iesirile in tinte, erorile si opririle lui, codul Python cu
// functiile apelate.
import { describe, expect, it } from 'vitest'
import { variabilePeLinie } from '../src/motor/analiza'
import { algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { emitePython } from '../src/motor/python'
import { abatereV } from './ajutor'

const A = [
  [1, 2, 1],
  [2, 1, 2],
  [1, 1, 2],
]
const b = [4, 5, 4]
// S_GPP scris cu apeluri, ca pe slide: GPP, aceleasi interschimbari si multiplicatori pe b, UTRIS
export const SURSA = `[U, p] ← GPP(A)
d ← b
pentru k = 1 : n-1
    d_k ↔ d_{p_k}
    pentru i = k+1 : n
        d_i ← d_i - u_ik d_k
x ← UTRIS(U, d)`

describe('apelurile de algoritmi din bibliotecă', () => {
  it('se parsează cu una sau mai multe ținte și cu nume cu "_"; o țintă cu indice nu primește un apel', () => {
    const p = parseaza(SURSA)
    expect(p.instr[0]).toEqual({ tip: 'apel', linie: 1, tinte: ['U', 'p'], nume: 'GPP', args: [{ tip: 'var', nume: 'A' }] })
    expect(p.instr.at(-1)).toMatchObject({ tip: 'apel', linie: 7, tinte: ['x'], nume: 'UTRIS' })
    expect(parseaza('y ← S_GPP(A, b)').instr[0]).toMatchObject({ tip: 'apel', nume: 'S_GPP', tinte: ['y'] })
    expect(parseaza('y = JACOBI(A, b, x, 0.001, 100)').instr[0]).toMatchObject({ tip: 'apel', nume: 'JACOBI' })
    expect(() => parseaza('x_1 ← UTRIS(U, b)')).toThrow(/x ← UTRIS/)
    expect(() => parseaza('[x] ← 3')).toThrow(/GPP\(A\)/)
    // intr-o expresie, un nume urmat de indici ramane un element
    expect(parseaza('t ← a_ij + U(i, j)').instr[0]).toMatchObject({ tip: 'atrib' })
  })

  it('GPP, apoi substituția pe b, apoi UTRIS dau soluția lui S_GPP, cu aceiași flopi', () => {
    const program = parseaza(SURSA)
    const rez = urma(program, { A, b })
    expect(rez.final).toBe('gata')
    const ref = urma(parseaza(algoritm('S_GPP')!.sursa), { A, b })
    expect(abatereV(rez.stare.x.d, ref.stare.x.d)).toBeLessThan(1e-12)
    expect(rez.flopi).toBe(ref.flopi)
    const apel = rez.pasi[0]
    expect(apel.fel).toBe('apel')
    expect(apel.apel).toMatchObject({ id: 'GPP', intrari: { A } })
    expect(apel.apel!.pasi).toBeGreaterThan(1)
    expect(apel.flopi).toBe(apel.apel!.flopi)
    // A este citita, U si p sunt scrise la acest pas; nu e nimic de ascuns in modul exercitiu
    expect(apel.celule.filter((c) => c.nume === 'A' && c.rol === 'citit')).toHaveLength(9)
    expect(apel.celule.filter((c) => c.nume === 'U' && c.rol === 'scris')).toHaveLength(9)
    expect(apel.celule.filter((c) => c.nume === 'p' && c.rol === 'scris')).toHaveLength(2)
    expect(apel.formula).toBe('[U, p] \\leftarrow \\mathrm{GPP}(A)')
    expect(apel.intrebare).toBeUndefined()
    expect(apel.noi && Object.keys(apel.noi).sort()).toEqual(['U', 'p'])
    expect(variabilePeLinie(program).get(7)).toEqual(['U', 'd'])
  })

  it('un apel într-o buclă rulează de fiecare dată; ieșirile scalare ajung în scalari', () => {
    const rez = urma(parseaza('pentru k = 1 : 3\n    y ← matvec(A, y)'), { A, y: [1, 0, 0] })
    expect(rez.final).toBe('gata')
    expect(rez.pasi.filter((p) => p.fel === 'apel')).toHaveLength(3)
    const mp = urma(parseaza('[y, i] ← MP(A, y, tol, maxiter)'), { A: [[2, 1], [1, 2]], y: [1, 0], tol: 1e-6, maxiter: 100 })
    expect(mp.final).toBe('gata')
    expect(mp.scalari.i).toBeGreaterThan(1)
    expect(mp.stare.y.n).toBe(2)
  })

  it('erorile și opririle algoritmului apelat ajung la apelant, cu numele lui', () => {
    const err = urma(parseaza('x ← LTRIS(L, b)'), { L: [[0, 0], [1, 1]], b: [1, 2] })
    expect(err.final).toBe('eroare')
    expect(err.eroare).toContain('LTRIS')
    const stop = urma(parseaza('R ← CHOL(A)'), { A: [[1, 2], [2, 1]] })
    expect(stop.final).toBe('stop')
    expect(stop.pasi.at(-1)!.mesaj).toContain('CHOL')
    expect(urma(parseaza('x ← UTRIS(U)'), { U: [[1]] }).eroare).toContain('2')
    expect(urma(parseaza('x ← UTRIS(b, b)'), { b: [1] }).eroare).toMatch(/matrice|matrix/)
    expect(urma(parseaza('[x, y, z] ← UTRIS(U, b)'), { U: [[1]], b: [1] }).eroare).toContain('3')
  })

  it('codul Python conține funcțiile apelate înaintea programului și apelurile, cu p ca poziții de la 0', () => {
    const cod = emitePython(parseaza(SURSA), { nume: 'rezolvare', intrari: [{ nume: 'A', tip: 'matrice' }, { nume: 'b', tip: 'vector' }], iesiri: ['x'] }).cod
    expect(cod).toContain('def GPP(A):')
    expect(cod).toContain('def UTRIS(U, b):')
    expect(cod).toContain('U, p = GPP(A)')
    expect(cod).toContain('x = UTRIS(U, d)')
    expect(cod).toContain('d[p[k]]')
    expect(cod.indexOf('def GPP')).toBeLessThan(cod.indexOf('def rezolvare'))
    expect(cod.indexOf('def UTRIS')).toBeLessThan(cod.indexOf('def rezolvare'))
    // numele functiei apelate ramane al ei chiar daca programul are o variabila cu acelasi nume
    const cu = emitePython(parseaza('G ← A\nU ← G(A)'), { nume: 'p', intrari: [{ nume: 'A', tip: 'matrice' }] }).cod
    expect(cu).toContain('def G(A):')
    expect(cu).toMatch(/G_2 = A\.copy\(\)/)
    expect(cu).toContain('U = G(A)')
  })
})
