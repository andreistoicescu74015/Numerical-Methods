// Ce ramane adevarat dupa fiecare pas complet al buclei exterioare: proprietatea pe care o
// folosesc demonstratiile din curs (A_k superior triunghiulara in primele k-1 coloane, coloanele
// lui L calculate din A = LLᵀ, ecuatiile deja rezolvate). Se verifica numeric, reconstruind din
// valorile din grila ce spune cursul si masurand abaterea.
import type { Instr, Program } from './motor/ast'
import { stareLa, type Intrari, type Rezultat } from './motor/interpretor'
import type { Limba } from './motor/mesaje'
import type { Tablou } from './motor/valori'

type Text = Record<Limba, string>
type M = number[][]

type Fel = 'eliminare' | 'eliminarePP' | 'crout' | 'cholesky' | 'qr' | 'inainte' | 'inapoi'

const FEL: Record<string, Fel> = {
  G: 'eliminare',
  S_G: 'eliminare',
  Gb: 'eliminare',
  GPP: 'eliminarePP',
  S_GPP: 'eliminarePP',
  GPPb: 'eliminarePP',
  LU: 'crout',
  CHOL: 'cholesky',
  QR: 'qr',
  SQR: 'qr',
  LTRIS: 'inainte',
  UTRIS: 'inapoi',
  UTRISb: 'inapoi',
}

export const areInvariant = (id: string): boolean => id in FEL

// produsul primilor c factori, de la ultimul la primul: "M_3 ⋯ M_1", "M_1", nimic pentru c = 0
const produs = (factor: (j: number) => string, c: number): string => (c === 0 ? '' : c === 1 ? `${factor(1)}\\, ` : `${factor(c)} \\cdots ${factor(1)}\\, `)

