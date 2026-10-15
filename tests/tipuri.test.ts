// Meniul de tip de langa o matrice: fiecare tip genereaza matrice care au proprietatea lui, iar
// randul de proprietati spune ce are matricea scrisa; butoanele de dimensiune schimba forma si
// trag dupa ele vectorii legati de matrice.
import { describe, expect, it } from 'vitest'
import { aleatoare, forma, valoareDinText, type Definitie } from '../src/intrari'
import { algoritm } from '../src/motor/biblioteca'
import { STRUCTURI, cerePatrata, genereaza, proprietati, type Structura } from '../src/natura'
import { generator } from './ajutor'

const chei = (A: number[][], it?: 'jacobi' | 'gs') => proprietati(A, it).map((p) => p.cheie)

// proprietatea pe care trebuie sa o aiba fiecare tip, ca cheie a randului de proprietati
const ARE: Record<Exclude<Structura, 'oarecare'>, string[]> = {
  simetrica: ['propSimetrica'],
  spd: ['propSimetrica', 'propSpd'],
  diagonala: ['propDiagonala', 'propNesingulara'],
  inferior: ['propNesingulara'],
  superior: ['propNesingulara'],
  bidiagonalaInf: ['propBidiagonalaInf', 'propNesingulara'],
  bidiagonalaSup: ['propBidiagonalaSup', 'propNesingulara'],
  // diagonala dominanta, ca eliminarea fara pivotare sa mearga
  tridiagonala: ['propTridiagonala', 'propDominanta', 'propLider'],
  hessenberg: ['propHessenbergSup', 'propDominanta', 'propLider'],
  dominanta: ['propDominanta', 'propNesingulara', 'propLider'],
  ortogonala: ['propOrtogonala', 'propNesingulara'],
  nesingulara: ['propNesingulara'],
  lider: ['propLider'],
  singulara: [],
}

