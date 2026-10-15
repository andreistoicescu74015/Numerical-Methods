import { nrPasi } from '../i18n'
import type { Invariant as Inv } from '../invarianti'
import { PRAG, pragCifre } from '../motor/verificare'
import { usePreferinte } from '../preferinte'
import { Formula } from './Formula'
import { fmtValoare } from './Verificare'

interface Props {
  // invariantul la ultima limita dintre pasi de dinainte de pasul curent; null inainte de bucla
  inv: Inv | null
  // cifrele semnificative ale rularii; 0 pentru dubla precizie
  cifre: number
  onPas: (k: number) => void
}

export const invariantOk = (inv: Inv, cifre: number) => inv.abatere <= (cifre > 0 ? pragCifre(cifre) : PRAG)

// Ce ramane adevarat dupa fiecare pas complet al buclei exterioare, cu verificarea pe valorile curente.
export function Invariant({ inv, cifre, onPas }: Props) {
  const { t, limba } = usePreferinte()
  if (!inv) return <p className="ajutor">{t('invariantInceput')}</p>
  const ok = invariantOk(inv, cifre)
  const text = inv.text[limba].replaceAll('{0}', String(inv.complete)).replaceAll('{1}', String(inv.complete + 1))
  return (
    <>
      <p className="ajutor">{t('invariantAjutor')}</p>
      <p className="moment">
        {inv.final ? t('invariantFinal', nrPasi(limba, inv.complete)) : t('invariantDupa', inv.variabila ?? inv.complete + 1, nrPasi(limba, inv.complete, true))}{' '}
        <button type="button" className="mic" onClick={() => onPas(inv.pas)}>
          {t('invariantMergi')}
        </button>
      </p>
      <Formula tex={inv.tex} rupt />
      <p>{inv.complete === 0 ? t('invariantZero') : text}</p>
      <p className={`verificat ${ok ? 'ok' : 'rau'}`}>{t('invariantVerificat', fmtValoare(inv.abatere), ok ? t('verificareOk') : t('verificareRau'))}</p>
      <p className="in-curs">
        <span>{t('inCurs')}</span> {inv.curs[limba]}
      </p>
    </>
  )
}
