// Interpretorul: executa programul si produce urma, un pas pentru fiecare instructiune
// executata, cu celulele citite si scrise, formula cu valorile substituite si diferentele fata
// de pasul anterior. Un cadru complet al starii se pastreaza la fiecare CADRU pasi, ca starea
// de la orice pas sa se refaca ieftin (stareLa); vederea reda urma, iar derularea inapoi e o
// indexare.
import type { Expr, Instr, Program, Tinta } from './ast'
import { MAX_DESFASURAT, ROL, colorat, contine, fmt, latex, numeLatex, valoareLatex, type InfoLatex } from './latex'
import { mesaj } from './mesaje'
import { norm } from './parser'
import {
  citeste,
  cloneaza,
  esteTablou,
  matriceDin,
  matriceNoua,
  scalar,
  scrie,
  vectorDin,
  vectorNou,
  type Matrice,
  type Scalar,
  type Tablou,
  type Valoare,
  type Vector,
} from './valori'

export type Rol = 'scris' | 'citit' | 'pivot'

export interface Celula {
  nume: string
  i: number
  j?: number
  rol: Rol
  // scriere etichetata cu μ: un multiplicator, pastrat pentru mai tarziu
  mult?: boolean
}

export interface Scriere {
  nume: string
  i: number
  j?: number
  vechi: number
  nou: number
}

export type FelPas = 'antet' | 'gol' | 'conditie' | 'atrib' | 'schimb' | 'fie' | 'mesaj' | 'final'

export type FelOperatie =
  | 'matvec'
  | 'matmul'
  | 'vecmat'
  | 'dot'
  | 'exterior'
  | 'scalare'
  | 'impartire'
  | 'adunare'
  | 'scadere'
  | 'norma'
  | 'frobenius'
  | 'transpusa'

export interface Forma {
  tip: Valoare['tip']
  m: number
  n: number
}

// O operatie intre tablouri facuta la un pas: A y, z^T y, x + y, ‖x‖ si celelalte.
export interface Operatie {
  fel: FelOperatie
  // sub-expresia, in LaTeX, cu numele pastrate
  tex: string
  operanzi: Forma[]
  rezultat: Forma
  flopi: number
}

// O evaluare a conditiei unei bucle "cat timp": cele doua parti ale comparatiei, la iteratia `iter`.
export interface Iteratie {
  linie: number
  iter: number
  stanga: number
  dreapta: number
  // partile comparatiei, in LaTeX: e si tol pentru "e > tol"
  texStanga: string
  texDreapta: string
  op: string
  flopi: number
}

export interface Pas {
  fel: FelPas
  linie: number
  celule: Celula[]
  formula?: string
  // formula cu rezultatul inlocuit de "?", cand pasul calculeaza ceva
  intrebare?: string
  operatii?: Operatie[]
  // scalarul scris la acest pas si valoarea lui de dinainte (lipsa daca abia apare)
  scalarScris?: { nume: string; vechi?: number }
  iteratie?: Iteratie
  // rezultatul conditiei, la un pas de tip 'conditie'
  adevarat?: boolean
  mesaj?: string
  flopi: number
  scalari: Record<string, number>
  // diferentele fata de pasul anterior: celule scrise si tablouri create sau inlocuite
  scrieri: Scriere[]
  noi?: Record<string, { nou: Tablou; vechi?: Tablou }>
  // cadru complet, la fiecare CADRU pasi (si la fiecare pas cu instantanee: 'toate')
  stare?: Record<string, Tablou>
  final?: 'stop' | 'eroare' | 'gata'
}

export interface Rezultat {
  pasi: Pas[]
  stare: Record<string, Tablou>
  scalari: Record<string, number>
  final: 'stop' | 'eroare' | 'gata'
  eroare?: string
  flopi: number
}

export type Intrari = Record<string, number | number[] | number[][]>

export interface Optiuni {
  maxPasi?: number
  // formulele primesc clase de culoare pentru tinta, pivot si elementele citite
  culori?: boolean
  // 'cadre': un instantaneu la fiecare CADRU pasi; 'toate': la fiecare pas (pentru teste)
  instantanee?: 'cadre' | 'toate'
  // rezultatul fiecarei operatii (si fiecare intrare) se rotunjeste la atatea cifre semnificative,
  // ca intr-o masina de calcul cu precizie mica; lipsa: dubla precizie
  cifre?: number
}

export const CADRU = 100

export class EroareRulare extends Error {
  // calculul care nu s-a putut face, cu valorile lui (LaTeX), cand eroarea apare intr-o atribuire
  formula?: string

  constructor(
    public linie: number,
    text: string,
  ) {
    super(text)
    this.name = 'EroareRulare'
  }
}

class Oprire {
  constructor(public mesaj?: string) {}
}

function dinIntrare(v: number | number[] | number[][]): Valoare {
  if (typeof v === 'number') return scalar(v)
  if (Array.isArray(v[0])) return matriceDin(v as number[][])
  return vectorDin(v as number[])
}

// m si n sunt dimensiunile primei matrice; fara matrice, n este lungimea primului vector.
// Scalarii dati explicit in intrari au prioritate.
export function dimensiuni(intrari: Intrari): Record<string, number> {
  const valori = Object.values(intrari).map(dinIntrare)
  const A = valori.find((v) => v.tip === 'matrice')
  if (A) return { m: A.m, n: A.n }
  const x = valori.find((v) => v.tip === 'vector')
  return x ? { n: x.n } : {}
}

const formaDin = (v: Valoare): Forma =>
  v.tip === 'scalar' ? { tip: 'scalar', m: 1, n: 1 } : v.tip === 'matrice' ? { tip: 'matrice', m: v.m, n: v.n } : v.tip === 'rand' ? { tip: 'rand', m: 1, n: v.n } : { tip: 'vector', m: v.n, n: 1 }

const textForma = (f: Forma): string => (f.tip === 'scalar' ? '1' : `${f.m} x ${f.n}`)

