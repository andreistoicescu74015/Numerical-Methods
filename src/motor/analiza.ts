// Ce variabile foloseste fiecare linie a programului, in ordinea aparitiei. Vederea arata
// valorile lor langa linia curenta, ca a_ij din cod sa se lege de celula (2, 3) din grila.
import type { Expr, Instr, Program } from './ast'
import type { FelOperatie, Iteratie, Pas } from './interpretor'
import { latexScris, numeLatex } from './latex'

function dinExpr(e: Expr, rez: string[], legate: Set<string>): void {
  const pune = (n: string) => {
    if (!legate.has(n) && !rez.includes(n)) rez.push(n)
  }
  switch (e.tip) {
    case 'num':
      return
    case 'var':
      pune(e.nume)
      return
    case 'elem':
      e.idx.forEach((x) => dinExpr(x, rez, legate))
      return
    case 'felie':
      for (const x of e.idx) {
        if (x === null) continue
        if (x.tip === 'interval') {
          dinExpr(x.de, rez, legate)
          dinExpr(x.la, rez, legate)
        } else dinExpr(x, rez, legate)
      }
      return
    case 'bin':
    case 'cmp':
      dinExpr(e.a, rez, legate)
      dinExpr(e.b, rez, legate)
      return
    case 'neg':
    case 'abs':
    case 'norma':
    case 'transp':
      dinExpr(e.a, rez, legate)
      return
    case 'apel':
      e.args.forEach((x) => dinExpr(x, rez, legate))
      return
    case 'suma':
    case 'extrem': {
      dinExpr(e.de, rez, legate)
      dinExpr(e.la, rez, legate)
      const l = new Set(legate)
      l.add(e.var)
      dinExpr(e.corp, rez, l)
      return
    }
  }
}

function dinInstr(s: Instr, rez: Map<number, string[]>): void {
  const lista = rez.get(s.linie) ?? []
  const legate = new Set<string>()
  switch (s.tip) {
    case 'atrib':
      if (s.tinta.tip !== 'var') dinExpr(s.tinta, lista, legate)
      if (s.eticheta && s.eticheta.tip !== 'var') dinExpr(s.eticheta, lista, legate)
      dinExpr(s.expr, lista, legate)
      if (s.bucla) {
        if (!lista.includes(s.bucla.var)) lista.unshift(s.bucla.var)
        dinExpr(s.bucla.de, lista, legate)
        dinExpr(s.bucla.la, lista, legate)
      }
      break
    case 'schimb':
      dinExpr(s.a, lista, legate)
      dinExpr(s.b, lista, legate)
      break
    case 'pentru':
      if (!lista.includes(s.var)) lista.push(s.var)
      dinExpr(s.de, lista, legate)
      dinExpr(s.la, lista, legate)
      if (s.pas) dinExpr(s.pas, lista, legate)
      s.corp.forEach((x) => dinInstr(x, rez))
      break
    case 'daca':
      dinExpr(s.cond, lista, legate)
      s.atunci.forEach((x) => dinInstr(x, rez))
      s.altfel?.forEach((x) => dinInstr(x, rez))
      break
    case 'cattimp':
      dinExpr(s.cond, lista, legate)
      s.corp.forEach((x) => dinInstr(x, rez))
      break
    case 'fie':
      s.decl.forEach((d) => d.dims.forEach((x) => dinExpr(x, lista, legate)))
      break
    default:
      break
  }
  if (lista.length) rez.set(s.linie, lista)
}

export function variabilePeLinie(program: Program): Map<number, string[]> {
  const rez = new Map<number, string[]>()
  program.instr.forEach((s) => dinInstr(s, rez))
  return rez
}

export interface LinieOperatii {
  linie: number
  // instructiunile liniei, asa cum sunt scrise
  tex: string
  feluri: FelOperatie[]
}

function texInstr(s: Instr, rez: Map<number, string[]>): void {
  const pune = (tex: string) => rez.set(s.linie, [...(rez.get(s.linie) ?? []), tex])
  switch (s.tip) {
    case 'atrib': {
      const bucla = s.bucla ? `,\\; ${numeLatex(s.bucla.var)} = ${latexScris(s.bucla.de)} : ${latexScris(s.bucla.la)}` : ''
      pune(`${latexScris(s.tinta)} \\leftarrow ${latexScris(s.expr)}${bucla}`)
      break
    }
    case 'pentru':
      s.corp.forEach((x) => texInstr(x, rez))
      break
    case 'daca':
      pune(latexScris(s.cond))
      s.atunci.forEach((x) => texInstr(x, rez))
      s.altfel?.forEach((x) => texInstr(x, rez))
      break
    case 'cattimp':
      pune(latexScris(s.cond))
      s.corp.forEach((x) => texInstr(x, rez))
      break
    default:
      break
  }
}

// Liniile pe care urma a intalnit operatii intre tablouri (A x, x^T y, ‖x‖...), cu felurile lor.
// Din ele se face lista "Operații pe matrice" pentru un program oarecare.
export function operatiiPeLinii(program: Program, pasi: Pas[]): LinieOperatii[] {
  const feluri = new Map<number, FelOperatie[]>()
  for (const p of pasi) {
    if (!p.operatii) continue
    const lista = feluri.get(p.linie) ?? []
    for (const o of p.operatii) if (!lista.includes(o.fel)) lista.push(o.fel)
    feluri.set(p.linie, lista)
  }
  const tex = new Map<number, string[]>()
  program.instr.forEach((s) => texInstr(s, tex))
  return [...feluri.keys()].sort((a, b) => a - b).map((linie) => ({ linie, tex: (tex.get(linie) ?? []).join(';\\quad '), feluri: feluri.get(linie)! }))
}

// O evaluare a conditiei primei bucle "cat timp": marimea testata la iteratia `iter`, pasul din
// urma la care s-a evaluat si rezultatul ei (adevarata cat timp bucla continua, falsa la
// evaluarea care o opreste).
export interface Evaluare extends Iteratie {
  pas: number
  adevarat: boolean
}

// Evaluarile conditiei primei bucle "cat timp", in ordine. O bucla interioara reia numaratoarea;
// se pastreaza prima parcurgere a primei bucle.
export function evaluari(pasi: Pas[]): Evaluare[] {
  const toate = pasi.flatMap((p, idx) => (p.iteratie ? [{ ...p.iteratie, pas: idx, adevarat: !!p.adevarat }] : []))
  const prima = toate.filter((p) => p.linie === toate[0]?.linie)
  const reluare = prima.findIndex((p, i) => i > 0 && p.iter === 0)
  return reluare < 0 ? prima : prima.slice(0, reluare)
}
