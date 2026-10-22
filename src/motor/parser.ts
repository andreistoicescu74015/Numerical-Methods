// Parser de coborare recursiva pentru pseudocodul din curs. Blocurile sunt date de
// indentare; numerotarea pasilor din slide-uri ("1. Pentru k = ...") se ignora.
// Cuvintele cheie merg in romana (cu sau fara diacritice) si in engleza.
import { EroareSintaxa, type Expr, type Instr, type Interval, type Program, type Tinta } from './ast'
import { BIBLIOTECA } from './biblioteca'
import { lexeaza, type Tok } from './lexer'
import { mesaj } from './mesaje'

// numele algoritmilor din biblioteca: intr-o atribuire, urmate de "(", sunt apeluri
const APELABILE = new Set(BIBLIOTECA.map((a) => a.id))

const CUVINTE: Record<string, string> = {
  pentru: 'pentru',
  for: 'pentru',
  daca: 'daca',
  if: 'daca',
  atunci: 'atunci',
  then: 'atunci',
  altfel: 'altfel',
  else: 'altfel',
  cat: 'cat',
  timp: 'timp',
  while: 'cattimp',
  stop: 'stop',
  tipareste: 'tipareste',
  print: 'tipareste',
  peste: 'peste',
  over: 'peste',
  fie: 'fie',
  let: 'fie',
}
const FUNCTII = new Set(['sqrt', 'sgn', 'min', 'max', 'abs', 'norm', 'norma', 'linii', 'rows', 'coloane', 'cols', 'lungime', 'len'])
// sinonimele englezesti ale functiilor de dimensiune
const SINONIME_FUNCTII: Record<string, string> = { rows: 'linii', cols: 'coloane', len: 'lungime' }
const EXTREME = new Set(['argmax', 'argmin', 'max', 'min'])
const COMPARATII = new Set(['<', '>', '≤', '≥', '=', '≠'])

// "dacă", "Dacă", "daca" si "DACA" sunt acelasi cuvant.
export function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Cuvantul cheie canonic al unui token, sau null daca e un nume obisnuit.
function cuvant(t: Tok): string | null {
  if (t.t !== 'id') return null
  return CUVINTE[norm(t.s)] ?? null
}

interface Linie {
  nr: number
  indent: number
  text: string
  toks: Tok[]
}

function pregateste(text: string): Linie[] {
  const rez: Linie[] = []
  text.split('\n').forEach((brut, k) => {
    const faraTab = brut.replace(/\t/g, '    ')
    const indent = faraTab.length - faraTab.trimStart().length
    const continut = faraTab.trim().replace(/^(\d+\.\s*)+/, '')
    if (continut === '' || continut.startsWith('%')) return
    const toks = lexeaza(continut, k + 1)
    if (toks.length <= 1) return
    rez.push({ nr: k + 1, indent, text: continut, toks })
  })
  return rez
}

export function parseaza(text: string): Program {
  const p = new Parser(pregateste(text))
  const instr = p.bloc(-1)
  return { instr }
}

class Parser {
  i = 0

  constructor(private linii: Linie[]) {}

  bloc(indentParinte: number): Instr[] {
    const rez: Instr[] = []
    if (this.i >= this.linii.length) return rez
    const indent = this.linii[this.i].indent
    if (indent <= indentParinte) return rez
    while (this.i < this.linii.length) {
      const l = this.linii[this.i]
      if (l.indent < indent) break
      if (l.indent > indent) throw new EroareSintaxa(l.nr, mesaj('indentareNeasteptata'))
      rez.push(...this.instructiune(l))
    }
    return rez
  }

  private instructiune(l: Linie): Instr[] {
    const c = new Cursor(l)
    const cuv = cuvant(c.peek())
    if (cuv === 'pentru') return [this.pentru(c, l)]
    if (cuv === 'daca') return [this.daca(c, l)]
    if (cuv === 'cat' || cuv === 'cattimp') return [this.catTimp(c, l, cuv === 'cat')]
    if (cuv === 'altfel') throw new EroareSintaxa(l.nr, mesaj('altfelFaraDaca'))
    if (cuv === 'fie') {
      this.i++
      return [this.fie(c, l)]
    }
    if (l.toks.some((x) => cuvant(x) === 'peste')) {
      this.i++
      return [this.peste(c, l)]
    }
    this.i++
    return this.simple(c, l.nr)
  }

