import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CodPython } from './componente/CodPython'
import { Comenzi } from './componente/Comenzi'
import { Editor } from './componente/Editor'
import { Formula } from './componente/Formula'
import { Grila, PALETA, fmtCelula } from './componente/Grila'
import { Intrari } from './componente/Intrari'
import { Notiuni } from './componente/Notiuni'
import { Verificare } from './componente/Verificare'
import { text } from './i18n'
import { definitiiDin, intrariDinDefinitii, type Definitie } from './intrari'
import { variabilePeLinie } from './motor/analiza'
import { EroareSintaxa, type Program } from './motor/ast'
import { BIBLIOTECA, algoritm } from './motor/biblioteca'
import { stareLa, urma, type Intrari as IntrariMotor, type Pas, type Rezultat } from './motor/interpretor'
import type { Limba } from './motor/mesaje'
import { parseaza } from './motor/parser'
import { areVerificare, verifica } from './motor/verificare'
import { notiune } from './notiuni'
import { Preferinte, usePreferinte } from './preferinte'

// Modul fara algoritm predefinit: pseudocodul si intrarile tale, pastrate in localStorage.
const PROPRIU = 'propriu'
const CHEIE_PROPRIU = 'mn.propriu'
// peste atatea celule, grilele se deseneaza fara animatii
const CELULE_ANIMATE = 150

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
  return { sursa: text(limba, 'propriuSablon'), definitii: [{ nume: 'A', tip: 'matrice', text: '1 2 1\n2 1 2\n1 1 2' }] }
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

interface Rulare {
  rez: Rezultat
  intrari: IntrariMotor
  program: Program
}

export default function App() {
  return (
    <Preferinte>
      <Continut />
    </Preferinte>
  )
}