function felBinar(op: string, a: Valoare, b: Valoare): FelOperatie {
  if (op === '+') return 'adunare'
  if (op === '-') return 'scadere'
  if (op === '/') return 'impartire'
  if (a.tip === 'scalar' || b.tip === 'scalar') return 'scalare'
  if (a.tip === 'matrice') return b.tip === 'matrice' ? 'matmul' : 'matvec'
  if (a.tip === 'rand') return b.tip === 'matrice' ? 'vecmat' : 'dot'
  return 'exterior'
}

function toateCelulele(nume: string, t: Tablou, rol: Rol): Celula[] {
  if (t.tip === 'vector') return t.d.map((_, k) => ({ nume, i: k + 1, rol }))
  return t.d.map((_, k) => ({ nume, i: Math.floor(k / t.n) + 1, j: (k % t.n) + 1, rol }))
}

export function urma(program: Program, intrari: Intrari, optiuni: Optiuni = {}): Rezultat {
  const it = new Interpretor(program, intrari, optiuni.culori ?? false, optiuni.instantanee ?? 'cadre', optiuni.cifre)
  const maxPasi = optiuni.maxPasi ?? 20000
  const pasi: Pas[] = []
  let final: Rezultat['final'] = 'gata'
  let eroare: string | undefined
  try {
    for (const pas of it.ruleaza()) {
      pasi.push(pas)
      if (pas.final === 'stop') {
        final = 'stop'
        break
      }
      if (pasi.length >= maxPasi) throw new EroareRulare(pas.linie, mesaj('pesteMaxPasi', maxPasi))
    }
  } catch (e) {
    if (!(e instanceof EroareRulare)) throw e
    final = 'eroare'
    eroare = mesaj('linia', e.linie, e.message)
    it.uita()
    pasi.push(it.pas('final', e.linie, [], { mesaj: eroare, final: 'eroare', formula: e.formula }))
  }
  return { pasi, stare: it.instantaneu(), scalari: it.scalari(), final, eroare, flopi: it.flopi }
}

function cloneazaStare(s: Record<string, Tablou>): Record<string, Tablou> {
  const rez: Record<string, Tablou> = {}
  for (const [n, t] of Object.entries(s)) rez[n] = cloneaza(t)
  return rez
}

// Starea tablourilor dupa pasul k: cel mai apropiat cadru de dinainte, plus diferentele.
export function stareLa(rez: Rezultat, k: number): Record<string, Tablou> {
  k = Math.min(Math.max(k, 0), rez.pasi.length - 1)
  let c = k
  while (c >= 0 && !rez.pasi[c].stare) c--
  const stare = c >= 0 ? cloneazaStare(rez.pasi[c].stare!) : {}
  for (let s = c + 1; s <= k; s++) {
    const p = rez.pasi[s]
    if (p.noi) for (const [nume, t] of Object.entries(p.noi)) stare[nume] = cloneaza(t.nou)
    for (const w of p.scrieri) {
      const t = stare[w.nume]
      if (t) scrie(t, w.nou, w.i, w.j)
    }
  }
  return stare
}

class Interpretor implements InfoLatex {
  env = new Map<string, Valoare>()
  alias = new Map<string, string>()
  locali: Map<string, number>[] = []
  flopi = 0
  citite: Celula[] = []
  linie = 0
  simbolice = new Set<string>()
  private valori = new WeakMap<Expr, Valoare>()
  private termeniSume = new WeakMap<Expr, string[]>()
  private numaraFlopi = true
  // sumele care la ultima evaluare au avut intervalul gol: adunarea sau scaderea lor nu e un flop
  private goale = new WeakSet<Expr>()
  // ultima operatie rotunjita la t cifre: valoarea exacta si cea rotunjita, pentru formula
  private rotunjire?: { exact: number; rotunjit: number }
  private scrieri: Scriere[] = []
  private noi: Record<string, { nou: Tablou; vechi?: Tablou }> = {}
  private operatii: Operatie[] = []
  private scalarScris?: { nume: string; vechi?: number }
  private nrPasi = 0

  constructor(
    private program: Program,
    intrari: Intrari,
    public culori: boolean,
    private instantanee: 'cadre' | 'toate',
    private cifre?: number,
  ) {
    for (const [nume, v] of Object.entries(intrari)) {
      const x = dinIntrare(v)
      this.env.set(nume, x.tip === 'scalar' ? scalar(this.fl(x.v)) : { ...x, d: x.d.map((e) => this.fl(e)) })
    }
    for (const [nume, v] of Object.entries(dimensiuni(intrari))) if (!this.env.has(nume)) this.env.set(nume, scalar(v))
  }

  valoare(e: Expr): Valoare | undefined {
    return this.valori.get(e)
  }

  termeni(e: Expr): string[] | undefined {
    return this.termeniSume.get(e)
  }

  eCelula(e: Extract<Expr, { tip: 'elem' }>): boolean {
    return esteTablou(this.env.get(this.tablouElem(e)))
  }

  // Tabloul la care se refera un element ca a_ij: aliasul, numele exact sau litera mare. Cand
  // litera mica e un scalar (m, n, o variabila de bucla), tabloul cu litera mare castiga daca
  // numarul de indici i se potriveste: m_ij este M(i, j), dar i_k ramane scalarul cu acest nume.
  private tablouElem(e: Extract<Expr, { tip: 'elem' }>): string {
    const nume = this.rezolva(e.nume)
    if (esteTablou(this.env.get(nume))) return nume
    const mare = e.nume.toUpperCase()
    const t = this.env.get(mare)
    return esteTablou(t) && (t.tip === 'vector' ? 1 : 2) === e.idx.length ? mare : nume
  }

  *ruleaza(): Generator<Pas, void, undefined> {
    try {
      yield* this.bloc(this.program.instr)
    } catch (e) {
      if (e instanceof Oprire) {
        yield this.pas('final', this.linie, [], { mesaj: e.mesaj ?? mesaj('stop'), final: 'stop' })
        return
      }
      throw e
    }
    yield this.pas('final', 0, [], { mesaj: mesaj('gata'), final: 'gata' })
  }