  private simple(c: Cursor, nr: number): Instr[] {
    const rez: Instr[] = []
    for (;;) {
      rez.push(this.simpla(c, nr))
      if (c.esteOp(';')) {
        c.ia()
        continue
      }
      if (!c.gata()) throw c.eroare(mesaj('textNeasteptat'))
      return rez
    }
  }

  private simpla(c: Cursor, nr: number): Instr {
    const cuv = cuvant(c.peek())
    if (cuv === 'stop') {
      c.ia()
      const m = c.peek().t === 'str' ? c.ia().s : undefined
      return { tip: 'stop', linie: nr, mesaj: m }
    }
    if (cuv === 'tipareste') {
      c.ia()
      if (c.peek().t !== 'str') throw c.eroare(mesaj('seAsteptaText'))
      return { tip: 'tipareste', linie: nr, mesaj: c.ia().s }
    }
    // [U, p] ← GPP(A): tintele primesc iesirile algoritmului apelat, in ordinea lor
    if (c.esteOp('[')) {
      c.ia()
      const tinte = [c.id()]
      while (c.esteOp(',')) {
        c.ia()
        tinte.push(c.id())
      }
      c.asteapta(']')
      if (!c.esteOp('←') && !c.esteOp('=')) throw c.eroare(mesaj('seAsteptaAtribuire'))
      c.ia()
      const ap = c.apelabil()
      if (!ap) throw c.eroare(mesaj('apelAsteptat'))
      return this.apel(c, nr, tinte, ap)
    }
    const tinta = c.tinta()
    if (c.esteOp('↔')) {
      c.ia()
      return { tip: 'schimb', linie: nr, a: tinta, b: c.tinta() }
    }
    if (!c.esteOp('←') && !c.esteOp('=')) throw c.eroare(mesaj('seAsteptaAtribuire'))
    c.ia()
    const ap = c.apelabil()
    if (ap) {
      if (tinta.tip !== 'var') throw c.eroare(mesaj('apelTinta'))
      return this.apel(c, nr, [tinta.nume], ap)
    }
    let expr = c.add()
    let eticheta: Tinta | undefined
    if (c.esteOp('=')) {
      if (expr.tip !== 'elem' && expr.tip !== 'var') throw c.eroare(mesaj('etichetaNume'))
      eticheta = expr
      c.ia()
      expr = c.add()
    }
    let bucla: { var: string; de: Expr; la: Expr } | undefined
    if (c.esteOp(',')) {
      c.ia()
      const v = c.id()
      c.asteapta('=')
      const de = c.add()
      c.asteapta(':')
      bucla = { var: v, de, la: c.add() }
    }
    return { tip: 'atrib', linie: nr, tinta, eticheta, expr, bucla }
  }

  // x ← UTRIS(U, d) sau [U, p] ← GPP(A): apelul unui algoritm din biblioteca, cu argumentele
  // ca expresii
  private apel(c: Cursor, nr: number, tinte: string[], ap: { nume: string; toks: number }): Instr {
    for (let k = 0; k < ap.toks; k++) c.ia()
    c.asteapta('(')
    const args: Expr[] = []
    if (!c.esteOp(')')) {
      args.push(c.add())
      while (c.esteOp(',')) {
        c.ia()
        args.push(c.add())
      }
    }
    c.asteapta(')')
    return { tip: 'apel', linie: nr, tinte, nume: ap.nume, args }
  }

  private pentru(c: Cursor, l: Linie): Instr {
    c.ia()
    const v = c.id()
    c.asteapta('=')
    const e1 = c.add()
    c.asteapta(':')
    const e2 = c.add()
    let pas: Expr | undefined
    let la = e2
    if (c.esteOp(':')) {
      c.ia()
      pas = e2
      la = c.add()
    }
    if (!c.gata()) throw c.eroare(mesaj('textDupaBucla'))
    this.i++
    const corp = this.bloc(l.indent)
    if (corp.length === 0) throw new EroareSintaxa(l.nr, mesaj('corpLipsaPentru'))
    return { tip: 'pentru', linie: l.nr, var: v, de: e1, pas, la, corp }
  }

