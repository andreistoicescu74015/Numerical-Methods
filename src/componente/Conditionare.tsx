import { useMemo, useState } from 'react'
import { exempleCarte, experiment, type ExempluCarte } from '../conditionare'
import type { CheieText } from '../i18n'
import type { Algoritm } from '../motor/biblioteca'
import type { Intrari } from '../motor/interpretor'
import { usePreferinte } from '../preferinte'
import { fmtValoare } from './Verificare'

interface Props {
  alg: Algoritm
  intrari: Intrari
  // incarca un exemplu din carte ca intrari si ruleaza
  onExemplu: (ex: ExempluCarte) => void
  // experimentul ruleaza algoritmul de doua ori: se face doar cu panoul deschis
  deschis: boolean
}

const EPSILONI = [1e-8, 1e-6, 1e-4, 1e-2]
const TITLU_EXEMPLU: Record<ExempluCarte['id'], CheieText> = { D: 'condExD', T: 'condExT', H3: 'condExH3' }

// b se schimba putin, algoritmul ruleaza din nou, iar schimbarea lui x se pune langa marginea din curs.
export function Conditionare({ alg, intrari, onExemplu, deschis }: Props) {
  const { t } = usePreferinte()
  const [eps, setEps] = useState(1e-6)
  const e = useMemo(() => (deschis ? experiment(alg, intrari, eps) : null), [deschis, alg, intrari, eps])
  if (!deschis) return null
  // cu b = 0, x = 0: schimbarea relativa a lui x nu se poate calcula
  const faraX = !!e && !Number.isFinite(e.schimbare)
  const exemple = exempleCarte().filter((x) => x.pentru.includes(alg.id))
  const rand = (cheie: CheieText, v: number) => (
    <tr>
      <td>{t(cheie)}</td>
      <td className="numar">{fmtValoare(v)}</td>
    </tr>
  )
  return (
    <>
      <p className="ajutor">{t('conditionareAjutor')}</p>
      <label className="alegere-comparatie">
        {t('conditionareEps')}
        <select value={eps} onChange={(ev) => setEps(Number(ev.target.value))}>
          {EPSILONI.map((x) => (
            <option key={x} value={x}>
              {fmtValoare(x)}
            </option>
          ))}
        </select>
      </label>
      {e ? (
        <>
          <table>
            <tbody>
              {rand('condNormaA', e.normaA)}
              {rand('condNormaInv', e.normaInv)}
              {rand('condKappa', e.kappa)}
              {rand('condDb', e.eps)}
              {!faraX && rand('condDx', e.schimbare)}
              {!faraX && rand('condMargine', e.margine)}
            </tbody>
          </table>
          <p className="ajutor">{faraX ? t('condBZero') : t('condFactor', fmtValoare(e.schimbare / e.eps), fmtValoare(e.kappa))}</p>
        </>
      ) : (
        <p className="ajutor">{t('condSingulara')}</p>
      )}
      {exemple.length > 0 && (
        <div className="exemple-carte">
          <p className="ajutor">{t('condCarte')}</p>
          <ul>
            {exemple.map((x) => (
              <li key={x.id}>
                <button type="button" className="mic" onClick={() => onExemplu(x)}>
                  {t(TITLU_EXEMPLU[x.id])}
                </button>
              </li>
            ))}
          </ul>
          <p className="ajutor">{t('condCarteNota')}</p>
        </div>
      )}
    </>
  )
}
