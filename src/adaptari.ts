// Exercitii de adaptare a unui algoritm la o matrice cu structura, din problemele cartii cursului:
// studentul porneste de la algoritmul din biblioteca si il scurteaza ca sa nu mai lucreze cu
// zerourile stiute dinainte. Verificarea: acelasi rezultat ca algoritmul nemodificat pe mai multe
// intrari cu structura ceruta, cel mult tinta de flopi si niciun zero stiut citit sau scris.
import { algoritm } from './motor/biblioteca'
import { urma, type Intrari, type Rezultat } from './motor/interpretor'
import type { Limba } from './motor/mesaje'
import { parseaza } from './motor/parser'
import { genereaza, rndDeterminist, type Structura } from './natura'

type Text = Record<Limba, string>
type M = number[][]

export interface Adaptare {
  id: string
  titlu: Text
  enunt: Text
  curs: Text
  indiciu: Text
  // algoritmul din biblioteca de la care se porneste si cu care se compara rezultatul
  pornire: string
  // rezultatul comparat si matricea cu structura
  iesire: string
  matrice: string
  // tipul matricei din meniu, ca "aleator" si dimensiunile sa pastreze structura
  structura: Structura
  // pozitiile (de la 1) care sunt zero stiut dinainte
  zero: (i: number, j: number) => boolean
  // cati flopi face algoritmul adaptat pe o matrice n x n, numarati pe solutie
  tinta: (n: number) => number
  tintaText: Text
  exemplu: Intrari
  // intrari aleatoare cu aceeasi structura
  aleatoare: (n: number, rnd: () => number) => Intrari
  solutie: string
}

const transpusa = (A: M): M => A[0].map((_, j) => A.map((l) => l[j]))
const vector = (n: number, rnd: () => number) => genereaza({ tip: 'vector', natura: 'nenul', forma: [n, 1] }, rnd) as number[]
const banda = (n: number, rnd: () => number, natura: 'bandaLider' | 'superiorBanda', latimi: [number, number]) =>
  genereaza({ tip: 'matrice', natura, forma: [n, n], latimi }, rnd) as M

