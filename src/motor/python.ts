// Emite cod Python din arborele sintactic, in stilul laboratoarelor: `import numpy as np`,
// indici de la 0, bucle `for ... in range(...)` pe elemente si `return` cu rezultatele.
//
// Pseudocodul numara de la 1, NumPy de la 0. Variabilele de bucla tin in Python pozitia, adica
// valoarea din pseudocod minus 1. La fel scalarii care primesc doar pozitii (i_k din argmax) si
// tablourile in care se scriu doar pozitii si care se folosesc ca indici (p la GPP). Orice alt
// nume isi pastreaza valoarea din pseudocod, iar cand ajunge indice se scrie `x[k - 1]`. Ce nume
// tin pozitii se afla prin treceri repetate: se porneste de la presupunerea ca toate, si la
// fiecare trecere ies cele care primesc si altceva.
//
// Tipurile numelor (matrice, vector, scalar) se deduc static, ca sa stim cand `A y` e produs
// matrice-vector si `z^T y` produs scalar.
import type { Expr, Instr, Interval, Program, Tinta } from './ast'
import type { Limba } from './mesaje'

export type TipNume = 'matrice' | 'vector' | 'rand' | 'scalar'

export interface OptiuniPython {
  nume: string
  intrari: { nume: string; tip: 'matrice' | 'vector' | 'scalar' }[]
  // ce intoarce functia; fara lista, tablourile scrise de program (sau scalarii, daca nu scrie niciunul)
  iesiri?: string[]
  // algoritmul cere ca prima matrice sa fie patrata: n se ia din numarul de linii, ca in laborator;
  // altfel n este numarul de coloane, ca in interpretor
  patrata?: boolean
  limba?: Limba
  // valorile intrarilor, pentru apelul de la sfarsitul fisierului; fara ele, fisierul are doar functia
  exemplu?: Record<string, number | number[] | number[][]>
  // liniile care compara rezultatul cu functia standard din NumPy, puse dupa apel; {x} este
  // variabila in care a ajuns rezultatul x, iar {dif} eticheta diferentei
  numpy?: string[]
}

export interface CodPython {
  cod: string
  // numele din pseudocod intoarse de functie, in ordine
  iesiri: string[]
  // dintre ele, cele care tin pozitii numarate de la 0
  indici: string[]
  // numele lor in codul Python (β devine beta)
  iesiriPython: string[]
  // variabilele in care ajung in exemplul de la sfarsit: x_rez cand x este si intrare
  rezultateExemplu: string[]
}

const GRECESTI: Record<string, string> = {
  α: 'alpha',
  β: 'beta',
  γ: 'gamma',
  δ: 'delta',
  ε: 'eps',
  θ: 'theta',
  λ: 'lam',
  μ: 'mu',
  ν: 'nu',
  ρ: 'rho',
  σ: 'sigma',
  τ: 'tau',
  ω: 'omega',
}
// cuvintele cheie Python si numele folosite de codul emis, pe care un nume din pseudocod nu le poate lua
const REZERVATE = new Set([
  ...['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except'],
  ...['finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'],
  ...['sum', 'min', 'max', 'abs', 'int', 'len', 'np', 'range', 'sgn', 'print', 'float'],
])

const COMENTARII = {
  antet: {
    ro: ['Generat din pseudocod de vizualizatorul de Metode numerice.', 'Indicii pornesc de la 0, ca in NumPy: bucla "k = 1 : n-1" devine', 'range(n - 1), iar a_ij ramane A[i, j].'],
    en: ['Generated from pseudocode by the Numerical Methods visualizer.', 'Indices start at 0, as in NumPy: the loop "k = 1 : n-1" becomes', 'range(n - 1), and a_ij stays A[i, j].'],
  },
  pozitii: { ro: '{0}: pozitii numarate de la 0', en: '{0}: positions counted from 0' },
  copie: { ro: 'copii de lucru in virgula mobila: intrarile raman neschimbate', en: 'floating point working copies: the inputs are left unchanged' },
  peste: { ro: '{0} peste {1}: se citesc si se scriu in {1}', en: '{0} over {1}: read from and written to {1}' },
  sgn: {
    ro: 'sgn(0) = 1 (cartea cursului); np.sign(0) = 0 ar da impartire la 0',
    en: 'sgn(0) = 1 (course book); np.sign(0) = 0 would divide by zero',
  },
  dinPseudocod: { ro: '{0} se da ca in pseudocod, numarat de la 1', en: '{0} is given as in the pseudocode, counted from 1' },
  intreg: { ro: '{0} este un indice numarat de la 1, ca in pseudocod; in NumPy: {0} - 1', en: '{0} is an index counted from 1, as in the pseudocode; in NumPy: {0} - 1' },
  exemplu: { ro: 'exemplul din vizualizator', en: 'the example from the visualizer' },
  comparatie: { ro: 'comparatia cu NumPy', en: 'comparison with NumPy' },
  diferenta: { ro: 'diferenta maxima fata de NumPy:', en: 'largest difference from NumPy:' },
}

// numele acumulatorului unei sume scoase in bucla
const SUMA: Record<Limba, string> = { ro: 'suma', en: 'total' }

const numarPython = (x: number): string => (Number.isFinite(x) ? String(Object.is(x, -0) ? 0 : x) : `float("${Number.isNaN(x) ? 'nan' : x > 0 ? 'inf' : '-inf'}")`)

function valoarePython(v: number | number[] | number[][]): string {
  if (typeof v === 'number') return numarPython(v)
  const lista = (l: number[]) => `[${l.map(numarPython).join(', ')}]`
  return `np.array(${Array.isArray(v[0]) ? `[${(v as number[][]).map(lista).join(', ')}]` : lista(v as number[])})`
}

// O expresie intreaga scrisa ca suma de termeni cu coeficienti si o constanta, ca "k + 1 - 1"
// sa se tipareasca "k".
interface Afin {
  t: Map<string, number>
  c: number
}

function aduna(a: Afin, b: Afin, semn: 1 | -1): Afin {
  const t = new Map(a.t)
  for (const [s, k] of b.t) t.set(s, (t.get(s) ?? 0) + semn * k)
  return { t, c: a.c + semn * b.c }
}

function ori(a: Afin, f: number): Afin {
  return { t: new Map([...a.t].map(([s, k]) => [s, k * f])), c: a.c * f }
}

function scrieAfin(a: Afin, delta = 0): string {
  const termeni = [...a.t].filter(([, k]) => k !== 0)
  const un = (s: string, k: number) => (Math.abs(k) === 1 ? s : `${Math.abs(k)} * ${s}`)
  const pozitivi = termeni.filter(([, k]) => k > 0)
  const negativi = termeni.filter(([, k]) => k < 0)
  const c = a.c + delta
  let s = pozitivi.map(([x, k]) => un(x, k)).join(' + ')
  for (const [x, k] of negativi) s = s ? `${s} - ${un(x, k)}` : `-${un(x, k)}`
  if (!s) return String(c)
  if (c > 0) return `${s} + ${c}`
  if (c < 0) return `${s} - ${-c}`
  return s
}

// Ce se stie despre nume inaintea unei treceri. Multimile de pozitii si de intregi doar scad
// de la o trecere la alta, deci trecerile se opresc.
interface Stare {
  // scalari, altii decat variabilele de bucla, care primesc doar pozitii
  pozScalari: Set<string>
  // tablouri in care se scriu doar pozitii si care se folosesc ca indici sau primesc pozitia unui argmax
  pozTablouri: Set<string>
  // scalari care primesc doar dimensiuni de tablouri (linii, coloane, lungime): sunt cel putin 1
  dimensiuni: Set<string>
  // nume in care ajunge pozitia unui argmax, direct sau prin alte nume: dovada ca tin pozitii.
  // Multimea creste si se calculeaza prima, ca dovada sa nu se sprijine pe ea insasi.
  siguri: Set<string>
  // scalari care primesc doar valori sigur intregi: se pot folosi in range() si ca indici fara int()
  intregi: Set<string>
  // tablourile aflate la trecerea dinainte, pentru numele citite inainte de locul unde se atribuie
  tipuri: Map<string, TipNume>
}

