// Comparatia pe aceleasi intrari: ce algoritmi se pot compara, iar pe exemplele din curs rezultatele
// spun ce spun slide-urile (pivotarea repara exemplul cu 10⁻⁴, Cholesky si QR fata de eliminare).
import { describe, expect, it } from 'vitest'
import { compatibili, diferenta, nrIteratii, pragComun, rulat, ruleazaPe } from '../src/comparatie'
import { definitiiDin, type Definitie } from '../src/intrari'
import { algoritm } from '../src/motor/biblioteca'
import { urma } from '../src/motor/interpretor'
import { parseaza } from '../src/motor/parser'

const ids = (curent: string, defs: Definitie[]) => compatibili(curent, defs).map((a) => a.id)

describe('comparația cu alt algoritm', () => {
  it('perechile din curs vin primele; un algoritm cu intrări lipsă sau cu altă formă nu apare', () => {
    const G = definitiiDin(algoritm('G')!)
    expect(ids('G', G).slice(0, 4)).toEqual(['GPP', 'LU', 'CHOL', 'QR'])
    // Gb are nevoie si de r si q
    expect(ids('G', G)).not.toContain('Gb')
    expect(ids('S_G', definitiiDin(algoritm('S_G')!))[0]).toBe('S_GPP')
    expect(ids('JACOBI', definitiiDin(algoritm('JACOBI')!)).slice(0, 3)).toEqual(['GS', 'KACZMARZ', 'S_GPP'])
    // o matrice 3 x 2 nu e patrata: G, GPP si celelalte se opresc la forma, deci nu se compara
    expect(ids('QR', definitiiDin(algoritm('QR')!))).toEqual([])
  })

  it('exemplul cu pivotul 10⁻⁴, pe 3 cifre: S_G dă x = (0, 1), S_GPP dă x = (1, 1)', () => {
    const S_G = algoritm('S_G')!
    const intrari = { A: [[0.0001, 1], [1, 1]], b: [1, 2] }
    const a = ruleazaPe(S_G, intrari, 3)
    const b = ruleazaPe(algoritm('S_GPP')!, intrari, 3)
    expect(a.rez.stare.x.d).toEqual([0, 1])
    expect(b.rez.stare.x.d).toEqual([1, 1])
    expect(diferenta(a, b)).toEqual({ nume: 'x', valoare: 1 })
  })

  it('Cholesky numără mai puțini flopi decât G, iar QR mai mulți, pe aceeași matrice pătrată', () => {
    const A = [[4, 2, 2, 0], [2, 5, 3, 1], [2, 3, 6, 2], [0, 1, 2, 7]]
    const G = ruleazaPe(algoritm('G')!, { A }, 0).rez.flopi
    expect(ruleazaPe(algoritm('CHOL')!, { A }, 0).rez.flopi).toBeLessThan(G)
    expect(ruleazaPe(algoritm('QR')!, { A }, 0).rez.flopi).toBeGreaterThan(G)
  })

  it('numărul de iterații este cel al buclei "cât timp", ca la contorul k al algoritmului', () => {
    const alg = algoritm('JACOBI')!
    const rez = urma(parseaza(alg.sursa), Object.fromEntries(alg.intrari.map((i) => [i.nume, i.exemplu])))
    expect(nrIteratii(rez)).toBe(rez.scalari.k)
    // un algoritm fara bucla "cat timp" are 0 iteratii
    expect(ruleazaPe(algoritm('G')!, { A: [[2, 1], [1, 3]] }, 0).iteratii).toBe(0)
  })

  it('diferența se calculează doar pentru un vector rezultat comun, la două rulări terminate', () => {
    const A = [[0, 1], [1, 1]]
    const b = [1, 2]
    const sg = ruleazaPe(algoritm('S_G')!, { A, b }, 0)
    const sgpp = ruleazaPe(algoritm('S_GPP')!, { A, b }, 0)
    expect(sg.rez.final).toBe('eroare')
    expect(diferenta(sg, sgpp)).toBeNull()
    // doua matrice rezultat de aceeasi forma se compara element cu element: fara interschimbari, G si GPP dau acelasi A
    expect(diferenta(ruleazaPe(algoritm('G')!, { A: [[2, 1], [1, 3]] }, 0), ruleazaPe(algoritm('GPP')!, { A: [[2, 1], [1, 3]] }, 0))).toEqual({ nume: 'A', valoare: 0 })
    // varianta banda da exact ce da algoritmul plin
    const T = [[2, 1, 0], [1, 3, 1], [0, 1, 4]]
    expect(diferenta(ruleazaPe(algoritm('Gb')!, { A: T, r: 1, q: 1 }, 0), ruleazaPe(algoritm('G')!, { A: T }, 0))).toEqual({ nume: 'A', valoare: 0 })
    // L de la Cholesky si U cu multiplicatori de la G sunt scrise amandoua peste A, dar nu sunt acelasi lucru: fara diferenta
    expect(diferenta(ruleazaPe(algoritm('CHOL')!, { A: [[4, 2], [2, 3]] }, 0), ruleazaPe(algoritm('G')!, { A: [[4, 2], [2, 3]] }, 0))).toBeNull()
    expect(diferenta(ruleazaPe(algoritm('QR')!, { A: [[4, 2], [2, 3]] }, 0), ruleazaPe(algoritm('G')!, { A: [[4, 2], [2, 3]] }, 0))).toBeNull()
  })
})

