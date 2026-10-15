// Intrarile se editeaza ca text: o linie pe rand, numerele despartite prin spatii sau virgule.
// O definitie are nume, tip si textul cu valorile; biblioteca da definitiile de pornire.
import type { Algoritm, Intrare } from './motor/biblioteca'
import type { Intrari } from './motor/interpretor'
import { mesaj } from './motor/mesaje'
import type { CheieText } from './i18n'
import { esteDominanta, esteMatrice, esteVector, genereaza, incalca, matriceIteratie, razaSpectrala, type Abatere, type Structura, type Valoare } from './natura'

export type TipIntrare = Intrare['tip']

export interface Definitie {
  nume: string
  tip: TipIntrare
  text: string
  // tipul ales din meniu pentru o matrice; lipsa: cel cerut de algoritm
  structura?: Structura
}

export class EroareIntrare extends Error {}

export function textDinValoare(v: Intrare['exemplu']): string {
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v[0])) return (v as number[][]).map((l) => l.join(' ')).join('\n')
  return (v as number[]).join(' ')
}

export function definitiiDin(alg: Algoritm): Definitie[] {
  return alg.intrari.map((i) => ({ nume: i.nume, tip: i.tip, text: textDinValoare(i.exemplu) }))
}

const EXEMPLE: Record<TipIntrare, string> = { matrice: '1 2\n3 4', vector: '1 2 3', scalar: '1' }
const NUME: Record<TipIntrare, string[]> = { matrice: ['A', 'B', 'C', 'L', 'U'], vector: ['x', 'b', 'y', 'z', 'v'], scalar: ['c', 'tol', 't', 'r'] }

// O definitie noua, cu primul nume liber pentru tipul ei.
export function definitieNoua(existente: Definitie[], tip: TipIntrare): Definitie {
  const luate = new Set(existente.map((d) => d.nume))
  const nume = NUME[tip].find((n) => !luate.has(n)) ?? `${NUME[tip][0]}${existente.length + 1}`
  return { nume, tip, text: EXEMPLE[tip] }
}

// „0,5” si „0,5 1,5” sunt zecimale cu virgula; „1,2,3” si „1, 2, 3” sunt numere despartite prin virgula.
export function virgulaZecimala(linie: string): string {
  const t = linie.trim()
  if (!/\d,\d/.test(t) || /,\s|\s,/.test(t)) return t
  if (/[\s;]/.test(t) || !/,.*,/.test(t)) return t.replace(/(\d),(\d)/g, '$1.$2')
  return t
}

function numere(linie: string, nume: string): number[] {
  const parti = virgulaZecimala(linie).split(/[\s,;]+/).filter(Boolean)
  return parti.map((p) => {
    const x = Number(p)
    // Infinity si 1e400 nu sunt numere cu care sa se poata calcula sau desena
    if (!Number.isFinite(x)) throw new EroareIntrare(mesaj('nuEsteNumar', nume, p))
    return x
  })
}

export function valoareDinText(tip: TipIntrare, nume: string, text: string): number | number[] | number[][] {
  const linii = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '')
  if (tip === 'scalar') {
    const v = numere(linii.join(' '), nume)
    if (v.length !== 1) throw new EroareIntrare(mesaj('unSingurNumar', nume))
    return v[0]
  }
  if (tip === 'vector') {
    const v = linii.flatMap((l) => numere(l, nume))
    if (v.length === 0) throw new EroareIntrare(mesaj('vectorGol', nume))
    return v
  }
  const m = linii.map((l) => numere(l, nume))
  if (m.length === 0) throw new EroareIntrare(mesaj('matriceGoala', nume))
  if (m.some((l) => l.length !== m[0].length)) throw new EroareIntrare(mesaj('liniiLungimi', nume))
  return m
}