interface Inventar {
  nume: Set<string>
  bucle: Set<string>
  // m sau n citite inainte ca programul sa le atribuie
  citite: Set<string>
  atribuite: Set<string>
  // variabile de bucla citite si in afara buclei lor
  cititeInAfara: Set<string>
  // tablou -> capetele buclelor "v = 1 : L" care ii scriu direct fiecare element x_v
  acoperite: Map<string, string[]>
}

class Emitator {
  tipuri = new Map<string, TipNume>()
  alias = new Map<string, string>()
  linii: string[] = []
  // variabilele legate acum de o suma sau de un extrem, cu numele lor Python
  private locali: [string, string][] = []
  // numele Python ale buclelor "pentru" in care ne aflam
  private bucle: string[] = []
  private sume = new Map<Expr, string>()
  // numele ajutatoare (sume, pozitii) folosite de instructiunea curenta
  private ajutatoare = new Set<string>()
  private scrise: string[] = []
  private py = new Map<string, string>()
  private luate = new Set<string>()
  // atomi despre care se stie ca sunt cel putin 1: m, n si dimensiunile citite din tablouri
  private dimensiuni = new Set<string>()
  // atomi care nu pot fi negativi: pozitiile
  private nenegative = new Set<string>()
  // un element citit aici este folosit ca indice; fals cat se scrie valoarea unei pozitii
  private marcheaza = true
  folosesteSgn = false
  // ce a aflat trecerea
  nonPoz = new Set<string>()
  nonIntreg = new Set<string>()
  nonDimensiune = new Set<string>()
  // tablouri care au primit macar o pozitie adevarata (argmax, un scalar de pozitie), nu doar un contor de bucla
  sursaSigura = new Set<string>()
  indiceTablou = new Set<string>()
  cititAltfel = new Set<string>()
  scalarLaInceput = new Set<string>()
  intrariIntregi = new Set<string>()

  constructor(
    private opt: OptiuniPython,
    private stare: Stare,
    private inv: Inventar,
  ) {
    for (const i of opt.intrari) {
      this.tipuri.set(i.nume, i.tip)
      this.nume(i.nume)
    }
    // interpretorul defineste m si n din prima matrice, sau n din primul vector
    const implicite = opt.intrari.some((i) => i.tip === 'matrice') ? ['m', 'n'] : opt.intrari.some((i) => i.tip === 'vector') ? ['n'] : []
    for (const d of implicite) {
      if (!this.tipuri.has(d)) this.tipuri.set(d, 'scalar')
      if (!inv.atribuite.has(d) && !opt.intrari.some((i) => i.nume === d)) this.dimensiuni.add(this.nume(d))
    }
    for (const [n, t] of stare.tipuri) if (!this.tipuri.has(n)) this.tipuri.set(n, t)
    for (const n of inv.nume) this.nume(n)
    for (const n of stare.dimensiuni) this.dimensiuni.add(this.nume(n))
  }

  // Numele Python al unui nume din pseudocod. Doua nume diferite nu ajung niciodata la acelasi
  // nume Python: p_{k-1} si p_{k+1} devin p_km1 si p_kp1.
  nume(n: string): string {
    const stiut = this.py.get(n)
    if (stiut) return stiut
    let s = [...n].map((ch) => GRECESTI[ch] ?? ch).join('')
    s = s.replace(/[{}\s]/g, '').replace(/\+/g, 'p').replace(/-/g, 'm').replace(/[^\p{L}\p{N}_]/gu, '_')
    if (REZERVATE.has(s) || /^\p{N}/u.test(s) || s === '') s = `${s}_`
    let liber = s
    for (let k = 2; this.luate.has(liber); k++) liber = `${s}_${k}`
    this.py.set(n, liber)
    this.luate.add(liber)
    return liber
  }

  // un nume ajutator care nu e al programului si nu e folosit de instructiunea curenta
  private numeNou(baza: string): string {
    const ocupat = (x: string) => this.luate.has(x) || this.ajutatoare.has(x) || this.locali.some(([, p]) => p === x)
    let s = baza
    for (let k = 1; ocupat(s); k++) s = `${baza}${k}`
    this.ajutatoare.add(s)
    return s
  }

  private rezolva(nume: string): string {
    const a = this.alias.get(nume)
    if (a) return a
    if (this.tipuri.has(nume)) return nume
    const mare = nume.toUpperCase()
    if (this.tipuri.has(mare)) return mare
    return nume
  }

  private esteTablou(nume: string): boolean {
    const t = this.tipuri.get(nume)
    return t === 'matrice' || t === 'vector'
  }

  // Tabloul unui element ca a_ij, ca in interpretor: cand litera mica e un scalar, tabloul cu
  // litera mare castiga daca numarul de indici i se potriveste.
  private tablouElem(e: Extract<Expr, { tip: 'elem' }>): string {
    const nume = this.rezolva(e.nume)
    if (this.esteTablou(nume)) return nume
    const mare = e.nume.toUpperCase()
    const t = this.tipuri.get(mare)
    return (t === 'vector' && e.idx.length === 1) || (t === 'matrice' && e.idx.length === 2) ? mare : nume
  }

  private local(nume: string): string | undefined {
    for (let k = this.locali.length - 1; k >= 0; k--) if (this.locali[k][0] === nume) return this.locali[k][1]
    return undefined
  }

  // scalarul `nume` tine o pozitie, deci in Python are valoarea din pseudocod minus 1
  private pozitie(nume: string): boolean {
    return this.inv.bucle.has(nume) || this.stare.pozScalari.has(nume)
  }

  // z^T pentru un vector NumPy este tot z
  private faraTranspuneri(e: Expr): Expr {
    while (e.tip === 'transp' && this.tip(e.a) !== 'matrice') e = e.a
    return e
  }

  // expresia e un tablou de pozitii luat intreg sau pe o felie: valorile lui sunt cu 1 mai mici
  private tablouDePozitii(e0: Expr): boolean {
    const e = this.faraTranspuneri(e0)
    if (e.tip !== 'var' && e.tip !== 'felie') return false
    if (e.tip === 'var' && this.local(e.nume)) return false
    const baza = this.rezolva(e.nume)
    return this.esteTablou(baza) && this.stare.pozTablouri.has(baza)
  }

  // tabloul sau felia, fara corectia de 1
  private brut(e0: Expr): string {
    const e = this.faraTranspuneri(e0) as Extract<Expr, { tip: 'var' | 'felie' }>
    return e.tip === 'felie' ? this.felie(e) : this.nume(this.rezolva(e.nume))
  }

