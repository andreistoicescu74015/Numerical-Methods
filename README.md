# Algorithm visualizer for Numerical Methods

A web application in which you write pseudocode in the notation of the Numerical Methods
course, your own or from a library of algorithms, and watch step by step what it does on
matrices and vectors. The current line of code is highlighted, the cells read, written, the
pivot and the finished ones are marked, the step formula shows the substituted values with the
matrices written out, and a counter keeps the flops. Each computation first appears with a `?`
in place of its result, so that you can work it out, type it and check it before it is shown.

The library has 20 algorithms: matrix products, the two substitutions, Gaussian elimination
with and without pivoting (G, GPP, S_GPP, and S_G for the course example where the lack of
pivoting gives a false solution), LU (Crout), Cholesky, the variants of G, GPP and UTRIS for
banded matrices, the iterative solvers of the course (Jacobi, Gauss-Seidel, Kaczmarz), the
Householder reflector for a vector, orthogonal triangularization (algorithm QR), least squares
(algorithm SQR) and the power method. The theory comes only from the course: the slides and the
book of the course (Dumitrescu, Popeea, Jora). For each algorithm the
application says which course and slide (or which section of the book) it comes from and what
differs from the source. It also shows what the
lines of the pseudocode do at the level of matrices, practical notes, the cost formula evaluated
for the current inputs next to the counted flops, and at the end the identities the algorithm
promises (LU = A, LLᵀ = A, QR = A, Ax = b) recomputed as residuals. The pseudocode can be exported as a
NumPy program in the style of the course labs. The application fills the window: the pseudocode
on the left with the inputs under it, the step card and the grids in the middle, a drawer of
collapsible panels on the right and the playback bar at the bottom. The interface is in Romanian
or English (the EN/RO button), has a light and a dark theme and a presentation mode (the P key)
with larger text for a projector. The research and the architecture decision are in
`docs/cercetare.md` (in Romanian).

Stack: Vite, React, TypeScript. The application runs locally, natively or in Docker, on
`http://localhost:5173`. `npm run build` additionally produces a single file `dist/index.html`
that opens from `file://` without a server.

## Running natively

Requires Node 24 (or Node 22 from 22.13, or Node 26 and newer; the test runner does not support
Node 23 and 25).

```
npm install
npm run dev        # http://localhost:5173, reloads on save
npm test           # engine, linear algebra, cost, colour and interface tests (vitest)
npm run build      # type-checks and writes dist/index.html
```

## Running in Docker

Requires Docker Desktop running. The image is built on the first command.

```
docker compose up          # http://localhost:5173, reloads on save
docker compose up --build  # after changes to package.json or the Dockerfile
```

The container mounts only `src`, `index.html` and `vite.config.ts`, so `node_modules` stays
the one from the image.

## Usage

- Pick an algorithm from the list or "your own pseudocode". The text in the editor can be
  changed at any time; "Run" (or Ctrl+Enter in the editor) restarts the trace. The current line
  shows the values of its variables at its end (`k = 1, i = 2`), so that `a_ik` in the code ties
  to the cell in the grid.
- In the "About the algorithm" panel of the drawer, under the description, "In the course" names
  the course and the slide of the algorithm and
  opens to show what differs from the slide; "In practice" holds the notes for real use (when it
  fails, what the convergence conditions are, which NumPy or SciPy function does the same), and
  the "Prerequisites" tags open the "Fundamentals" panel at the requested explanation.
- Inputs have a name, a type (matrix, vector or scalar) and values, one row per line. `m` and
  `n` are the sizes of the first matrix; with no matrix, `n` is the length of the first vector.
  A decimal comma (`0,5`) is accepted when the numbers are separated by spaces.
- Each input of a library algorithm has a nature, written next to it (upper triangular,
  symmetric positive definite, a right-hand side for which the system has a solution). "random"
  keeps the sizes, generates small integers with that nature and runs at once: a triangular
  matrix with a nonzero diagonal, A = LLᵀ with an integer L for Cholesky, a strictly diagonally
  dominant matrix for Jacobi and Gauss-Seidel so that they converge, b = Ax for Kaczmarz, a
  tolerance from a short list. A value typed by hand that lacks the nature gets a warning under
  its field saying what is wrong and what the algorithm will do. "initial example" restores the
  inputs the algorithm starts with.
