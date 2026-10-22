// Comparatia cu alt algoritm din biblioteca pe aceleasi intrari si cu aceeasi aritmetica: cum se
// termina, cati flopi numara, cate iteratii face si ce rezultat da.
import { blocaj, type Definitie } from './intrari'
import { evaluari, type Evaluare } from './motor/analiza'
import { BIBLIOTECA, algoritm, type Algoritm } from './motor/biblioteca'
import { urma, type Intrari, type Rezultat } from './motor/interpretor'
import { parseaza } from './motor/parser'

// perechile pe care le compara cursul: pivotare sau nu (slide-urile de pivotare), Cholesky fata de
// eliminare (de doua ori mai putine operatii), QR fata de eliminare in cazul patrat (cost dublu),
// metodele iterative intre ele si fata de GPP (aplicatia de pe slide-ul cu Gauss-Seidel), metoda
// puterii fata de metoda puterii inverse (slide-ul "Exemple numerice MP/MPI")
const PERECHI: Record<string, string[]> = {
  G: ['GPP', 'LU', 'CHOL', 'QR'],
  GPP: ['G', 'LU'],
  LU: ['G', 'GPP'],
  CHOL: ['G', 'LU'],
  QR: ['G', 'GPP'],
  S_G: ['S_GPP'],
  S_GPP: ['S_G'],
  JACOBI: ['GS', 'KACZMARZ', 'S_GPP'],
  GS: ['JACOBI', 'KACZMARZ', 'S_GPP'],
  KACZMARZ: ['GS', 'JACOBI', 'S_GPP'],
  MP: ['MPI'],
  MPI: ['MP'],
  Gb: ['G', 'GPP'],
  GPPb: ['GPP', 'Gb'],
  UTRISb: ['UTRIS'],
  UTRIS: ['UTRISb'],
}

// "GPP" din "GPP, eliminare gaussiana cu pivotare partiala"
export const numeScurt = (a: Algoritm, limba: 'ro' | 'en'): string => a.titlu[limba].split(', ')[0]

// Algoritmii care pot rula pe definitiile date: fiecare intrare a lor exista, cu acelasi nume si
// tip, si are forma ceruta (patrata, cu dimensiunile potrivite). Perechile din curs vin primele.
export function compatibili(curent: string, definitii: Definitie[]): Algoritm[] {
  // un algoritm din biblioteca se compara doar cu unul care calculeaza macar un rezultat cu acelasi nume
  const al = algoritm(curent)
  const comun = (a: Algoritm) => !al || a.iesiri.some((n) => al.iesiri.includes(n))
  const potrivit = (a: Algoritm) => a.id !== curent && comun(a) && a.intrari.every((i) => definitii.some((d) => d.nume.trim() === i.nume && d.tip === i.tip)) && !blocaj(definitii, a.intrari)
  const perechi = (PERECHI[curent] ?? []).map((id) => algoritm(id)!).filter(potrivit)
  return [...perechi, ...BIBLIOTECA.filter((a) => potrivit(a) && !perechi.includes(a))]
}

// Iteratiile buclei "cat timp" exterioare: evaluarile conditiei ei, fara prima.
export function nrIteratii(rez: Rezultat): number {
  const toate = rez.pasi.filter((p) => p.iteratie)
  const prima = toate.filter((p) => p.linie === toate[0]?.linie)
  return Math.max(prima.length - 1, 0)
}

export interface Rulat {
  alg: Algoritm
  rez: Rezultat
  iteratii: number
  // evaluarile conditiei de oprire, pentru curbele suprapuse ale celor doua rulari
  puncte: Evaluare[]
}

export const rulat = (alg: Algoritm, rez: Rezultat): Rulat => ({ alg, rez, iteratii: nrIteratii(rez), puncte: evaluari(rez.pasi) })

// Ruleaza algoritmul `a` pe intrarile lui luate din `intrari`, cu aceeasi precizie.
export function ruleazaPe(a: Algoritm, intrari: Intrari, cifre: number): Rulat {
  const ale = Object.fromEntries(a.intrari.map((i) => [i.nume, intrari[i.nume]]))
  return rulat(a, urma(parseaza(a.sursa), ale, { cifre: cifre || undefined }))
}

// Pragul comun al celor doua rulari: partea dreapta a conditiei, cand este aceeasi la fiecare
// evaluare a amandurora (aceeasi toleranta); altfel curbele se arata fara prag.
export function pragComun(a: Rulat, b: Rulat): number | undefined {
  const toate = [...a.puncte, ...b.puncte]
  const prag = toate[0]?.dreapta
  return prag !== undefined && toate.every((p) => p.dreapta === prag) ? prag : undefined
}

// Tabloul rezultat comun celor doua rulari (x, y, A), daca amandoua l-au calculat cu aceeasi forma:
// cea mai mare diferenta dintre ele, pe elemente.
export function diferenta(a: Rulat, b: Rulat): { nume: string; valoare: number } | null {
  if (a.rez.final !== 'gata' || b.rez.final !== 'gata') return null
  for (const nume of a.alg.iesiri) {
    if (!b.alg.iesiri.includes(nume)) continue
    const u = a.rez.stare[nume]
    const v = b.rez.stare[nume]
    if (!u || !v || u.tip !== v.tip || u.d.length !== v.d.length) continue
    if (u.tip === 'matrice' && v.tip === 'matrice' && (u.m !== v.m || u.n !== v.n)) continue
    return { nume, valoare: Math.max(...u.d.map((x, i) => Math.abs(x - v.d[i]))) }
  }
  return null
}
