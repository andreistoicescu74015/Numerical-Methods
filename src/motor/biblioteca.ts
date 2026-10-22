// Algoritmii din cursul de Metode numerice (slide-urile din anul curent), scrisi in pseudocodul
// acceptat de parser. Fiecare are in campul `curs` locul lui in slide-uri si ce difera fata de
// slide. Inmultirea matrice-vector nu are algoritm pe slide-uri si vine din cartea cursului.
// Exemplele de intrare sunt cele din slide-uri pentru G, Jacobi, Gauss-Seidel, QR si SQR, iar RFG
// foloseste prima coloana a exemplului de la QR; celelalte sunt alese ca urma sa fie scurta.
import type { Aleator, Natura } from '../natura'
import type { Intrari } from './interpretor'
import type { Limba } from './mesaje'

type Text = Record<Limba, string>

// Marimile de care depinde costul: formele intrarilor, scalarii dati si numarul de iteratii.
export interface Marimi {
  // [linii, coloane] pentru fiecare tablou de intrare; un vector are o coloana
  forme: Record<string, [number, number]>
  scalari: Record<string, number>
  // de cate ori s-a executat corpul buclei "cat timp"
  iteratii: number
}

export function marimiDin(intrari: Intrari, iteratii = 0): Marimi {
  const forme: Marimi['forme'] = {}
  const scalari: Marimi['scalari'] = {}
  for (const [nume, v] of Object.entries(intrari)) {
    if (typeof v === 'number') scalari[nume] = v
    else if (Array.isArray(v[0])) forme[nume] = [v.length, (v[0] as number[]).length]
    else forme[nume] = [v.length, 1]
  }
  return { forme, scalari, iteratii }
}

export interface Intrare {
  nume: string
  tip: 'matrice' | 'vector' | 'scalar'
  exemplu: number | number[] | number[][]
  descriere: Text
  // proprietatea din descriere, ca "aleator" sa o respecte si o valoare scrisa de mana care nu o are sa fie semnalata
  natura?: Natura
  // ce genereaza "aleator" cand e nevoie de mai mult decat cere natura (o conditie suficienta de convergenta)
  aleator?: Aleator
  // intrarea de care depinde natura: matricea sistemului pentru un termen liber, vectorul pentru un indice
  cu?: string
  // conditia suficienta de convergenta din curs; o matrice scrisa de mana care nu o are primeste o nota
  garantie?: 'dominanta' | 'dominantaSauSpd'
  // pentru o matrice banda: latimea inferioara si cea superioara, ca numar sau ca numele scalarului care o da
  latimi?: [string | number, string | number]
  // lungimea vectorului (sau numarul de linii al matricei) este numarul de linii sau de coloane al altei intrari
  dimensiune?: [string, 'linii' | 'coloane']
}

// O operatie a algoritmului scrisa intre matrice si vectori, cu liniile din pseudocod care o fac.
export interface Etapa {
  linii: [number, number]
  // LaTeX
  tex: string
  text: Text
}

export interface Algoritm {
  id: string
  grup: string
  titlu: Text
  // ce calculeaza si cum, pe intelesul cuiva care il vede prima data
  descriere: Text
  // unde este in cursul din anul curent si ce difera aici fata de slide
  curs: Text
  cost: Text
  // formula din `cost` ca numar de flopi, pentru marimile date: termenul dominant, ca in curs
  estimare: (x: Marimi) => number
  sursa: string
  intrari: Intrare[]
  // notiunile de baza (src/notiuni.ts) de care are nevoie cineva ca sa urmareasca algoritmul
  notiuni: string[]
  // ce calculeaza, in forma matriceala (LaTeX)
  forma: string
  etape: Etapa[]
  // ce trebuie stiut cand algoritmul se foloseste pe date reale
  practic: Text
  // ce intoarce functia Python generata, in ordine
  iesiri: string[]
  // liniile Python care compara rezultatul cu functia standard din NumPy, la sfarsitul fisierului
  // generat; {x} este variabila rezultatului x, {dif} eticheta diferentei
  numpy?: string[]
  // pentru metodele iterative: metoda directa cu care se compara costul
  direct?: { nume: Text; flopi: (n: number) => number }
  // algoritmul pentru matrice oarecare din care e adaptat acesta; i se numara flopii pe aceleasi intrari
  plin?: string
  // tabloul de intrare si pozitiile care sunt zero stiut dinainte si pe care algoritmul nu le atinge;
  // s are scalarii dati (latimile benzii)
  zerouri?: { tablou: string; zero: (i: number, j: number, s: Record<string, number>) => boolean }
  // precizia exemplului, in cifre semnificative, cand exemplul din curs o cere
  cifre?: number
  // sistemul liniar pe care il rezolva sau il aproximeaza, pentru grilele asezate ca ecuatie
  // A · x = b: numele matricei, al necunoscutei, al termenului liber si variabila de linie a
  // pseudocodului (ecuatia i); `tex` scrie sistemul cand numele grilelor nu il spun singure
  ecuatie?: { A: string; x: string; b: string; linie: string; tex?: string }
  // fazele algoritmului, cu titlul in forma matriceala, cand pseudocodul pune mai multi algoritmi
  // ai cursului unul dupa altul
  faze?: { linii: [number, number]; tex: string; text: Text }[]
}

export const GRUPURI_ALGORITMI: { id: string; titlu: Text }[] = [
  { id: 'baza', titlu: { ro: 'Operații de bază', en: 'Basic operations' } },
  { id: 'directe', titlu: { ro: 'Sisteme liniare, metode directe', en: 'Linear systems, direct methods' } },
  { id: 'structura', titlu: { ro: 'Matrice bandă (cu structură)', en: 'Banded (structured) matrices' } },
  { id: 'iterative', titlu: { ro: 'Sisteme liniare, metode iterative', en: 'Linear systems, iterative methods' } },
  { id: 'ortogonal', titlu: { ro: 'Transformări ortogonale și CMMP', en: 'Orthogonal transformations and least squares' } },
  { id: 'proprii', titlu: { ro: 'Valori proprii', en: 'Eigenvalues' } },
]

// "{dif} max |a - b|", tiparit in fisierul Python
const dif = (a: string, b: string) => `print("{dif}", np.max(np.abs(${a} - ${b})))`
// un sistem patrat Ax = b, fata de np.linalg.solve
const fataDeSolve = (A: string, x: string) => [`x_np = np.linalg.solve(${A}, b)`, 'print("np.linalg.solve =", x_np)', dif(x, 'x_np')]

const REZIDUU_PORNIRE: Text = { ro: 'reziduul aproximării de pornire, raportat la mărimea lui b', en: 'the residual of the starting approximation, relative to the size of b' }
const TEST_OPRIRE: Text = { ro: 'testul de oprire: cât de departe este Ax de b după această trecere', en: 'the stopping test: how far Ax is from b after this sweep' }
const GPP_DIRECT = {
  nume: { ro: 'eliminarea gaussiană cu pivotare parțială și substituția înapoi (S_GPP)', en: 'Gaussian elimination with partial pivoting and back substitution (S_GPP)' },
  flopi: (n: number) => Math.round((2 * n ** 3) / 3 + 2 * n * n),
}

// 2n³/3, costul eliminarii gaussiene pentru matricea patrata `nume`
const eliminare = (nume: string) => (x: Marimi) => (2 * x.forme[nume][0] ** 3) / 3
// Flopii eliminarii pe o matrice banda n x n: la pasul k, r_k impartiri si r_k q_k actualizari de
// cate 2 flopi, cu r_k = min(r, n - k) si q_k = min(q, n - k)
const banda = (n: number, r: number, q: number): number => {
  let s = 0
  for (let k = 1; k < n; k++) s += Math.min(r, n - k) * (2 * Math.min(q, n - k) + 1)
  return s
}
// 2(mn² − n³/3) pentru m ≥ n; cu rolurile schimbate cand matricea e lata
const triangularizare = (x: Marimi) => {
  const [m, n] = x.forme.A
  const mare = Math.max(m, n)
  const mic = Math.min(m, n)
  return 2 * (mare * mic * mic - mic ** 3 / 3)
}

const LIDER: Text = {
  ro: 'n × n, cu submatricele lider principale A[k] nesingulare (A[k] = primele k linii și coloane, k = 1 : n-1)',
  en: 'n × n, with nonsingular leading principal submatrices A[k] (A[k] = the first k rows and columns, k = 1 : n-1)',
}
const TOLERANTA: Text = { ro: 'toleranța pentru ‖Ax − b‖ / ‖b‖, între 0 și 1', en: 'tolerance for ‖Ax − b‖ / ‖b‖, between 0 and 1' }
const MAXITER: Text = { ro: 'numărul maxim de iterații', en: 'maximum number of iterations' }
const PORNIRE: Text = { ro: 'lungime n, aproximarea de pornire', en: 'length n, the starting approximation' }

const ETAPE_GPP: Etapa[] = [
  {
    linii: [4, 5],
    tex: '|a_{i_k k}| = \\max_{i = k:n} |a_{ik}|',
    text: { ro: 'alegerea pivotului în coloana k, de la diagonală în jos; p_k reține linia lui', en: 'choosing the pivot in column k, on or below the diagonal; p_k records its row' },
  },
  {
    linii: [6, 7],
    tex: 'A \\leftarrow P_k A',
    text: {
      ro: 'liniile k și i_k se interschimbă de la coloana k încolo (P_k este matricea care face această interschimbare); multiplicatorii din coloanele dinainte rămân pe loc, de aceea în PA = LU coloana k a lui L este m_k permutată de interschimbările următoare (slide-ul "Factorizari LU rezultate din eliminarea gaussiana")',
      en: 'rows k and i_k are swapped from column k onwards (P_k is the matrix that performs this swap); the multipliers of the earlier columns stay in place, which is why in PA = LU column k of L is m_k permuted by the later swaps (slide "Factorizari LU rezultate din eliminarea gaussiana")',
    },
  },
  {
    linii: [8, 9],
    tex: '\\mu_{ik} = a_{ik} / a_{kk}, \\quad i = k+1 : n',
    text: { ro: 'multiplicatorii pasului k; după pivotare toți au modulul cel mult 1', en: 'the multipliers of step k; after pivoting they all have absolute value at most 1' },
  },
  {
    linii: [10, 12],
    tex: 'A \\leftarrow M_k A',
    text: {
      ro: 'din fiecare linie de sub pivot se scade linia pivotului înmulțită cu multiplicatorul ei (M_k este matricea care face aceste scăderi)',
      en: 'the pivot row times its multiplier is subtracted from every row below the pivot (M_k is the matrix that performs these subtractions)',
    },
  },
]

const ETAPE_QR: Etapa[] = [
  {
    linii: [5, 7],
    tex: '\\sigma = \\operatorname{sgn}(a_{kk})\\, \\|A(k\\!:\\!m,\\, k)\\|',
    text: { ro: 'norma coloanei k de la diagonală în jos, cu semnul lui a_kk', en: 'the norm of column k from the diagonal down, with the sign of a_kk' },
  },
  {
    linii: [8, 10],
    tex: 'u_{ik} = a_{ik} / \\sigma \\;\\; (i > k), \\qquad u_{kk} = 1 + a_{kk} / \\sigma = \\beta_k',
    text: {
      ro: 'vectorul Householder scalat al pasului k; partea de sub diagonală rămâne în A, iar u_kk se ține în β_k',
      en: 'the scaled Householder vector of step k; the part below the diagonal stays in A, and u_kk is kept in β_k',
    },
  },
  {
    linii: [11, 13],
    tex: 'A(k\\!:\\!m,\\, j) \\leftarrow A(k\\!:\\!m,\\, j) - \\nu\\, u_k(k\\!:\\!m), \\qquad \\nu = \\dfrac{u_k^T A(:,\\, j)}{\\beta_k}',
    text: { ro: 'reflectorul U_k aplicat pe fiecare coloană j > k: un produs scalar și o actualizare de vector', en: 'the reflector U_k applied to every column j > k: one dot product and one vector update' },
  },
  {
    linii: [14, 14],
    tex: 'r_{kk} = -\\sigma',
    text: { ro: 'elementul diagonal al lui R; sub el ar fi zerouri, dar acolo se păstrează u_k', en: 'the diagonal entry of R; below it there would be zeros, but u_k is kept there' },
  },
]

const SURSA_GPP = `pentru k = 1 : n-1
    i_k ← argmax_{i=k:n} |a_ik|
    p_k ← i_k
    pentru j = k : n
        a_kj ↔ a_{i_k, j}
    pentru i = k+1 : n
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : n
            a_ij ← a_ij - μ_ik a_kj`

// Algoritmul QR de pe slide. Linia "a_kk ← u_kk = β_k" este in plus: slide-ul tine u_kk doar in
// β_k ("se tine seama ca u_kk = β_k"), iar aici se scrie si in A, ca sumele pe i = k : m sa
// citeasca u direct din A, cum face Algoritmul SQR de pe slide.
const SURSA_QR = `U peste A
s ← min(m-1, n)
fie β[s]
pentru k = 1 : s
    σ ← ‖A(k:m, k)‖
    dacă σ ≠ 0 atunci
        σ ← sgn(a_kk) σ
        a_ik ← u_ik = a_ik / σ, i = k : m
        β_k ← u_kk = 1 + a_kk
        a_kk ← u_kk = β_k    % în plus față de slide
        pentru j = k+1 : n
            ν ← (Σ_{i=k}^{m} u_ik a_ij) / β_k
            a_ij ← a_ij - ν u_ik, i = k : m
        a_kk ← -σ`

