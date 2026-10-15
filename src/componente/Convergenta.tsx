import { useState } from 'react'
import type { Iteratie } from '../motor/interpretor'
import { usePreferinte } from '../preferinte'
import { Formula } from './Formula'
import { nrFlopi } from '../i18n'

export interface Punct extends Iteratie {
  // indicele pasului din urma la care s-a evaluat conditia
  pas: number
}

interface Props {
  // toate evaluarile conditiei buclei, in ordine
  puncte: Punct[]
  // cate dintre ele au fost deja atinse de pasul curent
  vazute: number
  onPas: (pas: number) => void
  // comparatia cu metoda directa, pentru algoritmii care au una
  nota?: string
}

const L = 600
const H = 230
const M = { sus: 16, jos: 36, stanga: 58, dreapta: 86 }
// cea mai mica valoare pozitiva care isi are locul ei pe scara logaritmica
const MINIM_LOG = 1e-16

const SUPER: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const putere = (k: number): string => (k === 0 ? '1' : k === 1 ? '10' : `10${[...String(k)].map((c) => SUPER[c]).join('')}`)

export function fmtNumar(x: number): string {
  if (!Number.isFinite(x)) return String(x)
  if (x === 0) return '0'
  const a = Math.abs(x)
  // 1e-6, nu 1.00e-6
  return a >= 1e-3 && a < 1e5 ? String(Number(x.toPrecision(4))) : x.toExponential(2).replace(/\.?0+e/, 'e')
}

// Pasi rotunzi (1, 2, 5 ori o putere a lui 10) pentru o axa liniara.
export function gradatii(min: number, max: number, cate: number): number[] {
  if (max <= min) return [min]
  const brut = (max - min) / cate
  const p = 10 ** Math.floor(Math.log10(brut))
  const pas = [1, 2, 5, 10].map((f) => f * p).find((s) => s >= brut)!
  const rez: number[] = []
  for (let v = Math.ceil(min / pas) * pas; v <= max + pas * 1e-9; v += pas) rez.push(Number(v.toPrecision(12)))
  return rez
}

