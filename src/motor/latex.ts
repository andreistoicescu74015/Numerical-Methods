// Randarea expresiilor ca siruri KaTeX, in doua moduri: simbolic (indicii inlocuiti cu
// valorile lor, numele pastrate) si numeric (fiecare frunza inlocuita cu valoarea ei).
import type { Expr } from './ast'
import type { Valoare } from './valori'

const GRECESTI: Record<string, string> = {
  α: '\\alpha',
  β: '\\beta',
  γ: '\\gamma',
  δ: '\\delta',
  ε: '\\varepsilon',
  θ: '\\theta',
  λ: '\\lambda',
  μ: '\\mu',
  ρ: '\\rho',
  σ: '\\sigma',
  τ: '\\tau',
  ω: '\\omega',
}

export type Mod = 'simbolic' | 'numeric'

export interface InfoLatex {
  valoare(e: Expr): Valoare | undefined
  termeni(e: Expr): string[] | undefined
  simbolice: Set<string>
  // cu culori, elementele citite apar albastre si pivotul rosu, ca in grila
  culori: boolean
}

// Clasele CSS ale rolurilor; culoarea lor vine din tema (luminoasa sau intunecata).
export const ROL = { scris: 'rol-scris', pivot: 'rol-pivot', citit: 'rol-citit' }

// \htmlClass cere optiunea `trust` la randare; sirurile vin doar din interpretor.
export const colorat = (s: string, clasa: string): string => `\\htmlClass{${clasa}}{${s}}`

export function numeLatex(nume: string): string {
  if (GRECESTI[nume]) return GRECESTI[nume]
  if (nume.length === 1) return nume
  return `\\mathit{${nume}}`
}

export function fmt(x: number): string {
  if (Number.isNaN(x)) return '\\mathrm{NaN}'
  if (!Number.isFinite(x)) return x > 0 ? '\\infty' : '-\\infty'
  if (Number.isInteger(x)) return String(x)
  const s = String(Number(x.toPrecision(4)))
  const m = /^(-?[\d.]+)e([+-]\d+)$/.exec(s)
  if (m) return `${m[1]} \\cdot 10^{${Number(m[2])}}`
  return s
}

export function valoareLatex(v: Valoare | undefined, nume = '?'): string {
  if (!v) return numeLatex(nume)
  if (v.tip === 'scalar') return fmt(v.v)
  if (v.tip === 'matrice') return numeLatex(nume)
  return `(${v.d.map(fmt).join(',\\, ')})`
}

function prec(e: Expr): number {
  switch (e.tip) {
    case 'cmp':
      return 0
    case 'bin':
      return e.op === '+' || e.op === '-' ? 1 : e.op === '^' ? 4 : 2
    case 'suma':
    case 'extrem':
      return 1.5
    case 'neg':
      return 3
    default:
      return 5
  }
}

function contine(e: Expr, nume: Set<string>): boolean {
  switch (e.tip) {
    case 'num':
      return false
    case 'var':
      return nume.has(e.nume)
    case 'elem':
      return e.idx.some((x) => contine(x, nume))
    case 'felie':
      return e.idx.some((x) => x !== null && (x.tip === 'interval' ? contine(x.de, nume) || contine(x.la, nume) : contine(x, nume)))
    case 'bin':
    case 'cmp':
      return contine(e.a, nume) || contine(e.b, nume)
    case 'neg':
    case 'abs':
    case 'norma':
    case 'transp':
      return contine(e.a, nume)
    case 'apel':
      return e.args.some((x) => contine(x, nume))
    case 'suma':
    case 'extrem':
      return contine(e.de, nume) || contine(e.la, nume) || contine(e.corp, nume)
  }
}

function indice(e: Expr, info: InfoLatex): string {
  if (!contine(e, info.simbolice)) {
    const v = info.valoare(e)
    if (v && v.tip === 'scalar') return fmt(v.v)
  }
  return latex(e, info, 'simbolic')
}

function indici(idx: Expr[], info: InfoLatex): string {
  const s = idx.map((x) => indice(x, info))
  return s.every((x) => x.length === 1) ? s.join('') : s.join(',')
}

function copil(c: Expr, p: number, info: InfoLatex, mod: Mod, dreapta = false, op?: string): string {
  const s = latex(c, info, mod)
  const pc = prec(c)
  let paranteze = pc < p || (dreapta && pc === p && (op === '-' || op === '/'))
  if (op === '^' && !dreapta && pc < 5) paranteze = true
  if (!paranteze && s.startsWith('-') && (dreapta || op === '*' || op === '/' || op === '^')) paranteze = true
  return paranteze ? `\\left(${s}\\right)` : s
}