  private daca(c: Cursor, l: Linie): Instr {
    c.ia()
    const cond = c.cond()
    if (!c.esteCuvant('atunci')) throw c.eroare(mesaj('seAsteptaAtunci'))
    c.ia()
    this.i++
    const atunci = c.gata() ? this.bloc(l.indent) : this.simple(c, l.nr)
    if (atunci.length === 0) throw new EroareSintaxa(l.nr, mesaj('lipsaDupaAtunci'))
    let altfel: Instr[] | undefined
    const u = this.linii[this.i]
    if (u && u.indent === l.indent && cuvant(u.toks[0]) === 'altfel') {
      const c2 = new Cursor(u)
      c2.ia()
      this.i++
      altfel = c2.gata() ? this.bloc(l.indent) : this.simple(c2, u.nr)
      if (altfel.length === 0) throw new EroareSintaxa(u.nr, mesaj('lipsaDupaAltfel'))
    }
    return { tip: 'daca', linie: l.nr, cond, atunci, altfel }
  }

  private catTimp(c: Cursor, l: Linie, douaCuvinte: boolean): Instr {
    c.ia()
    if (douaCuvinte) {
      if (!c.esteCuvant('timp')) throw c.eroare(mesaj('seAsteptaTimp'))
      c.ia()
    }
    const cond = c.cond()
    if (!c.gata()) throw c.eroare(mesaj('textDupaConditie'))
    this.i++
    const corp = this.bloc(l.indent)
    if (corp.length === 0) throw new EroareSintaxa(l.nr, mesaj('corpLipsaCatTimp'))
    return { tip: 'cattimp', linie: l.nr, cond, corp }
  }

  private fie(c: Cursor, l: Linie): Instr {
    c.ia()
    const decl: { nume: string; dims: Expr[] }[] = []
    for (;;) {
      const nume = c.id()
      c.asteapta('[')
      const dims = [c.add()]
      while (c.esteOp(',')) {
        c.ia()
        dims.push(c.add())
      }
      c.asteapta(']')
      decl.push({ nume, dims })
      if (!c.esteOp(',')) break
      c.ia()
    }
    if (!c.gata()) throw c.eroare(mesaj('textNeasteptat'))
    return { tip: 'fie', linie: l.nr, decl }
  }

  private peste(c: Cursor, l: Linie): Instr {
    const nume = [c.id()]
    while (c.esteOp(',')) {
      c.ia()
      nume.push(c.id())
    }
    if (!c.esteCuvant('peste')) throw c.eroare(mesaj('seAsteptaPeste'))
    c.ia()
    const tinta = c.id()
    if (!c.gata()) throw c.eroare(mesaj('textNeasteptat'))
    return { tip: 'peste', linie: l.nr, nume, tinta }
  }
}

class Cursor {
  private pos = 0
  // barele deschise (| sau ‖): in pozitie de operator, o bara egala cu varful inchide
  private bare: string[] = []
  private toks: Tok[]
  private linie: number
  private text: string

  constructor(l: Linie) {
    this.toks = l.toks
    this.linie = l.nr
    this.text = l.text
  }

  peek(k = 0): Tok {
    return this.toks[Math.min(this.pos + k, this.toks.length - 1)]
  }

  ia(): Tok {
    const t = this.toks[this.pos]
    if (t.t !== 'sfarsit') this.pos++
    return t
  }

  gata(): boolean {
    return this.peek().t === 'sfarsit'
  }

  esteOp(s: string, k = 0): boolean {
    const t = this.peek(k)
    return t.t === 'op' && t.s === s
  }

  esteCuvant(s: string): boolean {
    return cuvant(this.peek()) === s
  }