  instantaneu(): Record<string, Tablou> {
    const rez: Record<string, Tablou> = {}
    for (const [nume, v] of this.env) if (esteTablou(v)) rez[nume] = cloneaza(v)
    return rez
  }

  scalari(): Record<string, number> {
    const rez: Record<string, number> = {}
    for (const [nume, v] of this.env) if (v.tip === 'scalar') rez[nume] = v.v
    return rez
  }

  pas(fel: FelPas, linie: number, celule: Celula[], extra: Partial<Pas> = {}): Pas {
    const prioritate: Record<Rol, number> = { citit: 0, pivot: 1, scris: 2 }
    const m = new Map<string, Celula>()
    for (const c of celule) {
      const k = `${c.nume}:${c.i}:${c.j ?? ''}`
      const v = m.get(k)
      if (!v || prioritate[c.rol] > prioritate[v.rol]) m.set(k, c)
    }
    const cuCadru = this.instantanee === 'toate' || this.nrPasi % CADRU === 0
    this.nrPasi++
    const p: Pas = {
      fel,
      linie,
      celule: [...m.values()],
      flopi: this.flopi,
      scalari: this.scalari(),
      scrieri: this.scrieri,
      ...extra,
    }
    if (Object.keys(this.noi).length) p.noi = this.noi
    if (this.operatii.length) p.operatii = this.operatii
    if (this.scalarScris) p.scalarScris = this.scalarScris
    if (cuCadru) p.stare = this.instantaneu()
    this.scrieri = []
    this.noi = {}
    this.operatii = []
    this.scalarScris = undefined
    return p
  }

  // Operatiile si scalarul notate pana aici nu apartin pasului care urmeaza: au ramas de la
  // capetele unei bucle fara iteratii sau de la o instructiune oprita de o eroare.
  uita(): void {
    this.operatii = []
    this.scalarScris = undefined
  }

  private faraCulori<T>(f: () => T): T {
    const inainte = this.culori
    this.culori = false
    try {
      return f()
    } finally {
      this.culori = inainte
    }
  }

  // Retine operatia dintre tablouri facuta de nodul `e`, o singura data pe pas.
  private noteaza(fel: FelOperatie, e: Expr, operanzi: Valoare[], rezultat: Valoare, flopi: number): void {
    const tex = this.faraCulori(() => latex(e, this, 'simbolic'))
    if (this.operatii.some((o) => o.fel === fel && o.tex === tex)) return
    this.operatii.push({ fel, tex, operanzi: operanzi.map(formaDin), rezultat: formaDin(rezultat), flopi })
  }

  private eroare(text: string): EroareRulare {
    return new EroareRulare(this.linie, text)
  }

  private *bloc(instr: Instr[]): Generator<Pas, void, undefined> {
    for (const s of instr) yield* this.instr(s)
  }

  private *instr(s: Instr): Generator<Pas, void, undefined> {
    this.linie = s.linie
    switch (s.tip) {
      case 'peste':
        for (const n of s.nume) {
          this.alias.set(n, s.tinta)
          this.alias.set(n.toLowerCase(), s.tinta)
          this.alias.set(n.toUpperCase(), s.tinta)
        }
        return
      case 'fie': {
        const texte: string[] = []
        const celule: Celula[] = []
        for (const d of s.decl) {
          const dims = d.dims.map((x) => this.indice(x))
          if (dims.some((x) => x < 0)) throw this.eroare(mesaj('dimNegativa', d.nume))
          const nou = dims.length === 1 ? vectorNou(dims[0]) : matriceNoua(dims[0], dims[1])
          this.punTablou(d.nume, nou)
          celule.push(...toateCelulele(d.nume, nou, 'scris'))
          texte.push(`${numeLatex(d.nume)} \\leftarrow 0 \\;(${dims.join(' \\times ')})`)
        }
        yield this.pas('fie', s.linie, celule, { formula: texte.join(',\\quad ') })
        return
      }
      case 'atrib':
        yield* this.atrib(s)
        return
      case 'schimb': {
        const a = this.celula(s.a)
        const b = this.celula(s.b)
        if (s.a.tip !== 'elem' || s.b.tip !== 'elem' || !a.tablou || !b.tablou) throw this.eroare(mesaj('schimbElemente'))
        const va = citeste(a.tablou, a.i, a.j)
        const vb = citeste(b.tablou, b.i, b.j)
        this.scrieCelula(a.nume, a.tablou, vb, a.i, a.j)
        this.scrieCelula(b.nume, b.tablou, va, b.i, b.j)
        const f = `${this.tintaLatex(s.a)} \\leftrightarrow ${this.tintaLatex(s.b)}: \\; ${fmt(va)} \\leftrightarrow ${fmt(vb)}`
        yield this.pas('schimb', s.linie, [{ nume: a.nume, i: a.i, j: a.j, rol: 'scris' }, { nume: b.nume, i: b.i, j: b.j, rol: 'scris' }], { formula: f })
        return
      }
      case 'pentru': {
        const de = this.indice(s.de)
        const la = this.indice(s.la)
        const pas = s.pas ? this.indice(s.pas) : 1
        if (pas === 0) throw this.eroare(mesaj('pasZero'))
        const interval = `${numeLatex(s.var)} = ${de} : ${pas === 1 ? '' : `${pas} : `}${la}`
        const niciuna = pas > 0 ? de > la : de < la
        if (niciuna) {
          yield this.pas('gol', s.linie, [], { formula: interval, mesaj: mesaj('nicioIteratie') })
          return
        }
        for (let k = de; pas > 0 ? k <= la : k >= la; k += pas) {
          this.env.set(s.var, scalar(k))
          yield this.pas('antet', s.linie, [], { formula: `${numeLatex(s.var)} \\leftarrow ${k} \\qquad (${interval})` })
          yield* this.bloc(s.corp)
          this.linie = s.linie
        }
        return
      }
      case 'daca': {
        const c = this.conditie(s.cond)
        yield c.pas
        if (c.adevarat) yield* this.bloc(s.atunci)
        else if (s.altfel) yield* this.bloc(s.altfel)
        return
      }
      case 'cattimp':
        for (let iter = 0; ; iter++) {
          this.linie = s.linie
          const c = this.conditie(s.cond, iter)
          yield c.pas
          if (!c.adevarat) return
          yield* this.bloc(s.corp)
        }
      case 'stop':
        throw new Oprire(s.mesaj)
      case 'tipareste':
        yield this.pas('mesaj', s.linie, [], { mesaj: s.mesaj })
        return
    }
  }

