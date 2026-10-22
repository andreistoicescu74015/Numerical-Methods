import { PRAG, pragCifre, type Verificare as Rand } from '../motor/verificare'
import { usePreferinte } from '../preferinte'

export function fmtValoare(x: number): string {
  if (!Number.isFinite(x)) return String(x)
  if (x === 0) return '0'
  return Math.abs(x) >= 1e-3 && Math.abs(x) < 1e4 ? String(Number(x.toPrecision(6))) : x.toExponential(2)
}

// bucla se opreste cand e > tol nu mai e adevarat, deci egalitatea cu pragul trece
export const randOk = (r: Rand) => r.fel === 'valoare' || r.valoare <= (r.prag ?? PRAG)

// Tabelul cu identitatile si reziduurile lor; in sertar si, scurt, in cardul pasului la final.
export function RanduriVerificare({ randuri, clasa }: { randuri: Rand[]; clasa?: string }) {
  const { t, limba } = usePreferinte()
  return (
    <table className={clasa}>
      <tbody>
        {randuri.map((r, k) => {
          const ok = randOk(r)
          return (
            <tr key={k} className={ok ? 'ok' : 'rau'}>
              <td>{r.text[limba]}</td>
              <td className="numar">{r.precis && Number.isFinite(r.valoare) ? String(Number(r.valoare.toPrecision(14))) : fmtValoare(r.valoare)}</td>
              <td className="stare">{r.fel === 'valoare' ? '' : ok ? t('verificareOk') : t('verificareRau')}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

interface Props {
  randuri: Rand[]
  // 'inainte': urma nu e inca la ultimul pas; 'oprit': algoritmul nu a ajuns la sfarsit
  stare: 'inainte' | 'gata' | 'oprit'
  // cifrele semnificative ale rularii; 0 pentru dubla precizie
  cifre: number
  onFinal: () => void
}

export function Verificare({ randuri, stare, cifre, onFinal }: Props) {
  const { t } = usePreferinte()
  return (
    <>
      {stare === 'inainte' && (
        <p className="ajutor">
          {t('verificareLaSfarsit')}{' '}
          <button type="button" className="mic" onClick={onFinal}>
            {t('sariLaFinal')}
          </button>
        </p>
      )}
      {stare === 'oprit' && <p className="ajutor">{t(randuri.length > 0 ? 'verificareOpritRanduri' : 'verificareOprit')}</p>}
      {(stare === 'gata' || (stare === 'oprit' && randuri.length > 0)) && (
        <>
          <p className="ajutor">{t('verificareAjutor')}</p>
          {cifre > 0 && <p className="ajutor">{t('verificareCifre', cifre, fmtValoare(pragCifre(cifre)))}</p>}
          <RanduriVerificare randuri={randuri} />
        </>
      )}
    </>
  )
}
