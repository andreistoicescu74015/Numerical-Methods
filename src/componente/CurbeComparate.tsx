import { useState } from 'react'
import { nrFlopi } from '../i18n'
import type { Evaluare } from '../motor/analiza'
import { usePreferinte } from '../preferinte'
import { axaValori, fmtNumar, gradatii, useLatime } from './Convergenta'
import { Formula } from './Formula'

export interface Serie {
  nume: string
  puncte: Evaluare[]
}

// axa orizontala: iteratiile sau flopii numarati pana la fiecare evaluare a conditiei
export type AxaX = 'iteratii' | 'flopi'

interface Props {
  serii: [Serie, Serie]
  axa: AxaX
  // pragul comun al celor doua conditii, cand exista
  prag?: number
}

const H = 230
const M = { sus: 16, jos: 36, stanga: 58, dreapta: 86 }

// Marimea din conditia de oprire a doua rulari, iteratie cu iteratie, pe aceleasi axe: curba
// plina cu puncte pentru algoritmul curent, curba intrerupta cu patrate pentru celalalt, cu
// legenda, eticheta la capatul fiecareia, indiciu la trecerea cu mouse-ul si tabel.
export function CurbeComparate({ serii, axa, prag }: Props) {
  const { t, limba } = usePreferinte()
  const [peste, setPeste] = useState<number | null>(null)
  const [ref, L] = useLatime()
  const valori = serii.flatMap((s) => s.puncte.map((p) => p.stanga))
  if (prag !== undefined) valori.push(prag)
  const { logaritmic, y0, y1, scara, gradatii: gradY } = axaValori(valori)
  const xDin = (p: Evaluare) => (axa === 'flopi' ? p.flopi : p.iter)
  const xMax = Math.max(1, ...serii.flatMap((s) => s.puncte.map(xDin)))
  const x = (v: number) => M.stanga + ((L - M.stanga - M.dreapta) * v) / xMax
  const y = (v: number) => H - M.jos - ((H - M.sus - M.jos) * (Math.min(Math.max(scara(v), y0), y1) - y0)) / (y1 - y0)
  const pasIter = Math.max(1, Math.ceil(xMax / 8))
  const gradX = axa === 'flopi' ? gradatii(0, xMax, 5).filter((v) => v <= xMax) : Array.from({ length: Math.floor(xMax / pasIter) + 1 }, (_, k) => k * pasIter)
  // coloanele de lovire, pe iteratii: la x-ul primei serii sau, dupa ce ea s-a oprit, al celei de-a doua
  const lungime = Math.max(...serii.map((s) => s.puncte.length))
  const coloane = Array.from({ length: lungime }, (_, k) => x(xDin((serii[0].puncte[k] ?? serii[1].puncte[k])!)))
  const margini = (k: number): [number, number] => [k === 0 ? M.stanga : (coloane[k - 1] + coloane[k]) / 2, k === lungime - 1 ? L - M.dreapta : (coloane[k] + coloane[k + 1]) / 2]
  // etichetele de la capatul curbelor raman intre margini (o curba care ajunge la prag s-ar
  // termina pe gradatiile axei) si nu se suprapun: cea de deasupra urca daca sunt prea aproape
  const jos = H - M.jos - 7
  const capete = serii.map((s) => {
    const u = s.puncte.at(-1)!
    return { x: x(xDin(u)) + 8, y: Math.min(Math.max(y(u.stanga), M.sus + 6), jos), nume: s.nume }
  })
  if (Math.abs(capete[1].y - capete[0].y) < 14) {
    const [sus, dedesubt] = capete[0].y <= capete[1].y ? [capete[0], capete[1]] : [capete[1], capete[0]]
    if (dedesubt.y + 14 <= jos) dedesubt.y = sus.y + 14
    else sus.y = dedesubt.y - 14
  }
  const ales = peste !== null && peste < lungime ? peste : null
  const alesX = ales !== null ? coloane[ales] : 0
  const alesY = ales !== null ? Math.min(...serii.flatMap((s) => (s.puncte[ales] ? [y(s.puncte[ales].stanga)] : []))) : 0
  const clasa = (k: number) => (k === 0 ? '' : ' a-doua')

  return (
    <>
      <ul className="legenda-cost">
        {serii.map((s, k) => (
          <li key={s.nume}>
            <svg className="mostra" viewBox="0 0 18 10" aria-hidden="true">
              <line className={`serie${clasa(k)}`} x1="0" y1="5" x2="18" y2="5" />
              {k === 0 ? <circle className="punct" cx="9" cy="5" r="3" /> : <rect className="punct a-doua" x="6" y="2" width="6" height="6" />}
            </svg>{' '}
            {s.nume}
          </li>
        ))}
        {prag !== undefined && (
          <li>
            <svg className="mostra" viewBox="0 0 18 10" aria-hidden="true">
              <line className="prag" x1="0" y1="5" x2="18" y2="5" />
            </svg>{' '}
            {t('comparatiePrag', fmtNumar(prag))}
          </li>
        )}
      </ul>
      <div className="grafic" ref={ref}>
        <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label={t('comparatieCurbeDescriere', serii[0].nume, serii[0].puncte.length - 1, serii[1].nume, serii[1].puncte.length - 1)} onPointerLeave={() => setPeste(null)}>
          {gradY.map((g, k) => (
            <g key={k}>
              <line className="rigla" x1={M.stanga} x2={L - M.dreapta} y1={y(g.v)} y2={y(g.v)} />
              <text className="gradatie" x={M.stanga - 8} y={y(g.v)} textAnchor="end" dominantBaseline="middle">
                {g.text}
              </text>
            </g>
          ))}
          {gradX.map((v) => (
            <text key={v} className="gradatie" x={x(v)} y={H - M.jos + 16} textAnchor="middle">
              {fmtNumar(v)}
            </text>
          ))}
          <text className="gradatie" x={(M.stanga + L - M.dreapta) / 2} y={H - 4} textAnchor="middle">
            {t(axa === 'flopi' ? 'flopiAntet' : 'iteratia')}
          </text>
          {prag !== undefined && <line className="prag" x1={M.stanga} x2={L - M.dreapta} y1={y(prag)} y2={y(prag)} />}
          {ales !== null && <line className="rigla tinta" x1={alesX} x2={alesX} y1={M.sus} y2={H - M.jos} />}
          {serii.map((s, k) => (
            <g key={s.nume}>
              <polyline className={`serie${clasa(k)}`} points={s.puncte.map((p) => `${x(xDin(p))},${y(p.stanga)}`).join(' ')} />
              {s.puncte.map((p, i) =>
                k === 0 ? (
                  <circle key={i} className="punct" cx={x(xDin(p))} cy={y(p.stanga)} r={ales === i ? 6 : 3.5} />
                ) : (
                  <rect key={i} className="punct a-doua" x={x(xDin(p)) - (ales === i ? 5 : 3.5)} y={y(p.stanga) - (ales === i ? 5 : 3.5)} width={ales === i ? 10 : 7} height={ales === i ? 10 : 7} />
                ),
              )}
              <text className={`eticheta${clasa(k)}`} x={capete[k].x} y={capete[k].y} dominantBaseline="middle">
                {s.nume}
              </text>
            </g>
          ))}
          {coloane.map((_, k) => {
            const [de, la] = margini(k)
            return <rect key={k} className="lovire" x={de} y={M.sus} width={Math.max(la - de, 1)} height={H - M.sus - M.jos} onPointerEnter={() => setPeste(k)} />
          })}
        </svg>
        {ales !== null && (
          <div className="indiciu" style={{ left: `${(alesX / L) * 100}%`, top: `${(alesY / H) * 100}%` }}>
            <strong>
              {t('iteratia')} {ales}
            </strong>
            {serii.map((s) => {
              const p = s.puncte[ales]
              return (
                <span key={s.nume}>
                  {s.nume}: {p ? `${fmtNumar(p.stanga)} · ${nrFlopi(limba, p.flopi)}` : '–'}
                </span>
              )
            })}
          </div>
        )}
      </div>
      <p className="ajutor">{t(logaritmic ? 'comparatieCurbeLog' : 'comparatieCurbeLiniar')}</p>
      <details>
        <summary>{t('tabel')}</summary>
        <table>
          <thead>
            <tr>
              <th>{t('iteratia')}</th>
              {serii.map((s) => (
                <th key={s.nume} colSpan={2}>
                  {s.nume}: <Formula tex={s.puncte[0].texStanga} inline />, {t('flopiAntet')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: lungime }, (_, k) => (
              <tr key={k}>
                <td>{k}</td>
                {serii.map((s) => {
                  const p = s.puncte[k]
                  return [<td key="e">{p ? fmtNumar(p.stanga) : '–'}</td>, <td key="f">{p ? p.flopi : '–'}</td>]
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}
