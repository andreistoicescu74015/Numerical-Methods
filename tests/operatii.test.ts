import { describe, expect, it } from 'vitest'
import { operatiiPeLinii } from '../src/motor/analiza'
import { algoritm, type Algoritm } from '../src/motor/biblioteca'
import { dimensiuni, urma, type Intrari } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'

function intrariExemplu(alg: Algoritm) {
  return Object.fromEntries(alg.intrari.map((i) => [i.nume, i.exemplu]))
}

const ruleaza = (sursa: string, intrari: Intrari) => urma(parseaza(sursa), intrari)

describe('operațiile dintre tablouri', () => {
  it('r ← A x - b: produsul matrice-vector și scăderea, cu forme și flopi', () => {
    const rez = ruleaza('r ← A x - b', { A: [[1, 2], [3, 4], [5, 6]], x: [1, 1], b: [1, 2, 3] })
    expect(rez.stare.r.d).toEqual([2, 5, 8])
    expect(rez.pasi[0].operatii).toEqual([
      { fel: 'matvec', tex: 'A\\,x', operanzi: [{ tip: 'matrice', m: 3, n: 2 }, { tip: 'vector', m: 2, n: 1 }], rezultat: { tip: 'vector', m: 3, n: 1 }, flopi: 9 },
      { fel: 'scadere', tex: 'A\\,x - b', operanzi: [{ tip: 'vector', m: 3, n: 1 }, { tip: 'vector', m: 3, n: 1 }], rezultat: { tip: 'vector', m: 3, n: 1 }, flopi: 3 },
    ])
  })

  it('produs de matrice, produs exterior, transpusă și norme', () => {
    const rez = ruleaza('C ← A B\nP ← x y^T\nT ← A^T\ns ← x^T y\nf ← ‖A‖_F\ng ← ‖x‖', { A: [[1, 2], [3, 4]], B: [[0, 1], [1, 0]], x: [1, 2], y: [3, 4] })
    expect(rez.final).toBe('gata')
    expect(rez.stare.C.d).toEqual([2, 1, 4, 3])
    expect(rez.stare.P.d).toEqual([3, 4, 6, 8])
    expect(rez.stare.T.d).toEqual([1, 3, 2, 4])
    expect(rez.scalari.s).toBe(11)
    expect(rez.scalari.f).toBeCloseTo(Math.sqrt(30), 12)
    expect(rez.pasi.map((p) => p.operatii?.map((o) => o.fel))).toEqual([['matmul'], ['exterior'], ['transpusa'], ['dot'], ['frobenius'], ['norma'], undefined])
    // 2 x 2 ori 2 x 2: patru elemente, fiecare cu doua inmultiri si o adunare
    expect(rez.pasi[0].operatii![0].flopi).toBe(12)
  })

  it('‖A‖ pe o matrice este norma spectrală din curs, deci se cere ‖A‖_F', () => {
    const A = [[1, 2], [3, 4]]
    const fara = ruleaza('f ← ‖A‖', { A })
    expect(fara.final).toBe('eroare')
    expect(fara.eroare).toContain('‖A‖_F')
    expect(ruleaza('f ← norm(A)', { A }).final).toBe('eroare')
    // o linie a matricei ramane un vector: ‖A(i, :)‖ din Kaczmarz merge
    const linie = ruleaza('f ← ‖A(2, :)‖', { A })
    expect(linie.final).toBe('gata')
    expect(linie.scalari.f).toBeCloseTo(5, 12)
  })

  it('doi vectori coloană nu se înmulțesc: mesajul spune ce să scrii', () => {
    const rez = ruleaza('s ← x y', { x: [1, 2], y: [3, 4] })
    expect(rez.final).toBe('eroare')
    expect(rez.eroare).toContain('x^T y')
  })

  it('lista pe linii a unui program oarecare, cu instrucțiunea așa cum e scrisă', () => {
    const program = parseaza('pentru i = 1 : n\n    y_i ← 0\nr ← A x - b\ne ← ‖r‖ / ‖b‖')
    const rez = urma(program, { A: [[1, 0], [0, 1]], x: [1, 2], b: [1, 1], y: [5, 5] })
    expect(operatiiPeLinii(program, rez.pasi)).toEqual([
      { linie: 3, tex: 'r \\leftarrow A\\,x - b', feluri: ['matvec', 'scadere'] },
      { linie: 4, tex: 'e \\leftarrow \\left\\|r\\right\\| / \\left\\|b\\right\\|', feluri: ['norma'] },
    ])
  })
})

