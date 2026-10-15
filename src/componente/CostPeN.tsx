import { useMemo, useState } from 'react'
import { DIMENSIUNI, costuriPeN, cuLiniaInPlus } from '../costuri'
import type { Algoritm } from '../motor/biblioteca'
import type { Intrari } from '../motor/interpretor'
import { usePreferinte } from '../preferinte'
import { fmtNumar, gradatii } from './Convergenta'

interface Props {
  alg: Algoritm
  intrari: Intrari
  // calculul ruleaza algoritmul de sapte ori: se face doar cu panoul deschis
  deschis: boolean
}

const L = 600
const H = 230
const M = { sus: 16, jos: 36, stanga: 58, dreapta: 96 }

// Flopii numarati pentru n de la 2 la 8 (puncte, seria) langa formula de cost din curs (linie
// intrerupta, referinta), cu legenda, etichete la capat, indiciu la trecerea cu mouse-ul si tabel.
export function CostPeN({ alg, intrari, deschis }: Props) {
  const { t, limba } = usePreferinte()
  const [peste, setPeste] = useState<number | null>(null)
  const puncte = useMemo(() => (deschis ? costuriPeN(alg, intrari) : []), [deschis, alg, intrari])
  if (!deschis || puncte.length < 2) return null

  const n0 = DIMENSIUNI[0]
  const n1 = DIMENSIUNI.at(-1)!
  const maxim = Math.max(...puncte.flatMap((p) => [p.flopi, p.formula]))
  const gradY = gradatii(0, maxim, 4)
  const y1 = Math.max(maxim, gradY.at(-1)!)
  const x = (n: number) => M.stanga + ((L - M.stanga - M.dreapta) * (n - n0)) / (n1 - n0)
  const y = (v: number) => H - M.jos - ((H - M.sus - M.jos) * v) / y1
  const coloana = (L - M.stanga - M.dreapta) / (n1 - n0)
  const ales = peste !== null ? puncte[peste] : null
  const ultim = puncte.at(-1)!
  // etichetele de la capat nu se suprapun: cea de dedesubt coboara daca sunt prea aproape
  const yNumarat = y(ultim.flopi)
  let yFormula = y(ultim.formula)
  if (Math.abs(yFormula - yNumarat) < 14) yFormula = yNumarat + (yFormula >= yNumarat ? 14 : -14)

  return (
    <>
      <p className="ajutor">{t(cuLiniaInPlus(alg) ? 'costNAjutorM' : 'costNAjutor')}</p>
      <ul className="legenda-cost">
        <li>
          <svg className="mostra" viewBox="0 0 18 10" aria-hidden="true">
            <circle className="punct" cx="9" cy="5" r="4" />
          </svg>{' '}
          {t('costNNumarati')}
        </li>
        <li>
          <svg className="mostra" viewBox="0 0 18 10" aria-hidden="true">
            <line className="formula" x1="0" y1="5" x2="18" y2="5" />
          </svg>{' '}
          {t('costNFormula', alg.cost[limba])}
        </li>
      </ul>
      <div className="grafic">
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
          <polyline className="formula" points={puncte.map((p) => `${x(p.n)},${y(p.formula)}`).join(' ')} />
          <polyline className="serie" points={puncte.map((p) => `${x(p.n)},${y(p.flopi)}`).join(' ')} />
          {puncte.map((p) => (
            <circle key={p.n} className="punct" cx={x(p.n)} cy={y(p.flopi)} r={ales?.n === p.n ? 6 : 4} />
          ))}
          <text className="eticheta" x={x(ultim.n) + 8} y={yNumarat} dominantBaseline="middle">
            {t('costNNumarati')}
          </text>
          <text className="eticheta sters" x={x(ultim.n) + 8} y={yFormula} dominantBaseline="middle">
            {t('costNFormulaScurt')}
          </text>
          {puncte.map((p, k) => (
            <rect key={p.n} className="lovire" x={x(p.n) - coloana / 2} y={M.sus} width={coloana} height={H - M.sus - M.jos} onPointerEnter={() => setPeste(k)} />
          ))}
        </svg>
        {ales && (
          <div className="indiciu" style={{ left: `${(x(ales.n) / L) * 100}%`, top: `${(y(Math.max(ales.flopi, ales.formula)) / H) * 100}%` }}>
            <strong>n = {ales.n}</strong>
            <span>{t('costNIndiciu', ales.flopi, fmtNumar(ales.formula))}</span>
          </div>
        )}
      </div>
      <details>
        <summary>{t('tabel')}</summary>
        <table>
          <thead>
            <tr>
              <th>n</th>
              <th>{t('costNNumarati')}</th>
              <th>{t('costNFormulaScurt')}</th>
              <th>{t('costNRaport')}</th>
            </tr>
          </thead>
          <tbody>
            {puncte.map((p) => (
              <tr key={p.n}>
                <td>{p.n}</td>
                <td>{p.flopi}</td>
                <td>{fmtNumar(p.formula)}</td>
                <td>{fmtNumar(p.flopi / p.formula)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}