- Under each matrix, "type" picks the kind of matrix that "random" generates, with the
  definitions of the course: general, symmetric, symmetric positive definite, diagonal, lower or
  upper triangular, lower or upper bidiagonal, tridiagonal, upper Hessenberg (the last two with a
  dominant diagonal, so that elimination without pivoting runs), strictly diagonally dominant,
  orthogonal,
  nonsingular, with nonsingular leading submatrices, or singular as a counterexample. The default
  is the nature the algorithm asks for; another type is allowed and gets its warning. The buttons
  next to it change the number of rows and columns (one "order" when the matrix has to be
  square), and the vectors tied to the matrix follow. A line under the matrix says which of these
  properties the typed matrix has, its rank, the leading submatrix where elimination would meet a
  zero pivot, the step where Cholesky would stop and, for Jacobi and Gauss-Seidel, the spectral
  radius of the iteration matrix.
- "Counterexamples from the course", under the inputs, loads inputs that break a hypothesis of
  the algorithm or reach an edge case and runs them: a zero diagonal entry for LTRIS, UTRIS and
  UTRISb, a zero pivot for G, S_G and LU, the matrix that stops G for GPP, a singular matrix for
  GPP and S_GPP, a symmetric matrix that is not positive definite for Cholesky, Jacobi and
  Gauss-Seidel with ρ > 1, Jacobi converging on a matrix that is not diagonally dominant, a
  positive definite matrix where only Gauss-Seidel converges, Kaczmarz on a system without a
  solution and with steps that do not reduce the error, the power method without a dominant
  eigenvalue or with γ₁ = 0, sgn(0) = 1 and β = 0 for RFG, dependent columns for SQR, a zero pivot
  in a banded matrix for Gb and the matrix that stops Gb for GPPb. Each one says what it shows and
  where the hypothesis is in the course.
- Editing the pseudocode or an input does not run anything; a notice above the grids says they
  still show the previous run, until "Run".
- A library algorithm does not run on inputs of the wrong shape (a non-square matrix where a
  square one is needed, a vector whose length does not match the matrix): the warning under the
  input says what is wrong, and "Run" repeats it instead of solving another problem. A run that
  ends with an error or a `stop` says so from its first step, with a button to its last step.
- "Keep for another algorithm", next to "Inputs", keeps the values and the precision when the
  next algorithm has inputs with the same names and types (S_G and S_GPP, Jacobi and
  Gauss-Seidel), so the two can be compared on the same data.
- The "Comparison" panel of the drawer runs the same inputs, with the same arithmetic, through
  another library algorithm that takes them (the pairs the course compares come first: G and
  GPP, S_G and S_GPP, Cholesky or QR and G, Jacobi, Gauss-Seidel and Kaczmarz) and shows side by
  side how each run finishes, the counted flops, the iterations, the result (a result matrix of at
  most 4 x 4 in full) and the largest difference between the two solution vectors. A button
  switches to the other algorithm with the same inputs.
- "What stays true" shows, for the eliminations, the factorizations, QR and the substitutions,
  the property the proof or the derivation of the algorithm in the course relies on, as it
  stands at the start of the current step of the outer loop: A_(k+1) = M_k ⋯ M_1 A with zeros
  below the diagonal in the first k columns, the first k columns of L done in A = LLᵀ, the
  equations already solved. It is checked on the values in the grid, relative to the size of
  the values involved, so a wrong change to the pseudocode shows up as a large deviation. In an
  adaptation exercise it is the invariant of the starting algorithm.
- "Conditioning", for the direct solvers of Ax = b, changes b by a relative ε in the direction
  that A⁻¹ enlarges most, runs the algorithm again and puts the relative change of x next to the
  bound κ(A) ‖Δb‖/‖b‖ of the course, with the ∞-norm. Buttons load the examples of the book of
  the course: D = 0.1 I with n = 4 (κ = 1 with a tiny determinant), the triangular T
  (κ∞ = n 2ⁿ⁻¹ = 80 for n = 5) and the Hilbert matrix H₃ (κ∞ ≈ 748), with b chosen so that the
  bound is reached. For LTRIS and UTRIS only the triangle the algorithm reads counts.
- "Cost as a function of n" runs a direct algorithm on random inputs with the required nature for
  n from 2 to 8 and plots the counted flops next to the cost formula of the algorithm, with a
  table.