export const BIBLIOTECA: Algoritm[] = [
  {
    id: 'matvec',
    grup: 'baza',
    notiuni: ['vector', 'matrice', 'produs_scalar', 'matvec', 'flop'],
    titlu: { ro: 'Înmulțire matrice-vector', en: 'Matrix-vector product' },
    descriere: {
      ro: 'Calculează y = Ax. Fiecare y_i este produsul scalar dintre linia i a lui A și x: se adună a_ij x_j pentru j = 1 : n.',
      en: 'Computes y = Ax. Each y_i is the dot product of row i of A with x: the terms a_ij x_j are added for j = 1 : n.',
    },
    curs: {
      ro: 'Algoritmul 1.5 (Gaxpy) din cartea cursului (Dumitrescu, Popeea, Jora); slide-urile nu au un algoritm pentru y = Ax. Cartea calculează y ← Ax + y; aici y pornește de la 0.',
      en: 'Algorithm 1.5 (Gaxpy) in the book of the course (Dumitrescu, Popeea, Jora); the slides have no algorithm for y = Ax. The book computes y ← Ax + y; here y starts from 0.',
    },
    cost: { ro: '2mn flopi', en: '2mn flops' },
    estimare: (x) => 2 * x.forme.A[0] * x.forme.A[1],
    forma: 'y = A x',
    etape: [
      {
        linii: [2, 5],
        tex: 'y_i = A(i, :)\\, x = \\sum_{j=1}^{n} a_{ij} x_j',
        text: { ro: 'componenta i a rezultatului: linia i a lui A înmulțită scalar cu x', en: 'component i of the result: row i of A dotted with x' },
      },
    ],
    practic: {
      ro: 'În NumPy același rezultat este A @ x sau np.dot(A, x). Buclele arată ce se calculează; pe matrice mari se folosește operația din NumPy, care este mult mai rapidă. Dacă A are zerouri știute dinainte (de exemplu este triunghiulară), suma se face doar peste elementele care pot fi nenule.',
      en: 'In NumPy the same result is A @ x or np.dot(A, x). The loops show what is computed; on large matrices you use the NumPy operation, which is much faster. When A has zeros known in advance (for instance it is triangular), the sum runs only over the entries that can be nonzero.',
    },
    iesiri: ['y'],
    numpy: ['print("A @ x =", A @ x)', dif('{y}', 'A @ x')],
    sursa: `fie y[m]
pentru i = 1 : m
    y_i ← 0
    pentru j = 1 : n
        y_i ← y_i + a_ij x_j`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[1, 2, 0], [0, 1, 3], [4, 0, 1], [2, 2, 2]], descriere: { ro: 'm × n', en: 'm × n' } },
      { nume: 'x', tip: 'vector', exemplu: [1, 2, 3], descriere: { ro: 'lungime n, câte coloane are A', en: 'length n, the number of columns of A' }, dimensiune: ['A', 'coloane'] },
    ],
  },
  {
    id: 'matmul',
    grup: 'baza',
    notiuni: ['matrice', 'matmul', 'flop'],
    titlu: { ro: 'Înmulțire matrice-matrice', en: 'Matrix-matrix product' },
    descriere: {
      ro: 'Calculează C = AB. Elementul c_ij adună produsele a_ik b_kj pentru k = 1 : l, adică linia i din A înmulțită scalar cu coloana j din B.',
      en: 'Computes C = AB. Entry c_ij adds the products a_ik b_kj for k = 1 : l, that is row i of A dotted with column j of B.',
    },
    curs: {
      ro: 'Curs II, slide-ul "Inmultirea matricilor", cu buclele în aceeași ordine. Slide-ul scrie "C = 0"; aici dimensiunile se citesc din A și B, iar C se declară cu "fie", care o umple cu zerouri.',
      en: 'Course II, slide "Inmultirea matricilor", with the loops in the same order. The slide writes "C = 0"; here the sizes are read from A and B, and C is declared with "fie" (let), which fills it with zeros.',
    },
    cost: { ro: '2mnl flopi', en: '2mnl flops' },
    estimare: (x) => 2 * x.forme.A[0] * x.forme.A[1] * x.forme.B[1],
    forma: 'C = A B',
    etape: [
      {
        linii: [3, 3],
        tex: 'C(:, j) = A\\, B(:, j)',
        text: { ro: 'coloana j a lui C este A înmulțită cu coloana j a lui B', en: 'column j of C is A times column j of B' },
      },
      {
        linii: [4, 6],
        tex: 'c_{ij} = A(i, :)\\, B(:, j) = \\sum_{k=1}^{l} a_{ik} b_{kj}',
        text: { ro: 'elementul (i, j): linia i din A înmulțită scalar cu coloana j din B', en: 'entry (i, j): row i of A dotted with column j of B' },
      },
    ],
    practic: {
      ro: 'Pentru matrice pătrate costul este 2n³. În general AB ≠ BA. În NumPy: A @ B sau np.dot(A, B). Cursul observă că inversarea unei matrice costă tot ≈ 2n³, de aproximativ trei ori cât rezolvarea unui sistem de aceeași dimensiune, deci un sistem nu se rezolvă calculând A⁻¹.',
      en: 'For square matrices the cost is 2n³. In general AB ≠ BA. In NumPy: A @ B or np.dot(A, B). The course notes that inverting a matrix also costs ≈ 2n³, about three times as much as solving a system of the same size, so a system is not solved by computing A⁻¹.',
    },
    iesiri: ['C'],
    numpy: ['print("A @ B =", A @ B, sep="\\n")', dif('{C}', 'A @ B')],
    sursa: `m ← linii(A); l ← coloane(A); n ← coloane(B)
fie C[m,n]
pentru j = 1 : n
    pentru i = 1 : m
        pentru k = 1 : l
            c_ij ← c_ij + a_ik b_kj`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[1, 2], [0, 1], [3, 1]], descriere: { ro: 'm × l', en: 'm × l' } },
      { nume: 'B', tip: 'matrice', exemplu: [[1, 0, 2], [2, 1, 0]], descriere: { ro: 'l × n, cu atâtea linii câte coloane are A', en: 'l × n, with as many rows as A has columns' }, dimensiune: ['A', 'coloane'] },
    ],
  },
  {
    id: 'LTRIS',
    grup: 'directe',
    notiuni: ['triunghiulara', 'sistem_liniar', 'substitutie', 'flop'],
    titlu: { ro: 'LTRIS, substituție înainte', en: 'LTRIS, forward substitution' },
    descriere: {
      ro: 'Rezolvă Lx = b când L este inferior triunghiulară. Prima ecuație are o singură necunoscută, x_1; fiecare ecuație următoare aduce o singură necunoscută nouă, care se află din cele de dinainte. x pornește ca o copie a lui b.',
      en: 'Solves Lx = b when L is lower triangular. The first equation has a single unknown, x_1; each following equation brings one new unknown, found from the ones before it. x starts as a copy of b.',
    },
    curs: {
      ro: 'Curs II, slide-urile "Rezolvarea sistemelor triunghiulare", algoritmul LTRIS, rând cu rând.',
      en: 'Course II, slides "Rezolvarea sistemelor triunghiulare", algorithm LTRIS, line by line.',
    },
    cost: { ro: 'n² flopi', en: 'n² flops' },
    estimare: (x) => x.forme.L[0] ** 2,
    forma: 'L x = b',
    etape: [
      {
        linii: [3, 4],
        tex: 'x_i \\leftarrow b_i - L(i,\\, 1\\!:\\!i-1)\\; x(1\\!:\\!i-1)',
        text: { ro: 'din b_i se scad necunoscutele deja aflate, înmulțite cu elementele liniei i', en: 'the unknowns already found, times the entries of row i, are subtracted from b_i' },
      },
      {
        linii: [5, 5],
        tex: 'x_i \\leftarrow x_i / l_{ii}',
        text: { ro: 'împărțirea la elementul diagonal dă necunoscuta i', en: 'dividing by the diagonal entry gives unknown i' },
      },
    ],
    practic: {
      ro: 'L este nesingulară exact când toate elementele l_ii sunt nenule; un l_ii nul oprește algoritmul la împărțire. Se folosește după o factorizare: cu A = LU, sistemul Ax = b devine Ly = b, apoi Ux = y. Slide-ul "Inversarea matricelor triunghiulare" arată că inversa L⁻¹ (algoritmul LINV) costă O(n³/3) flopi, deci Lx = b se rezolvă prin substituție, cu n² flopi, nu prin inversare. Cartea cursului (pagina 102) notează că substituția este numeric stabilă: într-o rezolvare Ax = b, erorile vin mai ales din triangularizare. În SciPy: scipy.linalg.solve_triangular(L, b, lower=True).',
      en: 'L is nonsingular exactly when every l_ii is nonzero; a zero l_ii stops the algorithm at the division. It is used after a factorization: with A = LU, the system Ax = b becomes Ly = b, then Ux = y. The slide "Inversarea matricelor triunghiulare" shows that the inverse L⁻¹ (algorithm LINV) costs O(n³/3) flops, so Lx = b is solved by substitution, with n² flops, not by inversion. The book of the course (page 102) notes that substitution is numerically stable: when solving Ax = b, the errors come mostly from the triangularization. In SciPy: scipy.linalg.solve_triangular(L, b, lower=True).',
    },
    iesiri: ['x'],
    numpy: fataDeSolve('L', '{x}'),
    ecuatie: { A: 'L', x: 'x', b: 'b', linie: 'i' },
    sursa: `x ← b
pentru i = 1 : n
    pentru j = 1 : i-1
        x_i ← x_i - l_ij x_j
    x_i ← x_i / l_ii`,
    intrari: [
      { nume: 'L', tip: 'matrice', exemplu: [[2, 0, 0], [1, 3, 0], [-1, 2, 4]], descriere: { ro: 'n × n, inferior triunghiulară, cu diagonala nenulă', en: 'n × n, lower triangular, with a nonzero diagonal' }, natura: 'inferior' },
      { nume: 'b', tip: 'vector', exemplu: [2, 7, 9], descriere: { ro: 'lungime n', en: 'length n' }, dimensiune: ['L', 'linii'] },
    ],
  },
  {
    id: 'UTRIS',
    grup: 'directe',
    notiuni: ['triunghiulara', 'sistem_liniar', 'substitutie', 'flop'],
    titlu: { ro: 'UTRIS, substituție înapoi', en: 'UTRIS, back substitution' },
    descriere: {
      ro: 'Rezolvă Ux = b când U este superior triunghiulară, de jos în sus: ultima ecuație dă x_n, apoi fiecare ecuație de deasupra aduce o singură necunoscută nouă. x pornește ca o copie a lui b.',
      en: 'Solves Ux = b when U is upper triangular, from the bottom up: the last equation gives x_n, then each equation above it brings one new unknown. x starts as a copy of b.',
    },
    curs: {
      ro: 'Curs II, slide-ul "Rezolvarea sistemelor triunghiulare", algoritmul UTRIS, rând cu rând.',
      en: 'Course II, slide "Rezolvarea sistemelor triunghiulare", algorithm UTRIS, line by line.',
    },
    cost: { ro: 'n² flopi', en: 'n² flops' },
    estimare: (x) => x.forme.U[0] ** 2,
    forma: 'U x = b',
    etape: [
      {
        linii: [3, 4],
        tex: 'x_i \\leftarrow b_i - U(i,\\, i+1\\!:\\!n)\\; x(i+1\\!:\\!n)',
        text: { ro: 'din b_i se scad necunoscutele deja aflate, înmulțite cu elementele liniei i', en: 'the unknowns already found, times the entries of row i, are subtracted from b_i' },
      },
      {
        linii: [5, 5],
        tex: 'x_i \\leftarrow x_i / u_{ii}',
        text: { ro: 'împărțirea la elementul diagonal dă necunoscuta i', en: 'dividing by the diagonal entry gives unknown i' },
      },
    ],
    practic: {
      ro: 'Este ultimul pas după eliminarea gaussiană sau după triangularizarea ortogonală, care lasă de rezolvat un sistem superior triunghiular. U este nesingulară exact când toate elementele u_ii sunt nenule. Cartea cursului (pagina 102) notează că substituția este numeric stabilă: într-o rezolvare Ax = b, erorile vin mai ales din triangularizare. În SciPy: scipy.linalg.solve_triangular(U, b).',
      en: 'It is the last step after Gaussian elimination or orthogonal triangularization, which leave an upper triangular system to solve. U is nonsingular exactly when every u_ii is nonzero. The book of the course (page 102) notes that substitution is numerically stable: when solving Ax = b, the errors come mostly from the triangularization. In SciPy: scipy.linalg.solve_triangular(U, b).',
    },
    iesiri: ['x'],
    numpy: fataDeSolve('U', '{x}'),
    ecuatie: { A: 'U', x: 'x', b: 'b', linie: 'i' },
    sursa: `x ← b
pentru i = n : -1 : 1
    pentru j = i+1 : n
        x_i ← x_i - u_ij x_j
    x_i ← x_i / u_ii`,
    intrari: [
      { nume: 'U', tip: 'matrice', exemplu: [[2, 1, -1], [0, 3, 2], [0, 0, 4]], descriere: { ro: 'n × n, superior triunghiulară, cu diagonala nenulă', en: 'n × n, upper triangular, with a nonzero diagonal' }, natura: 'superior' },
      { nume: 'b', tip: 'vector', exemplu: [3, 11, 8], descriere: { ro: 'lungime n', en: 'length n' }, dimensiune: ['U', 'linii'] },
    ],
  },
  {
    id: 'G',
    grup: 'directe',
    notiuni: ['sistem_liniar', 'eliminare', 'lider', 'pivot', 'factorizare', 'flop'],
    titlu: { ro: 'G, eliminare gaussiană', en: 'G, Gaussian elimination' },
    descriere: {
      ro: 'Aduce A la forma superior triunghiulară. La pasul k, din fiecare linie i de sub linia k se scade linia k înmulțită cu multiplicatorul μ_ik = a_ik / a_kk, ales ca elementul de sub pivotul a_kk să devină zero. Rezultatul U rămâne în triunghiul superior al lui A, iar multiplicatorii se păstrează sub diagonală, în locul zerourilor.',
      en: 'Brings A to upper triangular form. At step k, row k times the multiplier μ_ik = a_ik / a_kk is subtracted from every row i below it, the multiplier being chosen so that the entry under the pivot a_kk becomes zero. The result U stays in the upper triangle of A, and the multipliers are kept below the diagonal, in place of the zeros.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Triangularizare prin eliminare gaussiana", Algoritmul G, rând cu rând. Exemplul este cel din slide-urile de dinainte și dă același rezultat.',
      en: 'Course III, slide "Triangularizare prin eliminare gaussiana", Algorithm G, line by line. The example is the one from the preceding slides and gives the same result.',
    },
    cost: { ro: '≈ 2n³/3 flopi', en: '≈ 2n³/3 flops' },
    estimare: eliminare('A'),
    forma: 'M_{n-1} \\cdots M_2 M_1 A = U',
    etape: [
      {
        linii: [3, 4],
        tex: '\\mu_{ik} = a_{ik} / a_{kk}, \\quad i = k+1 : n',
        text: { ro: 'multiplicatorii pasului k: elementele de sub pivot împărțite la pivot', en: 'the multipliers of step k: the entries below the pivot divided by the pivot' },
      },
      {
        linii: [5, 7],
        tex: 'A(i,\\, k+1\\!:\\!n) \\leftarrow A(i,\\, k+1\\!:\\!n) - \\mu_{ik}\\, A(k,\\, k+1\\!:\\!n), \\quad i = k+1 : n',
        text: {
          ro: 'din fiecare linie de sub pivot se scade linia pivotului înmulțită cu multiplicatorul ei; în forma matriceală, M_k este matricea care face aceste scăderi, A ← M_k A',
          en: 'the pivot row times its multiplier is subtracted from every row below the pivot; in the matrix form, M_k is the matrix that performs these subtractions, A ← M_k A',
        },
      },
    ],
    practic: {
      ro: 'Fără pivotare, un pivot nul oprește algoritmul chiar dacă A este nesingulară, iar un pivot mic strică rezultatul: în exemplul din curs, pivotul 10⁻⁴ și o precizie de trei cifre dau x_1 = 0 în loc de 1. De aceea în practică se folosește GPP. Algoritmul merge până la capăt exact când submatricele lider principale A[k], k = 1 : n-1, sunt nesingulare; teorema din curs adaugă că, dacă A este nesingulară, atunci și U este nesingulară. Cartea cursului (pagina 103) numește G numeric instabil, pentru că fără pivotare factorul de creștere γ poate fi oricât de mare.',
      en: 'Without pivoting, a zero pivot stops the algorithm even when A is nonsingular, and a small pivot ruins the result: in the course example, the pivot 10⁻⁴ and three digits of precision give x_1 = 0 instead of 1. This is why GPP is used in practice. The algorithm runs to the end exactly when the leading principal submatrices A[k], k = 1 : n-1, are nonsingular; the theorem of the course adds that, if A is nonsingular, then U is nonsingular too. The book of the course (page 103) calls G numerically unstable, because without pivoting the growth factor γ can be arbitrarily large.',
    },
    iesiri: ['A'],
    numpy: [
      '# NumPy nu are LU fara pivotare: se verifica A = LU cu L, U luate din rezultat',
      'L = np.tril({A}, -1) + np.eye(len(A))',
      'U = np.triu({A})',
      dif('L @ U', 'A'),
    ],
    sursa: `μ peste A
pentru k = 1 : n-1
    pentru i = k+1 : n
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : n
            a_ij ← a_ij - μ_ik a_kj`,
    intrari: [{ nume: 'A', tip: 'matrice', exemplu: [[1, 2, 1], [2, 1, 2], [1, 1, 2]], descriere: LIDER, natura: 'lider' }],
  },
  {
    id: 'GPP',
    grup: 'directe',
    notiuni: ['eliminare', 'pivot', 'stabilitate', 'indici'],
    titlu: { ro: 'GPP, eliminare gaussiană cu pivotare parțială', en: 'GPP, Gaussian elimination with partial pivoting' },
    descriere: {
      ro: 'Eliminare gaussiană în care, la pasul k, pivotul este elementul cu cel mai mare modul din coloana k, de la diagonală în jos. Linia lui se interschimbă cu linia k, apoi eliminarea continuă ca în algoritmul G. Vectorul p reține ce linie a fost adusă la fiecare pas.',
      en: 'Gaussian elimination in which, at step k, the pivot is the entry with the largest absolute value in column k, on or below the diagonal. Its row is swapped with row k, then elimination goes on as in algorithm G. The vector p records which row was brought up at each step.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Algoritmul GPP - Eliminare gaussiana cu pivotare partiala", rând cu rând; la egalitate se alege cel mai mic indice, ca pe slide. Exemplul este cel lucrat pe slide-urile "Eliminarea Gaussiana cu Pivotare Partiala - exemplu": la pasul 1 pivotul este 2, din linia 3, cu multiplicatorii 0.5 și 0.005; la pasul 2 pivotul rămâne pe loc, iar U iese [2 0 1; 0 2 −0.5; 0 0 1.245], cu p = (3, 2).',
      en: 'Course III, slide "Algoritmul GPP - Eliminare gaussiana cu pivotare partiala", line by line; on ties the smallest index is chosen, as on the slide. The example is the one worked on the slides "Eliminarea Gaussiana cu Pivotare Partiala - exemplu": at step 1 the pivot is 2, from row 3, with multipliers 0.5 and 0.005; at step 2 the pivot stays in place, and U comes out [2 0 1; 0 2 −0.5; 0 0 1.245], with p = (3, 2).',
    },
    cost: { ro: '≈ 2n³/3 flopi plus ≈ n²/2 comparații nenumărate ca flopi', en: '≈ 2n³/3 flops plus ≈ n²/2 comparisons not counted as flops' },
    estimare: eliminare('A'),
    forma: 'M_{n-1} P_{n-1} \\cdots M_1 P_1 A = U',
    etape: ETAPE_GPP,
    practic: {
      ro: 'Pivotul fiind cel mai mare din coloană, toți multiplicatorii au modulul cel mult 1; cartea cursului numește GPP "practic stabil". Teorema din curs: dacă A este nesingulară, GPP se execută complet și U iese nesingulară. numpy.linalg.solve rezolvă sistemul tot prin eliminare cu pivotare parțială.',
      en: 'Since the pivot is the largest in its column, all multipliers have absolute value at most 1; the book of the course calls GPP "stable in practice". The theorem of the course: if A is nonsingular, GPP runs to completion and U comes out nonsingular. numpy.linalg.solve also solves the system by elimination with partial pivoting.',
    },
    iesiri: ['A', 'p'],
    numpy: [
      '# det(A) = (-1)^(numarul de interschimbari) * produsul diagonalei lui U',
      'semn = (-1) ** np.count_nonzero({p} != np.arange(len({p})))',
      'print("np.linalg.det(A) =", np.linalg.det(A))',
      dif('semn * np.prod(np.diag({A}))', 'np.linalg.det(A)'),
    ],
    sursa: `μ peste A
fie p[n-1]
${SURSA_GPP}`,
    intrari: [{ nume: 'A', tip: 'matrice', exemplu: [[0.01, 1, 1], [1, 2, 0], [2, 0, 1]], descriere: { ro: 'n × n, nesingulară', en: 'n × n, nonsingular' }, natura: 'nesingulara' }],
  },
  {
    id: 'S_GPP',
    grup: 'directe',
    notiuni: ['sistem_liniar', 'eliminare', 'pivot', 'substitutie', 'conditionare'],
    titlu: { ro: 'S_GPP, rezolvarea lui Ax = b cu GPP', en: 'S_GPP, solving Ax = b with GPP' },
    descriere: {
      ro: 'Rezolvă Ax = b în trei pași: triangularizează A cu GPP, aplică aceleași interschimbări și aceiași multiplicatori pe b, apoi rezolvă sistemul superior triunghiular rămas prin substituție înapoi.',
      en: 'Solves Ax = b in three steps: it triangularizes A with GPP, applies the same swaps and the same multipliers to b, then solves the remaining upper triangular system by back substitution.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Rezolvarea sistemelor liniare utilizand GPP", Algoritmul S_GPP. Slide-ul apelează GPP și UTRIS; aici pașii lor sunt scriși desfășurat, pentru că pseudocodul din vizualizator nu are apeluri între algoritmi.',
      en: 'Course III, slide "Rezolvarea sistemelor liniare utilizand GPP", Algorithm S_GPP. The slide calls GPP and UTRIS; here their steps are written out, because the pseudocode of the visualizer has no calls between algorithms.',
    },
    cost: { ro: '≈ 2n³/3 flopi pentru triangularizare, plus ≈ 2n² pentru b și substituție', en: '≈ 2n³/3 flops for the triangularization, plus ≈ 2n² for b and the substitution' },
    estimare: (x) => eliminare('A')(x) + 2 * x.forme.A[0] ** 2,
    forma: 'Ax = b \\;\\Longleftrightarrow\\; Ux = M_{n-1} P_{n-1} \\cdots M_1 P_1\\, b',
    etape: [
      ...ETAPE_GPP,
      {
        linii: [13, 16],
        tex: 'b \\leftarrow M_k P_k\\, b, \\quad k = 1 : n-1',
        text: { ro: 'aceleași interschimbări și aceiași multiplicatori se aplică termenului liber', en: 'the same swaps and the same multipliers are applied to the right-hand side' },
      },
      {
        linii: [17, 21],
        tex: 'U x = b',
        text: { ro: 'sistemul superior triunghiular rămas se rezolvă prin substituție înapoi (UTRIS)', en: 'the remaining upper triangular system is solved by back substitution (UTRIS)' },
      },
    ],
    practic: {
      ro: 'Efortul principal este triangularizarea. Pentru mai multe sisteme cu aceeași matrice, ea se face o singură dată și se refac doar pașii pe b. Un reziduu ‖Ax − b‖ mic nu garantează un x precis: cartea cursului notează că testul "reziduul este mic" este valid doar dacă A este bine condiționată.',
      en: 'The main effort is the triangularization. For several systems with the same matrix it is done once, and only the steps on b are redone. A small residual ‖Ax − b‖ does not guarantee an accurate x: the book of the course notes that the "small residual" test is valid only when A is well conditioned.',
    },
    iesiri: ['x'],
    numpy: fataDeSolve('A', '{x}'),
    ecuatie: { A: 'A', x: 'x', b: 'b', linie: 'i' },
    sursa: `μ, U peste A
fie p[n-1]
${SURSA_GPP}
pentru k = 1 : n-1
    b_k ↔ b_{p_k}
    pentru i = k+1 : n
        b_i ← b_i - μ_ik b_k
x ← b
pentru i = n : -1 : 1
    pentru j = i+1 : n
        x_i ← x_i - u_ij x_j
    x_i ← x_i / u_ii`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[1, 2, 1], [2, 1, 2], [1, 1, 2]], descriere: { ro: 'n × n, nesingulară', en: 'n × n, nonsingular' }, natura: 'nesingulara' },
      { nume: 'b', tip: 'vector', exemplu: [4, 5, 4], descriere: { ro: 'lungime n', en: 'length n' }, dimensiune: ['A', 'linii'] },
    ],
  },
  {
    id: 'LU',
    grup: 'directe',
    notiuni: ['factorizare', 'lider', 'eliminare', 'triunghiulara'],
    titlu: { ro: 'LU, factorizare Crout', en: 'LU, Crout factorization' },
    descriere: {
      ro: 'Scrie A = LU, cu L inferior triunghiulară și U superior triunghiulară cu 1 pe diagonală. La pasul k se calculează coloana k a lui L, apoi linia k a lui U, din egalitatea A = LU citită element cu element. L și U se scriu peste A; diagonala de 1 a lui U nu se memorează.',
      en: 'Writes A = LU, with L lower triangular and U upper triangular with ones on the diagonal. At step k it computes column k of L, then row k of U, from the equality A = LU read entry by entry. L and U overwrite A; the unit diagonal of U is not stored.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Factorizari LU compacte", Algoritmul Crout, rând cu rând. Slide-urile nu au un exemplu numeric pentru el; aici se folosește matricea de la algoritmul G.',
      en: 'Course III, slide "Factorizari LU compacte", the Crout algorithm, line by line. The slides have no numerical example for it; the matrix of algorithm G is used here.',
    },
    cost: { ro: '≈ 2n³/3 flopi', en: '≈ 2n³/3 flops' },
    estimare: eliminare('A'),
    forma: 'A = L U, \\qquad u_{kk} = 1',
    etape: [
      {
        linii: [3, 4],
        tex: 'L(k\\!:\\!n,\\, k) = A(k\\!:\\!n,\\, k) - L(k\\!:\\!n,\\, 1\\!:\\!k-1)\\; U(1\\!:\\!k-1,\\, k)',
        text: { ro: 'coloana k a lui L, din egalitatea A = LU citită pe coloana k', en: 'column k of L, from the equality A = LU read along column k' },
      },
      {
        linii: [5, 6],
        tex: 'U(k,\\, k+1\\!:\\!n) = \\bigl(A(k,\\, k+1\\!:\\!n) - L(k,\\, 1\\!:\\!k-1)\\; U(1\\!:\\!k-1,\\, k+1\\!:\\!n)\\bigr) / l_{kk}',
        text: { ro: 'linia k a lui U, din aceeași egalitate citită pe linia k', en: 'row k of U, from the same equality read along row k' },
      },
    ],
    practic: {
      ro: 'Teorema din curs: factorizarea există și este unică dacă și numai dacă submatricele lider principale A[k], k = 1 : n-1, sunt nesingulare. Varianta cu 1 pe diagonala lui L se numește Doolittle și este cea pe care o produce eliminarea gaussiană. Slide-ul "Factorizari LU compacte" le leagă: cu D = diag(U_Do), L_Cr = L_Do D și U_Cr = D⁻¹U_Do; dacă D se păstrează separat, A = LDU cu ambele triunghiulare unitate, factorizarea LDU definită în curs. După factorizare, Ax = b se rezolvă cu două substituții: Ly = b, apoi Ux = y. Fără pivotare, un l_kk mic are același efect ca un pivot mic la algoritmul G; scipy.linalg.lu factorizează cu pivotare parțială și întoarce P, L, U cu A = PLU; cursul scrie PA = LU, deci P din SciPy este transpusa permutării din curs.',
      en: 'The theorem of the course: the factorization exists and is unique if and only if the leading principal submatrices A[k], k = 1 : n-1, are nonsingular. The variant with ones on the diagonal of L is called Doolittle and is the one Gaussian elimination produces. The slide "Factorizari LU compacte" links the two: with D = diag(U_Do), L_Cr = L_Do D and U_Cr = D⁻¹U_Do; if D is kept apart, A = LDU with both triangular factors unit, the LDU factorization defined in the course. After the factorization, Ax = b is solved with two substitutions: Ly = b, then Ux = y. Without pivoting, a small l_kk has the same effect as a small pivot in algorithm G; scipy.linalg.lu factorizes with partial pivoting and returns P, L, U with A = PLU; the course writes PA = LU, so the P of SciPy is the transpose of the permutation in the course.',
    },
    iesiri: ['A'],
    numpy: [
      '# NumPy nu are factorizarea Crout: se verifica A = LU cu L, U luate din rezultat',
      'L = np.tril({A})',
      'U = np.triu({A}, 1) + np.eye(len(A))',
      dif('L @ U', 'A'),
    ],
    sursa: `L, U peste A
pentru k = 1 : n
    pentru i = k : n
        a_ik ← l_ik = a_ik - Σ_{s=1}^{k-1} l_is u_sk
    pentru j = k+1 : n
        a_kj ← u_kj = (a_kj - Σ_{s=1}^{k-1} l_ks u_sj) / l_kk`,
    intrari: [{ nume: 'A', tip: 'matrice', exemplu: [[1, 2, 1], [2, 1, 2], [1, 1, 2]], descriere: LIDER, natura: 'lider' }],
  },
  {
    id: 'CHOL',
    grup: 'directe',
    notiuni: ['pozitiv_definita', 'cholesky', 'factorizare', 'transpusa'],
    titlu: { ro: 'CHOL, factorizare Cholesky', en: 'CHOL, Cholesky factorization' },
    descriere: {
      ro: 'Pentru o matrice simetrică și pozitiv definită, scrie A = LLᵀ cu L inferior triunghiulară. La pasul k se calculează întâi elementul diagonal l_kk, printr-un radical, apoi restul coloanei k. L se scrie peste triunghiul inferior al lui A. Dacă numărul de sub radical iese α ≤ 0, A nu este pozitiv definită și algoritmul se oprește.',
      en: 'For a symmetric positive definite matrix, writes A = LLᵀ with L lower triangular. At step k it first computes the diagonal entry l_kk, by a square root, then the rest of column k. L overwrites the lower triangle of A. If the number under the square root comes out α ≤ 0, A is not positive definite and the algorithm stops.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Algoritm factorizare Cholesky", Algoritmul CHOL, rând cu rând. Exemplul din slide-uri este 2 x 2; aici este unul 3 x 3 la care L iese cu numere întregi.',
      en: 'Course III, slide "Algoritm factorizare Cholesky", Algorithm CHOL, line by line. The example in the slides is 2 x 2; here it is a 3 x 3 one for which L comes out with integer entries.',
    },
    cost: { ro: '≈ n³/3 flopi și n radicali', en: '≈ n³/3 flops and n square roots' },
    estimare: (x) => x.forme.A[0] ** 3 / 3,
    forma: 'A = L L^T',
    etape: [
      {
        linii: [3, 5],
        tex: 'l_{kk} = \\sqrt{a_{kk} - \\sum_{j=1}^{k-1} l_{kj}^2}',
        text: { ro: 'elementul diagonal; algoritmul continuă doar dacă α > 0', en: 'the diagonal entry; the algorithm goes on only when α > 0' },
      },
      {
        linii: [6, 7],
        tex: 'l_{ik} = \\Bigl(a_{ik} - \\sum_{j=1}^{k-1} l_{ij}\\, l_{kj}\\Bigr) / l_{kk}, \\quad i = k+1 : n',
        text: { ro: 'restul coloanei k a lui L', en: 'the rest of column k of L' },
      },
    ],
    practic: {
      ro: 'Cursul notează că face de două ori mai puține operații decât eliminarea gaussiană. Nu are nevoie de pivotare: cartea cursului arată că algoritmul este numeric stabil, mai bine decât eliminarea gaussiană cu pivotare completă. Factorizarea există dacă și numai dacă A este pozitiv definită, deci algoritmul este și un test de pozitiv definire. Teorema din curs spune și că L este unic când i se cer elementele diagonale pozitive, ceea ce radicalul asigură; de aceea numpy.linalg.cholesky întoarce același L. Se citește doar triunghiul inferior al lui A. Sistemul Ax = b se rezolvă apoi cu Ly = b și Lᵀx = y.',
      en: 'The course notes that it performs half as many operations as Gaussian elimination. It needs no pivoting: the book of the course shows that the algorithm is numerically stable, better than Gaussian elimination with complete pivoting. The factorization exists if and only if A is positive definite, so the algorithm is also a test for positive definiteness. The theorem of the course also says that L is unique once its diagonal entries are required to be positive, which the square root ensures; this is why numpy.linalg.cholesky returns the same L. Only the lower triangle of A is read. The system Ax = b is then solved with Ly = b and Lᵀx = y.',
    },
    iesiri: ['A'],
    numpy: ['print("np.linalg.cholesky(A) =", np.linalg.cholesky(A), sep="\\n")', dif('np.tril({A})', 'np.linalg.cholesky(A)')],
    sursa: `L peste A
pentru k = 1 : n
    α ← a_kk - Σ_{j=1}^{k-1} l_kj^2
    dacă α ≤ 0 atunci stop 'A nu este pozitiv definită'
    a_kk ← l_kk = √α
    pentru i = k+1 : n
        a_ik ← l_ik = (a_ik - Σ_{j=1}^{k-1} l_ij l_kj) / l_kk`,
    intrari: [{ nume: 'A', tip: 'matrice', exemplu: [[4, 2, 2], [2, 5, 3], [2, 3, 6]], descriere: { ro: 'n × n, simetrică și pozitiv definită', en: 'n × n, symmetric and positive definite' }, natura: 'spd' }],
  },
  {
    id: 'JACOBI',
    grup: 'iterative',
    notiuni: ['metode_iterative', 'jacobi', 'criteriu_oprire', 'conditionare', 'norma'],
    titlu: { ro: 'Jacobi', en: 'Jacobi' },
    descriere: {
      ro: 'Rezolvă Ax = b prin aproximări succesive. La fiecare trecere, ecuația i se rezolvă pentru x_i, cu celelalte necunoscute luate din trecerea precedentă. Valorile noi se strâng în y și îl înlocuiesc pe x abia la sfârșitul trecerii. Trecerile se repetă până când reziduul relativ ‖Ax − b‖ / ‖b‖ scade sub tol.',
      en: 'Solves Ax = b by successive approximations. In each sweep, equation i is solved for x_i, with the other unknowns taken from the previous sweep. The new values are collected in y and replace x only at the end of the sweep. The sweeps are repeated until the relative residual ‖Ax − b‖ / ‖b‖ drops below tol.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Metoda Jacobi". Slide-ul dă formula iterației și spune că se continuă până când norma ‖Ax − b‖ este mică; bucla, raportarea la ‖b‖ și numărul maxim de iterații sunt scrise aici, după modelul algoritmului MP. Exemplul este cel din slide și dă aceleași valori.',
      en: 'Course III, slide "Metoda Jacobi". The slide gives the iteration formula and says it continues until the norm ‖Ax − b‖ is small; the loop, the scaling by ‖b‖ and the maximum number of iterations are written here, after the model of algorithm MP. The example is the one on the slide and gives the same values.',
    },
    cost: { ro: '≈ 2n² flopi pe iterație, plus ≈ 2n² pentru reziduu', en: '≈ 2n² flops per iteration, plus ≈ 2n² for the residual' },
    // reziduul se calculeaza o data la pornire si o data dupa fiecare iteratie
    estimare: (x) => (4 * x.iteratii + 2) * x.forme.A[0] ** 2,
    forma: 'D\\, x^{(k+1)} = N x^{(k)} + b, \\qquad A = D - N, \\quad D = \\operatorname{diag}(a_{11}, \\dots, a_{nn})',
    etape: [
      { linii: [2, 2], tex: 'r = A x - b, \\qquad e = \\|r\\| / \\|b\\|', text: REZIDUU_PORNIRE },
      {
        linii: [5, 6],
        tex: 'y_i = \\Bigl(b_i - \\sum_{j \\ne i} a_{ij}\\, x_j\\Bigr) / a_{ii}',
        text: { ro: 'ecuația i rezolvată pentru x_i, cu celelalte necunoscute din trecerea precedentă', en: 'equation i solved for x_i, with the other unknowns from the previous sweep' },
      },
      {
        linii: [7, 7],
        tex: 'x \\leftarrow y',
        text: { ro: 'noua aproximare o înlocuiește pe cea veche abia după ce toate componentele au fost calculate', en: 'the new approximation replaces the old one only after all components have been computed' },
      },
      { linii: [8, 8], tex: 'r = A x - b, \\qquad e = \\|r\\| / \\|b\\|', text: TEST_OPRIRE },
    ],
    practic: {
      ro: 'Are nevoie de toate elementele diagonale nenule. Cursul dă două condiții de convergență: raza spectrală a matricei D⁻¹N să fie sub 1, sau A să fie strict diagonal dominantă (pe fiecare linie, |a_ii| mai mare decât suma modulelor celorlalte elemente); butonul "aleator" generează astfel de matrice. Reziduul nu scade neapărat la fiecare trecere: pe exemplul din curs, D⁻¹N = [0 −1/2; −5/7 0] are valorile proprii ±√(5/14) ≈ ±0.6, deci eroarea se înmulțește cu 5/14 abia din două în două treceri, iar graficul convergenței urcă și coboară. Cursul recomandă metodele directe pentru n < 500 și pe cele iterative pentru sisteme foarte mari. Un reziduu mic spune că Ax este aproape de b; cât de aproape este x de soluție depinde și de condiționarea lui A.',
      en: 'It needs all diagonal entries to be nonzero. The course gives two convergence conditions: the spectral radius of the matrix D⁻¹N is below 1, or A is strictly diagonally dominant (in every row, |a_ii| exceeds the sum of the absolute values of the other entries); the "random" button generates such matrices. The residual does not necessarily shrink at every sweep: on the course example, D⁻¹N = [0 −1/2; −5/7 0] has the eigenvalues ±√(5/14) ≈ ±0.6, so the error is multiplied by 5/14 only every two sweeps, and the convergence chart goes up and down. The course recommends direct methods for n < 500 and iterative ones for very large systems. A small residual says that Ax is close to b; how close x is to the solution also depends on the conditioning of A.',
    },
    iesiri: ['x', 'k'],
    numpy: fataDeSolve('A', '{x}'),
    direct: GPP_DIRECT,
    ecuatie: { A: 'A', x: 'x', b: 'b', linie: 'i' },
    sursa: `fie y[n]
r ← A x - b; e ← ‖r‖ / ‖b‖; k ← 0
cât timp e > tol    % bucla nu este pe slide
    dacă k ≥ maxiter atunci stop 'nu a convers în maxiter iterații'
    pentru i = 1 : n
        y_i ← (b_i - Σ_{j=1}^{i-1} a_ij x_j - Σ_{j=i+1}^{n} a_ij x_j) / a_ii
    x ← y
    r ← A x - b; e ← ‖r‖ / ‖b‖; k ← k + 1`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[2, 1], [5, 7]], descriere: { ro: 'n × n, cu diagonala nenulă', en: 'n × n, with a nonzero diagonal' }, natura: 'diagonalaNenula', aleator: 'dominanta', garantie: 'dominanta' },
      { nume: 'b', tip: 'vector', exemplu: [11, 13], descriere: { ro: 'lungime n, nenul', en: 'length n, nonzero' }, natura: 'nenul', dimensiune: ['A', 'linii'] },
      { nume: 'x', tip: 'vector', exemplu: [1, 1], descriere: PORNIRE, dimensiune: ['A', 'coloane'] },
      { nume: 'tol', tip: 'scalar', exemplu: 1e-3, descriere: TOLERANTA, natura: 'toleranta' },
      { nume: 'maxiter', tip: 'scalar', exemplu: 100, descriere: MAXITER, natura: 'iteratii' },
    ],
  },
  {
    id: 'GS',
    grup: 'iterative',
    notiuni: ['metode_iterative', 'gauss_seidel', 'criteriu_oprire', 'conditionare', 'norma'],
    titlu: { ro: 'Gauss-Seidel', en: 'Gauss-Seidel' },
    descriere: {
      ro: 'Ca metoda Jacobi, dar fiecare componentă nouă se folosește imediat: la ecuația i, necunoscutele x_1, ..., x_(i-1) au deja valorile din trecerea curentă. De aceea x se actualizează pe loc, fără un al doilea vector.',
      en: 'Like the Jacobi method, but every new component is used at once: in equation i, the unknowns x_1, ..., x_(i-1) already hold the values of the current sweep. This is why x is updated in place, without a second vector.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Metoda Gauss-Seidel". Slide-ul dă formula iterației; bucla și testul de oprire sunt scrise aici ca la Jacobi. Exemplul este cel din slide, unde valorile apar cu două zecimale.',
      en: 'Course III, slide "Metoda Gauss-Seidel". The slide gives the iteration formula; the loop and the stopping test are written here as for Jacobi. The example is the one on the slide, where the values appear with two decimals.',
    },
    cost: { ro: '≈ 2n² flopi pe iterație, plus ≈ 2n² pentru reziduu', en: '≈ 2n² flops per iteration, plus ≈ 2n² for the residual' },
    // reziduul se calculeaza o data la pornire si o data dupa fiecare iteratie
    estimare: (x) => (4 * x.iteratii + 2) * x.forme.A[0] ** 2,
    forma: 'L\\, x^{(k+1)} = U x^{(k)} + b, \\qquad A = L - U',
    etape: [
      { linii: [1, 1], tex: 'r = A x - b, \\qquad e = \\|r\\| / \\|b\\|', text: REZIDUU_PORNIRE },
      {
        linii: [4, 5],
        tex: 'x_i^{(k+1)} = \\Bigl(b_i - \\sum_{j=1}^{i-1} a_{ij}\\, x_j^{(k+1)} - \\sum_{j=i+1}^{n} a_{ij}\\, x_j^{(k)}\\Bigr) / a_{ii}',
        text: {
          ro: 'ecuația i rezolvată pentru x_i; în forma matriceală, L este triunghiul inferior al lui A cu tot cu diagonală, iar U este minus partea de deasupra diagonalei',
          en: 'equation i solved for x_i; in the matrix form, L is the lower triangle of A including the diagonal and U is minus the part above the diagonal',
        },
      },
      { linii: [6, 6], tex: 'r = A x - b, \\qquad e = \\|r\\| / \\|b\\|', text: TEST_OPRIRE },
    ],
    practic: {
      ro: 'Are nevoie de toate elementele diagonale nenule. Cursul dă trei condiții de convergență: raza spectrală a matricei L⁻¹U să fie sub 1, A să fie pozitiv definită, sau A să fie strict diagonal dominantă; butonul "aleator" generează matrice strict diagonal dominante. În aplicația din curs, un sistem 10 x 10 cu multe zerouri, Gauss-Seidel pornit din zero ajunge la soluție în 18 iterații, iar slide-ul notează că, datorită zerourilor din A, este mai avantajoasă decât GPP.',
      en: 'It needs all diagonal entries to be nonzero. The course gives three convergence conditions: the spectral radius of the matrix L⁻¹U is below 1, A is positive definite, or A is strictly diagonally dominant; the "random" button generates strictly diagonally dominant matrices. In the application of the course, a 10 x 10 system with many zeros, Gauss-Seidel started from zero reaches the solution in 18 iterations, and the slide notes that, owing to the zeros in A, it is more advantageous than GPP.',
    },
    iesiri: ['x', 'k'],
    numpy: fataDeSolve('A', '{x}'),
    direct: GPP_DIRECT,
    ecuatie: { A: 'A', x: 'x', b: 'b', linie: 'i' },
    sursa: `r ← A x - b; e ← ‖r‖ / ‖b‖; k ← 0
cât timp e > tol    % bucla nu este pe slide
    dacă k ≥ maxiter atunci stop 'nu a convers în maxiter iterații'
    pentru i = 1 : n
        x_i ← (b_i - Σ_{j=1}^{i-1} a_ij x_j - Σ_{j=i+1}^{n} a_ij x_j) / a_ii
    r ← A x - b; e ← ‖r‖ / ‖b‖; k ← k + 1`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[16, 3], [7, -11]], descriere: { ro: 'n × n, cu diagonala nenulă', en: 'n × n, with a nonzero diagonal' }, natura: 'diagonalaNenula', aleator: 'dominanta', garantie: 'dominantaSauSpd' },
      { nume: 'b', tip: 'vector', exemplu: [11, 13], descriere: { ro: 'lungime n, nenul', en: 'length n, nonzero' }, natura: 'nenul', dimensiune: ['A', 'linii'] },
      { nume: 'x', tip: 'vector', exemplu: [1, 1], descriere: PORNIRE, dimensiune: ['A', 'coloane'] },
      { nume: 'tol', tip: 'scalar', exemplu: 1e-6, descriere: TOLERANTA, natura: 'toleranta' },
      { nume: 'maxiter', tip: 'scalar', exemplu: 100, descriere: MAXITER, natura: 'iteratii' },
    ],
  },
  {
    id: 'KACZMARZ',
    grup: 'iterative',
    notiuni: ['metode_iterative', 'kaczmarz', 'criteriu_oprire', 'produs_scalar', 'norma'],
    titlu: { ro: 'Kaczmarz', en: 'Kaczmarz' },
    descriere: {
      ro: 'Rezolvă Ax = b luând ecuațiile pe rând. Pasul pentru ecuația i mută x exact atât cât trebuie ca ea să fie satisfăcută: x ← x − α a_i, unde a_i este linia i a lui A, iar α = (a_iᵀx − b_i) / ‖a_i‖². Aici liniile se iau ciclic, iar reziduul se verifică după fiecare trecere prin toate.',
      en: 'Solves Ax = b by taking the equations one at a time. The step for equation i moves x exactly as far as needed for it to hold: x ← x − α a_i, where a_i is row i of A and α = (a_iᵀx − b_i) / ‖a_i‖². Here the rows are taken cyclically, and the residual is checked after each pass through all of them.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Metoda Kaczmarz". Slide-ul dă formula actualizării, spune că linia se alege ciclic sau aleator și dă o margine de convergență; bucla și testul de oprire sunt scrise aici ca la Jacobi. Exemplul este ales pentru vizualizator.',
      en: 'Course III, slide "Metoda Kaczmarz". The slide gives the update formula, says the row is chosen cyclically or at random and gives a convergence bound; the loop and the stopping test are written here as for Jacobi. The example is chosen for the visualizer.',
    },
    cost: {
      ro: '≈ 6n flopi pe linie (4n dacă normele liniilor se calculează o singură dată), plus ≈ 2mn pentru reziduu',
      en: '≈ 6n flops per row (4n when the row norms are computed once), plus ≈ 2mn for the residual',
    },
    estimare: (x) => (8 * x.iteratii + 2) * x.forme.A[0] * x.forme.A[1],
    forma: 'x^{(k+1)} = x^{(k)} - \\dfrac{a_i^T x^{(k)} - b_i}{\\|a_i\\|^2}\\, a_i, \\qquad a_i^T = A(i, :)',
    etape: [
      { linii: [1, 1], tex: 'r = A x - b, \\qquad e = \\|r\\| / \\|b\\|', text: REZIDUU_PORNIRE },
      {
        linii: [5, 5],
        tex: '\\alpha = \\dfrac{A(i, :)\\, x - b_i}{\\|A(i, :)\\|^2}',
        text: { ro: 'cu cât greșește x ecuația i, împărțit la pătratul normei liniei', en: 'by how much x misses equation i, divided by the squared norm of the row' },
      },
      {
        linii: [6, 6],
        tex: 'x \\leftarrow x - \\alpha\\, A(i, :)^T',
        text: { ro: 'x se mută de-a lungul liniei i; după acest pas ecuația i este satisfăcută exact', en: 'x moves along row i; after this step equation i holds exactly' },
      },
      { linii: [7, 7], tex: 'r = A x - b, \\qquad e = \\|r\\| / \\|b\\|', text: TEST_OPRIRE },
    ],
    practic: {
      ro: 'Un pas folosește o singură linie a lui A și costă O(n) operații; cursul o numește una dintre cele mai eficiente metode pentru date foarte mari și notează că nu cere condiții asupra matricei, spre deosebire de Jacobi și Gauss-Seidel. Slide-ul dă convergența liniară ‖x^k − x*‖² ≤ (1 − λ_min(AᵀA)/‖A‖_F²)^k ‖x⁰ − x*‖², în care k numără actualizările pe câte o linie, nu trecerile prin toate liniile numărate aici. Un singur pas nu micșorează întotdeauna eroarea: din formula actualizării, ‖x_nou − x*‖² = ‖x − x*‖² − (a_iᵀ(x − x*))²/‖a_i‖², deci un pas pe o linie perpendiculară pe x − x* o lasă neschimbată. Sistemul trebuie să aibă soluție, altfel reziduul nu poate ajunge la zero, iar nicio linie nu poate fi nulă, pentru că se împarte la norma ei. Marginea are sens doar când λ_min(AᵀA) > 0, adică A are coloanele liniar independente (deci m ≥ n). Pentru m < n sistemul are o infinitate de soluții; cursul (slide-ul "Compressed sensing") spune că și atunci se poate folosi Kaczmarz pentru soluția CMMP de normă minimă: pornit din x⁰ = 0, fiecare pas adună un multiplu al unei linii, deci x rămâne în spațiul liniilor lui A, unde soluția este unică și de normă minimă.',
      en: 'One step uses a single row of A and costs O(n) operations; the course calls it one of the most efficient methods for very large data and notes that it asks for no conditions on the matrix, unlike Jacobi and Gauss-Seidel. The slide gives the linear convergence ‖x^k − x*‖² ≤ (1 − λ_min(AᵀA)/‖A‖_F²)^k ‖x⁰ − x*‖², where k counts updates on one row each, not the passes through all rows counted here. A single step does not always reduce the error: from the update formula, ‖x_new − x*‖² = ‖x − x*‖² − (a_iᵀ(x − x*))²/‖a_i‖², so a step on a row perpendicular to x − x* leaves it unchanged. The system must have a solution, otherwise the residual cannot reach zero, and no row can be zero, because the step divides by its norm. The bound makes sense only when λ_min(AᵀA) > 0, that is when A has linearly independent columns (so m ≥ n). For m < n the system has infinitely many solutions; the course (slide "Compressed sensing") says Kaczmarz can still be used for the least-squares solution of minimal norm: started from x⁰ = 0, every step adds a multiple of a row, so x stays in the row space of A, where the solution is unique and of minimal norm.',
    },
    iesiri: ['x', 'k'],
    numpy: [
      'print("norma reziduului:", np.linalg.norm(A @ {x} - b))',
      '# solutia e unica doar pentru o matrice patrata nesingulara',
      'if A.shape[0] == A.shape[1]:',
      ...fataDeSolve('A', '{x}').map((l) => `    ${l}`),
    ],
    ecuatie: { A: 'A', x: 'x', b: 'b', linie: 'i' },
    sursa: `r ← A x - b; e ← ‖r‖ / ‖b‖; k ← 0
cât timp e > tol    % bucla nu este pe slide
    dacă k ≥ maxiter atunci stop 'nu a convers în maxiter treceri'
    pentru i = 1 : m
        α ← (A(i, :) x - b_i) / ‖A(i, :)‖^2
        x ← x - α A(i, :)^T
    r ← A x - b; e ← ‖r‖ / ‖b‖; k ← k + 1`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[2, 1], [1, 3]], descriere: { ro: 'm × n, fără linii nule', en: 'm × n, with no zero rows' }, natura: 'liniiNenule', aleator: 'liniiDominante' },
      { nume: 'b', tip: 'vector', exemplu: [5, 10], descriere: { ro: 'lungime m, nenul, pentru care Ax = b are soluție', en: 'length m, nonzero, for which Ax = b has a solution' }, natura: 'compatibil', cu: 'A', dimensiune: ['A', 'linii'] },
      { nume: 'x', tip: 'vector', exemplu: [0, 0], descriere: PORNIRE, dimensiune: ['A', 'coloane'] },
      { nume: 'tol', tip: 'scalar', exemplu: 1e-3, descriere: TOLERANTA, natura: 'toleranta' },
      { nume: 'maxiter', tip: 'scalar', exemplu: 100, descriere: { ro: 'numărul maxim de treceri prin toate liniile', en: 'maximum number of passes through all rows' }, natura: 'iteratii' },
    ],
  },
  {
    id: 'RFG',
    grup: 'ortogonal',
    notiuni: ['ortogonala', 'norma', 'reflector'],
    titlu: { ro: 'RFG, reflector Householder pentru un vector', en: 'RFG, Householder reflector for a vector' },
    descriere: {
      ro: 'Construiește reflectorul Householder U_k care anulează componentele k+1, ..., m ale unui vector x: U_k x are −σ pe poziția k și zerouri sub ea, unde |σ| este norma lui x(k : m). Vectorul Householder u se scalează ca în curs (u_i = x_i/σ, u_k = 1 + x_k/σ); partea lui de sub poziția k se scrie peste x, în locul zerourilor, iar β = u_k se păstrează separat.',
      en: 'Builds the Householder reflector U_k that annihilates components k+1, ..., m of a vector x: U_k x has −σ in position k and zeros below it, where |σ| is the norm of x(k : m). The Householder vector u is scaled as in the course (u_i = x_i/σ, u_k = 1 + x_k/σ); its part below position k overwrites x, in place of the zeros, and β = u_k is kept separately.',
    },
    curs: {
      ro: 'Curs IV, slide-ul "Transformari ortogonale - reflectori", algoritmul RFG. Linia β ← 0 nu este pe slide; este convenția cărții cursului pentru cazul în care nu este nimic de anulat (reflectorul este atunci I, semnalat prin β = 0). Exemplul este prima coloană a matricei din exemplul de triangularizare ortogonală și dă valorile de acolo: σ = 3, u = (5/3, −1/3, 2/3), β = 5/3. Vederea geometrică apare pentru un vector de lungime 2 cu k = 1; exemplul are lungimea 3.',
      en: 'Course IV, slide "Transformari ortogonale - reflectori", algorithm RFG. The line β ← 0 is not on the slide; it is the convention of the book of the course for the case when there is nothing to annihilate (the reflector is then I, signalled by β = 0). The example is the first column of the matrix in the orthogonal triangularization example and gives the values found there: σ = 3, u = (5/3, −1/3, 2/3), β = 5/3. The geometric view appears for a vector of length 2 with k = 1; the example has length 3.',
    },
    cost: { ro: '≈ 3(m − k + 1) flopi și un radical, numărați pe pseudocod', en: '≈ 3(m − k + 1) flops and one square root, counted on the pseudocode' },
    estimare: (x) => 3 * (x.forme.x[0] - x.scalari.k + 1),
    forma: 'U_k = I_m - \\dfrac{u u^T}{\\beta}, \\qquad U_k x = (x_1, \\dots, x_{k-1}, -\\sigma, 0, \\dots, 0)^T',
    etape: [
      {
        linii: [4, 6],
        tex: '\\sigma = \\operatorname{sgn}(x_k)\\, \\|x(k\\!:\\!m)\\|',
        text: { ro: 'norma părții care se transformă, cu semnul lui x_k', en: 'the norm of the part being transformed, with the sign of x_k' },
      },
      {
        linii: [7, 8],
        tex: 'u_i = x_i / \\sigma \\;\\; (i > k), \\qquad u_k = 1 + x_k / \\sigma = \\beta',
        text: { ro: 'vectorul Householder scalat; β este componenta lui de pe poziția k', en: 'the scaled Householder vector; β is its component in position k' },
      },
      {
        linii: [9, 9],
        tex: '(U_k x)_k = -\\sigma',
        text: { ro: 'rezultatul transformării pe poziția k; sub ea ar fi zerouri, dar acolo se păstrează u', en: 'the result of the transformation in position k; below it there would be zeros, but u is kept there' },
      },
    ],
    practic: {
      ro: 'Este pasul de bază al triangularizării ortogonale (Algoritmul QR). Slide-ul motivează scalarea prin stabilitatea numerică și prin faptul că u contează doar ca direcție; după scalare β = u_k, deci pe lângă vector se memorează un singur număr. Semnul lui σ este cel al lui x_k, ca u_k = 1 + |x_k|/‖x(k : m)‖ să fie între 1 și 2, fără scăderi de numere apropiate; cartea cursului (pagina 129) numește alegerea esențială pentru stabilitate. Tot cartea cere sgn(0) = 1: cu convenția sgn(0) = 0 a multor limbaje, pentru x_k = 0 ar ieși σ = 0, reflectorul ar fi sărit și componentele de sub poziția k ar rămâne neanulate. Reflectorul nu se formează ca matrice: pe un vector y se aplică prin y ← y − ν u, cu ν = uᵀy / β.',
      en: 'It is the basic step of orthogonal triangularization (Algorithm QR). The slide motivates the scaling by numerical stability and by the fact that u matters only as a direction; after scaling β = u_k, so a single number is stored besides the vector. The sign of σ is that of x_k, so that u_k = 1 + |x_k|/‖x(k : m)‖ lies between 1 and 2, with no subtraction of close numbers; the book of the course (page 129) calls this choice essential for stability. The book also requires sgn(0) = 1: with the convention sgn(0) = 0 of many languages, x_k = 0 would give σ = 0, the reflector would be skipped and the components below position k would stay unannihilated. The reflector is not formed as a matrix: it is applied to a vector y by y ← y − ν u, with ν = uᵀy / β.',
    },
    iesiri: ['x', 'β'],
    numpy: [
      '# U_k x are pe pozitia k norma lui x(k:m), cu semn schimbat',
      'print("np.linalg.norm(x[k - 1:]) =", np.linalg.norm(x[k - 1:]))',
      dif('abs({x}[k - 1])', 'np.linalg.norm(x[k - 1:])'),
    ],
    sursa: `m ← lungime(x)
β ← 0    % nu este pe slide
dacă k < m atunci
    σ ← ‖x(k:m)‖
    dacă σ ≠ 0 atunci
        σ ← sgn(x_k) σ
        x_i ← u_i = x_i / σ, i = k : m
        β ← u_k = 1 + x_k
        x_k ← -σ`,
    intrari: [
      { nume: 'x', tip: 'vector', exemplu: [2, -1, 2], descriere: { ro: 'lungime m', en: 'length m' } },
      { nume: 'k', tip: 'scalar', exemplu: 1, descriere: { ro: 'indicele reflectorului, un întreg între 1 și m', en: 'the index of the reflector, an integer between 1 and m' }, natura: 'indice', cu: 'x' },
    ],
  },
  {
    id: 'QR',
    grup: 'ortogonal',
    notiuni: ['ortogonala', 'norma', 'reflector', 'qr'],
    titlu: { ro: 'QR, triangularizare ortogonală', en: 'QR, orthogonal triangularization' },
    descriere: {
      ro: 'Aduce A la forma superior triunghiulară R prin înmulțiri cu reflectori Householder: U_s ··· U_1 A = R, deci A = QR cu Q = U_1 ··· U_s ortogonală. La pasul k se construiește reflectorul care anulează coloana k sub diagonală, ca în RFG, și se aplică pe coloanele rămase. R se scrie peste triunghiul superior al lui A, partea de sub diagonală a vectorului u_k în locul zerourilor, iar β_k = u_kk într-un vector separat.',
      en: 'Brings A to upper triangular form R by multiplications with Householder reflectors: U_s ··· U_1 A = R, so A = QR with Q = U_1 ··· U_s orthogonal. At step k it builds the reflector that annihilates column k below the diagonal, as in RFG, and applies it to the remaining columns. R overwrites the upper triangle of A, the part of the vector u_k below the diagonal takes the place of the zeros, and β_k = u_kk goes into a separate vector.',
    },
    curs: {
      ro: 'Curs IV, slide-ul "Triangularizare ortogonala", Algoritmul QR. O singură linie este în plus, a_kk ← u_kk = β_k: slide-ul ține u_kk doar în β_k ("se tine seama ca u_kk = β_k"), iar aici se scrie și în A până la sfârșitul pasului, ca sumele pe i = k : m să citească u direct din A, cum face Algoritmul SQR. Exemplul este cel din slide-uri și dă aceleași valori: u_1 = (5/3, −1/3, 2/3), β_1 = 5/3, R cu diagonala (−3, −√10).',
      en: 'Course IV, slide "Triangularizare ortogonala", Algorithm QR. A single line is added, a_kk ← u_kk = β_k: the slide keeps u_kk only in β_k ("se tine seama ca u_kk = β_k"), while here it is also written into A until the end of the step, so that the sums over i = k : m read u straight from A, as Algorithm SQR does. The example is the one in the slides and gives the same values: u_1 = (5/3, −1/3, 2/3), β_1 = 5/3, R with diagonal (−3, −√10).',
    },
    cost: { ro: '≈ 2(mn² − n³/3) flopi, pentru m ≥ n', en: '≈ 2(mn² − n³/3) flops, for m ≥ n' },
    estimare: triangularizare,
    forma: 'U_s \\cdots U_2 U_1 A = R, \\qquad U_k = I_m - \\dfrac{u_k u_k^T}{\\beta_k}, \\qquad s = \\min(m-1, n)',
    etape: ETAPE_QR,
    practic: {
      ro: 'Reflectorii sunt matrice ortogonale, deci păstrează norma coloanelor (cursul: ‖Ux‖ = ‖x‖); nu este nevoie de pivotare, iar cartea cursului arată că algoritmul este numeric stabil. Pentru o matrice pătrată costul este ≈ 4n³/3, dublu față de eliminarea gaussiană, de aceea cursul preferă eliminarea gaussiană în cazul pătrat; pentru problema celor mai mici pătrate cursul pornește de la ieșirea lui QR (Algoritmul SQR). Matricea Q nu se formează: se păstrează vectorii u_k și scalarii β_k, iar Qᵀb se calculează aplicând reflectorii pe rând. numpy.linalg.qr dă aceeași factorizare, cu liniile lui R eventual de semn opus.',
      en: 'Reflectors are orthogonal matrices, so they preserve the norm of the columns (the course: ‖Ux‖ = ‖x‖); no pivoting is needed, and the book of the course shows that the algorithm is numerically stable. For a square matrix the cost is ≈ 4n³/3, twice that of Gaussian elimination, which is why the course prefers Gaussian elimination in the square case; for the least squares problem the course starts from the output of QR (Algorithm SQR). The matrix Q is not formed: the vectors u_k and the scalars β_k are kept, and Qᵀb is computed by applying the reflectors in turn. numpy.linalg.qr gives the same factorization, with the rows of R possibly of opposite sign.',
    },
    iesiri: ['A', 'β'],
    numpy: [
      '# R din rezultat fata de cel din np.linalg.qr; liniile pot avea semn opus',
      'R = np.triu({A})[: min(A.shape)]',
      'print("np.linalg.qr(A)[1] =", np.linalg.qr(A)[1], sep="\\n")',
      dif('np.abs(R)', 'np.abs(np.linalg.qr(A)[1])'),
    ],
    sursa: SURSA_QR,
    intrari: [{ nume: 'A', tip: 'matrice', exemplu: [[2, 3], [-1, 1], [2, -1]], descriere: { ro: 'm × n', en: 'm × n' } }],
  },
  {
    id: 'SQR',
    grup: 'ortogonal',
    notiuni: ['qr', 'cmmp', 'reflector', 'substitutie', 'conditionare'],
    titlu: { ro: 'SQR, cele mai mici pătrate (CMMP)', en: 'SQR, least squares (CMMP)' },
    descriere: {
      ro: 'Pentru un sistem cu mai multe ecuații decât necunoscute (m > n), găsește x care face reziduul ‖b − Ax‖ cât mai mic. Întâi triangularizează A cu Algoritmul QR, apoi aplică aceiași reflectori pe b (d = Qᵀb) și rezolvă sistemul superior triunghiular format din primele n linii. Norma părții rămase din d, r = ‖d(n+1 : m)‖, este reziduul minim.',
      en: 'For a system with more equations than unknowns (m > n), finds the x that makes the residual ‖b − Ax‖ as small as possible. It first triangularizes A with Algorithm QR, then applies the same reflectors to b (d = Qᵀb) and solves the upper triangular system formed by the first n rows. The norm of the remaining part of d, r = ‖d(n+1 : m)‖, is the minimal residual.',
    },
    curs: {
      ro: 'Curs IV, slide-ul "Calculul solutiei CMMP: m > n", Algoritmul SQR, care pornește de la ieșirea Algoritmului QR; aici cele două sunt scrise unul după altul. Pe slide prima linie din buclă apare ca "t = a_kk = 0"; aici este t ← a_kk, valoarea pe care ultima linie o pune la loc. Linia cu r nu este în algoritm: vine din slide-ul de dinainte, unde reziduul minim este ‖d"‖. Exemplul este cel din slide: aici iese x = (2/3, 0) până la rotunjiri, iar slide-ul obține (0.65, 0.003) pentru că lucrează cu Qᵀ scris cu două zecimale. Slide-ul pornește de la ieșirea lui QR cu m ≥ n; aici se cere m > n, pentru că la m = n Algoritmul QR calculează doar s = n − 1 reflectori, iar bucla lui SQR ar citi β_n, care nu există. Panoul "Ce rămâne adevărat" urmărește doar prima buclă, triangularizarea.',
      en: 'Course IV, slide "Calculul solutiei CMMP: m > n", Algorithm SQR, which starts from the output of Algorithm QR; here the two are written one after the other. On the slide the first line of the loop appears as "t = a_kk = 0"; here it is t ← a_kk, the value the last line puts back. The line with r is not in the algorithm: it comes from the preceding slide, where the minimal residual is ‖d"‖. The example is the one on the slide: here x = (2/3, 0) up to rounding, and the slide gets (0.65, 0.003) because it works with Qᵀ written with two decimals. The slide starts from the output of QR with m ≥ n; here m > n is required, because for m = n Algorithm QR computes only s = n − 1 reflectors, and the loop of SQR would read β_n, which does not exist. The panel "What stays true" follows only the first loop, the triangularization.',
    },
    cost: { ro: '≈ 2(mn² − n³/3) flopi pentru triangularizare, plus ≈ 4mn − n² pentru b și substituție, numărați pe pseudocod', en: '≈ 2(mn² − n³/3) flops for the triangularization, plus ≈ 4mn − n² for b and the substitution, counted on the pseudocode' },
    // n reflectori aplicati pe b, cate ≈ 4(m − k + 1) flopi, si substitutia inapoi, n²
    estimare: (x) => triangularizare(x) + 4 * x.forme.A[0] * x.forme.A[1] - x.forme.A[1] ** 2,
    forma: '\\min_x \\|b - Ax\\|: \\qquad Q^T A = \\begin{bmatrix} R\' \\\\ 0 \\end{bmatrix}, \\qquad Q^T b = \\begin{bmatrix} d\' \\\\ d\'\' \\end{bmatrix}, \\qquad R\' x = d\'',
    etape: [
      ...ETAPE_QR,
      {
        linii: [15, 20],
        tex: 'b \\leftarrow U_k\\, b, \\quad k = 1 : n \\qquad (d = Q^T b)',
        text: {
          ro: 'reflectorii se aplică, în aceeași ordine, și termenului liber; cât se lucrează cu u_k, în a_kk stă u_kk = β_k, apoi elementul lui R se pune la loc',
          en: 'the reflectors are applied, in the same order, to the right-hand side as well; while u_k is in use, a_kk holds u_kk = β_k, then the entry of R is put back',
        },
      },
      {
        linii: [21, 23],
        tex: 'R\' x = d\', \\qquad d\' = d(1\\!:\\!n)',
        text: { ro: 'sistemul superior triunghiular se rezolvă prin substituție înapoi', en: 'the upper triangular system is solved by back substitution' },
      },
      {
        linii: [24, 24],
        tex: 'r = \\|d\'\'\\| = \\min_x \\|b - Ax\\|, \\qquad d\'\' = d(n+1\\!:\\!m)',
        text: { ro: 'partea lui d pe care niciun x nu o poate anula este reziduul minim', en: 'the part of d that no x can cancel is the minimal residual' },
      },
    ],
    practic: {
      ro: 'Teorema din curs: soluția este unică exact când A are coloanele liniar independente (A este monică), și atunci R′ din factorizarea QR este inversabilă (slide-ul "Factorizarea QR: m ≥ n"), deci împărțirile la a_kk din substituție sunt sigure. Regula de aur din curs: nu se formează AᵀA, care este rău condiționată; se lucrează direct pe A, cu reflectori. Tot cursul notează că, pentru A monică, sensibilitatea soluției poate crește cu pătratul numărului de condiționare. numpy.linalg.lstsq(A, b, rcond=None) rezolvă aceeași problemă și întoarce, pe lângă x, suma pătratelor reziduurilor, adică r².',
      en: 'The theorem of the course: the solution is unique exactly when A has linearly independent columns (A is monic), and then R′ of the QR factorization is invertible (slide "Factorizarea QR: m ≥ n"), so the divisions by a_kk in the substitution are safe. The golden rule of the course: AᵀA, which is ill conditioned, is not formed; one works directly on A, with reflectors. The course also notes that, for such A, the sensitivity of the solution can grow with the square of the condition number. numpy.linalg.lstsq(A, b, rcond=None) solves the same problem and returns, besides x, the sum of squared residuals, that is r².',
    },
    iesiri: ['x', 'r'],
    numpy: [
      'x_np = np.linalg.lstsq(A, b, rcond=None)[0]',
      'print("np.linalg.lstsq =", x_np)',
      dif('{x}', 'x_np'),
      'print("np.linalg.norm(b - A @ x_np) =", np.linalg.norm(b - A @ x_np))',
    ],
    faze: [
      {
        linii: [1, 14],
        tex: 'Q^T A = R',
        text: { ro: 'triangularizarea ortogonală: reflectorii U_1, …, U_n aduc A la forma superior triunghiulară (Algoritmul QR)', en: 'the orthogonal triangularization: the reflectors U_1, …, U_n bring A to upper triangular form (Algorithm QR)' },
      },
      {
        linii: [15, 20],
        tex: 'd = Q^T b',
        text: { ro: 'aceiași reflectori, aplicați în aceeași ordine termenului liber b', en: 'the same reflectors, applied in the same order to the right-hand side b' },
      },
      {
        linii: [21, 24],
        tex: "R' x = d'",
        text: { ro: 'sistemul superior triunghiular din primele n linii, prin substituție înapoi; norma restului lui d este reziduul minim', en: 'the upper triangular system of the first n rows, by back substitution; the norm of the rest of d is the minimal residual' },
      },
    ],
    sursa: `${SURSA_QR}
pentru k = 1 : n
    t ← a_kk    % pe slide: "t = a_kk = 0"
    a_kk ← u_kk = β_k
    ν ← (Σ_{i=k}^{m} u_ik b_i) / β_k
    b_i ← b_i - ν u_ik, i = k : m
    a_kk ← t
fie x[n]
pentru k = n : -1 : 1
    x_k ← (b_k - Σ_{j=k+1}^{n} a_kj x_j) / a_kk
r ← ‖b(n+1:m)‖    % din slide-ul de dinainte`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[2, 3], [-1, 1], [2, -1]], descriere: { ro: 'm × n, cu m > n și coloane liniar independente', en: 'm × n, with m > n and linearly independent columns' }, natura: 'coloaneIndependente' },
      { nume: 'b', tip: 'vector', exemplu: [1, 2, 3], descriere: { ro: 'lungime m', en: 'length m' }, dimensiune: ['A', 'linii'] },
    ],
  },
  {
    id: 'MP',
    grup: 'proprii',
    notiuni: ['valoare_proprie', 'norma', 'produs_scalar', 'metoda_puterii', 'criteriu_oprire'],
    titlu: { ro: 'MP, metoda puterii', en: 'MP, power method' },
    descriere: {
      ro: 'Găsește un vector propriu al valorii proprii dominante, cea cu modulul cel mai mare. Vectorul y se înmulțește repetat cu A și se normează, y ← Ay / ‖Ay‖, iar direcția lui se apropie de cea a vectorului propriu. Iterația se oprește când doi vectori consecutivi au practic aceeași direcție: e = |1 − |zᵀy|| scade sub tol.',
      en: 'Finds an eigenvector of the dominant eigenvalue, the one with the largest absolute value. The vector y is repeatedly multiplied by A and normalized, y ← Ay / ‖Ay‖, and its direction approaches that of the eigenvector. The iteration stops when two consecutive vectors have practically the same direction: e = |1 − |zᵀy|| drops below tol.',
    },
    curs: {
      ro: 'Curs V, slide-ul "Metoda puterii", Algoritm MP, rând cu rând. Pe slide y se alege aleator; aici este o intrare, ca rularea să se poată repeta. Slide-ul scrie "tol > 1"; cum e pornește de la 1, bucla nu s-ar executa niciodată, deci toleranța trebuie să fie sub 1. Testul i > maxiter, luat de pe slide, lasă să treacă maxiter + 1 iterații. Exemplul este matricea companion de pe slide-ul "Exemple numerice MP/MPI", cu y⁰ = e₁ și toleranța 10⁻¹⁵ ca acolo: valorile proprii sunt 3, −1 ± i și 1, raportul |λ₂/λ₁| = √2/3 ≈ 0.47, iar metoda ajunge sub toleranță după 23 de iterații, ca în graficul de pe slide; pentru imaginea din planul vectorilor se poate reveni la ordinul 2.',
      en: 'Course V, slide "Metoda puterii", Algorithm MP, line by line. On the slide y is chosen at random; here it is an input, so that the run can be repeated. The slide writes "tol > 1"; since e starts from 1, the loop would never run, so the tolerance has to be below 1. The test i > maxiter, taken from the slide, lets maxiter + 1 iterations through. The example is the companion matrix on the slide "Exemple numerice MP/MPI", with y⁰ = e₁ and the tolerance 10⁻¹⁵ as there: the eigenvalues are 3, −1 ± i and 1, the ratio |λ₂/λ₁| = √2/3 ≈ 0.47, and the method gets below the tolerance after 23 iterations, as in the chart on the slide; for the picture in the plane of the vectors one can go back to order 2.',
    },
    cost: { ro: '≈ 2n² flopi pe iterație', en: '≈ 2n² flops per iteration' },
    estimare: (x) => 2 * x.iteratii * x.forme.A[0] ** 2,
    forma: 'y^{(k)} = \\dfrac{A\\, y^{(k-1)}}{\\|A\\, y^{(k-1)}\\|}, \\qquad e_k = \\left|1 - |(y^{(k)})^T y^{(k-1)}|\\right|',
    etape: [
      { linii: [1, 1], tex: 'y \\leftarrow y / \\|y\\|', text: { ro: 'vectorul de pornire se normează', en: 'the starting vector is normalized' } },
      {
        linii: [4, 5],
        tex: 'z = \\dfrac{A y}{\\|A y\\|}',
        text: { ro: 'o iterație: un produs matrice-vector și o normare', en: 'one iteration: a matrix-vector product and a normalization' },
      },
      {
        linii: [6, 6],
        tex: 'e = \\bigl|1 - |z^T y|\\bigr|',
        text: {
          ro: 'z și y au norma 1, deci zᵀy este cosinusul unghiului dintre ei; e arată cât s-a mai schimbat direcția',
          en: 'z and y have norm 1, so zᵀy is the cosine of the angle between them; e shows how much the direction still changed',
        },
      },
    ],
    practic: {
      ro: 'Ipotezele din curs (slide-ul "Metoda puterii"): A are o valoare proprie dominantă, |λ₁| > |λ₂| ≥ ... ≥ |λₙ|; vectorii proprii x₁, ..., xₙ formează o bază, deci y⁰ = Σ γᵢxᵢ; iar vectorul de pornire are γ₁ ≠ 0, adică o componentă nenulă pe direcția vectorului propriu dominant (un vector aleator o are, generic). Viteza de convergență este dată de raportul |λ₂/λ₁|: cu cât este mai mic, cu atât metoda este mai rapidă; fără valoare proprie dominantă, șirul poate să nu conveargă. Algoritmul MP de pe slide calculează doar vectorul propriu; valoarea proprie se obține apoi din câtul Rayleigh λ = yᵀAy (y având norma 1), cel pe care cursul îl folosește ca deplasare în metoda puterii inverse (MPI). Testul măsoară unghiul θ dintre doi vectori consecutivi: e = 1 − |cos θ|, care este 0 exact când cei doi vectori au aceeași direcție. Cursul notează că metoda este eficientă pentru matrice cu multe zerouri, pentru că o iterație este un singur produs matrice-vector.',
      en: 'The hypotheses of the course (slide "Metoda puterii"): A has a dominant eigenvalue, |λ₁| > |λ₂| ≥ ... ≥ |λₙ|; the eigenvectors x₁, ..., xₙ form a basis, so y⁰ = Σ γᵢxᵢ; and the starting vector has γ₁ ≠ 0, that is a nonzero component along the dominant eigenvector (a random vector generically has one). The speed of convergence is given by the ratio |λ₂/λ₁|: the smaller it is, the faster the method; without a dominant eigenvalue the sequence may not converge. Algorithm MP on the slide computes only the eigenvector; the eigenvalue is then obtained from the Rayleigh quotient λ = yᵀAy (y having norm 1), the one the course uses as the shift in the inverse power method (MPI). The test measures the angle θ between two consecutive vectors: e = 1 − |cos θ|, which is 0 exactly when the two vectors have the same direction. The course notes that the method is efficient for matrices with many zeros, because one iteration is a single matrix-vector product.',
    },
    iesiri: ['y', 'i'],
    numpy: [
      'lam = {y} @ A @ {y}',
      'print("lambda = y^T A y =", lam)',
      'val = np.linalg.eigvals(A)',
      'print("np.linalg.eigvals(A) =", val)',
      dif('abs(lam)', 'np.max(np.abs(val))'),
    ],
    sursa: `y ← y / ‖y‖; i ← 0; e ← 1
cât timp e > tol
    dacă i > maxiter atunci stop 'nu a convers în maxiter iterații'
    z ← A y
    z ← z / ‖z‖
    e ← |1 - |z^T y||
    y ← z; i ← i + 1`,
    intrari: [
      {
        nume: 'A',
        tip: 'matrice',
        exemplu: [
          [2, 3, 2, -6],
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
        ],
        descriere: { ro: 'n × n, cu o valoare proprie dominantă', en: 'n × n, with a dominant eigenvalue' },
        aleator: 'asemenea',
      },
      {
        nume: 'y',
        tip: 'vector',
        exemplu: [1, 0, 0, 0],
        descriere: { ro: 'lungime n, vectorul de pornire: nenul, cu o componentă pe vectorul propriu dominant', en: 'length n, the starting vector: nonzero, with a component along the dominant eigenvector' },
        natura: 'pornire',
        cu: 'A',
        dimensiune: ['A', 'linii'],
      },
      { nume: 'tol', tip: 'scalar', exemplu: 1e-15, descriere: { ro: 'toleranța pentru e, între 0 și 1', en: 'tolerance for e, between 0 and 1' }, natura: 'toleranta' },
      { nume: 'maxiter', tip: 'scalar', exemplu: 50, descriere: MAXITER, natura: 'iteratii' },
    ],
  },
  {
    id: 'MPI',
    grup: 'proprii',
    notiuni: ['valoare_proprie', 'metoda_puterii', 'norma', 'produs_scalar', 'eliminare', 'pivot', 'substitutie', 'criteriu_oprire'],
    titlu: { ro: 'MPI, metoda puterii inverse', en: 'MPI, inverse power method' },
    descriere: {
      ro: 'Găsește un vector propriu al lui A pornind de la y, cu deplasarea Rayleigh: la fiecare iterație μ = yᵀAy este aproximarea unei valori proprii pe care o dă y, iar z se obține rezolvând sistemul (μI − A) z = y, în loc să se înmulțească y cu A ca la metoda puterii. Cum μ se apropie de o valoare proprie λ, matricea μI − A este aproape singulară și z crește mult pe direcția vectorului propriu al lui λ; după normare, y se aliniază cu el în câțiva pași. Sistemul se rezolvă cu eliminare gaussiană cu pivotare parțială și substituție înapoi, scrise desfășurat pe copia B = μI − A.',
      en: 'Finds an eigenvector of A starting from y, with the Rayleigh shift: at every iteration μ = yᵀAy is the eigenvalue approximation that y gives, and z is obtained by solving the system (μI − A) z = y, instead of multiplying y by A as in the power method. As μ approaches an eigenvalue λ, the matrix μI − A is nearly singular and z grows a lot along the eigenvector of λ; after normalization, y lines up with it in a few steps. The system is solved by Gaussian elimination with partial pivoting and back substitution, written out on the copy B = μI − A.',
    },
    curs: {
      ro: 'Curs V, slide-ul "Metoda puterii inverse", Algoritm MPI, rând cu rând: normarea, μ = yᵀAy, sistemul (μI_n − A) z = y, normarea lui z, e = |1 − |zᵀy||, y ← z. Pasul "se rezolvă sistemul" este scris desfășurat ca S_GPP, pe matricea B = μI − A și pe copia z a lui y, pentru că pseudocodul de aici nu are apeluri între algoritmi; liniile lui au comentariul %. Pe slide y se alege aleator; aici este o intrare. "tol > 1" de pe slide și testul i > maxiter sunt ca la MP. Exemplul este matricea companion de pe slide-ul "Exemple numerice MP/MPI", cu y⁰ = e₁ și toleranța 10⁻¹⁵: cartea cursului (tabelul 4.1, pagina 237) dă μ = 2.9411764705882, 3.0045159755566, 3.0000169808688, 3.0000000001717, 3 și oprirea după 5 iterații, față de 23 la metoda puterii; aici ies aceleași numere.',
      en: 'Course V, slide "Metoda puterii inverse", Algorithm MPI, line by line: the normalization, μ = yᵀAy, the system (μI_n − A) z = y, the normalization of z, e = |1 − |zᵀy||, y ← z. The step "solve the system" is written out as in S_GPP, on the matrix B = μI − A and on the copy z of y, because the pseudocode here has no calls between algorithms; its lines carry the % comment. On the slide y is chosen at random; here it is an input. The "tol > 1" of the slide and the test i > maxiter are as in MP. The example is the companion matrix on the slide "Exemple numerice MP/MPI", with y⁰ = e₁ and the tolerance 10⁻¹⁵: the book of the course (table 4.1, page 237) gives μ = 2.9411764705882, 3.0045159755566, 3.0000169808688, 3.0000000001717, 3 and the stop after 5 iterations, against 23 for the power method; the same numbers come out here.',
    },
    cost: { ro: '≈ 2n³/3 flopi pe iterație pentru eliminarea pe μI − A, plus ≈ 4n² pentru produsul Ay, aplicarea multiplicatorilor și substituție', en: '≈ 2n³/3 flops per iteration for the elimination on μI − A, plus ≈ 4n² for the product Ay, the multipliers and the substitution' },
    // numarat pe pseudocod: GPP n(n−1)(4n+1)/6, Ay 2n² − n, μ 2n − 1, diagonala n, z la eliminare
    // n(n − 1), UTRIS n², normarea 3n − 1, e 2n; inainte de bucla, normarea 3n − 1
    estimare: (x) => {
      const n = x.forme.A[0]
      return x.iteratii * ((n * (n - 1) * (4 * n + 1)) / 6 + 4 * n * n + 6 * n - 2) + 3 * n - 1
    },
    forma: '\\mu_k = (y^{(k-1)})^T A\\, y^{(k-1)}, \\qquad (\\mu_k I - A)\\, z = y^{(k-1)}, \\qquad y^{(k)} = \\dfrac{z}{\\|z\\|}',
    etape: [
      { linii: [1, 1], tex: 'y \\leftarrow y / \\|y\\|', text: { ro: 'vectorul de pornire se normează', en: 'the starting vector is normalized' } },
      { linii: [5, 6], tex: '\\mu = y^T A\\, y', text: { ro: 'câtul Rayleigh: aproximarea valorii proprii pe care o dă y', en: 'the Rayleigh quotient: the eigenvalue approximation that y gives' } },
      { linii: [7, 10], tex: 'B = \\mu I - A', text: { ro: 'matricea sistemului, într-o copie: A rămâne neschimbată', en: 'the matrix of the system, in a copy: A stays unchanged' } },
      {
        linii: [11, 27],
        tex: '(\\mu I - A)\\, z = y',
        text: { ro: 'sistemul se rezolvă ca în S_GPP: eliminare cu pivotare parțială pe B și pe z, apoi substituție înapoi; un pivot nul înseamnă că μ este exact o valoare proprie', en: 'the system is solved as in S_GPP: elimination with partial pivoting on B and on z, then back substitution; a zero pivot means that μ is exactly an eigenvalue' },
      },
      {
        linii: [28, 29],
        tex: 'z \\leftarrow \\dfrac{z}{\\|z\\|}, \\qquad e = \\bigl|1 - |z^T y|\\bigr|',
        text: { ro: 'z se normează, iar e arată cât s-a mai schimbat direcția față de y', en: 'z is normalized, and e shows how much the direction changed from y' },
      },
    ],
    practic: {
      ro: 'Cartea cursului (pagina 237) numește metoda puterii inverse cu deplasare Rayleigh cea mai bună cale de calcul al unui vector propriu: convergența este pătratică, ‖y⁽ᵏ⁺¹⁾ − γx₁‖ ≤ τ‖y⁽ᵏ⁾ − γx₁‖², iar valoarea proprie vine odată cu vectorul, ca valoarea finală a lui μ. Prețul este sistemul rezolvat la fiecare iterație, ≈ 2n³/3 flopi față de ≈ 2n² la metoda puterii; cartea notează că pentru eficiență A se aduce întâi la forma superior Hessenberg, unde sistemul costă ≈ n². Cu o deplasare μ constantă, cartea arată că metoda converge la vectorul propriu al valorii proprii celei mai apropiate de μ; cu deplasarea Rayleigh limita depinde de pornire și nu este neapărat valoarea dominantă. Aproape de convergență μI − A este aproape singulară și z iese foarte mare înainte de normare. Dacă μ nimerește exact o valoare proprie, sistemul este singular: un pivot iese 0 și algoritmul se oprește spunând asta (liniile cu % nu sunt pe slide, care nu tratează cazul). Se întâmplă fie când y este deja vectorul propriu, fie, rar, din coincidență la pornire, de exemplu pentru o matrice cu valori proprii întregi și un y cu yᵀAy/yᵀy întreg; atunci se pornește de la alt y.',
      en: 'The book of the course (page 237) calls the inverse power method with the Rayleigh shift the best way to compute an eigenvector: the convergence is quadratic, ‖y⁽ᵏ⁺¹⁾ − γx₁‖ ≤ τ‖y⁽ᵏ⁾ − γx₁‖², and the eigenvalue comes along with the vector, as the final value of μ. The price is the system solved at every iteration, ≈ 2n³/3 flops against ≈ 2n² for the power method; the book notes that for efficiency A is first brought to upper Hessenberg form, where the system costs ≈ n². With a constant shift μ, the book shows that the method converges to the eigenvector of the eigenvalue closest to μ; with the Rayleigh shift the limit depends on the start and is not necessarily the dominant eigenvalue. Near convergence μI − A is nearly singular and z comes out very large before normalization. If μ hits an eigenvalue exactly, the system is singular: a pivot comes out 0 and the algorithm stops saying so (the lines with % are not on the slide, which does not treat the case). This happens either when y is already the eigenvector or, rarely, by coincidence at the start, for instance for a matrix with integer eigenvalues and a y with yᵀAy/yᵀy an integer; then one starts from another y.',
    },
    iesiri: ['y', 'i'],
    numpy: [
      'mu = {y} @ A @ {y}',
      'print("mu = y^T A y =", mu)',
      'val = np.linalg.eigvals(A)',
      'print("np.linalg.eigvals(A) =", val)',
      '# fata de valoarea proprie cea mai apropiata de mu',
      dif('mu', 'val[np.argmin(np.abs(val - mu))]'),
    ],
    ecuatie: { A: 'B', x: 'z', b: 'y', linie: 'l', tex: '(\\mu I - A)\\, z = y' },
    sursa: `y ← y / ‖y‖; i ← 0; e ← 1
fie B[n,n]
cât timp e > tol
    dacă i > maxiter atunci stop 'nu a convers în maxiter iterații'
    z ← A y
    μ ← y^T z
    pentru l = 1 : n    % B = μI − A
        pentru j = 1 : n
            b_lj ← -a_lj
        b_ll ← μ - a_ll
    z ← y    % B z = y ca în S_GPP: GPP pe B și z, apoi UTRIS
    pentru k = 1 : n-1
        l_k ← argmax_{l=k:n} |b_lk|
        dacă b_{l_k, k} = 0 atunci stop 'μI − A singulară: μ e valoare proprie'
        pentru j = k : n
            b_kj ↔ b_{l_k, j}
        z_k ↔ z_{l_k}
        pentru l = k+1 : n
            b_lk ← b_lk / b_kk
            z_l ← z_l - b_lk z_k
            pentru j = k+1 : n
                b_lj ← b_lj - b_lk b_kj
    dacă b_nn = 0 atunci stop 'μI − A singulară: μ e valoare proprie'
    pentru k = n : -1 : 1
        pentru j = k+1 : n
            z_k ← z_k - b_kj z_j
        z_k ← z_k / b_kk
    z ← z / ‖z‖
    e ← |1 - |z^T y||
    y ← z; i ← i + 1`,
    intrari: [
      {
        nume: 'A',
        tip: 'matrice',
        exemplu: [
          [2, 3, 2, -6],
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
        ],
        descriere: { ro: 'n × n', en: 'n × n' },
        aleator: 'asemenea',
      },
      {
        nume: 'y',
        tip: 'vector',
        exemplu: [1, 0, 0, 0],
        descriere: { ro: 'lungime n, vectorul de pornire, nenul; de el depinde la ce vector propriu se ajunge', en: 'length n, the starting vector, nonzero; it decides which eigenvector is reached' },
        natura: 'pornireInversa',
        cu: 'A',
        dimensiune: ['A', 'linii'],
      },
      { nume: 'tol', tip: 'scalar', exemplu: 1e-15, descriere: { ro: 'toleranța pentru e, între 0 și 1', en: 'tolerance for e, between 0 and 1' }, natura: 'toleranta' },
      { nume: 'maxiter', tip: 'scalar', exemplu: 50, descriere: MAXITER, natura: 'iteratii' },
    ],
  },
  {
    id: 'S_G',
    grup: 'directe',
    notiuni: ['sistem_liniar', 'eliminare', 'pivot', 'stabilitate', 'substitutie'],
    titlu: { ro: 'S_G, rezolvarea lui Ax = b cu G, fără pivotare', en: 'S_G, solving Ax = b with G, without pivoting' },
    descriere: {
      ro: 'Rezolvă Ax = b în trei pași, ca S_GPP, dar fără pivotare: triangularizează A cu algoritmul G, aplică aceiași multiplicatori pe b (d = Mb), apoi rezolvă Ux = d prin substituție înapoi. Exemplul este cel din curs cu pivotul 10⁻⁴, calculat cu 3 cifre semnificative: iese x_1 = 0 în loc de 1.',
      en: 'Solves Ax = b in three steps, like S_GPP but without pivoting: it triangularizes A with algorithm G, applies the same multipliers to b (d = Mb), then solves Ux = d by back substitution. The example is the course one with the pivot 10⁻⁴, computed with 3 significant digits: it gives x_1 = 0 instead of 1.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Rezolvarea sistemelor liniare utilizand G", care descrie pașii (d = Mb, apoi UTRIS) fără pseudocod; aici sunt scriși ca la S_GPP, fără interschimbări. Exemplul este de pe slide-ul "Rezolvarea sistemelor liniare - exemplu 2". Slide-ul presupune precizia mașinii 10⁻³ și rotunjește 9998/9999 la 1. Aici fiecare operație se rotunjește la 3 cifre semnificative, pentru că așa iese exact calculul de pe slide; formula de pe slide-ul "Reprezentarea numerelor" (precizia de ordinul 10^-(t-1)) ar da 4 cifre, iar cu 4 cifre 9998/9999 iese 0.9999 și x_1 iese 1.',
      en: 'Course III, slide "Rezolvarea sistemelor liniare utilizand G", which describes the steps (d = Mb, then UTRIS) without pseudocode; here they are written as in S_GPP, without swaps. The example is from the slide "Rezolvarea sistemelor liniare - exemplu 2". The slide assumes the machine precision 10⁻³ and rounds 9998/9999 to 1. Here every operation is rounded to 3 significant digits, because that reproduces the computation on the slide exactly; the formula on the slide "Reprezentarea numerelor" (precision of order 10^-(t-1)) would give 4 digits, and with 4 digits 9998/9999 comes out as 0.9999 and x_1 as 1.',
    },
    cost: { ro: '≈ 2n³/3 flopi pentru triangularizare, plus ≈ 2n² pentru b și substituție', en: '≈ 2n³/3 flops for the triangularization, plus ≈ 2n² for b and the substitution' },
    estimare: (x) => eliminare('A')(x) + 2 * x.forme.A[0] ** 2,
    forma: 'Ax = b \\;\\Longleftrightarrow\\; Ux = M_{n-1} \\cdots M_1\\, b',
    etape: [
      {
        linii: [2, 7],
        tex: 'M_{n-1} \\cdots M_1 A = U',
        text: { ro: 'triangularizarea fără pivotare, ca în algoritmul G', en: 'the triangularization without pivoting, as in algorithm G' },
      },
      {
        linii: [8, 10],
        tex: 'd = M_{n-1} \\cdots M_1\\, b',
        text: { ro: 'aceiași multiplicatori se aplică termenului liber; d se scrie peste b, ca în pseudocod', en: 'the same multipliers are applied to the right-hand side; d is written over b, as in the pseudocode' },
      },
      {
        linii: [11, 15],
        tex: 'U x = d',
        text: { ro: 'sistemul superior triunghiular se rezolvă prin substituție înapoi (UTRIS)', en: 'the upper triangular system is solved by back substitution (UTRIS)' },
      },
    ],
    practic: {
      ro: 'Cu pivotare parțială (S_GPP), aceleași date și aceeași precizie dau x_1 = 1: panoul "Comparație" arată cele două rulări una lângă alta. Fără pivotare, pivotul mic dă un multiplicator mare (10⁴), iar rotunjirea la 3 cifre pierde informația din ecuații. Slide-ul de după exemplu propune remediul: strategiile de pivotare. În dublă precizie (aritmetica implicită a vizualizatorului, cu circa 16 cifre semnificative după cartea cursului) exemplul dă soluția corectă, pentru că 16 cifre ajung aici; un pivot mai mic ar strica și acolo rezultatul. Slide-ul observă că pentru G ajunge ca A[1], ..., A[n−1] să fie nesingulare, A putând fi chiar singulară; S_G are însă nevoie și de A nesingulară, altfel u_nn iese 0 și substituția înapoi nu poate împărți la el (contraexemplul "matrice singulară").',
      en: 'With partial pivoting (S_GPP), the same data and the same precision give x_1 = 1: the "Comparison" panel shows the two runs side by side. Without pivoting, the small pivot gives a large multiplier (10⁴), and rounding to 3 digits loses the information in the equations. The slide after the example proposes the remedy: pivoting strategies. In double precision (the default arithmetic of the visualizer, with about 16 significant digits according to the book of the course) the example gives the correct solution, because 16 digits are enough here; a smaller pivot would spoil the result there too. The slide remarks that G only needs A[1], ..., A[n−1] nonsingular, A itself may even be singular; S_G, however, also needs A nonsingular, otherwise u_nn comes out 0 and back substitution cannot divide by it (the counterexample "singular matrix").',
    },
    iesiri: ['x'],
    numpy: fataDeSolve('A', '{x}'),
    ecuatie: { A: 'A', x: 'x', b: 'b', linie: 'i' },
    cifre: 3,
    sursa: `μ, U peste A
pentru k = 1 : n-1
    pentru i = k+1 : n
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : n
            a_ij ← a_ij - μ_ik a_kj
pentru k = 1 : n-1
    pentru i = k+1 : n
        b_i ← b_i - μ_ik b_k
x ← b
pentru i = n : -1 : 1
    pentru j = i+1 : n
        x_i ← x_i - u_ij x_j
    x_i ← x_i / u_ii`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[0.0001, 1], [1, 1]], descriere: LIDER, natura: 'lider' },
      { nume: 'b', tip: 'vector', exemplu: [1, 2], descriere: { ro: 'lungime n', en: 'length n' }, dimensiune: ['A', 'linii'] },
    ],
  },
  {
    id: 'Gb',
    grup: 'structura',
    notiuni: ['banda', 'eliminare', 'lider', 'flop'],
    titlu: { ro: 'Gb, eliminare gaussiană pentru matrice bandă', en: 'Gb, Gaussian elimination for banded matrices' },
    descriere: {
      ro: 'Algoritmul G adaptat la o matrice bandă, cu r diagonale nenule sub diagonala principală și q deasupra ei. Elementele din afara benzii sunt zero, iar eliminarea nu le schimbă, deci buclele se opresc la marginea benzii: la pasul k se calculează doar r multiplicatori, iar fiecare linie de sub pivot se actualizează doar pe q coloane. Cu r = q = 1 matricea este tridiagonală, iar cu r = 1 și q = n − 1 este superior Hessenberg.',
      en: 'Algorithm G adapted to a banded matrix, with r nonzero diagonals below the main diagonal and q above it. The entries outside the band are zero and elimination does not change them, so the loops stop at the edge of the band: at step k only r multipliers are computed, and each row below the pivot is updated on q columns only. With r = q = 1 the matrix is tridiagonal, and with r = 1 and q = n − 1 it is upper Hessenberg.',
    },
    curs: {
      ro: 'Algoritmul 2.14 (Gb) din cartea cursului, secțiunea 2.9 "Sisteme bandă", rând cu rând; definiția matricei bandă este cea din capitolul 1 al cărții (lățimea inferioară și cea superioară), iar slide-urile din cursul I definesc matricele tridiagonale și Hessenberg. Formula de cost nu este în carte, care o lasă cititorului; aici este numărată pe pseudocod. Exemplul este o matrice tridiagonală aleasă pentru vizualizator.',
      en: 'Algorithm 2.14 (Gb) in the book of the course, section 2.9 "Sisteme bandă", line by line; the definition of a banded matrix is the one in chapter 1 of the book (lower and upper bandwidth), and the slides of course I define tridiagonal and Hessenberg matrices. The cost formula is not in the book, which leaves it to the reader; here it is counted on the pseudocode. The example is a tridiagonal matrix chosen for the visualizer.',
    },
    cost: {
      ro: 'Σ r_k(2q_k + 1) flopi, cu r_k = min(r, n − k) și q_k = min(q, n − k); ≈ n(2rq + r) când r și q sunt mult mai mici decât n, deci ≈ 3n pentru o matrice tridiagonală',
      en: 'Σ r_k(2q_k + 1) flops, with r_k = min(r, n − k) and q_k = min(q, n − k); ≈ n(2rq + r) when r and q are much smaller than n, so ≈ 3n for a tridiagonal matrix',
    },
    estimare: (x) => banda(x.forme.A[0], x.scalari.r, x.scalari.q),
    forma: 'M_{n-1} \\cdots M_1 A = U, \\qquad a_{ij} = 0 \\;\\text{pentru}\\; i - j > r \\;\\text{sau}\\; j - i > q',
    etape: [
      {
        linii: [3, 4],
        tex: '\\mu_{ik} = a_{ik} / a_{kk}, \\quad i = k+1 : \\min(k+r,\\, n)',
        text: { ro: 'doar primele r elemente de sub pivot sunt nenule, deci sunt r multiplicatori', en: 'only the first r entries below the pivot are nonzero, so there are r multipliers' },
      },
      {
        linii: [5, 7],
        tex: 'A(i,\\; k+1\\!:\\!q_k) \\leftarrow A(i,\\; k+1\\!:\\!q_k) - \\mu_{ik}\\, A(k,\\; k+1\\!:\\!q_k), \\quad i = k+1 : \\min(k+r,\\, n),\\ q_k = \\min(k+q,\\, n)',
        text: { ro: 'se modifică doar blocul de r x q de sub și din dreapta pivotului; restul matricei nu se atinge', en: 'only the r x q block below and to the right of the pivot changes; the rest of the matrix is not touched' },
      },
    ],
    practic: {
      ro: 'Cartea arată (teorema 2.9) că eliminarea fără pivotare păstrează structura: U este bandă cu q diagonale deasupra diagonalei principale, iar multiplicatorii stau doar pe primele r poziții de sub ea. Zerourile din afara benzii, marcate în grilă, nu se citesc și nu se scriu niciodată. Pentru o matrice tridiagonală costul scade de la ≈ 2n³/3 la ≈ 3n flopi; descrierea arată și cât numără algoritmul G pe aceeași matrice. Ca la G, un pivot nul sau mic este o problemă; cu pivotare, banda de deasupra diagonalei se lărgește (vezi GPPb). Cartea cursului (pagina 41) notează că o matrice tridiagonală se poate memora în trei vectori, câte unul pentru fiecare diagonală.',
      en: 'The book shows (theorem 2.9) that elimination without pivoting keeps the structure: U is banded with q diagonals above the main one, and the multipliers sit only in the first r positions below it. The zeros outside the band, marked in the grid, are never read or written. For a tridiagonal matrix the cost drops from ≈ 2n³/3 to ≈ 3n flops; the description also shows how many algorithm G counts on the same matrix. As with G, a zero or small pivot is a problem; with pivoting, the band above the diagonal widens (see GPPb). The book of the course (page 41) notes that a tridiagonal matrix can be stored in three vectors, one per diagonal.',
    },
    iesiri: ['A'],
    numpy: [
      '# NumPy nu are LU fara pivotare: se verifica A = LU cu L, U luate din rezultat',
      'L = np.tril({A}, -1) + np.eye(len(A))',
      'U = np.triu({A})',
      dif('L @ U', 'A'),
    ],
    plin: 'G',
    zerouri: { tablou: 'A', zero: (i, j, s) => i - j > s.r || j - i > s.q },
    sursa: `μ peste A
pentru k = 1 : n-1
    pentru i = k+1 : min(k+r, n)
        a_ik ← μ_ik = a_ik / a_kk
    pentru i = k+1 : min(k+r, n)
        pentru j = k+1 : min(k+q, n)
            a_ij ← a_ij - μ_ik a_kj`,
    intrari: [
      {
        nume: 'A',
        tip: 'matrice',
        exemplu: [[2, 1, 0, 0, 0], [4, 3, 1, 0, 0], [0, 3, 4, 1, 0], [0, 0, 2, 3, 1], [0, 0, 0, 1, 2]],
        descriere: { ro: 'n × n, bandă cu lățimile r și q, cu submatricele lider principale nesingulare', en: 'n × n, banded with widths r and q, with nonsingular leading principal submatrices' },
        natura: 'bandaLider',
        aleator: 'bandaLider',
        latimi: ['r', 'q'],
      },
      { nume: 'r', tip: 'scalar', exemplu: 1, descriere: { ro: 'câte diagonale nenule sunt sub diagonala principală', en: 'how many nonzero diagonals lie below the main diagonal' }, natura: 'latime', cu: 'A' },
      { nume: 'q', tip: 'scalar', exemplu: 1, descriere: { ro: 'câte diagonale nenule sunt deasupra ei', en: 'how many nonzero diagonals lie above it' }, natura: 'latime', cu: 'A' },
    ],
  },
  {
    id: 'GPPb',
    grup: 'structura',
    notiuni: ['banda', 'eliminare', 'pivot', 'indici'],
    titlu: { ro: 'GPPb, eliminare gaussiană cu pivotare parțială pentru matrice bandă', en: 'GPPb, Gaussian elimination with partial pivoting for banded matrices' },
    descriere: {
      ro: 'GPP adaptat la o matrice bandă: pivotul se caută doar de la diagonală până la r poziții sub ea, singurele care pot fi nenule în coloana k. După interschimbare, linia pivotului poate avea elemente nenule până la coloana k + q + r, deci actualizarea merge până acolo: banda de deasupra diagonalei se lărgește de la q la cel mult q + r.',
      en: 'GPP adapted to a banded matrix: the pivot is searched only from the diagonal down to r positions below it, the only ones that can be nonzero in column k. After the swap, the pivot row can have nonzero entries up to column k + q + r, so the update goes that far: the band above the diagonal widens from q to at most q + r.',
    },
    curs: {
      ro: 'Algoritmul 2.15 (GPPb) din cartea cursului, secțiunea 2.9 "Sisteme bandă". Cartea notează cu r1 = min(k + r, n) și q1 = min(k + q + r, n) ultima linie și ultima coloană atinse la pasul k; aici aceste limite sunt scrise direct în bucle, ca fiecare capăt să se vadă în bucla lui. Exemplul este ales ca pivotarea să mute linii și să lărgească banda.',
      en: 'Algorithm 2.15 (GPPb) in the book of the course, section 2.9 "Sisteme bandă". The book writes r1 = min(k + r, n) and q1 = min(k + q + r, n) for the last row and the last column touched at step k; here these bounds are written straight into the loops, so that each bound is seen in its own loop. The example is chosen so that pivoting moves rows and widens the band.',
    },
    cost: {
      ro: 'Σ r_k(2q_k + 1) flopi, cu r_k = min(r, n − k) și q_k = min(q + r, n − k), plus comparațiile pentru pivot; ≈ n(2r(q + r) + r) când r și q sunt mult mai mici decât n',
      en: 'Σ r_k(2q_k + 1) flops, with r_k = min(r, n − k) and q_k = min(q + r, n − k), plus the comparisons for the pivot; ≈ n(2r(q + r) + r) when r and q are much smaller than n',
    },
    estimare: (x) => banda(x.forme.A[0], x.scalari.r, x.scalari.q + x.scalari.r),
    forma: 'M_{n-1} P_{n-1} \\cdots M_1 P_1 A = U, \\qquad u_{ij} = 0 \\;\\text{pentru}\\; j - i > q + r',
    etape: [
      {
        linii: [4, 5],
        tex: '|a_{i_k k}| = \\max_{i = k : r_1} |a_{ik}|, \\qquad r_1 = \\min(k + r,\\, n)',
        text: { ro: 'pivotul se caută doar în banda coloanei k; p_k reține linia lui', en: 'the pivot is searched only within the band of column k; p_k records its row' },
      },
      {
        linii: [6, 7],
        tex: 'A(k,\\, k\\!:\\!q_1) \\leftrightarrow A(i_k,\\, k\\!:\\!q_1), \\qquad q_1 = \\min(k + q + r,\\, n)',
        text: { ro: 'interschimbarea aduce în linia k elemente până la coloana k + q + r', en: 'the swap brings into row k entries up to column k + q + r' },
      },
      {
        linii: [8, 12],
        tex: 'A \\leftarrow M_k A, \\quad \\text{doar blocul } A(k+1\\!:\\!r_1,\\; k+1\\!:\\!q_1)',
        text: { ro: 'multiplicatorii și actualizarea, limitate la bandă', en: 'the multipliers and the update, limited to the band' },
      },
    ],
    practic: {
      ro: 'Cartea (teorema 2.10): cu pivotare parțială, U este bandă cu cel mult q + r diagonale deasupra diagonalei principale, iar multiplicatorii rămân pe primele r poziții de sub ea; după permutări, L nu mai este însă bandă. Pivotarea completă ar distruge banda și cartea nu o recomandă aici. Cartea (paginile 107-108) notează că este destul ca r sau q să fie mult mai mic decât n pentru ca ambele variante să coste mult sub 2n³/3; descrierea arată și cât numără GPP pe aceeași matrice.',
      en: 'The book (theorem 2.10): with partial pivoting, U is banded with at most q + r diagonals above the main one, and the multipliers stay in the first r positions below it; after the permutations, however, L is no longer banded. Complete pivoting would destroy the band and the book does not recommend it here. The book (pages 107-108) notes that it is enough for r or q to be much smaller than n for both variants to cost far below 2n³/3; the description also shows how many GPP counts on the same matrix.',
    },
    iesiri: ['A', 'p'],
    numpy: [
      '# det(A) = (-1)^(numarul de interschimbari) * produsul diagonalei lui U',
      'semn = (-1) ** np.count_nonzero({p} != np.arange(len({p})))',
      'print("np.linalg.det(A) =", np.linalg.det(A))',
      dif('semn * np.prod(np.diag({A}))', 'np.linalg.det(A)'),
    ],
    plin: 'GPP',
    zerouri: { tablou: 'A', zero: (i, j, s) => i - j > s.r || j - i > s.q + s.r },
    sursa: `μ peste A
fie p[n-1]
pentru k = 1 : n-1
    i_k ← argmax_{i=k:min(k+r, n)} |a_ik|
    p_k ← i_k
    pentru j = k : min(k+q+r, n)
        a_kj ↔ a_{i_k, j}
    pentru i = k+1 : min(k+r, n)
        a_ik ← μ_ik = a_ik / a_kk
    pentru i = k+1 : min(k+r, n)
        pentru j = k+1 : min(k+q+r, n)
            a_ij ← a_ij - μ_ik a_kj`,
    intrari: [
      {
        nume: 'A',
        tip: 'matrice',
        exemplu: [[1, 2, 0, 0, 0], [3, 1, 1, 0, 0], [0, 4, 1, 2, 0], [0, 0, 1, 3, 1], [0, 0, 0, 2, 1]],
        descriere: { ro: 'n × n, bandă cu lățimile r și q, nesingulară', en: 'n × n, banded with widths r and q, nonsingular' },
        natura: 'bandaNesingulara',
        latimi: ['r', 'q'],
      },
      { nume: 'r', tip: 'scalar', exemplu: 1, descriere: { ro: 'câte diagonale nenule sunt sub diagonala principală', en: 'how many nonzero diagonals lie below the main diagonal' }, natura: 'latime', cu: 'A' },
      { nume: 'q', tip: 'scalar', exemplu: 1, descriere: { ro: 'câte diagonale nenule sunt deasupra ei', en: 'how many nonzero diagonals lie above it' }, natura: 'latime', cu: 'A' },
    ],
  },
  {
    id: 'UTRISb',
    grup: 'structura',
    notiuni: ['banda', 'triunghiulara', 'substitutie'],
    titlu: { ro: 'UTRISb, substituție înapoi pentru matrice bandă', en: 'UTRISb, back substitution for banded matrices' },
    descriere: {
      ro: 'UTRIS pentru o matrice superior triunghiulară bandă, cu q diagonale nenule deasupra diagonalei principale, cum o lasă Gb: în ecuația i apar doar necunoscutele x_(i+1), ..., x_(i+q), deci suma se oprește la min(i + q, n).',
      en: 'UTRIS for an upper triangular banded matrix, with q nonzero diagonals above the main one, as Gb leaves it: equation i contains only the unknowns x_(i+1), ..., x_(i+q), so the sum stops at min(i + q, n).',
    },
    curs: {
      ro: 'Cartea cursului, secțiunea 2.9 "Sisteme bandă": după Gb, "adaptarea UTRIS la acest caz este imediată", cu formula x_i = (d_i − Σ u_ij x_j)/u_ii pentru j = i+1 : min(i+q, n). Pseudocodul este UTRIS din cursul II cu această limită.',
      en: 'The book of the course, section 2.9 "Sisteme bandă": after Gb, adapting UTRIS to this case is called immediate, with the formula x_i = (d_i − Σ u_ij x_j)/u_ii for j = i+1 : min(i+q, n). The pseudocode is UTRIS of course II with this bound.',
    },
    cost: { ro: 'Σ (2 min(q, n − i) + 1) flopi ≈ n(2q + 1), față de n² la UTRIS', en: 'Σ (2 min(q, n − i) + 1) flops ≈ n(2q + 1), against n² for UTRIS' },
    estimare: (x) => {
      const n = x.forme.U[0]
      let s = 0
      for (let i = 1; i <= n; i++) s += 2 * Math.min(x.scalari.q, n - i) + 1
      return s
    },
    forma: 'U x = b, \\qquad u_{ij} = 0 \\;\\text{pentru}\\; j - i > q',
    etape: [
      {
        linii: [3, 4],
        tex: 'x_i \\leftarrow b_i - U(i,\\, i+1\\!:\\!\\min(i+q, n))\\; x(i+1\\!:\\!\\min(i+q, n))',
        text: { ro: 'din b_i se scad doar cele q necunoscute de după i', en: 'only the q unknowns after i are subtracted from b_i' },
      },
      {
        linii: [5, 5],
        tex: 'x_i \\leftarrow x_i / u_{ii}',
        text: { ro: 'împărțirea la elementul diagonal dă necunoscuta i', en: 'dividing by the diagonal entry gives unknown i' },
      },
    ],
    practic: {
      ro: 'Pentru q = 1 (o matrice bidiagonală) costul este ≈ 3n în loc de n². Împreună cu Gb și cu aceiași multiplicatori aplicați pe b, rezolvă Ax = b pentru o matrice bandă cu mult mai puține operații decât S_GPP.',
      en: 'For q = 1 (a bidiagonal matrix) the cost is ≈ 3n instead of n². Together with Gb and the same multipliers applied to b, it solves Ax = b for a banded matrix with far fewer operations than S_GPP.',
    },
    iesiri: ['x'],
    numpy: fataDeSolve('U', '{x}'),
    ecuatie: { A: 'U', x: 'x', b: 'b', linie: 'i' },
    plin: 'UTRIS',
    zerouri: { tablou: 'U', zero: (i, j, s) => i > j || j - i > s.q },
    sursa: `x ← b
pentru i = n : -1 : 1
    pentru j = i+1 : min(i+q, n)
        x_i ← x_i - u_ij x_j
    x_i ← x_i / u_ii`,
    intrari: [
      {
        nume: 'U',
        tip: 'matrice',
        exemplu: [[2, 1, 0, 0, 0], [0, 1, 1, 0, 0], [0, 0, 1, 1, 0], [0, 0, 0, 1, 1], [0, 0, 0, 0, 1]],
        descriere: { ro: 'n × n, superior triunghiulară, bandă cu q diagonale deasupra diagonalei, cu diagonala nenulă', en: 'n × n, upper triangular, banded with q diagonals above the main one, with a nonzero diagonal' },
        natura: 'superiorBanda',
        latimi: [0, 'q'],
      },
      { nume: 'b', tip: 'vector', exemplu: [3, 2, 2, 2, 1], descriere: { ro: 'lungime n', en: 'length n' }, dimensiune: ['U', 'linii'] },
      { nume: 'q', tip: 'scalar', exemplu: 1, descriere: { ro: 'câte diagonale nenule sunt deasupra diagonalei principale', en: 'how many nonzero diagonals lie above the main diagonal' }, natura: 'latime', cu: 'U' },
    ],
  },
]

export const algoritm = (id: string): Algoritm | undefined => BIBLIOTECA.find((a) => a.id === id)
