import { useMemo, useState } from 'react'
import { numeScurt } from '../comparatie'
import { DIMENSIUNI, costuriPeN, cuLiniaInPlus, perecheCost } from '../costuri'
import type { CheieText } from '../i18n'
import type { Algoritm } from '../motor/biblioteca'
import type { Intrari } from '../motor/interpretor'
import { usePreferinte } from '../preferinte'
import { fmtNumar, gradatii, useLatime } from './Convergenta'

interface Props {
  alg: Algoritm
  intrari: Intrari
  // calculul ruleaza algoritmul de sapte ori: se face doar cu panoul deschis
  deschis: boolean
}

const H = 230
const M = { sus: 16, jos: 36, stanga: 58, dreapta: 96 }

// ce spune cursul sau cartea despre perechea comparata
const NOTE: Record<string, CheieText> = { CHOL: 'costNNotaCHOL', QR: 'costNNotaQR', Gb: 'costNNotaBanda', GPPb: 'costNNotaBanda', UTRISb: 'costNNotaUTRISb' }

// Etichetele de la capatul curbelor, departate pe verticala cu cel putin 14 px, in ordinea
// pozitiilor lor; intoarce pozitiile in ordinea data.
function despartite(ys: number[]): number[] {
  const ordine = ys.map((y, k) => ({ y, k })).sort((a, b) => a.y - b.y)
  for (let i = 1; i < ordine.length; i++) if (ordine[i].y < ordine[i - 1].y + 14) ordine[i].y = ordine[i - 1].y + 14
  const rez = [...ys]
  for (const o of ordine) rez[o.k] = o.y
  return rez
}