- "Adaptation exercises", at the end of the algorithm list, start from a library algorithm and
  ask to adapt it to a structured matrix, as in the problems of the book: LTRIS for a lower
  bidiagonal matrix and UTRIS for an upper bidiagonal one (P 1.24), G for a tridiagonal matrix
  (P 2.29 a and section 2.9) and for an upper Hessenberg one (the triangularization part of
  P 2.13 a). After each run the panel checks that the result equals the unchanged algorithm on four structured inputs, that the flops stay
  within the target (3n − 2, 3(n − 1), n² − 1) and that no zero known in advance is read or
  written; a hint and the solution open on request.
- In English the library pseudocode is shown with the English keywords the parser accepts
  (`for`, `if`, `while`, `over`, `let`), with the same lines as in Romanian.
- "Arithmetic" under the inputs rounds every input and the result of every operation to t
  significant digits, like a computing machine with low precision. S_G starts with 3 digits on
  the course example with the pivot 10⁻⁴, where elimination without pivoting gives x₁ = 0 instead
  of 1; S_GPP on the same data and precision gives the correct solution. With t digits the
  "Check" panel accepts residuals up to 10^(2 - t).
- For the banded algorithms (Gb, GPPb, UTRISb) the zeros outside the band are hatched: the
  algorithm never reads or writes them. The description adds how many flops the algorithm for
  full matrices (G, GPP, UTRIS) counts on the same inputs.
- Controls, in the bar at the bottom: step forward (the only filled button) and back, the next
  and the previous write to an array (skipping loop headers), start and end, playback with
  adjustable speed in which loop headers pass faster than writes, and a scrub bar over the trace
  with notches at the writes, at the start of every iteration and, in red, at a stop. The arrow
  keys, Shift+arrows, Home, End and space do the same when the editor does not have focus;
  "Keys" in the header lists them.
- The step card quotes the current line with the values of its variables, then shows the
  formula. It has two modes, "Walkthrough" and "Exercise" (the E key). Exercise is on by default:
  a step that computes something shows its formula ending in `= ?` and its target cells as `?`;
  one step forward (or "Show the result") reveals it. Copies and constants have nothing to hide.
  Walkthrough shows every result at once.
- In exercise mode, while a result is hidden, "your answer" takes the value (`0.5`, `0,5` or `1/2`;
  several values separated by spaces, in the order of the cells; `true`/`false` for a
  condition). "Check" accepts answers within 0.5%, shows the result and keeps the count of
  correct answers for the current run.
- The step formula writes vectors as columns and matrices in full, so `r ← A x - b` shows the
  three arrays and the operations between them. Under it, each operation between arrays is
  named, with the shapes of its operands, its flops and its elementwise definition.
- "Matrix operations" lists what the program does between matrices and vectors. For a library
  algorithm these are its stages in matrix form (`A ← M_k A`, `U x = b`); for your own program
  they are the lines that operate on whole arrays. The entry of the current step is marked. The
  same panel has the list of operations you can write.
- "Convergence" appears for programs with a `while` loop: the quantity tested by the loop
  condition at every iteration, against its threshold, with a table of the same values. For the
  iterative solvers it also compares the flops spent with the cost of the direct method.
- "Geometric view" appears for two unknowns: for Jacobi, Gauss-Seidel and Kaczmarz the equations
  are lines and the approximations are points moving towards their intersection (Gauss-Seidel
  moves one coordinate at a time, Kaczmarz projects perpendicularly onto one line per step); for
  the power method with a 2 x 2 matrix, y turns on the unit circle towards the dominant
  eigenvector; for RFG with a vector of length 2, x is mirrored onto the first axis.
- Cells: red with a double outline for the divisor (the pivot in elimination), orange with a
  thick outline for what is written, blue with a dashed outline for what is read, green with a
  marked corner for what is final (also an entry the algorithm uses but never writes in an array it
  changes, such as the first row of U in G), purple with the letter μ for multipliers. The outlines carry the role without colour;
  the fills stay distinct under simulated protanopia and deuteranopia. On a swap the two values
  move towards each other. The width of a column is computed from the whole trace, so it does
  not change from step to step; above 36 cells the grids switch to a compact format. Above 150
  cells the animations stop and the steps remain; with "reduce motion" set in the system, cells
  change colour without moving. The legend under the grids names the roles on one row; "what
  they mean" opens the full explanations.
