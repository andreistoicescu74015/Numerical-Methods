// Natura unei intrari: proprietatea pe care algoritmul o cere de la ea (triunghiulara, pozitiv
// definita, sistem compatibil, banda). Butonul "aleator" genereaza valori care o au, iar o
// valoare scrisa de mana care nu o are primeste un avertisment sub campul ei.
import type { CheieText } from './i18n'

// Ce cere algoritmul; se verifica pe valorile scrise de mana.
export type Natura =
  // matrice patrata inferior, respectiv superior triunghiulara, cu diagonala nenula
  | 'inferior'
  | 'superior'
  // submatricele lider principale A[k], k = 1 : n-1, nesingulare
  | 'lider'
  | 'nesingulara'
  // simetrica si pozitiv definita
  | 'spd'
  | 'diagonalaNenula'
  | 'liniiNenule'
  // m > n si coloane liniar independente
  | 'coloaneIndependente'
  // vector cu cel putin un element nenul
  | 'nenul'
  // vector nenul b pentru care Ax = b are solutie; A este intrarea `cu`
  | 'compatibil'
  // vectorul de pornire al metodei puterii: nenul, cu o componenta pe vectorul propriu dominant al lui `cu`
  | 'pornire'
  // matrice banda de latime inferioara r si superioara q (`latimi`), cu A[k] nesingulare, respectiv nesingulara
  | 'bandaLider'
  | 'bandaNesingulara'
  // superior triunghiulara, banda de latime superioara q, cu diagonala nenula
  | 'superiorBanda'
  // scalar in [0, 1)
  | 'toleranta'
  // intreg, cel putin 1
  | 'iteratii'
  // intreg intre 1 si lungimea vectorului `cu`
  | 'indice'
  // latimea unei benzi: intreg intre 0 si n - 1, unde n este numarul de linii al matricei `cu`
  | 'latime'

// Ce genereaza "aleator" cand e nevoie de mai mult decat cere natura, de exemplu o conditie
// suficienta de convergenta, sau tipul de matrice ales de student din meniu.
export type Aleator = Natura | 'dominanta' | 'liniiDominante' | 'asemenea' | Structura

// Tipurile de matrice din meniul de langa o matrice, cu definitiile din curs (notatiile din cursul I,
// matricele banda din carte). 'oarecare' nu cere nimic; 'singulara' este un contraexemplu.
export type Structura =
  | 'oarecare'
  | 'simetrica'
  | 'spd'
  | 'diagonala'
  | 'inferior'
  | 'superior'
  | 'tridiagonala'
  | 'bidiagonalaInf'
  | 'bidiagonalaSup'
  | 'hessenberg'
  | 'dominanta'
  | 'ortogonala'
  | 'nesingulara'
  | 'lider'
  | 'singulara'

export const STRUCTURI: Structura[] = ['oarecare', 'simetrica', 'spd', 'diagonala', 'inferior', 'superior', 'bidiagonalaInf', 'bidiagonalaSup', 'tridiagonala', 'hessenberg', 'dominanta', 'ortogonala', 'nesingulara', 'lider', 'singulara']

export type Valoare = number | number[] | number[][]
export type Tip = 'matrice' | 'vector' | 'scalar'

export interface Abatere {
  cheie: CheieText
  // argumentele mesajului, dupa numele intrarii
  args: (string | number)[]
}

// sub acest prag, fata de cel mai mare element, un pivot se socoteste nul
const PRAG = 1e-9

export const esteMatrice = (v: Valoare | undefined): v is number[][] => Array.isArray(v) && Array.isArray(v[0])
export const esteVector = (v: Valoare | undefined): v is number[] => Array.isArray(v) && !Array.isArray(v[0])

const scara = (A: number[][]): number => Math.max(1, ...A.flat().map(Math.abs))
const matrice = (m: number, n: number, f: (i: number, j: number) => number): number[][] => Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => f(i, j)))
const ori = (A: number[][], B: number[][]): number[][] => A.map((l) => B[0].map((_, j) => l.reduce((s, x, k) => s + x * B[k][j], 0)))

