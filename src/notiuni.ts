// Notiunile de baza de care are nevoie un incepator ca sa urmareasca algoritmii: ce spun
// slide-urile de notatii din cursul I, laboratorul 2 si anexa cu pseudocod, pe scurt.
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
    formula: 'x = \\begin{pmatrix} x_1 \\\\ \\vdots \\\\ x_n \\end{pmatrix}, \\qquad x^T = (x_1, \\dots, x_n)',
  },
  {
    id: 'matrice',
    grup: 'notatii',
    titlu: { ro: 'Matrice și blocuri', en: 'Matrix and blocks' },
    text: {
      ro: 'O matrice A de tip m × n are m linii și n coloane; a_ij stă pe linia i, coloana j. A(i, :) este linia i, A(:, j) coloana j, iar A(i₁:i₂, j₁:j₂) blocul dintre liniile i₁..i₂ și coloanele j₁..j₂.',
      en: 'An m × n matrix A has m rows and n columns; a_ij sits in row i, column j. A(i, :) is row i, A(:, j) is column j, and A(i₁:i₂, j₁:j₂) is the block between rows i₁..i₂ and columns j₁..j₂.',
    },
    formula: 'A = \\begin{pmatrix} a_{11} & \\cdots & a_{1n} \\\\ \\vdots & & \\vdots \\\\ a_{m1} & \\cdots & a_{mn} \\end{pmatrix}',
  },
  {
    id: 'indici',
    grup: 'notatii',
    titlu: { ro: 'Indici și intervale', en: 'Indices and ranges' },
    text: {
      ro: 'Indicii pornesc de la 1. „i = 1 : n” înseamnă că i ia pe rând valorile 1, 2, ..., n; „i = n : -1 : 1” numără în jos. Un interval gol, ca j = 1 : 0, nu produce nicio iterație, iar o sumă pe el este 0.',
      en: 'Indices start at 1. "i = 1 : n" means i takes the values 1, 2, ..., n in turn; "i = n : -1 : 1" counts down. An empty range such as j = 1 : 0 gives no iteration, and a sum over it is 0.',
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
    formula: 'L = \\begin{pmatrix} l_{11} & 0 & 0 \\\\ l_{21} & l_{22} & 0 \\\\ l_{31} & l_{32} & l_{33} \\end{pmatrix}, \\qquad U = \\begin{pmatrix} u_{11} & u_{12} & u_{13} \\\\ 0 & u_{22} & u_{23} \\\\ 0 & 0 & u_{33} \\end{pmatrix}',
  },
  {
    id: 'identitate',
    grup: 'notatii',
    titlu: { ro: 'Matricea unitate și inversa', en: 'Identity and inverse' },
    text: {
      ro: 'I_n are 1 pe diagonală și 0 în rest; I A = A I = A. Inversa A⁻¹ există doar pentru matrice pătrate nesingulare și satisface A A⁻¹ = I. Cursul nu rezolvă sisteme calculând inversa: costă de trei ori mai mult decât o factorizare și pierde precizie.',
      en: 'I_n has 1 on the diagonal and 0 elsewhere; I A = A I = A. The inverse A⁻¹ exists only for square nonsingular matrices and satisfies A A⁻¹ = I. The course never solves systems by computing the inverse: it costs three times a factorization and loses accuracy.',
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
      ro: 'Q este ortogonală dacă QᵀQ = I: coloanele ei au norma 1 și sunt perpendiculare două câte două, iar inversa este chiar transpusa. Înmulțirea cu Q nu schimbă lungimile, ‖Qx‖ = ‖x‖, de aceea algoritmii ortogonali sunt stabili numeric.',
      en: 'Q is orthogonal when QᵀQ = I: its columns have norm 1 and are pairwise perpendicular, and the inverse is the transpose itself. Multiplying by Q keeps lengths, ‖Qx‖ = ‖x‖, which is why orthogonal algorithms are numerically stable.',
    },
    formula: 'Q^T Q = I, \\qquad \\|Qx\\| = \\|x\\|',
  },
  {
    id: 'produs_scalar',
    grup: 'operatii',
    titlu: { ro: 'Produs scalar și ortogonalitate', en: 'Dot product and orthogonality' },
    text: {
      ro: 'xᵀy adună produsele componentelor pereche: n înmulțiri și n - 1 adunări, adică 2n flopi. Doi vectori sunt ortogonali (perpendiculari) când xᵀy = 0. Cosinusul unghiului dintre ei este xᵀy împărțit la produsul normelor.',
      en: 'xᵀy adds the products of paired components: n multiplications and n - 1 additions, that is 2n flops. Two vectors are orthogonal (perpendicular) when xᵀy = 0. The cosine of the angle between them is xᵀy divided by the product of the norms.',
    },
    formula: 'x^T y = \\sum_{i=1}^{n} x_i y_i',
    exemplu: { ro: 'Pentru x = (1, 2, 3) și y = (4, 5, 6): 1·4 + 2·5 + 3·6 = 32.', en: 'For x = (1, 2, 3) and y = (4, 5, 6): 1·4 + 2·5 + 3·6 = 32.' },
  },
  {
    id: 'norma',
    grup: 'operatii',
    titlu: { ro: 'Normă', en: 'Norm' },
    text: {
      ro: 'Norma 2 (euclidiană) este lungimea vectorului, radicalul din suma pătratelor; un vector cu norma 1 se numește unitar, iar x / ‖x‖ îl normează. Cursul folosește și norma 1 (suma modulelor) și norma ∞ (cel mai mare modul). Pentru matrice, norma Frobenius este radicalul din suma pătratelor tuturor elementelor.',
      en: 'The 2-norm (Euclidean) is the length of the vector, the square root of the sum of squares; a vector with norm 1 is a unit vector, and x / ‖x‖ normalizes it. The course also uses the 1-norm (sum of absolute values) and the ∞-norm (largest absolute value). For matrices, the Frobenius norm is the square root of the sum of squares of all entries.',
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
      ro: 'Ax = b strânge n ecuații cu n necunoscute într-o singură relație. Are soluție unică pentru orice b exact când A este nesingulară (inversabilă). Metodele directe transformă sistemul într-unul sau două sisteme triunghiulare și le rezolvă prin substituție; nici regula lui Cramer, nici inversa nu sunt folosite.',
      en: 'Ax = b packs n equations in n unknowns into one relation. It has a unique solution for every b exactly when A is nonsingular (invertible). Direct methods turn the system into one or two triangular systems and solve those by substitution; neither Cramer\'s rule nor the inverse is used.',
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
      ro: 'Eliminarea face zerouri sub diagonală, coloană cu coloană: la pasul k, din fiecare linie i > k se scade linia k înmulțită cu multiplicatorul μ_ik = a_ik / a_kk. După n - 1 pași rămâne o matrice superior triunghiulară U, iar sistemul echivalent Ux = Mb se rezolvă cu UTRIS. Multiplicatorii se memorează chiar în locul zerourilor create. Cost: 2n³/3 flopi.',
      en: 'Elimination creates zeros below the diagonal, column by column: at step k, row k times the multiplier μ_ik = a_ik / a_kk is subtracted from every row i > k. After n - 1 steps an upper triangular U remains, and the equivalent system Ux = Mb is solved with UTRIS. The multipliers are stored right where the zeros were created. Cost: 2n³/3 flops.',
    },
    formula: '\\mu_{ik} = \\frac{a_{ik}}{a_{kk}}, \\qquad a_{ij} \\leftarrow a_{ij} - \\mu_{ik} a_{kj}',
  },
  {
    id: 'pivot',
    grup: 'sisteme',
    titlu: { ro: 'Pivotul și pivotarea parțială', en: 'The pivot and partial pivoting' },
    text: {
      ro: 'Pivotul este elementul a_kk la care se împarte. Dacă este 0 algoritmul se oprește, iar dacă este foarte mic multiplicatorii devin uriași și erorile de rotunjire se amplifică. Pivotarea parțială alege la fiecare pas, în coloana k, elementul cu modulul cel mai mare de pe sau sub diagonală și aduce linia lui pe poziția k; astfel toți multiplicatorii au modulul cel mult 1. Vectorul p reține ce linii s-au interschimbat, ca aceleași schimbări să se aplice și lui b.',
      en: 'The pivot is the entry a_kk you divide by. If it is 0 the algorithm stops, and if it is tiny the multipliers become huge and rounding errors grow. Partial pivoting picks, at each step, the entry with the largest absolute value in column k on or below the diagonal and moves its row to position k; all multipliers then have absolute value at most 1. The vector p records which rows were swapped, so the same swaps can be applied to b.',
    },
    formula: '|a_{i_k k}| = \\max_{i = k : n} |a_{ik}|',
  },
  {
    id: 'factorizare',
    grup: 'factorizari',
    titlu: { ro: 'Factorizarea LU', en: 'LU factorization' },
    text: {
      ro: 'Eliminarea gaussiană scrie de fapt A = LU, cu L inferior triunghiulară unitate (cu 1 pe diagonală, formată din multiplicatori) și U superior triunghiulară. Varianta Crout pune unitatea pe diagonala lui U. Ambele se scriu peste A. Avantajul: factorizezi o dată (n³) și apoi rezolvi câte sisteme vrei cu aceeași matrice, fiecare cu două substituții (n²).',
      en: 'Gaussian elimination actually writes A = LU, with L unit lower triangular (ones on the diagonal, built from the multipliers) and U upper triangular. The Crout variant puts the ones on the diagonal of U. Both are stored over A. The point: factorize once (n³) and then solve as many systems as you like with the same matrix, each with two substitutions (n²).',
    },
    formula: 'A = LU, \\qquad Ax = b \\iff Ly = b,\\ Ux = y',
  },
  {
    id: 'cholesky',
    grup: 'factorizari',
    titlu: { ro: 'Factorizarea Cholesky', en: 'Cholesky factorization' },
    text: {
      ro: 'Pentru o matrice simetrică pozitiv definită, A = LLᵀ cu L inferior triunghiulară: un singur factor, fără pivotare, la jumătate din costul lui LU (n³/3 flopi). Elementele lui L se obțin coloană cu coloană din identitatea A = LLᵀ; radicalul de la fiecare pas există doar dacă α > 0, de aceea algoritmul este și un test de pozitiv definire.',
      en: 'For a symmetric positive definite matrix, A = LLᵀ with L lower triangular: a single factor, no pivoting, at half the cost of LU (n³/3 flops). The entries of L come column by column from the identity A = LLᵀ; the square root at each step exists only when α > 0, which is why the algorithm is also a test for positive definiteness.',
    },
    formula: 'l_{kk} = \\sqrt{a_{kk} - \\sum_{j=1}^{k-1} l_{kj}^2}, \\qquad l_{ik} = \\Bigl(a_{ik} - \\sum_{j=1}^{k-1} l_{ij} l_{kj}\\Bigr) / l_{kk}',
  },
  {
    id: 'reflector',
    grup: 'ortogonal',
    titlu: { ro: 'Reflectorul Householder', en: 'Householder reflector' },
    text: {
      ro: 'U = I - uuᵀ/β este o matrice ortogonală și simetrică care reflectă vectorii față de un plan. Alegând u = x + σe₁ cu σ = ±‖x‖, reflectorul duce coloana x în (-σ, 0, ..., 0): toate componentele de sub prima devin zero dintr-o dată. Nu se formează matricea U, ci se păstrează doar vectorul u și scalarul β, iar aplicarea pe o coloană costă cât un produs scalar.',
      en: 'U = I - uuᵀ/β is an orthogonal and symmetric matrix that reflects vectors across a plane. Choosing u = x + σe₁ with σ = ±‖x‖, the reflector maps the column x to (-σ, 0, ..., 0): all components below the first become zero at once. The matrix U is never formed; only the vector u and the scalar β are kept, and applying it to a column costs about a dot product.',
    },
    formula: 'U = I - \\frac{u u^T}{\\beta}, \\qquad \\beta = \\sigma u_1, \\qquad Ux = -\\sigma e_1',
  },
  {
    id: 'qr',
    grup: 'ortogonal',
    titlu: { ro: 'Triangularizarea ortogonală (QR)', en: 'Orthogonal triangularization (QR)' },
    text: {
      ro: 'Aplicând câte un reflector pe fiecare coloană, A = QR cu Q ortogonală și R superior triunghiulară: U_n ··· U_1 A = R, iar Q este produsul reflectorilor. R rămâne în triunghiul superior al lui A, vectorii u_k în locul zerourilor. Spre deosebire de eliminarea gaussiană, nu are nevoie de pivotare și nu amplifică erorile.',
      en: 'Applying one reflector per column gives A = QR with Q orthogonal and R upper triangular: U_n ··· U_1 A = R, and Q is the product of the reflectors. R stays in the upper triangle of A, the vectors u_k take the place of the zeros. Unlike Gaussian elimination it needs no pivoting and does not amplify errors.',
    },
    formula: 'Q^T A = R, \\qquad Q = U_1 U_2 \\cdots U_n',
  },
  {
    id: 'cmmp',
    grup: 'ortogonal',
    titlu: { ro: 'Cele mai mici pătrate (CMMP)', en: 'Least squares' },
    text: {
      ro: 'Când sunt mai multe ecuații decât necunoscute (m > n), Ax = b nu are în general soluție; se caută x care face reziduul b - Ax cât mai scurt. Soluția se obține cu QR: d = Qᵀb, apoi Rx = d(1:n) prin UTRIS, iar ‖d(n+1:m)‖ este exact lungimea reziduului minim. Reziduul este perpendicular pe coloanele lui A, ca proiecția unui punct pe un plan.',
      en: 'With more equations than unknowns (m > n), Ax = b usually has no solution; you look for the x that makes the residual b - Ax as short as possible. QR gives it: d = Qᵀb, then Rx = d(1:n) by UTRIS, and ‖d(n+1:m)‖ is exactly the length of the minimal residual. The residual is perpendicular to the columns of A, like the projection of a point onto a plane.',
    },
    formula: '\\min_x \\|b - Ax\\|, \\qquad A^T (b - Ax) = 0',
  },
  {
    id: 'valoare_proprie',
    grup: 'proprii',
    titlu: { ro: 'Valori și vectori proprii', en: 'Eigenvalues and eigenvectors' },
    text: {
      ro: 'v ≠ 0 este vector propriu al lui A cu valoarea proprie λ dacă Av = λv: înmulțirea cu A doar îl întinde, fără să-i schimbe direcția. O matrice n × n are n valori proprii (posibil complexe sau repetate); pentru matrice simetrice ele sunt reale și vectorii proprii sunt ortogonali. λ₁ este dominantă dacă |λ₁| > |λ₂| ≥ ... .',
      en: 'v ≠ 0 is an eigenvector of A with eigenvalue λ when Av = λv: multiplying by A only stretches it, without changing its direction. An n × n matrix has n eigenvalues (possibly complex or repeated); for symmetric matrices they are real and the eigenvectors are orthogonal. λ₁ is dominant when |λ₁| > |λ₂| ≥ ... .',
    },
    formula: 'Av = \\lambda v, \\quad v \\neq 0',
  },
  {
    id: 'metoda_puterii',
    grup: 'proprii',
    titlu: { ro: 'Metoda puterii', en: 'The power method' },
    text: {
      ro: 'Pornind de la un vector oarecare y, se repetă y ← Ay / ‖Ay‖. Componenta pe direcția dominantă crește cel mai repede, așa că y se aliniază cu vectorul propriu dominant, cu viteza |λ₂/λ₁| pe iterație. Valoarea proprie se citește din câtul Rayleigh yᵀAy, iar oprirea se face când direcția nu se mai schimbă: |1 - |zᵀy|| sub toleranță. Fiecare iterație costă cât un produs matrice-vector, 2n² flopi.',
      en: 'Starting from any vector y, repeat y ← Ay / ‖Ay‖. The component along the dominant direction grows fastest, so y lines up with the dominant eigenvector, at rate |λ₂/λ₁| per iteration. The eigenvalue is read from the Rayleigh quotient yᵀAy, and you stop when the direction no longer changes: |1 - |zᵀy|| below the tolerance. Each iteration costs one matrix-vector product, 2n² flops.',
    },
    formula: 'y \\leftarrow \\frac{Ay}{\\|Ay\\|}, \\qquad \\lambda \\approx y^T A y',
  },
  {
    id: 'flop',
    grup: 'pseudocod',
    titlu: { ro: 'Flopi și cost', en: 'Flops and cost' },
    text: {
      ro: 'Un flop este o operație în virgulă mobilă: adunare, scădere, înmulțire sau împărțire (radicalul se numără tot ca una). Costul unui algoritm numără flopii și păstrează termenul cu puterea cea mai mare: n² pentru substituții, 2n³/3 pentru eliminare, n³/3 pentru Cholesky. De aceea se factorizează o dată și se substituie de câte ori e nevoie.',
      en: 'A flop is one floating point operation: addition, subtraction, multiplication or division (a square root counts as one too). The cost of an algorithm counts flops and keeps the highest power: n² for substitutions, 2n³/3 for elimination, n³/3 for Cholesky. That is why you factorize once and substitute as often as needed.',
    },
  },
  {
    id: 'pseudocod',
    grup: 'pseudocod',
    titlu: { ro: 'Cum citești pseudocodul', en: 'How to read the pseudocode' },
    text: {
      ro: '„x ← e” calculează e cu valorile vechi și apoi scrie rezultatul în x. „a_ik ← μ_ik = a_ik / a_kk” scrie peste a_ik, iar numele din mijloc spune ce reprezintă valoarea nouă. „a ↔ b” interschimbă. Liniile indentate sub „pentru” formează corpul buclei; „dacă ... atunci” execută corpul doar când condiția e adevărată. Algoritmii scriu rezultatul peste matricea de intrare („L, U peste A”), ca în curs.',
      en: '"x ← e" evaluates e with the old values and then stores the result in x. "a_ik ← μ_ik = a_ik / a_kk" overwrites a_ik, and the name in the middle says what the new value means. "a ↔ b" swaps. The lines indented under "for" form the loop body; "if ... then" runs the body only when the condition holds. Algorithms write their result over the input matrix ("L, U over A"), as in the course.',
    },
  },
  {
    id: 'culori',
    grup: 'pseudocod',
    titlu: { ro: 'Culorile din animație', en: 'The colours in the animation' },
    text: {
      ro: 'Roșu: pivotul, elementul la care se împarte. Portocaliu: ce se scrie la pasul curent. Albastru: ce se citește la pasul curent. Verde: calculat la pașii dinainte și nu se mai schimbă. Mov: multiplicator, păstrat pentru mai târziu. Alb: neatins, are încă valoarea de la intrare. Aceleași culori apar și în formula pasului.',
      en: 'Red: the pivot, the element you divide by. Orange: written at the current step. Blue: read at the current step. Green: computed at earlier steps and final. Purple: a multiplier, kept for later. White: untouched, still the input value. The same colours appear in the step formula.',
    },
  },
]

export const notiune = (id: string): Notiune | undefined => NOTIUNI.find((n) => n.id === id)
