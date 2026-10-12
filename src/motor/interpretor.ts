// Interpretorul: executa programul si produce urma, un pas pentru fiecare instructiune
// executata, cu celulele citite si scrise, formula cu valorile substituite si diferentele fata
// de pasul anterior. Un cadru complet al starii se pastreaza la fiecare CADRU pasi, ca starea
// de la orice pas sa se refaca ieftin (stareLa); vederea reda urma, iar derularea inapoi e o
// indexare.
import type { Expr, Instr, Program, Tinta } from './ast'
import { ROL, colorat, fmt, latex, numeLatex, valoareLatex, type InfoLatex } from './latex'
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

export interface Pas {
  fel: FelPas
  linie: number
  celule: Celula[]
  formula?: string
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
}

export const CADRU = 100

export class EroareRulare extends Error {
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

// n pentru matrice patrate si vectori, m si n pentru matrice dreptunghiulare; scalarii
// dati explicit in intrari au prioritate.
export function dimensiuni(intrari: Intrari): Record<string, number> {
  const d: Record<string, number> = {}
  const valori = Object.values(intrari).map(dinIntrare)
  for (const v of valori) {
    if (v.tip !== 'matrice') continue
    if (v.m === v.n) d.n ??= v.m
    else {
      d.m ??= v.m
      d.n ??= v.n
    }
  }
  for (const v of valori) if (v.tip === 'vector') d.n ??= v.n
  return d
}

function toateCelulele(nume: string, t: Tablou, rol: Rol): Celula[] {
  if (t.tip === 'vector') return t.d.map((_, k) => ({ nume, i: k + 1, rol }))
  return t.d.map((_, k) => ({ nume, i: Math.floor(k / t.n) + 1, j: (k % t.n) + 1, rol }))
}

export function urma(program: Program, intrari: Intrari, optiuni: Optiuni = {}): Rezultat {
  const it = new Interpretor(program, intrari, optiuni.culori ?? false, optiuni.instantanee ?? 'cadre')
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
    pasi.push(it.pas('final', e.linie, [], { mesaj: eroare, final: 'eroare' }))
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
  private scrieri: Scriere[] = []
  private noi: Record<string, { nou: Tablou; vechi?: Tablou }> = {}
  private nrPasi = 0

  constructor(
    private program: Program,
    intrari: Intrari,
    public culori: boolean,
    private instantanee: 'cadre' | 'toate',
  ) {
    for (const [nume, v] of Object.entries(intrari)) this.env.set(nume, dinIntrare(v))
    for (const [nume, v] of Object.entries(dimensiuni(intrari))) if (!this.env.has(nume)) this.env.set(nume, scalar(v))
  }

  valoare(e: Expr): Valoare | undefined {
    return this.valori.get(e)
  }

  termeni(e: Expr): string[] | undefined {
    return this.termeniSume.get(e)
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
    if (cuCadru) p.stare = this.instantaneu()
    this.scrieri = []
    this.noi = {}
    return p
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
        for (;;) {
          this.linie = s.linie
          const c = this.conditie(s.cond)
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

  // Evalueaza conditia si intoarce si pasul ei; apelantul il emite si alege ramura.
  private conditie(e: Expr): { adevarat: boolean; pas: Pas } {
    if (e.tip !== 'cmp') throw this.eroare(mesaj('conditieComparatie'))
    this.citite = []
    const v = this.ev(e)
    const adevarat = v.tip === 'scalar' && v.v !== 0
    const f = `${latex(e, this, 'simbolic')}: \\; ${latex(e, this, 'numeric')} \\;\\Rightarrow\\; \\text{${mesaj(adevarat ? 'adevarat' : 'fals')}}`
    return { adevarat, pas: this.pas('conditie', this.linie, this.citite, { formula: f }) }
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
    const v = this.ev(s.expr)
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
    if (rezultat !== numeric && rezultat !== simbolic) f += ` = ${rezultat}`
    yield this.pas('atrib', s.linie, [...this.citite, ...scrise], { formula: f })
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
    const nume = this.rezolva(e.nume)
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

  private scrie(t: Tinta, v: Valoare): Celula[] {
    if (t.tip === 'felie') throw this.eroare(mesaj('atribuireBloc'))
    if (t.tip === 'elem') {
      const c = this.celula(t)
      if (!c.tablou) {
        if (v.tip !== 'scalar') throw this.eroare(mesaj('nuEsteTablouFie', t.sursa))
        this.env.set(t.sursa, v)
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
      this.env.set(t.nume, v)
      return []
    }
    const nou: Tablou = v.tip === 'rand' ? { tip: 'vector', n: v.n, d: [...v.d] } : cloneaza(v)
    if (esteTablou(existent) && existent.tip === nou.tip && existent.d.length === nou.d.length) {
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

  // Indicii si limitele buclelor: intregi, fara flopi numarati.
  private indice(e: Expr): number {
    const inainte = this.numaraFlopi
    this.numaraFlopi = false
    const v = this.ev(e)
    this.numaraFlopi = inainte
    if (v.tip !== 'scalar') throw this.eroare(mesaj('indiceNumar'))
    if (!Number.isInteger(v.v)) throw this.eroare(mesaj('indiceIntreg', fmt(v.v)))
    return v.v
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
        return this.aritm(e.op, a, b)
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
        for (const x of a.d) s += x * x
        this.flop(2 * a.d.length)
        return scalar(Math.sqrt(s))
      }
      case 'transp': {
        const a = this.ev(e.a)
        if (a.tip === 'vector') return { tip: 'rand', n: a.n, d: [...a.d] }
        if (a.tip === 'rand') return { tip: 'vector', n: a.n, d: [...a.d] }
        if (a.tip === 'scalar') return a
        const t = matriceNoua(a.n, a.m)
        for (let i = 1; i <= a.m; i++) for (let j = 1; j <= a.n; j++) scrie(t, citeste(a, i, j), j, i)
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
        let s = 0
        const termeni: string[] = []
        for (let k = de; k <= la; k++) {
          this.locali.push(new Map([[e.var, k]]))
          const t = this.scalarDin(this.ev(e.corp), mesaj('termenulSumei'))
          termeni.push(latex(e.corp, this, 'numeric'))
          this.locali.pop()
          s += t
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
        const termeni: string[] = []
        for (let k = de; k <= la; k++) {
          this.locali.push(new Map([[e.var, k]]))
          const t = this.scalarDin(this.ev(e.corp), e.fel)
          this.locali.pop()
          termeni.push(fmt(t))
          const maxim = e.fel === 'max' || e.fel === 'argmax'
          if (bun === undefined || (maxim ? t > bun : t < bun)) {
            bun = t
            unde = k
          }
        }
        this.termeniSume.set(e, termeni)
        if (bun === undefined) throw this.eroare(mesaj('intervalGol', e.fel))
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

  private felie(e: Extract<Expr, { tip: 'felie' }>): Valoare {
    const nume = this.rezolva(e.nume)
    const tab = this.env.get(nume)
    if (!esteTablou(tab)) throw this.eroare(mesaj('nuEsteTablou', e.nume))
    const interval = (x: Expr | { tip: 'interval'; de: Expr; la: Expr } | null, lungime: number): [number, number] => {
      if (x === null) return [1, lungime]
      if (x.tip === 'interval') return [this.indice(x.de), this.indice(x.la)]
      const i = this.indice(x)
      return [i, i]
    }
    const citesteVector = (celule: [number, number | undefined][]): Vector => {
      const d: number[] = []
      for (const [i, j] of celule) {
        if (i < 1 || i > (tab.tip === 'vector' ? tab.n : tab.m) || (j !== undefined && (j < 1 || j > (tab as Matrice).n)))
          throw this.eroare(mesaj('feliaIese', nume))
        d.push(citeste(tab, i, j))
        this.citite.push({ nume, i, j, rol: 'citit' })
      }
      return vectorDin(d)
    }
    if (tab.tip === 'vector') {
      if (e.idx.length !== 1) throw this.eroare(mesaj('vectorUnIndice', e.nume, nume))
      const [a, b] = interval(e.idx[0], tab.n)
      const celule: [number, number | undefined][] = []
      for (let i = a; i <= b; i++) celule.push([i, undefined])
      return citesteVector(celule)
    }
    if (e.idx.length !== 2) throw this.eroare(mesaj('matriceDoiIndici', e.nume, nume))
    const [r1, r2] = interval(e.idx[0], tab.m)
    const [c1, c2] = interval(e.idx[1], tab.n)
    if (r1 === r2 || c1 === c2) {
      const celule: [number, number | undefined][] = []
      for (let i = r1; i <= r2; i++) for (let j = c1; j <= c2; j++) celule.push([i, j])
      return citesteVector(celule)
    }
    const bloc = matriceNoua(r2 - r1 + 1, c2 - c1 + 1)
    for (let i = r1; i <= r2; i++)
      for (let j = c1; j <= c2; j++) {
        if (i < 1 || i > tab.m || j < 1 || j > tab.n) throw this.eroare(mesaj('blocIese', nume))
        scrie(bloc, citeste(tab, i, j), i - r1 + 1, j - c1 + 1)
        this.citite.push({ nume, i, j, rol: 'citit' })
      }
    return bloc
  }

  private apel(nume: string, args: Valoare[]): Valoare {
    // dimensiunile unui tablou: linii(A), coloane(A), lungime(x)
    if (nume === 'linii' || nume === 'coloane' || nume === 'lungime') {
      const a = args[0]
      if (!a || a.tip === 'scalar') throw this.eroare(mesaj('nuEsteTablou', nume))
      if (nume === 'lungime') return scalar(a.tip === 'matrice' ? a.m * a.n : a.n)
      if (a.tip === 'matrice') return scalar(nume === 'linii' ? a.m : a.n)
      return scalar(nume === 'linii' ? a.n : 1)
    }
    const nr = args.map((a) => this.scalarDin(a, nume))
    switch (nume) {
      case 'sqrt': {
        if (nr[0] < 0) throw this.eroare(mesaj('radicalNegativ', fmt(nr[0])))
        this.flop()
        return scalar(Math.sqrt(nr[0]))
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
      return scalar(r)
    }
    const scaleaza = (t: Vector | Matrice | { tip: 'rand'; n: number; d: number[] }, f: (x: number) => number) => {
      this.flop(t.d.length)
      return { ...t, d: t.d.map(f) }
    }
    if (op === '*') {
      if (a.tip === 'scalar' && b.tip !== 'scalar') return scaleaza(b, (x) => a.v * x)
      if (b.tip === 'scalar' && a.tip !== 'scalar') return scaleaza(a, (x) => x * b.v)
      if (a.tip === 'matrice' && b.tip === 'vector') {
        if (a.n !== b.n) throw this.eroare(mesaj('matvecDim', a.m, a.n, b.n))
        const y = vectorNou(a.m)
        for (let i = 1; i <= a.m; i++) {
          let s = 0
          for (let j = 1; j <= a.n; j++) s += citeste(a, i, j) * b.d[j - 1]
          y.d[i - 1] = s
        }
        this.flop(a.m * (2 * a.n - 1))
        return y
      }
      if (a.tip === 'rand' && b.tip === 'vector') {
        if (a.n !== b.n) throw this.eroare(mesaj('dotDim'))
        let s = 0
        for (let k = 0; k < a.n; k++) s += a.d[k] * b.d[k]
        this.flop(2 * a.n - 1)
        return scalar(s)
      }
      if (a.tip === 'rand' && b.tip === 'matrice') {
        if (a.n !== b.m) throw this.eroare(mesaj('vecmatDim'))
        const r: number[] = []
        for (let j = 1; j <= b.n; j++) {
          let s = 0
          for (let i = 1; i <= b.m; i++) s += a.d[i - 1] * citeste(b, i, j)
          r.push(s)
        }
        this.flop(b.n * (2 * b.m - 1))
        return { tip: 'rand', n: b.n, d: r }
      }
    }
    if (op === '/' && b.tip === 'scalar' && a.tip !== 'scalar') {
      if (b.v === 0) throw this.eroare(mesaj('impartireZero'))
      return scaleaza(a, (x) => x / b.v)
    }
    if ((op === '+' || op === '-') && a.tip !== 'scalar' && b.tip !== 'scalar' && a.tip === b.tip && a.d.length === b.d.length) {
      this.flop(a.d.length)
      return { ...a, d: a.d.map((x, k) => (op === '+' ? x + b.d[k] : x - b.d[k])) }
    }
    throw this.eroare(mesaj('opNesuportata', a.tip, op, b.tip))
  }
}
