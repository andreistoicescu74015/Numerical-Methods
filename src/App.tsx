import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { CodPython } from './componente/CodPython'
import { Comparatie } from './componente/Comparatie'
import { Conditionare } from './componente/Conditionare'
import { CostPeN } from './componente/CostPeN'
import { Comenzi, type Marcaj } from './componente/Comenzi'
import { Convergenta, relatie, type Punct } from './componente/Convergenta'
import { Editor } from './componente/Editor'
import { Formula } from './componente/Formula'
import { Geometrie, areGeometrie } from './componente/Geometrie'
import { Invariant, invariantOk } from './componente/Invariant'
import { Grila, TEXT_ROL, fmtCelula } from './componente/Grila'
import { Intrari } from './componente/Intrari'
import { Notiuni } from './componente/Notiuni'
import { OperatiiAlgoritm, OperatiiPas, etapaCurenta, type Etapa } from './componente/Operatii'
import { Panou } from './componente/Panou'
import { Raspuns } from './componente/Raspuns'
import { RanduriVerificare, Verificare, randOk } from './componente/Verificare'
import { ADAPTARI, adaptare as gasesteAdaptare, type Adaptare } from './adaptari'
import { ExercitiuAdaptare } from './componente/ExercitiuAdaptare'
import { CONTRAEXEMPLE, type Contraexemplu } from './contraexemple'
import { areInvariant, invariant } from './invarianti'
import { areCostPeN } from './costuri'
import { areConditionare, matriceaSistemului, type ExempluCarte } from './conditionare'
import { asteptat } from './exercitiu'
import { nrFlopi, nrPasi, text, type CheieText } from './i18n'
import { blocaj, definitiiDin, intrariDinDefinitii, textDinValoare, type Definitie } from './intrari'
import { operatiiPeLinii, variabilePeLinie } from './motor/analiza'
import { EroareSintaxa, type Program } from './motor/ast'
import { BIBLIOTECA, GRUPURI_ALGORITMI, algoritm, marimiDin, type Algoritm } from './motor/biblioteca'
import { stareLa, urma, type Intrari as IntrariMotor, type Pas, type Rezultat } from './motor/interpretor'
import type { Limba } from './motor/mesaje'
import { parseaza } from './motor/parser'
import { inEngleza } from './motor/traducere'
import { areVerificare, verifica } from './motor/verificare'
import type { Tablou } from './motor/valori'
import { estePatrata } from './natura'
import { notiune } from './notiuni'
import { OPERATII } from './operatii'
import { PALETA } from './paleta'
import { Preferinte, usePreferinte } from './preferinte'

// Modul fara algoritm predefinit: pseudocodul si intrarile tale, pastrate in localStorage.
const PROPRIU = 'propriu'
const CHEIE_PROPRIU = 'mn.propriu'
const CHEIE_INTREBARI = 'mn.intrebari'
const CHEIE_PASTREAZA = 'mn.pastreaza'

// pseudocodul algoritmului din biblioteca, cu cuvintele cheie in limba interfetei
const sursaIn = (a: Algoritm, limba: Limba) => (limba === 'en' ? inEngleza(a.sursa) : a.sursa)
// textul este pseudocodul algoritmului, in oricare dintre limbi
const eSursa = (a: Algoritm, text: string) => text === a.sursa || text === inEngleza(a.sursa)

// ?cifre=3 porneste cu aritmetica pe 3 cifre semnificative, ?cifre=0 cu dubla precizie; se primesc
// doar preciziile din meniu, ca meniul sa arate aritmetica folosita
function cifreDinAdresa(): number | null {
  const s = new URLSearchParams(window.location.search).get('cifre')
  return s && PRECIZII.includes(Number(s)) ? Number(s) : null
}
// peste atatea celule, grilele se deseneaza fara animatii
const CELULE_ANIMATE = 150
// peste atatea celule, grilele trec in formatul compact
const CELULE_COMPACT = 36
// peste atatia pasi, cursorul pe urma pastreaza doar crestaturile mari
const PASI_CU_SCRIERI = 220
// La redare, un pas cu rezultat ascuns are doua faze: intrebarea, cat aceasta parte din intervalul
// unui pas, apoi rezultatul, cat un interval intreg.
const PARTE_INTREBARE = 0.6

interface Salvat {
  sursa: string
  definitii: Definitie[]
}

function incarcaPropriu(limba: Limba): Salvat {
  try {
    const s = localStorage.getItem(CHEIE_PROPRIU)
    if (s) {
      const v = JSON.parse(s) as Salvat
      if (typeof v.sursa === 'string' && Array.isArray(v.definitii)) return v
    }
  } catch {
    // o valoare stricata in localStorage se inlocuieste cu sablonul
  }
  return {
    sursa: text(limba, 'propriuSablon'),
    definitii: [
      { nume: 'A', tip: 'matrice', text: '4 1 0\n1 3 1\n0 1 2' },
      { nume: 'x', tip: 'vector', text: '1 2 3' },
      { nume: 'b', tip: 'vector', text: '5 9 7' },
    ],
  }
}

// Exercitiile de adaptare au id-ul "adaptare:" urmat de id-ul exercitiului.
const PREFIX_ADAPTARE = 'adaptare:'
const adaptareDin = (id: string): Adaptare | null => (id.startsWith(PREFIX_ADAPTARE) ? (gasesteAdaptare(id.slice(PREFIX_ADAPTARE.length)) ?? null) : null)
// intrarile exemplului unui exercitiu: matricea, apoi vectorii
const definitiiAdaptare = (e: Adaptare): Definitie[] =>
  Object.entries(e.exemplu).map(([nume, v]) => ({
    nume,
    tip: typeof v === 'number' ? 'scalar' : Array.isArray(v[0]) ? 'matrice' : 'vector',
    text: textDinValoare(v),
    ...(nume === e.matrice ? { structura: e.structura } : {}),
  }))

// ?algoritm=GPP sau ?algoritm=propriu deschide direct acel program; ?pas=12 sare la acel pas.
function idInitial(): string {
  const cerut = new URLSearchParams(window.location.search).get('algoritm')
  if (cerut === PROPRIU || (cerut && (algoritm(cerut) || adaptareDin(cerut)))) return cerut
  return 'G'
}

function pasInitial(): number {
  const pas = Number(new URLSearchParams(window.location.search).get('pas'))
  return Number.isInteger(pas) && pas >= 1 ? pas - 1 : 0
}

// cat dureaza un pas la redare, fata de intervalul de baza: anteturile de bucla trec repede
const RITM: Partial<Record<Pas['fel'], number>> = { antet: 0.35, gol: 0.7, conditie: 0.7, fie: 0.7, mesaj: 0.7 }
const cuScriere = (p: Pas) => p.fel === 'atrib' || p.fel === 'schimb' || p.fel === 'fie' || p.fel === 'final'

interface Eroare {
  linie: number | null
  mesaj: string
}

// preciziile din meniu, in cifre semnificative; 0 este dubla precizie
const PRECIZII = [0, 2, 3, 4, 5, 6, 8]

