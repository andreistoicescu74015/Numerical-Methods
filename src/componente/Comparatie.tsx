import { useMemo, useState } from 'react'
import { compatibili, diferenta, numeScurt, pragComun, rulat, ruleazaPe, type Rulat } from '../comparatie'
import type { Definitie } from '../intrari'
import type { Algoritm } from '../motor/biblioteca'
import type { Intrari, Rezultat } from '../motor/interpretor'
import { nrFlopi } from '../i18n'
import { usePreferinte } from '../preferinte'
import { fmtNumar } from './Convergenta'
import { CurbeComparate, type AxaX } from './CurbeComparate'
import { Formula } from './Formula'
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

const scurt = numeScurt

// Acelasi set de intrari, rulat si cu alt algoritm din biblioteca: cum se termina, flopii,
// iteratiile si rezultatul, unul langa altul.
export function Comparatie({ alg, rez, intrari, cifre, definitii, onTreci }: Props) {
  const { t, limba } = usePreferinte()
  const optiuni = useMemo(() => compatibili(alg.id, definitii), [alg.id, definitii])
  const [ales, setAles] = useState<string | null>(null)
  const [axa, setAxa] = useState<AxaX>('iteratii')
  const id = ales && optiuni.some((a) => a.id === ales) ? ales : optiuni[0]?.id
  const curent: Rulat = useMemo(() => rulat(alg, rez), [alg, rez])
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
  // o matrice rezultat de cel mult 5 x 5 se arata intreaga, ca cele doua rezultate sa se compare
  const matrice = (r: Rulat): string | null => {
    if (r.rez.final !== 'gata') return null
    const nume = r.alg.iesiri[0]
    const v = r.rez.stare[nume]
    if (v?.tip !== 'matrice' || v.m > 5 || v.n > 5) return null
    const randuri = Array.from({ length: v.m }, (_, i) => v.d.slice(i * v.n, i * v.n + v.n).map(fmtNumar).join(' & '))
    return `${nume} = \\begin{bmatrix} ${randuri.join(' \\\\ ')} \\end{bmatrix}`
  }
  const iterative = curent.iteratii > 0 || (alt?.iteratii ?? 0) > 0
  // o metoda directa nu are iteratii de numarat
  const areIteratii = (r: Rulat) => r.iteratii > 0 || r.alg.grup === 'iterative' || r.alg.grup === 'proprii'
  const dif = alt ? diferenta(curent, alt) : null
  // ambele rulari au o conditie de oprire evaluata de cel putin doua ori: curbele lor, suprapuse
  const curbe = !!alt && curent.puncte.length >= 2 && alt.puncte.length >= 2

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
                  <td className="numar">{areIteratii(curent) ? curent.iteratii : '–'}</td>
                  <td className="numar">{areIteratii(alt) ? alt.iteratii : '–'}</td>
                </tr>
              )}
              {!(matrice(curent) && matrice(alt)) && (
                <tr>
                  <td>{t('comparatieRezultat')}</td>
                  <td className="numar">{rezultat(curent)}</td>
                  <td className="numar">{rezultat(alt)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {curbe && (
            <div className="curbe">
              <p className="ajutor">{t('comparatieCurbe')}</p>
              <label className="alegere-comparatie axa-curbe">
                {t('comparatieAxa')}
                <select value={axa} onChange={(e) => setAxa(e.target.value as AxaX)}>
                  <option value="iteratii">{t('comparatieAxaIteratii')}</option>
                  <option value="flopi">{t('comparatieAxaFlopi')}</option>
                </select>
              </label>
              <CurbeComparate serii={[{ nume: scurt(alg, limba), puncte: curent.puncte }, { nume: scurt(alt.alg, limba), puncte: alt.puncte }]} axa={axa} prag={pragComun(curent, alt)} />
            </div>
          )}
          {(matrice(curent) || matrice(alt)) && (
            <div className="matrice-comparate">
              {[curent, alt].map((r) => {
                const tex = matrice(r)
                return (
                  tex && (
                    <figure key={r.alg.id}>
                      <figcaption>{scurt(r.alg, limba)}</figcaption>
                      <Formula tex={tex} inline />
                    </figure>
                  )
                )
              })}
            </div>
          )}
          {dif && <p className="ajutor">{t('comparatieDiferenta', dif.nume, fmtValoare(dif.valoare))}</p>}
          <button type="button" className="mic" onClick={() => onTreci(alt.alg.id)}>
            {t('comparatieTreci', scurt(alt.alg, limba))}
          </button>
        </>
      )}
    </>
  )
}