export const ADAPTARI: Adaptare[] = [
  {
    id: 'LTRIS-bidiagonala',
    titlu: { ro: 'LTRIS pentru o matrice inferior bidiagonală', en: 'LTRIS for a lower bidiagonal matrix' },
    enunt: {
      ro: 'L este inferior bidiagonală: nenule sunt doar diagonala și prima subdiagonală (l_ij = 0 pentru i < j sau i > j + 1). Modifică LTRIS ca să rezolve Lx = b fără să atingă zerourile.',
      en: 'L is lower bidiagonal: only the diagonal and the first subdiagonal are nonzero (l_ij = 0 for i < j or i > j + 1). Change LTRIS so that it solves Lx = b without touching the zeros.',
    },
    curs: { ro: 'Cartea cursului, problema P 1.24 a.', en: 'The book of the course, problem P 1.24 a.' },
    indiciu: {
      ro: 'În ecuația i apar doar x_(i−1) și x_i, deci bucla pe j are cel mult un termen: j merge de la max(1, i−1) la i−1.',
      en: 'Equation i contains only x_(i−1) and x_i, so the loop over j has at most one term: j goes from max(1, i−1) to i−1.',
    },
    pornire: 'LTRIS',
    iesire: 'x',
    matrice: 'L',
    structura: 'bidiagonalaInf',
    zero: (i, j) => j > i || i > j + 1,
    tinta: (n) => 3 * n - 2,
    tintaText: { ro: '3n − 2 flopi, față de n² la LTRIS', en: '3n − 2 flops, against n² for LTRIS' },
    exemplu: {
      L: [[2, 0, 0, 0, 0], [1, 3, 0, 0, 0], [0, -1, 2, 0, 0], [0, 0, 2, 1, 0], [0, 0, 0, 1, 4]],
      b: [2, 4, 3, 5, 9],
    },
    aleatoare: (n, rnd) => ({ L: transpusa(banda(n, rnd, 'superiorBanda', [0, 1])), b: vector(n, rnd) }),
    solutie: `x ← b
pentru i = 1 : n
    pentru j = max(1, i-1) : i-1
        x_i ← x_i - l_ij x_j
    x_i ← x_i / l_ii`,
  },
  {
    id: 'UTRIS-bidiagonala',
    titlu: { ro: 'UTRIS pentru o matrice superior bidiagonală', en: 'UTRIS for an upper bidiagonal matrix' },
    enunt: {
      ro: 'U este superior bidiagonală: nenule sunt doar diagonala și prima supradiagonală (u_ij = 0 pentru i > j sau j > i + 1). Modifică UTRIS ca să rezolve Ux = b fără să atingă zerourile.',
      en: 'U is upper bidiagonal: only the diagonal and the first superdiagonal are nonzero (u_ij = 0 for i > j or j > i + 1). Change UTRIS so that it solves Ux = b without touching the zeros.',
    },
    curs: { ro: 'Cartea cursului, problema P 1.24 c.', en: 'The book of the course, problem P 1.24 c.' },
    indiciu: {
      ro: 'În ecuația i apar doar x_i și x_(i+1), deci bucla pe j se oprește la min(i+1, n).',
      en: 'Equation i contains only x_i and x_(i+1), so the loop over j stops at min(i+1, n).',
    },
    pornire: 'UTRIS',
    iesire: 'x',
    matrice: 'U',
    structura: 'bidiagonalaSup',
    zero: (i, j) => i > j || j > i + 1,
    tinta: (n) => 3 * n - 2,
    tintaText: { ro: '3n − 2 flopi, față de n² la UTRIS', en: '3n − 2 flops, against n² for UTRIS' },
    exemplu: {
      U: [[2, 1, 0, 0, 0], [0, 1, 1, 0, 0], [0, 0, 1, 1, 0], [0, 0, 0, 1, 1], [0, 0, 0, 0, 1]],
      b: [3, 2, 2, 2, 1],
    },
    aleatoare: (n, rnd) => ({ U: banda(n, rnd, 'superiorBanda', [0, 1]), b: vector(n, rnd) }),
    solutie: `x ← b
pentru i = n : -1 : 1
    pentru j = i+1 : min(i+1, n)
        x_i ← x_i - u_ij x_j
    x_i ← x_i / u_ii`,
  },
  {
    id: 'G-tridiagonala',
    titlu: { ro: 'G pentru o matrice tridiagonală', en: 'G for a tridiagonal matrix' },
    enunt: {
      ro: 'A este tridiagonală (a_ij = 0 pentru |i − j| > 1), cu submatricele lider principale nesingulare. Modifică algoritmul G ca să o triangularizeze fără să atingă zerourile, păstrând multiplicatorii sub diagonală, ca G.',
      en: 'A is tridiagonal (a_ij = 0 for |i − j| > 1), with nonsingular leading principal submatrices. Change algorithm G so that it triangularizes it without touching the zeros, keeping the multipliers below the diagonal, as G does.',
    },
    curs: {
      ro: 'Cartea cursului, problema P 2.29 a (pagina 122) și secțiunea 2.9 "Sisteme bandă": eliminarea fără pivotare păstrează banda (teorema 2.9).',
      en: 'The book of the course, problem P 2.29 a (page 122) and section 2.9 "Sisteme bandă": elimination without pivoting keeps the band (theorem 2.9).',
    },
    indiciu: {
      ro: 'Sub pivot e un singur element nenul, iar linia pivotului are un singur element nenul la dreapta lui: buclele pe i și bucla pe j se opresc la min(k+1, n).',
      en: 'Below the pivot there is a single nonzero entry, and the pivot row has a single nonzero entry to its right: the loops over i and the loop over j stop at min(k+1, n).',
    },
    pornire: 'G',
    iesire: 'A',
    matrice: 'A',
    structura: 'tridiagonala',
    zero: (i, j) => Math.abs(i - j) > 1,
    tinta: (n) => 3 * (n - 1),
    tintaText: { ro: '3(n − 1) flopi, față de ≈ 2n³/3 la G', en: '3(n − 1) flops, against ≈ 2n³/3 for G' },
    exemplu: { A: [[2, 1, 0, 0, 0], [4, 3, 1, 0, 0], [0, 3, 4, 1, 0], [0, 0, 2, 3, 1], [0, 0, 0, 1, 2]] },
    aleatoare: (n, rnd) => ({ A: banda(n, rnd, 'bandaLider', [1, 1]) }),
    solutie: `μ peste A
pentru k = 1 : n-1
    pentru i = k+1 : min(k+1, n)
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : min(k+1, n)
        pentru i = k+1 : min(k+1, n)
            a_ij ← a_ij - μ_ik a_kj`,
  },
  {
    id: 'G-Hessenberg',
    titlu: { ro: 'G pentru o matrice superior Hessenberg', en: 'G for an upper Hessenberg matrix' },
    enunt: {
      ro: 'A este superior Hessenberg (a_ij = 0 pentru i > j + 1), cu submatricele lider principale nesingulare. Modifică algoritmul G ca să o triangularizeze fără să atingă zerourile, păstrând multiplicatorii sub diagonală, ca G.',
      en: 'A is upper Hessenberg (a_ij = 0 for i > j + 1), with nonsingular leading principal submatrices. Change algorithm G so that it triangularizes it without touching the zeros, keeping the multipliers below the diagonal, as G does.',
    },
    curs: {
      ro: 'Cartea cursului, problema P 2.13 a (pagina 120), partea de triangularizare; pentru a rezolva Hx = b, cum cere problema, se adaugă pașii pe b și UTRIS.',
      en: 'The book of the course, problem P 2.13 a (page 120), the triangularization part; to solve Hx = b, as the problem asks, the steps on b and UTRIS are added.',
    },
    indiciu: {
      ro: 'Sub pivot e un singur element nenul, pe linia k+1, dar linia pivotului este plină: doar buclele pe i se scurtează, la i = k+1.',
      en: 'Below the pivot there is a single nonzero entry, in row k+1, but the pivot row is full: only the loops over i get shorter, to i = k+1.',
    },
    pornire: 'G',
    iesire: 'A',
    matrice: 'A',
    structura: 'hessenberg',
    zero: (i, j) => i > j + 1,
    tinta: (n) => n * n - 1,
    tintaText: { ro: 'n² − 1 flopi, față de ≈ 2n³/3 la G', en: 'n² − 1 flops, against ≈ 2n³/3 for G' },
    exemplu: { A: [[2, 1, 1, 1, 1], [4, 3, 1, 2, 1], [0, 3, 4, 1, 2], [0, 0, 2, 3, 1], [0, 0, 0, 1, 2]] },
    aleatoare: (n, rnd) => ({ A: banda(n, rnd, 'bandaLider', [1, n - 1]) }),
    solutie: `μ peste A
pentru k = 1 : n-1
    pentru i = k+1 : k+1
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : k+1
            a_ij ← a_ij - μ_ik a_kj`,
  },
]

