// Modul exercitiu: cat rezultatul unui pas e ascuns sub "?", studentul il poate scrie si verifica.
import type { Pas } from './motor/interpretor'

// Ce trebuie sa raspunda studentul la pasul dat: valorile scrise, in ordinea in care apar in
// grila (un tablou nou intreg, pe linii), sau rezultatul conditiei. null cand pasul nu calculeaza nimic.
export function asteptat(pas: Pas): number[] | boolean | null {
  if (pas.fel === 'conditie') return pas.adevarat ?? null
  if (pas.fel !== 'atrib') return null
  const noi = pas.noi ? Object.values(pas.noi).flatMap((x) => x.nou.d) : []
  if (noi.length > 0) return noi
  if (pas.scrieri.length > 0) return pas.scrieri.map((w) => w.nou)
  if (pas.scalarScris) return [pas.scalari[pas.scalarScris.nume]]
  return null
}

const ADEVARAT = ['adevarat', 'adevărat', 'a', 'da', 'd', 'true', 't', 'yes', 'y', '1']
const FALS = ['fals', 'f', 'nu', 'false', 'no', 'n', '0']

// Un numar scris de mana: zecimal cu punct sau virgula, sau o fractie ca 2/3 sau -1/3.
function numar(s: string): number | null {
  const t = s.replace(',', '.')
  const fractie = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(t)
  if (fractie) {
    const jos = Number(fractie[2])
    return jos === 0 ? null : Number(fractie[1]) / jos
  }
  const x = Number(t)
  return t !== '' && Number.isFinite(x) ? x : null
}

export type Verdict = 'corect' | 'gresit' | 'necitit'

// Raspunsul se socoteste corect cand fiecare numar e la cel mult 0.5% de valoarea asteptata, cat
// lasa o rotunjire la trei cifre; un zero calculat ca 1e-16 primeste si raspunsul 0.
export function verifica(raspuns: string, dorit: number[] | boolean): Verdict {
  // parantezele si acoladele unui vector scris ca lista se ignora: [-8, -1] este -8 -1
  const curat = raspuns.trim().replace(/[[\](){}]/g, ' ')
  let bucati = curat.split(/[\s;]+|,\s+/).filter(Boolean)
  // -8,-1: virgula fara spatiu poate desparti valori, cand altfel numarul lor nu iese
  if (Array.isArray(dorit) && bucati.length !== dorit.length && curat.includes(',')) {
    const altfel = curat.split(/[\s;,]+/).filter(Boolean)
    if (altfel.length === dorit.length) bucati = altfel
  }
  if (typeof dorit === 'boolean') {
    if (bucati.length !== 1) return 'necitit'
    const cuvant = bucati[0].toLowerCase()
    if (ADEVARAT.includes(cuvant)) return dorit ? 'corect' : 'gresit'
    if (FALS.includes(cuvant)) return dorit ? 'gresit' : 'corect'
    return 'necitit'
  }
  const valori = bucati.map(numar)
  if (valori.length !== dorit.length || valori.some((v) => v === null)) return 'necitit'
  return valori.every((v, k) => Math.abs(v! - dorit[k]) <= 0.005 * Math.abs(dorit[k]) + 1e-9) ? 'corect' : 'gresit'
}