  // Evalueaza conditia si intoarce si pasul ei; apelantul il emite si alege ramura. `iter` e
  // numarul iteratiei cand conditia e a unei bucle "cat timp": valorile comparate se pastreaza,
  // ca vederea sa arate cum scade eroarea spre toleranta.
  private conditie(e: Expr, iter?: number): { adevarat: boolean; pas: Pas } {
    if (e.tip !== 'cmp') throw this.eroare(mesaj('conditieComparatie'))
    this.citite = []
    this.uita()
    const v = this.ev(e)
    const adevarat = v.tip === 'scalar' && v.v !== 0
    const inceput = `${latex(e, this, 'simbolic')}: \\; ${latex(e, this, 'numeric')} \\;\\Rightarrow\\;`
    const extra: Partial<Pas> = { formula: `${inceput} \\text{${mesaj(adevarat ? 'adevarat' : 'fals')}}`, intrebare: `${inceput} \\;?`, adevarat }
    const a = this.valoare(e.a)
    const b = this.valoare(e.b)
    if (iter !== undefined && a?.tip === 'scalar' && b?.tip === 'scalar') {
      const [texStanga, texDreapta] = this.faraCulori(() => [latex(e.a, this, 'simbolic'), latex(e.b, this, 'simbolic')])
      extra.iteratie = { linie: this.linie, iter, stanga: a.v, dreapta: b.v, texStanga, texDreapta, op: e.op, flopi: this.flopi }
    }
    return { adevarat, pas: this.pas('conditie', this.linie, this.citite, extra) }
  }

  private *atrib(s: Extract<Instr, { tip: 'atrib' }>): Generator<Pas, void, undefined> {
    if (!s.bucla) {
      yield* this.atribUnu(s)
      return
    }
    const de = this.indice(s.bucla.de)
    const la = this.indice(s.bucla.la)
    for (let k = de; k <= la; k++) {
      this.env.set(s.bucla.var, scalar(k))
      yield* this.atribUnu(s)
    }
  }

  private *atribUnu(s: Extract<Instr, { tip: 'atrib' }>): Generator<Pas, void, undefined> {
    this.citite = []
    this.uita()
    this.rotunjire = undefined
    const flopiInainte = this.flopi
    let v: Valoare
    try {
      v = this.ev(s.expr)
    } catch (e) {
      // pasul de eroare arata ce calcul nu s-a putut face: "a_21 / a_11 = 1 / 0"
      if (e instanceof EroareRulare && !e.formula) e.formula = this.formulaOprita(s)
      throw e
    }
    // aritmetica pe indici si contoare (k ← k + 1, s ← min(m - 1, n)) nu este un flop
    if (v.tip === 'scalar' && Number.isInteger(v.v) && !this.atingeTablouri(s.expr)) this.flopi = flopiInainte
    const simbolic = latex(s.expr, this, 'simbolic')
    const numeric = latex(s.expr, this, 'numeric')
    const scrise = this.scrie(s.tinta, v)
    const rezultat = valoareLatex(v, s.tinta.nume)
    // eticheta (μ_ik) nu se evalueaza, dar indicii ei trebuie stiuti ca sa apara ca μ_21
    if (s.eticheta?.tip === 'elem') for (const x of s.eticheta.idx) this.indice(x)
    if (s.eticheta && norm(s.eticheta.nume) === 'μ') for (const c of scrise) c.mult = true
    const eticheta = s.eticheta ? `${this.tintaLatex(s.eticheta)} = ` : ''
    let f = `${this.tintaLatex(s.tinta)} \\leftarrow ${eticheta}${simbolic}`
    if (numeric !== simbolic) f += ` = ${numeric}`
    // un tablou prea mare nu se scrie in formula; rezultatul lui se vede doar in grila
    const scris = v.tip === 'scalar' || v.d.length <= MAX_DESFASURAT
    const frunza = s.expr.tip === 'num' || s.expr.tip === 'var' || s.expr.tip === 'elem' || s.expr.tip === 'felie'
    // o copiere nu are ce ascunde: intrebarea apare doar cand pasul calculeaza ceva
    const calcul = scris ? rezultat !== numeric : !frunza
    const extra: Partial<Pas> = {}
    if (calcul) extra.intrebare = `${f} = \\;?`
    // cu t cifre, ultima operatie arata si valoarea dinainte de rotunjire: 1 - 10000 = -9999 → -10000
    // ev() poate schimba this.rotunjire; TypeScript nu stie, deci tipul se reia aici
    const ultima = this.rotunjire as { exact: number; rotunjit: number } | undefined
    const rot = v.tip === 'scalar' && ultima?.rotunjit === v.v ? ultima : undefined
    const exact = rot ? `${String(Number(rot.exact.toPrecision(10)))} \\;\\xrightarrow{\\text{${mesaj('rotunjitLa', this.cifre ?? 0)}}}\\; ` : ''
    if (scris && rezultat !== numeric && rezultat !== simbolic) f += ` = ${exact}${rezultat}`
    extra.formula = f
    yield this.pas('atrib', s.linie, [...this.citite, ...scrise], extra)
  }