// Dimensiunile textului curent, numarate ingaduitor, ca sa mearga si pe un text cu greseli;
// 3 x 3 si 3 cand e gol.
export function forma(d: Definitie): [number, number] {
  const linii = d.text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const bucati = (l: string) => virgulaZecimala(l).split(/[\s,;]+/).filter(Boolean).length
  if (d.tip === 'scalar') return [1, 1]
  if (d.tip === 'vector') return [linii.reduce((s, l) => s + bucati(l), 0) || 3, 1]
  return [linii.length || 3, (linii[0] && bucati(linii[0])) || 3]
}

function valoare(d: Definitie | undefined): Valoare | undefined {
  if (!d) return undefined
  try {
    return valoareDinText(d.tip, d.nume, d.text)
  } catch {
    return undefined
  }
}

// ce cere algoritmul de la intrarea `d`, cat timp ea are numele si tipul din biblioteca
const cerinta = (d: Definitie, cerute: Intrare[]): Intrare | undefined => cerute.find((i) => i.nume === d.nume.trim() && i.tip === d.tip)
const dupaNume = (definitii: Definitie[], nume: string | undefined): Definitie | undefined => definitii.find((x) => x.nume.trim() === nume)

// latimile benzii cerute de intrare, citite din scalarii numiti in `latimi`; lipsesc cat timp unul nu e un numar
function latimiPentru(c: Intrare | undefined, definitii: Definitie[]): [number, number] | undefined {
  if (!c?.latimi) return undefined
  const v = c.latimi.map((x) => (typeof x === 'number' ? x : valoare(dupaNume(definitii, x))))
  return typeof v[0] === 'number' && typeof v[1] === 'number' ? [v[0], v[1]] : undefined
}

// intrarea `c` depinde de intrarea numita `nume`: o foloseste ca matrice a sistemului, vector indexat sau latime de banda
const depinde = (c: Intrare, nume: string): boolean => c.cu === nume || !!c.latimi?.includes(nume) || c.dimensiune?.[0] === nume

// Valori noi pentru intrarea k, cu dimensiunile ei si cu natura ceruta de algoritm, sau cu tipul
// ales din meniu. `schimbare` da alt tip sau alte dimensiuni pentru intrarea k. Intrarile a caror
// natura sau dimensiune depinde de ea (termenul liber al unui sistem compatibil, un vector cu
// lungimea data de matrice, o matrice banda dupa o latime noua) si nu mai e respectata se
// genereaza si ele din nou.
export function aleatoare(
  definitii: Definitie[],
  k: number,
  cerute: Intrare[],
  rnd: () => number = Math.random,
  schimbare: { structura?: Structura | null; forma?: [number, number] } = {},
): Definitie[] {
  const rez = [...definitii]
  if (schimbare.structura !== undefined) {
    const { structura: _, ...fara } = rez[k]
    rez[k] = schimbare.structura === null ? fara : { ...fara, structura: schimbare.structura }
  }
  const noua = (idx: number) => {
    const d = rez[idx]
    const c = cerinta(d, cerute)
    // un vector cu dimensiunea legata de o matrice primeste lungimea ei
    const ref = valoare(dupaNume(rez, c?.dimensiune?.[0]))
    const dorita: [number, number] | null = c?.dimensiune && esteMatrice(ref) ? [c.dimensiune[1] === 'linii' ? ref.length : ref[0].length, forma(d)[1]] : null
    const ceruta = idx === k ? schimbare.forma : undefined
    const natura = d.tip === 'matrice' && d.structura ? d.structura : (c?.aleator ?? c?.natura)
    const cerere = { tip: d.tip, natura, forma: ceruta ?? dorita ?? forma(d), cu: valoare(dupaNume(rez, c?.cu)), latimi: latimiPentru(c, rez) }
    rez[idx] = { ...d, text: textDinValoare(genereaza(cerere, rnd)) }
  }
  noua(k)
  rez.forEach((d, idx) => {
    const c = cerinta(d, cerute)
    if (idx === k || !c || (!c.natura && !c.dimensiune) || !depinde(c, rez[k].nume.trim())) return
    const v = valoare(d)
    if (v === undefined || (c.natura && incalca(c.natura, v, valoare(dupaNume(rez, c.cu)), latimiPentru(c, rez))) || abatereDimensiune(rez, idx, cerute)) noua(idx)
  })
  return rez
}

