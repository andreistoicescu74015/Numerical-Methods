// Emite cod Python din arborele sintactic: aceeasi traducere literala ca in python/mn/algoritmi.py,
// cu indici de la 1 pe tablouri captusite (vezi python/mn/runtime.py). Tipurile numelor
// (matrice, vector, scalar) se deduc static, ca sa stim cand `A y` e matvec si `z^T y` produs scalar.
import type { Expr, Instr, Program, Tinta } from './ast'

export type TipNume = 'matrice' | 'vector' | 'rand' | 'scalar'

export interface OptiuniPython {
  nume: string
  intrari: { nume: string; tip: 'matrice' | 'vector' | 'scalar' }[]
}

const IDENT = /^[\p{L}_][\p{L}\p{N}_]*$/u
// cuvintele Python si numele din mn/runtime.py pe care un nume din pseudocod nu le poate lua
const CUVINTE_PYTHON = new Set([
  'and', 'as', 'def', 'del', 'for', 'from', 'if', 'import', 'in', 'is', 'lambda', 'not', 'or', 'pass', 'while', 'with',
  'sum', 'min', 'max', 'abs', 'int', 'math', 'pad', 'interval', 'zeros', 'norma', 'sgn', 'argmax', 'argmin', 'matvec', 'dot', 'vecmat',
])

class Emitator {
  tipuri = new Map<string, TipNume>()
  alias = new Map<string, string>()
  linii: string[] = []

  constructor(private opt: OptiuniPython) {
    for (const i of opt.intrari) this.tipuri.set(i.nume, i.tip)
  }

  private nume(n: string): string {
    const s = IDENT.test(n) ? n : n.replace(/[^\p{L}\p{N}_]/gu, '_')
    return CUVINTE_PYTHON.has(s) ? `${s}_` : s
  }

  private rezolva(nume: string): string {
    const a = this.alias.get(nume)
    if (a) return a
    if (this.tipuri.has(nume)) return nume
    const mare = nume.toUpperCase()
    if (this.tipuri.has(mare)) return mare
    return nume
  }