  // Formula unei atribuiri a carei expresie nu s-a putut evalua: partea simbolica si, daca se poate
  // scrie, cea cu valorile inlocuite. Fara rezultat.
  private formulaOprita(s: Extract<Instr, { tip: 'atrib' }>): string | undefined {
    try {
      // indicii tintei trebuie stiuti, ca ea sa apara ca a_21, nu ca a_ik
      if (s.tinta.tip === 'elem') for (const x of s.tinta.idx) this.indice(x)
      const simbolic = latex(s.expr, this, 'simbolic')
      let f = `${this.tintaLatex(s.tinta)} \\leftarrow ${simbolic}`
      try {
        const numeric = latex(s.expr, this, 'numeric')
        if (numeric !== simbolic) f += ` = ${numeric}`
      } catch {
        // valorile nu se pot scrie (un indice in afara tabloului): ramane forma simbolica
      }
      return f
    } catch {
      return undefined
    }
  }

  // Tinta atribuirii, in culoarea „scris”, fara albastrul pe care l-ar primi ca element citit.
  private tintaLatex(t: Tinta): string {
    const inainte = this.culori
    this.culori = false
    const s = latex(t, this, 'simbolic')
    this.culori = inainte
    return inainte ? colorat(s, ROL.scris) : s
  }

  private rezolva(nume: string): string {
    const a = this.alias.get(nume)
    if (a) return a
    if (this.env.has(nume)) return nume
    const mare = nume.toUpperCase()
    if (this.env.has(mare)) return mare
    return nume
  }

  private celula(e: Tinta): { nume: string; tablou?: Tablou; i: number; j?: number } {
    if (e.tip !== 'elem') throw this.eroare(mesaj('seAsteptaElement'))
    const nume = this.tablouElem(e)
    const tab = this.env.get(nume)
    if (!esteTablou(tab)) return { nume, i: 0 }
    const idx = e.idx.map((x) => this.indice(x))
    if (tab.tip === 'vector') {
      if (idx.length !== 1) throw this.eroare(mesaj('vectorUnIndice', e.sursa, nume))
      const [i] = idx
      if (i < 1 || i > tab.n) throw this.eroare(mesaj('indiceVector', e.sursa, i, nume, tab.n))
      return { nume, tablou: tab, i }
    }
    if (idx.length !== 2) throw this.eroare(mesaj('matriceDoiIndici', e.sursa, nume))
    const [i, j] = idx
    if (i < 1 || i > tab.m || j < 1 || j > tab.n) throw this.eroare(mesaj('pozitieMatrice', e.sursa, i, j, nume, tab.m, tab.n))
    return { nume, tablou: tab, i, j }
  }

  private scrieCelula(nume: string, t: Tablou, nou: number, i: number, j?: number): void {
    this.scrieri.push({ nume, i, j, vechi: citeste(t, i, j), nou })
    scrie(t, nou, i, j)
  }

  private punTablou(nume: string, nou: Tablou): void {
    const vechi = this.env.get(nume)
    this.env.set(nume, nou)
    this.noi[nume] = { nou: cloneaza(nou), vechi: esteTablou(vechi) ? vechi : undefined }
  }

  private punScalar(nume: string, v: Scalar): void {
    const vechi = this.env.get(nume)
    this.scalarScris = { nume, vechi: vechi?.tip === 'scalar' ? vechi.v : undefined }
    this.env.set(nume, v)
  }

  private scrie(t: Tinta, v: Valoare): Celula[] {
    if (t.tip === 'felie') {
      // A(k+1:n, k) ← ...: un numar umple blocul, un vector sau o matrice trebuie sa aiba forma lui
      const r = this.regiune(t)
      const seamana = r.fel === 'matrice' ? v.tip === 'matrice' && v.m === r.m && v.n === r.n : (v.tip === 'vector' || v.tip === 'rand') && v.n === r.celule.length
      if (v.tip !== 'scalar' && !seamana) throw this.eroare(mesaj('blocDimensiuni', t.nume, textForma({ tip: r.fel, m: r.m, n: r.n }), textForma(formaDin(v))))
      return r.celule.map(([i, j], k) => {
        this.scrieCelula(r.nume, r.tab, v.tip === 'scalar' ? v.v : v.d[k], i, j)
        return { nume: r.nume, i, j, rol: 'scris' as const }
      })
    }
    if (t.tip === 'elem') {
      const c = this.celula(t)
      if (!c.tablou) {
        if (v.tip !== 'scalar') throw this.eroare(mesaj('nuEsteTablouFie', t.sursa))
        this.punScalar(t.sursa, v)
        return []
      }
      if (v.tip !== 'scalar') throw this.eroare(mesaj('doarNumar', t.sursa))
      this.scrieCelula(c.nume, c.tablou, v.v, c.i, c.j)
      return [{ nume: c.nume, i: c.i, j: c.j, rol: 'scris' }]
    }
    const existent = this.env.get(t.nume)
    if (v.tip === 'scalar') {
      if (esteTablou(existent)) {
        for (const c of toateCelulele(t.nume, existent, 'scris')) this.scrieCelula(t.nume, existent, v.v, c.i, c.j)
        return toateCelulele(t.nume, existent, 'scris')
      }
      this.punScalar(t.nume, v)
      return []
    }
    const nou: Tablou = v.tip === 'rand' ? { tip: 'vector', n: v.n, d: [...v.d] } : cloneaza(v)
    const aceeasiForma = esteTablou(existent) && existent.tip === nou.tip && existent.n === nou.n && (existent.tip === 'vector' || existent.m === (nou as Matrice).m)
    if (esteTablou(existent) && aceeasiForma) {
      for (const c of toateCelulele(t.nume, existent, 'scris')) this.scrieCelula(t.nume, existent, nou.d[(c.i - 1) * (existent.tip === 'matrice' ? existent.n : 1) + ((c.j ?? 1) - 1)], c.i, c.j)
      return toateCelulele(t.nume, existent, 'scris')
    }
    this.punTablou(t.nume, nou)
    return toateCelulele(t.nume, nou, 'scris')
  }

  private local(nume: string): number | undefined {
    for (let k = this.locali.length - 1; k >= 0; k--) {
      const v = this.locali[k].get(nume)
      if (v !== undefined) return v
    }
    return undefined
  }