// De ce valoarea scrisa a intrarii k nu are natura ceruta de algoritm; null daca o are, daca
// algoritmul nu cere nimic sau daca textul inca nu e o valoare.
export function abatere(definitii: Definitie[], k: number, cerute: Intrare[]): Abatere | null {
  const c = cerinta(definitii[k], cerute)
  const v = valoare(definitii[k])
  if (!c?.natura || v === undefined) return null
  return incalca(c.natura, v, valoare(dupaNume(definitii, c.cu)), latimiPentru(c, definitii))
}

// Nota pentru o matrice scrisa de mana care are natura ceruta, dar nu si conditia suficienta de
// convergenta din curs, cu raza spectrala a matricei de iteratie: sub 1, metoda converge (cealalta
// conditie din curs). null daca matricea are conditia sau daca nu se cere.
export function faraGarantie(definitii: Definitie[], k: number, cerute: Intrare[]): { cheie: CheieText; rho: number } | null {
  const c = cerinta(definitii[k], cerute)
  const v = valoare(definitii[k])
  if (!c?.garantie || !esteMatrice(v) || v.length !== v[0].length || esteDominanta(v)) return null
  if (c.garantie === 'dominantaSauSpd' && !incalca('spd', v)) return null
  // natura (diagonala nenula) este semnalata separat
  if (v.some((l, i) => l[i] === 0)) return null
  const rho = razaSpectrala(matriceIteratie(v, c.garantie === 'dominanta' ? 'jacobi' : 'gs'))
  return { cheie: c.garantie === 'dominanta' ? 'garantieJacobi' : 'garantieGS', rho }
}

// Dimensiunea pe care trebuie sa o aiba intrarea: lungimea unui vector, numarul de linii al unei
// matrice, dupa liniile sau coloanele altei intrari. Gresita, algoritmul ar rula pe alta problema.
export function abatereDimensiune(definitii: Definitie[], k: number, cerute: Intrare[]): Abatere | null {
  const c = cerinta(definitii[k], cerute)
  const v = valoare(definitii[k])
  const altul = valoare(dupaNume(definitii, c?.dimensiune?.[0]))
  if (!c?.dimensiune || v === undefined || typeof v === 'number' || !esteMatrice(altul)) return null
  const [nume, dim] = c.dimensiune
  const dorit = dim === 'linii' ? altul.length : altul[0].length
  const are = v.length
  if (are === dorit) return null
  if (esteVector(v)) return { cheie: dim === 'linii' ? 'naturaLungimeLinii' : 'naturaLungimeColoane', args: [dorit, nume, are] }
  return { cheie: 'naturaLiniiColoane', args: [dorit, nume, are] }
}

// Abaterile cu care un algoritm din biblioteca nu poate rula: forma gresita sau dimensiuni care nu
// se potrivesc. Prima gasita, cu numele intrarii; null daca nu e niciuna.
const FORMA: CheieText[] = ['naturaPatrata', 'naturaInalta']
export function blocaj(definitii: Definitie[], cerute: Intrare[]): { nume: string; abatere: Abatere } | null {
  for (let k = 0; k < definitii.length; k++) {
    const dim = abatereDimensiune(definitii, k, cerute)
    const nat = abatere(definitii, k, cerute)
    const a = dim ?? (nat && FORMA.includes(nat.cheie) ? nat : null)
    if (a) return { nume: definitii[k].nume.trim(), abatere: a }
  }
  return null
}

const NUME_VALID = /^[\p{L}][\p{L}\p{N}]*$/u

export function intrariDinDefinitii(definitii: Definitie[]): Intrari {
  const rez: Intrari = {}
  for (const d of definitii) {
    const nume = d.nume.trim()
    if (!NUME_VALID.test(nume)) throw new EroareIntrare(mesaj('numeInvalid', d.nume))
    if (nume in rez) throw new EroareIntrare(mesaj('numeDublat', nume))
    rez[nume] = valoareDinText(d.tip, nume, d.text)
  }
  return rez
}