// Enuntul, ca formula si ca text; {0} este numarul de pasi completi, {1} cel urmator
// `final`: enuntul dupa toti pasii, cand proprietatea partiala a devenit identitatea intreaga
const ENUNT: Record<Fel, { tex: (c: number) => string; text: Text; curs: Text; final?: { tex: string; text: Text } }> = {
  eliminare: {
    tex: (c) => `A_{${c + 1}} = ${produs((j) => `M_{${j}}`, c)}A`,
    text: {
      ro: 'Matricea curentă A_({1}) este A înmulțită cu primele {0} matrice M_k: are zerouri sub diagonală în primele {0} coloane (în grilă, acolo stau multiplicatorii). Cu multiplicatorii păstrați, L A_({1}) = A, unde L are 1 pe diagonală și multiplicatorii sub ea.',
      en: 'The current matrix A_({1}) is A multiplied by the first {0} matrices M_k: it has zeros below the diagonal in the first {0} columns (in the grid, the multipliers sit there). With the stored multipliers, L A_({1}) = A, where L has ones on the diagonal and the multipliers below it.',
    },
    curs: {
      ro: 'Curs III, demonstrația teoremei de triangularizare prin eliminare gaussiană (A_k este superior triunghiulară în primele k−1 coloane) și slide-ul "Factorizari LU rezultate din eliminarea gaussiana" (L = M₁⁻¹ ⋯ M_(n−1)⁻¹).',
      en: 'Course III, the proof of the theorem on triangularization by Gaussian elimination (A_k is upper triangular in its first k−1 columns) and the slide "Factorizari LU rezultate din eliminarea gaussiana" (L = M₁⁻¹ ⋯ M_(n−1)⁻¹).',
    },
  },
  eliminarePP: {
    tex: (c) => `A_{${c + 1}} = ${produs((j) => `M_{${j}} P_{${j}}`, c)}A`,
    text: {
      ro: 'Matricea curentă A_({1}) se obține din A cu primele {0} interschimbări P_k și eliminări M_k, în ordinea lor: are zerouri sub diagonală în primele {0} coloane (în grilă, acolo stau multiplicatorii), iar vectorul p ține interschimbările.',
      en: 'The current matrix A_({1}) comes from A by the first {0} swaps P_k and eliminations M_k, in their order: it has zeros below the diagonal in the first {0} columns (in the grid, the multipliers sit there), and the vector p holds the swaps.',
    },
    curs: {
      ro: 'Curs III, slide-ul "Algoritmul GPP - Eliminare gaussiana cu pivotare partiala": U = M_(n−1)P_(n−1) ⋯ M₁P₁A, construită pas cu pas.',
      en: 'Course III, slide "Algoritmul GPP - Eliminare gaussiana cu pivotare partiala": U = M_(n−1)P_(n−1) ⋯ M₁P₁A, built step by step.',
    },
  },
  crout: {
    final: { tex: 'A = LU', text: { ro: 'Toate coloanele lui L și toate liniile lui U sunt gata: A = LU.', en: 'All columns of L and all rows of U are done: A = LU.' } },
    tex: (c) => (c ? `A(:, 1\\!:\\!${c}) = L(:, 1\\!:\\!${c})\\, U(1\\!:\\!${c}, 1\\!:\\!${c}), \\quad A(1\\!:\\!${c}, :) = L(1\\!:\\!${c}, 1\\!:\\!${c})\\, U(1\\!:\\!${c}, :)` : 'A = LU'),
    text: {
      ro: 'Primele {0} coloane ale lui L și primele {0} linii ale lui U sunt gata: în primele {0} coloane și în primele {0} linii, A este deja egală cu produsul LU.',
      en: 'The first {0} columns of L and the first {0} rows of U are done: in the first {0} columns and in the first {0} rows, A already equals the product LU.',
    },
    curs: {
      ro: 'Curs III, slide-urile "Factorizari LU compacte": din relația A = LU se calculează succesiv câte o coloană din L și câte o linie din U.',
      en: 'Course III, slides "Factorizari LU compacte": from A = LU, one column of L and one row of U are computed in turn.',
    },
  },
  cholesky: {
    final: { tex: 'A = LL^T', text: { ro: 'Toate coloanele lui L sunt gata: A = LLᵀ.', en: 'All columns of L are done: A = LLᵀ.' } },
    tex: (c) => (c ? `A(:, 1\\!:\\!${c}) = L(:, 1\\!:\\!${c})\\, L(1\\!:\\!${c}, 1\\!:\\!${c})^T` : 'A = LL^T'),
    text: {
      ro: 'Primele {0} coloane ale lui L sunt gata: în primele {0} coloane, A este deja egală cu produsul LLᵀ, iar restul lui L se calculează din coloanele următoare.',
      en: 'The first {0} columns of L are done: in the first {0} columns, A already equals the product LLᵀ, and the rest of L comes from the next columns.',
    },
    curs: {
      ro: 'Curs III, slide-urile "Sisteme simetrice pozitiv definite": elementele lui L se obțin coloană cu coloană din identitatea A = LLᵀ.',
      en: 'Course III, slides "Sisteme simetrice pozitiv definite": the entries of L come column by column from the identity A = LLᵀ.',
    },
  },
  qr: {
    tex: (c) => `A_{${c + 1}} = ${produs((j) => `U_{${j}}`, c)}A`,
    text: {
      ro: 'Matricea curentă A_({1}) este A înmulțită cu primii {0} reflectori U_k: are zerouri sub diagonală în primele {0} coloane (în grilă, acolo stau vectorii Householder), iar reflectorii păstrează norma euclidiană (lungimea) fiecărei coloane.',
      en: 'The current matrix A_({1}) is A multiplied by the first {0} reflectors U_k: it has zeros below the diagonal in the first {0} columns (in the grid, the Householder vectors sit there), and the reflectors keep the Euclidean norm (the length) of every column.',
    },
    curs: {
      ro: 'Curs IV, demonstrația triangularizării ortogonale: A_(k+1) = U_k A_k este superior triunghiulară în primele k coloane.',
      en: 'Course IV, the proof of orthogonal triangularization: A_(k+1) = U_k A_k is upper triangular in its first k columns.',
    },
  },
  inainte: {
    final: { tex: 'Lx = b', text: { ro: 'Toate necunoscutele sunt aflate și verifică toate ecuațiile: x este soluția.', en: 'All unknowns are found and satisfy all equations: x is the solution.' } },
    tex: (c) => (c ? `L(1\\!:\\!${c}, 1\\!:\\!${c})\\, x(1\\!:\\!${c}) = b(1\\!:\\!${c})` : 'Lx = b'),
    text: {
      ro: 'Primele {0} necunoscute sunt aflate și verifică primele {0} ecuații; fiecare ecuație următoare aduce o singură necunoscută nouă.',
      en: 'The first {0} unknowns are found and satisfy the first {0} equations; each following equation brings one new unknown.',
    },
    curs: {
      ro: 'Curs II, slide-urile "Rezolvarea sistemelor triunghiulare".',
      en: 'Course II, slides "Rezolvarea sistemelor triunghiulare".',
    },
  },
  inapoi: {
    final: { tex: 'Ux = b', text: { ro: 'Toate necunoscutele sunt aflate și verifică toate ecuațiile: x este soluția.', en: 'All unknowns are found and satisfy all equations: x is the solution.' } },
    tex: (c) => {
      // ultimele c pozitii: n - c + 1 : n, adica n : n dupa primul pas
      const de = c === 1 ? 'n' : `n\\!-\\!${c - 1}`
      return c ? `U(${de}\\!:\\!n,\\, ${de}\\!:\\!n)\\, x(${de}\\!:\\!n) = b(${de}\\!:\\!n)` : 'Ux = b'
    },
    text: {
      ro: 'Ultimele {0} necunoscute sunt aflate și verifică ultimele {0} ecuații; fiecare ecuație de deasupra aduce o singură necunoscută nouă.',
      en: 'The last {0} unknowns are found and satisfy the last {0} equations; each equation above brings one new unknown.',
    },
    curs: {
      ro: 'Curs II, slide-ul "Rezolvarea sistemelor triunghiulare": se cunosc x_n, ..., x_(i+1) și se rezolvă a i-a ecuație.',
      en: 'Course II, slide "Rezolvarea sistemelor triunghiulare": x_n, ..., x_(i+1) are known and equation i is solved.',
    },
  },
}