  tip(e: Expr): TipNume {
    switch (e.tip) {
      case 'var':
        return this.local(e.nume) ? 'scalar' : (this.tipuri.get(this.rezolva(e.nume)) ?? 'scalar')
      case 'felie': {
        const baza = this.tipuri.get(this.rezolva(e.nume))
        if (baza === 'vector' || e.idx.length === 1) return 'vector'
        const unul = (x: Expr | Interval | null) => x !== null && x.tip !== 'interval'
        return unul(e.idx[0]) ? 'rand' : unul(e.idx[1]) ? 'vector' : 'matrice'
      }
      case 'bin': {
        const a = this.tip(e.a)
        const b = this.tip(e.b)
        if (e.op === '^') return 'scalar'
        if (e.op === '*') {
          if (a === 'matrice' && b === 'vector') return 'vector'
          if (a === 'matrice' && b === 'matrice') return 'matrice'
          if (a === 'rand' && b === 'vector') return 'scalar'
          if (a === 'rand' && b === 'matrice') return 'rand'
          if (a === 'vector' && b === 'rand') return 'matrice'
          if (a === 'scalar') return b
          return a
        }
        return a === 'scalar' ? b : a
      }
      case 'neg':
        return this.tip(e.a)
      case 'transp': {
        const a = this.tip(e.a)
        return a === 'vector' ? 'rand' : a === 'rand' ? 'vector' : a
      }
      default:
        return 'scalar'
    }
  }

  // ---- expresii intregi: indici, capete de bucla, dimensiuni ----

  // valoarea expresiei este o pozitie tinuta ca atare in Python
  private ePozitie(e: Expr): boolean {
    if (e.tip === 'extrem') return e.fel === 'argmax' || e.fel === 'argmin'
    if (e.tip === 'var') return !!this.local(e.nume) || (!this.esteTablou(this.rezolva(e.nume)) && this.pozitie(e.nume))
    if (e.tip === 'elem') {
      const baza = this.tablouElem(e)
      return this.esteTablou(baza) ? this.stare.pozTablouri.has(baza) : this.pozitie(e.sursa)
    }
    return false
  }

  // pozitia vine dintr-un argmax, direct sau printr-un nume in care a ajuns una, nu dintr-un contor de bucla
  private pozitieSigura(e: Expr): boolean {
    if (e.tip === 'extrem') return e.fel === 'argmax' || e.fel === 'argmin'
    if (e.tip === 'var') return !this.local(e.nume) && !this.esteTablou(this.rezolva(e.nume)) && this.stare.siguri.has(e.nume)
    if (e.tip === 'elem') {
      const baza = this.tablouElem(e)
      return this.stare.siguri.has(this.esteTablou(baza) ? baza : e.sursa)
    }
    return false
  }

  // scrie o valoare de pozitie fara ca elementele citite sa conteze drept folosite ca indici
  private faraMarcare<T>(f: () => T): T {
    const inainte = this.marcheaza
    this.marcheaza = false
    try {
      return f()
    } finally {
      this.marcheaza = inainte
    }
  }

  // Expresie cu valoare sigur intreaga: numere intregi, pozitii, dimensiuni si scalari care primesc
  // doar astfel de valori, legate prin + - *. Doar pe ele se poate reordona adunarea fara sa se
  // schimbe rotunjirile, si doar ele pot intra in range() si intre paranteze drepte fara int().
  private eIntreg(e: Expr): boolean {
    switch (e.tip) {
      case 'num':
        return Number.isInteger(e.v)
      case 'var':
        return !!this.local(e.nume) || (!this.esteTablou(this.rezolva(e.nume)) && this.stare.intregi.has(e.nume))
      case 'elem': {
        const baza = this.tablouElem(e)
        return this.esteTablou(baza) ? this.stare.pozTablouri.has(baza) : this.stare.intregi.has(e.sursa)
      }
      case 'bin':
        return (e.op === '+' || e.op === '-' || e.op === '*') && this.eIntreg(e.a) && this.eIntreg(e.b)
      case 'neg':
      case 'abs':
        return this.eIntreg(e.a)
      case 'apel':
        if (e.nume === 'linii' || e.nume === 'coloane' || e.nume === 'lungime') return true
        return (e.nume === 'min' || e.nume === 'max') && e.args.every((x) => this.eIntreg(x))
      case 'extrem':
        return e.fel === 'argmax' || e.fel === 'argmin'
      default:
        return false
    }
  }

  // Un scalar ca termen al unei expresii intregi: cu int() daca nu e sigur intreg. Un scalar dat
  // la intrare care ajunge aici se face intreg o data, la inceputul functiei, de la trecerea urmatoare.
  private atomScalar(nume: string): Afin {
    const py = this.nume(nume)
    const sigur = this.stare.intregi.has(nume)
    if (!sigur && this.opt.intrari.some((i) => i.nume === nume && i.tip === 'scalar') && !this.inv.atribuite.has(nume) && !this.inv.bucle.has(nume)) this.intrariIntregi.add(nume)
    const atom = sigur ? py : `int(${py})`
    if (this.pozitie(nume)) this.nenegative.add(atom)
    return { t: new Map([[atom, 1]]), c: this.pozitie(nume) ? 1 : 0 }
  }

  private afin(e: Expr): Afin {
    const atom = (s: string, c = 0): Afin => ({ t: new Map([[s, 1]]), c })
    // un atom care tine o pozitie: valoarea lui e atomul plus 1, iar atomul nu e negativ
    const pozitie = (s: string): Afin => {
      this.nenegative.add(s)
      return atom(s, 1)
    }
    switch (e.tip) {
      case 'num':
        if (Number.isInteger(e.v)) return { t: new Map(), c: e.v }
        break
      case 'var': {
        const l = this.local(e.nume)
        if (l) return pozitie(l)
        if (!this.esteTablou(this.rezolva(e.nume))) return this.atomScalar(e.nume)
        break
      }
      case 'elem': {
        const baza = this.tablouElem(e)
        if (!this.esteTablou(baza)) return this.atomScalar(e.sursa)
        if (this.marcheaza) this.indiceTablou.add(baza)
        return this.stare.pozTablouri.has(baza) ? pozitie(this.elem(e)) : atom(`int(${this.elem(e)})`)
      }
      case 'bin':
        if (e.op === '+' || e.op === '-') return aduna(this.afin(e.a), this.afin(e.b), e.op === '+' ? 1 : -1)
        if (e.op === '*' && e.a.tip === 'num' && Number.isInteger(e.a.v)) return ori(this.afin(e.b), e.a.v)
        if (e.op === '*' && e.b.tip === 'num' && Number.isInteger(e.b.v)) return ori(this.afin(e.a), e.b.v)
        break
      case 'neg':
        return ori(this.afin(e.a), -1)
      case 'extrem':
        if (e.fel === 'argmax' || e.fel === 'argmin') return this.afinExtrem(e)
        break
      case 'apel':
        if (e.nume === 'linii' || e.nume === 'coloane' || e.nume === 'lungime') {
          const s = this.apel(e)
          this.dimensiuni.add(s)
          return atom(s)
        }
        if ((e.nume === 'min' || e.nume === 'max') && this.eIntreg(e)) return atom(this.apel(e))
        break
      default:
        break
    }
    return atom(`int(${this.expr(e)})`)
  }

  // valoarea din pseudocod, ca intreg: capatul de sus al unei bucle, o dimensiune
  private intreg(e: Expr, delta = 0): string {
    return scrieAfin(this.afin(e), delta)
  }

  // pozitia de la 0 care corespunde valorii din pseudocod, intr-un loc unde chiar se indexeaza
  private indice(e: Expr): string {
    const inainte = this.marcheaza
    this.marcheaza = true
    try {
      return this.intreg(e, -1)
    } finally {
      this.marcheaza = inainte
    }
  }

  // valoarea de pastrat intr-un nume care tine pozitii
  private pozitieDe(e: Expr): string {
    return this.faraMarcare(() => this.intreg(e, -1))
  }

  // Capatul de sus al unei felii a:b. Cand b poate cobori sub 0 (x(1:i-2) la i = 1) felia e goala
  // in pseudocod, dar un capat negativ in NumPy numara de la sfarsit: se opreste la 0.
  private capat(la: Expr): string {
    const a = this.afin(la)
    let minim = a.c
    for (const [atom, k] of a.t) {
      if (k === 0) continue
      minim += k < 0 ? -Infinity : this.dimensiuni.has(atom) ? k : this.nenegative.has(atom) ? 0 : -Infinity
    }
    const s = scrieAfin(a)
    if (minim >= 0) return s
    return a.t.size === 0 ? '0' : `max(${s}, 0)`
  }