describe('rezultatul ascuns', () => {
  it('un calcul are întrebare, o copiere sau o constantă nu', () => {
    const rez = ruleaza('s ← 0\nx ← b\ns ← s + b_1\nz ← 2 x', { b: [3, 4] })
    expect(rez.pasi[0].intrebare).toBeUndefined()
    expect(rez.pasi[1].intrebare).toBeUndefined()
    expect(rez.pasi[2].intrebare).toBe('s \\leftarrow s + b_{1} = 0 + 3 = \\;?')
    expect(rez.pasi[2].formula).toBe('s \\leftarrow s + b_{1} = 0 + 3 = 3')
    expect(rez.pasi[2].scalarScris).toEqual({ nume: 's', vechi: 0 })
    expect(rez.pasi[0].scalarScris).toEqual({ nume: 's', vechi: undefined })
    expect(rez.pasi[3].intrebare).toContain('= \\;?')
  })

  it('și condițiile au întrebare', () => {
    const rez = ruleaza('dacă a_11 > 0 atunci s ← 1', { A: [[2]] })
    expect(rez.pasi[0].fel).toBe('conditie')
    expect(rez.pasi[0].intrebare).toBe('a_{11} > 0: \\; 2 > 0 \\;\\Rightarrow\\; \\;?')
    expect(rez.pasi[0].formula).toContain('adevărat')
  })
})

describe('buclele "cât timp"', () => {
  it('fiecare evaluare a condiției păstrează mărimea testată, pragul și flopii', () => {
    const alg = algoritm('JACOBI')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    const it = rez.pasi.flatMap((p) => (p.iteratie ? [p.iteratie] : []))
    expect(it.map((x) => x.iter)).toEqual(Array.from({ length: 13 }, (_, k) => k))
    expect(it[0]).toMatchObject({ linie: 3, texStanga: 'e', texDreapta: '\\mathit{tol}', op: '>', dreapta: 1e-3 })
    expect(it[0].stanga).toBeCloseTo(Math.hypot(8, 1) / Math.hypot(11, 13), 12)
    expect(it.at(-1)!.stanga).toBeLessThanOrEqual(1e-3)
    expect(it.at(-2)!.stanga).toBeGreaterThan(1e-3)
    for (let k = 1; k < it.length; k++) expect(it[k].flopi).toBeGreaterThan(it[k - 1].flopi)
  })

  it('Jacobi și Gauss-Seidel dau primele iterații din slide-uri', () => {
    const jacobi = algoritm('JACOBI')!
    const j = urma(parseaza(jacobi.sursa), { ...intrariExemplu(jacobi), maxiter: 2 })
    expect(j.final).toBe('stop')
    expect(j.stare.x.d[0]).toBeCloseTo(69 / 14, 12)
    expect(j.stare.x.d[1]).toBeCloseTo(-12 / 7, 12)
    const gs = algoritm('GS')!
    const g = urma(parseaza(gs.sursa), { ...intrariExemplu(gs), maxiter: 1 })
    expect(g.stare.x.d[0]).toBeCloseTo(0.5, 12)
    expect(g.stare.x.d[1]).toBeCloseTo(-9.5 / 11, 12)
  })

  it('RFG pe prima coloană a exemplului de la QR dă vectorul și β din slide', () => {
    const alg = algoritm('RFG')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    expect(rez.stare.x.d[0]).toBe(-3)
    expect(rez.stare.x.d[1]).toBeCloseTo(-1 / 3, 12)
    expect(rez.stare.x.d[2]).toBeCloseTo(2 / 3, 12)
    expect(rez.scalari.β).toBeCloseTo(5 / 3, 12)
  })
})

