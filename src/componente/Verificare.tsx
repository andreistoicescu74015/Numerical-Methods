import { PRAG, type Verificare as Rand } from '../motor/verificare'
import { usePreferinte } from '../preferinte'

function fmtValoare(x: number): string {
  if (!Number.isFinite(x)) return String(x)
  if (x === 0) return '0'
  return Math.abs(x) >= 1e-3 && Math.abs(x) < 1e4 ? String(Number(x.toPrecision(6))) : x.toExponential(2)
}

interface Props {
  randuri: Rand[]
  // 'inainte': urma nu e inca la ultimul pas; 'oprit': algoritmul nu a ajuns la sfarsit
  stare: 'inainte' | 'gata' | 'oprit'
}

export function Verificare({ randuri, stare }: Props) {
  const { t, limba } = usePreferinte()
  return (
    <section className="verificare">
      <h2>{t('verificare')}</h2>
      {stare === 'inainte' && <p className="ajutor">{t('verificareLaSfarsit')}</p>}
      {stare === 'oprit' && <p className="ajutor">{t('verificareOprit')}</p>}
      {stare === 'gata' && (
        <>
          <p className="ajutor">{t('verificareAjutor')}</p>
          <table>
            <tbody>
              {randuri.map((r, k) => {
                const ok = r.fel === 'valoare' || r.valoare < (r.prag ?? PRAG)
                return (
                  <tr key={k} className={ok ? 'ok' : 'rau'}>
                    <td>{r.text[limba]}</td>
                    <td className="numar">{fmtValoare(r.valoare)}</td>
                    <td className="stare">{r.fel === 'valoare' ? '' : ok ? t('verificareOk') : t('verificareRau')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
