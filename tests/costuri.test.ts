// Costul in functie de n: punctele exista pentru fiecare algoritm direct din biblioteca, formulele
// exacte cad pe puncte, iar cele cu termenul dominant se apropie de ele cand n creste.
import { describe, expect, it } from 'vitest'
import { DIMENSIUNI, PERECHE_COST, areCostPeN, costuriPeN, perecheCost } from '../src/costuri'
import { BIBLIOTECA, algoritm } from '../src/motor/biblioteca'

const exemplu = (id: string) => Object.fromEntries(algoritm(id)!.intrari.map((i) => [i.nume, i.exemplu]))

describe('costul în funcție de n', () => {
  it('fiecare algoritm direct are un punct pentru fiecare n, cu flopi care cresc', () => {
    for (const a of BIBLIOTECA.filter(areCostPeN)) {
      const p = costuriPeN(a, exemplu(a.id))
      expect(p.map((x) => x.n), a.id).toEqual(DIMENSIUNI)
      for (let k = 1; k < p.length; k++) expect(p[k].flopi, `${a.id}, n = ${p[k].n}`).toBeGreaterThan(p[k - 1].flopi)
    }
    expect(BIBLIOTECA.filter((a) => !areCostPeN(a)).map((a) => a.id)).toEqual(['JACOBI', 'GS', 'KACZMARZ', 'MP', 'MPI'])
  })

  it('formulele exacte cad pe puncte: n² la substituții, 2mn la produsul matrice-vector, 2n³ la produsul de matrice', () => {
    for (const id of ['LTRIS', 'UTRIS', 'matvec', 'matmul']) for (const p of costuriPeN(algoritm(id)!, exemplu(id))) expect(p.flopi, `${id}, n = ${p.n}`).toBe(p.formula)
  })

  it('la eliminare, diferența relativă față de 2n³/3 scade când n crește', () => {
    const p = costuriPeN(algoritm('G')!, exemplu('G'))
    const rel = p.map((x) => Math.abs(x.flopi - x.formula) / x.flopi)
    expect(rel.at(-1)!).toBeLessThan(rel[1])
  })

  it('perechile din curs au a doua serie: varianta bandă față de algoritmul plin, Cholesky și QR față de G', () => {
    expect(Object.keys(PERECHE_COST)).toEqual(['Gb', 'GPPb', 'UTRISb', 'CHOL', 'QR'])
    expect(perecheCost(algoritm('G')!)).toBeNull()
    for (const id of Object.keys(PERECHE_COST)) {
      const p = costuriPeN(algoritm(id)!, exemplu(id))
      expect(p.map((x) => x.n), id).toEqual(DIMENSIUNI)
      for (const x of p) expect(x.pereche, `${id}, n = ${x.n}`).toBeGreaterThan(0)
      // perechea ruleaza pe aceleasi intrari; doar QR (m > n) nu poate da matricea lui lui G
      for (const x of p) expect(x.aceleasi, `${id}, n = ${x.n}`).toBe(id !== 'QR')
    }
    // UTRIS numara exact n²; cu q = 1, UTRISb numara 3n − 2
    for (const x of costuriPeN(algoritm('UTRISb')!, exemplu('UTRISb'))) {
      expect(x.pereche).toBe(x.n ** 2)
      expect(x.flopi).toBe(3 * x.n - 2)
    }
    const ultim = (id: string) => costuriPeN(algoritm(id)!, exemplu(id)).at(-1)!
    // Cholesky: ≈ n³/3 fata de ≈ 2n³/3; QR cu m = n + 1: raportul formulelor este 2 + 3/n
    const chol = ultim('CHOL')
    expect(chol.flopi / chol.pereche!).toBeGreaterThan(0.4)
    expect(chol.flopi / chol.pereche!).toBeLessThan(0.7)
    const qrToate = costuriPeN(algoritm('QR')!, exemplu('QR'))
    const qr = qrToate.at(-1)!
    expect(qr.flopi / qr.pereche!).toBeGreaterThan(2 + 3 / 8)
    expect(qr.flopi / qr.pereche!).toBeLessThanOrEqual(3)
    // raportul numarat scade spre cel al formulelor cand n creste
    for (let k = 1; k < qrToate.length; k++) expect(qrToate[k].flopi / qrToate[k].pereche!).toBeLessThan(qrToate[k - 1].flopi / qrToate[k - 1].pereche!)
    // o matrice tridiagonala: ≈ 3n fata de ≈ 2n³/3
    const gb = ultim('Gb')
    expect(gb.flopi / gb.pereche!).toBeLessThan(0.2)
    // perechea numara la fel ca algoritmul ei rulat singur, la acelasi n
    expect(costuriPeN(algoritm('CHOL')!, exemplu('CHOL')).map((x) => x.pereche)).toEqual(costuriPeN(algoritm('G')!, exemplu('G')).map((x) => x.flopi))
  })
})