  private interval(de: Expr, la: Expr, pas?: Expr): string {
    const a = this.indice(de)
    if (!pas) return a === '0' ? `range(${this.intreg(la)})` : `range(${a}, ${this.intreg(la)})`
    if (pas.tip === 'num' || (pas.tip === 'neg' && pas.a.tip === 'num')) {
      const p = pas.tip === 'num' ? pas.v : -(pas.a as Extract<Expr, { tip: 'num' }>).v
      // capatul de sus e inclus in pseudocod: la urcare range se opreste inaintea lui `la`, la coborare inaintea lui `la - 2`
      return `range(${a}, ${this.intreg(la, p > 0 ? 0 : -2)}, ${p})`
    }
    const p = this.intreg(pas)
    return `range(${a}, ${this.intreg(la, -1)} + (1 if ${p} > 0 else -1), ${p})`
  }

  private elem(e: Extract<Expr, { tip: 'elem' }>): string {
    const baza = this.tablouElem(e)
    if (this.esteTablou(baza)) return `${this.nume(baza)}[${e.idx.map((x) => this.indice(x)).join(', ')}]`
    return this.nume(e.sursa)
  }

  private felie(e: Extract<Expr, { tip: 'felie' }>): string {
    const parti = e.idx.map((x) => {
      if (x === null) return ':'
      if (x.tip !== 'interval') return this.indice(x)
      const a = this.indice(x.de)
      return `${a === '0' ? '' : a}:${this.capat(x.la)}`
    })
    return `${this.nume(this.rezolva(e.nume))}[${parti.join(', ')}]`
  }

  private apel(e: Extract<Expr, { tip: 'apel' }>): string {
    const args = e.args.map((a) => this.expr(a))
    // un vector NumPy are o singura axa: liniile unei coloane si coloanele unei linii sunt lungimea lui
    const forma = e.args[0] ? this.tip(e.args[0]) : 'scalar'
    switch (e.nume) {
      case 'sqrt':
        return `np.sqrt(${args[0]})`
      case 'sgn':
        this.folosesteSgn = true
        return `sgn(${args[0]})`
      case 'linii':
        return forma === 'rand' ? '1' : `${args[0]}.shape[0]`
      case 'coloane':
        return forma === 'matrice' ? `${args[0]}.shape[1]` : forma === 'rand' ? `${args[0]}.shape[0]` : '1'
      case 'lungime':
        return `${args[0]}.size`
      default:
        return `${e.nume}(${args.join(', ')})`
    }
  }

  // ---- sume si extreme ----

  // Leaga variabila unei sume de un nume Python. Numele ei, daca nu ar strica o variabila vie:
  // o bucla in care ne aflam, un scalar al programului, o variabila de bucla citita si dupa bucla ei.
  private leaga<T>(v: string, f: (py: string) => T): T {
    const propriu = this.nume(v)
    const viu = this.bucle.includes(propriu) || this.inv.atribuite.has(v) || this.inv.cititeInAfara.has(v) || this.opt.intrari.some((i) => i.nume === v) || this.locali.some(([, p]) => p === propriu) || this.ajutatoare.has(propriu)
    const py = viu ? this.numeNou(propriu) : propriu
    this.locali.push([v, py])
    try {
      return f(py)
    } finally {
      this.locali.pop()
    }
  }

  // Valoarea din pseudocod a unui argmax sau argmin: capatul de jos plus np.argmax pe o felie cand
  // termenul e |a_ik| sau a_ik; altfel max cu cheie peste range, care da direct pozitia de la 0.
  private afinExtrem(e: Extract<Expr, { tip: 'extrem' }>): Afin {
    const functie = e.fel === 'argmax' ? 'argmax' : 'argmin'
    const modul = e.corp.tip === 'abs'
    const miez = modul ? (e.corp as Extract<Expr, { tip: 'abs' }>).a : e.corp
    if (miez.tip === 'elem' && this.esteTablou(this.tablouElem(miez))) {
      const cuVar = miez.idx.map((x) => x.tip === 'var' && x.nume === e.var)
      const altele = miez.idx.filter((_, k) => !cuVar[k])
      if (cuVar.filter(Boolean).length === 1 && altele.every((x) => !pomeneste(x, e.var))) {
        const baza = this.tablouElem(miez)
        this.cititAltfel.add(baza)
        const de = this.indice(e.de)
        const parti = miez.idx.map((x, k) => (cuVar[k] ? `${de === '0' ? '' : de}:${this.capat(e.la)}` : this.indice(x)))
        const felie = `${this.nume(baza)}[${parti.join(', ')}]`
        const gasit = `np.${functie}(${modul ? `np.abs(${felie})` : felie})`
        this.nenegative.add(gasit)
        return aduna(this.afin(e.de), { t: new Map([[gasit, 1]]), c: 0 }, 1)
      }
    }
    // capetele se scriu inainte ca variabila extremului sa fie legata
    const interval = this.interval(e.de, e.la)
    const gasit = this.leaga(e.var, (py) => `${e.fel === 'argmax' ? 'max' : 'min'}(${interval}, key=lambda ${py}: ${this.expr(e.corp)})`)
    this.nenegative.add(gasit)
    return { t: new Map([[gasit, 1]]), c: 1 }
  }

  // Sumele unei instructiuni se scot in bucle de acumulare puse inaintea ei, ca in laborator:
  // s = 0, apoi for j in range(...): s = s + termen.
  private scoateSume(e: Expr, nivel: number): void {
    switch (e.tip) {
      case 'suma': {
        const s = this.numeNou(SUMA[this.opt.limba ?? 'ro'])
        this.sume.set(e, s)
        const interval = this.interval(e.de, e.la)
        this.linie(nivel, `${s} = 0`)
        this.leaga(e.var, (py) => {
          this.linie(nivel, `for ${py} in ${interval}:`)
          this.scoateSume(e.corp, nivel + 1)
          this.linie(nivel + 1, `${s} = ${s} + ${this.copil(e.corp, 2)}`)
        })
        return
      }
      case 'bin':
      case 'cmp':
        this.scoateSume(e.a, nivel)
        this.scoateSume(e.b, nivel)
        return
      case 'neg':
      case 'abs':
      case 'norma':
      case 'transp':
        this.scoateSume(e.a, nivel)
        return
      case 'apel':
        e.args.forEach((x) => this.scoateSume(x, nivel))
        return
      default:
        return
    }
  }

  // ---- expresii ----

  private prec(e: Expr): number {
    switch (e.tip) {
      // o comparatie folosita ca valoare se scrie float(...), deci e un singur operand
      case 'cmp':
        return 5
      case 'bin':
        return e.op === '+' || e.op === '-' ? 1 : e.op === '^' ? 4 : 2
      case 'neg':
        return 3
      case 'var':
        // o pozitie se scrie "k + 1" cand i se cere valoarea
        return this.ePozitie(e) || this.tablouDePozitii(e) ? 1 : 5
      case 'felie':
        return this.tablouDePozitii(e) ? 1 : 5
      case 'elem':
      case 'extrem':
        return this.ePozitie(e) ? 1 : 5
      case 'transp':
        return this.tip(e.a) === 'matrice' ? 5 : this.prec(e.a)
      case 'suma':
        // o suma ramasa in expresie e un apel sum(...); una scoasa e un nume
        return 5
      default:
        return 5
    }
  }

