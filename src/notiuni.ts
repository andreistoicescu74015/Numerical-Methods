// Notiunile de baza de care are nevoie un incepator ca sa urmareasca algoritmii, pe scurt: ce
// spun slide-urile cursului din anul curent si cartea cursului. Unde un enunt vine din carte si
// nu din slide-uri, textul o spune.
import type { Limba } from './motor/mesaje'

type Text = Record<Limba, string>

export interface Notiune {
  id: string
  grup: string
  titlu: Text
  text: Text
  // formula KaTeX, afisata sub text
  formula?: string
  exemplu?: Text
}

export const GRUPURI: { id: string; titlu: Text }[] = [
  { id: 'notatii', titlu: { ro: 'Notații', en: 'Notation' } },
  { id: 'operatii', titlu: { ro: 'Operații de bază', en: 'Basic operations' } },
  { id: 'sisteme', titlu: { ro: 'Sisteme liniare', en: 'Linear systems' } },
  { id: 'factorizari', titlu: { ro: 'Factorizări', en: 'Factorizations' } },
  { id: 'iterative', titlu: { ro: 'Metode iterative', en: 'Iterative methods' } },
  { id: 'ortogonal', titlu: { ro: 'Ortogonalitate și cele mai mici pătrate', en: 'Orthogonality and least squares' } },
  { id: 'proprii', titlu: { ro: 'Valori proprii', en: 'Eigenvalues' } },
  { id: 'pseudocod', titlu: { ro: 'Pseudocod, cost și culori', en: 'Pseudocode, cost and colours' } },
]