- The "Check" panel in the drawer stays collapsed, with "at the last step" as its summary, and
  opens by itself when the algorithm finishes; the step card lists the residuals then as well.
  Residuals below 1e-9 (relative to the
  size of the data) are marked ok. For the iterative solvers it shows the residual against the
  tolerance and, next to it, the error against the Gaussian elimination solution, also after a
  stop by `maxiter`. For the power method it also compares |λ| with the largest eigenvalue in
  absolute value found from another starting vector, so a starting vector without a component
  along the dominant eigenvector (also flagged under the input) shows up in red.
- Flops are counted as in the course: square roots, arithmetic on indices and counters
  (`k ← k + 1`, `s ← min(m-1, n)`) and the subtraction of an empty sum are not flops.
- The "Python code" panel generates the current program as a self-contained NumPy file, to copy
  or download: the function, then a call on the current inputs that prints the results and, for
  a library algorithm, compares them with the standard NumPy function (`np.linalg.solve`,
  `np.linalg.cholesky`, `np.linalg.qr`, `np.linalg.lstsq`, `np.linalg.eigvals`) and prints the
  largest difference.
- When a run stops on an error, the last step shows the computation that could not be done with
  its values (`a_21 / a_11 = 1 / 0`).
- URL parameters: `?algoritm=GPP` or `?algoritm=propriu`, `?pas=12`, `?notiune=pivot`,
  `?limba=en`, `?tema=dark`, `?cifre=3`. The address keeps the algorithm, the language, the theme
  and the precision as they change, so a reload keeps them.
- In "your own pseudocode" mode the text and the inputs stay in localStorage between sessions.

## The generated Python

The export follows the labs of the course: `import numpy as np`, indices from 0, `for ... in
range(...)` loops over elements, `return` with the results.

```python
# Generat din pseudocod de vizualizatorul de Metode numerice.
# Indicii pornesc de la 0, ca in NumPy: bucla "k = 1 : n-1" devine
# range(n - 1), iar a_ij ramane A[i, j].
import numpy as np


def G(A):
    # copii de lucru in virgula mobila: intrarile raman neschimbate
    A = np.array(A, dtype=float)
    n = A.shape[0]
    # mu peste A: se citesc si se scriu in A
    for k in range(n - 1):
        for i in range(k + 1, n):
            A[i, k] = A[i, k] / A[k, k]
        for j in range(k + 1, n):
            for i in range(k + 1, n):
                A[i, j] = A[i, j] - A[i, k] * A[k, j]
    return A


if __name__ == "__main__":
    # exemplul din vizualizator
    A = np.array([[1, 2, 1], [2, 1, 2], [1, 1, 2]])
    A_rez = G(A)
    print("A_rez =", A_rez, sep="\n")

    # comparatia cu NumPy
    # NumPy nu are LU fara pivotare: se verifica A = LU cu L, U luate din rezultat
    L = np.tril(A_rez, -1) + np.eye(len(A))
    U = np.triu(A_rez)
    print("diferenta maxima fata de NumPy:", np.max(np.abs(L @ U - A)))
```

The file ends with the call on the inputs currently in the visualizer, so running it prints what
the last step of the trace shows. The pseudocode counts from 1 and NumPy from 0. Loop variables hold positions (the pseudocode
value minus 1), and so do the scalars and arrays that only ever receive positions (`i_k` from
`argmax`, `p` in GPP), so a returned `p` holds positions counted from 0; the header comment of
the generated file names them. Every other name keeps its pseudocode value, and an element
indexed by such a name is written `x[k - 1]`. `n` is the number of rows when the algorithm asks
for a square matrix (`A.shape[0]`, as in the labs) and the number of columns otherwise, as in
the interpreter. Sums become accumulation loops (`suma = 0`, then `suma = suma + ...`), `argmax` over a column
becomes `np.argmax` on a slice, `A y` and `z^T y` become `A @ y` and `z @ y`, Greek names are
spelled out (`sigma`, `beta`), and `stop` raises `RuntimeError`. Inputs are copied as float
arrays, so the caller's data is left unchanged and an integer matrix does not truncate the
divisions. `sgn(0)` is 1, as in the book of the course; with `np.sign(0)`, which is 0, σ would
become 0 and the division by σ would fail.

## Layout of the repository

- `src/motor/`: the lexer, the parser, the interpreter (the execution trace: per-step
  differences and a full frame every 100 steps, rebuilt with `stareLa`), the formula renderer,
  the algorithm library, the numerical checks, the Python emitter, the per-line analysis and the
  message catalogue (Romanian and English).
