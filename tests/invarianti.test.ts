// Ce ramane adevarat dupa fiecare pas complet: pe intrari aleatoare cu natura ceruta, invariantul
// din curs se verifica la fiecare limita dintre pasi; o linie de pseudocod stricata il face sa pice.
import { describe, expect, it } from 'vitest'
import { invariant, limite } from '../src/invarianti'
import { algoritm } from '../src/motor/biblioteca'
import { urma, type Intrari } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'
import { genereaza, type Aleator } from '../src/natura'
import { generator } from './ajutor'

const mat = (natura: Aleator | undefined, forma: [number, number], rnd: () => number, latimi?: [number, number]) => genereaza({ tip: 'matrice', natura, forma, latimi }, rnd) as number[][]
const vec = (n: number, rnd: () => number) => genereaza({ tip: 'vector', natura: 'nenul', forma: [n, 1] }, rnd) as number[]

// intrarile fiecarui algoritm si numarul de pasi ai buclei exterioare
function cazuri(rnd: () => number): { id: string; intrari: Intrari; pasi: number }[] {
  const n = 5
  return [
    { id: 'G', intrari: { A: mat('lider', [n, n], rnd) }, pasi: n - 1 },
    { id: 'S_G', intrari: { A: mat('lider', [n, n], rnd), b: vec(n, rnd) }, pasi: n - 1 },
    { id: 'Gb', intrari: { A: mat('bandaLider', [n, n], rnd, [1, 2]), r: 1, q: 2 }, pasi: n - 1 },
    { id: 'GPP', intrari: { A: mat('nesingulara', [n, n], rnd) }, pasi: n - 1 },
    { id: 'S_GPP', intrari: { A: mat('nesingulara', [n, n], rnd), b: vec(n, rnd) }, pasi: n - 1 },
    { id: 'GPPb', intrari: { A: mat('bandaNesingulara', [n, n], rnd, [1, 1]), r: 1, q: 1 }, pasi: n - 1 },
    { id: 'LU', intrari: { A: mat('lider', [n, n], rnd) }, pasi: n },
    { id: 'CHOL', intrari: { A: mat('spd', [n, n], rnd) }, pasi: n },
    { id: 'QR', intrari: { A: mat('oarecare', [6, 4], rnd) }, pasi: 4 },
    { id: 'SQR', intrari: { A: mat('coloaneIndependente', [6, 3], rnd), b: vec(6, rnd) }, pasi: 3 },
    { id: 'LTRIS', intrari: { L: mat('inferior', [n, n], rnd), b: vec(n, rnd) }, pasi: n },
    { id: 'UTRIS', intrari: { U: mat('superior', [n, n], rnd), b: vec(n, rnd) }, pasi: n },
    { id: 'UTRISb', intrari: { U: mat('superiorBanda', [n, n], rnd, [0, 1]), b: vec(n, rnd), q: 1 }, pasi: n },
  ]
}

// cea mai mare abatere a invariantului, peste toate limitele dintre pasi
function abateri(id: string, sursa: string, intrari: Intrari) {
  const program = parseaza(sursa)
  const rez = urma(program, intrari, { instantanee: 'toate' })
  const lim = limite(program, rez)
  return { rez, lim, max: Math.max(...lim.map((l) => invariant(id, program, rez, intrari, l.pas)!.abatere)) }
}

