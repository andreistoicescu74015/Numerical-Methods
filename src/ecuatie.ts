// Ecuatia i a sistemului A x = b din scena, scrisa cu numerele curente: coeficientii liniei i si
// termenul liber b_i din starea de la pasul curent, necunoscutele cu numele lor; dedesubt,
// aceeasi ecuatie cu valorile curente ale necunoscutei, ca sa se vada daca este satisfacuta.
import type { Algoritm } from './motor/biblioteca'
import type { Pas } from './motor/interpretor'
import { fmt, numeLatex } from './motor/latex'
import type { Matrice, Vector } from './motor/valori'

export interface Ecuatie {
  // LaTeX: "2\,x_{1} + 3\,x_{2} = 7"
  tex: string
  // LaTeX, cu valorile curente ale necunoscutei: "2 \cdot 1 + 3 \cdot 2 = 8 \ne 7"; lipsa fara x
  verificare: string | null
  satisfacuta: boolean | null
}

// Linia marcata la pasul curent (de la 1): valoarea variabilei de linie a algoritmului, cand linia
// de pseudocod a pasului o foloseste; altfel nicio linie.
export function linieEcuatie(alg: Algoritm, pas: Pas | undefined, variabile: string[]): number | null {
  const e = alg.ecuatie
  if (!e || !pas || pas.linie <= 0 || !variabile.includes(e.linie)) return null
  const v = pas.scalari[e.linie]
  return Number.isInteger(v) && v >= 1 ? v : null
}

// Ecuatia i: termenii cu coeficient nenul, in ordinea coloanelor, cu semnul in fata si fara
// coeficientul 1; o linie nula se scrie "0".
export function ecuatia(A: Matrice, b: Vector, x: Vector | null, numeX: string, i: number): Ecuatie {
  const termeni: string[] = []
  const numeric: string[] = []
  let suma = 0
  for (let j = 0; j < A.n; j++) {
    const c = A.d[(i - 1) * A.n + j]
    if (c === 0) continue
    const primul = termeni.length === 0
    const semn = primul ? (c < 0 ? '-' : '') : c < 0 ? ' - ' : ' + '
    const modul = Math.abs(c)
    termeni.push(`${semn}${modul === 1 ? '' : `${fmt(modul)}\\,`}${numeLatex(numeX)}_{${j + 1}}`)
    if (x) {
      const v = x.d[j]
      suma += c * v
      numeric.push(`${semn}${fmt(modul)} \\cdot ${v < 0 ? `(${fmt(v)})` : fmt(v)}`)
    }
  }
  const bi = b.d[i - 1]
  const tex = `${termeni.length ? termeni.join('') : '0'} = ${fmt(bi)}`
  if (!x || termeni.length === 0) return { tex, verificare: null, satisfacuta: null }
  const satisfacuta = Math.abs(suma - bi) <= 1e-9 * Math.max(Math.abs(bi), Math.abs(suma), 1)
  // egala, egala pana la cele 4 cifre scrise, sau diferita
  const dreapta = satisfacuta ? `= ${fmt(bi)}` : fmt(suma) === fmt(bi) ? `\\approx ${fmt(bi)}` : `= ${fmt(suma)} \\ne ${fmt(bi)}`
  return { tex, verificare: `${numeric.join('')} ${dreapta}`, satisfacuta }
}