// Flopii numarati pentru n de la 2 la 8 (puncte, seria) langa formula de cost din curs (linie
// intrerupta, referinta) si, pentru perechile pe care le compara cursul, flopii algoritmului
// pereche la acelasi n (a doua serie), cu legenda, etichete la capat, indiciu la trecerea cu
// mouse-ul si tabel cu raportul.
export function CostPeN({ alg, intrari, deschis }: Props) {
  const { t, limba } = usePreferinte()
  const [peste, setPeste] = useState<number | null>(null)
  const [ref, L] = useLatime()
  const puncte = useMemo(() => (deschis ? costuriPeN(alg, intrari) : []), [deschis, alg, intrari])
  if (!deschis || puncte.length < 2) return null

  const pereche = perecheCost(alg)
  const cuPereche = !!pereche && puncte.every((p) => p.pereche !== undefined)
  const numePereche = pereche ? numeScurt(pereche, limba) : ''
  const n0 = DIMENSIUNI[0]
  const n1 = DIMENSIUNI.at(-1)!
  const maxim = Math.max(...puncte.flatMap((p) => [p.flopi, p.formula, cuPereche ? p.pereche! : 0]))
  const gradY = gradatii(0, maxim, 4)
  const y1 = Math.max(maxim, gradY.at(-1)!)
  const x = (n: number) => M.stanga + ((L - M.stanga - M.dreapta) * (n - n0)) / (n1 - n0)
  const y = (v: number) => H - M.jos - ((H - M.sus - M.jos) * v) / y1
  const coloana = (L - M.stanga - M.dreapta) / (n1 - n0)
  const ales = peste !== null ? puncte[peste] : null
  const ultim = puncte.at(-1)!
  // etichetele de la capat nu se suprapun
  const [yNumarat, yFormula, yPereche] = despartite([y(ultim.flopi), y(ultim.formula), cuPereche ? y(ultim.pereche!) : -1000])

  return (
    <>
      <p className="ajutor">{t(cuLiniaInPlus(alg) ? 'costNAjutorM' : 'costNAjutor')}</p>
      <ul className="legenda-cost">
        <li>
          <svg className="mostra" viewBox="0 0 18 10" aria-hidden="true">
            <circle className="punct" cx="9" cy="5" r="4" />
          </svg>{' '}
          {cuPereche ? `${t('costNNumarati')}, ${numeScurt(alg, limba)}` : t('costNNumarati')}
        </li>
        <li>
          <svg className="mostra" viewBox="0 0 18 10" aria-hidden="true">
            <line className="formula" x1="0" y1="5" x2="18" y2="5" />
          </svg>{' '}
          {t('costNFormula', alg.cost[limba])}
        </li>
        {cuPereche && (
          <li>
            <svg className="mostra" viewBox="0 0 18 10" aria-hidden="true">
              <line className="serie a-doua" x1="0" y1="5" x2="18" y2="5" />
              <rect className="punct a-doua" x="6" y="2" width="6" height="6" />
            </svg>{' '}
            {t('costNPereche', numePereche)}
          </li>
        )}
      </ul>
      <div className="grafic" ref={ref}>
        <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label={t('costNDescriere', n0, n1, ultim.flopi, fmtNumar(ultim.formula))} onPointerLeave={() => setPeste(null)}>
          {gradY.map((v) => (
            <g key={v}>
              <line className="rigla" x1={M.stanga} x2={L - M.dreapta} y1={y(v)} y2={y(v)} />
              <text className="gradatie" x={M.stanga - 8} y={y(v)} textAnchor="end" dominantBaseline="middle">
                {fmtNumar(v)}
              </text>
            </g>
          ))}
          {puncte.map((p) => (
            <text key={p.n} className="gradatie" x={x(p.n)} y={H - M.jos + 16} textAnchor="middle">
              {p.n}
            </text>
          ))}
          <text className="gradatie" x={(M.stanga + L - M.dreapta) / 2} y={H - 4} textAnchor="middle">
            n
          </text>
          {ales && <line className="rigla tinta" x1={x(ales.n)} x2={x(ales.n)} y1={M.sus} y2={H - M.jos} />}
          {cuPereche && (
            <>
              <polyline className="serie a-doua" points={puncte.map((p) => `${x(p.n)},${y(p.pereche!)}`).join(' ')} />
              {puncte.map((p) => (
                <rect key={p.n} className="punct a-doua" x={x(p.n) - (ales?.n === p.n ? 5 : 3.5)} y={y(p.pereche!) - (ales?.n === p.n ? 5 : 3.5)} width={ales?.n === p.n ? 10 : 7} height={ales?.n === p.n ? 10 : 7} />
              ))}
              <text className="eticheta a-doua" x={x(ultim.n) + 8} y={yPereche} dominantBaseline="middle">
                {numePereche}
              </text>
            </>
          )}
          <polyline className="serie" points={puncte.map((p) => `${x(p.n)},${y(p.flopi)}`).join(' ')} />
          {/* formula deasupra seriei: cand e exacta, linia intrerupta se vede peste cea plina */}
          <polyline className="formula" points={puncte.map((p) => `${x(p.n)},${y(p.formula)}`).join(' ')} />
          {puncte.map((p) => (
            <circle key={p.n} className="punct" cx={x(p.n)} cy={y(p.flopi)} r={ales?.n === p.n ? 6 : 4} />
          ))}
          <text className="eticheta" x={x(ultim.n) + 8} y={yNumarat} dominantBaseline="middle">
            {cuPereche ? numeScurt(alg, limba) : t('costNNumarati')}
          </text>
          <text className="eticheta sters" x={x(ultim.n) + 8} y={yFormula} dominantBaseline="middle">
            {t('costNFormulaScurt')}
          </text>
          {puncte.map((p, k) => (
            <rect key={p.n} className="lovire" x={x(p.n) - coloana / 2} y={M.sus} width={coloana} height={H - M.sus - M.jos} onPointerEnter={() => setPeste(k)} />
          ))}
        </svg>
        {ales && (
          <div className="indiciu" style={{ left: `${(x(ales.n) / L) * 100}%`, top: `${(y(Math.max(ales.flopi, ales.formula, cuPereche ? ales.pereche! : 0)) / H) * 100}%` }}>
            <strong>n = {ales.n}</strong>
            <span>{t('costNIndiciu', ales.flopi, fmtNumar(ales.formula))}</span>
            {cuPereche && <span>{t('costNIndiciuPereche', numePereche, ales.pereche!)}</span>}
          </div>
        )}
      </div>
      {cuPereche && NOTE[alg.id] && <p className="ajutor">{t(NOTE[alg.id], numeScurt(alg, limba), numePereche)}</p>}
      <details>
        <summary>{t('tabel')}</summary>
        <table>
          <thead>
            <tr>
              <th>n</th>
              <th>{cuPereche ? numeScurt(alg, limba) : t('costNNumarati')}</th>
              <th>{t('costNFormulaScurt')}</th>
              <th>{t('costNRaport')}</th>
              {cuPereche && <th>{numePereche}</th>}
              {cuPereche && (
                <th>
                  {numeScurt(alg, limba)} / {numePereche}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {puncte.map((p) => (
              <tr key={p.n}>
                <td>{p.n}</td>
                <td>{p.flopi}</td>
                <td>{fmtNumar(p.formula)}</td>
                <td>{fmtNumar(p.flopi / p.formula)}</td>
                {cuPereche && <td>{p.pereche}</td>}
                {cuPereche && <td>{fmtNumar(p.flopi / p.pereche!)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}