- `src/componente/`, `src/App.tsx`: the editor, the grids, the formula, the playback bar, the
  inputs, the collapsible panel of the drawer, the matrix operations, the convergence chart, the
  check, the Python panel and the fundamentals. `src/fonturi/` holds the IBM Plex Sans and Mono
  files (SIL Open Font License) that the single-file build embeds. `src/preferinte.tsx` holds
  the language and the theme, `src/i18n.ts` the
  interface texts, `src/notiuni.ts` the fundamentals, `src/operatii.ts` the names and definitions
  of the operations between arrays, `src/paleta.ts` the cell colours, `src/natura.ts` the natures
  of the inputs (the random generators, the matrix types, the properties shown under a matrix and
  the checks on typed values), `src/contraexemple.ts` the counterexamples from the course,
  `src/comparatie.ts` the comparison with another algorithm, `src/invarianti.ts` what stays true
  after each step, `src/conditionare.ts` the conditioning experiment, `src/costuri.ts` the cost
  as a function of n, `src/adaptari.ts` the adaptation exercises, `src/exercitiu.ts` the expected
  answer of a step and the reading of a typed answer.
- `python/mn/algoritmi.py`: the same algorithms translated literally into Python, with indices
  from 1, used as the numerical oracle. `python/genereaza_fixturi.py` writes
  `tests/fixtures/algoritmi.json` (regenerate with `npm run fixturi`), and
  `python/verifica_export.py` runs the generated NumPy code against the interpreter and the
  oracle (it reads the cases that `npm test` writes to `python/generat/`, so run `npm test`
  first). `python/compara.py` writes the comparison table against the NumPy functions (error,
  flops, time) for the report. The time is that of one call: after a warm-up call, the fastest of
  five groups of calls lasting at least 20 ms each, with BLAS on a single thread and, on Windows,
  with the process exempted from power throttling. All of these need Python 3 with NumPy.
- `tests/`: see below.

Identifiers in the code are Romanian, after the course and the notation of the slides.

## Tests

`npm test` runs, besides the parser, trace, formula and interface tests:

- `tests/algebra.test.ts`: every library algorithm is run through the interpreter on random
  matrices with a fixed seed, in several sizes, and the result has to satisfy the identities of
  linear algebra it promises: `LU = A`, `LLᵀ = A`, `QR = A` and `QᵀQ = I`, `Ax = b`,
  `Aᵀ(b - Ax) = 0`, `Ay = λy`, determinants equal to the product of the pivots, plus limit cases
  with exact answers (the identity matrix, a diagonal matrix, orthogonal rows). The identities
  are computed with helpers written separately from the engine (`tests/ajutor.ts`).
- `tests/cost.test.ts`: the cost formula of each algorithm against the counted flops. The exact
  formulas must match; the leading-term formulas must be within 12% at n = 24 and closer than at
  n = 12; the order measured by doubling n must be the one in the formula.
- `tests/motor.test.ts`, `tests/verificare.test.ts`: the interpreter against the Python oracle
  on the fixtures, and the end-of-run checks.
- `tests/python.test.ts`: the generated NumPy code must give the same numbers as the
  interpreter and the oracle, for the library (on its examples and on random inputs with the
  required nature) and for hand-written programs. Each generated file is run twice: the function
  called with the inputs, and the whole file as a script with its example (needs Python with
  NumPy; skipped otherwise).
- `tests/algebra.test.ts` also checks that Gb, GPPb and UTRISb give exactly the results of G, GPP
  and UTRIS on banded matrices (Gb and UTRISb with fewer flops), and that with 3 significant
  digits the course example gives x = (0, 1) without pivoting and x = (1, 1) with it.
- `tests/exercitiu.test.ts`: the reading of typed answers and the expected answer of a step.
- `tests/natura.test.ts`: for every library algorithm, at several sizes, the values produced by
  "random" have the nature the algorithm asks for, the run finishes within the step limit of the
  application and its identities check; values that lack the nature are reported.
- `tests/tipuri.test.ts`: every matrix type generates matrices with its property, the property
  line on known matrices from the course (including the spectral radii of the Jacobi and
  Gauss-Seidel examples), and the size buttons.
- `tests/contraexemple.test.ts`: every counterexample has all the inputs of its algorithm and
  ends as it says (to the end, with a `stop` or with an error), and the numbers in the
  explanations come out of the computation.