  // Operandul din dreapta primeste paranteze si la aceeasi prioritate: a - (b - c), a * (b * c),
  // u * (u @ x). Altfel Python ar grupa de la stanga si ar schimba rezultatul sau rotunjirile.
  private copil(c: Expr, p: number, dreapta = false, op?: string): string {
    const s = this.expr(c)
    const pc = this.prec(c)
    const paranteze = pc < p || (dreapta && pc === p && p < 5) || (op === '^' && !dreapta && pc < 5)
    return paranteze ? `(${s})` : s
  }

  // valoarea expresiei, ca in pseudocod
  expr(e: Expr): string {
    switch (e.tip) {
      case 'num':
        return String(e.v)
      case 'var': {
        const l = this.local(e.nume)
        if (l) return `${l} + 1`
        const baza = this.rezolva(e.nume)
        if (this.esteTablou(baza)) {
          this.cititAltfel.add(baza)
          return this.stare.pozTablouri.has(baza) ? `${this.nume(baza)} + 1` : this.nume(baza)
        }
        return this.pozitie(e.nume) ? `${this.nume(e.nume)} + 1` : this.nume(e.nume)
      }
      case 'elem': {
        const baza = this.tablouElem(e)
        if (!this.esteTablou(baza)) return this.pozitie(e.sursa) ? `${this.nume(e.sursa)} + 1` : this.nume(e.sursa)
        this.cititAltfel.add(baza)
        return this.stare.pozTablouri.has(baza) ? `${this.elem(e)} + 1` : this.elem(e)
      }
      case 'felie': {
        const baza = this.rezolva(e.nume)
        this.cititAltfel.add(baza)
        return this.stare.pozTablouri.has(baza) && this.esteTablou(baza) ? `${this.felie(e)} + 1` : this.felie(e)
      }
      case 'bin': {
        const p = this.prec(e)
        // k + 1 cu k variabila de bucla: se scrie simplificat, nu "k + 1 + 1"
        if ((e.op === '+' || e.op === '-') && this.eIntreg(e) && !areElem(e)) return scrieAfin(this.afin(e))
        if (e.op === '^') return `${this.copil(e.a, p, false, '^')} ** ${this.copil(e.b, p, true, '^')}`
        if (e.op === '*') {
          const ta = this.tip(e.a)
          const tb = this.tip(e.b)
          if (ta === 'vector' && tb === 'rand') return `np.outer(${this.expr(e.a)}, ${this.expr(e.b)})`
          if (ta !== 'scalar' && tb !== 'scalar') return `${this.copil(e.a, p, false, '*')} @ ${this.copil(e.b, p, true, '*')}`
        }
        return `${this.copil(e.a, p, false, e.op)} ${e.op} ${this.copil(e.b, p, true, e.op)}`
      }
      case 'neg':
        return `-${this.copil(e.a, 3)}`
      case 'abs':
        return `abs(${this.expr(e.a)})`
      case 'norma':
        if (this.tip(e.a) === 'scalar') return `abs(${this.expr(e.a)})`
        return e.F ? `np.linalg.norm(${this.expr(e.a)}, 'fro')` : `np.linalg.norm(${this.expr(e.a)})`
      case 'transp':
        // un vector NumPy are o singura axa: z^T y se scrie z @ y
        return this.tip(e.a) === 'matrice' ? `${this.copil(e.a, 5)}.T` : this.expr(e.a)
      case 'apel':
        return this.apel(e)
      case 'suma': {
        const scoasa = this.sume.get(e)
        if (scoasa) return scoasa
        const interval = this.interval(e.de, e.la)
        return this.leaga(e.var, (py) => `sum(${this.expr(e.corp)} for ${py} in ${interval})`)
      }
      case 'extrem': {
        if (e.fel === 'argmax' || e.fel === 'argmin') return scrieAfin(this.afin(e))
        const interval = this.interval(e.de, e.la)
        return this.leaga(e.var, (py) => `${e.fel}(${this.expr(e.corp)} for ${py} in ${interval})`)
      }
      case 'cmp':
        // ca valoare, o comparatie da 1 sau 0, ca in interpretor; un bool NumPy ar aduna logic
        // (True + True este True) si nu s-ar putea scadea
        return `float(${this.comparatie(e)})`
    }
  }

  // comparatia goala, pentru conditia unui "daca" sau "cat timp"
  private comparatie(e: Extract<Expr, { tip: 'cmp' }>): string {
    const OP: Record<string, string> = { '<': '<', '>': '>', '≤': '<=', '≥': '>=', '=': '==', '≠': '!=' }
    return `${this.copil(e.a, 1)} ${OP[e.op]} ${this.copil(e.b, 1)}`
  }

  private conditie(e: Expr): string {
    return e.tip === 'cmp' ? this.comparatie(e) : this.expr(e)
  }

  // ---- instructiuni ----

  private linie(nivel: number, text: string): void {
    this.linii.push(`${'    '.repeat(nivel)}${text}`)
  }

  private noteazaScris(nume: string): void {
    if (!this.scrise.includes(nume)) this.scrise.push(nume)
  }

  bloc(instr: Instr[], nivel: number): void {
    const inainte = this.linii.length
    for (const s of instr) this.instr(s, nivel)
    // un bloc doar cu comentarii nu e un bloc pentru Python
    if (this.linii.slice(inainte).every((l) => l.trimStart().startsWith('#'))) this.linie(nivel, 'pass')
  }

  private instr(s: Instr, nivel: number): void {
    this.sume.clear()
    this.ajutatoare.clear()
    switch (s.tip) {
      case 'peste':
        for (const n of s.nume) {
          this.alias.set(n, s.tinta)
          this.alias.set(n.toLowerCase(), s.tinta)
          this.alias.set(n.toUpperCase(), s.tinta)
        }
        this.linie(nivel, `# ${this.comentariu('peste', s.nume.map((n) => this.nume(n)).join(', '), this.nume(s.tinta))}`)
        return
      case 'fie':
        for (const d of s.decl) {
          this.tipuri.set(d.nume, d.dims.length === 1 ? 'vector' : 'matrice')
          const dims = d.dims.map((x) => this.intreg(x))
          const forma = dims.length === 1 ? dims[0] : `(${dims.join(', ')})`
          this.noteazaScris(d.nume)
          if (!this.stare.pozTablouri.has(d.nume)) {
            this.linie(nivel, `${this.nume(d.nume)} = np.zeros(${forma})`)
            continue
          }
          // Zeroul din pseudocod este pozitia -1. Zerourile raman doar cand o bucla scrie apoi
          // fiecare element, ca la p in GPP.
          const scrisTot = d.dims.length === 1 && (this.inv.acoperite.get(d.nume) ?? []).includes(JSON.stringify(d.dims[0]))
          this.linie(nivel, scrisTot ? `${this.nume(d.nume)} = np.zeros(${forma}, dtype=int)` : `${this.nume(d.nume)} = np.full(${forma}, -1)`)
        }
        return
      case 'atrib': {
        if (s.bucla) {
          this.linie(nivel, `for ${this.nume(s.bucla.var)} in ${this.interval(s.bucla.de, s.bucla.la)}:`)
          this.tipuri.set(s.bucla.var, 'scalar')
          this.bucle.push(this.nume(s.bucla.var))
          this.atrib(s, nivel + 1)
          this.bucle.pop()
        } else this.atrib(s, nivel)
        return
      }
      case 'schimb': {
        // Indicii care depind de tablourile schimbate se calculeaza inainte: in p_k ↔ p_{p_k},
        // Python ar citi al doilea indice dupa ce a scris deja p[k].
        const baze = [s.a, s.b].flatMap((t) => (t.tip === 'elem' ? [this.tablouElem(t)] : []))
        const tinta = (t: Tinta): string => {
          if (t.tip !== 'elem' || !this.esteTablou(this.tablouElem(t))) return this.tinta(t)
          const baza = this.tablouElem(t)
          this.noteazaScris(baza)
          const idx = t.idx.map((x) => {
            if (!this.pomenesteTablou(x, baze)) return this.indice(x)
            const poz = this.numeNou('poz')
            this.linie(nivel, `${poz} = ${this.indice(x)}`)
            return poz
          })
          return `${this.nume(baza)}[${idx.join(', ')}]`
        }
        const a = tinta(s.a)
        const b = tinta(s.b)
        this.linie(nivel, `${a}, ${b} = ${b}, ${a}`)
        return
      }
      case 'pentru': {
        this.linie(nivel, `for ${this.nume(s.var)} in ${this.interval(s.de, s.la, s.pas)}:`)
        this.tipuri.set(s.var, 'scalar')
        this.bucle.push(this.nume(s.var))
        this.bloc(s.corp, nivel + 1)
        this.bucle.pop()
        return
      }
      case 'daca':
        this.scoateSume(s.cond, nivel)
        this.linie(nivel, `if ${this.conditie(s.cond)}:`)
        this.bloc(s.atunci, nivel + 1)
        if (s.altfel) {
          this.linie(nivel, 'else:')
          this.bloc(s.altfel, nivel + 1)
        }
        return
      case 'cattimp':
        // conditia se reevalueaza la fiecare iteratie, deci sumele ei raman in expresie
        this.linie(nivel, `while ${this.conditie(s.cond)}:`)
        this.bloc(s.corp, nivel + 1)
        return
      case 'stop':
        this.linie(nivel, `raise RuntimeError(${JSON.stringify(s.mesaj ?? 'stop')})`)
        return
      case 'tipareste':
        this.linie(nivel, `print(${JSON.stringify(s.mesaj)})`)
        return
    }
  }

