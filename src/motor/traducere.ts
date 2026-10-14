// Pseudocodul din biblioteca, in engleza: cuvintele cheie pe care parserul le accepta si in
// engleza, mesajele de oprire si comentariile. Liniile raman aceleasi, deci si trimiterile la ele.

// cuvantul intreg, nu o parte din alt nume (diacriticele nu sunt litere pentru \b)
const cuvant = (s: string) => new RegExp(`(?<![\\p{L}\\p{N}_])${s}(?![\\p{L}\\p{N}_])`, 'gu')

const CUVINTE: [RegExp, string][] = [
  [cuvant('cât timp'), 'while'],
  [cuvant('pentru'), 'for'],
  [cuvant('dacă'), 'if'],
  [cuvant('atunci'), 'then'],
  [cuvant('altfel'), 'else'],
  [cuvant('peste'), 'over'],
  [cuvant('fie'), 'let'],
  [cuvant('tipărește'), 'print'],
  [/(?<![\p{L}\p{N}_])linii\(/gu, 'rows('],
  [/(?<![\p{L}\p{N}_])coloane\(/gu, 'cols('],
  [/(?<![\p{L}\p{N}_])lungime\(/gu, 'len('],
]

// sirurile si comentariile din biblioteca
const TEXTE: Record<string, string> = {
  "'nu a convers în maxiter iterații'": "'no convergence in maxiter iterations'",
  "'nu a convers în maxiter treceri'": "'no convergence in maxiter sweeps'",
  "'A nu este pozitiv definită'": "'A is not positive definite'",
  '% în plus față de slide': '% added here, not on the slide',
  '% nu este pe slide': '% not on the slide',
  '% pe slide: "t = a_kk = 0"': '% on the slide: "t = a_kk = 0"',
  '% din slide-ul de dinainte': '% from the previous slide',
  '% bucla nu este pe slide': '% the loop is not on the slide',
}

export function inEngleza(sursa: string): string {
  return sursa
    .split('\n')
    .map((linie) => {
      const p = linie.indexOf('%')
      const cod = p >= 0 ? linie.slice(0, p) : linie
      const comentariu = p >= 0 ? linie.slice(p) : ''
      // sirurile dintre apostrofuri se traduc din lista; cuvintele cheie doar in rest
      const tradus = cod
        .split(/('[^']*')/)
        .map((b) => (b.startsWith("'") ? (TEXTE[b] ?? b) : CUVINTE.reduce((s, [re, en]) => s.replace(re, en), b)))
        .join('')
      return tradus + (TEXTE[comentariu] ?? comentariu)
    })
    .join('\n')
}