- `tests/comparatie.test.ts`: which algorithms can be compared, and on the course examples the
  comparison shows what the slides say (S_G against S_GPP with 3 digits, Cholesky and QR against
  G).
- `tests/invarianti.test.ts`: the invariant of each algorithm holds at every boundary between
  steps on random inputs, and a deliberately broken line in G, CHOL, QR or LTRIS breaks it.
- `tests/conditionare.test.ts`: κ∞ of the book examples (1, 80, 748), the change of x never above
  the bound, and the bound reached on the book examples.
- `tests/costuri.test.ts`: a point for every n, exact formulas on the points, and the relative
  difference of 2n³/3 shrinking with n.
- `tests/adaptari.test.ts`: the solution of each exercise passes all the checks with exactly the
  target flops, the unchanged algorithm fails them, and a wrong solution is caught.
- `tests/culori.test.ts`: WCAG contrast of the texts and separation of the cell roles under
  simulated colour blindness, read from `src/index.css` and `src/paleta.ts`.

## Accepted pseudocode

Blocks are given by indentation, as in the slides. The step numbering from the slides
(`1. Pentru k = 1 : n - 1`) is ignored, and keywords work with or without diacritics, in any
case, in Romanian or English (`pentru`/`for`, `dacă`/`if`, `atunci`/`then`, `altfel`/`else`,
`cât timp`/`while`, `tipărește`/`print`, `peste`/`over`, `fie`/`let`). Example, Gaussian
elimination:

```
μ peste A
pentru k = 1 : n-1
    pentru i = k+1 : n
        a_ik ← μ_ik = a_ik / a_kk
    pentru j = k+1 : n
        pentru i = k+1 : n
            a_ij ← a_ij - μ_ik a_kj
```

Statements:

- `x ← expression` or `x = expression`. The form `a_ik ← μ_ik = expression` names the new
  value; the name in the middle appears in the displayed formula but is not evaluated.
- `u_ik ← a_ik, i = k+1 : m` performs the assignment for every `i` in the range.
- `A(i, k:n) ← A(i, k:n) - c A(k, k:n)` assigns to a block: a row `A(i, :)`, a column
  `A(:, j)`, part of one, or a submatrix `A(1:2, 1:2)`. A number fills the block; a vector or a
  matrix must have its shape.
- `a_kj ↔ a_{i_k, j}` swaps two elements.
- `pentru i = 1 : n`, `pentru i = n : -1 : 1` (the second number is the step), with an indented
  body.
- `dacă condition atunci`, with an indented body or a statement on the same line, and optionally
  `altfel` at the same indentation.
- `cât timp condition`, with an indented body.
- `stop 'message'`, `tipărește 'message'`.
- `L, U peste A`: the elements `l_ij` and `u_ij` are read from and written to `A`, the way the
  course says the factors are stored over the input matrix.
- `fie U[m,p], β[p]`: new arrays, filled with zeros.
- Several statements on one line are separated by `;`; the declarations `fie` and `peste` stand on
  a line of their own. Comments start with `%`.

Expressions: `+ - * /`, multiplication by juxtaposition (`a_ij x_j`), `^2`, `√x` or `sqrt(x)`,
`|x|`, `sgn`, `min`, `max`, `linii(A)`/`rows(A)`, `coloane(A)`/`cols(A)`, `lungime(x)`/`len(x)`,
`Σ_{j=1}^{k-1} l_ij l_kj`, `argmax_{i=k:n} |a_ik|`. Between arrays: `A x` (matrix times vector),
`A B` (matrix times matrix), `x^T y` (dot product), `x y^T` (outer product), `x^T A`, `A^T`,
`c x`, `x / c`, `x + y`, `x - y`, `‖v‖` or `norm(v)` (the 2-norm of a vector), `‖A‖_F` (the
Frobenius norm of a matrix; the course writes `‖A‖` for the spectral norm, which the interpreter
does not compute, so `‖A‖` on a matrix is an error). A vector is a column; `A(i, :)` is a row, so
`A(i, :) x` is a dot product.
Elements are written `a_ij`, `x_i`, `a_{i,j-1}` or `A(i,j)`; a lowercase name (`a`, `l`, `u`)
looks up the matrix with the uppercase letter. Comparisons: `<`, `>`, `≤` or `<=`, `≥` or `>=`,
`=`, `≠` or `!=`. ASCII alternatives: `<-` for `←`, `<->` for `↔`.

An indexed element of a variable that is not an array, such as `i_k`, is a scalar with that
name.