  private pomenesteTablou(e: Expr, baze: string[]): boolean {
    switch (e.tip) {
      case 'num':
        return false
      case 'var':
        return baze.includes(this.rezolva(e.nume))
      case 'elem':
        return baze.includes(this.tablouElem(e)) || e.idx.some((x) => this.pomenesteTablou(x, baze))
      case 'felie':
        return baze.includes(this.rezolva(e.nume))
      case 'bin':
      case 'cmp':
        return this.pomenesteTablou(e.a, baze) || this.pomenesteTablou(e.b, baze)
      case 'neg':
      case 'abs':
      case 'norma':
      case 'transp':
        return this.pomenesteTablou(e.a, baze)
      case 'apel':
        return e.args.some((x) => this.pomenesteTablou(x, baze))
      case 'suma':
      case 'extrem':
        return this.pomenesteTablou(e.corp, baze) || this.pomenesteTablou(e.de, baze) || this.pomenesteTablou(e.la, baze)
    }
  }

  // valoarea de scris intr-un tablou de pozitii: o copie a altor pozitii sau o pozitie
  private caPozitii(e: Expr): string {
    if (this.tablouDePozitii(e)) return this.brut(e)
    return this.pozitieDe(e)
  }

  private tinta(t: Tinta): string {
    if (t.tip === 'elem') {
      const baza = this.tablouElem(t)
      if (this.esteTablou(baza)) this.noteazaScris(baza)
      return this.elem(t)
    }
    if (t.tip === 'felie') {
      this.noteazaScris(this.rezolva(t.nume))
      return this.felie(t)
    }
    return this.nume(t.nume)
  }

  private atrib(s: Extract<Instr, { tip: 'atrib' }>, nivel: number): void {
    this.scoateSume(s.expr, nivel)
    const tipExpr = this.tip(s.expr)
    if (s.tinta.tip === 'felie') {
      const baza = this.rezolva(s.tinta.nume)
      const cuPozitii = tipExpr === 'scalar' ? this.ePozitie(s.expr) : this.tablouDePozitii(s.expr)
      if (!cuPozitii) this.nonPoz.add(baza)
      this.linie(nivel, `${this.tinta(s.tinta)} = ${this.stare.pozTablouri.has(baza) ? this.caPozitii(s.expr) : this.expr(s.expr)}`)
      return
    }
    if (s.tinta.tip === 'elem' && this.esteTablou(this.tablouElem(s.tinta))) {
      const baza = this.tablouElem(s.tinta)
      if (!this.ePozitie(s.expr)) this.nonPoz.add(baza)
      if (this.pozitieSigura(s.expr)) this.sursaSigura.add(baza)
      const valoare = this.stare.pozTablouri.has(baza) ? this.pozitieDe(s.expr) : this.expr(s.expr)
      this.linie(nivel, `${this.tinta(s.tinta)} = ${valoare}`)
      return
    }
    // o variabila se scrie sub numele ei, fara cautarea literei mari (ca in interpretor)
    const nume = s.tinta.tip === 'elem' ? s.tinta.sursa : s.tinta.nume
    if (tipExpr !== 'scalar') {
      // copia unui tablou de pozitii poate ramane tablou de pozitii, cu valorile numarate de la 0
      const copie = this.tablouDePozitii(s.expr)
      if (!copie) this.nonPoz.add(nume)
      else this.sursaSigura.add(nume)
      let valoare = copie && this.stare.pozTablouri.has(nume) ? this.brut(s.expr) : this.expr(s.expr)
      // un nume, un bloc sau o transpusa sunt in NumPy vederi peste aceleasi date: se copiaza
      const vedere = (e: Expr): boolean => e.tip === 'var' || e.tip === 'felie' || (e.tip === 'transp' && vedere(e.a))
      if (vedere(s.expr) && !(copie && !this.stare.pozTablouri.has(nume))) valoare += '.copy()'
      this.tipuri.set(nume, tipExpr === 'rand' ? 'vector' : tipExpr)
      this.noteazaScris(nume)
      this.linie(nivel, `${this.nume(nume)} = ${valoare}`)
      return
    }
    if (this.esteTablou(nume)) {
      // un numar atribuit unui tablou il umple
      if (!this.ePozitie(s.expr)) this.nonPoz.add(nume)
      this.noteazaScris(nume)
      this.linie(nivel, `${this.nume(nume)}[:] = ${this.stare.pozTablouri.has(nume) ? this.pozitieDe(s.expr) : this.expr(s.expr)}`)
      return
    }
    if (!this.ePozitie(s.expr)) this.nonPoz.add(nume)
    if (this.pozitieSigura(s.expr)) this.sursaSigura.add(nume)
    if (!this.eIntreg(s.expr)) this.nonIntreg.add(nume)
    if (!(s.expr.tip === 'apel' && (s.expr.nume === 'linii' || s.expr.nume === 'coloane' || s.expr.nume === 'lungime'))) this.nonDimensiune.add(nume)
    this.scalarLaInceput.add(nume)
    this.tipuri.set(nume, 'scalar')
    this.noteazaScris(nume)
    let valoare = this.expr(s.expr)
    // un scalar de pozitie tine valoarea minus 1; daca valoarea nu e sigur intreaga, ramane neatinsa de int()
    if (this.pozitie(nume)) valoare = this.ePozitie(s.expr) || this.eIntreg(s.expr) ? this.pozitieDe(s.expr) : `${this.copil(s.expr, 1)} - 1`
    this.linie(nivel, `${this.nume(nume)} = ${valoare}`)
  }

  comentariu(cheie: Exclude<keyof typeof COMENTARII, 'antet'>, ...args: string[]): string {
    return COMENTARII[cheie][this.opt.limba ?? 'ro'].replace(/\{(\d+)\}/g, (_, k: string) => args[Number(k)] ?? '')
  }