interface Rulare {
  rez: Rezultat
  intrari: IntrariMotor
  program: Program
  sursa: string
  definitii: Definitie[]
  // cifrele semnificative ale aritmeticii; 0 pentru dubla precizie
  cifre: number
}

const aceleasi = (a: Definitie[], b: Definitie[]) => a.length === b.length && a.every((d, k) => d.nume === b[k].nume && d.tip === b[k].tip && d.text === b[k].text)

// panourile din sertar; Convergenta si Geometria pornesc deschise, restul inchise
type NumePanou = 'adaptare' | 'despre' | 'operatii' | 'invariant' | 'convergenta' | 'geometrie' | 'verificare' | 'conditionare' | 'costN' | 'comparatie' | 'python' | 'notiuni'
const PANOURI_DESCHISE: Record<NumePanou, boolean> = { adaptare: true, despre: true, operatii: true, invariant: false, convergenta: true, geometrie: true, verificare: false, conditionare: false, costN: false, comparatie: false, python: false, notiuni: false }

const ROLURI_LEGENDA = ['pivot', 'scris', 'citit', 'gata', 'mult'] as const
const EXPLICATII: Record<(typeof ROLURI_LEGENDA)[number], CheieText> = { pivot: 'legendaPivot', scris: 'legendaScris', citit: 'legendaCitit', gata: 'legendaGata', mult: 'legendaMult' }

// rezumatul unei intrari pentru antetul sectiunii: „A 3×3”, „b 3”, „tol = 0.001”
function rezumatDefinitie(d: Definitie): string {
  const nume = d.nume.trim()
  if (d.tip === 'scalar') return `${nume} = ${d.text.trim()}`
  const linii = d.text.split('\n').filter((l) => l.trim() !== '')
  const coloane = linii[0]?.trim().split(/[\s,;]+/).filter(Boolean).length ?? 0
  return d.tip === 'vector' ? `${nume} ${coloane}` : `${nume} ${linii.length}×${coloane}`
}

// rezumatul panoului "Despre algoritm": costul pana la prima virgula din afara parantezelor,
// ca sa incapa langa titlu („≈ 2n² flopi pe iterație”); restul ramane in descriere
function rezumatCost(cost: string): string {
  let adancime = 0
  for (let i = 0; i < cost.length; i++) {
    if (cost[i] === '(') adancime++
    else if (cost[i] === ')') adancime--
    else if (cost[i] === ',' && adancime === 0) return cost.slice(0, i)
  }
  return cost
}

export default function App() {
  return (
    <Preferinte>
      {/* cu "reduce motion" cerut in sistem, celulele isi schimba doar culoarea, fara miscare */}
      <MotionConfig reducedMotion="user">
        <Continut />
      </MotionConfig>
    </Preferinte>
  )
}