// Primul pas k ≤ pana la care eliminarea fara pivotare da un pivot nul, adica det A[k] = 0; 0 daca niciunul.
function pivotNul(A: number[][], pana: number): number {
  const T = A.map((l) => [...l])
  const prag = PRAG * scara(A)
  for (let k = 0; k < pana; k++) {
    if (Math.abs(T[k][k]) <= prag) return k + 1
    for (let i = k + 1; i < T.length; i++) {
      const mu = T[i][k] / T[k][k]
      for (let j = k; j < T.length; j++) T[i][j] -= mu * T[k][j]
    }
  }
  return 0
}

// Rangul, prin eliminare cu pivotare partiala pe o copie.
export function rang(A: number[][]): number {
  const T = A.map((l) => [...l])
  const m = T.length
  const n = T[0].length
  const prag = PRAG * scara(A)
  let r = 0
  for (let j = 0; j < n && r < m; j++) {
    let p = r
    for (let i = r + 1; i < m; i++) if (Math.abs(T[i][j]) > Math.abs(T[p][j])) p = i
    if (Math.abs(T[p][j]) <= prag) continue
    ;[T[r], T[p]] = [T[p], T[r]]
    for (let i = r + 1; i < m; i++) {
      const mu = T[i][j] / T[r][j]
      for (let c = j; c < n; c++) T[i][c] -= mu * T[r][c]
    }
    r++
  }
  return r
}

// Pasul la care factorizarea Cholesky da α ≤ 0; 0 daca reuseste. Citeste doar triunghiul inferior.
function pasNepozitiv(A: number[][]): number {
  const n = A.length
  const prag = PRAG * scara(A)
  const L = A.map((l) => l.map(() => 0))
  for (let k = 0; k < n; k++) {
    let alfa = A[k][k]
    for (let j = 0; j < k; j++) alfa -= L[k][j] ** 2
    if (!(alfa > prag)) return k + 1
    L[k][k] = Math.sqrt(alfa)
    for (let i = k + 1; i < n; i++) {
      let s = A[i][k]
      for (let j = 0; j < k; j++) s -= L[i][j] * L[k][j]
      L[i][k] = s / L[k][k]
    }
  }
  return 0
}

// Primul element nenul din afara benzii de latime inferioara r si superioara q, ca [i, j] de la 0.
function inAfaraBenzii(A: number[][], r: number, q: number): [number, number] | null {
  for (let i = 0; i < A.length; i++) for (let j = 0; j < A[i].length; j++) if ((i - j > r || j - i > q) && A[i][j] !== 0) return [i, j]
  return null
}

// Directia vectorului propriu dominant al lui Aᵀ (cel "la stanga" al lui A), prin iteratiile
// metodei puterii; null cand sirul nu se stabilizeaza, de exemplu fara valoare proprie dominanta.
// Componenta unui vector y pe vectorul propriu dominant al lui A, γ₁ din cursul V, este zero
// exact cand y este perpendicular pe aceasta directie.
function stangaDominant(A: number[][]): number[] | null {
  const n = A.length
  let w = Array.from({ length: n }, (_, i) => 1 + (i + 1) / (n + 1))
  const norma = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0))
  for (let k = 0; k < 5000; k++) {
    const z = Array.from({ length: n }, (_, j) => A.reduce((s, l, i) => s + l[j] * w[i], 0))
    const nz = norma(z)
    if (nz === 0) return null
    const nou = z.map((x) => x / nz)
    const cos = Math.abs(nou.reduce((s, x, i) => s + x * w[i], 0))
    // semnul se poate schimba la fiecare pas (valoare proprie negativa); directia conteaza
    w = nou
    // cos ajunge 1 in dubla precizie abia cand directia nu se mai misca deloc
    if (k > 20 && 1 - cos <= 1e-16) return w
  }
  return null
}