describe('tipurile de matrice din meniu', () => {
  it('fiecare tip generează matrice pătrate cu proprietatea lui, la mai multe dimensiuni', () => {
    const rnd = generator(11)
    for (const s of STRUCTURI.filter((x) => x !== 'oarecare') as Exclude<Structura, 'oarecare'>[]) {
      // o matrice cu banda (bidiagonala, tridiagonala, Hessenberg) are nevoie de cel putin 3 linii ca sa se deosebeasca
      for (const n of ['bidiagonalaInf', 'bidiagonalaSup', 'tridiagonala', 'hessenberg'].includes(s) ? [3, 4, 6] : [2, 3, 5]) {
        for (let rep = 0; rep < 5; rep++) {
          const A = genereaza({ tip: 'matrice', natura: s, forma: [n, n + 1] }, rnd) as number[][]
          const unde = `${s}, n = ${n}`
          expect([A.length, A[0].length], unde).toEqual([n, n])
          const are = chei(A)
          for (const c of ARE[s]) expect(are, unde).toContain(c)
          // o triunghiulara cu zerouri sub (sau peste) diagonala iese diagonala, cazul cel mai precis
          if (s === 'inferior' || s === 'superior') expect(are[0], unde).toMatch(s === 'inferior' ? /propInferior|propDiagonala/ : /propSuperior|propDiagonala/)
          if (s === 'singulara') expect(proprietati(A).find((p) => p.cheie === 'propSingulara')?.args, unde).toEqual([n - 1])
        }
      }
    }
  })

  it('"oarecare" păstrează forma m x n; tipurile structurate cer o matrice pătrată', () => {
    const A = genereaza({ tip: 'matrice', natura: 'oarecare', forma: [2, 4] }, generator(2)) as number[][]
    expect([A.length, A[0].length]).toEqual([2, 4])
    expect(cerePatrata('oarecare')).toBe(false)
    expect(cerePatrata('coloaneIndependente')).toBe(false)
    for (const s of STRUCTURI.filter((x) => x !== 'oarecare')) expect(cerePatrata(s), s).toBe(true)
  })

  it('rândul de proprietăți pe matrice cunoscute din curs', () => {
    // exemplul de la G: submatricele lider nesingulare, fara simetrie
    expect(chei([[1, 2, 1], [2, 1, 2], [1, 1, 2]])).toEqual(['propNesingulara', 'propLider'])
    // exemplul de la Cholesky din biblioteca: simetrica pozitiv definita
    expect(chei([[4, 2, 2], [2, 5, 3], [2, 3, 6]])).toEqual(['propSimetrica', 'propNesingulara', 'propLider', 'propSpd'])
    // simetrica, dar nu pozitiv definita: α = 1 - 4 < 0 la pasul 2
    expect(proprietati([[1, 2], [2, 1]]).find((p) => p.cheie === 'propNuSpd')?.args).toEqual([2])
    // pivotul 0 la pasul 1, desi matricea e nesingulara
    expect(proprietati([[0, 1], [1, 1]]).find((p) => p.cheie === 'propLiderNu')?.args).toEqual([1])
    // banda: o subdiagonala si doua supradiagonale
    expect(proprietati([[1, 1, 1, 0], [1, 1, 1, 1], [0, 1, 1, 1], [0, 0, 1, 1]])[0]).toEqual({ cheie: 'propBanda', args: [1, 2] })
    // orice 2 x 2 e tridiagonala; exemplul Jacobi din curs nu primeste eticheta asta
    expect(chei([[2, 1], [5, 7]])).toEqual(['propDominanta', 'propNesingulara', 'propLider'])
    // dreptunghiulara: coloane independente sau rangul
    expect(chei([[2, 3], [-1, 1], [2, -1]])).toEqual(['propColoane'])
    expect(proprietati([[1, 2], [2, 4], [3, 6]])).toEqual([{ cheie: 'propRang', args: [1] }])
  })

  it('raza spectrală a matricei de iterație, pe exemplele din curs pentru Jacobi și Gauss-Seidel', () => {
    // Jacobi, A = [2 1; 5 7]: D⁻¹N = [0 -1/2; -5/7 0], ρ = √(5/14)
    const j = proprietati([[2, 1], [5, 7]], 'jacobi').find((p) => p.cheie === 'propRhoJacobi')!
    expect(j.args[0]).toBeCloseTo(Math.sqrt(5 / 14), 2)
    // Gauss-Seidel, A = [16 3; 7 -11]: L⁻¹U are valorile proprii 0 si -21/176
    const g = proprietati([[16, 3], [7, -11]], 'gs').find((p) => p.cheie === 'propRhoGS')!
    expect(g.args[0]).toBeCloseTo(21 / 176, 2)
  })

  it('butoanele de dimensiune: matricea primește forma cerută, iar b o urmează', () => {
    const alg = algoritm('S_GPP')!
    const defs: Definitie[] = [
      { nume: 'A', tip: 'matrice', text: '1 2\n3 4' },
      { nume: 'b', tip: 'vector', text: '1 2' },
    ]
    const noi = aleatoare(defs, 0, alg.intrari, generator(5), { forma: [4, 4] })
    expect(forma(noi[0])).toEqual([4, 4])
    expect(forma(noi[1])).toEqual([4, 1])
  })

  it('tipul ales rămâne la "aleator" următor și se poate scoate', () => {
    const alg = algoritm('G')!
    const defs: Definitie[] = [{ nume: 'A', tip: 'matrice', text: '1 2 1\n2 1 2\n1 1 2' }]
    const cu = aleatoare(defs, 0, alg.intrari, generator(8), { structura: 'tridiagonala' })
    expect(cu[0].structura).toBe('tridiagonala')
    const din = (d: Definitie) => valoareDinText(d.tip, d.nume, d.text) as number[][]
    expect(chei(din(cu[0]))).toContain('propTridiagonala')
    const iar = aleatoare(cu, 0, alg.intrari, generator(9))
    expect(chei(din(iar[0]))).toContain('propTridiagonala')
    const fara = aleatoare(iar, 0, alg.intrari, generator(10), { structura: null })
    expect(fara[0].structura).toBeUndefined()
  })
})
