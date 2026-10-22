// Costul in functie de n: punctele exista pentru fiecare algoritm direct din biblioteca, formulele
// exacte cad pe puncte, iar cele cu termenul dominant se apropie de ele cand n creste.
import { describe, expect, it } from 'vitest'
import { DIMENSIUNI, areCostPeN, costuriPeN } from '../src/costuri'
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
})