export interface Invariant {
  // pasii completi ai buclei exterioare la momentul verificat
  complete: number
  // toti pasii buclei au fost facuti
  final: boolean
  // pasul urmei la care s-a verificat (inceputul pasului urmator, sau iesirea din bucla)
  pas: number
  tex: string
  text: Text
  curs: Text
  // cea mai mare abatere, raportata la marimea datelor
  abatere: number
}

// liniile ocupate de o instructiune, cu tot cu corpul ei
function ultimaLinie(s: Instr): number {
  if (s.tip === 'pentru' || s.tip === 'cattimp') return Math.max(s.linie, ...s.corp.map(ultimaLinie))
  if (s.tip === 'daca') return Math.max(s.linie, ...s.atunci.map(ultimaLinie), ...(s.altfel ?? []).map(ultimaLinie))
  return s.linie
}

// Pasii urmei la care incepe o iteratie a primei bucle "pentru" de pe primul nivel, plus primul
// pas de dupa ea: la fiecare, cati pasi completi are bucla.
export function limite(program: Program, rez: Rezultat): { pas: number; complete: number; final: boolean }[] {
  const bucla = program.instr.find((s) => s.tip === 'pentru')
  if (!bucla) return []
  const ultima = ultimaLinie(bucla)
  const rez2: { pas: number; complete: number; final: boolean }[] = []
  let iteratii = 0
  for (let idx = 0; idx < rez.pasi.length; idx++) {
    const p = rez.pasi[idx]
    if (p.fel === 'antet' && p.linie === bucla.linie) {
      rez2.push({ pas: idx, complete: iteratii, final: false })
      iteratii++
    } else if (iteratii > 0 && (p.fel === 'final' ? rez.final === 'gata' : p.linie < bucla.linie || p.linie > ultima)) {
      // o rulare oprita in bucla (stop, eroare) nu iese din ea: ultima limita ramane inceputul
      // pasului la care s-a oprit
      rez2.push({ pas: idx, complete: iteratii, final: true })
      break
    }
  }
  return rez2
}

const matriceDin = (t: Tablou): M => (t.tip === 'vector' ? t.d.map((x) => [x]) : Array.from({ length: t.m }, (_, i) => t.d.slice(i * t.n, i * t.n + t.n)))
const scara = (A: M): number => Math.max(1, ...A.flat().map(Math.abs))
// Abaterea se raporteaza la cele mai mari valori care intra in calcul (datele, valorile intermediare,
// produsele), pentru ca rotunjirile cresc odata cu ele; altfel un calcul corect cu elemente care
// cresc, sau cu t cifre, ar parea gresit.
const maxim = (...valori: number[][]): number => Math.max(1, ...valori.flat().map(Math.abs))

// A cu interschimbarile si eliminarile primilor c pasi, cu multiplicatorii din S; abaterea fata de
// S, in care pozitiile multiplicatorilor se citesc ca zerouri
function eliminare(A0: M, S: M, c: number, p?: number[]): number {
  const W = A0.map((l) => [...l])
  const n = W.length
  for (let j = 0; j < c; j++) {
    if (p) {
      const i = p[j] - 1
      ;[W[j], W[i]] = [W[i], W[j]]
    }
    for (let i = j + 1; i < n; i++) {
      const mu = S[i][j]
      W[i] = W[i].map((x, c2) => x - mu * W[j][c2])
    }
  }
  let ab = 0
  W.forEach((l, i) => l.forEach((x, j) => (ab = Math.max(ab, Math.abs(x - (j < c && i > j ? 0 : S[i][j]))))))
  return ab / maxim(...A0, ...W, ...S)
}

function crout(A0: M, S: M, c: number): number {
  const n = A0.length
  const L = (i: number, s: number) => (i >= s ? S[i][s] : 0)
  const U = (s: number, j: number) => (s === j ? 1 : s < j ? S[s][j] : 0)
  // produsul LU si, pentru scara, |L||U|
  const LU = (i: number, j: number, modul = false) => {
    let s = 0
    for (let t = 0; t <= Math.min(i, j); t++) s += modul ? Math.abs(L(i, t) * U(t, j)) : L(i, t) * U(t, j)
    return s
  }
  let ab = 0
  let sc = scara(A0)
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (j < c || i < c) {
        ab = Math.max(ab, Math.abs(A0[i][j] - LU(i, j)))
        sc = Math.max(sc, LU(i, j, true))
      }
  return ab / sc
}