  // Expresia citeste un tablou (element, felie, tablou intreg) sau parcurge o suma ori un extrem;
  // altfel e aritmetica pe indici si scalari.
  private atingeTablouri(e: Expr): boolean {
    switch (e.tip) {
      case 'num':
        return false
      case 'var':
        return this.local(e.nume) === undefined && esteTablou(this.env.get(this.rezolva(e.nume)))
      case 'elem':
        return this.eCelula(e)
      case 'felie':
      case 'suma':
      case 'extrem':
        return true
      case 'bin':
      case 'cmp':
        return this.atingeTablouri(e.a) || this.atingeTablouri(e.b)
      case 'neg':
      case 'abs':
      case 'norma':
      case 'transp':
        return this.atingeTablouri(e.a)
      case 'apel':
        return e.args.some((x) => this.atingeTablouri(x))
    }
  }

  // Indicii si limitele buclelor: intregi, fara flopi numarati.
  private indice(e: Expr): number {
    const inainte = this.numaraFlopi
    this.numaraFlopi = false
    let v: Valoare
    try {
      v = this.ev(e)
    } finally {
      this.numaraFlopi = inainte
    }
    if (v.tip !== 'scalar') throw this.eroare(mesaj('indiceNumar'))
    if (!Number.isInteger(v.v)) throw this.eroare(mesaj('indiceIntreg', fmt(v.v)))
    return v.v
  }

  // Rotunjirea la `cifre` cifre semnificative, dupa fiecare operatie; fara `cifre`, numarul ramane.
  private fl(x: number): number {
    return this.cifre ? Number(x.toPrecision(this.cifre)) : x
  }

  private flop(k = 1): void {
    if (this.numaraFlopi) this.flopi += k
  }

  private scalarDin(v: Valoare, ce: string): number {
    if (v.tip !== 'scalar') throw this.eroare(mesaj('seAsteptaNumar', ce, v.tip))
    return v.v
  }

  private ev(e: Expr): Valoare {
    const v = this.evNod(e)
    this.valori.set(e, v)
    return v
  }

  private evNod(e: Expr): Valoare {
    switch (e.tip) {
      case 'num':
        return scalar(e.v)
      case 'var': {
        const l = this.local(e.nume)
        if (l !== undefined) return scalar(l)
        const nume = this.rezolva(e.nume)
        const v = this.env.get(nume)
        if (!v) throw this.eroare(mesaj('nedefinita', e.nume))
        if (esteTablou(v)) this.citite.push(...toateCelulele(nume, v, 'citit'))
        return v
      }
      case 'elem': {
        const c = this.celula(e)
        if (!c.tablou) {
          const s = this.local(e.sursa) ?? this.env.get(e.sursa)
          if (s === undefined) throw this.eroare(mesaj('nedefinit', e.sursa))
          return typeof s === 'number' ? scalar(s) : s
        }
        this.citite.push({ nume: c.nume, i: c.i, j: c.j, rol: 'citit' })
        return scalar(citeste(c.tablou, c.i, c.j))
      }
      case 'felie':
        return this.felie(e)
      case 'bin': {
        const a = this.ev(e.a)
        const inainte = this.citite.length
        const b = this.ev(e.b)
        if (e.op === '/' && e.b.tip === 'elem') for (let k = inainte; k < this.citite.length; k++) this.citite[k].rol = 'pivot'
        const flopi = this.flopi
        // a - Σ pe un interval gol este a - 0: nicio operatie de facut
        const numara = this.numaraFlopi
        if ((e.op === '+' || e.op === '-') && (this.goale.has(e.a) || this.goale.has(e.b))) this.numaraFlopi = false
        let r: Valoare
        try {
          r = this.aritm(e.op, a, b)
        } finally {
          this.numaraFlopi = numara
        }
        if (e.op !== '^' && (a.tip !== 'scalar' || b.tip !== 'scalar')) this.noteaza(felBinar(e.op, a, b), e, [a, b], r, this.flopi - flopi)
        return r
      }
      case 'neg': {
        const a = this.ev(e.a)
        if (a.tip === 'scalar') return scalar(-a.v)
        return { ...a, d: a.d.map((x) => -x) }
      }
      case 'abs':
        return scalar(Math.abs(this.scalarDin(this.ev(e.a), mesaj('modulul'))))
      case 'norma': {
        const a = this.ev(e.a)
        if (a.tip === 'scalar') return scalar(Math.abs(a.v))
        let s = 0
        for (const x of a.d) s = this.fl(s + this.fl(x * x))
        const flopi = this.flopi
        // n inmultiri si n - 1 adunari; radicalul se numara separat, ca in curs
        this.flop(Math.max(2 * a.d.length - 1, 0))
        const r = scalar(this.fl(Math.sqrt(s)))
        this.noteaza(a.tip === 'matrice' ? 'frobenius' : 'norma', e, [a], r, this.flopi - flopi)
        return r
      }
      case 'transp': {
        const a = this.ev(e.a)
        if (a.tip === 'vector') return { tip: 'rand', n: a.n, d: [...a.d] }
        if (a.tip === 'rand') return { tip: 'vector', n: a.n, d: [...a.d] }
        if (a.tip === 'scalar') return a
        const t = matriceNoua(a.n, a.m)
        for (let i = 1; i <= a.m; i++) for (let j = 1; j <= a.n; j++) scrie(t, citeste(a, i, j), j, i)
        this.noteaza('transpusa', e, [a], t, 0)
        return t
      }
      case 'apel': {
        // argumentele functiilor de dimensiune nu sunt citiri de celule
        if (e.nume === 'linii' || e.nume === 'coloane' || e.nume === 'lungime') {
          const inainte = this.citite.length
          const v = this.apel(e.nume, e.args.map((x) => this.ev(x)))
          this.citite.length = inainte
          return v
        }
        return this.apel(e.nume, e.args.map((x) => this.ev(x)))
      }
      case 'suma': {
        const de = this.indice(e.de)
        const la = this.indice(e.la)
        if (de > la) {
          this.fixeazaIndici(e.corp, new Set([e.var]))
          this.goale.add(e)
        } else this.goale.delete(e)
        let s = 0
        const termeni: string[] = []
        for (let k = de; k <= la; k++) {
          this.locali.push(new Map([[e.var, k]]))
          const t = this.scalarDin(this.ev(e.corp), mesaj('termenulSumei'))
          termeni.push(latex(e.corp, this, 'numeric'))
          this.locali.pop()
          s = this.fl(s + t)
          if (k > de) this.flop()
        }
        this.termeniSume.set(e, termeni)
        return scalar(s)
      }
      case 'extrem': {
        const de = this.indice(e.de)
        const la = this.indice(e.la)
        let bun: number | undefined
        let unde = de
        // celulele citite pentru termenul castigator: [inceput, sfarsit) in this.citite
        let alese: [number, number] = [0, 0]
        const termeni: string[] = []
        for (let k = de; k <= la; k++) {
          const inceput = this.citite.length
          this.locali.push(new Map([[e.var, k]]))
          const t = this.scalarDin(this.ev(e.corp), e.fel)
          this.locali.pop()
          termeni.push(fmt(t))
          const maxim = e.fel === 'max' || e.fel === 'argmax'
          if (bun === undefined || (maxim ? t > bun : t < bun)) {
            bun = t
            unde = k
            alese = [inceput, this.citite.length]
          }
        }
        this.termeniSume.set(e, termeni)
        if (bun === undefined) throw this.eroare(mesaj('intervalGol', e.fel))
        // elementul gasit de argmax este pivotul ales; se vede rosu in grila
        if (e.fel === 'argmax' || e.fel === 'argmin') for (let k = alese[0]; k < alese[1]; k++) this.citite[k].rol = 'pivot'
        return scalar(e.fel === 'argmax' || e.fel === 'argmin' ? unde : bun)
      }
      case 'cmp': {
        const a = this.scalarDin(this.ev(e.a), mesaj('comparatia'))
        const b = this.scalarDin(this.ev(e.b), mesaj('comparatia'))
        const r =
          e.op === '<' ? a < b : e.op === '>' ? a > b : e.op === '≤' ? a <= b : e.op === '≥' ? a >= b : e.op === '=' ? a === b : a !== b
        return scalar(r ? 1 : 0)
      }
    }
  }

