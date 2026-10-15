import type { Operatie } from '../motor/interpretor'
import { OPERATII, SCRIERI, textForma } from '../operatii'
import { usePreferinte } from '../preferinte'
import { Formula } from './Formula'
import { nrFlopi } from '../i18n'

// Operatiile dintre tablouri facute la pasul curent: sub-expresia, numele operatiei,
// dimensiunile operanzilor si ale rezultatului, costul si definitia pe elemente.
export function OperatiiPas({ operatii }: { operatii?: Operatie[] }) {
  const { t, limba } = usePreferinte()
  if (!operatii?.length) return null
  return (
    <ul className="operatii-pas" aria-label={t('operatiiPas')}>
      {operatii.map((o, k) => (
        <li key={k}>
          <Formula tex={o.tex} inline />
          <span className="nume">{OPERATII[o.fel].nume[limba]}</span>
          <span className="forme">
            {o.operanzi.map((f) => textForma(f, limba)).join(', ')} → {textForma(o.rezultat, limba)}
          </span>
          <span className="forme">{nrFlopi(limba, o.flopi)}</span>
          <Formula tex={OPERATII[o.fel].definitie} inline />
        </li>
      ))}
    </ul>
  )
}

export interface Etapa {
  de: number
  la: number
  tex: string
  text: string
}

interface Props {
  // ce calculeaza algoritmul, in forma matriceala (doar pentru algoritmii din biblioteca)
  forma?: string
  etape: Etapa[]
  // linia pasului curent
  linie: number | null
}

// eticheta etapei curente, pentru rezumatul panoului
export function etapaCurenta(etape: Etapa[], linie: number | null): Etapa | undefined {
  return linie === null ? undefined : etape.find((e) => linie >= e.de && linie <= e.la)
}

// Lista operatiilor pe matrice ale programului: pentru algoritmii din biblioteca, etapele
// scrise in forma matriceala; pentru un program oarecare, liniile care lucreaza intre tablouri.
export function OperatiiAlgoritm({ forma, etape, linie }: Props) {
  const { t, limba } = usePreferinte()
  return (
    <>
      <p className="ajutor">{etape.length > 0 ? t('operatiiAjutor') : t('operatiiNiciuna')}</p>
      {forma && <Formula tex={forma} />}
      {etape.length > 0 && (
        <ol>
          {etape.map((e, k) => {
            const curenta = linie !== null && linie >= e.de && linie <= e.la
            return (
              <li key={k} className={curenta ? 'curenta' : ''} aria-current={curenta ? 'step' : undefined}>
                <span className="linii">{e.de === e.la ? t('linia', e.de) : t('liniile', e.de, e.la)}</span>
                <Formula tex={e.tex} inline />
                <span className="text">{e.text}</span>
              </li>
            )
          })}
        </ol>
      )}
      <details>
        <summary>{t('operatiiScrieri')}</summary>
        <table>
          <tbody>
            {SCRIERI.map((s) => (
              <tr key={s.fel}>
                <td>
                  <code>{s.scriere}</code>
                </td>
                <td>{OPERATII[s.fel].nume[limba]}</td>
                <td>
                  <Formula tex={OPERATII[s.fel].definitie} inline />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ajutor">{t('operatiiBlocuri')}</p>
      </details>
    </>
  )
}