  // ce intoarce functia cand programul nu spune: tablourile scrise, altfel scalarii scrisi
  iesiriDeduse(): string[] {
    const tablouri = this.scrise.filter((n) => this.esteTablou(n))
    return tablouri.length > 0 ? tablouri : this.scrise.filter((n) => !this.inv.bucle.has(n))
  }

  tinePozitii(nume: string): boolean {
    return this.esteTablou(nume) ? this.stare.pozTablouri.has(nume) : this.pozitie(nume)
  }

  // Starea pentru trecerea urmatoare: din multimi ies numele care au primit si altceva.
  urmatoareaStare(): Stare {
    const intrare = (n: string) => this.opt.intrari.some((i) => i.nume === n)
    const pozTablouri = [...this.stare.pozTablouri].filter((n) => this.esteTablou(n) && !this.nonPoz.has(n) && (this.indiceTablou.has(n) || this.stare.siguri.has(n)) && !(intrare(n) && this.cititAltfel.has(n)))
    const tipuri = new Map([...this.tipuri].filter(([n, t]) => (t === 'matrice' || t === 'vector') && !intrare(n) && !this.scalarLaInceput.has(n)))
    return {
      pozScalari: new Set([...this.stare.pozScalari].filter((n) => !this.nonPoz.has(n))),
      pozTablouri: new Set(pozTablouri),
      dimensiuni: new Set([...this.stare.dimensiuni].filter((n) => !this.nonDimensiune.has(n))),
      siguri: this.stare.siguri,
      intregi: new Set([...[...this.stare.intregi].filter((n) => !this.nonIntreg.has(n)), ...this.intrariIntregi]),
      tipuri,
    }
  }
}

function pomeneste(e: Expr, nume: string): boolean {
  switch (e.tip) {
    case 'num':
      return false
    case 'var':
      return e.nume === nume
    case 'elem':
      return e.idx.some((x) => pomeneste(x, nume))
    case 'felie':
      return e.idx.some((x) => x !== null && (x.tip === 'interval' ? pomeneste(x.de, nume) || pomeneste(x.la, nume) : pomeneste(x, nume)))
    case 'bin':
    case 'cmp':
      return pomeneste(e.a, nume) || pomeneste(e.b, nume)
    case 'neg':
    case 'abs':
    case 'norma':
    case 'transp':
      return pomeneste(e.a, nume)
    case 'apel':
      return e.args.some((x) => pomeneste(x, nume))
    case 'suma':
    case 'extrem':
      return pomeneste(e.de, nume) || pomeneste(e.la, nume) || (e.var !== nume && pomeneste(e.corp, nume))
  }
}

// expresia contine un element indexat (a_ij, i_k): nu se simplifica prin forma afina
function areElem(e: Expr): boolean {
  switch (e.tip) {
    case 'elem':
      return true
    case 'bin':
      return areElem(e.a) || areElem(e.b)
    case 'neg':
    case 'abs':
      return areElem(e.a)
    case 'apel':
      return e.args.some(areElem)
    default:
      return false
  }
}

// Numele folosite de program, variabilele de bucla si ce se mai poate afla dintr-o singura parcurgere.
function inventar(program: Program): Inventar {
  const nume = new Set<string>()
  const bucle = new Set<string>()
  const citite = new Set<string>()
  const scriseSus = new Set<string>()
  const atribuite = new Set<string>()
  const cititeLiber = new Set<string>()
  const acoperite = new Map<string, string[]>()
  const legate: string[] = []
  const acopera = (tablou: string, la: Expr) => acoperite.set(tablou, [...(acoperite.get(tablou) ?? []), JSON.stringify(la)])
  const dinExpr = (e: Expr): void => {
    switch (e.tip) {
      case 'num':
        return
      case 'var':
        nume.add(e.nume)
        if (!scriseSus.has(e.nume)) citite.add(e.nume)
        if (!legate.includes(e.nume)) cititeLiber.add(e.nume)
        return
      case 'elem':
        nume.add(e.sursa)
        nume.add(e.nume)
        if (!legate.includes(e.sursa)) cititeLiber.add(e.sursa)
        e.idx.forEach(dinExpr)
        return
      case 'felie':
        nume.add(e.nume)
        for (const x of e.idx) {
          if (x === null) continue
          if (x.tip === 'interval') {
            dinExpr(x.de)
            dinExpr(x.la)
          } else dinExpr(x)
        }
        return
      case 'bin':
      case 'cmp':
        dinExpr(e.a)
        dinExpr(e.b)
        return
      case 'neg':
      case 'abs':
      case 'norma':
      case 'transp':
        dinExpr(e.a)
        return
      case 'apel':
        e.args.forEach(dinExpr)
        return
      case 'suma':
      case 'extrem':
        nume.add(e.var)
        dinExpr(e.de)
        dinExpr(e.la)
        legate.push(e.var)
        dinExpr(e.corp)
        legate.pop()
        return
    }
  }
  const unu = (e: Expr) => e.tip === 'num' && e.v === 1
  // atribuirea scrie direct elementul x_v al unui tablou, cu v variabila buclei
  const scrieElementul = (s: Instr, v: string): string | null => (s.tip === 'atrib' && !s.bucla && s.tinta.tip === 'elem' && s.tinta.idx.length === 1 && s.tinta.idx[0].tip === 'var' && s.tinta.idx[0].nume === v ? s.tinta.nume : null)
  const dinInstr = (s: Instr, sus: boolean): void => {
    switch (s.tip) {
      case 'atrib':
        if (s.bucla) {
          bucle.add(s.bucla.var)
          nume.add(s.bucla.var)
          dinExpr(s.bucla.de)
          dinExpr(s.bucla.la)
          legate.push(s.bucla.var)
          if (unu(s.bucla.de) && s.tinta.tip === 'elem' && s.tinta.idx.length === 1 && s.tinta.idx[0].tip === 'var' && s.tinta.idx[0].nume === s.bucla.var) acopera(s.tinta.nume, s.bucla.la)
        }
        dinExpr(s.expr)
        if (s.tinta.tip === 'var') {
          nume.add(s.tinta.nume)
          atribuite.add(s.tinta.nume)
          if (sus) scriseSus.add(s.tinta.nume)
        } else {
          if (s.tinta.tip === 'elem') atribuite.add(s.tinta.sursa)
          dinExpr(s.tinta)
        }
        if (s.bucla) legate.pop()
        return
      case 'schimb':
        dinExpr(s.a)
        dinExpr(s.b)
        return
      case 'pentru':
        bucle.add(s.var)
        nume.add(s.var)
        dinExpr(s.de)
        dinExpr(s.la)
        if (s.pas) dinExpr(s.pas)
        if (unu(s.de) && !s.pas)
          for (const x of s.corp) {
            const tablou = scrieElementul(x, s.var)
            if (tablou) acopera(tablou, s.la)
          }
        legate.push(s.var)
        s.corp.forEach((x) => dinInstr(x, false))
        legate.pop()
        return
      case 'daca':
        dinExpr(s.cond)
        s.atunci.forEach((x) => dinInstr(x, false))
        s.altfel?.forEach((x) => dinInstr(x, false))
        return
      case 'cattimp':
        dinExpr(s.cond)
        s.corp.forEach((x) => dinInstr(x, false))
        return
      case 'fie':
        for (const d of s.decl) {
          nume.add(d.nume)
          d.dims.forEach(dinExpr)
        }
        return
      default:
        return
    }
  }
  program.instr.forEach((s) => dinInstr(s, true))
  return { nume, bucle, citite, atribuite, cititeInAfara: new Set([...cititeLiber].filter((n) => bucle.has(n))), acoperite }
}

const aceeasi = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x))

