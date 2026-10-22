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
  it('se parsează: cu mai multe ținte sau cu nume cu "_" la parsare, cu nume simplu ca element care devine apel la rulare', () => {
    const p = parseaza(SURSA)
    expect(p.instr[0]).toEqual({ tip: 'apel', linie: 1, tinte: ['U', 'p'], nume: 'GPP', args: [{ tip: 'var', nume: 'A' }] })
    expect(p.instr.at(-1)).toMatchObject({ tip: 'atrib', linie: 7, tinta: { tip: 'var', nume: 'x' }, expr: { tip: 'elem', nume: 'UTRIS' } })
    expect(parseaza('y ← S_GPP(A, b)').instr[0]).toMatchObject({ tip: 'apel', nume: 'S_GPP', tinte: ['y'] })
    expect(parseaza('y = JACOBI(A, b, x, 0.001, 100)').instr[0]).toMatchObject({ tip: 'atrib', expr: { tip: 'elem', nume: 'JACOBI' } })
    expect(() => parseaza('x_1 ← S_GPP(A, b)')).toThrow(/x ← UTRIS/)
    expect(() => parseaza('[x] ← 3')).toThrow(/GPP\(A\)/)
    // intr-o expresie, un nume urmat de indici ramane un element
    expect(parseaza('t ← a_ij + U(i, j)').instr[0]).toMatchObject({ tip: 'atrib' })
  })

  it('un tablou numit ca un algoritm rămâne tablou, o țintă cu indice nu primește un apel, iar expresiile-argument costă flopii lor', () => {
    const g = urma(parseaza('t ← G(i, j)\nv ← G(1:2, 1)\ns ← G(1, 2) + 1'), { G: [[1, 2], [3, 4]], i: 1, j: 2 })
    expect(g.final).toBe('gata')
    expect(g.scalari.t).toBe(2)
    expect(g.stare.v.d).toEqual([1, 3])
    expect(g.scalari.s).toBe(3)
    const rau = urma(parseaza('x_1 ← UTRIS(U, b)'), { U: [[1]], b: [1] })
    expect(rau.final).toBe('eroare')
    expect(rau.eroare).toMatch(/x ← UTRIS/)
    // b - A x costa 18 flopi la apelant, UTRIS 9: la fel ca scris pe doua linii
    const U = [[2, 1, -1], [0, 3, 2], [0, 0, 4]]
    const cu = urma(parseaza('x ← UTRIS(U, b - A x)'), { U, A, b, x: [1, 1, 1] })
    const doua = urma(parseaza('d ← b - A x\nx ← UTRIS(U, d)'), { U, A, b, x: [1, 1, 1] })
    expect(cu.final).toBe('gata')
    expect(cu.flopi).toBe(27)
    expect(cu.flopi).toBe(doua.flopi)
    expect(cu.pasi[0].operatii?.map((o) => o.fel)).toEqual(['matvec', 'scadere'])
    expect(cu.stare.x.d).toEqual(doua.stare.x.d)
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
    const err = urma(parseaza('t ← 1\nx ← LTRIS(L, b)'), { L: [[0, 0], [1, 1]], b: [1, 2] })
    expect(err.final).toBe('eroare')
    // linia apelantului, numele algoritmului, mesajul lui fara linia din interiorul lui
    expect(err.eroare).toMatch(/^linia 2: LTRIS/)
    expect(err.eroare).not.toMatch(/linia 5/)
    // limita de pasi a apelantului se aplica si in apel
    const lung = urma(parseaza('[x, k] ← JACOBI(A, b, x, 0.001, 1000000)'), { A: [[1, 1], [1, 1]], b: [1, 1], x: [0, 0] }, { maxPasi: 100 })
    expect(lung.final).toBe('eroare')
    expect(lung.eroare).toContain('100')
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
    // o iesire-pozitii pe care programul o scrie apoi cu valori trece la valorile din pseudocod
    const poz = emitePython(parseaza('[U, p] ← GPP(A)\np_1 ← 1\nd ← b\npentru k = 1 : n-1\n    d_k ↔ d_{p_k}'), { nume: 'poz', intrari: [{ nume: 'A', tip: 'matrice' }, { nume: 'b', tip: 'vector' }], iesiri: ['d', 'p'] })
    expect(poz.cod).toContain('p = p + 1')
    expect(poz.indici).toEqual([])
    // programul nu poate purta numele functiei pe care o apeleaza
    const acelasi = emitePython(parseaza('[A, p] ← GPP(A)'), { nume: 'GPP', intrari: [{ nume: 'A', tip: 'matrice' }], iesiri: ['A', 'p'] }).cod
    expect(acelasi.match(/def GPP\(/g)).toHaveLength(1)
    expect(acelasi).toContain('def GPP_program(A):')
    // un tablou al programului numit ca un algoritm ramane tablou si in Python
    const tablou = emitePython(parseaza('t ← G(1, 2)'), { nume: 'p', intrari: [{ nume: 'G', tip: 'matrice' }] }).cod
    expect(tablou).toContain('t = G[0, 1]')
    expect(tablou).not.toContain('def G(')
  })
})
