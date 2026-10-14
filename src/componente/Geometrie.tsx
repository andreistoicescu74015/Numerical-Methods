import type { CheieText } from '../i18n'
import type { Intrari, Rezultat } from '../motor/interpretor'
import { usePreferinte } from '../preferinte'

// Vederea geometrica pentru doua necunoscute: ecuatiile ca drepte si drumul aproximarilor
// (Jacobi, Gauss-Seidel, Kaczmarz), vectorul metodei puterii pe cercul unitate, reflexia lui RFG.

type Punct = [number, number]

interface Props {
  id: string
  rez: Rezultat
  intrari: Intrari
  k: number
  // rezultatul pasului curent e ascuns: punctul lui nu se arata inca
  ascuns: boolean
}

const L = 360
const H = 300

// valorile vectorului `nume` dupa fiecare pas care il schimba
function drum(rez: Rezultat, nume: string, start: number[]): { pas: number; v: number[] }[] {
  let v = [...start]
  const rezultat = [{ pas: -1, v: [...v] }]
  rez.pasi.forEach((p, idx) => {
    let schimbat = false
    const nou = p.noi?.[nume]?.nou
    if (nou) {
      v = [...nou.d]
      schimbat = true
    }
    for (const w of p.scrieri)
      if (w.nume === nume) {
        v[w.i - 1] = w.nou
        schimbat = true
      }
    if (schimbat) rezultat.push({ pas: idx, v: [...v] })
  })
  return rezultat
}

// solutia in sensul celor mai mici patrate a unui sistem cu doua necunoscute: AᵀA x = Aᵀb
function solutie(A: number[][], b: number[]): Punct | null {
  let [a, c, d, e, f] = [0, 0, 0, 0, 0]
  A.forEach((l, i) => {
    a += l[0] * l[0]
    c += l[0] * l[1]
    d += l[1] * l[1]
    e += l[0] * b[i]
    f += l[1] * b[i]
  })
  const det = a * d - c * c
  if (Math.abs(det) < 1e-12 * Math.max(1, a * d)) return null
  return [(d * e - c * f) / det, (a * f - c * e) / det]
}

// directiile vectorilor proprii reali ai unei matrice 2 x 2, cea dominanta prima
function proprii(A: number[][]): Punct[] {
  const [[p, q], [r, s]] = A
  const urma = p + s
  const disc = urma * urma - 4 * (p * s - q * r)
  if (disc < 0) return []
  const lambdas = [(urma + Math.sqrt(disc)) / 2, (urma - Math.sqrt(disc)) / 2].sort((x, y) => Math.abs(y) - Math.abs(x))
  return lambdas.map((l) => {
    const v: Punct = Math.abs(q) > 1e-12 ? [q, l - p] : Math.abs(r) > 1e-12 ? [l - s, r] : Math.abs(l - p) < 1e-12 ? [1, 0] : [0, 1]
    const n = Math.hypot(v[0], v[1])
    return [v[0] / n, v[1] / n]
  })
}

// capetele dreptei a·x = b in dreptunghiul [x0, x1] x [y0, y1]
function segment(a: Punct, b: number, x0: number, x1: number, y0: number, y1: number): [Punct, Punct] | null {
  const puncte: Punct[] = []
  if (Math.abs(a[1]) > 1e-12)
    for (const x of [x0, x1]) {
      const y = (b - a[0] * x) / a[1]
      if (y >= y0 - 1e-9 && y <= y1 + 1e-9) puncte.push([x, y])
    }
  if (Math.abs(a[0]) > 1e-12)
    for (const y of [y0, y1]) {
      const x = (b - a[1] * y) / a[0]
      if (x >= x0 - 1e-9 && x <= x1 + 1e-9) puncte.push([x, y])
    }
  return puncte.length >= 2 ? [puncte[0], puncte[puncte.length - 1]] : null
}

export function areGeometrie(id: string, intrari: Intrari): boolean {
  const A = intrari.A
  const mat = Array.isArray(A) && Array.isArray(A[0]) ? (A as number[][]) : null
  if (id === 'JACOBI' || id === 'GS' || id === 'KACZMARZ') return !!mat && mat[0].length === 2
  if (id === 'MP') return !!mat && mat.length === 2 && mat[0].length === 2
  if (id === 'RFG') return Array.isArray(intrari.x) && (intrari.x as number[]).length === 2 && intrari.k === 1
  return false
}

const fmt = (x: number) => String(Number(x.toPrecision(3)))