  tip(e: Expr): TipNume {
    switch (e.tip) {
      case 'var':
        return this.tipuri.get(this.rezolva(e.nume)) ?? 'scalar'
      case 'felie':
        return e.idx.filter((x) => x === null || x.tip === 'interval').length >= 2 ? 'matrice' : 'vector'
      case 'bin': {
        const a = this.tip(e.a)
        const b = this.tip(e.b)
        if (e.op === '^') return 'scalar'
        if (e.op === '*') {
          if (a === 'matrice' && b === 'vector') return 'vector'
          if (a === 'rand' && b === 'vector') return 'scalar'
          if (a === 'rand' && b === 'matrice') return 'rand'
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

  private prec(e: Expr): number {
    switch (e.tip) {
      case 'cmp':
        return 0
      case 'bin':
        return e.op === '+' || e.op === '-' ? 1 : e.op === '^' ? 4 : 2
      case 'neg':
        return 3
      default:
        return 5
    }
  }

  private copil(c: Expr, p: number, dreapta = false, op?: string): string {
    const s = this.expr(c)
    const pc = this.prec(c)
    const paranteze = pc < p || (dreapta && pc === p && (op === '-' || op === '/')) || (op === '^' && !dreapta && pc < 5)
    return paranteze ? `(${s})` : s
  }

  private indice(e: Expr): string {
    const s = this.expr(e)
    return contineElem(e) ? `int(${s})` : s
  }

  private elem(e: Extract<Expr, { tip: 'elem' }>): string {
    const baza = this.rezolva(e.nume)
    const tip = this.tipuri.get(baza)
    if (tip === 'matrice' || tip === 'vector') return `${this.nume(baza)}[${e.idx.map((x) => this.indice(x)).join(', ')}]`
    return this.nume(e.sursa)
  }

  expr(e: Expr): string {
    switch (e.tip) {
      case 'num':
        return String(e.v)
      case 'var':
        return this.nume(this.rezolva(e.nume))
      case 'elem':
        return this.elem(e)
      case 'felie': {
        const parti = e.idx.map((x) => {
          if (x === null) return '1:'
          if (x.tip === 'interval') return `${this.indice(x.de)}:${this.indice(x.la)} + 1`
          return this.indice(x)
        })
        return `${this.nume(this.rezolva(e.nume))}[${parti.join(', ')}]`
      }
      case 'bin': {
        const p = this.prec(e)
        if (e.op === '^') return `${this.copil(e.a, p, false, '^')} ** ${this.copil(e.b, p, true, '^')}`
        if (e.op === '*') {
          const ta = this.tip(e.a)
          const tb = this.tip(e.b)
          if (ta === 'matrice' && tb === 'vector') return `matvec(${this.expr(e.a)}, ${this.expr(e.b)})`
          if (ta === 'rand' && tb === 'vector') return `dot(${this.expr(e.a)}, ${this.expr(e.b)})`
          if (ta === 'rand' && tb === 'matrice') return `vecmat(${this.expr(e.a)}, ${this.expr(e.b)})`
        }
        return `${this.copil(e.a, p, false, e.op)} ${e.op} ${this.copil(e.b, p, true, e.op)}`
      }
      case 'neg':
        return `-${this.copil(e.a, 3)}`
      case 'abs':
        return `abs(${this.expr(e.a)})`
      case 'norma':
        return `norma(${this.expr(e.a)})`
      case 'transp':
        return this.tip(e.a) === 'matrice' ? `transpusa(${this.expr(e.a)})` : this.expr(e.a)
      case 'apel': {
        const args = e.args.map((a) => this.expr(a)).join(', ')
        if (e.nume === 'sqrt') return `math.sqrt(${args})`
        return `${e.nume}(${args})`
      }
      case 'suma':
        return `sum(${this.expr(e.corp)} for ${this.nume(e.var)} in interval(${this.expr(e.de)}, ${this.expr(e.la)}))`
      case 'extrem': {
        const v = this.nume(e.var)
        if (e.fel === 'argmax' || e.fel === 'argmin') return `${e.fel}(interval(${this.expr(e.de)}, ${this.expr(e.la)}), lambda ${v}: ${this.expr(e.corp)})`
        return `${e.fel}(${this.expr(e.corp)} for ${v} in interval(${this.expr(e.de)}, ${this.expr(e.la)}))`
      }
      case 'cmp': {
        const OP: Record<string, string> = { '<': '<', '>': '>', '≤': '<=', '≥': '>=', '=': '==', '≠': '!=' }
        return `${this.expr(e.a)} ${OP[e.op]} ${this.expr(e.b)}`
      }
    }
  }

  private tinta(t: Tinta): string {
    if (t.tip === 'elem') return this.elem(t)
    if (t.tip === 'var') return this.nume(this.rezolva(t.nume))
    throw new Error('atribuirea pe un bloc nu este suportată')
  }

  private linie(nivel: number, text: string): void {
    this.linii.push(`${'    '.repeat(nivel)}${text}`)
  }

  bloc(instr: Instr[], nivel: number): void {
    if (instr.length === 0) this.linie(nivel, 'pass')
    for (const s of instr) this.instr(s, nivel)
  }

  private instr(s: Instr, nivel: number): void {
    switch (s.tip) {
      case 'peste':
        for (const n of s.nume) {
          this.alias.set(n, s.tinta)
          this.alias.set(n.toLowerCase(), s.tinta)
          this.alias.set(n.toUpperCase(), s.tinta)
        }
        this.linie(nivel, `# ${s.nume.join(', ')} peste ${s.tinta}`)
        return
      case 'fie':
        for (const d of s.decl) {
          this.tipuri.set(d.nume, d.dims.length === 1 ? 'vector' : 'matrice')
          this.linie(nivel, `${this.nume(d.nume)} = zeros(${d.dims.map((x) => this.expr(x)).join(', ')})`)
        }
        return
      case 'atrib': {
        if (s.bucla) {
          this.linie(nivel, `for ${this.nume(s.bucla.var)} in interval(${this.expr(s.bucla.de)}, ${this.expr(s.bucla.la)}):`)
          this.atrib(s, nivel + 1)
        } else this.atrib(s, nivel)
        return
      }
      case 'schimb': {
        const a = this.tinta(s.a)
        const b = this.tinta(s.b)
        this.linie(nivel, `${a}, ${b} = ${b}, ${a}`)
        return
      }
      case 'pentru': {
        const pas = s.pas ? `, ${this.expr(s.pas)}` : ''
        this.linie(nivel, `for ${this.nume(s.var)} in interval(${this.expr(s.de)}, ${this.expr(s.la)}${pas}):`)
        this.bloc(s.corp, nivel + 1)
        return
      }
      case 'daca':
        this.linie(nivel, `if ${this.expr(s.cond)}:`)
        this.bloc(s.atunci, nivel + 1)
        if (s.altfel) {
          this.linie(nivel, 'else:')
          this.bloc(s.altfel, nivel + 1)
        }
        return
      case 'cattimp':
        this.linie(nivel, `while ${this.expr(s.cond)}:`)
        this.bloc(s.corp, nivel + 1)
        return
      case 'stop':
        this.linie(nivel, `raise Oprire(${JSON.stringify(s.mesaj ?? 'stop')})`)
        return
      case 'tipareste':
        this.linie(nivel, `print(${JSON.stringify(s.mesaj)})`)
        return
    }
  }

  private atrib(s: Extract<Instr, { tip: 'atrib' }>, nivel: number): void {
    const tipExpr = this.tip(s.expr)
    let valoare = this.expr(s.expr)
    if (s.tinta.tip === 'var') {
      const nume = this.rezolva(s.tinta.nume)
      const tipTinta = this.tipuri.get(nume)
      if (tipExpr === 'scalar' && (tipTinta === 'matrice' || tipTinta === 'vector')) {
        this.linie(nivel, `${this.nume(nume)}[:] = ${valoare}`)
        return
      }
      if (tipExpr !== 'scalar' && s.expr.tip === 'var') valoare += '.copy()'
      this.tipuri.set(nume, tipExpr === 'rand' ? 'vector' : tipExpr)
      this.linie(nivel, `${this.nume(nume)} = ${valoare}`)
      return
    }
    this.linie(nivel, `${this.tinta(s.tinta)} = ${valoare}`)
  }
}

function contineElem(e: Expr): boolean {
  switch (e.tip) {
    case 'elem':
      return true
    case 'bin':
    case 'cmp':
      return contineElem(e.a) || contineElem(e.b)
    case 'neg':
    case 'abs':
    case 'norma':
    case 'transp':
      return contineElem(e.a)
    case 'apel':
      return e.args.some(contineElem)
    default:
      return false
  }
}

export function emitePython(program: Program, opt: OptiuniPython): string {
  const em = new Emitator(opt)
  const nume = opt.nume.replace(/[^\p{L}\p{N}_]/gu, '_')
  const parametri = opt.intrari.map((i) => i.nume).join(', ')
  em.bloc(program.instr, 1)
  const corp = em.linii
  const prolog: string[] = [`def ${nume}(${parametri}):`]
  for (const i of opt.intrari) if (i.tip !== 'scalar') prolog.push(`    ${i.nume} = pad(${i.nume})`)
  const tablouri = opt.intrari.filter((i) => i.tip !== 'scalar').map((i) => `${i.nume}=${i.nume}`)
  if (tablouri.length > 0) {
    prolog.push(`    _d = dimensiuni(${tablouri.join(', ')})`)
    prolog.push("    m = _d.get('m')")
    prolog.push("    n = _d.get('n')")
  }
  return [
    '"""Generat din pseudocod de vizualizatorul de Metode numerice.',
    '',
    'Traducere literala, rand cu rand: indicii sunt de la 1, tablourile au linia si coloana 0',
    'nefolosite (functiile pad, r, zeros si celelalte sunt in mn/runtime.py).',
    '"""',
    '',
    'import math',
    '',
    'from mn.runtime import *  # noqa: F401,F403',
    '',
    '',
    ...prolog,
    ...corp,
    '    return rezultat(locals())',
    '',
  ].join('\n')
}
