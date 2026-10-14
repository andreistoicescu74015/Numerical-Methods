import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { CodPython } from './componente/CodPython'
import { Comenzi } from './componente/Comenzi'
import { Convergenta, type Punct } from './componente/Convergenta'
import { Editor } from './componente/Editor'
import { Formula } from './componente/Formula'
import { Geometrie, areGeometrie } from './componente/Geometrie'
import { Grila, fmtCelula } from './componente/Grila'
import { Intrari } from './componente/Intrari'
import { Notiuni } from './componente/Notiuni'
import { OperatiiAlgoritm, OperatiiPas, type Etapa } from './componente/Operatii'
import { Raspuns } from './componente/Raspuns'
import { Verificare } from './componente/Verificare'
import { asteptat } from './exercitiu'
import { nrFlopi, text } from './i18n'
import { blocaj, definitiiDin, intrariDinDefinitii, type Definitie } from './intrari'
import { operatiiPeLinii, variabilePeLinie } from './motor/analiza'
import { EroareSintaxa, type Program } from './motor/ast'
import { BIBLIOTECA, GRUPURI_ALGORITMI, algoritm, marimiDin, type Algoritm } from './motor/biblioteca'
import { stareLa, urma, type Intrari as IntrariMotor, type Pas, type Rezultat } from './motor/interpretor'
import type { Limba } from './motor/mesaje'
import { parseaza } from './motor/parser'
import { inEngleza } from './motor/traducere'
import { areVerificare, verifica } from './motor/verificare'
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

// ?cifre=3 porneste cu aritmetica pe 3 cifre semnificative
function cifreDinAdresa(): number | null {
  const c = Number(new URLSearchParams(window.location.search).get('cifre'))
  return Number.isInteger(c) && c >= 2 && c <= 16 ? c : null
}
// peste atatea celule, grilele se deseneaza fara animatii
const CELULE_ANIMATE = 150
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