  // Numele unui algoritm din biblioteca urmat de "(", cu numarul de token-uri pe care le ocupa:
  // S_GPP se lexeaza ca S, _, GPP.
  apelabil(): { nume: string; toks: number } | null {
    const a = this.peek()
    if (a.t !== 'id') return null
    if (APELABILE.has(a.s) && this.esteOp('(', 1)) return { nume: a.s, toks: 1 }
    const b = this.peek(2)
    if (this.esteOp('_', 1) && b.t === 'id' && APELABILE.has(`${a.s}_${b.s}`) && this.esteOp('(', 3)) return { nume: `${a.s}_${b.s}`, toks: 3 }
    return null
  }

  asteapta(s: string): Tok {
    if (!this.esteOp(s)) throw this.eroare(mesaj('seAstepta', s))
    return this.ia()
  }

  eroare(text: string): EroareSintaxa {
    return new EroareSintaxa(this.linie, mesaj('laColoana', text, this.peek().col + 1))
  }

  private esteNume(t: Tok): boolean {
    return t.t === 'id' && cuvant(t) === null
  }

  id(): string {
    if (!this.esteNume(this.peek())) throw this.eroare(mesaj('seAsteptaNume'))
    return this.ia().s
  }

  tinta(): Tinta {
    if (!this.esteNume(this.peek())) throw this.eroare(mesaj('seAsteptaTinta'))
    const e = this.nume()
    if (e.tip === 'var' || e.tip === 'elem' || e.tip === 'felie') return e
    throw this.eroare(mesaj('tintaInvalida'))
  }

  cond(): Expr {
    const a = this.add()
    const t = this.peek()
    if (t.t === 'op' && COMPARATII.has(t.s)) {
      this.ia()
      return { tip: 'cmp', op: t.s as '<' | '>' | '≤' | '≥' | '=' | '≠', a, b: this.add() }
    }
    return a
  }

  add(): Expr {
    let a = this.mul()
    while (this.esteOp('+') || this.esteOp('-')) {
      const op = this.ia().s as '+' | '-'
      a = { tip: 'bin', op, a, b: this.mul() }
    }
    return a
  }

  private mul(): Expr {
    let a = this.unar()
    for (;;) {
      if (this.esteOp('*') || this.esteOp('/')) {
        const op = this.ia().s as '*' | '/'
        a = { tip: 'bin', op, a, b: this.unar() }
        continue
      }
      if (this.incepeOperand()) {
        a = { tip: 'bin', op: '*', a, b: this.unar(), juxta: true }
        continue
      }
      return a
    }
  }

  private incepeOperand(): boolean {
    const t = this.peek()
    if (t.t === 'num') return true
    if (t.t === 'id') return this.esteNume(t)
    if (t.t !== 'op') return false
    if (t.s === '(' || t.s === '√' || t.s === 'Σ') return true
    if (t.s === '|' || t.s === '‖') return this.bare[this.bare.length - 1] !== t.s
    return false
  }

  private unar(): Expr {
    if (this.esteOp('-')) {
      this.ia()
      return { tip: 'neg', a: this.unar() }
    }
    if (this.esteOp('+')) {
      this.ia()
      return this.unar()
    }
    if (this.esteOp('√')) {
      this.ia()
      return { tip: 'apel', nume: 'sqrt', args: [this.unar()] }
    }
    if (this.esteOp('Σ')) return this.suma()
    const t = this.peek()
    if (t.t === 'id' && EXTREME.has(norm(t.s)) && this.esteOp('_', 1)) return this.extrem()
    return this.putere()
  }

  private putere(): Expr {
    const a = this.postfix()
    if (!this.esteOp('^')) return a
    this.ia()
    let b: Expr
    if (this.esteOp('{')) {
      this.ia()
      b = this.add()
      this.asteapta('}')
    } else b = this.unar()
    return { tip: 'bin', op: '^', a, b }
  }

  private postfix(): Expr {
    let a = this.primar()
    while (this.esteOp('^T')) {
      this.ia()
      a = { tip: 'transp', a }
    }
    return a
  }