// Raza spectrala, cel mai mare modul al unei valori proprii, din ‖B^k‖^(1/k) pentru k = 2^16:
// B se ridica la patrat de 16 ori, cu normarea dusa separat, ca sa nu iasa din dubla precizie.
export function razaSpectrala(B: number[][]): number {
  const fro = (M: number[][]) => Math.sqrt(M.reduce((s, l) => s + l.reduce((t, x) => t + x * x, 0), 0))
  let n0 = fro(B)
  if (n0 === 0) return 0
  let M = B.map((l) => l.map((x) => x / n0))
  let log = Math.log(n0)
  for (let s = 0; s < 16; s++) {
    const P = ori(M, M)
    const np = fro(P)
    if (np === 0) return 0
    M = P.map((l) => l.map((x) => x / np))
    log = 2 * log + Math.log(np)
  }
  n0 = Math.exp(log / 2 ** 16)
  return n0
}

// Matricea de iteratie a metodei Jacobi, D⁻¹N = I - D⁻¹A, si a metodei Gauss-Seidel, L⁻¹U, cu
// A = L - U: L este triunghiul inferior cu diagonala, U minus partea de deasupra diagonalei.
export function matriceIteratie(A: number[][], metoda: 'jacobi' | 'gs'): number[][] {
  const n = A.length
  if (metoda === 'jacobi') return A.map((l, i) => l.map((x, j) => (i === j ? 0 : -x / A[i][i])))
  // coloana j a lui L⁻¹U, prin substitutie inainte
  const B = matrice(n, n, () => 0)
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      let s = i < j ? -A[i][j] : 0
      for (let k = 0; k < i; k++) s -= A[i][k] * B[k][j]
      B[i][j] = s / A[i][i]
    }
  return B
}

const PATRATE: Natura[] = ['inferior', 'superior', 'lider', 'nesingulara', 'spd', 'diagonalaNenula', 'bandaLider', 'bandaNesingulara', 'superiorBanda']

// strict diagonal dominanta pe linii: pe fiecare linie, |a_ii| mai mare decat suma modulelor celorlalte
export const esteDominanta = (A: number[][]): boolean => A.length === A[0].length && A.every((l, i) => Math.abs(l[i]) > l.reduce((s, x, j) => s + (j === i ? 0 : Math.abs(x)), 0))

// natura cere o matrice patrata
export const estePatrata = (natura: Natura | undefined): boolean => !!natura && PATRATE.includes(natura)

