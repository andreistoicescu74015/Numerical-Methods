// Costul unui algoritm din biblioteca in functie de n: ruleaza pe intrari aleatoare cu natura
// ceruta, pentru n de la 2 la 8, iar flopii numarati se pun langa formula de cost din curs.
import { aleatoare, intrariDinDefinitii, type Definitie } from './intrari'
import { algoritm, marimiDin, type Algoritm } from './motor/biblioteca'
import { urma, type Intrari } from './motor/interpretor'
import { parseaza } from './motor/parser'
import { rndDeterminist } from './natura'

export const DIMENSIUNI = [2, 3, 4, 5, 6, 7, 8]

// metodele iterative si cele pentru valori proprii au un cost care depinde de numarul de iteratii, nu doar de n
export const areCostPeN = (a: Algoritm): boolean => a.grup !== 'iterative' && a.grup !== 'proprii'

// matricea are o linie in plus: QR si SQR lucreaza cu m > n
export const cuLiniaInPlus = (a: Algoritm): boolean => a.id === 'QR' || a.id === 'SQR'

// Perechile pe care le compara cursul si cartea, ca a doua serie a graficului: varianta banda
// fata de algoritmul plin (cartea, sectiunea 2.9), Cholesky fata de eliminarea gaussiana (de
// doua ori mai putine operatii) si QR fata de eliminarea gaussiana (cost dublu pe o matrice
// patrata). Perechea ruleaza pe intrari aleatoare ale ei, de acelasi n: flopii acestor algoritmi
// depind doar de dimensiuni.
export const PERECHE_COST: Record<string, string> = { Gb: 'G', GPPb: 'GPP', UTRISb: 'UTRIS', CHOL: 'G', QR: 'G' }
export const perecheCost = (a: Algoritm): Algoritm | null => (PERECHE_COST[a.id] ? (algoritm(PERECHE_COST[a.id]) ?? null) : null)

export interface PunctCost {
  n: number
  flopi: number
  formula: number
  // flopii numarati de algoritmul pereche la acelasi n
  pereche?: number
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
  const pereche = perecheCost(a)
  const programPereche = pereche ? parseaza(pereche.sursa) : null
  const rez: PunctCost[] = []
  for (const n of DIMENSIUNI) {
    const intrari = intrariDinDefinitii(definitiiPentru(a, n, curente, rndDeterminist(n)))
    const r = urma(program, intrari)
    if (r.final !== 'gata') continue
    const p: PunctCost = { n, flopi: r.flopi, formula: a.estimare(marimiDin(intrari)) }
    if (pereche && programPereche) {
      const rp = urma(programPereche, intrariDinDefinitii(definitiiPentru(pereche, n, curente, rndDeterminist(n))))
      if (rp.final === 'gata') p.pereche = rp.flopi
    }
    rez.push(p)
  }
  return rez
}
