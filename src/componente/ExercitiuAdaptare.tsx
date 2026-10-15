import { useMemo } from 'react'
import { verificaAdaptare, type Adaptare } from '../adaptari'
import { algoritm } from '../motor/biblioteca'
import type { Intrari } from '../motor/interpretor'
import { inEngleza } from '../motor/traducere'
import { usePreferinte } from '../preferinte'

interface Props {
  ex: Adaptare
  // pseudocodul ultimei rulari; verificarea se face pe el
  sursaRulata: string | null
  // intrarile ultimei rulari: flopii si zerourile atinse se numara pe exemplul afisat
  intrariRulate?: Intrari
  onSolutie: (sursa: string) => void
}

// Enuntul exercitiului, cerintele cu starea lor dupa ultima rulare, indiciul si solutia.
export function ExercitiuAdaptare({ ex, sursaRulata, intrariRulate, onSolutie }: Props) {
  const { t, limba } = usePreferinte()
  // limba intra in dependente: mesajul unei erori de rulare vine din motor, in limba curenta
  const v = useMemo(() => (sursaRulata ? verificaAdaptare(ex, sursaRulata, intrariRulate) : null), [ex, sursaRulata, intrariRulate, limba])
  const pornire = algoritm(ex.pornire)!.titlu[limba].split(', ')[0]
  const solutie = limba === 'en' ? inEngleza(ex.solutie) : ex.solutie
  const stare = (ok: boolean) => (ok ? 'ok' : 'rau')
  // starea se spune si in cuvinte, nu doar prin culoare
  const cuvant = (ok: boolean) => <strong>{ok ? t('adaptareDa') : t('adaptareNu')}:</strong>
  return (
    <>
      <p>{ex.enunt[limba]}</p>
      <p className="in-curs">
        <span>{t('inCurs')}</span> {ex.curs[limba]}
      </p>
      <p className="ajutor">{t('adaptareTinta', ex.tintaText[limba])}</p>
      {!v ? (
        <p className="ajutor">{t('adaptareRuleaza')}</p>
      ) : v.eroare !== undefined ? (
        <p className="rau">{t('adaptareEroare', v.eroare)}</p>
      ) : (
        <ul className="cerinte">
          <li className={stare(v.corecte === v.intrari)}>
            {cuvant(v.corecte === v.intrari)} {t('adaptareCorect', v.corecte, v.intrari, pornire)}
          </li>
          <li className={stare(v.flopi <= v.tinta)}>
            {cuvant(v.flopi <= v.tinta)} {t('adaptareFlopi', v.flopi, v.tinta, pornire, v.flopiPornire)}
          </li>
          <li className={stare(v.zerouriAtinse === 0)}>
            {cuvant(v.zerouriAtinse === 0)} {t('adaptareZerouri', v.zerouriAtinse)}
          </li>
        </ul>
      )}
      {v?.reusit && <p className="ok">{t('adaptareReusit')}</p>}
      <details>
        <summary>{t('adaptareIndiciu')}</summary>
        <p>{ex.indiciu[limba]}</p>
      </details>
      <details>
        <summary>{t('adaptareSolutie')}</summary>
        <pre className="solutie">{solutie}</pre>
        <button type="button" className="mic" onClick={() => onSolutie(solutie)}>
          {t('adaptarePune')}
        </button>
      </details>
    </>
  )
}