function cholesky(A0: M, S: M, c: number): number {
  const n = A0.length
  let ab = 0
  let sc = scara(A0)
  for (let j = 0; j < c; j++)
    for (let i = j; i < n; i++) {
      let s = 0
      let modul = 0
      for (let t = 0; t <= j; t++) {
        s += S[i][t] * S[j][t]
        modul += Math.abs(S[i][t] * S[j][t])
      }
      ab = Math.max(ab, Math.abs(A0[i][j] - s))
      sc = Math.max(sc, modul)
    }
  return ab / sc
}

function qr(A0: M, S: M, c: number, beta: number[]): number {
  const W = A0.map((l) => [...l])
  const m = W.length
  const n = W[0].length
  for (let k = 0; k < c; k++) {
    const b = beta[k]
    if (b === 0) continue
    const u = Array.from({ length: m }, (_, i) => (i < k ? 0 : i === k ? b : S[i][k]))
    for (let j = 0; j < n; j++) {
      const nu = u.reduce((s, x, i) => s + x * W[i][j], 0) / b
      for (let i = k; i < m; i++) W[i][j] -= nu * u[i]
    }
  }
  let ab = 0
  W.forEach((l, i) => l.forEach((x, j) => (ab = Math.max(ab, Math.abs(x - (j < c && i > j ? 0 : S[i][j]))))))
  return ab / maxim(...A0, ...W, ...S)
}

// ecuatiile 1..c (inainte) sau n-c+1..n (inapoi) cu necunoscutele deja aflate
function substitutie(T: M, b: number[], x: number[], c: number, inainte: boolean): number {
  const n = T.length
  let ab = 0
  // scara: |b| si |T||x| pe ecuatiile verificate
  let sc = Math.max(1, ...b.map(Math.abs))
  const linii = inainte ? Array.from({ length: c }, (_, i) => i) : Array.from({ length: c }, (_, i) => n - 1 - i)
  for (const i of linii) {
    // doar elementele triunghiului: sub (inainte) sau peste (inapoi) diagonala, cu ea
    const inTriunghi = (j: number) => (inainte ? j <= i : j >= i)
    const s = T[i].reduce((acc, t, j) => (inTriunghi(j) ? acc + t * x[j] : acc), 0)
    sc = Math.max(sc, T[i].reduce((acc, t, j) => (inTriunghi(j) ? acc + Math.abs(t * x[j]) : acc), 0))
    ab = Math.max(ab, Math.abs(s - b[i]))
  }
  return ab / sc
}

// Invariantul algoritmului `id` la ultima limita dintre pasi de dinainte de pasul `k` (inclusiv).
// Pe un pseudocod modificat (alte capete de bucla) sau pe intrari de alta forma, reconstructia poate
// iesi din tablouri: atunci nu se arata nimic, in loc sa se opreasca aplicatia.
export function invariant(id: string, program: Program, rez: Rezultat, intrari: Intrari, k: number): Invariant | null {
  try {
    const inv = calculeaza(id, program, rez, intrari, k)
    return inv && Number.isFinite(inv.abatere) ? inv : null
  } catch {
    return null
  }
}

function calculeaza(id: string, program: Program, rez: Rezultat, intrari: Intrari, k: number): Invariant | null {
  const fel = FEL[id]
  if (!fel) return null
  const toate = limite(program, rez)
  const lim = [...toate].reverse().find((l) => l.pas <= k)
  if (!lim) return null
  const S = stareLa(rez, lim.pas)
  const c = lim.complete
  let abatere: number
  if (fel === 'inainte' || fel === 'inapoi') {
    const T = intrari[fel === 'inainte' ? 'L' : 'U'] as M
    const b = intrari.b as number[]
    if (!S.x) return null
    abatere = substitutie(T, b, S.x.d, c, fel === 'inainte')
  } else {
    const A0 = intrari.A as M
    if (!S.A) return null
    const St = matriceDin(S.A)
    if (fel === 'eliminare') abatere = eliminare(A0, St, c)
    else if (fel === 'eliminarePP') abatere = S.p ? eliminare(A0, St, c, S.p.d) : NaN
    else if (fel === 'crout') abatere = crout(A0, St, c)
    else if (fel === 'cholesky') abatere = cholesky(A0, St, c)
    else abatere = S['β'] ? qr(A0, St, c, S['β'].d) : NaN
  }
  const e = ENUNT[fel]
  const f = lim.final ? e.final : undefined
  return { complete: c, final: lim.final, pas: lim.pas, tex: f?.tex ?? e.tex(c), text: f?.text ?? e.text, curs: e.curs, abatere }
}