function Continut() {
  const { limba, tema, t, setLimba, setTema } = usePreferinte()
  const [id, setId] = useState(idInitial)
  const alg = id === PROPRIU ? null : (algoritm(id) ?? null)
  const [sursa, setSursa] = useState(() => (alg ? alg.sursa : incarcaPropriu(limba).sursa))
  const [definitii, setDefinitii] = useState<Definitie[]>(() => (alg ? definitiiDin(alg) : incarcaPropriu(limba).definitii))
  const [rulare, setRulare] = useState<Rulare | null>(null)
  const [eroare, setEroare] = useState<Eroare | null>(null)
  const [k, setK] = useState(0)
  const [redare, setRedare] = useState(false)
  const [viteza, setViteza] = useState(2)
  const [notiuneAleasa, setNotiuneAleasa] = useState<{ id: string; cerere: number } | null>(() => {
    const ceruta = new URLSearchParams(window.location.search).get('notiune')
    return ceruta && notiune(ceruta) ? { id: ceruta, cerere: 1 } : null
  })
  const pasCerut = useRef(pasInitial())
  const idAnterior = useRef<string | null>(null)

  const ruleaza = useCallback((textSursa: string, defs: Definitie[], pasDorit?: number) => {
    setRedare(false)
    try {
      const program = parseaza(textSursa)
      const intrari = intrariDinDefinitii(defs)
      const rez = urma(program, intrari, { culori: true })
      setRulare({ rez, intrari, program })
      setEroare(null)
      // pasul din adresa se foloseste o singura data, la prima rulare
      setK(Math.min(pasDorit ?? pasCerut.current, rez.pasi.length - 1))
      pasCerut.current = 0
    } catch (e) {
      setRulare(null)
      setEroare({ linie: e instanceof EroareSintaxa ? e.linie : null, mesaj: e instanceof Error ? e.message : String(e) })
    }
  }, [])

  // la alt algoritm se ruleaza de la inceput; la alta limba se ruleaza din nou, pastrand pasul
  useEffect(() => {
    const acelasi = idAnterior.current === id
    idAnterior.current = id
    ruleaza(sursa, definitii, acelasi ? k : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, limba, ruleaza])

  useEffect(() => {
    if (id === PROPRIU) localStorage.setItem(CHEIE_PROPRIU, JSON.stringify({ sursa, definitii }))
  }, [id, sursa, definitii])

  const alege = (nou: string) => {
    setId(nou)
    if (nou === PROPRIU) {
      const s = incarcaPropriu(limba)
      setSursa(s.sursa)
      setDefinitii(s.definitii)
      return
    }
    const a = algoritm(nou)!
    setSursa(a.sursa)
    setDefinitii(definitiiDin(a))
  }

  const rez = rulare?.rez ?? null
  const total = rez?.pasi.length ?? 0
  const pas = rez?.pasi[k]
  const stare = useMemo(() => (rez ? stareLa(rez, k) : {}), [rez, k])

  useEffect(() => {
    if (!redare) return
    if (k >= total - 1) {
      setRedare(false)
      return
    }
    const factor = (pas && RITM[pas.fel]) ?? 1
    const timer = setTimeout(() => setK((x) => Math.min(x + 1, total - 1)), (1000 / viteza) * factor)
    return () => clearTimeout(timer)
  }, [redare, k, total, viteza, pas])

  // urmatorul sau precedentul pas care schimba ceva in grile
  const laScriere = useCallback(
    (directie: 1 | -1) => {
      if (!rez) return
      setK((x) => {
        for (let s = x + directie; s >= 0 && s < rez.pasi.length; s += directie) if (cuScriere(rez.pasi[s])) return s
        return directie > 0 ? rez.pasi.length - 1 : 0
      })
    },
    [rez],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tinta = e.target as HTMLElement
      if (tinta.closest('.editor, textarea, input, select')) return
      if (e.key === 'ArrowRight') {
        if (e.shiftKey) laScriere(1)
        else setK((x) => Math.min(x + 1, total - 1))
      } else if (e.key === 'ArrowLeft') {
        if (e.shiftKey) laScriere(-1)
        else setK((x) => Math.max(x - 1, 0))
      } else if (e.key === 'Home') setK(0)
      else if (e.key === 'End') setK(Math.max(total - 1, 0))
      else if (e.key === ' ') setRedare((r) => !r)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, laScriere])

  const porneste = (r: boolean) => {
    if (r && k >= total - 1) setK(0)
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

  const verificari = useMemo(() => (alg && rulare && rulare.rez.final === 'gata' ? verifica(alg.id, rulare.intrari, rulare.rez.stare, rulare.rez.scalari) : []), [alg, rulare])

  const variabile = useMemo(() => (rulare ? variabilePeLinie(rulare.program) : new Map<number, string[]>()), [rulare])
  const fmtScalar = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(4))))
  const anotare = pas && pas.linie > 0 ? (variabile.get(pas.linie) ?? []).filter((v) => v in pas.scalari).map((v) => `${v} = ${fmtScalar(pas.scalari[v])}`).join(', ') : ''

  const intrariScalare = new Set(definitii.filter((d) => d.tip === 'scalar').map((d) => d.nume.trim()))
  const scalari = pas ? Object.entries(pas.scalari).filter(([n]) => n !== 'n' && n !== 'm' && !intrariScalare.has(n)) : []
  const descrieri = alg ? Object.fromEntries(alg.intrari.map((i) => [i.nume, i.descriere[limba]])) : {}
  const paleta = PALETA[tema]
  const celuleTotal = tablouri.reduce((s, [, t]) => s + t.d.length, 0)
  const animat = celuleTotal <= CELULE_ANIMATE
  const durata = Math.min(0.35, 0.6 / viteza)
  const linieEroare = eroare?.linie ?? (rez?.final === 'eroare' && k === total - 1 && pas ? pas.linie : null)

  return (
    <div className="aplicatie">
      <header>
        <h1>{t('titlu')}</h1>
        <label>
          {t('algoritm')}
          <select value={id} onChange={(e) => alege(e.target.value)}>
            {BIBLIOTECA.map((a) => (
              <option key={a.id} value={a.id}>
                {a.titlu[limba]}
              </option>
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
            </span>
          )}
        </p>
        {alg && alg.notiuni.length > 0 && (
          <p className="etichete">
            <span>{t('notiuniNecesare')}</span>
            {alg.notiuni.map((n) => (
              <button key={n} type="button" className="chip" onClick={() => setNotiuneAleasa({ id: n, cerere: Date.now() })}>
                {notiune(n)?.titlu[limba] ?? n}
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
          <p className="eroare">
            {eroare.linie ? `${t('linia', eroare.linie)}: ` : ''}
            {eroare.mesaj}
          </p>
        )}
        <h2>{t('intrari')}</h2>
        <Intrari definitii={definitii} descrieri={descrieri} onChange={setDefinitii} />
        <CodPython nume={alg ? alg.id : 'program'} sursa={sursa} definitii={definitii} />
        <Notiuni tinta={notiuneAleasa?.id ?? null} cerere={notiuneAleasa?.cerere ?? 0} />
      </section>

      <section className="dreapta">
        {!animat && <p className="ajutor">{t('matriceMare', CELULE_ANIMATE)}</p>}
        <div className="grile">
          {tablouri.map(([nume, tablou]) => (
            <Grila
              key={nume}
              nume={nume}
              tablou={tablou}
              celule={pas?.celule ?? []}
              gata={finale.gata.get(nume)}
              mult={finale.mult.get(nume)}
              pasIdx={k}
              fel={pas?.fel}
              durata={durata}
              animat={animat}
            />
          ))}
        </div>
        <div className="pas">
          {pas && (
            <p className="stare">
              {t('pasul', k + 1, total)}
              {pas.linie > 0 && <> · {t('linia', pas.linie)}</>} · {t('flopi', pas.flopi)}
              {scalari.length > 0 && (
                <>
                  {' · '}
                  {scalari.map(([n, v]) => (
                    <code key={n}>
                      {n} = {fmtCelula(v)}
                    </code>
                  ))}
                </>
              )}
            </p>
          )}
          <Formula tex={pas?.formula} />
          {pas?.mesaj && <p className={`mesaj ${pas.final ?? ''}`}>{pas.mesaj}</p>}
        </div>
        <Comenzi k={k} total={total} redare={redare} viteza={viteza} onK={setK} onScriere={laScriere} onRedare={porneste} onViteza={setViteza} />
        <ul className="legenda">
          {(['pivot', 'scris', 'citit', 'gata', 'mult'] as const).map((rol) => (
            <li key={rol}>
              <span style={{ background: paleta[rol].fond, borderColor: paleta[rol].text }} />
              {rol === 'pivot' ? t('legendaPivot') : rol === 'scris' ? t('legendaScris') : rol === 'citit' ? t('legendaCitit') : rol === 'gata' ? t('legendaGata') : t('legendaMult')}
            </li>
          ))}
        </ul>
        {alg && areVerificare(alg.id) && (
          <Verificare randuri={verificari} stare={rulare?.rez.final !== 'gata' ? 'oprit' : k === total - 1 ? 'gata' : 'inainte'} />
        )}
      </section>
    </div>
  )
}
