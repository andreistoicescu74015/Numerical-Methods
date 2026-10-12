# Algorithm visualizer for Numerical Methods

A web application in which you write pseudocode in the notation of the Numerical Methods
course, your own or from a library of algorithms (matrix products, substitutions, Gaussian
elimination with and without pivoting, LU, Cholesky, orthogonal triangularization, least
squares, the power method), and watch step by step what it does on matrices and vectors: the
current line of code is highlighted, the cells read, written, the pivot and the finished ones are
coloured, the step formula shows the substituted values, and a counter keeps the flops. At the
end, the identities the algorithm promises (LU = A, LLᵀ = A, QR = A, Ax = b) are recomputed and
shown as residuals, and the pseudocode can be exported as a Python program. The interface is in
Romanian or English (the EN/RO button) and has a light and a dark theme. The research and the
architecture decision are in `docs/cercetare.md` (in Romanian).

Stack: Vite, React, TypeScript. The application runs locally, natively or in Docker, on
`http://localhost:5173`. `npm run build` additionally produces a single file `dist/index.html`
that opens from `file://` without a server.

## Running natively

Requires Node 24 (or 22.12 and newer).

```
npm install
npm run dev        # http://localhost:5173, reloads on save
npm test           # engine and interface tests (vitest)
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
- Under the description, the "Prerequisites" tags open the "Fundamentals" panel at the
  requested explanation: the course notation, the elementary operations, the idea behind each
  method, how to read the pseudocode and what the colours mean.
- Inputs have a name, a type (matrix, vector or scalar) and values, one row per line; "random"
  fills them with integers keeping the sizes. `n` and `m` come from their sizes. A decimal comma
  (`0,5`) is accepted when the numbers are separated by spaces.
- Controls: step forward and back, "next write" (skips loop headers), playback with adjustable
  speed in which loop headers pass faster than writes, a scrub bar over the trace. The arrow
  keys, Shift+arrows, Home, End and space do the same when the editor does not have focus.
- Colours: red for the pivot, orange for what is written, blue for what is read, green for what
  is final, purple for multipliers. On a swap the two values move towards each other. Above 150
  cells the animations stop and the steps remain.
- The "Check" panel appears when the algorithm finishes: residuals below 1e-9 (relative to the
  size of the data) are marked ok. The "Python code" panel generates the literal translation of
  the current program, to copy or download; it runs with `python/mn/runtime.py` next to it.
- URL parameters: `?algoritm=GPP` or `?algoritm=propriu`, `?pas=12`, `?notiune=pivot`,
  `?limba=en`, `?tema=dark`.
- In "your own pseudocode" mode the text and the inputs stay in localStorage between sessions.

## Layout of the repository

- `src/motor/`: the lexer, the parser, the interpreter (the execution trace: per-step
  differences and a full frame every 100 steps, rebuilt with `stareLa`), the formula renderer,
  the algorithm library, the numerical checks, the Python emitter, the per-line variables and the
  message catalogue (Romanian and English).
- `src/componente/`, `src/App.tsx`: the editor, the grids, the formula, the controls, the inputs,
  the check, the Python panel and the fundamentals. `src/preferinte.tsx` holds the language and
  the theme; `src/i18n.ts` holds the interface texts; `src/notiuni.ts` holds the fundamentals.
- `python/mn/algoritmi.py`: the same algorithms translated literally into Python, with indices
  from 1; `python/mn/runtime.py`: the functions the generated code needs.
  `python/genereaza_fixturi.py` writes `tests/fixtures/algoritmi.json`, and `npm test` checks
  that the interpreter and the generated Python give the same numbers
  (`python/verifica_export.py`). `python/compara.py` writes the comparison table against the
  NumPy functions (error, flops, time) for the report. Regenerate the fixtures with
  `npm run fixturi`; all of these need Python 3 with NumPy.
- `tests/`: tests for the parser, the interpreter, the formulas, the checks, the Python export
  and the mounted application (jsdom).

Identifiers in the code are Romanian, after the course and the notation of the slides.

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
- Several statements on one line are separated by `;`. Comments start with `%`.

Expressions: `+ - * /`, multiplication by juxtaposition (`a_ij x_j`), `^2`, `√x` or `sqrt(x)`,
`|x|`, `‖v‖` or `norm(v)`, `sgn`, `min`, `max`, `linii(A)`/`rows(A)`, `coloane(A)`/`cols(A)`,
`lungime(x)`/`len(x)`, `Σ_{j=1}^{k-1} l_ij l_kj`, `argmax_{i=k:n} |a_ik|`, `z^T y` (dot
product), `A y` (matrix times vector), blocks `A(k:m, k)`. Elements are written `a_ij`, `x_i`,
`a_{i,j-1}` or `A(i,j)`; a lowercase name (`a`, `l`, `u`) looks up the matrix with the uppercase
letter. Comparisons: `<`, `>`, `≤` or `<=`, `≥` or `>=`, `=`, `≠` or `!=`. ASCII alternatives:
`<-` for `←`, `<->` for `↔`.

An indexed element of a variable that is not an array, such as `i_k`, is a scalar with that
name.
