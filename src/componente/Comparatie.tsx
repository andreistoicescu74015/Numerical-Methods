import { useMemo, useState } from 'react'
import { compatibili, diferenta, nrIteratii, ruleazaPe, type Rulat } from '../comparatie'
import type { Definitie } from '../intrari'
import type { Algoritm } from '../motor/biblioteca'
import type { Intrari, Rezultat } from '../motor/interpretor'
import { nrFlopi } from '../i18n'
import { usePreferinte } from '../preferinte'
import { fmtValoare } from './Verificare'

interface Props {
  alg: Algoritm
  rez: Rezultat
  intrari: Intrari
  // cifrele semnificative ale rularii; 0 pentru dubla precizie
  cifre: number
  definitii: Definitie[]
  // trece la algoritmul ales, cu aceleasi intrari
  onTreci: (id: string) => void
}

// "GPP" din "GPP, eliminare gaussiana cu pivotare partiala"
const scurt = (a: Algoritm, limba: 'ro' | 'en') => a.titlu[limba].split(', ')[0]

// Acelasi set de intrari, rulat si cu alt algoritm din biblioteca: cum se termina, flopii,
// iteratiile si rezultatul, unul langa altul.
export function Comparatie({ alg, rez, intrari, cifre, definitii, onTreci }: Props) {
  const { t, limba } = usePreferinte()
  const optiuni = useMemo(() => compatibili(alg.id, definitii), [alg.id, definitii])
  const [ales, setAles] = useState<string | null>(null)
  const id = ales && optiuni.some((a) => a.id === ales) ? ales : optiuni[0]?.id
  const curent: Rulat = useMemo(() => ({ alg, rez, iteratii: nrIteratii(rez) }), [alg, rez])
  const alt = useMemo(() => {
    const a = optiuni.find((x) => x.id === id)
    if (!a) return null
    try {
      return ruleazaPe(a, intrari, cifre)
    } catch {
      return null
    }
  }, [id, optiuni, intrari, cifre])

  if (optiuni.length === 0) return <p className="ajutor">{t('comparatieNimic')}</p>

  const stare = (r: Rulat) => (r.rez.final === 'gata' ? t('comparatieGata') : r.rez.final === 'stop' ? t('comparatieStop', r.rez.pasi.at(-1)?.mesaj ?? '') : t('comparatieEroare', r.rez.eroare ?? ''))
  // primul rezultat al algoritmului: un vector scurt cu valorile lui, o matrice cu forma ei
  const rezultat = (r: Rulat) => {
    if (r.rez.final !== 'gata') return ''
    const nume = r.alg.iesiri[0]
    const v = r.rez.stare[nume]
    if (v?.tip === 'vector') return v.n <= 6 ? `${nume} = (${v.d.map(fmtValoare).join(', ')})` : `${nume}: ${t('comparatieVector', v.n)}`
    if (v?.tip === 'matrice') return `${nume}: ${v.m} × ${v.n}`
    const s = r.rez.scalari[nume]
    return s === undefined ? '' : `${nume} = ${fmtValoare(s)}`
  }
  const iterative = curent.iteratii > 0 || (alt?.iteratii ?? 0) > 0
  const dif = alt ? diferenta(curent, alt) : null

  return (
    <>
      <p className="ajutor">{t('comparatieAjutor')}</p>
      <label className="alegere-comparatie">
        {t('comparatieCu')}
        <select value={id} onChange={(e) => setAles(e.target.value)}>
          {optiuni.map((a) => (
            <option key={a.id} value={a.id}>
              {a.titlu[limba]}
            </option>
          ))}
        </select>
      </label>
      {alt && (
        <>
          <table>
            <thead>
              <tr>
                <th />
                <th>{scurt(alg, limba)}</th>
                <th>{scurt(alt.alg, limba)}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('comparatieTermina')}</td>
                <td>{stare(curent)}</td>
                <td>{stare(alt)}</td>
              </tr>
              <tr>
                <td>{t('comparatieFlopi')}</td>
                <td className="numar">{nrFlopi(limba, curent.rez.flopi)}</td>
                <td className="numar">{nrFlopi(limba, alt.rez.flopi)}</td>
              </tr>
              {iterative && (
                <tr>
                  <td>{t('comparatieIteratii')}</td>
                  <td className="numar">{curent.iteratii}</td>
                  <td className="numar">{alt.iteratii}</td>
                </tr>
              )}
              <tr>
                <td>{t('comparatieRezultat')}</td>
                <td className="numar">{rezultat(curent)}</td>
                <td className="numar">{rezultat(alt)}</td>
              </tr>
            </tbody>
          </table>
          {dif && <p className="ajutor">{t('comparatieDiferenta', dif.nume, fmtValoare(dif.valoare))}</p>}
          <button type="button" className="mic" onClick={() => onTreci(alt.alg.id)}>
            {t('comparatieTreci', scurt(alt.alg, limba))}
          </button>
        </>
      )}
    </>
  )
}