// De ce valoarea `v` nu are natura ceruta, sau null daca o are. `cu` este valoarea intrarii de
// care depinde natura (matricea sistemului, vectorul indexat), cand exista; `latimi` sunt
// latimile [inferioara, superioara] ale benzii, pentru naturile de tip banda.
export function incalca(natura: Natura, v: Valoare, cu?: Valoare, latimi?: [number, number]): Abatere | null {
  const a = (cheie: CheieText, ...args: (string | number)[]): Abatere => ({ cheie, args })
  if (typeof v === 'number') {
    if (natura === 'toleranta') return v >= 0 && v < 1 ? null : a('naturaToleranta')
    if (natura === 'iteratii') return Number.isInteger(v) && v >= 1 ? null : a('naturaIteratii')
    if (natura === 'indice' && esteVector(cu)) return Number.isInteger(v) && v >= 1 && v <= cu.length ? null : a('naturaIndice', cu.length)
    if (natura === 'latime' && esteMatrice(cu)) return Number.isInteger(v) && v >= 0 && v <= cu.length - 1 ? null : a('naturaLatime', cu.length - 1)
    return null
  }
  if (esteVector(v)) {
    if (natura !== 'nenul' && natura !== 'compatibil' && natura !== 'pornire') return null
    if (v.every((x) => x === 0)) return a('naturaNenul')
    // un termen liber de alta lungime decat numarul de linii e semnalat de interpretor
    if (natura === 'compatibil' && esteMatrice(cu) && cu.length === v.length && rang(cu.map((l, i) => [...l, v[i]])) !== rang(cu)) return a('naturaCompatibil')
    if (natura === 'pornire' && esteMatrice(cu) && cu.length === v.length && cu.length === cu[0].length) {
      const w = stangaDominant(cu)
      const ny = Math.sqrt(v.reduce((s, x) => s + x * x, 0))
      // componenta pe directia dominanta, raportata la ‖y‖; 1e-6 lasa loc erorii cu care se afla w
      if (w && Math.abs(w.reduce((s, x, i) => s + x * v[i], 0)) <= 1e-6 * ny) return a('naturaPornire')
    }
    return null
  }
  const m = v.length
  const n = v[0].length
  if (PATRATE.includes(natura) && m !== n) return a('naturaPatrata', m, n)
  if (natura === 'inferior' || natura === 'superior') {
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const inAfara = natura === 'inferior' ? j > i : j < i
        if (inAfara && v[i][j] !== 0) return a(natura === 'inferior' ? 'naturaInferior' : 'naturaSuperior', i + 1, j + 1, v[i][j])
      }
  }
  if (natura === 'bandaLider' || natura === 'bandaNesingulara' || natura === 'superiorBanda') {
    const [r, q] = natura === 'superiorBanda' ? [0, latimi?.[1] ?? n - 1] : (latimi ?? [n - 1, n - 1])
    const afara = inAfaraBenzii(v, r, q)
    if (afara) return a('naturaBanda', r, q, afara[0] + 1, afara[1] + 1, v[afara[0]][afara[1]])
  }
  if (natura === 'inferior' || natura === 'superior' || natura === 'diagonalaNenula' || natura === 'superiorBanda') {
    const i = v.findIndex((l, k) => l[k] === 0)
    return i < 0 ? null : a('naturaDiagonala', i + 1)
  }
  if (natura === 'lider' || natura === 'bandaLider') {
    const k = pivotNul(v, n - 1)
    return k ? a('naturaLider', k) : null
  }
  if (natura === 'nesingulara' || natura === 'bandaNesingulara') return rang(v) < n ? a('naturaSingulara') : null
  if (natura === 'spd') {
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (v[i][j] !== v[j][i]) return a('naturaSimetrica', i + 1, j + 1, v[i][j], v[j][i])
    const k = pasNepozitiv(v)
    return k ? a('naturaPozitivDefinita', k) : null
  }
  if (natura === 'liniiNenule') {
    const i = v.findIndex((l) => l.every((x) => x === 0))
    return i < 0 ? null : a('naturaLinieNula', i + 1)
  }
  if (natura === 'coloaneIndependente') {
    if (m <= n) return a('naturaInalta', m, n)
    const r = rang(v)
    return r < n ? a('naturaColoane', r, n) : null
  }
  return null
}

export interface Cerere {
  tip: Tip
  natura?: Aleator
  // dimensiunile valorii curente: [linii, coloane] pentru o matrice, [lungime, 1] pentru un vector
  forma: [number, number]
  // valoarea intrarii de care depinde natura
  cu?: Valoare
  // latimile [inferioara, superioara] ale benzii
  latimi?: [number, number]
}

type Rnd = () => number