// In modul numeric, operatiile pe vectori se scriu cu operanzii lor ((1, 0) / 1), ca pasul
// intermediar sa se vada; doar frunzele devin valori.
export function latex(e: Expr, info: InfoLatex, mod: Mod): string {
  switch (e.tip) {
    case 'num':
      return fmt(e.v)
    case 'var':
      return mod === 'simbolic' || info.simbolice.has(e.nume) ? numeLatex(e.nume) : valoareLatex(info.valoare(e), e.nume)
    case 'elem': {
      if (mod === 'numeric' && !contine(e, info.simbolice)) {
        const v = info.valoare(e)
        if (v) return valoareLatex(v, e.sursa)
      }
      const s = `${numeLatex(e.nume)}_{${indici(e.idx, info)}}`
      return info.culori ? colorat(s, ROL.citit) : s
    }
    case 'felie': {
      if (mod === 'numeric') {
        const v = info.valoare(e)
        if (v) return valoareLatex(v, e.nume)
      }
      const parti = e.idx.map((x) => (x === null ? ':' : x.tip === 'interval' ? `${indice(x.de, info)}\\!:\\!${indice(x.la, info)}` : indice(x, info)))
      return `${numeLatex(e.nume)}(${parti.join(',\\,')})`
    }
    case 'bin': {
      const p = prec(e)
      const a = copil(e.a, p, info, mod, false, e.op)
      if (e.op === '^') return `${a}^{${latex(e.b, info, mod)}}`
      let b: string
      if (e.op === '/' && e.b.tip === 'elem' && info.culori && mod === 'simbolic') {
        info.culori = false
        b = colorat(copil(e.b, p, info, mod, true, e.op), ROL.pivot)
        info.culori = true
      } else b = copil(e.b, p, info, mod, true, e.op)
      if (e.op === '*') {
        const alaturat = mod === 'simbolic' && e.juxta && e.a.tip !== 'num' && e.b.tip !== 'num'
        return alaturat ? `${a}\\,${b}` : `${a} \\cdot ${b}`
      }
      return `${a} ${e.op} ${b}`
    }
    case 'neg':
      return `-${copil(e.a, 3, info, mod)}`
    case 'abs':
      return `\\left|${latex(e.a, info, mod)}\\right|`
    case 'norma':
      return `\\left\\|${latex(e.a, info, mod)}\\right\\|`
    case 'transp':
      return `${copil(e.a, 5, info, mod)}^{T}`
    case 'apel': {
      const args = e.args.map((a) => latex(a, info, mod))
      if (e.nume === 'sqrt') return `\\sqrt{${args[0]}}`
      if (e.nume === 'abs') return `\\left|${args[0]}\\right|`
      const f = e.nume === 'min' || e.nume === 'max' ? `\\${e.nume}` : `\\operatorname{${e.nume}}`
      return `${f}(${args.join(', ')})`
    }
    case 'suma': {
      if (mod === 'numeric') {
        const t = (info.termeni(e) ?? []).map((x) => (x.startsWith('-') ? `\\left(${x}\\right)` : x))
        return t.length === 0 ? '0' : t.length === 1 ? t[0] : `(${t.join(' + ')})`
      }
      info.simbolice.add(e.var)
      const corp = copil(e.corp, 2, info, 'simbolic')
      info.simbolice.delete(e.var)
      return `\\sum_{${numeLatex(e.var)}=${indice(e.de, info)}}^{${indice(e.la, info)}} ${corp}`
    }
    case 'extrem': {
      const op = `\\operatorname{${e.fel}}`
      if (mod === 'numeric') return `${op}\\{${(info.termeni(e) ?? []).join(',\\, ')}\\}`
      info.simbolice.add(e.var)
      const corp = copil(e.corp, 2, info, 'simbolic')
      info.simbolice.delete(e.var)
      return `${op}_{${numeLatex(e.var)}=${indice(e.de, info)}:${indice(e.la, info)}} ${corp}`
    }
    case 'cmp': {
      const OP: Record<string, string> = { '<': '<', '>': '>', '≤': '\\le', '≥': '\\ge', '=': '=', '≠': '\\ne' }
      return `${latex(e.a, info, mod)} ${OP[e.op]} ${latex(e.b, info, mod)}`
    }
  }
}
