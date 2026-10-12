import { EroareSintaxa } from './ast'
import { mesaj } from './mesaje'

export interface Tok {
  t: 'num' | 'id' | 'str' | 'op' | 'sfarsit'
  s: string
  v?: number
  col: number
  sfarsit: number
}

// Operatorii scrisi cu mai multe caractere ASCII si echivalentul lor Unicode.
// „||” nu e norma: |1 - |x|| se termina cu doua bare; norma ASCII e norm(x).
const COMPUSI: [string, string][] = [
  ['<->', '↔'],
  ['<-', '←'],
  ['<=', '≤'],
  ['>=', '≥'],
  ['!=', '≠'],
  ['<>', '≠'],
]
const SIMPLI = '←↔=+-*/^()[]{},:;|‖<>≤≥≠_√∈'
const SINONIME: Record<string, string> = { '−': '-', '·': '*', '×': '*', '∑': 'Σ' }

export function lexeaza(text: string, linie: number): Tok[] {
  const toks: Tok[] = []
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (c === ' ' || c === '\t' || c === '\r') {
      i++
      continue
    }
    if (c === '%') break
    const start = i
    const rest = text.slice(i)

    const num = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(rest)
    if (num) {
      i += num[0].length
      toks.push({ t: 'num', s: num[0], v: Number(num[0]), col: start, sfarsit: i })
      continue
    }
    if (c === "'" || c === '"') {
      const j = text.indexOf(c, i + 1)
      if (j < 0) throw new EroareSintaxa(linie, mesaj('sirNeinchis'))
      toks.push({ t: 'str', s: text.slice(i + 1, j), col: start, sfarsit: j + 1 })
      i = j + 1
      continue
    }
    const compus = COMPUSI.find(([ascii]) => rest.startsWith(ascii))
    if (compus) {
      i += compus[0].length
      toks.push({ t: 'op', s: compus[1], col: start, sfarsit: i })
      continue
    }
    // z^T y: transpusa, daca dupa T nu urmeaza litera sau cifra
    if (rest.startsWith('^T') && !/^[\p{L}\p{N}]/u.test(rest.slice(2))) {
      i += 2
      toks.push({ t: 'op', s: '^T', col: start, sfarsit: i })
      continue
    }
    const sinonim = SINONIME[c]
    if (sinonim) {
      i++
      toks.push({ t: 'op', s: sinonim, col: start, sfarsit: i })
      continue
    }
    if (c === 'Σ') {
      i++
      toks.push({ t: 'op', s: 'Σ', col: start, sfarsit: i })
      continue
    }
    const id = /^[\p{L}][\p{L}\p{N}]*/u.exec(rest)
    if (id) {
      i += id[0].length
      toks.push({ t: 'id', s: id[0], col: start, sfarsit: i })
      continue
    }
    if (SIMPLI.includes(c)) {
      i++
      toks.push({ t: 'op', s: c, col: start, sfarsit: i })
      continue
    }
    throw new EroareSintaxa(linie, mesaj('caracterNeasteptat', c, i + 1))
  }
  toks.push({ t: 'sfarsit', s: '', col: text.length, sfarsit: text.length })
  return toks
}