// Un sir pseudoaleator determinist (congruential liniar): aceleasi intrari la fiecare rulare.
export function rndDeterminist(samanta: number): Rnd {
  let s = samanta >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

const intre = (rnd: Rnd, a: number, b: number): number => a + Math.floor(rnd() * (b - a + 1))
const semn = (rnd: Rnd): number => (rnd() < 0.5 ? -1 : 1)
const alege = <T>(rnd: Rnd, variante: T[]): T => variante[intre(rnd, 0, variante.length - 1)]
// pana la 200 de incercari; aproape orice matrice de intregi mici trece din prima
function pana<T>(genereaza: () => T, bun: (x: T) => boolean, altfel: () => T): T {
  for (let k = 0; k < 200; k++) {
    const x = genereaza()
    if (bun(x)) return x
  }
  return altfel()
}

// Pe fiecare linie un element mai mare in modul decat de doua ori suma celorlalte, pe coloana
// i mod n. Pentru o matrice patrata inseamna strict diagonal dominanta pe linii, deci Jacobi si
// Gauss-Seidel converg si toate submatricele lider principale sunt nesingulare.
function dominanta(m: number, n: number, rnd: Rnd, inBanda: (i: number, j: number) => boolean = () => true): number[][] {
  const A = matrice(m, n, (i, j) => (inBanda(i, j) ? intre(rnd, -2, 2) : 0))
  A.forEach((l, i) => {
    const j = i % n
    l[j] = semn(rnd) * (2 * l.reduce((s, x, c) => s + (c === j ? 0 : Math.abs(x)), 0) + intre(rnd, 1, 3))
  })
  return A
}

// Inversa unei matrice inferior triunghiulare unitate, prin substitutie: cu elemente intregi, iese intreaga.
function inversaInferioara(L: number[][]): number[][] {
  const n = L.length
  const X = matrice(n, n, (i, j) => (i === j ? 1 : 0))
  for (let j = 0; j < n; j++) for (let i = j + 1; i < n; i++) for (let k = j; k < i; k++) X[i][j] -= L[i][k] * X[k][j]
  return X
}

const transpusa = (A: number[][]): number[][] => A[0].map((_, j) => A.map((l) => l[j]))

// A = T D T⁻¹ cu T intreaga si det T = 1, deci si T⁻¹ e intreaga. A si D sunt matrice asemenea
// (cursul V), deci au aceleasi valori proprii: cele de pe diagonala lui D, dintre care prima are
// modulul de cel putin doua ori mai mare decat celelalte.
function asemenea(n: number, rnd: Rnd): number[][] {
  const L = matrice(n, n, (i, j) => (j < i ? intre(rnd, -1, 1) : i === j ? 1 : 0))
  const U = matrice(n, n, (i, j) => (j > i ? intre(rnd, -1, 1) : i === j ? 1 : 0))
  const T = ori(L, U)
  // U⁻¹ = (Uᵀ⁻¹)ᵀ, iar Uᵀ este inferior triunghiulara unitate
  const invers = ori(transpusa(inversaInferioara(transpusa(U))), inversaInferioara(L))
  const l1 = semn(rnd) * intre(rnd, 4, 6)
  const jumatate = Math.floor(Math.abs(l1) / 2)
  const D = [l1, ...Array.from({ length: n - 1 }, () => intre(rnd, -jumatate, jumatate))]
  return ori(
    T.map((l) => l.map((x, j) => x * D[j])),
    invers,
  )
}

// O valoare aleatoare, cu intregi mici, care are natura ceruta. Fara natura: intregi intre -5 si 5.
export function genereaza(c: Cerere, rnd: Rnd = Math.random): Valoare {
  const oarecare = () => intre(rnd, -5, 5)
  if (c.tip === 'scalar') {
    if (c.natura === 'toleranta') return alege(rnd, [1e-2, 1e-3, 1e-4, 1e-6])
    if (c.natura === 'iteratii') return alege(rnd, [20, 50, 100])
    // sub ultimul indice, ca reflectorul sa aiba ce anula
    if (c.natura === 'indice' && esteVector(c.cu)) return intre(rnd, 1, Math.max(1, c.cu.length - 1))
    // o banda ingusta, ca structura sa se vada
    if (c.natura === 'latime' && esteMatrice(c.cu)) return intre(rnd, Math.min(1, c.cu.length - 1), Math.min(2, c.cu.length - 1))
    return oarecare()
  }
  if (c.tip === 'vector') {
    const nenul = (n: number) => pana(
      () => Array.from({ length: n }, oarecare),
      (x) => x.some((e) => e !== 0),
      () => Array.from({ length: n }, () => 1),
    )
    if (c.natura === 'compatibil' && esteMatrice(c.cu)) {
      const A = c.cu
      const peA = (x: number[]) => A.map((l) => l.reduce((s, e, j) => s + e * x[j], 0))
      // b = A x pentru un x cu intregi mici
      return pana(
        () => peA(Array.from({ length: A[0].length }, () => intre(rnd, -3, 3))),
        (b) => b.some((e) => e !== 0),
        () => nenul(A.length),
      )
    }
    const n = Math.max(1, c.forma[0])
    if (c.natura === 'pornire' && esteMatrice(c.cu) && c.cu.length === c.cu[0].length) {
      // departe de perpendiculara pe directia dominanta, ca iteratia sa nu porneasca aproape de alt vector propriu
      const w = stangaDominant(c.cu)
      const A = c.cu
      return pana(
        () => nenul(A.length),
        (y) => !w || Math.abs(w.reduce((s, x, i) => s + x * y[i], 0)) >= 0.2 * Math.sqrt(y.reduce((s, x) => s + x * x, 0)),
        () => nenul(A.length),
      )
    }
    if (c.natura === 'nenul' || c.natura === 'compatibil' || c.natura === 'pornire') return nenul(n)
    return Array.from({ length: n }, oarecare)
  }

  let [m, n] = [Math.max(1, c.forma[0]), Math.max(1, c.forma[1])]
  if (c.natura && (PATRATE.includes(c.natura as Natura) || PATRATE_ALEATOR.includes(c.natura))) n = m
  const [r, q] = c.natura === 'superiorBanda' ? [0, c.latimi?.[1] ?? n - 1] : (c.latimi ?? [n - 1, n - 1])
  const inBanda = (i: number, j: number) => i - j <= r && j - i <= q
  switch (c.natura) {
    case 'inferior':
      return matrice(m, n, (i, j) => (j > i ? 0 : j === i ? semn(rnd) * intre(rnd, 1, 5) : oarecare()))
    case 'superior':
      return matrice(m, n, (i, j) => (j < i ? 0 : j === i ? semn(rnd) * intre(rnd, 1, 5) : oarecare()))
    case 'superiorBanda':
      return matrice(m, n, (i, j) => (!inBanda(i, j) ? 0 : j === i ? semn(rnd) * intre(rnd, 1, 5) : oarecare()))
    case 'diagonalaNenula':
      return matrice(m, n, (i, j) => (j === i ? semn(rnd) * intre(rnd, 1, 5) : oarecare()))
    case 'lider':
      return pana(
        () => matrice(m, n, oarecare),
        (A) => pivotNul(A, n) === 0,
        () => dominanta(m, n, rnd),
      )
    case 'bandaLider':
      return pana(
        () => matrice(m, n, (i, j) => (inBanda(i, j) ? oarecare() : 0)),
        (A) => pivotNul(A, n) === 0,
        () => dominanta(m, n, rnd, inBanda),
      )
    case 'nesingulara':
      return pana(
        () => matrice(m, n, oarecare),
        (A) => rang(A) === n,
        () => dominanta(m, n, rnd),
      )
    case 'bandaNesingulara':
      return pana(
        () => matrice(m, n, (i, j) => (inBanda(i, j) ? oarecare() : 0)),
        (A) => rang(A) === n,
        () => dominanta(m, n, rnd, inBanda),
      )
    case 'spd': {
      // A = L Lᵀ cu L intreaga si diagonala pozitiva: factorul Cholesky iese exact L
      const L = matrice(m, n, (i, j) => (j > i ? 0 : j === i ? intre(rnd, 1, 3) : intre(rnd, -2, 2)))
      return matrice(m, n, (i, j) => L[i].reduce((s, x, k) => s + x * L[j][k], 0))
    }
    case 'dominanta':
    case 'liniiDominante':
      return dominanta(m, n, rnd)
    case 'liniiNenule':
      return pana(
        () => matrice(m, n, oarecare),
        (A) => A.every((l) => l.some((x) => x !== 0)),
        () => dominanta(m, n, rnd),
      )
    case 'coloaneIndependente':
      if (m <= n) m = n + 1
      return pana(
        () => matrice(m, n, oarecare),
        (A) => rang(A) === n,
        () => dominanta(m, n, rnd),
      )
    case 'asemenea':
      return asemenea(n, rnd)
    case 'simetrica': {
      const A = matrice(m, n, oarecare)
      return A.map((l, i) => l.map((x, j) => (j < i ? A[j][i] : x)))
    }
    case 'diagonala':
      return matrice(m, n, (i, j) => (i === j ? semn(rnd) * intre(rnd, 1, 5) : 0))
    case 'bidiagonalaInf':
    case 'bidiagonalaSup': {
      // diagonala si o singura diagonala vecina, sub ea sau deasupra ei, nenule (cartea, P 1.24)
      const vecina = c.natura === 'bidiagonalaInf' ? 1 : -1
      return matrice(m, n, (i, j) => (i === j ? semn(rnd) * intre(rnd, 1, 5) : i - j === vecina ? semn(rnd) * intre(rnd, 1, 3) : 0))
    }
    case 'tridiagonala':
      // diagonalele de langa cea principala nenule, ca matricea sa fie chiar tridiagonala; diagonala
      // dominanta, ca eliminarea fara pivotare sa nu dea un pivot nul
      return cuDiagonalaDominanta(matrice(m, n, (i, j) => (Math.abs(i - j) > 1 ? 0 : i === j ? 0 : semn(rnd) * intre(rnd, 1, 3))), rnd)
    case 'hessenberg':
      // superior Hessenberg: zerouri sub prima subdiagonala; subdiagonala si coltul din dreapta sus
      // nenule, ca matricea sa nu fie o banda mai ingusta; diagonala dominanta, ca la tridiagonala
      return cuDiagonalaDominanta(matrice(m, n, (i, j) => (i - j > 1 || i === j ? 0 : i - j === 1 || j - i === n - 1 ? semn(rnd) * intre(rnd, 1, 3) : oarecare())), rnd)
    case 'ortogonala':
      return ortogonala(n, rnd)
    case 'singulara':
      return singulara(n, rnd)
    default:
      return matrice(m, n, oarecare)
  }
}

// tipurile din meniu care cer o matrice patrata, pe langa naturile din PATRATE
const PATRATE_ALEATOR: Aleator[] = ['dominanta', 'asemenea', 'simetrica', 'diagonala', 'bidiagonalaInf', 'bidiagonalaSup', 'tridiagonala', 'hessenberg', 'ortogonala', 'singulara']

// natura sau tipul cer o matrice patrata
export const cerePatrata = (a: Aleator | undefined): boolean => !!a && (PATRATE.includes(a as Natura) || PATRATE_ALEATOR.includes(a))

// Pe diagonala, un element mai mare in modul decat suma modulelor celorlalte de pe linie: strict
// diagonal dominanta pe linii, deci cu submatricele lider principale nesingulare.
function cuDiagonalaDominanta(A: number[][], rnd: Rnd): number[][] {
  return A.map((l, i) => l.map((x, j) => (i === j ? semn(rnd) * (l.reduce((s, y, k) => s + (k === i ? 0 : Math.abs(y)), 0) + intre(rnd, 1, 3)) : x)))
}

// O matrice ortogonala cu zecimale scurte: rotatii cu cos = 0.6 si sin = 0.8 pe doua perechi de
// linii, apoi liniile permutate si cu semne schimbate. Fiecare factor este ortogonal, deci si produsul.
function ortogonala(n: number, rnd: Rnd): number[][] {
  let Q = matrice(n, n, (i, j) => (i === j ? 1 : 0))
  for (let t = 0; t < Math.min(2, n - 1); t++) {
    const i = intre(rnd, 0, n - 2)
    const j = intre(rnd, i + 1, n - 1)
    const V = Q
    Q = V.map((l, a) => (a === i ? l.map((x, c) => 0.6 * x - 0.8 * V[j][c]) : a === j ? l.map((x, c) => 0.8 * V[i][c] + 0.6 * x) : l))
  }
  const linii = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = intre(rnd, 0, i)
    ;[linii[i], linii[j]] = [linii[j], linii[i]]
  }
  // produsele lui 0.6 si 0.8 au cel mult patru zecimale; rotunjirea scoate zgomotul de la inmultiri
  return linii.map((i) => {
    const s = semn(rnd)
    return Q[i].map((x) => Math.round(s * x * 1e4) / 1e4 + 0)
  })
}