describe('curbele de convergență ale celor două rulări', () => {
  const exemplu = (id: string) => Object.fromEntries(algoritm(id)!.intrari.map((i) => [i.nume, i.exemplu]))

  it('MP și MPI pe matricea companion din curs: 23 și 5 iterații, cu același prag 10⁻¹⁵, iar e scade sub el la ultima evaluare', () => {
    const mp = ruleazaPe(algoritm('MP')!, exemplu('MP'), 0)
    const mpi = ruleazaPe(algoritm('MPI')!, exemplu('MP'), 0)
    expect(mp.puncte.length - 1).toBe(23)
    expect(mpi.puncte.length - 1).toBe(5)
    expect(mp.puncte.map((p) => p.iter)).toEqual(Array.from({ length: 24 }, (_, k) => k))
    expect(pragComun(mp, mpi)).toBe(1e-15)
    for (const r of [mp, mpi]) {
      expect(r.puncte.at(-1)!.adevarat).toBe(false)
      expect(r.puncte.at(-1)!.stanga).toBeLessThanOrEqual(1e-15)
      expect(r.puncte.slice(0, -1).every((p) => p.adevarat && p.stanga > 1e-15)).toBe(true)
      // flopii numarati pana la fiecare evaluare cresc
      for (let k = 1; k < r.puncte.length; k++) expect(r.puncte[k].flopi).toBeGreaterThan(r.puncte[k - 1].flopi)
    }
    // o iteratie MPI (un sistem rezolvat) costa mai mult decat una MP (un produs matrice-vector)
    expect(mpi.puncte[1].flopi - mpi.puncte[0].flopi).toBeGreaterThan(mp.puncte[1].flopi - mp.puncte[0].flopi)
  })

  it('rulat() dă aceleași puncte ca ruleazaPe(), iar o metodă directă nu are niciunul', () => {
    const alg = algoritm('JACOBI')!
    const intrari = exemplu('JACOBI')
    const rez = urma(parseaza(alg.sursa), intrari)
    expect(rulat(alg, rez).puncte).toEqual(ruleazaPe(alg, intrari, 0).puncte)
    expect(rulat(alg, rez).puncte.length).toBe(rez.scalari.k + 1)
    expect(ruleazaPe(algoritm('G')!, { A: [[2, 1], [1, 3]] }, 0).puncte).toEqual([])
    // Jacobi si Gauss-Seidel pe aceleasi intrari au acelasi prag; fara puncte, pragul lipseste
    expect(pragComun(ruleazaPe(alg, intrari, 0), ruleazaPe(algoritm('GS')!, intrari, 0))).toBe(1e-3)
    expect(pragComun(ruleazaPe(algoritm('G')!, { A: [[2, 1], [1, 3]] }, 0), ruleazaPe(algoritm('GPP')!, { A: [[2, 1], [1, 3]] }, 0))).toBeUndefined()
  })
})