describe('blocuri', () => {
  it('atribuirea pe o linie, pe o coloană și pe un bloc', () => {
    const rez = ruleaza('A(2, :) ← A(2, :) - 2 A(1, :)\nA(:, 3) ← 0\nA(1:2, 1:2) ← B\nx(2:3) ← A(1:2, 3)', { A: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], B: [[-1, -2], [-3, -4]], x: [1, 1, 1] })
    expect(rez.final).toBe('gata')
    expect(rez.stare.A.d).toEqual([-1, -2, 0, -3, -4, 0, 7, 8, 0])
    expect(rez.stare.x.d).toEqual([1, 0, 0])
    // prima atribuire scrie trei celule si le citeste pe cele doua linii
    expect(rez.pasi[0].celule.filter((c) => c.rol === 'scris')).toHaveLength(3)
    expect(rez.pasi[0].scrieri.map((s) => s.nou)).toEqual([2, 1, 0])
  })

  it('o valoare de altă formă decât blocul este o eroare cu formele spuse', () => {
    const rez = ruleaza('A(1, :) ← x', { A: [[1, 2, 3], [4, 5, 6]], x: [1, 2] })
    expect(rez.final).toBe('eroare')
    expect(rez.eroare).toBe('linia 1: blocul din A are forma 1 x 3, iar valoarea are forma 2 x 1')
  })

  it('o linie a matricei înmulțită cu un vector este un produs scalar', () => {
    const rez = ruleaza('s ← A(2, :) x', { A: [[1, 2], [3, 4]], x: [10, 1] })
    expect(rez.scalari.s).toBe(34)
    expect(rez.pasi[0].operatii?.map((o) => o.fel)).toEqual(['dot'])
  })
})

describe('forme și nume', () => {
  it('o matrice atribuită peste una cu alt număr de linii îi ia forma', () => {
    const rez = ruleaza('A ← A^T\nfie C[3,2]\nC ← B D', { A: [[1, 2], [3, 4], [5, 6]], B: [[1, 0, 2], [0, 1, 1]], D: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] })
    expect(rez.stare.A).toMatchObject({ m: 2, n: 3, d: [1, 3, 5, 2, 4, 6] })
    expect(rez.stare.C).toMatchObject({ m: 2, n: 3, d: [15, 18, 21, 11, 13, 15] })
  })

  it('m_ij este elementul matricei M, deși m este și numărul de linii; i_k rămâne un scalar', () => {
    const rez = ruleaza('t ← m_11 + m_22\ni_k ← 7\nu ← i_k + n_12', { M: [[1, 2], [3, 4]], N: [[10, 20], [30, 40]] })
    expect(rez.final).toBe('gata')
    expect(rez.scalari.t).toBe(5)
    expect(rez.scalari.u).toBe(27)
  })

  it('o linie A(i, :) are o linie și n coloane; un vector are o coloană', () => {
    const rez = ruleaza('la ← linii(A(1, :)); ca ← coloane(A(1, :)); lx ← linii(x); cx ← coloane(x)', { A: [[1, 2, 3], [4, 5, 6]], x: [1, 2] })
    expect([rez.scalari.la, rez.scalari.ca, rez.scalari.lx, rez.scalari.cx]).toEqual([1, 3, 2, 1])
  })

  it('un produs cu un operand gol nu scade numărul de flopi', () => {
    const rez = ruleaza('fie x[n]\npentru i = n : -1 : 1\n    x_i ← (b_i - U(i, i+1:n) x(i+1:n)) / u_ii', { U: [[2, 1], [0, 4]], b: [4, 8] })
    expect(rez.stare.x.d).toEqual([1, 2])
    for (const p of rez.pasi) for (const o of p.operatii ?? []) expect(o.flopi).toBeGreaterThanOrEqual(0)
    for (let k = 1; k < rez.pasi.length; k++) expect(rez.pasi[k].flopi).toBeGreaterThanOrEqual(rez.pasi[k - 1].flopi)
  })

  it('operațiile din capetele unei bucle fără iterații și ale unei instrucțiuni oprite de o eroare nu trec la alt pas', () => {
    const gol = ruleaza('t ← 0\ny_i ← 0, i = 3 : ‖x‖ - 100\nt ← t + 1', { x: [3, 4], y: [1, 1] })
    expect(gol.pasi.map((p) => p.operatii?.length ?? 0)).toEqual([0, 0, 0])
    const oprit = ruleaza('r ← A x - b', { A: [[1, 2], [3, 4]], x: [1, 1], b: [1, 2, 3] })
    expect(oprit.final).toBe('eroare')
    expect(oprit.pasi.at(-1)?.operatii).toBeUndefined()
  })
})