// O matrice de rang n - 1: ultima linie este o combinatie a primelor doua (sau un multiplu al primei).
function singulara(n: number, rnd: Rnd): number[][] {
  if (n === 1) return [[0]]
  return pana(
    () => {
      const A = matrice(n, n, () => intre(rnd, -5, 5))
      const c = alege(rnd, [-2, -1, 1, 2])
      A[n - 1] = n > 2 ? A[0].map((x, k) => x + c * A[1][k]) : A[0].map((x) => c * x)
      return A
    },
    (A) => rang(A) === n - 1,
    // I cu ultima linie inlocuita de prima
    () => matrice(n, n, (i, j) => (i === n - 1 ? (j === 0 ? 1 : 0) : i === j ? 1 : 0)),
  )
}

// Ce proprietati din curs are o matrice, pentru randul de sub ea: forma (diagonala, triunghiulara,
// tridiagonala, Hessenberg, banda), simetria, ortogonalitatea, dominanta diagonala, rangul,
// submatricele lider, pozitiv definirea si, pentru o metoda iterativa, raza spectrala a matricei de iteratie.
export interface Proprietate {
  cheie: CheieText
  args: (string | number)[]
}

export function proprietati(A: number[][], iteratie?: 'jacobi' | 'gs'): Proprietate[] {
  const p = (cheie: CheieText, ...args: (string | number)[]): Proprietate => ({ cheie, args })
  const m = A.length
  const n = A[0].length
  if (m !== n) {
    const r = rang(A)
    return [m > n && r === n ? p('propColoane') : p('propRang', r)]
  }
  const rez: Proprietate[] = []
  // latimile de banda: cat de departe de diagonala ajunge un element nenul, sub ea si deasupra ei
  let jos = 0
  let sus = 0
  A.forEach((l, i) =>
    l.forEach((x, j) => {
      if (x === 0) return
      jos = Math.max(jos, i - j)
      sus = Math.max(sus, j - i)
    }),
  )
  if (n > 1) {
    if (jos === 0 && sus === 0) rez.push(p('propDiagonala'))
    else if (n > 2 && sus === 0 && jos === 1) rez.push(p('propBidiagonalaInf'))
    else if (n > 2 && jos === 0 && sus === 1) rez.push(p('propBidiagonalaSup'))
    else if (sus === 0) rez.push(p('propInferior'))
    else if (jos === 0) rez.push(p('propSuperior'))
    // orice matrice 2 x 2 este tridiagonala si Hessenberg; structura de banda se spune de la n = 3
    else if (n > 2 && jos === 1 && sus === 1) rez.push(p('propTridiagonala'))
    // Hessenberg este banda cu o singura diagonala de o parte si toate de cealalta
    else if (n > 2 && jos === 1 && sus === n - 1) rez.push(p('propHessenbergSup'))
    else if (n > 2 && sus === 1 && jos === n - 1) rez.push(p('propHessenbergInf'))
    else if (n > 2 && (jos < n - 1 || sus < n - 1)) rez.push(p('propBanda', jos, sus))
  }
  const simetrica = A.every((l, i) => l.every((x, j) => x === A[j][i]))
  if (simetrica && n > 1) rez.push(p('propSimetrica'))
  const QtQ = A[0].map((_, i) => A[0].map((_, j) => A.reduce((s, l) => s + l[i] * l[j], 0)))
  if (QtQ.every((l, i) => l.every((x, j) => Math.abs(x - (i === j ? 1 : 0)) <= 1e-9))) rez.push(p('propOrtogonala'))
  if (esteDominanta(A)) rez.push(p('propDominanta'))
  const r = rang(A)
  rez.push(r === n ? p('propNesingulara') : p('propSingulara', r))
  if (n > 1) {
    const k = pivotNul(A, n - 1)
    rez.push(k ? p('propLiderNu', k) : p('propLider'))
  }
  if (simetrica) {
    const k = pasNepozitiv(A)
    rez.push(k ? p('propNuSpd', k) : p('propSpd'))
  }
  if (iteratie && A.every((l, i) => l[i] !== 0)) {
    const rho = Number(razaSpectrala(matriceIteratie(A, iteratie)).toPrecision(3))
    rez.push(p(iteratie === 'jacobi' ? 'propRhoJacobi' : 'propRhoGS', rho))
  }
  return rez
}
