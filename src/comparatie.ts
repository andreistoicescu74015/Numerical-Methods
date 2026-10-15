// Comparatia cu alt algoritm din biblioteca pe aceleasi intrari si cu aceeasi aritmetica: cum se
// termina, cati flopi numara, cate iteratii face si ce rezultat da.
import { blocaj, type Definitie } from './intrari'
import { BIBLIOTECA, algoritm, type Algoritm } from './motor/biblioteca'
import { urma, type Intrari, type Rezultat } from './motor/interpretor'
import { parseaza } from './motor/parser'

// perechile pe care le compara cursul: pivotare sau nu (slide-urile de pivotare), Cholesky fata de
// eliminare (de doua ori mai putine operatii), QR fata de eliminare in cazul patrat (cost dublu),
// metodele iterative intre ele si fata de GPP (aplicatia de pe slide-ul cu Gauss-Seidel)
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
  Gb: ['G', 'GPP'],
  GPPb: ['GPP', 'Gb'],
  UTRISb: ['UTRIS'],
  UTRIS: ['UTRISb'],
}

// Algoritmii care pot rula pe definitiile date: fiecare intrare a lor exista, cu acelasi nume si
// tip, si are forma ceruta (patrata, cu dimensiunile potrivite). Perechile din curs vin primele.
export function compatibili(curent: string, definitii: Definitie[]): Algoritm[] {
  const potrivit = (a: Algoritm) => a.id !== curent && a.intrari.every((i) => definitii.some((d) => d.nume.trim() === i.nume && d.tip === i.tip)) && !blocaj(definitii, a.intrari)
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
}

// Ruleaza algoritmul `a` pe intrarile lui luate din `intrari`, cu aceeasi precizie.
export function ruleazaPe(a: Algoritm, intrari: Intrari, cifre: number): Rulat {
  const ale = Object.fromEntries(a.intrari.map((i) => [i.nume, intrari[i.nume]]))
  const rez = urma(parseaza(a.sursa), ale, { cifre: cifre || undefined })
  return { alg: a, rez, iteratii: nrIteratii(rez) }
}

// Vectorul rezultat comun celor doua rulari (x, y), daca amandoua l-au calculat cu aceeasi lungime:
// cea mai mare diferenta dintre ele, pe componente.
export function diferenta(a: Rulat, b: Rulat): { nume: string; valoare: number } | null {
  if (a.rez.final !== 'gata' || b.rez.final !== 'gata') return null
  for (const nume of a.alg.iesiri) {
    if (!b.alg.iesiri.includes(nume)) continue
    const u = a.rez.stare[nume]
    const v = b.rez.stare[nume]
    if (!u || !v || u.tip !== 'vector' || v.tip !== 'vector' || u.n !== v.n) continue
    return { nume, valoare: Math.max(...u.d.map((x, i) => Math.abs(x - v.d[i]))) }
  }
  return null
}