describe('pasul de eroare', () => {
  it('o împărțire la zero arată calculul care nu s-a putut face, cu valorile lui', () => {
    const alg = algoritm('G')!
    const rez = urma(parseaza(alg.sursa), { A: [[0, 1], [1, 0]] })
    expect(rez.final).toBe('eroare')
    const ultim = rez.pasi.at(-1)!
    expect(ultim.mesaj).toBe('linia 4: împărțire la zero')
    expect(ultim.formula).toBe('a_{21} \\leftarrow a_{21} / a_{11} = 1 / 0')
  })

  it('un element din afara tabloului rămâne fără valoare în formulă; o eroare din afara unei atribuiri nu are formulă', () => {
    const afara = urma(parseaza('s ← x_1 + x_4'), { x: [1, 2, 3] })
    expect(afara.final).toBe('eroare')
    expect(afara.pasi.at(-1)!.formula).toBe('s \\leftarrow x_{1} + x_{4} = 1 + x_{4}')
    const conditie = urma(parseaza('dacă x_9 > 0 atunci s ← 1'), { x: [1, 2, 3] })
    expect(conditie.final).toBe('eroare')
    expect(conditie.pasi.at(-1)!.formula).toBeUndefined()
  })
})

describe('roluri și indici în formulă', () => {
  it('elementul găsit de argmax este marcat ca pivot', () => {
    const alg = algoritm('GPP')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    const cauta = rez.pasi.find((p) => p.linie === 4)!
    expect(cauta.celule.filter((c) => c.rol === 'pivot')).toEqual([{ nume: 'A', i: 2, j: 1, rol: 'pivot' }])
    expect(cauta.celule.filter((c) => c.rol === 'citit')).toHaveLength(2)
  })

  it('o sumă pe un interval gol arată indicii pasului curent, nu ai unuia mai vechi', () => {
    const alg = algoritm('GS')!
    const rez = urma(parseaza(alg.sursa), intrariExemplu(alg))
    const linii = rez.pasi.filter((p) => p.linie === 5).slice(0, 2)
    expect(linii[0].formula).toContain('\\sum_{j=1}^{0} a_{1j}\\,x_{j}')
    expect(linii[1].formula).toContain('\\sum_{j=3}^{2} a_{2j}\\,x_{j}')
  })

  it('m și n sunt dimensiunile primei matrice, și pentru una pătrată', () => {
    expect(dimensiuni({ A: [[1, 2], [3, 4]] })).toEqual({ m: 2, n: 2 })
    expect(dimensiuni({ x: [1, 2, 3], A: [[1, 2, 3]] })).toEqual({ m: 1, n: 3 })
    expect(dimensiuni({ x: [1, 2, 3] })).toEqual({ n: 3 })
    const matvec = algoritm('matvec')!
    expect(urma(parseaza(matvec.sursa), { A: [[1, 2], [3, 4]], x: [1, 1] }).stare.y.d).toEqual([3, 7])
  })
})