export const NOTIUNI: Notiune[] = [
  {
    id: 'vector',
    grup: 'notatii',
    titlu: { ro: 'Vector', en: 'Vector' },
    text: {
      ro: 'Un vector x din Rⁿ este o coloană de n numere; x_i este al i-lea număr. În curs vectorii sunt mereu coloane, iar xᵀ este același vector scris pe un rând.',
      en: 'A vector x in Rⁿ is a column of n numbers; x_i is the i-th one. In the course vectors are always columns, and xᵀ is the same vector written as a row.',
    },
    formula: 'x = \\begin{bmatrix} x_1 \\\\ \\vdots \\\\ x_n \\end{bmatrix}, \\qquad x^T = \\begin{bmatrix} x_1 & \\cdots & x_n \\end{bmatrix}',
  },
  {
    id: 'matrice',
    grup: 'notatii',
    titlu: { ro: 'Matrice și blocuri', en: 'Matrix and blocks' },
    text: {
      ro: 'O matrice A de tip m × n are m linii și n coloane; a_ij stă pe linia i, coloana j. A(i, :) este linia i, A(:, j) coloana j, iar A(i₁:i₂, j₁:j₂) blocul dintre liniile i₁..i₂ și coloanele j₁..j₂.',
      en: 'An m × n matrix A has m rows and n columns; a_ij sits in row i, column j. A(i, :) is row i, A(:, j) is column j, and A(i₁:i₂, j₁:j₂) is the block between rows i₁..i₂ and columns j₁..j₂.',
    },
    formula: 'A = \\begin{bmatrix} a_{11} & \\cdots & a_{1n} \\\\ \\vdots & & \\vdots \\\\ a_{m1} & \\cdots & a_{mn} \\end{bmatrix}',
  },
  {
    id: 'indici',
    grup: 'notatii',
    titlu: { ro: 'Indici și intervale', en: 'Indices and ranges' },
    text: {
      ro: 'Indicii pornesc de la 1. "i = 1 : n" înseamnă că i ia pe rând valorile 1, 2, ..., n; "i = n : -1 : 1" numără în jos. Un interval gol, ca j = 1 : 0, nu produce nicio iterație, iar o sumă pe el este 0. În Python și NumPy indicii pornesc de la 0: "i = 1 : n" devine range(n), deci i ia valorile 0, ..., n − 1, iar a_ij se scrie A[i, j] cu acești indici mutați cu 1 (elementul a_11 este A[0, 0]).',
      en: 'Indices start at 1. "i = 1 : n" means i takes the values 1, 2, ..., n in turn; "i = n : -1 : 1" counts down. An empty range such as j = 1 : 0 gives no iteration, and a sum over it is 0. In Python and NumPy indices start at 0: "i = 1 : n" becomes range(n), so i takes the values 0, ..., n − 1, and a_ij is written A[i, j] with these indices shifted by 1 (the entry a_11 is A[0, 0]).',
    },
  },
  {
    id: 'transpusa',
    grup: 'notatii',
    titlu: { ro: 'Transpusa și simetria', en: 'Transpose and symmetry' },
    text: {
      ro: 'Aᵀ schimbă liniile cu coloanele: elementul (i, j) al lui Aᵀ este a_ji. Regula de transpunere a unui produs inversează ordinea. O matrice este simetrică dacă A = Aᵀ.',
      en: 'Aᵀ swaps rows and columns: entry (i, j) of Aᵀ is a_ji. Transposing a product reverses the order. A matrix is symmetric when A = Aᵀ.',
    },
    formula: '(AB)^T = B^T A^T',
  },
  {
    id: 'triunghiulara',
    grup: 'notatii',
    titlu: { ro: 'Matrice triunghiulară', en: 'Triangular matrix' },
    text: {
      ro: 'L este inferior triunghiulară dacă are zerouri deasupra diagonalei (l_ij = 0 pentru i < j); U este superior triunghiulară dacă are zerouri sub diagonală. O matrice triunghiulară este nesingulară exact când niciun element de pe diagonală nu este 0, iar determinantul ei este produsul diagonalei.',
      en: 'L is lower triangular when it has zeros above the diagonal (l_ij = 0 for i < j); U is upper triangular when it has zeros below. A triangular matrix is nonsingular exactly when no diagonal entry is 0, and its determinant is the product of the diagonal.',
    },
    formula: 'L = \\begin{bmatrix} l_{11} & 0 & 0 \\\\ l_{21} & l_{22} & 0 \\\\ l_{31} & l_{32} & l_{33} \\end{bmatrix}, \\qquad U = \\begin{bmatrix} u_{11} & u_{12} & u_{13} \\\\ 0 & u_{22} & u_{23} \\\\ 0 & 0 & u_{33} \\end{bmatrix}',
  },
  {
    id: 'lider',
    grup: 'notatii',
    titlu: { ro: 'Submatrice lider principală', en: 'Leading principal submatrix' },
    text: {
      ro: 'A[k] este colțul din stânga sus al lui A: primele k linii și primele k coloane. Eliminarea gaussiană fără pivotare și factorizarea LU merg până la capăt exact când A[1], ..., A[n-1] sunt nesingulare: dacă A[k] este singulară, pivotul de la pasul k iese 0.',
      en: 'A[k] is the top left corner of A: the first k rows and the first k columns. Gaussian elimination without pivoting and the LU factorization run to the end exactly when A[1], ..., A[n-1] are nonsingular: if A[k] is singular, the pivot of step k comes out 0.',
    },
    formula: 'A^{[k]} = A(1\\!:\\!k,\\, 1\\!:\\!k)',
    exemplu: {
      ro: 'Exemplul din curs: pentru A = [1 2 1; 2 1 2; 1 1 2], A[1] = [1] și A[2] = [1 2; 2 1] au determinanții 1 și −3, deci eliminarea merge până la capăt.',
      en: 'The course example: for A = [1 2 1; 2 1 2; 1 1 2], A[1] = [1] and A[2] = [1 2; 2 1] have determinants 1 and −3, so elimination runs to the end.',
    },
  },
  {
    id: 'banda',
    grup: 'notatii',
    titlu: { ro: 'Matrice bandă, tridiagonală, Hessenberg', en: 'Banded, tridiagonal and Hessenberg matrices' },
    text: {
      ro: 'O matrice bandă are elementele nenule doar lângă diagonală: cel mult r diagonale sub ea și q deasupra, adică a_ij = 0 când i − j > r sau j − i > q. Tridiagonala are r = q = 1; superior Hessenberg are r = 1 și q = n − 1, deci zerouri doar sub prima subdiagonală. Cartea cursului arată că eliminarea gaussiană fără pivotare păstrează banda (U are q diagonale deasupra, multiplicatorii stau pe r poziții sub diagonală), deci buclele se pot opri la marginea benzii; cartea spune că atunci costul este mult sub 2n³/3, iar numărând buclele algoritmului Gb ies ≈ n(2rq + r) flopi. Cu pivotare parțială, banda de deasupra se poate lărgi până la q + r.',
      en: 'A banded matrix has its nonzero entries only near the diagonal: at most r diagonals below it and q above, that is a_ij = 0 when i − j > r or j − i > q. A tridiagonal matrix has r = q = 1; an upper Hessenberg one has r = 1 and q = n − 1, so zeros only below the first subdiagonal. The book of the course shows that Gaussian elimination without pivoting keeps the band (U has q diagonals above, the multipliers sit in r positions below the diagonal), so the loops can stop at the edge of the band; the book says the cost is then far below 2n³/3, and counting the loops of algorithm Gb gives ≈ n(2rq + r) flops. With partial pivoting, the band above can widen up to q + r.',
    },
    formula: 'a_{ij} = 0 \\;\\text{pentru}\\; i - j > r \\;\\text{sau}\\; j - i > q, \\qquad T = \\begin{bmatrix} \\times & \\times & 0 & 0 \\\\ \\times & \\times & \\times & 0 \\\\ 0 & \\times & \\times & \\times \\\\ 0 & 0 & \\times & \\times \\end{bmatrix}',
  },
  {
    id: 'identitate',
    grup: 'notatii',
    titlu: { ro: 'Matricea unitate și inversa', en: 'Identity and inverse' },
    text: {
      ro: 'I_n are 1 pe diagonală și 0 în rest; I A = A I = A. Inversa A⁻¹ există doar pentru matrice pătrate nesingulare și satisface A A⁻¹ = I. Cursul nu rezolvă sisteme calculând inversa: inversarea costă de aproximativ trei ori mai mult decât rezolvarea unui sistem de aceeași dimensiune, deci se înlocuiește, unde se poate, cu rezolvarea de sisteme.',
      en: 'I_n has 1 on the diagonal and 0 elsewhere; I A = A I = A. The inverse A⁻¹ exists only for square nonsingular matrices and satisfies A A⁻¹ = I. The course does not solve systems by computing the inverse: inversion costs about three times as much as solving a system of the same size, so it is replaced, wherever possible, by solving systems.',
    },
  },
  {
    id: 'pozitiv_definita',
    grup: 'notatii',
    titlu: { ro: 'Matrice pozitiv definită', en: 'Positive definite matrix' },
    text: {
      ro: 'O matrice simetrică A este pozitiv definită dacă xᵀAx > 0 pentru orice x ≠ 0. Echivalent, toate valorile proprii sunt strict pozitive. Exemplu tipic: AᵀA pentru o matrice A cu coloane liniar independente. Factorizarea Cholesky există doar pentru astfel de matrice și o și detectează: dacă α ≤ 0 la un pas, matricea nu e pozitiv definită.',
      en: 'A symmetric matrix A is positive definite when xᵀAx > 0 for every x ≠ 0. Equivalently, all its eigenvalues are strictly positive. A typical example is AᵀA for a matrix A with linearly independent columns. The Cholesky factorization exists only for such matrices and also detects them: if α ≤ 0 at some step, the matrix is not positive definite.',
    },
    formula: 'x^T A x > 0 \\quad \\forall x \\neq 0',
  },
  {
    id: 'ortogonala',
    grup: 'notatii',
    titlu: { ro: 'Matrice ortogonală', en: 'Orthogonal matrix' },
    text: {
      ro: 'Q este ortogonală dacă QᵀQ = I: coloanele ei au norma 1 și sunt perpendiculare două câte două, iar inversa este chiar transpusa. Înmulțirea cu Q nu schimbă lungimile, ‖Qx‖ = ‖x‖. Cartea cursului arată separat că triangularizarea ortogonală (Algoritmul QR) este numeric stabilă.',
      en: 'Q is orthogonal when QᵀQ = I: its columns have norm 1 and are pairwise perpendicular, and the inverse is the transpose itself. Multiplying by Q keeps lengths, ‖Qx‖ = ‖x‖. The book of the course shows separately that orthogonal triangularization (Algorithm QR) is numerically stable.',
    },
    formula: 'Q^T Q = I, \\qquad \\|Qx\\| = \\|x\\|',
  },
  {
    id: 'produs_scalar',
    grup: 'operatii',
    titlu: { ro: 'Produs scalar și ortogonalitate', en: 'Dot product and orthogonality' },
    text: {
      ro: 'xᵀy adună produsele componentelor pereche: n înmulțiri și n - 1 adunări, adică 2n - 1 flopi (cartea cursului numără 2n, pentru că pornește suma de la 0). Doi vectori sunt ortogonali (perpendiculari) când xᵀy = 0. Cosinusul unghiului dintre ei este xᵀy împărțit la produsul normelor.',
      en: 'xᵀy adds the products of paired components: n multiplications and n - 1 additions, that is 2n - 1 flops (the book of the course counts 2n, because it starts the sum from 0). Two vectors are orthogonal (perpendicular) when xᵀy = 0. The cosine of the angle between them is xᵀy divided by the product of the norms.',
    },
    formula: 'x^T y = \\sum_{i=1}^{n} x_i y_i',
    exemplu: { ro: 'Pentru x = (1, 2, 3) și y = (4, 5, 6): 1·4 + 2·5 + 3·6 = 32.', en: 'For x = (1, 2, 3) and y = (4, 5, 6): 1·4 + 2·5 + 3·6 = 32.' },
  },
  {
    id: 'norma',
    grup: 'operatii',
    titlu: { ro: 'Normă', en: 'Norm' },
    text: {
      ro: 'Norma 2 (euclidiană) este lungimea vectorului, radicalul din suma pătratelor; un vector cu norma 1 se numește unitar, iar x / ‖x‖ îl normează. Cursul folosește și norma 1 (suma modulelor) și norma ∞ (cel mai mare modul). Pentru matrice, norma Frobenius ‖A‖_F este radicalul din suma pătratelor tuturor elementelor, iar ‖A‖ fără indice este în curs norma spectrală. În pseudocodul de aici ‖x‖ este norma 2 a unui vector și ‖A‖_F norma Frobenius; norma spectrală nu se calculează, deci ‖A‖ pe o matrice dă eroare.',
      en: 'The 2-norm (Euclidean) is the length of the vector, the square root of the sum of squares; a vector with norm 1 is a unit vector, and x / ‖x‖ normalizes it. The course also uses the 1-norm (sum of absolute values) and the ∞-norm (largest absolute value). For matrices, the Frobenius norm ‖A‖_F is the square root of the sum of squares of all entries, and ‖A‖ with no index is the spectral norm in the course. In the pseudocode here ‖x‖ is the 2-norm of a vector and ‖A‖_F the Frobenius norm; the spectral norm is not computed, so ‖A‖ on a matrix is an error.',
    },
    formula: '\\|x\\|_2 = \\sqrt{x^T x} = \\sqrt{x_1^2 + \\cdots + x_n^2}',
  },
  {
    id: 'matvec',
    grup: 'operatii',
    titlu: { ro: 'Produsul matrice-vector', en: 'Matrix-vector product' },
    text: {
      ro: 'y = Ax are m componente: y_i este produsul scalar dintre linia i a lui A și x. Privit pe coloane, y este suma coloanelor lui A înmulțite cu x_j. Costă 2mn flopi; dacă A are multe zerouri (triunghiulară, tridiagonală) buclele se scurtează.',
      en: 'y = Ax has m components: y_i is the dot product of row i of A with x. Seen by columns, y is the sum of the columns of A scaled by x_j. It costs 2mn flops; when A has many zeros (triangular, tridiagonal) the loops get shorter.',
    },
    formula: 'y_i = \\sum_{j=1}^{n} a_{ij} x_j, \\qquad y = \\sum_{j=1}^{n} x_j\\, A(:, j)',
  },
  {
    id: 'matmul',
    grup: 'operatii',
    titlu: { ro: 'Produsul matrice-matrice', en: 'Matrix-matrix product' },
    text: {
      ro: 'C = AB există doar dacă numărul de coloane ale lui A este egal cu numărul de linii ale lui B; c_ij este produsul scalar dintre linia i a lui A și coloana j a lui B. Costă 2mnl flopi, deci 2n³ pentru matrice pătrate. În general AB ≠ BA.',
      en: 'C = AB exists only when the number of columns of A equals the number of rows of B; c_ij is the dot product of row i of A with column j of B. It costs 2mnl flops, so 2n³ for square matrices. In general AB ≠ BA.',
    },
    formula: 'c_{ij} = \\sum_{k=1}^{l} a_{ik} b_{kj} = A(i, :)\\, B(:, j)',
  },
  {
    id: 'sistem_liniar',
    grup: 'sisteme',
    titlu: { ro: 'Sistem liniar', en: 'Linear system' },
    text: {
      ro: 'Ax = b strânge n ecuații cu n necunoscute într-o singură relație. Are soluție unică pentru orice b exact când A este nesingulară (inversabilă). Metodele directe transformă sistemul într-unul sau două sisteme triunghiulare și le rezolvă prin substituție, fără să calculeze inversa. Pentru sisteme foarte mari se folosesc metode iterative.',
      en: 'Ax = b packs n equations in n unknowns into one relation. It has a unique solution for every b exactly when A is nonsingular (invertible). Direct methods turn the system into one or two triangular systems and solve those by substitution, without computing the inverse. For very large systems iterative methods are used.',
    },
    formula: 'Ax = b, \\qquad A \\in \\mathbb{R}^{n \\times n},\\ x, b \\in \\mathbb{R}^n',
  },
  {
    id: 'substitutie',
    grup: 'sisteme',
    titlu: { ro: 'Substituția înainte și înapoi', en: 'Forward and back substitution' },
    text: {
      ro: 'Un sistem triunghiular se rezolvă cu o necunoscută pe rând. Pentru L inferior triunghiulară prima ecuație dă x_1 = b_1 / l_11, a doua îl folosește pe x_1 și dă x_2, și așa mai departe (LTRIS). Pentru U superior triunghiulară se pornește de la ultima ecuație, x_n = b_n / u_nn, și se urcă (UTRIS). Fiecare costă n² flopi, iar soluția se poate scrie peste b.',
      en: 'A triangular system is solved one unknown at a time. For lower triangular L the first equation gives x_1 = b_1 / l_11, the second uses x_1 and gives x_2, and so on (LTRIS). For upper triangular U you start from the last equation, x_n = b_n / u_nn, and go up (UTRIS). Each costs n² flops, and the solution can overwrite b.',
    },
    formula: 'x_i = \\Bigl(b_i - \\sum_{j=1}^{i-1} l_{ij} x_j\\Bigr) / l_{ii}',
  },
  {
    id: 'eliminare',
    grup: 'sisteme',
    titlu: { ro: 'Eliminarea gaussiană', en: 'Gaussian elimination' },
    text: {
      ro: 'Eliminarea face zerouri sub diagonală, coloană cu coloană: la pasul k, din fiecare linie i > k se scade linia k înmulțită cu multiplicatorul μ_ik = a_ik / a_kk. După n - 1 pași rămâne o matrice superior triunghiulară U; aceleași scăderi se fac și pe b, iar sistemul rămas, Ux = d, se rezolvă cu UTRIS. Multiplicatorii se memorează chiar în locul zerourilor create. Cost: aproximativ 2n³/3 flopi.',
      en: 'Elimination creates zeros below the diagonal, column by column: at step k, row k times the multiplier μ_ik = a_ik / a_kk is subtracted from every row i > k. After n - 1 steps an upper triangular U remains; the same subtractions are applied to b, and the remaining system, Ux = d, is solved with UTRIS. The multipliers are stored right where the zeros were created. Cost: about 2n³/3 flops.',
    },
    formula: '\\mu_{ik} = \\frac{a_{ik}}{a_{kk}}, \\qquad a_{ij} \\leftarrow a_{ij} - \\mu_{ik} a_{kj}',
  },
  {
    id: 'pivot',
    grup: 'sisteme',
    titlu: { ro: 'Pivotul și pivotarea parțială', en: 'The pivot and partial pivoting' },
    text: {
      ro: 'Pivotul este elementul a_kk la care se împarte. Dacă este 0 algoritmul se oprește, iar dacă este foarte mic multiplicatorii devin uriași și erorile de rotunjire se amplifică. Pivotarea parțială alege la fiecare pas, în coloana k, elementul cu modulul cel mai mare de pe sau sub diagonală (la egalitate, primul) și aduce linia lui pe poziția k; astfel toți multiplicatorii au modulul cel mult 1. Vectorul p reține ce linii s-au interschimbat, ca aceleași schimbări să se aplice și lui b.',
      en: 'The pivot is the entry a_kk you divide by. If it is 0 the algorithm stops, and if it is tiny the multipliers become huge and rounding errors grow. Partial pivoting picks, at each step, the entry with the largest absolute value in column k on or below the diagonal (the first one on ties) and moves its row to position k; all multipliers then have absolute value at most 1. The vector p records which rows were swapped, so the same swaps can be applied to b.',
    },
    formula: '|a_{i_k k}| = \\max_{i = k : n} |a_{ik}|',
    exemplu: {
      ro: 'Exemplul din curs: 10⁻⁴x₁ + x₂ = 1, x₁ + x₂ = 2, cu precizia mașinii 10⁻³. Cu pivotul 10⁻⁴ iese x₂ ≈ 1 și x₁ = 0, o soluție falsă; cu ecuațiile schimbate între ele iese x₂ ≈ 1 și x₁ = 1, soluția corectă (cea exactă este x₁ ≈ 1.0001, x₂ ≈ 0.9999).',
      en: 'The course example: 10⁻⁴x₁ + x₂ = 1, x₁ + x₂ = 2, with machine precision 10⁻³. With the pivot 10⁻⁴ you get x₂ ≈ 1 and x₁ = 0, a false solution; with the two equations swapped you get x₂ ≈ 1 and x₁ = 1, the correct solution (the exact one is x₁ ≈ 1.0001, x₂ ≈ 0.9999).',
    },
  },
  {
    id: 'stabilitate',
    grup: 'sisteme',
    titlu: { ro: 'Stabilitate numerică', en: 'Numerical stability' },
    text: {
      ro: 'Calculele se fac cu un număr finit de cifre, deci fiecare operație rotunjește. Cursul spune că stabilitatea exprimă mărimea erorilor numerice introduse de algoritm; cartea cursului numește un algoritm numeric stabil dacă soluția lui calculată este aproape de cea exactă sau este soluția exactă pentru niște date de intrare ușor perturbate. Pentru eliminarea gaussiană, cartea cursului folosește factorul de creștere γ: de câte ori ajung elementele matricei mai mari decât la început. Fără pivotare γ poate fi oricât de mare, de aceea cartea numește G numeric instabil; cu pivotare parțială γ ≤ 2ⁿ⁻¹, margine atinsă foarte rar, de aceea cartea numește GPP "practic stabil". Pentru triangularizarea ortogonală, cartea arată că este numeric stabilă.',
      en: 'Computations use a finite number of digits, so every operation rounds. The course says that stability expresses the size of the numerical errors introduced by the algorithm; the book of the course calls an algorithm numerically stable when its computed solution is close to the exact one, or is the exact solution for slightly perturbed input data. For Gaussian elimination, the book of the course uses the growth factor γ: how many times larger the entries of the matrix become than at the start. Without pivoting γ can be arbitrarily large, which is why the book calls G numerically unstable; with partial pivoting γ ≤ 2ⁿ⁻¹, a bound reached very rarely, which is why the book calls GPP "stable in practice". For orthogonal triangularization, the book shows that it is numerically stable.',
    },
    formula: '\\gamma = \\frac{\\max_{i,j,k} |a_{ij}^{(k)}|}{\\max_{i,j} |a_{ij}|}, \\qquad \\gamma_{\\mathrm{GPP}} \\le 2^{n-1}',
  },
  {
    id: 'conditionare',
    grup: 'sisteme',
    titlu: { ro: 'Numărul de condiționare și reziduul', en: 'Condition number and residual' },
    text: {
      ro: 'Numărul de condiționare κ(A) = ‖A‖·‖A⁻¹‖ măsoară cât de sensibilă este soluția lui Ax = b la mici schimbări ale datelor. Teorema din curs: dacă A și b se schimbă puțin, eroarea relativă a soluției este cel mult κ(A) ori suma schimbărilor relative ale lui A și b. Un κ(A) mic înseamnă o problemă bine condiționată; contează doar A, nu și b. De aici și legătura cu reziduul r = b − Ax̂ al unei soluții calculate x̂: cartea cursului notează că un reziduu mic garantează o soluție precisă doar dacă A este bine condiționată.',
      en: 'The condition number κ(A) = ‖A‖·‖A⁻¹‖ measures how sensitive the solution of Ax = b is to small changes in the data. The theorem of the course: if A and b change a little, the relative error of the solution is at most κ(A) times the sum of the relative changes of A and b. A small κ(A) means a well-conditioned problem; only A matters, not b. Hence the link with the residual r = b − Ax̂ of a computed solution x̂: the book of the course notes that a small residual guarantees an accurate solution only when A is well conditioned.',
    },
    formula: '\\frac{\\|\\Delta x\\|}{\\|x\\|} \\le \\kappa(A) \\left( \\frac{\\|\\Delta A\\|}{\\|A\\|} + \\frac{\\|\\Delta b\\|}{\\|b\\|} \\right), \\qquad \\kappa(A) = \\|A\\|\\, \\|A^{-1}\\|',
  },
  {
    id: 'factorizare',
    grup: 'factorizari',
    titlu: { ro: 'Factorizarea LU', en: 'LU factorization' },
    text: {
      ro: 'Eliminarea gaussiană scrie de fapt A = LU, cu L inferior triunghiulară unitate (cu 1 pe diagonală, formată din multiplicatori) și U superior triunghiulară; aceasta este forma Doolittle. Varianta Crout pune unitatea pe diagonala lui U; cu D = diag(U) din forma Doolittle, L_Crout = L D și U_Crout = D⁻¹U, iar cu D păstrată separat A = LDU, cu ambele triunghiulare unitate (factorizarea LDU din curs). Ambele se scriu peste A. Factorizarea există și este unică exact când submatricele lider principale A[k], k = 1 : n-1, sunt nesingulare; cu pivotare parțială se factorizează PA = LU, pentru orice A nesingulară. Avantajul: factorizezi o dată (≈ 2n³/3 flopi) și apoi rezolvi câte sisteme vrei cu aceeași matrice, fiecare cu două substituții (≈ 2n² flopi).',
      en: 'Gaussian elimination actually writes A = LU, with L unit lower triangular (ones on the diagonal, built from the multipliers) and U upper triangular; this is the Doolittle form. The Crout variant puts the ones on the diagonal of U; with D = diag(U) from the Doolittle form, L_Crout = L D and U_Crout = D⁻¹U, and with D kept apart A = LDU, with both triangular factors unit (the LDU factorization of the course). Both are stored over A. The factorization exists and is unique exactly when the leading principal submatrices A[k], k = 1 : n-1, are nonsingular; with partial pivoting one factorizes PA = LU, for every nonsingular A. The point: factorize once (≈ 2n³/3 flops) and then solve as many systems as you like with the same matrix, each with two substitutions (≈ 2n² flops).',
    },
    formula: 'A = LU, \\qquad Ax = b \\iff Ly = b,\\ Ux = y',
  },
  {
    id: 'cholesky',
    grup: 'factorizari',
    titlu: { ro: 'Factorizarea Cholesky', en: 'Cholesky factorization' },
    text: {
      ro: 'Pentru o matrice simetrică pozitiv definită, A = LLᵀ cu L inferior triunghiulară: un singur factor, fără pivotare, la jumătate din costul lui LU (≈ n³/3 flopi). Elementele lui L se obțin coloană cu coloană din identitatea A = LLᵀ; la fiecare pas, numărul α de sub radical trebuie să fie pozitiv: dacă α ≤ 0, A nu este pozitiv definită și algoritmul se oprește, de aceea este și un test de pozitiv definire.',
      en: 'For a symmetric positive definite matrix, A = LLᵀ with L lower triangular: a single factor, no pivoting, at half the cost of LU (≈ n³/3 flops). The entries of L come column by column from the identity A = LLᵀ; at each step the number α under the square root must be positive: if α ≤ 0, A is not positive definite and the algorithm stops, which is why it is also a test for positive definiteness.',
    },
    formula: 'l_{kk} = \\sqrt{a_{kk} - \\sum_{j=1}^{k-1} l_{kj}^2}, \\qquad l_{ik} = \\Bigl(a_{ik} - \\sum_{j=1}^{k-1} l_{ij} l_{kj}\\Bigr) / l_{kk}',
  },
  {
    id: 'metode_iterative',
    grup: 'iterative',
    titlu: { ro: 'Metode directe și metode iterative', en: 'Direct and iterative methods' },
    text: {
      ro: 'O metodă directă (G, GPP, LU, Cholesky) face un număr de operații cunoscut dinainte și dă soluția abia la capăt. O metodă iterativă pornește de la o aproximare x⁽⁰⁾ și construiește un șir x⁽¹⁾, x⁽²⁾, ... care se apropie de soluție; te oprești când aproximarea este destul de bună, deci numărul de pași depinde de date și de precizia cerută. Cursul recomandă metodele directe pentru sisteme medii (n < 500) și pe cele iterative pentru sisteme foarte mari. Schema din curs: A = M − N, cu M ușor de inversat (diagonală sau triunghiulară), și iterația Mx⁽ᵏ⁺¹⁾ = Nx⁽ᵏ⁾ + b. Convergența este asigurată dacă raza spectrală ρ(M⁻¹N) este sub 1; raza spectrală a unei matrice este cel mai mare modul al valorilor ei proprii. Slide-ul "Comparatie GPP - GS - K" măsoară timpul de rezolvare pe matrice slab diagonal dominante, cu n până la 10000, pe scară logaritmică: timpul lui GPP crește ca n³ și la n = 10000 este cu circa trei ordine de mărime peste cele două metode iterative; Gauss-Seidel este cea mai rapidă la n mic, iar de la câteva mii Kaczmarz și Gauss-Seidel sunt comparabile.',
      en: 'A direct method (G, GPP, LU, Cholesky) performs a number of operations known in advance and gives the solution only at the end. An iterative method starts from an approximation x⁽⁰⁾ and builds a sequence x⁽¹⁾, x⁽²⁾, ... that approaches the solution; you stop when the approximation is good enough, so the number of steps depends on the data and on the accuracy you ask for. The course recommends direct methods for medium systems (n < 500) and iterative ones for very large systems. The scheme of the course: A = M − N, with M easy to invert (diagonal or triangular), and the iteration Mx⁽ᵏ⁺¹⁾ = Nx⁽ᵏ⁾ + b. Convergence is ensured when the spectral radius ρ(M⁻¹N) is below 1; the spectral radius of a matrix is the largest absolute value of its eigenvalues. The slide "Comparatie GPP - GS - K" measures the solution time on weakly diagonally dominant matrices, with n up to 10000, on a logarithmic scale: the time of GPP grows like n³ and at n = 10000 is about three orders of magnitude above the two iterative methods; Gauss-Seidel is the fastest for small n, and from a few thousand on Kaczmarz and Gauss-Seidel are comparable.',
    },
    formula: 'x^{(k+1)} = B\\, x^{(k)} + c, \\qquad B = M^{-1} N, \\quad c = M^{-1} b, \\qquad \\rho(B) < 1',
  },
  {
    id: 'jacobi',
    grup: 'iterative',
    titlu: { ro: 'Metoda Jacobi', en: 'The Jacobi method' },
    text: {
      ro: 'M este diagonala lui A. Ecuația i se rezolvă pentru x_i, cu toate celelalte necunoscute luate din iterația precedentă; de aceea valorile noi se strâng într-un al doilea vector. Cere a_ii ≠ 0. Converge dacă A este strict diagonal dominantă: pe fiecare linie, modulul elementului diagonal este mai mare decât suma modulelor celorlalte.',
      en: 'M is the diagonal of A. Equation i is solved for x_i, with all the other unknowns taken from the previous iteration; this is why the new values are collected in a second vector. It needs a_ii ≠ 0. It converges when A is strictly diagonally dominant: in every row, the absolute value of the diagonal entry exceeds the sum of the absolute values of the others.',
    },
    formula: 'x_i^{(k+1)} = \\frac{b_i - \\sum_{j \\ne i} a_{ij}\\, x_j^{(k)}}{a_{ii}}, \\qquad |a_{ii}| > \\sum_{j \\ne i} |a_{ij}|',
    exemplu: {
      ro: 'Exemplul din curs: A = [2 1; 5 7], b = (11, 13), x⁽⁰⁾ = (1, 1) dă x⁽¹⁾ = (5, 8/7) și x⁽²⁾ = (69/14, −12/7); soluția este (64/9, −29/9). În forma matriceală, B = D⁻¹N = [0 −1/2; −5/7 0] și c = D⁻¹b = (11/2, 13/7), ca pe slide.',
      en: 'The course example: A = [2 1; 5 7], b = (11, 13), x⁽⁰⁾ = (1, 1) gives x⁽¹⁾ = (5, 8/7) and x⁽²⁾ = (69/14, −12/7); the solution is (64/9, −29/9). In matrix form, B = D⁻¹N = [0 −1/2; −5/7 0] and c = D⁻¹b = (11/2, 13/7), as on the slide.',
    },
  },
  {
    id: 'gauss_seidel',
    grup: 'iterative',
    titlu: { ro: 'Metoda Gauss-Seidel', en: 'The Gauss-Seidel method' },
    text: {
      ro: 'M este triunghiul inferior al lui A, cu diagonală. Diferența față de Jacobi: x_i nou se folosește imediat la ecuațiile următoare, deci vectorul se actualizează pe loc. Cere a_ii ≠ 0. Converge dacă A este strict diagonal dominantă sau pozitiv definită.',
      en: 'M is the lower triangle of A, with the diagonal. The difference from Jacobi: the new x_i is used at once in the following equations, so the vector is updated in place. It needs a_ii ≠ 0. It converges when A is strictly diagonally dominant or positive definite.',
    },
    formula: 'x_i^{(k+1)} = \\frac{b_i - \\sum_{j<i} a_{ij}\\, x_j^{(k+1)} - \\sum_{j>i} a_{ij}\\, x_j^{(k)}}{a_{ii}}',
    exemplu: {
      ro: 'Exemplul din curs: A = [16 3; 7 −11], b = (11, 13), x⁽⁰⁾ = (1, 1) dă x⁽¹⁾ = (0.5, −0.8636) și x⁽²⁾ = (0.8494, −0.6413); soluția este (0.8122, −0.6650). În forma matriceală, L⁻¹U = [0 −0.1875; 0 −0.1193] și L⁻¹b = (0.6875, −0.7443). Slide-ul afișează toate valorile trunchiate la două zecimale.',
      en: 'The course example: A = [16 3; 7 −11], b = (11, 13), x⁽⁰⁾ = (1, 1) gives x⁽¹⁾ = (0.5, −0.8636) and x⁽²⁾ = (0.8494, −0.6413); the solution is (0.8122, −0.6650). In matrix form, L⁻¹U = [0 −0.1875; 0 −0.1193] and L⁻¹b = (0.6875, −0.7443). The slide shows all the values truncated to two decimals.',
    },
  },
  {
    id: 'kaczmarz',
    grup: 'iterative',
    titlu: { ro: 'Metoda Kaczmarz', en: 'The Kaczmarz method' },
    text: {
      ro: 'Fiecare ecuație a_iᵀx = b_i, unde a_iᵀ este linia i a lui A, descrie o dreaptă în plan când sunt două necunoscute și un plan în spațiu când sunt trei; soluția stă la intersecția lor. Un pas ia o ecuație și mută x pe dreapta (planul) ei, pe drumul cel mai scurt, adică perpendicular. Trecând pe rând prin ecuații, x se apropie de intersecție. Un pas folosește o singură linie a lui A și costă O(n) operații; cursul o numește una dintre cele mai eficiente metode în contextul Big Data. Liniile se pot lua ciclic sau aleator.',
      en: 'Each equation a_iᵀx = b_i, where a_iᵀ is row i of A, describes a line in the plane when there are two unknowns and a plane in space when there are three; the solution lies at their intersection. One step takes an equation and moves x onto its line (plane) along the shortest path, that is perpendicularly. Going through the equations in turn, x approaches the intersection. One step uses a single row of A and costs O(n) operations; the course calls it one of the most efficient methods in the context of Big Data. The rows can be taken cyclically or at random.',
    },
    formula: 'x \\leftarrow x - \\frac{a_i^T x - b_i}{\\|a_i\\|^2}\\, a_i',
    exemplu: {
      ro: 'Pentru 2x₁ + x₂ = 5 și x pornit din (0, 0): a = (2, 1), aᵀx − b = −5, ‖a‖² = 5, deci x devine (0, 0) + 1·(2, 1) = (2, 1), care satisface ecuația: 2·2 + 1 = 5.',
      en: 'For 2x₁ + x₂ = 5 and x started at (0, 0): a = (2, 1), aᵀx − b = −5, ‖a‖² = 5, so x becomes (0, 0) + 1·(2, 1) = (2, 1), which satisfies the equation: 2·2 + 1 = 5.',
    },
  },
  {
    id: 'criteriu_oprire',
    grup: 'iterative',
    titlu: { ro: 'Criteriul de oprire', en: 'The stopping criterion' },
    text: {
      ro: 'O metodă iterativă nu știe singură când a ajuns destul de aproape de soluție, deci are nevoie de un test. Pentru Ax = b, cursul cere ca norma reziduului ‖Ax − b‖ să fie mică (cu semnul schimbat, b − Ax, norma este aceeași); aici ea se raportează la ‖b‖, ca toleranța să nu depindă de mărimea datelor. Reziduul nu este eroarea: cartea cursului arată că ‖x − x̂‖/‖x‖ ≤ κ(A)‖r‖/‖b‖, deci cât de aproape este x de soluție depinde și de condiționarea lui A. La metoda puterii se măsoară cât s-a mai schimbat direcția vectorului. Toleranța se alege între 0 și 1; un prag sub precizia calculatorului (circa 10⁻¹⁶ pentru numerele din Python) nu poate fi atins în general, din cauza rotunjirilor. Un număr maxim de iterații oprește bucla când metoda nu converge. Panoul "Convergență" arată mărimea testată la fiecare iterație, față de toleranță.',
      en: 'An iterative method does not know by itself when it is close enough to the solution, so it needs a test. For Ax = b, the course asks for the norm of the residual ‖Ax − b‖ to be small (with the opposite sign, b − Ax, the norm is the same); here it is divided by ‖b‖, so that the tolerance does not depend on the size of the data. The residual is not the error: the book of the course shows that ‖x − x̂‖/‖x‖ ≤ κ(A)‖r‖/‖b‖, so how close x is to the solution also depends on the conditioning of A. For the power method one measures how much the direction of the vector still changed. The tolerance is chosen between 0 and 1; a threshold below the precision of the computer (about 10⁻¹⁶ for Python numbers) cannot be reached in general, because of rounding. A maximum number of iterations stops the loop when the method does not converge. The "Convergence" panel shows the tested quantity at every iteration, against the tolerance.',
    },
    formula: '\\frac{\\|A x^{(k)} - b\\|}{\\|b\\|} \\le \\mathit{tol}',
  },
  {
    id: 'reflector',
    grup: 'ortogonal',
    titlu: { ro: 'Reflectorul Householder', en: 'Householder reflector' },
    text: {
      ro: 'Un reflector este o matrice U = I − uuᵀ/β, cu β = ‖u‖²/2; este simetrică și ortogonală. Pentru un vector x, u se poate alege astfel încât Ux = (−σ, 0, ..., 0): toate componentele de sub prima devin zero dintr-odată. Propoziția din curs: σ = sgn(x₁)‖x‖, u este x cu σ adunat la prima componentă, iar β = σu₁. Cursul scalează apoi vectorul, împărțindu-l la σ: u₁ = 1 + x₁/σ, u_i = x_i/σ și β = u₁; reflectorul rămâne același, iar pe lângă vector se memorează un singur număr. Matricea U nu se formează: pe un vector y se aplică prin y − νu, cu ν = uᵀy/β. Reflectorul de indice k lasă primele k − 1 componente neschimbate și face zerouri sub poziția k.',
      en: 'A reflector is a matrix U = I − uuᵀ/β, with β = ‖u‖²/2; it is symmetric and orthogonal. For a vector x, u can be chosen so that Ux = (−σ, 0, ..., 0): all components below the first become zero at once. The proposition of the course: σ = sgn(x₁)‖x‖, u is x with σ added to its first component, and β = σu₁. The course then scales the vector, dividing it by σ: u₁ = 1 + x₁/σ, u_i = x_i/σ and β = u₁; the reflector stays the same, and a single number is stored besides the vector. The matrix U is not formed: it is applied to a vector y by y − νu, with ν = uᵀy/β. The reflector of index k leaves the first k − 1 components unchanged and creates zeros below position k.',
    },
    formula: 'U = I - \\frac{u u^T}{\\beta}, \\qquad \\beta = \\frac{\\|u\\|^2}{2}, \\qquad Ux = (-\\sigma, 0, \\dots, 0)^T',
    exemplu: {
      ro: 'Exemplul din curs: pentru x = (2, −1, 2), σ = 3, vectorul scalat este u = (5/3, −1/3, 2/3), β = 5/3 și Ux = (−3, 0, 0).',
      en: 'The course example: for x = (2, −1, 2), σ = 3, the scaled vector is u = (5/3, −1/3, 2/3), β = 5/3 and Ux = (−3, 0, 0).',
    },
  },
  {
    id: 'qr',
    grup: 'ortogonal',
    titlu: { ro: 'Triangularizarea ortogonală (QR)', en: 'Orthogonal triangularization (QR)' },
    text: {
      ro: 'Aplicând câte un reflector pe fiecare coloană, U_s ··· U_1 A = R cu R superior triunghiulară, deci A = QR cu Q = U_1 ··· U_s ortogonală; sunt s = min(m − 1, n) reflectori. Algoritmul QR din curs scrie R peste triunghiul superior al lui A și păstrează sub diagonală, în locul zerourilor, vectorii Householder scalați; u_kk se ține separat, în β_k. Costă ≈ 2(mn² − n³/3) flopi; pentru o matrice pătrată, dublu față de eliminarea gaussiană, de aceea cursul îl folosește mai ales pentru problema celor mai mici pătrate.',
      en: 'Applying one reflector per column gives U_s ··· U_1 A = R with R upper triangular, so A = QR with Q = U_1 ··· U_s orthogonal; there are s = min(m − 1, n) reflectors. Algorithm QR of the course writes R over the upper triangle of A and keeps below the diagonal, in place of the zeros, the scaled Householder vectors; u_kk is kept separately, in β_k. It costs ≈ 2(mn² − n³/3) flops; for a square matrix, twice as much as Gaussian elimination, which is why the course uses it mostly for the least squares problem.',
    },
    formula: 'Q^T A = R, \\qquad Q = U_1 U_2 \\cdots U_s',
  },
  {
    id: 'cmmp',
    grup: 'ortogonal',
    titlu: { ro: 'Cele mai mici pătrate (CMMP)', en: 'Least squares' },
    text: {
      ro: 'Când sunt mai multe ecuații decât necunoscute (m > n), Ax = b nu are în general soluție; se caută x care face reziduul r = b − Ax cât mai scurt. Teorema din curs: soluția este unică exact când coloanele lui A sunt liniar independente (A este monică), adică niciuna nu este o combinație a celorlalte, și atunci x* = (AᵀA)⁻¹Aᵀb = A⁺b, cu A⁺ pseudoinversa lui A. Se obține cu QR (Algoritmul SQR), fără AᵀA: d = Qᵀb, apoi sistemul superior triunghiular format din primele n linii, R′x = d′; norma restului lui d este lungimea reziduului minim. La soluție, reziduul este perpendicular pe coloanele lui A. Regula de aur din curs: nu se formează AᵀA, care este rău condiționată; se lucrează direct pe A. Teorema factorizării QR (slide-ul "Factorizarea QR: m ≥ n"): A = Q′R′ cu Q′ având coloanele ortogonale; R′ este inversabilă exact când A este monică, iar factorizarea este unică dacă R′ are diagonala pozitivă.',
      en: 'With more equations than unknowns (m > n), Ax = b usually has no solution; you look for the x that makes the residual r = b − Ax as short as possible. The theorem of the course: the solution is unique exactly when the columns of A are linearly independent (A is monic), that is none of them is a combination of the others, and then x* = (AᵀA)⁻¹Aᵀb = A⁺b, with A⁺ the pseudoinverse of A. QR gives it (Algorithm SQR), without AᵀA: d = Qᵀb, then the upper triangular system formed by the first n rows, R′x = d′; the norm of the rest of d is the length of the minimal residual. At the solution, the residual is perpendicular to the columns of A. The golden rule of the course: AᵀA, which is ill conditioned, is not formed; one works directly on A. The QR factorization theorem (slide "Factorizarea QR: m ≥ n"): A = Q′R′ with Q′ having orthogonal columns; R′ is invertible exactly when A is monic, and the factorization is unique if R′ has a positive diagonal.',
    },
    formula: '\\min_x \\|b - Ax\\|, \\qquad A^T (b - Ax) = 0',
    exemplu: {
      ro: 'Exemplul din curs: A = [2 3; −1 1; 2 −1], b = (1, 2, 3). Slide-ul obține x ≈ (0.65, 0.003) și ‖d"‖ ≈ 3.14, pentru că lucrează cu Qᵀ scris cu două zecimale; exact, x = (2/3, 0), cu reziduul minim √10 ≈ 3.16.',
      en: 'The course example: A = [2 3; −1 1; 2 −1], b = (1, 2, 3). The slide gets x ≈ (0.65, 0.003) and ‖d"‖ ≈ 3.14, because it works with Qᵀ written with two decimals; exactly, x = (2/3, 0), with minimal residual √10 ≈ 3.16.',
    },
  },
  {
    id: 'valoare_proprie',
    grup: 'proprii',
    titlu: { ro: 'Valori și vectori proprii', en: 'Eigenvalues and eigenvectors' },
    text: {
      ro: 'v ≠ 0 este vector propriu al lui A cu valoarea proprie λ dacă Av = λv: înmulțirea cu A îl lasă pe aceeași dreaptă, doar îl scalează cu λ (îl întoarce dacă λ < 0, îl anulează dacă λ = 0). O matrice n × n are n valori proprii, posibil complexe sau repetate; pentru matrice simetrice ele sunt reale și există n vectori proprii ortogonali. λ₁ este dominantă dacă |λ₁| > |λ₂| ≥ ... .',
      en: 'v ≠ 0 is an eigenvector of A with eigenvalue λ when Av = λv: multiplying by A keeps it on the same line and only scales it by λ (flips it when λ < 0, annihilates it when λ = 0). An n × n matrix has n eigenvalues, possibly complex or repeated; for symmetric matrices they are real and there are n orthogonal eigenvectors. λ₁ is dominant when |λ₁| > |λ₂| ≥ ... .',
    },
    formula: 'Av = \\lambda v, \\quad v \\neq 0',
  },
  {
    id: 'metoda_puterii',
    grup: 'proprii',
    titlu: { ro: 'Metoda puterii', en: 'The power method' },
    text: {
      ro: 'Ipotezele din curs: A are o valoare proprie dominantă, |λ₁| > |λ₂| ≥ ... ≥ |λₙ|, vectorii ei proprii formează o bază, iar vectorul de pornire y are o componentă pe direcția vectorului propriu dominant (un vector ales aleator o are aproape sigur). Se repetă y ← Ay / ‖Ay‖: componenta pe direcția dominantă crește cel mai repede, așa că y se aliniază cu vectorul propriu dominant, cu rata |λ₂/λ₁| pe iterație. Algoritmul dă vectorul propriu; valoarea proprie se obține apoi din câtul Rayleigh λ = yᵀAy (y având norma 1), pe care cursul îl folosește ca deplasare în metoda puterii inverse (MPI). Oprirea se face când direcția nu se mai schimbă: |1 - |zᵀy|| sub toleranță. Fiecare iterație costă cât un produs matrice-vector, aproximativ 2n² flopi.',
      en: 'The hypotheses of the course: A has a dominant eigenvalue, |λ₁| > |λ₂| ≥ ... ≥ |λₙ|, its eigenvectors form a basis, and the starting vector y has a component along the dominant eigenvector (a vector chosen at random almost surely has one). Repeat y ← Ay / ‖Ay‖: the component along the dominant direction grows fastest, so y lines up with the dominant eigenvector, at rate |λ₂/λ₁| per iteration. The algorithm gives the eigenvector; the eigenvalue is then obtained from the Rayleigh quotient λ = yᵀAy (y having norm 1), which the course uses as the shift in the inverse power method (MPI). You stop when the direction no longer changes: |1 - |zᵀy|| below the tolerance. Each iteration costs one matrix-vector product, about 2n² flops.',
    },
    formula: 'y \\leftarrow \\frac{Ay}{\\|Ay\\|}, \\qquad \\lambda \\approx y^T A y',
  },
  {
    id: 'flop',
    grup: 'pseudocod',
    titlu: { ro: 'Flopi și cost', en: 'Flops and cost' },
    text: {
      ro: 'Un flop este o operație aritmetică elementară în virgulă mobilă: adunare, scădere, înmulțire sau împărțire. Costul unui algoritm numără flopii și păstrează termenul cu puterea cea mai mare: n² pentru substituții, ≈ 2n³/3 pentru eliminare, ≈ n³/3 pentru Cholesky; de aceea formulele au semnul ≈, iar contorul de aici, care numără exact, dă pentru matrice mici un număr puțin diferit. Ca în cartea cursului, contorul nu numără ca flopi radicalii (la Cholesky cartea dă separat "n rădăcini pătrate"), aritmetica pe indici și contoare (k ← k + 1) și scăderea unei sume goale (a − 0).',
      en: 'A flop is one elementary floating point arithmetic operation: addition, subtraction, multiplication or division. The cost of an algorithm counts flops and keeps the term with the highest power: n² for substitutions, ≈ 2n³/3 for elimination, ≈ n³/3 for Cholesky; this is why the formulas carry the ≈ sign, and the counter here, which counts exactly, gives a slightly different number for small matrices. As in the book of the course, the counter does not count as flops the square roots (for Cholesky the book gives "n square roots" separately), the arithmetic on indices and counters (k ← k + 1) and the subtraction of an empty sum (a − 0).',
    },
  },
  {
    id: 'pseudocod',
    grup: 'pseudocod',
    titlu: { ro: 'Cum citești pseudocodul', en: 'How to read the pseudocode' },
    text: {
      ro: '"x ← e" calculează e cu valorile vechi și apoi scrie rezultatul în x. "a_ik ← μ_ik = a_ik / a_kk" scrie peste a_ik, iar numele din mijloc spune ce reprezintă valoarea nouă. "a ↔ b" interschimbă. Liniile indentate sub "pentru" formează corpul buclei; "dacă ... atunci" execută corpul doar când condiția e adevărată; "cât timp" repetă corpul cât timp condiția rămâne adevărată. Algoritmii scriu rezultatul peste matricea de intrare ("L, U peste A"), ca în curs.',
      en: '"x ← e" evaluates e with the old values and then stores the result in x. "a_ik ← μ_ik = a_ik / a_kk" overwrites a_ik, and the name in the middle says what the new value means. "a ↔ b" swaps. The lines indented under "for" form the loop body; "if ... then" runs the body only when the condition holds; "while" repeats the body as long as the condition stays true. Algorithms write their result over the input matrix ("L, U over A"), as in the course.',
    },
  },
  {
    id: 'culori',
    grup: 'pseudocod',
    titlu: { ro: 'Culorile și contururile din animație', en: 'The colours and outlines in the animation' },
    text: {
      ro: 'Fiecare rol are o culoare și un contur, ca să se distingă și fără culori. Roșu, contur dublu: pivotul, elementul la care se împarte sau cel ales de argmax. Portocaliu, contur gros: ce se scrie la pasul curent; cât rezultatul e ascuns, celula arată "?". Albastru, contur întrerupt: ce se citește la pasul curent. Verde, colț marcat: calculat la pașii dinainte și nu se mai schimbă. Mov, litera μ în colț: multiplicator, păstrat pentru mai târziu. Fără culoare: nu participă la pasul curent; are valoarea de la intrare sau una intermediară, care se mai schimbă. În formula pasului, ținta este îngroșată, pivotul încadrat și elementele citite subliniate punctat.',
      en: 'Every role has a colour and an outline, so that it can be told apart without colours too. Red, double outline: the pivot, the element you divide by or the one picked by argmax. Orange, thick outline: written at the current step; while the result is hidden, the cell shows "?". Blue, dashed outline: read at the current step. Green, marked corner: computed at earlier steps and final. Purple, the letter μ in the corner: a multiplier, kept for later. No colour: not involved in the current step; it holds the input value or an intermediate one that will still change. In the step formula the target is bold, the pivot is boxed and the elements read have a dotted underline.',
    },
  },
]

export const notiune = (id: string): Notiune | undefined => NOTIUNI.find((n) => n.id === id)