export function emitePython(program: Program, opt: OptiuniPython): CodPython {
  const inv = inventar(program)
  const numeIntrari = new Set(opt.intrari.map((i) => i.nume))
  const scalariDati = opt.intrari.filter((i) => i.tip === 'scalar').map((i) => i.nume)
  // Presupunerea de pornire: orice scalar atribuit tine o pozitie, orice tablou la fel, orice scalar
  // e intreg. Fiecare trecere scoate numele care se dovedesc altfel, pana nu se mai schimba nimic.
  let stare: Stare = {
    pozScalari: new Set(inv.atribuite),
    pozTablouri: new Set([...inv.nume, ...numeIntrari]),
    dimensiuni: new Set([...inv.atribuite].filter((n) => !numeIntrari.has(n) && !inv.bucle.has(n))),
    siguri: new Set(),
    // scalarii dati la intrare nu sunt presupusi intregi (tol nu este): intra aici doar daca ajung indici
    intregi: new Set([...[...inv.atribuite, ...inv.bucle, 'm', 'n'].filter((n) => !scalariDati.includes(n) || inv.atribuite.has(n) || inv.bucle.has(n))]),
    tipuri: new Map(),
  }
  let em: Emitator
  // intai numele in care ajunge pozitia unui argmax: multimea creste pana se opreste
  for (let trecere = 0; trecere < 20; trecere++) {
    em = new Emitator(opt, stare, inv)
    em.bloc(program.instr, 1)
    const siguri = new Set([...stare.siguri, ...em.sursaSigura])
    if (siguri.size === stare.siguri.size) break
    stare = { ...stare, siguri }
  }
  for (let trecere = 0; ; trecere++) {
    em = new Emitator(opt, stare, inv)
    em.bloc(program.instr, 1)
    const urm = em.urmatoareaStare()
    const stabil = aceeasi(urm.pozScalari, stare.pozScalari) && aceeasi(urm.pozTablouri, stare.pozTablouri) && aceeasi(urm.dimensiuni, stare.dimensiuni) && aceeasi(urm.intregi, stare.intregi) && aceeasi(new Set(urm.tipuri.keys()), new Set(stare.tipuri.keys()))
    if (stabil || trecere > 20) break
    stare = urm
  }

  const functie = opt.nume.replace(/[^\p{L}\p{N}_]/gu, '_')
  const prolog: string[] = [`def ${functie}(${opt.intrari.map((i) => em.nume(i.nume)).join(', ')}):`]
  // comentariul sta la capatul liniei cat incape in 79 de coloane; altfel, pe linia de deasupra
  const cuNota = (cod: string, nota: string) => (cod.length + nota.length + 4 <= 79 ? [`${cod}  # ${nota}`] : [`    # ${nota}`, cod])
  let cuComentariu = false
  for (const i of opt.intrari) {
    const py = em.nume(i.nume)
    if (i.tip === 'scalar') {
      // un scalar dat care in Python tine o pozitie, sau care ajunge indice
      if (em.tinePozitii(i.nume)) prolog.push(...cuNota(`    ${py} = ${py} - 1`, em.comentariu('dinPseudocod', py)))
      else if (stare.intregi.has(i.nume) && !inv.atribuite.has(i.nume)) prolog.push(...cuNota(`    ${py} = int(${py})`, em.comentariu('intreg', py)))
      continue
    }
    if (em.tinePozitii(i.nume)) {
      prolog.push(...cuNota(`    ${py} = np.array(${py}, dtype=int) - 1`, em.comentariu('dinPseudocod', py)))
      continue
    }
    // un singur comentariu, deasupra primei copii
    if (!cuComentariu) prolog.push(`    # ${em.comentariu('copie')}`)
    prolog.push(`    ${py} = np.array(${py}, dtype=float)`)
    cuComentariu = true
  }
  // m si n, daca programul le citeste fara sa le fi dat el: dimensiunile primei matrice, altfel lungimea primului vector
  const cere = (x: string) => inv.citite.has(x) && !numeIntrari.has(x)
  const A = opt.intrari.find((i) => i.tip === 'matrice')
  const x = opt.intrari.find((i) => i.tip === 'vector')
  if (A && cere('m') && cere('n')) prolog.push(`    ${em.nume('m')}, ${em.nume('n')} = ${em.nume(A.nume)}.shape`)
  else if (A && cere('m')) prolog.push(`    ${em.nume('m')} = ${em.nume(A.nume)}.shape[0]`)
  else if (A && cere('n')) prolog.push(`    ${em.nume('n')} = ${em.nume(A.nume)}.shape[${opt.patrata ? 0 : 1}]`)
  else if (x && cere('n')) prolog.push(`    ${em.nume('n')} = ${em.nume(x.nume)}.shape[0]`)

  const iesiri = opt.iesiri ?? em.iesiriDeduse()
  const indici = iesiri.filter((n) => em.tinePozitii(n))
  const limba = opt.limba ?? 'ro'
  const antet = COMENTARII.antet[limba].map((l) => `# ${l}`)
  if (indici.length > 0) antet.push(`# ${COMENTARII.pozitii[limba].replace('{0}', indici.map((n) => em.nume(n)).join(', '))}`)
  const sgn = em.folosesteSgn ? ['def sgn(x):', `    # ${COMENTARII.sgn[limba]}`, '    return 1.0 if x >= 0 else -1.0', '', ''] : []
  // Apelul cu valorile din vizualizator, ca in laborator: datele, apelul, apoi print pe fiecare rezultat.
  const exemplu: string[] = []
  const valori = opt.exemplu
  const intrariPython = new Set(opt.intrari.map((i) => em.nume(i.nume)))
  // un rezultat cu numele unei intrari primeste sufixul _rez, ca intrarea sa ramana pentru comparatie
  const rezultate = iesiri.map((n) => (intrariPython.has(em.nume(n)) ? `${em.nume(n)}_rez` : em.nume(n)))
  if (valori && opt.intrari.every((i) => valori[i.nume] !== undefined)) {
    const apel = `${functie}(${opt.intrari.map((i) => em.nume(i.nume)).join(', ')})`
    exemplu.push('', '', 'if __name__ == "__main__":', `    # ${COMENTARII.exemplu[limba]}`)
    for (const i of opt.intrari) exemplu.push(`    ${em.nume(i.nume)} = ${valoarePython(valori[i.nume])}`)
    exemplu.push(`    ${rezultate.length > 0 ? `${rezultate.join(', ')} = ` : ''}${apel}`)
    // o matrice incepe pe linie noua, ca liniile ei sa stea una sub alta
    iesiri.forEach((n, k) => exemplu.push(em.tipuri.get(n) === 'matrice' ? `    print("${rezultate[k]} =", ${rezultate[k]}, sep="\\n")` : `    print("${rezultate[k]} =", ${rezultate[k]})`))
    if (opt.numpy?.length) {
      const inloc = (l: string) => l.replace(/\{dif\}/g, COMENTARII.diferenta[limba]).replace(/\{([^{}]+)\}/g, (tot, nume: string) => {
        const k = iesiri.indexOf(nume)
        return k < 0 ? tot : rezultate[k]
      })
      exemplu.push('', `    # ${COMENTARII.comparatie[limba]}`, ...opt.numpy.map((l) => `    ${inloc(l)}`))
    }
  }
  const cod = [...antet, 'import numpy as np', '', '', ...sgn, ...prolog, ...em.linii, ...(iesiri.length > 0 ? [`    return ${iesiri.map((n) => em.nume(n)).join(', ')}`] : []), ...exemplu, ''].join('\n')
  return { cod, iesiri, indici, iesiriPython: iesiri.map((n) => em.nume(n)), rezultateExemplu: rezultate }
}