// ?algoritm=GPP sau ?algoritm=propriu deschide direct acel program; ?pas=12 sare la acel pas.
function idInitial(): string {
  const cerut = new URLSearchParams(window.location.search).get('algoritm')
  if (cerut === PROPRIU || (cerut && algoritm(cerut))) return cerut
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
  const [sursa, setSursa] = useState(() => (alg ? sursaIn(alg, limba) : incarcaPropriu(limba).sursa))
  const [definitii, setDefinitii] = useState<Definitie[]>(() => (alg ? definitiiDin(alg) : incarcaPropriu(limba).definitii))
  const [rulare, setRulare] = useState<Rulare | null>(null)
  const [eroare, setEroare] = useState<Eroare | null>(null)
  const [k, setK] = useState(0)
  // rezultatul pasului curent e inca ascuns sub "?"
  const [ascuns, setAscuns] = useState(false)
  const [intrebari, setIntrebari] = useState(() => localStorage.getItem(CHEIE_INTREBARI) !== '0')
  const [redare, setRedare] = useState(false)
  const [viteza, setViteza] = useState(2)
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

  const ruleaza = useCallback((textSursa: string, defs: Definitie[], pasDorit?: number) => {
    setRedare(false)
    // un algoritm din biblioteca nu ruleaza pe intrari de forma gresita: ar rezolva alta problema
    const a = algCurent.current
    const b = a && eSursa(a, textSursa) ? blocaj(defs, a.intrari) : null
    if (b) {
      const l = limbaCurenta.current
      setRulare(null)
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
      setScor({ corecte: 0, total: 0 })
      setVerdict(null)
      // pasul din adresa se foloseste o singura data, la prima rulare
      const nou = Math.min(pasDorit ?? pasCerut.current, rez.pasi.length - 1)
      setK(nou)
      // o rulare noua porneste cu intrebarea primului pas; un pas cerut anume se arata intreg
      if (pasDorit === undefined) setAscuns(nou === 0 && cuIntrebari.current && !!rez.pasi[0].intrebare)
      // la schimbarea limbii textul din editor poate fi altul decat cel rulat: semnul ramane doar unde are ce ascunde
      else setAscuns((a) => a && !!rez.pasi[nou].intrebare)
      pasCerut.current = 0
    } catch (e) {
      setRulare(null)
      setAscuns(false)
      setEroare({ linie: e instanceof EroareSintaxa ? e.linie : null, mesaj: e instanceof Error ? e.message : String(e) })
    }
  }, [])

  // la alt algoritm se ruleaza de la inceput; la alta limba se ruleaza din nou, pastrand pasul
  useEffect(() => {
    const acelasi = idAnterior.current === id
    idAnterior.current = id
    // pseudocodul din biblioteca, needitat, trece in limba noua
    const s = alg && eSursa(alg, sursa) ? sursaIn(alg, limba) : sursa
    if (s !== sursa) setSursa(s)
    ruleaza(s, definitii, acelasi ? k : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, limba, ruleaza])

  // adresa tine algoritmul, limba, tema si precizia, ca o reincarcare sa pastreze ce s-a ales
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    p.set('algoritm', id)
    p.set('limba', limba)
    p.set('tema', tema === 'intunecat' ? 'dark' : 'light')
    if (cifre > 0) p.set('cifre', String(cifre))
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

  const alege = (nou: string) => {
    setId(nou)
    if (nou === PROPRIU) {
      const s = incarcaPropriu(limba)
      setSursa(s.sursa)
      setDefinitii(s.definitii)
      return
    }
    const a = algoritm(nou)!
    setSursa(sursaIn(a, limba))
    // cu "pastreaza", intrarile raman cand noul algoritm are aceleasi nume si tipuri, si precizia la fel
    const potrivite = pastreaza && a.intrari.every((i) => definitii.some((d) => d.nume.trim() === i.nume && d.tip === i.tip))
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

  // ultimul pas care scrie fiecare celula: inainte de el celula e „scris”, dupa el „gata” sau „mult”
  const ultimaScriere = useMemo(() => {
    const m = new Map<string, { idx: number; mult: boolean }>()
    rez?.pasi.forEach((p, idx) => {
      for (const c of p.celule) if (c.rol === 'scris') m.set(`${c.nume}:${c.i}:${c.j ?? 1}`, { idx, mult: !!c.mult })
    })
    return m
  }, [rez])

  const finale = useMemo(() => {
    const gata = new Map<string, Set<string>>()
    const mult = new Map<string, Set<string>>()
    for (const [cheie, u] of ultimaScriere) {
      if (u.idx >= k) continue
      const [nume, i, j] = cheie.split(':')
      const tinta = u.mult ? mult : gata
      if (!tinta.has(nume)) tinta.set(nume, new Set())
      tinta.get(nume)!.add(`${i}:${j}`)
    }
    return { gata, mult }
  }, [ultimaScriere, k])

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
    const toate = (rez?.pasi ?? []).flatMap((p, idx) => (p.iteratie ? [{ ...p.iteratie, pas: idx }] : []))
    // o bucla interioara reia numaratoarea; se pastreaza prima parcurgere a primei bucle
    const prima = toate.filter((p) => p.linie === toate[0]?.linie)
    const reluare = prima.findIndex((p, i) => i > 0 && p.iter === 0)
    return reluare < 0 ? prima : prima.slice(0, reluare)
  }, [rez])
  const vazute = iteratii.filter((p) => p.pas <= k).length

  const variabile = useMemo(() => (rulare ? variabilePeLinie(rulare.program) : new Map<number, string[]>()), [rulare])
  // langa linia curenta stau valorile cu care se calculeaza: scalarul scris apare cu valoarea veche
  const inainteDePas = (nume: string): number | undefined => (pas?.scalarScris?.nume === nume ? pas.scalarScris.vechi : pas?.scalari[nume])
  const anotare =
    pas && pas.linie > 0
      ? (variabile.get(pas.linie) ?? [])
          .map((v) => [v, inainteDePas(v)] as const)
          .filter((x): x is readonly [string, number] => x[1] !== undefined)
          .map(([v, val]) => `${v} = ${fmtCelula(val)}`)
          .join(', ')
      : ''

  const intrariScalare = new Set(definitii.filter((d) => d.tip === 'scalar').map((d) => d.nume.trim()))
  const scalari = pas ? Object.entries(pas.scalari).filter(([n]) => n !== 'n' && n !== 'm' && !intrariScalare.has(n)) : []
  // prima propozitie spune locul din curs; restul, ce difera aici fata de slide, se deschide la cerere
  const [locCurs, ...restCurs] = alg ? alg.curs[limba].split(/(?<=\.) (?=\p{Lu})/u) : []
  const paleta = PALETA[tema]
  const celuleTotal = tablouri.reduce((s, [, t]) => s + t.d.length, 0)
  const animat = celuleTotal <= CELULE_ANIMATE
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

  return (
    <div className="aplicatie">
      <header>
        <h1>{t('titlu')}</h1>
        <label>
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
            <option value={PROPRIU}>{t('propriu')}</option>
          </select>
        </label>
        <button type="button" className="principal" title={t('ruleazaScurt')} onClick={() => ruleaza(sursa, definitii)}>
          {t('ruleaza')}
        </button>
        <button type="button" className="preferinta" title={t('schimbaTema')} onClick={() => setTema(tema === 'intunecat' ? 'luminos' : 'intunecat')}>
          {tema === 'intunecat' ? t('temaLuminoasa') : t('temaIntunecata')}
        </button>
        <button type="button" className="preferinta" title={t('schimbaLimba')} onClick={() => setLimba(limba === 'ro' ? 'en' : 'ro')}>
          {limba === 'ro' ? 'EN' : 'RO'}
        </button>
      </header>

      <section className="stanga">
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
              <button key={x} type="button" className="chip" onClick={() => setNotiuneAleasa({ id: x, cerere: Date.now() })}>
                {notiune(x)?.titlu[limba] ?? x}
              </button>
            ))}
          </p>
        )}
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
        <div className="titlu-intrari">
          <h2>{t('intrari')}</h2>
          {alg && (
            <label className="bifa" title={t('pastreazaAjutor')}>
              <input type="checkbox" checked={pastreaza} onChange={(e) => setPastreaza(e.target.checked)} />
              {t('pastreaza')}
            </label>
          )}
        </div>
        <Intrari
          definitii={definitii}
          cerute={alg?.intrari ?? []}
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
        <CodPython
          nume={alg ? alg.id : 'program'}
          sursa={sursa}
          definitii={definitii}
          // lista de iesiri si forma patrata sunt ale pseudocodului din biblioteca, nu ale unuia editat
          iesiri={alg && eSursa(alg, sursa) ? alg.iesiri : undefined}
          patrata={!!alg && eSursa(alg, sursa) && estePatrata(alg.intrari.find((i) => i.tip === 'matrice')?.natura)}
          numpy={alg && eSursa(alg, sursa) && alg.intrari.every((i) => definitii.some((d) => d.nume.trim() === i.nume && d.tip === i.tip)) ? alg.numpy : undefined}
          cifre={cifre}
        />
        <Notiuni tinta={notiuneAleasa?.id ?? null} cerere={notiuneAleasa?.cerere ?? 0} />
      </section>

      <section className="dreapta">
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
        {!animat && <p className="ajutor matrice-mare">{t('matriceMare', CELULE_ANIMATE)}</p>}
        <div className="grile">
          {tablouri.map(([nume, tablou]) => (
            <Grila
              key={nume}
              nume={nume}
              tablou={tablou}
              celule={pas?.celule ?? []}
              gata={finale.gata.get(nume)}
              mult={finale.mult.get(nume)}
              zerouri={zerouri?.tablou === nume ? zerouri.set : undefined}
              pasIdx={k}
              fel={pas?.fel}
              intrebare={ascuns}
              durata={durata}
              animat={animat}
            />
          ))}
        </div>
        {/* in timpul redarii cititorul de ecran nu e intrerupt la fiecare pas */}
        <div className="pas" aria-live={redare ? 'off' : 'polite'} aria-atomic="true">
          {pas && (
            <p className="stare">
              {t('pasul', k + 1, total)}
              {pas.linie > 0 && <> · {t('linia', pas.linie)}</>} · {nrFlopi(limba, pas.flopi)}
              {rulare && rulare.cifre > 0 && <> · {t('cuCifre', rulare.cifre)}</>}
              {scalari.length > 0 && (
                <>
                  {' · '}
                  {scalari.map(([nume, v], idx) => (
                    <span key={nume}>
                      {idx > 0 && ' '}
                      <code>
                        {nume} = {ascuns && pas.scalarScris?.nume === nume ? '?' : fmtCelula(v)}
                        {idx < scalari.length - 1 && ','}
                      </code>
                    </span>
                  ))}
                </>
              )}
            </p>
          )}
          <Formula tex={ascuns ? pas?.intrebare : pas?.formula} />
          {ascuns && (
            <button type="button" className="mic arata" onClick={inainte}>
              {t('arataRezultatul')}
            </button>
          )}
          {dorit !== null && (
            <Raspuns
              key={k}
              dorit={dorit}
              scor={scor}
              onRaspuns={(corect) => {
                setScor((s) => ({ corecte: s.corecte + (corect ? 1 : 0), total: s.total + 1 }))
                setVerdict({ k, corect })
                setAscuns(false)
              }}
            />
          )}
          {verdict?.k === k && !ascuns && (
            <p className={`verdict ${verdict.corect ? 'corect' : 'gresit'}`} role="status">
              {verdict.corect ? t('raspunsCorect') : t('raspunsGresit')} {t('scor', scor.corecte, scor.total)}
            </p>
          )}
          {pas?.mesaj && <p className={`mesaj ${pas.final ?? ''}`}>{pas.mesaj}</p>}
          <OperatiiPas operatii={pas?.operatii} />
        </div>
        <Comenzi
          k={k}
          total={total}
          poateInapoi={k > 0 || (!ascuns && intrebari && !!pas?.intrebare)}
          poateInainte={k < total - 1 || ascuns}
          redare={redare}
          viteza={viteza}
          intrebari={intrebari}
          onK={(x) => mergi(x, x === 0)}
          onInainte={inainte}
          onInapoi={inapoi}
          onScriere={laScriere}
          onRedare={porneste}
          onViteza={setViteza}
          onIntrebari={setIntrebari}
        />
        <p className="ajutor comenzi-ajutor">{t('comenziAjutor')}</p>
        <ul className="legenda" aria-label={t('legenda')}>
          {(['pivot', 'scris', 'citit', 'gata', 'mult'] as const).map((rol) => (
            <li key={rol}>
              <span className={`celula rol-${rol}`} style={{ backgroundColor: paleta[rol] }} aria-hidden="true" />
              {rol === 'pivot' ? t('legendaPivot') : rol === 'scris' ? t('legendaScris') : rol === 'citit' ? t('legendaCitit') : rol === 'gata' ? t('legendaGata') : t('legendaMult')}
            </li>
          ))}
          {zerouri && (
            <li>
              <span className="celula rol-neatins zero-stiut" style={{ backgroundColor: paleta.neatins }} aria-hidden="true" />
              {t('legendaZero')}
            </li>
          )}
        </ul>
        <Convergenta puncte={iteratii} vazute={vazute} onPas={(x) => mergi(x)} nota={nota} />
        {alg && dinBiblioteca && rulare && areGeometrie(alg.id, rulare.intrari) && <Geometrie id={alg.id} rez={rulare.rez} intrari={rulare.intrari} k={k} ascuns={ascuns} />}
        <OperatiiAlgoritm forma={dinBiblioteca ? alg?.forma : undefined} etape={etape} linie={pas && pas.linie > 0 ? pas.linie : null} />
        {alg && areVerificare(alg.id) && (
          <Verificare randuri={verificari} stare={rulare?.rez.final !== 'gata' ? 'oprit' : k === total - 1 ? 'gata' : 'inainte'} cifre={rulare?.cifre ?? 0} />
        )}
      </section>
    </div>
  )
}