export const adaptare = (id: string): Adaptare | undefined => ADAPTARI.find((a) => a.id === id)

export interface VerdictAdaptare {
  // eroarea de sintaxa sau de rulare, daca programul nu a mers pe una dintre intrari
  eroare?: string
  // pe cate intrari rezultatul e acelasi cu al algoritmului nemodificat
  corecte: number
  intrari: number
  // pe exemplul afisat
  flopi: number
  tinta: number
  flopiPornire: number
  // celulele cu zero stiut citite sau scrise, pe exemplul afisat
  zerouriAtinse: number
  reusit: boolean
}

const iesire = (rez: Rezultat, nume: string): number[] => rez.stare[nume]?.d ?? []

// `peEcran`: intrarile de pe ecran (exemplul, sau cel marit cu butoanele de dimensiune); flopii si
// zerourile atinse se numara pe ele
export function verificaAdaptare(a: Adaptare, sursa: string, peEcran?: Intrari): VerdictAdaptare {
  // fara matricea exercitiului pe ecran (intrare redenumita), se ia exemplul exercitiului
  const afisat = peEcran && Array.isArray(peEcran[a.matrice]) && Array.isArray((peEcran[a.matrice] as M)[0]) ? peEcran : a.exemplu
  const n = (afisat[a.matrice] as M).length
  const referinta = parseaza(algoritm(a.pornire)!.sursa)
  // intrari deterministe: aceleasi la fiecare verificare
  const toate: Intrari[] = [afisat, ...[4, 6, 7].map((m, k) => a.aleatoare(m, rndDeterminist(k + 11)))]
  const pornire = urma(referinta, afisat)
  const gol = { corecte: 0, intrari: toate.length, flopi: 0, tinta: a.tinta(n), flopiPornire: pornire.flopi, zerouriAtinse: 0, reusit: false }
  let program
  try {
    program = parseaza(sursa)
  } catch (e) {
    return { ...gol, eroare: e instanceof Error ? e.message : String(e) }
  }
  let corecte = 0
  let pePrimul: Rezultat | null = null
  for (const intr of toate) {
    const rez = urma(program, intr)
    if (!pePrimul) pePrimul = rez
    if (rez.final !== 'gata') return { ...gol, corecte, eroare: rez.eroare ?? rez.pasi.at(-1)?.mesaj ?? '' }
    const ref = urma(referinta, intr)
    const x = iesire(rez, a.iesire)
    const y = iesire(ref, a.iesire)
    const scara = Math.max(1, ...y.map(Math.abs))
    if (x.length === y.length && x.every((v, i) => Math.abs(v - y[i]) <= 1e-9 * scara)) corecte++
  }
  const atinse = new Set<string>()
  for (const p of pePrimul!.pasi) for (const c of p.celule) if (c.nume === a.matrice && c.j !== undefined && a.zero(c.i, c.j)) atinse.add(`${c.i}:${c.j}`)
  const flopi = pePrimul!.flopi
  return {
    corecte,
    intrari: toate.length,
    flopi,
    tinta: a.tinta(n),
    flopiPornire: pornire.flopi,
    zerouriAtinse: atinse.size,
    reusit: corecte === toate.length && flopi <= a.tinta(n) && atinse.size === 0,
  }
}