  // Celulele unui bloc A(k:m, k), in ordinea pe linii. Forma o da scrierea, nu valorile:
  // A(i, a:b) este o linie, A(a:b, j) o coloana, A(a:b, c:d) o matrice, chiar si cu o singura linie.
  private regiune(e: Extract<Expr, { tip: 'felie' }>): { nume: string; tab: Tablou; celule: [number, number | undefined][]; fel: 'vector' | 'rand' | 'matrice'; m: number; n: number } {
    const nume = this.rezolva(e.nume)
    const tab = this.env.get(nume)
    if (!esteTablou(tab)) throw this.eroare(mesaj('nuEsteTablou', e.nume))
    const interval = (x: Expr | { tip: 'interval'; de: Expr; la: Expr } | null, lungime: number): [number, number] => {
      const a = x === null ? 1 : this.indice(x.tip === 'interval' ? x.de : x)
      const b = x === null ? lungime : x.tip === 'interval' ? this.indice(x.la) : a
      if (a <= b && (a < 1 || b > lungime)) throw this.eroare(mesaj('blocIese', nume))
      return [a, b]
    }
    const unul = (x: Expr | { tip: 'interval' } | null) => x !== null && x.tip !== 'interval'
    const celule: [number, number | undefined][] = []
    if (tab.tip === 'vector') {
      if (e.idx.length !== 1) throw this.eroare(mesaj('vectorUnIndice', e.nume, nume))
      const [a, b] = interval(e.idx[0], tab.n)
      for (let i = a; i <= b; i++) celule.push([i, undefined])
      return { nume, tab, celule, fel: 'vector', m: celule.length, n: 1 }
    }
    if (e.idx.length !== 2) throw this.eroare(mesaj('matriceDoiIndici', e.nume, nume))
    const [r1, r2] = interval(e.idx[0], tab.m)
    const [c1, c2] = interval(e.idx[1], tab.n)
    for (let i = r1; i <= r2; i++) for (let j = c1; j <= c2; j++) celule.push([i, j])
    const m = Math.max(r2 - r1 + 1, 0)
    const n = Math.max(c2 - c1 + 1, 0)
    if (unul(e.idx[0])) return { nume, tab, celule, fel: 'rand', m: 1, n }
    if (unul(e.idx[1])) return { nume, tab, celule, fel: 'vector', m, n: 1 }
    return { nume, tab, celule, fel: 'matrice', m, n }
  }

  // O suma pe un interval gol nu isi evalueaza termenul, deci indicii lui ar ramane in formula
  // cu valorile de la o evaluare mai veche (a_1j in loc de a_2j). Indicii care nu depind de
  // variabila sumei se evalueaza aici, fara sa conteze ca citiri.
  private fixeazaIndici(e: Expr, legate: Set<string>): void {
    const copii: Expr[] = []
    switch (e.tip) {
      case 'elem': {
        const citite = this.citite.length
        for (const x of e.idx) {
          if (contine(x, legate)) continue
          try {
            this.indice(x)
          } catch {
            // un indice care nu se poate evalua ramane scris cu litere
          }
        }
        this.citite.length = citite
        return
      }
      case 'bin':
      case 'cmp':
        copii.push(e.a, e.b)
        break
      case 'neg':
      case 'abs':
      case 'norma':
      case 'transp':
        copii.push(e.a)
        break
      case 'apel':
        copii.push(...e.args)
        break
      case 'suma':
      case 'extrem':
        copii.push(e.corp)
        break
      default:
        return
    }
    for (const c of copii) this.fixeazaIndici(c, legate)
  }

  private felie(e: Extract<Expr, { tip: 'felie' }>): Valoare {
    const r = this.regiune(e)
    const d = r.celule.map(([i, j]) => {
      this.citite.push({ nume: r.nume, i, j, rol: 'citit' })
      return citeste(r.tab, i, j)
    })
    if (r.fel === 'matrice') return { tip: 'matrice', m: r.m, n: r.n, d }
    return { tip: r.fel, n: d.length, d }
  }