// Cum se apropie marimea din conditia buclei "cat timp" de prag, iteratie cu iteratie. Punctele
// apar pe masura ce urma ajunge la ele; tabelul de dedesubt are aceleasi valori.
export function Convergenta({ puncte, vazute, onPas, nota }: Props) {
  const { t, limba } = usePreferinte()
  const [peste, setPeste] = useState<number | null>(null)
  if (puncte.length < 2) return null

  const valori = puncte.flatMap((p) => [p.stanga, p.dreapta])
  const pozitive = valori.every((v) => v >= 0) && valori.some((v) => v > 0)
  const maxim = Math.max(...valori)
  const minimPozitiv = Math.max(Math.min(...valori.filter((v) => v > 0)), MINIM_LOG)
  const logaritmic = pozitive && maxim / minimPozitiv >= 50
  // Zero nu are logaritm: primeste o treapta a lui, sub cea mai mica putere a lui 10, ca un
  // reziduu exact nul sa nu se confunde cu pragul.
  const areZero = logaritmic && valori.some((v) => v < MINIM_LOG)
  const y0 = logaritmic ? Math.floor(Math.log10(minimPozitiv)) - (areZero ? 1 : 0) : Math.min(0, ...valori)
  const y1 = logaritmic ? Math.max(Math.ceil(Math.log10(maxim)), y0 + 1) : maxim === y0 ? y0 + 1 : maxim
  const scara = (v: number) => (!logaritmic ? v : v < MINIM_LOG ? y0 : Math.log10(v))
  const x = (k: number) => M.stanga + ((L - M.stanga - M.dreapta) * k) / (puncte.length - 1)
  const y = (v: number) => H - M.jos - ((H - M.sus - M.jos) * (Math.min(Math.max(scara(v), y0), y1) - y0)) / (y1 - y0)

  const pasY = logaritmic ? Math.max(1, Math.ceil((y1 - y0) / 6)) : 0
  const gradY = logaritmic
    ? Array.from({ length: Math.floor((y1 - y0) / pasY) + 1 }, (_, k) => y0 + k * pasY).map((e) => (areZero && e === y0 ? { poz: y(0), text: '0' } : { poz: y(10 ** e), text: putere(e) }))
    : gradatii(y0, y1, 4).map((v) => ({ poz: y(v), text: fmtNumar(v) }))
  const pasX = Math.max(1, Math.ceil((puncte.length - 1) / 8))
  const gradX = puncte.filter((_, k) => k % pasX === 0)

  const vizibile = puncte.slice(0, vazute)
  const ultim = vizibile.at(-1)
  const prag = (ultim ?? puncte[0]).dreapta
  // pragul e o dreapta cand partea din dreapta a conditiei nu se schimba; altfel isi urmeaza valorile
  const pragFix = puncte.every((p) => p.dreapta === puncte[0].dreapta)
  // Eticheta ultimului punct sta in dreapta lui, unde linia inca nu a ajuns. La capatul graficului
  // ar cadea peste eticheta pragului, asa ca se muta deasupra sau dedesubtul ei.
  let etichetaY = ultim ? y(ultim.stanga) : 0
  if (ultim && ultim.iter === puncte.length - 1 && Math.abs(etichetaY - y(prag)) < 15) etichetaY = y(prag) + (etichetaY >= y(prag) ? 15 : -15)
  const coloana = (L - M.stanga - M.dreapta) / (puncte.length - 1)
  const ales = peste !== null && peste < vizibile.length ? vizibile[peste] : null

  return (
    <>
      <p className="ajutor">
        <Formula tex={puncte[0].texStanga} inline /> {t('convergentaFata')} <Formula tex={puncte[0].texDreapta} inline />
        {'. '}
        {t(logaritmic ? 'convergentaLog' : 'convergentaLiniar')}
      </p>
      <div className="grafic">
        <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label={t('convergentaDescriere', vizibile.length, ultim ? fmtNumar(ultim.stanga) : '', fmtNumar(prag))} onPointerLeave={() => setPeste(null)}>
          {gradY.map((g, k) => (
            <g key={k}>
              <line className="rigla" x1={M.stanga} x2={L - M.dreapta} y1={g.poz} y2={g.poz} />
              <text className="gradatie" x={M.stanga - 8} y={g.poz} textAnchor="end" dominantBaseline="middle">
                {g.text}
              </text>
            </g>
          ))}
          {gradX.map((p) => (
            <text key={p.iter} className="gradatie" x={x(p.iter)} y={H - M.jos + 16} textAnchor="middle">
              {p.iter}
            </text>
          ))}
          <text className="gradatie" x={(M.stanga + L - M.dreapta) / 2} y={H - 4} textAnchor="middle">
            {t('iteratia')}
          </text>
          {pragFix ? (
            <line className="prag" x1={M.stanga} x2={L - M.dreapta} y1={y(prag)} y2={y(prag)} />
          ) : (
            vizibile.length > 1 && <polyline className="prag" points={vizibile.map((p) => `${x(p.iter)},${y(p.dreapta)}`).join(' ')} />
          )}
          <text className="eticheta" x={L - M.dreapta + 6} y={y(prag)} dominantBaseline="middle">
            {fmtNumar(prag)}
          </text>
          {ales && <line className="rigla tinta" x1={x(ales.iter)} x2={x(ales.iter)} y1={M.sus} y2={H - M.jos} />}
          {vizibile.length > 1 && <polyline className="serie" points={vizibile.map((p) => `${x(p.iter)},${y(p.stanga)}`).join(' ')} />}
          {vizibile.map((p) => (
            <circle key={p.iter} className="punct" cx={x(p.iter)} cy={y(p.stanga)} r={ales?.iter === p.iter ? 6 : 4} />
          ))}
          {ultim && !ales && (
            <text className="eticheta" x={x(ultim.iter) + 8} y={etichetaY} dominantBaseline="middle">
              {fmtNumar(ultim.stanga)}
            </text>
          )}
          {vizibile.map((p, k) => (
            <rect key={p.iter} className="lovire" x={x(p.iter) - coloana / 2} y={M.sus} width={coloana} height={H - M.sus - M.jos} onPointerEnter={() => setPeste(k)} onClick={() => onPas(p.pas)}>
              <title>{t('convergentaSalt')}</title>
            </rect>
          ))}
        </svg>
        {ales && (
          <div className="indiciu" style={{ left: `${(x(ales.iter) / L) * 100}%`, top: `${(y(ales.stanga) / H) * 100}%` }}>
            <strong>{fmtNumar(ales.stanga)}</strong>
            <span>
              {t('iteratia')} {ales.iter} · {nrFlopi(limba, ales.flopi)}
            </span>
          </div>
        )}
      </div>
      {nota && <p className="ajutor">{nota}</p>}
      <details>
        <summary>{t('tabel')}</summary>
        <table>
          <thead>
            <tr>
              <th>{t('iteratia')}</th>
              <th>
                <Formula tex={puncte[0].texStanga} inline />
              </th>
              <th>
                <Formula tex={puncte[0].texDreapta} inline />
              </th>
              <th>{t('flopiAntet')}</th>
            </tr>
          </thead>
          <tbody>
            {vizibile.map((p) => (
              <tr key={p.iter}>
                <td>{p.iter}</td>
                <td>{fmtNumar(p.stanga)}</td>
                <td>{fmtNumar(p.dreapta)}</td>
                <td>{p.flopi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}