function Continut() {
  const { limba, tema, t, setLimba, setTema } = usePreferinte()
  const [id, setId] = useState(idInitial)
  const alg = id === PROPRIU ? null : (algoritm(id) ?? null)
  // un exercitiu de adaptare: pseudocodul algoritmului de pornire si intrarile cu structura
  const ex = adaptareDin(id)
  const [sursa, setSursa] = useState(() => (alg ? sursaIn(alg, limba) : ex ? sursaIn(algoritm(ex.pornire)!, limba) : incarcaPropriu(limba).sursa))
  const [definitii, setDefinitii] = useState<Definitie[]>(() => (alg ? definitiiDin(alg) : ex ? definitiiAdaptare(ex) : incarcaPropriu(limba).definitii))
  const [rulare, setRulare] = useState<Rulare | null>(null)
  const [eroare, setEroare] = useState<Eroare | null>(null)
  const [k, setK] = useState(0)
  // rezultatul pasului curent e inca ascuns sub "?"
  const [ascuns, setAscuns] = useState(false)
  // modul exercitiu: rezultatele apar intai cu "?", cu campul de raspuns
  const [intrebari, setIntrebari] = useState(() => localStorage.getItem(CHEIE_INTREBARI) !== '0')
  const [redare, setRedare] = useState(false)
  const [viteza, setViteza] = useState(2)
  // modul prezentare: textul mai mare, pentru proiector
  const [prezentare, setPrezentare] = useState(false)
  // ?notiune=pivot deschide panoul "Notiuni de baza" la acea notiune
  const [deschise, setDeschise] = useState(() => {
    const ceruta = new URLSearchParams(window.location.search).get('notiune')
    return { ...PANOURI_DESCHISE, notiuni: !!ceruta && !!notiune(ceruta) }
  })
  // intrarile pornesc desfacute pe ecranele late; pe cele inguste raman la rezumat
  const [intrariDeschise, setIntrariDeschise] = useState(() => !window.matchMedia || window.matchMedia('(min-width: 90em)').matches)
  const [notiuneAleasa, setNotiuneAleasa] = useState<{ id: string; cerere: number } | null>(() => {
    const ceruta = new URLSearchParams(window.location.search).get('notiune')
    return ceruta && notiune(ceruta) ? { id: ceruta, cerere: 1 } : null
  })
  const pasCerut = useRef(pasInitial())
  const idAnterior = useRef<string | null>(null)
  const cuIntrebari = useRef(intrebari)
  cuIntrebari.current = intrebari
  // precizia aritmeticii: exemplul din curs cu pivotul 10⁻⁴ cere 3 cifre
  const [cifre, setCifre] = useState(() => cifreDinAdresa() ?? alg?.cifre ?? 0)
  const cifreAlese = useRef(cifre)
  cifreAlese.current = cifre
  // la schimbarea algoritmului, intrarile cu aceleasi nume si tipuri raman (pentru comparatii)
  const [pastreaza, setPastreaza] = useState(() => localStorage.getItem(CHEIE_PASTREAZA) === '1')
  // algoritmul si limba curente, pentru ruleaza(), care nu se reface la fiecare randare
  const algCurent = useRef(alg)
  algCurent.current = alg
  const limbaCurenta = useRef(limba)
  limbaCurenta.current = limba
  // modul exercitiu: raspunsurile date in rularea curenta si verdictul pasului la care s-a raspuns
  const [scor, setScor] = useState({ corecte: 0, total: 0 })
  const [verdict, setVerdict] = useState<{ k: number; corect: boolean } | null>(null)
  // pasii la care s-a raspuns deja: un pas se numara o singura data, oricate raspunsuri ar primi
  const raspunse = useRef(new Set<number>())

  // `pastreazaScor`: aceeasi rulare, reluata doar pentru alta limba
  const ruleaza = useCallback((textSursa: string, defs: Definitie[], pasDorit?: number, pastreazaScor = false) => {
    setRedare(false)
    // pasul din adresa se foloseste o singura data, la prima rulare, chiar daca ea nu reuseste
    const cerut = pasCerut.current
    pasCerut.current = 0
    // un algoritm din biblioteca nu ruleaza pe intrari de forma gresita: ar rezolva alta problema
    const a = algCurent.current
    const b = a && eSursa(a, textSursa) ? blocaj(defs, a.intrari) : null
    if (b) {
      const l = limbaCurenta.current
      setRulare(null)
      setK(0)
      setAscuns(false)
      setEroare({ linie: null, mesaj: text(l, 'nuRuleaza', text(l, b.abatere.cheie, b.nume, ...b.abatere.args)) })
      return
    }
    try {
      const program = parseaza(textSursa)
      const intrari = intrariDinDefinitii(defs)
      const rez = urma(program, intrari, { culori: true, cifre: cifreAlese.current || undefined })
      setRulare({ rez, intrari, program, sursa: textSursa, definitii: defs, cifre: cifreAlese.current })
      setEroare(null)
      if (!pastreazaScor) {
        setScor({ corecte: 0, total: 0 })
        setVerdict(null)
        raspunse.current.clear()
      }
      const nou = Math.min(pasDorit ?? cerut, rez.pasi.length - 1)
      setK(nou)
      // o rulare noua porneste cu intrebarea primului pas; un pas cerut anume se arata intreg
      if (pasDorit === undefined) setAscuns(nou === 0 && cuIntrebari.current && !!rez.pasi[0].intrebare)
      // la schimbarea limbii textul din editor poate fi altul decat cel rulat: semnul ramane doar unde are ce ascunde
      else setAscuns((a) => a && !!rez.pasi[nou].intrebare)
    } catch (e) {
      setRulare(null)
      setK(0)
      setAscuns(false)
      setEroare({ linie: e instanceof EroareSintaxa ? e.linie : null, mesaj: e instanceof Error ? e.message : String(e) })
    }
  }, [])

  // la alt algoritm se ruleaza de la inceput; la alta limba se ruleaza din nou, pastrand pasul
  useEffect(() => {
    const acelasi = idAnterior.current === id
    idAnterior.current = id
    // pseudocodul din biblioteca, needitat, trece in limba noua; la fel sablonul pseudocodului propriu
    const baza = alg ?? (ex ? algoritm(ex.pornire)! : null)
    const sablonVechi = text(limba === 'en' ? 'ro' : 'en', 'propriuSablon')
    const s = baza && eSursa(baza, sursa) ? sursaIn(baza, limba) : id === PROPRIU && sursa === sablonVechi ? text(limba, 'propriuSablon') : sursa
    if (s !== sursa) setSursa(s)
    ruleaza(s, definitii, acelasi ? k : undefined, acelasi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, limba, ruleaza])

  // adresa tine algoritmul, limba, tema si precizia, ca o reincarcare sa pastreze ce s-a ales
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    p.set('algoritm', id)
    p.set('limba', limba)
    p.set('tema', tema === 'intunecat' ? 'dark' : 'light')
    // precizia se scrie cand difera de cea cu care porneste algoritmul: dubla precizie la S_G e cifre=0
    if (cifre !== (algoritm(id)?.cifre ?? 0)) p.set('cifre', String(cifre))
    else p.delete('cifre')
    // pasul din adresa s-a folosit la prima rulare
    p.delete('pas')
    window.history.replaceState(null, '', `?${p}`)
  }, [id, limba, tema, cifre])

  useEffect(() => {
    localStorage.setItem(CHEIE_PASTREAZA, pastreaza ? '1' : '0')
  }, [pastreaza])

  useEffect(() => {
    if (id === PROPRIU) localStorage.setItem(CHEIE_PROPRIU, JSON.stringify({ sursa, definitii }))
  }, [id, sursa, definitii])

  useEffect(() => {
    localStorage.setItem(CHEIE_INTREBARI, intrebari ? '1' : '0')
    if (!intrebari) setAscuns(false)
  }, [intrebari])

  useEffect(() => {
    document.documentElement.classList.toggle('prezentare', prezentare)
  }, [prezentare])

  // `cuIntrarile`: intrarile raman chiar fara bifa "pastreaza" (trecerea din panoul de comparatie)
  const alege = (nou: string, cuIntrarile = false) => {
    setId(nou)
    if (nou === PROPRIU) {
      const s = incarcaPropriu(limba)
      setSursa(s.sursa)
      setDefinitii(s.definitii)
      // pseudocodul propriu porneste in dubla precizie, ca exercitiile; nu ia cele 3 cifre de la S_G
      setCifre(0)
      cifreAlese.current = 0
      return
    }
    const e = adaptareDin(nou)
    if (e) {
      setSursa(sursaIn(algoritm(e.pornire)!, limba))
      setDefinitii(definitiiAdaptare(e))
      setCifre(0)
      cifreAlese.current = 0
      return
    }
    const a = algoritm(nou)!
    setSursa(sursaIn(a, limba))
    // cu "pastreaza", intrarile raman cand noul algoritm are aceleasi nume si tipuri, si precizia la fel
    const potrivite = (pastreaza || cuIntrarile) && a.intrari.every((i) => definitii.some((d) => d.nume.trim() === i.nume && d.tip === i.tip))
    if (potrivite) return
    setDefinitii(definitiiDin(a))
    // precizia exemplului, sau dubla precizie
    setCifre(a.cifre ?? 0)
    cifreAlese.current = a.cifre ?? 0
  }

  // alta precizie: se ruleaza din nou, cu aceleasi intrari
  const schimbaCifre = (c: number) => {
    setCifre(c)
    cifreAlese.current = c
    ruleaza(sursa, definitii)
  }

  // valori noi cerute anume ("aleator", exemplul initial): se si ruleaza
  const cuValori = (noi: Definitie[]) => {
    setDefinitii(noi)
    ruleaza(sursa, noi)
  }

  // un contraexemplu din curs: valorile lui, in dubla precizie, si rularea
  const incarcaContraexemplu = (c: Contraexemplu) => {
    if (!alg) return
    setCifre(0)
    cifreAlese.current = 0
    cuValori(alg.intrari.map((i) => ({ nume: i.nume, tip: i.tip, text: textDinValoare(c.valori[i.nume]) })))
  }

  // un exemplu de conditionare din carte: matricea sistemului si b, in dubla precizie, si rularea
  const incarcaExemplu = (ex: ExempluCarte) => {
    if (!alg) return
    setCifre(0)
    cifreAlese.current = 0
    const valori: Record<string, number[] | number[][]> = { [matriceaSistemului(alg.id)]: ex.A, b: ex.b }
    cuValori(alg.intrari.map((i) => ({ nume: i.nume, tip: i.tip, text: textDinValoare(valori[i.nume] ?? i.exemplu) })))
  }

  const deschide = (p: NumePanou) => (d: boolean) => setDeschise((s) => ({ ...s, [p]: d }))

  const rez = rulare?.rez ?? null
  // textul din editor sau intrarile s-au schimbat de la ultima rulare: grilele arata valorile vechi
  const invechit = !!rulare && (rulare.sursa !== sursa || !aceleasi(rulare.definitii, definitii))
  const total = rez?.pasi.length ?? 0
  const pas = rez?.pasi[k]
  const stare = useMemo(() => (rez ? stareLa(rez, k) : {}), [rez, k])

  // Merge la pasul `nou`. Cu `intreaba`, rezultatul lui ramane ascuns pana la urmatorul pas inainte.
  const mergi = useCallback(
    (nou: number, intreaba = false) => {
      if (!rez) return
      const tinta = Math.min(Math.max(nou, 0), rez.pasi.length - 1)
      setK(tinta)
      setAscuns(intreaba && intrebari && !!rez.pasi[tinta].intrebare)
    },
    [rez, intrebari],
  )

  // Un pas inainte dezvaluie intai rezultatul ascuns, apoi trece la pasul urmator.
  const inainte = useCallback(() => {
    if (ascuns) setAscuns(false)
    else mergi(k + 1, true)
  }, [ascuns, k, mergi])

  // Un pas inapoi ascunde intai rezultatul pasului curent, apoi trece la pasul dinainte.
  const inapoi = useCallback(() => {
    if (!ascuns && intrebari && pas?.intrebare) setAscuns(true)
    else if (k > 0) mergi(k - 1)
  }, [ascuns, intrebari, pas, k, mergi])

  useEffect(() => {
    if (!redare) return
    if (k >= total - 1 && !ascuns) {
      setRedare(false)
      return
    }
    const factor = (pas && RITM[pas.fel]) ?? 1
    const timer = setTimeout(inainte, (1000 / viteza) * factor * (ascuns ? PARTE_INTREBARE : 1))
    return () => clearTimeout(timer)
  }, [redare, k, ascuns, total, viteza, pas, inainte])

  // urmatorul sau precedentul pas care schimba ceva in grile
  const laScriere = useCallback(
    (directie: 1 | -1) => {
      if (!rez) return
      let tinta = directie > 0 ? rez.pasi.length - 1 : 0
      for (let s = k + directie; s >= 0 && s < rez.pasi.length; s += directie) {
        if (cuScriere(rez.pasi[s])) {
          tinta = s
          break
        }
      }
      mergi(tinta, directie > 0)
    },
    [rez, k, mergi],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tinta = e.target as HTMLElement
      // pe un meniu, stanga si dreapta merg prin pasi (sus si jos raman ale meniului); in rest, campurile isi pastreaza tastele
      const meniu = tinta.tagName === 'SELECT' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')
      if (!meniu && tinta.closest('.editor, textarea, input, select')) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      // spatiul pe un buton sau pe un titlu de panou il apasa, nu porneste redarea
      if (e.key === ' ' && tinta.closest('button, summary, a, label')) return
      if (e.key === 'ArrowRight') {
        if (e.shiftKey) laScriere(1)
        else inainte()
      } else if (e.key === 'ArrowLeft') {
        if (e.shiftKey) laScriere(-1)
        else inapoi()
      } else if (e.key === 'Home') mergi(0, true)
      else if (e.key === 'End') mergi(total - 1)
      else if (e.key === ' ') setRedare((r) => !r)
      else if (e.key === 'e' || e.key === 'E') setIntrebari((v) => !v)
      else if (e.key === 'p' || e.key === 'P') setPrezentare((v) => !v)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, laScriere, inainte, inapoi, mergi])

  const porneste = (r: boolean) => {
    if (r && k >= total - 1) mergi(0, true)
    setRedare(r)
  }

  // intrarile intai, in ordinea definita, apoi tablourile create de algoritm
  const tablouri = useMemo(() => {
    const ordine = (n: string) => {
      const i = definitii.findIndex((d) => d.nume === n)
      return i < 0 ? 100 : i
    }
    return Object.keys(stare)
      .sort((a, b) => ordine(a) - ordine(b) || a.localeCompare(b))
      .map((n) => [n, stare[n]] as const)
  }, [stare, definitii])

  // cel mai lung text din fiecare coloana a fiecarui tablou, pe toata urma: latimea coloanelor
  // se stabileste o data si nu sare de la un pas la altul
  const latimi = useMemo(() => {
    const m = new Map<string, number[]>()
    const noteaza = (nume: string, j: number, s: string) => {
      const l = m.get(nume) ?? []
      l[j - 1] = Math.max(l[j - 1] ?? 0, s.length)
      m.set(nume, l)
    }
    const tablou = (nume: string, t: Tablou) => {
      const n = t.tip === 'vector' ? 1 : t.n
      t.d.forEach((v, idx) => noteaza(nume, (idx % n) + 1, fmtCelula(v)))
    }
    if (!rez) return m
    for (const [nume, t] of Object.entries(stareLa(rez, 0))) tablou(nume, t)
    for (const p of rez.pasi) {
      for (const w of p.scrieri) noteaza(w.nume, w.j ?? 1, fmtCelula(w.nou))
      for (const [nume, x] of Object.entries(p.noi ?? {})) tablou(nume, x.nou)
    }
    return m
  }, [rez])

  // ultimul pas care scrie fiecare celula: inainte de el celula e „scris”, dupa el „gata” sau „mult”
  const ultimaScriere = useMemo(() => {
    const m = new Map<string, { idx: number; mult: boolean }>()
    rez?.pasi.forEach((p, idx) => {
      for (const c of p.celule) if (c.rol === 'scris') m.set(`${c.nume}:${c.i}:${c.j ?? 1}`, { idx, mult: !!c.mult })
    })
    return m
  }, [rez])

  // O celula citita, dar niciodata scrisa, intr-un tablou pe care programul il modifica pe loc:
  // valoarea ei de intrare ramane in rezultat (prima linie a lui U la G, b_1 la S_G), deci e
  // "gata" dupa prima citire. Tablourile doar citite (L la LTRIS, A la Jacobi) raman neatinse.
  const primaCitire = useMemo(() => {
    const m = new Map<string, number>()
    if (!rez) return m
    const modificate = new Set<string>()
    const inlocuite = new Set<string>()
    for (const p of rez.pasi) {
      for (const c of p.celule) if (c.rol === 'scris') modificate.add(c.nume)
      for (const [nume, n] of Object.entries(p.noi ?? {})) if (n.vechi) inlocuite.add(nume)
    }
    rez.pasi.forEach((p, idx) => {
      for (const c of p.celule) {
        const cheie = `${c.nume}:${c.i}:${c.j ?? 1}`
        if (c.rol !== 'scris' && modificate.has(c.nume) && !inlocuite.has(c.nume) && !ultimaScriere.has(cheie) && !m.has(cheie)) m.set(cheie, idx)
      }
    })
    return m
  }, [rez, ultimaScriere])

  const finale = useMemo(() => {
    const gata = new Map<string, Set<string>>()
    const mult = new Map<string, Set<string>>()
    const adauga = (tinta: Map<string, Set<string>>, cheie: string) => {
      const [nume, i, j] = cheie.split(':')
      if (!tinta.has(nume)) tinta.set(nume, new Set())
      tinta.get(nume)!.add(`${i}:${j}`)
    }
    for (const [cheie, u] of ultimaScriere) if (u.idx < k) adauga(u.mult ? mult : gata, cheie)
    for (const [cheie, idx] of primaCitire) if (idx < k) adauga(gata, cheie)
    return { gata, mult }
  }, [ultimaScriere, primaCitire, k])

  // o metoda iterativa oprita de maxiter are si ea o stare de verificat: reziduul de la oprire
  const verificari = useMemo(
    () =>
      alg && rulare && (rulare.rez.final === 'gata' || (rulare.rez.final === 'stop' && alg.grup === 'iterative'))
        ? verifica(alg.id, rulare.intrari, rulare.rez.stare, rulare.rez.scalari, rulare.cifre || undefined)
        : [],
    [alg, rulare],
  )

  // etapele scrise de mana raman valabile doar cat timp pseudocodul e cel din biblioteca
  const dinBiblioteca = !!alg && !!rulare && eSursa(alg, rulare.sursa)
  const etape: Etapa[] = useMemo(() => {
    if (!rulare) return []
    if (alg && eSursa(alg, rulare.sursa)) return alg.etape.map((e) => ({ de: e.linii[0], la: e.linii[1], tex: e.tex, text: e.text[limba] }))
    return operatiiPeLinii(rulare.program, rulare.rez.pasi).map((l) => ({ de: l.linie, la: l.linie, tex: l.tex, text: l.feluri.map((f) => OPERATII[f].nume[limba]).join(', ') }))
  }, [alg, rulare, limba])

  // evaluarile conditiei primei bucle "cat timp": marimea testata la fiecare iteratie
  const iteratii: Punct[] = useMemo(() => {
    const toate = (rez?.pasi ?? []).flatMap((p, idx) => (p.iteratie ? [{ ...p.iteratie, pas: idx, adevarat: !!p.adevarat }] : []))
    // o bucla interioara reia numaratoarea; se pastreaza prima parcurgere a primei bucle
    const prima = toate.filter((p) => p.linie === toate[0]?.linie)
    const reluare = prima.findIndex((p, i) => i > 0 && p.iter === 0)
    return reluare < 0 ? prima : prima.slice(0, reluare)
  }, [rez])
  const vazute = iteratii.filter((p) => p.pas <= k).length

  // crestaturile de pe urma: iteratiile sau pasii k ai buclei exterioare, scrierile, oprirea
  const marcaje: Marcaj[] = useMemo(() => {
    if (!rez) return []
    const m: Marcaj[] = []
    const antete = rez.pasi.filter((p) => p.fel === 'antet')
    const exterioara = antete.length ? Math.min(...antete.map((p) => p.linie)) : -1
    const cuIteratii = iteratii.length > 0
    const scurt = rez.pasi.length > PASI_CU_SCRIERI
    rez.pasi.forEach((p, idx) => {
      if (cuIteratii ? !!p.iteratie : p.fel === 'antet' && p.linie === exterioara) m.push({ k: idx, fel: 'mare' })
      else if (!scurt && cuScriere(p) && p.fel !== 'final') m.push({ k: idx, fel: 'mic' })
    })
    if (rez.final !== 'gata') m.push({ k: rez.pasi.length - 1, fel: 'capat' })
    return m
  }, [rez, iteratii])

  const variabile = useMemo(() => (rulare ? variabilePeLinie(rulare.program) : new Map<number, string[]>()), [rulare])
  // langa linia curenta stau valorile cu care se calculeaza: scalarul scris apare cu valoarea veche
  const inainteDePas = (nume: string): number | undefined => (pas?.scalarScris?.nume === nume ? pas.scalarScris.vechi : pas?.scalari[nume])
  // in ordinea din card (a primei atribuiri: bucla exterioara intai), nu a aparitiei pe linie
  const ordineScalari = pas ? Object.keys(pas.scalari) : []
  const anotare =
    pas && pas.linie > 0
      ? (variabile.get(pas.linie) ?? [])
          .map((v) => [v, inainteDePas(v)] as const)
          .filter((x): x is readonly [string, number] => x[1] !== undefined)
          .sort((a, b) => ordineScalari.indexOf(a[0]) - ordineScalari.indexOf(b[0]))
          .map(([v, val]) => `${v} = ${fmtCelula(val)}`)
          .join(', ')
      : ''

  const intrariScalare = new Set(definitii.filter((d) => d.tip === 'scalar').map((d) => d.nume.trim()))
  const scalari = pas
    ? Object.entries(pas.scalari)
        .filter(([n]) => n !== 'n' && n !== 'm' && !intrariScalare.has(n))
        .map(([nume, v]) => `${nume} = ${ascuns && pas.scalarScris?.nume === nume ? '?' : fmtCelula(v)}`)
    : []
  // linia de pseudocod a pasului, citata in card
  const textLinie = pas && pas.linie > 0 && rulare ? (rulare.sursa.split('\n')[pas.linie - 1] ?? '').trim() : ''
  // prima propozitie spune locul din curs; restul, ce difera aici fata de slide, se deschide la cerere
  const [locCurs, ...restCurs] = alg ? alg.curs[limba].split(/(?<=\.) (?=\p{Lu})/u) : []
  const paleta = PALETA[tema]
  const celuleTotal = tablouri.reduce((s, [, t]) => s + t.d.length, 0)
  const animat = celuleTotal <= CELULE_ANIMATE
  const compact = celuleTotal > CELULE_COMPACT
  const durata = Math.min(0.35, 0.6 / viteza)
  const linieEroare = eroare?.linie ?? (rez?.final === 'eroare' && k === total - 1 && pas ? pas.linie : null)
  // formula de cost a algoritmului, evaluata pentru intrarile rulate, langa flopii numarati
  const estimat = alg && dinBiblioteca && rulare && rulare.rez.final !== 'eroare' ? alg.estimare(marimiDin(rulare.intrari, Math.max(iteratii.length - 1, 0))) : null
  // flopii algoritmului pentru matrice oarecare din care e adaptat acesta, pe aceleasi intrari
  const plin = useMemo(() => {
    if (!alg?.plin || !dinBiblioteca || !rulare || rulare.rez.final !== 'gata') return null
    const p = algoritm(alg.plin)!
    try {
      const intr = Object.fromEntries(p.intrari.map((i) => [i.nume, rulare.intrari[i.nume]]))
      const r = urma(parseaza(p.sursa), intr, { cifre: rulare.cifre || undefined })
      const [scurt, ...rest] = p.titlu[limba].split(', ')
      return r.final === 'gata' ? { titlu: rest.length ? `${scurt} (${rest.join(', ')})` : scurt, flopi: r.flopi } : null
    } catch {
      return null
    }
  }, [alg, dinBiblioteca, rulare, limba])
  // pozitiile tabloului care sunt zero stiut dinainte, pentru o matrice banda
  const zerouri = useMemo(() => {
    if (!alg?.zerouri || !dinBiblioteca || !rulare) return null
    const t = rulare.intrari[alg.zerouri.tablou]
    if (!Array.isArray(t) || !Array.isArray(t[0])) return null
    const s = Object.fromEntries(Object.entries(rulare.intrari).filter((x): x is [string, number] => typeof x[1] === 'number'))
    const set = new Set<string>()
    ;(t as number[][]).forEach((l, i) => l.forEach((_, j) => (alg.zerouri!.zero(i + 1, j + 1, s) ? set.add(`${i + 1}:${j + 1}`) : undefined)))
    return { tablou: alg.zerouri.tablou, set }
  }, [alg, dinBiblioteca, rulare])
  // ce trebuie sa raspunda studentul la pasul curent, cat timp rezultatul e ascuns
  const dorit = ascuns && pas ? asteptat(pas) : null
  const n = rulare?.rez.scalari.n
  const nota = alg?.direct && dinBiblioteca && n && iteratii[vazute - 1] ? t('convergentaDirect', nrFlopi(limba, iteratii[vazute - 1].flopi), n, alg.direct.nume[limba], nrFlopi(limba, alg.direct.flopi(n))) : undefined

  // verificarea: inainte de ultimul pas, la ultimul pas, sau dupa o oprire
  const stareVerificare: 'inainte' | 'gata' | 'oprit' = rulare?.rez.final !== 'gata' ? 'oprit' : k === total - 1 ? 'gata' : 'inainte'
  const cuVerificare = !!alg && areVerificare(alg.id)
  // la sfarsit panoul de verificare se deschide singur
  useEffect(() => {
    if (cuVerificare && stareVerificare === 'gata') setDeschise((s) => ({ ...s, verificare: true }))
  }, [cuVerificare, stareVerificare])

  const geometrie = !!alg && dinBiblioteca && !!rulare && areGeometrie(alg.id, rulare.intrari)
  // invariantul se verifica si pe un pseudocod modificat, cat timp are tablourile algoritmului
  // in modul exercitiu, invariantul algoritmului de pornire: o adaptare corecta il pastreaza
  const idInvariant = alg?.id ?? ex?.pornire ?? null
  const cuInvariant = !!idInvariant && areInvariant(idInvariant) && !!rulare
  const inv = useMemo(() => (cuInvariant && rulare ? invariant(idInvariant!, rulare.program, rulare.rez, rulare.intrari, k) : null), [cuInvariant, idInvariant, rulare, k])
  const etapa = etapaCurenta(etape, pas && pas.linie > 0 ? pas.linie : null)
  const ultimaIteratie = iteratii[vazute - 1]
  const rezumatVerificare = stareVerificare === 'inainte' ? t('verificareRezumatLaFinal') : stareVerificare === 'oprit' ? (verificari.length ? '' : t('verificareRezumatOprit')) : verificari.every(randOk) ? t('verificareOk') : t('verificareRau')
  const rezumatIntrari = [...definitii.map(rezumatDefinitie), cifre > 0 ? t('cifreScurt', cifre) : t('dublaScurt')].join(' · ')
  const numeFisier = alg ? alg.id : 'program'

  return (
    <div className="aplicatie">
      <header>
        <div className="marca" aria-hidden="true">
          MN
        </div>
        <h1>{t('titlu')}</h1>
        <label className="alegere">
          {t('algoritm')}
          <select value={id} onChange={(e) => alege(e.target.value)}>
            {GRUPURI_ALGORITMI.map((g) => (
              <optgroup key={g.id} label={g.titlu[limba]}>
                {BIBLIOTECA.filter((a) => a.grup === g.id).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.titlu[limba]}
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label={t('adaptari')}>
              {ADAPTARI.map((a) => (
                <option key={a.id} value={PREFIX_ADAPTARE + a.id}>
                  {a.titlu[limba]}
                </option>
              ))}
            </optgroup>
            <option value={PROPRIU}>{t('propriu')}</option>
          </select>
        </label>
        <span className="spatiu" />
        <button type="button" className="icon" aria-pressed={prezentare} title={t('prezentareAjutor')} onClick={() => setPrezentare((v) => !v)}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1.5" y="2.5" width="13" height="8.5" rx="1" />
            <path d="M8 11v3M5 14h6" />
          </svg>
          <span className="vizual-ascuns">{t('prezentare')}</span>
        </button>
        <button type="button" className="icon" title={t('schimbaTema')} onClick={() => setTema(tema === 'intunecat' ? 'luminos' : 'intunecat')}>
          {tema === 'intunecat' ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z" />
            </svg>
          )}
          <span className="vizual-ascuns">{tema === 'intunecat' ? t('temaLuminoasa') : t('temaIntunecata')}</span>
        </button>
        <button type="button" className="preferinta" title={t('schimbaLimba')} onClick={() => setLimba(limba === 'ro' ? 'en' : 'ro')}>
          {limba === 'ro' ? 'EN' : 'RO'}
        </button>
        <details className="taste">
          <summary>{t('taste')}</summary>
          <ul>
            {t('tasteLista')
              .split('\n')
              .map((r) => r.split('|'))
              .map(([taste, ce]) => (
                <li key={taste}>
                  <kbd>{taste}</kbd>
                  <span>{ce}</span>
                </li>
              ))}
          </ul>
        </details>
      </header>

      <section className="cod" aria-label={t('pseudocod')}>
        <div className="antet-cod">
          <h2>{t('pseudocod')}</h2>
          <button type="button" className={invechit ? 'principal' : ''} title={t('ruleazaScurt')} onClick={() => ruleaza(sursa, definitii)}>
            {t('ruleaza')}
          </button>
        </div>
        <Editor
          text={sursa}
          onChange={setSursa}
          onRun={() => ruleaza(sursa, definitii)}
          linie={pas?.linie ?? null}
          eroare={linieEroare}
          anotare={anotare || null}
          tema={tema}
        />
        {eroare && (
          <p className="eroare" role="alert">
            {eroare.linie ? `${t('linia', eroare.linie)}: ` : ''}
            {eroare.mesaj}
          </p>
        )}
        <details className="intrari-panou" open={intrariDeschise} onToggle={(e) => setIntrariDeschise((e.currentTarget as HTMLDetailsElement).open)}>
          <summary>
            <h2>{t('intrari')}</h2>
            <span className="rezumat">{rezumatIntrari}</span>
          </summary>
          <div className="continut">
            {alg && (
              <div className="titlu-intrari">
                <label className="bifa" title={t('pastreazaAjutor')}>
                  <input type="checkbox" checked={pastreaza} onChange={(e) => setPastreaza(e.target.checked)} />
                  {t('pastreaza')}
                </label>
              </div>
            )}
            <Intrari
              definitii={definitii}
              // in modul exercitiu, intrarile algoritmului de pornire: b urmeaza dimensiunea matricei
              cerute={alg?.intrari ?? (ex ? algoritm(ex.pornire)!.intrari : [])}
              onChange={setDefinitii}
              onAleator={cuValori}
              onExemplu={
                alg
                  ? () => {
                      setCifre(alg.cifre ?? 0)
                      cifreAlese.current = alg.cifre ?? 0
                      cuValori(definitiiDin(alg))
                    }
                  : undefined
              }
            />
            {alg && CONTRAEXEMPLE[alg.id] && (
              <details className="contraexemple">
                <summary title={t('contraexempleAjutor')}>{t('contraexemple', CONTRAEXEMPLE[alg.id].length)}</summary>
                <ul>
                  {CONTRAEXEMPLE[alg.id].map((c) => (
                    <li key={c.titlu.ro}>
                      <button type="button" className="mic" onClick={() => incarcaContraexemplu(c)}>
                        {c.titlu[limba]}
                      </button>
                      <p>{c.explicatie[limba]}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <label className="precizie" title={t('precizieAjutor')}>
              {t('aritmetica')}
              <select value={cifre} onChange={(e) => schimbaCifre(Number(e.target.value))}>
                {PRECIZII.map((c) => (
                  <option key={c} value={c}>
                    {c === 0 ? t('dublaPrecizie') : t('cifreSemnificative', c)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>
      </section>

      <section className={`scena${invechit ? ' veche' : ''}`} aria-label={t('pasulCurent')}>
        {invechit && (
          <p className="invechit" role="status">
            {t('invechit')}
            <button type="button" className="mic" onClick={() => ruleaza(sursa, definitii)}>
              {t('ruleazaDinNou')}
            </button>
          </p>
        )}
        {rez && rez.final !== 'gata' && k < total - 1 && (
          <p className="invechit oprire" role="status">
            {t(rez.final === 'eroare' ? 'seOpresteEroare' : 'seOpresteStop', total, rez.pasi[total - 1].mesaj ?? '')}
            <button type="button" className="mic" onClick={() => mergi(total - 1)}>
              {t('mergiAcolo')}
            </button>
          </p>
        )}
        {!rulare && <p className="ajutor fara-urma">{t('faraUrma')}</p>}
        {/* in timpul redarii cititorul de ecran nu e intrerupt la fiecare pas */}
        <div className="pas" aria-live={redare ? 'off' : 'polite'} aria-atomic="true">
          <div className="stare-rand">
            <p className="stare">
              {pas && (
                <>
                  <strong>{t('pasul', k + 1, total)}</strong>
                  {pas.linie > 0 && <span> · {t('linia', pas.linie)}</span>}
                  <span> · {nrFlopi(limba, pas.flopi)}</span>
                  {rulare && rulare.cifre > 0 && <span> · {t('cuCifre', rulare.cifre)}</span>}
                </>
              )}
            </p>
            <div className="mod" role="group" aria-label={t('mod')}>
              <span className="segmente">
                <button type="button" aria-pressed={!intrebari} title={t('parcurgereAjutor')} onClick={() => setIntrebari(false)}>
                  {t('parcurgere')}
                </button>
                <button type="button" aria-pressed={intrebari} title={t('intrebariAjutor')} onClick={() => setIntrebari(true)}>
                  {t('exercitiu')}
                </button>
              </span>
              {intrebari && scor.total > 0 && <span className="scor">{t('scor', scor.corecte, scor.total)}</span>}
            </div>
          </div>
          {pas && (pas.linie > 0 || scalari.length > 0) && (
            <p className="linie">
              {pas.linie > 0 && (
                <>
                  <span className="nr">{t('linia', pas.linie)}</span>
                  <code>{textLinie}</code>
                </>
              )}
              {scalari.length > 0 && <span className="valori">{scalari.join(', ')}</span>}
            </p>
          )}
          <Formula tex={ascuns ? pas?.intrebare : pas?.formula} />
          {ascuns && (
            <div className="actiuni-pas">
              {dorit !== null && (
                <Raspuns
                  key={k}
                  dorit={dorit}
                  onRaspuns={(corect) => {
                    // dupa un pas inapoi, pasul se poate rezolva din nou, dar se numara o singura data
                    if (!raspunse.current.has(k)) {
                      raspunse.current.add(k)
                      setScor((s) => ({ corecte: s.corecte + (corect ? 1 : 0), total: s.total + 1 }))
                    }
                    setVerdict({ k, corect })
                    setAscuns(false)
                  }}
                />
              )}
              <button type="button" className="mic arata" onClick={inainte}>
                {t('arataRezultatul')}
              </button>
            </div>
          )}
          {verdict?.k === k && !ascuns && (
            <p className={`verdict ${verdict.corect ? 'corect' : 'gresit'}`} role="status">
              {verdict.corect ? t('raspunsCorect') : t('raspunsGresit')} {t('scor', scor.corecte, scor.total)}
            </p>
          )}
          {pas?.mesaj && <p className={`mesaj ${pas.final ?? ''}`}>{pas.mesaj}</p>}
          {pas?.final === 'gata' && cuVerificare && verificari.length > 0 && (
            <>
              <RanduriVerificare randuri={verificari} clasa="verificare-scurta" />
              <p className="catre-verificare">
                <a
                  href="#panou-verificare"
                  onClick={(e) => {
                    e.preventDefault()
                    setDeschise((s) => ({ ...s, verificare: true }))
                    document.getElementById('panou-verificare')?.scrollIntoView({ block: 'start' })
                  }}
                >
                  {t('detaliiVerificare')}
                </a>
              </p>
            </>
          )}
          <OperatiiPas operatii={pas?.operatii} />
        </div>
        {!animat && <p className="ajutor matrice-mare">{t('matriceMare', CELULE_ANIMATE)}</p>}
        <div className={`grile${compact ? ' compact' : ''}`}>
          {tablouri.map(([nume, tablou]) => (
            <Grila
              key={nume}
              nume={nume}
              tablou={tablou}
              celule={pas?.celule ?? []}
              gata={finale.gata.get(nume)}
              mult={finale.mult.get(nume)}
              zerouri={zerouri?.tablou === nume ? zerouri.set : undefined}
              latimi={latimi.get(nume)}
              pasIdx={k}
              fel={pas?.fel}
              intrebare={ascuns}
              durata={durata}
              animat={animat}
            />
          ))}
        </div>
        <div className="legenda-rand">
          <ul className="legenda" aria-label={t('legenda')}>
            {ROLURI_LEGENDA.map((rol) => (
              <li key={rol}>
                <span className={`celula rol-${rol}`} style={{ backgroundColor: paleta[rol] }} aria-hidden="true" />
                {t(TEXT_ROL[rol]!)}
              </li>
            ))}
            {zerouri && (
              <li>
                <span className="celula rol-neatins zero-stiut" style={{ backgroundColor: paleta.neatins }} aria-hidden="true" />
                {t('zeroStiut')}
              </li>
            )}
          </ul>
          <details className="legenda-explicatii">
            <summary>{t('ceInseamna')}</summary>
            <ul>
              {ROLURI_LEGENDA.map((rol) => (
                <li key={rol}>{t(EXPLICATII[rol])}</li>
              ))}
              {zerouri && <li>{t('legendaZero')}</li>}
            </ul>
          </details>
        </div>
      </section>

      <Comenzi
        k={k}
        total={total}
        poateInapoi={k > 0 || (!ascuns && intrebari && !!pas?.intrebare)}
        poateInainte={k < total - 1 || ascuns}
        ascuns={ascuns}
        redare={redare}
        viteza={viteza}
        marcaje={marcaje}
        onK={(x) => mergi(x, x === 0)}
        onInainte={inainte}
        onInapoi={inapoi}
        onScriere={laScriere}
        onRedare={porneste}
        onViteza={setViteza}
      />

      <aside className="sertar" aria-label={t('panouri')}>
        {ex && (
          <Panou clasa="adaptare" titlu={t('adaptare')} deschis={deschise.adaptare} onToggle={deschide('adaptare')}>
            <ExercitiuAdaptare
              ex={ex}
              sursaRulata={rulare?.sursa ?? null}
              intrariRulate={rulare?.intrari}
              onSolutie={(s) => {
                setSursa(s)
                ruleaza(s, definitii)
              }}
            />
          </Panou>
        )}
        <Panou clasa="despre" titlu={t('despre')} rezumat={alg ? rezumatCost(alg.cost[limba]) : undefined} deschis={deschise.despre} onToggle={deschide('despre')}>
          <p className="descriere">
            {alg ? alg.descriere[limba] : t('propriuAjutor')}
            {alg && (
              <span className="cost">
                {' '}
                {t('cost')}: {alg.cost[limba]}.
                {estimat !== null && <> {estimat === rulare!.rez.flopi ? t('costExact', nrFlopi(limba, estimat)) : t('costEstimat', nrFlopi(limba, Math.round(estimat)), nrFlopi(limba, rulare!.rez.flopi))}</>}
                {plin && <> {t('costPlin', plin.titlu, nrFlopi(limba, plin.flopi))}</>}
              </span>
            )}
          </p>
          {alg &&
            (restCurs.length > 0 ? (
              <details className="in-curs">
                <summary>
                  <span>{t('inCurs')}</span> {locCurs}
                </summary>
                <p>{restCurs.join(' ')}</p>
              </details>
            ) : (
              <p className="in-curs">
                <span>{t('inCurs')}</span> {locCurs}
              </p>
            ))}
          {alg && (
            <details className="practic">
              <summary>{t('inPractica')}</summary>
              <p>{alg.practic[limba]}</p>
            </details>
          )}
          {alg && alg.notiuni.length > 0 && (
            <p className="etichete">
              <span>{t('notiuniNecesare')}</span>
              {alg.notiuni.map((x) => (
                <button
                  key={x}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setNotiuneAleasa({ id: x, cerere: Date.now() })
                    setDeschise((s) => ({ ...s, notiuni: true }))
                  }}
                >
                  {notiune(x)?.titlu[limba] ?? x}
                </button>
              ))}
            </p>
          )}
        </Panou>
        <Panou
          clasa="operatii"
          titlu={t('operatii')}
          rezumat={etapa ? (etapa.de === etapa.la ? t('linia', etapa.de) : t('liniile', etapa.de, etapa.la)) : undefined}
          deschis={deschise.operatii}
          onToggle={deschide('operatii')}
        >
          <OperatiiAlgoritm forma={dinBiblioteca ? alg?.forma : undefined} etape={etape} linie={pas && pas.linie > 0 ? pas.linie : null} />
        </Panou>
        {cuInvariant && (
          <Panou
            clasa="invariant"
            titlu={t('invariant')}
            rezumat={inv ? `${nrPasi(limba, inv.complete, true)} · ${invariantOk(inv, rulare!.cifre) ? t('verificareOk') : t('verificareRau')}` : undefined}
            deschis={deschise.invariant}
            onToggle={deschide('invariant')}
          >
            <Invariant inv={inv} cifre={rulare!.cifre} onPas={(x) => mergi(x)} />
          </Panou>
        )}
        {iteratii.length >= 2 && (
          <Panou
            clasa="convergenta"
            titlu={t('convergenta')}
            rezumat={ultimaIteratie ? relatie(ultimaIteratie) : undefined}
            deschis={deschise.convergenta}
            onToggle={deschide('convergenta')}
          >
            <Convergenta puncte={iteratii} vazute={vazute} onPas={(x) => mergi(x)} nota={nota} />
          </Panou>
        )}
        {geometrie && (
          <Panou clasa="geometrie" titlu={t('geometrie')} deschis={deschise.geometrie} onToggle={deschide('geometrie')}>
            <Geometrie id={alg!.id} rez={rulare!.rez} intrari={rulare!.intrari} k={k} ascuns={ascuns} />
          </Panou>
        )}
        {cuVerificare && (
          <Panou clasa="verificare" titlu={t('verificare')} rezumat={rezumatVerificare} deschis={deschise.verificare} onToggle={deschide('verificare')}>
            <Verificare randuri={verificari} stare={stareVerificare} cifre={rulare?.cifre ?? 0} onFinal={() => mergi(total - 1)} />
          </Panou>
        )}
        {alg && dinBiblioteca && rulare && rulare.rez.final === 'gata' && areConditionare(alg.id) && (
          <Panou clasa="conditionare" titlu={t('conditionare')} deschis={deschise.conditionare} onToggle={deschide('conditionare')}>
            <Conditionare alg={alg} intrari={rulare.intrari} onExemplu={incarcaExemplu} deschis={deschise.conditionare} />
          </Panou>
        )}
        {alg && dinBiblioteca && rulare && areCostPeN(alg) && (
          <Panou clasa="cost-n" titlu={t('costN')} deschis={deschise.costN} onToggle={deschide('costN')}>
            <CostPeN alg={alg} intrari={rulare.intrari} deschis={deschise.costN} />
          </Panou>
        )}
        {alg && dinBiblioteca && rulare && (
          <Panou clasa="comparatie" titlu={t('comparatie')} deschis={deschise.comparatie} onToggle={deschide('comparatie')}>
            <Comparatie alg={alg} rez={rulare.rez} intrari={rulare.intrari} cifre={rulare.cifre} definitii={rulare.definitii} onTreci={(nou) => alege(nou, true)} />
          </Panou>
        )}
        <Panou clasa="python" titlu={t('codPython')} rezumat={`${numeFisier}.py`} deschis={deschise.python} onToggle={deschide('python')}>
          <CodPython
            nume={numeFisier}
            sursa={sursa}
            definitii={definitii}
            // lista de iesiri si forma patrata sunt ale pseudocodului din biblioteca, nu ale unuia editat
            iesiri={alg && eSursa(alg, sursa) ? alg.iesiri : undefined}
            patrata={!!alg && eSursa(alg, sursa) && estePatrata(alg.intrari.find((i) => i.tip === 'matrice')?.natura)}
            numpy={alg && eSursa(alg, sursa) && alg.intrari.every((i) => definitii.some((d) => d.nume.trim() === i.nume && d.tip === i.tip)) ? alg.numpy : undefined}
            cifre={cifre}
            deschis={deschise.python}
          />
        </Panou>
        <Panou clasa="notiuni" titlu={t('notiuni')} deschis={deschise.notiuni} onToggle={deschide('notiuni')}>
          <Notiuni tinta={notiuneAleasa?.id ?? null} cerere={notiuneAleasa?.cerere ?? 0} />
        </Panou>
      </aside>
    </div>
  )
}