  private apel(nume: string, args: Valoare[]): Valoare {
    // dimensiunile unui tablou: linii(A), coloane(A), lungime(x)
    if (nume === 'linii' || nume === 'coloane' || nume === 'lungime') {
      const a = args[0]
      if (!a || a.tip === 'scalar') throw this.eroare(mesaj('nuEsteTablou', nume))
      if (nume === 'lungime') return scalar(a.tip === 'matrice' ? a.m * a.n : a.n)
      if (a.tip === 'matrice') return scalar(nume === 'linii' ? a.m : a.n)
      if (a.tip === 'rand') return scalar(nume === 'linii' ? 1 : a.n)
      return scalar(nume === 'linii' ? a.n : 1)
    }
    const nr = args.map((a) => this.scalarDin(a, nume))
    switch (nume) {
      case 'sqrt': {
        if (nr[0] < 0) throw this.eroare(mesaj('radicalNegativ', fmt(nr[0])))
        // radicalul nu este un flop: cursul il numara separat
        return scalar(this.fl(Math.sqrt(nr[0])))
      }
      case 'sgn':
        return scalar(nr[0] >= 0 ? 1 : -1)
      case 'abs':
        return scalar(Math.abs(nr[0]))
      case 'min':
        return scalar(Math.min(...nr))
      case 'max':
        return scalar(Math.max(...nr))
    }
    throw this.eroare(mesaj('functieNecunoscuta', nume))
  }

  private aritm(op: '+' | '-' | '*' | '/' | '^', a: Valoare, b: Valoare): Valoare {
    if (a.tip === 'scalar' && b.tip === 'scalar') {
      this.flop()
      const r = op === '+' ? a.v + b.v : op === '-' ? a.v - b.v : op === '*' ? a.v * b.v : op === '/' ? a.v / b.v : a.v ** b.v
      if (!Number.isFinite(r)) throw this.eroare(mesaj(op === '/' && b.v === 0 ? 'impartireZero' : 'rezultatInfinit'))
      const rotunjit = this.fl(r)
      if (rotunjit !== r) this.rotunjire = { exact: r, rotunjit }
      return scalar(rotunjit)
    }
    const scaleaza = (t: Vector | Matrice | { tip: 'rand'; n: number; d: number[] }, f: (x: number) => number) => {
      this.flop(t.d.length)
      return { ...t, d: t.d.map((x) => this.fl(f(x))) }
    }
    if (op === '*') {
      if (a.tip === 'scalar' && b.tip !== 'scalar') return scaleaza(b, (x) => a.v * x)
      if (b.tip === 'scalar' && a.tip !== 'scalar') return scaleaza(a, (x) => x * b.v)
      if (a.tip === 'matrice' && b.tip === 'vector') {
        if (a.n !== b.n) throw this.eroare(mesaj('matvecDim', a.m, a.n, b.n))
        const y = vectorNou(a.m)
        for (let i = 1; i <= a.m; i++) {
          let s = 0
          for (let j = 1; j <= a.n; j++) s = this.fl(s + this.fl(citeste(a, i, j) * b.d[j - 1]))
          y.d[i - 1] = s
        }
        this.flop(a.m * Math.max(2 * a.n - 1, 0))
        return y
      }
      if (a.tip === 'rand' && b.tip === 'vector') {
        if (a.n !== b.n) throw this.eroare(mesaj('dotDim'))
        let s = 0
        for (let k = 0; k < a.n; k++) s = this.fl(s + this.fl(a.d[k] * b.d[k]))
        this.flop(Math.max(2 * a.n - 1, 0))
        return scalar(s)
      }
      if (a.tip === 'rand' && b.tip === 'matrice') {
        if (a.n !== b.m) throw this.eroare(mesaj('vecmatDim'))
        const r: number[] = []
        for (let j = 1; j <= b.n; j++) {
          let s = 0
          for (let i = 1; i <= b.m; i++) s = this.fl(s + this.fl(a.d[i - 1] * citeste(b, i, j)))
          r.push(s)
        }
        this.flop(b.n * Math.max(2 * b.m - 1, 0))
        return { tip: 'rand', n: b.n, d: r }
      }
      if (a.tip === 'matrice' && b.tip === 'matrice') {
        if (a.n !== b.m) throw this.eroare(mesaj('matmulDim', a.m, a.n, b.m, b.n))
        const c = matriceNoua(a.m, b.n)
        for (let i = 1; i <= a.m; i++)
          for (let j = 1; j <= b.n; j++) {
            let s = 0
            for (let k = 1; k <= a.n; k++) s = this.fl(s + this.fl(citeste(a, i, k) * citeste(b, k, j)))
            scrie(c, s, i, j)
          }
        this.flop(a.m * b.n * Math.max(2 * a.n - 1, 0))
        return c
      }
      if (a.tip === 'vector' && b.tip === 'rand') {
        const c = matriceNoua(a.n, b.n)
        for (let i = 1; i <= a.n; i++) for (let j = 1; j <= b.n; j++) scrie(c, this.fl(a.d[i - 1] * b.d[j - 1]), i, j)
        this.flop(a.n * b.n)
        return c
      }
      if (a.tip === 'vector' && b.tip === 'vector') throw this.eroare(mesaj('vectorOriVector'))
    }
    if (op === '/' && b.tip === 'scalar' && a.tip !== 'scalar') {
      if (b.v === 0) throw this.eroare(mesaj('impartireZero'))
      return scaleaza(a, (x) => x / b.v)
    }
    if ((op === '+' || op === '-') && a.tip !== 'scalar' && b.tip !== 'scalar' && a.tip === b.tip && a.d.length === b.d.length) {
      this.flop(a.d.length)
      return { ...a, d: a.d.map((x, k) => this.fl(op === '+' ? x + b.d[k] : x - b.d[k])) }
    }
    throw this.eroare(mesaj('opNesuportata', a.tip, op, b.tip))
  }
}