  private primar(): Expr {
    const t = this.peek()
    if (t.t === 'num') {
      this.ia()
      return { tip: 'num', v: t.v! }
    }
    if (t.t === 'op' && t.s === '(') {
      this.ia()
      const e = this.cond()
      this.asteapta(')')
      return e
    }
    if (t.t === 'op' && (t.s === '|' || t.s === '‖')) {
      this.ia()
      this.bare.push(t.s)
      const e = this.add()
      this.bare.pop()
      this.asteapta(t.s)
      if (t.s === '|') return { tip: 'abs', a: e }
      // ‖A‖_F: norma Frobenius, scrisa ca in curs
      if (this.esteOp('_') && this.peek(1).t === 'id' && this.peek(1).s === 'F') {
        this.ia()
        this.ia()
        return { tip: 'norma', a: e, F: true }
      }
      return { tip: 'norma', a: e }
    }
    if (this.esteNume(t)) return this.nume()
    throw this.eroare(mesaj('seAsteptaExpresie'))
  }

  private nume(): Expr {
    const t = this.ia()
    const nume = t.s
    if (this.esteOp('_')) return this.subscript(nume, t)
    if (!this.esteOp('(')) return { tip: 'var', nume }
    if (FUNCTII.has(norm(nume))) {
      this.ia()
      const args: Expr[] = []
      if (!this.esteOp(')')) {
        args.push(this.add())
        while (this.esteOp(',')) {
          this.ia()
          args.push(this.add())
        }
      }
      this.asteapta(')')
      const f = norm(nume)
      if (f === 'norm' || f === 'norma') {
        if (args.length !== 1) throw this.eroare(mesaj('normaUnArgument'))
        return { tip: 'norma', a: args[0] }
      }
      return { tip: 'apel', nume: SINONIME_FUNCTII[f] ?? f, args }
    }
    this.ia()
    const idx: (Expr | Interval | null)[] = []
    for (;;) {
      if (this.esteOp(':')) {
        this.ia()
        idx.push(null)
      } else {
        const e = this.add()
        if (this.esteOp(':')) {
          this.ia()
          idx.push({ tip: 'interval', de: e, la: this.add() })
        } else idx.push(e)
      }
      if (!this.esteOp(',')) break
      this.ia()
    }
    const sf = this.asteapta(')').sfarsit
    if (idx.every((x) => x !== null && x.tip !== 'interval')) {
      return { tip: 'elem', nume, idx: idx as Expr[], sursa: this.text.slice(t.col, sf) }
    }
    return { tip: 'felie', nume, idx }
  }

  private subscript(nume: string, t: Tok): Expr {
    const sub = this.ia()
    if (this.esteOp('{')) {
      this.ia()
      const idx = [this.add()]
      while (this.esteOp(',')) {
        this.ia()
        idx.push(this.add())
      }
      const sf = this.asteapta('}').sfarsit
      return { tip: 'elem', nume, idx, sursa: this.text.slice(t.col, sf) }
    }
    // forma scurta a_ij: fiecare caracter lipit de „_” e un indice
    let text = ''
    let sf = sub.sfarsit
    while ((this.peek().t === 'id' || this.peek().t === 'num') && this.peek().col === sf) {
      const x = this.ia()
      text += x.s
      sf = x.sfarsit
    }
    if (!text) throw this.eroare(mesaj('indiceLipsa'))
    const idx: Expr[] = [...text].map((ch) => (/\d/.test(ch) ? { tip: 'num', v: Number(ch) } : { tip: 'var', nume: ch }))
    return { tip: 'elem', nume, idx, sursa: this.text.slice(t.col, sf) }
  }

  private suma(): Expr {
    this.ia()
    this.asteapta('_')
    this.asteapta('{')
    const v = this.id()
    this.asteapta('=')
    const de = this.add()
    this.asteapta('}')
    this.asteapta('^')
    this.asteapta('{')
    const la = this.add()
    this.asteapta('}')
    return { tip: 'suma', var: v, de, la, corp: this.mul() }
  }

  private extrem(): Expr {
    const fel = norm(this.ia().s) as 'argmax' | 'argmin' | 'max' | 'min'
    this.asteapta('_')
    this.asteapta('{')
    const v = this.id()
    this.asteapta('=')
    const de = this.add()
    this.asteapta(':')
    const la = this.add()
    this.asteapta('}')
    return { tip: 'extrem', fel, var: v, de, la, corp: this.mul() }
  }
}
