// Algoritmii din curs, scrisi in pseudocodul acceptat de parser. Exemplele de intrare sunt
// cele din slide-uri unde exista (G, Cholesky, triangularizarea ortogonala, metoda puterii).
import type { Limba } from './mesaje'

type Text = Record<Limba, string>

export interface Intrare {
  nume: string
  tip: 'matrice' | 'vector' | 'scalar'
  exemplu: number | number[] | number[][]
  descriere: Text
}

export interface Algoritm {
  id: string
  titlu: Text
  descriere: Text
  cost: Text
  sursa: string
  intrari: Intrare[]
  // notiunile de baza (src/notiuni.ts) de care are nevoie cineva ca sa urmareasca algoritmul
  notiuni: string[]
}

export const BIBLIOTECA: Algoritm[] = [
  {
    id: 'matvec',
    notiuni: ['vector', 'matrice', 'produs_scalar', 'matvec', 'flop'],
    titlu: { ro: 'Înmulțire matrice-vector', en: 'Matrix-vector product' },
    descriere: {
      ro: 'y = Ax pe linii: fiecare y_i este produsul scalar dintre linia i a lui A și x.',
      en: 'y = Ax by rows: each y_i is the dot product of row i of A with x.',
    },
    cost: { ro: '2mn flopi', en: '2mn flops' },
    sursa: `fie y[m]
pentru i = 1 : m
    y_i ← 0
    pentru j = 1 : n
        y_i ← y_i + a_ij x_j`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[1, 2, 0], [0, 1, 3], [4, 0, 1], [2, 2, 2]], descriere: { ro: 'm x n', en: 'm x n' } },
      { nume: 'x', tip: 'vector', exemplu: [1, 2, 3], descriere: { ro: 'n', en: 'n' } },
    ],
  },
  {
    id: 'matmul',
    notiuni: ['matrice', 'matmul', 'flop'],
    titlu: { ro: 'Înmulțire matrice-matrice', en: 'Matrix-matrix product' },
    descriere: {
      ro: 'C = AB pe coloane: c_ij adună produsele dintre linia i a lui A și coloana j a lui B.',
      en: 'C = AB column by column: c_ij accumulates the products of row i of A with column j of B.',
    },
    cost: { ro: '2mnl flopi', en: '2mnl flops' },
    sursa: `m ← linii(A); l ← coloane(A); n ← coloane(B)
fie C[m,n]
pentru j = 1 : n
    pentru i = 1 : m
        pentru k = 1 : l
            c_ij ← c_ij + a_ik b_kj`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[1, 2], [0, 1], [3, 1]], descriere: { ro: 'm x l', en: 'm x l' } },
      { nume: 'B', tip: 'matrice', exemplu: [[1, 0, 2], [2, 1, 0]], descriere: { ro: 'l x n', en: 'l x n' } },
    ],
  },
  {
    id: 'LTRIS',
    notiuni: ['triunghiulara', 'sistem_liniar', 'substitutie', 'flop'],
    titlu: { ro: 'LTRIS, substituție înainte', en: 'LTRIS, forward substitution' },
    descriere: {
      ro: 'Rezolvă Lx = b cu L inferior triunghiulară nesingulară. Soluția se scrie peste b.',
      en: 'Solves Lx = b with L lower triangular and nonsingular. The solution overwrites b.',
    },
    cost: { ro: 'n² flopi', en: 'n² flops' },
    sursa: `x ← b
pentru i = 1 : n
    pentru j = 1 : i-1
        x_i ← x_i - l_ij x_j
    x_i ← x_i / l_ii`,
    intrari: [
      { nume: 'L', tip: 'matrice', exemplu: [[2, 0, 0], [1, 3, 0], [-1, 2, 4]], descriere: { ro: 'n x n, inferior triunghiulară', en: 'n x n, lower triangular' } },
      { nume: 'b', tip: 'vector', exemplu: [2, 7, 9], descriere: { ro: 'n', en: 'n' } },
    ],
  },
  {
    id: 'UTRIS',
    notiuni: ['triunghiulara', 'sistem_liniar', 'substitutie', 'flop'],
    titlu: { ro: 'UTRIS, substituție înapoi', en: 'UTRIS, back substitution' },
    descriere: {
      ro: 'Rezolvă Ux = b cu U superior triunghiulară nesingulară, de la ultima necunoscută spre prima.',
      en: 'Solves Ux = b with U upper triangular and nonsingular, from the last unknown to the first.',
    },
    cost: { ro: 'n² flopi', en: 'n² flops' },
    sursa: `x ← b
pentru i = n : -1 : 1
    pentru j = i+1 : n
        x_i ← x_i - u_ij x_j
    x_i ← x_i / u_ii`,
    intrari: [
      { nume: 'U', tip: 'matrice', exemplu: [[2, 1, -1], [0, 3, 2], [0, 0, 4]], descriere: { ro: 'n x n, superior triunghiulară', en: 'n x n, upper triangular' } },
      { nume: 'b', tip: 'vector', exemplu: [3, 11, 8], descriere: { ro: 'n', en: 'n' } },
    ],
  },
  {
    id: 'G',
    notiuni: ['sistem_liniar', 'eliminare', 'pivot', 'factorizare', 'flop'],
    titlu: { ro: 'G, eliminare gaussiană', en: 'G, Gaussian elimination' },
    descriere: {
      ro: 'Triangularizare fără pivotare. U rămâne în triunghiul superior al lui A, multiplicatorii μ_ik în cel inferior.',
      en: 'Triangularization without pivoting. U stays in the upper triangle of A, the multipliers μ_ik in the lower one.',
    },
    cost: { ro: '2n³/3 flopi', en: '2n³/3 flops' },
    sursa: `μ peste A
pentru k = 1 : n-1
    pentru i = k+1 : n
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : n
            a_ij ← a_ij - μ_ik a_kj`,
    intrari: [
      {
        nume: 'A',
        tip: 'matrice',
        exemplu: [[1, 2, 1], [2, 1, 2], [1, 1, 2]],
        descriere: { ro: 'n x n, cu submatricele lider principale nesingulare', en: 'n x n, with nonsingular leading principal submatrices' },
      },
    ],
  },
  {
    id: 'GPP',
    notiuni: ['eliminare', 'pivot', 'indici'],
    titlu: { ro: 'GPP, eliminare gaussiană cu pivotare parțială', en: 'GPP, Gaussian elimination with partial pivoting' },
    descriere: {
      ro: 'La pasul k pivotul e cel mai mare element în modul din coloana k, sub diagonală; liniile k și i_k se interschimbă, iar p reține permutările.',
      en: 'At step k the pivot is the largest entry in absolute value in column k, on or below the diagonal; rows k and i_k are swapped and p records the permutation.',
    },
    cost: { ro: '2n³/3 flopi și n²/2 comparații', en: '2n³/3 flops and n²/2 comparisons' },
    sursa: `μ peste A
fie p[n-1]
pentru k = 1 : n-1
    i_k ← argmax_{i=k:n} |a_ik|
    p_k ← i_k
    pentru j = k : n
        a_kj ↔ a_{i_k, j}
    pentru i = k+1 : n
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : n
            a_ij ← a_ij - μ_ik a_kj`,
    intrari: [{ nume: 'A', tip: 'matrice', exemplu: [[1, 2, 1], [2, 1, 2], [1, 1, 2]], descriere: { ro: 'n x n, nesingulară', en: 'n x n, nonsingular' } }],
  },
  {
    id: 'S_GPP',
    notiuni: ['eliminare', 'pivot', 'substitutie', 'factorizare'],
    titlu: { ro: 'S_GPP, rezolvarea lui Ax = b cu GPP', en: 'S_GPP, solving Ax = b with GPP' },
    descriere: {
      ro: 'Cursul o scrie ca [M, U, p] = GPP(A), aplicarea permutărilor și a multiplicatorilor pe b, apoi x = UTRIS(U, b); aici cei trei pași sunt scriși desfășurat.',
      en: 'The course writes it as [M, U, p] = GPP(A), the permutations and multipliers applied to b, then x = UTRIS(U, b); here the three steps are written out.',
    },
    cost: { ro: '2n³/3 flopi', en: '2n³/3 flops' },
    sursa: `μ, U peste A
fie p[n-1]
pentru k = 1 : n-1
    i_k ← argmax_{i=k:n} |a_ik|
    p_k ← i_k
    pentru j = k : n
        a_kj ↔ a_{i_k, j}
    pentru i = k+1 : n
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : n
            a_ij ← a_ij - μ_ik a_kj
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
      { nume: 'A', tip: 'matrice', exemplu: [[1, 2, 1], [2, 1, 2], [1, 1, 2]], descriere: { ro: 'n x n, nesingulară', en: 'n x n, nonsingular' } },
      { nume: 'b', tip: 'vector', exemplu: [4, 5, 4], descriere: { ro: 'n', en: 'n' } },
    ],
  },
  {
    id: 'LU',
    notiuni: ['factorizare', 'eliminare', 'triunghiulara'],
    titlu: { ro: 'LU, factorizare Crout', en: 'LU, Crout factorization' },
    descriere: {
      ro: 'A = LU cu U unitate pe diagonală. L se scrie în triunghiul inferior al lui A, U deasupra diagonalei.',
      en: 'A = LU with unit diagonal in U. L is stored in the lower triangle of A, U above the diagonal.',
    },
    cost: { ro: '2n³/3 flopi', en: '2n³/3 flops' },
    sursa: `L, U peste A
pentru k = 1 : n
    pentru i = k : n
        a_ik ← l_ik = a_ik - Σ_{s=1}^{k-1} l_is u_sk
    pentru j = k+1 : n
        a_kj ← u_kj = (a_kj - Σ_{s=1}^{k-1} l_ks u_sj) / l_kk`,
    intrari: [
      {
        nume: 'A',
        tip: 'matrice',
        exemplu: [[1, 2, 1], [2, 1, 2], [1, 1, 2]],
        descriere: { ro: 'n x n, cu submatricele lider principale nesingulare', en: 'n x n, with nonsingular leading principal submatrices' },
      },
    ],
  },
  {
    id: 'CHOL',
    notiuni: ['pozitiv_definita', 'cholesky', 'factorizare', 'transpusa'],
    titlu: { ro: 'Cholesky', en: 'Cholesky' },
    descriere: {
      ro: 'A = LLᵀ pentru A simetrică pozitiv definită. L se scrie în triunghiul inferior al lui A; dacă α ≤ 0, A nu este pozitiv definită.',
      en: 'A = LLᵀ for A symmetric positive definite. L is stored in the lower triangle of A; if α ≤ 0, A is not positive definite.',
    },
    cost: { ro: 'n³/3 flopi', en: 'n³/3 flops' },
    sursa: `L peste A
pentru k = 1 : n
    α ← a_kk - Σ_{j=1}^{k-1} l_kj^2
    dacă α ≤ 0 atunci stop 'A nu este pozitiv definită'
    a_kk ← l_kk = √α
    pentru i = k+1 : n
        a_ik ← l_ik = (a_ik - Σ_{j=1}^{k-1} l_ij l_kj) / l_kk`,
    intrari: [{ nume: 'A', tip: 'matrice', exemplu: [[4, 2, 2], [2, 5, 3], [2, 3, 6]], descriere: { ro: 'n x n, simetrică', en: 'n x n, symmetric' } }],
  },
  {
    id: 'TORT',
    notiuni: ['ortogonala', 'norma', 'reflector', 'qr'],
    titlu: { ro: 'TORT, triangularizare ortogonală', en: 'TORT, orthogonal triangularization' },
    descriere: {
      ro: 'Reflectori Householder U_k = I - u_k u_kᵀ / β_k aplicați pe coloane. R rămâne în triunghiul superior al lui A, vectorii u_k în U.',
      en: 'Householder reflectors U_k = I - u_k u_kᵀ / β_k applied column by column. R stays in the upper triangle of A, the vectors u_k in U.',
    },
    cost: { ro: '2(mn² - n³/3) flopi', en: '2(mn² - n³/3) flops' },
    sursa: `p ← min(m-1, n)
fie U[m,p], β[p]
pentru k = 1 : p
    σ ← sgn(a_kk) ‖A(k:m, k)‖
    dacă σ = 0 atunci β_k ← 0
    altfel
        u_kk ← a_kk + σ
        u_ik ← a_ik, i = k+1 : m
        β_k ← σ u_kk
        a_kk ← -σ
        a_ik ← 0, i = k+1 : m
        pentru j = k+1 : n
            τ ← (Σ_{i=k}^{m} u_ik a_ij) / β_k
            pentru i = k : m
                a_ij ← a_ij - τ u_ik`,
    intrari: [{ nume: 'A', tip: 'matrice', exemplu: [[2, 3], [-1, 1], [2, -1]], descriere: { ro: 'm x n, cu m > n', en: 'm x n, with m > n' } }],
  },
  {
    id: 'CMMP',
    notiuni: ['qr', 'cmmp', 'norma', 'substitutie'],
    titlu: { ro: 'CMMP, cele mai mici pătrate', en: 'CMMP, least squares' },
    descriere: {
      ro: 'min ‖b - Ax‖ pentru m > n: TORT pe A, aceiași reflectori aplicați pe b (d = Qᵀb), apoi UTRIS pe primele n linii; r = ‖d(n+1:m)‖ este reziduul minim.',
      en: 'min ‖b - Ax‖ for m > n: TORT on A, the same reflectors applied to b (d = Qᵀb), then UTRIS on the first n rows; r = ‖d(n+1:m)‖ is the minimal residual.',
    },
    cost: { ro: '2(mn² - n³/3) flopi', en: '2(mn² - n³/3) flops' },
    sursa: `p ← min(m-1, n)
fie U[m,p], β[p]
pentru k = 1 : p
    σ ← sgn(a_kk) ‖A(k:m, k)‖
    dacă σ = 0 atunci β_k ← 0
    altfel
        u_kk ← a_kk + σ
        u_ik ← a_ik, i = k+1 : m
        β_k ← σ u_kk
        a_kk ← -σ
        a_ik ← 0, i = k+1 : m
        pentru j = k+1 : n
            τ ← (Σ_{i=k}^{m} u_ik a_ij) / β_k
            pentru i = k : m
                a_ij ← a_ij - τ u_ik
pentru k = 1 : n
    τ ← (Σ_{i=k}^{m} u_ik b_i) / β_k
    pentru i = k : m
        b_i ← b_i - τ u_ik
fie x[n]
pentru i = n : -1 : 1
    x_i ← b_i
    pentru j = i+1 : n
        x_i ← x_i - a_ij x_j
    x_i ← x_i / a_ii
r ← ‖b(n+1:m)‖`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[2, 3], [-1, 1], [2, -1]], descriere: { ro: 'm x n, cu m > n și coloane independente', en: 'm x n, with m > n and independent columns' } },
      { nume: 'b', tip: 'vector', exemplu: [1, 2, 3], descriere: { ro: 'm', en: 'm' } },
    ],
  },
  {
    id: 'MP',
    notiuni: ['valoare_proprie', 'norma', 'produs_scalar', 'metoda_puterii'],
    titlu: { ro: 'MP, metoda puterii', en: 'MP, power method' },
    descriere: {
      ro: 'Vectorul propriu unitar al valorii proprii dominante: y ← Ay normat, până când direcția nu se mai schimbă.',
      en: 'The unit eigenvector of the dominant eigenvalue: y ← Ay normalized, until the direction stops changing.',
    },
    cost: { ro: '2n² flopi pe iterație', en: '2n² flops per iteration' },
    sursa: `y ← y / ‖y‖; i ← 0; e ← 1
cât timp e > tol
    dacă i > maxiter atunci stop 'nu a convers în maxiter iterații'
    z ← A y
    z ← z / ‖z‖
    e ← |1 - |z^T y||
    y ← z; i ← i + 1`,
    intrari: [
      { nume: 'A', tip: 'matrice', exemplu: [[2, 1], [1, 2]], descriere: { ro: 'n x n', en: 'n x n' } },
      { nume: 'y', tip: 'vector', exemplu: [1, 0], descriere: { ro: 'n, vectorul de pornire', en: 'n, the starting vector' } },
      { nume: 'tol', tip: 'scalar', exemplu: 1e-6, descriere: { ro: 'toleranța', en: 'tolerance' } },
      { nume: 'maxiter', tip: 'scalar', exemplu: 50, descriere: { ro: 'numărul maxim de iterații', en: 'maximum number of iterations' } },
    ],
  },
]

export const algoritm = (id: string): Algoritm | undefined => BIBLIOTECA.find((a) => a.id === id)