describe('ce rămâne adevărat după fiecare pas', () => {
  it('invariantul din curs se verifică la fiecare limită dintre pași, pe intrări aleatoare', () => {
    for (const samanta of [1, 2, 3]) {
      for (const c of cazuri(generator(samanta))) {
        const { rez, lim, max } = abateri(c.id, algoritm(c.id)!.sursa, c.intrari)
        const unde = `${c.id}, sămânța ${samanta}`
        expect(rez.final, unde).toBe('gata')
        // o limita la inceputul fiecarui pas, plus iesirea din bucla
        expect(lim.map((l) => l.complete), unde).toEqual(Array.from({ length: c.pasi + 1 }, (_, i) => i))
        expect(lim.at(-1)!.final, unde).toBe(true)
        expect(max, unde).toBeLessThan(1e-10)
      }
    }
  })

  it('după un singur pas, enunțul e la singular, în ambele limbi', () => {
    for (const c of cazuri(generator(4))) {
      const program = parseaza(algoritm(c.id)!.sursa)
      const rez = urma(program, c.intrari)
      const inv = invariant(c.id, program, rez, c.intrari, limite(program, rez)[1].pas)!
      expect(inv.complete, c.id).toBe(1)
      const text = `${inv.text.ro} ${inv.text.en}`.replaceAll('{0}', '1')
      expect(text, c.id).not.toMatch(/(primele|primii|ultimele|first|last) 1\b/i)
    }
  })

  it('o linie stricată în G, CHOL sau QR face invariantul să pice', () => {
    const rnd = generator(7)
    const strica = (id: string, linie: string, stricata: string, intrari: Intrari) => {
      const sursa = algoritm(id)!.sursa
      expect(sursa, id).toContain(linie)
      return abateri(id, sursa.replace(linie, stricata), intrari).max
    }
    expect(strica('G', 'a_ij ← a_ij - μ_ik a_kj', 'a_ij ← a_ij - 0.9 μ_ik a_kj', { A: mat('lider', [4, 4], rnd) })).toBeGreaterThan(1e-6)
    expect(strica('CHOL', 'a_kk ← l_kk = √α', 'a_kk ← l_kk = √α + 0.01', { A: mat('spd', [4, 4], rnd) })).toBeGreaterThan(1e-6)
    expect(strica('QR', 'ν ← (Σ_{i=k}^{m} u_ik a_ij) / β_k', 'ν ← (Σ_{i=k}^{m} u_ik a_ij)', { A: mat('oarecare', [5, 3], rnd) })).toBeGreaterThan(1e-6)
    expect(strica('LTRIS', 'x_i ← x_i / l_ii', 'x_i ← x_i / (2 l_ii)', { L: mat('inferior', [4, 4], rnd), b: vec(4, rnd) })).toBeGreaterThan(1e-6)
  })

  it('pe exemplul de la G, după primul pas: zerouri sub pivot, iar enunțul spune A^(2) = M_1 A', () => {
    const alg = algoritm('G')!
    const program = parseaza(alg.sursa)
    const intrari = { A: [[1, 2, 1], [2, 1, 2], [1, 1, 2]] }
    const rez = urma(program, intrari)
    const al2lea = limite(program, rez)[1]
    const inv = invariant('G', program, rez, intrari, al2lea.pas)!
    expect(inv.complete).toBe(1)
    expect(inv.tex).toBe('A_{2} = M_{1}\\, A')
    expect(inv.abatere).toBeLessThan(1e-12)
  })

  it('o rulare oprită corect în buclă rămâne la începutul pasului la care s-a oprit, fără alarmă', () => {
    // CHOL pe o matrice care nu e pozitiv definita se opreste la pasul 2
    const program = parseaza(algoritm('CHOL')!.sursa)
    const intrari = { A: [[1, 2], [2, 1]] }
    const rez = urma(program, intrari)
    expect(rez.final).toBe('stop')
    const ultima = limite(program, rez).at(-1)!
    expect(ultima).toMatchObject({ complete: 1, final: false })
    expect(invariant('CHOL', program, rez, intrari, rez.pasi.length - 1)!.abatere).toBeLessThan(1e-12)
  })

  it('fără alarme false când elementele cresc: S_G pe 3 cifre, un pivot de 1e-7, o diagonală de 1e-3', () => {
    const pePas = (id: string, intrari: Intrari, cifre?: number) => {
      const program = parseaza(algoritm(id)!.sursa)
      const rez = urma(program, intrari, { cifre })
      return Math.max(...limite(program, rez).map((l) => invariant(id, program, rez, intrari, l.pas)!.abatere))
    }
    // exemplul din curs, cu 3 cifre: pragul pentru 3 cifre este 10^(2-3) = 0.1
    expect(pePas('S_G', { A: [[0.0001, 1], [1, 1]], b: [1, 2] }, 3)).toBeLessThan(0.1)
    const A = [[1e-7, 0.546, 0.832, -0.131], [0.409, 0.888, -0.972, -0.237], [0.244, 0.935, 0.031, 0.966], [0.538, -0.032, -0.041, -0.159]]
    expect(pePas('G', { A })).toBeLessThan(1e-9)
    const L = [[1e-3, 0, 0, 0], [0.5, 1e-3, 0, 0], [0.5, 0.9, 1e-3, 0], [0.8, 0.8, 0.7, 1e-3]]
    expect(pePas('LTRIS', { L, b: [-0.8, 0.8, 0.6, 0.8] })).toBeLessThan(1e-9)
  })

  it('pe un pseudocod modificat care iese din tablouri, invariantul nu aruncă excepții', () => {
    // LTRIS cu i = 1 : n+1 se opreste cu eroare la i = 4: invariantul ramane la cei 3 pasi compleți
    const ltris = parseaza(algoritm('LTRIS')!.sursa.replace('pentru i = 1 : n', 'pentru i = 1 : n+1'))
    const intrari = { L: [[2, 0, 0], [1, 3, 0], [-1, 2, 4]], b: [2, 7, 9] }
    const rez = urma(ltris, intrari)
    expect(rez.final).toBe('eroare')
    const inv = invariant('LTRIS', ltris, rez, intrari, rez.pasi.length - 1)!
    expect(inv.complete).toBe(3)
    expect(inv.abatere).toBeLessThan(1e-12)
    // GPP cu k = 1 : n citeste p_n, care nu exista; nicio limita nu arunca
    const gpp = parseaza(algoritm('GPP')!.sursa.replace('pentru k = 1 : n-1', 'pentru k = 1 : n'))
    const A = { A: [[1, 2, 1], [2, 1, 2], [1, 1, 2]] }
    const r2 = urma(gpp, A)
    for (let k = 0; k < r2.pasi.length; k++) expect(() => invariant('GPP', gpp, r2, A, k)).not.toThrow()
  })

  it('după ultimul pas, la Cholesky și la substituții, enunțul devine identitatea întreagă', () => {
    const cazuri: [string, Intrari, string][] = [
      ['CHOL', { A: [[4, 2, 2], [2, 5, 3], [2, 3, 6]] }, 'A = LL^T'],
      ['LU', { A: [[1, 2, 1], [2, 1, 2], [1, 1, 2]] }, 'A = LU'],
      ['LTRIS', { L: [[2, 0, 0], [1, 3, 0], [-1, 2, 4]], b: [2, 7, 9] }, 'Lx = b'],
    ]
    for (const [id, intrari, tex] of cazuri) {
      const program = parseaza(algoritm(id)!.sursa)
      const rez = urma(program, intrari)
      const ultima = limite(program, rez).at(-1)!
      const inv = invariant(id, program, rez, intrari, ultima.pas)!
      expect(inv.final, id).toBe(true)
      expect(inv.tex, id).toBe(tex)
      expect(inv.abatere, id).toBeLessThan(1e-12)
    }
  })
})
