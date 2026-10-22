// Costul unui algoritm din biblioteca in functie de n: ruleaza pe intrari aleatoare cu natura
// ceruta, pentru n de la 2 la 8, iar flopii numarati se pun langa formula de cost din curs.
import { aleatoare, intrariDinDefinitii, type Definitie } from './intrari'
import { marimiDin, type Algoritm } from './motor/biblioteca'
import { urma, type Intrari } from './motor/interpretor'
import { parseaza } from './motor/parser'
import { rndDeterminist } from './natura'

export const DIMENSIUNI = [2, 3, 4, 5, 6, 7, 8]

// metodele iterative si cele pentru valori proprii au un cost care depinde de numarul de iteratii, nu doar de n
export const areCostPeN = (a: Algoritm): boolean => a.grup !== 'iterative' && a.grup !== 'proprii'

// matricea are o linie in plus: QR si SQR lucreaza cu m > n
export const cuLiniaInPlus = (a: Algoritm): boolean => a.id === 'QR' || a.id === 'SQR'

export interface PunctCost {
  n: number
  flopi: number
  formula: number
}

// Definitiile pentru dimensiunea n: tablourile au forma ceruta, scalarii raman cei curenti (latimile
// de banda cel mult n - 1, indicele reflectorului 1), apoi "aleator" pe fiecare tablou, in ordine.
function definitiiPentru(a: Algoritm, n: number, curente: Intrari, rnd: () => number): Definitie[] {
  const m = cuLiniaInPlus(a) ? n + 1 : n
  let defs: Definitie[] = a.intrari.map((i) => {
    if (i.tip === 'scalar') {
      const v = typeof curente[i.nume] === 'number' ? (curente[i.nume] as number) : (i.exemplu as number)
      return { nume: i.nume, tip: i.tip, text: String(i.natura === 'latime' ? Math.min(v, n - 1) : i.natura === 'indice' ? 1 : v) }
    }
    // un vector legat de o matrice (b, x) isi ia lungimea din ea la "aleator"
    const text = i.tip === 'vector' ? Array(n).fill(0).join(' ') : Array.from({ length: m }, () => Array(n).fill(0).join(' ')).join('\n')
    return { nume: i.nume, tip: i.tip, text }
  })
  a.intrari.forEach((i, k) => {
    if (i.tip !== 'scalar') defs = aleatoare(defs, k, a.intrari, rnd)
  })
  return defs
}

export function costuriPeN(a: Algoritm, curente: Intrari): PunctCost[] {
  const program = parseaza(a.sursa)
  const rez: PunctCost[] = []
  for (const n of DIMENSIUNI) {
    const intrari = intrariDinDefinitii(definitiiPentru(a, n, curente, rndDeterminist(n)))
    const r = urma(program, intrari)
    if (r.final !== 'gata') continue
    rez.push({ n, flopi: r.flopi, formula: a.estimare(marimiDin(intrari)) })
  }
  return rez
}
