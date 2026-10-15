// Exercitiile de adaptare: solutia fiecaruia trece toate cerintele, algoritmul nemodificat nu trece
// (atinge zerourile si face mai multi flopi), iar o solutie gresita este prinsa.
import { describe, expect, it } from 'vitest'
import { ADAPTARI, verificaAdaptare } from '../src/adaptari'
import { algoritm } from '../src/motor/biblioteca'
import { proprietati } from '../src/natura'

describe('exercițiile de adaptare la structură', () => {
  it('soluția fiecărui exercițiu dă același rezultat, atinge ținta de flopi și nu atinge zerourile', () => {
    for (const a of ADAPTARI) {
      const v = verificaAdaptare(a, a.solutie)
      expect(v.eroare, a.id).toBeUndefined()
      expect(v.corecte, a.id).toBe(v.intrari)
      // tinta este numarul exact de flopi al solutiei
      expect(v.flopi, a.id).toBe(v.tinta)
      expect(v.zerouriAtinse, a.id).toBe(0)
      expect(v.reusit, a.id).toBe(true)
    }
  })

  it('flopii și ținta se numără pe exemplul de pe ecran, nu pe cel al exercițiului', () => {
    for (const a of ADAPTARI) {
      const mare = a.aleatoare(7, () => 0.5)
      const v = verificaAdaptare(a, a.solutie, mare)
      const n = (mare[a.matrice] as number[][]).length
      expect(n, a.id).toBe(7)
      expect(v.tinta, a.id).toBe(a.tinta(7))
      expect(v.flopi, a.id).toBe(a.tinta(7))
    }
  })

  it('algoritmul de pornire, nemodificat, dă rezultatul corect, dar atinge zerourile și face mai mulți flopi', () => {
    for (const a of ADAPTARI) {
      const v = verificaAdaptare(a, algoritm(a.pornire)!.sursa)
      expect(v.corecte, a.id).toBe(v.intrari)
      expect(v.zerouriAtinse, a.id).toBeGreaterThan(0)
      expect(v.flopi, a.id).toBeGreaterThan(v.tinta)
      expect(v.reusit, a.id).toBe(false)
    }
  })

  it('o soluție care taie prea mult dă alt rezultat; una cu o greșeală de sintaxă e semnalată', () => {
    const tri = ADAPTARI.find((a) => a.id === 'G-tridiagonala')!
    // fara actualizarea liniei de sub pivot, rezultatul difera
    const fara = tri.solutie.replace('            a_ij ← a_ij - μ_ik a_kj', '            a_ij ← a_ij')
    const v = verificaAdaptare(tri, fara)
    expect(v.corecte).toBeLessThan(v.intrari)
    expect(v.reusit).toBe(false)
    expect(verificaAdaptare(tri, 'pentru k = 1 :').eroare).toBeTruthy()
  })

  it('exemplele afișate au structura cerută și submatricele lider nesingulare unde se cere', () => {
    for (const a of ADAPTARI) {
      const M = a.exemplu[a.matrice] as number[][]
      M.forEach((l, i) => l.forEach((x, j) => (a.zero(i + 1, j + 1) ? expect(x, `${a.id} (${i + 1}, ${j + 1})`).toBe(0) : null)))
      if (a.pornire === 'G') expect(proprietati(M).map((p) => p.cheie), a.id).toContain('propLider')
    }
  })
})