export function Geometrie({ id, rez, intrari, k, ascuns }: Props) {
  const { t } = usePreferinte()
  const vizibil = (pas: number) => pas < k || (pas === k && !ascuns)

  let puncte: Punct[] = []
  let drepte: { a: Punct; b: number; eticheta: string }[] = []
  let sol: Punct | null = null
  let directii: Punct[] = []
  let sageti: { spre: Punct; clasa: string; eticheta: string }[] = []
  let oglinda: Punct | null = null
  let text: CheieText = 'geometrieJacobi'

  if (id === 'MP') {
    const A = intrari.A as number[][]
    puncte = drum(rez, 'y', intrari.y as number[])
      .filter((x) => vizibil(x.pas))
      .map((x) => {
        const n = Math.hypot(x.v[0], x.v[1]) || 1
        return [x.v[0] / n, x.v[1] / n] as Punct
      })
    directii = proprii(A)
    text = 'geometrieMP'
  } else if (id === 'RFG') {
    const x = intrari.x as number[]
    const sigma = (x[0] >= 0 ? 1 : -1) * Math.hypot(x[0], x[1])
    sageti = [{ spre: [x[0], x[1]], clasa: 'intrare', eticheta: 'x' }]
    // imaginea si oglinda apar dupa ce algoritmul a calculat β, adica reflectorul
    const calculat = rez.pasi.findIndex((p) => p.scalari['β'] !== undefined && p.scalari['β'] !== 0)
    if (calculat >= 0 && vizibil(calculat) && sigma !== 0) {
      sageti.push({ spre: [-sigma, 0], clasa: 'imagine', eticheta: 'U₁x' })
      // dreapta fata de care se face reflexia este perpendiculara pe u = x + σ e₁
      oglinda = [x[0] + sigma, x[1]]
    }
    text = 'geometrieRFG'
  } else {
    const A = intrari.A as number[][]
    const b = intrari.b as number[]
    drepte = A.map((l, i) => ({ a: [l[0], l[1]] as Punct, b: b[i], eticheta: `${i + 1}` }))
    sol = solutie(A, b)
    puncte = drum(rez, 'x', intrari.x as number[])
      .filter((x) => vizibil(x.pas))
      .map((x) => [x.v[0], x.v[1]] as Punct)
    text = id === 'GS' ? 'geometrieGS' : id === 'KACZMARZ' ? 'geometrieKaczmarz' : 'geometrieJacobi'
  }

  // Cadrul: in jurul solutiei (sau al pornirii), cat sa cuprinda pornirea; o aproximare care
  // diverge ar strange altfel tot desenul intr-un punct. Punctele mai departe ies din cadru.
  const centru: Punct = sol ?? puncte[0] ?? [0, 0]
  const departe = (p: Punct) => Math.hypot(p[0] - centru[0], p[1] - centru[1])
  const reper = Math.max(1, puncte.length > 0 ? departe(puncte[0]) : 1)
  const inCadru = puncte.filter((p) => departe(p) <= 4 * reper)
  // aceeasi scara pe ambele axe, ca unghiurile drepte sa ramana drepte (proiectiile Kaczmarz)
  const toate: Punct[] = [...inCadru, ...(sol ? [sol] : []), ...sageti.map((s) => s.spre), [0, 0]]
  if (id === 'MP') toate.push([-1, -1], [1, 1])
  const xs = toate.map((p) => p[0])
  const ys = toate.map((p) => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const raza = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-9) * 0.6 + (id === 'MP' ? 0.15 : 0)
  const scara = Math.min(L, H) / (2 * raza)
  const [x0, x1, y0, y1] = [cx - L / (2 * scara), cx + L / (2 * scara), cy - H / (2 * scara), cy + H / (2 * scara)]
  const X = (x: number) => (x - x0) * scara
  const Y = (y: number) => H - (y - y0) * scara

  const curent = puncte.at(-1)
  const descriere = curent ? t('geometrieDescriere', fmt(curent[0]), fmt(curent[1])) : t(text)
  const iese = (p: Punct) => p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1
  // un punct din afara cadrului se deseneaza pe margine, in directia lui
  const peMargine = (p: Punct): Punct => {
    if (!iese(p)) return p
    const d: Punct = [p[0] - cx, p[1] - cy]
    const f = Math.min((x1 - cx) / Math.abs(d[0] || 1e-300), (y1 - cy) / Math.abs(d[1] || 1e-300)) * 0.97
    return [cx + d[0] * f, cy + d[1] * f]
  }
  const curentAfara = id !== 'MP' && !!curent && iese(curent)

  return (
    <section className="geometrie">
      <h2>{t('geometrie')}</h2>
      <p className="ajutor">{t(text)}</p>
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label={descriere}>
        {/* axele */}
        {y0 < 0 && y1 > 0 && <line className="axa" x1={0} x2={L} y1={Y(0)} y2={Y(0)} />}
        {x0 < 0 && x1 > 0 && <line className="axa" x1={X(0)} x2={X(0)} y1={0} y2={H} />}
        <text className="gradatie" x={L - 4} y={Math.min(Math.max(Y(0) - 6, 12), H - 4)} textAnchor="end">
          x₁
        </text>
        <text className="gradatie" x={Math.min(Math.max(X(0) + 6, 4), L - 20)} y={12}>
          x₂
        </text>
        {id === 'MP' && <circle className="cerc" cx={X(0)} cy={Y(0)} r={scara} />}
        {directii.map((d, i) => (
          <line key={i} className={i === 0 ? 'propriu' : 'propriu al-doilea'} x1={X(-1.3 * d[0])} y1={Y(-1.3 * d[1])} x2={X(1.3 * d[0])} y2={Y(1.3 * d[1])} />
        ))}
        {drepte.map((d) => {
          const s = segment(d.a, d.b, x0, x1, y0, y1)
          if (!s) return null
          // eticheta la capatul dreptei, pe margine, departe de solutie si de drumul din mijloc;
          // capatul ales este cel mai departe de solutie
          const [a, b] = sol && Math.hypot(s[1][0] - sol[0], s[1][1] - sol[1]) < Math.hypot(s[0][0] - sol[0], s[0][1] - sol[1]) ? [s[1], s[0]] : s
          const [ax, ay, bx, by] = [X(a[0]), Y(a[1]), X(b[0]), Y(b[1])]
          const lung = Math.hypot(bx - ax, by - ay) || 1
          const ex = bx - ((bx - ax) / lung) * 22
          const ey = by - ((by - ay) / lung) * 22
          return (
            <g key={d.eticheta}>
              <line className="dreapta" x1={ax} y1={ay} x2={bx} y2={by} />
              <text className="gradatie eticheta-dreapta" x={Math.min(Math.max(ex, 18), L - 34)} y={Math.min(Math.max(ey - 6, 26), H - 8)}>
                {t('ecuatia', d.eticheta)}
              </text>
            </g>
          )
        })}
        {oglinda &&
          (() => {
            // directia oglinzii, perpendiculara pe u, cu lungimea cat sa treaca de marginile desenului
            const n = Math.hypot(oglinda[0], oglinda[1])
            const d: Punct = [(-oglinda[1] / n) * 3 * raza, (oglinda[0] / n) * 3 * raza]
            return <line className="oglinda" x1={X(-d[0])} y1={Y(-d[1])} x2={X(d[0])} y2={Y(d[1])} />
          })()}
        {sageti.map((s) => (
          <g key={s.eticheta}>
            <line className={`sageata ${s.clasa}`} x1={X(0)} y1={Y(0)} x2={X(s.spre[0])} y2={Y(s.spre[1])} />
            <circle className={`varf ${s.clasa}`} cx={X(s.spre[0])} cy={Y(s.spre[1])} r={4} />
            <text className="eticheta" x={X(s.spre[0]) + 8} y={Y(s.spre[1]) - 6}>
              {s.eticheta}
            </text>
          </g>
        ))}
        {id === 'MP'
          ? puncte.map((p, i) => <line key={i} className={i === puncte.length - 1 ? 'sageata curent' : 'sageata veche'} x1={X(0)} y1={Y(0)} x2={X(p[0])} y2={Y(p[1])} />)
          : puncte.length > 1 && <polyline className="drum" points={puncte.map((p) => peMargine(p)).map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')} />}
        {sol && <circle className="solutie" cx={X(sol[0])} cy={Y(sol[1])} r={7} />}
        {id !== 'MP' &&
          puncte.map((p, i) => {
            const q = peMargine(p)
            const ultim = i === puncte.length - 1
            // un punct din afara cadrului apare pe margine ca un patrat gol
            return iese(p) ? (
              <rect key={i} className={ultim ? 'punct curent afara' : 'punct afara'} x={X(q[0]) - 4} y={Y(q[1]) - 4} width={8} height={8} />
            ) : (
              <circle key={i} className={ultim ? 'punct curent' : 'punct'} cx={X(q[0])} cy={Y(q[1])} r={ultim ? 5 : 3} />
            )
          })}
      </svg>
      {curentAfara && curent && (
        <p className="ajutor afara" role="status">
          {t('geometrieAfara', fmt(curent[0]), fmt(curent[1]))}
        </p>
      )}
      <ul className="legenda-geometrie">
        {id === 'MP' ? (
          <>
            <li>
              <span className="mostra propriu" aria-hidden="true" /> {t('legendaPropriuDominant')}
            </li>
            <li>
              <span className="mostra curent" aria-hidden="true" /> {t('legendaYCurent')}
            </li>
          </>
        ) : id === 'RFG' ? (
          <li>
            <span className="mostra oglinda" aria-hidden="true" /> {t('legendaOglinda')}
          </li>
        ) : (
          <>
            <li>
              <span className="mostra dreapta" aria-hidden="true" /> {t('legendaDreapta')}
            </li>
            <li>
              <span className="mostra curent" aria-hidden="true" /> {t('legendaXCurent')}
            </li>
            {sol && (
              <li>
                <span className="mostra solutie" aria-hidden="true" /> {t('legendaSolutie', fmt(sol[0]), fmt(sol[1]))}
              </li>
            )}
          </>
        )}
      </ul>
    </section>
  )
}
